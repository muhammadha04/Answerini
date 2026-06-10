import { NextResponse } from "next/server";
import { joinRoom } from "@/lib/game";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ pin: string }> }
) {
  const { pin } = await params;
  try {
    const body = await request.json();
    const result = await joinRoom(pin, body.name, body.playerId);
    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json({
      playerId: result.player.id,
      name: result.player.name,
      pin: result.room.pin,
    });
  } catch {
    return NextResponse.json({ error: "Failed to join." }, { status: 500 });
  }
}
