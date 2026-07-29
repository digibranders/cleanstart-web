# Performance & Core Web Vitals

**Module:** 06 — Performance & Core Web Vitals
**Prefix:** `PERF`
**Review cadence:** Semi-annual (`00-index.md` §9)
**Scope:** LCP / INP / CLS field-vs-lab measurement, image and font policy, third-party script cost, and CleanStart's own JS-bundle and Lighthouse CI gates.
**Evidence base:** `docs/seo/evidence/sources/performance.md` (14 researched sections, all upheld except §0.2/§8's ranking-claim quote — see below); `docs/seo/evidence/verification-log.md` (corrections #14 and #15 are both applied in PERF-06); `docs/seo/evidence/codebase-inventory.md` ("Performance & Core Web Vitals" section, plus its Contradictions §D `UNDETERMINED` items for this domain); `docs/seo/evidence/field-data.md` — real CrUX field data for `www.cleanstart.com`, captured 2026-07-29.

Every `CleanStart` verdict below is grounded in a cited `file:line` reference, a real CrUX field-data figure, or both. Per this module's own §7 rule (PERF-04), verdicts on LCP/INP/CLS conformance rest on the CrUX field data in `field-data.md`, not on a Lighthouse lab run — a lab score is cited only where the rule concerns CI-gate mechanics rather than a Core Web Vital's real-user value. Where CrUX returned no row for a URL because it is below the traffic-eligibility threshold, that is recorded as `Unverified — <reason>`, per this SOP's own verdict vocabulary (`00-index.md` §7) — not as a failure.

---

## P1 — material organic or AI-visibility impact, no immediate loss

### PERF-01 — Largest Contentful Paint: ≤ 2500 ms at p75, per device

- **Severity:** P1
- **Applies:** Always
- **Rule:** The render time of the page's largest above-the-fold image, text block, or video must be 2500 ms or less at the 75th percentile of real-user page loads, measured separately for mobile and desktop.
- **Why:** LCP is late in the render pipeline — gated by TTFB, resource discovery, resource download, and element render — so it is the single clearest proxy for perceived load speed a real visitor experiences, and it is the metric CrUX/Search Console report on to determine Core Web Vitals "Good" status.
- **Acceptance:**
  - Good ≤ 2500 ms · Needs Improvement 2500–4000 ms · Poor > 4000 ms
  - Measured at p75, segmented by device (mobile vs desktop) — never averaged, never blended across devices
- **Verify:** `curl -s "https://chromeuxreport.googleapis.com/v1/records:queryRecord?key=$CRUX_API_KEY" -d '{"origin":"https://www.cleanstart.com","formFactor":"PHONE"}' | jq '.record.metrics.largest_contentful_paint.percentiles.p75'`
- **Reference:** `apps/cms/src/payload/lib/integrations/kinds/crux.ts:39` (thresholds encoded for the CMS-admin CrUX dashboard; not consumed by `apps/web` — see PERF-12)
- **Source:** [Tier 1] https://web.dev/articles/lcp, https://web.dev/articles/vitals
- **Tools:** PageSpeed Insights (Field Data tab); Search Console Core Web Vitals report; CrUX API `largest_contentful_paint`.
- **Anti-patterns:** Lazy-loading the LCP image (see PERF-05); loading it via client-side JavaScript instead of a plain `<img src>` in the initial HTML; treating a passing Lighthouse lab run as proof of field conformance (see PERF-04).
- **Evidence:** `docs/seo/evidence/field-data.md` §1, captured 2026-07-29, trailing-28-day window 2026-06-30 to 2026-07-27. Origin-level: phone 2784 ms (Needs Improvement), desktop 1746 ms (Good). Home page (`/`) URL-level: phone 2620 ms (Needs Improvement), desktop 2023 ms (Good). Both figures are real CrUX rows, not lab estimates. The three next-highest-traffic templates (`/guide/oci-image-format`, `/about-us`, `/careers`) returned CrUX HTTP 404 (`chrome ux report data not found`) at the URL level for both form factors — expected behavior for a URL below CrUX's real-user-traffic eligibility floor, not a defect.
- **CleanStart:** Partial

---

### PERF-02 — Interaction to Next Paint: ≤ 200 ms at p75, per device

- **Severity:** P1
- **Applies:** Always
- **Rule:** The latency of all click, tap, and keyboard interactions across a page visit's full lifespan must be 200 ms or less at the 75th percentile, measured separately for mobile and desktop.
- **Why:** INP formally replaced FID as the third Core Web Vital on 2024-03-12 and, unlike FID, samples every qualifying interaction for the entire visit (not just the first), surfacing jank anywhere on the page — including SPA route transitions and hydration-lagging widgets, not only first paint.
- **Acceptance:**
  - Good ≤ 200 ms · Needs Improvement 200–500 ms · Poor > 500 ms
  - Measured at p75, segmented by device
- **Verify:** `curl -s "https://chromeuxreport.googleapis.com/v1/records:queryRecord?key=$CRUX_API_KEY" -d '{"origin":"https://www.cleanstart.com","formFactor":"DESKTOP"}' | jq '.record.metrics.interaction_to_next_paint.percentiles.p75'`
- **Reference:** `apps/cms/src/payload/lib/integrations/kinds/crux.ts:40`
- **Source:** [Tier 1] https://web.dev/articles/inp, https://web.dev/blog/inp-cwv-march-12
- **Tools:** PageSpeed Insights field-data tab; CrUX API `interaction_to_next_paint`; the `web-vitals` JS library in production RUM.
- **Anti-patterns:** Large synchronous event handlers interleaving DOM reads/writes; third-party scripts attaching heavy, unthrottled event listeners.
- **Evidence:** `docs/seo/evidence/field-data.md` §1. Origin-level: phone 117 ms, desktop 91 ms. Home page: phone 137 ms, desktop 95 ms. All four real-user figures are well inside the 200 ms Good band.
- **CleanStart:** Pass

---

### PERF-03 — Cumulative Layout Shift: ≤ 0.1 at p75, per device

- **Severity:** P1
- **Applies:** Always
- **Rule:** The score of the largest burst of unexpected layout shifts during a page's lifecycle must be 0.1 or less at the 75th percentile, measured separately for mobile and desktop.
- **Why:** CLS is the score of the single largest 1-second-grouped, 5-second-capped shift session window — not a running sum across the whole page life — computed as impact fraction × distance fraction each time a visible element moves without an immediately-preceding user interaction.
- **Acceptance:**
  - Good ≤ 0.1 · Needs Improvement 0.1–0.25 · Poor > 0.25
  - Measured at p75, segmented by device
- **Verify:** `curl -s "https://chromeuxreport.googleapis.com/v1/records:queryRecord?key=$CRUX_API_KEY" -d '{"url":"https://www.cleanstart.com/","formFactor":"PHONE"}' | jq '.record.metrics.cumulative_layout_shift.percentiles.p75'`
- **Reference:** `apps/cms/src/payload/lib/integrations/kinds/crux.ts:41`
- **Source:** [Tier 1] https://web.dev/articles/cls, https://web.dev/articles/optimize-cls
- **Tools:** PageSpeed Insights field + lab CLS; CrUX API `cumulative_layout_shift`; Chrome DevTools Performance panel Experience track.
- **Anti-patterns:** Images/embeds without reserved `width`/`height` or `aspect-ratio`; animating `top`/`left`/`box-shadow` instead of `transform`; a web-font swap with unmatched fallback metrics (see PERF-09).
- **Evidence:** `docs/seo/evidence/field-data.md` §1. Origin-level: phone 0.00, desktop 0.01. Home page: phone 0.00, desktop 0.02. All four figures sit far inside the 0.1 Good band, with meaningful headroom before Needs Improvement.
- **CleanStart:** Pass

---

### PERF-04 — Field data (CrUX/RUM) is authoritative for pass/fail; lab data is for pre-merge regression detection and debugging only

- **Severity:** P1
- **Applies:** Always
- **Rule:** Treat CrUX-derived field data (or an equivalent RUM pipeline for pre-launch/low-traffic pages below CrUX's threshold) as the sole source of truth for whether a page is "CWV-compliant." Use Lighthouse/DevTools/WebPageTest lab runs only to catch regressions before merge and to root-cause a specific defect — never as a substitute pass/fail signal.
- **Why:** Lab tools run one synthetic session under fixed, idealized network/CPU conditions and cannot reproduce the distribution of real devices, networks, and cache states; field data is real Chrome users, reported as percentiles (not averages) specifically because the p75 bar must be cleared by the majority of visits, not a typical one. CrUX itself is a 28-day rolling aggregate refreshed daily and lagging roughly two days behind the current date, so a shipped fix does not fully dominate the reported p75 for 2–4 weeks.
- **Acceptance:**
  - A page is called "CWV-compliant" only when CrUX/PSI field data (or an equivalent RUM figure for a page below CrUX's traffic floor) shows Good for LCP, INP, and CLS simultaneously
  - A single passing Lighthouse run is never cited as satisfying this bar on its own
- **Verify:** `curl -s "https://chromeuxreport.googleapis.com/v1/records:queryRecord?key=$CRUX_API_KEY" -d '{"origin":"https://www.cleanstart.com","formFactor":"PHONE"}' | jq '.record.metrics | keys'`
- **Reference:** `apps/cms/src/payload/jobs/refresh-crux.ts:14` (daily CrUX cron, the only field-data ingestion path in the codebase); `apps/web/.lighthouserc.json` (the only lab-based CI gate, all assertions `warn` — see PERF-13)
- **Source:** [Tier 1] https://web.dev/articles/vitals-field-measurement-best-practices, https://developer.chrome.com/docs/crux/methodology, https://developer.chrome.com/docs/crux/api
- **Tools:** CrUX API; PageSpeed Insights (wraps CrUX + a live Lighthouse run); Search Console Core Web Vitals report (CrUX-backed); Vercel Speed Insights for pages below CrUX's traffic floor.
- **Anti-patterns:** Reporting a green Lighthouse CI run as "Core Web Vitals passing" — Lighthouse measures a single synthetic session, not the real-user distribution this rule requires; treating CrUX's 2–4-week stabilization lag as a bug rather than the expected consequence of a 28-day rolling window.
- **Evidence:** The only mechanism in this codebase that produces real field data at all is the daily 06:45 UTC `refreshCruxTask` cron (`refresh-crux.ts:14`) writing origin-level CrUX rows to a CMS-admin-only cache; the only automated CI performance signal (`.lighthouserc.json`) is lab-only and, per PERF-13, cannot fail a build regardless of score. This SOP's own field-data capture (`docs/seo/evidence/field-data.md`) had to be pulled directly from the CrUX API out-of-band — there is no dashboard, alert, or CI check in the repository today that gates a release on field data specifically.
- **CleanStart:** Partial

---

### PERF-05 — Never lazy-load or client-inject the LCP resource; mark it `fetchpriority="high"`

- **Severity:** P1
- **Applies:** Any page with an image, video poster, or `background-image` as its LCP candidate
- **Rule:** The element serving as a page's LCP candidate must never carry `loading="lazy"` (or an equivalent lazy default) and must be discoverable in the initial server-rendered HTML as a plain `<img src>` — never injected via client-side JavaScript. Mark it `fetchpriority="high"` (or `next/image`'s `priority` prop).
- **Why:** `loading="lazy"` defers fetch start until the image nears the viewport, which is correct for below-fold images but adds pure delay directly to the LCP resource's load-delay sub-part when applied to the LCP candidate itself; a client-injected `<img>` is invisible to the browser's preload scanner regardless of lazy-loading. `fetchpriority="high"` raises the resource's priority in the network scheduler so it is not queued behind lower-priority requests.
- **Acceptance:**
  - The LCP-candidate element has neither `loading="lazy"` nor a client-injected source
  - It carries `fetchpriority="high"` or `next/image priority`
  - Every other offscreen content image carries `loading="lazy"`
- **Verify:** `curl -s https://www.cleanstart.com/ | grep -o '<img[^>]*fetchpriority="high"[^>]*>' | head -1`
- **Reference:** `apps/web/src/components/sections/**/ASRHero.tsx:190,192` (`sizes="430px"`, unconditional `priority`); `apps/web/src/components/sections/**/CleanSightHeroDeck.tsx:126-127` (`sizes="(min-width: 1024px) 600px, 90vw"`, `priority={i === 0}`, conditional to the first item only)
- **Source:** [Tier 1] https://web.dev/articles/browser-level-image-lazy-loading, https://web.dev/articles/fetch-priority, https://web.dev/articles/optimize-lcp
- **Tools:** Chrome DevTools Performance panel, LCP marker → Priority column (should read "High"); Lighthouse "Preload Largest Contentful Paint image" audit.
- **Anti-patterns:** Combining `loading="lazy"` with `fetchpriority="high"` on the same element — contradictory signals web.dev explicitly calls unnecessary; lazy-loading a carousel's first (visible) slide.
- **Evidence:** `priority` is present on `<Image>` in 25 files under `apps/web/src/components/sections` (grep count, per `docs/seo/evidence/codebase-inventory.md`), including 10 hero components. The pattern is applied inconsistently by design — some call sites gate `priority` on list position (`priority={i === 0}`), others apply it unconditionally — both are legitimate depending on whether the component always renders its first item above the fold. A separate `lcp` boolean prop on `HeroReveal` (`apps/web/src/components/ui/Reveal.tsx:147-157`) is a distinct mechanism (an animation-timing hint, not an image-loading hint) applied across ~30 hero files, and does not by itself confirm `priority`/`fetchpriority` correctness on the underlying `<Image>`.
- **CleanStart:** Unverified — the two sampled hero files confirm correct usage, but per `codebase-inventory.md`'s own flagged gap, whether every hero component with an `<Image>` LCP candidate actually sets `priority` was not individually verified across all 25+62 grep hits; closing this requires a per-file read, not a sample.

---

### PERF-06 — Report Core Web Vitals as a ranking tiebreaker among comparably relevant results, not a guaranteed ranking boost

- **Severity:** P1
- **Applies:** Always
- **Rule:** Internally report Core Web Vitals compliance as a UX/conversion requirement first, and only secondarily as "a ranking input Google confirms it uses but does not weight publicly, applied after relevance." Never state or imply that fixing LCP/INP/CLS will itself move rankings, or that Core Web Vitals are weighted anywhere close to relevance/content signals.
- **Why:** Google's own words: "Google's core ranking systems look to reward content that provides a good page experience. ... Core Web Vitals are used by our ranking systems. ... Keep in mind that getting good results in reports like Search Console's Core Web Vitals report or third-party tools doesn't guarantee that your pages will rank at the top of Google Search results; there's more to great page experience than Core Web Vitals scores alone. ... Google Search always seeks to show the most relevant content, even if the page experience is sub-par. But for many queries, there is lots of helpful content available. Having a great page experience can contribute to success in Search, in such cases. ... Beyond Core Web Vitals, other page experience aspects don't directly help your website rank higher in search results." Both over-claiming (promising a ranking lift that doesn't materialize) and under-claiming (treating CWV as ranking-irrelevant and skipping real UX/conversion wins) cost real engineering time on a false premise.
- **Acceptance:**
  - No internal SOP, brief, or stakeholder deck claims a specific ranking uplift number or a guaranteed ranking position from a Core Web Vitals fix
  - No internal document treats Core Web Vitals as equal in ranking weight to content relevance
  - Internal framing states the tiebreaker/UX-first position, not a stronger or weaker claim
- **Verify:** `grep -rniE "boost.{0,20}rank|rank(ing)?.{0,20}(boost|improvement|guarantee)" docs/ apps/web/src apps/cms/src 2>/dev/null | grep -v docs/seo/evidence`
- **Reference:** None — no reference implementation
- **Source:** [Tier 1] https://developers.google.com/search/docs/appearance/page-experience — corrected per `verification-log.md` corrections #14 and #15: the source research file misquoted "Our core ranking systems" for the real "Google's core ranking systems," and fabricated a spliced sentence ("Great page experience... doesn't guarantee...") whose real subject is "getting good results in [Core Web Vitals] reports... or third-party tools," not page experience itself — a narrower, more defensible claim than the fabricated version implied.
- **Tools:** Not applicable as a single issue class — this is a framing/expectation rule verified by manual document review, not a defect any SEO tool scores.
- **Anti-patterns:** Presenting a Core Web Vitals initiative to stakeholders with a projected ranking-position or traffic number attached; conversely, deprioritizing a genuine LCP/INP/CLS defect on the grounds that "Google says it barely matters for ranking" — the correct framing is that it matters for conversion and UX regardless of ranking weight, and remains a real (if secondary) ranking input.
- **Evidence:** `docs/architecture/cleanstart-cms-architecture.html:3989-3991` states: "For an SEO-led marketing site, Core Web Vitals are a confirmed Google ranking factor (since June 2021, strengthened in the March 2026 core update). CI blocks PRs that regress against thresholds; production monitoring confirms what real users experience; CrUX ... is the ground-truth signal Google ranks on." This overstates on two independent axes: (1) it asserts a "strengthened in the March 2026 core update" claim with no citation anywhere in this SOP's evidence base, and (2) it states "CI blocks PRs that regress against thresholds" as flat fact, which is false as implemented — the absolute bundle-size budget never fails a build (PERF-07) and Lighthouse CI is warn-only on every assertion (PERF-13); only the 5 KB bundle-regression-vs-baseline check can currently fail a PR. Two client-facing HTML briefs (`docs/client-brief/cleanstart-vs-webflow-comparison.html:354`, `docs/client-brief/cleanstart-vs-webflow-comparison-light.html:459`) also state "Core Web Vitals are a confirmed Google ranking signal" without the relevance-first/tiebreaker qualifier this rule requires, though neither asserts a specific uplift number.
- **CleanStart:** Fail

---

### PERF-07 — The JS bundle-budget CI gate must actually fail a build on an absolute-budget breach, not warn-only

- **Severity:** P1
- **Applies:** Any project with a codified first-party JS bundle-size budget enforced in CI
- **Rule:** If a project defines an absolute bundle-size budget (a P50/P99 ceiling, not just a regression-vs-baseline check), the CI job enforcing it must be able to fail the build when that absolute ceiling is breached — not merely log a warning.
- **Why:** Excess first-party JavaScript directly lengthens main-thread blocking time, which is the documented mechanism behind INP degradation (PERF-02) and can push out LCP's element-render-delay sub-part; a budget that can only warn, never fail, offers no actual backstop against a bundle-size regression shipping to production once it clears the smaller regression-tolerance check.
- **Acceptance:**
  - A CI job measures gzipped bundle size against both an absolute budget and a regression-vs-baseline delta
  - Breaching the absolute budget fails the CI job by default — not only when an extra environment flag is set
- **Verify:** `STRICT_BUNDLE_BUDGET=1 pnpm --filter @cleanstart/web bundle:budget; echo "exit=$?"`
- **Reference:** `apps/web/scripts/bundle-budget.mjs:32-33,143,164-176`; `.github/workflows/web.yml:173`
- **Source:** [Tier 1] https://web.dev/articles/optimize-inp (main-thread blocking time as the INP-degradation mechanism JS bundle size feeds into); the specific budget thresholds and the `STRICT_BUNDLE_BUDGET` enforcement gap below are CleanStart implementation detail, not vendor-specified — Convention — not vendor-confirmed for the numeric thresholds themselves.
- **Tools:** Not applicable — no named SEO/performance tool scores a project's own internal CI-gate configuration; this is verified by reading the CI workflow and script directly.
- **Anti-patterns:** Defining an absolute budget constant in code and believing it is enforced because the script "checks" it, without confirming the failure branch is actually reachable in CI as configured.
- **Evidence:** `bundle-budget.mjs:32-33` defines `BUDGET_P50_KB = 220` and `BUDGET_P99_KB = 260`; `:143` reads `STRICT_BUNDLE_BUDGET === "1"` to select between two branches — the strict branch (`:164-172`) which sets `failed = true` and exits 1 on a budget breach, and the non-strict branch (`:174-175`) which only `console.log`s a warning. `.github/workflows/web.yml:173` invokes `pnpm --filter @cleanstart/web bundle:budget` with no `STRICT_BUNDLE_BUDGET` environment variable set anywhere in `.github/workflows/*.yml` or any committed `.env*` file (confirmed by repo-wide grep) — so the strict/absolute branch is unreachable in CI as currently configured. Only the separate 5 KB regression-vs-committed-baseline check (`:152-162`) can fail this job today; a route that is, say, 400 KB gzipped — 140 KB over the P99 ceiling — passes CI cleanly as long as it hasn't grown more than 5 KB since the last committed baseline.
- **CleanStart:** Fail

---

## P2 — meaningful improvement, non-urgent

### PERF-08 — Serve images in modern formats (WebP/AVIF), not unconverted JPEG/PNG

- **Severity:** P2
- **Applies:** Any content image with a technically supportable modern-format equivalent
- **Rule:** Serve content images in WebP or AVIF instead of unconverted JPEG/PNG/GIF, with a fallback path for unsupported clients.
- **Why:** Modern codecs cut bytes-over-the-wire for equivalent visual quality, directly shortening the resource-load-duration sub-part of LCP — one of its two ~40%-weighted phases.
- **Acceptance:** No content image is served as JPEG/PNG when a WebP/AVIF equivalent is technically supportable with a fallback, and the modern format is objectively smaller for equivalent visual quality (target 25%+ reduction vs. a re-encoded JPEG/PNG baseline).
- **Verify:** `curl -s -H "Accept: image/webp,*/*" -o /dev/null -w "%{content_type} %{size_download}\n" "https://www.cleanstart.com/_next/image?url=%2Fimages%2Fhome%2Fhero.png&w=1920&q=75"`
- **Reference:** `apps/web/next.config.ts:100-101`
- **Source:** [Tier 1] https://web.dev/articles/serve-images-webp (cites YouTube: WebP thumbnails → 10% faster page loads; Facebook: 25–35% JPEG / 80% PNG savings — Tier 3 figures embedded in a Tier 1 document, illustrative not universal). [Tier 2] https://nextjs.org/docs/app/api-reference/components/image
- **Tools:** Lighthouse "Serve images in next-gen formats" audit; `curl -H "Accept: image/webp"` content-type comparison.
- **Anti-patterns:** Manually re-encoding images to WebP outside the framework's image pipeline, creating a second asset to keep in sync, when `next/image` already negotiates format automatically.
- **Evidence:** `next.config.ts:101` sets `images.formats: ["image/avif", "image/webp"]`. Per Next.js's own documentation (Tier 2), `next/image` automatically serves WebP/AVIF when the requesting browser supports it, with no manual `<picture>` markup required — this is a framework-level guarantee for every image routed through `next/image`, not a per-file opt-in.
- **CleanStart:** Pass

---

### PERF-09 — Responsive `sizes` must match the image's actual rendered width at each breakpoint

- **Severity:** P2
- **Applies:** Any image served with `srcset`/framework-equivalent responsive candidates
- **Rule:** Every responsively-served image must declare a `sizes` value that matches its actual rendered CSS width at each breakpoint tested — not an oversized guess.
- **Why:** `sizes` tells the browser how wide the image will render before layout, so it can pick the smallest sufficient `srcset` candidate; an incorrect (too-wide) value causes an oversized download, inflating LCP's resource-load-duration. web.dev states unsized responsive images can cause mobile devices to download "2–4x more data than needed."
- **Acceptance:** For every `<img>`/`next/image` with `srcset`, the `sizes` value's resolved width at each tested breakpoint is within ~10% of the element's actual rendered CSS width.
- **Verify:** `grep -rL "sizes=" apps/web/src/components/sections --include='*.tsx' | xargs grep -l "next/image" 2>/dev/null`
- **Reference:** None — no reference implementation (per-file `sizes`-vs-rendered-width comparison requires a live DevTools measurement, not a static grep)
- **Source:** [Tier 1] https://web.dev/articles/serve-responsive-images
- **Tools:** Lighthouse "Properly size images" audit; Chrome DevTools Network panel, resource size vs. rendered box size comparison.
- **Anti-patterns:** Copying a `sizes` string from one component to another without checking whether the new component's rendered width actually matches it.
- **Evidence:** `next/image` is imported in 62 files under `apps/web/src/components/sections` and `sizes=` is present in 60 of those files (grep counts, per `docs/seo/evidence/codebase-inventory.md`) — leaving 2 files that import `next/image` without a grep-confirmed matching `sizes` attribute. The inventory explicitly flags which 2 files as not individually isolated ("not isolated by file-level diff; would need a per-file grep").
- **CleanStart:** Unverified — 2 of 62 files importing `next/image` under `components/sections` lack a confirmed matching `sizes` attribute; per the codebase inventory's own note, the specific 2 files were not isolated in that pass, and this module keeps that gap `Unverified` rather than guessing which files or whether they are true positives.

---

### PERF-10 — Font loading must not cause a visible layout shift or block first paint of LCP text

- **Severity:** P2
- **Applies:** Any page loading a web font
- **Rule:** Self-host or preload web fonts and use fallback-font metric overrides so that the fallback-to-webfont swap causes no visible layout shift and does not block first paint of text.
- **Why:** Two distinct failure modes: a fallback font with different metrics than the final web font causes a visible reflow at swap time (CLS); and text styled with a not-yet-loaded font under `font-display: block`/default-blocking behavior delays render if that text is the LCP element.
- **Acceptance:** Either `font-display: optional` is set with no observable web-font-caused shift, or `size-adjust`/`ascent-override`/`descent-override`/`line-gap-override` are tuned on the fallback so no shift attributable to the font appears in the CLS/layout-shift trace.
- **Verify:** `grep -n "adjustFontFallback\|display:" apps/web/src/app/layout.tsx`
- **Reference:** `apps/web/src/app/layout.tsx:32-39,42-49,52-58`
- **Source:** [Tier 1] https://web.dev/articles/optimize-cls (font-display and override-descriptor guidance). [Tier 2] https://nextjs.org/docs/app/api-reference/components/font — `next/font` self-hosts fonts, ships `adjustFontFallback` (auto-generates fallback metric overrides), defaults `display` to `'swap'` and `preload` to `true` per-route.
- **Tools:** Chrome DevTools Performance panel Experience track (confirm no shift attributed to a `@font-face`-affected text node after font load).
- **Anti-patterns:** Loading fonts from a third-party CDN (`fonts.googleapis.com` directly) instead of `next/font`, losing the automatic metric-override CLS protection; using `font-display: block` on a font styling LCP text.
- **Evidence:** `layout.tsx:32-39` (Manrope, display), `:42-49` (Sora, body) both set `display: "swap"`, `preload: true`, `adjustFontFallback: true`. `:52-58` (JetBrains Mono, code) sets `preload: false` with an inline comment "Not preloaded (below the fold on most pages)" — a deliberate choice for a font family that never styles above-the-fold or LCP text. This matches Next.js's documented default behavior exactly, with no manual override-tuning needed.
- **CleanStart:** Pass

---

### PERF-11 — Third-party scripts must be non-blocking, non-duplicative, and covered by a measurable budget

- **Severity:** P2
- **Applies:** Any third-party (non-first-party) script
- **Rule:** Every third-party script must be (a) loaded `async`/`defer` or injected post-load unless provably render-critical, (b) audited so no two vendors provide overlapping functionality, and (c) covered by a performance budget CI or monitoring can fail against.
- **Why:** A synchronously-loaded third-party `<script>` can block the critical rendering path and stall render "anywhere from 10 to 80 seconds" if the third-party server is slow or down; third-party JS also commonly degrades INP via expensive global event listeners or long tasks.
- **Acceptance:**
  - Every third-party script is `async`/`defer`/dynamically injected unless provably render-critical
  - No two vendors are found providing overlapping functionality
  - Total third-party JS transfer size or blocking time is covered by a budget CI can fail against
- **Verify:** `curl -s https://www.cleanstart.com/ | grep -oE '<script[^>]*(googletagmanager|leadfeeder|turnstile)[^>]*>'`
- **Reference:** `apps/web/src/lib/analytics/ga4-snippet.ts:44-60` (async loader injection); `apps/web/src/components/TurnstileWidget.tsx:93`, `apps/web/src/components/analytics/LeadfeederScript.tsx:37,43` (`next/script strategy="afterInteractive"`); `apps/web/scripts/bundle-budget.mjs:52`
- **Source:** [Tier 1] https://web.dev/articles/third-party-javascript
- **Tools:** Lighthouse "Reduce the impact of third-party code" audit; WebPageTest Single Point of Failure test; Chrome DevTools Performance panel grouped by "Third party" flag.
- **Anti-patterns:** Loading the same capability from two vendors (e.g., two chat widgets); leaving an abandoned tracking tag installed after a vendor switch; loading a third-party script synchronously in `<head>` "to be safe."
- **Evidence:** GA4's bootstrap is a server-rendered inline `<script>` (`Ga4HeadScript.tsx`) whose own body appends the real `googletagmanager.com` loader with `s.async=true` (`ga4-snippet.ts:56-58`) — the inline block itself does no network fetch, so it does not block on a third-party round trip. Turnstile and Leadfeeder both use `next/script` with `strategy="afterInteractive"`, Next.js's documented non-blocking pattern. However, `bundle-budget.mjs:52`'s own comment reads "Skip external scripts (analytics CDNs etc.) — they're not 'our' bundle" — the one CI-enforced size budget in this codebase (PERF-07) explicitly excludes every third-party script from measurement, satisfying none of this rule's (c) criterion. Whether any two vendors overlap in functionality across the full site (including CMS-authored embeds not enumerated in this pass) was not exhaustively audited here.
- **CleanStart:** Partial

---

### PERF-12 — Field-data ingestion must reach every surface that needs it, not dead-end in a single admin dashboard

- **Severity:** P2
- **Applies:** Any project that ingests CrUX or equivalent field data
- **Rule:** A CrUX (or equivalent RUM) ingestion pipeline must actually serve the audiences and code paths designed to consume it — a per-URL query path that is coded but never invoked with real arguments provides no more coverage than if it didn't exist.
- **Why:** Per-template (not just per-origin) field data is what lets a team verify PERF-01–03 against the specific pages that matter, rather than a single blended origin-level figure that can mask a badly-performing template inside a well-performing average.
- **Acceptance:** Every code path built to fetch per-URL field data is actually invoked with a non-empty URL set from at least one real call site, and the resulting data reaches a consumer beyond a single gated admin view if that data is meant to inform engineering decisions broadly.
- **Verify:** `grep -rn "fetchCrux(" apps/cms/src/payload | grep -v "\[\]"`
- **Reference:** `apps/cms/src/payload/jobs/refresh-crux.ts:18`; `apps/cms/src/payload/endpoints/dashboards-advanced.ts:35`; `apps/cms/src/payload/lib/integrations/kinds/crux.ts:74-89`
- **Source:** [Tier 1] https://web.dev/articles/vitals-field-measurement-best-practices (percentile/per-segment field data as the basis for real conformance judgments — the general case this rule's CleanStart-specific gap violates); the completeness requirement itself is Convention — not vendor-confirmed, since no primary source mandates a specific ingestion architecture.
- **Tools:** Not applicable — an internal pipeline-completeness check, verified by reading the call sites directly.
- **Anti-patterns:** Building a parameterized fetch function and then never actually parameterizing it at either call site, leaving the parameter permanently at its default/empty value.
- **Evidence:** `fetchCrux(creds, origin, pageUrls)` (`crux.ts:74-89`) queries the origin unconditionally and additionally queries each URL in `pageUrls` (`:82-85`) — but both real call sites in the codebase, the daily cron (`refresh-crux.ts:18`) and the on-demand admin endpoint (`dashboards-advanced.ts:35`), pass a hardcoded empty array `[]` for that argument. The per-page query branch (`:82-85`) is therefore unreachable code today — only the origin-level query (`:81`) ever executes. Separately, the CrUX data that is fetched is consumed exclusively by a Payload admin-only dashboard (`Analytics/WebVitals.tsx`, requiring `admin`/`editor` role) — `apps/web` has no route or component that reads the CrUX cache at all, meaning the engineers building the pages this data describes have no in-product visibility into it.
- **CleanStart:** Fail

---

### PERF-13 — Lab-based CI performance gates must be able to fail a build, not warn-only on every assertion

- **Severity:** P2
- **Applies:** Any project running Lighthouse CI (or an equivalent lab-based performance gate) in its CI pipeline
- **Rule:** If a project runs Lighthouse CI (or equivalent) against a performance-score threshold, at least the performance-category assertion should be able to fail the build — not merely log a warning — or the gate should be documented internally as advisory-only, not as an enforcement mechanism.
- **Why:** Per PERF-04, lab data exists specifically to catch pre-merge regressions; a lab gate configured so that no assertion can ever fail the run provides zero regression-catching value beyond what a developer would notice by eye in the CI log, while looking, on paper, like an enforced quality gate.
- **Acceptance:** At minimum the `performance` category assertion in the Lighthouse CI config uses `"error"` severity (or the project's equivalent failing severity), or internal documentation explicitly states the gate is advisory/warn-only by design.
- **Verify:** `grep -A1 '"categories:performance"' apps/web/.lighthouserc.json`
- **Reference:** `apps/web/.lighthouserc.json`
- **Source:** [Tier 2] Lighthouse CI's own `assert` configuration mechanism (https://github.com/GoogleChrome/lighthouse-ci) supports `"error"`/`"warn"`/`"off"` severities per assertion — which severity to select for a given project is a Convention — not vendor-confirmed governance choice, not a vendor-prescribed threshold.
- **Tools:** Lighthouse CI itself; the `web-lhci` GitHub Actions job that runs it.
- **Anti-patterns:** Treating a Lighthouse CI job that exists and runs green as evidence of an enforced performance gate when every one of its assertions is configured `"warn"`.
- **Evidence:** `.lighthouserc.json`'s `assert.assertions` block sets `"categories:performance": ["warn", { "minScore": 0.85 }]` — along with accessibility, best-practices, and SEO, every category assertion in this file is `"warn"`, not `"error"`. A `"warn"` assertion in Lighthouse CI is logged but never fails the run. The job collects 8 static routes (`/`, `/about-us`, `/cleansight`, `/cleanstart-images`, `/vulnerability-remediation`, `/fips`, `/attack-surface-reduction`, `/software-bill-materials`) under mobile emulation with realistic throttling (`rttMs:150, throughputKbps:1638.4, cpuSlowdownMultiplier:4`) — a reasonable lab methodology — but no score it produces, however low, can fail the `web-lhci` CI job as currently configured.
- **CleanStart:** Fail

---

## P3 — hygiene, marginal or speculative gain

### PERF-14 — RUM web-vitals reporting needs test coverage and should not depend on a single sink

- **Severity:** P3
- **Applies:** Any project reporting real-user Core Web Vitals via a client-side RUM component
- **Rule:** A production RUM web-vitals reporting component should have test coverage for its metric-forwarding logic, and should not be the sole mechanism standing between "no field-data visibility" and "field-data visibility" if its one downstream sink is unavailable or misconfigured.
- **Why:** A component with no tests can regress silently (a renamed metric, a broken conditional) with no CI signal; a single-sink design means any outage or misconfiguration in that one destination (here, Sentry) removes RUM visibility entirely, with no independent corroborating source.
- **Acceptance:** The RUM-reporting component has at least one test asserting its metric-to-sink forwarding behavior; if only one sink is used, that is a documented, deliberate choice, not an unexamined default.
- **Verify:** `find apps/web/src/components/observability -name '*.test.tsx' -o -name '*.test.ts'`
- **Reference:** `apps/web/src/components/observability/WebVitals.tsx:1-18`; `apps/web/src/components/analytics/GatedAnalytics.tsx:44`
- **Source:** Convention — not vendor-confirmed (test-coverage and single-sink-risk expectations are this SOP's own engineering-hygiene stance, not a Google/Chrome-team requirement)
- **Tools:** Not applicable — verified by directory listing and reading the component directly.
- **Anti-patterns:** Treating "we report web-vitals to Sentry" as complete RUM coverage without asking what happens to that visibility if Sentry ingestion is degraded, rate-limited, or the `window.Sentry` global is unavailable at call time.
- **Evidence:** `WebVitals.tsx` calls `useReportWebVitals` and forwards every metric to `window.Sentry?.setMeasurement?.(...)` only (`:11-16`) — no GA4 event, no console log, no custom endpoint. It is the only file in its directory, with no adjacent test file. It is rendered exactly once, gated on Performance consent: `{performanceGranted && <WebVitals />}` (`GatedAnalytics.tsx:44`) — a visitor who has not granted Performance consent contributes no RUM data for that session, which is a legitimate consent-driven gap, not a defect, but does mean Sentry-derived RUM undercounts the full visitor population by construction.
- **CleanStart:** Fail

---

### PERF-15 — Every LCP-candidate image's `priority`/`sizes` correctness must be verified per file, not sampled

- **Severity:** P3
- **Applies:** Any project applying `priority`/`sizes` conventions across a large number of hero or content components
- **Rule:** When a `priority`/`sizes`/`lcp` convention is applied across dozens of components, its completeness should be verified with a per-file check (an automated lint rule, a CI script, or a documented full manual pass) rather than left as an assumption extrapolated from a handful of sampled files.
- **Why:** PERF-05 and PERF-09 both depend on this convention holding true everywhere it's claimed to; a sampled verification can miss a minority of files where the pattern was applied incorrectly or not at all, and — absent an automated check — that gap has no way to surface itself before a real LCP regression does.
- **Acceptance:** A CI check, lint rule, or a dated full manual audit confirms `priority`/`sizes` correctness across every file using the convention — not just the files an ad hoc sample happened to cover.
- **Verify:** `grep -rL "sizes=" apps/web/src/components/sections --include='*.tsx' | xargs grep -l "next/image" 2>/dev/null | wc -l`
- **Reference:** None — no reference implementation (no lint rule or CI script currently performs this check)
- **Source:** Convention — not vendor-confirmed
- **Tools:** Not applicable — no tool in this SOP's evidence base scores convention-completeness across a component tree; this would require a custom lint rule.
- **Anti-patterns:** Citing "we have a convention for this" as equivalent to "we have verified the convention holds everywhere," when the two are only equivalent if something actually checks the second claim.
- **Evidence:** Per `docs/seo/evidence/codebase-inventory.md`'s own flagged gaps: "Whether every hero component with an `<Image>` LCP candidate actually sets `priority`" and "Which 2 of the ~62 files importing `next/image` under `components/sections` lack a matching `sizes=`" are both listed as requiring a per-file read or per-file grep that was not performed in that audit pass. No lint rule, CI script, or dated full-coverage audit was found addressing either gap directly.
- **CleanStart:** Unverified — no automated check or documented full-coverage audit exists for either the `priority` or `sizes` convention; closing this requires building one, not re-sampling the same handful of files again.
