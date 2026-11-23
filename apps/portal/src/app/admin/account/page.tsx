import type { Metadata } from "next";
import { headers } from "next/headers";
import { Account } from "@/components/screens/Account";
import { systemClock } from "@/lib/clock";
import { auth } from "@/server/auth/auth";
import { listSessions } from "@/server/auth/sessions";
import { requireCan } from "@/server/auth/viewer";
import { getProfile } from "@/server/repo/account";
import { withViewer } from "@/server/repo/context";

export const metadata: Metadata = { title: "Your account" };

export default async function Page(): Promise<React.JSX.Element> {
  const viewer = await requireCan("account.update_profile");
  const profile = await withViewer(viewer, (tx) => getProfile(tx, viewer));
  const session = await auth.api.getSession({ headers: await headers() });
  const sessions = await listSessions(viewer.id, session?.session.token ?? null);
  return <Account profile={profile} sessions={sessions} today={systemClock.today()} />;
}
