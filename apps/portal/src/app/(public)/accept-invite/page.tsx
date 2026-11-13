import type { Metadata } from "next";
import { headers } from "next/headers";
import { AcceptInvite } from "@/components/screens/AcceptInvite";
import { systemClock } from "@/lib/clock";
import type { InvitePreviewDto } from "@/lib/dto";
import { loadInvitePreview } from "@/server/invite-preview";
import { clientIp } from "@/server/security/client-ip";

export const metadata: Metadata = { title: "Set up your account" };

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ token?: string | string[] }>;
}): Promise<React.JSX.Element> {
  const { token: raw } = await searchParams;
  const token = typeof raw === "string" ? raw : "";
  const ip = clientIp(await headers());
  const preview: InvitePreviewDto = token ? await loadInvitePreview(token, ip, systemClock) : { state: "unknown" };
  return <AcceptInvite token={token} preview={preview} />;
}
