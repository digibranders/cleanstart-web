# International SEO & hreflang (C1) — Evidence-Graded SOP Source Research

Research date: 2026-07-29. Scope: `hreflang` annotation delivery methods, return-tag reciprocity, `x-default`, ISO/BCP47 code syntax, the hreflang↔canonical interaction, URL-structure options for internationalization, locale detection/auto-redirection, duplicate content across same-language locales, and Google's treatment of machine-translated content — for the CleanStart website-build SOP's conditional module **C1 — International & hreflang**.

> **Not exercised by CleanStart.** `www.cleanstart.com` is a single-locale English site with no ccTLD, subdomain, or subdirectory internationalization and no `hreflang` annotations anywhere in the live codebase. The only `hreflang` reference in `apps/web/src` is a code comment in `apps/web/src/lib/seo/cms-seo.ts` explicitly noting that "robots-advanced / hreflang / custom tags need the web-side composition libraries (`composeRobotsMeta` / `composeHreflangCluster` / `composeCustomTags`) which do not exist in apps/web yet," tracked as a follow-up in `docs/web/SEO-IMPLEMENTATION-PLAN.md` (Task 0.5) — confirming, rather than contradicting, that hreflang is unimplemented today. Every rule below rests on primary-source documentation alone, with no CleanStart implementation to validate against, and no CleanStart live-traffic evidence to corroborate or refute a vendor claim. Treat this module as documentation-verified, not battle-tested, and re-verify against the cited source before relying on any rule in a client build.

## Source discipline used throughout this document

- **Tier 1** — Google Search Central's own documentation, ISO standards (iso.org), IETF BCP 47 / RFC 5646, Bing Webmaster's own documentation.
- **Tier 2** — First-party platform docs one layer removed from core policy (Next.js i18n routing docs).
- **Tier 3** — Named, dated empirical study with disclosed methodology.
- **Tier 4** — Practitioner consensus, agency blogs, aggregator glossaries with no disclosed methodology → labeled **`Convention — not vendor-confirmed`**.

Every requirement states its tier explicitly. Where a claim is repeated everywhere in the SEO blog ecosystem but traces to no Tier 1/2 source, it is labeled `Convention — not vendor-confirmed` rather than dropped, or flagged outright as unsupported in §9.

---

## 1. The three `hreflang` delivery methods

**Source:** https://developers.google.com/search/docs/specialty/international/localized-versions — **Tier 1**. Page states (verbatim): *"There are three ways to indicate multiple language/locale versions of a page to Google"* — HTML `link` elements, an HTTP header, or an XML sitemap — and *"The three methods are equivalent from Google's perspective and you can choose the method that's the most convenient for your site. While you can use all three methods at the same time, there's no benefit in Search (in fact, it may be much harder to manage three implementations instead of just picking one)."*

### 1.1 — Pick exactly one delivery method per site

- **Rule:** Implement `hreflang` via exactly one of the three methods (HTML `link`, HTTP header, or XML sitemap) site-wide; never run more than one simultaneously.
- **Mechanism:** Google's crawler treats all three as equivalent inputs to the same canonicalization/localization signal set; running multiple methods creates no additional signal, only additional surfaces that can silently drift out of sync with each other (e.g., the sitemap says `de-ch` exists but the HTML `link` set on the live page omits it).
- **Acceptance criterion:** Exactly one delivery mechanism is present for a given URL set — either `<link rel="alternate" hreflang="...">` tags in `<head>`, or a `Link:` HTTP response header, or `<xhtml:link>` entries in the XML sitemap — never two or three in parallel for the same URL set.
- **Verification:** `curl -sI https://example.com/en/` and check for a `Link:` header containing `hreflang`; separately `curl -s https://example.com/en/ | grep -o '<link[^>]*hreflang[^>]*>'`; separately fetch the sitemap and grep for `xhtml:link`. Exactly one of the three should return results for the same URL.
- **Anti-pattern:** Adding HTML `link` tags "for safety" on top of an already-implemented sitemap-based scheme — this is explicitly called out by Google's own docs as making management harder for no Search benefit, and is the most common way the two mechanisms drift out of agreement with each other over time.

### 1.2 — HTML `link` method: use when the site controls page `<head>` output and is entirely HTML

- **Rule:** Use `<link rel="alternate" hreflang="[lang_code]" href="[url]">` inside a well-formed `<head>` element, one `<link>` per language/region variant including the page itself, identical set repeated on every variant page.
- **Mechanism:** Google parses the rendered `<head>`; a `hreflang` `link` tag placed outside `<head>` (e.g., inside `<body>` due to a templating bug) is not processed. Google's docs explicitly warn: *"The `<link>` tags must be inside a well-formed `<head>` section of the HTML... don't combine `link` tags for alternate representations of the document; for example don't combine `hreflang` annotations with other attributes such as `media` in a single `<link>` tag."*
- **Acceptance criterion:** Every `<link rel="alternate" hreflang=...>` element resolves inside `<head>` in the browser-rendered DOM (not just server-sent HTML, if client-side rendering can relocate it); no single `<link>` element carries both `hreflang` and an unrelated attribute like `media`.
- **Verification:** Paste the browser-rendered HTML into an HTML validator, or run `document.head.querySelectorAll('link[hreflang]').length` in DevTools against the live page and confirm the count equals the number of locale variants (including self).
- **Anti-pattern:** A hydration or template bug that renders the `hreflang` block after `</head>` closes — this is a known Next.js/SPA rendering-order failure mode when `<head>` tags are injected client-side after initial paint; verify against server-rendered HTML, not just client DOM state.

### 1.3 — HTTP header method: use for non-HTML resources (PDFs etc.)

