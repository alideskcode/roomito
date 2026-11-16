"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { RoomCard } from "@/components/site";
import { ProfileForms } from "@/components/forms";
import type { CurrentUser } from "@/lib/security";
import { useRouter } from "next/navigation";

type DashboardData = {
  rooms: { id: string; room_code: string | null; area: string; rent: number; status: string; created_at: string }[];
  requests: { id: string; preferred_area: string; budget_min: number; budget_max: number; status: string; created_at: string }[];
};
type SavedRoom = Parameters<typeof RoomCard>[0]["room"];
type DashboardTab = "overview" | "saved" | "requests" | "rooms" | "profile";

const tabLabels: Record<string, string> = { overview: "Overview", saved: "Saved rooms", requests: "My requirements", rooms: "My rooms", profile: "Profile" };

export function DashboardContent({
  user,
  initialTab = "overview",
}: {
  user: CurrentUser;
  initialTab?: "overview" | "saved" | "requests";
}) {
  const router = useRouter();
  const [tab, setTab] = useState<DashboardTab>(initialTab);
  const [data, setData] = useState<DashboardData>({ rooms: [], requests: [] });
  const [saved, setSaved] = useState<SavedRoom[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    Promise.all([fetch("/api/dashboard"), fetch("/api/saved-rooms")])
      .then(async ([dashboardResponse, savedResponse]) => {
        const dashboardData = await dashboardResponse.json().catch(() => ({ error: dashboardResponse.statusText || "Dashboard service is unavailable." }));
        const savedData = await savedResponse.json().catch(() => ({ error: savedResponse.statusText || "Saved rooms are unavailable." }));
        if (!dashboardResponse.ok) throw new Error(dashboardData.error || "Could not load your dashboard.");
        if (!savedResponse.ok) throw new Error(savedData.error || "Could not load saved rooms.");
        if (active) {
          setData(dashboardData);
          setSaved(savedData.rooms || []);
        }
      })
      .catch((issue: unknown) => { if (active) setError(issue instanceof Error ? issue.message : "Could not load your dashboard."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  async function logout() {
    const response = await fetch("/api/auth/logout", { method: "POST", credentials: "same-origin" });
    if (!response.ok) return;
    router.replace("/");
    router.refresh();
  }
  const availableTabs: DashboardTab[] = (["overview", "saved", "requests", "rooms", "profile"] as DashboardTab[])
    .filter((key) => key === "overview" || key === "saved" || key === "profile" || (key === "requests" && ["renter", "both"].includes(user.role)) || (key === "rooms" && ["owner", "both"].includes(user.role)));

  return <main className="dashboard-page"><div className="container"><div className="dashboard-heading"><div><span className="eyebrow">YOUR ACCOUNT</span><h1>Hello, {user.name.split(" ")[0]}</h1><p>Manage your saved rooms, listings and requirements.</p></div><button className="button button-light" onClick={logout}>Log out</button></div>
    <nav className="dashboard-tabs">{availableTabs.map((key) => <button key={key} className={tab === key ? "active" : ""} onClick={() => setTab(key)}>{tabLabels[key]}</button>)}</nav>
    {error && <p className="form-error">{error}</p>}
    {loading ? <div className="dashboard-empty">Loading your dashboard…</div> : <>
      {tab === "overview" && <div className="content-grid">
        <div className="content-card"><span className="eyebrow">SAVED ROOMS</span><h2>{saved.length}</h2><p>Listings you&apos;ve bookmarked.</p><button className="text-link" onClick={() => setTab("saved")}>View saved rooms →</button></div>
        {availableTabs.includes("requests") && <div className="content-card"><span className="eyebrow">MY REQUESTS</span><h2>{data.requests.length}</h2><p>Room requirements shared with us.</p><button className="text-link" onClick={() => setTab("requests")}>View requests →</button></div>}
        {availableTabs.includes("rooms") && <div className="content-card"><span className="eyebrow">MY LISTINGS</span><h2>{data.rooms.length}</h2><p>Room submissions and their review status.</p><button className="text-link" onClick={() => setTab("rooms")}>View listings →</button></div>}
        <div className="content-card"><span className="eyebrow">NEED HELP?</span><h2>Talk to us</h2><p>Our broker can answer your room questions.</p><Link className="text-link" href="/contact">Contact details →</Link></div>
      </div>}
      {tab === "saved" && (saved.length ? <div className="room-grid">{saved.map((room) => <RoomCard key={room.id} room={room} initialSaved />)}</div> : <div className="dashboard-empty">No saved rooms yet. <Link href="/rooms">Browse available rooms</Link> and tap the heart to save one.</div>)}
      {tab === "requests" && (data.requests.length ? <div className="dashboard-list">{data.requests.map((request) => <div className="dashboard-row" key={request.id}><div><b>{request.preferred_area}</b><span>Budget ₹{Number(request.budget_min).toLocaleString("en-IN")} – ₹{Number(request.budget_max).toLocaleString("en-IN")} · {new Date(request.created_at).toLocaleDateString("en-IN")}</span></div><span className={`status-pill status-${request.status.toLowerCase()}`}>{request.status}</span></div>)}</div> : <div className="dashboard-empty">No room requests yet. <Link href="/requirements">Tell us what you need</Link>.</div>)}
      {tab === "rooms" && (data.rooms.length ? <div className="dashboard-list">{data.rooms.map((room) => <div className="dashboard-row" key={room.id}><div><b>{room.room_code || "Room submission"} · {room.area}</b><span>₹{Number(room.rent).toLocaleString("en-IN")}/month · {new Date(room.created_at).toLocaleDateString("en-IN")}</span></div><span className={`status-pill status-${room.status.toLowerCase()}`}>{room.status}</span></div>)}</div> : <div className="dashboard-empty">No room submissions yet. <Link href="/owner">List your room</Link>.</div>)}
      {tab === "profile" && <ProfileForms user={user} />}
    </>}
  </div></main>;
}
