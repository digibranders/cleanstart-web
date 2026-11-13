import { type EmailBlock, renderEmail } from '../layout';
import type { EmailAddress, EmailMessage } from '../transport';
import { asList, FOOTNOTES, hello, oneLine } from './shared';

/** To the applicant right after /apply, and for website entries never (the CMS sends its own). */
export interface ApplicationReceivedInput {
  to: EmailAddress;
  applicantName: string;
  company: string;
  reference: string;
}

export function buildApplicationReceived(input: ApplicationReceivedInput): EmailMessage {
  const blocks: EmailBlock[] = [
    { type: 'paragraph', text: hello(input.applicantName) },
    {
      type: 'paragraph',
      text: `We have your application for ${input.company} to join the CleanStart partner program. A partner manager will review it and email you at this address with the decision.`,
    },
    {
      type: 'facts',
      rows: [
        { label: 'Reference', value: input.reference },
        { label: 'Company', value: input.company },
      ],
    },
    { type: 'note', text: 'Quote the reference if you write to us about this application.' },
  ];
  return {
    to: asList(input.to),
    subject: 'We received your partner application',
    htmlContent: renderEmail({
      preheader: `Your reference is ${oneLine(input.reference)}. A partner manager will review the application.`,
      heading: 'Application received',
      blocks,
      footnote: FOOTNOTES.applicant,
    }),
  };
}
