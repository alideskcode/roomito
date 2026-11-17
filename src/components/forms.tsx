"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState, type FormEvent } from "react";
import { ArrowRight, Check, ImagePlus } from "lucide-react";
import { FACILITIES, ROOM_TYPES } from "@/lib/constants";
import type { CurrentUser } from "@/lib/security";
import { useRouter } from "next/navigation";

type Notice = { message: string; error: boolean };
type PreparedForm = { data: FormData; warning: string };
type SubmitResponse = { whatsapp?: string; warning?: string; message?: string; redirectTo?: string };

function useSubmit(
  endpoint: string,
  successPath?: string,
  onSuccess?: (data: SubmitResponse) => void,
) {
  const router = useRouter();
  const [notice, setNotice] = useState<Notice | null>(null);
  const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>, prepare?: (form: HTMLFormElement) => Promise<PreparedForm>) {
    event.preventDefault();
    setNotice(null);
    setBusy(true);
    try {
      const form = event.currentTarget;
      const prepared = prepare ? await prepare(form) : { data: new FormData(form), warning: "" };
      const response = await fetch(endpoint, { method: "POST", body: prepared.data, credentials: "same-origin" });
      const data = await response.json().catch(() => ({ error: response.statusText || "The service is temporarily unavailable. Please try again." }));
      if (!response.ok) throw new Error(data.error || "Something went wrong. Please try again.");
      onSuccess?.(data);
      if (data.whatsapp) {
        const warnings = [prepared.warning, data.warning].filter(Boolean).join(" ");
        setNotice({ message: warnings || "Thank you! Opening WhatsApp to send your details.", error: false });
        setTimeout(() => { window.location.href = data.whatsapp; }, 1200);
      } else {
        setNotice({ message: data.message || "Done.", error: false });
        const destination = data.redirectTo || successPath;
        if (destination) {
          router.replace(destination);
          router.refresh();
        }
      }
    } catch (issue) {
      setNotice({ message: issue instanceof Error ? issue.message : "Something went wrong. Please try again.", error: true });
    } finally {
      setBusy(false);
    }
  }
  return { notice, busy, submit, setNotice };
}

async function compressUpload(file: File): Promise<File> {
  const objectUrl = URL.createObjectURL(file);
  try {
    const image = new window.Image();
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error("This photo could not be opened."));
      image.src = objectUrl;
    });
    const scale = Math.min(1, 1200 / image.naturalWidth, 1200 / image.naturalHeight);
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Photo compression is unavailable in this browser.");
    context.drawImage(image, 0, 0, canvas.width, canvas.height);

    for (const quality of [0.78, 0.66, 0.54, 0.42, 0.32]) {
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", quality));
      if (blob && blob.size < 300_000) {
        const name = file.name.replace(/\.[^.]+$/, "") || "room-photo";
        return new File([blob], `${name}.webp`, { type: blob.type || "image/webp" });
      }
    }
    throw new Error("This photo could not be compressed below 300 KB.");
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

async function prepareRoomImages(form: HTMLFormElement): Promise<PreparedForm> {
  const data = new FormData(form);
  data.delete("images");
  data.delete("buildingPhoto");
  const selectedRooms = Array.from(form.querySelector<HTMLInputElement>('input[name="images"]')?.files || []);
  const rooms = selectedRooms.slice(0, 7);
  const building = form.querySelector<HTMLInputElement>('input[name="buildingPhoto"]')?.files?.[0];
  const warnings: string[] = [];
  if (selectedRooms.length > 7) warnings.push("Only 7 room photos can be submitted.");
  for (const [index, file] of rooms.entries()) {
    try {
      data.append("images", await compressUpload(file), file.name);
    } catch (error) {
      warnings.push(error instanceof Error ? error.message : `Room photo ${index + 1} could not be prepared.`);
    }
  }
  if (building) {
    try {
      data.append("buildingPhoto", await compressUpload(building), building.name);
    } catch (error) {
      warnings.push(error instanceof Error ? error.message : "The building photo could not be prepared.");
    }
  }
  return { data, warning: warnings.length ? `${warnings.join(" ")} Your listing will still be submitted without those photos.` : "" };
}

