import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { CodeChallengeMethod } from "google-auth-library";
import {
  GOOGLE_STATE_COOKIE,
  GOOGLE_NONCE_COOKIE,
  GOOGLE_VERIFIER_COOKIE,
  googleOAuthConfig,
} from "@/lib/google-auth";
import { authConfigurationReady } from "@/lib/security";
import { errorResponse, requireDatabase } from "@/lib/http";

export const runtime = "nodejs";

export async function GET() {
  const unavailable = requireDatabase();
  if (unavailable) return unavailable;
  if (!authConfigurationReady()) {
    return errorResponse("Google sign-in requires a 32+ character RENTROOMS_SESSION_SECRET.", 503);
  }
  const config = googleOAuthConfig();
  if (!config) {
    return NextResponse.json({ error: "Google sign-in is not configured. Set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_REDIRECT_URI." }, { status: 503 });
  }

  const state = randomBytes(32).toString("base64url");
  const nonce = randomBytes(32).toString("base64url");
  const { codeVerifier, codeChallenge } = await config.client.generateCodeVerifierAsync();
  const authorizationUrl = config.client.generateAuthUrl({
    access_type: "online",
    code_challenge: codeChallenge,
    code_challenge_method: CodeChallengeMethod.S256,
    nonce,
    prompt: "select_account",
    scope: ["openid", "email", "profile"],
    state,
  });
  const response = NextResponse.redirect(authorizationUrl);
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/api/auth/google/callback",
    maxAge: 10 * 60,
  };
  response.cookies.set(GOOGLE_STATE_COOKIE, state, cookieOptions);
  response.cookies.set(GOOGLE_NONCE_COOKIE, nonce, cookieOptions);
  response.cookies.set(GOOGLE_VERIFIER_COOKIE, codeVerifier, cookieOptions);
  return response;
}
