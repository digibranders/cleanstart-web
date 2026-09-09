import { type EmailBlock, renderEmail } from './layout';

/**
 * Visitor-facing confirmations for the forms that post to `/api/leads/submit`.
 *
 * These are transactional, not marketing, and are sent over Brevo rather than
 * as a HubSpot form follow-up on purpose: a HubSpot follow-up is a marketing
 * send gated on subscription status, so a visitor who declines marketing
 * consent would receive no acknowledgement of a demo request they just made.
 */

export type ConfirmationInput = {
  /** Visitor's first name when the form collected one. */
  firstName?: string | undefined;
};

const greeting = (firstName?: string): string =>
  firstName?.trim() ? `Thanks, ${firstName.trim()}` : 'Thanks for getting in touch';

const signOff: EmailBlock = { kind: 'paragraph', text: 'The CleanStart team', muted: true };

export const buildDemoConfirmationEmail = (
  input: ConfirmationInput,
): { subject: string; htmlContent: string } => ({
  subject: 'Your CleanStart demo request',
  htmlContent: renderEmail({
    preheader: 'We have your demo request. A specialist will reach out to arrange a time.',
    eyebrow: 'Demo request',
    heading: greeting(input.firstName),
    blocks: [
      {
        kind: 'paragraph',
        text: "We've received your demo request. One of our solutions specialists will reach out to arrange a time that suits you.",
      },
      {
        kind: 'paragraph',
        text: 'It helps to know what you would like to see: your current base images, the CVE burden you are carrying, or the audit you are preparing for. Reply to this email with anything you want covered.',
      },
      signOff,
    ],
    footerNote: 'You received this because you requested a demo on cleanstart.com.',
  }),
});

export const buildContactConfirmationEmail = (
  input: ConfirmationInput,
): { subject: string; htmlContent: string } => ({
  subject: "We've received your message",
  htmlContent: renderEmail({
    preheader: 'Your message reached the CleanStart team and someone will get back to you.',
    eyebrow: 'Contact',
    heading: greeting(input.firstName),
    blocks: [
      {
        kind: 'paragraph',
        text: "We've received your message and someone from the team will get back to you soon.",
      },
      { kind: 'paragraph', text: 'If it is urgent, reply to this email and it will reach us directly.' },
      signOff,
    ],
    footerNote: 'You received this because you contacted us through cleanstart.com.',
  }),
});

export const buildNewsletterWelcomeEmail = (
  input: ConfirmationInput,
): { subject: string; htmlContent: string } => ({
  subject: "You're subscribed to CleanStart",
  htmlContent: renderEmail({
    preheader: 'Container security research and release notes, roughly monthly.',
    eyebrow: 'Newsletter',
    heading: input.firstName?.trim() ? `Welcome, ${input.firstName.trim()}` : 'Welcome to CleanStart',
    blocks: [
      {
        kind: 'paragraph',
        text: "You're on the list. We send container-security research, hardened-image release notes and the occasional deep dive, roughly monthly.",
      },
      { kind: 'paragraph', text: 'No noise, and you can unsubscribe from any email we send.' },
      { kind: 'button', label: 'Browse the latest research', url: 'https://www.cleanstart.com/blogs' },
    ],
    footerNote: 'You received this because you subscribed on cleanstart.com.',
  }),
});

export type ResourceDownloadInput = ConfirmationInput & {
  resourceTitle: string;
  /** Absolute, already-signed download URL. */
  downloadUrl: string;
  /** Epoch millis the signed link stops working. */
  expiresAt: number;
};

/**
 * Emails the gated-resource link.
 *
 * The link was previously returned only in the HTTP response, so closing the
 * tab lost the asset with no way to recover it, and it removed the only
 * reason for a visitor to give a real address, which is the point of gating.
 */
export const buildResourceDownloadEmail = (
  input: ResourceDownloadInput,
): { subject: string; htmlContent: string } => {
  const hours = Math.max(1, Math.round((input.expiresAt - Date.now()) / 3_600_000));
  return {
    subject: `Your download: ${input.resourceTitle}`,
    htmlContent: renderEmail({
      preheader: `${input.resourceTitle} is ready to download.`,
      eyebrow: 'Your download',
      heading: greeting(input.firstName),
      blocks: [
        { kind: 'paragraph', text: `Here is your copy of ${input.resourceTitle}.` },
        { kind: 'button', label: 'Download it now', url: input.downloadUrl },
        {
          kind: 'note',
          text: `This link is unique to you and stops working in about ${hours} ${hours === 1 ? 'hour' : 'hours'}. Request the resource again if it expires.`,
        },
        signOff,
      ],
      footerNote: 'You received this because you requested a resource on cleanstart.com.',
    }),
  };
};
