import type { Metadata } from "next";
import Link from "next/link";
import { RoomCard } from "@/components/site";
import { RoomFilters } from "@/components/room-filters";
import { getAreas, listPublicRooms } from "@/lib/rooms";
import { PINNED_AREAS } from "@/lib/constants";
import type { PublicRoom } from "@/lib/rooms";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Rooms & PGs in Dehradun",
  description: "Browse rooms and PGs near Graphic Era University, Turner Road and ISBT, Dehradun.",
};

export default async function RoomsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const area = typeof params.area === "string" ? params.area : "";
  const maxBudget = typeof params.maxBudget === "string" ? params.maxBudget : "";
  const audience = typeof params.for === "string" ? params.for : "";
  const sort = typeof params.sort === "string" ? params.sort : "newest";
  let areas = PINNED_AREAS.map((name) => ({ name, count: 0 }));
  let rooms: PublicRoom[] = [];
  let loadError = process.env.DATABASE_URL ? "" : "Room listings will be available when the Supabase database is connected.";
  if (process.env.DATABASE_URL) {
    try {
      const [loadedAreas, loadedRooms] = await Promise.all([
        getAreas(),
        listPublicRooms({ area: area || undefined, maxBudget: Number(maxBudget) || undefined, audience, sort }),
      ]);
      if (loadedAreas.length) areas = loadedAreas;
      rooms = loadedRooms;
    } catch (error) {
      console.error("Rooms page data could not be loaded:", error);
      loadError = "Room listings are temporarily unavailable. Please try again shortly.";
    }
  }
  const activeFilters = Boolean(area || maxBudget || audience);
  return <main className="page-section container">
    <div className="rooms-page-heading"><div><span className="eyebrow">YOUR NEXT PLACE IN DEHRADUN</span><h1>Rooms &amp; PGs</h1><p>Browse rooms near Graphic Era University, Turner Road and ISBT.</p></div><Link className="button button-orange" href="/requirements">Tell us what you need</Link></div>
    <RoomFilters areas={areas} initialArea={area} initialBudget={maxBudget} initialAudience={audience} initialSort={sort} />
    <div className="filter-status"><span>{loadError || `${rooms.length} ${rooms.length === 1 ? "room" : "rooms"} found`}</span>{activeFilters && <Link href="/rooms">Clear filters</Link>}</div>
    {rooms.length > 0 ? <div className="room-grid">{rooms.map((room) => <RoomCard key={room.id} room={room} />)}</div> : <div className="empty-public"><div className="empty-illustration">⌂</div><h3>{loadError ? "We’ll be back shortly" : "No rooms match those filters yet"}</h3><p>{loadError || "Try a different area or budget, or tell us what you are looking for and we’ll help."}</p>{!loadError && <Link className="button button-blue" href="/requirements">Send a room request</Link>}</div>}
  </main>;
}
