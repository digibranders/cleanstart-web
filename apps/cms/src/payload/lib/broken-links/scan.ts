import { extractAllLinks } from './extract';

/**
 * Pure scanner. Walks each emittable collection's published docs,
 * extracts URLs via `extractAllLinks`, runs HEAD-checks (with GET
 * fallback on 405/501), and produces a per-doc / per-URL plan the
 * caller persists into the `brokenLinks` collection.
 *
 * The scanner is rate-limited at the URL level so a single broken
 * external host doesn't tank the whole run with retry waterfalls —
 * one request per URL per cycle, 5s timeout, no retry. Subsequent
 * runs catch transient failures.
 */

const SCAN_COLLECTIONS = [
  'blogs',
  'news',
  'guides',
  'knowledgeBase',
  'resources',
  'events',
  'webinars',
  'jobs',
  'pages',
] as const;

const HEAD_TIMEOUT_MS = 5000;

export type LinkStatus = 'ok' | 'broken' | 'redirect' | 'network';

export interface BrokenLinkRecord {
  readonly url: string;
  readonly status: LinkStatus;
  readonly httpStatus: number;
  readonly sourceCollection: string;
  readonly sourceDocId: string;
  readonly sourceDocSlug: string | null;
}

interface DocLite {
  id: string | number;
  slug?: string | null;
  body?: unknown;
  seo?: { canonicalOverride?: string | null } | null;
  applyUrl?: string | null;
  atsUrl?: string | null;
  registrationUrl?: string | null;
  recordingUrl?: string | null;
  slidesUrl?: string | null;
  newsLink?: string | null;
}

export interface ScannerPayload {
  find: (args: {
    collection: string;
    where?: unknown;
    limit?: number;
    page?: number;
    sort?: string;
    depth?: number;
    overrideAccess?: boolean;
    draft?: boolean;
  }) => Promise<{ docs: DocLite[]; hasNextPage?: boolean }>;
}

export interface ScanArgs {
  readonly payload: ScannerPayload;
  /** Override fetch — used by tests. */
  readonly fetcher?: typeof fetch;
  /** Override URL list (skip the find() walk) — used by tests. */
  readonly seedRecords?: readonly { url: string; sourceCollection: string; sourceDocId: string; sourceDocSlug: string | null }[];
}

const checkUrl = async (
  url: string,
  fetcher: typeof fetch,
): Promise<{ status: LinkStatus; httpStatus: number }> => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), HEAD_TIMEOUT_MS);
  const tryFetch = async (method: 'HEAD' | 'GET') =>
    fetcher(url, { method, redirect: 'manual', signal: controller.signal });
  try {
    let res = await tryFetch('HEAD');
    if (res.status === 405 || res.status === 501) {
      res = await tryFetch('GET');
    }
    clearTimeout(timer);
    if (res.status >= 200 && res.status < 300) {
      return { status: 'ok', httpStatus: res.status };
    }
    if (res.status >= 300 && res.status < 400) {
      return { status: 'redirect', httpStatus: res.status };
    }
    return { status: 'broken', httpStatus: res.status };
  } catch {
    clearTimeout(timer);
    return { status: 'network', httpStatus: 0 };
  }
};

/**
 * Walk every routable collection, collect (doc, url) pairs, run
 * checks, and return one record per pair. Caller persists to
 * `brokenLinks` (idempotent upsert by `url + sourceDocId`).
 */
export const scanForBrokenLinks = async (
  args: ScanArgs,
): Promise<BrokenLinkRecord[]> => {
  const fetcher = args.fetcher ?? fetch;
  const records: BrokenLinkRecord[] = [];

  // Build the (url, source) pair list.
  type Pair = {
    url: string;
    sourceCollection: string;
    sourceDocId: string;
    sourceDocSlug: string | null;
  };
  const pairs: Pair[] = [];

  if (args.seedRecords) {
    pairs.push(...args.seedRecords.map((r) => ({ ...r })));
  } else {
    for (const collection of SCAN_COLLECTIONS) {
      let page = 1;
      while (page <= 50) {
        const result = await args.payload.find({
          collection,
          limit: 100,
          page,
          depth: 0,
          overrideAccess: true,
          draft: false,
          where: { _status: { equals: 'published' } },
        });
        for (const doc of result.docs) {
          const urls = extractAllLinks(doc as unknown as Record<string, unknown>);
          for (const url of urls) {
            pairs.push({
              url,
              sourceCollection: collection,
              sourceDocId: String(doc.id),
              sourceDocSlug: typeof doc.slug === 'string' ? doc.slug : null,
            });
          }
        }
        if (!result.hasNextPage) break;
        page += 1;
      }
    }
  }

  // De-dupe by URL: one HEAD per unique URL, fan back out to all
  // pairs that referenced it.
  const uniqueUrls = [...new Set(pairs.map((p) => p.url))];
  const checks = new Map<string, { status: LinkStatus; httpStatus: number }>();
  for (const url of uniqueUrls) {
    checks.set(url, await checkUrl(url, fetcher));
  }

  for (const pair of pairs) {
    const result = checks.get(pair.url);
    if (!result) continue;
    records.push({
      url: pair.url,
      status: result.status,
      httpStatus: result.httpStatus,
      sourceCollection: pair.sourceCollection,
      sourceDocId: pair.sourceDocId,
      sourceDocSlug: pair.sourceDocSlug,
    });
  }

  return records;
};
