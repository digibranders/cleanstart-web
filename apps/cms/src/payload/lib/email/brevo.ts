import { redactWebhookErrorBody } from '../webhooks/redact-error-body';

const BREVO_ENDPOINT = 'https://api.brevo.com/v3/smtp/email';
const TIMEOUT_MS = 10_000;

export type BrevoRecipient = { email: string; name?: string };
export type BrevoAttachment = { name: string; content: string };

/**
 * Either a code-built HTML email (`subject` + `htmlContent`) OR a Brevo
 * dashboard template (`templateId` + `params`). When a templateId is given the
 * subject + body + (optionally) sender live in the Brevo template, so neither
 * `subject` nor `htmlContent` is required.
 */
export type SendBrevoEmailInput = {
  to: BrevoRecipient[];
  replyTo?: BrevoRecipient;
  attachments?: BrevoAttachment[];
  subject?: string;
  htmlContent?: string;
  templateId?: number;
  params?: Record<string, unknown>;
};

export type BrevoSendResult =
  | { status: 'synced'; messageId?: string }
  | { status: 'failed'; error: string }
  | { status: 'skipped'; reason: string };

/**
 * Sends one transactional email via Brevo's `/v3/smtp/email` API. Reusable
 * across careers (HR notify, with resume attachment) and — later — the partner
 * form. Returns a discriminated result instead of throwing so callers can
 * record delivery status without try/catch around a non-fatal send. No-ops
 * gracefully when BREVO_API_KEY is unset (local dev).
 *
 * Two modes: pass `templateId` (+ `params`) to render a Brevo dashboard
 * template, or `htmlContent` (+ `subject`) for a code-built email. HTML mode
 * requires a configured BREVO_SENDER_EMAIL; template mode falls back to the
 * template's own sender when that env is unset.
 */
export const sendBrevoEmail = async (input: SendBrevoEmailInput): Promise<BrevoSendResult> => {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) {
    return { status: 'skipped', reason: 'env-not-configured' };
  }
  const senderEmail = process.env.BREVO_SENDER_EMAIL;
  const senderName = process.env.BREVO_SENDER_NAME;
  const useTemplate = input.templateId != null;
  // HTML mode needs an explicit sender; template mode can inherit the
  // template's sender, so a missing BREVO_SENDER_EMAIL only blocks HTML mode.
  if (!useTemplate && !senderEmail) {
    return { status: 'skipped', reason: 'env-not-configured' };
  }

  const sender = senderEmail ? { email: senderEmail, ...(senderName ? { name: senderName } : {}) } : undefined;
  const body = {
    ...(sender ? { sender } : {}),
    to: input.to,
    ...(useTemplate
      ? { templateId: input.templateId, ...(input.params ? { params: input.params } : {}) }
      : { subject: input.subject, htmlContent: input.htmlContent }),
    ...(input.replyTo ? { replyTo: input.replyTo } : {}),
    ...(input.attachments && input.attachments.length > 0 ? { attachment: input.attachments } : {}),
  };

  let response: Response;
  try {
    response = await fetch(BREVO_ENDPOINT, {
      method: 'POST',
      headers: { 'api-key': apiKey, 'content-type': 'application/json', accept: 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { status: 'failed', error: /timeout|abort/i.test(message) ? 'timeout' : `network: ${message}` };
  }

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    return { status: 'failed', error: `Brevo ${response.status}: ${redactWebhookErrorBody(text)}` };
  }

  const data = (await response.json().catch(() => null)) as { messageId?: string } | null;
  return { status: 'synced', ...(data?.messageId ? { messageId: data.messageId } : {}) };
};
