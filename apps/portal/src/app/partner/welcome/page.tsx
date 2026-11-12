import type { Metadata } from "next";
import { PartnerWelcome } from "@/components/screens/PartnerWelcome";

export const metadata: Metadata = { title: "Welcome" };

export default function Page(): React.JSX.Element {
  return <PartnerWelcome />;
}
