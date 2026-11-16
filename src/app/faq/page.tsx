import type { Metadata } from "next";

export const metadata: Metadata = { title: "Frequently asked questions" };
const faqs = [
  ["Where do you list rooms?", "Our listings focus on Dehradun, especially near Graphic Era University, Turner Road and ISBT."],
  ["What is the brokerage?", "Brokerage is 50% of one month's rent. We are a room broking service; please confirm the terms with the broker before proceeding."],
  ["Can I browse without signing in?", "Yes. Browsing room listings is public. Sign in only when you want to save rooms or view your dashboard."],
  ["How do I list my room?", "Submit the room details and optional photos using the List your room form. Our team reviews submissions before anything appears publicly."],
  ["Will my address or number be public?", "No. Owner names, owner mobile numbers and exact addresses are kept private. Public listings show only the Rent Rooms Dehradun broker contact."],
  ["Are room photos reviewed before publishing?", "Yes. Photos from pending submissions are restricted to the admin panel and are shown on the public listing only after approval."],
  ["How can I check a room's facilities or distance?", "Facilities and distance are shown when available. Contact our broker to confirm current details before visiting."],
];

export default function FAQPage() {
  return <main><section className="page-intro"><div className="container"><span className="eyebrow">GOOD TO KNOW</span><h1>Frequently asked <em>questions</em></h1><p>Some quick answers to help with your room search.</p></div></section>
    <section className="page-section container page-content">{faqs.map(([question, answer]) => <article className="faq-item" key={question}><h2>{question}</h2><p>{answer}</p></article>)}</section>
  </main>;
}
