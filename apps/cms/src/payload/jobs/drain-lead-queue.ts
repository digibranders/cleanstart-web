import { randomUUID } from 'node:crypto';

import type { TaskConfig } from 'payload';

import {
  claimNextBatch,
  incrementAttempts,
  quarantineSubmission,
  removeQueuedSubmission,
} from '../lib/lead-fallback-queue';
import { submitLead } from '../lib/lead-handlers';

const MAX_ATTEMPTS = 5;
const LEASE_TTL_MS = 4 * 60 * 1000; // 4 min — shorter than the 5-min cron interval

/**
 * Drains parked submissions back through the LeadHandler chain. The
 * /api/leads/submit endpoint parks anything that hit a DB error or an
 * unhandled exception; this task replays them when Postgres is healthy.
 *
 * Per arch doc §forms, the chain runs every 5 minutes — the
 * autoRun schedule lives in payload.config.ts under `jobs.autoRun`.
 *
 * - Submissions that succeed are removed from the queue.
 * - Submissions that fail again get their `attempts` counter bumped
 *   in-place (preserving across retries) until MAX_ATTEMPTS, then
 *   quarantined under `lead-fallback-queue/abandoned/` for manual review.
 * - Concurrent drain runs claim disjoint batches via lease semantics —
 *   no double-processing under cron lag.
 * - One drain run handles up to 100 entries — enough to clear a brief
 *   outage but small enough to keep the task quick under load.
 */
export const drainLeadQueueTask: TaskConfig<'drainLeadQueue'> = {
  slug: 'drainLeadQueue',
  retries: 0,
  schedule: [{ cron: '*/5 * * * *', queue: 'leadQueueDrain' }],
  handler: async ({ req }) => {
    const workerId = `${process.pid}-${randomUUID().slice(0, 8)}`;
    const claimed = await claimNextBatch(workerId, LEASE_TTL_MS, 100);
    if (claimed.length === 0) {
      return { output: { processed: 0, drained: 0, requeued: 0, abandoned: 0 } };
    }

    let drained = 0;
    let requeued = 0;
    let abandoned = 0;

    for (const entry of claimed) {
      try {
        const result = await submitLead(req.payload, entry.submission);
        if (result.ok) {
          await removeQueuedSubmission(entry.key);
          drained += 1;
          continue;
        }
        // Primary still failing — bump attempts in place, unless we've maxed out.
        const nextAttempts = entry.attempts + 1;
        const failureReason =
          result.primary.status === 'failed' ? result.primary.error : 'capture_failed';
        if (nextAttempts >= MAX_ATTEMPTS) {
          // TODO: emit Sentry breadcrumb 'lead.queue.abandoned' once Sentry is wired in PR-3.
          req.payload.logger.error(
            { key: entry.key, attempts: nextAttempts, reason: failureReason, workerId },
            'Lead queue: quarantining submission after max attempts',
          );
          await quarantineSubmission({
            ...entry,
            attempts: nextAttempts,
            reason: failureReason,
            leaseId: undefined,
            leasedUntil: undefined,
          });
          abandoned += 1;
        } else {
          await incrementAttempts(entry.key, failureReason);
          requeued += 1;
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        req.payload.logger.warn(
          { key: entry.key, err: message, workerId },
          'Lead queue drain threw on entry — leaving lease to expire for next run',
        );
        // Lease will expire naturally (LEASE_TTL_MS) and the next drain picks it up.
      }
    }

    if (drained > 0 || requeued > 0 || abandoned > 0) {
      req.payload.logger.info(
        { processed: claimed.length, drained, requeued, abandoned, workerId },
        'Lead queue drain run complete',
      );
    }

    return {
      output: { processed: claimed.length, drained, requeued, abandoned },
    };
  },
};
