import type { TaskConfig } from 'payload';

import {
  listQueuedSubmissions,
  parkSubmission,
  removeQueuedSubmission,
} from '../lib/lead-fallback-queue';
import { submitLead } from '../lib/lead-handlers';

const MAX_ATTEMPTS = 5;

/**
 * Drains parked submissions back through the LeadHandler chain. The
 * /api/leads/submit endpoint parks anything that hit a DB error or an
 * unhandled exception; this task replays them when Postgres is healthy.
 *
 * Per arch doc §forms, the chain runs every 5 minutes — the
 * autoRun schedule lives in payload.config.ts under `jobs.autoRun`.
 *
 * - Submissions that succeed are removed from the queue.
 * - Submissions that fail again get re-parked with attempts++ until
 *   MAX_ATTEMPTS, then surfaced for manual review (Phase G alert).
 * - One drain run handles up to 100 entries — enough to clear a brief
 *   outage but small enough to keep the task quick under load.
 */
export const drainLeadQueueTask: TaskConfig<'drainLeadQueue'> = {
  slug: 'drainLeadQueue',
  retries: 0,
  handler: async ({ req }) => {
    const queued = await listQueuedSubmissions(100);
    if (queued.length === 0) {
      return { output: { processed: 0, drained: 0, requeued: 0, abandoned: 0 } };
    }

    let drained = 0;
    let requeued = 0;
    let abandoned = 0;

    for (const entry of queued) {
      try {
        const result = await submitLead(req.payload, entry.submission);
        if (result.ok) {
          await removeQueuedSubmission(entry.key);
          drained += 1;
          continue;
        }
        // Primary still failing — bump attempts and re-park, unless we've maxed out.
        await removeQueuedSubmission(entry.key);
        const nextAttempts = entry.attempts + 1;
        if (nextAttempts >= MAX_ATTEMPTS) {
          req.payload.logger.error(
            { key: entry.key, attempts: nextAttempts, reason: entry.reason },
            'Lead queue: abandoning submission after max attempts',
          );
          abandoned += 1;
        } else {
          await parkSubmission(entry.submission, `${entry.reason} (retry ${nextAttempts})`);
          requeued += 1;
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        req.payload.logger.warn(
          { key: entry.key, err: message },
          'Lead queue drain threw on entry — leaving in place for next run',
        );
        // Leave the entry in place; next cron tick retries.
      }
    }

    if (drained > 0 || requeued > 0 || abandoned > 0) {
      req.payload.logger.info(
        { processed: queued.length, drained, requeued, abandoned },
        'Lead queue drain run complete',
      );
    }

    return {
      output: { processed: queued.length, drained, requeued, abandoned },
    };
  },
};
