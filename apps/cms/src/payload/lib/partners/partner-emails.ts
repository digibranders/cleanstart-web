import { type EmailBlock, renderEmail } from '../email/layout';

export type PartnerEmailInput = {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | undefined;
  company: string;
  website?: string | undefined;
  partnerReason?: string | undefined;
};

/** Internal admin notification with all submitted details. */
export const buildPartnerAdminEmail = (
  input: PartnerEmailInput,
): { subject: string; htmlContent: string } => {
  const fullName = `${input.firstName} ${input.lastName}`.trim();
  const blocks: EmailBlock[] = [
    { kind: 'paragraph', text: `${fullName} from ${input.company} wants to partner with CleanStart.` },
    {
      kind: 'details',
      rows: [
        ['Name', fullName],
        ['Email', input.email],
        ['Phone', input.phone],
        ['Company', input.company],
        ['Website', input.website],
      ],
    },
    ...(input.partnerReason?.trim()
      ? [{ kind: 'quote' as const, label: 'Why partner', text: input.partnerReason }]
      : []),
  ];

  return {
    subject: `New partner inquiry: ${input.company}, ${fullName}`,
    htmlContent: renderEmail({
      preheader: `${fullName} at ${input.company} submitted a partnership inquiry.`,
      eyebrow: 'Partnerships',
      heading: 'New partner inquiry',
      blocks,
      footerNote: 'Sent automatically from the CleanStart website partner form.',
    }),
  };
};

/** Applicant confirmation: a friendly acknowledgement. */
export const buildPartnerApplicantEmail = (
  input: PartnerEmailInput,
): { subject: string; htmlContent: string } => ({
  subject: 'Thanks for your interest in partnering with CleanStart',
  htmlContent: renderEmail({
    preheader: 'We have your partnership inquiry. Our team will be in touch shortly.',
    eyebrow: 'Partnerships',
    heading: `Thanks, ${input.firstName}`,
    blocks: [
      {
        kind: 'paragraph',
        text: `We've received your partnership inquiry for ${input.company}. Our partnerships team will review it and get back to you shortly.`,
      },
      {
        kind: 'paragraph',
        text: 'If anything changes in the meantime, just reply to this email.',
        muted: true,
      },
    ],
    footerNote: 'You received this because you submitted the partner form on cleanstart.com.',
  }),
});
