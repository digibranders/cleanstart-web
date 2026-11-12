import type { Metadata } from "next";
import { PartnerOverview } from "@/components/screens/PartnerOverview";

export const metadata: Metadata = { title: "Overview" };

export default function Page(): React.JSX.Element {
  return <PartnerOverview />;
}
