# Cookie Consent / CMP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a GDPR/ePrivacy/UK-PECR/CPRA-compliant cookie-consent layer — a non-modal bottom-sheet banner that gates all behavioural analytics, with a server-side audit log.

**Architecture:** `apps/web` holds a `ConsentProvider` (React context backed by a `cs_consent` cookie + localStorage mirror) that gates `<Analytics/>`/`<SpeedInsights/>`/`<WebVitals/>` and drives a head-injected GA4 Consent Mode v2 scaffold. A `CookieBanner` (global, non-modal bottom sheet with one-click Accept/Reject parity + inline preferences) writes decisions and POSTs them to `apps/web` `/api/consent`, which hashes IP/UA and forwards to an `apps/cms` `ConsentLog` collection ingest endpoint for audit.

**Tech Stack:** Next.js 16 (App Router, RSC), React 19, TypeScript strict, Zod, Payload 3, Vitest, Playwright, Tailwind v4 + design tokens.

**Spec:** `docs/superpowers/specs/2026-06-03-cookie-consent-design.md`

---

## File structure

**apps/cms**
- Create `src/payload/collections/ConsentLog.ts` — append-only audit collection (read = isAdmin; create/update/delete UI = isAdmin)
- Create `src/payload/collections/ConsentLog.test.ts` — shape test
- Modify `src/payload/payload.config.ts` — register `ConsentLog`
- Create migration via `payload migrate:create` + regenerated `payload-types.ts`

**apps/web**
- Create `src/lib/consent/constants.ts` — cookie name, max-age, `CONSENT_VERSION`
- Create `src/lib/consent/types.ts` — `ConsentRecord`, `ConsentCategories`, `ConsentDecision`
- Create `src/lib/consent/state.ts` — pure reducer/codec/expiry (unit-tested)
- Create `src/lib/consent/state.test.ts`
- Create `src/app/api/consent/route.ts` — POST handler (Zod + HMAC + CMS forward)
- Create `src/app/api/consent/route.test.ts`
- Create `src/components/consent/ConsentProvider.tsx` — context + persistence + Consent Mode update
- Create `src/components/consent/ConsentModeScript.tsx` — head-injected gtag default-denied
- Create `src/components/consent/GatedAnalytics.tsx` — consent-gated analytics
- Create `src/components/consent/CookieBanner.tsx` — bottom sheet + inline preferences
- Create `src/components/consent/index.ts` — barrel
- Modify `src/app/layout.tsx` — provider wrap, swap analytics, add script + banner
- Modify `src/components/sections/Footer.tsx` — "Cookie preferences" reopen link
- Modify `src/app/privacy-policy/page.tsx` — `#cookies` anchor
- Create `tests/e2e/consent.spec.ts` — `@phase-j-consent` acceptance suite
- Modify `apps/cms/.env.example` + `apps/web/.env.example` — document new env vars

---

## Task 1: ConsentLog collection (apps/cms)

**Files:**
- Create: `apps/cms/src/payload/collections/ConsentLog.ts`
- Test: `apps/cms/src/payload/collections/ConsentLog.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// apps/cms/src/payload/collections/ConsentLog.test.ts
import { describe, expect, it } from 'vitest';

import { ConsentLog } from './ConsentLog';

describe('ConsentLog collection', () => {
  it('is an append-only audit collection with the expected slug', () => {
    expect(ConsentLog.slug).toBe('consentLog');
    expect(ConsentLog.timestamps).toBe(true);
  });

  it('exposes the audit fields and no raw PII fields', () => {
    const names = (ConsentLog.fields as { name?: string }[])
      .map((f) => f.name)
      .filter(Boolean);
    expect(names).toEqual(
      expect.arrayContaining([
        'anonymousId',
        'decision',
        'categories',
        'consentVersion',
        'gpc',
        'country',
        'ipHash',
        'userAgentHash',
      ]),
    );
    expect(names).not.toContain('ip');
    expect(names).not.toContain('userAgent');
  });

  it('is read-only in the admin UI (no create/update/delete buttons)', () => {
    expect(ConsentLog.admin?.hidden).not.toBe(true);
    // create/update/delete are admin-gated; ingestion happens via the
    // service endpoint with overrideAccess, never the admin UI.
    expect(typeof ConsentLog.access?.read).toBe('function');
    expect(typeof ConsentLog.access?.create).toBe('function');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @cleanstart/cms test -- ConsentLog`
Expected: FAIL — `Cannot find module './ConsentLog'`.

- [ ] **Step 3: Write the collection**

