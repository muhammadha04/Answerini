export type GamePhase =
  | "lobby"
  | "countdown"
  | "question"
  | "reveal"
  | "leaderboard"
  | "finished";

export type AnswerOption = {
  id: string;
  text: string;
};

export type Question = {
  id: string;
  text: string;
  options: AnswerOption[];
  correctOptionId: string;
  timeLimit: number;
  imageUrl?: string;
};

export type Player = {
  id: string;
  name: string;
  score: number;
  joinedAt: number;
  lastSeen: number;
  streak: number;
};

export type PlayerAnswer = {
  playerId: string;
  optionId: string;
  answeredAt: number;
  timeMs: number;
  points: number;
  correct: boolean;
};

export type RoomSettings = {
  questionTimeLimit: number;
  showLeaderboardAfterEach: boolean;
  shuffleAnswers: boolean;
  maxPlayers: number;
};

export type Room = {
  id: string;
  pin: string;
  hostToken: string;
  title: string;
  createdAt: number;
  phase: GamePhase;
  settings: RoomSettings;
  questions: Question[];
  currentQuestionIndex: number;
  players: Record<string, Player>;
  currentAnswers: Record<string, PlayerAnswer>;
  questionStartedAt: number | null;
  countdownStartedAt: number | null;
  revealStartedAt: number | null;
  version: number;
};

export type PublicPlayer = {
  id: string;
  name: string;
  score: number;
  rank?: number;
};

export type PublicRoomState = {
  pin: string;
  title: string;
  phase: GamePhase;
  playerCount: number;
  players: PublicPlayer[];
  currentQuestionIndex: number;
  totalQuestions: number;
  currentQuestion: PublicQuestion | null;
  questionStartedAt: number | null;
  countdownStartedAt: number | null;
  revealStartedAt: number | null;
  revealCorrectId: string | null;
  answerStats: Record<string, number>;
  leaderboard: PublicPlayer[];
  settings: RoomSettings;
  version: number;
};

export type PublicQuestion = {
  id: string;
  text: string;
  options: AnswerOption[];
  timeLimit: number;
  imageUrl?: string;
};

export type CreateRoomPayload = {
  title: string;
  hostName?: string;
  settings?: Partial<RoomSettings>;
};

export type JoinRoomPayload = {
  pin: string;
  name: string;
};

export type AddQuestionPayload = {
  text: string;
  options: { text: string }[];
  correctIndex: number;
  timeLimit?: number;
  imageUrl?: string;
};
