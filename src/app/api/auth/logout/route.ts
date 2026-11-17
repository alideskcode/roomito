import { NextResponse } from "next/server";
import { clearUserSession } from "@/lib/security";
import { cookies } from "next/headers";

export async function POST() {
  const cookieStore = await cookies();
  for (const { name } of cookieStore.getAll()) {
    if (name.startsWith("sb-") && /-auth-token(?:\.\d+)?$/.test(name)) {
      cookieStore.set(name, "", {
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 0,
      });
    }
  }
  await clearUserSession();
  return NextResponse.json({ ok: true });
}
