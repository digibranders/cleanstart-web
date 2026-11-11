import type { Metadata } from "next";
import { AdminTeam } from "@/components/screens/AdminTeam";

export const metadata: Metadata = { title: "CleanStart team" };

export default function Page(): React.JSX.Element {
  return <AdminTeam />;
}
