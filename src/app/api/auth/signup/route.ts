import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import {
  checkIdentityRateLimit,
  clearIdentityRateLimit,
  createUserSession,
  hashPassword,
  authConfigurationReady,
} from "@/lib/security";
import { digits, passwordValue, text, validEmail, validPassword } from "@/lib/validation";
import { errorResponse, requireDatabase } from "@/lib/http";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const unavailable = requireDatabase();
  if (unavailable) return unavailable;
  if (!authConfigurationReady()) return errorResponse("Sign in is unavailable until RENTROOMS_SESSION_SECRET is configured.", 503);
  const form = await request.formData();
  if (text(form.get("website"), 200)) return NextResponse.json({ ok: true });

  const name = text(form.get("name"), 100);
  const mobile = text(form.get("mobile"), 10);
  const email = text(form.get("email"), 254).toLowerCase();
  const password = passwordValue(form.get("password"));
  const role = text(form.get("role"), 20);
  if (!name || !digits(mobile) || !validEmail(email) || !validPassword(password)) {
    return errorResponse("Enter a name, a 10-digit mobile, a valid email, and a password of 10–72 characters.");
  }
  if (!["renter", "owner", "both"].includes(role)) return errorResponse("Choose Renter, Owner, or Both.");
  if (!(await checkIdentityRateLimit("signup", `${email}:${mobile}`, 5))) {
    return errorResponse("Too many signup attempts. Please try again in 15 minutes.", 429);
  }

  const passwordHash = await hashPassword(password);
  try {
    const result = await query<{ id: string }>(
      `INSERT INTO users (name, mobile, email, password_hash, role)
       VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [name, mobile, email, passwordHash, role],
    );
    await createUserSession(result.rows[0].id);
    await clearIdentityRateLimit("signup", `${email}:${mobile}`);
    return NextResponse.json({ ok: true, redirectTo: "/dashboard" });
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && error.code === "23505") {
      return errorResponse("An account already uses that email or mobile number.", 409);
    }
    console.error("Signup failed:", error);
    return errorResponse("We couldn't create your account. Please try again.", 500);
  }
}
