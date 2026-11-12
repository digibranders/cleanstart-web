import type { Metadata } from "next";
import { DealDetail } from "@/components/screens/DealDetail";

export const metadata: Metadata = { title: "Deal detail" };

export default async function Page({ params }: { params: Promise<{ id: string }> }): Promise<React.JSX.Element> {
  const { id } = await params;
  return <DealDetail id={id} />;
}
