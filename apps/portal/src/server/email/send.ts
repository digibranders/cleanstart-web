import * as Sentry from '@sentry/nextjs';
import { log } from '@/server/log';
import { MAX_SUBJECT_LENGTH, truncate } from './templates/shared';
import { createEmailTransport, type EmailMessage, type EmailResult, type EmailTransport } from './transport';

let shared: EmailTransport | undefined;

/** One transport per process, created on first send so importing this file reads no environment. */
const sharedTransport = (): EmailTransport => {
  shared ??= createEmailTransport();
  return shared;
};

/**
 * Sends through the process wide transport, or the one passed in (tests). Never throws: a failed send is logged and
 * reported to Sentry with the subject, never the body, and returned to the caller.
 */
export async function sendEmail(raw: EmailMessage, transport: EmailTransport = sharedTransport()): Promise<EmailResult> {
  // Whatever a builder produced, the subject leaves as one short line with no control characters.
  const message = { ...raw, subject: truncate(raw.subject, MAX_SUBJECT_LENGTH) };
  const result = await transport.send(message);
  if (result.status === 'failed') {
    log.error({ subject: message.subject, error: result.error }, 'email failed');
    Sentry.captureException(new Error(`email failed: ${result.error}`), {
      tags: { area: 'email' },
      extra: { subject: message.subject },
    });
  }
  return result;
}
