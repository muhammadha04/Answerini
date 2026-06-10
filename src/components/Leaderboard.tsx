"use client";

import { useEffect, useRef, useState } from "react";
import type { PublicPlayer } from "@/lib/types";
import { sounds } from "@/lib/sounds";
import { AnimatedScore } from "@/components/AnimatedScore";

type Props = {
  players: PublicPlayer[];
  title?: string;
  highlightId?: string;
  showAll?: boolean;
  startScores?: Record<string, number>;
  animated?: boolean;
};

export function Leaderboard({
  players,
  title = "Top 5",
  highlightId,
  showAll,
  startScores = {},
  animated = true,
}: Props) {
  const list = showAll ? players : players.slice(0, 5);
  const [revealedRows, setRevealedRows] = useState(0);
  const introPlayed = useRef(false);

  useEffect(() => {
    if (!animated) {
      setRevealedRows(list.length);
      return;
    }

    setRevealedRows(0);
    introPlayed.current = false;

    if (!introPlayed.current) {
      sounds.leaderboardIntro();
      introPlayed.current = true;
    }

    let row = 0;
    const interval = setInterval(() => {
      row += 1;
      setRevealedRows(row);
      sounds.rowReveal();
      if (row >= list.length) clearInterval(interval);
    }, 550);

    return () => clearInterval(interval);
  }, [list.map((p) => `${p.id}-${p.score}`).join(","), animated, list.length]);

  return (
    <div className="leaderboard-enter w-full max-w-lg mx-auto">
      <h2 className="mb-6 text-center text-3xl font-black text-white drop-shadow-lg">{title}</h2>
      <ul className="space-y-3">
        {list.map((player, i) => {
          // Rank 1 stays at top; reveal from #5 (bottom) up to #1 (top)
          const isVisible = !animated || list.length - i <= revealedRows;
          const isHighlight = player.id === highlightId;
          const medals = ["🥇", "🥈", "🥉"];
          const medal = i < 3 ? medals[i] : null;
          const fromScore = startScores[player.id] ?? player.score;

          return (
            <li
              key={player.id}
              className={`flex items-center justify-between rounded-2xl px-5 py-4 font-bold shadow-lg transition-all duration-400 ${
                isVisible ? "translate-x-0 opacity-100 scale-100" : "translate-x-8 opacity-0 scale-95"
              } ${
                isHighlight
                  ? "bg-gradient-to-r from-yellow-300 to-yellow-400 text-purple-900 ring-2 ring-yellow-200"
                  : i === 0
                    ? "bg-gradient-to-r from-yellow-500/30 to-amber-500/20 text-white ring-1 ring-yellow-400/50"
                    : "bg-white/15 text-white backdrop-blur"
              }`}
              style={{ transitionDelay: `${(list.length - 1 - i) * 50}ms` }}
            >
              <span className="flex min-w-0 items-center gap-3">
                <span
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-lg ${
                    i === 0 ? "bg-yellow-400/30 text-2xl" : "bg-black/20"
                  }`}
                >
                  {medal ?? `#${player.rank ?? i + 1}`}
                </span>
                <span className="truncate text-lg">{player.name}</span>
              </span>
              {isVisible && animated ? (
                <AnimatedScore
                  from={fromScore}
                  to={player.score}
                  duration={900}
                  delay={100}
                  className={`text-xl ${i === 0 ? "text-yellow-200" : ""}`}
                />
              ) : (
                <span className="tabular-nums text-xl">{player.score.toLocaleString()}</span>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
