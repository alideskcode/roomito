import { NextResponse } from "next/server";
import { clearUserSession } from "@/lib/security";

export async function POST() {
  await clearUserSession();
  return NextResponse.json({ ok: true });
}
