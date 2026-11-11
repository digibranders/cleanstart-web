import type { Metadata } from "next";
import { Apply } from "@/components/screens/Apply";

export const metadata: Metadata = { title: "Apply to become a partner" };

export default function Page(): React.JSX.Element {
  return <Apply />;
}
