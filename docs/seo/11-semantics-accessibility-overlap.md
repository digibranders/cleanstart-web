# Semantics & Accessibility Overlap

**Module:** 11 — Semantics & accessibility overlap
**Prefix:** `SEM`
**Review cadence:** None fixed (`00-index.md` §9) — update opportunistically when a rule is found stale or a client engagement surfaces a gap.
**Scope:** Semantic HTML and accessibility properties, but **only** where a Tier 1–3 source documents an actual search or AI-extraction consequence. Heading structure, landmark elements, image `alt` text, link/anchor semantics, table markup, the `lang` attribute, UA-content parity (cloaking), hidden-content indexing, and ARIA's (non-)relationship to search.
**Evidence base:** `docs/seo/evidence/sources/semantics.md` (14 researched rules, R1–R14); `docs/seo/evidence/verification-log.md` (Semantics domain — 12 upheld, 1 refuted, 1 scope-creep; both corrections applied below: R14 dropped, R3 resolved); `docs/seo/evidence/live-capture.json` (`h1Count` per template, captured 2026-07-29); `docs/seo/evidence/tool-scoring.md` (H1 and alt-text issue-class mapping); direct live re-verification against `https://www.cleanstart.com` on 2026-07-29 — raw-HTML heading/`<main>`/`lang` tag counts via `curl` + byte-level regex (not a JS-rendered snapshot), a `curl -A Googlebot` vs. `curl -A Mozilla` diff, and repo greps for lint gates, accordion/table/anchor/ARIA patterns.

---

## Scope and boundary

This module is **not** an accessibility module. A separate practice covers WCAG conformance on its own terms — screen-reader usability, keyboard operability, color contrast, focus management, and the rest of WCAG 2.2 — and that practice is the right place to go for accessibility as its own goal. Nothing here substitutes for it, and nothing here should be read as the accessibility bar for this site.

What belongs here is narrower and more specific: the small set of semantic-HTML and accessibility properties where a primary source — WHATWG, W3C, Google Search Central, or a named platform's own documentation — states an actual consequence for crawling, indexing, ranking-adjacent behavior (title-link generation, snippet eligibility), or AI-extraction/citation. Where a property is accessibility-motivated and *also* has such a documented consequence, the rule states the documented consequence specifically and does not lean on the accessibility benefit to inflate its SEO weight. Where a widely-repeated claim ("semantic HTML5 tags help Google understand your page," "ARIA labels boost SEO") has **no** primary source connecting it to search or AI extraction, the property either does not appear here at all, or it appears labelled `Convention — not vendor-confirmed` with the absence of evidence stated plainly — never presented as if it carried vendor authority it does not have.

Two of the rules below (`SEM-04`, `SEM-12`) rest on their strongest available citation being a **Tier 3 spokesperson statement** (a named Google engineer, quoted and dated, reported by a named industry outlet) rather than a Search Central documentation page. That is real evidence, but it is weaker than a primary doc, and both rules say so in their `Source` field rather than implying vendor-documentation-grade authority.

---

## P0 — causes deindexing, traffic loss, or serves the wrong content to crawlers

### SEM-01 — Never serve different content to crawlers than to users, including via accessibility-hidden markup

- **Severity:** P0
- **Applies:** Always
- **Rule:** The HTML returned for Googlebot's user agent must be identical in substance to what a human visitor receives on the same URL. This includes accessibility-hidden content (`aria-hidden`, `sr-only`, CSS-collapsed panels) — such content is not cloaking as long as it is the *same* markup sent to every requester; cloaking is specifically a User-Agent-conditional swap, not the mere presence of visually hidden text.
- **Why:** Google's spam policies define cloaking as "the practice of presenting different content to users and search engines with the intent to manipulate search rankings and mislead users," with worked examples including "inserting text or keywords into a page only when the user agent that is requesting the page is a search engine, not a human visitor." A confirmed violation "can rank lower in results or not appear in results at all" — a P0-class outcome by this SOP's own severity model (`00-index.md` §5).
- **Acceptance:**
  - No server or edge logic branches response content on `User-Agent` matching a search-crawler signature (Googlebot, Bingbot, etc.) in a way that changes visible text, links, or structured data
  - Accessibility-hidden content (present in the DOM, hidden via CSS/`aria-hidden`) is unaffected by this rule — it is sent to every requester identically and is governed by `SEM-04`, not this one
  - Legitimate, explicitly allowed exceptions: paywalls implementing Google's Flexible Sampling guidance; `Vary: User-Agent` for responsive serving without content differences
