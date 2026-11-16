import { NextResponse } from "next/server";
import { getPublicRoom } from "@/lib/rooms";
import { errorResponse } from "@/lib/http";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  try {
    const room = await getPublicRoom(id);
    return room ? NextResponse.json({ room }) : errorResponse("Room not found.", 404);
  } catch (error) {
    console.error("Could not load room:", error);
    return errorResponse("Room details are unavailable right now.", 503);
  }
}
