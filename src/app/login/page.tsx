import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/forms";
import { GoogleSignInButton } from "@/components/google-auth";
import { currentUser } from "@/lib/security";

export const metadata: Metadata = { title: "Log in" };
export const dynamic = "force-dynamic";

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  if (await currentUser()) redirect("/dashboard");
  const params = await searchParams;
  const googleError = params.error === "blocked"
    ? "This account is currently blocked. Please contact the broker."
    : params.error === "google"
      ? "Google sign-in couldn't be completed. Please try again."
      : undefined;
  const ready = Boolean(process.env.RENTROOMS_SESSION_SECRET && process.env.RENTROOMS_SESSION_SECRET.length >= 32);
  const googleReady = Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET && process.env.GOOGLE_REDIRECT_URI);

  return (
    <main className="auth-section">
      <section className="auth-card">
        <div className="auth-icon">↗</div>
        <h1>Welcome back</h1>
        <p>Log in to save rooms and manage your requests.</p>
        {!ready && <div className="setup-warning"><b>Setup required</b><br />Add a 32+ character RENTROOMS_SESSION_SECRET to `.env.local` and your Vercel project settings before signing in.</div>}
        {!googleReady && <div className="setup-warning"><b>Google sign-in setup required</b><br />Set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_REDIRECT_URI in your environment.</div>}
        <GoogleSignInButton errorMessage={googleError} />
        <div className="auth-divider"><span>or continue with email</span></div>
        <LoginForm />
      </section>
    </main>
  );
}
