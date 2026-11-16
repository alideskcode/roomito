"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { Check, ImagePlus, LogOut, RefreshCw, Search, ShieldCheck, X } from "lucide-react";
import type { ChangeEvent, FormEvent } from "react";
import { useRouter } from "next/navigation";

type AdminTab = "submissions" | "requests" | "rooms" | "users" | "areas";
type RecordItem = Record<string, unknown> & { id: string };
const tabs: { key: AdminTab; label: string }[] = [
  { key: "submissions", label: "Room submissions" },
  { key: "requests", label: "Renter requests" },
  { key: "rooms", label: "Rooms" },
  { key: "users", label: "Users" },
  { key: "areas", label: "Areas" },
];

async function adminFetch(url: string, method = "GET", body?: unknown) {
  const isFormData = body instanceof FormData;
  const response = await fetch(url, {
    method,
    headers: body && !isFormData ? { "Content-Type": "application/json" } : undefined,
    body: body ? (isFormData ? body : JSON.stringify(body)) : undefined,
  });
  const data = await response.json().catch(() => ({ error: response.statusText || "Admin service is temporarily unavailable." }));
  if (!response.ok) throw new Error(data.error || "Admin action failed.");
  return data;
}

export function AdminLogin({ configured }: { configured: boolean }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      const data = await adminFetch("/api/admin/login", "POST", Object.fromEntries(new FormData(event.currentTarget).entries()));
      if (data.ok) {
        router.replace(data.redirectTo || "/admin");
        router.refresh();
      }
    } catch (issue) {
      setError(issue instanceof Error ? issue.message : "Could not log in.");
    } finally {
      setBusy(false);
    }
  }
  return <section className="auth-card">
    <div className="auth-icon"><ShieldCheck size={23} /></div><h1>Admin sign in</h1><p>Private access for Rent Rooms Dehradun.</p>
    {!configured && <div className="setup-warning"><b>Setup required</b><br />Add DATABASE_URL, RENTROOMS_ADMIN_EMAIL, RENTROOMS_ADMIN_PASSWORD, and a 32+ character RENTROOMS_SESSION_SECRET to `.env.local` and your Vercel project settings.</div>}
    <form className="form-stack" onSubmit={submit}>
      <label>Admin email<input type="email" name="email" autoComplete="username" required /></label>
      <label>Password<input type="password" name="password" autoComplete="current-password" required /></label>
      <input className="honeypot" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" />
      <button className="button button-orange button-full" disabled={busy || !configured}>{busy ? "Signing in…" : "Sign in"}</button>
      {error && <p className="form-error" role="alert">{error}</p>}
    </form>
  </section>;
}

