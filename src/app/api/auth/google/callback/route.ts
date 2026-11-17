import { timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import {
  connectGoogleAccount,
  GOOGLE_PROFILE_COOKIE,
  GOOGLE_NONCE_COOKIE,
  GOOGLE_STATE_COOKIE,
  GOOGLE_VERIFIER_COOKIE,
  googleOAuthConfig,
  sealGoogleProfile,
  type GoogleIdentity,
} from "@/lib/google-auth";
import { authConfigurationReady, createUserSession } from "@/lib/security";

export const runtime = "nodejs";

function loginRedirect(origin: string, reason: "google" | "blocked") {
  const url = new URL("/login", origin);
  url.searchParams.set("error", reason);
  return NextResponse.redirect(url);
}

function stateMatches(expected: string | undefined, received: string | null): boolean {
  if (!expected || !received) return false;
  const expectedBuffer = Buffer.from(expected);
  const receivedBuffer = Buffer.from(received);
  return expectedBuffer.length === receivedBuffer.length && timingSafeEqual(expectedBuffer, receivedBuffer);
}

function clearOAuthCookies(response: NextResponse) {
  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/api/auth/google/callback",
    maxAge: 0,
  };
  response.cookies.set(GOOGLE_STATE_COOKIE, "", options);
  response.cookies.set(GOOGLE_NONCE_COOKIE, "", options);
  response.cookies.set(GOOGLE_VERIFIER_COOKIE, "", options);
}

export async function GET(request: NextRequest) {
  const config = googleOAuthConfig();
  if (!config) {
    return NextResponse.json({ error: "Google sign-in is not configured." }, { status: 503 });
  }

  const origin = new URL(config.redirectUri).origin;
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const receivedState = requestUrl.searchParams.get("state");
  const state = request.cookies.get(GOOGLE_STATE_COOKIE)?.value;
  const nonce = request.cookies.get(GOOGLE_NONCE_COOKIE)?.value;
  const codeVerifier = request.cookies.get(GOOGLE_VERIFIER_COOKIE)?.value;

  if (!code || !stateMatches(state, receivedState) || !nonce || !codeVerifier || !authConfigurationReady()) {
    return loginRedirect(origin, "google");
  }

  try {
    const { tokens } = await config.client.getToken({ code, codeVerifier });
    if (!tokens.id_token) throw new Error("Google did not return an ID token.");

    const ticket = await config.client.verifyIdToken({
      idToken: tokens.id_token,
      audience: config.clientId,
    });
    const payload = ticket.getPayload();
    if (!payload?.sub || !payload.email || payload.email_verified !== true || payload.nonce !== nonce) {
      throw new Error("Google did not return a verified email identity.");
    }

    const identity: GoogleIdentity = {
      sub: payload.sub,
      email: payload.email,
      email_verified: true,
      ...(payload.name ? { name: payload.name } : {}),
    };
    const account = await connectGoogleAccount(identity);
    if (account?.is_blocked) {
      const response = loginRedirect(origin, "blocked");
      clearOAuthCookies(response);
      return response;
    }
    if (!account) {
      const profileUrl = new URL("/auth/complete-profile", origin);
      const response = NextResponse.redirect(profileUrl);
      response.cookies.set(GOOGLE_PROFILE_COOKIE, sealGoogleProfile(identity), {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/api/auth/google/complete",
        maxAge: 10 * 60,
      });
      clearOAuthCookies(response);
      return response;
    }

    await createUserSession(account.id);
    const response = NextResponse.redirect(new URL("/dashboard", origin));
    clearOAuthCookies(response);
    return response;
  } catch (error) {
    console.error("Direct Google sign-in failed:", error);
    const response = loginRedirect(origin, "google");
    clearOAuthCookies(response);
    return response;
  }
}
