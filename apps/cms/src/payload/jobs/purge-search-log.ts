import type { TaskConfig } from 'payload';

import { purgeSearchLog } from '../lib/retention/purge-search-log';

/**
 * Daily searchLog retention purge — drops rows older than 90 days.
 * `schedule` ties the task to its queue on a 03:00 UTC cron;
 * `payload.config.ts` autoRun drains that queue on the same tick.
 */
export const purgeSearchLogTask: TaskConfig<'purgeSearchLog'> = {
  slug: 'purgeSearchLog',
  retries: 0,
  schedule: [{ cron: '0 3 * * *', queue: 'searchLogPurge' }],
  handler: async ({ req }) => {
    const result = await purgeSearchLog(
      req.payload as unknown as Parameters<typeof purgeSearchLog>[0],
    );
    return { output: result };
  },
};
