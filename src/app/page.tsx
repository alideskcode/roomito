import Link from "next/link";
import { ArrowRight, BadgeCheck, Building2, MapPin, ShieldCheck } from "lucide-react";
import { SearchBar, RoomCard } from "@/components/site";
import { getAreas, listPublicRooms } from "@/lib/rooms";
import { PINNED_AREAS } from "@/lib/constants";
import type { PublicRoom } from "@/lib/rooms";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  let areas = PINNED_AREAS.map((name) => ({ name, count: 0 }));
  let rooms: PublicRoom[] = [];
  let dataMessage = process.env.DATABASE_URL ? "" : "Room listings will appear here once the Supabase database is connected.";
  if (process.env.DATABASE_URL) {
    try {
      const [loadedAreas, loadedRooms] = await Promise.all([getAreas(), listPublicRooms()]);
      areas = loadedAreas.length ? loadedAreas : areas;
      rooms = loadedRooms.slice(0, 3);
    } catch (error) {
      console.error("Homepage listings could not be loaded:", error);
      dataMessage = "Room listings are temporarily unavailable. Please try again shortly.";
    }
  }
  return <main>
    <section className="hero-section">
      <div className="hero-orb hero-orb-one" /><div className="hero-orb hero-orb-two" />
      <div className="container hero-layout">
        <div className="hero-copy">
          <div className="eyebrow"><span className="eyebrow-dot" /> YOUR DEHRADUN ROOM SEARCH STARTS HERE</div>
          <h1>Find your room<br />in <em>Dehradun.</em></h1>
          <p>Verified PGs and rooms near Graphic Era University.</p>
          <div className="hero-trust"><span><ShieldCheck size={17} /> Broker-assisted search</span><span><BadgeCheck size={17} /> Local area guidance</span></div>
        </div>
        <div className="hero-card">
          <div className="hero-card-heading"><div><span className="eyebrow small">LET&apos;S FIND YOUR FIT</span><h2>Start your search</h2></div><div className="hero-card-icon"><MapPin size={22} /></div></div>
          <SearchBar areas={areas} />
          <div className="quick-areas"><span>Popular areas</span>{areas.slice(0, 3).map((area) => <Link key={area.name} href={`/rooms?area=${encodeURIComponent(area.name)}`}>{area.name}</Link>)}</div>
        </div>
      </div>
      <div className="container hero-bottom">
        <span>Helping you find your next place in the city.</span><span className="hero-location"><MapPin size={15} /> Dehradun, Uttarakhand</span>
      </div>
    </section>

    <section className="container intent-section">
      <Link href="/requirements" className="intent-card intent-primary"><span className="intent-icon"><Building2 size={22} /></span><span><b>Looking for a room?</b><small>Tell us what you need and we&apos;ll help you find a match.</small></span><ArrowRight size={20} /></Link>
      <Link href="/owner" className="intent-card"><span className="intent-icon soft-orange"><BadgeCheck size={22} /></span><span><b>Have a room to rent out?</b><small>Share your listing with room seekers in Dehradun.</small></span><ArrowRight size={20} /></Link>
    </section>

    <section className="section container">
      <div className="section-heading"><div><span className="eyebrow">A PLACE TO CALL YOUR OWN</span><h2>Recently listed <em>rooms</em></h2><p>Browse available options around Dehradun.</p></div><Link className="text-link" href="/rooms">Explore all rooms <ArrowRight size={17} /></Link></div>
      {dataMessage && <p className="data-notice" role="status">{dataMessage}</p>}
      {rooms.length ? <div className="room-grid">{rooms.map((room) => <RoomCard key={room.id} room={room} />)}</div> : <div className="empty-public"><div className="empty-illustration"><Building2 size={30} /></div><h3>{dataMessage ? "Listings are getting ready" : "Good rooms are worth waiting for"}</h3><p>{dataMessage || "There aren’t any approved listings just yet. Tell us what you’re looking for and we’ll be in touch."}</p><Link className="button button-blue" href={dataMessage ? "/contact" : "/requirements"}>{dataMessage ? "Contact the broker" : "Share your requirements"} <ArrowRight size={16} /></Link></div>}
    </section>

    <section className="trust-band"><div className="container trust-band-inner"><div><span className="eyebrow">LOCAL KNOW-HOW, HUMAN HELP</span><h2>More than a listing.<br /><em>A helpful local connection.</em></h2></div><div className="trust-items"><p><ShieldCheck size={20} /> We help you connect with room owners</p><p><MapPin size={20} /> Focused on Graphic Era, Turner Road &amp; ISBT</p><p><BadgeCheck size={20} /> Clear brokerage, shared upfront</p></div></div></section>
  </main>;
}
