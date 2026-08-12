# SEO Audit — Engineering Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the genuinely code-owned findings from the 2026-08-10 "Google SEO Report" (Claude SEO, 66/100) on `apps/web`, after discarding the findings that verification proved false or non-code.

**Architecture:** Three small, independent changes to `apps/web`: a metadata canonical correction in the root layout, explicit intrinsic dimensions on decorative home-page images, and a `Review` node added to the existing home-page JSON-LD graph via the established `getPageGraph` composition path. No new files beyond tests. No CMS schema changes. Each task is independently shippable and independently revertible.

**Tech Stack:** Next.js 16.2.5 (App Router), React 19.2.4, TypeScript strict, Tailwind CSS v4, Vitest, `@cleanstart/schema` (`composeGraph` / `GraphNode`).

---

## Findings triage (read before starting)

Verification against the live site and the codebase on 2026-08-11 reclassified most of the report. **Only Phase 1 is code work.**

### Closed — no action (verified false or already correct)

| Report finding | Severity claimed | Verification result |
|---|---|---|
| "No IndexNow protocol support" | High | **False positive.** Fully implemented in `apps/cms/src/payload/lib/indexnow/submit.ts`, fires on publish across 7 collections. The report probed `/indexnow.txt` and `/.well-known/indexnow`; the spec's `keyLocation` convention is `<baseUrl>/<key>.txt`. Live key file `https://www.cleanstart.com/2abd211550dc3ce92123f2a22d86df7d.txt` returns 200 and its contents match its filename as the spec requires. |
| "28 core pages missing lastmod" | Medium | **Working as designed.** `apps/web/src/app/sitemap.ts:10` documents the decision: `<lastmod>` is emitted "only when accurate", sourced from CMS timestamps; the 29 `STATIC_ROUTES` have no meaningful document timestamp. Google ignores or distrusts inaccurate `lastmod`, so synthesising dates here would be a regression. Do not "fix". |
| "BlogPosting schema systematically omits author" | Medium | **Not a code defect.** The builder emits `author` whenever the doc has one — verified live: `sbom-101` → `Person: Dhanush VM`; `what-is-a-cve…` → `Person: CleanStart Security`; `hermetic-build` and `chainguard-alternatives…` → `null`. The nulls are CMS docs with no author assigned. Editorial fix (assign authors in CMS), tracked in Phase 2. |

### Phase 2 — non-code actions (owner: ops / CMS editor, not this plan)

- **CSP Report-Only → enforced.** No code change needed. `apps/web/src/proxy.ts:45-47` already documents a deliberate burn-in with an env flag: `CSP_ENFORCE === "1"` flips it. Action: review accumulated reports at `/api/csp-report`, then set `CSP_ENFORCE=1` in Vercel. **Caution:** a previously enforced CSP with `require-trusted-types-for 'script'` broke Turbopack's chunk loader in production; Trusted Types has since been removed from `buildCsp`, but this flip must be watched after deploy and is reverted by unsetting the var.
- **`/subscribe` returns 307 (temporary).** Not in `next.config.ts`. It is a CMS-managed redirect row applied by `apps/web/src/proxy.ts:151-158`, which passes the row's own `status` straight through. Fix by editing that redirect row's status to `308` in the CMS — no deploy required.
- **Bare HTTP apex takes two hops.** `http://cleanstart.com` → `https://cleanstart.com` (Vercel/HSTS edge) → `https://www.cleanstart.com` (`shouldRedirectApex`, `proxy.ts:98-102`). The second hop is already a correct 308 and cannot be collapsed in application code — the first hop is issued at the edge before our proxy runs. Collapsing requires a Vercel domain-level redirect config. Low value: it only affects first-touch links with no HSTS state.
- **Assign CMS authors** to `hermetic-build` and `chainguard-alternatives-comparing-hardened-container-image-vendors` (and audit the rest of the blog set), which resolves the schema-author finding at its source.

### Deferred — needs its own plan (do not attempt here)

- **Root `app/loading.tsx` hides all content in trailing `<div hidden id="S:n">` blocks.** Found during our own verification, not in the report. Every page's real content streams into hidden containers; a text extractor that respects `hidden` sees ~52-108 chars instead of 20,062. **This is entangled with existing behaviour** — `apps/web/src/proxy.ts:164-168` documents that the same boundary "locks the response status at 200 the instant anything under it suspends", which is why `lib/detail-route-not-found-guard.ts` exists at all. Removing or narrowing `loading.tsx` may change soft-404 handling. Requires a production build plus a before/after extraction measurement. Separate plan.
- **Case-study detail URLs.** Both case-study `Article` nodes point at the same parent listing URL and lack `image`/`author`. Giving each customer story its own route is a content-model change (new CMS collection or route + CMS data), not a markup tweak. Separate plan.
- **`SoftwareApplication` `aggregateRating` / `offers`.** Deliberately **not** planned. The report itself says never fabricate ratings or prices. Only actionable if real G2/Capterra data is sourced — a content/marketing input, not an engineering task.

