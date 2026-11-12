import type { Metadata } from "next";
import { AdminApprovals } from "@/components/screens/AdminApprovals";

export const metadata: Metadata = { title: "Deal approvals" };

export default function Page(): React.JSX.Element {
  return <AdminApprovals />;
}
