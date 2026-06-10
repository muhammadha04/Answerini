import Link from "next/link";

export default function HomePage() {
  return (
    <div className="flex flex-col items-center gap-12 py-12 text-center">
      <div className="animate-float">
        <h1 className="text-5xl font-black md:text-7xl">
          Answer<span className="text-yellow-300">ini</span>
        </h1>
        <p className="mt-3 text-lg text-white/70 md:text-xl">
          Free live quiz games for up to 500 players
        </p>
      </div>

      <div className="grid w-full max-w-2xl gap-4 sm:grid-cols-2">
        <Link
          href="/join"
          className="group rounded-3xl bg-[#1368CE] p-8 shadow-xl transition-transform hover:scale-[1.02]"
        >
          <span className="text-4xl">🎮</span>
          <h2 className="mt-4 text-2xl font-black">Join a Game</h2>
          <p className="mt-2 text-white/80">Enter the PIN from your host</p>
        </Link>
        <Link
          href="/host"
          className="group rounded-3xl bg-[#26890C] p-8 shadow-xl transition-transform hover:scale-[1.02]"
        >
          <span className="text-4xl">🎯</span>
          <h2 className="mt-4 text-2xl font-black">Host a Game</h2>
          <p className="mt-2 text-white/80">Login, build saved quizzes, go live</p>
        </Link>
      </div>

      <div className="max-w-xl space-y-3 text-sm text-white/60">
        <p>
          Answerini is a free alternative to Kahoot — no player limits on paid tiers,
          no account required for players, and built for large events (300+ participants).
        </p>
        <ul className="flex flex-wrap justify-center gap-x-6 gap-y-1">
          <li>✓ Real-time scoring</li>
          <li>✓ Top 5 leaderboards</li>
          <li>✓ Speed-based points</li>
          <li>✓ Vercel-ready</li>
        </ul>
      </div>
    </div>
  );
}
