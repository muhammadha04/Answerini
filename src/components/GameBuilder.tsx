"use client";

import { QuestionEditor } from "@/components/QuestionEditor";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import type { Question } from "@/lib/types";

type Props = {
  gameId: string;
};

export function GameBuilder({ gameId }: Props) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [goingLive, setGoingLive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadGame = useCallback(async () => {
    const res = await fetch(`/api/games/${gameId}`);
    if (!res.ok) {
      setError("Could not load game");
      setLoading(false);
      return;
    }
    const data = await res.json();
    setTitle(data.game.title);
    setQuestions(data.questions);
    setLoading(false);
  }, [gameId]);

  useEffect(() => {
    loadGame();
  }, [loadGame]);

  const saveTitle = async () => {
    setSaving(true);
    await fetch(`/api/games/${gameId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title }),
    });
    setSaving(false);
  };

  const addQuestion = async (q: {
    text: string;
    options: { text: string }[];
    correctIndex: number;
    timeLimit: number;
  }) => {
    const res = await fetch(`/api/games/${gameId}/questions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(q),
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error ?? "Failed to add question");
    }
    await loadGame();
  };

  const removeQuestion = async (qid: string) => {
    await fetch(`/api/games/${gameId}/questions/${qid}`, { method: "DELETE" });
    await loadGame();
  };

  const goLive = async () => {
    if (questions.length === 0) {
      setError("Add at least one question before going live.");
      return;
    }
    setGoingLive(true);
    setError(null);
    try {
      await saveTitle();
      const res = await fetch("/api/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ savedGameId: gameId, title }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to start live game");
        return;
      }
      localStorage.setItem(`answerini-host-${data.pin}`, data.hostToken);
      router.push(`/host/${data.pin}`);
    } finally {
      setGoingLive(false);
    }
  };

  const deleteGame = async () => {
    if (!confirm("Delete this saved game permanently?")) return;
    await fetch(`/api/games/${gameId}`, { method: "DELETE" });
    router.push("/host");
    router.refresh();
  };

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-white/30 border-t-white" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Link href="/host" className="text-sm text-white/60 hover:text-white">
          ← My Games
        </Link>
      </div>

      {error && (
        <p className="rounded-xl bg-red-500/20 px-4 py-2 text-center text-red-200">{error}</p>
      )}

      <div className="rounded-2xl bg-white/10 p-5">
        <label className="mb-1 block text-sm font-semibold text-white/70">Game title</label>
        <div className="flex gap-2">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value.slice(0, 60))}
            className="flex-1 rounded-xl border-0 bg-white/10 px-4 py-3 text-white outline-none focus:ring-2 focus:ring-green-400"
          />
          <button
            type="button"
            onClick={saveTitle}
            disabled={saving}
            className="rounded-xl bg-white/15 px-4 py-2 font-bold hover:bg-white/25 disabled:opacity-50"
          >
            Save
          </button>
        </div>
      </div>

      <QuestionEditor onAdd={addQuestion} />

      {questions.length > 0 && (
        <div className="rounded-2xl bg-white/5 p-4">
          <h3 className="mb-3 font-bold text-white">Saved Questions ({questions.length})</h3>
          <ul className="space-y-2">
            {questions.map((q, i) => (
              <li
                key={q.id}
                className="flex items-center justify-between rounded-xl bg-white/5 px-4 py-2 text-white"
              >
                <span className="truncate">
                  {i + 1}. {q.text}
                </span>
                <button
                  type="button"
                  onClick={() => removeQuestion(q.id)}
                  className="ml-2 shrink-0 text-red-400 hover:text-red-300"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <button
        type="button"
        onClick={goLive}
        disabled={goingLive || questions.length === 0}
        className="w-full rounded-2xl bg-green-500 py-4 text-xl font-black text-white hover:bg-green-400 disabled:opacity-40"
      >
        {goingLive ? "Starting live session…" : "Go Live with this Game"}
      </button>

      <button
        type="button"
        onClick={deleteGame}
        className="w-full text-sm text-red-400 underline"
      >
        Delete saved game
      </button>
    </div>
  );
}
