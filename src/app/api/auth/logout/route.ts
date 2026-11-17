import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { clearUserSession } from "@/lib/security";
import { cookies } from "next/headers";

export async function POST() {
  const cookieStore = await cookies();
  const hasSupabaseSession = cookieStore.getAll().some(({ name }) => name.startsWith("sb-") && /-auth-token(?:\.\d+)?$/.test(name));
  if (hasSupabaseSession) {
    const supabase = await createClient();
    const { error } = await supabase.auth.signOut({ scope: "local" });
    if (error) {
      console.error("Could not clear the Supabase session during logout:", error.message);
      return NextResponse.json({ error: "We couldn't complete sign out. Please try again." }, { status: 500 });
    }
  }
  await clearUserSession();
  return NextResponse.json({ ok: true });
}
