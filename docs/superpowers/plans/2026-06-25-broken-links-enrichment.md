# Broken Links enrichment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enrich the `brokenLinks` admin surface with anchor text, a clickable source-page reference, and a "where it lives" location; follow redirects and classify by the final landing page so healthy redirects stop showing as defects.

**Architecture:** The pure scanner (`lib/broken-links/`) gains anchor-text + location extraction and manual, SSRF-checked redirect-following that returns the final URL. The `checkBrokenLinks` cron persists four new text columns. The `BrokenLinks` collection adds those fields plus read-only admin components that render the broken URL and source page as links.

**Tech Stack:** Payload 3, Next.js 16, React 19, Vitest, `@payloadcms/db-postgres` migrations.

**Branch:** Work on `development` (CMS scope — allowed per branching policy). Do NOT `git add -A`; stage exact paths.

---

## File map

- `apps/cms/src/payload/lib/broken-links/extract.ts` — anchor text + location capture (modify)
- `apps/cms/src/payload/lib/broken-links/extract.test.ts` — tests (modify)
- `apps/cms/src/payload/lib/broken-links/scan.ts` — redirect-following + new record fields (modify)
- `apps/cms/src/payload/lib/broken-links/scan.test.ts` — tests (modify)
- `apps/cms/src/payload/jobs/check-broken-links.ts` — persist new fields (modify)
- `apps/cms/src/payload/jobs/check-broken-links.test.ts` — tests (modify)
- `apps/cms/src/payload/collections/BrokenLinks.ts` — new fields + components (modify)
- `apps/cms/src/payload/collections/BrokenLinks.test.ts` — skip ui fields in readonly check (modify)
- `apps/cms/src/payload/admin/components/SourcePageCell.tsx` — list cell (create)
- `apps/cms/src/payload/admin/components/BrokenLinkUrlField.tsx` — detail url field (create)
- `apps/cms/src/payload/admin/components/SourcePageLinkField.tsx` — detail source links (create)
- `apps/cms/src/payload/admin/components/BrokenLinkStatusField.tsx` — detail status/age (create)
- `apps/cms/src/migrations/20260625_120000_add_broken_links_details.ts` — migration (create)
- `apps/cms/src/migrations/index.ts` — register migration (modify)
- `apps/cms/src/payload-types.ts` — regenerated (generated)
- `apps/cms/src/app/(payload)/admin/importMap.js` — regenerated (generated)

---

## Task 1: Anchor text + location extraction (`extract.ts`)

**Files:**
- Modify: `apps/cms/src/payload/lib/broken-links/extract.ts`
- Test: `apps/cms/src/payload/lib/broken-links/extract.test.ts`

- [ ] **Step 1: Write failing tests**

Replace the body of `extract.test.ts` describe blocks with tests for the new object shape. Add these tests (keep the existing "skips internal", "empty input" cases but update expectations to the new return shape):

```ts
import { describe, expect, it } from 'vitest';

import { extractAllLinks, extractLinksFromLexical } from './extract';

const wrap = (children: unknown[]) => ({ root: { children } });

describe('extractLinksFromLexical', () => {
  it('captures the visible anchor text of a link', () => {
    const body = wrap([
      {
        type: 'link',
        fields: { url: 'https://example.com/a' },
        children: [{ type: 'text', text: 'click ' }, { type: 'text', text: 'here' }],
      },
    ]);
    expect(extractLinksFromLexical(body)).toEqual([
      { url: 'https://example.com/a', anchorText: 'click here' },
    ]);
  });

  it('returns null anchor text when the link has no text children', () => {
    const body = wrap([{ type: 'autolink', fields: { url: 'https://example.com/b' } }]);
    expect(extractLinksFromLexical(body)).toEqual([
      { url: 'https://example.com/b', anchorText: null },
    ]);
  });

  it('keeps the first anchor text when a url repeats', () => {
    const body = wrap([
      { type: 'link', fields: { url: 'https://dup.example' }, children: [{ type: 'text', text: 'first' }] },
      { type: 'link', fields: { url: 'https://dup.example' }, children: [{ type: 'text', text: 'second' }] },
    ]);
    expect(extractLinksFromLexical(body)).toEqual([
      { url: 'https://dup.example', anchorText: 'first' },
    ]);
  });

  it('skips internal-doc relationships', () => {
    const body = wrap([
      { type: 'link', fields: { linkType: 'internal', url: '/foo' } },
      { type: 'link', fields: { doc: { value: 1 }, url: '/bar' } },
      { type: 'link', fields: { url: 'https://external.example' }, children: [{ type: 'text', text: 'x' }] },
    ]);
    expect(extractLinksFromLexical(body)).toEqual([
      { url: 'https://external.example', anchorText: 'x' },
    ]);
  });
});

describe('extractAllLinks', () => {
  it('labels body links as Body and typed fields by name', () => {
    const doc = {
      body: wrap([
        { type: 'link', fields: { url: 'https://body.example' }, children: [{ type: 'text', text: 'read' }] },
      ]),
      applyUrl: 'https://apply.example',
    };
    expect(extractAllLinks(doc)).toEqual(
      expect.arrayContaining([
        { url: 'https://body.example', anchorText: 'read', location: 'Body' },
        { url: 'https://apply.example', anchorText: null, location: 'Apply URL' },
      ]),
    );
  });

  it('drops site-relative + unsafe URLs', () => {
    const doc = { applyUrl: '/relative', registrationUrl: 'http://169.254.169.254/' };
    expect(extractAllLinks(doc)).toEqual([]);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm --filter @cleanstart/cms exec vitest run src/payload/lib/broken-links/extract.test.ts`
