# International & Hreflang

**Module:** C1 — International & hreflang
**Prefix:** `INTL`
**Status:** Conditional — invoked per client (`00-index.md` §8)
**Scope:** `hreflang` annotation delivery methods, return-tag reciprocity, `x-default`, ISO/BCP47 code syntax, the hreflang↔canonical interaction, URL-structure options for internationalization, locale detection/auto-redirection, duplicate content across same-language locales, and Google's treatment of machine-translated content.
**Evidence base:** `docs/seo/evidence/sources/conditional/international.md` (research pass, 2026-07-29).

> **Not exercised by CleanStart — verified against primary documentation only.**
>
> **This module has not been through the adversarial verification pass** that the core
> modules (01–11) received. Its rules rest on a single research pass. Adversarial
> verification found defects in roughly one rule in five across the core modules, so
> re-verify every rule here against its cited source before relying on this module for
> a client engagement.

---

## When this module applies

Apply this module the moment a client site serves more than one language or region variant of its content — via ccTLD, subdomain, subdirectory, or (against this module's own advice) a URL parameter. It does not apply to a single-locale site, regardless of how many countries its audience is drawn from: serving one language to a global English-speaking audience is not "international" in this module's sense until a second language or region-specific variant is introduced. `www.cleanstart.com` is single-locale and has no `hreflang` implementation anywhere in its codebase, which is why every rule below carries a `CleanStart: N/A` verdict rather than a conformance finding.

---

## P0 — causes deindexing, traffic loss, or serves the wrong content to crawlers

### INTL-01 — Every page in an hreflang cluster must self-canonicalize in its own language, never point at a different-language "master"

- **Severity:** P0
- **Applies:** Any site with an `hreflang` cluster of two or more languages
- **Rule:** Each localized page's `rel="canonical"` must resolve to a URL in the *same* language as that page — its own URL in the overwhelming majority of setups — never to a different-language "primary" version of the content.
- **Why:** Google's canonicalization guidance is explicit: "make sure to specify a canonical page in the same language, or the best possible substitute language if a canonical page doesn't exist for the same language." A canonical that crosses languages tells Google the localized pages are duplicates of the one "authoritative" language version, which directly contradicts the localization intent of the surrounding `hreflang` cluster and can cause Google to drop localized URLs from the index or serve the wrong-language URL to non-matching searchers — regardless of how correct the `hreflang` annotations sitting next to that canonical are.
- **Acceptance:**
  - For every URL in an hreflang cluster, `<link rel="canonical">` on that URL resolves to that same URL, or at minimum to another URL in the *same* language (e.g., consolidating `en-us`/`en-ca` duplicate-content variants per INTL-14)
  - No canonical target in the cluster differs in language from the page being annotated
- **Verify:** Manual — no automated script exists in this repo; for every URL in an hreflang cluster, parse its `rel="canonical"` target's own hreflang self-declaration and confirm the two languages match.
- **Reference:** None — no reference implementation
- **Source:** [Tier 1] https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls — "If you're using hreflang elements, make sure to specify a canonical page in the same language, or the best possible substitute language if a canonical page doesn't exist for the same language."
- **Tools:** No tool distinguishes "canonical is present" from "canonical is same-language" — a clean Screaming Frog/Ahrefs canonical report can still hide this defect entirely.
- **Anti-patterns:** A CMS or CDN default that stamps every page — including translated ones — with a canonical pointing at the "main" (usually English, `/`-rooted) version of a piece of content, inherited from a generic duplicate-content template never re-audited after i18n was added. This is the single most consequential and most common real-world hreflang defect: it can cause Google to drop the localized URLs from the index entirely.
- **CleanStart:** N/A

---

### INTL-02 — Locale-adaptive pages must expose every locale at a stable, distinct, crawlable URL — never rely on IP/`Accept-Language` detection alone

- **Severity:** P0
- **Applies:** Any site that serves different content at the same URL based on inferred visitor country or language
- **Rule:** If the same URL serves different content based on perceived visitor country/language ("locale-adaptive" behavior), also provide separate, stable per-locale URLs annotated with `hreflang`, rather than relying solely on server-side detection-and-serve logic at a single URL.
- **Why:** Google's own documentation states its crawler's "default IP addresses... appear to be based in the USA" and that "the crawler sends HTTP requests without setting Accept-Language in the request header." A locale-adaptive setup that infers language/region purely from IP or `Accept-Language` will therefore, by default, show Googlebot only the US/no-preference variant — Google states plainly this means "Google might not crawl, index, or rank all your content for different locales." A human auditor browsing from a non-US IP with a normal browser sees fully localized content and can wrongly conclude everything is fine while Googlebot sees only the default variant.
- **Acceptance:**
  - Every locale's content is reachable at a stable, distinct URL that does not require IP geolocation or an `Accept-Language` header to display
  - A crawler with a US IP and no `Accept-Language` header can reach and is served the `de`, `fr`, etc. variants by URL alone
- **Verify:** `curl -s https://example.com/de/ | grep -c 'lang="de"'`
- **Reference:** None — no reference implementation
- **Source:** [Tier 1] https://developers.google.com/search/docs/specialty/international/locale-adaptive-pages — "We recommend using separate locale URL configurations and annotating them with rel=alternate hreflang annotations."
- **Tools:** No tool surveyed simulates non-US-IP/no-`Accept-Language` requests by default; this defect is invisible to a normal crawl run from a single vantage point.
- **Anti-patterns:** A single URL (often the bare root domain) that silently serves different HTML per visitor based on IP/header sniffing with no distinct, linkable URL underneath for each variant — exactly the configuration Google's locale-adaptive-pages documentation exists to warn against, and the configuration most likely to fool a human audit.
- **CleanStart:** N/A

---

## P1 — material organic or AI-visibility impact, no immediate loss

### INTL-03 — HTML `hreflang` `link` elements must render inside a well-formed `<head>`, never combined with an unrelated attribute

- **Severity:** P1
- **Applies:** Sites using the HTML `link`-element delivery method for `hreflang`
- **Rule:** Place every `<link rel="alternate" hreflang="[code]" href="[url]">` inside a well-formed `<head>` element, one `<link>` per language/region variant including the page itself; never combine `hreflang` with another attribute such as `media` on a single `<link>` tag.
- **Why:** Google parses the rendered `<head>`; a tag relocated to `<body>` by a templating or hydration bug is not processed at all. Google's docs warn directly: "don't combine link tags for alternate representations of the document."
- **Acceptance:**
  - Every `<link rel="alternate" hreflang=...>` element resolves inside `<head>` in the browser-rendered DOM, not just server-sent HTML
  - No single `<link>` element carries both `hreflang` and an unrelated attribute like `media`
- **Verify:** `document.head.querySelectorAll('link[hreflang]').length` (browser DevTools console against the live page)
- **Reference:** None — no reference implementation
- **Source:** [Tier 1] https://developers.google.com/search/docs/specialty/international/localized-versions — "The `<link>` tags must be inside a well-formed `<head>` section of the HTML."
- **Tools:** Screaming Frog's hreflang tab reports tag presence but does not distinguish server-rendered from client-relocated placement — verify against server-rendered HTML, not just client DOM state.
- **Anti-patterns:** A hydration or template bug that renders the `hreflang` block after `</head>` closes — a known Next.js/SPA rendering-order failure mode when head tags are injected client-side after initial paint.
- **CleanStart:** N/A

---

### INTL-04 — XML-sitemap-declared hreflang clusters must be self-inclusive and complete for every member

- **Severity:** P1
- **Applies:** Sites using the XML sitemap delivery method for `hreflang`
- **Rule:** For every `<url>` entry using the sitemap method, add one `<xhtml:link rel="alternate" hreflang="[code]" href="[url]">` child per locale variant, including the URL's own locale, with `xmlns:xhtml="http://www.w3.org/1999/xhtml"` declared on `<urlset>` — and the same complete set of children must appear on every one of that cluster's own `<url>` entries.
- **Why:** Google reads sitemap-declared clusters as equivalent to page-level tags, per Google's own worked example requiring self-inclusion. Because the whole cluster lives in one file, drift is easy to introduce (e.g., a draft/unpublished locale variant producing a 404'ing `<xhtml:link>`) and Google's reciprocity check (INTL-05) then silently fails for the whole cluster, not just the broken link.
- **Acceptance:**
  - For every `<loc>` in the sitemap, the number of `<xhtml:link>` children equals the number of locale variants of that page
  - The same set of `<xhtml:link>` children (byte-identical URLs and codes) appears on every member of that cluster's own `<url>` entries
