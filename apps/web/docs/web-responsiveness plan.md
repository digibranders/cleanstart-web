# CleanStart Web — Responsive remediation implementation plan

**Status:** approved by CTO + senior UI/UX engineering reviews.
**Owner:** 1 FE solo.
**Cadence:** 5 × 1-week sprints (~25 working days).
**Reference document:** `apps/web/docs/RESPONSIVE-AUDIT.md` (now 2322 lines; v3 supplement at Part 13 is the active spec).
**Goal:** ship a measurably responsive, WCAG-2.5.8-compliant, visually-accurate `apps/web` across the six target viewports (375 / 768 / 1024 / 1280 / 1440 / 1920) with **zero horizontal scroll**, **zero `<Image>` without `sizes`**, **zero `preserveAspectRatio="none"`**, **zero Pattern-11 dead zones (1024–1919)**, and a CI gate that prevents regression.

---

## Context

The site was designed at a 1920 Figma frame and implemented by copying internal pixel values 1:1 into a `max-w-[1276px]` container. Result: cards, paddings, typography, and decoratives are oversized at 1280–1440 and structurally break at 1024 and below across most pages. The v1 (forensic) and v2 (CTO strategic) audits identified ~600 hardcoded values across 113 files; the v3 supplement (2026-05-20) re-verified 15 of 20 worst-offenders are still present at HEAD, found two new Pattern-11 dead-zone offenders on the CleanSight surface, and confirmed that **zero of the eleven Stream-A/B foundation items from the v2 plan landed in the two weeks since publish**. Meanwhile six new page surfaces shipped without `<Image sizes>`.

This plan executes the v3 remediation as a single ordered queue (solo FE), front-loading the foundations so every subsequent sprint inherits lint, Playwright, Lighthouse, and bundle-budget protection. Every sprint ends with an explicit **Review + Visual Check** gate; nothing merges to `development` without passing the gate.

The intended outcome is the v3.8 success-metrics table in `RESPONSIVE-AUDIT.md` Part 13.8 going green: 0 routes horizontal-scroll, <2.5s P75 mobile LCP, ≥85 Lighthouse mobile perf, 0 Pattern-11 dead zones, 0 `<Image>` without `sizes`, 100% per-detail JSON-LD coverage, and a lint gate flipped to `error` so the work doesn't decay.

---

## Scope boundary — sizing-only, not design

This plan changes **sizes, units, fluidity, layout primitives, touch targets, and consistency mapping**. It does **not** change colors, brand gradients, typeface families or weights, copy, imagery, iconography, page composition, animation choreography, or information architecture (the one IA exception is `ResourceCenterSidebar` mobile, called out in audit Part 10 as a sizing-adjacent fix). At the 1440 Figma anchor, the design should be perceptibly identical pre/post. Only what happens at 375 / 768 / 1024 / 1280 / 1920 changes — because today those viewports are broken. The `button.tsx` minimum-size raise (24/28/32/36 → 44 floor) looks like a design change but is a WCAG 2.5.8 compliance fix; color, gradient, radius, label, hover state stay identical.

---

## Consistency layer — mapping rules (Sprint 1 Day 1 deliverable)

Before any component is touched, Sprint 1 Day 1 produces a **mapping table** in `apps/web/docs/design-tokens.md` that locks how each *role* across the site uses the new tokens. Without this lock, two developers refactoring two pages would pick different tokens for visually identical roles and re-introduce inconsistency. The table is the single source of truth; the lint gate (Sprint 1 Day 4) enforces non-token usage but does not enforce *which* token — this table does.

**Typography role → token mapping** (locked across every page, every section, every card):

| Role | Token | Example use |
|---|---|---|
| Page display H1 (hero) | `--text-display-lg` | `Hero.tsx`, `AboutHero.tsx`, `VulnHero.tsx`, `FipsHero.tsx`, `AsrHero.tsx`, `CleanSightHero.tsx`, `CleanStartImagesHero.tsx`, `SbomHero.tsx`, all listing-page heroes |
| Section H2 | `--text-display-md` | every section heading site-wide |
| Sub-section H3 / feature-card title (hero) | `--text-card-title-xl` | `FactoryCard`, `AboutPowering FeatureCard`, hero-rank feature cards |
| Standard card title (H3/H4) | `--text-card-title-lg` | `SecurityNotPatching` headers, `HowCleanStartHelp` feature card titles, `AsrApproach`, `AsrFitsBuilt`, `AboutWhoWeAre` pillars, `AboutPowering`, every standalone card title |
| Compact card title (blog/news/podcast/event/resource) | `--text-card-title-md` | `BlogCard`, `NewsroomCard`, `ResourceCard`, `EventCard`, `WebinarCard`, `PodcastEpisodeCard`, `PodcastCTACards` |
| Pill / tab / micro-heading | `--text-card-title-sm` | tabs in `ResourcesInsights`, pill labels site-wide |
| Lead body (section intro paragraph) | `--text-body-xl` | every lead-paragraph that sits below an H2 |
| Card body (default) | `--text-body-lg` | `SecurityNotPatching` bullet items, `HowCleanStartHelp` feature body, `ReadyToSecureCTA` body, `ResourcesInsights`, every standard card body |
| Card body (compact) | `--text-body-md` | secondary text in cards, descriptions in compact grids, button-adjacent helper text, marquee strap |
| Meta / caption | `--text-body-sm` | timestamps, author meta, share-rail labels, table cells |
| Eyebrow / breadcrumb / tag | `--text-body-xs` | eyebrows, breadcrumbs, kicker labels |
| Primary CTA label | discrete `--btn-fs-lg` (20px) | every hero/primary action button |
| Secondary CTA label | discrete `--btn-fs-md` (16px) | inline secondary buttons |
| Utility CTA label (`data-cta-utility`) | discrete `--btn-fs-sm` (14px) | filter chips, breadcrumb home, dense controls |

**Section vertical-padding role → token mapping** (locked):

| Section type | Token | Where |
|---|---|---|
| CTA-overlap reservation (sits above Footer) | `--space-section-cta` (160→250) | every page's last section before `<Footer />` |
| Feature / hero-adjacent | `--space-section-lg` (80→150) | high-prominence sections (`CleanStartAdvantage`, ASR hero-pair, `VulnHero` second pane) |
| Standard | `--space-section-md` (64→120) | the majority of body sections |
| Tight / sequential card grid | `--space-section-sm` (48→80) | grid sections where rhythm needs to be denser (`PastEventsGrid`, `LatestBlogs`, `NewsroomGrid`) |

**Card-padding role → token mapping** (locked):