Expected: FAIL (current `extractLinksFromLexical` returns `string[]`).

- [ ] **Step 3: Rewrite `extract.ts`**

Replace the file with:

```ts
import { isSafePublicHttpUrl } from '../url-safety/ssrf-guard';

/**
 * Walk a Lexical body + adjacent doc fields and return every external
 * URL the editor referenced, with the visible anchor text and a
 * human-readable location. Used by the nightly broken-link scanner.
 *
 * Internal-doc relationships (`linkType === 'internal'`, `doc != null`)
 * are skipped — Payload's slug-change hook keeps those resolvable.
 *
 * SSRF defence: every emitted URL passes `isSafePublicHttpUrl`.
 */

interface LinkAttrs {
  type?: string;
  url?: string;
  linkType?: string;
  doc?: unknown;
}

interface LexicalNode {
  type?: string;
  fields?: LinkAttrs;
  url?: string;
  text?: string;
  children?: LexicalNode[];
}

export interface LexicalLink {
  url: string;
  anchorText: string | null;
}

export interface ExtractedLink {
  url: string;
  anchorText: string | null;
  location: string;
}

const isLinkNode = (node: LexicalNode): boolean =>
  node.type === 'link' || node.type === 'autolink';

const collectText = (node: LexicalNode): string => {
  if (typeof node.text === 'string') return node.text;
  if (node.children) return node.children.map(collectText).join('');
  return '';
};

export const extractLinksFromLexical = (body: unknown): LexicalLink[] => {
  if (!body || typeof body !== 'object') return [];
  const root = (body as { root?: LexicalNode }).root;
  if (!root || !root.children) return [];
  const byUrl = new Map<string, LexicalLink>();
  const walk = (node: LexicalNode): void => {
    if (isLinkNode(node)) {
      const linkType = node.fields?.linkType;
      const doc = node.fields?.doc;
      const url = node.fields?.url ?? node.url ?? '';
      if (linkType !== 'internal' && doc == null && url.length > 0 && !byUrl.has(url)) {
        const text = collectText(node).trim();
        byUrl.set(url, { url, anchorText: text.length > 0 ? text : null });
      }
    }
    if (node.children) {
      for (const child of node.children) walk(child);
    }
  };
  for (const child of root.children) walk(child);
  return [...byUrl.values()];
};

const isFetchSafeHttpUrl = (raw: string): boolean => isSafePublicHttpUrl(raw).ok;

const SCALAR_URL_FIELDS: ReadonlyArray<readonly [key: string, label: string]> = [
  ['applyUrl', 'Apply URL'],
  ['atsUrl', 'ATS URL'],
  ['registrationUrl', 'Registration URL'],
  ['recordingUrl', 'Recording URL'],
  ['slidesUrl', 'Slides URL'],
  ['newsLink', 'News link'],
];

/**
 * Top-level extractor — body rich-text links (location "Body") plus the
 * common typed URL fields and the nested SEO canonical override (located
 * by field label). Returns absolute http(s) URLs that pass the SSRF
 * guard; first occurrence of a URL wins (body before typed fields).
 */
export const extractAllLinks = (doc: Record<string, unknown>): ExtractedLink[] => {
  const byUrl = new Map<string, ExtractedLink>();
  const add = (url: string, anchorText: string | null, location: string): void => {
    if (isFetchSafeHttpUrl(url) && !byUrl.has(url)) {
      byUrl.set(url, { url, anchorText, location });
    }
  };

  for (const link of extractLinksFromLexical(doc.body)) {
    add(link.url, link.anchorText, 'Body');
  }

  for (const [key, label] of SCALAR_URL_FIELDS) {
    const value = doc[key];
    if (typeof value === 'string') add(value, null, label);
  }

  const seo = doc.seo as { canonicalOverride?: string } | undefined;
  if (seo && typeof seo.canonicalOverride === 'string') {
    add(seo.canonicalOverride, null, 'Canonical override');
  }

  return [...byUrl.values()];
};
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm --filter @cleanstart/cms exec vitest run src/payload/lib/broken-links/extract.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/cms/src/payload/lib/broken-links/extract.ts apps/cms/src/payload/lib/broken-links/extract.test.ts
git commit -m "feat(broken-links): capture anchor text + location in extractor"
```

---

## Task 2: Redirect-following + new record fields (`scan.ts`)

**Files:**
- Modify: `apps/cms/src/payload/lib/broken-links/scan.ts`
- Test: `apps/cms/src/payload/lib/broken-links/scan.test.ts`

