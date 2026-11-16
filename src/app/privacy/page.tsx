import type { Metadata } from "next";

export const metadata: Metadata = { title: "Privacy policy" };

export default function PrivacyPage() {
  return <main><section className="page-intro"><div className="container"><span className="eyebrow">YOUR INFORMATION</span><h1>Privacy <em>policy</em></h1><p>How Rent Rooms Dehradun handles information submitted through this website.</p></div></section>
    <section className="page-section container page-content"><h2>Information we collect</h2><p>Account details (name, mobile number, email and password hash), room listing details and renter requirements are collected to provide room broking services and account features. Passwords are stored as secure hashes, not readable text.</p><h2>Private listing information</h2><p>Owner names, owner mobile numbers and exact addresses are for broker and administrator use. They are never included in public listing pages. Pending and cancelled listing images are served only to authorized administrators through this website.</p><h2>How information is used</h2><p>We use the details you submit to review room listings, respond to requirements, manage accounts and contact you about the service. When you choose to continue to WhatsApp, your device opens a message addressed to Rent Rooms Dehradun.</p><h2>Data storage and security</h2><p>Information is stored in the application database. We use access controls, secure cookies and password hashing. No internet service can guarantee absolute security; please use a unique password and do not share your sign-in details.</p><h2>Your choices</h2><p>You can update your profile and password from your dashboard. For questions about the information you submitted, contact the broker using the details on our Contact page.</p></section>
  </main>;
}
