import type { Metadata } from "next";
import Link from "next/link";
import { currentUser } from "@/lib/security";
import { OwnerForm } from "@/components/forms";
import { BROKER_PHONE } from "@/lib/constants";

export const metadata: Metadata = { title: "List your room" };
export const dynamic = "force-dynamic";

export default async function OwnerPage() {
  const user = await currentUser();
  return (
    <main>
      <section className="page-intro">
        <div className="container">
          <span className="eyebrow">FOR ROOM OWNERS</span>
          <h1>List your room in <em>Dehradun</em></h1>
          <p>Tell us about your room. Our team reviews every listing before it goes live.</p>
        </div>
      </section>
      <section className="form-page">
        <div className="container form-page-layout">
          <div className="form-page-main">
            {user ? (
              <>
                <h2>Room details</h2>
                <p>Required information is marked in the form. Photos are optional.</p>
                <OwnerForm user={user} />
              </>
            ) : (
              <div className="auth-card">
                <h2>Sign in to list your room</h2>
                <p>Only signed-in users can submit room listings.</p>
                <div className="form-stack">
                  <Link className="button button-orange button-full" href="/login">Log in</Link>
                  <Link className="button button-light button-full" href="/signup">Create an account</Link>
                </div>
              </div>
            )}
          </div>
          <aside className="form-aside">
            <h3>Your details stay private</h3>
            <p>Your name, mobile number and exact address are visible only to the broker and administrator, never on public listings.</p>
            <p>After submission, WhatsApp opens with your details ready to send to the broker.</p>
            <a className="button button-blue" href={`tel:+91${BROKER_PHONE}`}>Call the broker</a>
          </aside>
        </div>
      </section>
    </main>
  );
}
