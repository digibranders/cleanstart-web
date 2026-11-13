import { type EmailBlock, renderEmail } from '../layout';
import type { EmailAddress, EmailMessage } from '../transport';
import { asList, FOOTNOTES, hello, oneLine } from './shared';

export interface DealRejectedInput {
  to: EmailAddress;
  recipientName: string;
  customer: string;
  productLabel: string;
  reason: string;
  dealUrl: string;
}

export function buildDealRejected(input: DealRejectedInput): EmailMessage {
  const blocks: EmailBlock[] = [
    { type: 'paragraph', text: hello(input.recipientName) },
    {
      type: 'paragraph',
      text: `CleanStart did not accept the ${input.productLabel} registration for ${input.customer}.`,
    },
    { type: 'facts', rows: [{ label: 'Reason', value: input.reason }] },
    { type: 'paragraph', text: 'You can correct the details and resubmit the registration from the deal page.' },
    { type: 'button', label: 'Open the deal', url: input.dealUrl },
  ];
  return {
    to: asList(input.to),
    subject: oneLine(`${input.customer} was not accepted`),
    htmlContent: renderEmail({
      preheader: 'See the reason and how to resubmit.',
      heading: 'Deal registration not accepted',
      blocks,
      footnote: FOOTNOTES.partnerUser,
    }),
  };
}
