"use client";

import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function SignupPage() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    const supabase = createClient();
    const { data, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { display_name: displayName.trim() || email.split("@")[0] },
      },
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    if (data.session) {
      router.push("/host");
      router.refresh();
      return;
    }

    setMessage("Check your email to confirm your account, then log in.");
    setLoading(false);
  };

  return (
    <div className="mx-auto max-w-md">
      <h1 className="mb-2 text-center text-3xl font-black">Sign Up</h1>
      <p className="mb-8 text-center text-white/60">Create an account to save quiz games</p>

      <form onSubmit={handleSignup} className="space-y-4 rounded-3xl bg-white/10 p-6 backdrop-blur">
        <div>
          <label className="mb-1 block text-sm font-semibold text-white/70">Display name</label>
          <input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value.slice(0, 30))}
            placeholder="Your name"
            className="w-full rounded-xl border-0 bg-white/10 px-4 py-3 text-white outline-none focus:ring-2 focus:ring-green-400"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-semibold text-white/70">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl border-0 bg-white/10 px-4 py-3 text-white outline-none focus:ring-2 focus:ring-green-400"
            required
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-semibold text-white/70">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={6}
            className="w-full rounded-xl border-0 bg-white/10 px-4 py-3 text-white outline-none focus:ring-2 focus:ring-green-400"
            required
          />
        </div>
        {error && <p className="text-center text-sm text-red-300">{error}</p>}
        {message && <p className="text-center text-sm text-green-300">{message}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-[#26890C] py-4 text-lg font-black text-white hover:bg-green-600 disabled:opacity-50"
        >
          {loading ? "Creating account…" : "Create Account"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-white/60">
        Already have an account?{" "}
        <Link href="/login" className="font-bold text-yellow-300 hover:underline">
          Log in
        </Link>
      </p>
    </div>
  );
}
