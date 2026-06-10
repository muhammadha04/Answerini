"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

type GameRow = {
  id: string;
  title: string;
  description: string;
  fixed_pin: string | null;
  updated_at: string;
  saved_questions: { count: number }[];
};

type Props = {
  games: GameRow[];
};

export function HostLibrary({ games }: Props) {
  const router = useRouter();
  const [startingId, setStartingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const goLive = async (gameId: string, title: string) => {
    setStartingId(gameId);
    setError(null);
    try {
      const res = await fetch("/api/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ savedGameId: gameId, title }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to start");
        return;
      }
      localStorage.setItem(`answerini-host-${data.pin}`, data.hostToken);
      router.push(`/host/${data.pin}`);
    } finally {
      setStartingId(null);
    }
  };

  if (games.length === 0) {
    return (
      <div className="rounded-3xl bg-white/10 p-10 text-center backdrop-blur">
        <p className="text-lg text-white/70">No saved games yet.</p>
        <Link
          href="/host/games/new"
          className="mt-4 inline-block rounded-xl bg-white/15 px-6 py-3 font-bold hover:bg-white/25"
        >
          Create your first quiz
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <p className="rounded-xl bg-red-500/20 px-4 py-2 text-center text-red-200">{error}</p>
      )}
      <ul className="space-y-3">
        {games.map((game) => {
          const qCount = game.saved_questions?.[0]?.count ?? 0;
          return (
            <li
              key={game.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white/10 p-5"
            >
              <div>
                <h2 className="text-xl font-bold">{game.title}</h2>
                <p className="text-sm text-white/60">
                  {qCount} question{qCount !== 1 ? "s" : ""} · Updated{" "}
                  {new Date(game.updated_at).toLocaleDateString()}
                  {game.fixed_pin && (
                    <span className="ml-2 font-mono text-yellow-300">PIN {game.fixed_pin}</span>
                  )}
                </p>
              </div>
              <div className="flex gap-2">
                <Link
                  href={`/host/games/${game.id}`}
                  className="rounded-xl bg-white/15 px-4 py-2 text-sm font-bold hover:bg-white/25"
                >
                  Edit
                </Link>
                <button
                  type="button"
                  onClick={() => goLive(game.id, game.title)}
                  disabled={startingId === game.id || qCount === 0}
                  className="rounded-xl bg-green-500 px-4 py-2 text-sm font-bold hover:bg-green-400 disabled:opacity-40"
                >
                  {startingId === game.id
                    ? "Opening…"
                    : game.fixed_pin
                      ? "Open lobby"
                      : "Go Live"}
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
