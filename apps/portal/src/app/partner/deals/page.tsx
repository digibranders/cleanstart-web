import type { Metadata } from "next";
import { Deals } from "@/components/screens/Deals";
import { systemClock } from "@/lib/clock";
import { requireCan } from "@/server/auth/viewer";
import { withViewer } from "@/server/repo/context";
import { listRegistrations } from "@/server/repo/registrations";

export const metadata: Metadata = { title: "Deals" };

export default async function Page(): Promise<React.JSX.Element> {
  const viewer = await requireCan("registration.read");
  const deals = await withViewer(viewer, (tx) => listRegistrations(tx, viewer, { limit: 1000 }));
  return (
    <Deals deals={deals} today={systemClock.today()} ownDealsOnly={viewer.kind === "partner" && viewer.role === "sales"} />
  );
}
