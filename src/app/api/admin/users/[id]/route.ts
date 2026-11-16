import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { requireAdmin, errorResponse, jsonObject } from "@/lib/http";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const { id } = await context.params;
  const body: unknown = await request.json().catch(() => null);
  if (!jsonObject(body) || typeof body.blocked !== "boolean") return errorResponse("Choose whether the account should be blocked.");
  const result = await query("UPDATE users SET is_blocked = $1 WHERE id = $2 RETURNING id", [body.blocked, id]);
  return result.rowCount ? NextResponse.json({ ok: true }) : errorResponse("User not found.", 404);
}
