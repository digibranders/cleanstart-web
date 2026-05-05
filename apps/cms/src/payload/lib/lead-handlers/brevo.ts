import type { LeadHandler, LeadSubmission } from './types';

const BREVO_TRANSACTIONAL_ENDPOINT = 'https://api.brevo.com/v3/smtp/email';

type FormDoc = {
  name?: string | null;
  notifyTo?: { email: string }[] | null;
};

const findEmail = (fields: Record<string, unknown>): string | null => {
  for (const value of Object.values(fields)) {
    if (typeof value === 'string' && value.includes('@')) return value;
  }
  return null;
};

const findName = (fields: Record<string, unknown>): string | null => {
  for (const [key, value] of Object.entries(fields)) {
    if (/name/i.test(key) && typeof value === 'string') return value;
  }
  return null;
};

const renderFieldsTable = (fields: Record<string, unknown>): string =>
  Object.entries(fields)
    .map(
      ([k, v]) =>
        `<tr><td style="padding:6px 12px;border:1px solid #e5e7eb;font-weight:600">${k}</td><td style="padding:6px 12px;border:1px solid #e5e7eb">${
          typeof v === 'string' ? v : JSON.stringify(v)
        }</td></tr>`,
    )
    .join('');

/**
 * Brevo handler — sends a transactional new-lead notification to the
 * recipients listed in `forms.notifyTo[]`. Skipped silently when no
 * recipients are configured. Authenticates via BREVO_API_KEY env var
 * and the Brevo-recommended sender pulled from BREVO_FROM_EMAIL.
 *
 * No-op (skipped) when BREVO_API_KEY isn't set so local dev / CI don't
 * blow up. Production needs both env vars.
 *
 * Failure on this handler is non-fatal — the LeadHandler chain records
 * the failure on `leads.syncedTo[]` and the lead row is still captured.
 */
export const brevoHandler: LeadHandler = {
  name: 'brevo',
  kind: 'secondary',
  async run(submission: LeadSubmission, ctx) {
    const apiKey = process.env.BREVO_API_KEY;
    const fromEmail = process.env.BREVO_FROM_EMAIL;
    const fromName = process.env.BREVO_FROM_NAME ?? 'CleanStart';

    if (!apiKey || !fromEmail) {
      return { handler: 'brevo', status: 'skipped', reason: 'env-not-configured' };
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

    const visitorEmail = findEmail(submission.fields);
    const visitorName = findName(submission.fields);
    const formName = form?.name ?? 'a form';
    const subject = `New ${formName} submission${visitorName ? ` from ${visitorName}` : ''}`;

    const html = `
      <p>A new lead has come in via <strong>${formName}</strong>.</p>
      <table style="border-collapse:collapse;font-family:system-ui,sans-serif;font-size:14px">
        ${renderFieldsTable(submission.fields)}
      </table>
      ${submission.source ? `<p style="color:#6b7280">Source page: ${submission.source}</p>` : ''}
    `;

    const response = await fetch(BREVO_TRANSACTIONAL_ENDPOINT, {
      method: 'POST',
      headers: {
        'api-key': apiKey,
        'content-type': 'application/json',
        accept: 'application/json',
      },
      body: JSON.stringify({
        sender: { email: fromEmail, name: fromName },
        to: notifyTo.map((email) => ({ email })),
        replyTo: visitorEmail ? { email: visitorEmail } : undefined,
        subject,
        htmlContent: html,
      }),
    });

    if (!response.ok) {
      const text = await response.text().catch(() => '');
      return {
        handler: 'brevo',
        status: 'failed',
        error: `Brevo ${response.status}: ${text.slice(0, 200)}`,
      };
    }

    const data = (await response.json().catch(() => null)) as { messageId?: string } | null;
    return {
      handler: 'brevo',
      status: 'synced',
      externalId: data?.messageId ?? undefined,
    };
  },
};
