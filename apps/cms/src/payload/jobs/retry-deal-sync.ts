import type { TaskConfig } from 'payload';

import { retryDealSync } from '../lib/retention/retry-deal-sync';

const MAX_ATTEMPTS = Number.parseInt(process.env.DEAL_REG_SYNC_MAX_ATTEMPTS ?? '8', 10);

export const retryDealSyncTask: TaskConfig<'retryDealSync'> = {
  slug: 'retryDealSync',
  retries: 0,
  schedule: [{ cron: '*/10 * * * *', queue: 'dealSyncRetry' }],
  handler: async ({ req }) => {
    const result = await retryDealSync(req.payload, {
      pipeline: process.env.HUBSPOT_DEAL_PIPELINE ?? 'default',
      stage: process.env.HUBSPOT_DEAL_STAGE ?? 'appointmentscheduled',
      maxAttempts: Number.isFinite(MAX_ATTEMPTS) ? MAX_ATTEMPTS : 8,
    });
    if (result.retried > 0) {
      req.payload.logger?.info?.(result, 'deal-registration HubSpot sync retry pass');
    }
    return { output: result };
  },
};
