import { NextResponse } from "next/server";
import { currentUser } from "@/lib/security";
import { query } from "@/lib/db";
import { errorResponse, requireDatabase } from "@/lib/http";

export async function GET() {
  const unavailable = requireDatabase();
  if (unavailable) return unavailable;
  const user = await currentUser();
  if (!user) return errorResponse("Please sign in to view your dashboard.", 401);
  const [rooms, requests] = await Promise.all([
    query(
      `SELECT id, room_code, area, rent, status, created_at FROM owner_submissions
       WHERE submitted_by = $1 ORDER BY created_at DESC`,
      [user.id],
    ),
    query(
      `SELECT id, preferred_area, budget_min, budget_max, status, created_at FROM renter_requests
       WHERE submitted_by = $1 ORDER BY created_at DESC`,
      [user.id],
    ),
  ]);
  return NextResponse.json({ user, rooms: rooms.rows, requests: requests.rows });
}
