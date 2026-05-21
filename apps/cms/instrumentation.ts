/**
 * Next.js instrumentation entry. Imports the Sentry server/edge configs
 * exactly once per runtime so initialization is symmetric across cold
 * starts. When SENTRY_DSN is unset the imported modules early-return
 * inside Sentry.init, so this is a no-op in dev.
 *
 * Additionally eagerly initializes Payload in the Node.js runtime when
 * `PAYLOAD_AUTO_RUN=true`. Payload's `jobs.autoRun` registers in-process
 * `node-cron` timers only after `getPayload()` runs; relying on the
 * first HTTP request to trigger init meant cron jobs (lead-queue drain,
 * webhook retry, schedule-publish, etc.) never fired on the droplet.
 * Forcing init at boot guarantees the cron scheduler is live as soon
 * as the server is ready.
 */
export const register = async (): Promise<void> => {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./sentry.server.config');

    if (process.env.PAYLOAD_AUTO_RUN === 'true') {
      try {
        const [{ getPayload }, configPromise] = await Promise.all([
          import('payload'),
          import('./src/payload.config').then((m) => m.default),
        ]);
        await getPayload({ config: configPromise });
      } catch (err) {
        // Log and continue — failing to bootstrap Payload here must not
        // block the Next.js server from starting; HTTP-driven init will
        // still recover, albeit without cron until the first request.
        // eslint-disable-next-line no-console
        console.error('[instrumentation] Payload eager init failed:', err);
      }
    }
  }
  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('./sentry.edge.config');
  }
};
