import { MAX_POINTS, MIN_POINTS } from "./constants";

export function calculatePoints(
  timeMs: number,
  timeLimitMs: number,
  correct: boolean,
  streak: number
): number {
  if (!correct) return 0;

  const ratio = Math.min(timeMs / timeLimitMs, 1);
  const base = Math.round(MAX_POINTS - ratio * (MAX_POINTS - MIN_POINTS));
  const streakBonus = Math.min(streak, 5) * 50;

  return base + streakBonus;
}
