import type { Metadata } from "next";
import { AdminReports } from "@/components/screens/AdminReports";

export const metadata: Metadata = { title: "Reports" };

export default function Page(): React.JSX.Element {
  return <AdminReports />;
}
