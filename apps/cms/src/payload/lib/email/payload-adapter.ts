import type { EmailAdapter, SendEmailOptions } from 'payload';

import {
  SITE_SENDER_NAME,
  type BrevoRecipient,
  type BrevoSendResult,
  sendBrevoEmail,
} from './brevo';

/**
 * Payload email adapter backed by the Brevo transactional API.
 *
 * Without an adapter Payload logs outgoing mail to stdout instead of sending
 * it, which silently broke admin password resets: the reset link went to the
 * container's console and the editor received nothing. This routes Payload's
 * own mail (password reset, and any future verification or invite) through the
 * same Brevo credentials the public forms already use, so there is no second
 * transport and no second secret to manage.
 *
 * Payload types `SendEmailOptions` as nodemailer's shape, so addresses arrive
 * in any of nodemailer's forms and are normalised here.
 */

type NodemailerAddress = SendEmailOptions['to'];

/** Turns nodemailer's several address shapes into Brevo's `{ email, name }`. */
const toRecipients = (value: NodemailerAddress): BrevoRecipient[] => {
  if (value == null) return [];
  const items = Array.isArray(value) ? value : [value];
  const out: BrevoRecipient[] = [];
  for (const item of items) {
    if (typeof item === 'string') {
      // Accepts both "jane@x.com" and "Jane <jane@x.com>".
      const match = /^\s*(.*?)\s*<([^>]+)>\s*$/u.exec(item);
      if (match?.[2]) {
        const name = match[1]?.replace(/^"|"$/gu, '').trim();
        out.push(name ? { email: match[2].trim(), name } : { email: match[2].trim() });
        continue;
      }
      out.push({ email: item.trim() });
      continue;
    }
    if (item && typeof item === 'object' && 'address' in item && item.address) {
      out.push(item.name ? { email: item.address, name: item.name } : { email: item.address });
    }
  }
  return out;
};

const asString = (value: unknown): string | undefined =>
  typeof value === 'string' && value.trim().length > 0 ? value : undefined;

export const brevoEmailAdapter: EmailAdapter<BrevoSendResult> = ({ payload }) => ({
  name: 'brevo',
  defaultFromAddress: process.env.BREVO_SENDER_EMAIL ?? 'no-reply@cleanstart.com',
  defaultFromName: SITE_SENDER_NAME,
  async sendEmail(message: SendEmailOptions): Promise<BrevoSendResult> {
    const to = toRecipients(message.to);
    if (to.length === 0) {
      return { status: 'skipped', reason: 'no-recipient' };
    }

    // Payload sends `html` for its own templates and `text` for plain bodies;
    // Brevo needs HTML, so a text-only message is wrapped rather than dropped.
    const html = asString(message.html);
    const text = asString(message.text);
    const htmlContent = html ?? (text ? `<pre style="font:inherit">${text}</pre>` : undefined);
    if (!htmlContent) {
      return { status: 'skipped', reason: 'no-body' };
    }

    const from = toRecipients(message.from)[0];
    const replyTo = toRecipients(message.replyTo)[0];

    const result = await sendBrevoEmail({
      to,
      subject: asString(message.subject) ?? '(no subject)',
      htmlContent,
      ...(from?.email ? { senderEmail: from.email } : {}),
      ...(from?.name ? { senderName: from.name } : {}),
      ...(replyTo ? { replyTo } : {}),
    });

    // Payload swallows the return value, so a failure would otherwise vanish —
    // and a lost password-reset mail is exactly the failure that must be loud.
    if (result.status !== 'synced') {
      payload.logger.error(
        { to: to.map((r) => r.email), subject: message.subject, result },
        'Payload email send did not complete',
      );
    }
    return result;
  },
});
