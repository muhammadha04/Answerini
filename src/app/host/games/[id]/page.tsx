import { redirect } from "next/navigation";
import { GameBuilder } from "@/components/GameBuilder";
import { createClient } from "@/lib/supabase/server";

export default async function EditGamePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/host");
  }

  const { data: game } = await supabase
    .from("saved_games")
    .select("id")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!game) {
    redirect("/host");
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-black">Edit Quiz</h1>
      <GameBuilder gameId={id} />
    </div>
  );
}
