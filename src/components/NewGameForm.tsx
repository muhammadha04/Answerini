"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function NewGameForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createGame = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await fetch("/api/games", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: title || "Untitled Quiz" }),
    });
    const data = await res.json();

    if (!res.ok) {
      setError(data.error ?? "Failed to create game");
      setLoading(false);
      return;
    }

    router.push(`/host/games/${data.game.id}`);
  };

  return (
    <form onSubmit={createGame} className="space-y-4 rounded-3xl bg-white/10 p-6 backdrop-blur">
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
        {loading ? "Creating…" : "Create & Add Questions"}
      </button>
    </form>
  );
}
