import { isSafePublicHttpUrl } from './url-safety/ssrf-guard';

/**
 * Pure HEAD-check helper for canonical-override URLs. Editors can set
 * a canonical override pointing at the original publisher (for
 * syndicated content) — if the URL 404s or redirects to spam, search
 * engines drop the rich result. We surface a non-blocking warning at
 * authoring time so the broken state is caught before publish.
 *
 * Same fail-soft contract as the rest of the SEO infrastructure:
 * network errors and timeouts return `{ ok: false, kind: 'network' }`,
 * never throw. The caller decides how to display.
 *
 * SSRF defence:
 *   - Every URL goes through `isSafePublicHttpUrl` (rejects literal
 *     private/loopback/link-local IPs and reserved hostnames).
 *   - The fetch uses `redirect: 'manual'` so a 3xx Location into an
 *     internal target can't bypass the guard — we re-check the
 *     redirect target before following, capped at MAX_REDIRECT_HOPS.
 */

const CHECK_TIMEOUT_MS = 5000;
const MAX_REDIRECT_HOPS = 5;

export type CanonicalCheckResult =
  | {
      readonly ok: true;
      readonly status: number;
      /** True when the response is a 2xx. */
      readonly healthy: boolean;
      /** Final URL after redirects. Differs from input when the chain redirected. */
      readonly finalUrl: string;
      readonly redirected: boolean;
    }
  | { readonly ok: false; readonly kind: 'invalid-url'; readonly message: string }
  | { readonly ok: false; readonly kind: 'unsafe-url'; readonly message: string }
  | { readonly ok: false; readonly kind: 'network'; readonly message: string }
  | { readonly ok: false; readonly kind: 'timeout' };

export interface CheckCanonicalArgs {
  readonly url: string;
  /** Override fetch — used by tests. */
  readonly fetcher?: typeof fetch;
  /** Override timeout — used by tests. */
  readonly timeoutMs?: number;
}

const reasonMessage = (reason: string, value: string): string => {
  switch (reason) {
    case 'invalid-url':
      return `Not a valid URL: ${value}`;
    case 'non-http-protocol':
      return 'Canonical override must be an http(s) URL.';
    case 'literal-private-ipv4':
    case 'literal-private-ipv6':
    case 'reserved-hostname':
      return `Refusing to fetch internal address: ${value}`;
    default:
      return `Refusing to fetch: ${value}`;
  }
};

/**
 * Fire a HEAD request at the URL with a short timeout. Some servers
 * mishandle HEAD; if we get a 405 (Method Not Allowed) we retry with
 * GET — capped at the same timeout — to avoid false negatives.
 */
export const checkCanonicalUrl = async (
  args: CheckCanonicalArgs,
): Promise<CanonicalCheckResult> => {
  const { url } = args;
  if (typeof url !== 'string' || url.trim().length === 0) {
    return { ok: false, kind: 'invalid-url', message: 'URL is empty.' };
  }
  const guard = isSafePublicHttpUrl(url);
  if (!guard.ok) {
    if (guard.reason === 'invalid-url' || guard.reason === 'non-http-protocol') {
      return { ok: false, kind: 'invalid-url', message: reasonMessage(guard.reason, url) };
    }
    return { ok: false, kind: 'unsafe-url', message: reasonMessage(guard.reason, url) };
  }

  const fetcher = args.fetcher ?? fetch;
  const timeoutMs = args.timeoutMs ?? CHECK_TIMEOUT_MS;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  let currentUrl = url;
  let hops = 0;
  let redirected = false;

  const tryFetch = async (target: string, method: 'HEAD' | 'GET'): Promise<Response> =>
    fetcher(target, {
      method,
      redirect: 'manual',
      signal: controller.signal,
    });

  try {
    while (hops <= MAX_REDIRECT_HOPS) {
      let res = await tryFetch(currentUrl, 'HEAD');
      if (res.status === 405 || res.status === 501) {
        res = await tryFetch(currentUrl, 'GET');
      }

      if (res.status >= 300 && res.status < 400) {
        const location = res.headers.get('location');
        if (!location) {
          clearTimeout(timer);
          return {
            ok: true,
            status: res.status,
            healthy: false,
            finalUrl: currentUrl,
            redirected,
          };
        }
        const next = new URL(location, currentUrl).toString();
        const nextGuard = isSafePublicHttpUrl(next);
        if (!nextGuard.ok) {
          clearTimeout(timer);
          return {
            ok: false,
            kind: 'unsafe-url',
            message: `Canonical redirected to an internal address: ${next}`,
          };
        }
        currentUrl = next;
        redirected = true;
        hops += 1;
        continue;
      }

      clearTimeout(timer);
      return {
        ok: true,
        status: res.status,
        healthy: res.status >= 200 && res.status < 300,
        finalUrl: currentUrl,
        redirected,
      };
    }
    clearTimeout(timer);
    return {
      ok: false,
      kind: 'network',
      message: `Too many redirects (>${MAX_REDIRECT_HOPS}).`,
    };
  } catch (err) {
    clearTimeout(timer);
    if (err instanceof Error && err.name === 'AbortError') {
      return { ok: false, kind: 'timeout' };
    }
    return {
      ok: false,
      kind: 'network',
      message: err instanceof Error ? err.message : String(err),
    };
  }
};
