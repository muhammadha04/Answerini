import {
  COUNTDOWN_SECONDS,
  DEFAULT_SETTINGS,
  LEADERBOARD_TOP_N,
} from "./constants";
import { calculatePoints } from "./scoring";
import { generateId, generatePin } from "./pin";
import { releaseOrphanedLiveRoom } from "./fixed-pin";
import { deleteLiveRoomByPin, getRoomByPin, saveRoom } from "./store";
import { rowToQuestion } from "./saved-games";
import { createClient } from "./supabase/server";
import type {
  AddQuestionPayload,
  CreateRoomPayload,
  Player,
  PublicPlayer,
  PublicQuestion,
  PublicRoomState,
  Question,
  Room,
  RoomSettings,
} from "./types";

function defaultSettings(overrides?: Partial<RoomSettings>): RoomSettings {
  return { ...DEFAULT_SETTINGS, ...overrides };
}

/** True when every connected player has submitted an answer for the current question. */
export function allPlayersAnswered(room: Room): boolean {
  const playerIds = Object.keys(room.players);
  if (playerIds.length === 0) return false;
  return playerIds.every((id) => room.currentAnswers[id] != null);
}

function completeQuestion(room: Room, skipReveal: boolean): void {
  if (room.phase !== "question") return;
  const question = room.questions[room.currentQuestionIndex];
  if (!question) return;

  applyScores(room, question);
  if (skipReveal) {
    room.phase = "leaderboard";
    room.revealStartedAt = null;
  } else {
    room.phase = "reveal";
    room.revealStartedAt = Date.now();
  }
}

export function toPublicState(room: Room): PublicRoomState {
  const players = Object.values(room.players)
    .sort((a, b) => b.score - a.score || a.joinedAt - b.joinedAt)
    .map((p, i) => ({
      id: p.id,
      name: p.name,
      score: p.score,
      rank: i + 1,
    }));

  const currentQuestion = getPublicQuestion(room);

  const answerStats: Record<string, number> = {};
  for (const answer of Object.values(room.currentAnswers)) {
    answerStats[answer.optionId] = (answerStats[answer.optionId] ?? 0) + 1;
  }

  const revealCorrectId =
    room.phase === "reveal" || room.phase === "leaderboard"
      ? room.questions[room.currentQuestionIndex]?.correctOptionId ?? null
      : null;

  return {
    pin: room.pin,
    title: room.title,
    phase: room.phase,
    playerCount: players.length,
    players,
    currentQuestionIndex: room.currentQuestionIndex,
    totalQuestions: room.questions.length,
    currentQuestion,
    questionStartedAt: room.questionStartedAt,
    countdownStartedAt: room.countdownStartedAt,
    revealStartedAt: room.revealStartedAt,
    revealCorrectId,
    answerStats,
    leaderboard: players.slice(0, LEADERBOARD_TOP_N),
    settings: room.settings,
    version: room.version,
  };
}

function getPublicQuestion(room: Room): PublicQuestion | null {
  const q = room.questions[room.currentQuestionIndex];
  if (!q) return null;
  if (room.phase !== "question" && room.phase !== "reveal" && room.phase !== "countdown" && room.phase !== "leaderboard") {
    return null;
  }
  return {
    id: q.id,
    text: q.text,
    options: q.options,
    timeLimit: q.timeLimit,
    imageUrl: q.imageUrl,
  };
}

export async function createRoom(payload: CreateRoomPayload): Promise<{
  room: Room;
  hostToken: string;
}> {
  const id = generateId();
  const pin = generatePin();
  const hostToken = generateId();

  const room: Room = {
    id,
    pin,
    hostToken,
    title: payload.title?.trim() || "Answerini Game",
    createdAt: Date.now(),
    phase: "lobby",
    settings: defaultSettings(payload.settings),
    questions: [],
    currentQuestionIndex: 0,
    players: {},
    currentAnswers: {},
    questionStartedAt: null,
    countdownStartedAt: null,
    revealStartedAt: null,
    version: 0,
  };

  await saveRoom(room);
  return { room, hostToken };
}

