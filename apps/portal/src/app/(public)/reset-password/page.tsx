import type { Metadata } from "next";
import { ResetPassword } from "@/components/screens/ResetPassword";

export const metadata: Metadata = { title: "Reset your password" };

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ token?: string | string[] }>;
}): Promise<React.JSX.Element> {
  const { token } = await searchParams;
  return <ResetPassword token={typeof token === "string" ? token : ""} />;
}
