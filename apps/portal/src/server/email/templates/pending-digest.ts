import { plural } from '@/lib/dates';
import { type EmailBlock, renderEmail } from '../layout';
import type { EmailAddress, EmailMessage } from '../transport';
import { FOOTNOTES, hello, oneLine } from './shared';

export interface DigestRegistrationRow {
  customer: string;
  partnerName: string;
  productLabel: string;
  regionLabel: string;
  waitingBusinessDays: number;
  /** Past the review target. */
  pastTarget: boolean;
  /** Past twice the review target. */
  overdue: boolean;
}

/** To one staff reviewer, once a day, only when a registration waits (applications have their own digest). Rows arrive in the order they are shown. */
export interface PendingDigestInput {
  to: EmailAddress;
  recipientName: string;
  registrations: DigestRegistrationRow[];
  targetBusinessDays: number;
  approvalsUrl: string;
}

const flag = (row: { pastTarget: boolean; overdue: boolean }): string => (row.overdue ? ', OVERDUE' : row.pastTarget ? ', past the target' : '');

export function buildPendingDigest(input: PendingDigestInput): EmailMessage {
  const overdue = input.registrations.filter((r) => r.overdue).length;
  const total = input.registrations.length;
  const summary = plural(total, 'registration');
  const blocks: EmailBlock[] = [
    { type: 'paragraph', text: hello(input.recipientName) },
    {
      type: 'paragraph',
      text: `${summary} ${total === 1 ? 'is' : 'are'} waiting for review. The target is ${plural(input.targetBusinessDays, 'business day')}.`,
    },
  ];
  if (overdue > 0) {
    blocks.push({
      type: 'note',
      text: `${plural(overdue, 'registration')} ${overdue === 1 ? 'has' : 'have'} waited more than twice the target and ${overdue === 1 ? 'is' : 'are'} listed first.`,
    });
  }
  if (input.registrations.length > 0) {
    blocks.push({ type: 'paragraph', text: 'Registrations' });
    blocks.push({
      type: 'facts',
      rows: input.registrations.map((r) => ({
        label: oneLine(r.customer),
        value: `${oneLine(r.partnerName)}, ${oneLine(r.productLabel)}, ${oneLine(r.regionLabel)}. Waiting ${plural(r.waitingBusinessDays, 'business day')}${flag(r)}`,
      })),
    });
    blocks.push({ type: 'button', label: 'Open the approvals queue', url: input.approvalsUrl });
  }
  return {
    to: [input.to],
    subject: oneLine(overdue > 0 ? `Review digest: ${summary} waiting, ${overdue} overdue` : `Review digest: ${summary} waiting`),
    htmlContent: renderEmail({
      preheader: oneLine(`${summary} waiting for review.`),
      heading: 'Waiting for your review',
      blocks,
      footnote: FOOTNOTES.staff,
    }),
  };
}