- **Verify:** Manual — no automated script exists in this repo; group the sitemap's `<url>` entries by hreflang cluster and confirm every member lists the same complete, byte-identical set of `<xhtml:link>` children.
- **Reference:** None — no reference implementation
- **Source:** [Tier 1] https://developers.google.com/search/docs/specialty/international/localized-versions
- **Tools:** Not documented as a distinct check by any tool surveyed — sitemap-hreflang cluster completeness is a cross-page consistency property, not a single-page defect a crawl audit surfaces.
- **Anti-patterns:** Letting the sitemap generator run against draft/unpublished locale variants, producing an `<xhtml:link>` entry that 404s.
- **CleanStart:** N/A

---

### INTL-05 — Every hreflang annotation must be bidirectional; a missing return link voids the pair

- **Severity:** P1
- **Applies:** Any site with an `hreflang` cluster of two or more languages
- **Rule:** If page A declares an `hreflang` alternate pointing to page B, page B must declare an `hreflang` alternate pointing back to page A with the correct reciprocal code; partial coverage across a large cluster is tolerated, but every declared relationship must still be reciprocal.
- **Why:** Google states plainly: "If two pages don't both point to each other, the tags will be ignored. This is so that someone on another site can't arbitrarily create a tag naming itself as an alternative version of one of your pages." Google's own troubleshooting text: "If page X links to page Y, page Y must link back to page X." A missing return link causes the annotation *pair* to be ignored, not just the missing direction.
- **Acceptance:** For every `(source URL, hreflang code, target URL)` triple across all delivery methods, a reciprocal triple `(target URL, code-for-source, source URL)` exists.
- **Verify:** Manual — no automated script exists in this repo; for every declared `(source URL, hreflang code, target URL)` triple, confirm the reciprocal `(target URL, code-for-source, source URL)` triple also exists.
- **Reference:** None — no reference implementation
- **Source:** [Tier 1] https://developers.google.com/search/docs/specialty/international/localized-versions — "Missing return links: If page X links to page Y, page Y must link back to page X."
- **Tools:** No tool surveyed flags a broken reciprocal link as a single issue — it only shows up as a cross-page diff, which is why this SOP treats the matrix script as the single highest-value automated check for this module.
- **Anti-patterns:** Partial rollout — adding a new locale to the dominant-language pages' hreflang sets before the new locale's own pages (and their reciprocal tags) exist. Google's own docs tolerate omitting some languages on some pages, but never tolerate a one-way declaration.
- **CleanStart:** N/A

