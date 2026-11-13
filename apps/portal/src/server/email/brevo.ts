import type { EmailMessage, EmailResult, EmailTransport } from './transport';

const ENDPOINT = 'https://api.brevo.com/v3/smtp/email';
const TIMEOUT_MS = 10_000;
const MAX_ERROR_LENGTH = 200;

export interface BrevoConfig {
  apiKey: string;
  senderEmail: string;
  /** The From name for a message that does not set its own. The caller passes PORTAL_SENDER_NAME. */
  senderName: string;
  /** For tests. */
  fetch?: typeof fetch;
}

/** Brevo answers errors as { code, message }. Anything else is cut short and flattened to one line. */
async function describeFailure(response: Response): Promise<string> {
  const text = await response.text().catch(() => '');
  try {
    const parsed = JSON.parse(text) as { code?: unknown; message?: unknown };
    if (typeof parsed.message === 'string') {
      const code = typeof parsed.code === 'string' ? `${parsed.code}: ` : '';
      return `Brevo ${response.status}: ${code}${parsed.message}`.slice(0, MAX_ERROR_LENGTH);
    }
  } catch {
    // not JSON, fall through
  }
  return `Brevo ${response.status}: ${text.replace(/\s+/g, ' ').trim()}`.slice(0, MAX_ERROR_LENGTH);
}

export function createBrevoTransport(config: BrevoConfig): EmailTransport {
  const request = config.fetch ?? fetch;
  return {
    async send(message: EmailMessage): Promise<EmailResult> {
      const body = {
        sender: { email: config.senderEmail, name: message.senderName ?? config.senderName },
        to: message.to,
        ...(message.replyTo ? { replyTo: message.replyTo } : {}),
        subject: message.subject,
        htmlContent: message.htmlContent,
      };
      let response: Response;
      try {
        response = await request(ENDPOINT, {
          method: 'POST',
          headers: { 'api-key': config.apiKey, 'content-type': 'application/json', accept: 'application/json' },
          body: JSON.stringify(body),
          signal: AbortSignal.timeout(TIMEOUT_MS),
        });
      } catch (error) {
        const reason = error instanceof Error ? error.message : String(error);
        return { status: 'failed', error: /timeout|abort/i.test(reason) ? 'timeout' : `network: ${reason}`.slice(0, MAX_ERROR_LENGTH) };
      }
      if (!response.ok) return { status: 'failed', error: await describeFailure(response) };
      const data = (await response.json().catch(() => null)) as { messageId?: unknown } | null;
      return { status: 'sent', messageId: typeof data?.messageId === 'string' ? data.messageId : null };
    },
  };
}
