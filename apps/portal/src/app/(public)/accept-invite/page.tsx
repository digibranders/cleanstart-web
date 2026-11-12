import type { Metadata } from "next";
import { AcceptInvite } from "@/components/screens/AcceptInvite";

export const metadata: Metadata = { title: "Set up your account" };

export default function Page(): React.JSX.Element {
  return <AcceptInvite />;
}
