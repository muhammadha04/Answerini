import { NextResponse } from "next/server";
import { tickRoom, toPublicState } from "@/lib/game";
import { getRoomByPin } from "@/lib/store";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ pin: string }> }
) {
  const { pin } = await params;
  await tickRoom(pin);
  const room = await getRoomByPin(pin);
  if (!room) {
    return NextResponse.json({ error: "Room not found." }, { status: 404 });
  }
  return NextResponse.json(toPublicState(room));
}
