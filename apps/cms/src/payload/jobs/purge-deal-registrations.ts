import type { TaskConfig } from 'payload';

import { purgeDealRegistrations } from '../lib/retention/purge-deal-registrations';

const RETENTION_DAYS = Number.parseInt(process.env.DEAL_REG_RETENTION_DAYS ?? '365', 10);

/**
 * Daily deal-registration retention purge — redacts partner/prospect PII on
 * rows older than DEAL_REG_RETENTION_DAYS (default 365). Runs 03:30 UTC; gated
 * by PAYLOAD_AUTO_RUN via payload.config autoRun.
 */
export const purgeDealRegistrationsTask: TaskConfig<'purgeDealRegistrations'> = {
  slug: 'purgeDealRegistrations',
  retries: 0,
  schedule: [{ cron: '30 3 * * *', queue: 'dealRegistrationsPurge' }],
  handler: async ({ req }) => {
    const result = await purgeDealRegistrations(req.payload, {
      retentionDays: Number.isFinite(RETENTION_DAYS) ? RETENTION_DAYS : 365,
    });
    return { output: result };
  },
};
