import type { TaskConfig } from 'payload';

/**
 * Delete analyticsCache rows older than 90 days. Without pruning the
 * single table grows to ~100k rows / year on a healthy cron schedule
 * — fine for Postgres but pointlessly inflates JSONB bloat.
 *
 * Schedule: daily at 07:00 UTC via `analyticsCachePrune` queue, after
 * the daily refresh has finished.
 */

const RETENTION_DAYS = 90;

export const analyticsCachePruneTask: TaskConfig<'analyticsCachePrune'> = {
  slug: 'analyticsCachePrune',
  retries: 0,
  schedule: [{ cron: '0 7 * * *', queue: 'analyticsCachePrune' }],
  handler: async ({ req }) => {
    const cutoff = new Date(Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000).toISOString();
    try {
      const result = await req.payload.delete({
        collection: 'analyticsCache',
        where: { capturedAt: { less_than: cutoff } },
        overrideAccess: true,
      });
      const deleted = Array.isArray(result?.docs) ? result.docs.length : 0;
      req.payload.logger.info({ deleted, cutoff }, 'analyticsCache prune complete');
      return { output: { deleted } };
    } catch (err) {
      req.payload.logger.warn(
        { error: err instanceof Error ? err.message : String(err) },
        'analyticsCache prune failed',
      );
      return { output: { deleted: 0, error: 'prune-failed' } };
    }
  },
};