export async function createRoomFromSavedGame(
  savedGameId: string,
  userId: string,
  titleOverride?: string
): Promise<{ room: Room; hostToken: string; reused?: boolean } | { error: string }> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("saved_games")
    .select("*, saved_questions(*)")
    .eq("id", savedGameId)
    .eq("user_id", userId)
    .single();

  if (error || !data) {
    return { error: "Saved game not found." };
  }

  const questionRows = (data.saved_questions ?? []).sort(
    (a: { sort_order: number }, b: { sort_order: number }) => a.sort_order - b.sort_order
  );

  if (questionRows.length === 0) {
    return { error: "Add at least one question to this saved game first." };
  }

  const questions = questionRows.map(rowToQuestion);
  const title = titleOverride?.trim() || data.title;
  const pin = data.fixed_pin ?? generatePin();

  if (data.fixed_pin) {
    await releaseOrphanedLiveRoom(supabase, pin);
  }

  let existing = await getRoomByPin(pin);
  if (existing?.savedGameId && existing.savedGameId !== savedGameId) {
    const { data: ownerGame } = await supabase
      .from("saved_games")
      .select("id")
      .eq("id", existing.savedGameId)
      .maybeSingle();
    if (!ownerGame) {
      await deleteLiveRoomByPin(pin);
      existing = null;
    }
  }

  if (existing) {
    if (existing.savedGameId && existing.savedGameId !== savedGameId) {
      return { error: "This room code is linked to another game. Choose a different permanent code." };
    }
    if (!existing.savedGameId && data.fixed_pin) {
      return { error: "This room code is already in use. Pick another permanent code." };
    }
    syncRoomFromSavedGame(existing, questions, title, data.settings, savedGameId, data.short_link);
    await saveRoom(existing);
    return { room: existing, hostToken: existing.hostToken, reused: true };
  }

  const id = generateId();
  const hostToken = generateId();

  const room: Room = {
    id,
    pin,
    hostToken,
    title,
    createdAt: Date.now(),
    phase: "lobby",
    settings: defaultSettings(data.settings),
    questions,
    currentQuestionIndex: 0,
    players: {},
    currentAnswers: {},
    questionStartedAt: null,
    countdownStartedAt: null,
    revealStartedAt: null,
    savedGameId: savedGameId,
    shortLink: data.short_link ?? null,
    version: 0,
  };

  await saveRoom(room);
  return { room, hostToken, reused: false };
}

export async function joinRoom(
  pin: string,
  name: string,
  existingPlayerId?: string
): Promise<{ room: Room; player: Player } | { error: string }> {
  const room = await getRoomByPin(pin.trim());
  if (!room) return { error: "Room not found. Check the PIN." };
  if (room.phase !== "lobby") return { error: "Game already started. Join before the host begins." };

  const trimmed = name.trim().slice(0, 20);
  if (trimmed.length < 1) return { error: "Enter a nickname." };

  const duplicate = Object.values(room.players).some(
    (p) => p.name.toLowerCase() === trimmed.toLowerCase() && p.id !== existingPlayerId
  );
  if (duplicate) return { error: "That nickname is taken." };

  if (Object.keys(room.players).length >= room.settings.maxPlayers) {
    return { error: "Room is full." };
  }

  let player: Player;
  if (existingPlayerId && room.players[existingPlayerId]) {
    player = room.players[existingPlayerId];
    player.name = trimmed;
    player.lastSeen = Date.now();
  } else {
    player = {
      id: generateId(),
      name: trimmed,
      score: 0,
      joinedAt: Date.now(),
      lastSeen: Date.now(),
      streak: 0,
    };
    room.players[player.id] = player;
  }

  await saveRoom(room);
  return { room, player };
}

export async function addQuestion(
  pin: string,
  hostToken: string,
  payload: AddQuestionPayload
): Promise<{ room: Room } | { error: string }> {
  const room = await getRoomByPin(pin);
  if (!room) return { error: "Room not found." };
  if (room.hostToken !== hostToken) return { error: "Unauthorized." };
  if (room.phase !== "lobby") return { error: "Cannot edit questions after game starts." };

  const text = payload.text.trim();
  if (!text) return { error: "Question text is required." };

  const options = payload.options.filter((o) => o.text.trim());
  if (options.length < 2) return { error: "At least 2 answers required." };
  if (options.length > 6) return { error: "Maximum 6 answers." };
  if (payload.correctIndex < 0 || payload.correctIndex >= options.length) {
    return { error: "Invalid correct answer." };
  }

  const question: Question = {
    id: generateId(),
    text,
    options: options.map((o) => ({ id: generateId(), text: o.text.trim() })),
    correctOptionId: "",
    timeLimit: payload.timeLimit ?? room.settings.questionTimeLimit,
    imageUrl: payload.imageUrl,
  };
  question.correctOptionId = question.options[payload.correctIndex].id;

  room.questions.push(question);
  await saveRoom(room);
  return { room };
}

