import { type EmailBlock, renderEmail } from '../layout';
import type { EmailAddress, EmailMessage } from '../transport';
import { asList, FOOTNOTES, hello, oneLine } from './shared';

export interface ApplicationDeclinedInput {
  to: EmailAddress;
  applicantName: string;
  company: string;
  reason: string;
}

export function buildApplicationDeclined(input: ApplicationDeclinedInput): EmailMessage {
  const blocks: EmailBlock[] = [
    { type: 'paragraph', text: hello(input.applicantName) },
    {
      type: 'paragraph',
      text: `Thank you for applying on behalf of ${input.company}. We are not able to approve the application at this time.`,
    },
    { type: 'facts', rows: [{ label: 'Reason', value: input.reason }] },
    { type: 'paragraph', text: 'You are welcome to apply again if your circumstances change.' },
  ];
  return {
    to: asList(input.to),
    subject: 'Your CleanStart partner application',
    htmlContent: renderEmail({
      preheader: oneLine(`The decision on your application for ${input.company}.`),
      heading: 'Application update',
      blocks,
      footnote: FOOTNOTES.applicant,
    }),
  };
}
