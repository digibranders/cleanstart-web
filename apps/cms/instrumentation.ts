/**
 * Next.js instrumentation entry. Imports the Sentry server/edge configs
 * exactly once per runtime so initialization is symmetric across cold
 * starts. When SENTRY_DSN is unset the imported modules early-return
 * inside Sentry.init, so this is a no-op in dev.
 */
export const register = async (): Promise<void> => {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./sentry.server.config');
  }
  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('./sentry.edge.config');
  }
};
