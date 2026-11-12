import type { Metadata } from "next";
import { AdminAudit } from "@/components/screens/AdminAudit";

export const metadata: Metadata = { title: "Audit log" };

export default function Page(): React.JSX.Element {
  return <AdminAudit />;
}