function SubmitMessage({ notice }: { notice: Notice | null }) {
  if (!notice) return null;
  return <p className={notice.error ? "form-error" : "form-success"} role={notice.error ? "alert" : "status"}>{notice.error ? null : <Check size={17} />}{notice.message}</p>;
}

export function SignupForm() {
  const { notice, busy, submit } = useSubmit("/api/auth/signup", "/dashboard");
  return (
    <form className="form-stack" onSubmit={submit}>
      <label>Full name<input name="name" autoComplete="name" required maxLength={100} /></label>
      <label>Mobile number<input name="mobile" type="tel" inputMode="numeric" pattern="[0-9]{10}" maxLength={10} required placeholder="10-digit number" /></label>
      <label>Email address<input name="email" type="email" autoComplete="email" required maxLength={254} /></label>
      <label>Password<input name="password" type="password" autoComplete="new-password" minLength={10} maxLength={72} required /><small>Use 10–72 characters.</small></label>
      <label>I am a<select name="role" defaultValue="renter"><option value="renter">Renter</option><option value="owner">Owner</option><option value="both">Both</option></select></label>
      <input className="honeypot" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" />
      <button className="button button-orange button-full" disabled={busy}>{busy ? "Creating account…" : "Create account"} <ArrowRight size={17} /></button>
      <SubmitMessage notice={notice} />
      <p className="form-footnote">Already have an account? <Link href="/login">Log in</Link></p>
    </form>
  );
}

export function LoginForm() {
  const { notice, busy, submit } = useSubmit("/api/auth/login");
  return (
    <form className="form-stack" onSubmit={submit}>
      <label>Email or mobile number<input name="identifier" autoComplete="username" required /></label>
      <label>Password<input name="password" type="password" autoComplete="current-password" required /></label>
      <input className="honeypot" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" />
      <div className="form-row"><Link href="/forgot-password">Forgot password?</Link></div>
      <button className="button button-orange button-full" disabled={busy}>{busy ? "Signing in…" : "Log in"} <ArrowRight size={17} /></button>
      <SubmitMessage notice={notice} />
      <p className="form-footnote">New to Rent Rooms? <Link href="/signup">Create an account</Link></p>
    </form>
  );
}

export function ForgotPasswordForm() {
  const { notice, busy, submit } = useSubmit("/api/auth/forgot-password");
  return <form className="form-stack" onSubmit={submit}>
    <label>Email address<input name="email" type="email" required autoComplete="email" /></label>
    <input className="honeypot" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" />
    <button className="button button-orange button-full" disabled={busy}>{busy ? "Sending…" : "Send reset link"} <ArrowRight size={17} /></button>
    <SubmitMessage notice={notice} />
    <p className="form-footnote"><Link href="/login">Back to login</Link></p>
  </form>;
}

export function ResetPasswordForm({ token }: { token: string }) {
  const { notice, busy, submit } = useSubmit("/api/auth/reset-password", "/login");
  return <form className="form-stack" onSubmit={submit}>
    <input type="hidden" name="token" value={token} />
    <label>New password<input name="password" type="password" minLength={10} maxLength={72} required autoComplete="new-password" /><small>Use 10–72 characters.</small></label>
    <button className="button button-orange button-full" disabled={busy}>{busy ? "Updating…" : "Reset password"} <ArrowRight size={17} /></button>
    <SubmitMessage notice={notice} />
  </form>;
}

