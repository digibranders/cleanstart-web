import type { Metadata } from "next";
import { Suspense } from "react";
import { AdminPartners } from "@/components/screens/AdminPartners";
import { APPLICATION_STATUSES } from "@/lib/domain";
import { systemClock } from "@/lib/clock";
import { can } from "@/server/auth/policies";
import { requireCan } from "@/server/auth/viewer";
import { countNewApplications, listApplications } from "@/server/repo/applications";
import { withViewer } from "@/server/repo/context";
import { getPartnerDetail, listPartners } from "@/server/repo/partners";
import { listManagerOptions } from "@/server/repo/staff";

export const metadata: Metadata = { title: "Partners" };

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ selected?: string | string[]; astatus?: string | string[]; aq?: string | string[] }>;
}): Promise<React.JSX.Element> {
  const viewer = await requireCan("partner.read");
  const { selected, astatus, aq } = await searchParams;
  const applicationStatus = APPLICATION_STATUSES.find((s) => s === astatus);
  const applicationQuery = typeof aq === "string" ? aq.slice(0, 100) : undefined;
  const canManage = can(viewer, "partner.create");
  const canReadApplications = can(viewer, "application.read");
  const canDecide = can(viewer, "application.approve");
  const data = await withViewer(viewer, async (tx) => {
    const partners = await listPartners(tx, viewer, {});
    const managers = await listManagerOptions(tx, viewer);
    const wanted =
      (typeof selected === "string" ? partners.find((p) => p.id === selected)?.id : undefined) ?? partners[0]?.id ?? null;
    const detail = wanted ? await getPartnerDetail(tx, viewer, wanted) : null;
    const applications = canReadApplications ? await listApplications(tx, viewer, {
          ...(applicationStatus ? { status: applicationStatus } : {}),
          ...(applicationQuery ? { q: applicationQuery } : {}),
        }) : [];
    const waiting = canReadApplications ? await countNewApplications(tx, viewer) : 0;
    return { partners, managers, detail, applications, waiting };
  });
  return (
    <Suspense fallback={null}>
      <AdminPartners
        partners={data.partners}
        detail={data.detail}
        managers={data.managers}
        applications={data.applications}
        waiting={data.waiting}
        canManage={canManage}
        canReadApplications={canReadApplications}
        canDecide={canDecide}
        today={systemClock.today()}
      />
    </Suspense>
  );
}
