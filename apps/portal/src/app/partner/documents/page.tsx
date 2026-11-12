import type { Metadata } from "next";
import { Documents } from "@/components/screens/Documents";

export const metadata: Metadata = { title: "Documents" };

export default function Page(): React.JSX.Element {
  return <Documents />;
}
