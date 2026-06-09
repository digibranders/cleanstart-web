# Legal CMS Collection Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move the 8 hardcoded legal pages into a single editable Payload `legal` collection, so editors can update copy, track revisions (Payload versions), and manage publish/effective dates from the CMS — while the existing front-end (persistent layout, inline no-reload nav, sidebar, hero date) renders the content from the CMS REST API.

**Architecture:** A new `legal` Payload collection in `apps/cms` (drafts + versions, same edit access as Blogs/Guides) is the source of truth for each legal document's title, slug, sidebar order, icon key, body (Lexical rich text), and publish/effective dates. `apps/web` fetches it through the existing draft-aware `cms-fetch` ISR client via a new `lib/legal.ts`, renders documents at a dynamic `/legal/[slug]` route, and builds the sidebar + hero date dynamically from the collection. The current static page files are deleted.

**Tech Stack:** Payload 3.81 (`apps/cms`), Next.js 16 App Router + Tailwind v4 (`apps/web`), `@payloadcms/richtext-lexical`, the repo's `htmlToLexical` import helper, `lucide-react`, Vitest.

---

## Process & constraints (read first)

- **Branch:** This is CMS schema work → land on `development` (NOT `farheen`). It touches `apps/cms/`, `migrations/`, and shared `apps/web` layout.
- **Architecture doc:** Add the `legal` collection as a decision in `docs/architecture/cleanstart-cms-architecture.html` (`#new-fields` / `#decisions`) — mirror the wording style of the Integrations entry. Do this in Task 1's commit or a companion docs commit.
- **Access:** Per decision, edit/publish access is the same as other content (`read: () => true`, create/update/delete = `isAdminOrEditor`).
- **Types are generated:** After any collection change run `pnpm --filter @cleanstart/cms generate:types` and commit `apps/cms/src/payload-types.ts`. Never hand-edit it.
- **Migrations:** Never raw SQL. Use Payload's migration runner (`payload migrate:create`).
- **Pre-completion gates (run for the package you touched):**
  - cms: `pnpm --filter @cleanstart/cms lint`, `typecheck`, `test`, `build`
  - web: `pnpm --filter @cleanstart/web lint`, `typecheck`, `build`
- **Reference docs:** `docs/web/WEB-PAGES.md` (update the Legal rows), `apps/web/docs/TYPOGRAPHY-SYSTEM.md` (token usage). Do not introduce ad-hoc font sizes.

## Naming & slug contract (locked — used across all tasks)

The collection `slug` is `legal`. Document slugs and sidebar order:

| order | title | doc slug | icon key |
|---|---|---|---|
| 1 | Additional Third-Party Terms | `additional-third-party-terms` | `FileText` |
| 2 | Customer Data Processing Addendum | `customer-data-processing-addendum` | `FileLock2` |
| 3 | Limited Use Agreement | `limited-use-agreement` | `ScrollText` |
| 4 | Policies and Commitments | `policies-and-commitments` | `BadgeCheck` |
| 5 | Pre-General Availability Terms | `pre-general-availability-terms` | `FileCheck2` |
| 6 | Trademark Usage Policy | `trademark-usage-policy` | `Stamp` |
| 7 | Vulnerability Disclosure Policies | `vulnerability-disclosure-policies` | `Bug` |
| 8 | Acceptable Use Policy | `acceptable-use-policy` | `Scale` |

**Routing decision:** all documents live at `/legal/<doc-slug>`. The bare `/legal` route **redirects** to the lowest-`order` published doc (`/legal/additional-third-party-terms`). This keeps one canonical URL per document (no duplicate content) and preserves the existing inline sidebar UX. Old static URLs that change (`/legal` → `/legal/additional-third-party-terms`) are non-indexed today (apps/web is pre-launch), so no redirect backfill is required; future slug edits are covered by `slugChangeRedirectHook`.

**Icon allow-list (single source, used by CMS select + web map):** `FileText`, `FileLock2`, `ScrollText`, `BadgeCheck`, `FileCheck2`, `Stamp`, `Bug`, `Scale`, `FileSignature`, `ShieldCheck`. (The last two are spare options for future docs.)

---

## File Structure

**Create:**
- `apps/cms/src/payload/collections/Legal.ts` — the collection config.
- `apps/cms/src/payload/collections/Legal.test.ts` — schema-surface assertion for the collection.
- `apps/cms/scripts/data/legal-seed.ts` — the 8 documents as `{ title, slug, order, icon, html }` (content source of truth for seeding).
- `apps/cms/scripts/seed-legal.ts` — idempotent local-API seeder using `htmlToLexical`.
- `apps/web/src/lib/legal.ts` — draft-aware fetchers + types (mirrors `lib/guides.ts`).
- `apps/web/src/lib/legal.test.ts` — unit test for the icon-key guard + date formatter.
- `apps/web/src/components/sections/legal/legalIcons.ts` — icon-key → lucide component map (shared by sidebar).
- `apps/web/src/app/legal/[slug]/page.tsx` — dynamic document route.
- `apps/web/src/app/preview/legal/[slug]/page.tsx` — draft preview route (parity with other collections).

