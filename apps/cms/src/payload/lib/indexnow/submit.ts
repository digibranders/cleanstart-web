/**
 * IndexNow submitter. Tells participating search engines (Bing,
 * Yandex, Seznam, Naver, plus a growing list) that a URL has been
 * created or updated. Spec: https://www.indexnow.org/documentation
 *
 * Activation requires `INDEXNOW_KEY` in env. Without it, callers
 * skip the call entirely. The key MUST also be served as a static
 * file at `<baseUrl>/<key>.txt` containing exactly the key — that's
 * how participating engines verify ownership of the host. The
 * `keyLocation` field tells them where to look.
 *
 * Failure mode: any non-2xx response or network error is logged and
 * swallowed. IndexNow is a best-effort speed-up; it never blocks a
 * publish.
 */

const DEFAULT_ENDPOINT = 'https://api.indexnow.org/indexnow';

export interface IndexNowSubmission {
  readonly key: string;
  readonly baseUrl: string;
  readonly urls: readonly string[];
  /** Override the endpoint — used by tests. */
  readonly endpoint?: string;
  /** Custom fetch — used by tests. */
  readonly fetcher?: typeof fetch;
}

export type IndexNowResult =
  | { kind: 'submitted'; status: number; urlCount: number }
  | { kind: 'skipped'; reason: 'no-key' | 'no-urls' }
  | { kind: 'failed'; reason: string };

const hostFromBaseUrl = (baseUrl: string): string | null => {
  try {
    return new URL(baseUrl).host;
  } catch {
    return null;
  }
};

export const submitIndexNow = async (
  args: IndexNowSubmission,
): Promise<IndexNowResult> => {
  if (!args.key || args.key.length === 0) {
    return { kind: 'skipped', reason: 'no-key' };
  }
  if (args.urls.length === 0) {
    return { kind: 'skipped', reason: 'no-urls' };
  }

  const host = hostFromBaseUrl(args.baseUrl);
  if (!host) {
    return { kind: 'failed', reason: `Cannot parse host from baseUrl "${args.baseUrl}".` };
  }

  const body = {
    host,
    key: args.key,
    keyLocation: `${args.baseUrl.replace(/\/+$/, '')}/${args.key}.txt`,
    urlList: args.urls,
  };

  const fetcher = args.fetcher ?? fetch;
  const endpoint = args.endpoint ?? DEFAULT_ENDPOINT;

  try {
    const res = await fetcher(endpoint, {
      method: 'POST',
      headers: { 'content-type': 'application/json; charset=utf-8' },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      // Per IndexNow spec: 200 = ok, 202 = accepted, 400 = invalid
      // request, 403 = key not valid for host, 422 = URLs don't belong
      // to host, 429 = throttled. Surface non-2xx as failures so the
      // afterChange hook actually logs them — silently swallowing was
      // the original bug.
      return {
        kind: 'failed',
        reason: `IndexNow ${res.status}`,
      };
    }
    return { kind: 'submitted', status: res.status, urlCount: args.urls.length };
  } catch (err) {
    return {
      kind: 'failed',
      reason: err instanceof Error ? err.message : String(err),
    };
  }
};
