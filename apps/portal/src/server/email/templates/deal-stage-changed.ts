import { type EmailBlock, renderEmail } from '../layout';
import type { EmailAddress, EmailMessage } from '../transport';
import { asList, FOOTNOTES, hello, oneLine } from './shared';

export interface DealStageChangedInput {
  to: EmailAddress;
  recipientName: string;
  customer: string;
  productLabel: string;
  stage: string;
  dealUrl: string;
}

export function buildDealStageChanged(input: DealStageChangedInput): EmailMessage {
  const blocks: EmailBlock[] = [
    { type: 'paragraph', text: hello(input.recipientName) },
    { type: 'paragraph', text: `The ${input.productLabel} deal for ${input.customer} is now at ${input.stage}.` },
    { type: 'paragraph', text: "The stage comes from CleanStart's CRM." },
    { type: 'button', label: 'Open the deal', url: input.dealUrl },
  ];
  return {
    to: asList(input.to),
    subject: oneLine(`${input.customer} moved to ${input.stage}`),
    htmlContent: renderEmail({
      preheader: oneLine(`${input.productLabel} deal stage update from CleanStart.`),
      heading: 'Deal stage update',
      blocks,
      footnote: FOOTNOTES.partnerUser,
    }),
  };
}