export function AdminDashboard() {
  const router = useRouter();
  const [tab, setTab] = useState<AdminTab>("submissions");
  const [items, setItems] = useState<RecordItem[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ tab, q: query });
      if (status) params.set("status", status);
      const data = await adminFetch(`/api/admin/data?${params}`);
      setItems(data.items || []);
      setCounts(data.counts || {});
    } catch (issue) {
      setError(issue instanceof Error ? issue.message : "Could not load admin data.");
    } finally {
      setLoading(false);
    }
  }, [tab, query, status]);

  useEffect(() => {
    const timer = setTimeout(() => { void load(); }, 180);
    return () => clearTimeout(timer);
  }, [load]);

  async function act(url: string, method: string, body?: unknown) {
    setError("");
    setMessage("");
    try {
      const data = await adminFetch(url, method, body);
      setMessage(data.message || (data.roomCode ? `Approved as ${data.roomCode}.` : "Saved."));
      await load();
    } catch (issue) {
      setError(issue instanceof Error ? issue.message : "Action failed.");
    }
  }

  async function logout() {
    const response = await fetch("/api/admin/logout", { method: "POST", credentials: "same-origin" });
    if (!response.ok) return;
    router.replace("/");
    router.refresh();
  }

  return <div className="admin-shell">
    <div className="admin-topbar"><div><span className="admin-kicker">RENT ROOMS DEHRADUN</span><h1>Admin dashboard</h1></div><div className="admin-top-actions"><button className="button button-light" onClick={() => void load()}><RefreshCw size={16} /> Refresh</button><button className="button button-light" onClick={logout}><LogOut size={16} /> Sign out</button></div></div>
    <div className="admin-counts">{[
      ["Pending", counts.pending], ["Approved", counts.approved], ["Cancelled", counts.cancelled],
      ["Booked", counts.booked], ["New requests", counts.new_requests], ["Users", counts.users],
    ].map(([label, count]) => <div className="count-card" key={label}><span>{label}</span><b>{count ?? "—"}</b></div>)}</div>
    <div className="admin-tabs" role="tablist">{tabs.map((item) => <button key={item.key} className={tab === item.key ? "active" : ""} onClick={() => { setTab(item.key); setStatus(""); }} role="tab" aria-selected={tab === item.key}>{item.label}</button>)}</div>
    <div className="admin-toolbar"><label className="admin-search"><Search size={17} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={`Search ${tabs.find((item) => item.key === tab)?.label.toLowerCase()}…`} /></label>
      {["submissions", "rooms", "requests"].includes(tab) && <select value={status} onChange={(event) => setStatus(event.target.value)} aria-label="Filter by status"><option value="">All statuses</option>{(tab === "requests" ? ["New", "Contacted", "Closed"] : tab === "rooms" ? ["Approved", "Booked"] : ["Pending", "Approved", "Cancelled", "Booked"]).map((value) => <option key={value}>{value}</option>)}</select>}
    </div>
    {message && <p className="admin-notice success"><Check size={16} /> {message}</p>}
    {error && <p className="admin-notice error"><X size={16} /> {error}</p>}
    {loading ? <div className="empty-state">Loading records…</div> : items.length === 0 ? <div className="empty-state"><b>Nothing here yet</b><span>Try changing your search or filter.</span></div> : <div className="admin-list">{items.map((item) => {
      if (tab === "requests") return <RequestAdminCard key={item.id} item={item} act={act} />;
      if (tab === "users") return <UserAdminCard key={item.id} item={item} act={act} />;
      if (tab === "areas") return <AreaAdminCard key={item.id} item={item} allAreas={items} act={act} />;
      if (tab === "rooms") return <RoomAdminCard key={item.id} item={item} act={act} />;
      return <SubmissionAdminCard key={item.id} item={item} act={act} />;
    })}</div>}
  </div>;
}

function RequestAdminCard({ item, act }: { item: RecordItem; act: (url: string, method: string, body?: unknown) => Promise<void> }) {
  const message = `Hello ${String(item.name)}, you recently requested a room in Dehradun. How can we help?`;
  return <article className="admin-card">
    <div className="admin-card-head"><div><span className={`status-pill status-${String(item.status).toLowerCase()}`}>{String(item.status)}</span><h3>{String(item.name)} <small>· {String(item.mobile)}</small></h3></div><select value={String(item.status)} onChange={(event) => void act(`/api/admin/requests/${item.id}`, "PATCH", { status: event.target.value })}><option>New</option><option>Contacted</option><option>Closed</option></select></div>
    <div className="admin-detail-grid"><span>For <b>{String(item.looking_for)}</b></span><span>Room <b>{String(item.room_type)}</b></span><span>Preference <b>{String(item.preference)}</b></span><span>Area <b>{String(item.preferred_area)}</b></span><span>Budget <b>₹{Number(item.budget_min).toLocaleString("en-IN")} – ₹{Number(item.budget_max).toLocaleString("en-IN")}</b></span><span>People <b>{String(item.people)}</b></span><span>Move in <b>{String(item.move_in_date || "Flexible")}</b></span><span>Facilities <b>{Array.isArray(item.facilities) ? item.facilities.join(", ") : "—"}</b></span><span>Other <b>{String(item.other_requirement || "—")}</b></span></div>
    <a className="button button-green" target="_blank" rel="noreferrer" href={`https://wa.me/91${String(item.mobile)}?text=${encodeURIComponent(message)}`}>WhatsApp this renter</a>
  </article>;
}

