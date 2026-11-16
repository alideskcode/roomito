"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { ArrowRight, AtSign, Heart, MessageCircle, Phone } from "lucide-react";
import { BROKER_TEL, BROKER_WHATSAPP, INSTAGRAM_URL } from "@/lib/constants";
import type { PublicRoom } from "@/lib/rooms";
import { useRouter } from "next/navigation";

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="container footer-main">
        <div>
          <Link href="/" className="brand footer-brand"><span className="brand-mark">R</span><span>Rent Rooms <b>Dehradun</b></span></Link>
          <p>Room finding, made a little easier.</p>
        </div>
        <div className="footer-links">
          <Link href="/rooms">Browse rooms</Link><Link href="/contact">Contact</Link>
          <Link href="/privacy">Privacy Policy</Link><Link href="/terms">Terms</Link>
        </div>
        <div className="footer-contact">
          <a href={BROKER_TEL}><Phone size={16} /> +91 98372 74296</a>
          <a href={INSTAGRAM_URL} target="_blank" rel="noreferrer"><AtSign size={16} /> @rentroomsdehradun</a>
        </div>
      </div>
      <div className="container footer-bottom">
        <p><b>Brokerage: 50% of one month&apos;s rent.</b> We are a room broking service.</p>
        <span>© {new Date().getFullYear()} Rent Rooms Dehradun</span>
      </div>
    </footer>
  );
}

export function FloatingWhatsApp() {
  return <a className="floating-whatsapp" href={BROKER_WHATSAPP} target="_blank" rel="noreferrer" aria-label="Chat with Rent Rooms Dehradun on WhatsApp"><MessageCircle size={23} /><span>Chat with us</span></a>;
}

export function RoomCard({ room, initialSaved = false }: { room: PublicRoom; initialSaved?: boolean }) {
  const router = useRouter();
  const [saved, setSaved] = useState(initialSaved);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function toggleSave() {
    if (busy) return;
    setError("");
    setBusy(true);
    try {
      const sessionResponse = await fetch("/api/auth/me");
      if (!sessionResponse.ok) throw new Error("We couldn't check your sign-in. Please try again.");
      const session = await sessionResponse.json();
      if (!session.user) {
        router.push(`/login?next=${encodeURIComponent(window.location.pathname)}`);
        return;
      }
      const response = await fetch("/api/saved-rooms", {
        method: saved ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomId: room.id }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Couldn't update saved rooms.");
      setSaved(!saved);
    } catch (issue) {
      setError(issue instanceof Error ? issue.message : "Couldn't update saved rooms.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <article className="room-card">
      <div className="room-card-photo">
        <Link href={`/rooms/${room.id}`} className="room-photo-link" aria-label={`View ${room.room_code}`}>
          {room.images?.[0] ? <Image src={`/api/images/${room.images[0]}`} alt={`${room.area} room`} fill sizes="(max-width: 700px) 90vw, (max-width: 1100px) 45vw, 30vw" unoptimized /> : <div className="photo-placeholder"><span>Room photo</span></div>}
        </Link>
        <span className={`availability ${room.is_available ? "available" : "booked"}`}>{room.is_available ? "Available" : "Booked"}</span>
        <button className={`save-button ${saved ? "saved" : ""}`} onClick={toggleSave} disabled={busy} aria-label={saved ? "Remove from saved rooms" : "Save room"}>
          <Heart size={18} fill={saved ? "currentColor" : "none"} />
        </button>
      </div>
      <div className="room-card-body">
        <div className="room-card-topline"><span className="room-code">{room.room_code}</span><span>{room.audience || "Any"}</span></div>
        <h3><Link href={`/rooms/${room.id}`}>{room.area}</Link></h3>
        <p className="room-type">{room.room_type} · {room.audience || "Any"}</p>
        <div className="room-card-bottom">
          <div><strong>₹{Number(room.rent).toLocaleString("en-IN")}<small>/month</small></strong><span>Security ₹{Number(room.security_deposit).toLocaleString("en-IN")}</span></div>
          <Link className="circle-arrow" href={`/rooms/${room.id}`} aria-label={`View ${room.room_code}`}><ArrowRight size={18} /></Link>
        </div>
        {error && <p className="inline-error">{error}</p>}
      </div>
    </article>
  );
}

export function SearchBar({ areas = [] }: { areas?: { name: string; count?: number }[] }) {
  return (
    <form className="search-bar" action="/rooms" method="get">
      <label><span>Area</span><select name="area" defaultValue=""><option value="">Any area</option>{areas.map((area) => <option value={area.name} key={area.name}>{area.name}{area.count ? ` (${area.count})` : ""}</option>)}</select></label>
      <label><span>Max budget</span><div className="budget-input"><b>₹</b><input name="maxBudget" type="number" min="0" placeholder="e.g. 10,000" /></div></label>
      <label><span>Room for</span><select name="for" defaultValue=""><option value="">Any</option><option>Boys PG</option><option>Girls PG</option><option>Family</option></select></label>
      <button className="button button-orange search-submit" type="submit">Find a room <ArrowRight size={17} /></button>
    </form>
  );
}
