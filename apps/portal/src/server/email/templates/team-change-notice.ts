import { type EmailBlock, renderEmail } from '../layout';
import type { EmailAddress, EmailMessage } from '../transport';
import { asList, FOOTNOTES, hello, oneLine } from './shared';

export interface TeamChangeNoticeInput {
  to: EmailAddress;
  recipientName: string;
  kind: 'joined' | 'removed';
  personName: string;
  companyName: string;
}

export function buildTeamChangeNotice(input: TeamChangeNoticeInput): EmailMessage {
  const joined = input.kind === 'joined';
  const blocks: EmailBlock[] = [
    { type: 'paragraph', text: hello(input.recipientName) },
    {
      type: 'paragraph',
      text: joined
        ? `${input.personName} accepted the invite and now has a Partner Portal login for ${input.companyName}.`
        : `${input.personName} no longer has access to the Partner Portal for ${input.companyName}. Their registrations stay with the company.`,
    },
  ];
  return {
    to: asList(input.to),
    subject: oneLine(
      joined
        ? `${input.personName} joined ${input.companyName} on the Partner Portal`
        : `${input.personName} was removed from ${input.companyName} on the Partner Portal`,
    ),
    htmlContent: renderEmail({
      preheader: oneLine(joined ? `${input.personName} has a login now.` : `${input.personName} cannot sign in any more.`),
      heading: joined ? 'New team member' : 'Team member removed',
      blocks,
      footnote: FOOTNOTES.partnerAdmin,
    }),
  };
}
