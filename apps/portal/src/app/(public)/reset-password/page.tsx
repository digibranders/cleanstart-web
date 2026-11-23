import type { Metadata } from "next";
import { ResetPassword } from "@/components/screens/ResetPassword";
import { isResetTokenLive } from "@/server/auth/reset-token";

export const metadata: Metadata = { title: "Reset your password" };

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ token?: string | string[] }>;
}): Promise<React.JSX.Element> {
  const { token } = await searchParams;
  const value = typeof token === "string" ? token : "";
  return <ResetPassword token={value} linkDead={value !== "" && !(await isResetTokenLive(value))} />;
}
