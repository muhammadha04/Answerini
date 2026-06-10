import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { RoomSettings } from "@/lib/types";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("saved_games")
    .select("*, saved_questions(count)")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ games: data });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const title = (body.title as string)?.trim() || "Untitled Quiz";
  const description = (body.description as string)?.trim() ?? "";
  const settings = (body.settings as RoomSettings) ?? undefined;

  const { data, error } = await supabase
    .from("saved_games")
    .insert({
      user_id: user.id,
      title,
      description,
      ...(settings ? { settings } : {}),
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ game: data });
}