---

### INTL-06 — A locale URL change must update every sibling page's hreflang reference in the same deploy

- **Severity:** P1
- **Applies:** Any site with an `hreflang` cluster undergoing a slug rename, path restructure, or domain migration on any member page
- **Rule:** Any URL-structure change to a localized page must update the `hreflang` reference on every *other* member of its cluster in the same deploy, not only redirect the page that moved.
- **Why:** Reciprocity (INTL-05) is checked per pair; if page B's URL changes and page A's entry for B still points at the old URL, that triple 404s and reciprocity for the pair silently breaks — Google Search Console does not proactively surface this as a "broken hreflang" error.
- **Acceptance:** Post-deploy, the cluster-matrix script re-passes with zero 404s and zero one-way pairs.
- **Verify:** Manual — no automated script exists in this repo; post-deploy, re-run the INTL-05 reciprocity check across the whole affected cluster and confirm zero 404s and zero one-way pairs.
- **Reference:** None — no reference implementation
- **Source:** [Tier 1] https://developers.google.com/search/docs/specialty/international/localized-versions
- **Tools:** No tool surveyed runs this check automatically in CI; it must be wired as a deploy gate for any locale-routing change.
- **Anti-patterns:** Treating a locale-URL rename as a single-page 301 problem without auditing every sibling page's hreflang set that referenced the old URL — the redirect fixes user navigation but leaves sibling annotations stale.
- **CleanStart:** N/A

---

### INTL-07 — `hreflang` values must be language-first with a valid ISO 639-1 code; a bare region code is invalid

- **Severity:** P1
- **Applies:** Any site with declared `hreflang` values
- **Rule:** An `hreflang` value is one ISO 639-1 language code, optionally followed by a hyphen and one ISO 3166-1 Alpha-2 region code (e.g., `de`, `en-GB`); it is never a bare region code.
- **Why:** Google's parser reads the first subtag as language unconditionally and states directly: "You can't specify the country code by itself. The first code stands for the language and Google doesn't automatically derive the language from a country code." Google's own worked failure case: `be` is read as the Belarusian *language* code, not "Belgium" — the intended targeting requires `de-be`, `nl-be`, or `fr-be` instead.
- **Acceptance:**
  - Every `hreflang` value matches `^[a-z]{2}(-[A-Z]{2})?$` (or the ISO-15924 script variant, INTL-11)
  - The first subtag is a valid ISO 639-1 code, never a country code used positionally as if it were a language
- **Verify:** `curl -s https://example.com/sitemap.xml | grep -oE 'hreflang="[^"]+"' | sort -u | grep -vE 'hreflang="[a-z]{2}(-[A-Z]{2})?"'` → empty (checks the syntactic shape only — bare-region-as-language misuse like `be`-for-Belgium is a semantic defect no single command catches; spot-check the resulting code list against ISO 639-1 by hand)
- **Reference:** None — no reference implementation
- **Source:** [Tier 1] https://developers.google.com/search/docs/specialty/international/localized-versions
- **Tools:** Not documented as a distinct check by any tool surveyed — code-validity is a hand-authored-file property, not something an external crawl audit verifies against ISO tables.
- **Anti-patterns:** `hreflang="be"` intending "Belgium" (actually Belarusian language); `hreflang="uk"` intending "United Kingdom" (see INTL-08 for why `UK` is doubly wrong).
- **CleanStart:** N/A

