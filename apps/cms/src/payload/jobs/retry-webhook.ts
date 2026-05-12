import type { TaskConfig } from 'payload';

import {
  MAX_ATTEMPTS,
  RETRY_DELAYS_MS,
  destinationsFromEnv,
  dispatchEvent,
  type WebhookEvent,
  type WebhookEventName,
} from '../lib/webhooks/dispatch';

/**
 * Retries webhook deliveries that failed initial dispatch. Rows are
 * picked from webhooks_dead_letter where:
 *   - resolvedAt IS NULL (not yet succeeded)
 *   - attemptCount < MAX_ATTEMPTS (still retryable)
 *   - nextRetryAt <= now (due for retry)
 *
 * On success: sets resolvedAt = now.
 * On failure: bumps attemptCount and advances nextRetryAt along the
 *   curve (5 min → 15 min → 1 h → 6 h).
 * On MAX_ATTEMPTS reached: leaves resolvedAt null — row stays for
 *   admin review with no further retries scheduled.
 *
 * Runs every 5 minutes via the autoRun cron (same queue as lead-drain).
 * Processes up to 50 rows per run so the task stays quick.
 */
export const retryWebhookTask: TaskConfig<'retryWebhook'> = {
  slug: 'retryWebhook',
  retries: 0,
  handler: async ({ req }) => {
    const now = new Date();

    const due = await req.payload.find({
      collection: 'webhooks_dead_letter',
      where: {
        and: [
          { resolvedAt: { equals: null } },
          { attemptCount: { less_than: MAX_ATTEMPTS } },
          { nextRetryAt: { less_than_equal: now.toISOString() } },
        ],
      },
      limit: 50,
      sort: 'nextRetryAt',
      overrideAccess: true,
    });

    if (due.docs.length === 0) {
      return { output: { retried: 0, resolved: 0, exhausted: 0 } };
    }

    const destinations = destinationsFromEnv();
    let resolved = 0;
    let exhausted = 0;

    for (const row of due.docs) {
      const attemptCount = (row.attemptCount as number) ?? 1;
      const destinationId = row.destinationId as string;
      const destinationKind = row.destinationKind as string;
      const eventName = row.event as WebhookEventName;
      const eventPayload = (row.eventPayload as Record<string, unknown>) ?? {};

      const dest = destinations.find((d) => d.id === destinationId && d.kind === destinationKind);

      if (!dest) {
        // Destination no longer configured — resolve to avoid infinite retries.
        await req.payload.update({
          collection: 'webhooks_dead_letter',
          id: row.id as number,
          data: { resolvedAt: now.toISOString(), lastError: 'destination no longer configured' },
          overrideAccess: true,
        });
        resolved += 1;
        continue;
      }

      const event: WebhookEvent = { event: eventName, data: eventPayload };
      const rowRequestId = row.requestId as string | undefined;
      const results = await dispatchEvent(event, {
        destinations: [dest],
        logger: req.payload.logger,
        ...(rowRequestId ? { requestId: rowRequestId } : {}),
      });

      const result = results[0];
      if (!result || result.ok) {
        await req.payload.update({
          collection: 'webhooks_dead_letter',
          id: row.id as number,
          data: { resolvedAt: now.toISOString() },
          overrideAccess: true,
        });
        resolved += 1;
      } else {
        const newAttemptCount = attemptCount + 1;
        const delayMs = RETRY_DELAYS_MS[newAttemptCount - 1] ?? RETRY_DELAYS_MS[RETRY_DELAYS_MS.length - 1] ?? 6 * 60 * 60 * 1000;
        const nextRetryAt = newAttemptCount >= MAX_ATTEMPTS
          ? null
          : new Date(now.getTime() + delayMs).toISOString();

        await req.payload.update({
          collection: 'webhooks_dead_letter',
          id: row.id as number,
          data: {
            attemptCount: newAttemptCount,
            lastError: result.error ?? `HTTP ${result.status}`,
            ...(nextRetryAt ? { nextRetryAt } : {}),
          },
          overrideAccess: true,
        });

        if (newAttemptCount >= MAX_ATTEMPTS) {
          req.payload.logger.warn(
            { destinationId, eventName, id: row.id },
            'Webhook dead-letter: max attempts reached — no further retries',
          );
          exhausted += 1;
        }
      }
    }

    req.payload.logger.info(
      { processed: due.docs.length, resolved, exhausted },
      'Webhook retry run complete',
    );

    return { output: { retried: due.docs.length, resolved, exhausted } };
  },
};
