import type { Metadata } from "next";
import { Notifications } from "@/components/screens/Notifications";
import { ROUTES } from "@/lib/routes";
import { loadNotificationsPage } from "@/server/notifications-page";

export const metadata: Metadata = { title: "Notifications" };
export const dynamic = "force-dynamic";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}): Promise<React.JSX.Element> {
  const { data, unreadOnly, today } = await loadNotificationsPage("partner", searchParams);
  return <Notifications data={data} unreadOnly={unreadOnly} basePath={ROUTES.partner.notifications} today={today} />;
}
