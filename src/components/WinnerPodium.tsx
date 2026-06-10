"use client";

import { useEffect, useRef, useState } from "react";
import type { PublicPlayer } from "@/lib/types";
import { sounds } from "@/lib/sounds";
import { AnimatedScore } from "@/components/AnimatedScore";
import { Confetti, GlitterBurst } from "@/components/Confetti";

type Props = {
  players: PublicPlayer[];
  startScores?: Record<string, number>;
  highlightId?: string;
  title?: string;
};

export function WinnerPodium({
  players,
  startScores = {},
  highlightId,
  title = "We have a winner!",
}: Props) {
  const [revealed, setRevealed] = useState(0);
  const played = useRef(false);

  const top3 = players.slice(0, 3);
  const winner = top3[0];
  const second = top3[1];
  const third = top3[2];

  // Podium order: 2nd, 1st, 3rd (Kahoot style)
  const podium = [
    { player: second, place: 2, height: "h-24", medal: "🥈", delay: 400 },
    { player: winner, place: 1, height: "h-36", medal: "🏆", delay: 0 },
    { player: third, place: 3, height: "h-16", medal: "🥉", delay: 800 },
  ].filter((p) => p.player);

  useEffect(() => {
    if (played.current) return;
    played.current = true;
    sounds.fanfare();
    setTimeout(() => sounds.winnerCheer(), 900);
  }, []);

  useEffect(() => {
    const steps = podium.length + 1;
    let step = 0;
    const id = setInterval(() => {
      step += 1;
      setRevealed(step);
      if (step >= steps) clearInterval(id);
      else sounds.rowReveal();
    }, 700);
    return () => clearInterval(id);
  }, [podium.length]);

  return (
    <div className="relative flex w-full max-w-2xl flex-col items-center gap-8 py-6">
      <Confetti count={80} />

      <div className="relative text-center">
        <GlitterBurst />
        <p className="text-sm font-bold uppercase tracking-[0.3em] text-yellow-300/80">
          Game over
        </p>
        <h1 className="mt-2 text-4xl font-black text-white md:text-5xl animate-float">
          {title}
        </h1>
      </div>

      {winner && revealed >= 1 && (
        <div
          className="relative flex flex-col items-center animate-podium-pop"
          style={{ animationDelay: "0.1s" }}
        >
          <span className="trophy-glow text-7xl md:text-8xl">🏆</span>
          <p className="mt-2 text-2xl font-black text-yellow-300">{winner.name}</p>
          <p className="text-lg font-bold text-white/80">
            <AnimatedScore
              from={startScores[winner.id] ?? 0}
              to={winner.score}
              duration={1500}
              delay={200}
            />{" "}
            pts
          </p>
        </div>
      )}

      {podium.length > 0 && (
        <div className="flex w-full items-end justify-center gap-3 px-4 md:gap-6">
          {podium.map(({ player, place, height, medal, delay }, i) => (
            <div
              key={player!.id}
              className={`flex flex-1 max-w-[140px] flex-col items-center transition-all duration-500 ${
                revealed > i ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
              }`}
              style={{ transitionDelay: `${delay}ms` }}
            >
              <span className="mb-1 text-2xl">{medal}</span>
              <p className="mb-2 max-w-full truncate text-center text-sm font-black md:text-base">
                {player!.name}
              </p>
              <p className="mb-2 text-xs font-bold text-yellow-200 md:text-sm">
                <AnimatedScore
                  from={startScores[player!.id] ?? 0}
                  to={player!.score}
                  duration={1200}
                  delay={delay + 300}
                />
              </p>
              <div
                className={`w-full ${height} flex items-end justify-center rounded-t-2xl bg-gradient-to-t from-white/20 to-white/5 pb-2`}
              >
                <span className="text-3xl font-black text-white/30">#{place}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {players.length > 3 && (
        <div className="w-full max-w-lg">
          <h3 className="mb-3 text-center text-lg font-bold text-white/70">Full standings</h3>
          <ul className="space-y-2">
            {players.slice(3, 10).map((player, i) => {
              const rank = player.rank ?? i + 4;
              const isHighlight = player.id === highlightId;
              return (
                <li
                  key={player.id}
                  className={`flex items-center justify-between rounded-xl px-4 py-2 font-bold ${
                    isHighlight ? "bg-yellow-400/90 text-purple-900" : "bg-white/10 text-white"
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <span className="w-8 text-center">#{rank}</span>
                    <span className="truncate">{player.name}</span>
                  </span>
                  <AnimatedScore
                    from={startScores[player.id] ?? player.score}
                    to={player.score}
                    duration={800}
                    delay={1000 + i * 100}
                    playTicks={false}
                  />
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {highlightId && !players.slice(0, 3).some((p) => p.id === highlightId) && (
        <p className="rounded-xl bg-white/10 px-6 py-3 font-bold text-white">
          You finished #
          {players.find((p) => p.id === highlightId)?.rank ?? "?"} —{" "}
          <AnimatedScore
            from={startScores[highlightId] ?? 0}
            to={players.find((p) => p.id === highlightId)?.score ?? 0}
            duration={1200}
            delay={500}
          />{" "}
          pts
        </p>
      )}
    </div>
  );
}
