import type { Metadata } from "next";
import { Deals } from "@/components/screens/Deals";
import { systemClock } from "@/lib/clock";
import { requireCan } from "@/server/auth/viewer";
import { withViewer } from "@/server/repo/context";
import { listRegistrations } from "@/server/repo/registrations";

export const metadata: Metadata = { title: "Deals" };

interface PageProps {
  searchParams: Promise<{ status?: string | string[] }>;
}

export default async function Page({ searchParams }: PageProps): Promise<React.JSX.Element> {
  const { status } = await searchParams;
  const viewer = await requireCan("registration.read");
  const deals = await withViewer(viewer, (tx) => listRegistrations(tx, viewer, { limit: 1000 }));
  return (
    <Deals
      deals={deals}
      today={systemClock.today()}
      ownDealsOnly={viewer.kind === "partner" && viewer.role === "sales"}
      initialStatus={Array.isArray(status) ? status[0] : status}
    />
  );
}
