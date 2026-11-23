import { type EmailBlock, renderEmail } from '../layout';
import type { EmailAddress, EmailMessage } from '../transport';
import { FOOTNOTES, oneLine } from './shared';

/** To the partner user who registered deal(s), right after submission. */
export interface RegistrationReceivedInput {
  to: EmailAddress;
  customer: string;
  productLabel: string;
  regionLabel: string;
  dealsUrl: string;
}

export function buildRegistrationReceived(input: RegistrationReceivedInput): EmailMessage {
  const blocks: EmailBlock[] = [
    { type: 'paragraph', text: `We received your registration for ${input.customer}.` },
    {
      type: 'facts',
      rows: [
        { label: 'Customer', value: input.customer },
        { label: 'Product', value: input.productLabel },
        { label: 'Region', value: input.regionLabel },
      ],
    },
    {
      type: 'paragraph',
      text: 'CleanStart reviews each registration within 2 business days. You get an email when it is accepted or when we need more from you. Protection starts when it is accepted.',
    },
    { type: 'button', label: 'View your deals', url: input.dealsUrl },
  ];
  return {
    to: [input.to],
    subject: oneLine(`Registration received: ${input.customer}`),
    htmlContent: renderEmail({
      preheader: oneLine(`${input.customer} is with CleanStart for review. Expect a decision within 2 business days.`),
      heading: 'Registration received',
      blocks,
      footnote: FOOTNOTES.partnerUser,
    }),
  };
}
