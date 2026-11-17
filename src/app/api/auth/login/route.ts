import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import {
  checkIdentityRateLimit,
  clearIdentityRateLimit,
  createAdminSession,
  createUserSession,
  validAdminCredentials,
  authConfigurationReady,
  verifyPassword,
} from "@/lib/security";
import { errorResponse, requireDatabase } from "@/lib/http";
import { digits, passwordValue, text, validEmail } from "@/lib/validation";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const form = await request.formData();
  if (text(form.get("website"), 200)) return NextResponse.json({ ok: true });
  const identifier = text(form.get("identifier"), 254).toLowerCase();
  const password = passwordValue(form.get("password"));
  if (!identifier || !password) return errorResponse("Enter your email and password.");

  const adminEmail = process.env.RENTROOMS_ADMIN_EMAIL;
  if (adminEmail && identifier.toLowerCase() === adminEmail.toLowerCase()) {
    if (!authConfigurationReady() || !process.env.RENTROOMS_ADMIN_PASSWORD) {
      return errorResponse("Admin login is not configured. Set RENTROOMS_ADMIN_PASSWORD and a 32+ character RENTROOMS_SESSION_SECRET.", 503);
    }
    if (!(await checkIdentityRateLimit("admin-login", identifier, 5))) {
      return errorResponse("Too many attempts. Please try again in 15 minutes.", 429);
    }
    if (!validAdminCredentials(identifier, password)) {
      return errorResponse("The email or password doesn't match.", 401);
    }
    await createAdminSession();
    await clearIdentityRateLimit("admin-login", identifier);
    return NextResponse.json({ ok: true, redirectTo: "/admin" });
  }

  const unavailable = requireDatabase();
  if (unavailable) return unavailable;
  if (!validEmail(identifier) && !digits(identifier)) return errorResponse("Enter a valid email or 10-digit mobile number.");
  if (!(await checkIdentityRateLimit("user-login", identifier, 8))) {
    return errorResponse("Too many attempts. Please try again in 15 minutes.", 429);
  }
  if (!authConfigurationReady()) return errorResponse("Sign in is unavailable until RENTROOMS_SESSION_SECRET is configured.", 503);

  const result = await query<{ id: string; password_hash: string; is_blocked: boolean }>(
    `SELECT id, password_hash, is_blocked FROM users
     WHERE LOWER(email) = LOWER($1) OR mobile = $1 LIMIT 1`,
    [identifier],
  );
  const user = result.rows[0];
  if (!user || !(await verifyPassword(password, user.password_hash))) return errorResponse("The email/mobile or password doesn't match.", 401);
  if (user.is_blocked) {
    return errorResponse("This account is currently blocked. Please contact the broker.", 403);
  }
  await clearIdentityRateLimit("user-login", identifier);
  await createUserSession(user.id);
  return NextResponse.json({ ok: true, redirectTo: "/dashboard" });
}