**Modify:**
- `apps/cms/src/payload.config.ts` — register `Legal` in the collections array.
- `apps/cms/src/payload/collections/__snapshots__/schema-surface.test.ts.snap` (regenerated, not hand-edited).
- `apps/cms/src/payload-types.ts` (regenerated).
- `apps/web/src/components/sections/legal/LegalSidebar.tsx` — take `items` prop, drop hardcoded list, use shared icon map.
- `apps/web/src/components/sections/legal/LegalLastUpdated.tsx` — take `items` prop instead of importing the hardcoded list.
- `apps/web/src/components/sections/legal/LegalHero.tsx` — accept `items`, pass to `LegalLastUpdated`.
- `apps/web/src/app/legal/layout.tsx` — fetch the doc list (server) and pass to hero + sidebar.
- `apps/web/src/app/legal/page.tsx` — replace static content with a redirect to the first doc.
- `docs/web/WEB-PAGES.md` — note Legal pages are now CMS-backed.

**Delete (after the dynamic route works):**
- `apps/web/src/app/legal/customer-data-processing-addendum/page.tsx`
- `apps/web/src/app/legal/limited-use-agreement/page.tsx`
- `apps/web/src/app/legal/policies-and-commitments/page.tsx`
- `apps/web/src/app/legal/pre-general-availability-terms/page.tsx`
- `apps/web/src/app/legal/trademark-usage-policy/page.tsx`
- `apps/web/src/app/legal/vulnerability-disclosure-policies/page.tsx`
- `apps/web/src/app/legal/acceptable-use-policy/page.tsx`
- (Keep `apps/web/src/app/legal/page.tsx` — it becomes the redirect.)

---

## Phase A — CMS collection (apps/cms)

### Task 1: Create the `Legal` collection

**Files:**
- Create: `apps/cms/src/payload/collections/Legal.ts`
- Modify: `apps/cms/src/payload.config.ts`

- [ ] **Step 1: Write the collection config**

Mirror `Guides.ts` but lean (no authors/FAQs/related/TOC). Create `apps/cms/src/payload/collections/Legal.ts`:

```ts
import type { CollectionConfig } from 'payload';

import { isAdminOrEditor } from '../access';
import { docStatusBarEditConfig } from '../admin/doc-status-bar-mount';
import { displayPublishedAtField } from '../fields/display-published-at';
import { publishedAtField } from '../fields/published-at';
import { schemaAddonsField } from '../fields/schema-addons';
import { seoSidebarFields } from '../fields/seo';
import { slugField } from '../fields/slug';
import { contentTitleField } from '../fields/title';
import { normalizeLexicalHook } from '../hooks/normalize-lexical';
import { indexNowPublishAfterChangeHook } from '../hooks/indexnow-publish';
import {
  searchSyncAfterChangeHook,
  searchSyncAfterDeleteHook,
} from '../hooks/search-sync';
import { slugChangeRedirectHook } from '../hooks/slug-change-redirect';
import { webhooksPublishAfterChangeHook } from '../hooks/webhooks-publish';

/** Icon keys mirrored on the web side (legalIcons.ts). Keep in sync. */
const ICON_OPTIONS = [
  'FileText',
  'FileLock2',
  'ScrollText',
  'BadgeCheck',
  'FileCheck2',
  'Stamp',
  'Bug',
  'Scale',
  'FileSignature',
  'ShieldCheck',
] as const;

export const Legal: CollectionConfig = {
  slug: 'legal',
  labels: { singular: 'Legal Document', plural: 'Legal Documents' },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'order', '_status', 'publishedAt', 'updatedAt'],
    group: 'Content',
    defaultSort: 'order',
    components: {
      edit: docStatusBarEditConfig({ showStats: false, showPublishedAt: true }),
    },
  },
  access: {
    read: () => true,
    create: isAdminOrEditor,
    update: isAdminOrEditor,
    delete: isAdminOrEditor,
  },
  fields: [
    contentTitleField,
    slugField({ source: 'title' }),
    {
      name: 'order',
      type: 'number',
      required: true,
      defaultValue: 99,
      admin: { description: 'Sidebar position (ascending). Lowest is the /legal landing doc.' },
    },
    {
      name: 'icon',
      type: 'select',
      required: true,
      defaultValue: 'FileText',
      options: ICON_OPTIONS.map((value) => ({ label: value, value })),
      admin: { description: 'Sidebar icon. Must match a key in apps/web legalIcons.ts.' },
    },
    { name: 'body', type: 'richText' },
    schemaAddonsField,
    publishedAtField,
    displayPublishedAtField,
    ...seoSidebarFields({ pathPrefix: '/legal', descriptionSource: 'title' }),
  ],
  hooks: {
    beforeChange: [normalizeLexicalHook],
    afterChange: [
      slugChangeRedirectHook('legal'),
      searchSyncAfterChangeHook('legal'),
      indexNowPublishAfterChangeHook('legal'),
      webhooksPublishAfterChangeHook('legal'),
    ],
    afterDelete: [searchSyncAfterDeleteHook('legal')],
  },
  versions: { drafts: { schedulePublish: true }, maxPerDoc: 25 },
};
```

- [ ] **Step 2: Verify the field/hook import paths resolve**

Run: `cd apps/cms && pnpm exec tsc --noEmit -p tsconfig.json 2>&1 | grep -i "Legal.ts" || echo "no Legal.ts type errors"`
Expected: `no Legal.ts type errors`. If any import path is wrong, open the referenced file under `apps/cms/src/payload/fields/` or `.../hooks/` and correct the name (these are the exact symbols used by `Guides.ts`).

