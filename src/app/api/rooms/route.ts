import { NextResponse } from "next/server";
import { listPublicRooms } from "@/lib/rooms";
import { PINNED_AREAS } from "@/lib/constants";
import { errorResponse } from "@/lib/http";

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const maxBudget = Number(params.get("maxBudget") || 0);
  try {
    const rooms = await listPublicRooms({
      area: params.get("area") || undefined,
      maxBudget: Number.isSafeInteger(maxBudget) ? maxBudget : undefined,
      type: params.get("type") || undefined,
      audience: params.get("for") || undefined,
      sort: params.get("sort") || undefined,
    });
    return NextResponse.json({ rooms });
  } catch (error) {
    console.error("Could not load public rooms:", error);
    return errorResponse("Rooms are unavailable right now. Please try again shortly.", 503);
  }
}

export async function OPTIONS() {
  return NextResponse.json({ areas: PINNED_AREAS.map((name) => ({ name, count: 0 })) });
}
