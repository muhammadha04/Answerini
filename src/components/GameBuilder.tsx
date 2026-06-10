"use client";

import { InvitePanel } from "@/components/InvitePanel";
import { QuestionEditor } from "@/components/QuestionEditor";
import { RtlText } from "@/components/RtlText";
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
  const [fixedPin, setFixedPin] = useState<string | null>(null);
  const [shortLink, setShortLink] = useState("");
  const [customPinInput, setCustomPinInput] = useState("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pinLoading, setPinLoading] = useState(false);
  const [goingLive, setGoingLive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lobbyOpen, setLobbyOpen] = useState(false);

  const loadGame = useCallback(async () => {
    const res = await fetch(`/api/games/${gameId}`);
    if (!res.ok) {
      setError("Could not load game");
      setLoading(false);
      return;
    }
    const data = await res.json();
    setTitle(data.game.title);
    setFixedPin(data.game.fixedPin ?? null);
    setShortLink(data.game.shortLink ?? "");
    setQuestions(data.questions);
    setLoading(false);
  }, [gameId]);

  useEffect(() => {
    loadGame();
  }, [loadGame]);

  const saveShortLink = async () => {
    setSaving(true);
    const res = await fetch(`/api/games/${gameId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ shortLink }),
    });
    setSaving(false);
    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Failed to save short link");
    }
  };

  const saveTitle = async () => {
    setSaving(true);
    await fetch(`/api/games/${gameId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title }),
    });
    setSaving(false);
  };

  const enableFixedPin = async (custom?: string) => {
    setPinLoading(true);
    setError(null);
    const res = await fetch(`/api/games/${gameId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        enableFixedPin: true,
        ...(custom ? { customPin: custom } : {}),
      }),
    });
    const data = await res.json();
    setPinLoading(false);
    if (!res.ok) {
      setError(data.error ?? "Failed to set permanent code");
      return;
    }
    setFixedPin(data.fixedPin);
    setCustomPinInput("");
  };

  const disableFixedPin = async () => {
    setPinLoading(true);
    await fetch(`/api/games/${gameId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enableFixedPin: false }),
    });
    setFixedPin(null);
    setLobbyOpen(false);
    setPinLoading(false);
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

  const openLobby = async (navigate = true) => {
    if (questions.length === 0) {
      setError("Add at least one question before opening the lobby.");
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
        setError(data.error ?? "Failed to open lobby");
        return;
      }
      localStorage.setItem(`answerini-host-${data.pin}`, data.hostToken);
      setLobbyOpen(true);
      if (navigate) router.push(`/host/${data.pin}`);
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

      <div className="rounded-2xl bg-white/10 p-5">
        <label className="mb-1 block text-sm font-semibold text-white/70">
          Short invite link (optional)
        </label>
        <p className="mb-3 text-sm text-white/60">
          e.g. bit.ly/b112003 — shown in bold under the PIN on the QR screen. Point it to your join
          link in Bitly (or similar) first.
        </p>
        <div className="flex gap-2">
          <input
            value={shortLink}
            onChange={(e) => setShortLink(e.target.value.slice(0, 120))}
            placeholder="bit.ly/b112003"
            className="flex-1 rounded-xl border-0 bg-white/10 px-4 py-3 text-white outline-none focus:ring-2 focus:ring-blue-400"
          />
          <button
            type="button"
            onClick={saveShortLink}
            disabled={saving}
            className="rounded-xl bg-white/15 px-4 py-2 font-bold hover:bg-white/25 disabled:opacity-50"
          >
            Save
          </button>
        </div>
      </div>

      <div className="rounded-2xl bg-white/10 p-5">
        <h3 className="mb-1 font-bold text-white">Permanent room code</h3>
        <p className="mb-4 text-sm text-white/60">
          Use the same PIN every time you host this game. Share the link and QR with players days
          before — open the lobby when you&apos;re ready for them to join.
        </p>

        {fixedPin ? (
          <div className="space-y-4">
            <div className="rounded-xl bg-white/10 px-4 py-3 text-center">
              <p className="text-xs font-semibold uppercase tracking-widest text-white/50">
                Your permanent code
              </p>
              <p className="font-mono text-4xl font-black tracking-[0.35em] text-yellow-300">
                {fixedPin}
              </p>
            </div>

            <InvitePanel pin={fixedPin} shortLink={shortLink || null} />

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => openLobby(true)}
                disabled={goingLive || questions.length === 0}
                className="rounded-xl bg-green-500 px-4 py-2 font-bold text-white hover:bg-green-400 disabled:opacity-40"
              >
                {goingLive ? "Opening…" : lobbyOpen ? "Go to host dashboard" : "Open lobby"}
              </button>
              <button
                type="button"
                onClick={disableFixedPin}
                disabled={pinLoading}
                className="rounded-xl bg-white/10 px-4 py-2 text-sm text-white/70 hover:bg-white/20"
              >
                Use random codes instead
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <button
              type="button"
              onClick={() => enableFixedPin()}
              disabled={pinLoading}
              className="w-full rounded-xl bg-purple-600 py-3 font-bold text-white hover:bg-purple-500 disabled:opacity-50"
            >
              {pinLoading ? "Generating…" : "Generate permanent room code"}
            </button>
            <div className="flex gap-2">
              <input
                value={customPinInput}
                onChange={(e) => setCustomPinInput(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="Or choose 6 digits"
                inputMode="numeric"
                className="flex-1 rounded-xl border-0 bg-white/10 px-4 py-2 font-mono text-white outline-none focus:ring-2 focus:ring-purple-400"
              />
              <button
                type="button"
                onClick={() => enableFixedPin(customPinInput)}
                disabled={pinLoading || customPinInput.length !== 6}
                className="rounded-xl bg-white/15 px-4 py-2 font-bold disabled:opacity-40"
              >
                Set
              </button>
            </div>
          </div>
        )}
      </div>

      <QuestionEditor onAdd={addQuestion} />

      {questions.length > 0 && (
        <div className="rounded-2xl bg-white/5 p-4">
          <h3 className="mb-3 font-bold text-white">Saved Questions ({questions.length})</h3>
          <ul className="space-y-2">
            {questions.map((q, i) => (
              <li
                key={q.id}
                className="flex items-center gap-2 rounded-xl bg-white/5 px-4 py-2 text-white"
              >
                <span className="shrink-0">{i + 1}.</span>
                <RtlText text={q.text} className="min-w-0 flex-1 truncate" />
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

      {!fixedPin && (
        <button
          type="button"
          onClick={() => openLobby(true)}
          disabled={goingLive || questions.length === 0}
          className="w-full rounded-2xl bg-green-500 py-4 text-xl font-black text-white hover:bg-green-400 disabled:opacity-40"
        >
          {goingLive ? "Starting live session…" : "Go Live (random PIN)"}
        </button>
      )}

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
