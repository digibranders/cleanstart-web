import { type EmailBlock, renderEmail } from '../layout';
import type { EmailAddress, EmailMessage } from '../transport';
import { FOOTNOTES, oneLine } from './shared';

/** To the deal's partner manager (staff) when a partner registers or resubmits. */
export interface DealSubmittedStaffAlertInput {
  to: EmailAddress[];
  partnerName: string;
  customer: string;
  productLabel: string;
  regionLabel: string;
  registeredByName: string;
  resubmitted: boolean;
  approvalsUrl: string;
}

export function buildDealSubmittedStaffAlert(input: DealSubmittedStaffAlertInput): EmailMessage {
  const verb = input.resubmitted ? 'resubmitted' : 'registered';
  const blocks: EmailBlock[] = [
    {
      type: 'paragraph',
      text: `${input.registeredByName} at ${input.partnerName} ${verb} a deal and it is waiting for review.`,
    },
    {
      type: 'facts',
      rows: [
        { label: 'Partner', value: input.partnerName },
        { label: 'Customer', value: input.customer },
        { label: 'Product', value: input.productLabel },
        { label: 'Region', value: input.regionLabel },
      ],
    },
    { type: 'button', label: 'Open the approvals queue', url: input.approvalsUrl },
  ];
  return {
    to: input.to,
    subject: oneLine(`${input.resubmitted ? 'Resubmitted' : 'New registration'}: ${input.customer} from ${input.partnerName}`),
    htmlContent: renderEmail({
      preheader: oneLine(`${input.registeredByName} ${verb} ${input.customer} for ${input.productLabel} in ${input.regionLabel}.`),
      heading: input.resubmitted ? 'Registration resubmitted' : 'New deal registration',
      blocks,
      footnote: FOOTNOTES.staff,
    }),
  };
}
