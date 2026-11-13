import * as Sentry from '@sentry/nextjs';

export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Importing the environment validates it: a start with a missing or invalid variable stops here and names it.
    const { env } = await import('@/env');
    await import('../sentry.server.config');
    // Same gate as PAYLOAD_AUTO_RUN in the CMS: tests, builds and local runs must not fire jobs by accident.
    if (env.PORTAL_JOBS_ENABLED) {
      const [{ startScheduler }, { JOBS }, { log }] = await Promise.all([
        import('@/server/jobs/schedule'),
        import('@/server/jobs'),
        import('@/server/log'),
      ]);
      startScheduler(JOBS);
      log.info({ jobs: JOBS.map((job) => job.name) }, 'job scheduler started');
    }
  }
  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('../sentry.edge.config');
  }
}

export const onRequestError = Sentry.captureRequestError;
