import { type EmailBlock, renderEmail } from '../layout';
import type { EmailAddress, EmailMessage } from '../transport';
import { REVIEW_TARGET_TEXT } from '@/lib/application-status';
import { asList, FOOTNOTES, hello, oneLine, requireSafeLink } from './shared';

/** To the applicant right after /apply, and for website entries never (the CMS sends its own). */
export interface ApplicationReceivedInput {
  to: EmailAddress;
  applicantName: string;
  company: string;
  reference: string;
  /** Private link to the status page. Absent for entries without one. */
  statusUrl?: string;
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
  ];
  if (input.statusUrl) {
    blocks.push(
      { type: 'paragraph', text: `${REVIEW_TARGET_TEXT} You can see where your application stands at any time.` },
      { type: 'button', label: 'Check your application status', url: requireSafeLink('application-received', input.statusUrl) },
    );
  }
  blocks.push({ type: 'note', text: 'Quote the reference if you write to us about this application. The status link is private to you.' });
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