---

## File Structure

| File | Responsibility | Change |
|---|---|---|
| `apps/web/src/app/layout.tsx` | Root metadata, incl. site-wide canonical | Modify — homepage canonical gains trailing slash |
| `apps/web/src/app/layout.canonical.test.ts` | Regression test for the root canonical | Create |
| `apps/web/src/components/sections/home/TestimonialsStats.tsx` | Home testimonial carousel + stat band | Modify — intrinsic dims on 2 decorative `<img>` |
| `apps/web/src/components/sections/home/ProcessBand.tsx` | Home 3-step process band | Modify — intrinsic dims on the mapped step icon (1 edit) |
| `apps/web/src/components/sections/home/security/SecurityDiagram.tsx` | Home security diagram | Modify — intrinsic dims on the mapped node icon (1 edit) |
| `apps/web/src/lib/seo/home-review-schema.ts` | Build `Review` nodes from `HOME_TESTIMONIALS` | Create |
| `apps/web/src/lib/seo/home-review-schema.test.ts` | Unit tests for the above | Create |
| `apps/web/src/app/page.tsx` | Home page; composes the JSON-LD graph | Modify — pass Review nodes into `getPageGraph` |

---

## Task 1: Homepage canonical trailing slash

The served homepage URL and the sitemap `<loc>` are both `https://www.cleanstart.com/` (with slash), but the canonical renders as `https://www.cleanstart.com` (no slash) because Next joins `metadataBase` with the `"/"` value and drops the trailing slash. This is the only page where canonical, sitemap, and served URL disagree. Google normalises this in practice — it is a Low-severity consistency fix, included because it is one line.

Note the site's own policy strips trailing slashes on every non-root path (`shouldRedirectTrailingSlash`, `proxy.ts:61-66`), and root is explicitly exempt — so the slash form is correct for `/` specifically.

**Files:**
- Modify: `apps/web/src/app/layout.tsx:101`
- Test: `apps/web/src/app/layout.canonical.test.ts` (create)

- [ ] **Step 1: Write the failing test**

Create `apps/web/src/app/layout.canonical.test.ts`:

```ts
import { describe, expect, it, vi } from "vitest";

// generateMetadata reads the CMS-managed SEO defaults global. Stub it so the
// test asserts canonical shape only and never touches the network.
vi.mock("@/lib/seo/seo-defaults", () => ({
  getSeoDefaults: async () => null,
  orgConfigFromDefaults: () => ({}),
  verificationFromDefaults: () => ({}),
  webSiteConfigFromDefaults: () => ({}),
}));

describe("root layout canonical", () => {
  it("self-references the homepage with a trailing slash", async () => {
    const { generateMetadata } = await import("./layout");
    const meta = await generateMetadata();

    expect(meta.alternates?.canonical).toBe("https://www.cleanstart.com/");
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
pnpm --filter @cleanstart/web test -- src/app/layout.canonical.test.ts
```

Expected: FAIL — received `"/"` (or `"https://www.cleanstart.com"`), expected `"https://www.cleanstart.com/"`.

- [ ] **Step 3: Make the canonical absolute and slash-terminated**

In `apps/web/src/app/layout.tsx`, replace line 101:

```ts
    alternates: { canonical: "/" },
```

with:

```ts
    // Absolute + trailing slash so the canonical exactly matches both the
    // served URL and the sitemap <loc>. A bare "/" is joined against
    // metadataBase and loses the slash, making the homepage the only page
    // where canonical, sitemap, and served URL disagree.
    alternates: { canonical: `${SITE_URL}/` },
```

`SITE_URL` is already imported on line 19 — no new import.

- [ ] **Step 4: Run the test to verify it passes**

```bash
pnpm --filter @cleanstart/web test -- src/app/layout.canonical.test.ts
```

Expected: PASS (1 test).

- [ ] **Step 5: Confirm no other page regressed**

Detail/listing pages build their canonical through `buildPageMetadata` in `src/lib/seo/canonical.ts`, which this change does not touch.

