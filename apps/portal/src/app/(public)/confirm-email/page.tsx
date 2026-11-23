import type { Metadata } from "next";
import { headers } from "next/headers";
import { ConfirmEmail } from "@/components/screens/ConfirmEmail";
import { systemClock } from "@/lib/clock";
import { INVITE_IP_RULE } from "@/lib/invites";
import { publicActor } from "@/server/auth/types";
import { rateLimit } from "@/server/rate-limit";
import { withSystem } from "@/server/repo/context";
import { type EmailChangePreview, previewEmailChange } from "@/server/repo/member-edit";
import { clientIp, UNKNOWN_IP_BUCKET } from "@/server/security/client-ip";

export const metadata: Metadata = { title: "Confirm your email" };

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ token?: string | string[] }>;
}): Promise<React.JSX.Element> {
  const { token: raw } = await searchParams;
  const token = typeof raw === "string" ? raw : "";
  rateLimit(`email-change:ip:${clientIp(await headers()) ?? UNKNOWN_IP_BUCKET}`, INVITE_IP_RULE);
  const actor = publicActor("Someone confirming an email");
  const preview: EmailChangePreview = token
    ? await withSystem(actor, (tx) => previewEmailChange(tx, actor, token, systemClock))
    : { state: "unknown" };
  return <ConfirmEmail token={token} preview={preview} />;
}
