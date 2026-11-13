import type { IsoDate } from '@/lib/dto';
import { fmtLong } from '@/lib/dates';
import { type EmailBlock, renderEmail } from '../layout';
import type { EmailAddress, EmailMessage } from '../transport';
import { asList, FOOTNOTES, hello, oneLine } from './shared';

export interface ExtensionDecisionInput {
  to: EmailAddress;
  recipientName: string;
  customer: string;
  productLabel: string;
  granted: boolean;
  newEnd: IsoDate | null;
  note: string | null;
  dealUrl: string;
}

export function buildExtensionDecision(input: ExtensionDecisionInput): EmailMessage {
  const newEnd = input.granted && input.newEnd ? fmtLong(input.newEnd) : null;
  const blocks: EmailBlock[] = [
    { type: 'paragraph', text: hello(input.recipientName) },
    {
      type: 'paragraph',
      text: input.granted
        ? `CleanStart extended protection on the ${input.productLabel} deal for ${input.customer}.`
        : `CleanStart declined the extension request for the ${input.productLabel} deal for ${input.customer}. Protection ends on the original date.`,
    },
  ];
  const rows: Array<{ label: string; value: string }> = [];
  if (newEnd) rows.push({ label: 'New protection end', value: newEnd });
  if (input.note && input.note.trim() !== '') rows.push({ label: 'Note from CleanStart', value: input.note });
  if (rows.length > 0) blocks.push({ type: 'facts', rows });
  blocks.push({ type: 'button', label: 'Open the deal', url: input.dealUrl });
  return {
    to: asList(input.to),
    subject: oneLine(input.granted ? `Protection extended for ${input.customer}` : `Extension not granted for ${input.customer}`),
    htmlContent: renderEmail({
      preheader: newEnd ? `The new protection end is ${newEnd}.` : 'Protection ends on the original date.',
      heading: input.granted ? 'Extension granted' : 'Extension declined',
      blocks,
      footnote: FOOTNOTES.partnerUser,
    }),
  };
}