export async function removeQuestion(
  pin: string,
  hostToken: string,
  questionId: string
): Promise<{ room: Room } | { error: string }> {
  const room = await getRoomByPin(pin);
  if (!room) return { error: "Room not found." };
  if (room.hostToken !== hostToken) return { error: "Unauthorized." };
  if (room.phase !== "lobby") return { error: "Cannot edit after start." };

  room.questions = room.questions.filter((q) => q.id !== questionId);
  await saveRoom(room);
  return { room };
}

export async function updateSettings(
  pin: string,
  hostToken: string,
  settings: Partial<RoomSettings>
): Promise<{ room: Room } | { error: string }> {
  const room = await getRoomByPin(pin);
  if (!room) return { error: "Room not found." };
  if (room.hostToken !== hostToken) return { error: "Unauthorized." };
  if (room.phase !== "lobby") return { error: "Cannot change settings after start." };

  room.settings = { ...room.settings, ...settings };
  await saveRoom(room);
  return { room };
}

export async function startGame(
  pin: string,
  hostToken: string
): Promise<{ room: Room } | { error: string }> {
  const room = await getRoomByPin(pin);
  if (!room) return { error: "Room not found." };
  if (room.hostToken !== hostToken) return { error: "Unauthorized." };
  if (room.questions.length === 0) return { error: "Add at least one question." };
  if (Object.keys(room.players).length === 0) {
    return { error: "Wait for at least one player to join." };
  }

  room.currentQuestionIndex = 0;
  room.currentAnswers = {};
  room.phase = "countdown";
  room.countdownStartedAt = Date.now();
  room.questionStartedAt = null;
  room.revealStartedAt = null;

  await saveRoom(room);
  return { room };
}

export async function tickRoom(pin: string): Promise<Room | null> {
  const room = await getRoomByPin(pin);
  if (!room) return null;

  let changed = false;
  const now = Date.now();

  if (room.phase === "countdown" && room.countdownStartedAt) {
    const elapsed = (now - room.countdownStartedAt) / 1000;
    if (elapsed >= COUNTDOWN_SECONDS) {
      room.phase = "question";
      room.questionStartedAt = now;
      room.countdownStartedAt = null;
      room.currentAnswers = {};
      changed = true;
    }
  }

  if (room.phase === "question" && room.questionStartedAt) {
    const q = room.questions[room.currentQuestionIndex];
    if (q) {
      const elapsed = now - room.questionStartedAt;
      const everyoneDone = allPlayersAnswered(room);
      if (elapsed >= q.timeLimit * 1000 || everyoneDone) {
        completeQuestion(room, everyoneDone);
        changed = true;
      }
    }
  }

  if (room.phase === "reveal" && room.revealStartedAt) {
    const elapsed = (now - room.revealStartedAt) / 1000;
    if (elapsed >= 3) {
      room.revealStartedAt = null;
      room.phase = "leaderboard";
      changed = true;
    }
  }

  if (changed) {
    await saveRoom(room);
  }
  return room;
}

function applyScores(room: Room, question: Question): void {
  for (const answer of Object.values(room.currentAnswers)) {
    const player = room.players[answer.playerId];
    if (!player) continue;
    const correct = answer.optionId === question.correctOptionId;
    if (correct) {
      player.streak += 1;
      player.score += answer.points;
    } else {
      player.streak = 0;
    }
  }
}

function advanceToNextQuestion(room: Room): void {
  const nextIndex = room.currentQuestionIndex + 1;
  if (nextIndex >= room.questions.length) {
    room.phase = "finished";
    room.questionStartedAt = null;
    return;
  }
  room.currentQuestionIndex = nextIndex;
  room.currentAnswers = {};
  room.phase = "countdown";
  room.countdownStartedAt = Date.now();
  room.questionStartedAt = null;
  room.revealStartedAt = null;
}

