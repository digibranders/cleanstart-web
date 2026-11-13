import type { IsoDate } from '@/lib/dto';
import { fmtLong } from '@/lib/dates';
import { type EmailBlock, renderEmail } from '../layout';
import type { EmailAddress, EmailMessage } from '../transport';
import { asList, FOOTNOTES, hello, oneLine } from './shared';

export interface DealAcceptedInput {
  to: EmailAddress;
  recipientName: string;
  customer: string;
  productLabel: string;
  partnerName: string;
  protectionEnd: IsoDate;
  dealUrl: string;
}

export function buildDealAccepted(input: DealAcceptedInput): EmailMessage {
  const until = fmtLong(input.protectionEnd);
  const blocks: EmailBlock[] = [
    { type: 'paragraph', text: hello(input.recipientName) },
    { type: 'paragraph', text: `CleanStart accepted the registration for ${input.customer}.` },
    {
      type: 'facts',
      rows: [
        { label: 'Customer', value: input.customer },
        { label: 'Product', value: input.productLabel },
        { label: 'Registered by', value: input.partnerName },
        { label: 'Protected until', value: until },
      ],
    },
    {
      type: 'paragraph',
      text: 'While protection runs, CleanStart does not accept another partner registration for the same customer and product.',
    },
    { type: 'button', label: 'Open the deal', url: input.dealUrl },
  ];
  return {
    to: asList(input.to),
    subject: oneLine(`${input.customer} was accepted`),
    htmlContent: renderEmail({
      preheader: oneLine(`${input.productLabel} is protected until ${until}.`),
      heading: 'Deal registration accepted',
      blocks,
      footnote: FOOTNOTES.partnerUser,
    }),
  };
}
