import type { Metadata } from "next";
import { AdminTeam } from "@/components/screens/AdminTeam";
import { systemClock } from "@/lib/clock";
import { requireCan } from "@/server/auth/viewer";
import { withViewer } from "@/server/repo/context";
import { listStaff } from "@/server/repo/staff";

export const metadata: Metadata = { title: "CleanStart team" };

export default async function Page(): Promise<React.JSX.Element> {
  const viewer = await requireCan("staff.read");
  const people = await withViewer(viewer, (tx) => listStaff(tx, viewer));
  return <AdminTeam people={people} today={systemClock.today()} />;
}