- **Verify:** `diff <(curl -s https://www.cleanstart.com/ -A "Mozilla/5.0") <(curl -s https://www.cleanstart.com/ -A "Googlebot/2.1; +http://www.google.com/bot.html")`
- **Reference:** None — no reference implementation (no User-Agent-branching logic exists in `apps/web`, which is itself the passing state this rule requires)
- **Source:** [Tier 1] https://developers.google.com/search/docs/essentials/spam-policies#cloaking
- **Tools:** Not documented as a distinct check by any of the five tools in `tool-scoring.md` — cloaking requires a UA-differential fetch, which a single-UA crawl cannot detect; this is a manual/scripted check, not a tool-scan finding.
- **Anti-patterns:** Believing that content hidden for UX (accordions, tabs — see `SEM-04`) is somehow cloaking-adjacent because it's "different from what's visible" — it isn't; cloaking is defined by *who* receives *what*, not by whether something is visually collapsed for every requester equally.
- **Evidence:** `diff` of the home page fetched with a standard browser UA vs. `Googlebot/2.1` on 2026-07-29 produced no meaningful divergence — confirming no UA-conditional branch exists in the current deployment.
- **CleanStart:** Pass

---

## P1 — material organic or AI-visibility impact, no immediate loss

### SEM-02 — Every indexable page must render at least one real heading element in the crawlable response — zero headings is a distinct, real defect from "too many"

- **Severity:** P1
- **Applies:** Always
- **Rule:** Every indexable page must emit at least one literal `<h1>`–`<h6>` HTML tag in the response a non-JS-executing crawler receives — not merely a heading string embedded inside a React Server Component hydration payload that only becomes a real DOM element after client-side JavaScript runs. This is a distinct requirement from `SEM-08` below: having *more than one* `<h1>` is permitted and not a defect (see `SEM-08`); having *zero* real heading tags anywhere in the response is a defect with a documented mechanism, argued below.
- **Why:** Google states it looks at "the main visual title, heading elements, and other large and prominent text" to auto-generate the title link shown in search results. A page that emits zero real heading elements in its crawlable HTML removes one of these documented inputs entirely — not merely making title-link generation ambiguous (the `SEM-03` scenario, multiple competing headings) but removing that signal from the input set altogether, forcing full reliance on the `<title>` element and whatever other prominent text Google's rendering pipeline can find. This is the title-link generation mechanism, not a ranking mechanism, and it is a materially different, more severe case than "which heading is most prominent."
- **Acceptance:**
  - `grep -oE '<h[1-6][ >]'` against the raw HTTP response for a given URL returns at least one match, and at least one of those matches is an `<h1`
  - The heading text is present in the actual HTML markup returned, not only inside an embedded RSC/flight-data payload string that a non-JS-executing fetch would never parse as a heading element
- **Verify:** `curl -s https://www.cleanstart.com/events | grep -oE '<h[1-6][ >]' | wc -l` → currently `0` (expected: ≥1, with at least one `<h1`)
- **Reference:** `apps/web/src/app/events/page.tsx`, `apps/web/src/components/sections/events/UpcomingEventHero.tsx:74`; `apps/web/src/app/news/page.tsx`, `apps/web/src/components/sections/newsroom/NewsroomHero.tsx:60`; `apps/web/src/app/webinars/page.tsx`, `apps/web/src/components/sections/webinars/WebinarsHero.tsx:112`
- **Source:** [Tier 1] https://developers.google.com/search/docs/appearance/title-link — "the main visual title, heading elements, and other large and prominent text"; live defect independently confirmed against `docs/seo/evidence/live-capture.json` (`h1Count: 0` for `/events`, `/news`, `/webinars`, captured 2026-07-29) and reproduced directly via raw-response regex on 2026-07-29, separate from and consistent with the capture file.
- **Tools:** None of the five tools in `tool-scoring.md` distinguish "a heading exists only inside a JS hydration payload" from "a heading is real, parseable markup." Ahrefs' `H1 tag missing or empty` (Warning) and Semrush's `Pages without an h1 heading` (Warning) both assume a JS-executing or DOM-snapshot crawl mode; run in that mode against these three templates, they would likely report the `<h1>` as present, because the client-hydrated DOM does contain it — masking exactly the defect this rule targets. A crawl restricted to the raw HTTP response (or a genuinely no-JS fetch) is required to surface it.
- **Anti-patterns:** Trusting a JS-executing crawl tool's "H1 found" result as proof Googlebot's initial HTML fetch also contains it — see module 07 (Rendering & delivery) for the broader render-queue distinction between the initial crawl/fetch stage and the second-wave rendering pass; a heading that exists only post-hydration is invisible to whatever stage of Google's pipeline reads the raw response.
- **Evidence:** Direct `curl` + byte-level regex against all three templates on 2026-07-29 confirmed zero real `<h1>`–`<h6>` tags in each response body (308 KB for `/events` alone), against exactly one real `<h1>` (and 39 heading tags total) in the equivalent fetch of the home page. In all three cases the heading text and its `id` attribute (e.g. `events-hero-title`, matching the real `<h1 id="events-hero-title">` at `UpcomingEventHero.tsx:74`) are present in the raw response — but only as a JSON-serialized string inside the page's embedded React Server Component flight-data payload, not as parseable HTML. The heading is delivered to the client for hydration; it is not emitted as markup in the response a non-JS crawler receives.
- **CleanStart:** Fail

---

### SEM-03 — Style one heading unambiguously as the page's most prominent, for title-link generation, not for HTML validity