- [ ] **Step 1: Write failing tests**

Update the `fakeResponse` + `seedRecord` helpers and replace the `301 as redirect` test with redirect-following tests. Full new helper + added tests:

```ts
const fakeResponse = (init: { status?: number; location?: string } = {}): Response =>
  new Response(null, {
    status: init.status ?? 200,
    headers: init.location ? { location: init.location } : undefined,
  });

const seedRecord = (
  overrides: Partial<{
    url: string;
    sourceCollection: string;
    sourceDocId: string;
    sourceDocSlug: string | null;
    sourceDocTitle: string | null;
    anchorText: string | null;
    location: string | null;
  }> = {},
) => ({
  url: 'https://example.com/a',
  sourceCollection: 'blogs',
  sourceDocId: '1',
  sourceDocSlug: 'a',
  sourceDocTitle: 'A post',
  anchorText: 'see here',
  location: 'Body',
  ...overrides,
});
```

```ts
it('follows a redirect to a healthy page and reports ok with finalUrl', async () => {
  const fetcher = vi
    .fn()
    .mockResolvedValueOnce(fakeResponse({ status: 301, location: 'https://example.com/final' }))
    .mockResolvedValueOnce(fakeResponse({ status: 200 }));
  const records = await scanForBrokenLinks({
    payload: { find: vi.fn() },
    fetcher: fetcher as unknown as typeof fetch,
    seedRecords: [seedRecord()],
  });
  expect(records[0]).toMatchObject({ status: 'ok', httpStatus: 200, finalUrl: 'https://example.com/final' });
});

it('reports broken when a redirect lands on a 404, with the final status', async () => {
  const fetcher = vi
    .fn()
    .mockResolvedValueOnce(fakeResponse({ status: 302, location: 'https://example.com/gone' }))
    .mockResolvedValueOnce(fakeResponse({ status: 404 }));
  const records = await scanForBrokenLinks({
    payload: { find: vi.fn() },
    fetcher: fetcher as unknown as typeof fetch,
    seedRecords: [seedRecord()],
  });
  expect(records[0]).toMatchObject({ status: 'broken', httpStatus: 404, finalUrl: 'https://example.com/gone' });
});

it('treats a dangling redirect (no Location) as broken', async () => {
  const fetcher = vi.fn().mockResolvedValue(fakeResponse({ status: 301 }));
  const records = await scanForBrokenLinks({
    payload: { find: vi.fn() },
    fetcher: fetcher as unknown as typeof fetch,
    seedRecords: [seedRecord()],
  });
  expect(records[0]).toMatchObject({ status: 'broken', httpStatus: 301 });
});

it('caps the redirect chain and reports broken', async () => {
  const fetcher = vi.fn().mockResolvedValue(fakeResponse({ status: 301, location: 'https://example.com/loop' }));
  const records = await scanForBrokenLinks({
    payload: { find: vi.fn() },
    fetcher: fetcher as unknown as typeof fetch,
    seedRecords: [seedRecord()],
  });
  expect(records[0]).toMatchObject({ status: 'broken' });
});

it('threads anchorText, sourceDocTitle and location onto records', async () => {
  const fetcher = vi.fn().mockResolvedValue(fakeResponse({ status: 404 }));
  const records = await scanForBrokenLinks({
    payload: { find: vi.fn() },
    fetcher: fetcher as unknown as typeof fetch,
    seedRecords: [seedRecord({ anchorText: 'docs', location: 'Body', sourceDocTitle: 'Guide X' })],
  });
  expect(records[0]).toMatchObject({ anchorText: 'docs', location: 'Body', sourceDocTitle: 'Guide X' });
});

it('does not set finalUrl when there is no redirect', async () => {
  const fetcher = vi.fn().mockResolvedValue(fakeResponse({ status: 404 }));
  const records = await scanForBrokenLinks({
    payload: { find: vi.fn() },
    fetcher: fetcher as unknown as typeof fetch,
    seedRecords: [seedRecord()],
  });
  expect(records[0]?.finalUrl).toBeNull();
});
```

Delete the old `classifies 301 as redirect` test.

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm --filter @cleanstart/cms exec vitest run src/payload/lib/broken-links/scan.test.ts`
Expected: FAIL (no redirect-following; records lack new fields).

- [ ] **Step 3: Rewrite `scan.ts`**

Replace the file with:

```ts
import { isSafePublicHttpUrl } from '../url-safety/ssrf-guard';
import { type ExtractedLink, extractAllLinks } from './extract';

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
const MAX_REDIRECT_HOPS = 5;

export type LinkStatus = 'ok' | 'broken' | 'network';

export interface BrokenLinkRecord {
  readonly url: string;
  readonly status: LinkStatus;
  readonly httpStatus: number;
  readonly finalUrl: string | null;
  readonly sourceCollection: string;
  readonly sourceDocId: string;
  readonly sourceDocSlug: string | null;
  readonly sourceDocTitle: string | null;
  readonly anchorText: string | null;
  readonly location: string | null;
}