---

### INTL-08 — Only officially assigned ISO 3166-1 Alpha-2 region codes are honored; reserved codes like `EU`, `UN`, `UK` are silently dropped

- **Severity:** P1
- **Applies:** Any site with declared `hreflang` values carrying a region subtag
- **Rule:** Use only currently assigned ISO 3166-1 Alpha-2 region codes; never a colloquial or reserved code such as `EU`, `UN`, or `UK` in the region position.
- **Why:** Google states directly: "If you use codes that are listed as reserved for something else, Google Search ignores that part of the annotation (for example, using EU, UN, or UK in hreflang annotations doesn't have an effect on Google Search)." This is a silent failure mode — no error, warning, or Search Console flag is raised; the annotation is simply degraded to the bare language code, which can then collide with other same-language entries in the cluster's fallback logic.
- **Acceptance:** Every region subtag is cross-checked against a current, maintained ISO 3166-1 Alpha-2 assigned-code list (e.g., the IANA Language Subtag Registry) rather than a hand-maintained array that can drift stale; `UK` fails this check even though it is colloquially universal — the correct code is `GB`.
- **Verify:** `curl -s https://example.com/sitemap.xml | grep -oE 'hreflang="[^"]+"' | sort -u | grep -iE 'hreflang="[a-z]{2}-(EU|UN|UK)"'` → empty
- **Reference:** None — no reference implementation
- **Source:** [Tier 1] https://developers.google.com/search/docs/specialty/international/localized-versions
- **Tools:** Not documented as a distinct check by any tool surveyed — the failure is invisible to tooling by design, which is why this rule exists.
- **Anti-patterns:** `hreflang="en-UK"` — a very common practitioner mistake conflating the informal "UK" abbreviation with the ISO code `GB`; Google silently ignores the region portion, degrading the tag to plain `en`.
- **CleanStart:** N/A

---

### INTL-09 — hreflang-cluster membership is a canonicalization tiebreaker only, never a substitute for an explicit canonical

- **Severity:** P1
- **Applies:** Any site with same-language near-duplicate URLs inside an hreflang cluster
- **Rule:** Do not rely on hreflang-cluster membership alone to establish which URL is canonical among near-duplicate pages within the *same* language — declare an explicit `rel="canonical"` in every case where duplicate-content consolidation is needed, and treat cluster-preference behavior as a fallback tiebreaker only.
- **Why:** Google documents hreflang-cluster preference as one of a short list of *implicit* signals it consults "apart from explicitly provided methods" — i.e., only after explicit signals (canonical tag, sitemap inclusion, redirects) have already been weighed. It is a preference among candidates already competing for canonical status, not a mechanism that assigns canonical status on its own in the presence of an explicit, conflicting `rel="canonical"`.
- **Acceptance:** Every set of same-language duplicate URLs has an explicit `rel="canonical"` declared; hreflang-cluster membership is never the sole documented signal a build relies on for a consolidation decision that matters.
- **Verify:** Manual — no automated script exists in this repo; for every set of same-language near-duplicate URLs, confirm an explicit `rel="canonical"` is declared rather than relying on hreflang-cluster membership alone.
- **Reference:** None — no reference implementation
- **Source:** [Tier 1] https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls — "for canonicalization purposes Google prefers URLs that are part of hreflang clusters," listed under "Other signals," i.e. after explicit signals.
- **Tools:** Not applicable as a tool-scored issue — this is a design-intent rule about not skipping the explicit signal.
- **Anti-patterns:** Assuming that because a page is "in the hreflang cluster," Google will correctly infer canonical status without an explicit tag — this under-specifies what Google actually documents as a tiebreaker, not a primary consolidation mechanism.
- **CleanStart:** N/A

---

### INTL-10 — Same-language, different-region pages with no substantive difference are duplicates and must be consolidated or genuinely differentiated

