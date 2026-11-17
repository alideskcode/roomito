import { createHash, randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { checkRateLimit } from "@/lib/security";
import { errorResponse, publicOrigin, requireDatabase } from "@/lib/http";
import { text, validEmail } from "@/lib/validation";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const unavailable = requireDatabase();
  if (unavailable) return unavailable;
  if (!(await checkRateLimit("password-reset", 4))) return errorResponse("Too many requests. Please try again later.", 429);
  if (!process.env.RESEND_API_KEY || !process.env.RESEND_FROM_EMAIL) {
    return errorResponse("Password reset email is not configured. Set RESEND_API_KEY and RESEND_FROM_EMAIL.", 503);
  }

  const form = await request.formData();
  if (text(form.get("website"), 200)) return NextResponse.json({ ok: true });
  const email = text(form.get("email"), 254).toLowerCase();
  if (!validEmail(email)) return errorResponse("Enter a valid email address.");
  const userResult = await query<{ id: string }>(
    "SELECT id FROM users WHERE email = $1 AND is_blocked = FALSE",
    [email],
  );
  if (userResult.rows[0]) {
    const token = randomBytes(32).toString("base64url");
    const tokenHash = createHash("sha256").update(token).digest("hex");
    await query(
      "INSERT INTO password_resets (token_hash, user_id, expires_at) VALUES ($1, $2, NOW() + INTERVAL '30 minutes')",
      [tokenHash, userResult.rows[0].id],
    );
    const resetUrl = new URL("/reset-password", publicOrigin(request));
    resetUrl.searchParams.set("token", token);
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.RESEND_FROM_EMAIL,
        to: [email],
        subject: "Reset your Roomito password",
        html: `<p>Use this one-time link to reset your password. It expires in 30 minutes.</p><p><a href="${resetUrl.toString()}">Reset password</a></p><p>If you did not request this, you can ignore this email.</p>`,
      }),
    });
    if (!response.ok) {
      console.error("Resend rejected password reset email:", response.status, await response.text());
      return errorResponse("We couldn't send the reset email. Please try again later.", 502);
    }
  }
  return NextResponse.json({ ok: true, message: "If an account matches that email, a reset link is on its way." });
}
