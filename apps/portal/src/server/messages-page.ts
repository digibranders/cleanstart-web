import { notFound } from "next/navigation";
import { can } from "@/server/auth/policies";
import { requireCan } from "@/server/auth/viewer";
import type { Viewer } from "@/server/auth/types";
import { systemClock } from "@/lib/clock";
import type { ChatInboxDto } from "@/lib/chat";
import { listInbox } from "@/server/repo/chat";
import { withViewer } from "@/server/repo/context";

export interface MessagesPageData {
  viewer: Viewer;
  inbox: ChatInboxDto;
  canCreateGroup: boolean;
  initialId: string | null;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Both Messages pages: the viewer must be of the right kind, then the chat list and an optional `?c=` chat to open. */
export async function loadMessagesPage(kind: "partner" | "admin", searchParams: Promise<Record<string, string | string[] | undefined>>): Promise<MessagesPageData> {
  const viewer = await requireCan("chat.use");
  if ((kind === "partner") !== (viewer.kind === "partner")) notFound();
  const params = await searchParams;
  const raw = params.c;
  const wanted = typeof raw === "string" && UUID.test(raw) ? raw : null;
  const inbox = await withViewer(viewer, (tx) => listInbox(tx, viewer, systemClock));
  return { viewer, inbox, canCreateGroup: can(viewer, "chat.create_group"), initialId: wanted };
}
