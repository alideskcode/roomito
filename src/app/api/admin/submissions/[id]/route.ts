import { NextResponse } from "next/server";
import { transaction, query } from "@/lib/db";
import { requireAdmin, errorResponse, jsonObject } from "@/lib/http";
import { text } from "@/lib/validation";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const { id } = await context.params;
  const body: unknown = await request.json().catch(() => null);
  if (!jsonObject(body)) return errorResponse("Invalid submission update.");
  const action = body.action;
  if (action === "cancel") {
    const result = await query(
      "UPDATE owner_submissions SET status = 'Cancelled' WHERE id = $1 AND status = 'Pending' RETURNING id",
      [id],
    );
    return result.rowCount ? NextResponse.json({ ok: true }) : errorResponse("Only pending submissions can be cancelled.", 409);
  }
  if (action !== "apply") return errorResponse("Choose Apply or Cancel.");
  const username = text(typeof body.username === "string" ? body.username : "", 80);
  try {
    const roomCode = await transaction(async (client) => {
      await client.query("SELECT pg_advisory_xact_lock(hashtext('rentrooms_room_code'))");
      const current = await client.query<{ area: string; status: string }>(
        "SELECT area, status FROM owner_submissions WHERE id = $1 FOR UPDATE",
        [id],
      );
      if (!current.rows[0] || current.rows[0].status !== "Pending") throw new Error("This submission is no longer pending.");
      const next = await client.query<{ number: number }>(
        `SELECT COALESCE(MAX(SUBSTRING(room_code FROM 5)::int), 100) + 1 AS number
         FROM owner_submissions WHERE room_code LIKE 'DDN-%'`,
      );
      const code = `DDN-${next.rows[0].number}`;
      await client.query(
        `UPDATE owner_submissions SET room_code = $1, status = 'Approved', is_available = TRUE,
          approved_at = NOW(), username = $2 WHERE id = $3`,
        [code, username, id],
      );
      await client.query(
        "INSERT INTO areas (name) VALUES ($1) ON CONFLICT (name) DO NOTHING",
        [current.rows[0].area],
      );
      return code;
    });
    return NextResponse.json({ ok: true, roomCode });
  } catch (error) {
    if (error instanceof Error && error.message === "This submission is no longer pending.") {
      return errorResponse(error.message, 409);
    }
    console.error("Could not approve room submission:", error);
    return errorResponse("We couldn't approve this room. Please try again.", 500);
  }
}
