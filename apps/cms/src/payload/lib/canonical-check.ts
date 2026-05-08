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
 */

const CHECK_TIMEOUT_MS = 5000;

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
  | { readonly ok: false; readonly kind: 'network'; readonly message: string }
  | { readonly ok: false; readonly kind: 'timeout' };

const isExternalHttpUrl = (raw: string): boolean => {
  try {
    const parsed = new URL(raw);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
};

export interface CheckCanonicalArgs {
  readonly url: string;
  /** Override fetch — used by tests. */
  readonly fetcher?: typeof fetch;
  /** Override timeout — used by tests. */
  readonly timeoutMs?: number;
}

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
  if (!isExternalHttpUrl(url)) {
    return {
      ok: false,
      kind: 'invalid-url',
      message: 'Canonical override must be an http(s) URL.',
    };
  }

  const fetcher = args.fetcher ?? fetch;
  const timeoutMs = args.timeoutMs ?? CHECK_TIMEOUT_MS;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  const tryFetch = async (method: 'HEAD' | 'GET'): Promise<Response> =>
    fetcher(url, {
      method,
      redirect: 'follow',
      signal: controller.signal,
    });

  try {
    let res = await tryFetch('HEAD');
    if (res.status === 405 || res.status === 501) {
      res = await tryFetch('GET');
    }
    clearTimeout(timer);
    return {
      ok: true,
      status: res.status,
      healthy: res.status >= 200 && res.status < 300,
      finalUrl: res.url || url,
      redirected: (res.url || url) !== url,
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