export function OwnerForm({ user }: { user: CurrentUser }) {
  const [previews, setPreviews] = useState<string[]>([]);
  const [buildingPreview, setBuildingPreview] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const { notice, busy, submit } = useSubmit("/api/owner", undefined, (data) => setWhatsapp(data.whatsapp || ""));
  useEffect(() => () => previews.forEach((url) => URL.revokeObjectURL(url)), [previews]);
  function onSubmit(event: FormEvent<HTMLFormElement>) {
    setWhatsapp("");
    void submit(event, prepareRoomImages);
  }

  return <form className="form-stack" onSubmit={onSubmit}>
    <div className="form-grid two">
      <label>Owner name<input name="name" defaultValue={user.name} required maxLength={100} /></label>
      <label>Mobile number<input name="mobile" type="tel" inputMode="numeric" pattern="[0-9]{10}" maxLength={10} defaultValue={user.mobile} required /></label>
    </div>
    <div className="form-grid two">
      <label>Area<input name="area" placeholder="Type your area" required maxLength={100} /></label>
      <label>Listing for<select name="audience" defaultValue="Any"><option>Boys PG</option><option>Girls PG</option><option>Family</option><option>Any</option></select></label>
    </div>
    <label>Full address<textarea name="address" rows={3} required maxLength={300} placeholder="Used only by our team; never shown publicly." /></label>
    <div className="form-grid two">
      <label>Monthly rent (₹)<input name="rent" type="number" min="1" step="1" required /></label>
      <label>Security deposit (₹)<input name="deposit" type="number" min="0" step="1" required /></label>
    </div>
    <div className="form-grid two">
      <label>Room type<select name="roomType" defaultValue="Independent"><option>Independent</option><option>Non-Independent</option></select></label>
      <label>Distance from Graphic Era University<input name="distance" maxLength={60} placeholder="e.g. 1.5 km (optional)" /></label>
    </div>
    <fieldset className="checkbox-field"><legend>Facilities (optional)</legend><div className="check-grid">{FACILITIES.map((item) => <label key={item}><input type="checkbox" name="facilities" value={item} /> {item}</label>)}</div></fieldset>
    <label className="upload-field"><span><ImagePlus size={19} /> Room photos <small>(optional, up to 7)</small></span><input type="file" name="images" accept="image/*" multiple onChange={(event) => setPreviews(Array.from(event.target.files || []).slice(0, 7).map((file) => URL.createObjectURL(file)))} /></label>
    {previews.length > 0 && <div className="preview-grid">{previews.map((url) => <Image src={url} alt="Room photo preview" width={84} height={74} unoptimized key={url} />)}</div>}
    <label className="upload-field"><span><ImagePlus size={19} /> PG building photo <small>(optional)</small></span><input type="file" name="buildingPhoto" accept="image/*" onChange={(event) => setBuildingPreview(event.target.files?.[0] ? URL.createObjectURL(event.target.files[0]) : "")} /></label>
    {buildingPreview && <div className="preview-grid"><Image src={buildingPreview} alt="PG building photo preview" width={84} height={74} unoptimized /></div>}
    <label className="consent"><input type="checkbox" name="consent" required /> I agree that Rent Rooms Dehradun can list my room and contact me.</label>
    <input className="honeypot" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" />
    <button className="button button-orange button-full" disabled={busy}>{busy ? "Sending details…" : "Submit your room"} <ArrowRight size={17} /></button>
    <SubmitMessage notice={notice} />
    {whatsapp && <a className="button button-green button-full" href={whatsapp} target="_blank" rel="noreferrer">Open WhatsApp</a>}
    <p className="form-footnote">Your name, mobile and exact address stay private and are never shown on public listings.</p>
  </form>;
}