- **Rule:** For non-HTML files (PDFs, and any resource where `<head>` injection is impossible), return a `Link:` response header on the GET response listing every locale variant, syntax: `Link: <url1>; rel="alternate"; hreflang="[code1]", <url2>; rel="alternate"; hreflang="[code2]", ...`.
- **Mechanism:** Google's docs state this method is *"useful for non-HTML files (like PDFs)"* — there is no `<head>` to inject a `<link>` element into for a binary file, so the annotation must travel in the transport layer instead.
- **Acceptance criterion:** The `Link:` header returned is byte-identical across every locale variant of the same document (per Google: *"The `Link:` header returned for every version of a page is identical"*), each URL wrapped in angle brackets.
- **Verification:** `curl -sI https://example.com/file.pdf | grep -i '^link:'` on every locale variant URL of the same document; diff the outputs — they must match exactly (aside from which variant is "the current one" being irrelevant, since the full set is repeated on every URL).
- **Anti-pattern:** Implementing this only on the "primary" language PDF and omitting the header on translated variants — reciprocity (§2) applies to headers exactly as it does to HTML `link` tags.

### 1.4 — XML sitemap method: use when centralized, bulk configuration is preferred over per-page markup

- **Rule:** Add `<xhtml:link rel="alternate" hreflang="[code]" href="[url]">` child elements to every `<url>` entry in the sitemap, one child per locale variant including the URL's own locale, with the `xmlns:xhtml="http://www.w3.org/1999/xhtml"` namespace declared on `<urlset>`.
- **Mechanism:** Google reads sitemap-declared `hreflang` clusters as an equivalent signal to page-level tags; because the whole cluster lives in one file, this method is the easiest to audit programmatically (a single sitemap diff catches drift) but the easiest to let silently rot if the sitemap generator isn't wired to every new page/locale combination the CMS produces.
- **Acceptance criterion:** For every `<loc>` in the sitemap, the number of `<xhtml:link>` children equals the number of locale variants of that page, and — critically — the same set of `<xhtml:link>` children (byte-identical URLs and codes) appears on every one of that cluster's own `<url>` entries in the sitemap (self-inclusive, per Google's own worked example).
- **Verification:** A script (not a manual spot-check) that parses the sitemap XML, groups `<url>` entries by hreflang cluster, and asserts every member of a cluster lists every other member plus itself — e.g. `node scripts/seo-sop/check-hreflang-matrix.mjs`.
- **Anti-pattern:** Letting the sitemap generator run against draft/unpublished locale variants, producing an `<xhtml:link>` entry that 404s — Google's reciprocity check (§2) will then also silently fail for the whole cluster, not just the broken link.

---

## 2. Return-tag reciprocity

**Source:** https://developers.google.com/search/docs/specialty/international/localized-versions — **Tier 1**. Verbatim: *"If two pages don't both point to each other, the tags will be ignored. This is so that someone on another site can't arbitrarily create a tag naming itself as an alternative version of one of your pages."* And under Troubleshooting: *"Missing return links: If page X links to page Y, page Y must link back to page X. If this is not the case for all pages that use `hreflang` annotations, those annotations may be ignored or not interpreted correctly."*

### 2.1 — Every hreflang annotation must be bidirectional

- **Rule:** If page A declares an `hreflang` alternate pointing to page B, page B must declare an `hreflang` alternate pointing back to page A, using the correct reciprocal language/region code.
- **Mechanism:** This is a stated anti-spoofing measure — Google will not accept a one-way claim of equivalence because it would let any third-party site declare itself an "alternate version" of a page it doesn't own. Google's parser checks for the return link before trusting the relationship; a missing return link causes the annotation *pair* to be ignored, not just the missing direction.
- **Acceptance criterion:** For every `(source URL, hreflang code, target URL)` triple across all three delivery methods, there exists a reciprocal triple `(target URL, code-for-source, source URL)`.
- **Verification:** The same cluster-matrix script as §1.4's item — this is the single highest-value automated check for the whole domain, since a broken reciprocal link is invisible in a single-page view and only shows up as a cross-page diff.
- **Anti-pattern (the most common real-world failure):** Partial rollout — a new locale is added to the primary/dominant-language pages' hreflang sets before the new locale's own pages have been built or before their own reciprocal tags are deployed. Google's own docs directly address the acceptable degraded mode here: *"If it becomes difficult to maintain a complete set of bidirectional links for every language, you can omit some languages on some pages; Google will still process the ones that point to each other. However, it is important to link newly expanded language pages bidirectionally to the originating/dominant language(s)."* — i.e., partial coverage is tolerated, but it must still be reciprocal wherever it exists; a one-way declaration is never valid, partial or not.

### 2.2 — A CMS or ETL migration that changes locale URLs without updating both sides breaks the whole cluster silently

- **Rule:** Any URL-structure change to a localized page (slug rename, path restructure, domain migration) must update the `hreflang` reference on every *other* member of its cluster in the same deploy, not just on the page that moved.
- **Mechanism:** Reciprocity is checked per pair; if page B's URL changes and page A's `hreflang` entry for B is not updated to the new URL, the old triple `(A, code-B, old-B-url)` becomes a 404 and (depending on whether B still points back to the old URL or now points to nothing) reciprocity for that pair breaks with no error surfaced anywhere in the UI — this is a silent data-quality defect, not a crawl error Google Search Console will proactively flag as "broken."
- **Acceptance criterion:** Post-deploy, the cluster-matrix script (§1.4/§2.1) re-passes with zero 404s and zero one-way pairs.
- **Verification:** Run the matrix script in CI on every deploy that touches localized-page routing, not just ad hoc.
- **Anti-pattern:** Treating a locale-URL rename as a single-page redirect problem (301 the old URL) without auditing every sibling page's `hreflang` set that referenced the old URL — the redirect fixes user navigation but does nothing to fix the now-stale annotation on sibling pages.

---

## 3. `x-default`

**Source:** https://developers.google.com/search/docs/specialty/international/localized-versions — **Tier 1**. Verbatim: *"The reserved `x-default` value is used when no other language/region matches the user's browser setting."* ... *"While you can use the `x-default` value for any page, it was designed for language selector pages and so it will work best with those."* ... *"There's no need to specify a language code for the `x-default` value; the page is targeted to users whose language settings are unmatched on your site, thus the language of the page is irrelevant."*

### 3.1 — Declare `x-default` as the unmatched-locale fallback, not as a duplicate of one specific locale

