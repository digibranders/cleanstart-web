/**
 * Content Security Policy for the portal. Pure, so the same function is used by src/proxy.ts and by its tests.
 *
 * script-src: a per request nonce plus 'strict-dynamic', so only the scripts Next renders (and scripts those load)
 * run. Cloudflare Turnstile is listed for browsers without 'strict-dynamic'. 'unsafe-eval' is development only
 * (React uses eval for debugging information there; Next documents this).
 *
 * style-src: in production the nonce covers the <style> tags Next renders (none are inline today). The screens use inline style="..." attributes, which a
 * nonce cannot cover, so style-src-attr allows attributes only: an injected <style> element is still blocked.
 *
 * connect-src: our own origin, Turnstile, and the origins the browser talks to directly: the document bucket
 * (presigned uploads) and Sentry. Pass them in `connectOrigins`; use originsFromEnv for the real values.
 */
export interface CspInput {
  nonce: string;
  isDev: boolean;
  /** Absolute origins such as "https://abc.r2.cloudflarestorage.com". */
  connectOrigins: readonly string[];
}

const TURNSTILE = 'https://challenges.cloudflare.com';

export function buildCsp({ nonce, isDev, connectOrigins }: CspInput): string {
  const directives: Record<string, readonly string[]> = {
    'default-src': ["'self'"],
    'script-src': ["'self'", `'nonce-${nonce}'`, "'strict-dynamic'", TURNSTILE, ...(isDev ? ["'unsafe-eval'"] : [])],
    // The development server injects inline <style> elements without a nonce (HMR), so development allows inline styles.
    'style-src': isDev ? ["'self'", "'unsafe-inline'"] : ["'self'", `'nonce-${nonce}'`],
    'style-src-attr': ["'unsafe-inline'"],
    // The company logo route redirects to the document bucket, and a redirect target is checked against img-src.
    'img-src': ["'self'", 'data:', 'blob:', ...connectOrigins],
    'font-src': ["'self'"],
    'connect-src': ["'self'", TURNSTILE, ...connectOrigins, ...(isDev ? ['ws://localhost:*'] : [])],
    // The video player and the PDF preview load our stream route, which redirects to the document bucket.
    'media-src': ["'self'", ...connectOrigins],
    'frame-src': [TURNSTILE, "'self'", ...connectOrigins],
    'object-src': ["'none'"],
    'base-uri': ["'self'"],
    'form-action': ["'self'"],
    'frame-ancestors': ["'none'"],
  };
  const parts = Object.entries(directives).map(([name, values]) => `${name} ${values.join(' ')}`);
  if (!isDev) parts.push('upgrade-insecure-requests');
  return parts.join('; ');
}

/** The origin of a URL, or null when it is unset or not a URL. */
const originOf = (value: string | undefined): string | null => {
  if (!value) return null;
  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
};

/** Origins the browser must reach: the R2 endpoint (browser PUT of uploads) and the Sentry ingest host. */
export function originsFromEnv(source: Record<string, string | undefined>): string[] {
  return [originOf(source.R2_ENDPOINT), originOf(source.SENTRY_DSN)].filter((o): o is string => o !== null);
}

/** 16 random bytes, base64. A new one per request. */
export function createNonce(): string {
  return Buffer.from(crypto.getRandomValues(new Uint8Array(16))).toString('base64');
}
