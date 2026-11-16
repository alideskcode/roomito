import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AdminLogin } from "@/components/admin";
import { isAdmin } from "@/lib/security";

export const metadata: Metadata = { title: "Admin login", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function AdminLoginPage() {
  if (await isAdmin()) redirect("/admin");
  const configured = Boolean(
    process.env.DATABASE_URL &&
    process.env.RENTROOMS_ADMIN_EMAIL &&
    process.env.RENTROOMS_ADMIN_PASSWORD &&
    process.env.RENTROOMS_SESSION_SECRET &&
    process.env.RENTROOMS_SESSION_SECRET.length >= 32
  );
  return <main className="auth-section"><AdminLogin configured={configured} /></main>;
}
