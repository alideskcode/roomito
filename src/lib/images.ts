import { put } from "@vercel/blob";
import sharp from "sharp";

const MAX_SOURCE_BYTES = 12 * 1024 * 1024;
const MAX_OUTPUT_BYTES = 300_000;

export async function uploadRoomImage(file: File, label: string): Promise<string> {
  if (!file.type.startsWith("image/")) throw new Error("Please upload image files only.");
  if (file.size > MAX_SOURCE_BYTES) throw new Error("Each image must be smaller than 12 MB.");

  const input = Buffer.from(await file.arrayBuffer());
  let output: Buffer | undefined;
  for (const quality of [78, 66, 54, 42, 32]) {
    output = await sharp(input, { limitInputPixels: 40_000_000 })
      .rotate()
      .resize({ width: 1200, height: 1200, fit: "inside", withoutEnlargement: true })
      .webp({ quality, effort: 4 })
      .toBuffer();
    if (output.byteLength < MAX_OUTPUT_BYTES) break;
  }
  if (!output || output.byteLength >= MAX_OUTPUT_BYTES) {
    throw new Error("This photo could not be compressed below 300 KB. Please choose another.");
  }
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    throw new Error("Room photos are unavailable until BLOB_READ_WRITE_TOKEN is configured.");
  }
  const safeLabel = label.replace(/[^a-zA-Z0-9_-]/g, "-").slice(0, 40);
  const blob = await put(`rentrooms/${crypto.randomUUID()}-${safeLabel}.webp`, output, {
    access: "private",
    contentType: "image/webp",
    addRandomSuffix: true,
    token: process.env.BLOB_READ_WRITE_TOKEN,
  });
  return blob.url;
}

export function validBlobUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" && parsed.hostname.endsWith(".blob.vercel-storage.com");
  } catch {
    return false;
  }
}
