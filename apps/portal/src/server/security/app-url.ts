const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]']);

/** True for an https URL, or an http URL on a loopback host. A string that is not a URL is false. */
export function isHttpsOrLoopback(appUrl: string): boolean {
  if (!URL.canParse(appUrl)) return false;
  const url = new URL(appUrl);
  return url.protocol === 'https:' || LOCAL_HOSTS.has(url.hostname);
}

/**
 * Production must be served over https: the session cookie is only marked Secure on https, and invite and reset
 * links are built from APP_URL. A production build on this machine (a local smoke test) may use http on a loopback host.
 */
export function assertSecureAppUrl(nodeEnv: string, appUrl: string): void {
  if (nodeEnv !== 'production') return;
  if (isHttpsOrLoopback(appUrl)) return;
  const url = new URL(appUrl);
  throw new Error(`APP_URL must be https in production (got ${url.origin}): cookies, invite links and reset links would travel in the clear.`);
}

/** Secure cookies exactly when the site is served over https in production. Parsed, so it agrees with isHttpsOrLoopback. */
export const usesSecureCookies = (nodeEnv: string, appUrl: string): boolean =>
  nodeEnv === 'production' && URL.canParse(appUrl) && new URL(appUrl).protocol === 'https:';
