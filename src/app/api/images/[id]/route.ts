import { NextResponse } from "next/server";
import { get } from "@vercel/blob";
import { query } from "@/lib/db";
import { isAdmin } from "@/lib/security";
import { validBlobUrl } from "@/lib/images";
import { requireDatabase } from "@/lib/http";

export const runtime = "nodejs";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const unavailable = requireDatabase();
  if (unavailable) return unavailable;
  const { id } = await context.params;
  const result = await query<{ blob_url: string; status: string }>(
    `SELECT i.blob_url, s.status FROM room_images i
     JOIN owner_submissions s ON s.id = i.submission_id WHERE i.id = $1`,
    [id],
  );
  const image = result.rows[0];
  if (!image) return new NextResponse("Not found", { status: 404 });
  if (!["Approved", "Booked"].includes(image.status) && !(await isAdmin())) {
    return new NextResponse("Not found", { status: 404 });
  }
  if (!validBlobUrl(image.blob_url)) return new NextResponse("Invalid image URL", { status: 500 });
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return new NextResponse("Image storage is not configured.", { status: 503 });
  }
  try {
    const blob = await get(image.blob_url, {
      access: "private",
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });
    if (!blob || blob.statusCode !== 200) return new NextResponse("Image unavailable", { status: 502 });
    return new NextResponse(blob.stream, {
    headers: {
      "Content-Type": blob.blob.contentType || "image/webp",
      "Cache-Control": ["Approved", "Booked"].includes(image.status)
        ? "public, max-age=3600, stale-while-revalidate=86400"
        : "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
    });
  } catch (error) {
    console.error("Could not retrieve room image from private Blob storage:", error);
    return new NextResponse("Image storage could not provide this photo.", { status: 502 });
  }
}