```bash
pnpm --filter @cleanstart/web test -- src/lib/seo
```

Expected: PASS, no failures.

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/app/layout.tsx apps/web/src/app/layout.canonical.test.ts
git commit -m "fix(web): make homepage canonical match served URL and sitemap"
```

---

## Task 2: Intrinsic dimensions on decorative home images

21 of 78 `<img>` elements on the homepage lack `width`/`height`. **Scope honestly:** every one of them is decorative (`alt=""`, `aria-hidden`) and already has an explicit CSS size (`size-10`, `size-[42px]`) or is absolutely positioned, and measured CLS is 0.0-0.0008 — well inside the 0.1 threshold. The three `/_next/image?...` entries are `next/image` with `fill` in `CrawlableLinkIndex.tsx` and are **correct as-is** (`fill` intentionally omits the attributes).

So this is cheap defence-in-depth against first-paint cache-miss reflow, not a live bug. Add attributes only to the icons that occupy layout flow. Do not touch `CrawlableLinkIndex.tsx`, and do not touch absolutely-positioned background art (`hero-top-grid-glow.svg`, `factory-overlay.webp`, `bg-photo.webp`) where the element is removed from flow and the attributes buy nothing.

**Files:**
- Modify: `apps/web/src/components/sections/home/TestimonialsStats.tsx:143-149` and `:210-216`
- Modify: `apps/web/src/components/sections/home/ProcessBand.tsx` (3 step icons)
- Modify: `apps/web/src/components/sections/home/security/SecurityDiagram.tsx` (6 node icons)

- [ ] **Step 1: Capture the current count as a baseline**

```bash
curl -sS https://www.cleanstart.com/ -o /tmp/hp-before.html
python3 -c "
import re
h=open('/tmp/hp-before.html',encoding='utf-8',errors='replace').read()
imgs=re.findall(r'<img\b[^>]*>',h)
miss=[i for i in imgs if not(re.search(r'\bwidth=',i) and re.search(r'\bheight=',i))]
print('total',len(imgs),'missing',len(miss))
"
```

Expected: `total 78 missing 21`.

- [ ] **Step 2: Add dimensions to the stat icon in TestimonialsStats**

The icon renders at `size-10` (Tailwind `2.5rem` = 40px). In `apps/web/src/components/sections/home/TestimonialsStats.tsx`, the `<img>` at line 210:

```tsx
      <img
        src={icon}
        alt=""
        aria-hidden
        width={40}
        height={40}
        loading="lazy"
        decoding="async"
        className="size-10 select-none"
```

- [ ] **Step 3: Add dimensions to the quote mark in TestimonialsStats**

Renders at `size-[42px]`. The `<img>` at line 143:

```tsx
      <img
        src="/images/home/quote-mark.svg"
        alt=""
        aria-hidden
        width={42}
        height={42}
        loading="lazy"
        decoding="async"
        className="pointer-events-none absolute right-6 top-6 size-[42px] rotate-180 select-none"
```

- [ ] **Step 4: Add dimensions to the ProcessBand step icon**

Both remaining components render their icon set from a single `<img>` inside a `.map()`, so each is **one edit**, not one per icon.

In `apps/web/src/components/sections/home/ProcessBand.tsx`, the icon `<img>` at line 32 renders at `size-[52px]`. Add `width={52} height={52}`:

```tsx
      <img
        src={`/images/process/${step.icon}`}
        alt=""
        aria-hidden
        width={52}
        height={52}
        loading="lazy"
        decoding="async"
        className="size-[52px] select-none"
```

Leave the `bg-photo.webp` `<img>` at line 79 untouched — it is `absolute inset-0 h-full w-full object-cover` background art, fully removed from layout flow, where intrinsic dimensions buy nothing.

- [ ] **Step 5: Add dimensions to the SecurityDiagram node icon**

In `apps/web/src/components/sections/home/security/SecurityDiagram.tsx`, the icon `<img>` at line 111 renders at `size-12` (Tailwind `3rem` = 48px). Add `width={48} height={48}`:

```tsx
        <img
          src={`/images/security/${stage.icon}`}
          alt=""
          aria-hidden
          width={48}
          height={48}
          loading="lazy"
          decoding="async"
          className="relative size-12 select-none"
