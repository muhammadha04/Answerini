"use client";

import { useEffect, useRef, useState } from "react";
import type { PublicRoomState } from "@/lib/types";

/** Snapshot player scores at question start for leaderboard count-up animation. */
export function useScoreSnapshots(state: PublicRoomState | null) {
  const prevAtQuestionRef = useRef<Record<string, number>>({});
  const [startScores, setStartScores] = useState<Record<string, number>>({});
  const [questionStartScores, setQuestionStartScores] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!state) return;

    if (state.phase === "question" && state.questionStartedAt) {
      const snap: Record<string, number> = {};
      for (const p of state.players) {
        snap[p.id] = p.score;
      }
      prevAtQuestionRef.current = snap;
      setQuestionStartScores(snap);
    }

    if (state.phase === "leaderboard" || state.phase === "finished") {
      setStartScores({ ...prevAtQuestionRef.current });
    }
  }, [
    state?.phase,
    state?.currentQuestionIndex,
    state?.questionStartedAt,
    state?.players,
  ]);

  return { startScores, questionStartScores };
}
