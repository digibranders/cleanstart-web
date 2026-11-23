import type { Metadata } from "next";
import { AdminReports } from "@/components/screens/AdminReports";
import { systemClock } from "@/lib/clock";
import { parseReportRange } from "@/lib/report-metrics";
import { requireCan } from "@/server/auth/viewer";
import { withViewer } from "@/server/repo/context";
import { getRangedReport } from "@/server/repo/report-metrics";
import { getAdminReports } from "@/server/repo/reports";

export const metadata: Metadata = { title: "Reports" };

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}): Promise<React.JSX.Element> {
  const viewer = await requireCan("report.read");
  const today = systemClock.today();
  const range = parseReportRange(await searchParams, today);
  const [report, ranged] = await withViewer(viewer, async (tx) => [
    await getAdminReports(tx, viewer, systemClock),
    await getRangedReport(tx, viewer, range),
  ] as const);
  return <AdminReports report={report} ranged={ranged} today={today} />;
}