- **Rule:** Include one `hreflang="x-default"` entry per cluster pointing at either a neutral language/country selector page or a deliberately chosen fallback (which may be one of the specific locale pages), used only for visitors whose browser locale matches none of the declared variants.
- **Mechanism:** `x-default` is not a language code and is not matched against ISO 639-1/3166-1 — it's a reserved sentinel Google's matching logic falls back to only after failing to match every real code in the cluster. Google states plainly it was purpose-designed for selector/gateway pages, though any URL is syntactically legal there.
- **Acceptance criterion:** Exactly one `x-default` entry per hreflang cluster; the `href` resolves to a real, indexable, 200-status page.
- **Verification:** `curl -s https://example.com/ | grep 'hreflang="x-default"'`, then `curl -o /dev/null -s -w "%{http_code}" [the x-default href]` → `200`.
- **Anti-pattern:** Omitting `x-default` entirely on an auto-redirecting root/home page — Google's own recommended fix for exactly this scenario is to add the `x-default` fallback: *"Consider adding a fallback page for unmatched languages, especially on language/country selectors or auto-redirecting home pages."* A root domain that JS-redirects based on browser locale, with no `x-default` and no hreflang cluster at all, gives Google no annotated path to the localized content underneath.

---

## 4. Language/region code syntax (ISO 639-1, ISO 3166-1 Alpha-2, BCP 47) and common errors

**Sources:**
- https://developers.google.com/search/docs/specialty/international/localized-versions — **Tier 1** (Google's specific consumption rules).
- https://www.rfc-editor.org/rfc/rfc5646.txt (BCP 47) — **Tier 1** (IETF, the general language-tag standard `hreflang` syntax derives from).
- https://www.iso.org/iso-639-language-code — **Tier 1** (ISO 639 home page; direct fetch returned HTTP 403 to the automated fetcher used for this research — bot-blocked, not unavailable; URL confirmed live via search index).
- https://www.iso.org/iso-3166-country-codes.html — **Tier 1** (ISO 3166 home page; same 403-to-fetcher caveat).

### 4.1 — Syntax is language-first, region-second, separated by a hyphen; region alone is invalid

- **Rule:** An `hreflang` value is one ISO 639-1 language code, optionally followed by a hyphen and one ISO 3166-1 Alpha-2 region code (e.g., `de`, `en-GB`); it is never a bare region code.
- **Mechanism:** Google's parser reads the first subtag as language unconditionally. Google's own worked example: *"To simplify your labeling, you can specify a language code by itself... `de`: German language content, independent of region... `en-GB`: English language content, for users in the UK."* And the explicit warning: *"You can't specify the country code by itself. The first code stands for the language and Google doesn't automatically derive the language from a country code."* Their worked failure case: `be` is read as the Belarusian *language* code, not "Belgium" — the intended targeting (German/Dutch/French speakers in Belgium) requires `de-be`, `nl-be`, or `fr-be` instead.
- **Acceptance criterion:** Every `hreflang` value matches `^[a-z]{2}(-[A-Z]{2})?$` (or the ISO-15924 script variant in §4.3), and the first subtag is a valid ISO 639-1 code, never a country code used positionally as if it were a language.
- **Verification:** A regex + code-list validation script run over every declared `hreflang` value in the sitemap/HTML/headers: reject any value whose first subtag isn't in the ISO 639-1 list, and flag (don't silently pass) any value whose first subtag happens to also be a valid ISO 3166-1 code that a human might have confused for a country (a heuristic warning, not a hard rule, since some two-letter strings are legal in both lists with different meanings).
- **Anti-pattern:** `hreflang="be"` intending "Belgium" (actually Belarusian language); `hreflang="uk"` intending "United Kingdom" (actually the reserved/unassigned code Google explicitly ignores — see §4.2 — the correct value is `en-GB` or `gb` is not valid either, since `GB` is the correct ISO 3166-1 code but it must follow a language subtag, e.g. `en-GB`).

### 4.2 — Only officially assigned ISO 3166-1 Alpha-2 codes are honored; reserved/informal codes are silently dropped, not erred

- **Rule:** Use only currently assigned ISO 3166-1 Alpha-2 region codes; never a colloquial or reserved code such as `EU`, `UN`, or `UK` in the region position.
- **Mechanism:** Google's docs state directly: *"Make sure you're using officially assigned code elements for the regions you're trying to identify (in ISO 3166-1 Alpha 2 format). If you use codes that are listed as reserved for something else, Google Search ignores that part of the annotation (for example, using `EU`, `UN`, or `UK` in `hreflang` annotations doesn't have an effect on Google Search)."` This is a silent failure mode — there is no error, warning, or Search Console flag; the annotation is simply not honored.
- **Acceptance criterion:** Every region subtag is cross-checked against the current ISO 3166-1 Alpha-2 assigned-code list (not a hardcoded list frozen at implementation time, since ISO periodically assigns new codes) — `UK` fails this check even though it is colloquially universal; the correct code for the United Kingdom is `GB`.
- **Verification:** Validate region subtags against a maintained ISO 3166-1 Alpha-2 list (e.g., the IANA Language Subtag Registry, which mirrors ISO 3166-1 assignments and is machine-readable) rather than a hand-maintained array that can drift stale.
- **Anti-pattern:** `hreflang="en-UK"` — a very common practitioner mistake (conflating the informal "UK" abbreviation with the ISO code `GB`); Google ignores the region portion of this annotation entirely, silently degrading the tag to plain `en`, which then collides with any other `en-*` entries in the same cluster's language-only fallback logic.

### 4.3 — `es-419` and other non-ISO-3166 region-like codes are explicitly unsupported by Google, even though valid under other standards