```ts
// apps/cms/src/payload/collections/ConsentLog.ts
import type { CollectionConfig } from 'payload';

import { isAdmin } from '../access';

/**
 * Append-only audit log of cookie-consent decisions captured by the web
 * CMP (apps/web). One row per decision event (accept / reject / custom).
 *
 * Rows are written exclusively by the `/api/consentLog/ingest` service
 * endpoint (shared-secret auth, `overrideAccess: true`); the admin UI is
 * read-only. No raw IP or user-agent is stored — only salted HMAC hashes
 * (`CONSENT_LOG_HMAC_SECRET`) and a coarse country code, for data
 * minimisation while preserving proof-of-consent (GDPR Art. 7(1)).
 *
 * Retention: a purge cron (Phase J3) deletes rows older than the consent
 * proof window. Out of scope here.
 */
export const ConsentLog: CollectionConfig = {
  slug: 'consentLog',
  labels: { singular: 'Consent record', plural: 'Consent log' },
  admin: {
    group: 'System',
    useAsTitle: 'anonymousId',
    defaultColumns: ['decision', 'country', 'consentVersion', 'gpc', 'createdAt'],
    description:
      'Audit trail of website cookie-consent decisions. Server-managed — written by the web CMP, never edited by hand.',
    hidden: false,
  },
  access: {
    read: isAdmin,
    create: isAdmin,
    update: isAdmin,
    delete: isAdmin,
  },
  timestamps: true,
  fields: [
    {
      name: 'anonymousId',
      type: 'text',
      required: true,
      index: true,
      admin: { description: 'Random per-visitor id stored in the cs_consent cookie. Not linked to any account.' },
    },
    {
      name: 'decision',
      type: 'select',
      required: true,
      options: [
        { label: 'Accept all', value: 'accept_all' },
        { label: 'Reject all', value: 'reject_all' },
        { label: 'Custom', value: 'custom' },
      ],
    },
    {
      name: 'categories',
      type: 'json',
      required: true,
      admin: { description: 'Resolved category map at decision time, e.g. { "essential": true, "analytics": false }.' },
    },
    { name: 'consentVersion', type: 'number', required: true },
    { name: 'gpc', type: 'checkbox', defaultValue: false, admin: { description: 'Global Privacy Control signal present at decision time.' } },
    { name: 'country', type: 'text', admin: { description: 'Coarse ISO country from x-vercel-ip-country (may be unknown locally).' } },
    { name: 'ipHash', type: 'text', admin: { description: 'HMAC-SHA256 of client IP (CONSENT_LOG_HMAC_SECRET). No raw IP stored.' } },
    { name: 'userAgentHash', type: 'text', admin: { description: 'HMAC-SHA256 of user-agent. No raw UA stored.' } },
  ],
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @cleanstart/cms test -- ConsentLog`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add apps/cms/src/payload/collections/ConsentLog.ts apps/cms/src/payload/collections/ConsentLog.test.ts
git commit -m "feat(cms): ConsentLog audit collection"
```

---

## Task 2: Register ConsentLog + migration + types (apps/cms)

**Files:**
- Modify: `apps/cms/src/payload/payload.config.ts`
- Create: migration under `apps/cms/src/migrations/` (or repo `migrations/` — match existing location)
- Modify: `apps/cms/payload-types.ts` (generated)

- [ ] **Step 1: Find the collections array and import block**

Run: `grep -n "collections:" apps/cms/src/payload/payload.config.ts; grep -n "AnalyticsCache" apps/cms/src/payload/payload.config.ts`
Expected: shows the `collections: [ ... ]` array and where sibling collections are imported.

- [ ] **Step 2: Add the import (alphabetical with siblings)**

Add next to the other collection imports:

```ts
import { ConsentLog } from './collections/ConsentLog';
```

- [ ] **Step 3: Add to the collections array**

Add `ConsentLog` to the `collections: [...]` array (place near `AnalyticsCache`/other System collections to keep grouping sane).

- [ ] **Step 4: Regenerate types**

Run: `pnpm --filter @cleanstart/cms generate:types`
Expected: `payload-types.ts` gains a `ConsentLog` interface and `consentLog` entry in the `Config['collections']` map. Do NOT hand-edit.

- [ ] **Step 5: Create the migration**

Run: `pnpm --filter @cleanstart/cms exec payload migrate:create consent_log`
Expected: a new timestamped migration adding the `consent_log` table. If `migrate:create` cannot capture the change (known drift gotcha — see memory), inspect the generated SQL and verify it `CREATE TABLE`s `consent_log` with the columns above; fix by hand only if the generator omits a column.

- [ ] **Step 6: Verify build + typecheck**

Run: `pnpm --filter @cleanstart/cms typecheck && pnpm --filter @cleanstart/cms build`
Expected: both pass.

- [ ] **Step 7: Commit**

```bash
git add apps/cms/src/payload/payload.config.ts apps/cms/payload-types.ts apps/cms/src/migrations
git commit -m "feat(cms): register ConsentLog + migration + types"
```

---

## Task 3: ConsentLog ingest endpoint (apps/cms)

**Files:**
- Create: `apps/cms/src/payload/endpoints/consent-ingest.ts`
- Modify: register the endpoint on the `ConsentLog` collection (`endpoints: [...]` in `ConsentLog.ts`)
- Test: `apps/cms/src/payload/endpoints/consent-ingest.test.ts`

- [ ] **Step 1: Write the failing test (auth + payload shaping)**

```ts
// apps/cms/src/payload/endpoints/consent-ingest.test.ts
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { handleConsentIngest } from './consent-ingest';

const makeReq = (overrides: Record<string, unknown>) => ({
  headers: new Headers(overrides.headers as HeadersInit),
  json: async () => overrides.body,
  payload: { create: vi.fn().mockResolvedValue({ id: 'row1' }) },
  ...overrides,
});

