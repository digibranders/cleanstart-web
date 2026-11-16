import { type EmailBlock, renderEmail } from '../layout';
import type { EmailAddress, EmailMessage } from '../transport';
import { asList, FOOTNOTES, hello, requireSafeLink } from './shared';

export interface PasswordResetInput {
  to: EmailAddress;
  name: string;
  resetUrl: string;
  expiresInMinutes: number;
}

export function buildPasswordReset(input: PasswordResetInput): EmailMessage {
  const resetUrl = requireSafeLink('password-reset', input.resetUrl);
  const blocks: EmailBlock[] = [
    { type: 'paragraph', text: hello(input.name) },
    { type: 'paragraph', text: 'We got a request to reset the password for your Partner Portal login.' },
    { type: 'button', label: 'Set a new password', url: resetUrl },
    {
      type: 'note',
      text: `The link expires in ${input.expiresInMinutes} minutes and works once. If you did not ask for this, ignore this email and your password stays as it is.`,
    },
  ];
  return {
    to: asList(input.to),
    subject: 'Reset your CleanStart Partner Portal password',
    htmlContent: renderEmail({
      preheader: `The link works for ${input.expiresInMinutes} minutes.`,
      heading: 'Reset your password',
      blocks,
      footnote: FOOTNOTES.account,
    }),
  };
}
