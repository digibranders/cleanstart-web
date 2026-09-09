import { buildApplicantConfirmationEmail, buildHrApplicationEmail } from '../careers/hr-email';
import {
  buildDealRegistrationConfirmationEmail,
  buildDealRegistrationNotificationEmail,
} from '../deal-registrations/notification-email';
import { buildPartnerAdminEmail, buildPartnerApplicantEmail } from '../partners/partner-emails';
import {
  buildContactConfirmationEmail,
  buildDemoConfirmationEmail,
  buildNewsletterWelcomeEmail,
  buildResourceDownloadEmail,
} from './lead-emails';

/**
 * Every email the site sends, in one place.
 *
 * This is documentation that cannot go stale: `render-email-templates.ts`
 * writes `apps/cms/emails/` from it, and `registry.test.ts` asserts each entry
 * still renders, so a template that loses its sender or its builder fails the
 * build rather than quietly stopping.
 *
 * All of them are built in code and sent through `sendBrevoEmail` as
 * `subject` + `htmlContent`. None uses a Brevo dashboard template: those
 * interpolate `{{ params.* }}` without escaping, so visitor input reached
 * inboxes as live markup, and having two design sources meant production sent
 * two different-looking sets of email.
 */

export type EmailAudience = 'visitor' | 'internal';

export interface EmailTemplateEntry {
  /** Stable key. Also the filename under apps/cms/emails/. */
  key: string;
  /** Which form triggers it. */
  form: string;
  audience: EmailAudience;
  /** Where the send lives, so the mapping can be followed back to code. */
  sentFrom: string;
  /** Renders the template with representative sample values. */
  sample: () => { subject: string; htmlContent: string };
}

const PARTNER_SAMPLE = {
  firstName: 'Marcus',
  lastName: 'Reed',
  email: 'marcus@northgate.io',
  phone: '+442071838750',
  company: 'Northgate Security',
  website: 'https://northgate.io',
  partnerReason: 'We resell container security into regulated finance across EMEA.',
};

const DEAL_SAMPLE = {
  partnerName: 'Northgate Security',
  partnerRep: {
    firstName: 'Marcus',
    lastName: 'Reed',
    email: 'marcus@northgate.io',
    phone: '+442071838750',
  },
  prospect: {
    firstName: 'Elena',
    lastName: 'Vasquez',
    email: 'elena@meridianbank.com',
    phone: '+14155552671',
  },
  dealDetails: '500-node OpenShift estate, decision expected next quarter.',
};

export const EMAIL_TEMPLATES: readonly EmailTemplateEntry[] = [
  {
    key: 'demo-confirmation',
    form: 'book-a-demo',
    audience: 'visitor',
    sentFrom: 'lead-handlers/confirmation.ts',
    sample: () => buildDemoConfirmationEmail({ firstName: 'Priya' }),
  },
  {
    key: 'contact-confirmation',
    form: 'contact',
    audience: 'visitor',
    sentFrom: 'lead-handlers/confirmation.ts',
    sample: () => buildContactConfirmationEmail({ firstName: 'Priya' }),
  },
  {
    key: 'newsletter-welcome',
    form: 'newsletter',
    audience: 'visitor',
    sentFrom: 'lead-handlers/confirmation.ts',
    sample: () => buildNewsletterWelcomeEmail({ firstName: 'Priya' }),
  },
  {
    key: 'resource-download',
    form: 'resource-capture (gated resources)',
    audience: 'visitor',
    sentFrom: 'endpoints/submit-lead.ts',
    sample: () =>
      buildResourceDownloadEmail({
        firstName: 'Priya',
        resourceTitle: 'The 2026 Container Hardening Playbook',
        downloadUrl: 'https://cms.cleanstart.com/api/resources/example/download?token=sample',
        expiresAt: Date.now() + 24 * 3_600_000,
      }),
  },
  {
    key: 'careers-applicant-confirmation',
    form: 'job application',
    audience: 'visitor',
    sentFrom: 'endpoints/careers-apply.ts',
    sample: () =>
      buildApplicantConfirmationEmail({ firstName: 'Priya', jobTitle: 'Senior Platform Engineer' }),
  },
  {
    key: 'careers-hr-notification',
    form: 'job application',
    audience: 'internal',
    sentFrom: 'endpoints/careers-apply.ts',
    sample: () =>
      buildHrApplicationEmail({
        jobTitle: 'Senior Platform Engineer',
        jobLocation: 'Bengaluru, India',
        firstName: 'Priya',
        lastName: 'Nair',
        email: 'priya.nair@example.com',
        phone: '+919876543210',
        location: 'Bengaluru, India',
        howDidYouHear: 'Referral',
        linkedinUrl: 'https://linkedin.com/in/priyanair',
        coverLetter: 'Six years hardening container images for regulated fintech workloads.',
        coverLetterAttached: true,
      }),
  },
  {
    key: 'partner-confirmation',
    form: 'become-a-partner',
    audience: 'visitor',
    sentFrom: 'endpoints/partner-apply.ts',
    sample: () => buildPartnerApplicantEmail(PARTNER_SAMPLE),
  },
  {
    key: 'partner-notification',
    form: 'become-a-partner',
    audience: 'internal',
    sentFrom: 'endpoints/partner-apply.ts',
    sample: () => buildPartnerAdminEmail(PARTNER_SAMPLE),
  },
  {
    key: 'deal-registration-confirmation',
    form: 'deal-registration',
    audience: 'visitor',
    sentFrom: 'endpoints/deal-registration-apply.ts',
    sample: () => buildDealRegistrationConfirmationEmail(DEAL_SAMPLE),
  },
  {
    key: 'deal-registration-notification',
    form: 'deal-registration',
    audience: 'internal',
    sentFrom: 'endpoints/deal-registration-apply.ts',
    sample: () =>
      buildDealRegistrationNotificationEmail({
        ...DEAL_SAMPLE,
        dealId: '12345',
        portalId: '245478611',
      }),
  },
  {
    key: 'payload-password-reset',
    form: 'CMS admin (Payload)',
    audience: 'internal',
    sentFrom: 'lib/email/payload-adapter.ts',
    sample: () => ({
      subject: 'Reset your password',
      htmlContent:
        'Rendered by Payload, delivered through the Brevo adapter. Not built from the shared layout.',
    }),
  },
];
