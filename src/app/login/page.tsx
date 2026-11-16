import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/forms";
import { currentUser } from "@/lib/security";

export const metadata: Metadata = { title: "Log in" };
export const dynamic = "force-dynamic";

export default async function LoginPage() {
  if (await currentUser()) redirect("/dashboard");
  const ready = Boolean(process.env.RENTROOMS_SESSION_SECRET && process.env.RENTROOMS_SESSION_SECRET.length >= 32);
  return <main className="auth-section"><section className="auth-card"><div className="auth-icon">↗</div><h1>Welcome back</h1><p>Log in to save rooms and manage your requests.</p>{!ready && <div className="setup-warning"><b>Setup required</b><br />Add a 32+ character RENTROOMS_SESSION_SECRET to `.env.local` and your Vercel project settings before signing in.</div>}<LoginForm /></section></main>;
}
