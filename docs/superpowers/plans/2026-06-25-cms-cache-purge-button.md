# CMS Cache-Purge Button — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add WordPress-style on-demand cache purging to the CMS admin — a per-document "Purge this page" button (editor+), plus a global "Purge entire site" and a custom path/tag purge on a dedicated `/admin/cache` page (admin-only).

**Architecture:** A single cookie-authed, role-gated CMS endpoint `POST /api/cache-purge` resolves real apps/web URLs from a verified, drift-tested map (`web-pages.ts`) and calls the existing `revalidateWeb` helper, which pings apps/web `/api/revalidate`. The browser never holds the revalidate secret. Completeness across all 12 web-facing collections is enforced by a filesystem-backed test.

**Tech Stack:** Payload 3 (custom endpoint + `ui` field + custom admin views/components), Zod, Vitest, Next.js 16 ISR (`revalidatePath`/`revalidateTag`), `@cleanstart/ui`.

**Spec:** `docs/superpowers/specs/2026-06-25-cms-cache-purge-button-design.md`

---

## File structure

**New:**
- `apps/cms/src/payload/lib/web-pages.ts` — verified purge map + `purgePathsForDoc`.
- `apps/cms/src/payload/lib/web-pages.test.ts` — unit tests for the map/helper.
- `apps/cms/src/payload/lib/web-pages.routes.test.ts` — filesystem drift guard.
- `apps/cms/src/payload/endpoints/cache-purge.ts` — `resolvePurge` helper + `cachePurgeEndpoint`.
- `apps/cms/src/payload/endpoints/cache-purge.test.ts` — handler/resolver tests.
- `apps/cms/src/payload/fields/purge-page-ui.ts` — shared `purgePageUiField`.
- `apps/cms/src/payload/admin/components/cache/PurgePageButton.tsx` — per-doc button.
- `apps/cms/src/payload/admin/components/cache/CacheView.tsx` — `/admin/cache` page.
- `apps/cms/src/payload/admin/components/cache/CacheNavLink.tsx` — admin-only nav link.
- `apps/cms/src/payload/collections/cache-purge-field.test.ts` — completeness test (12 collections carry the field).

**Modified:**
- `apps/cms/src/payload/lib/web-revalidate.ts` (+ `.test.ts`) — add `layoutPaths`, return `RevalidateResult`.
- `apps/web/src/app/api/revalidate/route.ts` (+ `.test.ts`) — handle `layoutPaths`.
- `apps/cms/src/payload.config.ts` — register endpoint + `/admin/cache` view + nav link.
- 12 collection files — spread `purgePageUiField` into sidebar fields.
- `apps/cms/src/app/(payload)/admin/importMap.js` — regenerated.

**The 12 web-facing collections:** `blogs`, `news`, `guides`, `resources`, `events`, `jobs`, `knowledgeBase`, `legalDocuments`, `authors`, `case-studies`, `webinars`, `podcastEpisodes`.

---

## Task 1: Clean baseline — commit the in-flight revalidation fix

This plan builds on the revalidation fix already in the working tree (Defect 1 one-liner + Defects 2–3). Commit it first so the feature lands on a clean base.

- [ ] **Step 1: Confirm the working-tree changes are the revalidation fix**

Run: `git -C /Users/a12345/Desktop/AI/cleanstart/cleanstart-website status --porcelain apps/web/src/app/api/revalidate/route.ts apps/cms/src/payload/lib/route-prefixes.ts apps/cms/src/payload/lib/route-prefixes.test.ts apps/cms/src/payload/collections/Authors.ts apps/cms/src/payload/collections/Legal.ts`
Expected: all five show `M`.

- [ ] **Step 2: Run the affected unit test + lint**

Run: `pnpm --filter @cleanstart/cms exec vitest run src/payload/lib/route-prefixes.test.ts && pnpm --filter @cleanstart/cms lint && pnpm --filter @cleanstart/web lint`
Expected: test PASS (6 tests), both lints "No fixes applied".

- [ ] **Step 3: Commit (stage exact paths only — never `git add -A`)**

```bash
cd /Users/a12345/Desktop/AI/cleanstart/cleanstart-website
git add apps/web/src/app/api/revalidate/route.ts \
        apps/cms/src/payload/lib/route-prefixes.ts \
        apps/cms/src/payload/lib/route-prefixes.test.ts \
        apps/cms/src/payload/collections/Authors.ts \
        apps/cms/src/payload/collections/Legal.ts
git commit -m "fix(web): purge dynamic detail pages on revalidate; wire authors/legal + case-studies listing"
```

---

## Task 2: `web-pages.ts` — verified purge map

**Files:**
- Create: `apps/cms/src/payload/lib/web-pages.ts`
- Test: `apps/cms/src/payload/lib/web-pages.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// apps/cms/src/payload/lib/web-pages.test.ts
import { describe, expect, it } from 'vitest';

import {
  PURGEABLE_COLLECTIONS,
  isPurgeableCollection,
  purgePathsForDoc,
} from './web-pages';

describe('isPurgeableCollection', () => {
  it('includes every web-facing collection', () => {
    for (const c of [
      'blogs', 'news', 'guides', 'resources', 'events', 'jobs',
      'knowledgeBase', 'legalDocuments', 'authors', 'case-studies',
      'webinars', 'podcastEpisodes',
    ]) {
      expect(isPurgeableCollection(c)).toBe(true);
    }
    expect(Object.keys(PURGEABLE_COLLECTIONS)).toHaveLength(12);
  });

  it('excludes collections with no live web route', () => {
    for (const c of ['categories', 'newsCategories', 'knowledgeCategories', 'pages', 'media']) {
      expect(isPurgeableCollection(c)).toBe(false);
    }
  });
});

describe('purgePathsForDoc', () => {
  it('returns listing + detail for a full collection', () => {
    expect(purgePathsForDoc('news', { slug: 'hello' })).toEqual(['/news', '/news/hello']);
  });

  it('honours the listing override (detail prefix ≠ listing)', () => {
    expect(purgePathsForDoc('resources', { slug: 'x' })).toEqual(['/resource-center', '/resources/x']);
    expect(purgePathsForDoc('jobs', { slug: 'x' })).toEqual(['/careers', '/job/x']);
    expect(purgePathsForDoc('events', { slug: 'x' })).toEqual(['/events', '/event/x']);
  });

  it('returns detail only for authors (no listing route)', () => {
    expect(purgePathsForDoc('authors', { slug: 'jane' })).toEqual(['/author/jane']);
  });

  it('returns listing only for listing-only collections (no dead detail path)', () => {
    expect(purgePathsForDoc('webinars', { slug: 'x' })).toEqual(['/webinars']);
    expect(purgePathsForDoc('case-studies', { slug: 'x' })).toEqual(['/case-studies']);
    expect(purgePathsForDoc('podcastEpisodes', { slug: 'x' })).toEqual(['/podcast']);
  });

  it('omits the detail path when slug is missing', () => {
    expect(purgePathsForDoc('news', {})).toEqual(['/news']);
    expect(purgePathsForDoc('authors', { slug: null })).toEqual([]);
  });

  it('returns [] for an unknown collection', () => {
    expect(purgePathsForDoc('media', { slug: 'x' })).toEqual([]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @cleanstart/cms exec vitest run src/payload/lib/web-pages.test.ts`
