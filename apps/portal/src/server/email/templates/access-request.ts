import { type EmailBlock, renderEmail } from '../layout';
import type { EmailAddress, EmailMessage } from '../transport';
import { FOOTNOTES, oneLine } from './shared';

/** To the partner admins when someone asks for access from the sign-in page. */
export interface AccessRequestInput {
  to: EmailAddress[];
  requesterName: string;
  requesterEmail: string;
  note: string | null;
  companyName: string;
  reviewUrl: string;
}

export function buildAccessRequest(input: AccessRequestInput): EmailMessage {
  const blocks: EmailBlock[] = [
    {
      type: 'paragraph',
      text: `${input.requesterName} (${input.requesterEmail}) asked for a login to the CleanStart Partner Portal for ${input.companyName}.`,
    },
  ];
  if (input.note && input.note.trim() !== '') blocks.push({ type: 'facts', rows: [{ label: 'Note', value: input.note }] });
  blocks.push(
    { type: 'paragraph', text: 'Approve the request only if you know this person.' },
    { type: 'button', label: 'Review the request', url: input.reviewUrl },
  );
  return {
    to: input.to,
    subject: oneLine(`${input.requesterName} asked for access to the CleanStart Partner Portal`),
    htmlContent: renderEmail({
      preheader: oneLine(`Approve or decline the request for ${input.companyName}.`),
      heading: 'Access request',
      blocks,
      footnote: FOOTNOTES.partnerAdmin,
    }),
  };
}
