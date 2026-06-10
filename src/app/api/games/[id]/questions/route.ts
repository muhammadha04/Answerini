import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateId } from "@/lib/pin";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  const { id: gameId } = await params;
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

  const body = await request.json();
  const text = (body.text as string)?.trim();
  const rawOptions = body.options as { text: string }[];
  const correctIndex = body.correctIndex as number;
  const timeLimit = (body.timeLimit as number) ?? 20;

  if (!text) {
    return NextResponse.json({ error: "Question text is required" }, { status: 400 });
  }

  const options = rawOptions.filter((o) => o.text?.trim());
  if (options.length < 2) {
    return NextResponse.json({ error: "At least 2 answers required" }, { status: 400 });
  }
  if (correctIndex < 0 || correctIndex >= options.length) {
    return NextResponse.json({ error: "Invalid correct answer" }, { status: 400 });
  }

  const mappedOptions = options.map((o) => ({ id: generateId(), text: o.text.trim() }));
  const correctOptionId = mappedOptions[correctIndex].id;

  const { count } = await supabase
    .from("saved_questions")
    .select("*", { count: "exact", head: true })
    .eq("game_id", gameId);

  const { data, error } = await supabase
    .from("saved_questions")
    .insert({
      game_id: gameId,
      sort_order: count ?? 0,
      text,
      options: mappedOptions,
      correct_option_id: correctOptionId,
      time_limit: timeLimit,
      image_url: body.imageUrl ?? null,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await supabase.from("saved_games").update({ updated_at: new Date().toISOString() }).eq("id", gameId);

  return NextResponse.json({ question: data });
}
