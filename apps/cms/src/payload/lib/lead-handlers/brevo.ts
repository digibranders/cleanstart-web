import { redactWebhookErrorBody } from '../webhooks/redact-error-body';
import { extractEmail, extractName } from './extract-fields';
import type { LeadHandler, LeadSubmission } from './types';

const BREVO_TRANSACTIONAL_ENDPOINT = 'https://api.brevo.com/v3/smtp/email';

type FormDoc = {
  name?: string | null;
  notifyTo?: { email: string }[] | null;
};

/**
 * Brevo handler — sends a transactional new-lead notification using a
 * template configured in the Brevo dashboard. Sender, subject, and
 * email body all live in Brevo (the marketing team owns them); this
 * code only ships the recipients + template params.
 *
 * Required env:
 *   BREVO_API_KEY        — account API key
 *   BREVO_TEMPLATE_ID    — id of the lead-notification template
 *
 * Skipped when:
 *   - either env var is missing (dev / unconfigured production)
 *   - the matching form has no `notifyTo[]` recipients
 *   - the submission is a duplicate of an earlier lead within 24h
 *
 * Failure here is non-fatal — the LeadHandler chain records it on
 * leads.syncedTo[] and the lead row is still captured.
 *
 * Template parameter convention (use {{ params.X }} in the Brevo
 * template):
 *   - formName      — the form's `name` field
 *   - visitorName   — first sibling field whose key matches /name/i
 *   - visitorEmail  — first sibling value containing '@'
 *   - sourceUrl     — the page the submission came from
 *   - submittedAt   — ISO timestamp
 *   - fields        — full object of visitor answers (use {{ params.fields.email }} etc.)
 */
export const brevoHandler: LeadHandler = {
  name: 'brevo',
  kind: 'secondary',
  async run(submission: LeadSubmission, ctx) {
    const apiKey = process.env.BREVO_API_KEY;
    const templateIdRaw = process.env.BREVO_TEMPLATE_ID;

    if (!apiKey || !templateIdRaw) {
      return { handler: 'brevo', status: 'skipped', reason: 'env-not-configured' };
    }

    const templateId = Number.parseInt(templateIdRaw, 10);
    if (!Number.isInteger(templateId) || templateId <= 0) {
      return {
        handler: 'brevo',
        status: 'failed',
        error: `Invalid BREVO_TEMPLATE_ID: ${templateIdRaw}`,
      };
    }

    if (ctx.duplicateOfLeadId != null) {
      return { handler: 'brevo', status: 'skipped', reason: 'duplicate-submission' };
    }

    const form = (await ctx.payload.findByID({
      collection: 'forms',
      id: submission.formId,
      depth: 0,
      overrideAccess: true,
    })) as FormDoc | null;

    const notifyTo = (form?.notifyTo ?? []).map((row) => row.email).filter(Boolean);
    if (notifyTo.length === 0) {
      return { handler: 'brevo', status: 'skipped', reason: 'no-recipients' };
    }

    const visitorEmail = extractEmail(ctx.formFieldDefs, submission.fields);
    const visitorName = extractName(ctx.formFieldDefs, submission.fields);

    const body = {
      templateId,
      to: notifyTo.map((email) => ({ email })),
      ...(visitorEmail ? { replyTo: { email: visitorEmail } } : {}),
      params: {
        formName: form?.name ?? null,
        visitorName: visitorName ?? null,
        visitorEmail: visitorEmail ?? null,
        sourceUrl: submission.source ?? null,
        submittedAt: new Date().toISOString(),
        fields: submission.fields,
      },
    };

    let response: Response;
    try {
      response = await fetch(BREVO_TRANSACTIONAL_ENDPOINT, {
        method: 'POST',
        headers: {
          'api-key': apiKey,
          'content-type': 'application/json',
          accept: 'application/json',
        },
        body: JSON.stringify(body),
        // 10s cap — Brevo's API is fast in practice; anything past 10s
        // is a degraded upstream and we'd rather record a failed sync
        // than hold the lead-handler chain open.
        signal: AbortSignal.timeout(10_000),
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return {
        handler: 'brevo',
        status: 'failed',
        error: /timeout|abort/i.test(message) ? 'timeout' : `network: ${message}`,
      };
    }

    if (!response.ok) {
      const text = await response.text().catch(() => '');
      return {
        handler: 'brevo',
        status: 'failed',
        // Redact before storing — raw Brevo bodies may contain template IDs,
        // list names, and other account-identifiable information that should
        // not sit in an editor-readable field.
        error: `Brevo ${response.status}: ${redactWebhookErrorBody(text)}`,
      };
    }

    const data = (await response.json().catch(() => null)) as { messageId?: string } | null;
    return {
      handler: 'brevo',
      status: 'synced',
      ...(data?.messageId ? { externalId: data.messageId } : {}),
    };
  },
};
