import Link from "next/link";
import { HeaderNav } from "@/components/header-nav";
import { currentUser, isAdmin } from "@/lib/security";

export async function Header() {
  let user = null;
  let admin = false;
  try {
    [user, admin] = await Promise.all([currentUser(), isAdmin()]);
  } catch (error) {
    console.error("Could not read the current header session:", error);
  }

  return (
    <header className="site-header">
      <div className="container header-inner">
        <Link href="/" className="brand">
          <span className="brand-mark">R</span>
          <span>Rent Rooms <b>Dehradun</b></span>
        </Link>
        <HeaderNav userName={user?.name ?? null} isAdmin={admin} />
      </div>
    </header>
  );
}