- **Severity:** P1
- **Applies:** Sites publishing two or more region variants of the same language
- **Rule:** When two or more locale URLs serve the same language with no substantive regional difference (pricing, regulation, terminology, examples), either genuinely differentiate the content per region or consolidate to one canonical URL for that language with `hreflang` pointing region-specific traffic at it.
- **Why:** Google and Bing separately document that localization is a cause of duplicate content, not an exemption from it. Google: "Localized versions of a page are only considered duplicates if the main content of the page remains untranslated" — i.e., the test is about the primary content, not the URL's regional label. Bing's own framing: "Localization creates duplicate content when regional or language pages are nearly identical and do not provide meaningful differences for users in each market."
- **Acceptance:** Any two same-language locale pages either (a) differ in primary content in a way that reflects genuine regional variation (terminology, examples, regulations, product details, pricing/currency), or (b) are consolidated to a single canonical URL for that language with region-specific hreflang variants pointing at it.
- **Verify:** Manual — no automated script exists in this repo; diff the rendered primary-content body (excluding nav/footer/boilerplate) between same-language, different-region page pairs and confirm either genuine regional differentiation or consolidation to one canonical.
- **Reference:** None — no reference implementation
- **Source:** [Tier 1] https://developers.google.com/search/docs/specialty/international/managing-multi-regional-sites; [Tier 1] https://blogs.bing.com/webmaster/December-2025/Does-Duplicate-Content-Hurt-SEO-and-AI-Search-Visibility
- **Tools:** Ahrefs'/Semrush's duplicate-content checks would surface the symptom without diagnosing that region-labeling alone does not exempt the pages.
- **Anti-patterns:** Generating an `en-us`/`en-gb`/`en-au`/`en-ca`/`en-ie` page for every English-speaking market by templating identical body copy with only currency symbols swapped, marketed internally as "full regional coverage."
- **CleanStart:** N/A

---

### INTL-11 — Locale-adaptive robots directives must be identical across every locale variant of a shared URL

- **Severity:** P1
- **Applies:** Sites serving locale-adaptive content at a shared URL (see INTL-02)
- **Rule:** When a site does serve locale-adaptive content, the `robots` meta tag and matching `robots.txt` rules must specify identical crawl/index permissions across every locale's variant of the same URL — never allow one locale's rendering to be indexable while another locale's rendering of the same URL is blocked.
- **Why:** Google states this as a direct consistency requirement, because Googlebot may see only one locale's rendering of a shared URL (per INTL-02's IP/header limitation) — an inconsistent robots directive between locales risks the crawler applying the wrong permission set to content it never actually saw the alternate version of.
- **Acceptance:** For any URL that serves locale-adaptive content, the `X-Robots-Tag`/`<meta name="robots">` value and the matching robots.txt path rule are identical regardless of which locale variant happens to be served to the fetching client.
- **Verify:** `curl -sI -H "Accept-Language: de" https://example.com/ | grep -i x-robots-tag`
- **Reference:** None — no reference implementation
- **Source:** [Tier 1] https://developers.google.com/search/docs/specialty/international/locale-adaptive-pages
- **Tools:** Not applicable — no tool surveyed diffs robots directives across simulated locale conditions on the same URL.
- **Anti-patterns:** A regional legal/compliance requirement (e.g., a `noindex` mandated for one jurisdiction only) implemented as a per-locale robots override on a shared URL — Google's documented-safe path is to move that jurisdiction's content to its own distinct URL instead.
- **CleanStart:** N/A

---

## P2 — meaningful improvement, non-urgent

### INTL-12 — Implement `hreflang` via exactly one delivery method site-wide

- **Severity:** P2
- **Applies:** Any site with an `hreflang` implementation
- **Rule:** Implement `hreflang` via exactly one of the three delivery methods (HTML `link`, HTTP header, or XML sitemap) site-wide; never run more than one simultaneously.
- **Why:** Google states the three methods "are equivalent from Google's perspective... While you can use all three methods at the same time, there's no benefit in Search (in fact, it may be much harder to manage three implementations instead of just picking one)." Running multiple methods creates no additional signal, only additional surfaces that can silently drift out of sync (e.g., the sitemap lists a locale the HTML `link` set omits).
- **Acceptance:** Exactly one delivery mechanism is present for a given URL set — never two or three in parallel.
- **Verify:** `curl -s https://example.com/en/ | grep -c 'hreflang='`
- **Reference:** None — no reference implementation
- **Source:** [Tier 1] https://developers.google.com/search/docs/specialty/international/localized-versions
- **Tools:** Not applicable — no tool scores "which delivery method" as an issue, only whether a given method's tags are individually well-formed.
- **Anti-patterns:** Adding HTML `link` tags "for safety" on top of an already-implemented sitemap-based scheme — the most common way the two mechanisms drift out of agreement over time.
- **CleanStart:** N/A

---

### INTL-13 — Use the HTTP `Link:` header method only for non-HTML resources, and keep it byte-identical across every variant

- **Severity:** P2
- **Applies:** Sites publishing non-HTML resources (PDFs, etc.) in multiple locales
- **Rule:** For non-HTML files where `<head>` injection is impossible, return a `Link:` response header listing every locale variant: `Link: <url1>; rel="alternate"; hreflang="[code1]", <url2>; rel="alternate"; hreflang="[code2]", ...` — identical across every locale variant of the same document.
- **Why:** Google's docs state this method is "useful for non-HTML files (like PDFs)" and require: "The Link: header returned for every version of a page is identical."
- **Acceptance:** The `Link:` header is byte-identical across every locale variant of the same document, each URL wrapped in angle brackets.
- **Verify:** `curl -sI https://example.com/file.pdf | grep -i '^link:'`
- **Reference:** None — no reference implementation
- **Source:** [Tier 1] https://developers.google.com/search/docs/specialty/international/localized-versions
- **Tools:** Not applicable — no tool surveyed diffs `Link:` headers across a document's locale variants.
- **Anti-patterns:** Implementing this only on the "primary" language PDF and omitting the header on translated variants — reciprocity (INTL-05) applies to headers exactly as it does to HTML `link` tags.
- **CleanStart:** N/A

