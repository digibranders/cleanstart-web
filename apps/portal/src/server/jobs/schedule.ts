import * as Sentry from '@sentry/nextjs';
import cron from 'node-cron';
import { pool } from '@/db/client';
import { log } from '@/server/log';
import { runLocked } from './lock';

export interface JobSpec {
  /** Also the advisory lock name: runLocked(pool, name, run). One run at a time across processes. */
  name: string;
  /** Cron expression, evaluated in UTC. */
  schedule: string;
  run: () => Promise<void>;
}

/** Registers every job with node-cron. Each tick runs under an advisory lock; a failure goes to Sentry and never stops the schedule. */
export const startScheduler = (jobs: readonly JobSpec[]): void => {
  for (const job of jobs) {
    cron.schedule(
      job.schedule,
      () => {
        runLocked(pool, job.name, job.run).catch((error: unknown) => {
          log.error({ job: job.name, err: error }, 'job failed');
          Sentry.captureException(error, { tags: { job: job.name } });
        });
      },
      { timezone: 'UTC', name: job.name, noOverlap: true },
    );
  }
};
