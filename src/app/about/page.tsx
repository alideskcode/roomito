import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "About Rent Rooms Dehradun" };

export default function AboutPage() {
  return <main><section className="page-intro"><div className="container"><span className="eyebrow">A LOCAL ROOM BROKING SERVICE</span><h1>Rooted in <em>Dehradun</em></h1><p>Helping room seekers and owners connect around the places people live, study and work.</p></div></section>
    <section className="page-section container page-content"><h2>Local help, clear expectations</h2><p>Rent Rooms Dehradun helps people find PGs and rooms around Graphic Era University, Turner Road and ISBT. We work as a room broking service and share the brokerage upfront: 50% of one month&apos;s rent.</p><p>Room owners submit listings for review before publication. We keep owner names, mobile numbers and exact addresses private; public listings show only our broker contact details.</p><h2>Looking for a room?</h2><p>Browse public listings or send us a requirement with your preferred area, budget and move-in date.</p><Link className="button button-orange" href="/requirements">Share your requirements</Link></section>
  </main>;
}
