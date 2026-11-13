import type { Metadata } from "next";
import { PartnerWelcome } from "@/components/screens/PartnerWelcome";
import { requireCan } from "@/server/auth/viewer";
import { withViewer } from "@/server/repo/context";
import { getChecklist, getCompany } from "@/server/repo/partners";

export const metadata: Metadata = { title: "Welcome" };

export default async function Page(): Promise<React.JSX.Element> {
  const viewer = await requireCan("partner.update_checklist");
  const data = await withViewer(viewer, async (tx) => ({
    company: await getCompany(tx, viewer, {}),
    checklist: await getChecklist(tx, viewer),
  }));
  return (
    <PartnerWelcome
      firstName={viewer.name.split(" ")[0] ?? viewer.name}
      company={data.company}
      checklist={data.checklist}
      viewerEmail={viewer.email}
    />
  );
}
