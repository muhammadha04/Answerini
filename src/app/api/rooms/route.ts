import { NextResponse } from "next/server";
import { createRoom } from "@/lib/game";
import type { CreateRoomPayload } from "@/lib/types";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as CreateRoomPayload;
    const { room, hostToken } = await createRoom(body);
    return NextResponse.json({
      pin: room.pin,
      roomId: room.id,
      hostToken,
      title: room.title,
    });
  } catch {
    return NextResponse.json({ error: "Failed to create room." }, { status: 500 });
  }
}
