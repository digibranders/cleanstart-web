import type { Metadata } from "next";
import { Program } from "@/components/screens/Program";
import { requireCan } from "@/server/auth/viewer";

export const metadata: Metadata = { title: "Program" };

export default async function Page(): Promise<React.JSX.Element> {
  await requireCan("partner.read");
  return <Program />;
}
