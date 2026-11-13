import { type EmailBlock, renderEmail } from '../layout';
import type { EmailAddress, EmailMessage } from '../transport';
import { FOOTNOTES, oneLine } from './shared';

/** To the deal's partner manager (staff). */
export interface ExtensionRequestedInput {
  to: EmailAddress[];
  partnerName: string;
  customer: string;
  productLabel: string;
  reason: string;
  approvalsUrl: string;
}

export function buildExtensionRequested(input: ExtensionRequestedInput): EmailMessage {
  const blocks: EmailBlock[] = [
    {
      type: 'paragraph',
      text: `${input.partnerName} asked to extend protection on the ${input.productLabel} deal for ${input.customer}.`,
    },
    { type: 'facts', rows: [{ label: 'Reason', value: input.reason }] },
    { type: 'button', label: 'Review the request', url: input.approvalsUrl },
  ];
  return {
    to: input.to,
    subject: oneLine(`Extension requested: ${input.customer} from ${input.partnerName}`),
    htmlContent: renderEmail({
      preheader: oneLine(`${input.partnerName} asked for more protection time.`),
      heading: 'Protection extension requested',
      blocks,
      footnote: FOOTNOTES.staff,
    }),
  };
}
