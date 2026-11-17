import { randomBytes } from "node:crypto";
import type { User } from "@supabase/supabase-js";
import { hashPassword, type CurrentUser } from "@/lib/security";
import { transaction } from "@/lib/db";
import { digits, validEmail } from "@/lib/validation";

function googleProfile(authUser: User) {
  const hasGoogleIdentity = authUser.app_metadata.provider === "google" ||
    authUser.identities?.some((identity) => identity.provider === "google");
  const email = authUser.email?.trim().toLowerCase() || "";

  if (!hasGoogleIdentity || !authUser.email_confirmed_at || !validEmail(email)) {
    throw new Error("Google sign-in did not return a verified Google email address.");
  }

  const metadataName = authUser.user_metadata.full_name || authUser.user_metadata.name;
  const name = typeof metadataName === "string" && metadataName.trim()
    ? metadataName.trim().slice(0, 100)
    : email.split("@")[0].slice(0, 100);

  return { email, name };
}

export async function connectGoogleAccount(authUser: User, mobile?: string): Promise<CurrentUser | null> {
  const { email, name } = googleProfile(authUser);
  if (mobile && !digits(mobile)) throw new Error("Enter a valid 10-digit mobile number.");
  const passwordHash = mobile
    ? await hashPassword(randomBytes(32).toString("base64url"))
    : null;

  return transaction(async (client) => {
    const linked = await client.query<CurrentUser>(
      `SELECT u.id, u.name, u.mobile, u.email, u.role, u.is_blocked
       FROM user_auth_identities i
       JOIN users u ON u.id = i.user_id
       WHERE i.provider = 'google' AND i.provider_user_id = $1
       FOR UPDATE OF u`,
      [authUser.id],
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
        [authUser.id, existing.rows[0].id],
      );
      const identity = await client.query<{ user_id: string }>(
        `SELECT user_id FROM user_auth_identities
         WHERE provider = 'google' AND provider_user_id = $1`,
        [authUser.id],
      );
      if (identity.rows[0]?.user_id !== existing.rows[0].id) {
        throw new Error("This Google account is already linked to another Roomito account.");
      }
      return existing.rows[0];
    }

    if (!mobile || !passwordHash) return null;

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
      [authUser.id, user.id],
    );
    return user;
  });
}
