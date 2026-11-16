import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { requireAdmin, errorResponse } from "@/lib/http";

export async function GET(request: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const params = new URL(request.url).searchParams;
  const tab = params.get("tab") || "submissions";
  const search = (params.get("q") || "").trim().slice(0, 100);
  const status = (params.get("status") || "").slice(0, 30);
  const counts = await query(
    `SELECT
      (SELECT COUNT(*)::int FROM owner_submissions WHERE status = 'Pending') AS pending,
      (SELECT COUNT(*)::int FROM owner_submissions WHERE status = 'Approved') AS approved,
      (SELECT COUNT(*)::int FROM owner_submissions WHERE status = 'Cancelled') AS cancelled,
      (SELECT COUNT(*)::int FROM owner_submissions WHERE status = 'Booked') AS booked,
      (SELECT COUNT(*)::int FROM renter_requests WHERE status = 'New') AS new_requests,
      (SELECT COUNT(*)::int FROM users) AS users`,
  );
  const like = `%${search.replace(/[%_\\]/g, "\\$&")}%`;

  if (tab === "requests") {
    const data = await query(
      `SELECT id, name, mobile, looking_for, room_type, preference, preferred_area, budget_min, budget_max,
        move_in_date, people, facilities, other_requirement, status, created_at
       FROM renter_requests
       WHERE ($1 = '' OR status = $1) AND ($2 = '%%' OR name ILIKE $2 OR mobile ILIKE $2 OR preferred_area ILIKE $2 OR other_requirement ILIKE $2)
       ORDER BY created_at DESC LIMIT 200`,
      [status, like],
    );
    return NextResponse.json({ counts: counts.rows[0], items: data.rows });
  }

  if (tab === "users") {
    const data = await query(
      `SELECT id, name, mobile, email, role, is_blocked, created_at FROM users
       WHERE ($1 = '%%' OR name ILIKE $1 OR mobile ILIKE $1 OR email ILIKE $1)
       ORDER BY created_at DESC LIMIT 200`,
      [like],
    );
    return NextResponse.json({ counts: counts.rows[0], items: data.rows });
  }

  if (tab === "areas") {
    const data = await query(
      `SELECT a.id, a.name, a.is_pinned, COUNT(s.id)::int AS count FROM areas a
       LEFT JOIN owner_submissions s ON s.area = a.name AND s.status IN ('Approved', 'Booked')
       WHERE $1 = '%%' OR a.name ILIKE $1
       GROUP BY a.id ORDER BY a.is_pinned DESC, count DESC, a.name LIMIT 200`,
      [like],
    );
    return NextResponse.json({ counts: counts.rows[0], items: data.rows });
  }

  const statusClause = tab === "rooms" ? "s.status IN ('Approved', 'Booked')" : "TRUE";
  const data = await query(
    `SELECT s.id, s.room_code, s.owner_name, s.mobile, s.area, s.address, s.rent, s.security_deposit,
      s.room_type, s.audience, s.facilities, s.distance_geu, s.username, s.status, s.is_available, s.created_at,
      COALESCE(json_agg(json_build_object('id', i.id, 'label', i.label) ORDER BY i.position)
        FILTER (WHERE i.id IS NOT NULL), '[]'::json) AS images
     FROM owner_submissions s LEFT JOIN room_images i ON i.submission_id = s.id
     WHERE ${statusClause} AND ($1 = '' OR s.status = $1)
       AND ($2 = '%%' OR s.room_code ILIKE $2 OR s.owner_name ILIKE $2 OR s.mobile ILIKE $2 OR s.area ILIKE $2 OR s.address ILIKE $2 OR s.username ILIKE $2)
     GROUP BY s.id ORDER BY s.created_at DESC LIMIT 200`,
    [status, like],
  );
  if (tab !== "rooms" && tab !== "submissions") return errorResponse("Unknown admin tab.", 400);
  return NextResponse.json({ counts: counts.rows[0], items: data.rows });
}
