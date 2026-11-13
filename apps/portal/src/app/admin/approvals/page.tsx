import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AdminApprovals } from "@/components/screens/AdminApprovals";
import { systemClock } from "@/lib/clock";
import { homeFor, requireCan } from "@/server/auth/viewer";
import { withViewer } from "@/server/repo/context";
import { listApprovalQueue } from "@/server/repo/registrations";
import { listManagerOptions } from "@/server/repo/staff";

export const metadata: Metadata = { title: "Deal approvals" };

export default async function Page(): Promise<React.JSX.Element> {
  const viewer = await requireCan("registration.read_queue");
  if (viewer.kind !== "staff") redirect(homeFor(viewer));
  const data = await withViewer(viewer, async (tx) => ({
    queue: await listApprovalQueue(tx, viewer, { scope: "all" }, systemClock),
    managers: await listManagerOptions(tx, viewer),
  }));
  return (
    <AdminApprovals
      queue={data.queue}
      viewerId={viewer.id}
      viewerRegion={viewer.region}
      managers={data.managers}
      today={systemClock.today()}
    />
  );
}
