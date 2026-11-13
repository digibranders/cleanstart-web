import type { Metadata } from "next";
import { RegisterDeal } from "@/components/screens/RegisterDeal";
import { systemClock } from "@/lib/clock";
import { requireCan } from "@/server/auth/viewer";
import { withViewer } from "@/server/repo/context";
import { listRegistrations } from "@/server/repo/registrations";
import { listManagerOptions } from "@/server/repo/staff";

export const metadata: Metadata = { title: "Register deal" };

export default async function Page(): Promise<React.JSX.Element> {
  const viewer = await requireCan("registration.create");
  const { mine, managers } = await withViewer(viewer, async (tx) => ({
    mine: await listRegistrations(tx, viewer, { limit: 1000 }),
    managers: await listManagerOptions(tx, viewer),
  }));
  return <RegisterDeal mine={mine} managers={managers} partnerName={viewer.partnerName ?? ""} today={systemClock.today()} />;
}
