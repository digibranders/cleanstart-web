# Semantic HTML & Accessibility — Search / AI-Extraction Consequences

**Scope discipline:** this module documents only semantic HTML and accessibility properties with a **primary-sourced, documented** search or AI-extraction consequence. It is not a general accessibility module — WCAG conformance for its own sake is out of scope here and lives in the separate accessibility practice. Every rule below states its evidence tier; anything without a Tier 1–3 citation is explicitly marked `Convention — not vendor-confirmed` rather than implied to be SEO-load-bearing.

**Tiers used:** Tier 1 = WHATWG HTML spec / W3C (WAI-ARIA, WCAG where it bears on extraction) / Google Search Central. Tier 2 = first-party platform docs (e.g. YouTube Help). Tier 3 = named, dated empirical study or a direct, attributable Google-spokesperson statement reported by a named outlet. Tier 4 / Convention = practitioner consensus with no primary source.

---

## 1. Heading structure & the document outline

### R1 — Make exactly one heading on the page visually and structurally the most prominent

**Rule:** Style and mark up one heading element per page so it is unambiguously the most prominent text on the page (largest, most prominent placement, typically the first `<h1>`).

**Mechanism (documented):** Google states it looks at "the main visual title, heading elements, and other large and prominent text" to auto-generate the title link shown in search results, and that when multiple headings carry equal visual weight, "Google Search may use the first heading as the text for the title link" — i.e. an ambiguous heading hierarchy produces an unpredictable, possibly wrong, title link. This is a title-link generation mechanism, not a ranking mechanism.

**Acceptance criterion:** The page has one heading whose computed font-size/weight/placement makes it unambiguously dominant over all sibling headings; `document.querySelectorAll('h1')` returns exactly one element used as the primary page title (multiple `h1`s elsewhere are not itself a defect — see R2).

**Verification:** Manual/DOM check — `document.querySelectorAll('h1,h2,h3').forEach(h => console.log(h.tagName, getComputedStyle(h).fontSize))` — confirm the intended title is the largest. Cross-check the rendered Google title link via a live search or the URL Inspection tool's rendered HTML.