| Card type | Token | Where |
|---|---|---|
| Hero / feature card | `--space-card-lg` (24→40) | `FactoryCard`, `AboutPowering FeatureCard`, `ReadyToSecureCTA` Kubr card |
| Standard card | `--space-card-md` (20→32) | `BlogCard`, `NewsroomCard`, `ResourceCard`, `EventCard`, `WebinarCard`, `PodcastEpisodeCard`, `PodcastCTACards`, `ComparisonCard` |
| Compact card | `--space-card-sm` (16→24) | pill cards, dense lists, sidebar items |

**Radius / corner consistency** (locked, not fluid):

| Element | Token | Value |
|---|---|---|
| Hero / feature cards | `--radius-cs-card-lg` | 40px |
| Standard cards | `--radius-cs-card` | 24px |
| Pills / buttons | `--radius-cs-pill` | 8px |
| Round (full) | `rounded-full` | n/a |

**Decorative-position consistency** (locked formula):

| Element scope | Formula |
|---|---|
| Inside `max-w-[1276px]` content rail | `(figmaPx / 1276) * 100%` |
| Spans beyond the rail (full-bleed blobs, hero grids) | `(figmaPx / 1920) * 100%` |
| Hide below md if decorative-only | `hidden md:block` |
| SVG with intrinsic ratio | `viewBox` + `xMidYMid meet` (NEVER `preserveAspectRatio="none"`) |

**Grid-reflow consistency** (locked breakpoints):

| Grid type | Template |
|---|---|
| 3-up card grid | `grid-cols-1 md:grid-cols-2 xl:grid-cols-3` |
| 2-up content + sidebar | `grid-cols-1 lg:grid-cols-[1fr_1fr]` or `lg:grid-cols-[Xpx_1fr]` with `lg:` only |
| Auto-fit card grid | `grid-template-columns: repeat(auto-fit, minmax(min(100%, 320px), 404px))` — copy from `PastEventsGrid.tsx` |

**This table is the contract.** Every sprint's PR description quotes the rows it touched and confirms the mapping was followed. The cross-page consistency review at Sprint 5 Day 5 (added below) verifies no drift.

### Typography research — best practices for CMS prose vs marketing copy

The clamp ranges above are not arbitrary. They are anchored to established research on reading comfort, line length, and accessibility. Marketing display copy and CMS long-form prose have **different optima** — the plan distinguishes them explicitly so the same `--text-body-*` tokens are not used in places where they're wrong.

**Sources consulted (industry consensus as of 2026):**

- Butterick, *Practical Typography* — body text 15–25px range; 45–90 characters per line; line-height 1.2–1.45× type size for body.
- Nielsen Norman Group, *Legibility, Readability, and Comprehension* (2024) — minimum 16px for primary body on web; 18px+ improves comprehension on long-form by measurable margin.
- WCAG 2.2 SC 1.4.4 — text must be resizable to 200% without loss; SC 1.4.12 — paragraph spacing ≥ 2× font, line height ≥ 1.5×, letter spacing ≥ 0.12em, word spacing ≥ 0.16em.
- web.dev *typography for reading on the web* (2024) — recommends `clamp()` with line-height-via-`calc()` correlation; body 1rem–1.25rem; line-height 1.5–1.7 for prose.
- Established CMS / long-form reference sizes (at 100% desktop zoom): Medium body ≈ 21px, Substack body ≈ 20px, NYT body ≈ 17–18px, The Verge ≈ 18px, Stripe blog ≈ 19px.
- A List Apart / Smashing — H1 sits at ~2.5–3× body; H2 ~1.8–2.2× body; H3 ~1.4–1.6× body; H4 ~1.2× body.
- Apple HIG / Material 3 — minimum interactive text 14px; minimum non-interactive body 12px (caption only). Below 12px is non-compliant on iOS and Material.

**Two regimes, distinct token assignments:**

1. **Marketing / display copy** (home, about, vuln, fips, asr, cleansight, cleanstart-images, sbom, knowledge-hub overview, resource-center, blogs/news/events/podcast/webinars listing pages, all CTAs, all card-grid pages). Uses the role→token table above. Display sizes are large (`--text-display-lg` peaks at 4.5rem = 72px at 1920). Body sizes in cards run smaller because cards are scanning surfaces, not reading surfaces.

2. **CMS prose / long-form reading** (blog detail body, news detail body, knowledge-hub article body, resource detail body, event detail body — anywhere `.article-body` or a Lexical rich-text renderer lays out content). Uses the **CMS-prose typography subtable** below. Body sizes are *larger* than card bodies because the page's job is sustained reading, not scanning. Line length is constrained to 60–75 characters (already locked via `BlogDetailContent.tsx` 680px reading column — gold-standard pattern).

**CMS-prose typography subtable** (applies inside `.article-body` and any Lexical-render container; lives in `globals.css` `.article-body` selectors — already partially correct, this locks the ranges):

| Element | Clamp range | Anchor at 375 → 1920 | Line height | Rationale |
|---|---|---|---|---|
| `h1` (article title — usually rendered in DetailHero, not body) | `clamp(2rem, 4.8vw, 3.5rem)` | 32→56px | 1.1 | Largest hierarchy stop; sits above body without dwarfing it |
| `h2` (section heading) | `clamp(1.5rem, 2.6vw, 2.25rem)` | 24→36px | 1.2 | ~2× body; clear scan stop |
| `h3` (sub-section) | `clamp(1.25rem, 1.9vw, 1.75rem)` | 20→28px | 1.25 | ~1.5× body |
| `h4` | `clamp(1.125rem, 1.4vw, 1.375rem)` | 18→22px | 1.3 | ~1.2× body |
| `p` (body) | `clamp(1.0625rem, 1.2vw, 1.1875rem)` | 17→19px | 1.65 | The single most-touched declaration; sits inside Medium/Substack/NYT consensus band |
| `blockquote` | `clamp(1.125rem, 1.5vw, 1.375rem)` | 18→22px | 1.5 | Slightly larger than body to signal pull-quote |
| `code` / `pre` | `clamp(0.875rem, 1.05vw, 1rem)` | 14→16px | 1.55 | Monospace renders ~10% smaller optically; the floor is 14px |
| `figcaption` | `clamp(0.875rem, 0.95vw, 1rem)` | 14→16px | 1.45 | Below body; never below 14 |
| Inline `<a>` | inherits `<p>` | n/a | n/a | Underline at all sizes per WCAG 1.4.1 |
| `ul`/`ol` `li` | inherits `<p>`; gap `0.5em` between items | n/a | 1.6 | Match prose; consistent rhythm |
| `hr` decorative | n/a | n/a | n/a | 1px solid; spacing `2em` block both sides |
| Lexical heading-anchor offset | `scroll-margin-top: clamp(80px, 10vw, 120px)` | 80→120px | n/a | Compensates for the sticky Header height; identical at every breakpoint |

**Line-length / reading-column rules** (locked):

