import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { requireAdmin, errorResponse, jsonObject } from "@/lib/http";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const { id } = await context.params;
  const body: unknown = await request.json().catch(() => null);
  if (!jsonObject(body) || !["New", "Contacted", "Closed"].includes(String(body.status))) {
    return errorResponse("Choose New, Contacted, or Closed.");
  }
  const result = await query("UPDATE renter_requests SET status = $1 WHERE id = $2 RETURNING id", [body.status, id]);
  return result.rowCount ? NextResponse.json({ ok: true }) : errorResponse("Request not found.", 404);
}