function SubmissionAdminCard({ item, act }: { item: RecordItem; act: (url: string, method: string, body?: unknown) => Promise<void> }) {
  const [username, setUsername] = useState(String(item.username || ""));
  const images = Array.isArray(item.images) ? item.images as { id: string; label: string }[] : [];
  return <article className="admin-card">
    <div className="admin-card-head"><div><span className={`status-pill status-${String(item.status).toLowerCase()}`}>{String(item.status)}</span><h3>{String(item.owner_name)} <small>· {String(item.mobile)}</small></h3></div><span>{new Date(String(item.created_at)).toLocaleDateString("en-IN")}</span></div>
    <div className="admin-detail-grid"><span>Area <b>{String(item.area)}</b></span><span>Address <b>{String(item.address)}</b></span><span>Rent <b>₹{Number(item.rent).toLocaleString("en-IN")}/month</b></span><span>Security <b>₹{Number(item.security_deposit).toLocaleString("en-IN")}</b></span><span>Type <b>{String(item.room_type)} · {String(item.audience)}</b></span><span>Facilities <b>{Array.isArray(item.facilities) ? item.facilities.join(", ") : "—"}</b></span><span>Graphic Era distance <b>{String(item.distance_geu || "Not provided")}</b></span></div>
    {images.length > 0 && <div className="admin-image-row">{images.map((image) => <Image key={image.id} src={`/api/images/${image.id}`} alt={image.label} width={148} height={108} unoptimized />)}</div>}
    {item.status === "Pending" ? <div className="admin-card-actions"><label>Username (internal)<input value={username} onChange={(event) => setUsername(event.target.value)} placeholder="Optional" /></label><button className="button button-green" onClick={() => void act(`/api/admin/submissions/${item.id}`, "PATCH", { action: "apply", username })}><Check size={16} /> Apply</button><button className="button button-red" onClick={() => void act(`/api/admin/submissions/${item.id}`, "PATCH", { action: "cancel" })}><X size={16} /> Cancel</button></div> : <p className="admin-muted">{item.room_code ? `Room code: ${String(item.room_code)}` : "Cancelled listings remain hidden."}</p>}
  </article>;
}

function RoomAdminCard({ item, act }: { item: RecordItem; act: (url: string, method: string, body?: unknown) => Promise<void> }) {
  const [area, setArea] = useState(String(item.area));
  const [rent, setRent] = useState(String(item.rent));
  const [deposit, setDeposit] = useState(String(item.security_deposit));
  const [username, setUsername] = useState(String(item.username || ""));
  const [distance, setDistance] = useState(String(item.distance_geu || ""));
  const [facilities, setFacilities] = useState(Array.isArray(item.facilities) ? item.facilities.join(", ") : "");
  const [uploading, setUploading] = useState(false);
  const images = Array.isArray(item.images) ? item.images as { id: string; label: string }[] : [];
  async function uploadPhotos(event: ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    const selected = Array.from(input.files || []);
    input.value = "";
    if (!selected.length) return;
    const body = new FormData();
    selected.forEach((file) => body.append("images", file));
    setUploading(true);
    try {
      await act(`/api/admin/rooms/${item.id}/images`, "POST", body);
    } finally {
      setUploading(false);
    }
  }
  return <article className="admin-card">
    <div className="admin-card-head"><div><span className="room-code">{String(item.room_code)}</span><h3>{String(item.area)} <small>· {String(item.status)}</small></h3></div><span>{String(item.mobile)}</span></div>
    <div className="admin-detail-grid"><span>Owner <b>{String(item.owner_name)}</b></span><span>Address <b>{String(item.address)}</b></span><span>Type <b>{String(item.room_type)} · {String(item.audience)}</b></span></div>
    {images.length > 0 && <div className="admin-image-row">{images.map((image) => <Image key={image.id} src={`/api/images/${image.id}`} alt={image.label} width={148} height={108} unoptimized />)}</div>}
    {images.length < 8 ? <label className="upload-field"><span><ImagePlus size={17} /> Add room photos <small>({images.length}/8 uploaded)</small></span><input type="file" accept="image/*" multiple disabled={uploading} onChange={(event) => void uploadPhotos(event)} />{uploading && <small>Uploading and compressing photos…</small>}</label> : <p className="admin-muted">All 8 room photo slots are in use.</p>}
    <div className="admin-edit-grid"><label>Area<input value={area} onChange={(event) => setArea(event.target.value)} /></label><label>Rent ₹<input type="number" value={rent} onChange={(event) => setRent(event.target.value)} /></label><label>Security ₹<input type="number" value={deposit} onChange={(event) => setDeposit(event.target.value)} /></label><label>Username<input value={username} onChange={(event) => setUsername(event.target.value)} /></label><label>GEU distance<input value={distance} onChange={(event) => setDistance(event.target.value)} /></label><label>Facilities (comma separated)<input value={facilities} onChange={(event) => setFacilities(event.target.value)} /></label></div>
    <div className="admin-card-actions"><button className="button button-blue" onClick={() => void act(`/api/admin/rooms/${item.id}`, "PATCH", { area, rent, deposit, username, distance, facilities: facilities.split(",").map((value) => value.trim()).filter(Boolean) })}>Save changes</button><button className="button button-light" onClick={() => void act(`/api/admin/rooms/${item.id}`, "PATCH", { availability: item.status === "Booked" ? "Available" : "Booked" })}>{item.status === "Booked" ? "Mark available" : "Mark booked"}</button><button className="button button-red" onClick={() => window.confirm("Delete this room and its photos?") && void act(`/api/admin/rooms/${item.id}`, "DELETE")}>Delete room</button></div>
  </article>;
}

