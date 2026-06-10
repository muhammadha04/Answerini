"use client";

import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/host";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    router.push(next);
    router.refresh();
  };

  return (
    <div className="mx-auto max-w-md">
      <h1 className="mb-2 text-center text-3xl font-black">Login</h1>
      <p className="mb-8 text-center text-white/60">Access your saved quiz games</p>

      <form onSubmit={handleLogin} className="space-y-4 rounded-3xl bg-white/10 p-6 backdrop-blur">
        <div>
          <label className="mb-1 block text-sm font-semibold text-white/70">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl border-0 bg-white/10 px-4 py-3 text-white outline-none focus:ring-2 focus:ring-purple-400"
            required
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-semibold text-white/70">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl border-0 bg-white/10 px-4 py-3 text-white outline-none focus:ring-2 focus:ring-purple-400"
            required
          />
        </div>
        {error && <p className="text-center text-sm text-red-300">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-purple-600 py-4 text-lg font-black text-white hover:bg-purple-500 disabled:opacity-50"
        >
          {loading ? "Signing in…" : "Sign In"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-white/60">
        No account?{" "}
        <Link href="/signup" className="font-bold text-yellow-300 hover:underline">
          Sign up
        </Link>
      </p>
    </div>
  );
}
