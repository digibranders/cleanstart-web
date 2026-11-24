import { type EmailBlock, renderEmail } from '../layout';
import type { EmailAddress, EmailMessage } from '../transport';
import { asList, FOOTNOTES, hello, oneLine } from './shared';

export interface ChatDigestChat {
  title: string;
  unread: number;
  lastPreview: string | null;
}

/** Sent when messages have sat unread for a while. Names the chats and the newest line, never the whole conversation. */
export interface ChatDigestInput {
  to: EmailAddress;
  recipientName: string;
  chats: readonly ChatDigestChat[];
  messagesUrl: string;
}

export function buildChatDigest(input: ChatDigestInput): EmailMessage {
  const total = input.chats.reduce((sum, chat) => sum + chat.unread, 0);
  const noun = total === 1 ? 'message' : 'messages';
  const blocks: EmailBlock[] = [
    { type: 'paragraph', text: hello(input.recipientName) },
    { type: 'paragraph', text: `You have ${total} unread ${noun} on the CleanStart Partner Portal.` },
    {
      type: 'facts',
      rows: input.chats.slice(0, 8).map((chat) => ({
        label: oneLine(chat.title),
        value: `${chat.unread} unread${chat.lastPreview ? `. ${oneLine(chat.lastPreview)}` : ''}`,
      })),
    },
    { type: 'button', label: 'Open Messages', url: input.messagesUrl },
  ];
  return {
    to: asList(input.to),
    subject: `You have ${total} unread ${noun} on the Partner Portal`,
    htmlContent: renderEmail({
      preheader: oneLine(`${total} unread ${noun} in ${input.chats.length} ${input.chats.length === 1 ? 'chat' : 'chats'}.`),
      heading: 'Unread messages',
      blocks,
      footnote: `${FOOTNOTES.partnerUser} Turn these emails off under Account, Notifications.`,
    }),
  };
}
