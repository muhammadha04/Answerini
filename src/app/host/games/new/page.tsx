import { redirect } from "next/navigation";
import NewGameForm from "@/components/NewGameForm";
import { createClient } from "@/lib/supabase/server";

export default async function NewGamePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/host/games/new");
  }

  return (
    <div className="mx-auto max-w-md">
      <h1 className="mb-2 text-center text-3xl font-black">New Quiz Game</h1>
      <p className="mb-8 text-center text-white/60">Name your game, then add questions</p>
      <NewGameForm />
    </div>
  );
}
