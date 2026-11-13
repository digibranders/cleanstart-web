import { fmtLong } from '@/lib/dates';
import type { IsoTimestamp } from '@/lib/dto';
import { type EmailBlock, renderEmail } from '../layout';
import type { EmailAddress, EmailMessage } from '../transport';
import { asList, FOOTNOTES, hello } from './shared';

export interface PasswordChangedInput {
  to: EmailAddress;
  name: string;
  changedAt: IsoTimestamp;
}

export function buildPasswordChanged(input: PasswordChangedInput): EmailMessage {
  const when = `${fmtLong(input.changedAt.slice(0, 10))}, ${input.changedAt.slice(11, 16)} UTC`;
  const blocks: EmailBlock[] = [
    { type: 'paragraph', text: hello(input.name) },
    { type: 'paragraph', text: `The password for your Partner Portal login was changed on ${when}.` },
    {
      type: 'paragraph',
      text: 'If you made the change, you do not need to do anything. If you did not, use Forgot password on the sign-in page to set a new one, and tell your partner manager.',
    },
  ];
  return {
    to: asList(input.to),
    subject: 'Your CleanStart Partner Portal password was changed',
    htmlContent: renderEmail({
      preheader: 'If this was not you, reset it now.',
      heading: 'Password changed',
      blocks,
      footnote: FOOTNOTES.account,
    }),
  };
}
