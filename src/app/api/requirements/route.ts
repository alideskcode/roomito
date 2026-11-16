import { NextResponse } from "next/server";
import { currentUser, checkRateLimit } from "@/lib/security";
import { query } from "@/lib/db";
import { errorResponse, requireDatabase } from "@/lib/http";
import { safeInteger, text, titleCaseArea, validDate, digits } from "@/lib/validation";
import { FACILITIES } from "@/lib/constants";

export async function POST(request: Request) {
  const unavailable = requireDatabase();
  if (unavailable) return unavailable;
  if (!(await checkRateLimit("renter-request", 4))) return errorResponse("Too many requests. Please try again later.", 429);
  const form = await request.formData();
  if (text(form.get("website"), 200)) return NextResponse.json({ ok: true });
  const user = await currentUser();
  const name = text(form.get("name"), 100);
  const mobile = text(form.get("mobile"), 10);
  const lookingFor = text(form.get("lookingFor"), 40);
  const roomType = text(form.get("roomType"), 50);
  const preference = text(form.get("preference"), 40);
  const area = titleCaseArea(text(form.get("area"), 100));
  const min = safeInteger(text(form.get("budgetMin"), 12), 0);
  const max = safeInteger(text(form.get("budgetMax"), 12), 0);
  const moveIn = text(form.get("moveIn"), 10);
  const people = safeInteger(text(form.get("people"), 4), 1);
  const facilities = form.getAll("facilities").map((value) => text(value, 40));
  const other = text(form.get("other"), 1000);
  if (!name || !digits(mobile) || !area || min === null || max === null || max < min || people === null || people > 30 || !validDate(moveIn)) {
    return errorResponse("Check the required details, 10-digit mobile, budget range, people count, and move-in date.");
  }
  if (!["Boys", "Girls", "Family", "Working Professional"].includes(lookingFor)) return errorResponse("Choose who the room is for.");
  if (!["Single Room", "1 RK", "1 BHK", "2 BHK", "3 BHK", "PG Single Sharing", "PG Double Sharing", "PG Triple Sharing"].includes(roomType)) {
    return errorResponse("Choose a valid room type.");
  }
  if (!["Independent", "Non-Independent", "No preference"].includes(preference)) return errorResponse("Choose an independent-room preference.");
  if (facilities.some((item) => !FACILITIES.includes(item))) return errorResponse("One or more facilities are invalid.");

  const result = await query<{ id: string }>(
    `INSERT INTO renter_requests
      (name, mobile, looking_for, room_type, preference, preferred_area, budget_min, budget_max, move_in_date, people, facilities, other_requirement, submitted_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING id`,
    [name, mobile, lookingFor, roomType, preference, area, min, max, moveIn, people, facilities, other, user?.id ?? null],
  );
  const message = [
    "Hello, I am looking for a room. 🔍",
    `Name: ${name}`,
    `Mobile: ${mobile}`,
    `For: ${lookingFor}`,
    `Room type: ${roomType}`,
    `Preference: ${preference}`,
    `Preferred area: ${area}`,
    `Budget: ₹${min} - ₹${max}`,
    `Move-in date: ${moveIn || "Flexible"}`,
    `Number of people: ${people}`,
    `Facilities: ${facilities.length ? facilities.join(", ") : "No preference"}`,
    `Other requirement: ${other || "None"}`,
  ].join(" / ");
  return NextResponse.json({
    ok: true,
    id: result.rows[0].id,
    whatsapp: `https://wa.me/919837274296?text=${encodeURIComponent(message)}`,
  });
}
