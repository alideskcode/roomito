import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { SignupForm } from "@/components/forms";
import { currentUser } from "@/lib/security";

export const metadata: Metadata = { title: "Create an account" };
export const dynamic = "force-dynamic";

export default async function SignupPage() {
  if (await currentUser()) redirect("/dashboard");
  return <main className="auth-section"><section className="auth-card"><div className="auth-icon">＋</div><h1>Create your account</h1><p>Save rooms, follow requests and manage your details.</p><SignupForm /></section></main>;
}