- **Severity:** P1
- **Applies:** Always
- **Rule:** Style and mark up one heading element per page so it is unambiguously the most prominent text on the page (largest, most prominent placement — typically the first `<h1>`). This is about title-link *generation predictability*, not about heading count — see `SEM-08` for why a second, third, or further `<h1>` is not itself a problem.
- **Why:** Google states it looks at "the main visual title, heading elements, and other large and prominent text" to auto-generate the title link, and that when multiple headings carry equal visual weight, "Google Search may use the first heading as the text for the title link" — an ambiguous heading hierarchy produces an unpredictable, possibly wrong, title link. This is a title-link generation mechanism, not a ranking mechanism.
- **Acceptance:**
  - The page has one heading whose computed font-size/weight/placement makes it unambiguously dominant over all sibling headings
  - A real `<h1>` tag exists in the crawlable response (the `SEM-02` precondition) and reads, to a human scanning the rendered page, as the obvious page title
- **Verify:** `curl -s https://www.cleanstart.com/ | grep -oE '<h1[ >]' | wc -l` → `1` (existence/count check; visual-prominence dominance requires a manual/computed-style spot check this rule does not automate)
- **Reference:** `apps/web/src/components/sections/home/HeroHeading.tsx`, `apps/web/src/components/sections/_shared/DetailHero.tsx` (the shared listing/detail-page hero primitive `CLAUDE.md` designates for this exact pattern)
- **Source:** [Tier 1] https://developers.google.com/search/docs/appearance/title-link
- **Tools:** No tool in `tool-scoring.md` scores visual-prominence dominance directly — H1-count checks (see `SEM-08`'s Tools field) verify presence/count, not computed-style hierarchy.
- **Anti-patterns:** Multiple headings styled identically with no visual hierarchy, causing Google to guess which is the title; hiding the true title in a `<div>` styled to look larger than the actual `<h1>` — Google explicitly instructs "make it clear which text is the main title."
- **Evidence:** Live-capture confirms exactly one `<h1>` on 53 of the 56 templates captured with a `head` snapshot (2026-07-29); the remaining 3 (`/events`, `/news`, `/webinars`) are `SEM-02`'s zero-heading defect, tracked separately. Computed-style dominance (font-size/weight/placement relative to sibling headings) was not spot-checked against rendered CSS in this pass.
- **CleanStart:** Unverified — heading presence/count confirmed via `live-capture.json` and direct `curl`, but visual-prominence (computed font-size/weight/placement vs. sibling headings) was not checked against rendered styles in this pass

---

### SEM-04 — Content collapsed for UX (accordions, tabs) is not devalued, provided it is genuinely present in the initial DOM

- **Severity:** P1
- **Applies:** Any page using collapsible/accordion or tab-panel UI for genuine content
- **Rule:** Content that is collapsed for UX (accordions, tabs, "read more" expanders) is safe to keep in the initial DOM (CSS-collapsed via `display:none`/`max-height:0`/`grid-template-rows:0fr`, or the `hidden` attribute) rather than lazy-injecting it only on user interaction, when the goal is for that content to be indexed.
- **Why:** With mobile-first indexing, Google has stated — via named spokespeople, reported by industry press, not a Search Central doc page — that UX-hidden content receives full indexing weight provided it exists in the rendered HTML. Gary Illyes (2016): "in the mobile-first world content hidden for UX should have full weight"; John Mueller reaffirmed this in a 2020 Webmaster Central office-hours session. **This is Tier 3** — an attributed, dated spokesperson statement reported by a named outlet, not a Search Central documentation page — treat it as strong but secondary evidence.
- **Acceptance:**
  - Accordion/tab components render their full content into the DOM on initial page load, verifiable via the raw HTTP response (not only via post-hydration JS injection)
  - Content is CSS-hidden (`display:none`/`hidden`/collapsed height), not absent from the markup
- **Verify:** `curl -s https://www.cleanstart.com/ | grep -c "Frequently Asked Questions"` (spot-check: confirms FAQ answer text is present in the raw response, not injected only on click)
- **Reference:** `apps/web/src/components/sections/home/FrequentlyAskedQuestions.tsx:195-221` (`grid-template-rows` collapse), `apps/web/src/components/sections/guide/GuideDetailFAQ.tsx:93-122` and `apps/web/src/components/sections/blog/BlogDetailFAQ.tsx:91-120` (`max-height`/`overflow:hidden` collapse) — all three always render `{item.a}` regardless of open state and set `aria-hidden={!isOpen}` on the panel, correctly separating "visually collapsed" from "absent"
- **Source:** Convention — not vendor-confirmed as Tier 1/2 documentation, but retained per `00-index.md` §6's "genuinely useful" allowance: reported statements from Gary Illyes (2016) and John Mueller (2020 Webmaster Central office hours), as documented by [Search Engine Journal, "Tabbed Content: Is It A Google Ranking Factor?"](https://www.searchenginejournal.com/ranking-factors/tabbed-content/) — a named, dated, attributed spokesperson statement (Tier 3), not a primary Google doc page.
- **Tools:** Not documented as a distinct issue by the five tools in `tool-scoring.md` — a tool doing a JS-rendered crawl would see collapsed content as present either way (CSS-hidden or hydration-injected), so this rule requires inspecting the raw, pre-hydration response specifically, which most SEO crawl tools do not surface as a separate signal from the rendered DOM.
- **Anti-patterns:** Rebuilding an accordion so the answer text is only mounted into the DOM on click (a common "performance" refactor) — this silently converts indexed content into content invisible to a crawler reading the initial response, the opposite of the intended optimization.
- **Evidence:** All three FAQ/accordion implementations found in `apps/web/src` (home, guide detail, blog detail) use a CSS-collapse pattern that always renders the answer text into the DOM — confirmed by direct code read, 2026-07-29. The one component using true click-mounted panels (`apps/web/src/components/ui/accordion.tsx`, wrapping `@base-ui/react/accordion` with no `keepMounted` prop) is used only in `apps/web/src/components/nav/MobileNav.tsx` — mobile navigation chrome, not indexable content — so this rule's concern does not apply to it.
- **CleanStart:** Pass

---

## P2 — meaningful improvement, non-urgent

### SEM-05 — Every content-bearing image has accurate, descriptive `alt` text — an image-understanding input, not a ranking factor

- **Severity:** P2
- **Applies:** Always
- **Rule:** Populate `alt` on every content image with a concise, accurate description of the image in the context of the page; leave `alt=""` only for genuinely decorative images. Do not justify this requirement in code review as a direct ranking factor — it isn't documented as one.
- **Why:** Google states: "Google uses alt text along with computer vision algorithms and the contents of the page to understand the subject matter of the image" — this is specifically documented as an input to Google Images/image-search understanding, not as a general page-ranking signal. Google separately warns that keyword-stuffed `alt` text "results in a negative user experience and may cause your site to be seen as spam."
- **Acceptance:**
  - Zero content `<img>`/`<Image>` elements with missing or empty `alt` (excluding intentionally decorative images per the project's `aria-hidden` convention)
  - No `alt` value is a raw, comma-separated keyword list
- **Verify:** `grep -rn 'alt=""' apps/web/src/components | wc -l` cross-checked manually against `aria-hidden`/decorative-image convention per file
- **Reference:** `apps/web/src/components/sections/blog/BlogDetailAuthor.tsx:55-119` (`alt={author.photo?.alt ?? author.name}` — descriptive fallback chain, never empty for content images), `apps/web/src/components/sections/ciso/CisoComparison.tsx:128-146` (decorative glow images correctly pair `alt=""` with `aria-hidden`)
- **Source:** [Tier 1] https://developers.google.com/search/docs/appearance/google-images
- **Tools:** Screaming Frog and Sitebulb both bucket generic missing-alt findings at the bottom of their priority scale (Low); Semrush places it in a medium-severity Warning tier; Ahrefs has moved toward classifying images as content/decorative/tracking specifically because blanket alt-text flags produce noise on non-content images. Per `tool-scoring.md`'s own reasoning, severity genuinely hinges on image *role* (content vs. decorative vs. tracking), which is why this rule is scored P2 rather than a flat higher tier — it requires per-image classification, not a blanket count.
- **Anti-patterns:** "`alt` text is a direct ranking factor" is **not** what Google's documentation says — the cited page frames `alt` as an image-understanding and accessibility input, explicitly not a keyword-stuffing opportunity. Treat "ranking factor" framing as `Convention — not vendor-confirmed`, and "image-search understanding signal" framing as Tier 1-documented.
- **Evidence:** Spot-check of ~20 files under `apps/web/src/components` (2026-07-26) found 327 instances of `alt=""` (concentrated on decorative icon/glow images, many already paired with `aria-hidden`), 20 static descriptive `alt="..."` values, and 47 dynamic `alt={...}` expressions — every sampled dynamic case resolved to descriptive content with a sensible fallback (e.g. `post.heroImage.alt ?? post.title`), never an empty string for a content image.
- **CleanStart:** Unverified — spot-checked ~20 files with no violations found; no full axe-core/Lighthouse accessibility scan was run across the site in this pass to confirm zero violations at the acceptance-criterion's stated scope

---

### SEM-06 — When an image is the sole content of a link, its `alt` text becomes that link's anchor text

- **Severity:** P2
- **Applies:** Any `<a>` whose only child is an image, with no adjacent text
- **Rule:** For any `<a>` that wraps only an `<img>`/`<Image>` with no adjacent text, write `alt` as if it were the link's anchor text — descriptive of the destination, not just the image.
- **Why:** Google states explicitly: "For images used as links, Google uses the `alt` attribute of the `img` element as anchor text." This is a directly documented mechanism connecting an accessibility attribute to a specific extraction behavior (how the destination page gets described to Google), not a general accessibility benefit.
- **Acceptance:** Every `<a><img alt="..."/></a>` pattern (no sibling text node) has `alt` text that describes the link destination, not merely the visual content of the image.
- **Verify:** `grep -rn 'aria-label="CleanStart home"' apps/web/src/components/nav/Header.tsx`
- **Reference:** `apps/web/src/components/nav/Header.tsx:30-45` (logo link, `aria-label="CleanStart home"` wrapping `<img alt="CleanStart">`), `apps/web/src/components/sections/Footer.tsx:177-192` (footer logo/social links, same pattern), `apps/web/src/components/sections/blog/BlogDetailAuthor.tsx:55-119` (`aria-label={"Read more about " + name}` wrapping a descriptively-alt'd author photo)
- **Source:** [Tier 1] https://developers.google.com/search/docs/crawling-indexing/links-crawlable
- **Tools:** Not documented as a distinct issue class in `tool-scoring.md` — image-link alt-as-anchor-text is a sub-case of general alt-text auditing (`SEM-05`), and no surveyed tool separates it out.
- **Anti-patterns:** Writing `alt="blue button"` on an image-only link instead of `alt="CleanStart pricing page"` — describes the pixel, not the destination, giving Google no differentiating anchor-text signal.
- **Evidence:** Every image-only link sampled in `apps/web/src` (nav logo, footer logo/social icons, blog author photo) pairs a descriptive `alt` on the image with (in every case found) an additional `aria-label` on the wrapping `<a>` — exceeding this rule's minimum requirement rather than merely meeting it.
- **CleanStart:** Pass

---

### SEM-07 — Links are real `<a href="...">` elements with descriptive text, never `onclick`-only navigation

- **Severity:** P2
- **Applies:** Always
- **Rule:** Every navigable link is an `<a>` element with a resolvable `href`; anchor text is descriptive of the destination page, not generic ("click here," "read more" with no surrounding context).
- **Why:** Google states plainly: "Google can only crawl your link if it's an `<a>` HTML element with an `href` attribute." Formats like `<span onclick="...">` or `<a>` without `href` are non-crawlable or unreliable. On anchor text specifically: "Good anchor text is descriptive, reasonably concise, and relevant to the page that it's on and to the page it links to," and "the better your anchor text, the easier it is for people to navigate your site and for Google to understand what the page you're linking to is about" — the same descriptive-text requirement screen readers rely on when they list a page's links out of surrounding context.
- **Acceptance:**
  - No internal navigation relies solely on `onclick`-driven `<div>`/`<span>` elements without a real `<a href>` fallback
  - No anchor text is a bare "click here"/"here"/"read more" with no descriptive surrounding sentence
- **Verify:** `grep -rn '<div onClick\|<span onClick' apps/web/src | wc -l` → `0`
- **Reference:** None — no reference implementation (no `onclick`-only navigation pattern exists in `apps/web/src`, which is itself the passing state)
- **Source:** [Tier 1] https://developers.google.com/search/docs/crawling-indexing/links-crawlable
- **Tools:** Not documented as a distinct issue by the five tools in `tool-scoring.md` at the codebase-pattern level — crawl tools report the downstream symptom (a page that's unreachable) rather than diagnosing "built with `onclick`, not `<a href>`" as the cause.
- **Anti-patterns:** JS-only "links" with no `<a href>` at all — Google may not crawl them; anchor text identical across many destinations ("click here" repeated site-wide), which per Google's own wording gives no differentiating signal.
- **Evidence:** A targeted regex for `<(div|span)[^>]{0,200}onClick` returned zero matches in `apps/web/src` (2026-07-26); a separate case-insensitive search for bare `>click here<`, `>read more<`, or `>here<` anchor text also returned zero matches.
- **CleanStart:** Pass

---

## P3 — hygiene, marginal or speculative gain

### SEM-08 — Multiple `<h1>` elements are permitted; do not treat H1 count as an HTML-validity or ranking rule

- **Severity:** P3
- **Applies:** Always
- **Rule:** Do not block a build, fail a lint rule, or reject a design on the grounds that a page has more than one `<h1>`. This survives verification in full and directly contradicts one of the most widely-taught rules in SEO practice — the belief that "one `<h1>` per page, or Google penalizes you" is not merely unproven, it is actively contradicted by both the HTML spec and Google's own guidance.
- **Why:** The WHATWG HTML Standard explicitly permits multiple top-level headings — its own current spec text reads "if a document has one or more headings, at least a single heading within the outline should have a heading level of 1" (note: **"should," not "must"**) — and its worked "Alphabetic Fruit" example uses three separate sibling `<h1>` elements to demonstrate the point. Independently, Google's SEO Starter Guide states outright: "Having your headings in semantic order is fantastic for screen readers, but from Google Search perspective, it doesn't matter if you're using them out of order," and "there's also no magical, ideal amount of headings a given page should have." Two independent Tier 1 sources — one a spec body, one a search engine — agree from unrelated directions.
- **Acceptance:**
  - No CI/lint rule fails a build solely because `document.querySelectorAll('h1').length > 1`
  - An H1 count of 2+ is not, by itself, logged as an SEO defect in any audit tooling this team runs
- **Verify:** `grep -rniE "h1.{0,40}(only one|must have exactly|max.?1)" apps/web/eslint.config.* apps/web/src` → no match expected
- **Reference:** No `.eslintrc*` file exists in `apps/web` in the pre-flat-config sense; `apps/web/eslint.config.*` contains no rule keyed on H1 count (verified 2026-07-29)
- **Source:** [Tier 1] https://html.spec.whatwg.org/multipage/sections.html#headings-and-sections (HTML Standard §4.3.11, current text) and [Tier 1] https://developers.google.com/search/docs/fundamentals/seo-starter-guide (SEO Starter Guide, heading-tags section). John Mueller's fuller, corroborating (but non-load-bearing) Tier 3 statement, as reported: "Our systems don't have a problem when it comes to multiple h1 headings on a page... You can use H1 tags as often as you want on a page. There's no limit, neither upper nor lower bound."
- **Tools:** Ahrefs has no documented "Multiple H1" check at all; Semrush classifies "Pages with more than one H1 tag" as a **Notice** that explicitly does not affect Site Health score; Screaming Frog flags it as a Warning (Medium); Sitebulb rates it Low; Lighthouse has no dedicated SEO-category H1 audit. Every tool that scores it at all treats it as, at most, a low-priority notice — consistent with this rule's own P3 assignment and with no tool treating it as an error.
- **Anti-patterns:** Rejecting a Figma-to-code implementation in review because it has "two H1s" with no further justification — ask what the actual, cited concern is; per the sources above, there usually isn't one.
- **Background:** Not a rule — background context only. WHATWG's older "outline algorithm" — which inferred a heading's *effective* level from nesting inside `<section>`/`<article>`/`<aside>`, independent of its literal `<h1>`–`<h6>` value — was removed from the spec by [PR #7829](https://github.com/whatwg/html/pull/7829), merged 2022-07-01T04:24:24Z, specifically because "no browser or assistive-technology user agent ever implemented" it. This is included here only as background for why the flat, literal heading-level model above is the current and only correct mental model — it is not, itself, a SEM rule: no Google Search Central page or AI-extraction source ties this particular spec change to a search consequence, and asserting one would be scope creep beyond what this module documents (`verification-log.md` correction #32). Do not build internal tooling that infers heading level from sectioning-element nesting; use the literal `<h1>`–`<h6>` value directly.
- **Evidence:** No hit for an H1-count-based lint rule in `apps/web`'s ESLint config or elsewhere in the repo (grepped 2026-07-29) — CleanStart does not currently block on this non-issue, so there is no myth-driven friction to correct.
- **CleanStart:** Pass

---

### SEM-09 — Genuinely tabular data (pricing tiers, comparison grids, spec sheets) uses real `<table>`/`<th>` markup, with `scope`/`headers` where the association isn't visually obvious

- **Severity:** P3
- **Applies:** Any page presenting matrix-shaped tabular data (pricing tiers, comparison grids, spec sheets)
- **Rule:** Data that is a matrix of rows/columns is marked up as `<table>`/`<tr>`/`<th>`/`<td>`, with `scope` or `headers` used whenever a row/column header does not simply align with its data cells by visual position.
- **Why:** The HTML Standard defines an explicit "header-associated cells" algorithm keyed off `scope`/`headers`, letting software programmatically determine which header(s) apply to a data cell rather than relying on visual grid position — a machine-extraction mechanism, not a purely visual one. No current Google Search Central page ties `<table>`/`<th>`/`scope` markup to a specific ranking or snippet feature (the historical "structured snippets" feature that pulled table data into search snippets has no locatable current Google documentation page) — treat any claim that Google "extracts your HTML table into a snippet" as `Convention — not vendor-confirmed`, not as a documented mechanism. The rule is retained at P3 (not excluded) because the underlying machine-extraction property — a screen reader or any other structural parser being able to programmatically determine header association — is itself Tier 1-documented, even without a confirmed Google ranking hook.
- **Acceptance:**
  - No tabular data is built from `<div>` grids with only visual (CSS Grid/Flexbox) row/column alignment and no `<table>` semantics
  - Every `<table>` has at least one `<th>`; multi-level header tables use `scope`/`headers`
- **Verify:** `grep -rln "<table" apps/web/src | wc -l`
- **Reference:** `apps/web/src/lib/renderLexical.tsx:316-340` (CMS-authored blog-body tables — real `<table>`/`<th>`/`<td>`, but currently emit no `scope`/`headers` attributes); `apps/web/src/components/sections/pricing/PricingPlans.tsx:75`, `apps/web/src/components/sections/pricing/PricingTiers.tsx:120`, `apps/web/src/components/sections/ciso/CisoComparison.tsx` (hand-built marketing comparison/pricing layouts — CSS Grid/Flexbox `<div>` cards, no `<table>` semantics, despite being exactly the "pricing tiers, comparison tables" example this rule names)
- **Source:** [Tier 1] https://html.spec.whatwg.org/multipage/tables.html#table-headers-header-associations (HTML Standard §4.9.12); [Tier 1] https://www.w3.org/WAI/tutorials/tables/ (W3C WAI Tables Tutorial — accessibility-extraction mechanism, not a documented SEO-ranking claim; returns 403 to automated `curl`-style checks but is retrievable via a standard browser/WebFetch client, per `verification-log.md` correction #8's general finding about this class of W3C URL); absence check: [How Google auto-generates snippets](https://developers.google.com/search/docs/appearance/snippet) makes no mention of HTML tables as a snippet source.
- **Tools:** Not documented as a distinct issue by any of the five tools in `tool-scoring.md` — div-vs-table markup choice is a code-review-level pattern, not something a URL-level crawl scores.
- **Anti-patterns:** Claiming "Google will pull our pricing table into a rich snippet" as the justification for real `<table>` markup — no current Tier 1 source supports that specific claim; the real, defensible justification is programmatic header/data-cell association for any structural parser (screen readers today, plausibly other machine consumers).
- **Evidence:** No `<table>` element exists anywhere in `apps/web/src` outside CMS rich-text rendering; `PricingPlans.tsx`, `PricingTiers.tsx`, and `CisoComparison.tsx` — CleanStart's own pricing-tier and comparison layouts, matching this rule's named examples exactly — are built as CSS Grid/`<div>` card layouts with no table semantics. Blog-body tables rendered via `renderLexical.tsx` are real `<table>` markup but emit no `scope`/`headers` attributes even on multi-column tables.
- **CleanStart:** Partial

---

### SEM-10 — Set `<html lang>` accurately, but do not claim it is Google's language-detection mechanism

- **Severity:** P3
- **Applies:** Always
- **Rule:** Every page sets an accurate `lang` attribute on `<html>` matching the actual language of the visible content. Do not justify this requirement in code review as "so Google knows what language the page is in" — that is not the documented mechanism.
- **Why:** Google states directly: "Google doesn't use `hreflang` or the HTML `lang` attribute to detect the language of a page; instead, we use algorithms to determine the language" from the page's visible content. Google's actual guidance for helping it detect language correctly is to "use a single language for content and navigation on each page" and avoid side-by-side translations — the documented mechanism is content-based language detection, not the `lang` attribute. `lang` remains genuinely worth setting correctly for its real, documented purposes — screen-reader pronunciation, browser translate-prompt accuracy — which are accessibility/UX mechanisms, out of this module's search-consequence scope, not an SEO language-signal.
- **Acceptance:**
  - `<html lang>` is present and accurate on every page
  - No single-page content mixes two languages in a way that could confuse Google's content-based detection (separate from intentionally bilingual UI strings)
- **Verify:** `curl -s https://www.cleanstart.com/ | grep -o '<html[^>]*lang="[^"]*"'` → `lang="en"`
- **Reference:** `apps/web/src/app/layout.tsx:160`
- **Source:** [Tier 1] https://developers.google.com/search/docs/specialty/international/localized-versions
- **Tools:** Not applicable — no tool in `tool-scoring.md` scores `lang`-attribute correctness as an SEO-language-detection issue; this is a documentation-wording rule (don't misattribute the mechanism), not a tool-scored defect.
- **Anti-patterns:** Describing `lang` in an internal runbook or PR description as helping Google detect language for ranking or `hreflang`-matching purposes — directly contradicted by the cited primary source. See module C1 (International & hreflang) for the actual, correct mechanisms governing locale targeting.
- **Evidence:** `apps/web/src/app/layout.tsx:160` sets `lang="en"` on the root `<html>` element (confirmed live 2026-07-29); CleanStart is presently single-locale with no bilingual-content-mixing pattern found, so the content-based-detection risk this rule warns about does not currently apply.
- **CleanStart:** Pass

---

### SEM-11 — Use `<main>`/`<article>`/`<nav>` for their structural purpose; do not claim a documented ranking or AI-citation boost for doing so

- **Severity:** P3
- **Applies:** Always
- **Rule:** Use `<main>` once per page for the primary content region; use `<article>` for self-contained, independently distributable content; use `<nav>` for navigation blocks. Do not justify this in code review as "for SEO" beyond what is documented below — the honest justification is structural/accessibility, and this rule exists specifically to prevent that accessibility-motivated work from being inflated with an SEO claim no primary source supports.
- **Why:** WHATWG defines `<article>` as content that is "independently distributable or reusable," `<nav>` as "a section that links to other pages or to parts within the page," and `<main>`/sectioning elements as machine-parseable structural signals — a Tier 1 structural definition, not a search-ranking claim. W3C WAI-ARIA separately defines landmark roles (`main`, `navigation`, `banner`, `contentinfo`, etc.) as regions intended to "help users navigate pages more efficiently" via assistive technology — a Tier 1 accessibility-navigation mechanism, not a search/AI-extraction one. No Google Search Central page located in this research ties `<main>`/`<article>`/`<nav>` markup to indexing, ranking, or AI Overview eligibility; Google's own SEO Starter Guide does not use the words "semantic," "`<main>`," "`<article>`," "`<nav>`," or "landmark" anywhere in its current text. This is the largest gap found in this domain between practitioner claims ("semantic HTML5 tags help Google understand your page") and what any Tier 1–3 source actually states — hence the `Convention — not vendor-confirmed` label below, stated plainly rather than implied to carry authority it doesn't have.
- **Acceptance:**
  - Exactly one `<main>` per page
  - Navigation regions use `<nav>`
  - Content-review comments citing "semantic HTML for SEO" link to a specific accessibility/maintainability rationale rather than an unverified ranking claim
- **Verify:** `curl -s https://www.cleanstart.com/ | grep -oE '<main[ >]' | wc -l` → `1`
- **Reference:** `apps/web/src/app/page.tsx:91` (`<main id="main-content">`, the shared skip-link-target pattern used per-route across `apps/web/src/app/**/page.tsx`)
- **Source:** [Tier 1] https://html.spec.whatwg.org/multipage/sections.html (HTML Standard §4.3, structural definition); [Tier 1] https://www.w3.org/TR/wai-aria-1.2/#landmark_roles (WAI-ARIA 1.2 §5.4, accessibility-navigation mechanism, not search/AI extraction; returns 403 to `curl`-style automated checks but is retrievable via a standard browser/WebFetch client); absence check: [SEO Starter Guide: The Basics](https://developers.google.com/search/docs/fundamentals/seo-starter-guide) contains no statement on this topic. **Labelled `Convention — not vendor-confirmed`** for the specific claim "these elements are an SEO/AI-citation ranking factor" — no primary source located connects them to search.
- **Tools:** Not applicable — no tool in `tool-scoring.md` scores landmark-element usage as an SEO issue class; this is purely a documentation/code-review-framing rule.
- **Anti-patterns:** "Semantic HTML5 elements are an SEO/AI-citation ranking factor" is widely repeated and not supported by any primary source located in this research. Mark this `Convention — not vendor-confirmed`; do not let it inflate accessibility work with unearned SEO justification.
- **Evidence:** `apps/web/src/app/page.tsx:91` and the equivalent per-route pattern across `apps/web/src/app/**/page.tsx` render exactly one `<main id="main-content">`, confirmed live on the home page (2026-07-29); no PR description, commit message, or code comment reviewed in this pass or the accompanying `SEM-12` grep cites landmark elements as an SEO rationale.
- **CleanStart:** Pass

---

### SEM-12 — ARIA attributes are added only for their accessibility purpose, never for an SEO or AI-extraction benefit

- **Severity:** P3
- **Applies:** Always
- **Rule:** ARIA roles/attributes (`aria-label`, `role`, etc.) are added exclusively to satisfy accessibility requirements (screen-reader labeling, widget semantics). No PR justifies an ARIA addition as an SEO or LLM-visibility improvement.
- **Why:** John Mueller has stated: "I could only imagine `aria-label` potentially being useful for indexing, and I don't see that happening when I try — so my assumption would be that we don't use these for search," and "I don't think they'd affect crawling or indexing otherwise, since they're attributes on links, and don't replace them." Martin Splitt has separately said: "I wouldn't rely on ARIA for SEO." **These are direct Google-spokesperson statements, reported by a named industry outlet — Tier 3, not a Search Central documentation page** — because no such page was located addressing ARIA and indexing directly. Retained under the same weaker-evidence-but-genuinely-useful allowance as `SEM-04`.
- **Acceptance:**
  - No commit message, PR description, or code comment cites "for SEO"/"for AI crawlers" as the rationale for an ARIA attribute
  - ARIA usage is justified solely by WCAG/accessibility need
- **Verify:** `grep -rniE "aria.{0,20}seo|seo.{0,20}aria" apps/web/src apps/cms/src | wc -l` → `0`
- **Reference:** None — no reference implementation (the rule is a review-discipline/framing constraint, not a code pattern to point at)
- **Source:** Convention — not vendor-confirmed as Tier 1/2 documentation: John Mueller and Martin Splitt, Google, as reported in [Search Engine Roundtable, "Does Google Search Use ARIA? Likely Not."](https://www.seroundtable.com/google-search-aria-38291.html) — a reported, attributed spokesperson statement (Tier 3), not a primary Google documentation page.
- **Tools:** Not applicable — no tool in `tool-scoring.md` scores ARIA usage as an SEO issue class; the only surfaced risk here is a mis-justification in review, not a scannable code pattern.
- **Anti-patterns:** "ARIA labels boost SEO" is widely repeated and directly contradicted by the only Google statements located on the topic. Treat any "ARIA for SEO" rationale encountered in this codebase as unsupported.
- **Evidence:** 492 combined `aria-label`/`role=` usages found across `apps/web/src` and `apps/cms/src` (242 web, 250 cms); a targeted grep pairing "aria" and "seo" in the same line returned zero hits, and the last 20 `git log` entries matching "aria" (e.g. `9c2d087c feat(cms): hover tooltips + aria-labels on every editor toolbar button`, `921daad8 fix(web): correct heading semantics in nav mega-menu and FAQ accordions`) are all framed as accessibility work, not SEO work.
- **CleanStart:** Pass