```

Leave the `cleanstart-logo.png` `<img>` at line 432 untouched — its class is `w-auto`, so it has no fixed rendered box to declare.

In both edits `alt=""`, `aria-hidden`, `loading`, `decoding`, and every class stay exactly as they are; the attributes are purely additive, and the `@next/next/no-img-element` disable comment above each element must remain.

- [ ] **Step 6: Verify lint and types**

```bash
pnpm --filter @cleanstart/web lint && pnpm --filter @cleanstart/web typecheck
```

Expected: both pass. The `@next/next/no-img-element` disable comments must remain in place above each `<img>`.

- [ ] **Step 7: Verify the rendered count dropped**

```bash
pnpm --filter @cleanstart/web build && pnpm --filter @cleanstart/web start &
sleep 12
curl -sS http://localhost:3001/ -o /tmp/hp-after.html
python3 -c "
import re
h=open('/tmp/hp-after.html',encoding='utf-8',errors='replace').read()
imgs=re.findall(r'<img\b[^>]*>',h)
miss=[i for i in imgs if not(re.search(r'\bwidth=',i) and re.search(r'\bheight=',i))]
print('total',len(imgs),'missing',len(miss))
"
```

Expected: `missing` drops from 21 to roughly 8-9 — the remainder being the three `next/image` `fill` entries and the absolutely-positioned background art, both intentionally excluded. Stop the server afterwards.

**Note:** the build requires a reachable production CMS; if it times out prerendering CMS pages, run a production CMS on port 3100 and build against it.

- [ ] **Step 8: Commit**

```bash
git add apps/web/src/components/sections/home
git commit -m "perf(web): add intrinsic dimensions to decorative home icons"
```

---

## Task 3: Review schema for the attributed homepage testimonial

The homepage carries a real, named, attributed customer quote (Mathan Babu K, CTSO & DPO, Vodafone Idea) with zero corresponding structured data. Add `Review` nodes attached to the Organization.

**Do not add `reviewRating`.** No rating was ever collected, and a fabricated one is exactly what the report warns against. A `Review` without `reviewRating` is valid Schema.org; it will not produce a star rich result, and that is the correct outcome.

**Files:**
- Create: `apps/web/src/lib/seo/home-review-schema.ts`
- Create: `apps/web/src/lib/seo/home-review-schema.test.ts`
- Modify: `apps/web/src/app/page.tsx:72-75`

- [ ] **Step 1: Write the failing test**

Create `apps/web/src/lib/seo/home-review-schema.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import type { Testimonial } from "@/components/sections/home/Testimonials";
import { homeReviewSchema } from "./home-review-schema";

const SAMPLE: Testimonial[] = [
  {
    name: "Mathan Babu K",
    role: "CTSO & DPO, Vodafone Idea",
    company: "Vodafone Idea",
    quote: "CleanStart's shift-left security approach arrived at a critical time.",
  },
];

