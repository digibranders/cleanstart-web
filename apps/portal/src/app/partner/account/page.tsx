import type { Metadata } from "next";
import { Account } from "@/components/screens/Account";

export const metadata: Metadata = { title: "Your account" };

export default function Page(): React.JSX.Element {
  return <Account />;
}
