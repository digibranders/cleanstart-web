# On-Page Metadata — SEO SOP Evidence Base

Research date: 2026-07-29. Scope: title elements, meta descriptions, length limits (pixel vs. character), heading semantics/hierarchy, Open Graph, Twitter/X Cards, image `alt` text, page-level `hreflang`. This file documents **rules, mechanisms, and verification methods** — no per-page copy.

**Source tiers** (per task brief):
- **Tier 1** — official spec / vendor docs (Google Search Central, ogp.me, X developer docs, WHATWG, Bing)
- **Tier 2** — first-party platform engineering docs (Next.js, Vercel)
- **Tier 3** — named, dated empirical study with published methodology (supporting evidence only)
- **Tier 4** — practitioner consensus

Every citation below was fetched directly in this session unless marked **[fetch blocked]**, in which case the finding is corroborated via search-result snippets of the same primary page and flagged accordingly — do not treat those as independently verified.

---

## HIGH-VALUE FLAGS (read first)

### Flag 1 — Deprecated / materially changed

| Item | Status | Detail |
|---|---|---|
| **Meta keywords tag** | Dead since 2009, still dead in 2026 | Google's own docs state plainly: *"The meta-keyword tag is not used by Google Search, and it has no effect on indexing and ranking at all."* (Source: [Meta Tags Google Supports](https://developers.google.com/search/docs/crawling-indexing/special-tags), Tier 1). Not a *recent* change (13+ years), but still the single most-repeated dead practice in briefs — include an explicit "do not add" rule in the SOP. |
| **Twitter/X Card Validator** | Removed in 2022, never replaced | X shut down the official `cards-dev.twitter.com` validator with no first-party replacement. `twitter:*` tags are still parsed and rendered by the X crawler when a link is posted, but there is no official way to debug them pre-publish — only third-party tools. Older than the 24-month window strictly, but its *current absence* is the fact that matters for an SOP written in 2026: don't tell editors to "check the Twitter Card Validator," it doesn't exist. |
| **`rel="next"`/`rel="prev"`** | Google confirmed it no longer uses these (mentioned in passing on the same special-tags page) — not in scope for this SOP but flagged since it's commonly still recommended in older SEO checklists. |
| **WHATWG "document outline algorithm"** | Removed from the HTML spec July 1, 2022 | No browser ever implemented it. The outline is now derived directly from the literal sequence of `h1`–`h6` elements on the page, not from nesting inside `<section>`/`<article>`. This is >24 months old but is the direct cause of Flag 2 below, so it's included. |

### Flag 2 — Practitioner consensus not supported by the primary source

**"60-character title / 155-character meta description"** — this is the single largest gap between practitioner convention and what Google actually documents.

