import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { StaffDealDetail } from "@/components/screens/StaffDealDetail";
import { systemClock } from "@/lib/clock";
import { homeFor, requireCan } from "@/server/auth/viewer";
import { NotFoundError } from "@/server/errors";
import { withViewer } from "@/server/repo/context";
import { conflictChecks, getRegistration } from "@/server/repo/registrations";

type Params = { params: Promise<{ id: string }> };

async function load(id: string) {
  const viewer = await requireCan("registration.read_queue");
  if (viewer.kind !== "staff") redirect(homeFor(viewer));
  return withViewer(viewer, async (tx) => {
    try {
      const deal = await getRegistration(tx, viewer, id);
      const check = (await conflictChecks(tx, viewer, { registrationIds: [id] }))[id] ?? { kind: "none" as const };
      return { deal, check };
    } catch (error) {
      if (error instanceof NotFoundError) return null;
      throw error;
    }
  });
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const loaded = await load((await params).id);
  return { title: loaded?.deal.customer ?? "Deal not found" };
}

export default async function Page({ params }: Params): Promise<React.JSX.Element> {
  const loaded = await load((await params).id);
  return <StaffDealDetail deal={loaded?.deal ?? null} check={loaded?.check ?? { kind: "none" }} today={systemClock.today()} />;
}
