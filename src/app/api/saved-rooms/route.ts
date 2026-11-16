import { NextResponse } from "next/server";
import { currentUser } from "@/lib/security";
import { query } from "@/lib/db";
import { errorResponse, requireDatabase } from "@/lib/http";
import { jsonObject } from "@/lib/http";

export async function GET() {
  const unavailable = requireDatabase();
  if (unavailable) return unavailable;
  const user = await currentUser();
  if (!user) return errorResponse("Please sign in to view saved rooms.", 401);
  const result = await query(
    `SELECT s.id, s.room_code, s.area, s.rent, s.security_deposit, s.room_type, s.audience, s.facilities, s.distance_geu, s.is_available, s.created_at,
      COALESCE(array_agg(i.id ORDER BY i.position) FILTER (WHERE i.id IS NOT NULL), '{}') AS images
     FROM saved_rooms saved
     JOIN owner_submissions s ON s.id = saved.submission_id
     LEFT JOIN room_images i ON i.submission_id = s.id
     WHERE saved.user_id = $1 AND s.status IN ('Approved', 'Booked')
     GROUP BY s.id, saved.created_at ORDER BY saved.created_at DESC`,
    [user.id],
  );
  return NextResponse.json({ rooms: result.rows });
}

export async function POST(request: Request) {
  const unavailable = requireDatabase();
  if (unavailable) return unavailable;
  const user = await currentUser();
  if (!user) return errorResponse("Please sign in to save rooms.", 401);
  const body: unknown = await request.json().catch(() => null);
  if (!jsonObject(body) || typeof body.roomId !== "string") return errorResponse("Choose a room to save.");
  const result = await query(
    `INSERT INTO saved_rooms (user_id, submission_id)
     SELECT $1, id FROM owner_submissions WHERE id = $2 AND status IN ('Approved', 'Booked')
     ON CONFLICT (user_id, submission_id) DO UPDATE SET submission_id = EXCLUDED.submission_id
     RETURNING submission_id`,
    [user.id, body.roomId],
  );
  if (result.rowCount === 0) return errorResponse("That room is no longer available.", 404);
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  const unavailable = requireDatabase();
  if (unavailable) return unavailable;
  const user = await currentUser();
  if (!user) return errorResponse("Please sign in to update saved rooms.", 401);
  const body: unknown = await request.json().catch(() => null);
  if (!jsonObject(body) || typeof body.roomId !== "string") return errorResponse("Choose a room to remove.");
  await query("DELETE FROM saved_rooms WHERE user_id = $1 AND submission_id = $2", [user.id, body.roomId]);
  return NextResponse.json({ ok: true });
}
