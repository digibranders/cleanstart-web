import { type EmailBlock, renderEmail } from '../layout';
import type { EmailAddress, EmailMessage } from '../transport';
import { asList, FOOTNOTES, hello, oneLine } from './shared';

export interface AccessRequestDeclinedInput {
  to: EmailAddress;
  requesterName: string;
  companyName: string;
}

export function buildAccessRequestDeclined(input: AccessRequestDeclinedInput): EmailMessage {
  const blocks: EmailBlock[] = [
    { type: 'paragraph', text: hello(input.requesterName) },
    {
      type: 'paragraph',
      text: `The partner admin at ${input.companyName} did not approve your request for a Partner Portal login.`,
    },
    { type: 'paragraph', text: 'If you think this is a mistake, speak to your partner admin directly.' },
  ];
  return {
    to: asList(input.to),
    subject: 'Your CleanStart Partner Portal access request',
    htmlContent: renderEmail({
      preheader: oneLine(`The partner admin at ${input.companyName} did not approve it.`),
      heading: 'Access request declined',
      blocks,
      footnote: FOOTNOTES.account,
    }),
  };
}
