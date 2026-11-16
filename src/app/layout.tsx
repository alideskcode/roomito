import type { Metadata } from "next";
import "./globals.css";
import { Footer, FloatingWhatsApp } from "@/components/site";
import { Header } from "@/components/header";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://rentroomsdehradun.com"),
  title: {
    default: "Rent Rooms Dehradun | PGs & Rooms Near Graphic Era, ISBT",
    template: "%s | Rent Rooms Dehradun",
  },
  description: "Find a PG in Dehradun, rooms near Graphic Era University, Turner Road and ISBT. Local help for renters and room owners.",
  keywords: ["PG in Dehradun", "rooms near Graphic Era University", "PG near ISBT Dehradun", "Turner Road PG"],
  openGraph: {
    title: "Rent Rooms Dehradun",
    description: "Find your room in Dehradun. Verified PGs and rooms near Graphic Era University.",
    type: "website",
    locale: "en_IN",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>
        <Header />
        {children}
        <Footer />
        <FloatingWhatsApp />
      </body>
    </html>
  );
}
