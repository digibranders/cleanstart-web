import type { Metadata } from "next";
import { Company } from "@/components/screens/Company";
import { can } from "@/server/auth/policies";
import { requireCan } from "@/server/auth/viewer";
import { withViewer } from "@/server/repo/context";
import { getCompany } from "@/server/repo/partners";

export const metadata: Metadata = { title: "Company" };

export default async function Page(): Promise<React.JSX.Element> {
  const viewer = await requireCan("partner.read");
  const company = await withViewer(viewer, (tx) => getCompany(tx, viewer, {}));
  const canEdit = can(viewer, "partner.update_profile", { partnerId: company.partnerId });
  return <Company company={company} canEdit={canEdit} viewerEmail={viewer.email} />;
}
