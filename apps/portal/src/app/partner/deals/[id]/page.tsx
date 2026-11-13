import type { Metadata } from "next";
import { DealDetail } from "@/components/screens/DealDetail";
import { systemClock } from "@/lib/clock";
import { sameCustomer } from "@/lib/customer";
import { requireCan } from "@/server/auth/viewer";
import { NotFoundError } from "@/server/errors";
import { getShell } from "@/server/repo/account";
import { withViewer } from "@/server/repo/context";
import { getRegistration, listRegistrations } from "@/server/repo/registrations";

export const metadata: Metadata = { title: "Deal detail" };

export default async function Page({ params }: { params: Promise<{ id: string }> }): Promise<React.JSX.Element> {
  const { id } = await params;
  const viewer = await requireCan("registration.read");
  const loaded = await withViewer(viewer, async (tx) => {
    try {
      const deal = await getRegistration(tx, viewer, id);
      const nearby = await listRegistrations(tx, viewer, { q: deal.customer, limit: 50 });
      const shell = await getShell(tx, viewer);
      return { deal, siblings: nearby.filter((d) => sameCustomer(d.customer, deal.customer)), shell };
    } catch (error) {
      if (error instanceof NotFoundError) return null;
      throw error;
    }
  });
  return (
    <DealDetail
      deal={loaded?.deal ?? null}
      siblings={loaded?.siblings ?? []}
      today={systemClock.today()}
      partnerManager={loaded?.shell.manager ? { name: loaded.shell.manager.name, team: loaded.shell.manager.team } : null}
      senderEmail={loaded?.shell.viewerEmail ?? ""}
    />
  );
}
