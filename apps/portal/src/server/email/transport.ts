import { env } from '@/env';
import { log } from '@/server/log';
import { createBrevoTransport } from './brevo';

export interface EmailAddress {
  email: string;
  name?: string;
}

export interface EmailMessage {
  to: EmailAddress[];
  replyTo?: EmailAddress;
  subject: string;
  htmlContent: string;
  /** Defaults to PORTAL_SENDER_NAME. Pinned in code, never from env (CLAUDE.md, Email). */
  senderName?: string;
}

export type EmailResult =
  | { status: 'sent'; messageId: string | null }
  | { status: 'failed'; error: string }
  | { status: 'skipped'; reason: string };

export interface EmailTransport {
  /** Never throws. A transport failure is returned as { status: 'failed' }. */
  send(message: EmailMessage): Promise<EmailResult>;
}

/**
 * The From name of every portal email. It lives here and not in an environment variable on purpose: the CMS had
 * BREVO_SENDER_NAME rendered onto the droplet from a GitHub variable on every deploy, and it signed demo
 * confirmations "CleanStart Careers" (CLAUDE.md, Email).
 */
export const PORTAL_SENDER_NAME = 'CleanStart Partners';

const HREF = /href="(https?:\/\/[^"]+)"/g;

const linksIn = (html: string): string[] =>
  [...html.matchAll(HREF)].map((match) => (match[1] ?? '').replaceAll('&amp;', '&')).filter((link) => link !== '');

/**
 * What development uses when Brevo is not configured. It logs the subject and, outside production, the links in the
 * message, so an invite or a reset link can be followed without sending anything. It never logs the body.
 */
export function createLogTransport(): EmailTransport {
  return {
    async send(message) {
      log.info(
        {
          subject: message.subject,
          recipients: message.to.length,
          ...(process.env.NODE_ENV === 'production' ? {} : { links: linksIn(message.htmlContent) }),
        },
        'email skipped: Brevo is not configured',
      );
      return { status: 'skipped', reason: 'brevo-not-configured' };
    },
  };
}

export interface EmailTransportConfig {
  apiKey: string | undefined;
  senderEmail: string | undefined;
}

/** Brevo (/v3/smtp/email) when BREVO_API_KEY and BREVO_SENDER_EMAIL are set; otherwise the log transport. */
export function createEmailTransport(
  config: EmailTransportConfig = { apiKey: env.BREVO_API_KEY, senderEmail: env.BREVO_SENDER_EMAIL },
): EmailTransport {
  if (!config.apiKey || !config.senderEmail) return createLogTransport();
  return createBrevoTransport({ apiKey: config.apiKey, senderEmail: config.senderEmail, senderName: PORTAL_SENDER_NAME });
}