- **Rule:** Do not use UN M.49 numeric-region codes or other non-ISO-3166-1-Alpha-2 region identifiers (e.g., `es-419` for "Latin American Spanish") in `hreflang`, even though such codes are valid and meaningful under BCP 47 / UN M.49 more broadly.
- **Mechanism:** Google's own docs state the restriction explicitly: *"Only language codes listed in ISO 639-1 and region codes listed in ISO 3166-1 Alpha 2 are supported; other codes that aren't listed in those standards, such as `es-419`, aren't supported."* This is a **narrower** subset than BCP 47 permits generally — BCP 47 / RFC 5646 explicitly allows three-digit UN M.49 numeric region subtags (*"Three-character region subtags consist solely of digit (number) characters and were defined according to the assignments found in the UN Standard Country or Area Codes for Statistical Use [UN_M.49]"*), but Google's `hreflang` consumer does not accept that subset of otherwise-valid BCP 47 tags.
- **Acceptance criterion:** No `hreflang` value uses a three-digit numeric region subtag; region subtags are two-letter ISO 3166-1 Alpha-2 only.
- **Verification:** Same validation script as §4.2, extended to reject any subtag matching `^\d{3}$` in the region position.
- **Anti-pattern:** Copying a `es-419`-style locale identifier directly from a CMS's or translation vendor's locale taxonomy (many translation-management systems use `es-419` internally as their canonical "Latin American Spanish" locale code) into `hreflang` output without translating it to a Google-supported representation (e.g., listing region-specific ISO 3166-1 codes individually, or falling back to bare `es`).

### 4.4 — Script subtags (ISO 15924) are optional and auto-derived from region where omitted

- **Rule:** For languages with multiple scripts (notably Chinese), either rely on Google's region-based script inference (`zh-TW` → Traditional, per Google's documented default) or specify the script explicitly with an ISO 15924 subtag (`zh-Hant`, `zh-Hans`), optionally followed by a region (`zh-Hans-US`).
- **Mechanism:** Google's docs: *"For language script variations, the proper script is derived from the country. For example, when using `zh-TW` for users in Taiwan, the language script is automatically derived (in this example: Chinese-Traditional). You can also specify the script itself explicitly using ISO 15924."*
- **Acceptance criterion:** A `zh-*` hreflang cluster either uses region-only codes with the derivation left implicit and documented as intentional, or uses explicit `zh-Hant`/`zh-Hans` script subtags — not a mix that leaves it ambiguous which convention the rest of the cluster follows.
- **Verification:** Manual review of the `zh-*` cluster's code list against the intended script/region matrix; there is no single curl-able check since this is a design-consistency rule, not a binary pass/fail against a live resource.
- **Anti-pattern:** Assuming `zh-CN` and `zh-Hans` are redundant/interchangeable and mixing both conventions within the same site without reconciling which pages map to which — this is a documentation-consistency footgun more than a Google-crawler failure, but it is exactly the kind of drift that makes a hreflang cluster hard to audit by hand.

### 4.5 — Case-insensitivity per BCP 47; Google's own casing convention (lowercase language, uppercase region) is a formatting convention only, not a functional requirement

- **Rule:** Treat `hreflang` values as case-insensitive when validating; do not reject or "fix" a technically-valid tag purely because it doesn't match the lowercase-language/uppercase-region display convention.
- **Mechanism:** RFC 5646 §2.1.1 states: *"At all times, language tags and their subtags, including private use and extensions, are to be treated as case insensitive: there exist conventions for the capitalization of some of the subtags, but these MUST NOT be taken to carry meaning."* Google's own examples consistently render `en-GB`/`de-CH` in lowercase-language/uppercase-region form, but this is the documented display convention, not a case-sensitivity requirement of the underlying tag-matching logic.
- **Acceptance criterion:** A validation script that lowercases both sides before comparing/deduplicating values (so `EN-gb` and `en-GB` are recognized as the same tag), while still emitting the conventional casing in generated markup for readability/consistency.
- **Verification:** Unit test asserting the validator treats `en-gb`, `EN-GB`, and `en-GB` as equivalent inputs.
- **Anti-pattern:** A CMS import script that treats casing differences as distinct locale identifiers, producing duplicate-looking-different cluster entries (`en-gb` and `en-GB` both present as if they were two different targets) that are functionally identical to the consuming search engine but confuse a human auditor and any exact-string reciprocity check that isn't case-normalized first (§2's matrix script must case-normalize before comparing triples, or it will report false-negative reciprocity failures).

---

## 5. The hreflang ↔ canonical interaction — the most-botched pairing in the domain

**Sources:**
- https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls — **Tier 1**. Verbatim, under canonical-selection guidance: *"If you're using [`hreflang` elements](/search/docs/specialty/international/localized-versions), make sure to specify a canonical page in the same language, or the best possible substitute language if a canonical page doesn't exist for the same language."* And under "Other signals": *"Apart from explicitly provided methods, Google also uses a set of canonicalization signals that are generally based on site setup: preferring HTTPS over HTTP, and URLs in `hreflang` clusters... To help with sites' localization efforts, for canonicalization purposes Google prefers URLs that are part of `hreflang` clusters."*
- https://developers.google.com/search/docs/specialty/international/localized-versions — **Tier 1** (cluster/reciprocity rules feeding into the above).

### 5.1 — Every page in an hreflang cluster must self-canonicalize (canonical in its own language), never point to one "master" language version

- **Rule:** Each localized page's `rel="canonical"` must point to a URL in the *same* language as that page (its own URL, in the overwhelming majority of setups), never to a different-language "primary" version of the content.
- **Mechanism:** Google's documented consolidation logic treats `rel="canonical"` as the dominant signal for which URL represents a piece of content in the index; if every locale's canonical points at, say, the English URL, Google is being told "these are all duplicates, the English one is authoritative" — which directly contradicts the localization intent of the surrounding `hreflang` cluster and gives the crawler two conflicting signals about the same set of URLs. Google's instruction to *"specify a canonical page in the same language"* is the documented resolution: canonical and hreflang must agree, and agreement means same-language self-reference, not cross-language consolidation.
- **Acceptance criterion:** For every URL in an hreflang cluster, `<link rel="canonical">` on that URL resolves to that same URL (self-referencing) or, at minimum, to another URL in the *same* language (e.g., consolidating `en-us` and `en-ca` duplicate-content variants per §6, while `de`, `fr`, etc. each still self-canonicalize) — never to a URL whose language differs from the page being annotated.
- **Verification:** Cross-reference script: for every page in the sitemap/hreflang matrix, parse its `hreflang="[lang]"` self-declaration and its `rel="canonical"` target's own hreflang self-declaration; assert the two languages match. This is exactly the kind of multi-step check the SOP's lint tooling should implement as a named script (`node scripts/seo-sop/check-hreflang-canonical-language-match.mjs`) rather than a single curl, per the authoring-format constraint that `Verify` must stay a single inline command referencing a script for anything beyond one HTTP call.
- **Anti-pattern (this is the single most consequential and most common real-world hreflang defect):** A CMS or CDN default that stamps every page — including translated ones — with a canonical pointing at the "main" (usually English, usually `/`-rooted) version of a piece of content, often inherited from a generic duplicate-content-prevention template that was never re-audited after i18n was added. The practical effect: Google is told the localized pages are duplicates of the English page, so it may drop the localized URLs from the index or serve the English URL to non-English searchers regardless of the hreflang annotations sitting right next to the contradicting canonical — the hreflang cluster's own presence as a "canonicalization signal" (per §5.2 below) is not strong enough to override an explicit, conflicting `rel="canonical"` tag.

