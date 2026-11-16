import { query } from "@/lib/db";
import { PINNED_AREAS } from "@/lib/constants";

export type PublicRoom = {
  id: string;
  room_code: string;
  area: string;
  rent: number;
  security_deposit: number;
  room_type: string;
  audience: string;
  facilities: string[];
  distance_geu: string;
  is_available: boolean;
  created_at: string;
  images: string[];
};

const PUBLIC_FIELDS = `
  s.id, s.room_code, s.area, s.rent, s.security_deposit, s.room_type,
  s.is_available, s.audience, s.facilities, s.distance_geu, s.created_at,
  COALESCE(array_agg(i.id ORDER BY i.position) FILTER (WHERE i.id IS NOT NULL), '{}') AS images
`;

export async function listPublicRooms(options: {
  area?: string;
  maxBudget?: number;
  type?: string;
  audience?: string;
  sort?: string;
} = {}): Promise<PublicRoom[]> {
  if (!process.env.DATABASE_URL) return [];
  const values: unknown[] = [];
  const clauses = ["s.status IN ('Approved', 'Booked')"];
  if (options.area) {
    values.push(options.area);
    clauses.push(`s.area = $${values.length}`);
  }
  if (options.maxBudget && Number.isSafeInteger(options.maxBudget) && options.maxBudget > 0) {
    values.push(options.maxBudget);
    clauses.push(`s.rent <= $${values.length}`);
  }
  if (options.type && options.type !== "Any") {
    values.push(options.type);
    clauses.push(`s.room_type = $${values.length}`);
  }
  if (options.audience && options.audience !== "Any") {
    values.push(options.audience);
    clauses.push(`s.audience = $${values.length}`);
  }
  const order = options.sort === "price" ? "s.rent ASC, s.created_at DESC" : "s.created_at DESC";
  const result = await query<PublicRoom>(
    `SELECT ${PUBLIC_FIELDS} FROM owner_submissions s
     LEFT JOIN room_images i ON i.submission_id = s.id
     WHERE ${clauses.join(" AND ")}
     GROUP BY s.id ORDER BY ${order}`,
    values,
  );
  return result.rows;
}

export async function getPublicRoom(id: string): Promise<PublicRoom | null> {
  if (!process.env.DATABASE_URL) return null;
  const result = await query<PublicRoom>(
    `SELECT ${PUBLIC_FIELDS} FROM owner_submissions s
     LEFT JOIN room_images i ON i.submission_id = s.id
     WHERE s.id = $1 AND s.status IN ('Approved', 'Booked')
     GROUP BY s.id`,
    [id],
  );
  return result.rows[0] ?? null;
}

export async function getAreas(): Promise<{ name: string; count: number }[]> {
  if (!process.env.DATABASE_URL) return [];
  const result = await query<{ name: string; count: number; is_pinned: boolean }>(
    `SELECT a.name, a.is_pinned, COUNT(s.id)::int AS count
     FROM areas a LEFT JOIN owner_submissions s
       ON s.area = a.name AND s.status IN ('Approved', 'Booked')
     GROUP BY a.id
     ORDER BY CASE WHEN a.name = ANY($1::text[]) THEN array_position($1::text[], a.name) ELSE ${PINNED_AREAS.length + 1} END,
       a.is_pinned DESC, count DESC, a.name ASC`,
    [PINNED_AREAS],
  );
  return result.rows.map(({ name, count }) => ({ name, count }));
}
