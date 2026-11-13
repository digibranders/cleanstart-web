import { type EmailBlock, renderEmail } from '../layout';
import type { EmailAddress, EmailMessage } from '../transport';
import { FOOTNOTES, oneLine, orNotGiven } from './shared';

/** To the active partner managers (and PARTNERS_NOTIFY_EMAIL when set) for each portal application. */
export interface ApplicationStaffAlertInput {
  to: EmailAddress[];
  reference: string;
  company: string;
  domain: string;
  applicantName: string;
  applicantEmail: string;
  categoryLabel: string | null;
  regionLabel: string | null;
  source: 'portal' | 'website';
  personalEmail: boolean;
  existingDomain: boolean;
  reason: string | null;
  reviewUrl: string;
}

export function buildApplicationStaffAlert(input: ApplicationStaffAlertInput): EmailMessage {
  const blocks: EmailBlock[] = [
    { type: 'paragraph', text: `${input.applicantName} from ${input.company} applied to become a partner.` },
    {
      type: 'facts',
      rows: [
        { label: 'Reference', value: input.reference },
        { label: 'Company', value: input.company },
        { label: 'Domain', value: input.domain },
        { label: 'Applicant', value: `${input.applicantName}, ${input.applicantEmail}` },
        { label: 'Category', value: orNotGiven(input.categoryLabel) },
        { label: 'Region', value: orNotGiven(input.regionLabel) },
        { label: 'Source', value: input.source === 'website' ? 'Website form' : 'Portal form' },
        { label: 'Reason', value: orNotGiven(input.reason) },
      ],
    },
  ];
  if (input.personalEmail) {
    blocks.push({ type: 'note', text: 'The applicant used a personal email address, not a company address.' });
  }
  if (input.existingDomain) {
    blocks.push({ type: 'note', text: 'This domain already belongs to an existing partner.' });
  }
  blocks.push({ type: 'button', label: 'Review the application', url: input.reviewUrl });
  return {
    to: input.to,
    subject: oneLine(`New partner application: ${input.company}`),
    htmlContent: renderEmail({
      preheader: oneLine(`${input.applicantName} applied for ${input.company}. Review it in the portal.`),
      heading: 'New partner application',
      blocks,
      footnote: FOOTNOTES.staff,
    }),
  };
}
