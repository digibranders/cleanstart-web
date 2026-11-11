import type { Metadata } from "next";
import { Deals } from "@/components/screens/Deals";

export const metadata: Metadata = { title: "Deals" };

export default function Page(): React.JSX.Element {
  return <Deals />;
}
