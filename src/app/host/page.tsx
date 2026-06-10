"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function HostPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title || "Answerini Game" }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to create room");
        return;
      }
      localStorage.setItem(`answerini-host-${data.pin}`, data.hostToken);
      router.push(`/host/${data.pin}`);
    } catch {
      setError("Network error. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="mb-2 text-center text-3xl font-black">Host a Game</h1>
      <p className="mb-8 text-center text-white/60">
        Create a room, add questions, and share the PIN with players
      </p>

      <form onSubmit={createRoom} className="space-y-4 rounded-3xl bg-white/10 p-6 backdrop-blur">
        <div>
          <label className="mb-1 block text-sm font-semibold text-white/70">Game title</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value.slice(0, 60))}
            placeholder="e.g. Team Quiz Night"
            className="w-full rounded-xl border-0 bg-white/10 px-4 py-3 text-white outline-none focus:ring-2 focus:ring-green-400"
          />
        </div>
        {error && <p className="text-center text-sm text-red-300">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-[#26890C] py-4 text-lg font-black text-white hover:bg-green-600 disabled:opacity-50"
        >
          {loading ? "Creating…" : "Create Room"}
        </button>
      </form>

      <div className="mt-8 rounded-2xl bg-white/5 p-5 text-sm text-white/60">
        <h2 className="mb-2 font-bold text-white">Host checklist</h2>
        <ol className="list-inside list-decimal space-y-1">
          <li>Create room and note your PIN</li>
          <li>Add multiple-choice questions</li>
          <li>Share PIN at answerini.app/join (or your domain)</li>
          <li>Wait for players, then start the game</li>
          <li>Advance through questions and leaderboards</li>
        </ol>
      </div>
    </div>
  );
}
