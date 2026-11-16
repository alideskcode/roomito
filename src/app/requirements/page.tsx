import type { Metadata } from "next";
import { currentUser } from "@/lib/security";
import { RequirementForm } from "@/components/forms";
import { BROKER_PHONE } from "@/lib/constants";

export const metadata: Metadata = { title: "Tell us what room you need" };
export const dynamic = "force-dynamic";

export default async function RequirementsPage() {
  const user = await currentUser();
  return <main><section className="page-intro"><div className="container"><span className="eyebrow">FOR ROOM SEEKERS</span><h1>Tell us what you <em>need</em></h1><p>Share your preferences and we&apos;ll help you explore PGs and rooms in Dehradun.</p></div></section>
    <section className="form-page"><div className="container form-page-layout"><div className="form-page-main"><h2>Your room requirement</h2><p>Be as specific as you like. You can submit without creating an account.</p><RequirementForm user={user} /></div><aside className="form-aside"><h3>Looking around?</h3><p>We focus on rooms near Graphic Era University, Turner Road and ISBT.</p><p>Submitting this form saves your request and opens WhatsApp with the full details for our broker.</p><a className="button button-blue" href={`tel:+91${BROKER_PHONE}`}>Call the broker</a></aside></div></section>
  </main>;
}
