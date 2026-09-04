# apps/web — Page Inventory

All marketing and content pages for `apps/web`. This is the single source of truth for
page slugs, categories, types, and build status across the dev journey.

**When a page is built:**
1. Add its route in `apps/web/src/app/[slug]/page.tsx`
2. Mark status as ✅ in this file
3. Update its `href` in `apps/web/src/lib/nav-config.ts` from `"/"` to the real slug

**Nav link rule:** `nav-config.ts` uses the real slug only for ✅ pages. ⬜ and 🚧 pages use `"/"` as a placeholder. This file is the authority — when updating nav-config.ts, check the status column here first.

---

## Page Types

| Type | Description |
|------|-------------|
| **Static** | Fully static marketing page — no CMS data, built entirely from Figma |
| **CMS Listing** | Renders a list of CMS collection items (blogs, events, webinars, etc.) |
| **CMS Detail** | Dynamic route `[slug]` that renders a single CMS document |
| **Legal** | Static legal/compliance copy pages |
| **Utility** | Error pages, redirects, system pages |

---

## Status Legend

| Symbol | Meaning |
|--------|---------|
| ✅ | Built and verified |
| 🚧 | In progress |
| ⬜ | Not started |

---

## Core Pages

| # | Page Name | URL Slug | Type | Status | Notes |
|---|-----------|----------|------|--------|-------|
| 1 | Homepage | `/` | Static | ✅ | Built |
| 11 | Book a Demo | `/book-a-demo` | Static | ✅ | Lead capture form page (form is static UI; LeadHandler wiring pending) |
| 20 | Partners | `/partners` | Static | ✅ | Hero, Why Partner, Global Network (region tabs), Testimonials, Partner Types. Become-a-Partner form posts to the dedicated CMS endpoint `/api/partner-applications/apply` (off HubSpot/`forms`). |
| 21 | Pricing | `/pricing` | Static | ✅ | Hero ("Choose Your Plan"), two plan cards (For Developers / Enterprise Image with FIPS + SLSA L3), and an offerings grid (Community Images, Custom Images, Clean Libraries, Custom Images, Additional Services). All sales CTAs → `/contact-us`; "View Images" → images.cleanstart.com. Built 2026-06-15 from Figma 1458:3571. Nav: standalone flat item beside Partners. |
| 31 | Deal Registration | `/deal-registration` | Static | ✅ | Form is static UI; LeadHandler wiring pending |

---

## Company Pages

| # | Page Name | URL Slug | Type | Status | Notes |
|---|-----------|----------|------|--------|-------|
| 22 | About Us | `/about-us` | Static | ✅ | Route at `src/app/about-us/` |
| 23 | Careers | `/careers` | CMS Listing | ✅ | Backed by Payload `jobs` + `jobLocations` collections; published roles only. Apply form is live on CMS-native open jobs → `POST /api/career-applications/apply` (resume to private R2, application row, Brevo HR notification). |
| 23b | Job – Single | `/job/[slug]` | CMS Detail | ✅ | Route at `src/app/job/[slug]/` (singular — sibling to the `/careers` listing). Emits JobPosting + BreadcrumbList JSON-LD (open roles only). |
| 24 | Community | `/community` | Static | ✅ | Built 2026-05-22 from Figma 732:3192 |
| 25 | Contact Us | `/contact-us` | Static | ✅ | Built 2026-05-23 from Figma 817:14719 |
| 26 | Teams | `/teams` | Static | ✅ | All 5 sections built (farheen integration 2026-05-20) |

---

## Solutions Pages

> **`/industries` segment.** The two industry pages are the only nested static routes on the site; everything else is one segment. `/industries` itself has no page and therefore 404s — a segment with no hub forfeits the main reason to nest (a hub that ranks for the category term and passes equity down) and dead-ends anyone who truncates the URL. Build the hub, or the nesting is decoration.