interface DocLite {
  id: string | number;
  slug?: string | null;
  title?: string | null;
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

interface SeedRecord {
  url: string;
  sourceCollection: string;
  sourceDocId: string;
  sourceDocSlug: string | null;
  sourceDocTitle?: string | null;
  anchorText?: string | null;
  location?: string | null;
}

export interface ScanArgs {
  readonly payload: ScannerPayload;
  /** Override fetch — used by tests. */
  readonly fetcher?: typeof fetch;
  /** Override URL list (skip the find() walk) — used by tests. */
  readonly seedRecords?: readonly SeedRecord[];
}

interface CheckResult {
  status: LinkStatus;
  httpStatus: number;
  finalUrl: string;
}

/**
 * HEAD-check a URL, following redirects manually so we classify by the
 * FINAL landing page, not the hop. A redirect to a healthy page is `ok`
 * (it never persists); a redirect that lands on a 4xx/5xx is `broken`
 * with the final status. Every hop is re-validated through the SSRF
 * guard — blind redirect-following would let an editor-planted link 302
 * to an internal address.
 */
const checkUrl = async (url: string, fetcher: typeof fetch): Promise<CheckResult> => {
  let current = url;
  for (let hop = 0; hop <= MAX_REDIRECT_HOPS; hop += 1) {
    if (!isSafePublicHttpUrl(current).ok) {
      return { status: 'network', httpStatus: 0, finalUrl: current };
    }
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), HEAD_TIMEOUT_MS);
    const tryFetch = async (method: 'HEAD' | 'GET') =>
      fetcher(current, { method, redirect: 'manual', signal: controller.signal });
    try {
      let res = await tryFetch('HEAD');
      if (res.status === 405 || res.status === 501) {
        res = await tryFetch('GET');
      }
      clearTimeout(timer);
      if (res.status >= 200 && res.status < 300) {
        return { status: 'ok', httpStatus: res.status, finalUrl: current };
      }
      if (res.status >= 300 && res.status < 400) {
        const location = res.headers.get('location');
        if (!location || hop === MAX_REDIRECT_HOPS) {
          return { status: 'broken', httpStatus: res.status, finalUrl: current };
        }
        try {
          current = new URL(location, current).toString();
        } catch {
          return { status: 'broken', httpStatus: res.status, finalUrl: current };
        }
        continue;
      }
      return { status: 'broken', httpStatus: res.status, finalUrl: current };
    } catch {
      clearTimeout(timer);
      return { status: 'network', httpStatus: 0, finalUrl: current };
    }
  }
  return { status: 'broken', httpStatus: 0, finalUrl: current };
};

/**
 * Walk every routable collection, collect (doc, url) pairs with anchor
 * text + location, run checks, and return one record per pair. Caller
 * persists to `brokenLinks` (idempotent upsert by `url + sourceDocId`).
 */
