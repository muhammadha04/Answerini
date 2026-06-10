"use client";

import { useEffect, useState } from "react";
import { AnswerButton } from "@/components/AnswerButton";
import { CountdownOverlay, TimerBar } from "@/components/TimerBar";
import { Leaderboard } from "@/components/Leaderboard";
import { InvitePanel } from "@/components/InvitePanel";
import { WinnerPodium } from "@/components/WinnerPodium";
import { QuestionEditor } from "@/components/QuestionEditor";
import { useRoomState, useSession } from "@/hooks/useRoomState";
import { useScoreSnapshots } from "@/hooks/useScoreSnapshots";
import { COUNTDOWN_SECONDS } from "@/lib/constants";
import type { Question } from "@/lib/types";

type Props = {
  pin: string;
};

export function HostDashboard({ pin }: Props) {
  const { state, refresh } = useRoomState(pin);
  const { value: hostToken } = useSession(`answerini-host-${pin}`);
  const startScores = useScoreSnapshots(state);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [savedGameId, setSavedGameId] = useState<string | null>(null);
  const [shortLink, setShortLink] = useState<string | null>(null);
  const [now, setNow] = useState(Date.now());
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 200);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!hostToken) return;
    fetch(`/api/rooms/${pin}/host`, {
      headers: { "x-host-token": hostToken },
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.questions) setQuestions(data.questions);
        if (data.savedGameId) setSavedGameId(data.savedGameId);
        if (data.shortLink !== undefined) setShortLink(data.shortLink);
      })
      .catch(() => {});
  }, [pin, hostToken, state?.version]);

  const hostAction = async (action: string, data: Record<string, unknown> = {}) => {
    if (!hostToken) return;
    setActionError(null);
    const res = await fetch(`/api/rooms/${pin}/host`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, hostToken, ...data }),
    });
    const body = await res.json();
    if (!res.ok) {
      setActionError(body.error ?? "Action failed");
      return;
    }
    await refresh();
    if (action === "addQuestion" || action === "removeQuestion") {
      const qRes = await fetch(`/api/rooms/${pin}/host`, {
        headers: { "x-host-token": hostToken },
      });
      const qData = await qRes.json();
      if (qData.questions) setQuestions(qData.questions);
    }
  };

  if (!hostToken) {
    return (
      <p className="text-center text-red-300">
        Host session expired. Create a new room from the host page.
      </p>
    );
  }

  if (!state) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-white/30 border-t-white" />
      </div>
    );
  }

  const question = state.currentQuestion;
  const timeLeft =
    question && state.questionStartedAt
      ? Math.max(0, Math.ceil(question.timeLimit - (now - state.questionStartedAt) / 1000))
      : 0;

  return (
    <div className="space-y-6">
      {actionError && (
        <p className="rounded-xl bg-red-500/20 px-4 py-2 text-center text-red-200">{actionError}</p>
      )}

      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-white/10 p-4">
        <div>
          <p className="text-sm text-white/60">Game PIN</p>
          <p className="font-mono text-3xl font-black tracking-widest text-white">{pin}</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-white/60">Players</p>
          <p className="text-3xl font-black text-white">{state.playerCount}</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-white/60">Phase</p>
          <p className="text-lg font-bold capitalize text-white">{state.phase}</p>
        </div>
      </div>

      <InvitePanel pin={pin} shortLink={shortLink} />

      {state.phase === "lobby" && (
        <>
          {!savedGameId && (
            <QuestionEditor
              onAdd={async (q) => {
                await hostAction("addQuestion", q);
              }}
            />
          )}

          {savedGameId && questions.length > 0 && (
            <p className="rounded-xl bg-green-500/20 px-4 py-3 text-center text-sm text-green-100">
              Questions loaded from your saved game ({questions.length} total)
            </p>
          )}

          {questions.length > 0 && (
            <div className="rounded-2xl bg-white/5 p-4">
              <h3 className="mb-3 font-bold text-white">
                Questions ({questions.length})
              </h3>
              <ul className="space-y-2">
                {questions.map((q, i) => (
                  <li
                    key={q.id}
                    className="flex items-center justify-between rounded-xl bg-white/5 px-4 py-2 text-white"
                  >
                    <span className="truncate">
                      {i + 1}. {q.text}
                    </span>
                    {!savedGameId && (
                      <button
                        type="button"
                        onClick={() => hostAction("removeQuestion", { questionId: q.id })}
                        className="ml-2 shrink-0 text-red-400 hover:text-red-300"
                      >
                        Remove
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {state.players.length > 0 && (
            <div className="rounded-2xl bg-white/5 p-4">
              <h3 className="mb-3 font-bold text-white">Lobby</h3>
              <ul className="flex flex-wrap gap-2">
                {state.players.map((p) => (
                  <li
                    key={p.id}
                    className="flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-sm text-white"
                  >
                    {p.name}
                    <button
                      type="button"
                      onClick={() => hostAction("kick", { playerId: p.id })}
                      className="text-red-400"
                    >
                      ×
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <button
            type="button"
            onClick={() => hostAction("start")}
            disabled={questions.length === 0}
            className="w-full rounded-2xl bg-green-500 py-4 text-xl font-black text-white hover:bg-green-400 disabled:opacity-40"
          >
            Start Game
          </button>
        </>
      )}

      {state.phase === "countdown" && state.countdownStartedAt && (
        <CountdownOverlay
          value={Math.max(1, COUNTDOWN_SECONDS - Math.floor((now - state.countdownStartedAt) / 1000))}
        />
      )}

      {(state.phase === "question" || state.phase === "reveal") && question && (
        <div className="space-y-4">
          <h2 className="text-2xl font-black text-white">{question.text}</h2>
          {state.phase === "question" && <TimerBar seconds={timeLeft} total={question.timeLimit} />}
          <p className="text-white/70">
            {Object.values(state.answerStats).reduce((a, b) => a + b, 0)} / {state.playerCount}{" "}
            answered
          </p>
          <div className="grid grid-cols-2 gap-2">
            {question.options.map((opt, i) => (
              <AnswerButton
                key={opt.id}
                text={opt.text}
                index={i}
                disabled
                correct={state.revealCorrectId === opt.id}
                showResult={state.phase === "reveal"}
                compact
              />
            ))}
          </div>
          {state.phase === "reveal" && (
            <button
              type="button"
              onClick={() => hostAction("next")}
              className="w-full rounded-xl bg-purple-500 py-3 font-bold text-white"
            >
              Show Leaderboard / Next
            </button>
          )}
        </div>
      )}

      {state.phase === "leaderboard" && (
        <div className="space-y-4">
          <Leaderboard
            key={`lb-${state.currentQuestionIndex}-${state.version}`}
            players={state.leaderboard}
            title="Top 5 — Leaderboard"
            startScores={startScores}
          />
          <button
            type="button"
            onClick={() => hostAction("next")}
            className="w-full rounded-2xl bg-green-500 py-4 text-xl font-black text-white"
          >
            {state.currentQuestionIndex + 1 >= state.totalQuestions
              ? "Show Final Results"
              : "Next Question"}
          </button>
        </div>
      )}

      {state.phase === "finished" && (
        <div className="space-y-4">
          <WinnerPodium
            players={state.players.slice(0, 10)}
            startScores={startScores}
            title="Final Podium"
          />
          <button
            type="button"
            onClick={() => hostAction("reset")}
            className="w-full rounded-xl bg-white/20 py-3 font-bold text-white"
          >
            Play Again (Lobby)
          </button>
        </div>
      )}

      {state.phase !== "lobby" && state.phase !== "finished" && (
        <button
          type="button"
          onClick={() => hostAction("end")}
          className="text-sm text-red-400 underline"
        >
          End game early
        </button>
      )}
    </div>
  );
}