export function RequirementForm({ user }: { user: CurrentUser | null }) {
  const [whatsapp, setWhatsapp] = useState("");
  const { notice, busy, submit } = useSubmit("/api/requirements", undefined, (data) => setWhatsapp(data.whatsapp || ""));
  function onSubmit(event: FormEvent<HTMLFormElement>) {
    setWhatsapp("");
    void submit(event);
  }
  return <form className="form-stack" onSubmit={onSubmit}>
    {!user && <p className="form-tip">You can send a request without an account. <Link href="/login">Log in</Link> to prefill your details and track it.</p>}
    <div className="form-grid two"><label>Name<input name="name" defaultValue={user?.name || ""} required maxLength={100} /></label><label>Mobile number<input name="mobile" type="tel" inputMode="numeric" pattern="[0-9]{10}" maxLength={10} defaultValue={user?.mobile || ""} required /></label></div>
    <div className="form-grid two"><label>Room for<select name="lookingFor" defaultValue="Boys"><option>Boys</option><option>Girls</option><option>Family</option><option>Working Professional</option></select></label><label>Room type<select name="roomType">{ROOM_TYPES.map((type) => <option key={type}>{type}</option>)}</select></label></div>
    <div className="form-grid two"><label>Independent preference<select name="preference"><option>Independent</option><option>Non-Independent</option><option>No preference</option></select></label><label>Preferred area<input name="area" placeholder="Type an area" required maxLength={100} /></label></div>
    <div className="form-grid two"><label>Minimum budget (₹)<input name="budgetMin" type="number" min="0" defaultValue="0" required /></label><label>Maximum budget (₹)<input name="budgetMax" type="number" min="0" required /></label></div>
    <div className="form-grid two"><label>Move-in date<input name="moveIn" type="date" /></label><label>Number of people<input name="people" type="number" min="1" max="30" defaultValue="1" required /></label></div>
    <fieldset className="checkbox-field"><legend>Facilities wanted</legend><div className="check-grid">{FACILITIES.map((item) => <label key={item}><input type="checkbox" name="facilities" value={item} /> {item}</label>)}</div></fieldset>
    <label>Other requirement<textarea name="other" rows={3} maxLength={1000} placeholder="Anything else we should know?" /></label>
    <input className="honeypot" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" />
    <button className="button button-orange button-full" disabled={busy}>{busy ? "Sending request…" : "Send my room request"} <ArrowRight size={17} /></button>
    <SubmitMessage notice={notice} />
    {whatsapp && <a className="button button-green button-full" href={whatsapp} target="_blank" rel="noreferrer">Open WhatsApp</a>}
  </form>;
}

export function ProfileForms({ user }: { user: CurrentUser }) {
  const [profileMessage, setProfileMessage] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");
  async function handle(event: FormEvent<HTMLFormElement>, endpoint: string, setMessage: (value: string) => void) {
    event.preventDefault();
    setMessage("");
    try {
      const response = await fetch(endpoint, { method: endpoint.endsWith("profile") ? "PATCH" : "POST", body: new FormData(event.currentTarget) });
      const data = await response.json().catch(() => ({ error: response.statusText || "The service is temporarily unavailable." }));
      if (!response.ok) throw new Error(data.error || "Something went wrong.");
      setMessage(data.message || "Saved successfully.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Something went wrong.");
    }
  }
  return <div className="profile-forms">
    <section className="panel"><h2>Edit profile</h2><form className="form-stack compact-form" onSubmit={(event) => handle(event, "/api/auth/profile", setProfileMessage)}>
      <label>Name<input name="name" defaultValue={user.name} required /></label><label>Mobile<input name="mobile" defaultValue={user.mobile} required pattern="[0-9]{10}" maxLength={10} /></label><label>Email<input name="email" type="email" defaultValue={user.email} required /></label>
      <button className="button button-blue">Save profile</button>{profileMessage && <p className="form-feedback">{profileMessage}</p>}
    </form></section>
    <section className="panel"><h2>Change password</h2><form className="form-stack compact-form" onSubmit={(event) => handle(event, "/api/auth/change-password", setPasswordMessage)}>
      <label>Current password<input name="currentPassword" type="password" required /></label><label>New password<input name="newPassword" type="password" minLength={10} maxLength={72} required /></label>
      <button className="button button-blue">Update password</button>{passwordMessage && <p className="form-feedback">{passwordMessage}</p>}
    </form></section>
  </div>;
}