export const scanForBrokenLinks = async (args: ScanArgs): Promise<BrokenLinkRecord[]> => {
  const fetcher = args.fetcher ?? fetch;
  const records: BrokenLinkRecord[] = [];

  type Pair = {
    url: string;
    sourceCollection: string;
    sourceDocId: string;
    sourceDocSlug: string | null;
    sourceDocTitle: string | null;
    anchorText: string | null;
    location: string | null;
  };
  const pairs: Pair[] = [];

  if (args.seedRecords) {
    for (const r of args.seedRecords) {
      pairs.push({
        url: r.url,
        sourceCollection: r.sourceCollection,
        sourceDocId: r.sourceDocId,
        sourceDocSlug: r.sourceDocSlug,
        sourceDocTitle: r.sourceDocTitle ?? null,
        anchorText: r.anchorText ?? null,
        location: r.location ?? null,
      });
    }
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
          const links: ExtractedLink[] = extractAllLinks(doc as unknown as Record<string, unknown>);
          for (const link of links) {
            pairs.push({
              url: link.url,
              sourceCollection: collection,
              sourceDocId: String(doc.id),
              sourceDocSlug: typeof doc.slug === 'string' ? doc.slug : null,
              sourceDocTitle: typeof doc.title === 'string' ? doc.title : null,
              anchorText: link.anchorText,
              location: link.location,
            });
          }
        }
        if (!result.hasNextPage) break;
        page += 1;
      }
    }
  }

  const CHECK_CONCURRENCY = 8;
  const uniqueUrls = [...new Set(pairs.map((p) => p.url))];
  const checks = new Map<string, CheckResult>();
  let cursor = 0;
  const worker = async (): Promise<void> => {
    while (true) {
      const i = cursor;
      cursor += 1;
      if (i >= uniqueUrls.length) return;
      const url = uniqueUrls[i];
      if (typeof url !== 'string') continue;
      checks.set(url, await checkUrl(url, fetcher));
    }
  };
  await Promise.all(
    Array.from({ length: Math.min(CHECK_CONCURRENCY, uniqueUrls.length) }, () => worker()),
  );

  for (const pair of pairs) {
    const result = checks.get(pair.url);
    if (!result) continue;
    records.push({
      url: pair.url,
      status: result.status,
      httpStatus: result.httpStatus,
      finalUrl: result.finalUrl !== pair.url ? result.finalUrl : null,
      sourceCollection: pair.sourceCollection,
      sourceDocId: pair.sourceDocId,
      sourceDocSlug: pair.sourceDocSlug,
      sourceDocTitle: pair.sourceDocTitle,
      anchorText: pair.anchorText,
      location: pair.location,
    });
  }

  return records;
};
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm --filter @cleanstart/cms exec vitest run src/payload/lib/broken-links/scan.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/cms/src/payload/lib/broken-links/scan.ts apps/cms/src/payload/lib/broken-links/scan.test.ts
git commit -m "feat(broken-links): follow redirects + classify by final landing page"
```

---

## Task 3: Persist new fields in the cron (`check-broken-links.ts`)

**Files:**
- Modify: `apps/cms/src/payload/jobs/check-broken-links.ts`
- Test: `apps/cms/src/payload/jobs/check-broken-links.test.ts`

- [ ] **Step 1: Write a failing test**

Add to `check-broken-links.test.ts` (the existing tests mock `scanForBrokenLinks` via `vi.spyOn(scanner, ...)`; follow that pattern). Add:

```ts
it('persists anchorText, sourceDocTitle, finalUrl and location on create', async () => {
  vi.spyOn(scanner, 'scanForBrokenLinks').mockResolvedValue([
    {
      url: 'https://example.com/x',
      status: 'broken',
      httpStatus: 404,
      finalUrl: 'https://example.com/gone',
      sourceCollection: 'blogs',
      sourceDocId: '7',
      sourceDocSlug: 'x',
      sourceDocTitle: 'Post X',
      anchorText: 'see this',
      location: 'Body',
    },
  ]);
  const { req, spies } = makeReq([]);
  await handler(req);
  expect(spies.create).toHaveBeenCalledWith(
    expect.objectContaining({
      data: expect.objectContaining({
        anchorText: 'see this',
        sourceDocTitle: 'Post X',
        finalUrl: 'https://example.com/gone',
        location: 'Body',
      }),
    }),
  );
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @cleanstart/cms exec vitest run src/payload/jobs/check-broken-links.test.ts -t "persists anchorText"`
Expected: FAIL (fields not in the create payload).

- [ ] **Step 3: Add the fields to the handler**

In `check-broken-links.ts`, the `update` call's `data` (around line 72) — add the new fields:

```ts
          data: {
            status: record.status,
            httpStatus: record.httpStatus,
            sourceDocSlug: record.sourceDocSlug,
            sourceDocTitle: record.sourceDocTitle,
            anchorText: record.anchorText,
            location: record.location,
            finalUrl: record.finalUrl,
            lastChecked: now,
          },
```

And the `create` call's `data` (around line 83):

```ts
          data: {
            url: record.url,
            status: record.status,
            httpStatus: record.httpStatus,
            finalUrl: record.finalUrl,
            sourceCollection: record.sourceCollection,
            sourceDocId: record.sourceDocId,
            sourceDocSlug: record.sourceDocSlug,
            sourceDocTitle: record.sourceDocTitle,
            anchorText: record.anchorText,
            location: record.location,
            firstSeenAt: now,
            lastChecked: now,
          },
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm --filter @cleanstart/cms exec vitest run src/payload/jobs/check-broken-links.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/cms/src/payload/jobs/check-broken-links.ts apps/cms/src/payload/jobs/check-broken-links.test.ts
git commit -m "feat(broken-links): persist anchor text, title, final url, location"
```

---

## Task 4: Migration for the four new columns

**Files:**
- Create: `apps/cms/src/migrations/20260625_120000_add_broken_links_details.ts`
- Modify: `apps/cms/src/migrations/index.ts`

- [ ] **Step 1: Write the migration**

Create `apps/cms/src/migrations/20260625_120000_add_broken_links_details.ts`:

```ts
import { type MigrateUpArgs, type MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "broken_links" ADD COLUMN "anchor_text" varchar;
  ALTER TABLE "broken_links" ADD COLUMN "source_doc_title" varchar;
  ALTER TABLE "broken_links" ADD COLUMN "final_url" varchar;
  ALTER TABLE "broken_links" ADD COLUMN "location" varchar;`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "broken_links" DROP COLUMN "anchor_text";
  ALTER TABLE "broken_links" DROP COLUMN "source_doc_title";
  ALTER TABLE "broken_links" DROP COLUMN "final_url";
  ALTER TABLE "broken_links" DROP COLUMN "location";`)
}
```

- [ ] **Step 2: Register it in `index.ts`**

Add the import near the other imports (end of the import block):

```ts
import * as migration_20260625_120000_add_broken_links_details from './20260625_120000_add_broken_links_details';
```

Add the array entry as the LAST element of the exported migrations array (after `add_resources_hero_image`):

```ts
  {
    up: migration_20260625_120000_add_broken_links_details.up,
    down: migration_20260625_120000_add_broken_links_details.down,
    name: '20260625_120000_add_broken_links_details',
  },
```

- [ ] **Step 3: Commit**

```bash
git add apps/cms/src/migrations/20260625_120000_add_broken_links_details.ts apps/cms/src/migrations/index.ts
git commit -m "feat(broken-links): migration for anchor/title/final-url/location columns"
```

---

## Task 5: Collection fields + list cell

**Files:**
- Modify: `apps/cms/src/payload/collections/BrokenLinks.ts`
- Modify: `apps/cms/src/payload/collections/BrokenLinks.test.ts`
- Create: `apps/cms/src/payload/admin/components/SourcePageCell.tsx`

- [ ] **Step 1: Create `SourcePageCell.tsx`**

```tsx
'use client';

import type { ReactElement } from 'react';

type SourcePageCellProps = {
  cellData?: string | null;
  rowData?: { sourceCollection?: string; sourceDocId?: string | number };
};

/**
 * List cell for a broken link's source page. Renders the page title as a
 * link straight to the source doc's admin edit page, so an editor goes
 * from the broken-links table to the page that needs fixing in one click.
 */
export const SourcePageCell = (props: SourcePageCellProps): ReactElement => {
  const title = props.cellData?.trim();
  const collection = props.rowData?.sourceCollection;
  const id = props.rowData?.sourceDocId;
  if (!collection || id == null) {
    return <span>{title || '—'}</span>;
  }
  return (
    <a href={`/admin/collections/${collection}/${id}`} className="cs-source-page-cell">
      {title || `${collection}/${id}`}
    </a>
  );
};

export default SourcePageCell;
```

- [ ] **Step 2: Add fields + components to `BrokenLinks.ts`**

Add the four fields and wire the cell. Update `defaultColumns`, then insert fields after `sourceDocSlug`:

Replace `defaultColumns`:

```ts
    defaultColumns: ['url', 'anchorText', 'status', 'sourceDocTitle', 'sourceCollection', 'lastChecked'],
```

In the `status` field, add a deprecation note to the kept `redirect` option (above the `options` array add a comment):

```ts
      // `redirect` is retained for backward-compat only — the scanner no
      // longer emits it (redirects are followed and classified by their
      // final landing page). Postgres can't cleanly drop an enum value, so
      // the option stays; no new row will ever carry it.
```

Insert after the `sourceDocSlug` field:

```ts
    {
      name: 'sourceDocTitle',
      type: 'text',
      admin: {
        readOnly: true,
        components: { Cell: { path: '@/payload/admin/components/SourcePageCell.tsx#SourcePageCell' } },
      },
    },
    {
      name: 'anchorText',
      type: 'text',
      admin: { readOnly: true, description: 'Visible link text on the page (empty for non-rich-text URL fields).' },
    },
    {
      name: 'location',
      type: 'text',
      admin: { readOnly: true, description: 'Where the link lives in the page — "Body" or the field label.' },
    },
    {
      name: 'finalUrl',
      type: 'text',
      admin: { readOnly: true, description: 'Where the link ends up after following redirects (set only when it differs from the URL).' },
    },
```

- [ ] **Step 3: Update `BrokenLinks.test.ts` to skip ui fields**

The "renders every field read-only" test iterates all named fields. Future `ui` fields (Task 6) carry no `readOnly`. Guard it now:

```ts
    const fields = BrokenLinks.fields as { name?: string; type?: string; admin?: { readOnly?: boolean } }[];
    for (const field of fields) {
      if (!field.name || field.type === 'ui') continue;
      expect(field.admin?.readOnly, `${field.name} must be readOnly`).toBe(true);
    }
```

- [ ] **Step 4: Run the collection test**

Run: `pnpm --filter @cleanstart/cms exec vitest run src/payload/collections/BrokenLinks.test.ts`
Expected: PASS. If a snapshot test (`__snapshots__/BrokenLinks.snap.json`) exists and fails on the new fields, update it: `pnpm --filter @cleanstart/cms exec vitest run -u src/payload/collections/BrokenLinks.test.ts` and review the diff.

- [ ] **Step 5: Commit**

```bash
git add apps/cms/src/payload/collections/BrokenLinks.ts apps/cms/src/payload/collections/BrokenLinks.test.ts apps/cms/src/payload/admin/components/SourcePageCell.tsx apps/cms/src/payload/collections/__snapshots__/BrokenLinks.snap.json
git commit -m "feat(broken-links): new fields + clickable source-page list cell"
```

---

## Task 6: Detail-page Field components

**Files:**
- Create: `apps/cms/src/payload/admin/components/BrokenLinkUrlField.tsx`
- Create: `apps/cms/src/payload/admin/components/SourcePageLinkField.tsx`
- Create: `apps/cms/src/payload/admin/components/BrokenLinkStatusField.tsx`
- Modify: `apps/cms/src/payload/collections/BrokenLinks.ts`

- [ ] **Step 1: Create `BrokenLinkUrlField.tsx`**

```tsx
'use client';

import type { ReactElement } from 'react';
import { useFormFields } from '@payloadcms/ui';

/**
 * Detail-view field for the broken URL — renders it as a clickable
 * external link (new tab) so an editor can verify it, plus the resolved
 * final URL when the link redirects.
 */
export const BrokenLinkUrlField = (): ReactElement => {
  const url = useFormFields(([fields]) => fields.url?.value as string | undefined);
  const finalUrl = useFormFields(([fields]) => fields.finalUrl?.value as string | undefined);
  return (
    <div className="field-type cs-broken-url-field">
      <label className="field-label">Broken URL</label>
      <div>
        {url ? (
          <a href={url} target="_blank" rel="noopener noreferrer">
            {url}
          </a>
        ) : (
          '—'
        )}
      </div>
      {finalUrl && (
        <div className="cs-broken-url-field__final">
          ↳ redirects to{' '}
          <a href={finalUrl} target="_blank" rel="noopener noreferrer">
            {finalUrl}
          </a>
        </div>
      )}
    </div>
  );
};

export default BrokenLinkUrlField;
```

- [ ] **Step 2: Create `SourcePageLinkField.tsx`**

```tsx
'use client';

import type { ReactElement } from 'react';
import { useFormFields } from '@payloadcms/ui';

import { collectionUrlFromSlug } from '@/payload/lib/route-prefixes';

/**
 * Detail-view UI field — links to the source doc's admin edit page (where
 * the link gets fixed) and, when resolvable, its live public URL. Reads
 * sibling field values via the data-layer `useFormFields` hook.
 */
export const SourcePageLinkField = (): ReactElement => {
  const collection = useFormFields(([f]) => f.sourceCollection?.value as string | undefined);
  const id = useFormFields(([f]) => f.sourceDocId?.value as string | undefined);
  const slug = useFormFields(([f]) => f.sourceDocSlug?.value as string | undefined);
  const title = useFormFields(([f]) => f.sourceDocTitle?.value as string | undefined);
  const location = useFormFields(([f]) => f.location?.value as string | undefined);

  const adminHref = collection && id ? `/admin/collections/${collection}/${id}` : null;
  const liveHref = collection && slug ? collectionUrlFromSlug(collection, slug) : null;

  return (
    <div className="field-type cs-source-page-field">
      <label className="field-label">Source page</label>
      <div>
        {adminHref ? <a href={adminHref}>{title || `${collection}/${id}`}</a> : title || '—'}
        {liveHref && (
          <>
            {' · '}
            <a href={liveHref} target="_blank" rel="noopener noreferrer">
              view live ↗
            </a>
          </>
        )}
      </div>
      {location && <div className="cs-source-page-field__loc">Location on page: {location}</div>}
    </div>
  );
};

export default SourcePageLinkField;
```

- [ ] **Step 3: Create `BrokenLinkStatusField.tsx`**

```tsx
'use client';

import type { ReactElement } from 'react';
import { useFormFields } from '@payloadcms/ui';

const HTTP_LABELS: Record<number, string> = {
  0: 'No response',
  400: 'Bad Request',
  401: 'Unauthorized',
  403: 'Forbidden',
  404: 'Not Found',
  410: 'Gone',
  429: 'Too Many Requests',
  500: 'Internal Server Error',
  502: 'Bad Gateway',
  503: 'Service Unavailable',
  504: 'Gateway Timeout',
};

const ageFrom = (iso: string | undefined): string | null => {
  if (!iso) return null;
  const ms = Date.now() - new Date(iso).getTime();
  if (Number.isNaN(ms) || ms < 0) return null;
  const days = Math.floor(ms / 86_400_000);
  if (days >= 1) return `broken ${days} day${days === 1 ? '' : 's'}`;
  const hours = Math.floor(ms / 3_600_000);
  return `broken ${hours} hour${hours === 1 ? '' : 's'}`;
};

/**
 * Sidebar UI field — humanises the HTTP status ("404 · Not Found") and
 * shows how long the link has been broken (derived from firstSeenAt).
 */
export const BrokenLinkStatusField = (): ReactElement => {
  const httpStatus = useFormFields(([f]) => f.httpStatus?.value as number | undefined);
  const firstSeenAt = useFormFields(([f]) => f.firstSeenAt?.value as string | undefined);
  const label = httpStatus != null ? HTTP_LABELS[httpStatus] : undefined;
  const age = ageFrom(firstSeenAt);
  return (
    <div className="field-type cs-broken-status-field">
      <label className="field-label">Diagnosis</label>
      <div>
        {httpStatus != null ? `HTTP ${httpStatus}${label ? ` · ${label}` : ''}` : '—'}
      </div>
      {age && <div className="cs-broken-status-field__age">{age}</div>}
    </div>
  );
};

export default BrokenLinkStatusField;
```

- [ ] **Step 4: Wire the components into `BrokenLinks.ts`**

On the `url` field, add a Field component:

```ts
    {
      name: 'url',
      type: 'text',
      required: true,
      index: true,
      admin: {
        readOnly: true,
        components: { Field: { path: '@/payload/admin/components/BrokenLinkUrlField.tsx#BrokenLinkUrlField' } },
      },
    },
```

Add two `ui` fields — one in the main column (after `finalUrl`), one in the sidebar:

```ts
    {
      name: 'sourcePageLink',
      type: 'ui',
      admin: { components: { Field: { path: '@/payload/admin/components/SourcePageLinkField.tsx#SourcePageLinkField' } } },
    },
    {
      name: 'diagnosis',
      type: 'ui',
      admin: {
        position: 'sidebar',
        components: { Field: { path: '@/payload/admin/components/BrokenLinkStatusField.tsx#BrokenLinkStatusField' } },
      },
    },
```

- [ ] **Step 5: Run the collection test**

Run: `pnpm --filter @cleanstart/cms exec vitest run src/payload/collections/BrokenLinks.test.ts`
Expected: PASS (ui fields are skipped by the guard from Task 5). Update the snapshot if needed (`-u`).

- [ ] **Step 6: Commit**

```bash
git add apps/cms/src/payload/admin/components/BrokenLinkUrlField.tsx apps/cms/src/payload/admin/components/SourcePageLinkField.tsx apps/cms/src/payload/admin/components/BrokenLinkStatusField.tsx apps/cms/src/payload/collections/BrokenLinks.ts apps/cms/src/payload/collections/__snapshots__/BrokenLinks.snap.json
git commit -m "feat(broken-links): clickable detail-page fields (url, source page, diagnosis)"
```

---

## Task 7: Regenerate types + import map, full verification

**Files:**
- Generated: `apps/cms/src/payload-types.ts`
- Generated: `apps/cms/src/app/(payload)/admin/importMap.js`

- [ ] **Step 1: Regenerate types**

Run: `pnpm --filter @cleanstart/cms generate:types`
Expected: `BrokenLink` type in `payload-types.ts` gains `anchorText`, `sourceDocTitle`, `finalUrl`, `location` (all `string | null`).

- [ ] **Step 2: Regenerate the import map**

Run: `pnpm --filter @cleanstart/cms generate:importmap`
Expected: `importMap.js` gains entries for `SourcePageCell`, `BrokenLinkUrlField`, `SourcePageLinkField`, `BrokenLinkStatusField`.

- [ ] **Step 3: Run the full broken-links test set**

Run: `pnpm --filter @cleanstart/cms exec vitest run src/payload/lib/broken-links src/payload/jobs/check-broken-links.test.ts src/payload/collections/BrokenLinks.test.ts`
Expected: PASS.

- [ ] **Step 4: Mandatory checks**

```bash
pnpm --filter @cleanstart/cms lint
pnpm --filter @cleanstart/cms typecheck
pnpm --filter @cleanstart/cms build
```

Expected: all clean. Fix any failure before continuing.

- [ ] **Step 5: Commit generated artifacts**

```bash
git add apps/cms/src/payload-types.ts "apps/cms/src/app/(payload)/admin/importMap.js"
git commit -m "chore(broken-links): regenerate payload types + import map"
```

---

## Task 8: Local verification + prod rollout

- [ ] **Step 1: Verify in local admin**

Restart the CMS dev server (local DB is push-mode — a restart applies the new columns; `payload migrate` hangs locally). Open `/admin/collections/brokenLinks`: the list shows the `anchorText` + source-page (clickable) columns. Open a row: the broken URL is a link, the source page links to its edit page, the sidebar shows the diagnosis. (If the table is empty locally, trigger a scan with `pnpm exec tsx --env-file=.env scripts/run-broken-links-scan.ts`.)

- [ ] **Step 2: Push to `main` for deploy**

The CMS deploys from `main` via GitHub Actions, which runs the migration. Merge `development` → `main` per the branching policy (keep all three branches in sync).

- [ ] **Step 3: Post-deploy backfill scan**

After the deploy applies the migration, re-run the one-shot scan on prod (same mechanism as before — `docker cp scripts/run-broken-links-scan.ts` into `cleanstart-cms-1`, run via `pnpm exec tsx`). This backfills anchor text / title / location / finalUrl on existing rows and purges the now-resolved `redirect` rows (the NIST/CSRC entries that land on healthy pages disappear; any that land on a 4xx become `broken`).

- [ ] **Step 4: Spot-check prod**

In `/admin/collections/brokenLinks`: no `redirect`-status rows remain; broken rows show anchor text, a clickable source page, and (where redirected) a final URL.

---

## Self-review notes

- **Spec coverage:** anchor text (T1), location (T1), redirect-following + final URL (T2), persist (T3), migration (T4), list cell + fields + kept-deprecated `redirect` (T5), detail-page clickables + diagnosis (T6), types/importmap/checks (T7), rollout (T8). All spec sections mapped.
- **Type consistency:** `BrokenLinkRecord` (T2) fields — `anchorText`, `sourceDocTitle`, `finalUrl`, `location` — match the cron `data` keys (T3), the collection field names (T5/T6), and the migration columns snake-cased (T4). `LinkStatus` narrowed to `'ok' | 'broken' | 'network'` consistently.
- **Distinct-per-page:** unchanged — keyed by `url + sourceDocId` in the cron, preserved.
- **`redirect` enum:** kept in the select options to avoid a Postgres enum-drop migration; scanner never emits it.
