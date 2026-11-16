import { del } from "@vercel/blob";
import { NextResponse } from "next/server";
import { query, transaction } from "@/lib/db";
import { requireAdmin, errorResponse, jsonObject } from "@/lib/http";
import { safeInteger, text, titleCaseArea } from "@/lib/validation";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const { id } = await context.params;
  const body: unknown = await request.json().catch(() => null);
  if (!jsonObject(body)) return errorResponse("Invalid room update.");

  if (body.availability === "Booked" || body.availability === "Available") {
    const status = body.availability === "Booked" ? "Booked" : "Approved";
    const result = await query(
      "UPDATE owner_submissions SET status = $1, is_available = $2 WHERE id = $3 AND status IN ('Approved', 'Booked') RETURNING id",
      [status, body.availability === "Available", id],
    );
    return result.rowCount ? NextResponse.json({ ok: true }) : errorResponse("Room not found.", 404);
  }

  const area = titleCaseArea(text(typeof body.area === "string" ? body.area : "", 100));
  const rent = safeInteger(String(body.rent ?? ""), 1);
  const deposit = safeInteger(String(body.deposit ?? ""), 0);
  const username = text(typeof body.username === "string" ? body.username : "", 80);
  const distance = text(typeof body.distance === "string" ? body.distance : "", 60);
  const facilities = Array.isArray(body.facilities) ? body.facilities.map((item) => text(String(item), 40)) : [];
  if (!area || rent === null || deposit === null || facilities.length > 20) return errorResponse("Enter a valid area, rent, and security deposit.");
  const updated = await transaction(async (client) => {
    const result = await client.query(
      `UPDATE owner_submissions SET area = $1, rent = $2, security_deposit = $3, username = $4,
        distance_geu = $5, facilities = $6 WHERE id = $7 AND status IN ('Approved', 'Booked') RETURNING id`,
      [area, rent, deposit, username, distance, facilities, id],
    );
    if (!result.rowCount) return false;
    await client.query("INSERT INTO areas (name) VALUES ($1) ON CONFLICT (name) DO NOTHING", [area]);
    return true;
  });
  if (!updated) return errorResponse("Room not found.", 404);
  return NextResponse.json({ ok: true });
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const { id } = await context.params;
  const images = await query<{ blob_url: string }>("SELECT blob_url FROM room_images WHERE submission_id = $1", [id]);
  try {
    await transaction(async (client) => {
      const deleted = await client.query("DELETE FROM owner_submissions WHERE id = $1 AND status IN ('Approved', 'Booked') RETURNING id", [id]);
      if (!deleted.rowCount) throw new Error("Room not found.");
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Room not found.") return errorResponse(error.message, 404);
    throw error;
  }
  for (const image of images.rows) {
    try {
      await del(image.blob_url);
    } catch (error) {
      console.error("Could not delete room image from Blob:", error);
    }
  }
  return NextResponse.json({ ok: true });
}
