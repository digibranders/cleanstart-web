import type { Metadata } from "next";
import { PartnerOverview } from "@/components/screens/PartnerOverview";
import { systemClock } from "@/lib/clock";
import { requireCan } from "@/server/auth/viewer";
import { withViewer } from "@/server/repo/context";
import { getPartnerOverview } from "@/server/repo/overview";

export const metadata: Metadata = { title: "Overview" };

export default async function Page(): Promise<React.JSX.Element> {
  const viewer = await requireCan("overview.read");
  const now = systemClock.now();
  const overview = await withViewer(viewer, (tx) => getPartnerOverview(tx, viewer, systemClock));
  return <PartnerOverview overview={overview} today={systemClock.today()} asOf={now.toISOString()} />;
}
