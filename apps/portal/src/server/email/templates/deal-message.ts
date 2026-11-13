import { type EmailBlock, renderEmail } from '../layout';
import type { EmailAddress, EmailMessage } from '../transport';
import { asList, FOOTNOTES, hello, oneLine, truncate } from './shared';

export interface DealMessageInput {
  to: EmailAddress;
  recipientName: string;
  authorName: string;
  authorOrg: string;
  customer: string;
  excerpt: string;
  dealUrl: string;
}

export function buildDealMessage(input: DealMessageInput): EmailMessage {
  const blocks: EmailBlock[] = [
    { type: 'paragraph', text: hello(input.recipientName) },
    { type: 'paragraph', text: `${input.authorName} (${input.authorOrg}) wrote on the ${input.customer} deal:` },
    { type: 'note', text: input.excerpt },
    { type: 'button', label: 'Open the conversation', url: input.dealUrl },
  ];
  return {
    to: asList(input.to),
    subject: oneLine(`New message about ${input.customer}`),
    htmlContent: renderEmail({
      preheader: truncate(`${input.authorName} wrote: ${input.excerpt}`, 100),
      heading: 'New message on a deal',
      blocks,
      footnote: FOOTNOTES.partnerUser,
    }),
  };
}
