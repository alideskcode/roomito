import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { DashboardContent } from "@/components/dashboard";
import { currentUser } from "@/lib/security";

export const metadata: Metadata = { title: "Saved rooms" };
export const dynamic = "force-dynamic";

export default async function SavedRoomsPage() {
  const user = await currentUser();
  if (!user) redirect("/login?next=%2Fdashboard%2Fsaved");
  return <DashboardContent user={user} initialTab="saved" />;
}
