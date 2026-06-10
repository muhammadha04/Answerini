"use client";

import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export function AuthNav() {
  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setEmail(data.user?.email ?? null);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setEmail(session?.user?.email ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const logout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  if (loading) return null;

  if (!email) {
    return (
      <Link href="/login" className="rounded-full bg-white/15 px-4 py-1.5 hover:bg-white/25">
        Login
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <Link href="/host" className="text-white/80 hover:text-white">
        My Games
      </Link>
      <span className="hidden text-xs text-white/50 sm:inline">{email}</span>
      <button
        type="button"
        onClick={logout}
        className="rounded-full bg-white/10 px-3 py-1 text-xs hover:bg-white/20"
      >
        Logout
      </button>
    </div>
  );
}
