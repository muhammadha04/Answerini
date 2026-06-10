import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { HostLibrary } from "@/components/HostLibrary";

export default async function HostPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/host");
  }

  const { data: games } = await supabase
    .from("saved_games")
    .select("*, saved_questions(count)")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black">My Quiz Games</h1>
          <p className="mt-1 text-white/60">Build once, host many times</p>
        </div>
        <Link
          href="/host/games/new"
          className="rounded-xl bg-[#26890C] px-5 py-3 font-bold text-white hover:bg-green-600"
        >
          + New Game
        </Link>
      </div>

      <HostLibrary games={games ?? []} />
    </div>
  );
}