---

### INTL-14 — Declare `x-default` as the unmatched-locale fallback, not as a duplicate of one specific locale

- **Severity:** P2
- **Applies:** Any site with an `hreflang` cluster, especially one with a language/country selector or an auto-redirecting home page
- **Rule:** Include one `hreflang="x-default"` entry per cluster pointing at either a neutral language/country selector page or a deliberately chosen fallback, used only for visitors whose browser locale matches none of the declared variants.
- **Why:** Google: "The reserved x-default value is used when no other language/region matches the user's browser setting... it was designed for language selector pages... There's no need to specify a language code for the x-default value... the language of the page is irrelevant." Google's recommended fix for an auto-redirecting home page with no annotated path to localized content is specifically to add this fallback.
- **Acceptance:** Exactly one `x-default` entry per hreflang cluster; the `href` resolves to a real, indexable, 200-status page.
- **Verify:** `curl -s https://example.com/ | grep -o 'hreflang="x-default"'`
- **Reference:** None — no reference implementation
- **Source:** [Tier 1] https://developers.google.com/search/docs/specialty/international/localized-versions
- **Tools:** Not applicable — no tool surveyed scores `x-default` presence/absence as a distinct issue.
- **Anti-patterns:** Omitting `x-default` entirely on an auto-redirecting root/home page — Google gives no annotated path to the localized content underneath for unmatched visitors.
- **CleanStart:** N/A

---

### INTL-15 — Choose ccTLD, gTLD-subdomain, or gTLD-subdirectory for locale URLs; never a bare query parameter

- **Severity:** P2
- **Applies:** Any site build establishing a new international URL structure
- **Rule:** Structure locale/region-specific URLs as one of: a country-code top-level domain, a subdomain of a generic TLD, or a subdirectory of a generic TLD; do not use a URL query parameter as the geotargeting mechanism.
- **Why:** Google documents named trade-offs for each recommended structure (ccTLD: strongest signal, highest cost; subdomain: server-location flexibility; subdirectory: lowest maintenance) and does not recommend a query-parameter scheme for geotargeting at all — every reciprocity- and canonical-matching check in this module assumes locale is expressed structurally in the path or host, and a parameter-only scheme fights that assumption at every layer.
- **Acceptance:** The site's locale URLs match one of the three recommended structural patterns; no locale/region selection is carried solely in a query string with no corresponding path or host difference.
- **Verify:** `curl -s https://example.com/ | grep -o 'href="[^"]*"' | head -5`
- **Reference:** None — no reference implementation
- **Source:** [Tier 1] https://developers.google.com/search/docs/specialty/international/managing-multi-regional-sites
- **Tools:** Not applicable — this is a one-time architectural decision, not a per-page defect a crawl audit detects.
- **Anti-patterns:** Choosing a query-parameter scheme because it's cheapest to implement in an existing single-locale codebase, then discovering the resulting URLs are difficult to keep separate from unlocalized duplicates in analytics, sitemaps, and hreflang tooling.
- **CleanStart:** N/A

---

### INTL-16 — Provide a bare-language catch-all wherever two or more region variants of the same language exist

- **Severity:** P2
- **Applies:** Any hreflang cluster containing two or more region-qualified variants of the same base language
- **Rule:** When multiple region-specific variants of one language exist (`en-ie`, `en-ca`, `en-au`), also provide (or designate one variant as) a bare-language catch-all (`en`) for searchers whose specific region isn't covered.
- **Why:** Google: "If you have several alternate URLs targeted at users with the same language but in different locales, it's a good idea to also provide a catchall URL for geographically unspecified users of that language... It can be one of the specific pages, if you choose."
- **Acceptance:** Every hreflang cluster containing ≥2 region-qualified entries of the same base language also contains one bare-language entry in that same cluster.
- **Verify:** Manual — no automated script exists in this repo; for every hreflang cluster with ≥2 region-qualified variants of the same base language, confirm a bare-language entry also exists in that cluster.
- **Reference:** None — no reference implementation
- **Source:** [Tier 1] https://developers.google.com/search/docs/specialty/international/localized-versions
- **Tools:** Not applicable — no tool surveyed checks for a missing bare-language fallback in a cluster.
- **Anti-patterns:** Building region variants for every market that has one but omitting a bare `en` fallback, leaving US/UK/unlisted-region searchers with no explicitly matched variant.
- **CleanStart:** N/A

