import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { OAuth2Client } from "google-auth-library";
import { hashPassword, type CurrentUser } from "@/lib/security";
import { transaction } from "@/lib/db";
import { digits, validEmail } from "@/lib/validation";

export type GoogleIdentity = {
  sub: string;
  email: string;
  email_verified: boolean;
  name?: string;
};

export const GOOGLE_STATE_COOKIE = "rrd_google_state";
export const GOOGLE_NONCE_COOKIE = "rrd_google_nonce";
export const GOOGLE_VERIFIER_COOKIE = "rrd_google_verifier";
export const GOOGLE_PROFILE_COOKIE = "rrd_google_profile";

export function googleOAuthConfig() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI;
  if (!clientId || !clientSecret || !redirectUri) return null;

  const callback = new URL(redirectUri);
  if (
    callback.pathname !== "/api/auth/google/callback" ||
    callback.search ||
    callback.hash ||
    callback.username ||
    callback.password ||
    (callback.protocol !== "https:" && callback.hostname !== "localhost")
  ) {
    throw new Error("GOOGLE_REDIRECT_URI must be an HTTPS URL (or localhost) ending in /api/auth/google/callback.");
  }

  return {
    clientId,
    redirectUri: callback.toString(),
    client: new OAuth2Client(clientId, clientSecret, callback.toString()),
  };
}

function googleProfile(identity: GoogleIdentity) {
  const email = identity.email.trim().toLowerCase();
  if (!identity.sub || !identity.email_verified || !validEmail(email)) {
    throw new Error("Google sign-in did not return a verified Google email address.");
  }

  const name = typeof identity.name === "string" && identity.name.trim()
    ? identity.name.trim().slice(0, 100)
    : email.split("@")[0].slice(0, 100);

  return { id: identity.sub, email, name };
}

function signingSecret(): string {
  const secret = process.env.RENTROOMS_SESSION_SECRET;
  if (!secret || secret.length < 32) throw new Error("Google profile setup requires RENTROOMS_SESSION_SECRET.");
  return secret;
}

export function sealGoogleProfile(identity: GoogleIdentity): string {
  const payload = Buffer.from(JSON.stringify({
    identity,
    expiresAt: Date.now() + 10 * 60_000,
  })).toString("base64url");
  const signature = createHmac("sha256", signingSecret()).update(payload).digest("base64url");
  return `${payload}.${signature}`;
}

export function openGoogleProfile(value: string | undefined): GoogleIdentity | null {
  if (!value) return null;
  const [payload, signature] = value.split(".");
  if (!payload || !signature) return null;
  const expected = createHmac("sha256", signingSecret()).update(payload).digest();
  let actual: Buffer;
  try {
    actual = Buffer.from(signature, "base64url");
  } catch {
    return null;
  }
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return null;

  try {
    const parsed: unknown = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (!parsed || typeof parsed !== "object" || !("identity" in parsed) || !("expiresAt" in parsed)) return null;
    const { identity, expiresAt } = parsed as { identity: GoogleIdentity; expiresAt: number };
    if (typeof expiresAt !== "number" || expiresAt <= Date.now()) return null;
    if (
      typeof identity?.sub !== "string" ||
      typeof identity.email !== "string" ||
      identity.email_verified !== true ||
      (identity.name !== undefined && typeof identity.name !== "string")
    ) return null;
    return identity;
  } catch {
    return null;
  }
}

export async function connectGoogleAccount(identity: GoogleIdentity, mobile?: string): Promise<CurrentUser | null> {
  const { id, email, name } = googleProfile(identity);
  if (mobile && !digits(mobile)) throw new Error("Enter a valid 10-digit mobile number.");

  return transaction(async (client) => {
    const linked = await client.query<CurrentUser>(
      `SELECT u.id, u.name, u.mobile, u.email, u.role, u.is_blocked
       FROM user_auth_identities i
       JOIN users u ON u.id = i.user_id
       WHERE i.provider = 'google' AND i.provider_user_id = $1
       FOR UPDATE OF u`,
      [id],
    );
    if (linked.rows[0]) return linked.rows[0];

    const existing = await client.query<CurrentUser>(
      `SELECT id, name, mobile, email, role, is_blocked
       FROM users WHERE LOWER(email) = $1
       FOR UPDATE`,
      [email],
    );
    if (existing.rows[0]) {
      await client.query(
        `INSERT INTO user_auth_identities (provider, provider_user_id, user_id)
         VALUES ('google', $1, $2)
         ON CONFLICT DO NOTHING`,
        [id, existing.rows[0].id],
      );
      const identity = await client.query<{ user_id: string }>(
        `SELECT user_id FROM user_auth_identities
         WHERE provider = 'google' AND provider_user_id = $1`,
        [id],
      );
      if (identity.rows[0]?.user_id !== existing.rows[0].id) {
        throw new Error("This Google account is already linked to another Roomito account.");
      }
      return existing.rows[0];
    }

    if (!mobile) return null;
    const passwordHash = await hashPassword(randomBytes(32).toString("base64url"));

    const created = await client.query<CurrentUser>(
      `INSERT INTO users (name, mobile, email, password_hash, role)
       VALUES ($1, $2, $3, $4, 'renter')
       RETURNING id, name, mobile, email, role, is_blocked`,
      [name, mobile, email, passwordHash],
    );
    const user = created.rows[0];
    if (!user) throw new Error("Roomito could not create the Google account.");

    await client.query(
      `INSERT INTO user_auth_identities (provider, provider_user_id, user_id)
       VALUES ('google', $1, $2)`,
      [id, user.id],
    );
    return user;
  });
}
