import { NextResponse } from "next/server";
import { currentUser } from "@/lib/security";
import { query } from "@/lib/db";
import { digits, text, validEmail } from "@/lib/validation";
import { errorResponse, requireDatabase } from "@/lib/http";

export async function PATCH(request: Request) {
  const unavailable = requireDatabase();
  if (unavailable) return unavailable;
  const user = await currentUser();
  if (!user) return errorResponse("Please sign in to update your profile.", 401);
  const form = await request.formData();
  const name = text(form.get("name"), 100);
  const mobile = text(form.get("mobile"), 10);
  const email = text(form.get("email"), 254).toLowerCase();
  if (!name || !digits(mobile) || !validEmail(email)) return errorResponse("Enter a name, valid email, and 10-digit mobile number.");
  try {
    await query("UPDATE users SET name = $1, mobile = $2, email = $3 WHERE id = $4", [
      name,
      mobile,
      email,
      user.id,
    ]);
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && error.code === "23505") {
      return errorResponse("That email or mobile is already used by another account.", 409);
    }
    console.error("Profile update failed:", error);
    return errorResponse("We couldn't update your profile.", 500);
  }
}
