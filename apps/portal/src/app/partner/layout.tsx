import { Shell } from "@/components/shell/shell";
import { systemClock } from "@/lib/clock";
import { navFor } from "@/lib/routes";
import { requireKind } from "@/server/auth/viewer";
import { withViewer } from "@/server/repo/context";
import { getShell } from "@/server/repo/account";
import { listNotifications } from "@/server/repo/notifications";

export default async function PartnerLayout({ children }: { children: React.ReactNode }): Promise<React.JSX.Element> {
  const viewer = await requireKind("partner");
  const data = await withViewer(viewer, async (tx) => ({
    shell: await getShell(tx, viewer),
    notifications: await listNotifications(tx, viewer, { limit: 10 }),
  }));
  return (
    <Shell kind="partner" shell={data.shell} nav={navFor(viewer)} notifications={data.notifications} today={systemClock.today()}>
      {children}
    </Shell>
  );
}
