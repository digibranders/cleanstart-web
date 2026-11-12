import type { Metadata } from "next";
import { Company } from "@/components/screens/Company";

export const metadata: Metadata = { title: "Company" };

export default function Page(): React.JSX.Element {
  return <Company />;
}