function UserAdminCard({ item, act }: { item: RecordItem; act: (url: string, method: string, body?: unknown) => Promise<void> }) {
  const blocked = Boolean(item.is_blocked);
  return <article className="admin-card user-admin-card"><div><span className={`status-pill ${blocked ? "status-cancelled" : "status-approved"}`}>{blocked ? "Blocked" : "Active"}</span><h3>{String(item.name)}</h3><p>{String(item.email)} · {String(item.mobile)} · {String(item.role)}</p></div><button className={`button ${blocked ? "button-green" : "button-red"}`} onClick={() => void act(`/api/admin/users/${item.id}`, "PATCH", { blocked: !blocked })}>{blocked ? "Unblock user" : "Block user"}</button></article>;
}

function AreaAdminCard({ item, allAreas, act }: { item: RecordItem; allAreas: RecordItem[]; act: (url: string, method: string, body?: unknown) => Promise<void> }) {
  const [name, setName] = useState(String(item.name));
  const [targetId, setTargetId] = useState("");
  return <article className="admin-card area-admin-card"><div><h3>{String(item.name)} <small>· {Number(item.count)} rooms</small></h3><div className="admin-edit-grid"><label>Rename<input value={name} onChange={(event) => setName(event.target.value)} /></label><label>Merge into<select value={targetId} onChange={(event) => setTargetId(event.target.value)}><option value="">Select area</option>{allAreas.filter((area) => area.id !== item.id).map((area) => <option key={area.id} value={area.id}>{String(area.name)}</option>)}</select></label></div></div><div className="admin-card-actions"><button className="button button-blue" onClick={() => void act("/api/admin/areas", "PATCH", { action: "rename", id: item.id, name })}>Rename</button><button className="button button-light" onClick={() => void act("/api/admin/areas", "PATCH", { action: "pin", id: item.id, pinned: !item.is_pinned })}>{item.is_pinned ? "Unpin" : "Pin"}</button><button className="button button-orange" disabled={!targetId} onClick={() => void act("/api/admin/areas", "PATCH", { action: "merge", id: item.id, targetId })}>Merge</button><button className="button button-red" onClick={() => void act("/api/admin/areas", "PATCH", { action: "delete", id: item.id })}>Delete</button></div></article>;
}
