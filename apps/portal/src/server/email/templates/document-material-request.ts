import { type EmailBlock, renderEmail } from '../layout';
import type { EmailAddress, EmailMessage } from '../transport';
import { FOOTNOTES, oneLine } from './shared';

/** From the "Request material" dialog. To the partner manager and marketing recipients; replyTo is the requester. */
export interface DocumentMaterialRequestInput {
  to: EmailAddress[];
  replyTo: EmailAddress;
  partnerName: string;
  requesterName: string;
  request: string;
  productLabel: string;
}

export function buildDocumentMaterialRequest(input: DocumentMaterialRequestInput): EmailMessage {
  const blocks: EmailBlock[] = [
    { type: 'paragraph', text: `${input.requesterName} at ${input.partnerName} asked for sales material.` },
    {
      type: 'facts',
      rows: [
        { label: 'Partner', value: input.partnerName },
        { label: 'From', value: `${input.requesterName}, ${input.replyTo.email}` },
        { label: 'Product', value: input.productLabel },
        { label: 'Request', value: input.request },
      ],
    },
    { type: 'paragraph', text: `Reply to this email to answer ${input.requesterName} directly.` },
  ];
  return {
    to: input.to,
    replyTo: input.replyTo,
    subject: oneLine(`Material request from ${input.partnerName}`),
    htmlContent: renderEmail({
      preheader: oneLine(`${input.requesterName} asked for material on ${input.productLabel}.`),
      heading: 'Material request',
      blocks,
      footnote: FOOTNOTES.staff,
    }),
  };
}
