import type { Metadata } from "next";
import { AdminRegions } from "@/components/screens/AdminRegions";
import { requireCan } from "@/server/auth/viewer";
import { withViewer } from "@/server/repo/context";
import { listRegionsAdmin } from "@/server/repo/regions";

export const metadata: Metadata = { title: "Regions" };

export default async function Page(): Promise<React.JSX.Element> {
  const viewer = await requireCan("region.manage");
  const regions = await withViewer(viewer, (tx) => listRegionsAdmin(tx, viewer));
  return <AdminRegions regions={regions} />;
}
