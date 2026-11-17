import type { Metadata } from "next";
import { GoogleProfileCompletionForm } from "@/components/google-auth";

export const metadata: Metadata = { title: "Complete your account" };

export default function CompleteGoogleProfilePage() {
  return (
    <main className="auth-section">
      <section className="auth-card">
        <div className="auth-icon">✓</div>
        <h1>One last step</h1>
        <p>Roomito needs your 10-digit mobile number to finish setting up your renter account.</p>
        <GoogleProfileCompletionForm />
      </section>
    </main>
  );
}
