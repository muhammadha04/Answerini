import { Redis } from "@upstash/redis";
import type { Room } from "./types";
import { ROOM_TTL_SECONDS } from "./constants";

const memoryStore = new Map<string, Room>();
const pinIndex = new Map<string, string>();

function getRedis(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
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

export async function saveRoom(room: Room): Promise<void> {
  room.version += 1;
  if (redis) {
    await redis.set(roomKey(room.id), room, { ex: ROOM_TTL_SECONDS });
    await redis.set(pinKey(room.pin), room.id, { ex: ROOM_TTL_SECONDS });
    return;
  }
  memoryStore.set(room.id, structuredClone(room));
  pinIndex.set(room.pin, room.id);
}

export async function getRoomById(id: string): Promise<Room | null> {
  if (redis) {
    return (await redis.get<Room>(roomKey(id))) ?? null;
  }
  const room = memoryStore.get(id);
  return room ? structuredClone(room) : null;
}

export async function getRoomByPin(pin: string): Promise<Room | null> {
  if (redis) {
    const id = await redis.get<string>(pinKey(pin));
    if (!id) return null;
    return getRoomById(id);
  }
  const id = pinIndex.get(pin);
  if (!id) return null;
  return getRoomById(id);
}

export async function deleteRoom(id: string, pin: string): Promise<void> {
  if (redis) {
    await redis.del(roomKey(id), pinKey(pin));
    return;
  }
  memoryStore.delete(id);
  pinIndex.delete(pin);
}

export function isUsingRedis(): boolean {
  return redis !== null;
}
