import type { Metadata } from "next";
import { ResetPasswordForm } from "@/components/forms";

export const metadata: Metadata = { title: "Choose a new password" };

export default async function ResetPasswordPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const token = typeof params.token === "string" ? params.token : "";
  return <main className="auth-section"><section className="auth-card"><div className="auth-icon">✓</div><h1>Choose a new password</h1><p>Reset links can only be used once and expire after 30 minutes.</p>{token ? <ResetPasswordForm token={token} /> : <p className="form-error">This reset link is incomplete. Request a new one from the login page.</p>}</section></main>;
}
