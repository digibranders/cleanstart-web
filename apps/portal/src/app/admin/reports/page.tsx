import type { Metadata } from "next";
import { AdminReports } from "@/components/screens/AdminReports";
import { systemClock } from "@/lib/clock";
import { requireCan } from "@/server/auth/viewer";
import { withViewer } from "@/server/repo/context";
import { getAdminReports } from "@/server/repo/reports";

export const metadata: Metadata = { title: "Reports" };

export default async function Page(): Promise<React.JSX.Element> {
  const viewer = await requireCan("report.read");
  const report = await withViewer(viewer, (tx) => getAdminReports(tx, viewer, systemClock));
  return <AdminReports report={report} today={systemClock.today()} />;
}
