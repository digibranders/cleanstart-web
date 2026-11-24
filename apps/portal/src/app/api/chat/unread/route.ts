import { chatRoute } from '@/server/chat-route';
import { withViewer } from '@/server/repo/context';
import { countUnread } from '@/server/repo/chat';

export const dynamic = 'force-dynamic';

/** Just the number for the sidebar badge, polled from every page that is not Messages. */
export function GET(): Promise<Response> {
  return chatRoute('chat.unread', async (viewer, clock) => ({ unread: await withViewer(viewer, (tx) => countUnread(tx, viewer, clock)) }));
}
