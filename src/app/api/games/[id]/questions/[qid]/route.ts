import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type Params = { params: Promise<{ id: string; qid: string }> };

export async function DELETE(_request: Request, { params }: Params) {
  const { id: gameId, qid } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: game } = await supabase
    .from("saved_games")
    .select("id")
    .eq("id", gameId)
    .eq("user_id", user.id)
    .single();

  if (!game) {
    return NextResponse.json({ error: "Game not found" }, { status: 404 });
  }

  const { error } = await supabase
    .from("saved_questions")
    .delete()
    .eq("id", qid)
    .eq("game_id", gameId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
