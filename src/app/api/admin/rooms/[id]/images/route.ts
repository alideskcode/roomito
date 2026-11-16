import { del } from "@vercel/blob";
import { NextResponse } from "next/server";
import { query, transaction } from "@/lib/db";
import { errorResponse, requireAdmin } from "@/lib/http";
import { uploadRoomImage } from "@/lib/images";

export const runtime = "nodejs";

const MAX_IMAGES = 8;
const MAX_TOTAL_BYTES = 4 * 1024 * 1024;

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { id } = await context.params;
  const form = await request.formData();
  const submitted = form.getAll("images");
  const files = submitted.filter((value): value is File => value instanceof File && value.size > 0);
  if (!files.length || files.length !== submitted.length) {
    return errorResponse("Choose one or more valid image files.");
  }
  if (files.length > MAX_IMAGES) return errorResponse(`Choose no more than ${MAX_IMAGES} photos at a time.`);
  if (files.reduce((total, file) => total + file.size, 0) > MAX_TOTAL_BYTES) {
    return errorResponse("The selected photos exceed the 4 MB total upload limit.");
  }

  const current = await query<{ status: string; image_count: number }>(
    `SELECT s.status, COUNT(i.id)::int AS image_count
     FROM owner_submissions s LEFT JOIN room_images i ON i.submission_id = s.id
     WHERE s.id = $1 GROUP BY s.id`,
    [id],
  );
  const room = current.rows[0];
  if (!room || !["Approved", "Booked"].includes(room.status)) return errorResponse("Approved room not found.", 404);
  if (room.image_count + files.length > MAX_IMAGES) {
    return errorResponse(`This room can have up to ${MAX_IMAGES} photos. It currently has ${room.image_count}.`);
  }

  const uploaded: { url: string; position: number }[] = [];
  try {
    for (const [index, file] of files.entries()) {
      uploaded.push({
        url: await uploadRoomImage(file, `room-${id}-${room.image_count + index}`),
        position: room.image_count + index,
      });
    }

    await transaction(async (client) => {
      const locked = await client.query<{ status: string }>(
        "SELECT status FROM owner_submissions WHERE id = $1 FOR UPDATE",
        [id],
      );
      if (!locked.rows[0] || !["Approved", "Booked"].includes(locked.rows[0].status)) {
        throw new Error("Approved room not found.");
      }
      const count = await client.query<{ image_count: number }>(
        "SELECT COUNT(*)::int AS image_count FROM room_images WHERE submission_id = $1",
        [id],
      );
      const imageCount = count.rows[0].image_count;
      if (imageCount + uploaded.length > MAX_IMAGES) {
        throw new Error(`This room can have up to ${MAX_IMAGES} photos. It currently has ${imageCount}.`);
      }
      for (const [index, image] of uploaded.entries()) {
        await client.query(
          "INSERT INTO room_images (submission_id, blob_url, label, position) VALUES ($1, $2, $3, $4)",
          [id, image.url, "Room photo", imageCount + index],
        );
      }
    });

    return NextResponse.json({ ok: true, message: `${uploaded.length} photo${uploaded.length === 1 ? "" : "s"} added.` });
  } catch (error) {
    await Promise.all(uploaded.map(async ({ url }) => {
      try {
        await del(url, { token: process.env.BLOB_READ_WRITE_TOKEN });
      } catch (cleanupError) {
        console.error("Could not clean up an incomplete room photo upload:", cleanupError);
      }
    }));
    console.error("Could not add photos to room:", error);
    if (error instanceof Error && error.message === "Approved room not found.") {
      return errorResponse(error.message, 404);
    }
    if (error instanceof Error && error.message.startsWith("This room can have up to")) {
      return errorResponse(error.message, 409);
    }
    return errorResponse(error instanceof Error ? error.message : "Photos could not be uploaded. Please try again.", 500);
  }
}
