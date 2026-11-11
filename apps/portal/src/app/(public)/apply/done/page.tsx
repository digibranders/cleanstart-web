import type { Metadata } from "next";
import { ApplyDone } from "@/components/screens/ApplyDone";

export const metadata: Metadata = { title: "Application received" };

export default function Page(): React.JSX.Element {
  return <ApplyDone />;
}
