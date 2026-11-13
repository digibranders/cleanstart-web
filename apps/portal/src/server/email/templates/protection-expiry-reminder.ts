import type { IsoDate } from '@/lib/dto';
import { fmtLong, plural } from '@/lib/dates';
import { type EmailBlock, renderEmail } from '../layout';
import type { EmailAddress, EmailMessage } from '../transport';
import { asList, FOOTNOTES, hello, oneLine } from './shared';

/** `daysLeft` is 14 or 3 (EXPIRY_REMINDER_DAYS). */
export interface ProtectionExpiryReminderInput {
  to: EmailAddress;
  recipientName: string;
  customer: string;
  productLabel: string;
  daysLeft: number;
  protectionEnd: IsoDate;
  dealUrl: string;
}

export function buildProtectionExpiryReminder(input: ProtectionExpiryReminderInput): EmailMessage {
  const end = fmtLong(input.protectionEnd);
  const left = plural(input.daysLeft, 'day');
  const blocks: EmailBlock[] = [
    { type: 'paragraph', text: hello(input.recipientName) },
    {
      type: 'paragraph',
      text: `Protection on the ${input.productLabel} deal for ${input.customer} ends on ${end}, in ${left}.`,
    },
    { type: 'paragraph', text: 'If you need more time, request an extension from the deal page.' },
    { type: 'button', label: 'Open the deal', url: input.dealUrl },
  ];
  return {
    to: asList(input.to),
    subject: oneLine(`${input.customer}: protection ends in ${left}`),
    htmlContent: renderEmail({
      preheader: oneLine(`Protection on the ${input.productLabel} deal ends on ${end}.`),
      heading: 'Protection ending soon',
      blocks,
      footnote: FOOTNOTES.partnerUser,
    }),
  };
}
