import { type EmailBlock, renderEmail } from '../layout';
import type { EmailAddress, EmailMessage } from '../transport';
import { asList, FOOTNOTES, hello, oneLine } from './shared';

/** From the "Message your partner manager" drawers. */
export interface ManagerMessageInput {
  to: EmailAddress;
  replyTo: EmailAddress;
  managerName: string;
  senderName: string;
  partnerName: string;
  subject: string;
  body: string;
}

export function buildManagerMessage(input: ManagerMessageInput): EmailMessage {
  const blocks: EmailBlock[] = [
    { type: 'paragraph', text: hello(input.managerName) },
    { type: 'paragraph', text: `${input.senderName} at ${input.partnerName} wrote from the Partner Portal:` },
    { type: 'facts', rows: [{ label: 'Subject', value: input.subject }] },
    { type: 'note', text: input.body },
    { type: 'paragraph', text: `Reply to this email to answer ${input.senderName}.` },
  ];
  return {
    to: asList(input.to),
    replyTo: input.replyTo,
    subject: oneLine(`${input.partnerName}: ${input.subject}`),
    htmlContent: renderEmail({
      preheader: oneLine(`${input.senderName} at ${input.partnerName} sent you a message from the portal.`),
      heading: `Message from ${oneLine(input.senderName)}`,
      blocks,
      footnote: FOOTNOTES.staff,
    }),
  };
}
