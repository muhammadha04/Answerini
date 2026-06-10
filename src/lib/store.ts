import { Redis } from "@upstash/redis";
import type { Room } from "./types";
import { ROOM_TTL_SECONDS } from "./constants";
import { getSupabaseAdmin } from "./supabase/admin";

const memoryStore = new Map<string, Room>();
const pinIndex = new Map<string, string>();

function getRedis(): Redis | null {
  const url =
    process.env.UPSTASH_REDIS_REST_URL?.trim() ||
    process.env.KV_REST_API_URL?.trim();
  const token =
    process.env.UPSTASH_REDIS_REST_TOKEN?.trim() ||
    process.env.KV_REST_API_TOKEN?.trim();
  if (!url || !token) return null;
  return new Redis({ url, token });
}

const redis = getRedis();

function roomKey(id: string) {
  return `room:${id}`;
}

function pinKey(pin: string) {
  return `pin:${pin}`;
}

function expiresAtIso() {
  return new Date(Date.now() + ROOM_TTL_SECONDS * 1000).toISOString();
}

async function saveRoomSupabase(room: Room): Promise<boolean> {
  const admin = getSupabaseAdmin();
  if (!admin) return false;

  const { error } = await admin.from("live_rooms").upsert(
    {
      pin: room.pin,
      room_id: room.id,
      room_data: room,
      expires_at: expiresAtIso(),
    },
    { onConflict: "pin" }
  );

  return !error;
}

async function getRoomByPinSupabase(pin: string): Promise<Room | null> {
  const admin = getSupabaseAdmin();
  if (!admin) return null;

  const { data, error } = await admin
    .from("live_rooms")
    .select("room_data, expires_at")
    .eq("pin", pin)
    .maybeSingle();

  if (error || !data) return null;
  if (new Date(data.expires_at).getTime() < Date.now()) {
    await admin.from("live_rooms").delete().eq("pin", pin);
    return null;
  }

  return data.room_data as Room;
}

async function deleteRoomSupabase(pin: string): Promise<void> {
  const admin = getSupabaseAdmin();
  if (!admin) return;
  await admin.from("live_rooms").delete().eq("pin", pin);
}

export async function saveRoom(room: Room): Promise<void> {
  room.version += 1;

  if (redis) {
    await redis.set(roomKey(room.id), room, { ex: ROOM_TTL_SECONDS });
    await redis.set(pinKey(room.pin), room.id, { ex: ROOM_TTL_SECONDS });
    return;
  }

  if (await saveRoomSupabase(room)) {
    return;
  }

  memoryStore.set(room.id, structuredClone(room));
  pinIndex.set(room.pin, room.id);
}

export async function getRoomById(id: string): Promise<Room | null> {
  if (redis) {
    return (await redis.get<Room>(roomKey(id))) ?? null;
  }

  for (const room of memoryStore.values()) {
    if (room.id === id) return structuredClone(room);
  }
  return null;
}

export async function getRoomByPin(pin: string): Promise<Room | null> {
  if (redis) {
    const id = await redis.get<string>(pinKey(pin));
    if (!id) return null;
    return getRoomById(id);
  }

  const fromSupabase = await getRoomByPinSupabase(pin);
  if (fromSupabase) return fromSupabase;

  const id = pinIndex.get(pin);
  if (!id) return null;
  return getRoomById(id);
}

export async function deleteRoom(id: string, pin: string): Promise<void> {
  if (redis) {
    await redis.del(roomKey(id), pinKey(pin));
    return;
  }

  await deleteRoomSupabase(pin);
  memoryStore.delete(id);
  pinIndex.delete(pin);
}

export function isUsingRedis(): boolean {
  return redis !== null;
}

export function isUsingPersistentStore(): boolean {
  return redis !== null || getSupabaseAdmin() !== null;
}

export function getStoreBackend(): "redis" | "supabase" | "memory" {
  if (redis) return "redis";
  if (getSupabaseAdmin()) return "supabase";
  return "memory";
}