- [ ] **Step 3: Register the collection in the Payload config**

In `apps/cms/src/payload.config.ts`, import and add `Legal` to the `collections` array (alphabetical-ish, next to `KnowledgeBase`/`Jobs`). Find the collections import block and array:

```ts
import { Legal } from './payload/collections/Legal';
```
and add `Legal,` to the `collections: [ ... ]` array.

- [ ] **Step 4: Lint + typecheck**

Run: `pnpm --filter @cleanstart/cms lint && pnpm --filter @cleanstart/cms typecheck`
Expected: both pass.

- [ ] **Step 5: Commit**

```bash
git add apps/cms/src/payload/collections/Legal.ts apps/cms/src/payload.config.ts
git commit -m "feat(cms): add legal collection (drafts, versions, publish dates)"
```

---

### Task 2: Migration + generated types

**Files:**
- Create: `apps/cms/src/migrations/<timestamp>_add_legal.ts` (generated)
- Modify: `apps/cms/src/payload-types.ts` (generated)

- [ ] **Step 1: Create the migration**

Run (DB must be reachable per CLAUDE.md local-dev prereqs):
`pnpm --filter @cleanstart/cms exec payload migrate:create add_legal`
Expected: a new file under `apps/cms/src/migrations/` creating the `legal` + `_legal_v` (versions) tables.

- [ ] **Step 2: Run the migration locally**

Run: `pnpm --filter @cleanstart/cms exec payload migrate`
Expected: migration applies cleanly; `legal` table exists.

- [ ] **Step 3: Regenerate types**

Run: `pnpm --filter @cleanstart/cms generate:types`
Expected: `apps/cms/src/payload-types.ts` gains a `Legal` interface and `legal` entry in `Config['collections']`.

- [ ] **Step 4: Verify no type drift**

Run: `pnpm --filter @cleanstart/cms exec tsx scripts/check-types-drift.ts`
Expected: passes (no uncommitted drift).

- [ ] **Step 5: Commit**

```bash
git add apps/cms/src/migrations apps/cms/src/payload-types.ts
git commit -m "feat(cms): legal collection migration + generated types"
```

---

### Task 3: Collection schema-surface test

**Files:**
- Create: `apps/cms/src/payload/collections/Legal.test.ts`
- Modify: `apps/cms/src/payload/collections/__snapshots__/*.snap` (regenerated)

- [ ] **Step 1: Write the test**

Per the repo convention (every collection asserts its public field surface). Create `apps/cms/src/payload/collections/Legal.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { Legal } from './Legal';

describe('Legal collection', () => {
  it('has the locked slug and edit access', () => {
    expect(Legal.slug).toBe('legal');
    expect(typeof Legal.access?.create).toBe('function');
  });

  it('exposes the expected top-level fields', () => {
    const names = (Legal.fields ?? [])
      .map((f) => ('name' in f ? f.name : undefined))
      .filter(Boolean);
    for (const required of ['title', 'slug', 'order', 'icon', 'body']) {
      expect(names).toContain(required);
    }
  });

  it('enables drafts + version history', () => {
    expect(Legal.versions).toMatchObject({ drafts: { schedulePublish: true } });
  });
});
```

- [ ] **Step 2: Run it**

Run: `pnpm --filter @cleanstart/cms test -- Legal.test.ts`
Expected: PASS.

