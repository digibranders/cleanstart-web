import type { Metadata } from "next";
import { RegisterDeal } from "@/components/screens/RegisterDeal";

export const metadata: Metadata = { title: "Register a deal" };

export default function Page(): React.JSX.Element {
  return <RegisterDeal />;
}
