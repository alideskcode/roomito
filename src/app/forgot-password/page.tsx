import type { Metadata } from "next";
import { ForgotPasswordForm } from "@/components/forms";

export const metadata: Metadata = { title: "Forgot password" };

export default function ForgotPasswordPage() {
  const mailReady = Boolean(process.env.RESEND_API_KEY && process.env.RESEND_FROM_EMAIL);
  return <main className="auth-section"><section className="auth-card"><div className="auth-icon">?</div><h1>Reset your password</h1><p>We&apos;ll email a one-time reset link if that address has an account.</p>{!mailReady && <div className="setup-warning"><b>Email setup required</b><br />Set RESEND_API_KEY and RESEND_FROM_EMAIL in `.env.local` and Vercel project settings.</div>}<ForgotPasswordForm /></section></main>;
}
