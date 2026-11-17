import { NextResponse } from "next/server";
import { connectGoogleAccount } from "@/lib/google-auth";
import { errorResponse, requireDatabase } from "@/lib/http";
import { authConfigurationReady, checkIdentityRateLimit, clearIdentityRateLimit, createUserSession } from "@/lib/security";
import { createClient } from "@/lib/supabase/server";
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
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) return errorResponse("Your Google sign-in expired. Please sign in again.", 401);
    const identity = user.email || user.id;
    if (!(await checkIdentityRateLimit("google-profile", identity, 5))) {
      return errorResponse("Too many profile setup attempts. Please try again later.", 429);
    }

    const account = await connectGoogleAccount(user, mobile);
    if (!account) return errorResponse("We couldn't create your Roomito account. Please try again.", 500);
    if (account.is_blocked) return errorResponse("This account is currently blocked. Please contact the broker.", 403);

    await createUserSession(account.id);
    await clearIdentityRateLimit("google-profile", identity);
    return NextResponse.json({ ok: true, redirectTo: "/dashboard" });
  } catch (error) {
    if (isUniqueViolation(error)) {
      return errorResponse("This mobile number or email is already linked to another Roomito account.", 409);
    }
    console.error("Google profile completion failed:", error);
    return errorResponse("We couldn't finish setting up your account. Please try again.", 500);
  }
}
