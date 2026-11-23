import { plural } from '@/lib/dates';
import { type EmailBlock, renderEmail } from '../layout';
import type { EmailAddress, EmailMessage } from '../transport';
import { FOOTNOTES, hello, oneLine } from './shared';

export interface ApplicationDigestRow {
  company: string;
  applicantName: string;
  categoryLabel: string | null;
  waitingBusinessDays: number;
}

/** To one partner manager, once a day, only when an application has waited past the review target. Rows arrive in the order they are shown. */
export interface ApplicationDigestInput {
  to: EmailAddress;
  recipientName: string;
  applications: ApplicationDigestRow[];
  targetBusinessDays: number;
  applicationsUrl: string;
}

export function buildApplicationDigest(input: ApplicationDigestInput): EmailMessage {
  const count = input.applications.length;
  const summary = plural(count, 'application');
  const blocks: EmailBlock[] = [
    { type: 'paragraph', text: hello(input.recipientName) },
    {
      type: 'paragraph',
      text: `${summary} ${count === 1 ? 'has' : 'have'} waited more than ${plural(input.targetBusinessDays, 'business day')} for a decision, longest first.`,
    },
    {
      type: 'facts',
      rows: input.applications.map((a) => ({
        label: oneLine(a.company),
        value: `${oneLine(a.applicantName)}${a.categoryLabel ? `, ${oneLine(a.categoryLabel)}` : ''}. Waiting ${plural(a.waitingBusinessDays, 'business day')}`,
      })),
    },
    { type: 'button', label: 'Open the applications', url: input.applicationsUrl },
  ];
  return {
    to: [input.to],
    subject: oneLine(`Application digest: ${summary} waiting`),
    htmlContent: renderEmail({
      preheader: oneLine(`${summary} waiting more than ${plural(input.targetBusinessDays, 'business day')}.`),
      heading: 'Applications waiting for a decision',
      blocks,
      footnote: FOOTNOTES.staff,
    }),
  };
}
