import { NextResponse } from "next/server";
import { connectGoogleAccount } from "@/lib/google-auth";
import { authConfigurationReady, createUserSession } from "@/lib/security";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

function loginRedirect(origin: string, reason: "google" | "blocked") {
  const url = new URL("/login", origin);
  url.searchParams.set("error", reason);
  return NextResponse.redirect(url);
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const origin = requestUrl.origin;
  const code = requestUrl.searchParams.get("code");
  const requestedNext = requestUrl.searchParams.get("next") || "/dashboard";
  const next = requestedNext === "/" || requestedNext === "/dashboard"
    ? requestedNext
    : "/dashboard";

  if (!code) return loginRedirect(origin, "google");
  if (!authConfigurationReady()) {
    console.error("Google sign-in requires RENTROOMS_SESSION_SECRET.");
    return loginRedirect(origin, "google");
  }

  try {
    const supabase = await createClient();
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
    if (exchangeError) {
      console.error("Google OAuth code exchange failed:", exchangeError.message);
      return loginRedirect(origin, "google");
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error("Could not verify the Google OAuth session:", userError?.message || "User not found.");
      return loginRedirect(origin, "google");
    }

    const account = await connectGoogleAccount(user);
    if (!account) {
      const profileUrl = new URL("/auth/complete-profile", origin);
      profileUrl.searchParams.set("next", next);
      return NextResponse.redirect(profileUrl);
    }
    if (account.is_blocked) return loginRedirect(origin, "blocked");

    await createUserSession(account.id);
    return NextResponse.redirect(new URL(next, origin));
  } catch (error) {
    console.error("Google sign-in failed:", error);
    return loginRedirect(origin, "google");
  }
}
