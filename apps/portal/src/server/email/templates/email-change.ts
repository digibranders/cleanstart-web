import { type EmailBlock, renderEmail } from '../layout';
import type { EmailAddress, EmailMessage } from '../transport';
import { asList, FOOTNOTES, hello, oneLine, requireSafeLink } from './shared';

/** Sent to the NEW address. The link is the only way the change happens, and it works once. */
export interface EmailChangeConfirmInput {
  to: EmailAddress;
  name: string;
  adminName: string;
  companyName: string;
  confirmUrl: string;
  /** Hours the link works for. */
  validHours: number;
}

export function buildEmailChangeConfirm(input: EmailChangeConfirmInput): EmailMessage {
  const confirmUrl = requireSafeLink('email-change-confirm', input.confirmUrl);
  const blocks: EmailBlock[] = [
    { type: 'paragraph', text: hello(input.name) },
    {
      type: 'paragraph',
      text: `${input.adminName} asked to use this address for your CleanStart Partner Portal login at ${input.companyName}. Until you confirm, you keep signing in with your current address.`,
    },
    { type: 'button', label: 'Confirm this address', url: confirmUrl },
    { type: 'note', text: `This link works once and expires in ${input.validHours} hours. If you did not expect this, ignore the email and nothing changes.` },
  ];
  return {
    to: asList(input.to),
    subject: oneLine('Confirm your new CleanStart Partner Portal email'),
    htmlContent: renderEmail({
      preheader: 'Confirm the address you will sign in with.',
      heading: 'Confirm your new email',
      blocks,
      footnote: FOOTNOTES.account,
    }),
  };
}

/** Sent to the OLD address after the change, so a change nobody wanted does not go unseen. */
export interface EmailChangedNoticeInput {
  to: EmailAddress;
  name: string;
  newEmail: string;
  companyName: string;
}

export function buildEmailChangedNotice(input: EmailChangedNoticeInput): EmailMessage {
  const blocks: EmailBlock[] = [
    { type: 'paragraph', text: hello(input.name) },
    {
      type: 'paragraph',
      text: `The sign-in email for your CleanStart Partner Portal login at ${input.companyName} is now ${input.newEmail}. You were signed out everywhere, so sign in again with the new address.`,
    },
    { type: 'note', text: 'If you did not expect this, tell your partner admin or your CleanStart partner manager.' },
  ];
  return {
    to: asList(input.to),
    subject: oneLine('Your CleanStart Partner Portal email was changed'),
    htmlContent: renderEmail({
      preheader: 'Your login now uses a different address.',
      heading: 'Sign-in email changed',
      blocks,
      footnote: FOOTNOTES.account,
    }),
  };
}
