import type { TaskConfig } from 'payload';

import { purgeCareerApplications } from '../lib/retention/purge-career-applications';

const RETENTION_DAYS = Number.parseInt(process.env.CAREERS_RETENTION_DAYS ?? '365', 10);

/**
 * Daily career-application retention purge — hard-deletes resume files and
 * redacts applicant PII on rows older than CAREERS_RETENTION_DAYS (default 365).
 * Runs 03:45 UTC; gated by PAYLOAD_AUTO_RUN via payload.config autoRun.
 */
export const purgeCareerApplicationsTask: TaskConfig<'purgeCareerApplications'> = {
  slug: 'purgeCareerApplications',
  retries: 0,
  schedule: [{ cron: '45 3 * * *', queue: 'careerApplicationsPurge' }],
  handler: async ({ req }) => {
    const result = await purgeCareerApplications(req.payload, {
      retentionDays: Number.isFinite(RETENTION_DAYS) ? RETENTION_DAYS : 365,
    });
    return { output: result };
  },
};
