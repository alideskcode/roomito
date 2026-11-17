"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, LogOut, Menu, X } from "lucide-react";

type Props = {
  userName: string | null;
  isAdmin: boolean;
};

export function HeaderNav({ userName, isAdmin }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  async function logout() {
    const response = await fetch(isAdmin && !userName ? "/api/admin/logout" : "/api/auth/logout", {
      method: "POST",
      credentials: "same-origin",
    });
    if (!response.ok) return;
    if (isAdmin && userName) {
      const adminResponse = await fetch("/api/admin/logout", { method: "POST", credentials: "same-origin" });
      if (!adminResponse.ok) return;
    }
    router.replace("/");
    router.refresh();
  }

  return (
    <>
      <button className="menu-toggle" onClick={() => setOpen(!open)} aria-label={open ? "Close menu" : "Open menu"}>
        {open ? <X size={22} /> : <Menu size={22} />}
      </button>
      <nav className={open ? "main-nav is-open" : "main-nav"}>
        <Link href="/rooms" onClick={() => setOpen(false)}>Find a room</Link>
        <Link href="/how-it-works" onClick={() => setOpen(false)}>How it works</Link>
        <Link href="/about" onClick={() => setOpen(false)}>About</Link>
        <Link href="/owner" className="nav-owner" onClick={() => setOpen(false)}>List your room <ArrowRight size={15} /></Link>
        {userName || isAdmin ? (
          <div className="nav-account">
            <span className="nav-user-name" title={userName || "Admin"}>{userName ? `Hi, ${userName}` : "Admin"}</span>
            <Link className="nav-login" href={isAdmin && !userName ? "/admin" : "/dashboard"} onClick={() => setOpen(false)}>Dashboard</Link>
            <button type="button" className="nav-logout" onClick={() => void logout()}><LogOut size={14} /> Log out</button>
          </div>
        ) : (
          <Link href="/login" className="nav-login" onClick={() => setOpen(false)}>Log in</Link>
        )}
      </nav>
    </>
  );
}
