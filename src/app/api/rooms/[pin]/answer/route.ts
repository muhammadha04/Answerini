import { NextResponse } from "next/server";
import { submitAnswer } from "@/lib/game";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ pin: string }> }
) {
  const { pin } = await params;
  try {
    const body = await request.json();
    const result = await submitAnswer(pin, body.playerId, body.optionId);
    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json({
      ok: true,
      phase: result.room.phase,
      version: result.room.version,
    });
  } catch {
    return NextResponse.json({ error: "Failed to submit." }, { status: 500 });
  }
}
