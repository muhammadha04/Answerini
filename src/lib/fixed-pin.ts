import type { SupabaseClient } from "@supabase/supabase-js";
import { generatePin, isValidPin } from "./pin";
import { deleteLiveRoomByPin, getRoomByPin } from "./store";

/** Drop live room if its saved game was deleted (orphaned session). */
export async function releaseOrphanedLiveRoom(
  supabase: SupabaseClient,
  pin: string
): Promise<void> {
  const live = await getRoomByPin(pin);
  if (!live?.savedGameId) return;

  const { data } = await supabase
    .from("saved_games")
    .select("id")
    .eq("id", live.savedGameId)
    .maybeSingle();

  if (!data) {
    await deleteLiveRoomByPin(pin);
  }
}

async function isPinAvailable(
  supabase: SupabaseClient,
  pin: string,
  excludeGameId?: string
): Promise<boolean> {
  await releaseOrphanedLiveRoom(supabase, pin);

  let query = supabase.from("saved_games").select("id").eq("fixed_pin", pin);
  if (excludeGameId) query = query.neq("id", excludeGameId);
  const { data } = await query.maybeSingle();
  if (data) return false;

  const live = await getRoomByPin(pin);
  if (!live) return true;

  if (live.savedGameId === excludeGameId) return true;

  return false;
}

export async function generateUniqueFixedPin(
  supabase: SupabaseClient,
  excludeGameId?: string
): Promise<string> {
  for (let attempt = 0; attempt < 50; attempt++) {
    const pin = generatePin();
    if (await isPinAvailable(supabase, pin, excludeGameId)) return pin;
  }
  throw new Error("Could not generate a unique room code. Try again.");
}

export async function assignFixedPin(
  supabase: SupabaseClient,
  gameId: string,
  userId: string,
  customPin?: string
): Promise<{ pin: string } | { error: string }> {
  if (customPin !== undefined) {
    const trimmed = customPin.replace(/\D/g, "").slice(0, 6);
    if (!isValidPin(trimmed)) {
      return { error: "Room code must be exactly 6 digits." };
    }

    if (!(await isPinAvailable(supabase, trimmed, gameId))) {
      return { error: "That room code is already in use." };
    }

    const { error } = await supabase
      .from("saved_games")
      .update({ fixed_pin: trimmed })
      .eq("id", gameId)
      .eq("user_id", userId);

    if (error) return { error: error.message };
    return { pin: trimmed };
  }

  try {
    const pin = await generateUniqueFixedPin(supabase, gameId);
    const { error } = await supabase
      .from("saved_games")
      .update({ fixed_pin: pin })
      .eq("id", gameId)
      .eq("user_id", userId);

    if (error) return { error: error.message };
    return { pin };
  } catch {
    return { error: "Could not generate a unique room code." };
  }
}

export async function clearFixedPin(
  supabase: SupabaseClient,
  gameId: string,
  userId: string
): Promise<{ error?: string }> {
  const { data: game } = await supabase
    .from("saved_games")
    .select("fixed_pin")
    .eq("id", gameId)
    .eq("user_id", userId)
    .single();

  const { error } = await supabase
    .from("saved_games")
    .update({ fixed_pin: null })
    .eq("id", gameId)
    .eq("user_id", userId);

  if (error) return { error: error.message };

  if (game?.fixed_pin) {
    await deleteLiveRoomByPin(game.fixed_pin);
  }

  return {};
}
