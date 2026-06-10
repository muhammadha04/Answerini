"use client";

type Props = {
  seconds: number;
  total: number;
};

export function TimerBar({ seconds, total }: Props) {
  const pct = Math.max(0, Math.min(100, (seconds / total) * 100));
  const urgent = seconds <= 5;

  return (
    <div className="w-full">
      <div className="mb-1 flex justify-between text-sm font-bold text-white/80">
        <span>Time</span>
        <span className={urgent ? "animate-pulse text-red-300" : ""}>{seconds}s</span>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-black/30">
        <div
          className={`h-full rounded-full transition-all duration-1000 ease-linear ${
            urgent ? "bg-red-500" : "bg-green-400"
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export function CountdownOverlay({ value }: { value: number }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <p className="text-xl font-bold text-white/80">Get ready!</p>
      <div
        key={value}
        className="flex h-32 w-32 animate-bounce items-center justify-center rounded-full bg-white text-6xl font-black text-[#46178f] shadow-2xl"
      >
        {value}
      </div>
    </div>
  );
}