| # | Page Name | URL Slug | Type | Status | Notes |
|---|-----------|----------|------|--------|-------|
| 2 | Attack Surface Reduction | `/attack-surface-reduction` | Static | ✅ | Built on `farheen`; ported from retired `web` branch. |
| 4 | FIPS Compliance | `/fips` | Static | ✅ | All 7 sections built |
| 5 | Vulnerability Remediation | `/vulnerability-remediation` | Static | ✅ | All 7 sections built |
| 9 | For CISO | `/for-ciso` | Static | ✅ | All 8 sections built (farheen integration 2026-05-20) |
| 10 | For Developers | `/for-developers` | Static | ✅ | Route at `src/app/for-developers/`. Linked from the homepage AudienceTabs and the nav (`nav-config.ts`). |
| 12 | Impact Estimator | `/impact-estimator` | Static | ✅ | Interactive Operational Impact simulator (light theme). Client `ImpactSimulator` + isolated `model.ts` engine (client-owned bands from ROI 1.xlsx). Sections: Hero (eyebrow + H1), Simulator (sticky inputs, gauge, KPI cards, hours card, copy-link button beside the trust line, mobile summary strip), How-it's-calculated chain, FAQ (six questions, FAQPage JSON-LD), Footer CTA. Inputs round-trip through the URL via `url-state.ts` (unit-tested; e2e in `tests/e2e/impact-estimator.spec.ts`). Nav-linked under Solutions › Capability since 2026-09-02 (`gauge` glyph); **Indexable 2026-09-02**: `noindex,nofollow` dropped, listed in `STATIC_ROUTES`. `pageRegistry` row (id=44) in place, so the page emits a WebPage node. Renamed from `/roi-calculator` on 2026-09-02; the old path 308s to the new one in `next.config.ts`. |
| 13 | Financial Services | `/industries/financial-services` | Static | ✅ | Title, description and H1 are the SEO team's, applied verbatim. **Renamed from `/financial-services` 2026-08-31** while that URL was noindex, unlinked and out of the sitemap in production, so nothing was de-ranked; a 301 is registered in the CMS `redirects` collection (id=41) regardless, since it did resolve publicly. **Live 2026-08-31**: indexable (the `noindex,nofollow` pair dropped) and listed in `STATIC_ROUTES`. Nav-linked (Solutions › By industry). Breadcrumb, `JsonLdGraph` and `pageRegistry` row (id=42) in place. **Renamed again 2026-09-04** to `/industries/financial-services`, this time post-launch from an indexed, sitemap-listed, nav-linked URL. Its 301 is in `next.config.ts` (not the CMS) so it deploys with the route move. **Two CMS rows still key on the old path and must be updated at deploy:** `pageRegistry` id=42 (else the JSON-LD graph resolves to nothing) and `redirects` id=41 (else `/financial-services` 301s into a 404). |
| 14 | Software / SaaS | `/industries/software-applications` | Static | ✅ | **Renamed 2026-09-04** from `/industries/modern-applications`, post-launch from an indexed, sitemap-listed, nav-linked URL; 301 in `next.config.ts` so it deploys with the route move. H1 changed to "Software Moves Faster. / Security Must Be Smarter." and nav label to "Software / SaaS" (Solutions › By industry). Title, description and breadcrumb rewritten to match: title is now "Container Security for SaaS and Software \| CleanStart" (the sibling's shape), breadcrumb "Software and SaaS". The H1 carries no keyword, so the title tag is the only place the head term lives. Built as `/saas`, then `/industries/saas-container-security`, and settled at this path 2026-09-02 before ever being indexed or linked, so the earlier paths carry no redirects. **Live 2026-09-02**: indexable, listed in `STATIC_ROUTES`. Breadcrumb and `JsonLdGraph` in place; the `pageRegistry` row (id=43) keys on path and **must be updated to `/industries/software-applications` in prod** or the WebPage node drops out. |
| 3 | Enhance SCA | `/software-composition-analysis` | Static | ❌ removed | **Deleted 2026-07-07** — page, `sca` section components, and image assets fully removed (was orphaned: `index,follow` but absent from nav/sitemap, so Google kept surfacing an unlinked page). Route now 301s to `/guide/software-composition-analysis` via the `redirects` collection (see `post-launch-redirects-seed.ts`). |

---

## Products Pages

| # | Page Name | URL Slug | Type | Status | Notes |
|---|-----------|----------|------|--------|-------|
| 6 | CleanSight | `/cleansight` | Static | ✅ | All 8 sections built |
| 7 | CleanStart SBOM | `/software-bill-materials` | Static | ✅ | All 4 sections built |
| 8 | CleanStart Images | `/cleanstart-images` | Static | ✅ | All 5 sections built (Hero, Browse, EasyStart, UVP, Environment) |
| 8b | CleanStart Platform | `/cleanstart-platform` | Static | ❌ removed | **Deleted 2026-09-02** — route, `cleanstart-platform` section components and image assets removed. The page was never finished: it shipped `noindex`, absent from `nav-config.ts` and de-listed from the sitemap, so nothing was de-ranked and no redirect was seeded. It did resolve publicly and was advertised in `public/llms.txt` (entry removed), so register a 301 in the CMS `redirects` collection if the bare URL is still being hit. `cta-cube-textured.webp` moved to `public/images/teams/` — the Teams CTA was the only other consumer. Recover the whole page from git history (last built state: commit before this deletion) when it is rebuilt.  |
| 8c | Clean Libraries | `/clean-libraries` | Static | ✅ | Built 2026-06-17 from Figma 1512:988. 4 sections (Hero, Dependency-Risk cards, Invisible-Pipeline diagram, Built-Into-Workflow cards) + Govern-Every-Dependency CTA. Linked from Products nav (`folder` icon) and from the Pricing "Clean Libraries" offering. |

---

## Comparison Pages

Competitive comparison pages live under the `/compare/` segment. One page per competitor;
the segment is reserved for this purpose and has no listing route of its own.

| # | Page Name | URL Slug | Type | Status | Notes |
|---|-----------|----------|------|--------|-------|
| C1 | Docker Hardened Images vs CleanStart | `/compare/cleanstart-vs-docker-hardened-images` | Static | ✅ | **Rebuilt from scratch 2026-09-02** against the new SEO doc "Docker Hardened Images vs CleanStart - Final" (supersedes the 2026-07-31 build, which was never signed off). Six bands, one per document heading: `CompareHero` (with the `CompareFoundationStacks` inheritance diagram) → `CompareFoundations` → `CompareMatrix` → `CompareBuildFlow` → `CompareDifferentiators` → `CompareFAQ`, plus `CompareCTA` in the footer slot. All copy, the 20-row / 4-group capability matrix and the 8 FAQs live in `compare-data.ts`; the matrix counts and the FAQPage JSON-LD both derive from it. Emits BreadcrumbList + FAQPage. Outline: 1 H1, 6 H2 (5 document sections + the CTA), 3 document H3 + 8 FAQ H3. Meta title/description/URL are the document's. The matrix is one `<table>` that reflows to labelled cards below `lg` (no second mobile copy) with a sticky column head. **Still `noindex,nofollow` and de-listed from `app/sitemap.ts` pending sign-off** — drop both directives and re-add the sitemap entry together. **Deliberately orphaned — not in `nav-config.ts` and no inbound internal links** (decision 2026-08-04); revisit before expecting it to rank. |

---

## Resources Pages

| # | Page Name | URL Slug | Type | Status | Notes |
|---|-----------|----------|------|--------|-------|
| 13 | Blogs (Listing) | `/blogs` | CMS Listing | ✅ | Route at `src/app/blogs/` |
| 12 | Blog – Single Post | `/blogs/[slug]` | CMS Detail | ✅ | Route at `src/app/blogs/[slug]/` (plural — sibling to the `/blogs` listing). Emits BlogPosting + BreadcrumbList JSON-LD; authors link to `/author/[slug]`. |
| 13b | Guides (Listing) | `/guide` | CMS Listing | ✅ | Route at `src/app/guide/page.tsx` (singular hub, sibling to `/guide/[slug]` — matches the indexed detail path for clean hub-and-spoke SEO). Payload `guides` collection. Compact 4×4 grid (16/page), search-only (collection has no category). Built 2026-06-04 from Figma 1248:8204. |
| 13c | Guide – Single | `/guide/[slug]` | CMS Detail | ✅ | Route at `src/app/guide/[slug]/` |
| 14 | Knowledge Hub | `/knowledge-hub` | CMS Detail | ✅ | Route at `src/app/knowledge-hub/`. `/knowledge-hub` has **no listing page** — `page.tsx` redirects to the first article (`getKnowledgeLanding()[0]`, e.g. `/knowledge-hub/vex-documents`), so the entry point is the reading view with the full sidebar, not a category index. `[slug]` detail with full sidebar tree. Payload `knowledgeBase` collection (253 articles). Detail emits Article/BreadcrumbList/VideoObject JSON-LD + resolveCmsSeo. Sidebar renders all article links in SSR HTML (crawlable link graph); every article carries a Home → Knowledge Hub → Category breadcrumb. Nav points at `/knowledge-hub` (redirects to the first article). `/knowledge-hub` is excluded from the sitemap (it redirects); the `/knowledge-hub/<slug>` articles are emitted instead. |
| 15 | Newsroom | `/news` | CMS Listing | ✅ | Route at `src/app/news/`. REGION filter. |
| 15b | News – Single | `/news/[slug]` | CMS Detail | ✅ | Route at `src/app/news/[slug]/`. Emits NewsArticle + BreadcrumbList JSON-LD; authors link to `/author/[slug]`. |
| 16 | Podcast | `/podcast` | CMS Listing | ✅ | Route at `src/app/podcast/`; Payload `podcastEpisodes` collection + `podcastPage` global (YT embeds) |
| 17 | Resource Center | `/resource-center` | CMS Listing | ✅ | Route at `src/app/resource-center/` |
| 17b | Resource Detail | `/resources/[slug]` | CMS Detail | ✅ | Route at `src/app/resources/[slug]/` (plural). Emits Article + BreadcrumbList JSON-LD. Optional `gateForm` gates the download. |
| 17c | Case Studies | `/case-studies` | CMS Listing | ✅ | Payload `case-studies` collection (listing-only, no detail). Cards link straight to the public R2 PDF download. Reuses home `BuiltForTeams` (no CMS). Built 2026-06-03 from Figma 1198:1231. |
| — | Author Page | `/author/[slug]` | CMS Detail | ✅ | Dynamic route at `src/app/author/[slug]/`, Payload `authors`. AuthorHero + AuthorBio + AuthorDetails + AuthorPosts ("More from {author}" — crawlable blog grid via `getPostsByAuthor`). Emits ProfilePage/Person + BreadcrumbList JSON-LD. |

---

## Events Pages

| # | Page Name | URL Slug | Type | Status | Notes |
|---|-----------|----------|------|--------|-------|
| 18 | In-Person Events | `/events` | CMS Listing | ✅ | Payload `events` collection. COUNTRY filter on past events. |
| 18b | Event – Single | `/event/[slug]` | CMS Detail | ✅ | Route at `src/app/event/[slug]/` (singular — sibling to the `/events` listing). Emits Event + BreadcrumbList JSON-LD. |
| 19 | Webinars | `/webinars` | CMS Listing | ✅ | Payload `webinars` collection. No detail route by design (registration is external/in-house form). |

---

## Legal Pages

| # | Page Name | URL Slug | Type | Status | Notes |
|---|-----------|----------|------|--------|-------|
| 28 | Legal Hub | `/legal` | Legal | ✅ | Default view: Additional Third-Party Terms; sidebar lists related legal docs |
| 28a | Acceptable Use Policy | `/legal/acceptable-use-policy` | Legal | ✅ | Linked from `/legal` sidebar |
| 29 | Privacy Policy | `/privacy-policy` | Legal | ✅ | |
| 30 | Terms & Conditions | `/terms-and-condition` | Legal | ❌ | Dropped — not building. Acceptable Use Policy covers the equivalent legal surface |

---

## Utility Pages

| # | Page Name | URL Slug | Type | Status | Notes |
|---|-----------|----------|------|--------|-------|
| 27 | 404 Error Page | `/404` | Utility | ✅ | Next.js `not-found.tsx` (noindex, full header/footer nav). |
| — | Guide OG Cover | `/guide-cover/[slug]` | Utility | ✅ | `ImageResponse` route — generated 1200×630 branded OG/social cover for guides without a hero image (`?kw=` keyword). Not a page; not in nav or sitemap. |
| — | Draft Preview | `/preview/[collection]/[slug]` | Utility | ✅ | Draft-mode preview route at `src/app/preview/[collection]/[slug]/`. Renders unpublished CMS docs for editors via Payload draft preview; noindex, not in nav or sitemap. |

---

## Open Issues

- **CMS Detail pages** require the CMS (`apps/cms`) collection to be fully published and the
  Payload REST/local API connected to `apps/web` before they can be built end-to-end.
  Build the static shell and layout first, wire data fetch second.

- **Author Page slug** (`/author/sanket-modi`) suggests a dynamic route `/author/[slug]`.
  The `authors` collection in Payload is the data source.

---

## Build Order Recommendation

Build static pages first (no CMS dependency), then CMS listing pages, then CMS detail pages.

**Wave 1 — Static marketing (highest business value)**
Homepage ✅ → About Us ✅ → Book a Demo → Contact Us → Pricing → Products (3 pages) → Solutions (6 pages)

**Wave 2 — Static supporting**
Partners → Careers → Teams → Community → Deal Registration

**Wave 3 — CMS listing pages** (needs CMS live)
Blogs ✅ → Knowledge Hub ✅ → Newsroom ✅ → Resource Center ✅ → Webinars ✅ → Events ✅ → Podcast ✅

**Wave 4 — CMS detail / dynamic routes**
Blog Single Post ✅ → Author Page ✅ → Event Single ✅ → Job Single ✅ → Resource Detail ✅ → News Detail ✅ → Knowledge Hub Article ✅

**Wave 5 — Legal + Utility**
Legal Hub → Privacy Policy → 404 Page  (Terms & Conditions dropped)
