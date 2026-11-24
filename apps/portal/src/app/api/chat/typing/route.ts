import { chatId, chatRoute } from '@/server/chat-route';
import { ValidationError } from '@/server/errors';
import { listTyping } from '@/server/repo/chat';
import { withViewer } from '@/server/repo/context';

export const dynamic = 'force-dynamic';

/** Only who is typing in one chat. Polled about once a second while a thread is open. */
export function GET(request: Request): Promise<Response> {
  const conversationId = chatId.safeParse(new URL(request.url).searchParams.get('c'));
  return chatRoute('chat.typing', async (viewer, clock) => {
    if (!conversationId.success) throw new ValidationError([{ path: 'c', message: 'Open a chat first.' }]);
    return { typing: await withViewer(viewer, (tx) => listTyping(tx, viewer, { conversationId: conversationId.data }, clock)) };
  });
}
