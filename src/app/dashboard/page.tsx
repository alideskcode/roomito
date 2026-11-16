import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { DashboardContent } from "@/components/dashboard";
import { currentUser } from "@/lib/security";

export const metadata: Metadata = { title: "Your dashboard" };
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await currentUser();
  if (!user) redirect("/login?next=%2Fdashboard");
  return <DashboardContent user={user} />;
}
