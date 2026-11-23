import type { Metadata } from "next";
import { RegisterDeal } from "@/components/screens/RegisterDeal";
import { systemClock } from "@/lib/clock";
import { requireCan } from "@/server/auth/viewer";
import { getShell } from "@/server/repo/account";
import { withViewer } from "@/server/repo/context";
import { getRegisterAgainSource, listRegistrations } from "@/server/repo/registrations";
import { listManagerOptions } from "@/server/repo/staff";

export const metadata: Metadata = { title: "Register deal" };

export default async function Page({ searchParams }: { searchParams: Promise<{ from?: string | string[] }> }): Promise<React.JSX.Element> {
  const viewer = await requireCan("registration.create");
  const { from } = await searchParams;
  const fromId = typeof from === "string" ? from : undefined;
  const { mine, managers, shell, source } = await withViewer(viewer, async (tx) => ({
    source: fromId ? await getRegisterAgainSource(tx, viewer, fromId) : null,
    shell: await getShell(tx, viewer),
    mine: await listRegistrations(tx, viewer, { limit: 1000 }),
    managers: await listManagerOptions(tx, viewer),
  }));
  return (
    <RegisterDeal
      mine={mine}
      managers={managers}
      partnerName={viewer.partnerName ?? ""}
      partnerRegion={shell.partnerRegion}
      today={systemClock.today()}
      userId={viewer.id}
      source={source}
    />
  );
}
