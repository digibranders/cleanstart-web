import { ROUTES } from '@/lib/routes';

/** Request header the proxy sets to the requested path and query, so a Server Component can build `?next=`. */
export const PATH_HEADER = 'x-portal-path';

const ORIGIN = 'https://portal.invalid';

/**
 * The same-site path to return to after sign in, or null. Anything that resolves to another origin
 * (`//evil.com`, `/\evil.com`, `https://evil.com`, `javascript:`), the sign in page itself (a loop) and the
 * API are refused. The result is the parsed path and query, never the raw input.
 */
export function safeNext(value: string | null | undefined): string | null {
  if (!value || value.length > 500 || !value.trimStart().startsWith('/')) return null;
  let url: URL;
  try {
    url = new URL(value, ORIGIN);
  } catch {
    return null;
  }
  if (url.origin !== ORIGIN) return null;
  if (url.pathname === ROUTES.signIn || url.pathname.startsWith('/api/')) return null;
  return `${url.pathname}${url.search}`;
}
