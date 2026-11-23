import type { Metadata } from "next";
import { PartnerOverview, type PartnerOverviewData } from "@/components/screens/PartnerOverview";
import { systemClock } from "@/lib/clock";
import { type DashboardFilters, parseDashboardFilters } from "@/lib/dashboard-dto";
import { requireKind } from "@/server/auth/viewer";
import { withViewer } from "@/server/repo/context";
import { partnerDashboard } from "@/server/repo/dashboard";
import { listDocuments, listNewDocuments } from "@/server/repo/documents";

export const metadata: Metadata = { title: "Overview" };

const LIST_SIZE = 5;

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}): Promise<React.JSX.Element> {
  // Technical users have no deals and no overview.read, so nothing links them here; opening the URL gives them a documents-first view.
  const viewer = await requireKind("partner");
  const filters: DashboardFilters = parseDashboardFilters(await searchParams, { staff: false });
  const now = systemClock.now();
  const data: PartnerOverviewData = await withViewer(viewer, async (tx) => {
    if (viewer.kind === "partner" && viewer.role === "technical") {
      const newDocuments = await listNewDocuments(tx, viewer, { limit: LIST_SIZE }, systemClock);
      const mostOpened = (await listDocuments(tx, viewer, {}))
        .filter((d) => (d.ownOpens ?? 0) > 0)
        .sort((a, b) => (b.ownOpens ?? 0) - (a.ownOpens ?? 0) || a.title.localeCompare(b.title))
        .slice(0, LIST_SIZE)
        .map((d) => ({ id: d.id, title: d.title, opens: d.ownOpens ?? 0, partners: 1 }));
      return { kind: "documents", filters, newDocuments, mostOpened };
    }
    return { kind: "deals", dashboard: await partnerDashboard(tx, viewer, filters, systemClock) };
  });
  return <PartnerOverview data={data} today={systemClock.today()} asOf={now.toISOString()} />;
}
