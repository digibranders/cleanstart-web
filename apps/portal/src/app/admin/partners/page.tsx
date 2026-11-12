import type { Metadata } from "next";
import { Suspense } from "react";
import { AdminPartners } from "@/components/screens/AdminPartners";

export const metadata: Metadata = { title: "Partners" };

export default function Page(): React.JSX.Element {
  return (
    <Suspense fallback={null}>
      <AdminPartners />
    </Suspense>
  );
}