- CMS body column: `max-width: 680px` (≈66ch at 1rem; matches `BlogDetailContent.tsx` gold standard).
- News body column: same 680px (matches `NewsDetailBody.tsx` 820px outer with embedded 680px reading column).
- Resource detail body column: same 680px.
- Knowledge-hub article body column: same 680px. **Plan locks this** — Sprint 5 Day 3 confirms the v3.1 audit found the same column convention; if it didn't, the article body gets the 680px column added as part of remediation.
- Mobile column: edge-to-edge minus page gutter (`px-6` = 24px), so column is effectively `100vw - 48px`. Line length on a 375px viewport ≈ 50–55ch, still inside the 45–75ch comfort band.

**Paragraph spacing & layout rules** (locked, from WCAG 1.4.12 + Butterick + web.dev):

- Paragraph-to-paragraph: `margin-block: 1em` (= `1× font-size`; with `line-height: 1.65` this yields the WCAG-compliant 2em "paragraph spacing" requirement automatically).
- Heading-to-following-paragraph: `margin-block-start: 1.8em` on the heading; `margin-block-end: 0.4em` on the heading.
- Heading-to-following-heading: `margin-block-start: 2em` on the lower-level heading.
- Lists: `padding-inline-start: 1.5em`; bullet/number marker color inherits `--text-muted` token (existing).
- Letter spacing on `<h1>`/`<h2>`: `-0.02em` (tight, matches the marketing display tokens for visual rhythm continuity); body letter spacing: `0`.

**What this DOES NOT change:**

- Existing `.article-body` selectors in `globals.css` are already mostly correct (audit Part 4 verified). This subtable **locks the ranges** so future edits don't drift; it does not require a wholesale rewrite. Sprint 5 Day 2 (Blog detail + Resource detail) verifies the existing selectors fall inside the locked ranges; out-of-range selectors get nudged in.
- The **`BlogDetailContent.tsx`** 260px-TOC + 680px-body + 1120px-outer column system is the gold standard and is reused as-is. The plan does not redesign it.
- The **`NewsDetailBody.tsx`** 820px reading column is the gold standard for news (slightly wider because no inline TOC) and is reused as-is.

**Card body vs CMS prose body — explicit non-confusion rule:**

| Surface | Token | At 1440 | Rule |
|---|---|---|---|
| Card body (scanning surface) | `--text-body-lg` | ~22px | Capped because cards are scanned, not read. Lines short. |
| CMS prose body (reading surface) | `.article-body p` clamp | ~18px | Optimized for sustained reading, not for visual weight. |

**Why these aren't the same value:** a 22px body inside a 680px reading column produces ~50ch lines, which is *below* the comfort band for sustained reading and forces awkward wraps. The CMS-prose body must come down to ~18px to deliver 60–66ch in the same column. Conversely, a 18px body inside a wide card looks frail. Two distinct optima, two distinct tokens, never confused.

---

## Critical files (modified across the plan)

