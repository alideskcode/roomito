import type { Metadata } from "next";
import { AtSign, Phone } from "lucide-react";
import { BROKER_PHONE, BROKER_TEL, INSTAGRAM_URL, BROKER_WHATSAPP } from "@/lib/constants";

export const metadata: Metadata = { title: "Contact Rent Rooms Dehradun" };

export default function ContactPage() {
  return <main><section className="page-intro"><div className="container"><span className="eyebrow">WE&apos;RE HERE TO HELP</span><h1>Let&apos;s talk about <em>rooms</em></h1><p>Reach the Rent Rooms Dehradun broker directly.</p></div></section>
    <section className="page-section container"><div className="contact-card"><h2>Contact the broker</h2><div className="contact-card-links"><a href={BROKER_TEL}><Phone size={20} /><span>+91 {BROKER_PHONE}<small>Call Rent Rooms Dehradun</small></span></a><a href={BROKER_WHATSAPP} target="_blank" rel="noreferrer"><Phone size={20} /><span>WhatsApp us<small>Chat with the broker</small></span></a><a href={INSTAGRAM_URL} target="_blank" rel="noreferrer"><AtSign size={20} /><span>@rentroomsdehradun<small>Instagram</small></span></a></div></div></section>
  </main>;
}
