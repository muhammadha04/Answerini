"use client";

type Props = {
  pin: string;
  playerCount: number;
  title: string;
};

export function LobbyScreen({ pin, playerCount, title }: Props) {
  return (
    <div className="flex flex-col items-center justify-center gap-6 text-center">
      <p className="text-lg font-semibold text-white/70">You&apos;re in!</p>
      <h1 className="text-3xl font-black text-white">{title}</h1>
      <div className="rounded-2xl bg-white/10 px-8 py-6 backdrop-blur">
        <p className="mb-1 text-sm font-semibold uppercase tracking-widest text-white/60">
          Game PIN
        </p>
        <p className="font-mono text-5xl font-black tracking-[0.3em] text-white">{pin}</p>
      </div>
      <div className="flex items-center gap-2 text-white/80">
        <span className="inline-block h-3 w-3 animate-pulse rounded-full bg-green-400" />
        <span className="text-xl font-bold">{playerCount} players waiting</span>
      </div>
      <p className="max-w-xs text-white/60">Sit tight — the host will start the game soon.</p>
    </div>
  );
}