- **What Google actually commits to, verbatim:** *"While there's no limit on how long a `<title>` element can be, the title link is truncated in Google Search results as needed, typically to fit the device width."* And for descriptions: *"There's no limit on how long a meta description can be, but the snippet is truncated in Google Search results as needed, typically to fit the device width."* — [Title Links](https://developers.google.com/search/docs/appearance/title-link) and [Snippets](https://developers.google.com/search/docs/appearance/snippet), both Tier 1.
- **What Google does NOT commit to:** any character count, any pixel count, or any single width value. Truncation is device-width-dependent and font-rendering-dependent, not a fixed constant.
- **Where the "60/155" convention actually comes from:** pixel-width measurement studies (Tier 3, see below) that back-convert an observed ~600px (desktop title) / ~920px (desktop description) truncation point into an *average*-character estimate assuming a specific font (Google's UI font) and case mix. Because character width varies (a `W` is several times wider than an `i`), the character number is a **derived approximation of a pixel constraint**, not a rule Google states.
- **Second-order myth this feeds:** "one `<h1>` per page is a hard SEO/HTML rule." The WHATWG spec explicitly shows a valid example with *three* `<h1>` elements in one document and states only that a single H1 in the outline "**should**" (not must) exist. Google's own guidance (via public statements, secondary-sourced below) is that multiple H1s don't hurt rankings; the *only* firm rule from the spec is that consecutive heading levels can't skip more than one step down (i.e., h1 → h3 with no h2 in between violates the outline construction rule).

---

## Requirements

### 1. Title element must exist and be unique per page

- **Rule:** Every page must have exactly one non-empty `<title>` element that uniquely and accurately describes that page's content.
- **Mechanism:** Google's title-link generator prefers the `<title>` element first, but falls back to (in order of consideration) visible page headings, `og:title`, prominent styled text, anchor text pointing at the page, and `WebSite` structured data — verbatim: *"Content in `<title>` elements, Main visual title shown on the page, Heading elements, such as `<h1>` elements, Content in `og:title` meta tags, Other content that's large and prominent through the use of style treatments, Other text contained in the page, Anchor text on the page, Text within links that point to the page"* — when it judges the `<title>` element to be missing, low-quality, or inaccurate.
- **Acceptance criterion:** `curl -s <url> | grep -o '<title>[^<]*</title>'` returns exactly one non-empty match, and no two pages in the sitemap share identical title text.
- **Verification method:** `for u in $(cat sitemap-urls.txt); do curl -s "$u" | grep -oP '(?<=<title>).*?(?=</title>)'; done | sort | uniq -d` — any output indicates duplicate titles.
- **Source:** [Influencing your title links in search results](https://developers.google.com/search/docs/appearance/title-link) — Tier 1.
- **Anti-patterns:** empty/missing `<title>`; boilerplate titles identical across a template's pages (Google explicitly calls out "boilerplate repetition" as a trigger for rewriting); title text that contradicts on-page content (triggers "inaccurate title" rewriting); title language mismatched to page content language.

### 2. Google may and will rewrite the displayed title link — six documented triggers

- **Rule:** Do not assume the `<title>` element is guaranteed to display verbatim in search results; write it to avoid the specific conditions Google names as rewrite triggers.
- **Mechanism:** Google's docs enumerate six scenarios that cause a rewrite: half-empty/generic titles, obsolete titles that contradict current visible content, titles that don't match page content, boilerplate titles repeated across pages, pages with multiple equally-prominent headings (no clear single title), and title language/script mismatched to the page's primary language.
- **Acceptance criterion:** For a sample of indexed URLs, the `<title>` tag content and the Google SERP title-link text match verbatim (spot-check via `site:` search or GSC URL Inspection "Google-selected title" if reported).
- **Verification method:** GSC URL Inspection tool → "Coverage" → check rendered title, or manual `site:domain.com "exact title string"` search comparison.
- **Source:** [Influencing your title links in search results](https://developers.google.com/search/docs/appearance/title-link) — Tier 1.
- **Anti-patterns:** keyword-stuffed titles ("no reason to have the same words or phrases appear multiple times" per Google); vague titles like "Home" or "Untitled Page"; template titles where only the site name varies.

### 3. Title and meta-description length is a pixel-width constraint, not a character-count rule

- **Rule:** Do not enforce a hard character-count limit as if it were a Google requirement; use pixel-width estimation as a design heuristic instead, understanding it is an approximation.
- **Mechanism:** Google's rendering engine allocates a fixed on-screen pixel width for the title link and snippet and truncates (with an ellipsis) whatever text exceeds it; the width is dependent on the requesting device and rendering font, not on a stated character maximum.
- **Acceptance criterion:** No page's title/description should be *assumed* safe purely because it is under 60/155 characters — instead verify against a pixel-width estimator tuned to Google's SERP font, and treat both the character heuristic and the pixel number as approximations, re-validated periodically since Google has changed the SERP width before (2009–2012 per Tier 3 sources).
- **Verification method:** Sistrix SERP Snippet Generator or an equivalent pixel-width checker; automate with a Canvas-based JS pixel-measurement script using the approximate SERP font (Arial-family desktop, Roboto mobile) as a CI lint step, not a hard character-count gate.
- **Sources:**
  - Tier 1 (what Google commits to — nothing beyond "device width," no number): [Title Links](https://developers.google.com/search/docs/appearance/title-link); [Snippets](https://developers.google.com/search/docs/appearance/snippet).
  - Tier 3 (pixel-width empirical estimates, supporting evidence only, not vendor spec): [Sistrix — SEO Title: How long should a title tag be?](https://www.sistrix.com/ask-sistrix/onpage-optimisation/title-element-title-tag/length) — states desktop truncation around **580px**, mobile around **920px**, and explicitly notes *"pixels cannot be translated one-to-one into characters"* because Arial-family character widths vary by glyph and case. Sistrix's companion page [How long should the meta description be?](https://www.sistrix.com/ask-sistrix/onpage-optimisation/meta-description/length/) gives description truncation figures (desktop ~990px/165 chars, tightened recommendation ~580px/150-155 chars to avoid ellipsis) — **[corroborated via search snippet, not independently re-verified against a live fetch of that exact page in this session; the sibling title-length page on the same domain was fetched directly and matches in methodology and framing]**.
  - Tier 3/4 (character-count-from-pixel-width origin): Moz's title-tag guidance (commonly attributed to Dr. Pete Meyers' analysis of a ~10,000-query sample producing a "confidence table" of cutoff lengths, with ~55 characters cited as the point where ~95% of titles display uncut) — **[fetch blocked: moz.com not reachable in this session; content characterized from convergent third-party search summaries only, not verified against the primary Moz page — do not cite Moz's exact figures in the SOP without a fresh fetch]**.
- **Anti-patterns:** hard-coding a 60-character or 155-character CMS field validator and rejecting valid, well-truncating titles/descriptions that exceed it; assuming all fonts/devices truncate identically.

### 4. Meta description is optional and secondary to on-page content for snippet generation

- **Rule:** Write a meta description for every indexable page, but understand Google treats it as a candidate source, not a guaranteed snippet.
- **Mechanism:** *"Snippets are primarily created from the page content itself... Google sometimes uses the meta description HTML element if it might give users a more accurate description of the page than content taken directly from the page."* Google generates snippets dynamically per-query, meaning the same page can show different snippet text for different search queries, regardless of the meta description.
- **Acceptance criterion:** A meta description tag is present and non-empty for every indexable URL; it accurately and uniquely summarizes the page (test: does it read as accurate if a search engine displays it verbatim for an unrelated query — it may not always be shown).
- **Verification method:** `curl -s <url> | grep -oP '(?<=name="description" content=")[^"]*'`; cross-check GSC Performance report snippets for a sample of ranking queries to see how often the written meta description appears verbatim vs. is replaced by a query-specific extract.
- **Source:** [Create good meta descriptions](https://developers.google.com/search/docs/appearance/snippet) — Tier 1.
- **Anti-patterns:** duplicate/templated meta descriptions across many pages; meta descriptions stuffed with keywords rather than written as natural sentences; relying on the meta description to control ranking (it doesn't — it only affects snippet display and, indirectly, CTR).

### 5. Snippet display can be explicitly controlled via dedicated directives

- **Rule:** Use `nosnippet`, `max-snippet:[number]`, and `data-nosnippet` deliberately when specific content must never appear as a search snippet (e.g., paywalled or sensitive text), rather than leaving it to chance.
- **Mechanism:** `nosnippet` (robots meta value) fully suppresses text/video snippets for a page; `max-snippet:[number]` caps snippet length to N characters; `data-nosnippet` is an HTML attribute placed on specific page elements (span/div/section) to exclude just that portion from snippet eligibility while leaving the rest of the page snippet-eligible.
- **Acceptance criterion:** Pages requiring snippet suppression return the correct `robots` meta value in HTML source and no snippet text appears in `site:` search results for that URL.
- **Verification method:** `curl -s <url> | grep -o 'name="robots" content="[^"]*"'`; manual `site:` search spot-check.
- **Source:** [Create good meta descriptions § Control your snippets](https://developers.google.com/search/docs/appearance/snippet) — Tier 1.
- **Anti-patterns:** applying `nosnippet` site-wide by mistake (kills all organic snippets, hurting CTR); using `data-nosnippet` around content that should actually be searchable.

### 6. Heading elements form a level-based outline; H1 is a strong convention, not a hard single-instance rule

- **Rule:** Use exactly one `<h1>` per page as the primary heading (house style / accessibility convention), and never skip a heading level going deeper (an `h2` must not be followed directly by an `h4`).
- **Mechanism:** The WHATWG spec's outline is built directly from the literal sequence of `h1`–`h6` elements (the older "document outline algorithm" based on sectioning-element nesting was removed from the spec on 2022-07-01 because no browser had ever implemented it). The spec's own normative rule: *"Each heading following another heading lead in the outline must have a heading level that is less than, equal to, or 1 greater than lead's heading level"* — i.e., you can go from h2 to h1, h2, or h3, but never straight to h4. The spec explicitly permits and shows a valid example of a document containing three `<h1>` elements as separate top-level sections; it only *recommends* ("should," not "must") that at least one heading in the outline be an `h1`.
- **Acceptance criterion:** Automated DOM check: for every page, the heading sequence never decreases-then-increases by more than 1 level per step; exactly one `h1` exists (house rule, stricter than the spec's minimum).
- **Verification method:** axe-core / Lighthouse accessibility audit ("Heading elements are not in a sequentially-descending order" check) or a custom script walking `document.querySelectorAll('h1,h2,h3,h4,h5,h6')` and asserting no level jump > 1.
- **Sources:**
  - Tier 1 (spec rule itself): [WHATWG HTML — Headings and Outlines](https://html.spec.whatwg.org/multipage/sections.html#headings-and-outlines).
  - Tier 1 (outline algorithm removal, corroborating context): [whatwg/html commit 6682bde — "Replace the outline algorithm with one based on heading levels"](https://github.com/whatwg/html/commit/6682bdeee6fb08f5972bea92064fe250f1b4ec9c).
- **Anti-patterns:** multiple `h1`s used as a substitute for proper section headings on marketing pages with several hero-style blocks (permitted by the spec, but breaks the site's own single-H1 house convention and confuses screen-reader navigation in practice); skipping heading levels purely for visual font-size reasons (use CSS, not a lower heading level, to shrink/enlarge text).

### 7. Open Graph protocol — four required properties, structured image sub-properties

- **Rule:** Every publicly shareable page must declare `og:title`, `og:type`, `og:image`, and `og:url` as a minimum; add `og:image:width`, `og:image:height`, and `og:image:alt` whenever an image is declared.
- **Mechanism:** Consuming platforms (Facebook, LinkedIn, Slack, Discord, iMessage, etc.) scrape these `<meta property="og:*">` tags server-side (not client-side JS-rendered) to build the link-preview card; `og:url` is treated as the canonical identity of the object in the social graph, distinct from a page's SEO canonical.
- **Acceptance criterion:** `curl -s <url> | grep -oP '<meta property="og:[a-z:]+" content="[^"]*"'` returns non-empty values for all four required properties; `og:image` resolves to an absolute (not relative) URL over HTTPS.
- **Verification method:** curl-based check above, or Meta's Sharing Debugger / LinkedIn Post Inspector for live-render validation.
- **Source:** [The Open Graph protocol](https://ogp.me/) — Tier 1. Verbatim required-property definitions: *og:title* — "The title of your object as it should appear within the graph"; *og:type* — "The type of your object, e.g., 'video.movie'"; *og:image* — "An image URL which should represent your object within the graph"; *og:url* — "The canonical URL of your object that will be used as its permanent ID." Image sub-properties: *og:image:width* — "The number of pixels wide"; *og:image:height* — "The number of pixels high"; *og:image:alt* — "A description of what is in the image (not a caption)."
- **Anti-patterns:** relative image URLs in `og:image` (many crawlers do not resolve them against the page's base URL); using a JS-rendered-only tag manager to inject OG tags (server-rendering bots for social crawlers frequently don't execute JS — must be present in initial HTML response); omitting `og:image:alt` for accessibility-conscious consuming clients.

### 8. Twitter/X Card markup — still functional, no longer independently validatable

- **Rule:** Implement `twitter:card`, `twitter:title`, `twitter:description`, and `twitter:image` (plus `twitter:site`/`twitter:creator` where a handle exists) as a supplement to Open Graph tags, and treat `summary_large_image` as the default card type for content pages.
- **Mechanism:** When a URL is posted on X, X's crawler fetches the page server-side and parses `twitter:*` meta tags to render an inline preview card; if `twitter:card` is absent, X and other consumers commonly fall back to parsing Open Graph tags instead (Twitter's card spec was designed to be an OG-compatible superset).
- **Current status (must flag in SOP):** The official Twitter/X **Card Validator** at `cards-dev.twitter.com` was deprecated and shut down in 2022 with no first-party replacement tool issued by X. `twitter:*` tags remain functional and are still parsed by the X crawler, but editors have no official way to pre-publish-validate a card; only third-party validators exist.
- **Acceptance criterion:** `curl -s <url> | grep -oP '<meta name="twitter:[a-z:]+" content="[^"]*"'` returns at minimum `twitter:card` and either (a) its own `twitter:title/description/image`, or (b) confirmed fallback to equivalent `og:*` tags.
- **Verification method:** curl check above; manual test-post to X (visible to author only via draft, since no public validator exists) or a third-party card-preview tool as an approximation, clearly documented in the SOP as non-authoritative.
- **Sources:**
  - Tier 1: X's own Card markup reference is cited by name at `https://developer.x.com/en/docs/x-for-websites/cards/overview/markup` — **[fetch blocked in this session: developer.x.com returned HTTP 402 on every attempt, and the X developer community forum thread on validator removal returned HTTP 403; tag names below are corroborated via Tier 2 Next.js documentation (which itself links to this same X doc as its authority) and via Tier 4 practitioner references, not independently confirmed against the live X page in this session]**.
  - Tier 2: [Next.js `generateMetadata` — `twitter` field](https://nextjs.org/docs/app/api-reference/functions/generate-metadata) — confirms exact rendered tag names in its own `<head>` output examples: `twitter:card`, `twitter:site:id`, `twitter:creator`, `twitter:creator:id`, `twitter:title`, `twitter:description`, `twitter:image`, `twitter:image:alt`, and (for `app`-type cards) `twitter:app:name:*` / `twitter:app:id:*` / `twitter:app:url:*`.
  - Tier 4: [thatdevpro — Twitter Card Meta Tags reference](https://www.thatdevpro.com/reference/html-twitter-cards/) — practitioner-compiled type list (`summary`, `summary_large_image`, `player`, `app`) with image size minimums, and the statement that the official validator "shut down... in 2022 with no replacement," consistent with independent WebSearch corroboration of the same fact.
- **Anti-patterns:** relying on Open Graph tags alone and assuming X will render an equivalent card (fallback behavior is undocumented/unguaranteed by a Tier 1 source in this session — implement both explicitly); declaring `summary_large_image` with an image below X's stated minimum (reported informally as 300×157) which silently downgrades the render to `summary` — treat this figure as Tier 4 until confirmed against a live X fetch.

### 9. Image `alt` text — accessibility-first, SEO-secondary

- **Rule:** Write descriptive, specific `alt` text for every content-bearing `<img>`; use `alt=""` (empty, not omitted) for purely decorative images.
- **Mechanism:** Alt text is read aloud by screen readers, displayed when the image fails to load, and used by Google — combined with computer-vision analysis and surrounding page content — to understand and index the image for Google Images; when an image is wrapped in a link with no other link text, the alt text also functions as that link's anchor text.
- **Acceptance criterion:** No content image lacks an `alt` attribute; no `alt` attribute is empty for a non-decorative image; no `alt` text is keyword-stuffed (list of comma-separated keywords rather than a natural description).
- **Verification method:** axe-core/Lighthouse "image-alt" accessibility rule (flags missing alt entirely); manual/automated review flags keyword-stuffed alt text (e.g., regex for >3 comma-separated fragments or repeated substrings).
- **Source:** [Google Images SEO best practices](https://developers.google.com/search/docs/appearance/google-images) — Tier 1. Verbatim: *"The most important attribute when it comes to providing more metadata for an image is the alt text..., which also improves accessibility... Google uses alt text along with computer vision algorithms and the contents of the page to understand the subject matter of the image."* Explicit anti-pattern warning: *"Avoid filling alt attributes with keywords (also known as keyword stuffing) as it results in a negative user experience."* Google's own before/after example: poor = `<img src="puppy.jpg"/>` (no alt); better = `alt="puppy"`; best = `alt="Dalmatian puppy playing fetch"`.
- **Anti-patterns:** `alt="image"`, `alt="photo123.jpg"`, or omitted `alt` entirely; keyword-stuffed alt strings; alt text describing the file rather than the depicted content; missing `alt=""` (empty, explicit) on decorative/spacer images, which forces screen readers to announce the filename instead of silently skipping it.

### 10. Page-level `hreflang` — exact link syntax, bidirectional confirmation, reserved codes

- **Rule:** Every localized page variant must declare a `<link rel="alternate" hreflang="X" href="URL">` tag for itself and every sibling locale, including a self-referencing tag, and — where no single locale should be default — an `x-default` fallback.
- **Mechanism:** `hreflang` link tags must live inside a well-formed `<head>`. Google requires the relationship to be confirmed bidirectionally: *"If page X links to page Y, page Y must link back to page X. If this is not the case for all pages that use hreflang annotations, those annotations may be ignored."* Language/region codes follow ISO 639-1 (language) optionally plus ISO 3166-1 Alpha-2 (region), e.g. `en-GB`, `zh-Hans-US`; a bare region code with no language is invalid, and reserved/ambiguous region codes such as `EU`, `UN`, `UK` are explicitly rejected by Google.
- **Acceptance criterion:** For a set of N localized URLs, each page emits exactly N `hreflang` link tags (including itself) plus, if applicable, one `x-default`; every pairwise link relationship resolves back to its source (A→B implies B→A); no tag uses a region-only or reserved-region code.
- **Verification method:** GSC "International Targeting" report (legacy) or a scripted crawl asserting bidirectional closure across the URL set: `curl -s <url> | grep -oP '(?<=hreflang=")[^"]*(?="[^>]*href="[^"]*)'` per page, diffed against the expected locale set.
- **Source:** [Tell Google about localized versions of your page](https://developers.google.com/search/docs/specialty/international/localized-versions) — Tier 1. Exact syntax: `<link rel="alternate" hreflang="[lang_code]" href="url_of_page" />`; x-default example: `<link rel="alternate" href="https://example.com/country-selector" hreflang="x-default" />`.
- **Anti-patterns:** one-directional hreflang links (annotation silently ignored, not erred); combining `hreflang` with other `rel` attributes like `media` on the same tag; using a bare country code (e.g. `hreflang="uk"`) instead of a language code; forgetting the self-referencing tag on each localized page.

---

## Requirement count and tier split

- **10 requirements documented** across title/rewrite behavior (2), length limits (1), meta description behavior/control (2), headings (1), Open Graph (1), Twitter/X Cards (1), image alt text (1), hreflang (1).
- **Tier 1 primary-source citations directly fetched and quoted:** 8 (Google Search Central × 5 distinct pages, ogp.me, WHATWG spec × 2 references, Google special-tags page).
- **Tier 2:** 1 (Next.js `generateMetadata` reference, fetched in full, used both for Twitter tag-name confirmation and to show how a real framework maps hreflang/OG/Twitter fields to markup).
- **Tier 3:** 2 (Sistrix title-length page fetched directly; Sistrix description-length page and Moz's pixel-width study corroborated only via search snippets — explicitly flagged as unverified-by-direct-fetch in this session, do not cite their exact numbers without a fresh fetch).
- **Tier 4:** 1 (thatdevpro Twitter Card type reference, used only as supporting corroboration for X card types/status, cross-checked against independent WebSearch results before inclusion).
- **Two access failures worth a retry later:** `developer.x.com` (HTTP 402 on all attempts) and `moz.com` (fetch blocked entirely) — the SOP's Twitter/X and Moz-attributed pixel-width claims should be re-verified against these primary pages directly once accessible, rather than treated as fully Tier-1/Tier-3-confirmed.