**Token & infra (Sprint 1):**
- `apps/web/src/app/globals.css` — extend `@theme` with `--text-card-title-*`, `--text-body-*`, `--space-section-*`, `--space-card-*` (Part 7); add `html { scrollbar-gutter: stable }`; later: refactor `.cs-tt-*` block (Sprint 3)
- `apps/web/src/app/layout.tsx` — add `viewportFit: "cover"` to the `Viewport` export; add `safe-area-inset` padding on sticky elements
- `apps/web/src/app/page.tsx` — add `metadata` export (og, canonical, twitter)
- `apps/web/biome.json` + new `apps/web/eslint.config.mjs` — `eslint-plugin-tailwindcss` + custom regex rules; warn-first
- `apps/web/playwright.config.ts` (new) + `apps/web/tests/e2e/*.spec.ts` (new) — 6-viewport visual + axe scaffold
- `.github/workflows/web.yml` — re-enable Lighthouse step with CMS-route allowlist; add bundle-budget gate
- `apps/web/.lighthouserc.json` — trim URL set to routes that don't fetch CMS at runtime
- `packages/ui/src/tokens.css` (new or extend) — mirror tokens for `apps/cms` consumption (Part 12 #11)

**Product / compliance P0 (Sprint 1 + 2):**
- `apps/web/src/components/sections/resource/ResourceDetailHero.tsx` + `ResourceGateModal.tsx` + `ResourceDetailLeadCapture.tsx` — wire Hero CTA through gate
- `apps/web/src/components/ui/button.tsx` — raise minimum CTA size variants to 44×44; reclassify smaller as `data-cta-utility`
- `apps/web/src/components/sections/_shared/DetailHero.tsx` — breadcrumb home 32→44

**UI primitives (Sprint 2):**
- `apps/web/src/components/ui/{FactoryCard,ComparisonCard,RocketFlame}.tsx` — refactor per Recipe 1/6

**Home + Pattern-11 collapse (Sprint 3):**
- `apps/web/src/components/sections/home/{SecurityNotPatching,HowCleanStartHelp,BuiltForTeams,ReadyToSecureCTA}.tsx`
- `apps/web/src/app/globals.css` `.cs-tt-*` block (lines ~903–1214)
- `apps/web/src/components/sections/cleansight/{CleanSightSecurity,CleanSightComparison}.tsx`

**Card grids + About + ASR + v3.1 audit (Sprint 4):**
- `apps/web/src/components/sections/blogs/{BlogCard,LatestBlogs,BlogsHero,BlogsHeroSearch,BlogsCTA}.tsx`
- `apps/web/src/components/sections/newsroom/{NewsroomCard,NewsroomGrid,NewsroomHero}.tsx`
- `apps/web/src/components/sections/podcast/PodcastCTACards.tsx` (finish the partial-fix)
- `apps/web/src/components/sections/events/UpcomingEventHero.tsx`
- `apps/web/src/components/sections/about/{AboutHero,AboutOurStory,AboutOurVision,AboutWhoWeAre,AboutPowering,AboutEcosystems,AboutCTA}.tsx`
- `apps/web/src/components/sections/attack-surface-reduction/{AsrHero,AsrPublicImages,AsrApproach,AsrFitsBuilt,AsrCTA}.tsx`
- `apps/web/docs/RESPONSIVE-AUDIT.md` — write v3.1 supplement covering SBOM (5) + Knowledge Hub (2) + Author (4) + Podcast Waveform (1)

**Other pages + v3.1 remediation + lockdown (Sprint 5):**
- `apps/web/src/components/sections/fips/*.tsx`, `vulnerability-remediation/VulnAdvantage.tsx`
- `apps/web/src/components/sections/blog/{BlogDetailCTA,BlogDetailRelatedPosts}.tsx`, `_shared/DetailHero.tsx`
- `apps/web/src/components/sections/resource-center/{ResourceCenterSidebar,ResourceCard,ResourceCenterCTA}.tsx` + IA rebuild
- `apps/web/src/components/sections/resource/{ResourceDetailContent,ResourceDetailLeadCapture}.tsx`
- `apps/web/src/components/sections/webinars/{WebinarFilters,WebinarsGrid,WebinarCard}.tsx`
- `apps/web/src/components/sections/{sbom,knowledge-hub,author,cleanstart-images}/*.tsx` + `podcast/_components/Waveform.tsx`
- `apps/web/src/lib/seo/jsonld.tsx` consumers in `blog/[slug]/page.tsx`, `news/[slug]/page.tsx`, `events/[slug]/page.tsx`, `podcast/[slug]/page.tsx` (or wherever the routes live)

---

## Existing patterns / utilities to reuse (do NOT reinvent)

The audit identifies these as gold-standard; they are the templates for every new piece of work:

- **`apps/web/src/components/ui/button.tsx`** — CVA + Tailwind tokens, zero fixed px. **Template for every primitive.** The size scale is the right shape; Sprint 2 raises the minimum step to 44 and adds the `data-cta-utility` opt-out.
- **`apps/web/src/components/sections/home/HeroOrb.tsx`** — SVG viewBox + container queries + `clamp(220px, 26cqi, 340px)`. **Template for decorative-heavy components.**
- **`apps/web/src/components/sections/events/PastEventsGrid.tsx`** — `repeat(auto-fit, minmax(min(100%, 320px), 404px))`. **Template for every card grid** (BlogCard, NewsroomCard, PodcastCTACards, ResourceGrid).
- **`apps/web/src/components/sections/blog/BlogDetailContent.tsx`** — 260px TOC + 680px body + 1120px outer. **Template for long-form layouts.**
- **`apps/web/src/components/sections/blog/BlogDetailAuthor.tsx`** — `clamp(96px, 12vw, 144px)` photo + responsive padding/gap. **Template for bio/profile cards.**
- **`apps/web/src/components/sections/vulnerability-remediation/VulnBlogsResources.tsx`** — every text/tab/gap/padding clamp. **Template for section-level rhythm.**
- **`apps/web/src/components/sections/fips/FipsEnables.tsx`** — decorative positions via `(x / HUB_W) * 100%`. **Template for decorative placement.** Also `FipsCTA.tsx` / `AsrCTA.tsx` for `calc(x / 1276 * 100%)`.
- **`apps/web/src/app/globals.css` `.cs-orb*`** — `aspect-ratio: 1280/520` + `clamp(220px, 26cqi, 340px)`. **Template for CSS-side sizing.**
- **`apps/web/src/lib/seo/jsonld.tsx`** — already defines `BlogPosting`/`NewsArticle`/`Event`/`PodcastEpisode` schemas. **Reuse, do not redefine.** Sprint 5 just calls these from the detail routes.

The Part 7 token system (already documented at length in the audit) and the six Appendix-A recipes are the operating manual. The plan does not duplicate them here — work the doc.

---

## Sprint 1 — Foundations + P0 product fix (5 days)

**Goal:** ship the gate that prevents regression and unblock everything else. Nothing visual ships this sprint except the gating fix.

**Day 1 — Tokens (A1) + safe-area + scrollbar-gutter (A5) + consistency mapping doc.** Extend `globals.css @theme` with the new tokens (Part 7). Mirror to `packages/ui/src/tokens.css`. Add `viewportFit: "cover"` to `apps/web/src/app/layout.tsx`. Add `html { scrollbar-gutter: stable }`. Add `padding-block-end: env(safe-area-inset-bottom)` on `MobileNav` sheet and sticky `Header` elements. **Write the Consistency Layer mapping table** (above) into `apps/web/docs/design-tokens.md` and link it from `apps/web/docs/typography.md` and from the `apps/web` section of root `CLAUDE.md`. Zero component changes; visual diff must be no-op except for the safe-area additions on iOS.

**Day 2 — Playwright + axe-core + visual regression (A2).** Add `playwright.config.ts` with 6 viewports (375 / 768 / 1024 / 1280 / 1440 / 1920). Write one `*.spec.ts` per top-10 route that: navigates, asserts `window.innerWidth - document.documentElement.scrollWidth === 0` (no horizontal scroll), runs `@axe-core/playwright` and fails on serious/critical, captures a screenshot baseline. Top-10 routes: `/`, `/about-us`, `/cleansight`, `/cleanstart-images`, `/vulnerability-remediation`, `/fips`, `/attack-surface-reduction`, `/blogs`, `/news`, `/resource-center`. Wire to `.github/workflows/web.yml`.

**Day 3 — Lighthouse CI re-enable (A2 continued) + bundle budget (A4).** Trim `.lighthouserc.json` URL set to routes that don't fetch CMS at runtime (home, blogs index, static legal pages). Re-enable the workflow step — drop the `if: false` at `web.yml:97`. Targets: mobile perf ≥85, a11y ≥95, BP ≥95, SEO ≥95. Add `@next/bundle-analyzer`-driven CI assertion: top-3 routes ≤220 KB gz P50, 260 KB P99. Capture baseline (A6) and record in the v3.8 metrics table.

**Day 4 — Lint gate, warn-first (A3).** Install `eslint-plugin-tailwindcss`. Write `apps/web/eslint.config.mjs` with `no-arbitrary-value` (warn). Add custom regex rules (warn) for: `text-\[.*rem\]`, bare `h-\[.*px\]` on `*Card*` files, bare `w-\[.*px\]` without `max-w` qualifier, `preserveAspectRatio="none"`, flat-px `fontSize:` in inline-style props outside allow-list, `<Image>` JSX without `sizes` prop, `<br />` inside `<p>`/`<h1>`/`<h2>`/`<h3>`. Document the allow-list and the `data-cta-fluid` / `data-cta-utility` escape hatches in `apps/web/docs/typography.md` and `apps/web/docs/design-tokens.md`. Capture baseline warn-count; this becomes the **regression floor** — subsequent PRs cannot increase it.

**Day 5 — Resource gating fix (B1) + home metadata (B2).** `ResourceDetailHero.tsx` Download CTA: if the resource has `gateForm`, open `ResourceGateModal` (already exists from commit `3f009c4`) or scroll to `#lead-capture`; only when the form is submitted, stream the asset. Add Playwright E2E: gated asset cannot be fetched without form submit. Update `apps/web/src/app/page.tsx` with a `metadata` export (title, description, og:url, og:image, canonical, twitter:card).

### Sprint 1 — Review & Visual Check gate

- ☐ Playwright suite runs in CI; all 10 routes captured at 6 viewports; baselines committed.
- ☐ Lighthouse CI green on the allowlisted routes; baseline numbers recorded in v3.8 table.
- ☐ Bundle budget green; baseline gz sizes recorded.
- ☐ Lint warn-count recorded; PR description quotes the count as the regression floor.
- ☐ `tsc --noEmit`, `pnpm --filter @cleanstart/web lint`, `pnpm --filter @cleanstart/web build` all clean.
- ☐ Manual visual check at 375 / 1024 / 1440 / 1920 of: home, about-us, resource-center, one resource detail with `gateForm`. **The gated resource MUST require form submit to download** — capture before/after screenshots in the PR.
- ☐ axe-core has 0 serious/critical violations on the 10 routes.
- ☐ Tag PR `respaudit-sprint-1`. CTO + senior-eng sign-off in PR before merge.

---

## Sprint 2 — Image perf + compliance + UI primitives (5 days)

**Goal:** the highest-leverage perf and compliance wins ship; the three primitives that propagate across the site are refactored.

**Day 1 — Touch targets (B3).** `ResourceDetailLeadCapture.tsx` checkbox 14×14 → 24×24 wrapped in 44×44 hit area. `WebinarFilters.tsx` checkbox 20×20 → same. `DetailHero.tsx` breadcrumb home `w-8 h-8` → `w-11 h-11` (44×44). Hero search button on multiple pages 42×42 → 44×44. **`button.tsx`** size scale: raise floor variants to 44 high, add `data-cta-utility` opt-out for inline/dense uses (filter chips, breadcrumbs). Add ESLint rule: `<Button>` without `data-cta-utility` must compute to ≥44 px. axe-core `target-size` rule wired to fail CI.

**Day 2 — `<Image sizes>` sweep (B4).** Walk every `<Image>` and `<img>` in `apps/web/src/`. Add `sizes` matching actual rendered widths per breakpoint. Convert oversized hero `width/height` props. Special attention: CleanStart Images surface (5 files, currently zero `sizes`), home FAQ grids (`page.tsx:109, 121, 133`), `SecurityNotPatching` Kubr, `HowCleanStartHelp` SVG. The lint rule from Sprint 1 catches new additions; this day clears the existing backlog.

**Day 3 — Dynamic imports (B5) + per-detail JSON-LD (B6) + `<br />` removal (B7).** `dynamic({ ssr: false })` for `BuiltForTeams` carousel (479L), `CleanSightSecurity` (900L — flag for collapse in Sprint 3), `CleanSightComparison`, `PodcastCTACards`, `YouTubeEmbed`, `WebinarFilters`. Emit `BlogPosting / NewsArticle / Event / PodcastEpisode` from `lib/seo/jsonld.tsx` on the four detail route page components. Remove `<br />` from prose: `AboutHero`, `AboutOurStory` (×6), `AboutEcosystems` H2, `CleanStartImagesEasyStart:114`. Validate one detail route per type in Google Rich Results Test.

**Day 4 — `FactoryCard.tsx` refactor (C1.1).** Apply Recipe 1: `@container/card`, flex column, `min-h-[clamp(280px, 28vw, 374px)]`, `aspect-[220/164]` orb wrapper, `text-card-title-xl` title, `text-body-md` body. Verify all consumers (Home factory section + others) at 6 viewports.

**Day 5 — `ComparisonCard.tsx` + `RocketFlame.tsx` (C1.2, C1.3).** ComparisonCard: `w-full max-w-[622px]`, `text-card-title-md` / `text-body-md`, header `h-[clamp(80px, 7vw, 112px)]`, padding `px-[clamp(20px, 3vw, 48px)] py-[clamp(20px, 2.5vw, 36px)]`. RocketFlame default `height: clamp(120px, 14vw, 220px)`. Verify on every consuming page.

### Sprint 2 — Review & Visual Check gate

- ☐ Playwright visual baselines updated; per-route diff reviewed; no unintentional shifts.
- ☐ axe-core `target-size` clean across all 10 routes.
- ☐ Lighthouse mobile perf on home + blogs index: improvement vs Sprint 1 baseline recorded.
- ☐ Lint warn-count ≤ Sprint 1 baseline (no new violations introduced this sprint; ideally lower).
- ☐ Bundle budget green; the three `dynamic()` imports cut the home + cleansight + podcast initial bundles measurably (record numbers).
- ☐ Manual visual check at 375 / 1024 / 1440 / 1920 on every page that consumes `FactoryCard` / `ComparisonCard` / `RocketFlame`.
- ☐ JSON-LD validates on one sample of each detail type via Google Rich Results Test.
- ☐ Gated download flow re-tested at 375 + 1440 (regression check from Sprint 1).
- ☐ Tag PR `respaudit-sprint-2`. CTO + senior-eng sign-off.

---

## Sprint 3 — Home + Pattern-11 collapse (5 days)

**Goal:** the home page (highest-traffic route) and the two CleanSight Pattern-11 dead-zone offenders are remediated. Highest visual-impact sprint.

**Day 1 — `SecurityNotPatching.tsx` + `HowCleanStartHelp.tsx`.** SecurityNotPatching: `py-32` → `py-section-md`; `h-[441px]` → `min-h-[clamp(360px, 32vw, 441px)]`; 10× `text-[1.375rem]` → `text-body-lg`; header `text-[2rem]` → `text-card-title-lg`; Kubr `width: clamp(180px, 18vw, 290px)` + `aspect-[290/299]` + `hidden md:block`. HowCleanStartHelp: cards `min-h-[clamp(260px, 24vw, 308px)]`; feature `paddingLeft/Right: clamp(16px, 5vw, 70px)`; type → tokens; SVG L-shape `preserveAspectRatio="xMidYMid meet"`.

**Day 2 — `BuiltForTeams.tsx` JSX + `globals.css .cs-tt-*` CSS refactor.** The single hardest day. CSS: `.cs-tt-stage` `height: clamp(280px, 28vw, 360px)`; `.cs-tt-card--active` `width: min(798px, 100%); height: clamp(280px, 24vw, 329px)`; photos `width: clamp(200px, 20vw, 264px)`; quote/name/role typography clamp; `.cs-tt-peek` `width: clamp(380px, 46vw, 600px)`; replace `translate(-319px)` with container-query-relative positioning. JSX: description `text-xl` → `text-body-lg`. Verify the carousel still cycles correctly at 375, 768, 1024, 1280, 1440, 1920. **Fallback plan if the CSS refactor overruns:** ship the JSX-side improvements + feature-flag a static testimonial grid below `lg`; carry the CSS work to Sprint 5 day 5.

**Day 3 — `ReadyToSecureCTA.tsx` + smaller home items.** Grid `lg:grid-cols-[minmax(280px,401px)_minmax(360px,493px)]`; gap `lg:gap-x-[clamp(40px, 9vw, 115px)]`; padding `lg:p-[clamp(40px,6vw,80px)_clamp(48px,10vw,145px)]`; Kubr overlay `left: clamp(20px, 5vw, 63px)` + `width: clamp(180px, 18vw, 304px)`; description → `text-body-lg`. Plus: `TrustedByMarquee` `text-[1.1875rem]` → `text-body-md`; `CleanStartAdvantage` `lg:py-[150px]` → `lg:py-section-lg`; `CleanStartFactory` flame anchors `hidden <lg`; `Hero` button → `Button size="lg"` (no inline `--cs-btn-fs`).

**Day 4 — `CleanSightSecurity.tsx` collapse (Pattern 11).** Rewrite the desktop `hidden xl:block` parallel-layout section as a **single** responsive grid that survives 1024–1919. Use `@container/section` + `cqi` for card-internal type. Replace the 50+ absolute coordinates with a CSS grid + flex layout. Convert flat-px `fontSize: 20px / 16px` to `text-body-lg / text-body-md`. Land behind the `dynamic({ ssr: false })` import from Sprint 2 Day 3. **Designer signoff required at 1440 vs Figma + 1024 + 1920 before merge.**

**Day 5 — `CleanSightComparison.tsx` collapse (Pattern 11).** Same treatment. Collapse `1276×582` hardcoded desktop block + separate mobile block into one responsive grid. Convert `fontSize: 32px / 22px` to `text-card-title-lg / text-body-lg`. VS badge `clamp(64px, 7vw, 126px)` aspect-square. Designer signoff required.

### Sprint 3 — Review & Visual Check gate

- ☐ Pattern-11 dead-zone count = **0** (verified at 1024, 1280, 1440).
- ☐ Designer signoff on `CleanSightSecurity` + `CleanSightComparison` at 1440 (Figma anchor) + 1024 + 1920.
- ☐ Carousel cycles correctly on `BuiltForTeams` at all 6 viewports; `prefers-reduced-motion` honored.
- ☐ Lighthouse home page mobile perf shows measurable improvement vs Sprint 2 (the `<Image sizes>` + `dynamic()` + smaller home-page DOM compound here).
- ☐ Lint warn-count strictly ≤ Sprint 2 (this sprint touches the most lint-target files — expect a meaningful drop).
- ☐ Playwright visual diff: every home + cleansight screenshot reviewed pair-wise vs baseline.
- ☐ Manual screenshot capture at 375 / 768 / 1024 / 1280 / 1440 / 1920 of `/` and `/cleansight` attached to PR.
- ☐ Tag PR `respaudit-sprint-3`. CTO + senior-eng + designer sign-off.

---

## Sprint 4 — Card grids + About + ASR + v3.1 audit (5 days)

**Goal:** card-grid pages (Blogs, Newsroom, Podcast CTA, Events featured) reflow cleanly; About + ASR pages remediated; v3.1 audit produces the SBOM/Knowledge Hub/Author/Waveform punch list for Sprint 5.

**Day 1 — Blogs index + Newsroom card grids (C3).** `BlogCard.tsx` refactor to flex column per Recipe 2: `w-full max-w-[404px]`, `aspect-[380/200]` image, flex content, `text-card-title-md` / `text-body-md`. `LatestBlogs.tsx` grid → `grid-cols-1 md:grid-cols-2 xl:grid-cols-3`. `BlogsHero.tsx` `gridTemplateColumns: "513px 1fr"` → `grid-cols-1 lg:grid-cols-[513px_1fr]`; drop `whiteSpace: nowrap` on the clamp subtitle. `BlogsHeroSearch.tsx` `width: 622px` → `w-full max-w-[622px]`. `BlogsCTA.tsx` inner `width: 1047px` + `shrink-0` children → `flex-col lg:flex-row` with `w-full max-w-[*]`. Same treatment for `NewsroomCard.tsx`, `NewsroomGrid.tsx`. Fix `NewsroomHero.tsx` decorative `calc(50% + Xpx - 720px)` → re-key to 1276/2 = 638px or use `(x / 1276) * 100%`.

**Day 2 — Podcast CTA + Events featured.** `PodcastCTACards.tsx` finish the partial-fix from `9d0adef`: rewrite the 404×435 layout as a flex card (Recipe 2); the percentage guide lines are already correct. `UpcomingEventHero.tsx` featured card: add `flex-col lg:flex-row` switch, image `w-full max-w-[585px] aspect-[585/304]`, card `min-h-[clamp(300px, 30vw, 368px)]`. `EventCard.tsx` height → clamp; type → tokens.

**Day 3 — About page sweep (C4 part 1).** `AboutHero.tsx` paddings + 408×408 blobs → proportional; remove the one `<br />` if not handled in Sprint 2 Day 3. `AboutOurStory.tsx` `height: 600px` → `min-h-[clamp(420px, 40vw, 600px)]`; confirm `<br />` removal landed. `AboutOurVision.tsx` decorative vectors at `left: -393px` → proportional. `AboutWhoWeAre.tsx` drop `whiteSpace: nowrap`; pillar type → tokens; dividers `height: clamp(160px, 18vw, 249px)`. `AboutPowering.tsx` rewrite `FeatureCard` per Recipe 2 (flex column, no absolute internals). `AboutEcosystems.tsx` logo strip `flex-wrap` + gap clamp. `AboutCTA.tsx` button widths → `min-w` not `width`.

**Day 4 — Attack Surface Reduction sweep (C4 part 2).** `AsrHero.tsx` 560×500 `shrink-0` cards container → `aspect-ratio` + responsive width; `minHeight: 720` → clamp. `AsrPublicImages.tsx` `preserveAspectRatio="none"` → `xMidYMid meet`; 303px corner cards → percentage-positioned + clamp width. `AsrApproach.tsx` `fontSize: 32/22` → tokens; cell `paddingLeft/Right: 56` → clamp. `AsrFitsBuilt.tsx` card `min-h-[clamp(260px, 26vw, 352px)]`; type → tokens; decorative grid lines at `[68,166,224,322]` px → percentages. `AsrCTA.tsx` `fontSize: 16/15/18` → tokens.

**Day 5 — v3.1 audit (C5 audit only; remediation in Sprint 5).** Read forensically: SBOM (5 files at `apps/web/src/components/sections/sbom/*`), Knowledge Hub (2+ files), Author (4 files), Podcast Waveform (1 file). Produce Part 14 of `RESPONSIVE-AUDIT.md` in the same format as Part 13.3 (per-file verdict table, font-size table, worst-offenders shortlist). Output is a punch list for Sprint 5 Day 3.

### Sprint 4 — Review & Visual Check gate

- ☐ Blogs index, Newsroom, Podcast, Events all reflow `3 → 2 → 1` cleanly at 375 / 768 / 1024.
- ☐ No horizontal page scroll on any audited route at 375.
- ☐ About + ASR pages screenshotted at all 6 viewports; compared to Figma at 1440.
- ☐ Part 14 of `RESPONSIVE-AUDIT.md` published with v3.1 punch list.
- ☐ Lint warn-count ≤ Sprint 3 (large drop expected — Sprint 4 touches many lint-target files).
- ☐ Playwright visual diff reviewed for every blogs / newsroom / podcast / events / about / asr screenshot.
- ☐ Lighthouse on blogs index: mobile perf vs Sprint 3 baseline.
- ☐ Tag PR `respaudit-sprint-4`. CTO + senior-eng sign-off.

---

## Sprint 5 — Other pages + v3.1 remediation + CleanStart Images + lockdown (5 days)

**Goal:** clear the remaining pages (FIPS, Vuln, Blog detail, Resource Center, Resource detail, Newsroom detail, Webinars), remediate the v3.1 surfaces (SBOM, Knowledge Hub, Author, Waveform), fix CleanStart Images, sweep the long-tail Pattern-12/13 sites, and **flip lint to error**.

**Day 1 — FIPS + Vuln remainder + Blog detail (C4 part 3).** FIPS: `FipsHero` paddings → clamp; `FipsBall` size prop → clamp default; `FipsWhyMatters` card `min-h` → clamp; `FipsMaturityModel` ball + minH. Vuln: `VulnAdvantage.tsx` `gridTemplateColumns: "606px 595px"` → `grid-cols-1 lg:grid-cols-[1fr_1fr]`. Blog detail: `BlogDetailCTA.tsx` 6+ decorative elements → proportional coords; `BlogDetailRelatedPosts.tsx` card title `text-card-title-md`. `_shared/DetailHero.tsx` breadcrumb `flex-wrap`; `min-h: 480` → clamp.

**Day 2 — Resource Center IA rebuild + Resource detail + Newsroom detail + Events detail + Webinars.** `ResourceCenterSidebar.tsx` mobile IA: rebuild as horizontal pill scroller or `<details>` disclosure (architectural fix from Part 10). `ResourceCard.tsx` cover overlay already uses `cqw` — fix the card chrome (`328×354` absolute → flex column). `ResourceCenterCTA.tsx` `lg:w-[486/564/493]` → `minmax`. `ResourceDetailContent.tsx` 2-step typography → clamp. `ResourceDetailLeadCapture.tsx` 4 fixed widths → `minmax`; checkbox already fixed in Sprint 2. `WebinarFilters.tsx` rebuild as disclosure on mobile (the 299px sidebar is the bug). `WebinarsGrid.tsx` `gridTemplateColumns: "299px minmax(0, 1fr)"` → fully responsive. `NewsDetailRelated.tsx` type tokens. `events/[slug]/page.tsx` already uses `aspectRatio: 16/7` correctly — leave it.

**Day 3 — v3.1 surface remediation (C5 fix).** Apply the punch list from Sprint 4 Day 5 to SBOM (5 files), Knowledge Hub (2+ files), Author landing (4 files), Podcast Waveform. Expect mostly Pattern-13 (mixed clamp + flat px) sites, fixable via token replacement.

**Day 4 — CleanStart Images surface + Pattern 12/13 sweep (C6, C7).** `CleanStartImagesHero.tsx` paddings → clamp. `CleanStartImagesUVP.tsx` minHeight clamp. `CleanStartImagesEnvironment.tsx` clean up. `CleanStartImagesBrowse.tsx` tab bar `w-full max-w-[478px] h-[clamp(48px, 6vw, 64px)]`; flat `fontSize: 16px` → `text-body-md`. `CleanStartImagesEasyStart.tsx` GlowBall 46→48; `fontSize: 18/14` → tokens; `<br />` already removed in Sprint 2. `CleanSightUnified.tsx` Pattern-12 fix: convert template-literal `${px}` decorative coords to `(x / containerWidth) * 100%` or SVG `viewBox`. Grep for any remaining mixed clamp+flat-px sites; convert each.

**Day 5 — Cross-page consistency audit + lockdown (C8).** Before flipping the lint gate to error, run a **cross-page consistency pass** at 1440: open every page in `docs/WEB-PAGES.md` side-by-side and verify (a) every section H2 renders at the same visual size, (b) every lead body paragraph at the same visual size, (c) every card title in the same role bucket matches, (d) every section padding bucket renders at the same vertical rhythm, (e) every card radius matches its role from the mapping table, (f) every primary CTA height matches and label sits at the same baseline, (g) every grid-reflow page (Blogs / Newsroom / Podcast / Events / Resource Center / Knowledge Hub / Author) reflows 3→2→1 at the same breakpoints. Capture before/after montage screenshots (one row per role × 6 viewports) and attach to the closing PR. Any drift found gets fixed before the lint flip. Then flip every lint rule from `warn` to `error` in `apps/web/eslint.config.mjs`. Resolve any remaining warns (should be near-zero by now). Update `apps/web/docs/typography.md` with the locked-in token rules. Update `CLAUDE.md` `apps/web` section: "use tokens, not arbitrary `text-[Xrem]`"; "card heights → `min-h-[clamp()]`, never `h-[Xpx]`"; "card widths → `w-full max-w-[Xpx]`, never bare `w-[Xpx]`"; "no `<br />` in prose"; "every `<Image>` requires `sizes`"; "buttons use the discrete size scale; minimum is 44 unless `data-cta-utility`". Final Lighthouse + bundle + Playwright run; record v3.8 metrics as **DONE**.

### Sprint 5 — Review & Visual Check gate (final)

- ☐ Lint flipped to `error`; CI fails on any new arbitrary value, bare `h-[*px]` on cards, bare `w-[*px]` without `max-w`, `preserveAspectRatio="none"`, flat-px inline `fontSize:`, `<Image>` without `sizes`, `<br />` in prose.
- ☐ All v3.8 success metrics measured and recorded as **DONE** in `RESPONSIVE-AUDIT.md`:
  - 0 routes horizontal-scroll at 375 (Playwright)
  - Mobile LCP < 2.5s P75 on home + blogs + resource-detail (Vercel Speed Insights)
  - Lighthouse mobile perf ≥ 85 on allowlisted routes
  - 0 Pattern-11 dead zones
  - 0 `<Image>` without `sizes`
  - 0 `preserveAspectRatio="none"` (except mathematically required — none in current code)
  - 0 `<br />` in prose
  - 0 touch targets < 44×44 on primary CTAs; utility variants documented
  - 100% per-detail JSON-LD coverage (BlogPosting / NewsArticle / Event / PodcastEpisode)
  - Bundle ≤ 220 KB gz P50 / 260 KB P99 on top-3 routes
- ☐ Final designer pass at 1440 against Figma for: home, about-us, cleansight, cleanstart-images, vulnerability-remediation, fips, attack-surface-reduction, blogs, news, resource-center, podcast, webinars, events, sbom, knowledge-hub, author landing.
- ☐ Final manual visual check at 375 / 768 / 1024 / 1280 / 1440 / 1920 on every page in `docs/WEB-PAGES.md`. Capture screenshots and attach to the closing PR.
- ☐ Update `apps/web/docs/RESPONSIVE-AUDIT.md` with closing note: v3 plan executed; metrics green; lint locked.
- ☐ Tag PR `respaudit-sprint-5`. CTO + senior-eng + designer sign-off.

---

## Cross-sprint review & visual check protocol

After **every** sprint, the same gate runs. This is the contract that prevents regression and keeps the work shippable.

**Pre-merge checklist** (the PR description must quote each line):

1. **Build gates** — `pnpm --filter @cleanstart/web lint ✓`, `pnpm --filter @cleanstart/web typecheck ✓`, `pnpm --filter @cleanstart/web build ✓`.
2. **Test gates** — Playwright suite green; axe-core 0 serious/critical; Lighthouse on changed routes ≥ targets; bundle budget green.
3. **Lint regression floor** — warn-count must not exceed the baseline established in Sprint 1. Cite both numbers in the PR.
4. **Visual check at 6 viewports** — 375 / 768 / 1024 / 1280 / 1440 / 1920 on every page touched. Use Claude Preview with `preview_resize` then `preview_screenshot`. Per `CLAUDE.md` `apps/web` section, default lock is desktop 1440×900; resize explicitly for each viewport check.
5. **No horizontal scroll** — Playwright assertion already enforces this; manual confirmation at 375 on the touched pages.
6. **Figma fidelity** — at 1440, screenshot matches Figma proportionally (designer signoff required on Sprints 3 and 5).
7. **Token discipline** — no new `text-[Xrem]`, no new bare `h-[Xpx]` on cards, no new flat-px inline `fontSize:`. The lint gate catches the file types; manual review catches the rest.
8. **Tag** — PRs tagged `respaudit-sprint-N` for traceability.
9. **Consistency mapping quote** — PR description quotes the specific rows of the Consistency Layer mapping table touched in that sprint, and confirms each component honors the role→token assignment. (E.g. Sprint 2 PR: "FactoryCard title → `--text-card-title-xl` per row 3; ComparisonCard title → `--text-card-title-md` per row 5.")
10. **Sign-off** — CTO + senior-eng on every sprint; designer on Sprints 3, 4 (v3.1 audit only), and 5.

---

## Verification — end-to-end

After Sprint 5 lands, the following commands and procedures verify the work end-to-end. Each must produce the asserted result for the plan to count as "done."

**Local checks (run from `apps/web/`):**

```bash
pnpm --filter @cleanstart/web lint            # must pass with the gate flipped to error
pnpm --filter @cleanstart/web typecheck       # must pass
pnpm --filter @cleanstart/web build           # must pass
pnpm --filter @cleanstart/web test:e2e        # full Playwright suite, 6 viewports × top-10 routes
pnpm --filter @cleanstart/web analyze         # bundle analyzer; top-3 routes ≤ 220 KB gz
```

**CI checks (`.github/workflows/web.yml`):**

- Lighthouse step is enabled (`if: false` removed) and green on the allowlisted routes.
- Bundle budget step green.
- Playwright + axe step green.

**Browser checks via Claude Preview MCP** (per `apps/web` workflow in `CLAUDE.md`):

1. `preview_start` locked to 1440×900.
2. For each of `/`, `/about-us`, `/cleansight`, `/cleanstart-images`, `/vulnerability-remediation`, `/fips`, `/attack-surface-reduction`, `/blogs`, `/blog/[any-slug]`, `/news`, `/news/[any-slug]`, `/resource-center`, `/resource/[any-gated-slug]`, `/events`, `/podcast`, `/webinars`, `/software-bill-materials`, `/knowledge-hub`, `/author/[any-slug]`:
   - `preview_resize` to each of 375 / 768 / 1024 / 1280 / 1440 / 1920.
   - `preview_screenshot` after `document.body.style.transform = 'translateY(-Xpx)'` to capture each section.
   - `preview_eval` to confirm `window.innerWidth - document.documentElement.scrollWidth === 0`.
   - `preview_console_logs` for zero errors.
3. Gated-resource flow: navigate to a resource with `gateForm`, attempt Download — must open the gate modal. Submit the form — only then does the asset stream.
4. axe-core via `@axe-core/playwright`: 0 serious or critical violations.

**Production-monitoring checks (post-deploy):**

- Vercel Speed Insights P75 mobile LCP < 2.5s on home, blogs index, resource detail.
- Google Rich Results Test passes on one sample blog post, news article, event, podcast episode.
- Sentry: zero new client-side errors from the refactored components within 72h of deploy.

**Closing artifact:** the v3.8 success-metrics table in `apps/web/docs/RESPONSIVE-AUDIT.md` is updated with measured values, and a closing note is added documenting plan completion.

---

## What this plan deliberately does not do

- **Does not redesign.** Translation problem, not art-direction.
- **Does not migrate frameworks.** Tailwind v4 `@theme` is the right tool; this plan uses what's there.
- **Does not introduce dark mode, RTL, or i18n** — flagged in Part 12 of the audit as future work, not in scope.
- **Does not audit or refactor `apps/cms`** — `packages/ui` token parity is the only CMS touch (Sprint 1 Day 1).
- **Does not write a print stylesheet, cookie banner, or PWA manifest** — separately ticketed.
- **Does not block on Safari `interpolate-size` / `calc-size()`** — wrap any usage in `@supports`; revisit Q3 2026.

---

## Risks & mitigations (carried from v3 §13.9)

- **Lighthouse CMS-fetching-route flakiness** → trim URL allowlist; defer detail routes to staging-CMS-enabled jobs.
- **CleanSight Pattern-11 collapse regresses designer-approved 1920 look** → designer signoff at 1440 + 1024 + 1920 before Sprint 3 merge.
- **`BuiltForTeams` CSS refactor overruns Sprint 3 Day 2** → fallback feature-flag a static testimonial grid below `lg`; carry CSS work to Sprint 5 Day 5.
- **`button.tsx` minimum-size raise breaks dense layouts** → `data-cta-utility` opt-out, documented and lint-allowed.
- **Lint gate too strict at flip-to-error** → only flip after Sprint 5 Day 5 with warn-count ≈ 0; allow-list documented with required justification comments.
- **Solo FE burnout** → 1-week sprints have one explicit review/visual-check day baked into the gate; pause sprint if the gate doesn't go green; resequence rather than skip.