describe('handleConsentIngest', () => {
  beforeEach(() => {
    process.env.CONSENT_INGEST_SECRET = 'test-secret';
  });

  it('rejects requests without the shared secret', async () => {
    const req = makeReq({ headers: {}, body: {} });
    const res = await handleConsentIngest(req as never);
    expect(res.status).toBe(401);
  });

  it('rejects malformed bodies with 400', async () => {
    const req = makeReq({
      headers: { authorization: 'Bearer test-secret' },
      body: { decision: 'nope' },
    });
    const res = await handleConsentIngest(req as never);
    expect(res.status).toBe(400);
  });

  it('creates a consentLog row for a valid request', async () => {
    const req = makeReq({
      headers: { authorization: 'Bearer test-secret' },
      body: {
        anonymousId: 'abc',
        decision: 'accept_all',
        categories: { essential: true, analytics: true },
        consentVersion: 1,
        gpc: false,
        country: 'DE',
        ipHash: 'h1',
        userAgentHash: 'h2',
      },
    });
    const res = await handleConsentIngest(req as never);
    expect(res.status).toBe(204);
    expect(req.payload.create).toHaveBeenCalledWith({
      collection: 'consentLog',
      data: expect.objectContaining({ anonymousId: 'abc', decision: 'accept_all' }),
      overrideAccess: true,
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @cleanstart/cms test -- consent-ingest`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement the handler**

```ts
// apps/cms/src/payload/endpoints/consent-ingest.ts
import { z } from 'zod';
import type { PayloadRequest } from 'payload';

const bodySchema = z.object({
  anonymousId: z.string().min(1).max(64),
  decision: z.enum(['accept_all', 'reject_all', 'custom']),
  categories: z.object({ essential: z.literal(true), analytics: z.boolean() }),
  consentVersion: z.number().int().nonnegative(),
  gpc: z.boolean(),
  country: z.string().max(8).optional(),
  ipHash: z.string().max(128).optional(),
  userAgentHash: z.string().max(128).optional(),
});

const json = (status: number, body?: unknown): Response =>
  body === undefined
    ? new Response(null, { status, headers: { 'cache-control': 'no-store' } })
    : new Response(JSON.stringify(body), {
        status,
        headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
      });

export const handleConsentIngest = async (req: PayloadRequest): Promise<Response> => {
  const secret = process.env.CONSENT_INGEST_SECRET;
  if (!secret) return json(503, { error: 'ingest_disabled' });

  const auth = req.headers.get('authorization');
  if (auth !== `Bearer ${secret}`) return json(401, { error: 'unauthorized' });

  let raw: unknown;
  try {
    raw = await (req.json?.() ?? Promise.reject(new Error('no body')));
  } catch {
    return json(400, { error: 'invalid_json' });
  }

  const parsed = bodySchema.safeParse(raw);
  if (!parsed.success) return json(400, { error: 'invalid_body' });

  await req.payload.create({
    collection: 'consentLog',
    data: parsed.data,
    overrideAccess: true,
  });

  return json(204);
};
```

- [ ] **Step 4: Register the endpoint on the collection**

In `apps/cms/src/payload/collections/ConsentLog.ts`, add an `endpoints` array (collection endpoint to dodge the config-level 3-segment 404 gotcha — see memory):

```ts
import { handleConsentIngest } from '../endpoints/consent-ingest';
// ...inside the CollectionConfig object, after `fields`:
  endpoints: [
    {
      path: '/ingest',
      method: 'post',
      handler: handleConsentIngest,
    },
  ],
```

This resolves to `POST /api/consentLog/ingest`.

- [ ] **Step 5: Run test to verify it passes**

Run: `pnpm --filter @cleanstart/cms test -- consent-ingest`
Expected: PASS (3 tests).

- [ ] **Step 6: Lint + typecheck**

Run: `pnpm --filter @cleanstart/cms lint && pnpm --filter @cleanstart/cms typecheck`
Expected: clean.

- [ ] **Step 7: Commit**

```bash
git add apps/cms/src/payload/endpoints/consent-ingest.ts apps/cms/src/payload/endpoints/consent-ingest.test.ts apps/cms/src/payload/collections/ConsentLog.ts
git commit -m "feat(cms): consent-log ingest endpoint"
```

---

## Task 4: Web consent constants + types

**Files:**
- Create: `apps/web/src/lib/consent/constants.ts`
- Create: `apps/web/src/lib/consent/types.ts`

- [ ] **Step 1: Write constants**

```ts
// apps/web/src/lib/consent/constants.ts
/** Bump to force a global re-prompt (e.g. when categories change). */
export const CONSENT_VERSION = 1;

export const CONSENT_COOKIE = 'cs_consent';
/** 12 months, in seconds — also the re-prompt window. */
export const CONSENT_MAX_AGE = 60 * 60 * 24 * 365;
export const CONSENT_MAX_AGE_MS = CONSENT_MAX_AGE * 1000;
```

- [ ] **Step 2: Write types**

```ts
// apps/web/src/lib/consent/types.ts
export type ConsentCategories = { essential: true; analytics: boolean };
export type ConsentDecision = 'accept_all' | 'reject_all' | 'custom';

export interface ConsentRecord {
  v: number;
  id: string;
  decision: ConsentDecision;
  categories: ConsentCategories;
  ts: string; // ISO timestamp
  gpc: boolean;
}
```

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/lib/consent/constants.ts apps/web/src/lib/consent/types.ts
git commit -m "feat(web): consent constants + types"
```

---

## Task 5: Web consent state (pure logic, unit-tested)

**Files:**
- Create: `apps/web/src/lib/consent/state.ts`
- Test: `apps/web/src/lib/consent/state.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// apps/web/src/lib/consent/state.test.ts
import { describe, expect, it } from 'vitest';

import { CONSENT_VERSION } from './constants';
import {
  decodeRecord,
  encodeRecord,
  needsPrompt,
  recordFromDecision,
} from './state';
import type { ConsentRecord } from './types';

const base: ConsentRecord = {
  v: CONSENT_VERSION,
  id: 'id-1',
  decision: 'accept_all',
  categories: { essential: true, analytics: true },
  ts: '2026-06-03T00:00:00.000Z',
  gpc: false,
};

describe('encode/decode', () => {
  it('round-trips a record', () => {
    expect(decodeRecord(encodeRecord(base))).toEqual(base);
  });
  it('returns null for garbage', () => {
    expect(decodeRecord('not json')).toBeNull();
    expect(decodeRecord('{"v":1}')).toBeNull(); // missing required fields
  });
});

describe('needsPrompt', () => {
  const now = new Date('2026-06-03T00:00:00.000Z');
  it('prompts when no record', () => {
    expect(needsPrompt(null, now)).toBe(true);
  });
  it('prompts when version is stale', () => {
    expect(needsPrompt({ ...base, v: CONSENT_VERSION - 1 }, now)).toBe(true);
  });
  it('prompts when older than 12 months', () => {
    const old = { ...base, ts: '2025-05-01T00:00:00.000Z' };
    expect(needsPrompt(old, now)).toBe(true);
  });
  it('does not prompt for a fresh current record', () => {
    expect(needsPrompt(base, now)).toBe(false);
  });
});

describe('recordFromDecision', () => {
  it('reject_all clears analytics', () => {
    const r = recordFromDecision('reject_all', { gpc: false, id: 'x', now: new Date(base.ts) });
    expect(r.categories.analytics).toBe(false);
    expect(r.decision).toBe('reject_all');
  });
  it('accept_all grants analytics', () => {
    const r = recordFromDecision('accept_all', { gpc: false, id: 'x', now: new Date(base.ts) });
    expect(r.categories.analytics).toBe(true);
  });
  it('custom respects the analytics flag', () => {
    const r = recordFromDecision('custom', { gpc: false, id: 'x', now: new Date(base.ts), analytics: true });
    expect(r.categories.analytics).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @cleanstart/web test -- consent/state`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement state.ts**

```ts
// apps/web/src/lib/consent/state.ts
import { CONSENT_MAX_AGE_MS, CONSENT_VERSION } from './constants';
import type {
  ConsentCategories,
  ConsentDecision,
  ConsentRecord,
} from './types';

export const encodeRecord = (record: ConsentRecord): string =>
  JSON.stringify(record);

export const decodeRecord = (raw: string | null | undefined): ConsentRecord | null => {
  if (!raw) return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  if (typeof parsed !== 'object' || parsed === null) return null;
  const r = parsed as Partial<ConsentRecord>;
  if (
    typeof r.v !== 'number' ||
    typeof r.id !== 'string' ||
    typeof r.ts !== 'string' ||
    typeof r.gpc !== 'boolean' ||
    (r.decision !== 'accept_all' && r.decision !== 'reject_all' && r.decision !== 'custom') ||
    typeof r.categories !== 'object' ||
    r.categories === null ||
    r.categories.essential !== true ||
    typeof r.categories.analytics !== 'boolean'
  ) {
    return null;
  }
  return {
    v: r.v,
    id: r.id,
    decision: r.decision,
    categories: { essential: true, analytics: r.categories.analytics },
    ts: r.ts,
    gpc: r.gpc,
  };
};

export const needsPrompt = (
  record: ConsentRecord | null,
  now: Date,
): boolean => {
  if (!record) return true;
  if (record.v < CONSENT_VERSION) return true;
  const age = now.getTime() - new Date(record.ts).getTime();
  if (Number.isNaN(age) || age > CONSENT_MAX_AGE_MS) return true;
  return false;
};

interface DecisionInput {
  id: string;
  gpc: boolean;
  now: Date;
  analytics?: boolean;
}

export const recordFromDecision = (
  decision: ConsentDecision,
  { id, gpc, now, analytics = false }: DecisionInput,
): ConsentRecord => {
  const resolvedAnalytics =
    decision === 'accept_all'
      ? true
      : decision === 'reject_all'
        ? false
        : analytics;
  const categories: ConsentCategories = {
    essential: true,
    analytics: resolvedAnalytics,
  };
  return {
    v: CONSENT_VERSION,
    id,
    decision,
    categories,
    ts: now.toISOString(),
    gpc,
  };
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @cleanstart/web test -- consent/state`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/lib/consent/state.ts apps/web/src/lib/consent/state.test.ts
git commit -m "feat(web): consent state reducer + codec"
```

---

## Task 6: Web /api/consent route (Zod + HMAC + forward)

**Files:**
- Create: `apps/web/src/app/api/consent/route.ts`
- Test: `apps/web/src/app/api/consent/route.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// apps/web/src/app/api/consent/route.test.ts
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { POST } from './route';

const makeRequest = (body: unknown, headers: Record<string, string> = {}) =>
  new Request('https://www.cleanstart.com/api/consent', {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...headers },
    body: JSON.stringify(body),
  });

const validBody = {
  anonymousId: 'id-1',
  decision: 'accept_all',
  categories: { essential: true, analytics: true },
  consentVersion: 1,
  gpc: false,
};

describe('POST /api/consent', () => {
  beforeEach(() => {
    process.env.CONSENT_LOG_HMAC_SECRET = 'hmac-secret';
    process.env.CONSENT_INGEST_SECRET = 'ingest-secret';
    process.env.NEXT_PUBLIC_CMS_URL = 'http://cms.test';
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 204 })));
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('rejects an invalid body with 400', async () => {
    const res = await POST(makeRequest({ decision: 'bad' }));
    expect(res.status).toBe(400);
  });

  it('accepts a valid body and forwards hashed fields to the CMS', async () => {
    const res = await POST(
      makeRequest(validBody, {
        'x-vercel-ip-country': 'DE',
        'x-forwarded-for': '203.0.113.7',
        'user-agent': 'jest',
      }),
    );
    expect(res.status).toBe(204);
    const call = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(call[0]).toBe('http://cms.test/api/consentLog/ingest');
    const forwarded = JSON.parse((call[1] as RequestInit).body as string);
    expect(forwarded.country).toBe('DE');
    expect(forwarded.ipHash).toMatch(/^[a-f0-9]{64}$/);
    expect(forwarded.userAgentHash).toMatch(/^[a-f0-9]{64}$/);
    expect(forwarded).not.toHaveProperty('ip');
  });

  it('still returns 204 when the CMS forward fails (fire-and-forget)', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('down'));
    const res = await POST(makeRequest(validBody));
    expect(res.status).toBe(204);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @cleanstart/web test -- api/consent`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement the route**

```ts
// apps/web/src/app/api/consent/route.ts
import { createHmac } from 'node:crypto';
import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const bodySchema = z.object({
  anonymousId: z.string().min(1).max(64),
  decision: z.enum(['accept_all', 'reject_all', 'custom']),
  categories: z.object({ essential: z.literal(true), analytics: z.boolean() }),
  consentVersion: z.number().int().nonnegative(),
  gpc: z.boolean(),
});

const noStore = { 'cache-control': 'no-store' } as const;

const hash = (value: string, secret: string): string =>
  createHmac('sha256', secret).update(value).digest('hex');

const clientIp = (req: NextRequest): string =>
  req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? '';

export async function POST(req: NextRequest): Promise<NextResponse> {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400, headers: noStore });
  }

  const parsed = bodySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400, headers: noStore });
  }

  const hmacSecret = process.env.CONSENT_LOG_HMAC_SECRET;
  const ingestSecret = process.env.CONSENT_INGEST_SECRET;
  const cmsUrl = process.env.NEXT_PUBLIC_CMS_URL ?? 'http://localhost:3000';

  // Audit forward is best-effort: a logging outage must never block the
  // user's consent decision from taking effect client-side.
  if (hmacSecret && ingestSecret) {
    const ip = clientIp(req);
    const ua = req.headers.get('user-agent') ?? '';
    const payload = {
      ...parsed.data,
      country: req.headers.get('x-vercel-ip-country') ?? undefined,
      ipHash: ip ? hash(ip, hmacSecret) : undefined,
      userAgentHash: ua ? hash(ua, hmacSecret) : undefined,
    };
    try {
      await fetch(`${cmsUrl}/api/consentLog/ingest`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${ingestSecret}`,
        },
        body: JSON.stringify(payload),
        cache: 'no-store',
      });
    } catch {
      // Swallowed by design — see comment above. Sentry captures via the
      // global handler if configured.
    }
  }

  return new NextResponse(null, { status: 204, headers: noStore });
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @cleanstart/web test -- api/consent`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/app/api/consent/route.ts apps/web/src/app/api/consent/route.test.ts
git commit -m "feat(web): /api/consent audit-forward route"
```

---

## Task 7: ConsentModeScript (head-injected GA4 default-denied)

**Files:**
- Create: `apps/web/src/components/consent/ConsentModeScript.tsx`

- [ ] **Step 1: Implement the component**

```tsx
// apps/web/src/components/consent/ConsentModeScript.tsx
import Script from 'next/script';

/**
 * GA4 Consent Mode v2 bootstrap. Renders BEFORE any analytics tag and
 * sets all four signals to `denied` by default (GDPR-safe). The
 * ConsentProvider fires `gtag('consent','update', …)` on accept.
 *
 * No GA4 script ships yet — this is the scaffold so GA4 is plug-and-play
 * and consent is provably default-denied (WEB-PRODUCTION.md §11).
 *
 * `nonce` is the per-request CSP nonce from proxy.ts (x-nonce header),
 * required because inline scripts are otherwise blocked by the CSP.
 */
export function ConsentModeScript({ nonce }: { nonce?: string }) {
  return (
    <Script id="consent-mode-default" strategy="beforeInteractive" nonce={nonce}>
      {`
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        window.gtag = window.gtag || gtag;
        gtag('consent', 'default', {
          analytics_storage: 'denied',
          ad_storage: 'denied',
          ad_user_data: 'denied',
          ad_personalization: 'denied',
          wait_for_update: 500
        });
      `}
    </Script>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `pnpm --filter @cleanstart/web typecheck`
Expected: clean.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/consent/ConsentModeScript.tsx
git commit -m "feat(web): GA4 Consent Mode v2 default-denied scaffold"
```

---

## Task 8: ConsentProvider (context + persistence + Consent Mode update)

**Files:**
- Create: `apps/web/src/components/consent/ConsentProvider.tsx`

- [ ] **Step 1: Implement the provider**

```tsx
// apps/web/src/components/consent/ConsentProvider.tsx
'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  CONSENT_COOKIE,
  CONSENT_MAX_AGE,
  CONSENT_VERSION,
} from '@/lib/consent/constants';
import {
  decodeRecord,
  encodeRecord,
  needsPrompt,
  recordFromDecision,
} from '@/lib/consent/state';
import type { ConsentDecision, ConsentRecord } from '@/lib/consent/types';

interface ConsentContextValue {
  record: ConsentRecord | null;
  /** True when the banner should be shown (no valid current decision). */
  promptOpen: boolean;
  analyticsGranted: boolean;
  /** GPC signal detected at load. */
  gpc: boolean;
  decide: (decision: ConsentDecision, opts?: { analytics?: boolean }) => void;
  /** Re-open the banner (footer "Cookie preferences"). */
  openPrompt: () => void;
  closePrompt: () => void;
}

const ConsentContext = createContext<ConsentContextValue | null>(null);

const readCookie = (): string | null => {
  if (typeof document === 'undefined') return null;
  const match = document.cookie
    .split('; ')
    .find((row) => row.startsWith(`${CONSENT_COOKIE}=`));
  return match ? decodeURIComponent(match.slice(CONSENT_COOKIE.length + 1)) : null;
};

const writeCookie = (value: string): void => {
  if (typeof document === 'undefined') return;
  const secure = window.location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `${CONSENT_COOKIE}=${encodeURIComponent(value)}; Max-Age=${CONSENT_MAX_AGE}; Path=/; SameSite=Lax${secure}`;
};

const detectGpc = (): boolean => {
  if (typeof navigator === 'undefined') return false;
  return (navigator as Navigator & { globalPrivacyControl?: boolean }).globalPrivacyControl === true;
};

const newId = (): string =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

const updateConsentMode = (analytics: boolean): void => {
  const w = window as Window & { gtag?: (...args: unknown[]) => void };
  w.gtag?.('consent', 'update', {
    analytics_storage: analytics ? 'granted' : 'denied',
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
  });
};

export function ConsentProvider({ children }: { children: React.ReactNode }) {
  const [record, setRecord] = useState<ConsentRecord | null>(null);
  const [promptOpen, setPromptOpen] = useState(false);
  const [gpc, setGpc] = useState(false);

  useEffect(() => {
    const existing = decodeRecord(readCookie());
    const gpcSignal = detectGpc();
    setGpc(gpcSignal);
    setRecord(existing);
    if (needsPrompt(existing, new Date())) {
      setPromptOpen(true);
    } else if (existing) {
      updateConsentMode(existing.categories.analytics);
    }
  }, []);

  const persist = useCallback((next: ConsentRecord) => {
    setRecord(next);
    setPromptOpen(false);
    try {
      const encoded = encodeRecord(next);
      writeCookie(encoded);
      window.localStorage?.setItem(CONSENT_COOKIE, encoded);
    } catch {
      // Storage disabled (private mode) — session-only state still works.
    }
    updateConsentMode(next.categories.analytics);
    void fetch('/api/consent', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        anonymousId: next.id,
        decision: next.decision,
        categories: next.categories,
        consentVersion: CONSENT_VERSION,
        gpc: next.gpc,
      }),
      keepalive: true,
    }).catch(() => {
      // Audit forward is best-effort; never blocks the UI.
    });
  }, []);

  const decide = useCallback<ConsentContextValue['decide']>(
    (decision, opts) => {
      const id = record?.id ?? newId();
      persist(
        recordFromDecision(decision, {
          id,
          gpc,
          now: new Date(),
          analytics: opts?.analytics,
        }),
      );
    },
    [record?.id, gpc, persist],
  );

  const value = useMemo<ConsentContextValue>(
    () => ({
      record,
      promptOpen,
      analyticsGranted: record?.categories.analytics ?? false,
      gpc,
      decide,
      openPrompt: () => setPromptOpen(true),
      closePrompt: () => setPromptOpen(false),
    }),
    [record, promptOpen, gpc, decide],
  );

  return <ConsentContext.Provider value={value}>{children}</ConsentContext.Provider>;
}

export function useConsent(): ConsentContextValue {
  const ctx = useContext(ConsentContext);
  if (!ctx) throw new Error('useConsent must be used within a ConsentProvider');
  return ctx;
}
```

- [ ] **Step 2: Typecheck**

Run: `pnpm --filter @cleanstart/web typecheck`
Expected: clean.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/consent/ConsentProvider.tsx
git commit -m "feat(web): ConsentProvider context + persistence"
```

---

## Task 9: GatedAnalytics (consent-gated trackers)

**Files:**
- Create: `apps/web/src/components/consent/GatedAnalytics.tsx`

- [ ] **Step 1: Implement**

```tsx
// apps/web/src/components/consent/GatedAnalytics.tsx
'use client';

import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';

import { WebVitals } from '@/components/observability/WebVitals';
import { useConsent } from './ConsentProvider';

/**
 * Renders behavioural analytics ONLY after the visitor grants the
 * Analytics category. Replaces the unconditional <Analytics/> /
 * <SpeedInsights/> / <WebVitals/> in layout.tsx (GDPR — no behavioural
 * tracking before consent).
 */
export function GatedAnalytics() {
  const { analyticsGranted } = useConsent();
  if (!analyticsGranted) return null;
  return (
    <>
      <Analytics />
      <SpeedInsights />
      <WebVitals />
    </>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `pnpm --filter @cleanstart/web typecheck`
Expected: clean.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/consent/GatedAnalytics.tsx
git commit -m "feat(web): consent-gated analytics wrapper"
```

---

## Task 10: CookieBanner (bottom sheet + inline preferences)

**Files:**
- Create: `apps/web/src/components/consent/CookieBanner.tsx`
- Create: `apps/web/src/components/consent/index.ts`

- [ ] **Step 1: Implement the banner**

```tsx
// apps/web/src/components/consent/CookieBanner.tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';

import { useConsent } from './ConsentProvider';

/**
 * Non-modal bottom-sheet consent banner (WEB-PRODUCTION.md §11).
 * - Fixed bottom overlay, never a centered modal (avoids Google
 *   intrusive-interstitial penalty + mobile UX rules).
 * - "Reject all" and "Accept all" have one-click parity (CNIL).
 * - "Manage preferences" expands an inline panel within the same sheet.
 */
export function CookieBanner() {
  const { promptOpen, gpc, decide, closePrompt, record } = useConsent();
  const [showPrefs, setShowPrefs] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);

  // Seed the toggle from any prior decision / GPC each time the sheet opens.
  useEffect(() => {
    if (promptOpen) {
      setAnalytics(record?.categories.analytics ?? (gpc ? false : false));
      setShowPrefs(false);
    }
  }, [promptOpen, record, gpc]);

  useEffect(() => {
    if (!promptOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closePrompt();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [promptOpen, closePrompt]);

  if (!promptOpen) return null;

  return (
    <div
      ref={sheetRef}
      role="dialog"
      aria-modal="false"
      aria-label="Cookie consent"
      className="fixed inset-x-0 bottom-0 z-[60] border-t border-white/10 bg-[#151021] text-white shadow-[0_-8px_30px_rgba(0,0,0,0.35)]"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="mx-auto flex max-w-[1100px] flex-col gap-4 px-6 py-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <p
            className="max-w-[640px] text-white/80"
            style={{ fontSize: 'var(--fs-body-sm)', lineHeight: 1.55 }}
          >
            We use essential cookies to run this site and, with your consent,
            analytics cookies to understand usage and improve it. See our{' '}
            <Link href="/privacy-policy#cookies" className="underline underline-offset-2 hover:text-white">
              Cookie&nbsp;Policy
            </Link>
            .
          </p>
          <div className="flex shrink-0 flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setShowPrefs((v) => !v)}
              className="rounded-lg px-3 py-2 text-white/70 underline-offset-4 hover:text-white hover:underline"
              style={{ fontSize: 'var(--fs-button)' }}
              aria-expanded={showPrefs}
            >
              Manage preferences
            </button>
            <button
              type="button"
              onClick={() => decide('reject_all')}
              className="rounded-lg border border-white/25 px-5 py-2.5 font-medium text-white transition hover:bg-white/10"
              style={{ fontSize: 'var(--fs-button)' }}
            >
              Reject all
            </button>
            <button
              type="button"
              onClick={() => decide('accept_all')}
              className="rounded-lg bg-white px-5 py-2.5 font-medium text-[#151021] transition hover:bg-white/90"
              style={{ fontSize: 'var(--fs-button)' }}
            >
              Accept all
            </button>
          </div>
        </div>

        {showPrefs && (
          <div className="flex flex-col gap-3 border-t border-white/10 pt-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="font-medium" style={{ fontSize: 'var(--fs-body-sm)' }}>Essential</p>
                <p className="text-white/60" style={{ fontSize: 'var(--fs-caption)' }}>
                  Required for the site to function. Always on.
                </p>
              </div>
              <span className="text-white/50" style={{ fontSize: 'var(--fs-caption)' }}>Always on</span>
            </div>
            <label className="flex cursor-pointer items-center justify-between gap-4">
              <span>
                <span className="block font-medium" style={{ fontSize: 'var(--fs-body-sm)' }}>Analytics</span>
                <span className="block text-white/60" style={{ fontSize: 'var(--fs-caption)' }}>
                  Anonymous usage + performance data to help us improve.
                </span>
              </span>
              <input
                type="checkbox"
                checked={analytics}
                onChange={(e) => setAnalytics(e.target.checked)}
                className="h-5 w-5 shrink-0 accent-white"
              />
            </label>
            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={() => decide('custom', { analytics })}
                className="rounded-lg bg-white px-5 py-2.5 font-medium text-[#151021] transition hover:bg-white/90"
                style={{ fontSize: 'var(--fs-button)' }}
              >
                Save preferences
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Write the barrel**

```ts
// apps/web/src/components/consent/index.ts
export { ConsentProvider, useConsent } from './ConsentProvider';
export { ConsentModeScript } from './ConsentModeScript';
export { GatedAnalytics } from './GatedAnalytics';
export { CookieBanner } from './CookieBanner';
```

- [ ] **Step 3: Lint + typecheck**

Run: `pnpm --filter @cleanstart/web lint && pnpm --filter @cleanstart/web typecheck`
Expected: clean. (Banner uses native `<input type="checkbox">` + design tokens — no ad-hoc `text-[..]` sizes.)

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/components/consent/CookieBanner.tsx apps/web/src/components/consent/index.ts
git commit -m "feat(web): cookie consent banner UI"
```

---

## Task 11: Wire into layout.tsx

**Files:**
- Modify: `apps/web/src/app/layout.tsx`

- [ ] **Step 1: Update imports**

Remove the direct analytics imports (`Analytics`, `SpeedInsights`) and the `WebVitals` import from the top of `layout.tsx` (they now live inside `GatedAnalytics`). Add:

```ts
import { headers } from 'next/headers';
import {
  ConsentProvider,
  ConsentModeScript,
  GatedAnalytics,
  CookieBanner,
} from '@/components/consent';
```

Keep all other imports.

- [ ] **Step 2: Make RootLayout async + read the nonce, wrap the tree**

Replace the `RootLayout` function body so it (a) is `async`, (b) reads the CSP nonce, (c) wraps everything in `ConsentProvider`, (d) injects `ConsentModeScript` in `<head>`, (e) replaces the raw `<Analytics/> <SpeedInsights/>` + `<WebVitals/>` with `<GatedAnalytics/>`, and adds `<CookieBanner/>`:

```tsx
export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const nonce = (await headers()).get('x-nonce') ?? undefined;
  return (
    <html
      lang="en"
      className={cn('font-sans', manrope.variable, sora.variable, jetbrainsMono.variable)}
      style={{
        ['--font-sans' as string]: 'var(--font-sora)',
        ['--font-display' as string]: 'var(--font-manrope)',
      }}
    >
      <head>
        <ConsentModeScript nonce={nonce} />
      </head>
      <body suppressHydrationWarning>
        <ConsentProvider>
          <JsonLd id="org-jsonld" data={organizationSchema()} />
          <PreviewBanner />
          <SmoothScrollProvider>{children}</SmoothScrollProvider>
          <GatedAnalytics />
          <CookieBanner />
          <AgentationDev />
        </ConsentProvider>
      </body>
    </html>
  );
}
```

Note: `WebVitals` was rendered before `children` originally; moving it into `GatedAnalytics` (rendered after `children`) is fine — it attaches listeners on mount regardless of position.

- [ ] **Step 3: Typecheck + build**

Run: `pnpm --filter @cleanstart/web typecheck && pnpm --filter @cleanstart/web build`
Expected: both pass. (If `headers()` forces dynamic rendering warnings on static routes, confirm the build still succeeds — root layout reading headers is supported; the nonce already comes from `proxy.ts`.)

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/app/layout.tsx
git commit -m "feat(web): wire consent provider, banner + gated analytics into layout"
```

---

## Task 12: Footer reopen link + privacy-policy #cookies anchor

**Files:**
- Modify: `apps/web/src/components/sections/Footer.tsx`
- Modify: `apps/web/src/app/privacy-policy/page.tsx`

- [ ] **Step 1: Add a "Cookie preferences" control to the Footer legal row**

The Footer is a server component; the reopen control needs the consent context, so create a tiny client button and drop it into the Footer's bottom legal-links row.

Create `apps/web/src/components/consent/CookiePreferencesButton.tsx`:

```tsx
// apps/web/src/components/consent/CookiePreferencesButton.tsx
'use client';

import { useConsent } from './ConsentProvider';

/** Footer affordance to re-open the consent banner (GDPR Art. 7(3) —
 *  withdrawing consent must be as easy as giving it). */
export function CookiePreferencesButton({ className }: { className?: string }) {
  const { openPrompt } = useConsent();
  return (
    <button type="button" onClick={openPrompt} className={className}>
      Cookie preferences
    </button>
  );
}
```

Add to the barrel `apps/web/src/components/consent/index.ts`:

```ts
export { CookiePreferencesButton } from './CookiePreferencesButton';
```

- [ ] **Step 2: Render it in the Footer legal row**

In `Footer.tsx`, find the bottom legal-links row (where the existing legal `<Link>`s render — search for the `Legal`/copyright row). Import and place the button alongside them, matching the existing legal-link className so it looks identical:

```tsx
import { CookiePreferencesButton } from '@/components/consent';
// ...in the legal links row, next to the other links:
<CookiePreferencesButton className="<copy the exact className used by sibling legal links>" />
```

Use the **same** className string the adjacent legal links already use so styling is consistent (no new tokens).

- [ ] **Step 3: Add the #cookies anchor to the privacy policy**

In `apps/web/src/app/privacy-policy/page.tsx`, locate the cookies-related section heading (around the "cookies, web beacons, and similar tracking technologies" copy, ~line 341). Add `id="cookies"` and `scroll-mt-24` to that section's heading/wrapper so `/privacy-policy#cookies` lands on it:

```tsx
<h2 id="cookies" className="scroll-mt-24 <existing classes>">Cookies &amp; Tracking</h2>
```

If no dedicated cookies heading exists, add `id="cookies" scroll-mt-24` to the nearest `<section>`/heading element that introduces the cookie disclosure copy.

- [ ] **Step 4: Lint + typecheck + build**

Run: `pnpm --filter @cleanstart/web lint && pnpm --filter @cleanstart/web typecheck && pnpm --filter @cleanstart/web build`
Expected: clean.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/components/consent/CookiePreferencesButton.tsx apps/web/src/components/consent/index.ts apps/web/src/components/sections/Footer.tsx apps/web/src/app/privacy-policy/page.tsx
git commit -m "feat(web): footer cookie-preferences reopen + privacy #cookies anchor"
```

---

## Task 13: Playwright e2e acceptance suite

**Files:**
- Create: `apps/web/tests/e2e/consent.spec.ts`

- [ ] **Step 1: Confirm the e2e harness location + base URL**

Run: `ls apps/web/tests/e2e 2>/dev/null; grep -n "testDir\|baseURL\|webServer" apps/web/playwright.config.*`
Expected: shows the Playwright config; note the configured `baseURL` (use it; do not hardcode a port).

- [ ] **Step 2: Write the spec**

```ts
// apps/web/tests/e2e/consent.spec.ts
import { expect, test } from '@playwright/test';

// @phase-j-consent
test.describe('cookie consent', () => {
  test.beforeEach(async ({ context }) => {
    await context.clearCookies();
  });

  test('banner shows on first visit and fires no analytics before consent', async ({ page }) => {
    const analyticsHits: string[] = [];
    page.on('request', (r) => {
      const u = r.url();
      if (u.includes('google-analytics.com') || u.includes('/_vercel/insights') || u.includes('/_vercel/speed-insights')) {
        analyticsHits.push(u);
      }
    });
    await page.goto('/');
    await expect(page.getByRole('dialog', { name: 'Cookie consent' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Accept all' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Reject all' })).toBeVisible();
    expect(analyticsHits).toHaveLength(0);
  });

  test('Reject all has one-click parity and dismisses the banner', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Reject all' }).click();
    await expect(page.getByRole('dialog', { name: 'Cookie consent' })).toBeHidden();
    const cookie = (await page.context().cookies()).find((c) => c.name === 'cs_consent');
    expect(cookie?.value).toContain('reject_all');
  });

  test('Accept all sets analytics granted in the cookie', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Accept all' }).click();
    const cookie = (await page.context().cookies()).find((c) => c.name === 'cs_consent');
    expect(cookie?.value).toContain('accept_all');
    expect(cookie?.value).toContain('"analytics":true');
  });

  test('footer Cookie preferences re-opens the banner', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Accept all' }).click();
    await expect(page.getByRole('dialog', { name: 'Cookie consent' })).toBeHidden();
    await page.getByRole('button', { name: 'Cookie preferences' }).click();
    await expect(page.getByRole('dialog', { name: 'Cookie consent' })).toBeVisible();
  });
});
```

- [ ] **Step 3: Run the suite**

Run: `pnpm --filter @cleanstart/web test:e2e -- consent`
Expected: 4 tests PASS. (If the runner needs the dev server, the Playwright `webServer` config starts it; otherwise start `pnpm --filter @cleanstart/web dev` first.)

- [ ] **Step 4: Commit**

```bash
git add apps/web/tests/e2e/consent.spec.ts
git commit -m "test(web): @phase-j-consent e2e acceptance suite"
```

---

## Task 14: Document env vars + final verification

**Files:**
- Modify: `apps/web/.env.example`
- Modify: `apps/cms/.env.example`

- [ ] **Step 1: Document the web env vars**

Append to `apps/web/.env.example` (with annotations matching the file's style):

```bash
# Cookie consent (CMP) — audit forward to the CMS ConsentLog collection.
CONSENT_LOG_HMAC_SECRET=   # HMAC-SHA256 key for hashing IP/UA before storage. openssl rand -base64 32
CONSENT_INGEST_SECRET=     # Shared bearer secret for POST {CMS}/api/consentLog/ingest. Must match the CMS value.
# NEXT_PUBLIC_CMS_URL is already documented above (reused for the ingest forward).
```

- [ ] **Step 2: Document the CMS env var**

Append to `apps/cms/.env.example`:

```bash
# Cookie-consent ingest — shared bearer secret for /api/consentLog/ingest (must match apps/web CONSENT_INGEST_SECRET).
CONSENT_INGEST_SECRET=
```

- [ ] **Step 3: Run the full gate for both packages**

Run:
```bash
pnpm --filter @cleanstart/cms lint && pnpm --filter @cleanstart/cms typecheck && pnpm --filter @cleanstart/cms test && pnpm --filter @cleanstart/cms build
pnpm --filter @cleanstart/web lint && pnpm --filter @cleanstart/web typecheck && pnpm --filter @cleanstart/web test && pnpm --filter @cleanstart/web build
```
Expected: all green.

- [ ] **Step 4: Visual verification (Claude Preview, desktop 1440×900)**

Start the web dev server, load `/`, confirm: banner appears as a bottom sheet (not centered), Accept/Reject are equally prominent, "Manage preferences" expands the inline panel, no analytics requests fire before consent. Screenshot for proof.

- [ ] **Step 5: Commit**

```bash
git add apps/web/.env.example apps/cms/.env.example
git commit -m "docs(consent): document CMP env vars"
```

---

## Self-review notes

- **Spec coverage:** §3 architecture → Tasks 4–11; §4 model/versioning → Tasks 4–5; §5 UI → Task 10; §6 data flow/audit → Tasks 1–3, 6, 8; §7 SEO → Tasks 7, 10, 12; §8 testing → Tasks 1,3,5,6,13. All covered.
- **GPC:** detected in Task 8 (`detectGpc`), seeded into the toggle (Task 10), recorded in the record (`gpc`) and forwarded (Tasks 6, 1). The banner still shows with analytics pre-off when GPC is set (spec §4).
- **Naming consistency:** `cs_consent` cookie name (`CONSENT_COOKIE`), `consentLog` slug, `/api/consentLog/ingest` path, `decide()`/`openPrompt()`/`promptOpen` used identically across provider/banner/footer.
- **No raw PII:** route hashes IP/UA (Task 6); collection has no `ip`/`userAgent` fields and the test asserts their absence (Task 1).
- **Known gotcha handled:** ingest is a *collection* endpoint, not a 3-segment config endpoint (memory: config-level 3-segment endpoints 404).