**Source:** [Influencing your title link in search results](https://developers.google.com/search/docs/appearance/title-link) — Google Search Central. **Tier 1.**

**Anti-patterns:** Multiple headings styled identically with no visual hierarchy, causing Google to guess which is the title; hiding the true title in a `<div>` styled to look larger than the actual `<h1>` (Google explicitly instructs "make it clear which text is the main title").

---

### R2 — Do not treat "one `h1` per page" as an HTML validity or ranking rule; multiple top-level headings are conforming and not penalized

**Rule:** Do not block a build, fail a lint rule, or reject a design on the grounds that a page has more than one `<h1>`.

**Mechanism (documented):** The WHATWG HTML Standard explicitly permits multiple top-level headings and gives a worked example of a document with three sibling `<h1>` elements. Separately, Google's own SEO Starter Guide states outright: "There's also no magical, ideal amount of headings a given page should have" and that heading *order* "doesn't matter" from a Search perspective even though it matters for screen readers.

**Acceptance criterion:** No CI/lint rule fails a build solely because `document.querySelectorAll('h1').length > 1`. A `h1` count of 2+ is not, by itself, logged as an SEO defect in any audit tooling this team runs.

**Verification:** `grep` the repo's ESLint/axe/lint config for a hard-fail rule keyed on H1 count; if found, confirm it is an accessibility-hierarchy check (legitimate, WCAG-motivated) rather than being justified in comments/PRs as an "SEO requirement."

**Sources:**
- [HTML Standard §4.3.11, Headings and outlines](https://html.spec.whatwg.org/multipage/sections.html#headings-and-sections) — WHATWG. **Tier 1.**
- [SEO Starter Guide: The Basics](https://developers.google.com/search/docs/fundamentals/seo-starter-guide) — Google Search Central, section on heading tags. **Tier 1.**

**Flagged myth:** "One `h1` per page or Google penalizes/devalues the page" is **widely repeated by practitioners and not supported** by either primary source above. Google's own spokesperson (John Mueller) has separately and repeatedly said multiple `h1`s are "completely normal" — that specific statement is Tier 3 (reported, not a Search Central doc), included here only as corroboration, not as the load-bearing citation.

---

### R3 — Do not build automation around the WHATWG "outline algorithm" (sectioning-root-based heading levels); use the flat heading-level model instead

**Rule:** Any internal tooling, linter, or documentation that infers heading level from nesting inside `<section>`/`<article>`/`<aside>` (the pre-2022 "outline algorithm") must be rewritten to use literal heading levels (`h1`–`h6`) directly.

**Mechanism (documented) — flagged as deprecated/materially changed:** WHATWG merged [PR #7829](https://github.com/whatwg/html/pull/7829) on 2022-07-01, replacing the sectioning-root outline algorithm with a model based directly on heading levels, "in line with the decade+ old reality of non-implementation of the outline algorithm in User Agents" — no shipping browser or assistive-technology user agent ever implemented the old algorithm. This is a spec-level change with a direct, stated consequence for the "nest headings inside sectioning elements to fix their effective level" convention: that convention was never real; only the literal `h1`–`h6` value has ever mattered to browsers/AT, and the spec now says so plainly.

**Acceptance criterion:** No design-system or content-model document in this repo instructs authors to "use `<h2>` inside a nested `<section>` because it becomes an h3 in the outline" or equivalent nesting-based level-inference language.

**Verification:** `grep -ri "outline algorithm\|document outline" apps/web/docs apps/cms/src` — any hit should be reviewed against the current spec section below to confirm it isn't describing pre-2022 behavior as current.

**Source:** [HTML Standard, Headings and sections](https://html.spec.whatwg.org/multipage/sections.html#headings-and-sections) (current text, reflecting the 2022 change) and [whatwg/html PR #7829](https://github.com/whatwg/html/pull/7829) (the change itself, merged 2022-07-01). **Tier 1.**

---

## 2. Landmark elements (`main`, `article`, `nav`) as content-extraction signals

### R4 — Wrap the primary content region in `<main>`, and use `<article>`/`<nav>` for their semantic purpose, but do not claim a documented ranking or AI-citation boost for doing so

**Rule:** Use `<main>` once per page for the primary content region; use `<article>` for self-contained, independently distributable content; use `<nav>` for navigation blocks. Do not justify this in code review as "for SEO" beyond what is cited below.

**Mechanism:** WHATWG defines `<article>` as content that is "independently distributable or reusable," `<nav>` as "a section that links to other pages or to parts within the page," and `<main>`/sectioning elements as machine-parseable structural signals (Tier 1, structural definition only — not a search-ranking claim). W3C WAI-ARIA defines landmark roles (`main`, `navigation`, `banner`, `contentinfo`, etc.) as "regions of the page intended as navigational landmarks" whose explicit purpose is to "help users navigate pages more efficiently" via assistive technology (Tier 1, accessibility-navigation mechanism, not search/AI extraction).

**What could not be documented:** No Google Search Central page found in this research confirms that `<main>`/`<article>`/`<nav>` markup changes indexing, ranking, or AI Overview eligibility. Google's SEO Starter Guide does not use the words "semantic," "`<main>`," "`<article>`," "`<nav>`," or "landmark" anywhere in its current text. This is the single largest gap between practitioner claims ("semantic HTML5 tags help Google understand your page," "landmarks boost AI extraction") and what any Tier 1–3 source actually states.

**Acceptance criterion:** Exactly one `<main>` per page; navigation regions use `<nav>`; content-review comments citing "semantic HTML for SEO" link to a specific accessibility or maintainability rationale rather than an unverified ranking claim.

**Verification:** `document.querySelectorAll('main').length === 1`; manual review of PR descriptions for unsupported "this helps SEO" claims tied to landmark elements.

**Sources:**
- [HTML Standard §4.3, Sections](https://html.spec.whatwg.org/multipage/sections.html) — WHATWG. **Tier 1** (structural definition).
- [WAI-ARIA 1.2 §5.4, Landmark Roles](https://www.w3.org/TR/wai-aria-1.2/#landmark_roles) (returns 403 to automated checks; verified manually 2026-07-29) — W3C. **Tier 1** (accessibility-navigation mechanism, not search/AI extraction).
- Absence check: [SEO Starter Guide: The Basics](https://developers.google.com/search/docs/fundamentals/seo-starter-guide) — Google Search Central — contains no statement on this topic as of this research pass.

**Flagged myth:** "Semantic HTML5 elements are an SEO/AI-citation ranking factor" is **widely repeated and not supported** by any primary source located. Mark this `Convention — not vendor-confirmed` in the SOP; do not let it inflate accessibility work with unearned SEO justification.

---

## 3. Image `alt` text

### R5 — Every content-bearing `<img>` has accurate, descriptive `alt` text

**Rule:** Populate `alt` on every content image with a concise, accurate description of the image in the context of the page; leave `alt=""` only for genuinely decorative images.

**Mechanism (documented):** Google states: "Google uses alt text along with computer vision algorithms and the contents of the page to understand the subject matter of the image" — this is specifically documented as an input to Google Images / image search understanding, not as a general page-ranking signal. Google separately warns against keyword-stuffed `alt` text as it "results in a negative user experience and may cause your site to be seen as spam."

**Acceptance criterion:** 0 content `<img>` elements with missing or empty `alt` (excluding intentionally decorative images per the project's existing `aria-hidden`/decorative convention); no `alt` value is a raw keyword list.

**Verification:** Automated: axe-core / Lighthouse accessibility audit flags `image-alt` violations; manual spot-check that `alt` text is descriptive prose, not comma-separated keywords.

**Source:** [Google Images best practices](https://developers.google.com/search/docs/appearance/google-images) — Google Search Central. **Tier 1.**

**Flagged myth:** "`alt` text is a direct ranking factor" is **not** what Google's documentation says. The cited page frames `alt` text as an image-understanding and accessibility input, explicitly not as a keyword-stuffing opportunity — treat it as `Convention — not vendor-confirmed` when the claim is "ranking factor," and as Tier 1-documented when the claim is "image-search understanding signal."

---

### R6 — When an image is the sole content of a link, its `alt` text becomes that link's anchor text

**Rule:** For any `<a>` that wraps only an `<img>` with no adjacent text, write `alt` as if it were the link's anchor text — descriptive of the destination, not just the image.

**Mechanism (documented):** Google states explicitly: "For images used as links, Google uses the `alt` attribute of the `img` element as anchor text." This is a directly documented mechanism connecting an accessibility attribute to a specific extraction/understanding behavior (how the destination page is described to Google), not a general accessibility benefit.

**Acceptance criterion:** Every `<a><img alt="..."></a>` pattern (no sibling text node) has `alt` text that describes the link destination, not merely the visual content of the image.

**Verification:** `grep`/DOM query for `<a>` elements whose only child is `<img>`; confirm `alt` reads sensibly as anchor text (e.g. "CleanStart pricing page" not "blue button").

**Source:** [SEO Link Best Practices for Google](https://developers.google.com/search/docs/crawling-indexing/links-crawlable) — Google Search Central. **Tier 1.**

---

## 4. Link text and anchor semantics

### R7 — Links must be real `<a href="...">` elements with descriptive text

**Rule:** Every navigable link is an `<a>` element with a resolvable `href`; anchor text is descriptive of the destination page, not generic ("click here," "read more" with no surrounding context).

**Mechanism (documented):** Google states plainly: "Google can only crawl your link if it's an `<a>` HTML element with an `href` attribute." Formats like `<span onclick="...">` or `<a>` without `href` are non-crawlable or unreliable. Separately, on anchor text: "Good anchor text is descriptive, reasonably concise, and relevant to the page that it's on and to the page it links to" and "the better your anchor text, the easier it is for people to navigate your site and for Google to understand what the page you're linking to is about."

**Acceptance criterion:** No internal navigation relies solely on `onclick`-driven `<div>`/`<span>` elements without a real `<a href>` fallback; no anchor text is a bare "click here"/"here" with no descriptive surrounding sentence.

**Verification:** `grep -rn "onclick=" apps/web/src` cross-referenced against whether each such element is also a real `<a href>`; automated check for anchor text matching a denylist (`click here`, `here`, `link`, `read more` as the entire link text with no context).

**Source:** [SEO Link Best Practices for Google](https://developers.google.com/search/docs/crawling-indexing/links-crawlable) — Google Search Central. **Tier 1.**

**Anti-pattern:** JS-only "links" with no `<a href>` at all (Google may not crawl them); anchor text that is identical across many destinations (e.g. "click here" repeated site-wide), which gives Google no differentiating signal per Google's own wording above.

---

## 5. Table markup for data extraction

### R8 — Use real `<table>` markup with `<th>` (and `scope` or `headers` where the association is not obvious from a simple grid) for any genuinely tabular data

**Rule:** Data that is a matrix of rows/columns (pricing tiers, comparison tables, spec sheets) is marked up as `<table>`/`<tr>`/`<th>`/`<td>`, with `scope` or `headers` used whenever a row/column header does not simply align with its data cells.

**Mechanism (documented):** The HTML Standard defines an explicit "header-associated cells" algorithm keyed off the `scope` and `headers` attributes, allowing software to programmatically determine which header(s) apply to a given data cell rather than relying on visual grid position. W3C's WAI table guidance states this plainly: "With structural markup, headers and data cells can be programmatically determined by software," which is what lets a screen reader announce the correct header for a cell — a machine-extraction mechanism, not a purely visual one.

**What could not be documented:** No current Google Search Central page was found (as of this research pass) that ties `<table>`/`<th>`/`scope` markup to a specific SEO feature (e.g. the historical "structured snippets" feature that pulled HTML table data into search result snippets has no current, locatable official Google documentation page — treat any claim that Google "extracts your HTML table into a snippet" as `Convention — not vendor-confirmed`, not as a documented mechanism). Google's own snippet-generation documentation describes snippets as generated "primarily from the page content itself" or the meta description, with no mention of tables specifically.

**Acceptance criterion:** No tabular data is built from `<div>` grids with only visual (CSS Grid/Flexbox) row/column alignment and no `<table>` semantics; every `<table>` has at least one `<th>`; multi-level header tables use `scope`/`headers`.

**Verification:** `grep -rn "cs-table\|role=\"table\"\|<table" apps/web/src` and manually confirm any div-based "table-look" component is either upgraded to real `<table>` markup or explicitly justified as non-tabular content.

**Sources:**
- [HTML Standard §4.9.12, Table headers and associations](https://html.spec.whatwg.org/multipage/tables.html#table-headers-header-associations) — WHATWG. **Tier 1.**
- [W3C WAI Tables Tutorial](https://www.w3.org/WAI/tutorials/tables/) (returns 403 to automated checks; verified manually 2026-07-29) — W3C. **Tier 1** (accessibility-extraction mechanism, not a documented SEO-ranking claim).
- Absence check: [How Google auto-generates snippets](https://developers.google.com/search/docs/appearance/snippet) — Google Search Central — makes no mention of HTML tables as a snippet source.

---

## 6. `lang` attribute

### R9 — Set `<html lang="...">` correctly, but do not claim it is Google's language-detection mechanism

**Rule:** Every page sets an accurate `lang` attribute on `<html>` matching the actual language of the visible content. Do not justify this requirement in code review as "so Google knows what language the page is in."

**Mechanism (documented) — flagged myth correction:** Google states directly: "Google doesn't use `hreflang` or the HTML `lang` attribute to detect the language of a page; instead, we use algorithms to determine the language" from the page's visible content. Google's actual guidance for helping it detect language correctly is to "use a single language for content and navigation on each page" and avoid side-by-side translations — i.e., the documented mechanism is content-based language detection, not the `lang` attribute.

**Acceptance criterion:** `<html lang>` is present and accurate on every page (for accessibility/browser-UA reasons — screen-reader pronunciation, browser translate-prompt accuracy — which are real, just not the Google-detection mechanism); no single-page content mixes two languages in a way that could confuse Google's content-based detection.

**Verification:** `grep -rn "lang=" apps/web/src/app/**/layout.tsx` to confirm `<html lang>` is set; manual check that no page interleaves two languages in primary content (separate from intentionally bilingual UI strings).

**Source:** [Managing multi-regional and multilingual sites / localized versions](https://developers.google.com/search/docs/specialty/international/localized-versions) — Google Search Central. **Tier 1.**

**Flagged myth:** "Setting `lang` correctly helps Google detect page language for ranking/hreflang purposes" is **directly contradicted** by the cited primary source. Keep `lang` accurate for its genuine, documented purposes (browser translate UI, screen-reader pronunciation — accessibility/UX, out of this module's scope), not as an SEO language-signal.

---

## 7. Visible text vs. markup: cloaking and structured-data content-parity policy

### R10 — Never serve different content/markup to crawlers than to users

**Rule:** The HTML (including any structured data) returned for Googlebot's user agent must be identical in substance to what a human visitor on the same URL receives. No user-agent-conditional content swap for search-facing purposes.

**Mechanism (documented):** Google's spam policies define cloaking as "the practice of presenting different content to users and search engines with the intent to manipulate search rankings and mislead users," citing explicit examples such as "showing a page about travel destinations to search engines while showing a page about discount drugs to users" and "inserting text or keywords into a page only when the user agent that is requesting the page is a search engine, not a human visitor." Violation can cause a site to "rank lower in results or not appear in results at all."

**Acceptance criterion:** No server or edge logic branches response content on `User-Agent` matching a search-crawler signature (Googlebot, Bingbot, etc.) in a way that changes visible text, links, or structured data. (Legitimate, explicitly-allowed exceptions: paywalls implementing Google's Flexible Sampling guidance; `Vary: User-Agent` for responsive/adaptive serving without content differences.)

**Verification:** `curl -A "Googlebot/2.1"` vs. a normal browser UA against the same URL and diff the rendered HTML; confirm no divergence beyond allowed exceptions.

**Source:** [Spam policies for Google Search — Cloaking](https://developers.google.com/search/docs/essentials/spam-policies#cloaking) — Google Search Central. **Tier 1.**

---

### R11 — Structured data must describe only content that is actually visible on the page

**Rule:** Every JSON-LD/structured-data property must correspond to content a human visitor can actually see (or, for genuinely gated content, content that is accessible under Google's Flexible Sampling policy). Never add a structured-data property "for the rich result" when the underlying visible content doesn't support it.

**Mechanism (documented):** Google's general structured-data guidelines state directly: "Don't mark up content that is not visible to readers of the page," and require that structured data be "a true representation of the page content" — giving explicit counter-examples (e.g., a streaming site mismarking broadcasts as local events). Violations can trigger a manual action that strips rich-result eligibility.

**Acceptance criterion:** For every structured-data type emitted by this codebase (e.g. `Article`, `Product`, `Organization`, `FAQPage` where still applicable), every property value used in the schema is traceable to visible, on-page content in the same document.

**Verification:** Pick a sample of pages per collection; diff the JSON-LD payload's field values against the rendered page text; confirm no field (price, rating, name, description) appears only in markup and not in visible HTML.

**Source:** [General structured data guidelines](https://developers.google.com/search/docs/appearance/structured-data/sd-policies) — Google Search Central. **Tier 1.**

---

### R12 — Content hidden behind tabs/accordions in the DOM is not devalued, provided it is genuinely present in the HTML

**Rule:** Content that is collapsed for UX (accordions, tabs, "read more" expanders) is safe to keep in the initial DOM (`display:none`/`hidden`/CSS-collapsed) rather than lazy-injecting it only on user interaction, when the goal is for that content to be indexed.

**Mechanism:** With mobile-first indexing, Google has stated (via named spokespeople, reported by industry press, not a Search Central doc page) that UX-hidden content receives full indexing weight provided it exists in the rendered HTML — Gary Illyes: "in the mobile-first world content hidden for UX should have full weight" (2016); John Mueller reaffirmed this in a 2020 Webmaster Central office-hours session. **This is Tier 3** (attributed, dated spokesperson statements reported by named outlets), not a Search Central documentation page — treat it as strong but secondary evidence, and note it does not resolve the practitioner-reported gap between this stated policy and some observed real-world ranking behavior.

**Acceptance criterion:** Accordion/tab components render their full content into the DOM on initial page load (verifiable via "View Source" / SSR'd HTML, not only via post-hydration JS injection); content is CSS-hidden (`display:none`/`hidden` attribute), not absent from the markup.

**Verification:** `curl` the page (no JS execution) and confirm accordion body text is present in the raw HTML response.

**Source:** Reported statements from Gary Illyes (2016) and John Mueller (2020 Webmaster Central office hours), as documented by [Search Engine Journal, "Tabbed Content: Is It A Google Ranking Factor?"](https://www.searchenginejournal.com/ranking-factors/tabbed-content/). **Tier 3** — named, dated, attributed spokesperson statement, not a primary Google doc page.

---

## 8. ARIA attributes and indexing

### R13 — Do not add ARIA attributes for an SEO or AI-extraction benefit; use them only for their accessibility purpose

**Rule:** ARIA roles/attributes (`aria-label`, `role`, etc.) are added exclusively to satisfy accessibility requirements (screen-reader labeling, widget semantics). No PR justifies an ARIA addition as an SEO or LLM-visibility improvement.

**Mechanism (documented, Tier 3):** John Mueller has stated: "I could only imagine `aria-label` potentially being useful for indexing, and I don't see that happening when I try — so my assumption would be that we don't use these for search," and "I don't think they'd affect crawling or indexing otherwise, since they're attributes on links, and don't replace them." Martin Splitt has separately said: "I wouldn't rely on ARIA for SEO." These are direct Google-spokesperson statements, reported by a named industry outlet — **Tier 3**, not a Search Central documentation page, because no such page was located addressing ARIA and indexing directly.

**Acceptance criterion:** No commit message, PR description, or code comment cites "for SEO"/"for AI crawlers" as the rationale for an ARIA attribute; ARIA usage is justified solely by WCAG/accessibility need.

**Verification:** `git log --oneline --all | xargs -I{} git show {} | grep -i "aria.*seo\|seo.*aria"` (manual review) across recent history; going forward, flag any such PR rationale in review.

**Source:** John Mueller and Martin Splitt, Google, as reported in [Search Engine Roundtable, "Does Google Search Use ARIA? Likely Not."](https://www.seroundtable.com/google-search-aria-38291.html). **Tier 3** (reported, attributed spokesperson statement — not a primary Google documentation page).

**Flagged myth:** "ARIA labels boost SEO" is **widely repeated and directly contradicted** by the only Google statements located on the topic. Treat any "ARIA for SEO" rationale in this codebase as unsupported.

---

## 9. Text alternatives for video content

### R14 — Provide accurate captions/transcripts for video content that conveys information not otherwise present as text on the page

**Rule:** Any video embed whose audio conveys information not duplicated elsewhere on the page (e.g. a product-explainer voiceover) ships with an accurate caption track / transcript, not solely auto-generated captions left unreviewed.

**Mechanism (documented, narrow and platform-specific):** YouTube's own transcript feature exposes a searchable transcript panel — "you'll see a search bar above the transcript where you can type the word you want to search, and it will highlight all instances of the word" — meaning caption/transcript text is directly used by YouTube's own player-level search-within-video feature. This is a documented, platform-specific extraction mechanism (search within the transcript panel), **not** a confirmed Google Search ranking or AI Overview citation mechanism — no Search Central page was found extending this claim to web-search ranking.

**Acceptance criterion:** Every embedded video with substantive spoken content has an available, reviewed (not raw-auto-generated) caption track; the transcript is either the YouTube-hosted transcript or an on-page transcript block for self-hosted video.

**Verification:** For YouTube embeds: confirm captions are enabled and "reviewed" (spot-check against reported inaccuracies); for self-hosted `<video>`, confirm a `<track kind="captions">` element and/or on-page transcript text.

**Source:** [View video transcripts — YouTube Help](https://support.google.com/youtube/answer/15930243?hl=en-GB). **Tier 2** (first-party platform doc — YouTube, a Google product, but not the Search Central corpus).

**What could not be documented:** No Tier 1 Google Search Central source located tying video transcripts/captions directly to web-search ranking or AI Overview citation. Any such broader claim is `Convention — not vendor-confirmed`.

---

## Summary of explicit flags

**Deprecated / materially changed:**
- WHATWG's sectioning-root outline algorithm was replaced by a flat heading-level model in [PR #7829](https://github.com/whatwg/html/pull/7829) (merged 2022-07-01) — no browser or AT ever implemented the old algorithm; any internal doc still describing heading-level-via-nesting is describing dead behavior (R3).
- Several Google structured-data rich-result types were retired June 2025–May 2026 (Book Actions, Course Info, Claim Review, Estimated Salary, Learning Video, Special Announcement, Vehicle Listing, and FAQ rich results as of 2026-05-07) — Google has stated these are search-appearance changes, not ranking changes. (Contextual note for the sibling `schema.md` file, flagged here because it bears on the table/structured-data discussion in R8/R11.)

**Practitioner claims not supported by any primary source found:**
- "One `h1` per page or Google penalizes the page" — contradicted by WHATWG (R2) and Google's own Starter Guide.
- "ARIA labels/roles boost SEO" — contradicted by the only located Google statements (R13).
- "`alt` text is a ranking factor" — Google documents it as an image-understanding/accessibility input, never as a ranking factor (R5).
- "The `lang` attribute helps Google detect page language" — directly contradicted by Google's own documentation (R9).
- "Semantic HTML5 elements (`main`/`article`/`nav`) are a documented SEO or AI-citation ranking factor" — no primary source located confirms this; Google's Starter Guide doesn't mention these elements at all (R4).
- "Marking up an HTML table gets it pulled into a Google snippet" — no current, locatable Google Search Central page confirms an active mechanism for this (R8).
