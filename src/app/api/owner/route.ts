import { NextResponse } from "next/server";
import { currentUser, checkRateLimit } from "@/lib/security";
import { query } from "@/lib/db";
import { uploadRoomImage } from "@/lib/images";
import { errorResponse, requireDatabase } from "@/lib/http";
import { digits, safeInteger, text, titleCaseArea } from "@/lib/validation";
import { FACILITIES } from "@/lib/constants";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const unavailable = requireDatabase();
  if (unavailable) return unavailable;
  if (!(await checkRateLimit("owner-submission", 4))) return errorResponse("Too many submissions. Please try again later.", 429);
  const form = await request.formData();
  if (text(form.get("website"), 200)) return NextResponse.json({ ok: true });

  const user = await currentUser();
  const name = text(form.get("name"), 100);
  const mobile = text(form.get("mobile"), 10);
  const area = titleCaseArea(text(form.get("area"), 100));
  const address = text(form.get("address"), 300);
  const rent = safeInteger(text(form.get("rent"), 12), 1);
  const deposit = safeInteger(text(form.get("deposit"), 12), 0);
  const roomType = text(form.get("roomType"), 30);
  const audience = text(form.get("audience"), 30);
  const facilities = [...new Set(form.getAll("facilities").map((value) => text(value, 40)).filter(Boolean))];
  const distance = text(form.get("distance"), 60);
  if (!name || !digits(mobile) || !area || !address || rent === null || deposit === null) {
    return errorResponse("Complete every required field with a valid name, 10-digit mobile, area, address, rent, and deposit.");
  }
  if (!["Independent", "Non-Independent"].includes(roomType)) return errorResponse("Choose Independent or Non-Independent.");
  if (!["Boys PG", "Girls PG", "Family", "Any"].includes(audience)) return errorResponse("Choose who the room is suitable for.");
  if (text(form.get("consent"), 5) !== "on") return errorResponse("Please agree that Rent Rooms Dehradun can list your room and contact you.");
  if (facilities.some((item) => !FACILITIES.includes(item))) return errorResponse("One or more facility values are invalid.");

  const result = await query<{ id: string }>(
    `INSERT INTO owner_submissions
      (owner_name, mobile, area, address, rent, security_deposit, room_type, audience, facilities, distance_geu, submitted_by, consent)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, TRUE) RETURNING id`,
    [name, mobile, area, address, rent, deposit, roomType, audience, facilities, distance, user?.id ?? null],
  );
  const submissionId = result.rows[0].id;
  const receivedFiles = [
    ...form.getAll("images")
      .filter((value): value is File => value instanceof File && value.size > 0)
      .map((file) => ({ file, label: "Room photo" })),
    ...form.getAll("buildingPhoto")
      .filter((value): value is File => value instanceof File && value.size > 0)
      .map((file) => ({ file, label: "PG building photo" })),
  ];
  const uploadWarnings: string[] = [];
  if (receivedFiles.length > 8) uploadWarnings.push("Only the first 8 photos were accepted.");
  let files = receivedFiles.slice(0, 8);
  if (files.reduce((total, item) => total + item.file.size, 0) > 4 * 1024 * 1024) {
    uploadWarnings.push("The selected photos exceeded the upload size limit and were skipped.");
    files = [];
  }
  await Promise.all(files.map(async (item, position) => {
    try {
      const url = await uploadRoomImage(item.file, `submission-${submissionId}-${position}`);
      await query("INSERT INTO room_images (submission_id, blob_url, label, position) VALUES ($1, $2, $3, $4)", [
        submissionId,
        url,
        item.label,
        position,
      ]);
    } catch (error) {
      const message = error instanceof Error ? error.message : "An image could not be uploaded.";
      uploadWarnings.push(message);
      console.error("Optional room photo upload failed:", error);
    }
  }));
  const message = [
    "Hello, I want to register my room. 🏠",
    `Name: ${name}`,
    `Mobile: ${mobile}`,
    `Area: ${area}`,
    `Address: ${address}`,
    `Rent: ₹${rent}`,
    `Security: ₹${deposit}`,
    `Type: ${roomType}`,
  ].join(" / ");
  return NextResponse.json({
    ok: true,
    id: submissionId,
    whatsapp: `https://wa.me/919837274296?text=${encodeURIComponent(message)}`,
    warning: uploadWarnings.length ? "Your room was saved, but one or more photos could not be uploaded. You can still continue to WhatsApp." : "",
  });
}
