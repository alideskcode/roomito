import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { query, transaction } from "@/lib/db";
import { hashPassword } from "@/lib/security";
import { errorResponse, requireDatabase } from "@/lib/http";
import { passwordValue, text, validPassword } from "@/lib/validation";

export async function POST(request: Request) {
  const unavailable = requireDatabase();
  if (unavailable) return unavailable;
  const form = await request.formData();
  const token = text(form.get("token"), 100);
  const password = passwordValue(form.get("password"));
  if (!token || !validPassword(password)) return errorResponse("Use a valid reset link and a password of 10–72 characters.");
  const tokenHash = createHash("sha256").update(token).digest("hex");
  const result = await query<{ user_id: string }>(
    "SELECT user_id FROM password_resets WHERE token_hash = $1 AND used_at IS NULL AND expires_at > NOW()",
    [tokenHash],
  );
  const reset = result.rows[0];
  if (!reset) return errorResponse("This reset link has expired or was already used. Request a new one.", 400);
  try {
    await transaction(async (client) => {
      const consumed = await client.query(
        "UPDATE password_resets SET used_at = NOW() WHERE token_hash = $1 AND used_at IS NULL AND expires_at > NOW()",
        [tokenHash],
      );
      if (consumed.rowCount !== 1) throw new Error("Reset link was already used.");
      await client.query("UPDATE users SET password_hash = $1 WHERE id = $2", [await hashPassword(password), reset.user_id]);
      await client.query("DELETE FROM user_sessions WHERE user_id = $1", [reset.user_id]);
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Reset link was already used.") {
      return errorResponse("This reset link has expired or was already used. Request a new one.", 400);
    }
    console.error("Password reset failed:", error);
    return errorResponse("We couldn't reset your password. Please try again.", 500);
  }
  return NextResponse.json({ ok: true });
}
