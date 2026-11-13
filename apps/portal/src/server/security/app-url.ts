const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]']);

/**
 * Production must be served over https: the session cookie is only marked Secure on https, and invite and reset
 * links are built from APP_URL. A production build on this machine (a local smoke test) may use http on a loopback host.
 */
export function assertSecureAppUrl(nodeEnv: string, appUrl: string): void {
  if (nodeEnv !== 'production') return;
  const url = new URL(appUrl);
  if (url.protocol === 'https:' || LOCAL_HOSTS.has(url.hostname)) return;
  throw new Error(`APP_URL must be https in production (got ${url.origin}): cookies, invite links and reset links would travel in the clear.`);
}

/** Secure cookies exactly when the site is served over https in production. */
export const usesSecureCookies = (nodeEnv: string, appUrl: string): boolean => nodeEnv === 'production' && appUrl.startsWith('https://');
