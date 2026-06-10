import { NextResponse } from "next/server";
import {
  addQuestion,
  endGame,
  hostNext,
  kickPlayer,
  removeQuestion,
  resetToLobby,
  startGame,
  updateSettings,
} from "@/lib/game";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ pin: string }> }
) {
  const { pin } = await params;
  try {
    const body = await request.json();
    const { action, hostToken, ...data } = body as {
      action: string;
      hostToken: string;
      [key: string]: unknown;
    };

    if (!hostToken) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    let result;

    switch (action) {
      case "addQuestion":
        result = await addQuestion(pin, hostToken, data as never);
        break;
      case "removeQuestion":
        result = await removeQuestion(pin, hostToken, data.questionId as string);
        break;
      case "updateSettings":
        result = await updateSettings(pin, hostToken, data.settings as never);
        break;
      case "start":
        result = await startGame(pin, hostToken);
        break;
      case "next":
        result = await hostNext(pin, hostToken);
        break;
      case "kick":
        result = await kickPlayer(pin, hostToken, data.playerId as string);
        break;
      case "end":
        result = await endGame(pin, hostToken);
        break;
      case "reset":
        result = await resetToLobby(pin, hostToken);
        break;
      default:
        return NextResponse.json({ error: "Unknown action." }, { status: 400 });
    }

    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Host action failed." }, { status: 500 });
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ pin: string }> }
) {
  const { pin } = await params;
  const hostToken = request.headers.get("x-host-token");
  if (!hostToken) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { getRoomByPin } = await import("@/lib/store");
  const room = await getRoomByPin(pin);
  if (!room || room.hostToken !== hostToken) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  return NextResponse.json({
    questions: room.questions,
    settings: room.settings,
    hostToken: room.hostToken,
    savedGameId: room.savedGameId ?? null,
    shortLink: room.shortLink ?? null,
  });
}