---

### INTL-17 — Do not treat machine-translated content as inherently spam; evaluate it by the scaled-content-abuse value test

- **Severity:** P2
- **Applies:** Any site publishing machine-translated locale content
- **Rule:** Do not treat "this content was machine-translated" as itself a policy violation or an automatic quality signal; evaluate translated pages against the same scaled-content-abuse test Google applies to any automated content — whether the output provides genuine value to users, independent of production method.
- **Why:** Google's spam policy names translation only as one example within a broader "automated transformations" category that becomes a violation specifically "where little value is provided to users" — the violation condition is the value/quality outcome, not the use of translation technology per se.
- **Acceptance:** A machine-translated page is evaluated for whether it provides substantive, non-boilerplate value in the target language — not flagged or suppressed merely because its origin was an automated translation pipeline.
- **Verify:** `grep -rni "block.*translat" apps/web/src/lib/seo/robots.ts`
- **Reference:** None — no reference implementation
- **Source:** [Tier 1] https://developers.google.com/search/docs/essentials/spam-policies — "Scraping feeds, search results, or other content to generate many pages (including through automated transformations like synonymizing, translating, or other obfuscation techniques), where little value is provided to users."
- **Tools:** Not applicable — this is a content-policy judgment, not a tool-scored defect.
- **Anti-patterns:** Retaining a legacy robots.txt rule or CMS convention that blanket-blocks or `noindex`es every machine-translated locale variant on the theory that "Google penalizes auto-translated content" — see INTL-19 for the dated correction of this exact guidance.
- **CleanStart:** N/A

---

## P3 — hygiene, marginal or speculative gain

### INTL-18 — Frame `hreflang` strictly as a routing/serving signal — never as a ranking factor or a consolidation mechanism

- **Severity:** P3
- **Applies:** Always, wherever this module is consulted
- **Rule:** Do not state or imply that `hreflang` affects a page's ranking, and do not describe `hreflang` as "consolidating" signals the way `rel="canonical"` consolidates duplicate-URL signals. Frame it exclusively as a *routing* signal — which URL variant Google serves to which searcher — and, per INTL-09, secondarily as a canonicalization tiebreaker.
- **Why:** No Tier 1 Google document reviewed for this module (localized-versions, managing-multi-regional-sites, consolidate-duplicate-urls, locale-adaptive-pages) makes any ranking claim about `hreflang`; Google's framing is consistently about which URL variant is served to which searcher, not about rank. Google's documentation also draws the opposite distinction from "consolidation": canonical merges signals onto one URL, while hreflang's entire job is to keep locale variants *separately servable* to their respective audiences.
- **Acceptance:** No internal deliverable, audit, or client-facing document states or implies `hreflang` improves ranking or merges ranking signals across locale variants.
- **Verify:** `grep -rni "hreflang.*rank" docs/seo/`
- **Reference:** None — no reference implementation
- **Source:** [Tier 1] https://developers.google.com/search/docs/specialty/international/localized-versions; https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls — absence of any ranking claim across both pages, confirmed by direct review.
- **Tools:** Not applicable — no tool scores documentation framing.
- **Anti-patterns:** Pitching an hreflang implementation to a client as a ranking-boosting exercise rather than a serving/routing correctness exercise.
- **CleanStart:** N/A

---

### INTL-19 — Do not carry forward the retired guidance to block all machine-translated pages via robots.txt

- **Severity:** P3
- **Applies:** Always, wherever this module is consulted
- **Rule:** Do not author or retain a robots.txt rule whose stated purpose is "block auto-translated content" as a category. Google's own multi-regional documentation carried this recommendation until it was removed on 2025-06-11.
- **Why:** Google's changelog entry for the removal states plainly this was a "docs-only change, no change in behavior" — meaning the underlying system's treatment of auto-translated content had already shifted under the March 2024 scaled-content-abuse policy (which evaluates by value, not method) well before the documentation caught up. Any pre-2025 practitioner content or legacy internal SOP saying "block/noindex all machine-translated pages" cites guidance Google has since retired in its own canonical documentation, not a mere fashion shift.
- **Acceptance:** No robots.txt rule or CMS convention exists whose sole documented purpose is blocking a machine-translated locale pattern as a category.
- **Verify:** `grep -i "translat" apps/web/src/lib/seo/robots.ts`
- **Reference:** None — no reference implementation
- **Source:** [Tier 1] https://developers.google.com/search/updates (changelog entry dated 2025-06-11, "Spring cleaning in our multilingual documentation")
- **Tools:** Not applicable — no tool scores documentation currency.
- **Anti-patterns:** Copying a "block machine-translated pages" checklist item forward from a pre-2025 internal SOP or a stale agency template without checking whether the underlying guidance was retired.
- **CleanStart:** N/A

