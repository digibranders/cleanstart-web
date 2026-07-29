# On-Page & Metadata — SEO SOP Module 03

**Module:** 03 — On-page & metadata
**Prefix:** `META`
**Scope (per `00-index.md` §8):** Title/description formulas per template with length limits, heading architecture (H1 presence only — full hierarchy lives in module 11), OG/Twitter cards, image & alt policy, canonical self-reference.
**Out of scope:** keyword research, per-page copywriting, topical strategy (`00-index.md` §1); full heading-hierarchy/outline rules (module 11); `hreflang` matrix correctness for genuinely multi-locale builds (`C1`); `JobPosting`/`Article`/`FAQPage` structured-data requirements (module 04) — this module covers only the `<title>`/`<meta description>` surface those routes also happen to populate.

This module is authored against `docs/seo/evidence/sources/metadata.md` (research), `docs/seo/evidence/verification-log.md` (adversarial verification — all three required corrections for this domain are applied below: Requirement 3's fabricated pixel/character figures, Requirement 8's wrong Twitter/X URL, and Requirement 6's uncited "secondary-sourced" claim), `docs/seo/evidence/codebase-inventory.md`'s On-Page Metadata section, and a live capture of `www.cleanstart.com` taken 2026-07-29 (`docs/seo/evidence/live-capture.json`, 59 URLs). Every `CleanStart` verdict below cites one of these three evidence sources, or a direct `curl`/`grep` run in this authoring session.

---

## Rules

### META-01 — Title element exists, is unique, and accurately describes the page

- **Severity:** P1
- **Applies:** Always
- **Rule:** Every indexable page emits exactly one non-empty `<title>` element that uniquely and accurately describes that page's content. No two distinct pages share identical title text.
- **Why:** Google's title-link generator prefers the `<title>` element first, falling back to visible headings, `og:title`, prominent styled text, or anchor text only when it judges the `<title>` to be missing, low-quality, or inaccurate — an empty or boilerplate title hands title selection to a heuristic instead of declaring it.
- **Acceptance:**
  - Exactly one non-empty `<title>...</title>` in the rendered HTML
  - No two distinct-content pages in the sitemap share identical title text
  - Title text is not contradicted by the page's own visible content
- **Verify:** `jq -r '.pages[].head.title // empty' docs/seo/evidence/live-capture.json | sort | uniq -d`
- **Reference:** `apps/web/src/lib/seo/canonical.ts:80-179` (`buildPageMetadata`), `:20-24` (`stripBrandSuffix` — prevents brand-suffix doubling, a common cause of near-duplicate titles)
- **Source:** [Tier 1] https://developers.google.com/search/docs/appearance/title-link
- **Anti-patterns:** empty/missing `<title>`; boilerplate titles identical across a template's pages; title text that contradicts on-page content.
- **CleanStart:** Pass

Evidence: the live capture's own duplicate check returns two groups, both explained, not real defects: `Pricing | CleanStart` (×2 — `/pricing` captured under both its own template and a legacy-redirect-target alias to the same URL) and `Page Not Found · CleanStart | CleanStart` (×13 — the 13 legacy 404 control checks, all correctly serving the same not-found template for genuinely nonexistent URLs). All 57 head-captured URLs have non-empty, and — once those two artifacts are excluded — pairwise-distinct titles.

### META-02 — Every indexable page renders at least one visible `<h1>`

- **Severity:** P1
- **Applies:** Always
- **Rule:** Every indexable page's rendered DOM contains at least one `<h1>` element. Full heading-hierarchy rules (level-skip prevention, single-vs-multiple-H1 house style) are module 11's scope — this rule covers only presence, because its absence directly removes a documented title-link fallback signal.
- **Why:** Google's title-link generator lists "heading elements, such as `<h1>` elements" as a fallback source when the `<title>` is judged inadequate; a page with zero H1s has one fewer correction path if its `<title>` is ever rewritten. Separately, the WHATWG spec permits (does not forbid) *multiple* H1s — it only "should" (not "must") have at least one in the outline — so this rule requires presence, not exactly-one; do not conflate "must have ≥1" with "must have exactly 1," which is a house-style preference belonging to module 11, not a spec requirement.
- **Acceptance:**
  - `document.querySelectorAll('h1').length >= 1` on every indexable route
- **Verify:** `jq -r '.pages[] | select(.head and .head.h1Count != 1) | "\(.template): h1Count=\(.head.h1Count)"' docs/seo/evidence/live-capture.json`
- **Reference:** None — no reference implementation identified in this pass; the affected routes' hero components (`EventsBrowser`/`UpcomingEventHero` for `/events`, and the equivalent hero components for `/news` and `/webinars`) are module 11's territory to root-cause.
- **Source:** [Tier 1] https://developers.google.com/search/docs/appearance/title-link (fallback-source list); [Tier 1] https://html.spec.whatwg.org/multipage/sections.html#headings-and-outlines (permits multiple H1s; "should," not "must," have one)
- **Anti-patterns:** treating "exactly one H1" as an HTML-validity or ranking rule (it is a house-style convention, not a spec requirement — see module 11); skipping heading levels for font-size reasons instead of using CSS.
- **CleanStart:** Fail

Evidence: 3 of 57 head-captured routes render `h1Count: 0`: `/events`, `/news`, `/webinars` (all `listing:*` templates). This is the exact fact flagged in this module's task brief; the fix belongs to module 11's heading-hierarchy audit, cross-referenced here rather than duplicated.

### META-03 — Open Graph's four required properties, plus image sub-properties, are present

- **Severity:** P1
- **Applies:** Always, for every publicly shareable page
- **Rule:** Every publicly shareable page declares `og:title`, `og:type`, `og:image`, and `og:url` at minimum, plus `og:image:width`, `og:image:height`, and `og:image:alt` whenever an image is declared. `og:image` must resolve to an absolute HTTPS URL — consuming crawlers (Facebook, LinkedIn, Slack, Discord, iMessage) scrape these tags server-side and frequently do not resolve a relative URL against the page's base.
- **Why:** These tags build the link-preview card on every platform where a CleanStart URL gets shared; `og:url` is the object's canonical identity in the social graph (distinct from the page's SEO canonical), and a missing or relative `og:image` silently produces a broken or absent preview card with no error visible on the page itself.
- **Acceptance:**
  - `og:title`, `og:type`, `og:image`, `og:url` all present with non-empty content
  - `og:image` is an absolute `https://` URL
  - `og:image:width`/`og:image:height`/`og:image:alt` present whenever `og:image` is
