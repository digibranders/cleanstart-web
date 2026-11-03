import { SITE_SENDER_NAME, sendBrevoEmail } from '../email/brevo';
import {
  buildScanRequestNotificationEmail,
  type ScanRequestNotificationInput,
} from '../email/lead-emails';
import { extractEmail } from './extract-fields';
import type { LeadHandler, LeadHandlerResult, LeadSubmission } from './types';

/**
 * Internal alert to the marketing inbox for the forms that need one.
 *
 * Keyed by form slug, like the visitor confirmation, so a form only ever
 * triggers an alert someone deliberately wrote for it. HubSpot's own form
 * notification still covers the other forms; this exists for forms where the
 * team wants the mail from the site itself, independent of the CRM relay.
 */
const NOTIFY_TO = process.env.LEAD_NOTIFY_EMAIL?.trim() || 'marketing@cleanstart.com';
const CMS_URL = process.env.CMS_PUBLIC_URL?.trim() || 'https://cms.cleanstart.com';

const text = (value: unknown): string | undefined =>
  typeof value === 'string' && value.trim() ? value.trim() : undefined;

const scanRequestInput = (
  submission: LeadSubmission,
  email: string,
  leadId: number | undefined,
): ScanRequestNotificationInput => ({
  firstName: text(submission.fields.firstname) ?? '',
  lastName: text(submission.fields.lastname) ?? '',
  email,
  company: text(submission.fields.company) ?? 'Unknown company',
  jobTitle: text(submission.fields.jobtitle) ?? 'Unknown title',
  phone: text(submission.fields.phone),
  country: text(submission.fields.country),
  source: submission.source,
  campaign: submission.utm?.campaign,
  leadUrl: leadId != null ? `${CMS_URL}/admin/collections/leads/${leadId}` : undefined,
});

export const notificationHandler: LeadHandler = {
  name: 'notification-email',
  kind: 'secondary',
  async run(submission: LeadSubmission, ctx): Promise<LeadHandlerResult> {
    if (ctx.duplicateOfLeadId != null) {
      return { handler: 'notification-email', status: 'skipped', reason: 'duplicate-submission' };
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
      return { handler: 'notification-email', status: 'skipped', reason: 'form-lookup-failed' };
    }

    if (slug !== 'cleansight-campaign') {
      return { handler: 'notification-email', status: 'skipped', reason: `no-template:${slug}` };
    }

    const email = extractEmail(ctx.formFieldDefs, submission.fields);
    if (!email) {
      return { handler: 'notification-email', status: 'skipped', reason: 'no-email-field' };
    }

    const { subject, htmlContent } = buildScanRequestNotificationEmail(
      scanRequestInput(submission, email, ctx.leadId),
    );
    const result = await sendBrevoEmail({
      to: [{ email: NOTIFY_TO }],
      replyTo: { email },
      senderName: SITE_SENDER_NAME,
      subject,
      htmlContent,
    });
    if (result.status === 'failed') {
      return { handler: 'notification-email', status: 'failed', error: result.error };
    }
    if (result.status === 'skipped') {
      return { handler: 'notification-email', status: 'skipped', reason: result.reason };
    }
    return { handler: 'notification-email', status: 'synced' };
  },
};
