import { chatId, chatRoute, nonNegative } from '@/server/chat-route';
import { ValidationError } from '@/server/errors';
import { withViewer } from '@/server/repo/context';
import { pollConversation } from '@/server/repo/chat';

export const dynamic = 'force-dynamic';

/** What changed in one chat since `since` (a rev): changed messages, read and delivery positions, who is typing, pins. */
export function GET(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const conversationId = chatId.safeParse(url.searchParams.get('c'));
  const since = nonNegative.safeParse(url.searchParams.get('since') ?? '0');
  return chatRoute('chat.poll', (viewer, clock) => {
    if (!conversationId.success || !since.success) throw new ValidationError([{ path: 'c', message: 'Open a chat first.' }]);
    return withViewer(viewer, (tx) => pollConversation(tx, viewer, { conversationId: conversationId.data, sinceRev: since.data }, clock));
  });
}
