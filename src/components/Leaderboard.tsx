"use client";

import type { PublicPlayer } from "@/lib/types";

type Props = {
  players: PublicPlayer[];
  title?: string;
  highlightId?: string;
  showAll?: boolean;
};

export function Leaderboard({ players, title = "Top 5", highlightId, showAll }: Props) {
  const list = showAll ? players : players.slice(0, 5);

  return (
    <div className="w-full max-w-lg mx-auto">
      <h2 className="mb-4 text-center text-2xl font-black text-white">{title}</h2>
      <ul className="space-y-2">
        {list.map((player, i) => {
          const isHighlight = player.id === highlightId;
          const medals = ["🥇", "🥈", "🥉"];
          const medal = i < 3 ? medals[i] : null;

          return (
            <li
              key={player.id}
              className={`flex items-center justify-between rounded-xl px-4 py-3 font-bold transition-all ${
                isHighlight
                  ? "bg-yellow-400 text-purple-900 scale-105 shadow-xl"
                  : "bg-white/10 text-white"
              }`}
            >
              <span className="flex items-center gap-3">
                <span className="w-8 text-center text-lg">
                  {medal ?? `#${player.rank ?? i + 1}`}
                </span>
                <span className="truncate">{player.name}</span>
              </span>
              <span className="tabular-nums">{player.score.toLocaleString()}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