### 5.2 — hreflang-cluster membership is itself a canonicalization tiebreaker signal, not a substitute for an explicit canonical

- **Rule:** Do not rely on hreflang-cluster membership alone to establish which URL is canonical among near-duplicate pages within the *same* language — declare an explicit `rel="canonical"` in every case where duplicate-content consolidation is needed (§6), and treat the cluster-preference behavior as a fallback tiebreaker Google applies only in the absence of an explicit, contradicting signal.
- **Mechanism:** Per Google's "Other signals" section, hreflang-cluster membership is one of a short list of *implicit* signals ("generally based on site setup") Google consults *"apart from explicitly provided methods"* — i.e., after the explicit signals (canonical tag, sitemap inclusion, redirects) have already been weighed. It is documented as a preference among candidates already competing for canonical status (e.g., preferring a `de-de`/`de-ch` pair that reciprocally cluster over an unclustered `de-at` variant), not a mechanism that assigns canonical status on its own in the presence of an explicit, conflicting `rel="canonical"`.
- **Acceptance criterion:** Every set of same-language duplicate URLs has an explicit `rel="canonical"` declared; hreflang-cluster membership is never the sole documented signal a build relies on for a consolidation decision that matters (P0/P1 in SOP severity terms).
- **Verification:** Manual/documentation review — this is a design-intent rule about not skipping the explicit signal, not something with a single runnable check; the closest automatable proxy is asserting that every URL group flagged as "same-language near-duplicate" in the content-management system also has a corresponding explicit canonical entry, not just hreflang tags.
- **Anti-pattern:** Assuming that because a page is "in the hreflang cluster," Google will correctly infer canonical status without an explicit tag — this under-specifies the signal Google actually documents (a tiebreaker among otherwise-competing candidates, not a primary consolidation mechanism) and leaves canonicalization to heuristics for a decision the site can and should make explicitly.

---

## 6. URL structure for internationalization — ccTLD vs. subdomain vs. subdirectory vs. parameters

**Source:** https://developers.google.com/search/docs/specialty/international/managing-multi-regional-sites — **Tier 1**.

### 6.1 — Choose ccTLD, gTLD-subdomain, or gTLD-subdirectory; never bare URL parameters, for geotargeting

- **Rule:** Structure locale/region-specific URLs as one of: a country-code top-level domain (`example.de`), a subdomain of a generic TLD (`de.example.com`), or a subdirectory of a generic TLD (`example.com/de/`); do not use a URL query parameter (`example.com?loc=de`) as the geotargeting mechanism.
- **Mechanism / documented trade-offs (per Google):**
  | Structure | Documented strength | Documented weakness |
  |---|---|---|
  | ccTLD (`example.de`) | "Clear geotargeting" signal to users; server location is irrelevant to the signal; sites are easy to separate | Expensive/limited domain availability; more infrastructure to run; some ccTLDs have registration restrictions; can only target a single country |
  | gTLD subdomain (`de.example.com`) | Easy to set up; permits different server locations per subdomain; sites are easy to separate (can use different GSC properties) | Users may not recognize the geotargeting intent from the URL alone |
  | gTLD subdirectory (`example.com/de/`) | Easy to set up; low maintenance (single host/server) | Users may not recognize geotargeting intent; single server location only; harder to separate as distinct properties later |
  | URL parameters (`example.com?loc=de`) | — | Explicitly not recommended: hard for a searcher to recognize as geotargeting, harder to segment/manage as a distinct property |
- **Acceptance criterion:** The site's locale URLs match one of the three recommended structural patterns; no locale/region selection is carried solely in a query string with no corresponding path or host difference.
- **Verification:** Manual architecture review against the table above at the URL-structure-decision stage of a build; there is no live-crawl test for "did we choose the right structure," since this is a one-time architectural decision, not a per-page defect.
- **Anti-pattern:** Choosing a query-parameter scheme because it's the cheapest to implement in an existing single-locale codebase, then discovering the resulting URLs are difficult to keep separate from unlocalized/canonical duplicate URLs in analytics, sitemaps, and hreflang tooling — every reciprocity- and canonical-matching script in this module (§2, §5) assumes locale is expressed structurally in the path or host, and a parameter-only scheme fights that assumption at every layer.

### 6.2 — Trade-off is legibility/strength of signal vs. operational cost and flexibility, not a universal "best" choice

- **Rule:** Do not default to a single "always correct" URL structure across all client builds; select ccTLD only when the strongest possible geotargeting signal is required and the cost/registration overhead is acceptable, subdomain when server-location flexibility (e.g., different hosting regions for latency/compliance) matters more than URL-legibility, and subdirectory when minimizing infrastructure and maintenance cost matters most and a single global server location is acceptable.
- **Mechanism:** This is Google's own framing — the multi-regional-sites doc presents the three options side by side with named strengths and weaknesses for each, explicitly declining to declare one universally superior; the decision is a site-operations trade-off Google's documentation defers to the site owner to make.
- **Acceptance criterion:** The SOP's operator checklist records *which* structure was chosen for a given client build and *why* (against this trade-off table), rather than treating URL structure as a fixed default.
- **Verification:** Documentation/process check — record the decision and rationale in the build's architecture notes; not independently testable against a live site beyond confirming §6.1's structural pattern is followed.
- **Anti-pattern:** Migrating from subdirectory to ccTLD (or vice versa) mid-lifecycle without recognizing this is effectively a full domain migration for every affected locale — it invokes every URL-change risk documented in the SOP's Migrations module (`MIG` prefix), not merely an hreflang-relabeling exercise.

