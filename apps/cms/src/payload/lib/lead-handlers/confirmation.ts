import { SITE_SENDER_NAME, sendBrevoEmail } from '../email/brevo';
import {
  buildContactConfirmationEmail,
  buildDemoConfirmationEmail,
  buildNewsletterWelcomeEmail,
} from '../email/lead-emails';
import { extractEmail, extractName } from './extract-fields';
import type { LeadHandler, LeadHandlerResult, LeadSubmission } from './types';

/**
 * Visitor acknowledgement for the forms that post to `/api/leads/submit`.
 *
 * Every one of these forms previously answered a submission with silence: the
 * lead was stored and relayed to the CRM, but the person who filled it in
 * received nothing at all.
 *
 * Keyed by form slug rather than by field shape, so a form only ever gets a
 * confirmation someone deliberately wrote for it. A slug with no entry is
 * skipped, which is why adding a form cannot accidentally start emailing
 * visitors.
 *
 * Gated-resource downloads are not here: the signed link is minted after the
 * handler chain has run, so that email is sent by the endpoint itself.
 */
const BUILDERS = {
  'book-a-demo': buildDemoConfirmationEmail,
  contact: buildContactConfirmationEmail,
  newsletter: buildNewsletterWelcomeEmail,
} as const;

type KnownSlug = keyof typeof BUILDERS;

const isKnownSlug = (slug: string | null | undefined): slug is KnownSlug =>
  typeof slug === 'string' && slug in BUILDERS;

/** First word of the collected name, which is what the greeting wants. */
const firstNameOf = (name: string | null): string | undefined => {
  const first = name?.trim().split(/\s+/u)[0];
  return first && first.length > 0 ? first : undefined;
};

export const confirmationHandler: LeadHandler = {
  name: 'confirmation-email',
  kind: 'secondary',
  async run(submission: LeadSubmission, ctx): Promise<LeadHandlerResult> {
    // A duplicate submission is the same person pressing submit twice; one
    // acknowledgement is enough.
    if (ctx.duplicateOfLeadId != null) {
      return { handler: 'confirmation-email', status: 'skipped', reason: 'duplicate-submission' };
    }

    let slug: string | null = null;
    try {
      const form = (await ctx.payload.findByID({
        collection: 'forms',
        id: submission.formId,
        depth: 0,
        overrideAccess: true,
      })) as { slug?: string | null } | null;
      slug = form?.slug ?? null;
    } catch {
      return { handler: 'confirmation-email', status: 'skipped', reason: 'form-lookup-failed' };
    }

    if (!isKnownSlug(slug)) {
      return { handler: 'confirmation-email', status: 'skipped', reason: `no-template:${slug}` };
    }

    const email = extractEmail(ctx.formFieldDefs, submission.fields);
    if (!email) {
      return { handler: 'confirmation-email', status: 'skipped', reason: 'no-email-field' };
    }

    const { subject, htmlContent } = BUILDERS[slug]({
      firstName: firstNameOf(extractName(ctx.formFieldDefs, submission.fields)),
    });

    const result = await sendBrevoEmail({
      to: [{ email }],
      senderName: SITE_SENDER_NAME,
      subject,
      htmlContent,
    });
    if (result.status === 'failed') {
      return { handler: 'confirmation-email', status: 'failed', error: result.error };
    }
    if (result.status === 'skipped') {
      return { handler: 'confirmation-email', status: 'skipped', reason: result.reason };
    }
    return { handler: 'confirmation-email', status: 'synced' };
  },
};
