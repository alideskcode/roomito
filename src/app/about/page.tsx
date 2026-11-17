import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: { absolute: "About Roomito | Founded by Syed Ali Mohammad" },
  description: "Learn about Roomito, Dehradun's premier room and PG rental platform founded by Syed Ali Mohammad.",
};

export default function AboutPage() {
  return (
    <main>
      <section className="page-intro">
        <div className="container">
          <span className="eyebrow">FOUNDED BY SYED ALI MOHAMMAD</span>
          <h1>Rooted in <em>Dehradun</em>, Built for Students.</h1>
          <p>Roomito is Dehradun&apos;s trusted digital platform connecting room seekers with verified PGs and rooms, making student housing safe, seamless, and transparent.</p>
        </div>
      </section>
      <section className="page-section container page-content">
        <article className="content-card founder-card">
          <span className="eyebrow">OUR FOUNDER &amp; VISION</span>
          <h2>Meet the Founder</h2>
          <p>Roomito was founded by Syed Ali Mohammad with a clear vision: to eliminate the stress of finding trusted student accommodation in Dehradun. By combining local expertise with digital transparency, Syed Ali Mohammad built Roomito to bridge the gap between verified property owners and room seekers around hubs like Graphic Era University, Turner Road, and ISBT.</p>
        </article>
        <h2>Local help, clear expectations</h2>
        <p>Roomito helps people find PGs and rooms around Graphic Era University, Turner Road, and ISBT. We operate as a professional broker-assisted service. Owner privacy is protected—property details are verified while keeping direct owner numbers private until matched through our secure system.</p>
        <h2>Looking for a room?</h2>
        <p>Browse public listings or send us a requirement with your preferred area, budget and move-in date.</p>
        <Link className="button button-orange" href="/requirements">Share your requirements</Link>
      </section>
    </main>
  );
}
