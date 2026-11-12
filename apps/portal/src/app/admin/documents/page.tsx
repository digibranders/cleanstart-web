import type { Metadata } from "next";
import { AdminDocuments } from "@/components/screens/AdminDocuments";

export const metadata: Metadata = { title: "Manage documents" };

export default function Page(): React.JSX.Element {
  return <AdminDocuments />;
}
