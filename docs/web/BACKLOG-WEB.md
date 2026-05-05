# BACKLOG-WEB.md — apps/web

Phase-by-phase plan for the public marketing site. Mirrors the CMS backlog
shape ([`docs/BACKLOG.md`](../BACKLOG.md)) but is gated on **design
availability**, not strict phase order — only Home is design-complete in
Figma today.

A wave does not unblock any individual page until that page's Figma artboard
is signed off (designer + product). All waves inherit the W-A and W-B tickets,
which run once at the start of W1.

> Source of truth for design contracts: [`docs/web/DESIGN-SYSTEM.md`](./DESIGN-SYSTEM.md)
> · for content contracts: [`docs/web/CONTENT-MODEL.md`](./CONTENT-MODEL.md)
> · for component contracts: [`docs/web/COMPONENT-MAP.md`](./COMPONENT-MAP.md)
> · for routing/preview/revalidate: [`docs/web/WEB-ARCHITECTURE.md`](./WEB-ARCHITECTURE.md).

---

## Route inventory — locked against live cleanstart.com

URLs verified verbatim from the live site sitemap (fetched 2026-05-05). Arch
doc `#migration` rule #1 forbids any pluralisation drift. Where the new-site
roadmap from product disagrees with live (one case: `/webinars` vs `/webinar`),
**live wins** unless product accepts the SEO cost — see
[`WEB-ARCHITECTURE.md §3`](./WEB-ARCHITECTURE.md#3--route-map-locked-against-live-cleanstartcom).

### Listings + marketing pages

| # | Page | URL (live verified) | Category | CMS source | Design | Wave |
|---|---|---|---|---|---|---|
| 1 | Homepage | `/` | Core | `pages` slug=`home` | **Done** | **W1** |
| 27 | 404 | `/404` | Utility | static; beacons CMS `404-monitoring` | static | **W1** |
| 2 | Attack Surface Reduction | `/attack-surface-reduction` | Solutions | `pages` | In design | W2 |
| 4 | FIPS Compliance | `/fips` | Solutions | `pages` | In design | W2 |
| 5 | Vulnerability Remediation | `/vulnerability-remediation` | Solutions | `pages` | In design | W2 |
| 6 | CleanSight | `/cleansight` | Products | `pages` | In design | W2 |
| 7 | CleanStart Images | `/cleanstart-images` | Products | `pages` | In design | W2 |
| 8 | Software Bill of Materials | `/software-bill-materials` | Products | `pages` | Pending | W2 |
| 3 | Software Composition Analysis | `/software-composition-analysis` | Solutions | `pages` | Pending | W2 |
| 9 | For CISO | `/for-ciso` | Solutions | `pages` | Pending | W3 |
| 10 | For Developers | `/for-developers` | Solutions | `pages` | Pending | W3 |
| 11 | Book a Demo | `/book-a-demo` | Core | `pages` + `forms` | Pending | W3 |
| 20 | Partners | `/partners` | Core | `pages` | Pending | W3 |
| 21 | Pricing | `/pricing` | Core | `pages` | Pending | W3 |
| 22 | About Us | `/about-us` | Company | `pages` + `aboutGalleries` | Pending | W3 |
| 25 | Contact Us | `/contact-us` | Company | `pages` + `forms` | Pending | W3 |
| — | Leadership | `/leadership` | Company | `pages` | Pending | W3 (live page; not in initial roadmap — confirm) |
| 13 | Blogs listing | `/blogs` | Resources | `blogs` | Pending | W4 |
| 14 | Knowledge Hub | `/knowledge-hub` | Resources | `guides` (collection lock pending) | Blocked | W4* |
| 15 | Newsroom | `/news` | Resources | `news` | Pending | W4 |
| 16 | Podcast | `/podcast` | Resources | `pages` v1 | Pending | W4 |
| 17 | Resource Center | `/resource-center` | Resources | `resources` | Pending | W4 |
| 18 | Events | `/events` | Events | `events` | Pending | W5 |
| 19 | Webinars | **`/webinar`** ⚠ | Events | `webinars` | Pending | W5 |
| 23 | Careers | `/careers` | Company | `jobs` | Pending | W5 |
| 24 | Community | `/community` | Company | `pages` | Pending | W5 |
| 26 | Teams | `/teams` | Company | `pages` | Pending | W5 |
| 28 | Legal Hub | `/legal` | Legal | `globals/legal` | Pending | W6 |
| 29 | Privacy Policy | `/privacy-policy` | Legal | `globals/legal.privacyPolicy` | Pending | W6 |
| — | Acceptable Use Policy | `/acceptable-use-policy` | Legal | `pages` | Pending | W6 (live) |
| 30 | Terms & Conditions | `/terms-and-condition` | Legal | `globals/legal.terms` | Pending | W6 (new — not on live) |
| — | Deal Registration | `/deal-registration` | Other | `pages` + `forms` | Pending | W3 (live) |
| — | Survey | `/survey` | Other | `pages` + `forms` | Pending | W3 (live) |
| — | Search | `/search` | Utility | InstantSearch UI | — | W4 (W-D-04) |

`*` = blocked on schema decision (arch doc `#decisions`)
`⚠` = SEO-significant difference between live URL and product roadmap. Default to live.

### Detail patterns (singular collection prefix — live verified)

| Collection | Detail URL | Live sample |
|---|---|---|
| `blogs` | `/blogs/[slug]` | `/blogs/busybox-container-security-risk` |
| `news` | `/news/[slug]` | `/news/cleanstart-wins-three-gold-awards-...` |
| `events` | `/event/[slug]` | `/event/kubecon-cloudnativecon-north-america-2025` |
| `webinars` | `/webinar/[slug]` (presumed; no live sample) | — |
| `jobs` | `/job/[slug]` | `/job/sales-engineer` |
| `resources` | `/resources/[slug]` | `/resources/breaking-the-migration-barrier` |
| `guides` | `/guide/[slug]` | `/guide/dockerfile` |
| `authors` | `/author/[slug]` | `/author/biswajit-de` |

These are authoritative in
[`apps/cms/src/payload/lib/route-prefixes.ts`](../../apps/cms/src/payload/lib/route-prefixes.ts) — the web app must consume that constant, not redefine.

### Migrated long-tail pages (must continue resolving — Phase H ETL)

The live sitemap also includes dated promotional pages and event microsites.
These migrate as `pages` rows or stay as raw redirects:

`/cleanstart-hitachi-chennai`, `/cleanstart-hitachi-bengaluru`,
`/cleanstart-hitachi-hyderabad`, `/cleanstart-raksha-chennai`,
`/new-year-event-sysdig`, `/new-year-event-eventus`, plus the per-event
microsites under `/event/<slug>` already covered above.

### Live "duplicate" pages — drop or redirect before launch

`/about-copy`, `/pricing-copy` are Webflow staging dupes. Add a **w6-XX**
ticket: confirm with product, then 301 to canonical (`/about-us`,
`/pricing`).

`*` = blocked on schema decision (arch doc `#decisions`)

---

## Cross-cutting tickets

These run **once**, during W1, and underpin every later wave.

### W-A · Bootstrap apps/web

**Acceptance**
- `apps/web/` directory exists with Next.js 16.2 App Router scaffold.
- `pnpm install` succeeds; `pnpm --filter @cleanstart/web dev` starts on a
  free local port.
- TypeScript strict; extends `packages/config/tsconfig.next.json`.
- Tailwind v4 wired; `app/globals.css` imports `tokens.css`.
- shadcn registry initialised (style: "new-york" or per design call); first
  primitive added.
- Biome configured (extends root); lint passes.
- Vitest + Playwright wired with a smoke test.
- `apps/web/CLAUDE.md` written (W-A0 sub-ticket — see template at end of
  this file).
- Coolify project created; deploys on push to `main`.
- Cloudflare DNS for `cleanstart.com` proxied + WAF rules per
  [`WEB-ARCHITECTURE.md §15`](./WEB-ARCHITECTURE.md#15--deployment).
- Sentry browser SDK installed (DSN behind env flag).
- `lib/env.ts` Zod-typed env loader with build-time validation.

**Out of scope**
- Any actual page implementation (those start in W1).
- Storybook (defer to W-B).

### W-B · Design system foundation

**Acceptance**
- `tokens.css` consumed; `apps/web/app/globals.css` exposes `@theme`.
- Typography utility classes documented (in
  [`DESIGN-SYSTEM.md`](./DESIGN-SYSTEM.md) §typography).
- Primitives shipped: `Button`, `IconButton`, `Input`, `Textarea`, `Select`,
  `Checkbox`, `Radio`, `Switch`, `Label`, `Tooltip`, `Dialog`, `Card`,
  `GlassSurface`, `Pill`, `Badge`, `Container`, `Section`, `MaxWidth`,
  `AspectFrame`.
- All primitives:
  - typed props from shadcn registry + project extensions
  - Storybook (or Ladle) story per primitive with all variants
  - `data-slot` and ARIA roles wired (Radix defaults)
  - dark-mode media-query stubs (return same tokens until designer ships dark)
- `pnpm figma:extract` is part of `pnpm dev` pre-step (or documented as a
  manual run — pick one in the ticket; **recommend manual** to avoid
  unintended Figma API calls).
- A Lighthouse-CI baseline runs on a sample primitives page; numbers
  recorded in the ticket.

**Out of scope**
- Block components (those are W-C tickets, one per Payload block).
- Page templates (W1+).

### W-C · Block components (one ticket per Payload block)

**Acceptance per block**
- Component file under `apps/web/components/blocks/` named
  `<BlockName>Block.tsx`.
- Props typed from `packages/types` (re-export of `payload-types.ts`); no
  hand-rolled prop types.
- **CVA variant names match Figma variant names verbatim**
  ([`COMPONENT-MAP.md` §rules](./COMPONENT-MAP.md#component-engineering-rules-apply-to-every-block)).
- **No new icon libraries.** Lucide for UI; `community-logos/` for
  integration marks.
- **Server Component unless interactivity demands `'use client'`.**
  Push client boundary to leaves.
- Storybook story with at least 3 variants (defaults, full content,
  empty/edge).
- **Visual side-by-side validation** before PR-ready: dev Storybook
  story next to `docs/web/figma-snapshots/<page>.png` (or the dev-mode
  Figma URL) — diff < threshold ships.
- Matches Figma artboard at desktop-1280 and mobile-360 within visual
  diff threshold (Playwright `expect(page).toHaveScreenshot()` w/
  tolerance).
- `data-block="<name>"` for analytics.
- A11y baseline: axe = 0 critical/serious; keyboard reachable; landmarks
  correct; **WCAG 2.2 SC 2.5.8 (target size ≥ 24×24)** and **2.4.11
  (focus not obscured)** verified.
- **Performance:** block adds ≤ 8 KB compressed JS to its parent route.
  If exceeded, spawn investigation sub-ticket.
- Documented in [`COMPONENT-MAP.md`](./COMPONENT-MAP.md) row.

**Block ticket list** (18, alphabetised; some unlock progressively as
designs land):

`CTA`, `CodeBlock`, `Embed`, `FAQ`, `FeatureGrid`, `FormBlock`, `Gallery`,
`Hero`, `IntegrationLogos`, `JobsList`, `LogoCloud`, `MetricsBar`, `Pricing`,
`RichText`, `Section`, `Stats`, `Table`, `Testimonial`.

> Note: the helper `cta-button.ts` in `apps/cms/src/payload/blocks/` is a
> shared field group, not a block — it ships as a typed sub-component, not
> its own ticket.

### W-D · Cross-cutting infra

| Ticket | Acceptance |
|---|---|
| `web-d-01 preview` | `/api/preview` JWT verifies, sets draftMode cookie, redirects to canonical path. `/api/exit-preview` clears state. Round-trip tested with a draft Page from CMS staging. |
| `web-d-02 revalidate` | `/api/revalidate` HMAC-verifies CMS webhook (`REVALIDATE_SECRET`), revalidates by tag (`<collection>:<slug>`, `<collection>:list`, `globals:<slug>`). Logs to Sentry. |
| `web-d-03 cms-fetch` | `lib/cms.ts` exports `fetchPublished`, `fetchDraft`, `fetchList`. All call paths cache-tagged correctly. Zero direct `fetch` in pages. |
| `web-d-04 search` | Meilisearch InstantSearch UI on `/search`. Public search-only key. Empty-state copy. |
| `web-d-05 jsonld` | `lib/seo/jsonld.ts` builders for Article, NewsArticle, JobPosting, Event, FAQPage, BreadcrumbList, Organization, WebSite, SoftwareApplication, VideoObject, Review. Snapshot-tested. |
| `web-d-06 sitemap` | `app/sitemap.ts` paginated; `app/sitemap-news.xml/route.ts` 48h window; `app/robots.ts`. |
| `web-d-07 a11y-ci` | `@axe-core/playwright` run on every PR; fail at zero serious/critical violations. |
| `web-d-08 analytics` | GA4 + GTM via `next/script`, consent-mode v2, dataLayer events: `page_view`, `lead_submit`, `cta_click`, `search`, `404_view`. |
| `web-d-09 indexnow-client` | (optional) IndexNow client ping fallback (CMS handles it primarily). |
| `web-d-10 404-monitor` | Client-side beacon to `/api/404-monitor` proxy. |
| `web-d-11 turnstile` | Turnstile client widget loader; submits token to lead-submit proxy. |
| `web-d-12 body-size guard` | `/api/leads/submit` proxy + CMS endpoint reject any request with `Content-Length > 64 KB` *before* parsing. Surface `413 Payload Too Large` with no body. (Audit finding — defence-in-depth on top of rate-limiter.) |
| `web-d-13 CORS allow-list` | CMS `/api/leads/submit` returns `Access-Control-Allow-Origin` matching `cleanstart.com` + `www.cleanstart.com` only. Web proxy is same-origin so unaffected; this future-proofs against direct cross-origin calls. |
| `web-d-14 CSV export limit header` | CMS `/api/leads/export-csv` adds `X-Result-Truncated: true` + `X-Result-Cap: 20000` headers when the 20k cap hits, and the admin UI surfaces a banner with a "schedule full export" CTA. |
| `web-d-15 JSON-LD validator gate` | CI step on every PR that walks rendered routes (or generator-snapshot fixtures), extracts every `<script type="application/ld+json">`, and validates with `schema-dts` (or Google Rich Results Test API). Block merge on serious schema errors. |
| `web-d-16 DSAR audit log enrichment` | Append `user_agent`, `accept_language`, and proxy chain length to the CMS `dsar_audit` writes. Forensic differentiation per Art. 33 / 72h breach-notification requirements. |

---

## W1 — Home + foundation *(start now)*

Tickets to land before W1 closes:

- **w1-00** W-A bootstrap (above)
- **w1-01** W-B design system foundation (above)
- **w1-02** W-D-01 preview, W-D-02 revalidate, W-D-03 cms-fetch (the minimum
  infra Home depends on)
- **w1-03** W-D-08 analytics
- **w1-04** W-C blocks required by Home: `Hero`, `LogoCloud`, `FeatureGrid`,
  `Stats`, `MetricsBar`, `FAQ`, `RichText`, `CTA`, `Section`. Other blocks
  defer.
- **w1-05** Chrome: `Header` (with mega-nav fallback to standard), `Footer`,
  `AnnouncementsBar`. All bound to `globals/mainNav`, `globals/footerNav`,
  `globals/announcements`.
- **w1-06** Page route: `app/(marketing)/page.tsx` for `/`. Fetches
  `pages` slug=`home` + globals; renders blocks via the registry.
- **w1-07** Page route: `app/not-found.tsx` (`/404`). Static; fires beacon
  via W-D-10.
- **w1-08** SEO: `app/layout.tsx` `<Metadata>` defaults, OG image route.
- **w1-09** `app/sitemap.ts` v1 (Home only; expands per wave).
- **w1-10** `app/robots.ts`.
- **w1-11** Visual regression baseline for `/`.
- **w1-12** Lighthouse CI run on Home; capture LCP/CLS/INP/TBT to ticket.
- **w1-13** Open W2 design-availability tracking issue.

**W1 acceptance**
- Home page renders from CMS data (live admin, not fixtures).
- Editing the Home Page in admin → publish → web revalidates within
  seconds.
- Preview link on a *draft* Home version round-trips and renders draft
  content with a visible "Preview" banner.
- Lighthouse: ≥ 95 perf / 100 a11y / ≥ 95 SEO / 100 best-practices on
  desktop-1280, ≥ 85 perf on mobile-360.
- axe: 0 serious/critical.
- All copy + assets come from CMS (no hard-coded strings).

---

## W2 — Solutions + Products

**Tickets** (gated on per-page design sign-off):

- w2-01 `/attack-surface-reduction`
- w2-02 `/fips`
- w2-03 `/vulnerability-remediation`
- w2-04 `/cleansight`
- w2-05 `/cleanstart-images`
- w2-06 `/software-bill-materials` (after slug clarification with product —
  see [`WEB-ARCHITECTURE.md §17`](./WEB-ARCHITECTURE.md#17--open-questions))
- w2-07 `/software-composition-analysis`
- w2-08 W-C blocks unblocked by W2 designs (estimate: `Comparison`-style
  via `FeatureGrid`/`Table`, `Pricing` if pricing teaser used,
  `IntegrationLogos`).

**W2 acceptance**: every signed-off page renders, visual diff < threshold,
no JSON-LD validation errors, sitemap updated.

---

## W3 — Conversion + Company core

- w3-01 `/for-ciso`
- w3-02 `/for-developers`
- w3-03 `/book-a-demo` (depends on W-D-11 Turnstile, integrations Calendly
  embed, lead-submit proxy)
- w3-04 `/partners`
- w3-05 `/pricing`
- w3-06 `/about-us` (uses `aboutGalleries` collection — note arch doc rule:
  read-only on `/about-us` only)
- w3-07 `/contact-us`
- w3-08 `LeadForm` component + Server Action proxy

**W3 acceptance**: lead submissions land in CMS `leads` collection through
the proxy, CSP headers don't break Calendly/Intercom, Turnstile gates
high-intent forms.

---

## W4 — Content surfaces

- w4-00 **Knowledge Hub schema lock** (blocking ticket — assigned to
  product, not engineering)
- w4-01 `/blogs` listing (paginated, faceted by `categories`)
- w4-02 `/blogs/[slug]` detail (Lexical → React renderer; ToC; reading time
  from CMS-computed `bodyStats`)
- w4-03 `/news` listing + `/news/[slug]` detail (NewsArticle JSON-LD,
  `isAccessibleForFree`, sitemap-news 48h window)
- w4-04 `/resource-center` listing + `/resources/[slug]` detail *(plural
  collection per live)* (gated downloads via `gateForm` → LeadForm)
- w4-05 `/knowledge-hub` listing + `/guide/[slug]` detail *(singular per live;
  unblocked by w4-00)*
- w4-06 `/author/[slug]` detail *(singular per live)*
- w4-07 `/podcast` (v1 = `pages` block-built; episode schema deferred)
- w4-08 W-D-04 search (UI complete, all collections indexed) — `/search`
- w4-09 W-D-05 JSON-LD builders for blog/news/guide/resource
- w4-10 Sitemap expansion (all collections + paginated)

**W4 acceptance**: every detail page validates against Google's Rich
Results Test for its schema; gated resource flow proven end-to-end.

---

## W5 — Events + Careers + Community + Teams

URL parity: detail pages use the **singular** collection prefix per live site.

- w5-01 `/events` (events list — discriminator-aware buttons:
  `registrationMode='internal'` shows in-page form, `'external'` opens link)
- w5-02 `/event/[slug]` *(singular per live)*
- w5-03 `/webinar` *(singular per live; flag for product if plural preferred)*
- w5-04 `/webinar/[slug]` *(singular per live)*
- w5-05 `/careers` (jobs list — discriminator-aware: `source='cms'` opens
  internal apply form, `source='ats'` opens external URL)
- w5-06 `/job/[slug]` *(singular per live)*
- w5-07 `/community` (`pages` block-built)
- w5-08 `/teams` + `/leadership` (`pages` block-built; both live URLs;
  `authors` collection feeds team-member cards)

**W5 acceptance**: registration / apply forms route correctly per
discriminator; calendar invites generated via CMS hook (Phase G); JobPosting
JSON-LD passes Rich Results Test.

---

## W6 — Legal + cutover

- w6-00 Audit-driven defensive items: ship `web-d-12` body-size guard, `web-d-13` CORS allow-list, `web-d-14` CSV export limit header, `web-d-15` JSON-LD validator gate, `web-d-16` DSAR audit log enrichment. All five are tracked in cross-cutting W-D but must be **closed** before launch.
- w6-01 `/legal`, `/privacy-policy`, `/terms-and-condition`
- w6-02 Webflow URL parity check — every URL from the migrated content set
  resolves with HTTP 200 or 301 to the new location (arch doc `#migration`
  rule #1).
- w6-03 Pluralisation redirect cleanup ticket (per
  [`WEB-ARCHITECTURE.md §3`](./WEB-ARCHITECTURE.md#3--route-map)) — confirm
  with product whether to delete singular routes after 90 days.
- w6-04 CSP nonce hardening — drop `'unsafe-inline'` for scripts.
- w6-05 Performance budget gate — Lighthouse-CI thresholds enforce.
- w6-06 axe-core gate — zero serious/critical.
- w6-07 IndexNow first ping; sitemap submission to Google + Bing webmaster.
- w6-08 Cloudflare cache rules final pass.
- w6-09 Production launch checklist (in this file, §Launch checklist).

**W6 acceptance**: production launch ready.

---

## Launch checklist (final pass before flipping `cleanstart.com`)

- [ ] All `cleanstart-cms-architecture.html` anchors referenced in
      `docs/web/*` resolve.
- [ ] `tokens.json` ↔ `tokens.css` ↔ `apps/web` are in sync (run
      `pnpm figma:extract` and confirm zero diff).
- [ ] CSP headers tested in production via securityheaders.com (target A+).
- [ ] HSTS preload submitted.
- [ ] Cloudflare WAF rules active.
- [ ] All routes 200 / 301 — no 404 except `/404`.
- [ ] Lighthouse on Home, Blogs detail, Pricing, Careers detail —
      all targets met.
- [ ] axe-core scan: 0 serious/critical on every public route.
- [ ] Preview JWT flow round-trips on a real draft.
- [ ] Lead submission round-trips: CMS `leads` row created, Brevo email
      sent, Teams Workflows webhook fires (R2 fallback queue empty).
- [ ] Search returns results for "cleansight", "kubernetes", "FIPS".
- [ ] Sitemap-news.xml has the 48h window applied.
- [ ] Robots.txt published.
- [ ] GA4 + GTM events firing through consent gate.
- [ ] Sentry releases tracked; source maps uploaded.
- [ ] Coolify deploy on push to `main` proven.
- [ ] Backup verification: CMS Postgres backup heartbeat green
      (arch doc `#logging-alerting`).
- [ ] DNS final swap; old Webflow CNAME removed.

---

## apps/web/CLAUDE.md template (for W-A0)

```markdown
# CLAUDE.md — apps/web

This sub-CLAUDE governs the public marketing site. Defers to root
[`CLAUDE.md`](../../CLAUDE.md) and [`docs/web/`](../../docs/web/) for
project-wide rules.

## Pre-completion checks
pnpm --filter @cleanstart/web lint
pnpm --filter @cleanstart/web typecheck
pnpm --filter @cleanstart/web build
pnpm --filter @cleanstart/web test

## Hard rules (apps/web-specific)
- Never duplicate the LeadHandler. All form posts → CMS /api/leads/submit.
- Never expose PAYLOAD_SECRET via NEXT_PUBLIC_*.
- Never bypass /api/preview JWT verification.
- Never hard-code design tokens — consume from tokens.css / @theme.
- Never load 3rd-party scripts before consent (except strictly necessary).
- Never rename a route segment post-launch (root CLAUDE.md rule).

## Reading order for new contributors
1. ../../CLAUDE.md
2. ../../docs/web/WEB-ARCHITECTURE.md
3. ../../docs/web/CONTENT-MODEL.md
4. ../../docs/web/COMPONENT-MAP.md
5. ../../docs/web/DESIGN-SYSTEM.md
6. ../../docs/web/BACKLOG-WEB.md
```
