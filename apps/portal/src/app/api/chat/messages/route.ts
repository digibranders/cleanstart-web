import { chatId, chatRoute, nonNegative } from '@/server/chat-route';
import { ValidationError } from '@/server/errors';
import { withViewer } from '@/server/repo/context';
import { loadMessages } from '@/server/repo/chat';

export const dynamic = 'force-dynamic';

/** The newest page of a chat, or the page before `before` (a message number) when scrolling up. */
export function GET(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const conversationId = chatId.safeParse(url.searchParams.get('c'));
  const beforeRaw = url.searchParams.get('before');
  const before = beforeRaw === null ? null : nonNegative.safeParse(beforeRaw);
  return chatRoute('chat.messages', (viewer) => {
    if (!conversationId.success || (before !== null && !before.success)) throw new ValidationError([{ path: 'c', message: 'Open a chat first.' }]);
    return withViewer(viewer, (tx) =>
      loadMessages(tx, viewer, { conversationId: conversationId.data, ...(before?.success ? { beforeSeq: before.data } : {}) }),
    );
  });
}
