import { fmtLong } from '@/lib/dates';
import type { IsoDate } from '@/lib/dto';
import { type EmailBlock, renderEmail } from '../layout';
import type { EmailAddress, EmailMessage } from '../transport';
import { asList, FOOTNOTES, hello, oneLine } from './shared';

/** Colleague invite (audience 'partner') and CleanStart teammate invite (audience 'staff'). Also sent for Add partner and approved access requests. */
export interface TeamInviteInput {
  to: EmailAddress;
  inviteeName: string | null;
  inviterName: string;
  audience: 'partner' | 'staff';
  companyName: string | null;
  roleLabel: string;
  inviteUrl: string;
  expiresOn: IsoDate;
}

export function buildTeamInvite(input: TeamInviteInput): EmailMessage {
  const joinsCompany = input.audience === 'partner' && input.companyName;
  const intro = joinsCompany
    ? `${input.inviterName} invited you to join ${input.companyName} on the CleanStart Partner Portal as ${input.roleLabel}. The portal is where you register deals, follow their approval and open sales material.`
    : `${input.inviterName} invited you to the CleanStart Partner Portal as ${input.roleLabel}. You will use it to work with CleanStart's partners.`;
  const blocks: EmailBlock[] = [
    { type: 'paragraph', text: hello(input.inviteeName) },
    { type: 'paragraph', text: intro },
    { type: 'button', label: 'Accept the invite', url: input.inviteUrl },
    { type: 'note', text: `This invite works once and expires on ${fmtLong(input.expiresOn)}.` },
  ];
  return {
    to: asList(input.to),
    subject: oneLine(`${input.inviterName} invited you to the CleanStart Partner Portal`),
    htmlContent: renderEmail({
      preheader: joinsCompany
        ? oneLine(`Join ${input.companyName} on the Partner Portal as ${input.roleLabel}.`)
        : oneLine(`Set up your login as ${input.roleLabel}.`),
      heading: 'You are invited',
      blocks,
      footnote: FOOTNOTES.invitee,
    }),
  };
}
