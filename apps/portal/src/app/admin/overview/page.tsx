import type { Metadata } from "next";
import { IntegrationHealthCard } from "@/components/audit/IntegrationHealthCard";
import { StaffOverview, type StaffOverviewData } from "@/components/screens/StaffOverview";
import { systemClock } from "@/lib/clock";
import { type DashboardFilters, parseDashboardFilters } from "@/lib/dashboard-dto";
import { isAllRegions, scopeLabel } from "@/lib/regions";
import { listRegions } from "@/server/repo/regions";
import { can } from "@/server/auth/policies";
import { ForbiddenError } from "@/server/errors";
import { requireCan } from "@/server/auth/viewer";
import { withViewer } from "@/server/repo/context";
import { staffDashboard } from "@/server/repo/dashboard";
import { getDashboardLayout } from "@/server/repo/dashboard-layouts";
import { listDocuments, listNewDocuments } from "@/server/repo/documents";
import { listPartners } from "@/server/repo/partners";

export const metadata: Metadata = { title: "Overview" };

const LIST_SIZE = 5;

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}): Promise<React.JSX.Element> {
  const viewer = await requireCan("overview.read_staff");
  if (viewer.kind !== "staff") throw new ForbiddenError("overview.read_staff is for staff only");
  const parsed = parseDashboardFilters(await searchParams, { staff: true });
  const now = systemClock.now();

  // Marketing has no deal access: document activity only (all time; the document list carries lifetime opens).
  if (!can(viewer, "dashboard.read_staff")) {
    const data: StaffOverviewData = await withViewer(viewer, async (tx) => {
      const docs = await listDocuments(tx, viewer, {});
      const byOpens = docs.map((d) => ({ id: d.id, title: d.title, opens: d.opens ?? 0, partners: d.partnerCount ?? 0 }));
      const newDocs = await listNewDocuments(tx, viewer, { limit: LIST_SIZE }, systemClock);
      return {
        kind: "documents",
        filters: parsed,
        mostOpened: byOpens.filter((d) => d.opens > 0).sort((a, b) => b.opens - a.opens || a.title.localeCompare(b.title)).slice(0, LIST_SIZE),
        leastOpened: [...byOpens].sort((a, b) => a.opens - b.opens || a.title.localeCompare(b.title)).slice(0, LIST_SIZE),
        newDocuments: newDocs.map((d) => ({ id: d.id, title: d.title, updatedAt: d.updatedAt })),
      };
    });
    return <StaffOverview data={data} today={systemClock.today()} asOf={now.toISOString()} scope="You see document activity only. Deals and partners are not part of your role." />;
  }

  // Sales and partner managers see the regions they cover; someone who covers every region sees all of them.
  const seesAllRegions = isAllRegions(viewer.regions);
  const filters: DashboardFilters = seesAllRegions
    ? parsed
    : { period: parsed.period, ...(parsed.product ? { product: parsed.product } : {}), ...(parsed.partnerId ? { partnerId: parsed.partnerId } : {}) };
  const scopeRegions = await withViewer(viewer, (tx) => listRegions(tx, viewer));
  const scope = seesAllRegions ? "You see deals and partners in all regions." : `You see deals and partners in ${scopeLabel(viewer.regions, scopeRegions)}.`;

  const data: StaffOverviewData = await withViewer(viewer, async (tx) => {
    const dashboard = await staffDashboard(tx, viewer, filters, systemClock);
    const partners = (await listPartners(tx, viewer, {})).map((p) => ({ id: p.id, name: p.name }));
    return {
      kind: "deals",
      dashboard,
      regionSwitch: seesAllRegions,
      partners,
      canApplications: can(viewer, "application.read"),
      layout: await getDashboardLayout(tx, viewer, "staff-overview"),
      crmCard: can(viewer, "integration.read_health") ? (
        <IntegrationHealthCard
          name="CRM"
          today={systemClock.today()}
          health={{
            pending: dashboard.integrations.pending,
            failed: dashboard.integrations.failed,
            lastError: dashboard.integrations.lastError,
            lastPollAt: dashboard.integrations.lastPollAt ? new Date(dashboard.integrations.lastPollAt) : null,
          }}
        />
      ) : null,
    };
  });
  return <StaffOverview data={data} today={systemClock.today()} asOf={now.toISOString()} scope={scope} regions={scopeRegions} />;
}
