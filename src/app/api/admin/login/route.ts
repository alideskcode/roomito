import { NextResponse } from "next/server";
import {
  checkIdentityRateLimit,
  clearIdentityRateLimit,
  createAdminSession,
  validAdminCredentials,
  authConfigurationReady,
} from "@/lib/security";
import { errorResponse, jsonObject, requireDatabase } from "@/lib/http";
import { text } from "@/lib/validation";

export async function POST(request: Request) {
  const unavailable = requireDatabase();
  if (unavailable) return unavailable;
  const body: unknown = await request.json().catch(() => null);
  if (!jsonObject(body)) return errorResponse("Enter your admin email and password.");
  if (text(typeof body.website === "string" ? body.website : null, 200)) return NextResponse.json({ ok: true });
  const email = text(typeof body.email === "string" ? body.email : null, 254);
  const password = text(typeof body.password === "string" ? body.password : null, 128);
  if (!authConfigurationReady() || !process.env.RENTROOMS_ADMIN_EMAIL || !process.env.RENTROOMS_ADMIN_PASSWORD) {
    return errorResponse("Admin login is not configured. Set RENTROOMS_ADMIN_EMAIL, RENTROOMS_ADMIN_PASSWORD, and RENTROOMS_SESSION_SECRET.", 503);
  }
  if (!(await checkIdentityRateLimit("admin-login", email, 5))) {
    return errorResponse("Too many attempts. Please try again in 15 minutes.", 429);
  }
  if (!validAdminCredentials(email, password)) return errorResponse("The email or password doesn't match.", 401);
  await createAdminSession();
  await clearIdentityRateLimit("admin-login", email);
  return NextResponse.json({ ok: true, redirectTo: "/admin" });
}
