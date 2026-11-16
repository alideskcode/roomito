import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { cookies, headers } from "next/headers";
import { query } from "@/lib/db";

const USER_COOKIE = "rrd_session";
const ADMIN_COOKIE = "rrd_admin";
const SESSION_DAYS = 14;

function secret(): string | undefined {
  const value = process.env.RENTROOMS_SESSION_SECRET;
  return value && value.length >= 32 ? value : undefined;
}

export function authConfigurationReady(): boolean {
  return Boolean(secret());
}

export function hashPassword(password: string): Promise<string> {
  return import("bcryptjs").then(({ hash }) => hash(password, 12));
}

export function verifyPassword(password: string, hash: string): Promise<boolean> {
  return import("bcryptjs").then(({ compare }) => compare(password, hash));
}

export async function checkRateLimit(action: string, limit = 8): Promise<boolean> {
  const requestHeaders = await headers();
  const ip = requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const key = createHash("sha256").update(`${action}:ip:${ip}`).digest("hex");
  const result = await query<{ hits: number }>(
    `INSERT INTO rate_limits (key, window_start, hits)
     VALUES ($1, NOW(), 1)
     ON CONFLICT (key) DO UPDATE SET
       hits = CASE WHEN rate_limits.window_start < NOW() - INTERVAL '15 minutes' THEN 1 ELSE rate_limits.hits + 1 END,
       window_start = CASE WHEN rate_limits.window_start < NOW() - INTERVAL '15 minutes' THEN NOW() ELSE rate_limits.window_start END
     RETURNING hits`,
    [key],
  );
  return Number(result.rows[0]?.hits ?? limit + 1) <= limit;
}

export async function checkIdentityRateLimit(action: string, identity: string, limit = 8): Promise<boolean> {
  const requestHeaders = await headers();
  const ip = requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const normalizedIdentity = identity.trim().toLowerCase();
  const identityKey = createHash("sha256")
    .update(`${action}:identity:${ip}:${normalizedIdentity}`)
    .digest("hex");
  const ipKey = createHash("sha256").update(`${action}:ip:${ip}`).digest("hex");
  const recordHit = async (key: string) => {
    const result = await query<{ hits: number }>(
      `INSERT INTO rate_limits (key, window_start, hits)
       VALUES ($1, NOW(), 1)
       ON CONFLICT (key) DO UPDATE SET
         hits = CASE WHEN rate_limits.window_start < NOW() - INTERVAL '15 minutes' THEN 1 ELSE rate_limits.hits + 1 END,
         window_start = CASE WHEN rate_limits.window_start < NOW() - INTERVAL '15 minutes' THEN NOW() ELSE rate_limits.window_start END
       RETURNING hits`,
      [key],
    );
    return Number(result.rows[0]?.hits ?? limit + 1);
  };
  const identityHits = await recordHit(identityKey);
  const ipHits = await recordHit(ipKey);
  return identityHits <= limit && ipHits <= limit * 4;
}

export async function clearIdentityRateLimit(action: string, identity: string): Promise<void> {
  const requestHeaders = await headers();
  const ip = requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const identityKey = createHash("sha256")
    .update(`${action}:identity:${ip}:${identity.trim().toLowerCase()}`)
    .digest("hex");
  await query("DELETE FROM rate_limits WHERE key = $1", [identityKey]);
}

export async function createUserSession(userId: string): Promise<void> {
  const signingSecret = secret();
  if (!signingSecret) throw new Error("Authentication is not configured. Set RENTROOMS_SESSION_SECRET.");
  const token = randomBytes(32).toString("base64url");
  const tokenHash = createHash("sha256").update(token).digest("hex");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 86400_000);
  await query("INSERT INTO user_sessions (token_hash, user_id, expires_at) VALUES ($1, $2, $3)", [
    tokenHash,
    userId,
    expiresAt,
  ]);
  (await cookies()).set(USER_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export type CurrentUser = {
  id: string;
  name: string;
  mobile: string;
  email: string;
  role: "renter" | "owner" | "both";
  is_blocked: boolean;
};

export async function currentUser(): Promise<CurrentUser | null> {
  const token = (await cookies()).get(USER_COOKIE)?.value;
  if (!token) return null;
  const tokenHash = createHash("sha256").update(token).digest("hex");
  const result = await query<CurrentUser>(
    `SELECT u.id, u.name, u.mobile, u.email, u.role, u.is_blocked
     FROM user_sessions s JOIN users u ON u.id = s.user_id
     WHERE s.token_hash = $1 AND s.expires_at > NOW()`,
    [tokenHash],
  );
  const user = result.rows[0] ?? null;
  return user?.is_blocked ? null : user;
}

export async function clearUserSession(): Promise<void> {
  const jar = await cookies();
  const token = jar.get(USER_COOKIE)?.value;
  jar.delete(USER_COOKIE);
  if (token) {
    await query("DELETE FROM user_sessions WHERE token_hash = $1", [
      createHash("sha256").update(token).digest("hex"),
    ]);
  }
}

function signature(payload: string): string {
  const signingSecret = secret();
  if (!signingSecret) throw new Error("Admin login is not configured. Set RENTROOMS_SESSION_SECRET.");
  return createHmac("sha256", signingSecret).update(payload).digest("base64url");
}

export async function createAdminSession(): Promise<void> {
  const payload = Buffer.from(JSON.stringify({ role: "admin", exp: Date.now() + 8 * 3600_000 })).toString(
    "base64url",
  );
  (await cookies()).set(ADMIN_COOKIE, `${payload}.${signature(payload)}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 8 * 3600,
  });
}

export async function isAdmin(): Promise<boolean> {
  const token = (await cookies()).get(ADMIN_COOKIE)?.value;
  const signingSecret = secret();
  if (!token || !signingSecret) return false;
  const [payload, providedSignature] = token.split(".");
  if (!payload || !providedSignature) return false;
  const expected = signature(payload);
  const expectedBytes = Buffer.from(expected);
  const suppliedBytes = Buffer.from(providedSignature);
  if (expectedBytes.length !== suppliedBytes.length || !timingSafeEqual(expectedBytes, suppliedBytes)) {
    return false;
  }
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as {
      role?: string;
      exp?: number;
    };
    return data.role === "admin" && typeof data.exp === "number" && data.exp > Date.now();
  } catch {
    return false;
  }
}

export async function clearAdminSession(): Promise<void> {
  (await cookies()).delete(ADMIN_COOKIE);
}

export function validAdminCredentials(email: string, password: string): boolean {
  const configuredEmail = process.env.RENTROOMS_ADMIN_EMAIL;
  const configuredPassword = process.env.RENTROOMS_ADMIN_PASSWORD;
  if (!configuredEmail || !configuredPassword) return false;
  const submittedEmail = Buffer.from(email.toLowerCase());
  const expectedEmail = Buffer.from(configuredEmail.toLowerCase());
  const submittedPassword = Buffer.from(password);
  const expectedPassword = Buffer.from(configuredPassword);
  return submittedEmail.length === expectedEmail.length &&
    submittedPassword.length === expectedPassword.length &&
    timingSafeEqual(submittedEmail, expectedEmail) &&
    timingSafeEqual(submittedPassword, expectedPassword);
}
