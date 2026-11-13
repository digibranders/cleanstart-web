import { fmtLong } from '@/lib/dates';
import type { IsoDate } from '@/lib/dto';
import { type EmailBlock, renderEmail } from '../layout';
import type { EmailAddress, EmailMessage } from '../transport';
import { asList, FOOTNOTES, hello, oneLine } from './shared';

/** To the applicant on approval; carries the invite link that makes them partner admin. */
export interface ApplicationApprovedInput {
  to: EmailAddress;
  applicantName: string;
  company: string;
  inviteUrl: string;
  expiresOn: IsoDate;
  managerName: string | null;
}

export function buildApplicationApproved(input: ApplicationApprovedInput): EmailMessage {
  const blocks: EmailBlock[] = [
    { type: 'paragraph', text: hello(input.applicantName) },
    {
      type: 'paragraph',
      text: `${input.company} is now a CleanStart partner. You are the first partner admin for the account: you invite your team, register deals and open the sales material in the portal.`,
    },
  ];
  if (input.managerName) {
    blocks.push({ type: 'paragraph', text: `Your CleanStart partner manager is ${input.managerName}.` });
  }
  blocks.push(
    { type: 'button', label: 'Set your password', url: input.inviteUrl },
    {
      type: 'note',
      text: `This link works once and expires on ${fmtLong(input.expiresOn)}. If it has expired, ask your partner manager for a new invite.`,
    },
  );
  return {
    to: asList(input.to),
    subject: 'Your CleanStart partner application is approved',
    htmlContent: renderEmail({
      preheader: oneLine(`Set your password to open the Partner Portal for ${input.company}.`),
      heading: 'You are approved',
      blocks,
      footnote: FOOTNOTES.applicant,
    }),
  };
}