---

## 7. Duplicate content across locales of the *same* language

**Sources:**
- https://developers.google.com/search/docs/specialty/international/managing-multi-regional-sites — **Tier 1**. Verbatim: *"If you provide similar or duplicate content on different URLs in the same language as part of a multi-regional site (for instance, if both `example.de/` and `example.com/de/` show similar German language content), pick a preferred version and use the `rel="canonical"` element and `hreflang` tags to make sure that the correct language or regional URL is served to searchers."*
- https://developers.google.com/search/docs/specialty/international/localized-versions — **Tier 1**. Verbatim: *"Localized versions of a page are only considered duplicates if the main content of the page remains untranslated."*
- https://blogs.bing.com/webmaster/December-2025/Does-Duplicate-Content-Hurt-SEO-and-AI-Search-Visibility — **Tier 1** (Bing Webmaster's own blog). Verbatim: *"Localization creates duplicate content when regional or language pages are nearly identical and do not provide meaningful differences for users in each market."* ... *"Localize with meaningful changes such as terminology, examples, regulations, or product details."* ... *"Avoid creating multiple pages in the same language that serve the same purpose."*

### 7.1 — Same-language, different-region pages with substantively identical content are duplicates and must be consolidated or differentiated

- **Rule:** When two or more locale URLs serve the same language with no substantive regional difference (pricing, regulation, terminology, examples), either genuinely differentiate the content per region or consolidate to one canonical URL for that language with `hreflang` pointing region-specific traffic at it — do not maintain near-identical pages purely to "cover" every region combinatorially.
- **Mechanism:** Both Google and Bing separately and independently document that localization is a *documented cause* of duplicate content, not an exemption from duplicate-content handling — the mere fact that pages are "for different regions" does not make otherwise-identical content non-duplicate. Google's is-it-a-duplicate test is explicitly about the *primary content*, not the URL's regional label: *"only considered duplicates if the main content of the page remains untranslated"* (i.e., if only chrome like nav/footer differs, or if regional variants share the same body copy word-for-word).
- **Acceptance criterion:** Any two same-language locale pages either (a) differ in primary content in a way that reflects genuine regional variation (Bing's own examples: terminology, examples, regulations, product details — pricing/currency is the CleanStart-adjacent example given in Google's own worked scenario for `en-us`/`en-gb`), or (b) are consolidated to a single canonical URL for that language with region-specific hreflang variants pointing at it rather than at separate near-duplicate pages.
- **Verification:** Content-diff tooling comparing primary-content blocks (not nav/footer/boilerplate) across same-language locale pairs; a similarity score above an agreed threshold on primary content should raise a manual review flag, not an automatic pass/fail (this is a content-quality judgment, not a binary technical check).
- **Anti-pattern:** Generating an `en-us`/`en-gb`/`en-au`/`en-ca`/`en-ie` page for every English-speaking market by templating the exact same body copy with only currency symbols swapped, while marketing it internally as "full regional coverage" — per Google's own definition this is exactly the boundary case explicitly named as legitimate *when* the difference is substantive (their own worked example is genuinely different: shipping-fee information relevant to each region), and exactly the case Bing calls out as a duplicate-content risk when the difference is cosmetic only.

### 7.2 — Provide a language-only catch-all for unmatched regional variants of the same language

- **Rule:** When multiple region-specific variants of one language exist (`en-ie`, `en-ca`, `en-au`), also provide (or designate one variant as) a bare-language catch-all (`en`) for searchers whose specific region isn't covered.
- **Mechanism:** Google's own documented rule: *"If you have several alternate URLs targeted at users with the same language but in different locales, it's a good idea to also provide a catchall URL for geographically unspecified users of that language. For example, if you have specific URLs for English speakers in Ireland (`en-ie`), Canada (`en-ca`), and Australia (`en-au`), provide a generic English (`en`) page for searchers in the US, UK, and all other English-speaking locations. It can be one of the specific pages, if you choose."*
- **Acceptance criterion:** Every hreflang cluster containing two or more region-qualified variants of the same base language also contains one bare-language (`en`, `de`, `fr`, etc.) entry in that cluster.
- **Verification:** Static check over the hreflang matrix: for every language with ≥2 region-qualified entries in a cluster, assert a bare-language entry also exists in that same cluster.
- **Anti-pattern:** Building region variants for every market that has one (`en-ie`, `en-ca`, `en-au`) but omitting a bare `en` fallback, leaving US/UK/unlisted-region English searchers with no explicitly matched variant — Google will fall back to its own heuristics (or `x-default`, if present) rather than a clean, deliberate `en` match.

---

## 8. Locale detection, IP-based auto-redirection, and why Google advises against it

**Source:** https://developers.google.com/search/docs/specialty/international/locale-adaptive-pages — **Tier 1**.

### 8.1 — Do not gate content behind IP-based geolocation or Accept-Language auto-redirects without a crawlable, linkable alternative

- **Rule:** If the same URL serves different content based on perceived visitor country/language ("locale-adaptive" behavior), also provide separate, stable per-locale URLs annotated with `hreflang`, rather than relying solely on server-side detection-and-redirect/serve logic at a single URL.
- **Mechanism:** Google's documentation states the crawling constraint plainly: *"the default IP addresses of the Googlebot crawler appear to be based in the USA"* and *"the crawler sends HTTP requests without setting `Accept-Language` in the request header."* A locale-adaptive setup that infers language/region purely from IP or `Accept-Language` will therefore, by default, show Googlebot only the US/no-preference variant of the page — Google explicitly warns this means *"Google might not crawl, index, or rank all your content for different locales."* Google's own stated fix is not "detect Googlebot better" but architectural: *"We recommend using separate locale URL configurations and annotating them with rel=alternate hreflang annotations"* — i.e., stop relying on request-time detection as the only path to localized content at all.
- **Acceptance criterion:** Every locale's content is reachable at a stable, distinct URL that does not require IP geolocation or an `Accept-Language` header to display — a crawler with a US IP and no `Accept-Language` header must still be able to reach and be served the `de`, `fr`, etc. variants by URL alone.
- **Verification:** `curl -s https://example.com/de/` with no `Accept-Language` header set, from any IP — confirm German content is served (not a US/English default), and confirm the same is true for every declared locale path.
- **Anti-pattern:** A single URL (often the bare root domain) that silently serves different HTML per visitor based on IP/header sniffing with no distinct, linkable URL underneath for each variant — this is precisely the configuration Google's locale-adaptive-pages documentation exists to warn against, and it is also the configuration where an SEO audit is most likely to be misled, since a human auditor browsing from a non-US IP with a normal browser will see fully localized content and conclude everything is fine, while Googlebot sees only the US/default variant.

