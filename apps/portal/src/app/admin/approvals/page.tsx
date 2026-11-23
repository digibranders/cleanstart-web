import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AdminApprovals } from "@/components/screens/AdminApprovals";
import { systemClock } from "@/lib/clock";
import { parseStaffDealFacet, parseStaffDealParams } from "@/lib/staff-deals-dto";
import { can } from "@/server/auth/policies";
import { homeFor, requireCan } from "@/server/auth/viewer";
import { withViewer } from "@/server/repo/context";
import { listPartners } from "@/server/repo/partners";
import { listApprovalQueue, listExtensionRequests } from "@/server/repo/registrations";
import { listStaffDeals } from "@/server/repo/staff-deals";
import { listManagerOptions } from "@/server/repo/staff";

export const metadata: Metadata = { title: "Deals" };

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}): Promise<React.JSX.Element> {
  const params = await searchParams;
  const viewer = await requireCan("registration.read_queue");
  if (viewer.kind !== "staff") redirect(homeFor(viewer));
  const facet = parseStaffDealFacet(params);
  const filters = parseStaffDealParams(params);
  const data = await withViewer(viewer, async (tx) => {
    const queue = await listApprovalQueue(tx, viewer, { scope: "all" }, systemClock);
    const managers = await listManagerOptions(tx, viewer);
    const extensions = await listExtensionRequests(tx, viewer);
    // The waiting tab is the queue above; the list is fetched for its counts only.
    const deals = await listStaffDeals(tx, viewer, facet === "waiting" ? { ...filters, page: 1, pageSize: 1 } : filters, systemClock);
    const partners = facet === "waiting" ? [] : await listPartners(tx, viewer, {});
    return { queue, managers, extensions, deals, partners: partners.map((p) => ({ id: p.id, name: p.name })) };
  });
  return (
    <AdminApprovals
      queue={data.queue}
      extensions={data.extensions}
      viewerId={viewer.id}
      viewerRegions={viewer.regions}
      managers={data.managers}
      today={systemClock.today()}
      facet={facet}
      deals={data.deals}
      filters={filters}
      partners={data.partners}
      canReassign={can(viewer, "registration.reassign")}
    />
  );
}
