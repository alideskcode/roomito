import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/security";

export function errorResponse(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export function requireDatabase() {
  return process.env.DATABASE_URL
    ? null
    : errorResponse("This action requires the Supabase Postgres connection string in DATABASE_URL.", 503);
}

export function publicOrigin(request: Request): string {
  const requestUrl = new URL(request.url);
  if (["localhost", "127.0.0.1", "::1"].includes(requestUrl.hostname)) return requestUrl.origin;
  return process.env.NEXT_PUBLIC_SITE_URL
    ? new URL(process.env.NEXT_PUBLIC_SITE_URL).origin
    : requestUrl.origin;
}

export async function requireAdmin() {
  const unavailable = requireDatabase();
  if (unavailable) return unavailable;
  return (await isAdmin()) ? null : errorResponse("Please sign in as an administrator.", 401);
}

export function jsonObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