export async function hostNext(
  pin: string,
  hostToken: string
): Promise<{ room: Room } | { error: string }> {
  const room = await getRoomByPin(pin);
  if (!room) return { error: "Room not found." };
  if (room.hostToken !== hostToken) return { error: "Unauthorized." };

  if (room.phase === "leaderboard") {
    advanceToNextQuestion(room);
    await saveRoom(room);
    return { room };
  }

  return { error: "Nothing to advance." };
}

export async function submitAnswer(
  pin: string,
  playerId: string,
  optionId: string
): Promise<{ room: Room; points: number } | { error: string }> {
  const room = await getRoomByPin(pin);
  if (!room) return { error: "Room not found." };
  if (room.phase !== "question") return { error: "Not accepting answers." };

  const player = room.players[playerId];
  if (!player) return { error: "Player not found." };
  if (room.currentAnswers[playerId]) return { error: "Already answered." };

  const question = room.questions[room.currentQuestionIndex];
  if (!question) return { error: "No active question." };
  if (!question.options.some((o) => o.id === optionId)) {
    return { error: "Invalid option." };
  }

  const now = Date.now();
  const timeMs = room.questionStartedAt ? now - room.questionStartedAt : question.timeLimit * 1000;
  const correct = optionId === question.correctOptionId;
  const points = calculatePoints(timeMs, question.timeLimit * 1000, correct, player.streak);

  room.currentAnswers[playerId] = {
    playerId,
    optionId,
    answeredAt: now,
    timeMs,
    points,
    correct,
  };

  player.lastSeen = now;

  if (allPlayersAnswered(room)) {
    completeQuestion(room, true);
  }

  await saveRoom(room);
  return { room, points };
}

export async function kickPlayer(
  pin: string,
  hostToken: string,
  playerId: string
): Promise<{ room: Room } | { error: string }> {
  const room = await getRoomByPin(pin);
  if (!room) return { error: "Room not found." };
  if (room.hostToken !== hostToken) return { error: "Unauthorized." };
  delete room.players[playerId];
  delete room.currentAnswers[playerId];

  if (room.phase === "question" && allPlayersAnswered(room)) {
    completeQuestion(room, true);
  }

  await saveRoom(room);
  return { room };
}

export async function endGame(
  pin: string,
  hostToken: string
): Promise<{ room: Room } | { error: string }> {
  const room = await getRoomByPin(pin);
  if (!room) return { error: "Room not found." };
  if (room.hostToken !== hostToken) return { error: "Unauthorized." };
  room.phase = "finished";
  await saveRoom(room);
  return { room };
}

export async function resetToLobby(
  pin: string,
  hostToken: string
): Promise<{ room: Room } | { error: string }> {
  const room = await getRoomByPin(pin);
  if (!room) return { error: "Room not found." };
  if (room.hostToken !== hostToken) return { error: "Unauthorized." };

  for (const player of Object.values(room.players)) {
    player.score = 0;
    player.streak = 0;
  }
  room.phase = "lobby";
  room.currentQuestionIndex = 0;
  room.currentAnswers = {};
  room.questionStartedAt = null;
  room.countdownStartedAt = null;
  room.revealStartedAt = null;
  await saveRoom(room);
  return { room };
}

export function getPlayerRank(room: Room, playerId: string): PublicPlayer | null {
  const state = toPublicState(room);
  return state.players.find((p) => p.id === playerId) ?? null;
}

function syncRoomFromSavedGame(
  room: Room,
  questions: Question[],
  title: string,
  settings: RoomSettings,
  savedGameId: string,
  shortLink?: string | null
): void {
  room.title = title;
  room.settings = defaultSettings(settings);
  room.questions = questions;
  room.savedGameId = savedGameId;
  room.shortLink = shortLink ?? null;

  if (room.phase === "finished") {
    for (const player of Object.values(room.players)) {
      player.score = 0;
      player.streak = 0;
    }
    room.phase = "lobby";
    room.currentQuestionIndex = 0;
    room.currentAnswers = {};
    room.questionStartedAt = null;
    room.countdownStartedAt = null;
    room.revealStartedAt = null;
  }
}