Expected: FAIL — "Failed to resolve import './web-pages'".

- [ ] **Step 3: Write the implementation**

```ts
// apps/cms/src/payload/lib/web-pages.ts
/**
 * Verified map of CMS collections → their live apps/web page URLs, used by the
 * cache-purge feature. Deliberately separate from `route-prefixes.ts`
 * (ROUTE_PREFIX), which carries stale/aspirational entries its other consumers
 * tolerate (categories, the dead `/webinar` detail, pages). Every value here was
 * verified against the actual apps/web route tree and is guarded by
 * `web-pages.routes.test.ts`, so a purge never targets a non-existent page.
 */
export interface WebPage {
  /** Detail route prefix, e.g. `/news` → `/news/<slug>`. Omit if listing-only. */
  detailPrefix?: string;
  /** Listing/index route. Omit if detail-only (e.g. authors). */
  listingPath?: string;
}

export const PURGEABLE_COLLECTIONS: Record<string, WebPage> = {
  blogs: { detailPrefix: '/blogs', listingPath: '/blogs' },
  news: { detailPrefix: '/news', listingPath: '/news' },
  guides: { detailPrefix: '/guide', listingPath: '/guide' },
  resources: { detailPrefix: '/resources', listingPath: '/resource-center' },
  events: { detailPrefix: '/event', listingPath: '/events' },
  jobs: { detailPrefix: '/job', listingPath: '/careers' },
  knowledgeBase: { detailPrefix: '/knowledge-hub', listingPath: '/knowledge-hub' },
  legalDocuments: { detailPrefix: '/legal', listingPath: '/legal' },
  authors: { detailPrefix: '/author' },
  'case-studies': { listingPath: '/case-studies' },
  webinars: { listingPath: '/webinars' },
  podcastEpisodes: { listingPath: '/podcast' },
};

export const isPurgeableCollection = (collection: string): boolean =>
  Object.prototype.hasOwnProperty.call(PURGEABLE_COLLECTIONS, collection);

/** Real page URLs to purge for a doc — never a dead path. */
export const purgePathsForDoc = (
  collection: string,
  doc: { slug?: string | null },
): string[] => {
  const entry = PURGEABLE_COLLECTIONS[collection];
  if (!entry) return [];
  const paths: string[] = [];
  if (entry.listingPath) paths.push(entry.listingPath);
  if (entry.detailPrefix && typeof doc.slug === 'string' && doc.slug.length > 0) {
    paths.push(`${entry.detailPrefix}/${doc.slug}`);
  }
  return Array.from(new Set(paths));
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @cleanstart/cms exec vitest run src/payload/lib/web-pages.test.ts`
Expected: PASS (all cases).

- [ ] **Step 5: Commit**

```bash
git add apps/cms/src/payload/lib/web-pages.ts apps/cms/src/payload/lib/web-pages.test.ts
git commit -m "feat(cms): verified web-page purge map (web-pages.ts)"
```

---

## Task 3: Filesystem drift guard

Proves every purge path maps to a real apps/web route, and fails CI if a route is renamed/removed or an entry is wrong. Route-group aware (`/legal` lives under `(legal)/legal`).

**Files:**
- Test: `apps/cms/src/payload/lib/web-pages.routes.test.ts`

- [ ] **Step 1: Write the test**

```ts
// apps/cms/src/payload/lib/web-pages.routes.test.ts
import { existsSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

import { PURGEABLE_COLLECTIONS } from './web-pages';

const APP_DIR = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../../../web/src/app',
);

/** Collect every route URL-pattern that has a page.tsx, stripping (groups). */
const collectRoutePatterns = (dir: string, urlSegments: string[], out: Set<string>): void => {
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (!statSync(full).isDirectory()) continue;
    if (entry.startsWith('(') && entry.endsWith(')')) {
      collectRoutePatterns(full, urlSegments, out); // route group — not in URL
      continue;
    }
    const next = [...urlSegments, entry];
    if (existsSync(path.join(full, 'page.tsx'))) out.add(`/${next.join('/')}`);
    collectRoutePatterns(full, next, out);
  }
};

describe('PURGEABLE_COLLECTIONS map matches real apps/web routes', () => {
  const patterns = new Set<string>();
  collectRoutePatterns(APP_DIR, [], patterns);

  for (const [collection, page] of Object.entries(PURGEABLE_COLLECTIONS)) {
    if (page.listingPath) {
      it(`${collection}: listing ${page.listingPath} exists`, () => {
        expect(patterns.has(page.listingPath as string)).toBe(true);
      });
    }
    if (page.detailPrefix) {
      it(`${collection}: detail ${page.detailPrefix}/[slug] exists`, () => {
        expect(patterns.has(`${page.detailPrefix}/[slug]`)).toBe(true);
      });
    }
  }
});
```

- [ ] **Step 2: Run it**

Run: `pnpm --filter @cleanstart/cms exec vitest run src/payload/lib/web-pages.routes.test.ts`
Expected: PASS — one assertion per listing/detail. If any FAIL, the map is wrong or a route moved; fix `web-pages.ts` (do not weaken the test).

- [ ] **Step 3: Commit**

```bash
git add apps/cms/src/payload/lib/web-pages.routes.test.ts
git commit -m "test(cms): filesystem drift guard for the purge map"
```

---

## Task 4: Extend `revalidateWeb` — `layoutPaths` + result

