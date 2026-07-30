# Performance & Core Web Vitals — SOP Source Evidence

Compiled for the cross-project SOP governing performance/CWV requirements on every site this team builds. Every rule below is sourced to a primary or near-primary document; each requirement gives the rule, the causal mechanism, an objectively testable acceptance criterion, and a verification method.

**Tier key:** Tier 1 = web.dev / Chrome team / W3C-WICG specs / Google Search Central. Tier 2 = Next.js / Vercel docs. Tier 3 = named, dated empirical study. Tier 4 = practitioner consensus.

Research date: 2026-07-29. "Current" below means documented behavior as of that date.

---

## 0. Flagged up front (highest-value findings)

### 0.1 Metric changes in the last 24 months

- **INP formally replaced FID as the third Core Web Vital on March 12, 2024.** Before that, FID (input delay of only the *first* interaction) was the responsiveness metric; INP measures latency across *all* click/tap/keyboard interactions for the page's full lifespan. FID no longer appears in Search Console's Core Web Vitals report. — Tier 1: [Interaction to Next Paint becomes a Core Web Vital on March 12](https://web.dev/blog/inp-cwv-march-12), [Introducing INP to Core Web Vitals](https://developers.google.com/search/blog/2023/05/introducing-inp)
- **Google Search Console removed the standalone "Page experience" report** (the report that had bundled Core Web Vitals + HTTPS + mobile-usability + no-intrusive-interstitials into one score), on/around November 18, 2024. Google's stated reason: reduce clutter — page experience "has evolved to include more aspects than just Core Web Vitals and HTTPS," and the individual Core Web Vitals / HTTPS reports remain available on their own. This is a UI/reporting restructuring, not a change to whether CWV factors into ranking. — Tier 4 (dated practitioner reporting, no single Tier-1 blog post found for this specific removal): [Search Engine Land, "Google Search Console removing the Page Experience report"](https://searchengineland.com/google-search-console-removing-the-page-experience-report-448397) (returns 403 to automated checks; verified manually 2026-07-29); corroborated by the *current* wording of Tier 1: [Understanding Google Page Experience](https://developers.google.com/search/docs/appearance/page-experience), which no longer treats "page experience" as a single scored signal.
- **No further Core Web Vitals metric changes are announced** as of this research date. web.dev's lifecycle model (experimental → pending → stable) is still the mechanism Google would use to introduce a fourth Core Web Vital, and no metric is currently in the "pending" stage per the canonical vitals page. — Tier 1: [Web Vitals](https://web.dev/articles/vitals)
- **Cross-origin LCP timing improved in Chrome 133 (2024)**: a coarsened render time is now available for cross-origin LCP resources even without a `Timing-Allow-Origin` header, improving LCP measurement accuracy for pages that couldn't previously see accurate cross-origin image timing. — Tier 1: [Largest Contentful Paint (LCP)](https://web.dev/articles/lcp)

### 0.2 What practitioners repeat that the primary source does not support

**Claim widely repeated: "Core Web Vitals are a major/strong Google ranking factor — optimize them and you'll outrank slower competitors."**

**What Google actually commits to, in its own words** (Tier 1, [Understanding Google Page Experience](https://developers.google.com/search/docs/appearance/page-experience)):
- "Our core ranking systems look to reward content that provides a good page experience." — a general orientation statement, not a scoring formula.
- "Core Web Vitals are used by our ranking systems" — confirms CWV *is* a signal, but:
- "Great page experience... doesn't guarantee that your pages will rank at the top of Google Search results."
- The decisive qualifier: **"Google Search always seeks to show the most relevant content, even if the page experience is sub-par. But for many queries, there is lots of helpful content available. Having a great page experience can contribute to success in Search, in such cases."**
- "Other page experience aspects don't directly help your website rank higher in search results."

**The correct, defensible claim for the SOP:** Core Web Vitals are one confirmed ranking input, applied *after* relevance, and act as a tiebreaker among comparably relevant results — not a guaranteed ranking boost, not weighted anywhere close to relevance/content signals, and Google has never published a numeric weight for it. Do not tell stakeholders "fixing LCP will move rankings"; the accurate framing is "fixing LCP removes a possible tiebreak disadvantage and improves conversion/UX independent of ranking."

---

## 1. Largest Contentful Paint (LCP)

**Rule:** Ensure the render time of the page's largest above-the-fold image, text block, or video is 2.5 seconds or less at the 75th percentile of real-user page loads.

**Mechanism:** LCP reports the render time of the largest visible element within the viewport at first navigation — candidates are `<img>`, `<image>` inside `<svg>`, `<video>` poster/first-frame, elements with CSS `background-image: url()`, and block-level elements containing text nodes. (A full `<svg>` element itself is not a candidate; only `<image>` elements nested inside it are.) LCP is late in the pipeline: it is gated by TTFB, resource discovery, resource download, and render, so it moves only when one of those four phases (§1.1) is fixed.

**Acceptance criterion:** Good ≤ 2500 ms · Needs Improvement 2500–4000 ms · Poor > 4000 ms, measured at p75, segmented by device (mobile vs desktop) — not averaged.

**Verification method:**
```
# Field (RUM), 75th percentile, per device:
PageSpeed Insights: https://pagespeed.web.dev/ (Origin Summary + URL, Field Data tab)
CrUX API: https://developer.chrome.com/docs/crux/api  (queried per-URL/origin, formFactor=PHONE|DESKTOP)
Search Console → Core Web Vitals report (per-URL-group)
# Lab (synthetic, for regression testing / CI):
npx lighthouse <url> --only-categories=performance --preset=desktop
```

**Source:** Tier 1 — [Largest Contentful Paint (LCP)](https://web.dev/articles/lcp), [Web Vitals](https://web.dev/articles/vitals)

**Known anti-patterns:**
- Lazy-loading the LCP image (`loading="lazy"` on the hero image) — this delays discovery and directly inflates resource-load-delay.
- Loading the LCP image via JavaScript (client-fetched, injected `<img>`) instead of a plain `<img src>` in the initial HTML — invisible to the browser's preload scanner.
- Render-blocking CSS/fonts ahead of the LCP element with no `fetchpriority`/preconnect strategy.

### 1.1 Sub-parts of LCP

Each sub-part below is independently measurable (via the LCP breakdown in Chrome DevTools Performance panel or PageSpeed Insights "Diagnose performance issues" LCP breakdown) and has its own target share of total LCP time.

| Sub-part | Definition | Target share of LCP | Mechanism / fix |
|---|---|---|---|
| **TTFB** | Time from navigation start until the browser receives the first byte of the HTML response | ~40% | Minimize redirects, reduce server processing time, use CDN edge servers, avoid uncacheable URL params |
| **Resource load delay** | Time between TTFB and the browser starting to load the LCP resource (0 if no resource, e.g. a text LCP element) | < 10% | Make the LCP resource discoverable directly in the initial HTML (not hidden in CSS/JS) so the preload scanner finds it; use `fetchpriority="high"`; never lazy-load it |
| **Resource load duration** | Time to fully download the LCP resource (0 if none needed) | ~40% | Compress/use modern formats, serve from CDN, cache aggressively, correctly size responsive images, appropriate `font-display` if text is LCP-blocked by a font |
| **Element render delay** | Time between resource finishing and the LCP element being fully rendered | < 10% | Remove render-blocking stylesheets/scripts ahead of the element, reduce CSS size, avoid long main-thread tasks that delay paint |

**Source:** Tier 1 — [Optimize LCP](https://web.dev/articles/optimize-lcp)

---

## 2. Interaction to Next Paint (INP)

**Rule:** Ensure the latency of all click, tap, and keyboard interactions across the page's full visit lifespan is 200 ms or less at the 75th percentile.

**Mechanism:** INP samples every qualifying interaction (click, tap, key press — explicitly **not** scroll, hover, or zoom) for the entire page visit and reports (approximately) the worst one, expressed as: time from interaction start to the frame that visually reflects its result being painted. Because it covers the whole visit, INP surfaces jank anywhere on the page (not just the first click, unlike its predecessor FID), including interactions that happen well after load, e.g., inside SPA route transitions or hydration-lagging widgets.

**Acceptance criterion:** Good ≤ 200 ms · Needs Improvement 200–500 ms · Poor > 500 ms, p75, segmented by device.

**Verification method:**
```
# Field:
PageSpeed Insights field data tab; CrUX API (metric: interaction_to_next_paint)
Search Console → Core Web Vitals report
web-vitals JS library in production RUM: import {onINP} from 'web-vitals'
# Lab (INP cannot be fully measured in a single synthetic run since it needs real interaction,
# but Lighthouse/DevTools can profile Total Blocking Time and long tasks as a proxy):
npx lighthouse <url> --only-categories=performance   # inspect TBT + long-tasks
# Chrome DevTools → Performance panel → record a real interaction → Interactions track
```

**Source:** Tier 1 — [Interaction to Next Paint (INP)](https://web.dev/articles/inp), [Web Vitals](https://web.dev/articles/vitals)

**Known anti-patterns:**
- Large synchronous event handlers that do DOM reads/writes interleaved (layout thrashing).
- Client-side-rendering large HTML blobs in response to an interaction (blocks the "next paint" itself).
- Third-party scripts attaching heavy, unthrottled event listeners.

### 2.1 Sub-parts of INP

| Sub-part | Definition | Fix direction |
|---|---|---|
| **Input delay** | From user interaction start until the event callbacks begin running | Reduce main-thread blocking tasks (especially during page load/hydration) so the thread is free to start the callback promptly |
| **Processing duration** | Time for the event callbacks to run to completion (all callbacks in that frame) | Minimize work inside handlers; break work into separate tasks via `setTimeout`/`requestAnimationFrame` (yield to the main thread); avoid layout thrashing by batching DOM reads/writes |
| **Presentation delay** | Time from callback completion to the browser presenting the next frame with the visual result | Minimize DOM size; use `content-visibility` for off-screen content; avoid heavy client-side HTML rendering that blocks the frame |

**Source:** Tier 1 — [Optimize INP](https://web.dev/articles/optimize-inp)

---

## 3. Cumulative Layout Shift (CLS)

**Rule:** Keep the score of the largest burst of unexpected layout shifts during the page's lifecycle at or below 0.1.

**Mechanism:** Every time a visible element moves without a user-initiated interaction that immediately preceded it (within a short window), the browser computes `layout shift score = impact fraction × distance fraction` — impact fraction is the union of the before/after visible areas of shifted elements as a fraction of the viewport; distance fraction is the largest horizontal/vertical movement as a fraction of the viewport's largest dimension. Individual shift scores are grouped into session windows (shifts within 1 second of each other, capped at 5 seconds total window duration); CLS is the score of the single largest window, not a running sum across the whole page life.

**Acceptance criterion:** Good ≤ 0.1 · Needs Improvement 0.1–0.25 · Poor > 0.25, p75, segmented by device.

**Verification method:**
```
PageSpeed Insights field + lab CLS
CrUX API metric: cumulative_layout_shift
Chrome DevTools → Performance panel → Experience track (highlights each shift + its rect)
npx lighthouse <url> --only-categories=performance   # lab CLS, note: lab CLS excludes late/async shifts a real user session would see
```

**Source:** Tier 1 — [Cumulative Layout Shift (CLS)](https://web.dev/articles/cls)

**Known anti-patterns and their specific fixes:**
- **Images/embeds without reserved space** — always set `width`/`height` attributes (or CSS `aspect-ratio`) so the browser reserves the box before the resource loads.
- **Ads/embeds injected into the flow** — reserve space with `min-height`/`aspect-ratio`, and place unpredictable late content low in the viewport.
- **Dynamically injected content above existing content** — avoid unless user-triggered; if unavoidable, use placeholders/fixed-size containers or overlay outside document flow.
- **Animating `top`/`left`/`box-shadow`/`box-sizing`** — these trigger layout; animate `transform`/`translate` instead (composited, no layout impact).
- **Web font swap (FOUT/FOIT)** — see §4 below; this is one of the most common real-world CLS causes and is treated separately because the fix is font-specific.

**Source:** Tier 1 — [Optimize CLS](https://web.dev/articles/optimize-cls)

---

## 4. Font loading (CLS and LCP consequences)

**Rule:** Self-host or preload web fonts and use fallback-font metric overrides so that the fallback-to-webfont swap causes no visible layout shift and does not block first paint of text.

**Mechanism:** Two distinct failure modes:
1. **CLS** — when a fallback font (used while the web font downloads) has different metrics (line height, character width, kerning) than the final web font, the swap at load time visibly reflows the page. `font-display: swap` avoids blocking text but keeps this shift risk; `font-display: optional` avoids the shift entirely by only using the web font if it's already cached/fast, otherwise permanently keeping the fallback for that page view.
2. **LCP** — if the LCP element is text styled with a not-yet-loaded web font and `font-display: block` (or default blocking behavior) is used, render is delayed until the font arrives or the block period times out.

**Acceptance criterion:** Either (a) `font-display: optional` is set and no web-font-caused shift is observable in the CLS breakdown, or (b) `size-adjust`/`ascent-override`/`descent-override`/`line-gap-override` are tuned on the fallback `@font-face` such that the fallback box metrics match the web font within a visually negligible tolerance (no entry attributable to the font element in DevTools' Experience/layout-shift trace).

**Verification method:**
```
Chrome DevTools → Performance panel → Experience track → click each layout-shift entry →
  confirm no shift attributed to a <style>/@font-face-affected text node after font load
# Or: Network panel, throttle to Slow 3G, reload, watch for text reflow after font arrives
```

**Source:** Tier 1 — [Optimize CLS](https://web.dev/articles/optimize-cls) (font-display and override-descriptor guidance)

**Next.js-specific implementation (Tier 2):** `next/font` self-hosts Google/local fonts at build time (CSS + font files served from your own origin — "No requests are sent to Google by the browser"), and ships `adjustFontFallback` (default `true` for Google fonts, defaults to `'Arial'` fallback for local fonts) which auto-generates the fallback metric-override `@font-face` to reduce CLS without manual tuning. `next/font`'s own default for `display` is `'swap'`, and `preload` defaults to `true` per-route (page/layout scoped, not global). — [Next.js Font Module](https://nextjs.org/docs/app/api-reference/components/font)

**Known anti-patterns:** Loading fonts from a third-party CDN (`fonts.googleapis.com` directly) without `next/font`, causing an extra DNS/connection round trip and no metrics-override CLS protection; using `font-display: block` or the default blocking `auto` on a font that styles LCP text.

---

## 5. Image optimization

### 5.1 Modern formats

**Rule:** Serve images in WebP (or AVIF where supported) instead of unconverted JPEG/PNG/GIF.

**Mechanism:** Modern codecs use better compression, cutting bytes-over-the-wire for the same visual quality, which shortens resource-load-duration — one of the two ~40%-weighted LCP sub-parts.

**Acceptance criterion:** No content image served in this SOP's projects should be JPEG/PNG when a WebP/AVIF equivalent is technically supportable with a fallback (`<picture>` or `Accept`-header content negotiation), and it should be objectively smaller in bytes for equivalent visual quality (target 25%+ file-size reduction vs a re-encoded JPEG/PNG baseline).

**Verification method:**
```
# Confirm format actually served (not just declared):
curl -s -H "Accept: image/webp,*/*" -o /dev/null -w "%{content_type} %{size_download}\n" <image-url>
# Or in the source: file --mime-type -b <local-file>
```

**Source:** Tier 1 — [Serve images in next-gen formats](https://web.dev/articles/serve-images-webp), which cites **YouTube: WebP thumbnails → 10% faster page loads**, and **Facebook: 25–35% filesize savings for JPEGs, 80% for PNGs** (Tier 3 empirical figures embedded in a Tier 1 document — treat the case-study numbers as illustrative, not a universal guarantee).

**Next.js-specific (Tier 2):** `next/image` automatically serves WebP/AVIF where the browser supports it, with no manual `<picture>` markup required — [Next.js Image Component](https://nextjs.org/docs/app/api-reference/components/image).

### 5.2 Responsive `sizes` / `srcset`

**Rule:** Every responsively-served image must declare `srcset` (or framework-equivalent) with a `sizes` attribute that matches the image's actual rendered width at each breakpoint.

**Mechanism:** `srcset` lists width-descriptor candidates; `sizes` tells the browser how wide the image will render at the current viewport *before* it has to lay out the page, so it can pick the smallest sufficient candidate. An incorrect (too-wide) `sizes` value causes the browser to download an oversized candidate, inflating resource-load-duration; web.dev states unsized responsive images can cause mobile devices to download "2–4x more data than needed."

**Acceptance criterion:** For every `<img>`/`next/image` with `srcset`, the `sizes` value's resolved width at each breakpoint tested must be within ~10% of the element's actual rendered CSS width at that breakpoint (verifiable in DevTools' Network panel "resource size vs rendered size" or the Elements panel computed box size).

**Verification method:**
```
Chrome DevTools → Network panel → Img filter → compare "Size" transferred vs
  Elements panel computed width × devicePixelRatio for the same image at each breakpoint
Lighthouse audit: "Properly size images" (flags this automatically)
```

**Source:** Tier 1 — [Serve responsive images](https://web.dev/articles/serve-responsive-images)

### 5.3 `priority`/`fetchpriority` and lazy loading

**Rule:** Never lazy-load the LCP image; explicitly mark it `fetchpriority="high"` (or `next/image`'s `priority` prop). Lazy-load (`loading="lazy"`) every image likely to load below the fold.

**Mechanism:** `loading="lazy"` defers fetch until the image nears the viewport — correct for below-fold images (saves bandwidth/main-thread contention) but actively harmful on the LCP candidate because it adds pure delay to resource-load-delay. `fetchpriority="high"` (standardized from the WICG Priority Hints proposal into the HTML spec) raises the resource's priority in the browser's network scheduler so it isn't queued behind lower-priority requests.

**Acceptance criterion:** The image serving as the LCP candidate must have neither `loading="lazy"` nor a default lazy behavior, and should carry `fetchpriority="high"` (or `next/image priority`); every other offscreen content image should carry `loading="lazy"`.

**Verification method:**
```
grep for the LCP element's <img> tag in rendered HTML: confirm no loading="lazy",
  presence of fetchpriority="high" or Next.js priority={true}
Chrome DevTools → Performance panel → LCP marker → check "Priority" column for that resource request (should read "High")
```

**Source:** Tier 1 — [Browser-level image lazy loading](https://web.dev/articles/browser-level-image-lazy-loading), [Fetch Priority API](https://web.dev/articles/fetch-priority); underlying spec: Priority Hints (WICG proposal) was merged into the WHATWG HTML spec (no longer a standalone WICG spec) per [MDN: fetchpriority](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Attributes/fetchpriority) (Tier 1-adjacent, browser-vendor documentation).

**Known anti-patterns:** combining `loading="lazy"` with `fetchpriority="high"` on the same element (contradictory signals — web.dev explicitly says this combination is unnecessary since high-priority images already load promptly without lazy-loading); lazy-loading a carousel's first (visible) slide.

---

## 6. Third-party script cost

**Rule:** Every third-party script must be justified against a measured cost budget; scripts that duplicate functionality or fail without graceful degradation must be removed.

**Mechanism:** Synchronously-loaded third-party `<script>` tags block HTML parsing and can stall the critical rendering path; if the third-party server is slow or down, "rendering is blocked until the request times out, which can be anywhere from 10 to 80 seconds" for a blocking resource. Beyond blocking, third parties add network contention (extra DNS/TLS handshakes to third-party origins, often poorly cached), and — via their own heavy JS — degrade INP by installing expensive global event listeners or long tasks.

**Acceptance criterion:** Each third-party script must be (a) loaded `async`/`defer` or dynamically injected post-load unless it is provably render-critical, (b) audited so no two vendors provide overlapping functionality (e.g., two chat widgets, two analytics tags doing the same job), and (c) covered by a performance budget (e.g., total third-party JS transfer size and total blocking time attributable to third-party origins) that CI or a monitoring job can fail against.

**Verification method:**
```
Lighthouse → "Reduce the impact of third-party code" audit (lists blocking time per third-party origin)
WebPageTest → Single Point of Failure (SPOF) test: simulate the third-party origin failing/timing out
  and confirm the page still renders (https://www.webpagetest.org/ — returns 403 to automated checks; verified manually 2026-07-29)
Chrome DevTools → Performance panel → group by "Third party" flag on the flame chart
```

**Source:** Tier 1 — [Efficiently load third-party JavaScript](https://web.dev/articles/third-party-javascript)

**Known anti-patterns:** loading the same capability (e.g., two A/B testing SDKs) from two vendors; leaving abandoned marketing/tracking tags installed after a vendor switch; loading a third-party script `<head>`-synchronously "to be safe."

---

## 7. Field vs. lab data, and CrUX as the record of truth

**Rule:** Treat field data (real-user monitoring, CrUX-derived) as authoritative for pass/fail SOP compliance; use lab data (Lighthouse/DevTools/WebPageTest) only for pre-merge regression detection and root-cause debugging.

**Mechanism — why they disagree:** Lab tools run a single synthetic session under fixed, often idealized network/CPU conditions and cannot replicate the full distribution of real devices, networks, cache states, and user interaction patterns. Field data instead aggregates real Chrome users who opted into usage-stat reporting, and is reported as **percentiles, not averages** — "percentiles across a distribution ... better describe the full range of user experiences," with the 75th percentile as Google's chosen bar because it must be met by the *majority* of visits, not just a typical one. Caching (HTTP, service worker, CDN) can also mean a deployed fix doesn't show up in field data as fast as it shows up in a fresh lab run.

**CrUX as the specific data source of record:**
- **Eligibility (origin/page level):** A page or origin is only included if it is (a) *publicly discoverable* — "the same indexability criteria as search engines" (200 status, no noindex), and (b) *sufficiently popular* — Google does not publish the exact traffic threshold, only that it's set "to ensure that we have enough samples to be confident in the statistical distributions." Below that threshold, a URL/origin simply has no CrUX row (not a zero/pass).
- **Eligibility (user level):** Only Chrome users who enabled usage-statistic reporting and browser-history sync (no sync passphrase) contribute; supported platforms are desktop Chrome (Windows/macOS/ChromeOS/Linux) and Android Chrome (including Custom Tabs/WebAPKs).
- **Collection window:** CrUX is a **28-day rolling aggregate**, refreshed daily around 04:00 UTC, with the API itself lagging "approximately two days behind today's date." Consequence for the SOP: a shipped performance fix will not be visible in CrUX for ~2 days minimum, and will not fully dominate the reported p75 until the older (pre-fix) days roll out of the 28-day window — full stabilization takes on the order of 2–4 weeks.

**Acceptance criterion:** A page is "CWV-compliant" only when CrUX/PSI field data (or, for pre-launch/low-traffic pages that lack a CrUX row, an equivalent RUM pipeline such as Vercel Speed Insights or the `web-vitals` library at p75) shows Good for LCP, INP, and CLS simultaneously — not when a single Lighthouse run passes.

**Verification method:**
```
CrUX API (per URL/origin, per device):  https://developer.chrome.com/docs/crux/api
PageSpeed Insights (wraps CrUX + a live Lighthouse run): https://pagespeed.web.dev/
Search Console → Core Web Vitals report (CrUX-backed, grouped by similar URLs)
Vercel Speed Insights dashboard (RUM, p75/p90/p95/p99 selectable) — for pages below CrUX's traffic floor
```

**Source:** Tier 1 — [Best practices for measuring Web Vitals in the field](https://web.dev/articles/vitals-field-measurement-best-practices), [CrUX methodology](https://developer.chrome.com/docs/crux/methodology), [CrUX API doc — collection period](https://developer.chrome.com/docs/crux/api). Tier 2 — [Vercel Speed Insights](https://vercel.com/docs/speed-insights) (RUM alternative for pre-CrUX-threshold traffic).

---

## 8. Page experience and ranking — full primary-source position

**Rule:** Report Core Web Vitals compliance internally as a UX/conversion requirement first, and only secondarily as "a ranking input that Google confirms it uses but does not weight publicly, applied after relevance."

**Mechanism / Google's own words (Tier 1):**
> "Our core ranking systems look to reward content that provides a good page experience. ... Core Web Vitals are used by our ranking systems. ... Great page experience doesn't guarantee that your pages will rank at the top of Google Search results. ... Google Search always seeks to show the most relevant content, even if the page experience is sub-par. But for many queries, there is lots of helpful content available. Having a great page experience can contribute to success in Search, in such cases. ... Other page experience aspects don't directly help your website rank higher in search results."
> — [Understanding Google Page Experience](https://developers.google.com/search/docs/appearance/page-experience)

**Acceptance criterion:** Any internal SOP language, brief, or stakeholder deck that claims a specific ranking uplift number, a guaranteed ranking position, or treats CWV as equal in weight to content relevance is non-compliant with source material and must be corrected to the tiebreaker framing above.

**Verification method:** Manual doc review — grep any internal SOP/marketing copy for phrases like "boost your rankings" or "X% ranking improvement" tied to Core Web Vitals and cross-check against the quotes above.

**Source:** Tier 1 — [Understanding Google Page Experience](https://developers.google.com/search/docs/appearance/page-experience). Restructuring context (report removed from Search Console, Nov 2024) — Tier 4: [Search Engine Land](https://searchengineland.com/google-search-console-removing-the-page-experience-report-448397) (returns 403 to automated checks; verified manually 2026-07-29).

---

## Reference list (deduplicated)

**Tier 1**
- https://web.dev/articles/lcp
- https://web.dev/articles/optimize-lcp
- https://web.dev/articles/inp
- https://web.dev/articles/optimize-inp
- https://web.dev/articles/cls
- https://web.dev/articles/optimize-cls
- https://web.dev/articles/vitals
- https://web.dev/articles/vitals-field-measurement-best-practices
- https://web.dev/articles/serve-images-webp
- https://web.dev/articles/serve-responsive-images
- https://web.dev/articles/browser-level-image-lazy-loading
- https://web.dev/articles/fetch-priority
- https://web.dev/articles/third-party-javascript
- https://web.dev/blog/inp-cwv-march-12
- https://developers.google.com/search/blog/2023/05/introducing-inp
- https://developers.google.com/search/docs/appearance/page-experience
- https://developer.chrome.com/docs/crux/methodology
- https://developer.chrome.com/docs/crux/api
- https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Attributes/fetchpriority (browser-vendor spec documentation, Tier-1-adjacent)

**Tier 2**
- https://nextjs.org/docs/app/api-reference/components/image
- https://nextjs.org/docs/app/api-reference/components/font
- https://vercel.com/docs/speed-insights

**Tier 3 (empirical figures cited within a Tier 1 document)**
- YouTube WebP thumbnails (10% faster loads) and Facebook WebP savings (25–35% JPEG / 80% PNG), as reported in https://web.dev/articles/serve-images-webp

**Tier 4 (practitioner consensus / dated reporting used only for the Search Console report-removal fact)**
- https://searchengineland.com/google-search-console-removing-the-page-experience-report-448397 (returns 403 to automated checks; verified manually 2026-07-29)
