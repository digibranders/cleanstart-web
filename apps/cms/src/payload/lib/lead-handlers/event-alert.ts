import { SITE_SENDER_NAME, sendBrevoEmail } from '../email/brevo';
import { buildEventRegistrationAlertEmail } from '../email/event-emails';
import { eventLeadSource } from '../event-pages/site';
import type { LeadHandler, LeadHandlerContext, LeadHandlerResult, LeadSubmission } from './types';
import type { FormFieldDef } from './validate-fields';

/**
 * Emails the events team when someone registers for an event on
 * events.cleanstart.com.
 *
 * It applies to a lead whose `source` is `event:<slug>` (set by the events
 * site) and goes to the form's own "Notify recipients" list, so who receives it
 * is edited in the CMS, per form. No recipients means no email. The rows come
 * from the form's fields, so an event with its own form gets a matching alert.
 */

const NAME = 'event-registration-alert';
const CMS_URL = (process.env.CMS_PUBLIC_URL?.trim() || 'https://cms.cleanstart.com').replace(/\/$/u, '');

const answer = (def: FormFieldDef, value: unknown): string | undefined => {
  if (value === undefined || value === null || value === '') return undefined;
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  const text = String(value);
  if (def.type === 'select') return def.options?.find((o) => o.value === text)?.label?.trim() || text;
  return text;
};

/** One row per question the form asked, in the form's order. Unanswered ones are dropped later by the layout. */
export const buildAnswerRows = (
  defs: readonly FormFieldDef[],
  fields: Record<string, unknown>,
): [string, string | undefined][] =>
  defs.flatMap((def) =>
    def.name && def.type !== 'consent' ? [[def.label?.trim() || def.name, answer(def, fields[def.name])] as [string, string | undefined]] : [],
  );

const text = (value: unknown): string | undefined =>
  typeof value === 'string' && value.trim() ? value.trim() : undefined;

const registrantName = (defs: readonly FormFieldDef[], fields: Record<string, unknown>): string | undefined =>
  text(fields.full_name) ?? defs.flatMap((d) => (d.type === 'text' && d.name ? [text(fields[d.name])] : [])).find(Boolean);

const istStamp = (now: Date): string =>
  `${now.toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', day: 'numeric', month: 'short', year: 'numeric' })}, ${now
    .toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: 'numeric', minute: '2-digit' })
    .toLowerCase()} IST`;

type FormLookup = { notifyTo?: { email?: string | null }[] | null } | null;
type EventLookup = {
  id: number | string;
  title?: string | null;
  updatedAt?: string | null;
  partners?: { name?: string | null }[] | null;
};

export const eventAlertHandler: LeadHandler = {
  name: NAME,
  kind: 'secondary',
  async run(submission: LeadSubmission, ctx: LeadHandlerContext): Promise<LeadHandlerResult> {
    const source = submission.source ?? '';
    if (!source.startsWith('event:')) return { handler: NAME, status: 'skipped', reason: 'not-an-event' };
    if (ctx.duplicateOfLeadId != null) return { handler: NAME, status: 'skipped', reason: 'duplicate-submission' };
    const slug = source.slice('event:'.length);

    try {
      const form = (await ctx.payload.findByID({
        collection: 'forms',
        id: submission.formId,
        depth: 0,
        overrideAccess: true,
      })) as FormLookup;
      const recipients = (form?.notifyTo ?? []).flatMap((row) => (row.email ? [{ email: row.email }] : []));
      if (recipients.length === 0) return { handler: NAME, status: 'skipped', reason: 'no-recipients' };

      const found = await ctx.payload.find({
        collection: 'eventPages',
        where: { slug: { equals: slug } },
        limit: 1,
        depth: 0,
        overrideAccess: true,
      });
      const event = found.docs[0] as unknown as EventLookup | undefined;
      if (!event?.title) return { handler: NAME, status: 'skipped', reason: `unknown-event:${slug}` };

      const total = (
        await ctx.payload.count({
          collection: 'leads',
          where: { source: { equals: eventLeadSource(slug) } },
          overrideAccess: true,
        })
      ).totalDocs;

      const defs = ctx.formFieldDefs ?? [];
      const affiliation = [text(submission.fields.designation), text(submission.fields.company)].filter(Boolean).join(', ');
      const version = Date.parse(event.updatedAt ?? '') || 0;
      const { subject, htmlContent } = buildEventRegistrationAlertEmail({
        eventTitle: event.title,
        registrant: registrantName(defs, submission.fields),
        affiliation: affiliation || undefined,
        rows: buildAnswerRows(defs, submission.fields),
        submittedAt: istStamp(new Date()),
        total,
        cmsUrl: `${CMS_URL}/admin/collections/eventPages/${event.id}`,
        bannerUrl: `${CMS_URL}/api/eventPages/banner/${encodeURIComponent(slug)}?v=${version}`,
        hostNames: ['CleanStart', ...(event.partners ?? []).flatMap((p) => (p.name ? [p.name] : []))],
      });

      const result = await sendBrevoEmail({ to: recipients, senderName: SITE_SENDER_NAME, subject, htmlContent });
      if (result.status === 'failed') return { handler: NAME, status: 'failed', error: result.error };
      if (result.status === 'skipped') return { handler: NAME, status: 'skipped', reason: result.reason };
      return { handler: NAME, status: 'synced' };
    } catch (error) {
      return { handler: NAME, status: 'failed', error: error instanceof Error ? error.message : String(error) };
    }
  },
};
