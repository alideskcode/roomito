import type { Metadata } from "next";

export const metadata: Metadata = { title: "Terms of service" };

export default function TermsPage() {
  return <main><section className="page-intro"><div className="container"><span className="eyebrow">PLEASE READ</span><h1>Terms of <em>service</em></h1><p>Important information about using Rent Rooms Dehradun.</p></div></section>
    <section className="page-section container page-content"><h2>Brokerage service</h2><p>Rent Rooms Dehradun is a room broking service, not a landlord or property manager. Brokerage is 50% of one month&apos;s rent. Confirm the full amount and any other terms with the broker before proceeding.</p><h2>Listings</h2><p>Listings are submitted by room owners and reviewed before publication. Information may change or become unavailable. Verify availability, facilities, rent, deposit and property conditions directly before making a decision.</p><h2>Use of the website</h2><p>Provide accurate information, use your own account, and do not submit unlawful, misleading or abusive content. We may restrict accounts or remove submissions that violate these terms.</p><h2>WhatsApp and external services</h2><p>Some forms offer to open WhatsApp with a pre-filled message. You choose whether to send it. External services have their own terms and privacy policies.</p><h2>Contact</h2><p>For questions about these terms, contact Rent Rooms Dehradun using the phone number or Instagram account shown on the Contact page.</p></section>
  </main>;
}