- [ ] **Step 3: Update the schema-surface snapshot (if the repo's surface test covers all collections)**

Run: `pnpm --filter @cleanstart/cms test -- schema-surface -u`
Expected: snapshot updated to include `legal`. Review the diff — it should only add the legal surface.

- [ ] **Step 4: Commit**

```bash
git add apps/cms/src/payload/collections/Legal.test.ts apps/cms/src/payload/collections/__snapshots__
git commit -m "test(cms): legal collection schema surface"
```

---

### Task 4: Seed data module (the 8 documents)

**Files:**
- Create: `apps/cms/scripts/data/legal-seed.ts`

> The HTML here is the content source of truth going forward. It is the exact copy already authored in the current static pages under `apps/web/src/app/legal/**` (which Task 11 deletes). Copy each document's body from its current page file, converting the JSX (`<h2 className="article-h2">` → `<h2>`, `<p className="article-paragraph">` → `<p>`, `<ul className="article-ul">`/`<li className="article-li">` → `<ul>`/`<li>`, keep `<strong>`/`<em>`/`<a href>`), and HTML-decode the entities (`&ldquo;`→“, `&rdquo;`→”, `&apos;`→’, `&amp;`→&, `&trade;`→™, `&reg;`→®, `&bull;`→•). `htmlToLexical` accepts standard HTML tags.

- [ ] **Step 1: Create the seed-data shape with one complete example**

Create `apps/cms/scripts/data/legal-seed.ts`:

```ts
export interface LegalSeedDoc {
  title: string;
  slug: string;
  order: number;
  icon: string;
  /** Effective/last-updated date stamped into publishedAt + displayPublishedAt. */
  effectiveDate: string; // ISO, e.g. '2026-06-04'
  /** Document body as HTML; converted to Lexical at seed time. */
  html: string;
}

export const LEGAL_SEED: LegalSeedDoc[] = [
  {
    title: 'Pre-General Availability Terms',
    slug: 'pre-general-availability-terms',
    order: 5,
    icon: 'FileCheck2',
    effectiveDate: '2026-06-04',
    html: `
      <h2>Purpose</h2>
      <p>These Pre-GA Terms apply to CleanStart™ products, features, or services that are designated as alpha, beta, preview, or otherwise not yet generally available (“Pre-GA Offerings”). They supplement the Master Services Agreement and related Service Level Agreements, and govern the Customer’s use of Pre-GA Offerings provided by CleanStart.</p>
      <h2>Limited Availability and Functionality</h2>
      <p>Pre-GA Offerings are made available at CleanStart’s sole discretion for evaluation, testing, and feedback purposes only. They may be incomplete, may contain errors or defects, and may not function in the same manner as generally available products. CleanStart does not guarantee continued availability of any Pre-GA Offering and may modify, suspend, or discontinue such offerings at any time without notice.</p>
      <h2>Exclusions from SLA and Warranties</h2>
      <p>Unless expressly stated otherwise, Pre-GA Offerings are provided “as is” and are excluded from the commitments, service credits, and remedies specified under the CleanStart Service Level Agreement. CleanStart disclaims all warranties with respect to Pre-GA Offerings, whether express, implied, or statutory, including warranties of performance, reliability, or fitness for a particular purpose.</p>
      <h2>Customer Responsibilities</h2>
      <p>Customers using Pre-GA Offerings acknowledge that such use is at their sole risk and agree to use them only for non-production purposes, unless expressly authorized by CleanStart. Customers must provide prompt feedback on issues, performance, and usability, and consent to CleanStart’s use of such feedback for product improvement without restriction. Customers are further responsible for ensuring that their test use of Pre-GA Offerings does not expose confidential or sensitive data without appropriate safeguards.</p>
      <h2>Data Handling and Security</h2>
      <p>While CleanStart applies commercially reasonable security measures across its services, Customers acknowledge that Pre-GA Offerings may not have undergone the same level of security review, certification, or compliance validation as generally available services. Accordingly, Customers are advised not to rely on Pre-GA Offerings for mission-critical workloads or for processing highly sensitive data.</p>
      <h2>Transition to General Availability</h2>
      <p>CleanStart has no obligation to release any Pre-GA Offering as a generally available product. If a Pre-GA Offering transitions to general availability, continued use shall be subject to the standard terms of the Master Services Agreement and SLA, and may require execution of additional orders or amendments.</p>
      <h2>Termination</h2>
      <p>Either party may terminate participation in a Pre-GA Offering at any time upon written notice. Upon termination, Customer must cease all use of the Pre-GA Offering and, if applicable, return or delete any related materials in accordance with CleanStart’s instructions.</p>
      <h2>Governing Law</h2>
      <p>These Pre-GA Terms shall be governed by the same law and dispute resolution provisions as the Master Services Agreement.</p>
    `,
  },
  // Author the remaining 7 entries with the same shape, copying each body from
  // its current page file (decode entities as noted above):
  //  - 'additional-third-party-terms'        (order 1, FileText)   from app/legal/page.tsx
  //  - 'customer-data-processing-addendum'   (order 2, FileLock2)  from app/legal/customer-data-processing-addendum/page.tsx
  //  - 'limited-use-agreement'               (order 3, ScrollText) from app/legal/limited-use-agreement/page.tsx
  //  - 'policies-and-commitments'            (order 4, BadgeCheck) from app/legal/policies-and-commitments/page.tsx
  //  - 'trademark-usage-policy'              (order 6, Stamp)      from app/legal/trademark-usage-policy/page.tsx
  //  - 'vulnerability-disclosure-policies'   (order 7, Bug)        from app/legal/vulnerability-disclosure-policies/page.tsx
  //  - 'acceptable-use-policy'               (order 8, Scale)      from app/legal/acceptable-use-policy/page.tsx
];
```

- [ ] **Step 2: Author the remaining 7 docs**

Copy each body from the listed source file, convert JSX→HTML and decode entities as described in the task header. Each becomes a `LegalSeedDoc` entry. (This is content data entry, not code — the sources are exact.)

- [ ] **Step 3: Sanity-check the data compiles**

Run: `cd apps/cms && pnpm exec tsc --noEmit 2>&1 | grep -i "legal-seed" || echo "legal-seed ok"`
Expected: `legal-seed ok`. Confirm `LEGAL_SEED.length === 8` by eye.

- [ ] **Step 4: Commit**

```bash
git add apps/cms/scripts/data/legal-seed.ts
git commit -m "feat(cms): legal seed content (8 documents)"
```

---

### Task 5: Idempotent seed script

**Files:**
- Create: `apps/cms/scripts/seed-legal.ts`

- [ ] **Step 1: Write the seeder** (mirrors `seed-case-studies.ts` bootstrap; uses `htmlToLexical`)

Create `apps/cms/scripts/seed-legal.ts`:

```ts
/**
 * One-shot, idempotent seed for the `legal` collection.
 *
 * Creates each document from scripts/data/legal-seed.ts, converting the HTML
 * body to Lexical via the shared webflow-import helper. A doc whose `slug`
 * already exists is updated in place (no duplicates). Publishes each doc and
 * stamps publishedAt + displayPublishedAt from `effectiveDate`.
 *
 * Run inside the cms container (or locally with a reachable DB):
 *   pnpm exec payload run scripts/seed-legal.ts
 *   # or: pnpm exec tsx --env-file=.env scripts/seed-legal.ts
 */
import { getPayload } from 'payload';

import config from '../src/payload.config.ts';
import { htmlToLexical } from '../src/payload/lib/webflow-import/html-to-lexical';
import { LEGAL_SEED } from './data/legal-seed';

async function run(): Promise<void> {
  const payload = await getPayload({ config });

  for (const doc of LEGAL_SEED) {
    const body = htmlToLexical(doc.html);
    const publishedISO = new Date(`${doc.effectiveDate}T00:00:00.000Z`).toISOString();

    const existing = await payload.find({
      collection: 'legal',
      where: { slug: { equals: doc.slug } },
      limit: 1,
      depth: 0,
    });

    const data = {
      title: doc.title,
      slug: doc.slug,
      order: doc.order,
      icon: doc.icon,
      body,
      publishedAt: publishedISO,
      displayPublishedAt: publishedISO,
      _status: 'published' as const,
    };

    if (existing.docs[0]) {
      await payload.update({
        collection: 'legal',
        id: existing.docs[0].id,
        data,
      });
      payload.logger.info(`updated legal/${doc.slug}`);
    } else {
      await payload.create({ collection: 'legal', data });
      payload.logger.info(`created legal/${doc.slug}`);
    }
  }

  payload.logger.info(`legal seed complete: ${LEGAL_SEED.length} docs`);
  process.exit(0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
```

- [ ] **Step 2: Run the seeder locally**

Run: `pnpm --filter @cleanstart/cms exec tsx --env-file=.env scripts/seed-legal.ts`
Expected: 8 `created legal/<slug>` lines, then `legal seed complete: 8 docs`.

- [ ] **Step 3: Verify via REST**

Run: `curl -s "http://localhost:3000/api/legal?where[_status][equals]=published&sort=order&limit=20" | node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>{const j=JSON.parse(s);console.log(j.totalDocs, j.docs.map(d=>d.slug).join(','))})"`
Expected: `8 additional-third-party-terms,customer-data-processing-addendum,limited-use-agreement,policies-and-commitments,pre-general-availability-terms,trademark-usage-policy,vulnerability-disclosure-policies,acceptable-use-policy`

- [ ] **Step 4: Re-run to confirm idempotency**

Run the Step 2 command again. Expected: 8 `updated legal/<slug>` lines, still `totalDocs: 8` (no duplicates).

- [ ] **Step 5: Commit**

```bash
git add apps/cms/scripts/seed-legal.ts
git commit -m "feat(cms): idempotent legal seed script (html->lexical)"
```

---

## Phase B — Web rendering (apps/web)

### Task 6: `lib/legal.ts` fetcher + icon map

**Files:**
- Create: `apps/web/src/lib/legal.ts`
- Create: `apps/web/src/components/sections/legal/legalIcons.ts`
- Create: `apps/web/src/lib/legal.test.ts`

- [ ] **Step 1: Write the icon map** (`legalIcons.ts`)

```ts
import {
  BadgeCheck,
  Bug,
  FileCheck2,
  FileLock2,
  FileSignature,
  FileText,
  type LucideIcon,
  Scale,
  ScrollText,
  ShieldCheck,
  Stamp,
} from "lucide-react";

/** Maps the CMS `icon` select value to a lucide component. Keep keys in sync
 *  with ICON_OPTIONS in apps/cms Legal.ts. */
export const LEGAL_ICONS: Record<string, LucideIcon> = {
  FileText,
  FileLock2,
  ScrollText,
  BadgeCheck,
  FileCheck2,
  Stamp,
  Bug,
  Scale,
  FileSignature,
  ShieldCheck,
};

export function legalIcon(key: string | null | undefined): LucideIcon {
  return (key && LEGAL_ICONS[key]) || FileText;
}
```

- [ ] **Step 2: Write the fetcher** (`lib/legal.ts`, mirrors `lib/guides.ts` + `published-date`)

```ts
import { cache } from "react";
import type { LexicalRoot } from "@/lib/blog";
import type { CmsSeo } from "@/lib/seo/cms-seo";
import { effectivePublishedAt } from "@/lib/published-date";
import { fetchCMS } from "./cms-fetch";

export type { LexicalRoot } from "@/lib/blog";

export interface LegalDoc {
  id: string;
  title: string;
  slug: string;
  order: number;
  icon: string;
  publishedAt?: string | null;
  displayPublishedAt?: string | null;
  updatedAt?: string | null;
  seo?: CmsSeo | null;
}

export interface LegalDocDetail extends LegalDoc {
  body?: LexicalRoot | null;
}

export interface PayloadListResponse<T> {
  docs: T[];
  totalDocs: number;
}

const PUBLISHED_FILTER =
  "where[_status][equals]=published&where[publishedAt][exists]=true";

/** Sidebar/index list: published, ascending by `order`. */
export const getLegalList = cache(async (): Promise<LegalDoc[]> => {
  const data = await fetchCMS<PayloadListResponse<LegalDoc>>(
    `/api/legal?${PUBLISHED_FILTER}&sort=order&depth=0&limit=50`,
  );
  return data.docs;
});

async function loadLegalBySlug(slug: string, draft = false): Promise<LegalDocDetail | null> {
  const filter = draft ? "" : `&${PUBLISHED_FILTER}`;
  const data = await fetchCMS<PayloadListResponse<LegalDocDetail>>(
    `/api/legal?where[slug][equals]=${encodeURIComponent(slug)}${filter}&depth=1&limit=1`,
    { draft },
  );
  return data.docs[0] ?? null;
}

export const getLegalBySlug = cache(
  async (slug: string): Promise<LegalDocDetail | null> => loadLegalBySlug(slug, false),
);

export async function getLegalBySlugDraft(slug: string): Promise<LegalDocDetail | null> {
  return loadLegalBySlug(slug, true);
}

/** Resolved "last updated" date for a doc (effective > display > publishedAt). */
export function legalUpdatedAt(doc: { publishedAt?: string | null; displayPublishedAt?: string | null }): string | undefined {
  return effectivePublishedAt(doc);
}

/** Renders e.g. "June 4, 2026". */
export function formatLegalDate(iso?: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}
```

- [ ] **Step 3: Write a unit test** (`lib/legal.test.ts`)

```ts
import { describe, expect, it } from "vitest";
import { formatLegalDate, legalUpdatedAt } from "./legal";
import { legalIcon } from "@/components/sections/legal/legalIcons";
import { FileText } from "lucide-react";

describe("legal lib", () => {
  it("formats an ISO date as a US long date", () => {
    expect(formatLegalDate("2026-06-04T00:00:00.000Z")).toBe("June 4, 2026");
  });
  it("returns empty string for missing date", () => {
    expect(formatLegalDate(null)).toBe("");
  });
  it("prefers displayPublishedAt over publishedAt", () => {
    expect(
      legalUpdatedAt({ publishedAt: "2026-01-01", displayPublishedAt: "2026-06-04" }),
    ).toBe("2026-06-04");
  });
  it("falls back to FileText for unknown icon keys", () => {
    expect(legalIcon("Nonexistent")).toBe(FileText);
  });
});
```

- [ ] **Step 4: Run the test**

Run: `pnpm --filter @cleanstart/web exec vitest run src/lib/legal.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/lib/legal.ts apps/web/src/lib/legal.test.ts apps/web/src/components/sections/legal/legalIcons.ts
git commit -m "feat(web): legal CMS fetcher, icon map, unit tests"
```

---

### Task 7: Make sidebar + hero date data-driven

**Files:**
- Modify: `apps/web/src/components/sections/legal/LegalSidebar.tsx`
- Modify: `apps/web/src/components/sections/legal/LegalLastUpdated.tsx`
- Modify: `apps/web/src/components/sections/legal/LegalHero.tsx`

- [ ] **Step 1: Rewrite `LegalSidebar.tsx` to take items + use the icon map**

```tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { legalIcon } from "./legalIcons";
import { cn } from "@/lib/cn";

export interface LegalNavItem {
  label: string;
  href: string;
  icon: string;
}

export function LegalSidebar({ items }: { items: LegalNavItem[] }): React.ReactElement {
  const pathname = usePathname();
  return (
    <nav aria-label="Legal documents" className="lg:sticky lg:top-24">
      <ul className="flex flex-col gap-1">
        {items.map((item) => {
          const isActive = pathname === item.href;
          const Icon = legalIcon(item.icon);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "flex items-center gap-2.5 rounded-md px-3 py-2 transition-colors",
                  isActive
                    ? "bg-[#EEF1FF] text-[#1E2A78] font-semibold"
                    : "text-[#475569] hover:text-[#1E2A78] hover:bg-[#F4F6FB]",
                )}
                style={{ fontSize: "var(--fs-body-sm)" }}
              >
                <Icon
                  aria-hidden
                  strokeWidth={isActive ? 2.25 : 1.75}
                  className={cn("h-4 w-4 shrink-0", isActive ? "text-[#471EC0]" : "text-[#94A3B8]")}
                />
                <span>{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
```

- [ ] **Step 2: Rewrite `LegalLastUpdated.tsx` to take items**

```tsx
"use client";

import { usePathname } from "next/navigation";

export interface LegalDateItem {
  href: string;
  updatedAt: string;
}

export function LegalLastUpdated({ items }: { items: LegalDateItem[] }): React.ReactElement | null {
  const pathname = usePathname();
  const item = items.find((entry) => entry.href === pathname);
  if (!item?.updatedAt) return null;
  return (
    <p className="mt-4 text-center text-white/70" style={{ fontSize: "var(--fs-caption)" }}>
      Last updated: {item.updatedAt}
    </p>
  );
}
```

- [ ] **Step 3: Update `LegalHero.tsx` to accept + pass date items**

Change the props to `{ title: string; dateItems: LegalDateItem[] }` and render `<LegalLastUpdated items={dateItems} />` where the component currently renders `<LegalLastUpdated />`. Update the import line to also import the type:

```tsx
import { LegalLastUpdated, type LegalDateItem } from "./LegalLastUpdated";
```
and the signature:
```tsx
interface LegalHeroProps {
  title: string;
  dateItems: LegalDateItem[];
}
export function LegalHero({ title, dateItems }: LegalHeroProps): React.ReactElement {
```
and the usage inside the HeroReveal:
```tsx
        <HeroReveal y={20} delay={0.15} duration={0.8}>
          <LegalLastUpdated items={dateItems} />
        </HeroReveal>
```

- [ ] **Step 4: Typecheck** (will fail until layout passes the new props — expected; fixed in Task 8)

Run: `pnpm --filter @cleanstart/web exec tsc --noEmit 2>&1 | grep -E "LegalHero|LegalSidebar|layout" | head`
Expected: errors only in `app/legal/layout.tsx` (missing props) — that's the next task.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/components/sections/legal/LegalSidebar.tsx apps/web/src/components/sections/legal/LegalLastUpdated.tsx apps/web/src/components/sections/legal/LegalHero.tsx
git commit -m "refactor(web): data-driven legal sidebar + hero date"
```

---

### Task 8: Data-driven layout

**Files:**
- Modify: `apps/web/src/app/legal/layout.tsx`

- [ ] **Step 1: Fetch the list and pass to hero + sidebar**

```tsx
import { Container, Section } from "@/components/layout";
import { Header } from "@/components/nav/Header";
import { Footer } from "@/components/sections/Footer";
import { LegalHero } from "@/components/sections/legal/LegalHero";
import { LegalSidebar } from "@/components/sections/legal/LegalSidebar";
import { FadeUp } from "@/components/ui/FadeUp";
import { getLegalList, legalUpdatedAt, formatLegalDate } from "@/lib/legal";

export default async function LegalSectionLayout({
  children,
}: {
  children: React.ReactNode;
}): Promise<React.ReactElement> {
  const docs = await getLegalList();
  const navItems = docs.map((d) => ({
    label: d.title,
    href: `/legal/${d.slug}`,
    icon: d.icon,
  }));
  const dateItems = docs.map((d) => ({
    href: `/legal/${d.slug}`,
    updatedAt: formatLegalDate(legalUpdatedAt(d)),
  }));

  return (
    <>
      <Header />
      <main>
        <LegalHero title="Legal" dateItems={dateItems} />
        <FadeUp>
          <Section padding="md" className="bg-white">
            <Container variant="default">
              <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-10 lg:gap-16">
                <aside>
                  <LegalSidebar items={navItems} />
                </aside>
                <article className="article-body min-w-0">{children}</article>
              </div>
            </Container>
          </Section>
        </FadeUp>
      </main>
      <Footer />
    </>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `pnpm --filter @cleanstart/web typecheck`
Expected: passes.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/app/legal/layout.tsx
git commit -m "feat(web): legal layout reads docs from CMS"
```

---

### Task 9: Dynamic document route

**Files:**
- Create: `apps/web/src/app/legal/[slug]/page.tsx`

- [ ] **Step 1: Write the route** (static params from CMS + metadata + body render)

```tsx
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { RenderLexical } from "@/lib/renderLexical";
import {
  getLegalBySlug,
  getLegalList,
  legalUpdatedAt,
} from "@/lib/legal";
import { buildPageMetadata } from "@/lib/seo/canonical";
import { resolveCmsSeo } from "@/lib/seo/cms-seo";
import { JsonLd, breadcrumbSchema } from "@/lib/seo/jsonld";

interface LegalPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams(): Promise<Array<{ slug: string }>> {
  const docs = await getLegalList();
  return docs.map((d) => ({ slug: d.slug }));
}

export async function generateMetadata({ params }: LegalPageProps): Promise<Metadata> {
  const { slug } = await params;
  const doc = await getLegalBySlug(slug).catch(() => null);
  if (!doc) {
    return buildPageMetadata({
      title: "Legal",
      description: "CleanStart legal documents.",
      path: `/legal/${slug}`,
      noindex: true,
    });
  }
  const seo = resolveCmsSeo(doc.seo);
  return buildPageMetadata({
    title: seo.title ?? doc.title,
    description: seo.description ?? `${doc.title} — CleanStart legal documents.`,
    path: `/legal/${doc.slug}`,
    type: "article",
    modifiedTime: doc.updatedAt ?? undefined,
    publishedTime: legalUpdatedAt(doc),
    ...(seo.noindex ? { noindex: true } : {}),
    ...(seo.canonicalUrl ? { canonicalUrl: seo.canonicalUrl } : {}),
  });
}

export default async function LegalDocumentPage({ params }: LegalPageProps): Promise<React.ReactElement> {
  const { slug } = await params;
  const doc = await getLegalBySlug(slug).catch(() => null);
  if (!doc) notFound();

  return (
    <>
      <JsonLd
        id={`legal-breadcrumbs-${doc.slug}`}
        data={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Legal", path: "/legal" },
          { name: doc.title },
        ])}
      />
      <h1 className="article-h1">{doc.title}</h1>
      {doc.body ? <RenderLexical content={doc.body} /> : null}
    </>
  );
}
```

- [ ] **Step 2: Typecheck + build the route**

Run: `pnpm --filter @cleanstart/web typecheck`
Expected: passes. (Full build is run in Task 12 after deletes.)

- [ ] **Step 3: Manual check against running dev server**

With cms (`:3000`) and web (`:3001`) running and the seed applied:
Run: `curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3001/legal/limited-use-agreement`
Expected: `200`.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/app/legal/[slug]/page.tsx
git commit -m "feat(web): dynamic /legal/[slug] route from CMS"
```

---

### Task 10: `/legal` index redirect + preview route

**Files:**
- Modify: `apps/web/src/app/legal/page.tsx`
- Create: `apps/web/src/app/preview/legal/[slug]/page.tsx`

- [ ] **Step 1: Replace the index page body with a redirect to the first doc**

Overwrite `apps/web/src/app/legal/page.tsx`:

```tsx
import { redirect } from "next/navigation";
import { getLegalList } from "@/lib/legal";

export default async function LegalIndexPage(): Promise<never> {
  const docs = await getLegalList();
  const first = docs[0]?.slug ?? "additional-third-party-terms";
  redirect(`/legal/${first}`);
}
```

- [ ] **Step 2: Add the draft preview route** (parity with other collections; inspect an existing `app/preview/<collection>/[slug]/page.tsx` for the exact `draftMode()` enable pattern and mirror it)

```tsx
import { draftMode } from "next/headers";
import { notFound } from "next/navigation";
import { RenderLexical } from "@/lib/renderLexical";
import { getLegalBySlugDraft } from "@/lib/legal";

export default async function LegalPreviewPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<React.ReactElement> {
  const { isEnabled } = await draftMode();
  if (!isEnabled) notFound();
  const { slug } = await params;
  const doc = await getLegalBySlugDraft(slug).catch(() => null);
  if (!doc) notFound();
  return (
    <article className="article-body">
      <h1 className="article-h1">{doc.title}</h1>
      {doc.body ? <RenderLexical content={doc.body} /> : null}
    </article>
  );
}
```

- [ ] **Step 3: Typecheck**

Run: `pnpm --filter @cleanstart/web typecheck`
Expected: passes.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/app/legal/page.tsx apps/web/src/app/preview/legal/[slug]/page.tsx
git commit -m "feat(web): /legal redirect to first doc + legal preview route"
```

---

### Task 11: Delete the static legal pages

**Files:**
- Delete the 7 static sub-page files (see File Structure → Delete).

- [ ] **Step 1: Remove the files**

```bash
git rm apps/web/src/app/legal/customer-data-processing-addendum/page.tsx \
       apps/web/src/app/legal/limited-use-agreement/page.tsx \
       apps/web/src/app/legal/policies-and-commitments/page.tsx \
       apps/web/src/app/legal/pre-general-availability-terms/page.tsx \
       apps/web/src/app/legal/trademark-usage-policy/page.tsx \
       apps/web/src/app/legal/vulnerability-disclosure-policies/page.tsx \
       apps/web/src/app/legal/acceptable-use-policy/page.tsx
```

- [ ] **Step 2: Confirm no dangling imports of deleted files**

Run: `grep -rn "legal/acceptable-use-policy/page\|legal/limited-use-agreement/page" apps/web/src || echo "no dangling refs"`
Expected: `no dangling refs`.

- [ ] **Step 3: Commit**

```bash
git commit -am "refactor(web): drop static legal pages (now CMS-backed)"
```

---

### Task 12: Verification + docs

**Files:**
- Modify: `docs/web/WEB-PAGES.md`

- [ ] **Step 1: Full gates (web)**

Run: `pnpm --filter @cleanstart/web lint && pnpm --filter @cleanstart/web typecheck && pnpm --filter @cleanstart/web build`
Expected: all pass. In build output, `/legal/[slug]` appears (SSG with the 8 params) and `/legal` is a dynamic redirect.

- [ ] **Step 2: Inline-navigation regression check (Playwright against `:3001`)**

Navigate to `/legal/additional-third-party-terms`, set `window.__m='x'`, click the sidebar link for "Vulnerability Disclosure Policies", then assert: URL is `/legal/vulnerability-disclosure-policies`, `window.__m === 'x'` (no reload), hero still shows "Legal" + a "Last updated" line, the article `<h1>` matches the clicked doc, and `a[aria-current="page"]` is the clicked item.
Expected: all true (same contract verified for the hardcoded version).

- [ ] **Step 3: CMS edit round-trips to web**

In the Payload admin, edit one legal doc's title, publish; after ISR revalidation (≤60s) or with `cache: no-store` in dev, the web page + sidebar reflect the change.

- [ ] **Step 4: Update the page inventory**

In `docs/web/WEB-PAGES.md`, change the Legal rows' type/status to indicate they are CMS-backed (CMS Detail) under `/legal/[slug]`.

- [ ] **Step 5: Commit**

```bash
git add docs/web/WEB-PAGES.md
git commit -m "docs(web): mark legal pages CMS-backed"
```

---

## Production rollout note (add to CLAUDE.md one-shot checklist when shipping)

On the prod droplet, after deploy + migration, run the seed once inside the cms container:
```bash
pnpm exec tsx --env-file=.env scripts/seed-legal.ts
```
Idempotent (updates by slug). Then spot-check `/legal` redirects and one sub-page renders on the live site.

---

## Self-Review

- **Spec coverage:** edit anytime → richText body + admin (Task 1); track changes → versions `maxPerDoc: 25` (Task 1); track publish dates → `publishedAt`/`displayPublishedAt` + hero date (Tasks 1, 7, 8); link every legal page into one collection → 8 seeded docs (Tasks 4–5) at `/legal/[slug]` (Task 9); keep current UX → layout/sidebar/hero preserved (Tasks 7–8); access "same as other content" → `isAdminOrEditor` (Task 1). ✓
- **Placeholder scan:** the only data-entry step is Task 4 Step 2 (author 7 docs from named source files) — content, not code. All code steps contain full implementations.
- **Type consistency:** `LegalNavItem`/`LegalDateItem` defined in the components consuming them; `LegalDoc`/`LegalDocDetail` in `lib/legal.ts`; `legalIcon`/`LEGAL_ICONS` shared; `getLegalList`/`getLegalBySlug`/`getLegalBySlugDraft` names consistent across Tasks 6–10.