**Files:**
- Modify: `apps/cms/src/payload/lib/web-revalidate.ts`
- Test: `apps/cms/src/payload/lib/web-revalidate.test.ts`

- [ ] **Step 1: Add failing tests** (append to the existing test file)

```ts
// in apps/cms/src/payload/lib/web-revalidate.test.ts
import { afterEach, describe, expect, it, vi } from 'vitest';
import { revalidateWeb } from './web-revalidate';

const logger = { info: vi.fn(), warn: vi.fn() } as never;

describe('revalidateWeb result + layoutPaths', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    delete process.env.WEB_REVALIDATE_URL;
    delete process.env.WEB_REVALIDATE_SECRET;
    delete process.env.WEB_REVALIDATE_SUPPRESS;
  });

  it('reports disabled when env vars are unset', async () => {
    const res = await revalidateWeb(logger, { paths: ['/news'] });
    expect(res).toEqual({ ok: false, disabled: true });
  });

  it('posts layoutPaths and returns ok on 2xx', async () => {
    process.env.WEB_REVALIDATE_URL = 'https://web.test/api/revalidate';
    process.env.WEB_REVALIDATE_SECRET = 's3cret';
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response('{}', { status: 200 }));

    const res = await revalidateWeb(logger, { layoutPaths: ['/'] });

    expect(res).toEqual({ ok: true, disabled: false, status: 200 });
    const body = JSON.parse((fetchMock.mock.calls[0][1] as RequestInit).body as string);
    expect(body.layoutPaths).toEqual(['/']);
  });

  it('returns ok:false on non-2xx', async () => {
    process.env.WEB_REVALIDATE_URL = 'https://web.test/api/revalidate';
    process.env.WEB_REVALIDATE_SECRET = 's3cret';
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('nope', { status: 500 }));
    const res = await revalidateWeb(logger, { paths: ['/news'] });
    expect(res.ok).toBe(false);
    expect(res.status).toBe(500);
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `pnpm --filter @cleanstart/cms exec vitest run src/payload/lib/web-revalidate.test.ts`
Expected: FAIL — `revalidateWeb` currently returns `undefined`, not a result; `layoutPaths` not sent.

- [ ] **Step 3: Implement** — edit `apps/cms/src/payload/lib/web-revalidate.ts`

Replace the `RevalidateRequest` interface and the `revalidateWeb` signature/body:

```ts
export interface RevalidateRequest {
  tags?: readonly string[];
  paths?: readonly string[];
  /** Subtree purge — apps/web calls revalidatePath(p, 'layout'). Use ['/'] for full-site. */
  layoutPaths?: readonly string[];
}

export interface RevalidateResult {
  ok: boolean;
  disabled: boolean;
  status?: number;
  error?: string;
}