---

### INTL-20 — Script subtags (ISO 15924) are optional; document the choice consistently for multi-script languages

- **Severity:** P3
- **Applies:** Sites publishing content in a multi-script language (notably Chinese)
- **Rule:** For languages with multiple scripts, either rely on Google's region-based script inference (`zh-TW` → Traditional) or specify the script explicitly with an ISO 15924 subtag (`zh-Hant`, `zh-Hans`) — not a mix that leaves it ambiguous which convention the cluster follows.
- **Why:** Google: "For language script variations, the proper script is derived from the country. For example, when using zh-TW for users in Taiwan, the language script is automatically derived... You can also specify the script itself explicitly using ISO 15924."
- **Acceptance:** A `zh-*` hreflang cluster either uses region-only codes with the derivation left implicit and documented as intentional, or uses explicit `zh-Hant`/`zh-Hans` script subtags — not a mix.
- **Verify:** `grep -o 'hreflang="zh[^"]*"' <(curl -s https://example.com/)`
- **Reference:** None — no reference implementation
- **Source:** [Tier 1] https://developers.google.com/search/docs/specialty/international/localized-versions
- **Tools:** Not applicable — this is a design-consistency rule, not a binary pass/fail against a live resource.
- **Anti-patterns:** Assuming `zh-CN` and `zh-Hans` are redundant/interchangeable and mixing both conventions within the same site without reconciling which pages map to which.
- **CleanStart:** N/A

---

### INTL-21 — Do not use UN M.49 numeric region codes (e.g. `es-419`) in `hreflang` even though they are valid BCP 47

- **Severity:** P3
- **Applies:** Any site with declared `hreflang` values, particularly Spanish-language clusters
- **Rule:** Do not use UN M.49 numeric-region codes or other non-ISO-3166-1-Alpha-2 region identifiers (e.g., `es-419` for "Latin American Spanish") in `hreflang`, even though such codes are valid and meaningful under BCP 47/UN M.49 more broadly.
- **Why:** Google states directly: "Only language codes listed in ISO 639-1 and region codes listed in ISO 3166-1 Alpha 2 are supported; other codes that aren't listed in those standards, such as es-419, aren't supported." This is narrower than BCP 47/RFC 5646 permits generally, which explicitly allows three-digit UN M.49 numeric region subtags.
- **Acceptance:** No `hreflang` value uses a three-digit numeric region subtag; region subtags are two-letter ISO 3166-1 Alpha-2 only.
- **Verify:** `curl -s https://example.com/sitemap.xml | grep -oE 'hreflang="[^"]+"' | grep -E 'hreflang="[a-z]{2}-[0-9]{3}"'` → empty
- **Reference:** None — no reference implementation
- **Source:** [Tier 1] https://developers.google.com/search/docs/specialty/international/localized-versions
- **Tools:** Not applicable — no tool surveyed validates hreflang codes against the ISO-only restriction.
- **Anti-patterns:** Copying an `es-419`-style locale identifier directly from a CMS's or translation vendor's locale taxonomy into `hreflang` output without translating it to a Google-supported representation.
- **CleanStart:** N/A

---

### INTL-22 — Treat `hreflang` values as case-insensitive when validating; do not "fix" a technically-valid tag for casing alone

- **Severity:** P3
- **Applies:** Any validation tooling or CMS import pipeline that produces `hreflang` values
- **Rule:** Treat `hreflang` values as case-insensitive when validating or deduplicating; do not reject a technically-valid tag purely because it doesn't match the lowercase-language/uppercase-region display convention.
- **Why:** RFC 5646 §2.1.1: "At all times, language tags and their subtags... are to be treated as case insensitive: there exist conventions for the capitalization of some of the subtags, but these MUST NOT be taken to carry meaning." Google's own examples consistently render `en-GB`/`de-CH` in that display convention, but it is documented display style, not a matching requirement.
- **Acceptance:** A validation script lowercases both sides before comparing/deduplicating values (so `EN-gb` and `en-GB` are recognized as the same tag), while still emitting the conventional casing in generated markup.
- **Verify:** Manual — no automated script exists in this repo; read the hreflang-generating/validating code path and confirm it lowercases both sides before comparing or deduplicating values, while still emitting the conventional display casing in generated markup.
- **Reference:** None — no reference implementation
- **Source:** [Tier 1] https://www.rfc-editor.org/rfc/rfc5646.txt §2.1.1
- **Tools:** Not applicable — no tool surveyed scores hreflang casing consistency.
- **Anti-patterns:** A CMS import script that treats casing differences as distinct locale identifiers, producing duplicate-looking-different cluster entries (`en-gb` and `en-GB`) that are functionally identical to the consuming search engine but corrupt an exact-string reciprocity check that isn't case-normalized first.
- **CleanStart:** N/A