describe("homeReviewSchema", () => {
  it("builds one Review per testimonial, attributed to the named person", () => {
    const [review] = homeReviewSchema(SAMPLE);

    expect(review).toMatchObject({
      "@type": "Review",
      reviewBody: SAMPLE[0]!.quote,
      author: { "@type": "Person", name: "Mathan Babu K" },
      itemReviewed: { "@id": "https://www.cleanstart.com/#organization" },
    });
  });

  it("never emits a rating, since no rating data is collected", () => {
    const [review] = homeReviewSchema(SAMPLE);

    expect(review).not.toHaveProperty("reviewRating");
  });

  it("records the reviewer's employer as the author's affiliation", () => {
    const [review] = homeReviewSchema(SAMPLE);

    expect(review).toMatchObject({
      author: { affiliation: { "@type": "Organization", name: "Vodafone Idea" } },
    });
  });

  it("skips testimonials missing a name or quote", () => {
    const incomplete: Testimonial[] = [
      { name: "", role: "r", company: "c", quote: "q" },
      { name: "n", role: "r", company: "c", quote: "" },
    ];

    expect(homeReviewSchema(incomplete)).toEqual([]);
  });

  it("returns an empty array for no testimonials", () => {
    expect(homeReviewSchema([])).toEqual([]);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
pnpm --filter @cleanstart/web test -- src/lib/seo/home-review-schema.test.ts
```

Expected: FAIL — cannot resolve module `./home-review-schema`.

- [ ] **Step 3: Write the implementation**

Create `apps/web/src/lib/seo/home-review-schema.ts`:

```ts
import type { GraphNode } from "@cleanstart/schema";
import type { Testimonial } from "@/components/sections/home/Testimonials";
import { SITE_URL } from "./canonical";

/**
 * Review nodes for the genuine, named customer testimonials rendered on the
 * homepage, attached to the Organization via its @id.
 *
 * Deliberately emits no `reviewRating`: no numeric rating is collected from
 * these customers, and inventing one to unlock a star rich result would be
 * fabricated structured data. A Review without a rating is valid and honest.
 *
 * Testimonials missing a name or quote are skipped — an unattributed review
 * is worse than no review.
 */
export function homeReviewSchema(testimonials: readonly Testimonial[]): GraphNode[] {
  return testimonials
    .filter((t) => t.name.trim().length > 0 && t.quote.trim().length > 0)
    .map((t) => ({
      "@type": "Review",
      reviewBody: t.quote,
      itemReviewed: { "@id": `${SITE_URL}/#organization` },
      author: {
        "@type": "Person",
        name: t.name,
        jobTitle: t.role,
        affiliation: { "@type": "Organization", name: t.company },
      },
    }));
}
```

- [ ] **Step 4: Run the test to verify it passes**

```bash
pnpm --filter @cleanstart/web test -- src/lib/seo/home-review-schema.test.ts
```

Expected: PASS (5 tests).

- [ ] **Step 5: Wire the nodes into the homepage graph**

In `apps/web/src/app/page.tsx`, add the imports alongside the existing ones:

```ts
import { homeReviewSchema } from "@/lib/seo/home-review-schema";
import { HOME_TESTIMONIALS } from "@/components/sections/home/Testimonials";
```

Then extend the `getPageGraph` node array (currently line 73):

```ts
    getPageGraph(
      "/",
      [faqPageSchema([...HOME_FAQ_ITEMS]), ...homeReviewSchema(HOME_TESTIMONIALS)],
      { primaryImagePath: HOME_OG_IMAGE },
    ),
```

- [ ] **Step 6: Verify the graph validates and lint/types pass**

The schema package ships an override validator and rich-result lint. Run the schema suite plus web checks:

```bash
pnpm --filter @cleanstart/web test -- src/lib/seo
pnpm --filter @cleanstart/web lint && pnpm --filter @cleanstart/web typecheck
```

Expected: all pass.

- [ ] **Step 7: Verify the rendered JSON-LD on a built page**

With the production server running (as in Task 2, Step 6):

```bash
curl -sS http://localhost:3001/ | python3 -c "
import sys,re,json
h=sys.stdin.read()
for b in re.findall(r'<script type=\"application/ld\+json\"[^>]*>(.*?)</script>',h,re.S):
    d=json.loads(b)
    for n in (d.get('@graph') or []):
        if n.get('@type')=='Review':
            print(json.dumps(n,indent=2))
"
```

Expected: one `Review` node per named testimonial, each with `author.name`, `reviewBody`, `itemReviewed`, and **no** `reviewRating`.

- [ ] **Step 8: Commit**

```bash
git add apps/web/src/lib/seo/home-review-schema.ts apps/web/src/lib/seo/home-review-schema.test.ts apps/web/src/app/page.tsx
git commit -m "feat(web): add Review schema for attributed homepage testimonials"
```

---

## Task 4: Full pre-merge verification

- [ ] **Step 1: Run the complete web gate**

```bash
pnpm --filter @cleanstart/web lint
pnpm --filter @cleanstart/web typecheck
pnpm --filter @cleanstart/web test
pnpm --filter @cleanstart/web build
```

Expected: all four pass. Fix and re-run before proceeding — never report results without all four green.

- [ ] **Step 2: Post-deploy live verification**

After the change reaches production, confirm each fix against the live site:

```bash
echo "canonical (expect trailing slash):"
curl -sS https://www.cleanstart.com/ | grep -oE '<link rel="canonical"[^>]*>'

echo "Review nodes (expect >= 1):"
curl -sS https://www.cleanstart.com/ | grep -c '"@type":"Review"'
```

Expected: canonical is `https://www.cleanstart.com/`; Review count is at least 1.

- [ ] **Step 3: Append an entry to the SEO evidence log**

Record what was fixed, what was rejected, and why, in `docs/seo/` alongside the existing evidence files — so the next audit does not re-raise IndexNow, static-route `lastmod`, or schema-author as defects.

---

## Out of scope — content/SEO team

For the avoidance of doubt, these report findings are **not** engineering work and are deliberately absent above: the fabricated-looking `CVE-2024-1234` example, unsourced homepage proof stats, keyword cannibalization merges, thin product pages (`/cleanstart-images`, `/clean-libraries`, `/cleansight`), `/cleansight` retitling for "SBOM", author bios, FAQ answer depth, outbound citations to primary sources, the pillar/hub page, CTA strategy, and customer-logo alt text.
