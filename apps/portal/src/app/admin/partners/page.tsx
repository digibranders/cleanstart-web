import type { Metadata } from "next";
import { Suspense } from "react";
import { AdminPartners } from "@/components/screens/AdminPartners";
import { can } from "@/server/auth/policies";
import { requireCan } from "@/server/auth/viewer";
import { withViewer } from "@/server/repo/context";
import { countNewApplications, listApplications } from "@/server/repo/applications";

export const metadata: Metadata = { title: "Partners" };

export default async function Page(): Promise<React.JSX.Element> {
  const viewer = await requireCan("partner.read");
  const canDecide = can(viewer, "application.approve");
  const data = canDecide
    ? await withViewer(viewer, async (tx) => ({
        applications: await listApplications(tx, viewer, {}),
        waiting: await countNewApplications(tx, viewer),
      }))
    : { applications: [], waiting: 0 };
  return (
    <Suspense fallback={null}>
      <AdminPartners applications={data.applications} waiting={data.waiting} canDecide={canDecide} />
    </Suspense>
  );
}
