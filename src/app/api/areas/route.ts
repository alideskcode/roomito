import { NextResponse } from "next/server";
import { getAreas } from "@/lib/rooms";
import { PINNED_AREAS } from "@/lib/constants";
import { errorResponse } from "@/lib/http";

export async function GET() {
  if (!process.env.DATABASE_URL) return NextResponse.json({ areas: PINNED_AREAS.map((name) => ({ name, count: 0 })) });
  try {
    return NextResponse.json({ areas: await getAreas() });
  } catch (error) {
    console.error("Could not load areas:", error);
    return errorResponse("Areas are unavailable right now. Please try again shortly.", 503);
  }
}
