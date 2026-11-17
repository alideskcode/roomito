import { NextResponse } from "next/server";
import {
  connectGoogleAccount,
  GOOGLE_PROFILE_COOKIE,
  openGoogleProfile,
} from "@/lib/google-auth";
import { errorResponse, requireDatabase } from "@/lib/http";
import { authConfigurationReady, checkIdentityRateLimit, clearIdentityRateLimit, createUserSession } from "@/lib/security";
import { cookies } from "next/headers";
import { digits, text } from "@/lib/validation";

export const runtime = "nodejs";

function isUniqueViolation(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && error.code === "23505";
}

export async function POST(request: Request) {
  const unavailable = requireDatabase();
  if (unavailable) return unavailable;
  if (!authConfigurationReady()) {
    return errorResponse("Sign in is unavailable until RENTROOMS_SESSION_SECRET is configured.", 503);
  }

  const form = await request.formData();
  const mobile = text(form.get("mobile"), 10);
  if (!digits(mobile)) return errorResponse("Enter a valid 10-digit mobile number.");

  try {
    const cookieStore = await cookies();
    const identity = openGoogleProfile(cookieStore.get(GOOGLE_PROFILE_COOKIE)?.value);
    if (!identity) return errorResponse("Your Google sign-in expired. Please sign in again.", 401);
    if (!(await checkIdentityRateLimit("google-profile", identity.email, 5))) {
      return errorResponse("Too many profile setup attempts. Please try again later.", 429);
    }

    const account = await connectGoogleAccount(identity, mobile);
    if (!account) return errorResponse("We couldn't create your Roomito account. Please try again.", 500);
    if (account.is_blocked) return errorResponse("This account is currently blocked. Please contact the broker.", 403);

    await createUserSession(account.id);
    await clearIdentityRateLimit("google-profile", identity.email);
    const response = NextResponse.json({ ok: true, redirectTo: "/dashboard" });
    response.cookies.set(GOOGLE_PROFILE_COOKIE, "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/api/auth/google/complete",
      maxAge: 0,
    });
    return response;
  } catch (error) {
    if (isUniqueViolation(error)) {
      return errorResponse("This mobile number or email is already linked to another Roomito account.", 409);
    }
    console.error("Google profile completion failed:", error);
    return errorResponse("We couldn't finish setting up your account. Please try again.", 500);
  }
}
