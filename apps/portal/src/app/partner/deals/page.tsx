import type { Metadata } from "next";
import { Deals } from "@/components/screens/Deals";
import { systemClock } from "@/lib/clock";
import { requireCan } from "@/server/auth/viewer";
import { getShell } from "@/server/repo/account";
import { withViewer } from "@/server/repo/context";
import { listRegistrations } from "@/server/repo/registrations";

export const metadata: Metadata = { title: "Deals" };

export default async function Page(): Promise<React.JSX.Element> {
  const viewer = await requireCan("registration.read");
  const { deals, shell } = await withViewer(viewer, async (tx) => ({
    deals: await listRegistrations(tx, viewer, { limit: 1000 }),
    shell: await getShell(tx, viewer),
  }));
  return (
    <Deals
      deals={deals}
      today={systemClock.today()}
      partnerManager={shell.manager ? { name: shell.manager.name, team: shell.manager.team } : null}
      senderEmail={shell.viewerEmail}
    />
  );
}
