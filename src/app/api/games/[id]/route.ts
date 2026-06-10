import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { assignFixedPin, clearFixedPin } from "@/lib/fixed-pin";
import { rowToQuestion } from "@/lib/saved-games";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("saved_games")
    .select("*, saved_questions(*)")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Game not found" }, { status: 404 });
  }

  const questions = (data.saved_questions ?? [])
    .sort((a: { sort_order: number }, b: { sort_order: number }) => a.sort_order - b.sort_order)
    .map(rowToQuestion);

  return NextResponse.json({
    game: {
      id: data.id,
      title: data.title,
      description: data.description,
      settings: data.settings,
      fixedPin: data.fixed_pin ?? null,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    },
    questions,
  });
}

export async function PATCH(request: Request, { params }: Params) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();

  if (body.enableFixedPin === true) {
    const result = await assignFixedPin(
      supabase,
      id,
      user.id,
      body.customPin as string | undefined
    );
    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json({ fixedPin: result.pin });
  }

  if (body.enableFixedPin === false) {
    const result = await clearFixedPin(supabase, id, user.id);
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }
    return NextResponse.json({ fixedPin: null });
  }

  const updates: Record<string, unknown> = {};
  if (body.title !== undefined) updates.title = String(body.title).trim();
  if (body.description !== undefined) updates.description = String(body.description).trim();
  if (body.settings !== undefined) updates.settings = body.settings;

  const { data, error } = await supabase
    .from("saved_games")
    .update(updates)
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ game: data });
}

export async function DELETE(_request: Request, { params }: Params) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { error } = await supabase.from("saved_games").delete().eq("id", id).eq("user_id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
