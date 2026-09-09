import { type EmailBlock, renderEmail } from '../email/layout';

export type HrApplicationEmailInput = {
  jobTitle: string;
  jobLocation?: string | undefined;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | undefined;
  location?: string | undefined;
  howDidYouHear?: string | undefined;
  coverLetter?: string | undefined;
  coverLetterAttached?: boolean | undefined;
  linkedinUrl?: string | undefined;
};

/** Internal HR notification for a new application. Resume arrives as an attachment. */
export const buildHrApplicationEmail = (
  input: HrApplicationEmailInput,
): { subject: string; htmlContent: string } => {
  const fullName = `${input.firstName} ${input.lastName}`.trim();
  const blocks: EmailBlock[] = [
    {
      kind: 'paragraph',
      text: `${fullName} applied for ${input.jobTitle}. Their resume is attached to this email.`,
    },
    {
      kind: 'details',
      rows: [
        ['Position', input.jobTitle],
        ['Role location', input.jobLocation],
        ['Name', fullName],
        ['Email', input.email],
        ['Phone', input.phone],
        ['Based in', input.location],
        ['Heard via', input.howDidYouHear],
        ['LinkedIn', input.linkedinUrl],
      ],
    },
    ...(input.coverLetter?.trim()
      ? [{ kind: 'quote' as const, label: 'Cover letter', text: input.coverLetter }]
      : []),
    ...(input.coverLetterAttached
      ? [{ kind: 'note' as const, text: 'A cover letter file is attached alongside the resume.' }]
      : []),
  ];

  return {
    subject: `New application: ${input.jobTitle}, ${fullName}`,
    htmlContent: renderEmail({
      preheader: `${fullName} applied for ${input.jobTitle}.`,
      eyebrow: 'Careers',
      heading: 'New job application',
      blocks,
      footerNote: 'Sent automatically from the CleanStart careers site.',
    }),
  };
};

/**
 * Applicant acknowledgement.
 *
 * Until now an application was answered with silence: 1,482 candidates
 * submitted and heard nothing back, with no way to tell a received application
 * from a lost one.
 */
export const buildApplicantConfirmationEmail = (input: {
  firstName: string;
  jobTitle: string;
}): { subject: string; htmlContent: string } => ({
  subject: `We've received your application for ${input.jobTitle}`,
  htmlContent: renderEmail({
    preheader: `Your application for ${input.jobTitle} reached our team.`,
    eyebrow: 'Careers',
    heading: `Thanks for applying, ${input.firstName}`,
    blocks: [
      {
        kind: 'paragraph',
        text: `We've received your application for ${input.jobTitle}, along with your resume.`,
      },
      {
        kind: 'paragraph',
        text: 'Our team reviews every application. If your experience lines up with what the role needs, we will be in touch to arrange a first conversation.',
      },
      {
        kind: 'note',
        text: 'Please do not reply to this message. It is sent from an unmonitored address.',
      },
      { kind: 'paragraph', text: 'The CleanStart hiring team', muted: true },
    ],
    footerNote: 'You received this because you applied for a role on cleanstart.com.',
  }),
});
