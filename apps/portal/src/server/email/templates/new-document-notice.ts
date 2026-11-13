import { type EmailBlock, renderEmail } from '../layout';
import type { EmailAddress, EmailMessage } from '../transport';
import { asList, FOOTNOTES, hello, oneLine } from './shared';

export interface NewDocumentNoticeInput {
  to: EmailAddress;
  recipientName: string;
  title: string;
  typeLabel: string;
  productLabel: string;
  libraryUrl: string;
}

export function buildNewDocumentNotice(input: NewDocumentNoticeInput): EmailMessage {
  const blocks: EmailBlock[] = [
    { type: 'paragraph', text: hello(input.recipientName) },
    { type: 'paragraph', text: 'CleanStart added a document to the library.' },
    {
      type: 'facts',
      rows: [
        { label: 'Title', value: input.title },
        { label: 'Type', value: input.typeLabel },
        { label: 'Product', value: input.productLabel },
      ],
    },
    { type: 'button', label: 'Open the library', url: input.libraryUrl },
  ];
  return {
    to: asList(input.to),
    subject: oneLine(`New in the document library: ${input.title}`),
    htmlContent: renderEmail({
      preheader: oneLine(`${input.typeLabel} for ${input.productLabel}.`),
      heading: 'New document',
      blocks,
      footnote: FOOTNOTES.partnerUser,
    }),
  };
}
