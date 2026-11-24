import type { Metadata } from "next";
import { Messages } from "@/components/screens/Messages";
import { ROUTES } from "@/lib/routes";
import { loadMessagesPage } from "@/server/messages-page";

export const metadata: Metadata = { title: "Messages" };
export const dynamic = "force-dynamic";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}): Promise<React.JSX.Element> {
  const { viewer, inbox, canCreateGroup, initialId } = await loadMessagesPage("admin", searchParams);
  return (
    <Messages
      initialInbox={inbox}
      viewerId={viewer.id}
      staff={viewer.kind === "staff"}
      canCreateGroup={canCreateGroup}
      initialId={initialId}
      basePath={ROUTES.admin.messages}
    />
  );
}