### 8.2 — If locale-adaptive serving is used anyway, robots directives must stay identical across every locale variant

- **Rule:** When a site does serve locale-adaptive content (rather than, or in addition to, separate URLs), the `robots` meta tag and `robots.txt` rules must specify identical crawl/index permissions across every locale's variant of the same URL — never allow one locale's rendering to be indexable while another locale's rendering of the same URL is blocked.
- **Mechanism:** Google's documentation states this as a direct consistency requirement: robots meta tags and robots.txt rules *"must specify the same rules in each locale"* — because Googlebot may see only one locale's rendering of a shared URL (per §8.1's IP/header limitation), an inconsistent robots directive between locales risks the crawler applying the wrong permission set to content it never actually saw the alternate version of.
- **Acceptance criterion:** For any URL that serves locale-adaptive content, the `X-Robots-Tag`/`<meta name="robots">` value and the matching robots.txt path rule are identical regardless of which locale variant happens to be served to the fetching client.
- **Verification:** Fetch the same URL with several different `Accept-Language`/geo-simulated conditions and diff the `robots` meta tag / `X-Robots-Tag` header across responses — they must be byte-identical.
- **Anti-pattern:** A regional legal/compliance requirement (e.g., a `noindex` mandated for one jurisdiction's variant only) implemented as a per-locale robots override on a shared URL — Google's documentation treats this as an unsupported configuration for locale-adaptive pages specifically; the documented-safe path is to move that jurisdiction's content to its own distinct URL (per §8.1) where a jurisdiction-specific robots rule is unambiguous, rather than layering conditional robots logic onto one shared URL.

---

## 9. How Google treats machine-translated content

**Sources:**
- https://developers.google.com/search/docs/essentials/spam-policies — **Tier 1**. "Scaled content abuse" section, verbatim: *"Scraping feeds, search results, or other content to generate many pages (including through automated transformations like synonymizing, translating, or other obfuscation techniques), where little value is provided to users."*
- https://developers.google.com/search/updates — **Tier 1** (Google Search Central changelog). June 11, 2025 entry, verbatim: *"Spring cleaning in our multilingual documentation — What: Removed a section from our multilingual documentation about using robots.txt to block all automatically translated pages. Why: To align with our spam policy update in March 2024. This is a docs-only change, no change in behavior."*

### 9.1 — Machine-translated content is not inherently spam; it is spam only when it is scaled, low-value, and undifferentiated

- **Rule:** Do not treat "this content was machine-translated" as itself a policy violation or an automatic quality signal; evaluate translated pages against the same scaled-content-abuse test Google applies to any automated content — whether the output provides genuine value to users, independent of the production method.
- **Mechanism:** Google's spam policy names translation only as one example within a broader "automated transformations" category (alongside synonymizing and other obfuscation techniques) that becomes a violation specifically *"where little value is provided to users"* — the violation condition is the value/quality outcome, not the use of translation technology per se. This is corroborated by the June 2025 documentation change: Google's own changelog states it removed a standing recommendation to block *all* auto-translated pages via robots.txt specifically *because* that blanket guidance had become misaligned with the March 2024 policy's value-based (not method-based) framing.
- **Acceptance criterion:** A machine-translated page is evaluated (manually or via the SOP's content-quality rubric) for whether it provides substantive, non-boilerplate value in the target language — not flagged or suppressed merely because its origin was an automated translation pipeline.
- **Verification:** No single runnable command; this is a content-policy judgment. The closest process check: confirm the site's robots.txt does *not* contain a blanket `Disallow` rule targeting a URL pattern whose sole purpose is "path contains a machine-translated locale," since Google's own docs now explicitly no longer recommend that pattern (§9.2 flags this further).
- **Anti-pattern:** Retaining a legacy robots.txt rule (or CMS convention) that blanket-blocks or `noindex`es every machine-translated locale variant on the theory that "Google penalizes auto-translated content" — this is exactly the now-retired guidance; see §9.2 for the explicit, dated documentation change.

### 9.2 — FLAGGED: a 2025 documentation change reversed prior guidance to block auto-translated pages via robots.txt — do not carry forward the old advice

- **What changed:** Until removed on 2025-06-11, Google's multi-regional/multilingual documentation (`managing-multi-regional-sites`) contained guidance recommending robots.txt be used to block automatically translated pages from being crawled/indexed. Google's own changelog entry for the removal states plainly this was a **docs-only change, no change in Google's actual system behavior** — meaning the underlying ranking/spam system's treatment of auto-translated content had already shifted (per the March 2024 scaled-content-abuse policy, which evaluates by *value*, not *method*) well before the documentation caught up to reflect it.
- **Why this matters for the SOP:** Any pre-2025 practitioner content, older audit checklist, or legacy internal SOP that says "block/noindex all machine-translated pages" is citing guidance Google has since retired **in its own canonical documentation**, not merely a Tier-4 opinion that fell out of fashion. This is a load-bearing distinction: the change is Tier 1 and dated, not a practitioner-consensus drift.
- **Correct current position:** Evaluate translated content on the value-based scaled-content-abuse test (§9.1); do not maintain or newly author a robots.txt rule whose stated purpose is "block auto-translated content" as a category.
- **Source:** https://developers.google.com/search/updates (changelog entry dated 2025-06-11) — **Tier 1**. Within the last 24 months of this research date (2026-07-29).

---

## 10. Explicitly flagged: unsupported or contradicted claims

Per the research brief's requirement to flag anything deprecated, recently changed, or a widely-repeated claim the primary source does not actually support:

| Claim commonly repeated in SEO practitioner content | Tier of support found | Verdict for this SOP |
|---|---|---|
| `hreflang` is a ranking signal, or improves a page's ranking | **None** — no Tier 1 Google document fetched in this research (localized-versions, managing-multi-regional-sites, consolidate-duplicate-urls, locale-adaptive-pages) makes any ranking claim about `hreflang`. Google's own framing is consistently about *which URL variant is served/pointed to which searcher*, not about rank. | **Do not state or imply hreflang affects ranking.** Frame it exclusively as a *routing/serving* signal (which URL Google shows to which searcher) and, secondarily, a canonicalization tiebreaker (§5.2) — never as a ranking booster. |
| `hreflang` "consolidates" ranking/link signals across locale variants the way `rel="canonical"` consolidates duplicate-URL signals | **None** — Google's own documentation draws the opposite distinction: canonical consolidates signals to one URL; hreflang's job is explicitly to keep locale variants *separately servable* to their respective audiences. Treating them as functionally equivalent consolidation mechanisms directly contradicts §5's finding that canonical must self-reference per locale precisely so hreflang's routing function isn't defeated. | **Actively wrong per the mechanism documented.** Hreflang does not merge locale-variant signals into one; each locale variant is intended to remain independently indexable and independently rankable in its own market's results. |
| "Block all machine-translated pages via robots.txt" | Was Tier 1 (Google's own prior documentation) until **2025-06-11**, when Google's own changelog retired it as stale relative to the March 2024 scaled-content-abuse policy. | **Deprecated as of a dated, Tier 1 source within the last 24 months.** Do not carry this into the SOP as current guidance (§9.2). |
| Bing does not support `hreflang` at all / ignores it entirely | Contradicted by Bing's own December 2025 webmaster blog post, which recommends `hreflang` by name with a worked code example (§7, §11 source list). Widely-repeated practitioner claim that Bing weights it more weakly than Google, and leans more on `content-language`/on-page signals, is directionally consistent with third-party (Tier 4) reporting but was **not found stated by Bing itself** in the fetched Tier 1 source — the relative-weighting claim should be labeled `Convention — not vendor-confirmed` even though the base claim ("Bing supports hreflang") is Tier 1-confirmed. | **Partially correct, partially unconfirmed.** Bing does document and recommend hreflang (Tier 1) — do not claim Bing ignores it. But do not cite a specific weighting/strength comparison to Google as vendor-confirmed; no Bing-authored source for that comparison was located. |
| `es-419` / UN M.49 numeric region codes are valid in `hreflang` | Contradicted directly by Google's own documentation (§4.3), even though such codes are valid under the broader BCP 47 / UN M.49 standards Google's own `hreflang` syntax is otherwise derived from. | **Actively wrong for Google specifically.** Flag prominently: this is a case where a technically-valid BCP 47 tag is nonetheless unsupported by Google's narrower implementation — a frequent source of practitioner confusion because the tag isn't malformed, merely unsupported by this one consumer. |

---

## 11. Primary source list (for citation verification)

- https://developers.google.com/search/docs/specialty/international/localized-versions — Tier 1
- https://developers.google.com/search/docs/specialty/international/managing-multi-regional-sites — Tier 1
- https://developers.google.com/search/docs/specialty/international/locale-adaptive-pages — Tier 1
- https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls — Tier 1
- https://developers.google.com/search/docs/advanced/guidelines/duplicate-content — Tier 1 (corrected path — verified via search index; not yet fetched/quoted directly in this pass, confirm content live before verbatim citation)
- https://developers.google.com/search/docs/essentials/spam-policies — Tier 1
- https://developers.google.com/search/updates — Tier 1 (changelog; June 11 2025 "Spring cleaning in our multilingual documentation" entry)
- https://developers.google.com/search/blog/2024/03/core-update-spam-policies — Tier 1 (March 2024 scaled-content-abuse policy referenced by the above changelog entry; not independently fetched in this research pass, should be verified directly before citing in the authored module)
- https://www.rfc-editor.org/rfc/rfc5646.txt — Tier 1 (IETF BCP 47)
- https://www.iso.org/iso-639-language-code — Tier 1 (URL confirmed live via search index; direct fetch returned HTTP 403 — likely bot-blocking, re-attempt with an authenticated/human fetch before final citation)
- https://www.iso.org/iso-3166-country-codes.html — Tier 1 (same 403-to-automated-fetcher caveat as above)
- https://blogs.bing.com/webmaster/December-2025/Does-Duplicate-Content-Hurt-SEO-and-AI-Search-Visibility — Tier 1 (Bing Webmaster's own blog)
- https://nextjs.org/docs/app/guides/internationalization — Tier 2 (first-party Next.js docs; version-stamped 2025-12-09 against Next.js 16.2.12, consistent with this repo's Next.js 16.2.5)

### Fetch caveats to re-verify before Phase 4 authoring

- The two ISO pages above returned HTTP 403 to this session's automated fetcher (consistent with ISO's general bot-blocking posture, not evidence the pages don't exist — both URLs were independently confirmed live via search-index snippets). Re-fetch with a standard browser or an authenticated tool before treating their exact wording as verbatim-quoted; this document's ISO-derived claims are sourced through RFC 5646's own citations of ISO 639-1/3166-1 rather than through direct ISO-site quotation.
- Google's general duplicate-content documentation lives at `/search/docs/advanced/guidelines/duplicate-content` (corrected from an initially-guessed `/crawling-indexing/` path during this research pass) — its content was summarized via search snippet only, not fetched and quoted verbatim; do so before citing it directly in the authored C1 module.
- The March 2024 scaled-content-abuse blog post (`https://developers.google.com/search/blog/2024/03/core-update-spam-policies`) was confirmed to exist at that exact URL via search-index title match, but its "scaled content abuse" section was not successfully fetched verbatim in this pass (the fetch returned only a blog archive listing, not the article body) — fetch and quote it directly before final authoring if a verbatim quote from that specific post is needed; this document's §9 quote instead comes verbatim from the `/search/docs/essentials/spam-policies` page, which was fetched successfully.
