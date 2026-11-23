import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { RegisterDeal } from "@/components/screens/RegisterDeal";
import { systemClock } from "@/lib/clock";
import { homeFor, requireCan } from "@/server/auth/viewer";
import { withViewer } from "@/server/repo/context";
import { listPartners } from "@/server/repo/partners";
import { listManagerOptions } from "@/server/repo/staff";

export const metadata: Metadata = { title: "Register deal for a partner" };

export default async function Page(): Promise<React.JSX.Element> {
  const viewer = await requireCan("registration.create");
  if (viewer.kind !== "staff") redirect(homeFor(viewer));
  const { managers, partners } = await withViewer(viewer, async (tx) => ({
    managers: await listManagerOptions(tx, viewer),
    partners: await listPartners(tx, viewer, {}),
  }));
  return (
    <RegisterDeal
      mine={[]}
      managers={managers}
      partnerName=""
      partnerRegion={undefined}
      today={systemClock.today()}
      userId={`${viewer.id}:on-behalf`}
      source={null}
      onBehalf={{
        partners: partners
          .filter((p) => p.status !== "suspended")
          .map((p) => ({ id: p.id, name: p.name, region: p.region, category: p.category })),
      }}
    />
  );
}
