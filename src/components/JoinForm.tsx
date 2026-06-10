"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function JoinForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pinFromUrl = searchParams.get("pin")?.replace(/\D/g, "").slice(0, 6) ?? "";

  const [pin, setPin] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fromInvite, setFromInvite] = useState(false);

  useEffect(() => {
    if (pinFromUrl.length === 6) {
      setPin(pinFromUrl);
      setFromInvite(true);
    }
  }, [pinFromUrl]);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const cleanPin = pin.replace(/\s/g, "");
    const existingId = sessionStorage.getItem(`answerini-player-${cleanPin}`);

    try {
      const res = await fetch(`/api/rooms/${cleanPin}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, playerId: existingId ?? undefined }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not join");
        return;
      }
      sessionStorage.setItem(`answerini-player-${cleanPin}`, data.playerId);
      router.push(`/play/${cleanPin}`);
    } catch {
      setError("Network error. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-md">
      <h1 className="mb-2 text-center text-3xl font-black">Join a Game</h1>
      {fromInvite && pin.length === 6 ? (
        <p className="mb-8 text-center text-white/60">
          You&apos;ve been invited! Enter your nickname to join.
        </p>
      ) : (
        <p className="mb-8 text-center text-white/60">Enter the 6-digit PIN from your host</p>
      )}

      <form onSubmit={handleJoin} className="space-y-4 rounded-3xl bg-white/10 p-6 backdrop-blur">
        <div>
          <label className="mb-1 block text-sm font-semibold text-white/70">Game PIN</label>
          {fromInvite && pin.length === 6 ? (
            <div className="rounded-xl bg-white/10 px-4 py-4 text-center font-mono text-3xl tracking-[0.4em] text-white">
              {pin}
            </div>
          ) : (
            <input
              value={pin}
              onChange={(e) => {
                setFromInvite(false);
                setPin(e.target.value.replace(/\D/g, "").slice(0, 6));
              }}
              placeholder="123456"
              inputMode="numeric"
              className="w-full rounded-xl border-0 bg-white/10 px-4 py-4 text-center font-mono text-3xl tracking-[0.4em] text-white outline-none focus:ring-2 focus:ring-blue-400"
              required
            />
          )}
          {fromInvite && (
            <button
              type="button"
              onClick={() => setFromInvite(false)}
              className="mt-2 text-xs text-white/50 underline hover:text-white/80"
            >
              Enter a different PIN
            </button>
          )}
        </div>
        <div>
          <label className="mb-1 block text-sm font-semibold text-white/70">Nickname</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value.slice(0, 20))}
            placeholder="Your name"
            autoFocus={fromInvite}
            className="w-full rounded-xl border-0 bg-white/10 px-4 py-3 text-white outline-none focus:ring-2 focus:ring-blue-400"
            required
            maxLength={20}
          />
        </div>
        {error && <p className="text-center text-sm text-red-300">{error}</p>}
        <button
          type="submit"
          disabled={loading || pin.length < 6}
          className="w-full rounded-xl bg-[#1368CE] py-4 text-lg font-black text-white hover:bg-blue-600 disabled:opacity-50"
        >
          {loading ? "Joining…" : "Enter"}
        </button>
      </form>
    </div>
  );
}
