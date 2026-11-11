import type { Metadata } from "next";
import { Team } from "@/components/screens/Team";

export const metadata: Metadata = { title: "Team" };

export default function Page(): React.JSX.Element {
  return <Team />;
}
