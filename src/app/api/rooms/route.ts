import { NextResponse } from "next/server";
import { createRoom, createRoomFromSavedGame } from "@/lib/game";
import { createClient } from "@/lib/supabase/server";
import type { CreateRoomPayload } from "@/lib/types";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as CreateRoomPayload & { savedGameId?: string };

    if (body.savedGameId) {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        return NextResponse.json({ error: "Login required to host saved games." }, { status: 401 });
      }

      const result = await createRoomFromSavedGame(body.savedGameId, user.id, body.title);
      if ("error" in result) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }

      return NextResponse.json({
        pin: result.room.pin,
        roomId: result.room.id,
        hostToken: result.hostToken,
        title: result.room.title,
        questionCount: result.room.questions.length,
      });
    }

    const { room, hostToken } = await createRoom(body);
    return NextResponse.json({
      pin: room.pin,
      roomId: room.id,
      hostToken,
      title: room.title,
      questionCount: room.questions.length,
    });
  } catch {
    return NextResponse.json({ error: "Failed to create room." }, { status: 500 });
  }
}
