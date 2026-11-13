import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AdminApprovals } from "@/components/screens/AdminApprovals";
import { systemClock } from "@/lib/clock";
import type { RegistrationDetailDto } from "@/lib/dto";
import { homeFor, requireCan } from "@/server/auth/viewer";
import { withViewer } from "@/server/repo/context";
import { getRegistration, listApprovalQueue, listRegistrations } from "@/server/repo/registrations";
import { listManagerOptions } from "@/server/repo/staff";

export const metadata: Metadata = { title: "Deal approvals" };

export default async function Page(): Promise<React.JSX.Element> {
  const viewer = await requireCan("registration.read_queue");
  if (viewer.kind !== "staff") redirect(homeFor(viewer));
  const data = await withViewer(viewer, async (tx) => {
    const queue = await listApprovalQueue(tx, viewer, { scope: "all" }, systemClock);
    const managers = await listManagerOptions(tx, viewer);
    const accepted = await listRegistrations(tx, viewer, { status: ["accepted"], limit: 1000 });
    const extensions: RegistrationDetailDto[] = [];
    for (const item of accepted) {
      if (item.extensionStatus === "requested") extensions.push(await getRegistration(tx, viewer, item.id));
    }
    extensions.sort((a, b) => (a.extensionRequestedAt ?? "").localeCompare(b.extensionRequestedAt ?? ""));
    return { queue, managers, extensions };
  });
  return (
    <AdminApprovals
      queue={data.queue}
      extensions={data.extensions}
      viewerId={viewer.id}
      viewerRegion={viewer.region}
      managers={data.managers}
      today={systemClock.today()}
    />
  );
}
