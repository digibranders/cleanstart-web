import { type EmailBlock, renderEmail } from '../layout';
import type { EmailAddress, EmailMessage } from '../transport';
import { asList, FOOTNOTES, hello, oneLine, requireSafeLink, truncate } from './shared';

/** To the applicant when a reviewer needs more before deciding. The link opens a page with one text box. */
export interface ApplicationInfoRequestInput {
  to: EmailAddress;
  applicantName: string;
  company: string;
  reference: string;
  /** The reviewer's question, typed for the applicant. */
  question: string;
  replyUrl: string;
  /** Days the link works for. */
  validDays: number;
}

export function buildApplicationInfoRequest(input: ApplicationInfoRequestInput): EmailMessage {
  const replyUrl = requireSafeLink('application-info-request', input.replyUrl);
  const blocks: EmailBlock[] = [
    { type: 'paragraph', text: hello(input.applicantName) },
    {
      type: 'paragraph',
      text: `Before we decide on the application for ${input.company}, the partner team needs a little more from you.`,
    },
    { type: 'facts', rows: [{ label: 'Question', value: input.question }] },
    { type: 'button', label: 'Answer the question', url: replyUrl },
    { type: 'note', text: `The link works for ${input.validDays} days and once you have answered. Reference ${oneLine(input.reference)}.` },
  ];
  return {
    to: asList(input.to),
    subject: oneLine('A question about your CleanStart partner application'),
    htmlContent: renderEmail({
      preheader: truncate(`The partner team asked: ${input.question}`, 110),
      heading: 'We need a little more information',
      blocks,
      footnote: FOOTNOTES.applicant,
    }),
  };
}

/** To the applicant five days after approval when the invite is still unused. The link is a fresh one. */
export interface ApplicationInviteReminderInput {
  to: EmailAddress;
  applicantName: string;
  company: string;
  inviteUrl: string;
  /** yyyy-mm-dd the new link works until. */
  expiresOn: string;
}

export function buildApplicationInviteReminder(input: ApplicationInviteReminderInput): EmailMessage {
  const inviteUrl = requireSafeLink('application-invite-reminder', input.inviteUrl);
  const blocks: EmailBlock[] = [
    { type: 'paragraph', text: hello(input.applicantName) },
    {
      type: 'paragraph',
      text: `${input.company} was approved for the CleanStart partner program, but the invite to set up your login has not been used yet. Here is a fresh link.`,
    },
    { type: 'button', label: 'Set up your account', url: inviteUrl },
    { type: 'note', text: `This link replaces the earlier one and works until ${input.expiresOn}. If you no longer want to join, ignore this email.` },
  ];
  return {
    to: asList(input.to),
    subject: oneLine('Your CleanStart partner invite is waiting'),
    htmlContent: renderEmail({
      preheader: oneLine(`Set up the login for ${input.company}.`),
      heading: 'Your invite is waiting',
      blocks,
      footnote: FOOTNOTES.applicant,
    }),
  };
}

/** To whoever sent an invite that its recipient found expired, used or withdrawn, and asked to have again. */
export interface InviteAgainRequestInput {
  to: EmailAddress[];
  inviteeEmail: string;
  roleLabel: string;
  /** Company name, or null for a CleanStart staff invite. */
  companyName: string | null;
  reviewUrl: string;
}

export function buildInviteAgainRequest(input: InviteAgainRequestInput): EmailMessage {
  const where = input.companyName ? ` at ${input.companyName}` : '';
  const blocks: EmailBlock[] = [
    {
      type: 'paragraph',
      text: `${input.inviteeEmail} opened an invite to the CleanStart Partner Portal${where} that no longer works and asked for a new one.`,
    },
    { type: 'facts', rows: [{ label: 'Role', value: input.roleLabel }] },
    { type: 'paragraph', text: 'Send a new invite from the Team page if you know this person.' },
    { type: 'button', label: 'Open the Team page', url: input.reviewUrl },
  ];
  return {
    to: input.to,
    subject: oneLine(`${input.inviteeEmail} asked for a new portal invite`),
    htmlContent: renderEmail({
      preheader: oneLine(`An invite${where} needs sending again.`),
      heading: 'A new invite was requested',
      blocks,
      footnote: FOOTNOTES.partnerUser,
    }),
  };
}

/** To the person who used "Request access" on the sign-in page. Sent for every valid request, so it says nothing about whether a company matched. */
export interface AccessRequestCopyInput {
  to: EmailAddress;
  requesterName: string;
  note: string | null;
}

export function buildAccessRequestCopy(input: AccessRequestCopyInput): EmailMessage {
  const blocks: EmailBlock[] = [
    { type: 'paragraph', text: hello(input.requesterName) },
    {
      type: 'paragraph',
      text: 'We received your request for access to the CleanStart Partner Portal. If your company is a CleanStart partner, its partner admin has been told and can send you an invite.',
    },
  ];
  if (input.note && input.note.trim() !== '') blocks.push({ type: 'facts', rows: [{ label: 'Your note', value: input.note }] });
  blocks.push({ type: 'note', text: 'Nothing else is needed from you. If you do not hear back, ask your partner admin directly.' });
  return {
    to: asList(input.to),
    subject: oneLine('We received your CleanStart Partner Portal access request'),
    htmlContent: renderEmail({
      preheader: 'Your partner admin has been told, if your company is a partner.',
      heading: 'Access request received',
      blocks,
      footnote: FOOTNOTES.account,
    }),
  };
}
