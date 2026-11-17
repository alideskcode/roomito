"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

function GoogleMark() {
  return (
    <svg className="google-signin-icon" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#4285F4" d="M43.611 20.083H42V20H24v8h11.303A12 12 0 1 1 24 12c3.06 0 5.842 1.154 7.961 3.039l5.657-5.657A19.922 19.922 0 0 0 24 4a20 20 0 1 0 19.611 16.083Z" />
      <path fill="#34A853" d="M6.306 14.691 12.88 19.51A12 12 0 0 1 24 12c3.06 0 5.842 1.154 7.961 3.039l5.657-5.657A19.922 19.922 0 0 0 24 4 19.99 19.99 0 0 0 6.306 14.691Z" />
      <path fill="#FBBC05" d="M24 44c5.367 0 10.21-2.05 13.86-5.398l-6.396-5.414A11.93 11.93 0 0 1 24 36a12 12 0 0 1-11.101-7.44l-6.522 5.025A19.93 19.93 0 0 0 24 44Z" />
      <path fill="#EA4335" d="M43.611 20.083H42V20H24v8h11.303a12.02 12.02 0 0 1-5.84 5.188l6.397 5.414C40.12 35.84 44 30.39 44 24c0-1.34-.138-2.65-.389-3.917Z" />
    </svg>
  );
}

export function GoogleSignInButton({ errorMessage }: { errorMessage?: string }) {
  return (
    <>
      <a className="google-signin-button" href="/api/auth/google">
        <GoogleMark />
        Sign in with Google
      </a>
      {errorMessage && <p className="form-error" role="alert">{errorMessage}</p>}
    </>
  );
}

export function GoogleProfileCompletionForm() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function completeProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");

    try {
      const response = await fetch("/api/auth/google/complete", {
        method: "POST",
        body: new FormData(event.currentTarget),
        credentials: "same-origin",
      });
      const data = await response.json().catch(() => ({
        error: response.statusText || "We couldn't finish setting up your account.",
      }));
      if (!response.ok) throw new Error(data.error || "We couldn't finish setting up your account.");
      router.replace(data.redirectTo || "/dashboard");
      router.refresh();
    } catch (issue) {
      setError(issue instanceof Error ? issue.message : "We couldn't finish setting up your account.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="form-stack" onSubmit={(event) => void completeProfile(event)}>
      <label>
        Mobile number
        <input name="mobile" type="tel" inputMode="numeric" pattern="[0-9]{10}" maxLength={10} required placeholder="10-digit mobile number" autoComplete="tel-national" />
      </label>
      <button className="button button-orange button-full" disabled={busy}>
        {busy ? "Setting up your account…" : "Continue to Roomito"}
      </button>
      {error && <p className="form-error" role="alert">{error}</p>}
    </form>
  );
}
