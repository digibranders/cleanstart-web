import { chatRoute } from '@/server/chat-route';
import { withViewer } from '@/server/repo/context';
import { listInbox } from '@/server/repo/chat';

export const dynamic = 'force-dynamic';

/** The viewer's chats with unread counts. Polling it also marks everything delivered and keeps the online dot lit. */
export function GET(): Promise<Response> {
  return chatRoute('chat.inbox', (viewer, clock) => withViewer(viewer, (tx) => listInbox(tx, viewer, clock)));
}
