import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "How it works" };

const steps = [
  ["01", "Tell us what you need", "Share your preferred area, budget, room type and move-in details. A room request is saved for our team."],
  ["02", "We help you connect", "We review available listings and contact you using the details you provided. You can also reach the broker directly."],
  ["03", "Visit and decide", "Check the room and agree on the rental terms directly with the owner before making a decision."],
];

export default function HowItWorksPage() {
  return <main><section className="page-intro"><div className="container"><span className="eyebrow">SIMPLE, LOCAL, HUMAN</span><h1>How it <em>works</em></h1><p>A straightforward way to find or list a room in Dehradun.</p></div></section>
    <section className="page-section container"><div className="content-grid">{steps.map(([number, title, description]) => <article className="content-card" key={number}><span className="step-number">{number}</span><h2>{title}</h2><p>{description}</p></article>)}</div>
      <div className="page-content"><h2>Our brokerage</h2><p>Rent Rooms Dehradun is a room broking service. Brokerage is 50% of one month&apos;s rent. Confirm all costs and terms before you proceed with a room.</p><Link className="button button-orange" href="/requirements">Tell us what you need</Link></div>
    </section>
  </main>;
}
