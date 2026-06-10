"use client";

import { useEffect, useRef, useState } from "react";
import { sounds } from "@/lib/sounds";

type Props = {
  from: number;
  to: number;
  duration?: number;
  delay?: number;
  playTicks?: boolean;
  className?: string;
};

export function AnimatedScore({
  from,
  to,
  duration = 1200,
  delay = 0,
  playTicks = true,
  className = "",
}: Props) {
  const [display, setDisplay] = useState(from);
  const lastTick = useRef(0);

  useEffect(() => {
    if (from === to) {
      setDisplay(to);
      return;
    }

    let raf = 0;
    let start: number | null = null;
    const tickInterval = 80;

    const step = (ts: number) => {
      if (start === null) start = ts;
      const elapsed = ts - start - delay;
      if (elapsed < 0) {
        raf = requestAnimationFrame(step);
        return;
      }

      const t = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      const value = Math.round(from + (to - from) * eased);
      setDisplay(value);

      if (playTicks && value !== to && ts - lastTick.current > tickInterval) {
        sounds.scoreTick();
        lastTick.current = ts;
      }

      if (t < 1) {
        raf = requestAnimationFrame(step);
      } else {
        setDisplay(to);
      }
    };

    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [from, to, duration, delay, playTicks]);

  return <span className={`tabular-nums ${className}`}>{display.toLocaleString()}</span>;
}
