import type { Metadata } from "next";
import { headers } from "next/headers";
import { ApplyStatus } from "@/components/screens/ApplyStatus";
import { systemClock } from "@/lib/clock";
import { loadApplicationStatus } from "@/server/application-status";
import { clientIp } from "@/server/security/client-ip";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Application status", robots: { index: false, follow: false }, referrer: "no-referrer" };

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ token?: string | string[] }>;
}): Promise<React.JSX.Element> {
  const { token: raw } = await searchParams;
  const token = typeof raw === "string" ? raw : "";
  const status = await loadApplicationStatus(token, clientIp(await headers()), systemClock);
  return <ApplyStatus status={status} />;
}
