import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, MapPin, Phone } from "lucide-react";
import { getPublicRoom } from "@/lib/rooms";
import { BROKER_TEL, BROKER_WHATSAPP } from "@/lib/constants";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Room details in Dehradun" };

export default async function RoomDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let room;
  let loadError = false;
  try {
    room = await getPublicRoom(id);
  } catch (error) {
    console.error("Room details could not be loaded:", error);
    loadError = true;
  }
  if (loadError) return <main className="page-section container"><div className="empty-public"><h1>Room details are temporarily unavailable</h1><p>Please try again shortly.</p><Link className="button button-blue" href="/rooms">Back to rooms</Link></div></main>;
  if (!room) notFound();
  const photos = room.images.slice(0, 5);
  const whatsapp = `${BROKER_WHATSAPP}?text=${encodeURIComponent(`Hi, I'm interested in room ${room.room_code}`)}`;
  return <main className="detail-wrap">
    <div className="container">
      <Link href="/rooms" className="back-link"><ArrowLeft size={15} /> All rooms</Link>
      <div className="detail-top"><div><span className="room-code">{room.room_code}</span><h1>{room.area}</h1><p><MapPin size={14} /> {room.area}, Dehradun · {room.audience}</p></div><div className="detail-price"><strong>₹{Number(room.rent).toLocaleString("en-IN")}<small>/month</small></strong><span>Security deposit ₹{Number(room.security_deposit).toLocaleString("en-IN")}</span></div></div>
      <div className={`gallery${photos.length ? ` gallery-count-${photos.length}` : ""}`}>{photos.length ? photos.map((photo, index) => <Image src={`/api/images/${photo}`} alt={`${room.area} room photo ${index + 1}`} width={760} height={480} key={photo} unoptimized />) : <div className="photo-placeholder"><span>Photos coming soon</span></div>}</div>
      <div className="detail-columns">
        <div className="detail-panel"><h2>Room details</h2><div className="detail-stats"><div><span>Room type</span><b>{room.room_type}</b></div><div><span>Suitable for</span><b>{room.audience}</b></div><div><span>Availability</span><b>{room.is_available ? "Available" : "Booked"}</b></div><div><span>Area</span><b>{room.area}</b></div><div><span>Distance from Graphic Era University</span><b>{room.distance_geu || "Ask us for current distance"}</b></div></div>
          <h2 style={{ marginTop: 24 }}>Facilities</h2>{room.facilities.length ? <div className="facilities-list">{room.facilities.map((facility) => <span className="facility-chip" key={facility}>{facility}</span>)}</div> : <p className="room-type">Contact us to confirm the facilities available at this property.</p>}
        </div>
        <aside className="broker-contact"><h2>Interested in this room?</h2><p>Speak with our Dehradun broker. Your call connects only to Rent Rooms Dehradun.</p><a className="button button-orange" href={BROKER_TEL}><Phone size={16} /> Call Me</a><a className="button button-green" href={whatsapp} target="_blank" rel="noreferrer">WhatsApp Me</a></aside>
      </div>
    </div>
  </main>;
}
