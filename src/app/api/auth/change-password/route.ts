import { NextResponse } from "next/server";
import { currentUser, hashPassword, verifyPassword } from "@/lib/security";
import { query } from "@/lib/db";
import { errorResponse, requireDatabase } from "@/lib/http";
import { passwordValue, validPassword } from "@/lib/validation";

export async function POST(request: Request) {
  const unavailable = requireDatabase();
  if (unavailable) return unavailable;
  const user = await currentUser();
  if (!user) return errorResponse("Please sign in to change your password.", 401);
  const form = await request.formData();
  const currentPassword = passwordValue(form.get("currentPassword"));
  const newPassword = passwordValue(form.get("newPassword"));
  if (!validPassword(newPassword)) return errorResponse("Use a new password with 10–72 characters.");
  const result = await query<{ password_hash: string }>("SELECT password_hash FROM users WHERE id = $1", [user.id]);
  if (!result.rows[0] || !(await verifyPassword(currentPassword, result.rows[0].password_hash))) {
    return errorResponse("Your current password is incorrect.", 401);
  }
  await query("UPDATE users SET password_hash = $1 WHERE id = $2", [await hashPassword(newPassword), user.id]);
  return NextResponse.json({ ok: true });
}