- **Verify:** `curl -s https://www.cleanstart.com/blogs/ai-broke-software-security-biggest-assumption | grep -coP '<meta property="og:(title|type|image|url)" content="[^"]+"'`
- **Reference:** `apps/web/src/lib/seo/canonical.ts:132-154` (`openGraph` block), `:112-124` (image resolution: explicit CMS image wins, else a generated `/api/og` card)
- **Source:** [Tier 1] https://ogp.me/
- **Anti-patterns:** relative `og:image` URLs; injecting OG tags via client-side JS only (social crawlers commonly don't execute JS — tags must be in the initial HTML response); omitting `og:image:alt`.
- **CleanStart:** Pass

Evidence: verified by direct fetch, both on the home page and a detail route: `og:title`, `og:type` (`website` / `article`), `og:image` (absolute HTTPS in both the CMS-image and generated-card cases), `og:url`, `og:image:width`, `og:image:height`, and `og:image:alt` all present. Example (`/blogs/ai-broke-software-security-biggest-assumption`): `og:image` resolves to `https://cdn.cleanstart.com/web/general/glowing-blue-chess-knight-...webp` with `width=683`, `height=423`, and a descriptive `alt`.

### META-04 — Canonical is self-referencing, absolute, and exactly one per page

- **Severity:** P1
- **Applies:** Always
- **Rule:** Every indexable page emits exactly one `<link rel="canonical">`, absolute and self-referencing (or, for listing pages, pointing at the clean, query-stripped base path). Detail routes may override to a CMS-declared canonical only when the CMS document explicitly opts in.
- **Why:** A missing, relative, or duplicated canonical hands duplicate-content consolidation to Google's heuristics instead of declaring it directly; listing pages that canonicalize every `?page=`/`?category=`/`?q=` variant to a shared base path avoid fragmenting one collection's signal across dozens of near-identical URLs.
- **Acceptance:**
  - Exactly one `link[rel=canonical]` element in the rendered HTML
  - Absolute, `https://`, production host
  - Listing pages canonicalize to the clean base path regardless of query string
- **Verify:** `jq -r '.pages[] | select(.head and .head.canonicalCount != 1) | .template' docs/seo/evidence/live-capture.json`
- **Reference:** `apps/web/src/lib/seo/canonical.ts:131` (`alternates: { canonical }`), `:208-217` (`buildListingMetadata` — always canonicalizes to `basePath`), `cms-seo.ts:68-70` (CMS override gated on `seo.useCustomCanonical`)
- **Source:** [Tier 1] https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls
- **Anti-patterns:** building canonical from request headers (breaks behind a proxy/CDN, emits the wrong host); a canonical override that doesn't match a byte-identical sitemap entry.
- **CleanStart:** Pass

Evidence: all 57 head-captured routes (including the 13 legacy-redirect 404 checks) return `canonicalCount: 1`; the sampled listing pages (`/blogs`, `/events`, `/resource-center`) all canonicalize to their clean base path per code inspection.

### META-05 — Meta description is present, unique, and accurate per indexable page

- **Severity:** P2
- **Applies:** Always
- **Rule:** Write a non-empty, accurate meta description for every indexable page, understanding Google treats it as a candidate snippet source, not a guaranteed one — the same page can show different snippet text per query regardless of what's written here.
- **Why:** *"Snippets are primarily created from the page content itself... Google sometimes uses the meta description HTML element if it might give users a more accurate description of the page than content taken directly from the page."* A missing description forces Google to always auto-extract; a duplicated or templated one forfeits the "more accurate than auto-extraction" case entirely.
- **Acceptance:**
  - A `<meta name="description">` tag present and non-empty for every indexable URL
  - No two distinct-content pages share identical description text
  - Description reads as accurate even on a query where it might be shown verbatim
- **Verify:** `jq -r '.pages[].head.description // empty' docs/seo/evidence/live-capture.json | sort | uniq -d`
- **Reference:** `apps/web/src/lib/seo/canonical.ts:130` (description passthrough — `canonical.ts:88` is `modifiedTime,`, an unrelated field, and is not the citation for this rule); `cms-seo.ts:25-34` (CMS `seo.description` field)
- **Source:** [Tier 1] https://developers.google.com/search/docs/appearance/snippet
- **Anti-patterns:** duplicate/templated descriptions across many pages; keyword-stuffed description text instead of natural sentences; relying on the description to influence ranking (it doesn't — only snippet display and, indirectly, CTR).
- **CleanStart:** Partial

Evidence: all 57 head-captured routes have non-empty descriptions, and the same two explained duplicate groups from META-01 (pricing alias, 404 template) account for every repeat. See META-06 for a real templated-description defect on `/legal/*` that this rule and that one both flag from different angles.

### META-06 — Avoid Google's documented title/description rewrite triggers

- **Severity:** P2
- **Applies:** Always
- **Rule:** Do not assume `<title>` or the meta description are guaranteed to display verbatim. Google names six title-rewrite triggers explicitly: half-empty/generic titles, obsolete titles contradicting current content, titles that don't match page content, boilerplate titles repeated across a template, pages with multiple equally-prominent headings and no clear single title, and title language/script mismatched to the page's primary language.
- **Why:** Writing to avoid these named triggers is the only lever available — Google gives no override mechanism once it decides to rewrite.
- **Acceptance:**
  - No page's title is boilerplate-identical to a sibling page's, differing only in a single substituted noun
  - Title/description content matches the page's actual visible content
- **Verify:** `jq -r '.pages[] | select(.template | startswith("detail:legal")) | .head.description' docs/seo/evidence/live-capture.json`
- **Reference:** `apps/web/src/app/(legal)/legal/[slug]/page.tsx:33-55`
- **Source:** [Tier 1] https://developers.google.com/search/docs/appearance/title-link
- **Anti-patterns:** keyword-stuffed titles; vague titles ("Home," "Untitled Page"); template titles/descriptions where only one noun varies per page — see the CleanStart finding below for a live instance of this exact pattern.
- **CleanStart:** Partial

Evidence: the `(legal)/legal/[slug]` route templates its description as literal `"{Document Name} — CleanStart legal documents."` for every legal document (confirmed live: `/legal/acceptable-use-policy` → *"Acceptable Use Policy — CleanStart legal documents."*; `/legal/additional-third-party-terms` → *"Additional Third-Party Terms — CleanStart legal documents."*). Each string is technically distinct (satisfies META-05's uniqueness check), but the pattern is exactly Google's named "boilerplate repetition" trigger. Contrast: `/privacy-policy` — same legal family, different route — carries a substantive, non-templated description (*"Read CleanStart's Privacy Policy detailing how personal and organizational data is collected, used, stored, and protected across its platform and services."*), showing the fix is already the house pattern elsewhere in the same collection family; it just hasn't been applied to `(legal)/legal/[slug]`.

### META-07 — Title/description length is a pixel-width guideline, not a hard character cap

- **Severity:** P2
- **Applies:** Always
- **Rule:** Do not enforce a hard character-count limit as a publish-blocking gate. Google's own documentation states no character or pixel number for either field — only that both are truncated "as needed, typically to fit the device width." Use pixel-width estimation as an advisory design heuristic, not a rule attributed to Google.
- **Why:** *"While there's no limit on how long a `<title>` element can be, the title link is truncated in Google Search results as needed, typically to fit the device width."* And for descriptions: *"There's no limit on how long a meta description can be, but the snippet is truncated in Google Search results as needed, typically to fit the device width."* No character count, pixel count, or fixed width appears on either page — the widely repeated "60 characters / 155 characters" convention is a back-conversion from third-party pixel-width studies assuming a specific font and case mix, not a Google-stated rule.
- **Acceptance:**
  - No CMS field validator hard-blocks publishing based on title/description character count
  - Any length indicator shown to editors is presented as advisory (a target range), not a pass/fail gate
- **Verify:** `grep -n "advisory only\|HARD_CAP" apps/cms/src/payload/admin/components/SeoTitleField.tsx apps/cms/src/payload/admin/components/SeoDescriptionField.tsx`
- **Reference:** `apps/cms/src/payload/admin/components/SeoTitleField.tsx:7-11,47-49`; `apps/cms/src/payload/admin/components/SeoDescriptionField.tsx:7-11,44-46`
- **Source:** [Tier 1] https://developers.google.com/search/docs/appearance/title-link; [Tier 1] https://developers.google.com/search/docs/appearance/snippet — both state only "typically to fit the device width," no number. See the "Title and description formulas" section below for the corrected Tier 3 pixel-width figures.
- **Anti-patterns:** hard-coding a 60- or 155-character CMS field validator that rejects a valid, well-truncating title/description; presenting the character count as if it came from Google.
- **CleanStart:** Partial

Evidence: the CMS editor UI (`SeoTitleField.tsx`, `SeoDescriptionField.tsx`) already implements the correct mechanical behavior: a traffic-light character counter (green/amber/red) that is explicitly commented `"advisory only — publishing is allowed at any length"`, with no hard-blocking validator. The gap is a documentation-accuracy one, not a mechanism one: both components' own code comments assert *"Google typically truncates titles around 60 characters"* / *"Google's typical truncation"* at 160 characters, stating Google's behavior as fact when Google's actual documentation states no such number — the comments should be reworded to label 60/160 as this SOP's own convention, not an attributed Google behavior.

### META-08 — Twitter/X Card markup implemented as an Open Graph supplement

- **Severity:** P2
- **Applies:** Always, for every publicly shareable page
- **Rule:** Implement `twitter:card`, `twitter:title`, `twitter:description`, and `twitter:image` (plus `twitter:image:alt`) on every publicly shareable page, defaulting to `summary_large_image`. Do not rely on Open Graph fallback alone — X's fallback-to-OG behavior is undocumented by X's own current sources in this SOP's research pass. Where a brand handle exists, also emit `twitter:site`.
- **Why:** When a URL is posted on X, X's crawler fetches the page server-side and parses `twitter:*` tags directly to render the inline preview card. The official Twitter/X Card Validator (`cards-dev.twitter.com`) was shut down in 2022 with no first-party replacement — tags remain functional and parsed, but there is no official way to pre-publish-validate a card; treat any third-party validator as an approximation, not authoritative.
- **Acceptance:**
  - `twitter:card`, `twitter:title`, `twitter:description`, `twitter:image`, `twitter:image:alt` all present with non-empty content
  - `twitter:site` present wherever a brand X/Twitter handle exists in site configuration
- **Verify:** `curl -s https://www.cleanstart.com/blogs/ai-broke-software-security-biggest-assumption | grep -oP '<meta name="twitter:[a-z:]+" content="[^"]*"'`
- **Reference:** `apps/web/src/lib/seo/canonical.ts:155-160` (`twitter` block — no `site`/`creator` fields); `apps/web/src/app/layout.tsx:91,123-129` (only place `seoDefaults.twitterHandle` is read, into the root layout's own `twitter` block)
- **Source:** [Tier 1] https://developer.x.com/en/docs/twitter-for-websites/cards/overview/markup (corrected path per verification-log correction #6 — the file previously cited the wrong `x-for-websites` segment; both this URL and the corrected one return HTTP 402 to automated fetches in this session, so tag names are corroborated via [Tier 2] https://nextjs.org/docs/app/api-reference/functions/generate-metadata, which shows the identical rendered tag names in its own examples). Tier 4, corroborating only, not authoritative: https://www.thatdevpro.com/reference/html-twitter-cards/ (card-type list; confirms the validator shutdown independently).
- **Anti-patterns:** relying on Open Graph fallback alone without testing (fallback behavior is undocumented by a Tier 1 source); declaring `summary_large_image` with an undersized image, which some third-party sources report (Tier 4, unconfirmed) silently downgrades the render to `summary`.
- **CleanStart:** Partial

Evidence: verified live on the home page and a blog detail route: `twitter:card` (`summary_large_image`), `twitter:title`, `twitter:description`, `twitter:image`, and `twitter:image:alt` are all present and correctly populated. `twitter:site` is absent site-wide, however — `buildPageMetadata()`'s `twitter` block (`canonical.ts:155-160`) never sets `site`/`creator`, and because every route calls `buildPageMetadata()`, its per-route `twitter` object always fully replaces the root layout's (which does conditionally set `site` from CMS `seoDefaults.twitterHandle`). Confirmed by direct fetch: no `twitter:site` tag on the live homepage despite the CMS field existing to supply one.

### META-09 — Image `alt` text is descriptive for content images, empty for decorative ones

- **Severity:** P2
- **Applies:** Always
- **Rule:** Write descriptive, specific `alt` text for every content-bearing `<img>`. Use `alt=""` (present and empty, not omitted) for purely decorative images so screen readers skip them silently instead of announcing the filename.
- **Why:** *"The most important attribute when it comes to providing more metadata for an image is the alt text... Google uses alt text along with computer vision algorithms and the contents of the page to understand the subject matter of the image."* Accessibility is the primary purpose; SEO/Google Images indexing is a secondary, real benefit riding on the same attribute.
- **Acceptance:**
  - No content image lacks an `alt` attribute
  - No `alt` attribute is empty for a non-decorative image
  - No `alt` text is keyword-stuffed (a comma-separated keyword list rather than a natural description)
- **Verify:** `curl -s https://www.cleanstart.com/blogs/ai-broke-software-security-biggest-assumption | grep -oP '<img[^>]*>' | grep -vc 'alt='`
- **Reference:** CLAUDE.md "Image rules" (project convention: `next/image` for content images with explicit dimensions, decorative SVGs get `aria-hidden`); `biome.json:33` (`recommended: true`, enabling Biome's `a11y` rule set, which includes an alt-text check) plus `apps/web/biome.json:9-13` (per-directory `a11y` overrides)
- **Source:** [Tier 1] https://developers.google.com/search/docs/appearance/google-images
- **Anti-patterns:** `alt="image"`, `alt="photo123.jpg"`, or omitted `alt` entirely; keyword-stuffed alt strings; omitted `alt=""` on decorative/spacer images (forces screen readers to announce the filename).
- **CleanStart:** Partial

Evidence: `/blogs/ai-broke-software-security-biggest-assumption` — 31 of 31 `<img>` elements carry an `alt` attribute — but this is one of ~39 route types, not a full-site audit. Alt **presence** is CI-enforced, not merely spot-checked: root `biome.json:33` sets the linter's `"recommended": true`, which enables Biome's `a11y` rule set (including its `useAltText` check), and `apps/web/biome.json:9-13` overrides only three unrelated `a11y` rules (`noSvgWithoutTitle`, `useSemanticElements`, `useAnchorContent`) — it does not touch `useAltText`. `.github/workflows/web.yml` runs `biome lint src` on both `push` and `pull_request`, so a missing `alt` attribute fails CI, not just a local spot-check. What remains genuinely unverified in this pass is narrower than "presence": alt **quality** (descriptive vs. keyword-stuffed vs. filename-as-alt) has no automated check and was not assessed, and full-site coverage beyond the one sampled route was not re-run against the live site.

### META-10 — CMS `seo.*` overrides must reach every CMS-backed detail route through one shared resolver

- **Severity:** P2
- **Applies:** All CMS-backed detail routes (`blogs/[slug]`, `news/[slug]`, `event/[slug]`, `job/[slug]`, `guide/[slug]`, `resources/[slug]`, `knowledge-hub/[slug]`, `(legal)/legal/[slug]`, `/privacy-policy`, `author/[slug]`)
- **Rule:** Every CMS collection with a `seo` field group must resolve title/description/canonical/noindex through the same shared resolver (`resolveCmsSeo()`), so an editor's per-document SEO override behaves identically regardless of which collection they're editing.
- **Why:** An editor who sets a custom `seo.title` on an Author document reasonably expects the same override behavior they get on every other collection. A silently-skipped resolver means the field renders in the admin UI, appears to save, and never reaches the live page — a trap for editors, not a documented limitation.
- **Acceptance:**
  - Every collection with a `seo` field group calls `resolveCmsSeo(doc.seo, ...)` before building page metadata
- **Verify:** `grep -c resolveCmsSeo "apps/web/src/app/author/[slug]/page.tsx"`
- **Reference:** `apps/web/src/lib/seo/cms-seo.ts:52-85` (`resolveCmsSeo`); `apps/web/src/app/author/[slug]/page.tsx:35-71` (builds title/description directly from CMS author fields — `name`, `role`, `bioShort`, `photo` — without calling `resolveCmsSeo`)
- **Source:** Convention — not vendor-confirmed (an internal consistency requirement, not a search-engine rule)
- **Anti-patterns:** a collection-specific metadata builder that reads base content fields but skips the shared `seo.*` resolver, creating an editor-facing trap where the override field exists in the admin UI but is never consulted.
- **CleanStart:** Fail

Evidence: confirmed by direct grep: `resolveCmsSeo` does not appear anywhere in `author/[slug]/page.tsx`. The 9 other CMS-backed detail routes plus `/privacy-policy` all call it; `author/[slug]` is the sole exception, so an author's own `seo.title`/`seo.description`/`seo.noindex` override (if set in the CMS) is silently never applied.

---

### META-11 — Never emit a meta keywords tag

- **Severity:** P3
- **Applies:** Always
- **Rule:** Do not add `<meta name="keywords">` to any page, and do not build a CMS field or admin UI control implying it does anything.
- **Why:** *"The meta-keyword tag is not used by Google Search, and it has no effect on indexing and ranking at all."* Dead since 2009; still the single most-repeated dead practice requested in briefs — worth an explicit "do not add" rule precisely because it keeps resurfacing.
- **Acceptance:**
  - Zero `<meta name="keywords">` tags anywhere on the site
- **Verify:** `curl -s https://www.cleanstart.com/ | grep -c 'name="keywords"'`
- **Reference:** None — no reference implementation (no `keywords` field exists in `buildPageMetadata()`'s return type, `apps/web/src/lib/seo/canonical.ts:127-160`)
- **Source:** [Tier 1] https://developers.google.com/search/docs/crawling-indexing/special-tags
- **Anti-patterns:** adding a "keywords" CMS field on editor request; copying a `<meta name="keywords">` tag forward from a legacy Webflow export during migration.
- **CleanStart:** Pass

Evidence: confirmed by direct fetch of the live homepage: zero `meta name="keywords"` tags. `buildPageMetadata()`'s `Metadata` object has no `keywords` key at all.

### META-12 — Snippet-suppression directives used deliberately, not left to chance

- **Severity:** P3
- **Applies:** Only pages carrying content that must never appear as a search snippet (paywalled text, legally sensitive passages)
- **Rule:** Use `nosnippet` (a `robots` meta value), `max-snippet:[number]`, and the `data-nosnippet` HTML attribute deliberately when specific content must never be extracted as a snippet, rather than leaving it to chance. `nosnippet` suppresses the whole page's text/video snippet; `max-snippet:[number]` caps length; `data-nosnippet` scopes suppression to a specific DOM element while leaving the rest of the page snippet-eligible.
- **Why:** These are Google's only documented, deliberate snippet-suppression levers — and, since ~March 2025, they also govern AI Overviews/AI Mode content reuse, not just the classic organic snippet, per Google's robots-meta-tag documentation.
- **Acceptance:**
  - Pages requiring snippet suppression return the correct `robots` meta directive in HTML source
  - No snippet text appears in a `site:` search for that URL
- **Verify:** `curl -s https://www.cleanstart.com/roi-calculator | grep -o 'name="robots" content="[^"]*"'`
- **Reference:** `apps/web/src/lib/seo/canonical.ts:161-177` (`robots` field construction — currently only expresses `noindex`/`nofollow`, no `nosnippet`/`max-snippet` param)
- **Source:** [Tier 1] https://developers.google.com/search/docs/appearance/snippet ("Control your snippets"); [Tier 1] https://developers.google.com/search/docs/crawling-indexing/robots-meta-tag (AI Overviews/AI Mode extension)
- **Anti-patterns:** applying `nosnippet` site-wide by mistake (kills all organic snippets, hurting CTR); using `data-nosnippet` around content that should actually be searchable.
- **CleanStart:** N/A

Evidence: CleanStart currently has no paywalled or snippet-sensitive content requiring suppression; `buildPageMetadata()` has no `nosnippet`/`max-snippet` parameter today, which is correct given nothing on the site needs it yet. Revisit if a gated or legally sensitive content type is added.

### META-13 — Page-level `hreflang` only where the site is genuinely multi-locale

- **Severity:** P3
- **Applies:** Only sites serving 2+ locale variants of the same content — see module `C1` for the full matrix-correctness ruleset (bidirectional confirmation, reserved-code rejection, `x-default`) when this condition is met
- **Rule:** Do not emit `hreflang` tags for a single-locale site. When a site does serve multiple locales, every localized page must declare a self-referencing `<link rel="alternate" hreflang="X" href="URL">` plus one tag per sibling locale, with reciprocal links resolving bidirectionally.
- **Why:** An absent `hreflang` on a single-locale site is correct, not a gap — adding it prematurely (e.g., a single self-referencing tag with no sibling locale) adds parsing overhead for no benefit. This rule exists in module 03 only to record that absence-check; full matrix mechanics belong to `C1` and are not duplicated here.
- **Acceptance:**
  - Zero `hreflang` tags present on a single-locale site
  - (If multi-locale) — see `C1`
- **Verify:** `jq -r '.pages[].head.hreflangCount' docs/seo/evidence/live-capture.json | sort -u`
- **Reference:** None — no reference implementation (no `hreflang`-emitting code exists in `apps/web`)
- **Source:** [Tier 1] https://developers.google.com/search/docs/specialty/international/localized-versions
- **Anti-patterns:** a bare region-only code (e.g. `hreflang="uk"`) if `hreflang` is ever added; forgetting the self-referencing tag.
- **CleanStart:** N/A

Evidence: CleanStart is single-locale (`en-US` only, per `layout.tsx` OG `locale`); live capture confirms `hreflangCount: 0` across all 57 head-captured routes, which is the correct state for this site today.

### META-14 — Search-engine verification meta tags are emitted from exactly one code path

- **Severity:** P3
- **Applies:** Always
- **Rule:** Each search-engine verification meta tag (`google-site-verification`, `msvalidate.01`, `p:domain_verify`, `facebook-domain-verification`) is produced by exactly one function in the codebase, with no second, dead implementation left importable and confusable with the live one.
- **Why:** A dead second implementation whose docstring makes claims about "where it's used" that no longer match reality is a documentation hazard for the next engineer who reads it and trusts the comment over the actual call graph.
- **Acceptance:**
  - Exactly one function per verification-tag type has a live caller
  - That function's own docstring accurately describes its actual role
- **Verify:** `grep -rn "siteVerification(" apps/web/src | grep -v '\.test\.'`
- **Reference:** `apps/web/src/lib/seo/verification.ts:19-23` (`siteVerification()` — dead); `apps/web/src/lib/seo/seo-defaults.ts:232` (`verificationFromDefaults()` — the live path); `apps/web/src/app/layout.tsx:27,100` (actual caller)
- **Source:** Convention — not vendor-confirmed (internal code-hygiene requirement, not a search-engine rule)
- **Anti-patterns:** leaving a dead helper function with a docstring that contradicts the live code path, rather than deleting it or updating the comment.
- **CleanStart:** Fail

Evidence: `siteVerification()` (`verification.ts:19-23`) has zero non-test callers; the root layout instead calls a different function, `verificationFromDefaults()` (`seo-defaults.ts:232`, called from `layout.tsx:100`). `verification.ts`'s own docstring (`:9-10`) claims it is *"Set once in the root layout's `metadata`"* — false, contradicted by the actual call graph — and its inline comment (`:13-15`) claims the CMS field `seoDefaults.verification.google` is "for the Phase-J2 dashboard's display, not for emitting the live tag," which is also contradicted: that same CMS field **is** the live tag's source, via `verificationFromDefaults()`.

### META-15 — Unwired CMS `seo.*` fields must not be presented as functional in the editor UI

- **Severity:** P3
- **Applies:** Any CMS field group with fields the web app does not consume
- **Rule:** A CMS field that no `apps/web` code path reads must either be removed from the admin UI, hidden, or clearly labeled as not-yet-wired — it must not sit in the editor's form looking identical to a functional field.
- **Why:** An editor who sets `seo.robotsAdvanced` or `seo.alternates` (hreflang) on a document, sees it save successfully, and later discovers it was never read by the live site has been actively misled by the admin UI's own affordance.
- **Acceptance:**
  - Every field in the `seo` group either has a consuming code path in `apps/web`, or is visibly marked not-yet-wired in the admin UI
- **Verify:** `grep -rn "composeRobotsMeta\|composeHreflangCluster\|composeCustomTags" apps/web/src`
- **Reference:** `apps/web/src/lib/seo/cms-seo.ts:6-14` (header comment names `robotsAdvanced`, `alternates`, `customTags`, and advanced twitter/og fields as explicitly unwired, stating the composition helpers "do not exist in `apps/web` yet")
- **Source:** Convention — not vendor-confirmed (internal editor-trust requirement, not a search-engine rule)
- **Anti-patterns:** shipping a CMS field ahead of its consuming code with no visible "not yet live" indicator in the admin UI.
- **CleanStart:** Fail

Evidence: confirmed by grep: `composeRobotsMeta`, `composeHreflangCluster`, and `composeCustomTags` appear nowhere under `apps/web/src` except as names in `cms-seo.ts`'s own header comment; no implementation exists. `seo.additionalSchema` is the one exception named in the same comment — it **is** consumed, but via the JSON-LD path (`compose-page.ts:59-64`), not the `<title>`/`<meta description>` path this module covers.

### META-16 — Exactly one metadata definition per route

- **Severity:** P3
- **Applies:** Always
- **Rule:** Each route defines its `<title>`/`<meta description>`/OG/Twitter metadata in exactly one place — either the route's own `page.tsx` or an ancestor `layout.tsx`, never both defining conflicting values for the same route with no comment explaining why.
- **Why:** Next.js metadata resolution replaces (not deep-merges) an object-valued field like `openGraph`/`twitter` when both a layout and a page define it — an unexplained dual definition is a latent bug magnet: the next engineer to touch either file cannot tell which one is intentionally authoritative.
- **Acceptance:**
  - No route has both a `page.tsx`-level `metadata`/`generateMetadata` export and an ancestor `layout.tsx`-level `generateMetadata` targeting the identical path, without an explaining comment
- **Verify:** `grep -c "export const metadata" apps/web/src/app/page.tsx; grep -c "generateMetadata" apps/web/src/app/layout.tsx`
- **Reference:** `apps/web/src/app/page.tsx:53-61` (`export const metadata`, `absoluteTitle: true`); `apps/web/src/app/layout.tsx:87-131` (`generateMetadata()`, also targets `/`)
- **Source:** Convention — not vendor-confirmed (internal code-hygiene requirement, not a search-engine rule)
- **Anti-patterns:** two metadata definitions for the same route with no comment stating which wins and why — a future refactor of either file can silently flip the winner.
- **CleanStart:** Partial

Evidence: the home page (`/`) is the one route with dual definitions: `page.tsx:53-61` exports its own `metadata` with `absoluteTitle: true`, while the root `layout.tsx:87-131` separately exports `generateMetadata()` also targeting `/`. Field-by-field, `page.tsx`'s values win wherever both define a field (`title`, `description`, `openGraph`, `twitter` — see META-08's `twitter:site` finding for one concrete consequence of this). `verification` survives because only the layout sets that key. No comment in either file explains whether this is an intentional override-on-purpose or accidental duplication; resolving that needs commit history or an author interview, not a code read.

---

## Title and description formulas

This section is the SOP's reusable deliverable for this module: **formulas, patterns, and constraints — never per-page copy.** Each pattern below is expressed as a template, followed by its uniqueness requirement, what specifically triggers Google to rewrite it (per META-06), and a worked example drawn from the live capture so the formula is grounded in real production output.

#### On length

Per META-07: Google's own documentation states **no character or pixel number** for either `<title>` or `<meta description>` — only that both are truncated "as needed, typically to fit the device width." Any specific number below is therefore a **`Convention — not vendor-confirmed`** working figure, not a Google requirement, and should be enforced as advisory guidance, never a hard publish-blocking gate.

The only numbers this SOP will state come from a directly-fetched Tier 3 pixel-width study (Sistrix), corrected per `verification-log.md` correction #5 — the previously fabricated "990px / 165 characters" description figure does not appear on the cited page and must not be repeated:

```markdown
Title:        ~580px desktop truncation point, ~920px on mobile (Tier 3, pixel-width measurement — not a character count; pixels don't convert 1:1 to characters because glyph widths vary)
Description:  ~580px desktop truncation point, ~150-155 characters as the tightened practical range that reliably avoids mid-word ellipsis (Tier 3, same caveat)
```

Treat these as a design heuristic — validate against a pixel-width estimator tuned to the SERP font when a title/description is near the boundary — not as a CMS field validator that rejects valid, well-truncating text.

#### Home

```markdown
Title:        {Primary value proposition, outcome-led} | {Brand}
Description:  {What the product/company delivers} + {mechanism/how} + {who it's built for or what it protects}
```

- **Uniqueness:** only one home page exists per site, so cross-page uniqueness is automatic — the requirement here is that the home title must not converge on the same phrasing as a product page's title (would read as boilerplate repetition between the two most-linked pages on the site).
- **Rewrite trigger:** a generic title ("Home," "Welcome") triggers Google's half-empty/generic-title condition; a title that doesn't match the page's actual primary content (e.g., leading with a feature the hero no longer emphasizes) triggers the inaccurate-title condition.
- **Worked example** (`/`, live capture): Title — *"Verified, zero-CVE container images and libraries \| CleanStart"*. Description — *"CleanStart delivers verified, zero-CVE container images and libraries that are hardened, continuously scanned, and built for secure software supply chains."*

#### Product

```markdown
Title:        {Capability or outcome headline, distinct per product} [ | {Brand} — omit if using absoluteTitle]
Description:  {What the capability mechanically does} + {differentiator} + {audience or measurable outcome}
```

- **Uniqueness:** each product page must describe a genuinely distinct capability, not a shared template with one noun swapped — Google explicitly names "boilerplate titles repeated across pages" as a rewrite trigger for exactly this pattern on a product line.
- **Rewrite trigger:** near-identical phrasing repeated per product ("Reduce X with CleanStart," "Reduce Y with CleanStart," ...) risks the boilerplate-repetition trigger even when each string is technically unique; a title that no longer matches the page's current H1/hero content (after a redesign, say) triggers the inaccurate-title condition.
- **Worked examples** (live capture): `/attack-surface-reduction` — *"Reduce attack surface with Hardened Images \| CleanStart"*. `/clean-libraries` (uses `absoluteTitle: true`, so no brand suffix) — *"Clean Libraries: Verify Every Dependency Across Your Workflow"*. `/cleanstart-images` — *"Zero CVE Hardened Container Images \| CleanStart"*. Each states a distinct mechanism (attack-surface reduction vs. dependency verification vs. hardened images), not a templated variable-swap.

#### Listing

```markdown
Title:        {Content-type plural noun} | {Brand}
Description:  {What this collection contains} + {topical scope, in the reader's terms}
```

- **Uniqueness:** every listing title must be distinct from every other listing and from the site-wide fallback. Because listing pages canonicalize every query-param variant (page/category/filter) to one clean base path (META-04), pagination and filtering never fragment the title into near-duplicates — there is exactly one title to keep unique per collection, not one per query string.
- **Rewrite trigger:** a listing title that adds no descriptive value beyond the nav label risks Google preferring the page's own H1 instead — and per META-02, three listing templates (`/events`, `/news`, `/webinars`) currently render zero `<h1>` elements, meaning that fallback signal is entirely absent for those three routes today.
- **Worked examples** (live capture): `/blogs` — *"Blogs \| CleanStart"* / *"Explore CleanStart's blog expert insights on container security, software supply chain threats, CVE management, SBOM, and building trust in cloud-native environments."* `/resource-center` — *"Resource Center \| CleanStart"* / *"A curated collection of whitepapers, ebooks, datasheets, architecture insights, and reports on container security."* `/events` — *"Events \| CleanStart"* (h1Count: 0 — see META-02).

#### Article detail (blog)

```markdown
Title:        {Specific claim or question the article resolves} | {Brand}
Description:  {The hook/problem} + {what the reader learns}, often closing on a stated benefit
```

- **Uniqueness:** sourced from CMS `seo.title`/`seo.description` with a fallback to the article's own headline (`resolveCmsSeo`, META-10) — uniqueness is enforced by editorial process (every published headline is distinct by construction), not by an automated CMS-level dedupe validator; there is no mechanical guarantee here today.
- **Rewrite trigger:** a clickbait title that doesn't match the article body triggers the inaccurate-title condition; a title that's near-identical to its own meta description with no added framing risks a low-value/boilerplate read.
- **Worked example** (`/blogs/ai-broke-software-security-biggest-assumption`, live capture): Title — *"AI Is Finding More Vulnerabilities. Is Software More Secure? \| CleanStart"*. Description — *"AI is uncovering vulnerabilities at unprecedented speed, but discovery alone doesn't improve security. Learn why prevention is the future of software security."*

#### Resource detail

```markdown
Title:        {Resource proper name} | {One-line qualifier distinguishing it from a same-named product page} | {Brand}
Description:  {What the resource covers} + {who should read it / what they get from it}
```

- **Uniqueness:** the qualifier clause exists specifically to disambiguate a resource from a product page that may share the same proper noun — the worked example below shows this exact naming collision (the resource "Clean Library" vs. the product "Clean Libraries").
- **Rewrite trigger:** a title that's just the asset's internal filename or a generic label ("Whitepaper," "Download") triggers the generic-title condition — it must describe content, not container format.
- **Worked example** (`/resources/clean-libraries`, live capture): Title — *"Clean Library \| Verified Open Source Dependencies \| CleanStart"*. Description — *"Clean Library continuously verifies open-source dependencies directly from source, giving developers trusted libraries to consume"*. Compare against the product page `/clean-libraries` above — same underlying concept, deliberately distinct title framing (resource vs. product) rather than an accidental duplicate.

#### Job posting

```markdown
Title:        {Public-facing role title} | {Brand}
Description:  Apply for the {role title} role at {Brand} in {department} ({location(s)})
```

- **Uniqueness:** naturally unique per open requisition (role + department + location tuple). A title collision only occurs when two simultaneous postings genuinely share that full tuple — a real posting duplicate to resolve, not a metadata-formula defect.
- **Rewrite trigger:** copying an internal leveling-system title ("SWE III") instead of the public-facing role name risks a language/register mismatch; because the same `title` field also feeds the `JobPosting` structured-data node (module 04), an inaccurate title here corrupts the rich-result eligibility too, not only the blue link.
- **Worked example** (`/job/senior-software-engineer`, live capture): Title — *"Senior Software Engineer \| CleanStart"*. Description — *"Apply for the Senior Software Engineer role at CleanStart in Engineering (Ahmedabad, Bengaluru)"*.

#### Legal

```markdown
Title:        {Document's own legal name} | {Brand}
Description:  A substantive one-sentence summary of what the document covers — NOT "{Document Name} — {Brand} legal documents." repeated per document
```

- **Uniqueness:** one document per slug; the title is the document's own legal name, so a collision would mean two legal documents sharing a name — a content problem, not a metadata one.
- **Rewrite trigger:** per META-06, a boilerplate description repeated across every legal document with only the document name substituted is exactly Google's named "boilerplate repetition" trigger — and this is a live, not hypothetical, finding on this site today.
- **Worked examples** (live capture) — the defect in place: `/legal/acceptable-use-policy` — *"Acceptable Use Policy \| CleanStart"* / *"Acceptable Use Policy — CleanStart legal documents."* `/legal/additional-third-party-terms` — *"Additional Third-Party Terms \| CleanStart"* / *"Additional Third-Party Terms — CleanStart legal documents."* — and the correct pattern, already in use one route over in the same legal family: `/privacy-policy` — *"Privacy Policy \| CleanStart"* / *"Read CleanStart's Privacy Policy detailing how personal and organizational data is collected, used, stored, and protected across its platform and services."* The `/legal/*` template should move toward `/privacy-policy`'s substantive-summary pattern rather than the current name-substitution template.
