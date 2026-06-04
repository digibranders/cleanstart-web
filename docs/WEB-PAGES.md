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
| 21 | Pricing | `/pricing` | Static | ⬜ | |
| 31 | Deal Registration | `/deal-registration` | Static | ✅ | Form is static UI; LeadHandler wiring pending |

---

## Company Pages

| # | Page Name | URL Slug | Type | Status | Notes |
|---|-----------|----------|------|--------|-------|
| 22 | About Us | `/about-us` | Static | ✅ | Route at `src/app/about-us/` |
| 23 | Careers | `/careers` | CMS Listing | ✅ | Backed by Payload `jobs` + `jobLocations` collections; published roles only. Apply form is live on CMS-native open jobs → `POST /api/career-applications/apply` (resume to private R2, application row, Brevo HR notification). |
| 24 | Community | `/community` | Static | ✅ | Built 2026-05-22 from Figma 732:3192 |
| 25 | Contact Us | `/contact-us` | Static | ✅ | Built 2026-05-23 from Figma 817:14719 |
| 26 | Teams | `/teams` | Static | ✅ | All 5 sections built (farheen integration 2026-05-20) |

---

## Solutions Pages

| # | Page Name | URL Slug | Type | Status | Notes |
|---|-----------|----------|------|--------|-------|
| 2 | Attack Surface Reduction | `/attack-surface-reduction` | Static | ✅ | Built on `farheen`; ported from retired `web` branch. |
| 4 | FIPS Compliance | `/fips` | Static | ✅ | All 7 sections built |
| 5 | Vulnerability Remediation | `/vulnerability-remediation` | Static | ✅ | All 7 sections built |
| 9 | For CISO | `/for-ciso` | Static | ✅ | All 8 sections built (farheen integration 2026-05-20) |
| 10 | For Developers | `/for-developers` | Static | ⬜ | |
| 3 | Enhance SCA | `/software-composition-analysis` | Static | ✅ | All 7 sections built (farheen integration 2026-05-20) |

---

## Products Pages

| # | Page Name | URL Slug | Type | Status | Notes |
|---|-----------|----------|------|--------|-------|
| 6 | CleanSight | `/cleansight` | Static | ✅ | All 8 sections built |
| 7 | CleanStart SBOM | `/software-bill-materials` | Static | ✅ | All 4 sections built |
| 8 | CleanStart Images | `/cleanstart-images` | Static | ✅ | All 5 sections built (Hero, Browse, EasyStart, UVP, Environment) |

---

## Resources Pages

| # | Page Name | URL Slug | Type | Status | Notes |
|---|-----------|----------|------|--------|-------|
| 13 | Blogs (Listing) | `/blogs` | CMS Listing | ✅ | Route at `src/app/blogs/` |
| 12 | Blog – Single Post | `/blog/[slug]` | CMS Detail | ✅ | Route at `src/app/blog/[slug]/` |
| 13b | Guides (Listing) | `/guide` | CMS Listing | ✅ | Route at `src/app/guide/page.tsx` (singular hub, sibling to `/guide/[slug]` — matches the indexed detail path for clean hub-and-spoke SEO). Payload `guides` collection. Compact 4×4 grid (16/page), search-only (collection has no category). Built 2026-06-04 from Figma 1248:8204. |
| 13c | Guide – Single | `/guide/[slug]` | CMS Detail | ✅ | Route at `src/app/guide/[slug]/` |
| 14 | Knowledge Hub | `/knowledge-hub` | CMS Listing | ⬜ | Payload `knowledgeBase` collection |
| 15 | Newsroom | `/news` | CMS Listing | ✅ | Route at `src/app/news/`; press-release detail at `src/app/news/[slug]/` |
| 16 | Podcast | `/podcast` | CMS Listing | ✅ | Route at `src/app/podcast/`; Payload `podcastEpisodes` collection + `podcastPage` global (YT embeds) |
| 17 | Resource Center | `/resource-center` | CMS Listing | ✅ | Route at `src/app/resource-center/` |
| 17b | Resource Detail | `/resource/[slug]` | CMS Detail | ✅ | Route at `src/app/resource/[slug]/` |
| 17c | Case Studies | `/case-studies` | CMS Listing | ✅ | Payload `case-studies` collection (listing-only, no detail). Cards link straight to the public R2 PDF download. Reuses home `BuiltForTeams` (no CMS). Built 2026-06-03 from Figma 1198:1231. |
| — | Author Page | `/author/[slug]` | CMS Detail | ⬜ | Dynamic route, Payload `authors` |

---

## Events Pages

| # | Page Name | URL Slug | Type | Status | Notes |
|---|-----------|----------|------|--------|-------|
| 18 | In-Person Events | `/events` | CMS Listing | ✅ | Payload `events` collection |
| 19 | Webinars | `/webinars` | CMS Listing | ✅ | Payload `webinars` collection |

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
| 27 | 404 Error Page | `/404` | Utility | ⬜ | Next.js `not-found.tsx` |

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
Blogs ✅ → Knowledge Hub → Newsroom ✅ → Resource Center ✅ → Webinars ✅ → Events ✅ → Podcast ✅

**Wave 4 — CMS detail / dynamic routes**
Blog Single Post ✅ → Author Page

**Wave 5 — Legal + Utility**
Legal Hub → Privacy Policy → 404 Page  (Terms & Conditions dropped)