export const revalidateWeb = async (
  payload: Pick<Payload, 'logger'>,
  request: RevalidateRequest,
): Promise<RevalidateResult> => {
  if (process.env.WEB_REVALIDATE_SUPPRESS === 'true') {
    if (!warnedSuppressed) {
      payload.logger.info(
        '[web-revalidate] WEB_REVALIDATE_SUPPRESS=true; cross-process cache ' +
          'invalidation is suppressed for this run (bulk seed/backfill mode).',
      );
      warnedSuppressed = true;
    }
    return { ok: false, disabled: true };
  }

  const url = process.env.WEB_REVALIDATE_URL;
  const secret = process.env.WEB_REVALIDATE_SECRET;
  if (!url || !secret) {
    if (!warnedDisabled) {
      payload.logger.info(
        '[web-revalidate] WEB_REVALIDATE_URL / WEB_REVALIDATE_SECRET unset; ' +
          'cross-process cache invalidation is disabled (ISR will catch up within the TTL).',
      );
      warnedDisabled = true;
    }
    return { ok: false, disabled: true };
  }

  const tags = Array.from(request.tags ?? []);
  const paths = Array.from(request.paths ?? []);
  const layoutPaths = Array.from(request.layoutPaths ?? []);
  if (tags.length === 0 && paths.length === 0 && layoutPaths.length === 0) {
    return { ok: true, disabled: false };
  }

  const ctrl = new AbortController();
  const timeout = setTimeout(() => ctrl.abort(), REVALIDATE_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${secret}`,
      },
      body: JSON.stringify({ tags, paths, layoutPaths }),
      signal: ctrl.signal,
    });
    if (!res.ok) {
      payload.logger.warn(`[web-revalidate] non-2xx from apps/web: HTTP ${res.status}`);
      return { ok: false, disabled: false, status: res.status };
    }
    return { ok: true, disabled: false, status: res.status };
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    payload.logger.warn(`[web-revalidate] failed: ${error}`);
    return { ok: false, disabled: false, error };
  } finally {
    clearTimeout(timeout);
  }
};
```

- [ ] **Step 4: Run tests (this file + the publish hook that calls revalidateWeb)**

Run: `pnpm --filter @cleanstart/cms exec vitest run src/payload/lib/web-revalidate.test.ts src/payload/hooks/revalidate-page-registry.test.ts`
Expected: PASS. (The publish-hook caller ignores the return value, so it still compiles/passes.)

- [ ] **Step 5: Typecheck the package quickly for the changed signature**

Run: `pnpm --filter @cleanstart/cms exec tsc --noEmit 2>&1 | grep -E "web-revalidate|revalidate-web-publish" || echo "no new errors in revalidate files"`
Expected: "no new errors in revalidate files". (Pre-existing unrelated broken-links errors may appear; ignore those.)

- [ ] **Step 6: Commit**

```bash
git add apps/cms/src/payload/lib/web-revalidate.ts apps/cms/src/payload/lib/web-revalidate.test.ts
git commit -m "feat(cms): revalidateWeb returns a result and accepts layoutPaths"
```

---

## Task 5: Extend apps/web `/api/revalidate` — `layoutPaths`

**Files:**
- Modify: `apps/web/src/app/api/revalidate/route.ts`
- Test: `apps/web/src/app/api/revalidate/route.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// apps/web/src/app/api/revalidate/route.test.ts
import { afterEach, describe, expect, it, vi } from 'vitest';

const revalidatePath = vi.fn();
const revalidateTag = vi.fn();
vi.mock('next/cache', () => ({ revalidatePath, revalidateTag }));

import { POST } from './route';

const post = (body: unknown) =>
  POST(
    new Request('https://web.test/api/revalidate', {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: 'Bearer s3cret' },
      body: JSON.stringify(body),
    }) as never,
  );

describe('POST /api/revalidate layoutPaths', () => {
  afterEach(() => vi.clearAllMocks());

  it('revalidates layoutPaths with the "layout" type', async () => {
    process.env.WEB_REVALIDATE_SECRET = 's3cret';
    const res = await post({ layoutPaths: ['/'] });
    expect(res.status).toBe(200);
    expect(revalidatePath).toHaveBeenCalledWith('/', 'layout');
  });

  it('ignores non-string / non-slash layoutPaths', async () => {
    process.env.WEB_REVALIDATE_SECRET = 's3cret';
    await post({ layoutPaths: ['no-slash', 42, '/ok'] });
    expect(revalidatePath).toHaveBeenCalledTimes(1);
    expect(revalidatePath).toHaveBeenCalledWith('/ok', 'layout');
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `pnpm --filter @cleanstart/web exec vitest run src/app/api/revalidate/route.test.ts`
Expected: FAIL — `layoutPaths` not handled (`revalidatePath` not called with `'layout'`).

- [ ] **Step 3: Implement** — in `apps/web/src/app/api/revalidate/route.ts`, after the `paths` parsing block (the `const paths = Array.isArray(...)` assignment) add:

```ts
  const layoutPaths = Array.isArray(body?.layoutPaths)
    ? body.layoutPaths.filter(
        (p): p is string => typeof p === "string" && p.startsWith("/"),
      )
    : [];
```

Then, after the existing `for (const path of paths) revalidatePath(path);` line add:

```ts
  // layoutPaths revalidate a whole route subtree (revalidatePath(p, 'layout')).
  // The CMS sends ['/'] for a full-site purge — the canonical "revalidate
  // everything" form, since revalidatePath('/') alone only purges the homepage.
  for (const path of layoutPaths) revalidatePath(path, "layout");
```

Also extend the body type annotation (the `body` object destructure type) to include `layoutPaths?: unknown` and the success response to include `layoutPaths`:

```ts
  return NextResponse.json({
    ok: true,
    revalidated: { tags, paths, layoutPaths },
  });
```

- [ ] **Step 4: Run to verify pass**

Run: `pnpm --filter @cleanstart/web exec vitest run src/app/api/revalidate/route.test.ts`
Expected: PASS.

- [ ] **Step 5: Lint + typecheck web**

Run: `pnpm --filter @cleanstart/web lint && pnpm --filter @cleanstart/web typecheck`
Expected: lint clean, typecheck clean.

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/app/api/revalidate/route.ts apps/web/src/app/api/revalidate/route.test.ts
git commit -m "feat(web): revalidate endpoint supports layoutPaths (full-site purge)"
```

---

## Task 6: `resolvePurge` — pure purge resolver

Pure function (no Payload, no network) so access + path logic is fully unit-tested.

**Files:**
- Create: `apps/cms/src/payload/endpoints/cache-purge.ts`
- Test: `apps/cms/src/payload/endpoints/cache-purge.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// apps/cms/src/payload/endpoints/cache-purge.test.ts
import { describe, expect, it } from 'vitest';

import { resolvePurge } from './cache-purge';

const editor = { roles: ['editor'] };
const admin = { roles: ['admin'] };

describe('resolvePurge', () => {
  it('rejects anonymous users', () => {
    expect(resolvePurge(null, { scope: 'page', collection: 'news', id: '1' }).status).toBe(401);
  });

  it('page: editor allowed, resolves listing + detail', () => {
    const r = resolvePurge(editor, { scope: 'page', collection: 'news', id: '1' });
    expect(r.status).toBe(200);
    expect(r.request).toEqual({ paths: ['/news', '/news/$SLUG$'] });
    expect(r.needsDoc).toEqual({ collection: 'news', id: '1' });
  });

  it('page: unknown collection → 400', () => {
    expect(resolvePurge(editor, { scope: 'page', collection: 'media', id: '1' }).status).toBe(400);
  });

  it('all: editor forbidden, admin allowed', () => {
    expect(resolvePurge(editor, { scope: 'all' }).status).toBe(403);
    const r = resolvePurge(admin, { scope: 'all' });
    expect(r.status).toBe(200);
    expect(r.request).toEqual({ layoutPaths: ['/'] });
  });

  it('custom: admin only, validates paths', () => {
    expect(resolvePurge(editor, { scope: 'custom', paths: ['/news'] }).status).toBe(403);
    expect(resolvePurge(admin, { scope: 'custom', paths: ['bad'] }).status).toBe(400);
    expect(resolvePurge(admin, { scope: 'custom' }).status).toBe(400); // nothing to purge
    const r = resolvePurge(admin, { scope: 'custom', paths: ['/news'], tags: ['nav'] });
    expect(r.status).toBe(200);
    expect(r.request).toEqual({ paths: ['/news'], tags: ['nav'] });
  });
});
```

Note: `resolvePurge` returns `request` for the page scope with the literal `$SLUG$` placeholder for the detail path, and a `needsDoc` marker; the endpoint (Task 7) loads the doc and substitutes the real slug via `purgePathsForDoc`. This keeps `resolvePurge` pure (no DB).

- [ ] **Step 2: Run to verify failure**

Run: `pnpm --filter @cleanstart/cms exec vitest run src/payload/endpoints/cache-purge.test.ts`
Expected: FAIL — "Failed to resolve import './cache-purge'".

- [ ] **Step 3: Implement the resolver** (top of `cache-purge.ts`)

```ts
// apps/cms/src/payload/endpoints/cache-purge.ts
import type { Endpoint } from 'payload';
import { z } from 'zod';

import { hasRole } from '../access/typed-user';
import type { RevalidateRequest } from '../lib/web-revalidate';
import { revalidateWeb } from '../lib/web-revalidate';
import { isPurgeableCollection, purgePathsForDoc } from '../lib/web-pages';

const json = (data: unknown, init?: ResponseInit): Response =>
  new Response(JSON.stringify(data), {
    ...init,
    headers: { 'content-type': 'application/json', ...(init?.headers ?? {}) },
  });

export const purgeBodySchema = z.discriminatedUnion('scope', [
  z.object({
    scope: z.literal('page'),
    collection: z.string().min(1),
    id: z.union([z.string().min(1), z.number()]),
  }),
  z.object({ scope: z.literal('all') }),
  z.object({
    scope: z.literal('custom'),
    paths: z.array(z.string()).optional(),
    tags: z.array(z.string()).optional(),
  }),
]);

export type PurgeBody = z.infer<typeof purgeBodySchema>;

export interface PurgePlan {
  status: number;
  error?: string;
  /** What to send to revalidateWeb (page-scope detail path holds the $SLUG$ marker). */
  request?: RevalidateRequest;
  /** Page scope: endpoint must load this doc and substitute the real slug. */
  needsDoc?: { collection: string; id: string | number };
}

const PAGE_SLUG_MARKER = '$SLUG$';

/** Pure access + path resolution. No DB, no network. */
export const resolvePurge = (user: unknown, body: PurgeBody): PurgePlan => {
  if (!user) return { status: 401, error: 'unauthorized' };

  if (body.scope === 'page') {
    if (!isPurgeableCollection(body.collection)) {
      return { status: 400, error: 'collection_not_purgeable' };
    }
    const paths = purgePathsForDoc(body.collection, { slug: PAGE_SLUG_MARKER });
    return {
      status: 200,
      request: { paths },
      needsDoc: { collection: body.collection, id: body.id },
    };
  }

  if (body.scope === 'all') {
    if (!hasRole(user, 'admin')) return { status: 403, error: 'forbidden' };
    return { status: 200, request: { layoutPaths: ['/'] } };
  }

  // custom
  if (!hasRole(user, 'admin')) return { status: 403, error: 'forbidden' };
  const paths = (body.paths ?? []).map((p) => p.trim()).filter((p) => p.length > 0);
  const tags = (body.tags ?? []).map((t) => t.trim()).filter((t) => t.length > 0);
  if (paths.length === 0 && tags.length === 0) {
    return { status: 400, error: 'nothing_to_purge' };
  }
  const bad = paths.find((p) => !p.startsWith('/'));
  if (bad) return { status: 400, error: `invalid_path:${bad}` };
  const request: RevalidateRequest = {};
  if (paths.length) request.paths = paths;
  if (tags.length) request.tags = tags;
  return { status: 200, request };
};
```

Note: in the page scope, `purgePathsForDoc(..., { slug: '$SLUG$' })` yields e.g. `['/news', '/news/$SLUG$']`, matching the test.

- [ ] **Step 4: Run to verify pass**

Run: `pnpm --filter @cleanstart/cms exec vitest run src/payload/endpoints/cache-purge.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/cms/src/payload/endpoints/cache-purge.ts apps/cms/src/payload/endpoints/cache-purge.test.ts
git commit -m "feat(cms): pure resolvePurge (access + path planning) for cache purge"
```

---

## Task 7: `cachePurgeEndpoint` + register in config

**Files:**
- Modify: `apps/cms/src/payload/endpoints/cache-purge.ts` (append the Endpoint)
- Modify: `apps/cms/src/payload.config.ts` (register in the config-level `endpoints` array)
- Read first: `apps/cms/src/payload/collections/audit-log.ts` (for the audit-row field names)

- [ ] **Step 1: Read the audit-log schema**

Run: `sed -n '1,80p' apps/cms/src/payload/collections/audit-log.ts`
Note the field names used below (`action`, `actor`, `detail`); adjust the `data` object in Step 2 to the actual field names if they differ. The audit write is wrapped in try/catch so a mismatch can never break a purge.

- [ ] **Step 2: Append the endpoint** to `cache-purge.ts`

```ts
const recordAudit = async (
  payload: { create: (args: unknown) => Promise<unknown>; logger: { warn: (m: string) => void } },
  row: { action: string; actor: number | null; detail: Record<string, unknown> },
): Promise<void> => {
  try {
    await payload.create({ collection: 'audit-log', data: row, overrideAccess: true });
  } catch (err) {
    payload.logger.warn(
      `[cache-purge] audit write failed: ${err instanceof Error ? err.message : String(err)}`,
    );
  }
};

/**
 * POST /api/cache-purge — on-demand ISR cache invalidation from the admin.
 * Config-level (single-segment) endpoint: not shadowed by Payload's REST router.
 * Cookie-authed; role-gated in resolvePurge (page = editor+, all/custom = admin).
 */
export const cachePurgeEndpoint: Endpoint = {
  path: '/cache-purge',
  method: 'post',
  handler: async (req) => {
    let raw: unknown;
    try {
      raw = await req.json?.();
    } catch {
      return json({ ok: false, error: 'invalid_json' }, { status: 400 });
    }
    const parsed = purgeBodySchema.safeParse(raw);
    if (!parsed.success) {
      return json({ ok: false, error: 'invalid_body' }, { status: 400 });
    }

    const plan = resolvePurge(req.user, parsed.data);
    if (plan.status !== 200 || !plan.request) {
      return json({ ok: false, error: plan.error }, { status: plan.status });
    }

    let request = plan.request;
    if (plan.needsDoc) {
      let doc: { slug?: string | null };
      try {
        doc = (await req.payload.findByID({
          collection: plan.needsDoc.collection,
          id: plan.needsDoc.id,
          overrideAccess: true,
          depth: 0,
          draft: true,
        })) as { slug?: string | null };
      } catch {
        return json({ ok: false, error: 'not_found' }, { status: 404 });
      }
      request = { paths: purgePathsForDoc(plan.needsDoc.collection, doc) };
    }

    const result = await revalidateWeb(req.payload, request);

    const actorId =
      req.user && typeof (req.user as { id?: unknown }).id === 'number'
        ? ((req.user as { id: number }).id)
        : null;
    await recordAudit(req.payload, {
      action: 'cache.purge',
      actor: actorId,
      detail: { scope: parsed.data.scope, request, result },
    });

    return json({
      ok: result.ok || result.disabled,
      scope: parsed.data.scope,
      purged: request,
      disabled: result.disabled,
      webStatus: result.status,
    });
  },
};
```

- [ ] **Step 3: Register the endpoint** in `apps/cms/src/payload.config.ts`

Add the import near the other endpoint imports:

```ts
import { cachePurgeEndpoint } from './payload/endpoints/cache-purge';
```

Add `cachePurgeEndpoint` to the config-level `endpoints: [ ... ]` array (the same array that holds sitemaps/robots/search — search for `endpoints:` at config level, around line 424).

- [ ] **Step 4: Typecheck the new files**

Run: `pnpm --filter @cleanstart/cms exec tsc --noEmit 2>&1 | grep -E "cache-purge|payload.config" || echo "no new errors in cache-purge/config"`
Expected: "no new errors in cache-purge/config".

- [ ] **Step 5: Commit**

```bash
git add apps/cms/src/payload/endpoints/cache-purge.ts apps/cms/src/payload.config.ts
git commit -m "feat(cms): cache-purge endpoint wired into config"
```

---

## Task 8: Per-doc button — shared field + component

**Files:**
- Create: `apps/cms/src/payload/fields/purge-page-ui.ts`
- Create: `apps/cms/src/payload/admin/components/cache/PurgePageButton.tsx`

- [ ] **Step 1: Create the shared field**

```ts
// apps/cms/src/payload/fields/purge-page-ui.ts
import type { Field } from 'payload';

/**
 * Sidebar "Purge this page" button. Spread into the `fields` array of every
 * collection in PURGEABLE_COLLECTIONS (web-pages.ts). A `ui` field renders no
 * data — it only mounts the PurgePageButton client component.
 */
export const purgePageUiField: Field = {
  name: 'purgeCache',
  type: 'ui',
  admin: {
    position: 'sidebar',
    components: {
      Field: '@/payload/admin/components/cache/PurgePageButton.tsx#PurgePageButton',
    },
  },
};
```

- [ ] **Step 2: Create the button component**

```tsx
// apps/cms/src/payload/admin/components/cache/PurgePageButton.tsx
'use client';

import { useConfig, useDocumentInfo } from '@payloadcms/ui';
import type { ReactElement } from 'react';
import { useCallback, useState } from 'react';

import { showToast } from '../ToastBus';

interface PurgeResponse {
  ok: boolean;
  purged?: { paths?: string[] };
  disabled?: boolean;
  error?: string;
}

/**
 * "Purge this page" — manually invalidates the apps/web ISR cache for this
 * doc's detail page + its listing. Calls the same-origin /api/cache-purge
 * endpoint (cookie-authed); the revalidate secret never reaches the browser.
 * Disabled until the doc is saved (no id = no page yet).
 */
export const PurgePageButton = (): ReactElement | null => {
  const { id, collectionSlug } = useDocumentInfo();
  const { config } = useConfig();
  const serverURL = config?.serverURL ?? '';
  const [running, setRunning] = useState(false);

  const handleClick = useCallback(async () => {
    if (!id || !collectionSlug) return;
    setRunning(true);
    try {
      const res = await fetch(`${serverURL}/api/cache-purge`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ scope: 'page', collection: collectionSlug, id }),
      });
      const body = (await res.json()) as PurgeResponse;
      if (!res.ok || !body.ok) {
        showToast({ message: `Purge failed: ${body.error ?? `HTTP ${res.status}`}`, type: 'error' });
      } else if (body.disabled) {
        showToast({ message: 'Cache purge is disabled in this environment.', type: 'warning' });
      } else {
        const paths = body.purged?.paths ?? [];
        showToast({
          message: paths.length ? `Purged ${paths.join(', ')}` : 'Nothing to purge for this page.',
          type: 'success',
        });
      }
    } catch (err) {
      showToast({ message: err instanceof Error ? err.message : 'Network error', type: 'error' });
    } finally {
      setRunning(false);
    }
  }, [id, collectionSlug, serverURL]);

  if (!id) {
    return (
      <div className="cs-purge-page cs-purge-page--disabled">
        Save first to enable cache purge.
      </div>
    );
  }

  return (
    <div className="cs-purge-page">
      <button
        type="button"
        className="cs-btn cs-btn--subtle"
        disabled={running}
        onClick={handleClick}
      >
        {running ? 'Purging…' : 'Purge this page'}
      </button>
    </div>
  );
};

export default PurgePageButton;
```

- [ ] **Step 3: Verify the `showToast` import path/signature**

Run: `grep -n "export const showToast" apps/cms/src/payload/admin/components/ToastBus.tsx`
Expected: a `showToast` export taking `{ message, type }`. If the relative path from `components/cache/` differs, fix the import (`../ToastBus`).

- [ ] **Step 4: Commit**

```bash
git add apps/cms/src/payload/fields/purge-page-ui.ts apps/cms/src/payload/admin/components/cache/PurgePageButton.tsx
git commit -m "feat(cms): PurgePageButton + shared purgePageUiField"
```

---

## Task 9: Wire the field into all 12 collections + completeness test + importmap

**Files:**
- Modify (12): `Blogs.ts`, `News.ts`, `Guides.ts`, `Resources.ts`, `Events.ts`, `Jobs.ts`, `KnowledgeBase.ts`, `Legal.ts`, `Authors.ts`, `CaseStudies.ts`, `Webinars.ts`, `PodcastEpisodes.ts` (all under `apps/cms/src/payload/collections/`)
- Create: `apps/cms/src/payload/collections/cache-purge-field.test.ts`
- Modify: `apps/cms/src/app/(payload)/admin/importMap.js` (regenerated)

- [ ] **Step 1: Write the completeness test first**

```ts
// apps/cms/src/payload/collections/cache-purge-field.test.ts
import { describe, expect, it } from 'vitest';

import { PURGEABLE_COLLECTIONS } from '../lib/web-pages';
import { Authors } from './Authors';
import { Blogs } from './Blogs';
import { CaseStudies } from './CaseStudies';
import { Events } from './Events';
import { Guides } from './Guides';
import { Jobs } from './Jobs';
import { KnowledgeBase } from './KnowledgeBase';
import { LegalDocuments } from './Legal';
import { News } from './News';
import { PodcastEpisodes } from './PodcastEpisodes';
import { Resources } from './Resources';
import { Webinars } from './Webinars';

const COLLECTIONS = [
  Blogs, News, Guides, Resources, Events, Jobs,
  KnowledgeBase, LegalDocuments, Authors, CaseStudies, Webinars, PodcastEpisodes,
];

const hasPurgeField = (c: { fields: Array<{ name?: string; type?: string }> }): boolean =>
  c.fields.some((f) => f.type === 'ui' && f.name === 'purgeCache');

describe('cache-purge field coverage', () => {
  it('every PURGEABLE collection config carries the purgeCache ui field', () => {
    const slugs = COLLECTIONS.map((c) => (c as { slug: string }).slug).sort();
    expect(slugs).toEqual(Object.keys(PURGEABLE_COLLECTIONS).sort());
    for (const c of COLLECTIONS) {
      expect(hasPurgeField(c as never)).toBe(true);
    }
  });
});
```

Note: confirm the exact exported name for each collection (e.g. `Legal.ts` exports `LegalDocuments`; `CaseStudies.ts` exports `CaseStudies`). Run `grep -n "export const" apps/cms/src/payload/collections/Legal.ts` etc. if an import fails, and fix the import name.

- [ ] **Step 2: Run to verify failure**

Run: `pnpm --filter @cleanstart/cms exec vitest run src/payload/collections/cache-purge-field.test.ts`
Expected: FAIL — `hasPurgeField` is false for all (field not added yet).

- [ ] **Step 3: Add the field to each of the 12 collections**

In each collection file, add the import:

```ts
import { purgePageUiField } from '../fields/purge-page-ui';
```

…and add `purgePageUiField` as the **last entry** of that collection's top-level `fields: [ ... ]` array (it self-positions to the sidebar). Example for `News.ts`:

```ts
  fields: [
    // …existing fields…
    purgePageUiField,
  ],
```

Do this for all 12. (For `Legal.ts` the exported const is `LegalDocuments`; the field still goes in its `fields` array.)

- [ ] **Step 4: Run the completeness test to verify pass**

Run: `pnpm --filter @cleanstart/cms exec vitest run src/payload/collections/cache-purge-field.test.ts`
Expected: PASS.

- [ ] **Step 5: Regenerate the importMap**

Run: `pnpm --filter @cleanstart/cms generate:importmap`
Expected: `apps/cms/src/app/(payload)/admin/importMap.js` now contains a `PurgePageButton` entry. Verify: `grep -c PurgePageButton apps/cms/src/app/(payload)/admin/importMap.js` → ≥ 1.

- [ ] **Step 6: Commit**

```bash
git add apps/cms/src/payload/collections/*.ts \
        apps/cms/src/payload/collections/cache-purge-field.test.ts \
        "apps/cms/src/app/(payload)/admin/importMap.js"
git commit -m "feat(cms): mount PurgePageButton on all 12 web-facing collections"
```

---

## Task 10: `/admin/cache` page (global + custom + recent purges)

**Files:**
- Create: `apps/cms/src/payload/admin/components/cache/CacheView.tsx`
- Create: `apps/cms/src/payload/admin/components/cache/CacheNavLink.tsx`
- Modify: `apps/cms/src/payload.config.ts` (register view + nav link)
- Modify: `apps/cms/src/app/(payload)/admin/importMap.js` (regenerated)

- [ ] **Step 1: Create the nav link (admin-only)**

```tsx
// apps/cms/src/payload/admin/components/cache/CacheNavLink.tsx
'use client';

import { useAuth } from '@payloadcms/ui';
import type { ReactElement } from 'react';

import { hasRole } from '../../../access/typed-user';

/** Sidebar link to /admin/cache — rendered only for admins. */
export const CacheNavLink = (): ReactElement | null => {
  const { user } = useAuth();
  if (!hasRole(user, 'admin')) return null;
  return (
    <a className="cs-nav-link" href="/admin/cache">
      Cache
    </a>
  );
};

export default CacheNavLink;
```

Note: `hasRole` is isomorphic (pure role check) and safe to import client-side. If lint forbids importing from `access/` into a client component, inline the check: `Array.isArray(user?.roles) && user.roles.includes('admin')`.

- [ ] **Step 2: Create the view** (global purge + custom purge + recent purges)

```tsx
// apps/cms/src/payload/admin/components/cache/CacheView.tsx
'use client';

import { useAuth, useConfig } from '@payloadcms/ui';
import type { ReactElement } from 'react';
import { useCallback, useEffect, useState } from 'react';

import { showToast } from '../ToastBus';

interface PurgeResponse { ok: boolean; purged?: unknown; disabled?: boolean; error?: string }

const isAdmin = (user: unknown): boolean =>
  Array.isArray((user as { roles?: unknown })?.roles) &&
  (user as { roles: string[] }).roles.includes('admin');

export const CacheView = (): ReactElement => {
  const { user } = useAuth();
  const { config } = useConfig();
  const serverURL = config?.serverURL ?? '';
  const [busy, setBusy] = useState(false);
  const [customPaths, setCustomPaths] = useState('');
  const [customTags, setCustomTags] = useState('');
  const [recent, setRecent] = useState<Array<{ id: string | number; createdAt?: string }>>([]);

  const post = useCallback(
    async (payload: Record<string, unknown>) => {
      setBusy(true);
      try {
        const res = await fetch(`${serverURL}/api/cache-purge`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const body = (await res.json()) as PurgeResponse;
        if (!res.ok || !body.ok) {
          showToast({ message: `Purge failed: ${body.error ?? `HTTP ${res.status}`}`, type: 'error' });
        } else if (body.disabled) {
          showToast({ message: 'Cache purge is disabled in this environment.', type: 'warning' });
        } else {
          showToast({ message: 'Purge requested.', type: 'success' });
        }
      } catch (err) {
        showToast({ message: err instanceof Error ? err.message : 'Network error', type: 'error' });
      } finally {
        setBusy(false);
      }
    },
    [serverURL],
  );

  const loadRecent = useCallback(async () => {
    try {
      const res = await fetch(
        `${serverURL}/api/audit-log?where[action][equals]=cache.purge&sort=-createdAt&limit=10&depth=0`,
        { credentials: 'include' },
      );
      const body = (await res.json()) as { docs?: Array<{ id: string | number; createdAt?: string }> };
      setRecent(body.docs ?? []);
    } catch {
      /* non-fatal */
    }
  }, [serverURL]);

  useEffect(() => {
    void loadRecent();
  }, [loadRecent]);

  if (!isAdmin(user)) {
    return <main className="cs-cache"><p>Admins only.</p></main>;
  }

  return (
    <main className="cs-cache" style={{ padding: '1.5rem', maxWidth: 760 }}>
      <h1>Cache</h1>

      <section style={{ marginTop: '1.5rem' }}>
        <h2>Purge entire site</h2>
        <p>Re-renders the whole site on next request (billed ISR writes). Use sparingly.</p>
        <button
          type="button"
          className="cs-btn cs-btn--danger"
          disabled={busy}
          onClick={() => {
            if (window.confirm('Purge the ENTIRE site cache? This re-renders every page.')) {
              void post({ scope: 'all' });
            }
          }}
        >
          Purge entire site
        </button>
      </section>

      <section style={{ marginTop: '2rem' }}>
        <h2>Custom purge</h2>
        <label htmlFor="cs-purge-paths">Paths (one per line, must start with /)</label>
        <textarea
          id="cs-purge-paths"
          value={customPaths}
          onChange={(e) => setCustomPaths(e.target.value)}
          rows={4}
          style={{ width: '100%' }}
        />
        <label htmlFor="cs-purge-tags">Cache tags (comma-separated, optional)</label>
        <input
          id="cs-purge-tags"
          value={customTags}
          onChange={(e) => setCustomTags(e.target.value)}
          style={{ width: '100%' }}
        />
        <button
          type="button"
          className="cs-btn cs-btn--subtle"
          disabled={busy}
          style={{ marginTop: '0.75rem' }}
          onClick={() => {
            const paths = customPaths.split('\n').map((p) => p.trim()).filter(Boolean);
            const tags = customTags.split(',').map((t) => t.trim()).filter(Boolean);
            void post({ scope: 'custom', paths, tags });
          }}
        >
          Purge paths/tags
        </button>
      </section>

      <section style={{ marginTop: '2rem' }}>
        <h2>Recent purges</h2>
        <ul>
          {recent.map((r) => (
            <li key={String(r.id)}>{r.createdAt ?? String(r.id)}</li>
          ))}
          {recent.length === 0 ? <li>No recent purges.</li> : null}
        </ul>
      </section>
    </main>
  );
};

export default CacheView;
```

Note: the "Recent purges" list reads `/api/audit-log`. Confirm the audit-log collection slug is `audit-log` and that `action`/`createdAt` exist (from Task 7 Step 1). If the audit row uses different keys, adjust the `where[...]` query and the rendered field accordingly.

- [ ] **Step 3: Register the view + nav link** in `apps/cms/src/payload.config.ts`

In `admin.components.views`, add (next to `contentInsights`):

```ts
        cache: {
          Component: './payload/admin/components/cache/CacheView.tsx#CacheView',
          path: '/cache',
        },
```

In `admin.components.afterNavLinks`, add:

```ts
        './payload/admin/components/cache/CacheNavLink.tsx#CacheNavLink',
```

- [ ] **Step 4: Regenerate the importMap**

Run: `pnpm --filter @cleanstart/cms generate:importmap`
Expected: `importMap.js` now contains `CacheView` and `CacheNavLink`. Verify: `grep -cE "CacheView|CacheNavLink" "apps/cms/src/app/(payload)/admin/importMap.js"` → ≥ 2.

- [ ] **Step 5: Commit**

```bash
git add apps/cms/src/payload/admin/components/cache/CacheView.tsx \
        apps/cms/src/payload/admin/components/cache/CacheNavLink.tsx \
        apps/cms/src/payload.config.ts \
        "apps/cms/src/app/(payload)/admin/importMap.js"
git commit -m "feat(cms): /admin/cache page — global + custom purge + recent purges"
```

---

## Task 11: Full verification

- [ ] **Step 1: Run the full new test surface**

Run:
```bash
pnpm --filter @cleanstart/cms exec vitest run \
  src/payload/lib/web-pages.test.ts \
  src/payload/lib/web-pages.routes.test.ts \
  src/payload/lib/web-revalidate.test.ts \
  src/payload/endpoints/cache-purge.test.ts \
  src/payload/collections/cache-purge-field.test.ts
pnpm --filter @cleanstart/web exec vitest run src/app/api/revalidate/route.test.ts
```
Expected: all PASS.

- [ ] **Step 2: Lint both packages**

Run: `pnpm --filter @cleanstart/cms lint && pnpm --filter @cleanstart/web lint`
Expected: clean.

- [ ] **Step 3: Typecheck — confirm no NEW errors from this feature**

Run: `pnpm --filter @cleanstart/web typecheck && pnpm --filter @cleanstart/cms exec tsc --noEmit 2>&1 | grep -vE "check-broken-links|broken-links/scan" | grep "error TS" || echo "no new cms type errors"`
Expected: web clean; cms prints "no new cms type errors" (the pre-existing broken-links errors are filtered out and are not part of this work).

- [ ] **Step 4: Build web (the change that ships to apps/web)**

Run: `pnpm --filter @cleanstart/web build` (needs a reachable CMS — see `docs/web/WEB-PRODUCTION.md` / the "web build needs prod CMS" note; run a prod CMS on port 3100 if the dev CMS times out).
Expected: build succeeds. If the build is blocked purely by CMS connectivity (not by this code), record that and rely on lint+typecheck+unit tests for this API-route change.

- [ ] **Step 5: Manual smoke test against a running CMS (local)**

Start the CMS dev server, log in, open any News doc, click **Purge this page** → expect a success toast naming `/news` + `/news/<slug>` (or a "disabled in this environment" toast if `WEB_REVALIDATE_*` are unset locally — that is also a pass). Open `/admin/cache` as an admin → the page renders with the three sections; as a non-admin the nav link is hidden.

- [ ] **Step 6: Staging verification matrix (post-deploy)**

After both apps deploy to staging, for each collection edit a doc, click **Purge this page**, then:
`curl -sI https://<staging-host><url> | grep -iE '^age:|x-vercel-cache'`
Expect `age` to reset to ~0 (or `MISS` then `HIT`) and the edit to be live immediately. Cover: blogs, news, guides, resources (`/resource-center`), events (`/events`), jobs (`/careers`), knowledgeBase, legalDocuments, authors (`/author/<slug>`), case-studies, webinars, podcastEpisodes. Then test **Purge entire site** and a **custom** purge of `/news`.

- [ ] **Step 7: Final commit (if any lint/typecheck fixes were applied)**

```bash
git add -p   # stage reviewed changes only
git commit -m "chore(cms): cache-purge lint/type fixes"
```

---

## Self-review notes (coverage)

- Per-doc / global / custom buttons → Tasks 8, 10. Access matrix → Task 6 (`resolvePurge`).
- "100% for all pages" → Task 2 map + Task 3 filesystem drift guard + Task 9 completeness test + Task 11 staging matrix.
- `layoutPaths` full-site purge → Tasks 4–5. Honest dev/no-secret + error feedback → Tasks 4, 8.
- Audit "recent purges" → Tasks 7, 10 (best-effort, never blocks a purge).
- importMap regen → Tasks 9, 10. No DB migration required.
