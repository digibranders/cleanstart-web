# CleanStart Web — Responsive Design Forensic Audit

**Date:** 2026-05-18
**Scope:** `apps/web` (entire marketing site)
**Files audited:** 113 (.tsx components + globals.css)
**Audit method:** 7 parallel forensic-read agents covering every page folder, plus UI primitives, nav, page composition files, and design-token source.

---

## Executive summary

CleanStart Web was designed at a **1920px Figma frame** and implemented with a **`max-w-[1276px]` container**. The container choice is correct. The implementation, however, copied **internal component pixel values** directly from the 1920 Figma — card heights, font sizes, paddings, decorative offsets — into a rendering context that's effectively 1276px (or narrower).

Result: the site looks calibrated at the 1920 design canvas (where the designer reviewed it at ~50–60% zoom) but renders oversized at every common real-world viewport (1280–1440), and structurally breaks at 1024 and below on several pages.

**This is not a rebuild. It's a systematic sweep of ~600 hardcoded values, replaced with a documented token system and `clamp()`/aspect-ratio primitives.**

The good news the audit uncovered:

1. The team **already knows the correct discipline** — top-level section headings universally use `clamp()`, the `--text-display-{sm,md,lg}` tokens exist in `globals.css`, and `apps/web/docs/typography.md` already mandates "no `px` font sizes, prefer tokens." **The rule exists. It's been violated below the section-heading layer.**
2. Several files are exemplary — `apps/web/src/components/ui/button.tsx`, `HeroOrb.tsx`, `PastEventsGrid.tsx`, `BlogDetailContent.tsx`, `VulnBlogsResources.tsx`, `VulnClearImpact.tsx`. These are the templates for everything else.
3. The Vulnerability Remediation page is materially less rigid than the About page despite shipping later — proves the team's discipline has improved over time. The fix is to backport that discipline to earlier pages.

The bad news:

1. **Card heights are universally hardcoded** — `h-[374px]`, `h-[308px]`, `h-[441px]`, `h-[521px]`, `w-[404px]`, `w-[622px]`. These should be `min-h-[clamp(...)]` or `aspect-ratio`.
2. **Inner card typography is fixed** — `text-[2rem]`, `text-[2.0625rem]`, `text-[1.375rem]`, `text-[1.3125rem]` everywhere. clamp() stops at the section heading.
3. **Decorative elements use 1920-frame absolute coordinates** — `left: -707px`, `top: -358px`, `left: 1086px`, `calc(50% + 327.5px)`. They drift on every non-1920 viewport.
4. **Two UI primitives, FactoryCard and ComparisonCard, are rigid** — they ship the same dimensions everywhere they're used. Highest-leverage fix in the codebase.
5. **The globals.css carousel CSS (`.cs-tt-*`)** is built on rigid pixels (`width: 798px; height: 329px`, peek `width: 600px`, `translate(±319px)`). Fixing the JSX won't reach it.
6. **Architectural issues surfaced during the audit** (not strictly responsive, but blocking):
   - `ResourceCenterSidebar` stacks 540px of nav above the grid on mobile.
   - `ResourceDetailHero` download button **bypasses the LeadCapture form entirely** — gating UX broken.
   - Hardcoded `<br />` tags in About paragraphs force desktop line-shape onto every viewport.
   - `AsrPublicImages` SVG uses `preserveAspectRatio="none"` and distorts connector paths.

---

## Part 1 — The diagnosis

### Why the site feels oversized when Figma looks right

Figma renders the 1920 frame fitted to the designer's screen — typically 50–60% zoom on a 14" MacBook. So a 33px card title visually appears as ~18–20px to the designer at review time.

Browsers render at 100% by default. So the same 33px appears as 33px to the user.

The designer approved a design they were viewing at ~55% of its rendered size. The developer copied pixel values 1:1. **The mismatch is the gap.**

Mathematical correction: viewport ratio is `1440/1920 = 0.75`. But the designer's *perceived* size on a 14" Mac is closer to `0.55× rendered`. So a "correct" size at 1440 viewport sits somewhere between 0.55× and 0.75× of the Figma value.

For practical purposes: **`clamp(min_at_375, vw_curve, design_at_1920)` is the right formula** — it lets sizes scale smoothly between mobile-floor and 1920-ceiling.

### What the team did right

- **Container rail**: `max-w-[1276px]` is correct. Don't change it.
- **Page gutter**: `px-6` (24px) is correct.
- **Top-level section H2**: clamp-based throughout. This is the discipline that needs to propagate down.
- **Design tokens documented**: `apps/web/docs/typography.md` already says "no `px` font sizes."
- **Best-in-class examples**: `button.tsx` (pure CVA + Tailwind tokens, zero fixed px), `HeroOrb.tsx` (SVG viewBox + container queries), `PastEventsGrid.tsx` (auto-fit grid), `BlogDetailContent.tsx` (820px reading column + 260px TOC).

### What broke

- **Inside cards/widgets**: clamp discipline forgotten. Every card title is `text-[2rem]` or `text-[2.0625rem]`. Every body is `text-[1.375rem]` or `text-[1.3125rem]`. None scale.
- **Card sizing**: hardcoded heights instead of `min-h` or `aspect-ratio`.
- **Decorative offsets**: pixel coordinates from the 1920 Figma frame applied as `left: -Xpx`, `top: -Ypx`. They float incorrectly at every other viewport.
- **Hardcoded grids**: `gridTemplateColumns: "606px 595px"` (VulnAdvantage), `gridTemplateColumns: "513px 1fr"` (BlogsHero), `lg:[grid-template-columns:401px_493px]` (ReadyToSecureCTA) — none have fallbacks for 1024–1279.
- **Hardcoded section paddings**: `lg:py-[150px]`, `py-32`, `pb-[250px]` without responsive steps or clamps.
- **CSS-side rigidity**: `globals.css` `.cs-tt-*` (testimonial carousel) and `.cs-pill-cta` rules are 100% pixel-fixed.

---

## Part 2 — Audit statistics

| Metric | Count |
|---|---|
| Files audited | 113 |
| Pages covered | 15 routes / 14 page folders |
| Section components | 84 |
| UI primitives | 8 |
| Nav components | 5 |
| Lines of section code | ~15,682 |
| `max-w-[1276px]` instances (correct) | 53 |
| Fixed-type instances (`text-[Xrem/Xpx]`, fixed Tailwind tokens for prominent display copy) | ~150 |
| Fixed-dimension instances (`h-[Xpx]`, `w-[Xpx]`, `min-h-[Xpx]` not driven by clamp) | ~600+ |
| Files using `clamp()` for at least the H2 | ~62 (✅) |
| Files where card-internal type is fully fluid | ~6 |

**Verdict distribution:**
- ✅ FLUID (or composition-only): ~24 files
- ⚠️ PARTIAL: ~58 files
- ❌ RIGID: ~31 files

---

## Part 3 — Per-page findings

Below, every page is summarized with its worst rigidity points and per-section verdicts. Detailed line-level findings live in the agent transcripts at `/private/tmp/claude-501/.../tasks/`. This synthesis is the canonical decision document.

### Home page (`apps/web/src/app/page.tsx`)

| File | Verdict | Notes |
|---|---|---|
| `Hero.tsx` | ✅ | H1 fluid; one button font-size (20px) hardcoded |
| `HeroOrb.tsx` | ✅✅ | **Gold standard**: SVG viewBox + container queries + `clamp(220px, 26cqi, 340px)` orb sizing |
| `TrustedByMarquee.tsx` | ⚠️ | Strap line `text-[1.1875rem]` fixed; logos 120px wide at all viewports |
| `CleanStartFactory.tsx` | ⚠️ | Title fluid; **flame x-offsets (`calc(50% ± 539.6px ...)`)** assume 5-up 1276 layout, misalign below lg |
| `FactoryEnginePanel.tsx` | ⚠️ | Card text fluid; `lg:h-[188.72px]` rigid; `.cs-pill-cta` (CSS-side) entirely fixed |
| `SecurityNotPatching.tsx` | ❌ | **Inner card `h-[441px]`**, header `h-[130px]`, 10× `text-[1.375rem]` bullet labels, `text-[2rem]` headers, Kubr 290×299 fixed |
| `CleanStartAdvantage.tsx` | ⚠️ | H2 fluid; stat number `text-4xl` + label `text-2xl` fixed; `lg:py-[150px]` rigid |
| `HowCleanStartHelp.tsx` | ❌ | **CISO + 3 feature cards locked at `h-[308px]`**; feature card `paddingLeft/Right: 70px` (eats 140px on mobile); title `text-[2rem]` + body `text-[1.375rem]` fixed; SVG L-shape uses `preserveAspectRatio="none"` and distorts |
| `BuiltForTeams.tsx` | ❌ | Entire carousel CSS rigid: `.cs-tt-card--active { width: 798px; height: 329px }`, peeks `width: 600px`, `translate(±319px)`. **Worst CSS-side offender in the codebase.** |
| `FrequentlyAskedQuestions.tsx` | ⚠️ | Q/A clamp upper bounds below Figma sizes (1.5rem vs designed 32px); decorative blobs at fixed `right: 162px / left: 215px` |
| `ResourcesInsights.tsx` | ⚠️ | Tab `text-xl h-12 px-8`, article image `h-[231px]` rigid, `pt-32` no responsive step |
| `ReadyToSecureCTA.tsx` | ❌ | **`lg:[grid-template-columns:401px_493px] [column-gap:115px] [padding:80px_145px_80px_122px]`** — fills exactly 1276 and breaks 1024–1275; Kubr overlay at `left: 63px, top: -154px, w/h: 304/206` rigid |
| `Header.tsx` | ✅ | `h-[72px]` intentional; only `--cs-btn-fs: 14px` to clamp |
| `Footer.tsx` | ⚠️ | CTA slot `h-[460px] sm:h-[400px] lg:h-[330px]` (responsive but stepped); award badges `h-[120px] w-[98px]` rigid; decorative ellipse `height: 863px` rigid |
| `page.tsx` | ⚠️ | FAQ bg grids hardcoded `left: -435px, top: -743px` (1920-frame coords); `pb-[250px]` no clamp |

**Home worst-3 offenders:** SecurityNotPatching, HowCleanStartHelp, BuiltForTeams. The home page is the most-visited route and where this fix has the highest ROI.

### About page (`apps/web/src/app/about-us/page.tsx`)

| File | Verdict | Notes |
|---|---|---|
| `AboutHero.tsx` | ⚠️ | H1 fluid; `minHeight: 569px`, `pt-[178px]`, two 408×408 blobs, 743×811 cube with `calc(50% + 327.5px)` offset, button vars rigid |
| `AboutOurStory.tsx` | ❌ | **`height: 600px` (not minHeight!)** + **seven hardcoded `<br />` tags** in the paragraph forcing desktop line-shape. Text overflows fixed box on mobile. |
| `AboutOurVision.tsx` | ⚠️ | Type fluid; decorative vectors at `left: -393px / right: -368px`; target image floor `420px` overflows mobile |
| `AboutWhoWeAre.tsx` | ❌ | **H2 `whiteSpace: nowrap`** overflows below 430px; pillar `text-[2rem]` + `text-xl` fixed; dividers `height: 249px` don't track column height |
| `AboutPowering.tsx` | ❌ | **`FeatureCard` 346×420 `shrink-0`** with absolutely-positioned title `top: 180` + body `top: 260`; long titles will overlap body. Worst card on the page. |
| `AboutEcosystems.tsx` | ⚠️ | Logo strip no `flex-wrap`, `gap-x-[120px] px-[180px]` fixed; hardcoded `<br />` in H2; `pb-[250px]` rigid |
| `AboutCTA.tsx` | ⚠️ | Padding fluid; three buttons with fixed `width: 131/163/111 px` |
| `about-us/page.tsx` | ✅ | Composition only |

**About cross-page pattern:** uses `py-[100px]` / `py-[120px]` flat at every viewport — does NOT use the responsive `py-16 md:py-20 xl:py-[X]` pattern that Vulnerability Remediation correctly uses.

### Vulnerability Remediation (`apps/web/src/app/vulnerability-remediation/page.tsx`)

| File | Verdict | Notes |
|---|---|---|
| `VulnHero.tsx` | ⚠️ | Type fluid; `minHeight: 739px`, `paddingTop: 166px`, shield 439×545 + `top: 178px`, blob 1301×1295, mesh `h: 1171px` all fixed |
| `VulnRethinking.tsx` | ⚠️ | All type fluid; card padding `40px 48px` fixed, VS badge 72×72 + fontSize 20px fixed |
| `VulnSecurityClean.tsx` | ✅ | Icon sizes use `clamp(140px,11.35vw,218px)` — best card-icon pattern in audit |
| `VulnAdvantage.tsx` | ❌ | **`gridTemplateColumns: "606px 595px"` + 75px gap = exactly 1276** → overflows any 1280–1439 xl viewport. `paddingLeft: 180px` on right column creates asymmetry. |
| `VulnWhyEliminate.tsx` | ⚠️ | Shield card `512×352` only at xl (OK); ball 72×72 fixed |
| `VulnClearImpact.tsx` | ✅ | Best-in-class. All type clamp, stagger `xl:mt-[69px]` only |
| `VulnBlogsResources.tsx` | ✅✅ | Best file in the audit — every text, tab, gap, padding is clamp |
| `VulnCTA.tsx` | ⚠️ | Type fluid; cube 211×213 + divider h-160 fixed |
| `vulnerability-remediation/page.tsx` | ✅ | Composition only |

**Vuln cross-page pattern:** consistently uses `py-16 md:py-20 xl:py-[X]` responsive scale. This is the template every other page should follow.

### FIPS (`apps/web/src/app/fips/page.tsx`)

| File | Verdict | Notes |
|---|---|---|
| `FipsHero.tsx` | ⚠️ | Type fluid; `minHeight: 741px`, `paddingTop: 186px`, shield positions all fixed |
| `FipsBall.tsx` | ⚠️ | Internally fluid (% coords), externally pinned via `size` prop (callers pass 92/84 px) |
| `FipsWhyMatters.tsx` | ⚠️ | Type fluid; card `minHeight: 284px` rigid; 768–1024 squeeze on 3-up |
| `FipsEnables.tsx` | ✅ | **Best section in FIPS** — all positions converted to `%` via `(x / HUB_W) * 100%` ✅ |
| `FipsRegulatedEnvironments.tsx` | ⚠️ | Type fluid; 4-up at md may squeeze |
| `FipsMaturityModel.tsx` | ⚠️ | Type fluid; `minHeight: 320px`, ball 84px fixed |
| `FipsOperationalImpact.tsx` | ✅ | All clamps; only `xl:pb-[250px]` jump without `lg:` step |
| `FipsCTA.tsx` | ✅ | All positions converted to `%`; mobile fallback exists |
| `fips/page.tsx` | ✅ | Composition only |

### Attack Surface Reduction (`apps/web/src/app/attack-surface-reduction/page.tsx`)

| File | Verdict | Notes |
|---|---|---|
| `AsrHero.tsx` | ❌ | **560×500 `shrink-0` cards container** vs 600px text col at md → near-zero text width 768–1023. Hero `minHeight: 720px`, paddings `168/96` fixed |
| `AsrPublicImages.tsx` | ❌ | **303px corner cards collide with 560px center container at 768–1024**. SVG uses `preserveAspectRatio="none"` distorting connector paths. Card text fixed 18/13 px. |
| `AsrApproach.tsx` | ❌ | Desktop title 32px + desc 22px hardcoded; cell `py-12 paddingLeft/Right: 56px` fixed; icon 220×220 fixed |
| `AsrProductionEnv.tsx` | ✅ | One of the best — `minHeight: clamp(400px,39.5vw,758px)`, all type fluid |
| `AsrFitsBuilt.tsx` | ❌ | Card `minHeight: 352px`, title 32px / desc 20px fixed; **decorative grid-line x-coords `[68,166,224,322]` larger than the card itself at md** |
| `AsrBusinessDelivers.tsx` | ✅ | Photo bg + clamp type throughout — close to gold standard |
| `AsrCTA.tsx` | ⚠️ | Positions via `calc(x/1276*100%)` (good); body `fontSize: 16px` + button 18px fixed |
| `attack-surface-reduction/page.tsx` | ✅ | Composition only |

### Blogs list (`apps/web/src/app/blogs/page.tsx`)

| File | Verdict | Notes |
|---|---|---|
| `BlogsHero.tsx` | ⚠️ | Type fluid; **`gridTemplateColumns: "513px 1fr"` no breakpoint variant** — featured row doesn't reflow. `whiteSpace: nowrap` on clamp subtitle overflows narrow viewports. `minHeight: 1059px` rigid. |
| `BlogsHeroSearch.tsx` | ❌ | Form `width: 622px` + button 52×42 — overflows below 720 viewport |
| `LatestBlogs.tsx` | ❌ | **`gridTemplateColumns: "repeat(3, 1fr)" inline` with no md/lg/xl breakpoint variant.** Combined with BlogCard's 404px width, blogs index breaks below 1280. |
| `BlogCard.tsx` | ❌ | **`width: 404px, height: 528px`** with absolute-positioned image (`width: 380px`), badge (`top: 190`), content (`top: 247`). Same disease as NewsroomCard. Below 440 viewport, page horizontal-scrolls. |
| `BlogsCTA.tsx` | ❌ | Inner `width: 1047px, gap: 115px` with `shrink-0` 401+493 px children, no flex-wrap/column-stack fallback |
| `blogs/page.tsx` | ✅ | Composition only |

### Blog detail (`apps/web/src/app/blog/[slug]/page.tsx`)

| File | Verdict | Notes |
|---|---|---|
| `BlogDetailHero.tsx` | ⚠️ | Delegates to `_shared/DetailHero`; meta icon sizes inconsistent (32 vs 40 px) |
| `BlogDetailContent.tsx` | ✅✅ | **Gold standard for long-form layouts**: 260px TOC + 680px body + 1120px outer, decorative blobs `hidden lg:block` |
| `BlogDetailAuthor.tsx` | ✅✅ | Best file in the audit — `clamp(96px, 12vw, 144px)` photo, all type fluid, `p-5 sm:p-6` responsive |
| `BlogDetailFAQ.tsx` | ⚠️ | Type fluid; **`xl:` vs `lg:` breakpoint mismatch with siblings** — misaligns at 1024–1279 |
| `BlogDetailRelatedPosts.tsx` | ⚠️ | Grid reflow `grid-cols-1 md:grid-cols-2 xl:grid-cols-3` is correct; card title `text-2xl` + read-more `text-xl` fixed |
| `BlogDetailCTA.tsx` | ❌ | 6+ decorative elements at fixed 1920/1276 coords with no responsive fallback |
| `blog/[slug]/page.tsx` | ⚠️ | Trailing `paddingBottom: 250px`, `height: 170/186px` spacers all rigid |
| `_shared/DetailHero.tsx` | ⚠️ | Breadcrumb has no `flex-wrap`; `min-h: 480` fixed |

### Resource Center (`apps/web/src/app/resource-center/page.tsx`)

| File | Verdict | Notes |
|---|---|---|
| `ResourceCenterHero.tsx` | ✅ | Type fluid; chrome dimensions fixed but acceptable |
| `ResourceCenterSidebar.tsx` | ❌ | **Architectural failure on mobile**: stacks 9 full-width rows above grid; ~540px of nav before user sees any resource. `whitespace-nowrap` on long labels. **Worst mobile reflow in the codebase.** |
| `ResourceGrid.tsx` | ⚠️ | `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3` correct; everything inside is rigid |
| `ResourceCard.tsx` | ⚠️ | Cover overlay title uses `cqw` (excellent); but card locked at `328×354` with absolute-positioned cover, badge, content |
| `ResourceCenterCTA.tsx` | ⚠️ | `lg:w-[486px]/[564px]/[493px]` fixed columns; padding fluid |
| `resource-center/page.tsx` | ⚠️ | `paddingBottom: 250px` rigid |

### Resource detail (`apps/web/src/app/resource/[slug]/page.tsx`)

| File | Verdict | Notes |
|---|---|---|
| `ResourceDetailHero.tsx` | ⚠️ | Type fluid; 2-step (`lg:`) padding/height jumps; **breadcrumb `text-xs` fixed** |
| `ResourceDetailContent.tsx` | ⚠️ | Cover overlay uses `cqw` (excellent); body type 2-step `text-base lg:text-xl` not clamp |
| `ResourceDetailLeadCapture.tsx` | ⚠️ | Form reflow correct; 4 fixed widths `lg:w-[486/549/493 px]`; **checkbox 14×14 below WCAG 2.5.5 (24×24 minimum)** |
| `resource/[slug]/page.tsx` | ✅ | Composition only |

**Architectural flag (CRITICAL)**: `ResourceDetailHero.tsx` Download button uses `download={assetHref !== "#"}` and direct-streams the asset whenever it exists, **bypassing the LeadCapture form entirely**. If gating is intended, the Hero CTA should scroll to the form or render conditionally. Per `CLAUDE.md` the `resources` collection has a `gateForm` field that is currently ignored.

### Newsroom (`apps/web/src/app/news/page.tsx`)

| File | Verdict | Notes |
|---|---|---|
| `NewsroomHero.tsx` | ⚠️ | Type fluid; **decorative formula `calc(50% + Xpx - 720px)` keyed to 1440 half-width, not 1276 half-width** — proves dev typed from 1440 design |
| `NewsroomGrid.tsx` | ❌ | Grid reflows correctly but cards (`NewsroomCard`) are rigid 404px → cards overflow tracks at all breakpoints |
| `NewsroomCard.tsx` | ❌ | **`width: 404px, height: 521px`** with absolute-positioned internals at `top: 247px`. Same disease as BlogCard. **Causes horizontal page scroll below 1024.** |
| `news/page.tsx` | ✅ | Composition only |

### News detail (`apps/web/src/app/news/[slug]/page.tsx`)

| File | Verdict | Notes |
|---|---|---|
| `NewsDetailHero.tsx` | ⚠️ | Title fluid via shared `DetailHero`; meta 3× `fontSize: 20px` fixed; share icons 32×32 |
| `NewsDetailBody.tsx` | ✅ | Best detail-body file — 820px reading column, publisher card sized correctly. **`.article-body` CSS needs separate audit** (lives in globals, not visible to per-component fix) |
| `NewsDetailRelated.tsx` | ⚠️ | Reflow correct; type fixed (`text-xs/sm/base`, title `1.125rem`) |
| `news/[slug]/page.tsx` | ⚠️ | `paddingBottom: 250px` + `height: 170px` spacer rigid |

### Events (`apps/web/src/app/events/page.tsx`)

| File | Verdict | Notes |
|---|---|---|
| `UpcomingEventHero.tsx` | ❌ | **Featured card inner uses `flex` with `width: 585px shrink-0` image + 44px gap + content — no `flex-col` breakpoint switch.** Card `height: 368px` locked. Hero `minHeight: 746px`. |
| `EventCard.tsx` | ⚠️ | Card `width: 100%` adapts to grid (good); type and `height: 496px` rigid |
| `PastEventsGrid.tsx` | ✅✅ | **Gold standard for card grids**: `grid-template-columns: repeat(auto-fit, minmax(320px, 404px))` — auto-reflows by viewport without breakpoint declarations |
| `EventDetailHero.tsx` | ⚠️ | 4× `fontSize: 20px` fixed; emoji icons (📅, 📍) instead of SVG |
| `events/page.tsx` | ✅ | Composition |
| `events/[slug]/page.tsx` | ✅ | Uses `aspectRatio: 16/7` for hero image (correct pattern) |

### Podcast (`apps/web/src/app/podcast/page.tsx`)

| File | Verdict | Notes |
|---|---|---|
| `PodcastHero.tsx` | ✅ | H1 + subtitle clamp; eyebrow `text-[14px]` minor |
| `PodcastFeaturedContent.tsx` | ⚠️ | `pt-[80px] pb-[80px]` rigid; otherwise OK |
| `PodcastLatestEpisodes.tsx` | ⚠️ | H2 fluid; `pb-[250px]` rigid |
| `PodcastCTACards.tsx` | ❌❌ | **404×435 fixed card built ENTIRELY with absolute coordinates.** Vertical guide lines hardcoded at `[68,166,224,322]` px never align outside 1920 frame. `minHeight: 635px` on section. **Worst single file in the entire audit.** |
| `PodcastEpisodeCard.tsx` | ⚠️ | Title `text-[18px]/text-[20px]` fixed |
| `YouTubeEmbed.tsx` | ✅ | `aspect-video w-full`; only play button 72×72 fixed |
| `podcast/page.tsx` | ✅ | Composition |

### Webinars (`apps/web/src/app/webinars/page.tsx`)

| File | Verdict | Notes |
|---|---|---|
| `WebinarsHero.tsx` | ⚠️ | Type fluid; `paddingTop: 140px`, hex 440×440, glow 720×320 fixed |
| `WebinarsGrid.tsx` | ⚠️ | Sidebar column hardcoded `299px`; `paddingBottom: 250px` rigid |
| `WebinarCard.tsx` | ⚠️ | Card `width: 100%` adapts (good); but 13/14/15/18 px type all fixed |
| `WebinarFilters.tsx` | ❌ | **Sidebar `width: 299px` even when stacked on mobile** — overflows below 325px viewport; all type fixed; checkbox 20×20 (borderline WCAG) |
| `webinars/page.tsx` | ✅ | Composition |

### UI primitives (shared across all pages)

| File | Verdict | Notes |
|---|---|---|
| `FactoryCard.tsx` | ❌❌ | **`h-[374px]` + absolute-positioned orb/text/arrow at fixed coords + `text-[2.0625rem]` title.** Site-wide impact. |
| `ComparisonCard.tsx` | ❌❌ | **`w-[622px]` with no `max-w` qualifier** — overflows viewports below 622. Used site-wide. |
| `FadeUp.tsx` | ✅ | Motion wrapper; no layout |
| `RocketFlame.tsx` | ⚠️ | Accepts `height` prop; default 220px rigid |
| `accordion.tsx` | ✅ | Tailwind tokens throughout |
| `button.tsx` | ✅✅ | **Gold standard.** CVA + Tailwind tokens, zero fixed px. Template for new primitives. |
| `navigation-menu.tsx` | ✅ | Desktop-only via parent guard |
| `sheet.tsx` | ✅ | `w-3/4 sm:max-w-sm` — fluid drawer |

### Nav (shared across all pages)

| File | Verdict | Notes |
|---|---|---|
| `DesktopNav.tsx` | ✅ | `hidden lg:flex` guard |
| `MobileNav.tsx` | ✅ | `w-[88vw] max-w-[360px]` drawer |
| `MegaMenu.tsx` | ✅ | Grid fluid columns; default width 520 could clamp at 1024 |
| `CompactDropdown.tsx` | ✅ | Desktop scope only |
| `NavLink.tsx` | ✅ | Inline-flex utility |

**Nav verdict: the nav system is the cleanest part of the codebase. No changes needed.**

### globals.css

| Section | Verdict | Notes |
|---|---|---|
| `@theme` tokens (`--text-display-*`) | ✅ | Already clamp-based |
| `.article-body` selectors | ✅ | All use clamp — verified in audit |
| `.cs-btn-glass` / `.cs-btn-blue` | ⚠️ | Fallback `--cs-btn-fs: 14px` rigid; consumers pass fixed px vars |
| `.cs-pill-cta` | ❌ | `height: 31px`, `font-size: 1.125rem` rigid — cascades to every Plan/Build/Attest pill |
| `.cs-tt-stage` + `.cs-tt-card--active` + `.cs-tt-peek` | ❌❌ | **798×329 active card, 600×260 peeks, translate(±319px)** — entire testimonial carousel is rigid. Fixing JSX alone won't reach it. |
| `.cs-rocket-flame` | ⚠️ | `width: 36px; height: 220px` fixed (decorative) |
| `.cs-orb-stage` + `.cs-orb` | ✅✅ | `aspect-ratio: 1280/520` + `clamp(220px, 26cqi, 340px)` — perfect |

---

## Part 4 — Cross-cutting patterns

These patterns recur across multiple files. Fix the patterns, not the instances.

### Pattern 1 — "Section heading fluid; everything below it rigid"

The `clamp()` discipline correctly applies to section H2 headings (62 files do this). It stops there. Card titles, body copy, pill labels, CTA labels, meta text — all fixed.

**Where it appears:** SecurityNotPatching, HowCleanStartHelp, ResourcesInsights, BlogCard, NewsroomCard, ResourceCard, WebinarCard, EventCard, PodcastEpisodeCard, AsrApproach, AsrFitsBuilt, AboutPowering, AboutWhoWeAre, ReadyToSecureCTA. ~30 files.

**Fix:** add `--text-card-title-{sm,md,lg,xl}` and `--text-body-{sm,md,lg}` clamp tokens to `globals.css @theme`, then replace `text-[Xrem]` with these tokens systematically.

### Pattern 2 — "Card height locked to Figma px"

Cards use fixed heights from Figma instead of `min-h` or `aspect-ratio`. Content can't drive height; viewport-narrow scenarios result in over-tall cards with empty space.

**Worst instances:**
- FactoryCard `h-[374px]`
- HowCleanStartHelp CISO + 3 feature cards `h-[308px]`
- SecurityNotPatching white panel `h-[441px]`
- BlogCard `height: 528px` + `width: 404px`
- NewsroomCard `height: 521px` + `width: 404px`
- ResourceCard `height: 354px` + `maxWidth: 328px`
- EventCard `height: 496px`
- WebinarCard `minHeight: 420px`
- AboutPowering FeatureCard `width: 346px height: 420px` (with absolute internals)

**Fix:** universal replace `h-[Xpx]` → `min-h-[clamp(Y, Zvw, X)]`. For cards driven by image aspect, use `aspect-[W/H]` on the image container instead.

### Pattern 3 — "Card width locked to Figma px"

Cards declare `width: Xpx` without `max-width:` constraint. At narrower viewports they overflow their grid track, causing horizontal page scroll.

**Worst instances:**
- BlogCard `width: 404px` (combined with `LatestBlogs.tsx` `grid-template-columns: repeat(3, 1fr)`)
- NewsroomCard `width: 404px`
- ComparisonCard `w-[622px]` (with NO max-w)
- AboutPowering FeatureCard `width: 346px` + `shrink-0`
- PodcastCTACards card `width: 404px`

**Fix:** universal replace `w-[Xpx]` → `w-full max-w-[Xpx]`.

### Pattern 4 — "Absolute-positioned card internals"

Cards lay out internal elements with `absolute top: Xpx left: Ypx` inside a fixed-height parent. Content cannot reflow. If text wraps differently, elements overlap or clip.

**Worst instances:**
- BlogCard: image at `top: 12, width: 380`, badge at `top: 190`, content at `top: 247 left: 32 right: 32 bottom: 32`
- NewsroomCard: identical pattern
- FactoryCard: orb at `top: 19 left: 6 w: 220 h: 164`, text at `top: 184 w: 169`, arrow at `top: 322`
- ResourceCard: cover at `top: 15 left: 15 right: 15 h: 138`, badge at `top: 133 left: 26`, content at `top: 183`
- AboutPowering FeatureCard: title at `top: 180`, body at `top: 260` (length-sensitive overlap bug)
- PodcastCTACards: every element absolute with fixed coords + vertical guide lines at `[68,166,224,322]` px

**Fix:** refactor to flex column. Top: image with `aspect-ratio`. Middle: badge floating with negative margin. Bottom: content `flex-1 p-X` with title + meta + CTA.

### Pattern 5 — "Hardcoded grid templates"

Grid templates use fixed pixel widths without breakpoint fallbacks. Fills exact 1276 width but breaks at any narrower viewport.

**Worst instances:**
- `LatestBlogs.tsx` `gridTemplateColumns: "repeat(3, 1fr)"` — no md/lg/xl reflow
- `BlogsHero.tsx` `gridTemplateColumns: "513px 1fr"` — no breakpoint
- `VulnAdvantage.tsx` `gridTemplateColumns: "606px 595px"` — overflows 1280–1439
- `ReadyToSecureCTA.tsx` `lg:[grid-template-columns:401px_493px] [column-gap:115px]` — breaks 1024–1275
- `WebinarsGrid.tsx` `gridTemplateColumns: "299px minmax(0, 1fr)"` — fixed sidebar at lg
- `BlogsCTA.tsx` inner `width: 1047px, gap: 115px` with `shrink-0` 401+493 px children

**Fix:** use Tailwind responsive classes (`grid-cols-1 md:grid-cols-2 xl:grid-cols-3`) or `repeat(auto-fit, minmax(min(100%, X), Y))` — see PastEventsGrid as the template.

### Pattern 6 — "Decorative elements at 1920-frame absolute coords"

Decorative SVGs, blobs, glows positioned with `left: -Xpx` or `top: Ypx` where X and Y are Figma-frame coordinates. They drift on every non-1920 viewport.

**Worst instances:**
- SecurityNotPatching: `left: -707px` and `left: 1086px` (1276-frame coords)
- page.tsx FAQ grids: `left: -435px, top: -743px`, `left: -343px, top: 1505px`
- FrequentlyAskedQuestions: `right: 162px`, `left: 215px` (viewport-relative — drifts on phone)
- Footer ellipse: `height: 863px`, `top: -358px`
- NewsroomHero: earth + grid via `calc(50% + Xpx - 720px)` — **formula keyed to 1440 half-width**, not 1276
- BlogsHero featured row, AsrHero flares (`right: calc(50% - 940px)`), AboutOurVision grid vectors (`left: -393px, top: 306px`), AboutWhoWeAre decoration (`top: -244px`)
- CleanStartFactory flame x-offsets (`calc(50% ± 539.6px ...)`)

**Fix:** convert to percentages — `left: calc(Xpx / 1276 * 100%)` or `left: calc(Xpx / 1920 * 100%)`. For viewport-relative decorations, prefer `vw` units. Hide decorative elements `<md` or `<lg` if they have no role on small screens.

### Pattern 7 — "Section padding hardcoded, no responsive step"

Section vertical padding declared as flat `py-32` (128px) or `py-[120px]` / `py-[150px]` / `pb-[250px]` without `sm:`/`md:`/`lg:` steps or `clamp()`.

**Worst instances:**
- HowCleanStartHelp `pt-32`
- SecurityNotPatching `py-32`
- ResourcesInsights `pt-32`
- CleanStartAdvantage `lg:py-[150px]`
- BuiltForTeams `lg:py-[120px]`
- About page-wide: `py-[100px]`, `py-[120px]` flat everywhere
- Multiple `pb-[250px]` for CTA-overlap reservation

**Fix:** `py-[clamp(Y, Zvw, X)]` or responsive steps `py-16 sm:py-20 lg:py-[X]`. The Vulnerability page uses the responsive-step pattern correctly — copy that.

### Pattern 8 — "Hardcoded `<br />` line breaks in paragraphs"

Editorial `<br />` inside body copy forces desktop line-shape onto every viewport. Mobile renders awkward orphans.

**Where:** AboutHero L72, AboutOurStory L77–82 (seven of them), AboutEcosystems H2 L77.

**Fix:** remove all `<br />` from prose. Let CSS `max-width` and natural wrap shape lines.

### Pattern 9 — "CSS-side rigidity invisible to JSX scans"

`globals.css` defines `.cs-tt-*` testimonial carousel + `.cs-pill-cta` + button fallback vars with fixed px. JSX-only fixes don't reach them.

**Where:** `globals.css` lines 904, 978-979, 996, 1016-1017, 1044, 1049, 1072, 1088, 1097-1128, 1137-1138, 429-433.

**Fix:** must also touch `globals.css` in Phase 2 of migration.

### Pattern 10 — "2-step `lg:` jumps instead of fluid clamp"

Many files use `text-base lg:text-xl` or `h-[42px] lg:h-[64px]` — better than nothing but creates an abrupt jump at 1024. Should be `text-[clamp(...)]` or `h-[clamp(...)]`.

**Where:** ResourceDetailHero (multiple), ResourceDetailContent, ResourceDetailLeadCapture, blog detail components.

**Fix:** prefer single-token `clamp()` over 2-step. Reserve 2-step for layout changes (column count, hide/show), not size scaling.

---

## Part 5 — The Worst Offenders

Ranked by impact (visible breakage × surface area × user-facing prominence):

| # | File | Impact | Severity |
|---|---|---|---|
| 1 | **`apps/web/src/components/ui/FactoryCard.tsx`** | Used on Home + others; 5 cards above the fold; locked dimensions cascade everywhere | ❌❌ |
| 2 | **`apps/web/src/components/sections/podcast/PodcastCTACards.tsx`** | 404×435 absolute-positioned card with vertical guide lines at hardcoded px — entire CTA section visually broken outside 1920 | ❌❌ |
| 3 | **`apps/web/src/components/sections/home/BuiltForTeams.tsx` + globals.css `.cs-tt-*`** | Testimonial carousel 798×329 active + 600×260 peeks with `translate(±319px)` — breaks below 1276 | ❌❌ |
| 4 | **`apps/web/src/components/sections/blogs/BlogCard.tsx` + `LatestBlogs.tsx`** | Causes horizontal page scroll on the blogs index below 1024 | ❌❌ |
| 5 | **`apps/web/src/components/sections/newsroom/NewsroomCard.tsx` + `NewsroomGrid.tsx`** | Same disease as BlogCard; horizontal scroll below 1024 | ❌❌ |
| 6 | **`apps/web/src/components/ui/ComparisonCard.tsx`** | `w-[622px]` no max-w; site-wide breakage below 1280 | ❌❌ |
| 7 | **`apps/web/src/components/sections/home/SecurityNotPatching.tsx`** | `h-[441px]` + 10× `text-[1.375rem]` bullets + Kubr 290×299; above-fold visibility | ❌ |
| 8 | **`apps/web/src/components/sections/home/HowCleanStartHelp.tsx`** | `h-[308px]` cards + `paddingLeft: 70px` on phone + SVG L-shape distortion | ❌ |
| 9 | **`apps/web/src/components/sections/home/ReadyToSecureCTA.tsx`** | `lg:[grid-template-columns:401px_493px] [padding:80px_145px_80px_122px]` — fills exact 1276 and breaks 1024–1275 | ❌ |
| 10 | **`apps/web/src/components/sections/attack-surface-reduction/AsrPublicImages.tsx`** | 303px corner cards collide with 560px center container at 768–1024; `preserveAspectRatio="none"` distortion | ❌ |
| 11 | **`apps/web/src/components/sections/resource-center/ResourceCenterSidebar.tsx`** | Mobile architectural failure: 540px of nav above the grid | ❌ |
| 12 | **`apps/web/src/components/sections/vulnerability-remediation/VulnAdvantage.tsx`** | `606px + 75 + 595 = 1276` exactly; overflows at any 1280-1439 xl viewport | ❌ |
| 13 | **`apps/web/src/components/sections/about/AboutPowering.tsx`** | FeatureCard 346×420 `shrink-0` with absolutely-positioned title/body that overlap when text wraps | ❌ |
| 14 | **`apps/web/src/components/sections/about/AboutOurStory.tsx`** | `height: 600px` (not minHeight!) + 7 hardcoded `<br />` tags | ❌ |
| 15 | **`apps/web/src/components/sections/events/UpcomingEventHero.tsx`** | Featured card no `flex-col` switch — overflows below 960 | ❌ |
| 16 | **`apps/web/src/components/sections/attack-surface-reduction/AsrHero.tsx`** | 560×500 cards container vs 600px text col at md = near-zero text width | ❌ |
| 17 | **`apps/web/src/components/sections/attack-surface-reduction/AsrFitsBuilt.tsx`** | Card minH 352 + 32px title + decorative grid lines at coords larger than card width | ❌ |
| 18 | **`apps/web/src/components/sections/about/AboutWhoWeAre.tsx`** | H2 `whiteSpace: nowrap` overflows mobile; pillar `text-[2rem]` fixed | ❌ |
| 19 | **`apps/web/src/components/sections/attack-surface-reduction/AsrApproach.tsx`** | Desktop title 32px + desc 22px hardcoded; cell `paddingLeft: 56px` fixed | ❌ |
| 20 | **`apps/web/src/components/sections/webinars/WebinarFilters.tsx`** | Sidebar `width: 299px` even when stacked on mobile | ❌ |

---

## Part 6 — Best-in-class patterns to replicate

These are the gold-standard files. Use them as templates.

| File | Pattern to learn | Apply to |
|---|---|---|
| `apps/web/src/components/ui/button.tsx` | CVA + Tailwind tokens, zero fixed px | All future primitives |
| `apps/web/src/components/sections/home/HeroOrb.tsx` | SVG viewBox + `aspect-ratio` + `clamp(220px, 26cqi, 340px)` container-query units | All decorative-heavy components |
| `apps/web/src/components/sections/events/PastEventsGrid.tsx` | `grid-template-columns: repeat(auto-fit, minmax(min(100%, 320px), 404px))` | Every card grid in the codebase |
| `apps/web/src/components/sections/blog/BlogDetailContent.tsx` | 260px TOC + 680px body + 1120px outer with `hidden lg:block` rail | Long-form layouts |
| `apps/web/src/components/sections/blog/BlogDetailAuthor.tsx` | `clamp(96px, 12vw, 144px)` photo + `p-5 sm:p-6` + `gap-5 sm:gap-6` | Bio/profile cards |
| `apps/web/src/components/sections/vulnerability-remediation/VulnBlogsResources.tsx` | Every text/tab/gap/padding clamp; consistent `text-display-md` for H2 | Section-level rhythm |
| `apps/web/src/components/sections/vulnerability-remediation/VulnClearImpact.tsx` | All type clamp; only `xl:mt-[Xpx]` for stagger | Stat blocks |
| `apps/web/src/components/sections/attack-surface-reduction/AsrBusinessDelivers.tsx` | Photo bg + `min-height: clamp(...)` + `clamp(0.875rem, 0.94vw, 16px)` metric desc | Photo-overlay sections |
| `apps/web/src/components/sections/fips/FipsEnables.tsx` | Decorative positions via `(x / HUB_W) * 100%` formula | All decorative element placement |
| `apps/web/src/components/sections/fips/FipsCTA.tsx` / `AsrCTA.tsx` | CTA positions via `calc(x / 1276 * 100%)` | Every Footer-slot CTA |
| `apps/web/src/components/sections/resource-center/ResourceCard.tsx` (cover overlay only) | Container-query units `cqw` for card-internal text | Any card with overlay text |
| `apps/web/src/app/globals.css` `.cs-orb` + `.cs-orb-stage` | `aspect-ratio: 1280/520` + `clamp(220px, 26cqi, 340px)` | All future CSS-side sizing |

---

## Part 7 — The Token System (proposed)

This is the foundation. Add to `apps/web/src/app/globals.css` `@theme` block. Then every section consumes from these tokens. No section reinvents its own size.

```css
@theme {
  /* === EXISTING — keep === */
  --text-2xs: 0.6875rem;
  --text-xs: 0.75rem;
  --text-sm: 0.875rem;
  --text-base: 1rem;
  --text-lg: 1.125rem;
  --text-xl: 1.25rem;
  --text-2xl: 1.5rem;
  --text-3xl: 1.875rem;
  --text-4xl: 2.25rem;

  --text-display-sm: clamp(1.75rem, 4.6vw, 3.4375rem);
  --text-display-md: clamp(2rem, 5.2vw, 3.875rem);
  --text-display-lg: clamp(2.25rem, 6.5vw, 4.5rem);

  /* === NEW — card-level title scale === */
  /* These fill the gap between display-sm and text-3xl */
  --text-card-title-xl: clamp(1.5rem, 2vw, 2.0625rem);    /* 24→33px — FactoryCard, Powering cards */
  --text-card-title-lg: clamp(1.375rem, 1.8vw, 2rem);     /* 22→32px — Security headers, HowCleanStartHelp feature cards, AsrApproach, AsrFitsBuilt */
  --text-card-title-md: clamp(1.125rem, 1.4vw, 1.5rem);   /* 18→24px — most card titles */
  --text-card-title-sm: clamp(1rem, 1.1vw, 1.3125rem);    /* 16→21px — Resources cards, blog cards */

  /* === NEW — fluid body scale (inside cards) === */
  --text-body-xl: clamp(1.0625rem, 1.4vw, 1.5rem);  /* 17→24px — card lead body */
  --text-body-lg: clamp(1rem, 1.2vw, 1.375rem);     /* 16→22px — most card bodies, bullet items */
  --text-body-md: clamp(0.9375rem, 1vw, 1.125rem);  /* 15→18px — secondary text */
  --text-body-sm: clamp(0.875rem, 0.9vw, 1rem);     /* 14→16px — meta text */
  --text-body-xs: clamp(0.75rem, 0.85vw, 0.875rem); /* 12→14px — captions */

  /* === NEW — fluid section padding scale === */
  --space-section-sm: clamp(3rem, 6vw, 5rem);        /* 48→80px — tight sections */
  --space-section-md: clamp(4rem, 8vw, 7.5rem);      /* 64→120px — standard */
  --space-section-lg: clamp(5rem, 10vw, 9.375rem);   /* 80→150px — feature sections */
  --space-section-cta: clamp(10rem, 18vw, 15.625rem); /* 160→250px — CTA-overlap reservation */

  /* === NEW — fluid card padding scale === */
  --space-card-sm: clamp(1rem, 1.5vw, 1.5rem);       /* 16→24px */
  --space-card-md: clamp(1.25rem, 2vw, 2rem);        /* 20→32px */
  --space-card-lg: clamp(1.5rem, 2.5vw, 2.5rem);     /* 24→40px */

  /* === EXISTING container === */
  --container-cs: 1276px;

  /* === EXISTING radii — keep fixed === */
  --radius-cs-card: 24px;
  --radius-cs-card-lg: 40px;
  --radius-cs-pill: 8px;
}
```

After this, Tailwind v4 auto-generates:
- `text-card-title-xl`, `text-card-title-lg`, `text-card-title-md`, `text-card-title-sm`
- `text-body-xl`, `text-body-lg`, `text-body-md`, `text-body-sm`, `text-body-xs`
- `py-section-sm`, `py-section-md`, `py-section-lg`, `pb-section-cta`
- `p-card-sm`, `p-card-md`, `p-card-lg`

### Replacement table

Every fixed-type instance maps to a token:

| Current | Replace with |
|---|---|
| `text-[2.0625rem]` (FactoryCard title) | `text-card-title-xl` |
| `text-[2rem]` (Security header, HowCleanStartHelp feature, AsrApproach, AsrFitsBuilt) | `text-card-title-lg` |
| `text-[1.375rem]` (Security bullets, HowCleanStartHelp feature body) | `text-body-lg` |
| `text-[1.3125rem]` (ReadyToSecureCTA, ResourcesInsights, ResourceCenterCTA, ResourceDetailLeadCapture) | `text-body-lg` |
| `text-[1.1875rem]` (TrustedByMarquee) | `text-body-md` |
| `text-xl` used for card titles | `text-card-title-md` |
| `text-2xl` used for card titles | `text-card-title-md` |
| `text-4xl` used for stats | `text-card-title-xl` |
| `fontSize: 18px` (multiple) | `text-body-md` or clamp |
| `fontSize: 20px` (multiple) | `text-body-lg` or `clamp(1rem, 1.3vw, 1.25rem)` |
| `lg:py-[150px]` | `lg:py-section-lg` |
| `lg:py-[120px]` | `lg:py-section-md` |
| `py-32` (no step) | `py-section-md` |
| `pb-[250px]` | `pb-section-cta` |

### Container query convention (for cards used in multiple contexts)

For cards rendered at multiple widths (e.g., Factory card in 5-up vs 3-up vs stacked), use container queries:

```tsx
<div className="@container/card relative w-full overflow-hidden rounded-[24px]">
  <h3 className="text-[clamp(1.125rem,5cqw,2.0625rem)]">{title}</h3>
</div>
```

This is what `HeroOrb` and `ResourceCard`-cover already do correctly. Extend to FactoryCard, FeatureCard, etc.

---

## Part 8 — Migration plan (phased)

Sequenced for **maximum visual impact early, minimum risk per phase, independent shippability**.

### Phase 0 — Documentation (0.5 day)

- Update `apps/web/docs/typography.md` with the new card/body tokens.
- Update `apps/web/docs/design-tokens.md` with the section-padding tokens.
- Update `CLAUDE.md` `apps/web` section: add "use tokens, not arbitrary text-[Xrem]" rule.
- Add to `CLAUDE.md`: "card heights → `min-h-[clamp()]`, never `h-[Xpx]`."
- Add to `CLAUDE.md`: "card widths → `w-full max-w-[Xpx]`, never bare `w-[Xpx]`."

### Phase 1 — Token foundation (0.5 day)

- Add the new `@theme` tokens to `globals.css` (~25 lines).
- Zero section changes yet.
- Verify Tailwind auto-generates the new utility classes.
- Ship as a no-op PR. Foundation only.

### Phase 2 — UI primitives (3 days) — **HIGHEST LEVERAGE**

These are used by every page. Fixing them propagates across the site.

- **2.1** `apps/web/src/components/ui/FactoryCard.tsx`:
  - Convert from absolute-positioned layout to flex column
  - Card: `min-h-[clamp(280px, 28vw, 374px)]` instead of `h-[374px]`
  - Title: `text-card-title-xl` instead of `text-[2.0625rem]`
  - Body: `text-body-md` instead of `text-lg`
  - Orb wrapper: `aspect-[220/164]` instead of fixed `w-[220px] h-[164px]`
  - Arrow button: `bottom-[Xpx]` instead of `top-[322px]`

- **2.2** `apps/web/src/components/ui/ComparisonCard.tsx`:
  - Card: `w-full max-w-[622px]` instead of `w-[622px]`
  - Header: `h-[clamp(80px, 7vw, 112px)]` instead of `h-[112px]`
  - Title: `text-card-title-md` instead of `text-2xl`
  - Body: `text-body-md` instead of `text-base`
  - Padding: `px-[clamp(20px, 3vw, 48px)] py-[clamp(20px, 2.5vw, 36px)]`

- **2.3** `apps/web/src/components/ui/RocketFlame.tsx`:
  - Default `height: clamp(120px, 14vw, 220px)` instead of `220px`

- Verify visually at 375 / 768 / 1024 / 1280 / 1440 / 1920 on all pages.

### Phase 3 — Home page rigid sections (3 days)

In order of above-the-fold visibility:

- **3.1** `SecurityNotPatching.tsx`:
  - `py-32` → `py-section-md`
  - White panel `h-[441px]` → `min-h-[clamp(360px, 32vw, 441px)]`
  - Header `h-[130px]` → `h-[clamp(96px, 9vw, 130px)]`
  - Bullet labels `text-[1.375rem]` → `text-body-lg` (10 instances)
  - Header label `text-[2rem]` → `text-card-title-lg`
  - Bullet gap `gap-[40px]` → `gap-[clamp(20px, 3vw, 40px)]`
  - Kubr mascot: `width: clamp(180px, 18vw, 290px)` with `aspect-[290/299]`; hide `<md`

- **3.2** `HowCleanStartHelp.tsx`:
  - CISO + 3 feature cards: `h-[308px]` → `min-h-[clamp(260px, 24vw, 308px)]`
  - CISO padding `32px 52px` → `p-[clamp(20px, 3vw, 32px)_clamp(24px, 4vw, 52px)]`
  - Feature card `paddingLeft/Right: 70px` → `clamp(16px, 5vw, 70px)`
  - Title `text-[2rem]` → `text-card-title-lg`
  - Body `text-[1.375rem]` → `text-body-lg`
  - Tab pill `text-lg h-[34px]` → `text-body-md min-h-[32px]`
  - SVG L-shape: replace `preserveAspectRatio="none"` with `xMidYMid meet`, or rebuild as two rounded divs.

- **3.3** `BuiltForTeams.tsx` + `globals.css .cs-tt-*`:
  - **CSS-side** — biggest change:
    - `.cs-tt-stage { height: clamp(280px, 28vw, 360px) }`
    - `.cs-tt-card--active { width: min(798px, 100%); height: clamp(280px, 24vw, 329px) }`
    - `.cs-tt-card--active .cs-tt-card__photo { width: clamp(200px, 20vw, 264px) }`
    - All quote/name/role typography → clamp()
    - `.cs-tt-peek { width: clamp(380px, 46vw, 600px) }`
    - `translate(-319px)` → `translate(calc(-100% + 50px))` or container-query-based
  - JSX: description `text-xl` → `text-body-lg`

- **3.4** `ReadyToSecureCTA.tsx`:
  - Grid `lg:[grid-template-columns:401px_493px]` → `lg:grid-cols-[minmax(280px,401px)_minmax(360px,493px)]`
  - Grid `lg:[column-gap:115px]` → `lg:gap-x-[clamp(40px, 9vw, 115px)]`
  - Grid `lg:[padding:80px_145px_80px_122px]` → `lg:p-[clamp(40px,6vw,80px)_clamp(48px,10vw,145px)]`
  - Kubr overlay: `left: clamp(20px, 5vw, 63px)`, `width: clamp(180px, 18vw, 304px)`
  - Description `text-[1.3125rem]` → `text-body-lg`

- **3.5** Smaller home items: `CleanStartFactory` flame anchors → hide `<lg`; `TrustedByMarquee` strap → `text-body-md`; `Hero` button `--cs-btn-fs: 20px` → `clamp(1rem, 1.2vw, 1.25rem)`; `CleanStartAdvantage` `lg:py-[150px]` → `lg:py-section-lg`; etc.

### Phase 4 — Card-grid pages (2 days)

- **4.1** Blogs index — refactor `BlogCard.tsx` (flex-column, no absolute positioning, `w-full max-w-[404px]`, `min-h-[clamp()]`) + `LatestBlogs.tsx` grid → `grid-cols-1 md:grid-cols-2 xl:grid-cols-3`.
- **4.2** Newsroom — same fix to `NewsroomCard.tsx` + `NewsroomGrid.tsx`.
- **4.3** Podcast `PodcastCTACards.tsx` — full refactor to flex card without absolute coordinates.
- **4.4** Events `UpcomingEventHero.tsx` featured card — add `flex-col lg:flex-row` switch, image `w-full max-w-[585px] aspect-[585/304]`.

### Phase 5 — Other pages sweep (3-4 days)

- About: 8 sections, focus on `AboutOurStory` (remove `<br />`, fix `height: 600px`), `AboutPowering` (rewrite FeatureCard as flex), `AboutWhoWeAre` (drop `whiteSpace: nowrap`).
- ASR: 7 sections. Focus on `AsrPublicImages` (fix `preserveAspectRatio`, convert 303px corner cards to relative %), `AsrHero` (remove `560×500 shrink-0` cards container), `AsrFitsBuilt`, `AsrApproach`.
- FIPS: 8 sections, mostly minor — `FipsHero` paddings, `FipsBall` size prop, card minHeights.
- Vulnerability: already mostly fluid. Fix `VulnAdvantage` grid `606/595` → `1fr 1fr`.
- Blog detail: align `BlogDetailFAQ` breakpoint to `lg:` (currently `xl:`). Fix `BlogDetailCTA` decorative coords.
- Resource Center: **architectural** — rebuild `ResourceCenterSidebar` mobile experience as horizontal pill scroller or `<details>` disclosure.
- Resource detail: convert 2-step typography to clamp; fix `Hero Download button` gating UX (see Part 10).
- Newsroom + News detail: fix `NewsroomHero` decorative `calc()` formula (re-key to 1276/2 = 638px); audit `.article-body` global CSS (separate task).
- Events: fix `UpcomingEventHero` featured card (above); rest is solid.
- Podcast: fix `PodcastCTACards` (above); rest is minor.
- Webinars: rebuild `WebinarFilters` mobile (disclosure or chip-bar); fix `WebinarsGrid` 299px sidebar with clamp.

### Phase 6 — Lock the system (1 day)

- Add Biome rule (or eslint custom) forbidding:
  - `text-[<num>rem]` and `text-[<num>px]` outside an allow-list of justified instances
  - `h-[<num>px]` on elements matching `*Card*` (must use `min-h` or `aspect-ratio`)
  - Bare `w-[<num>px]` on cards (must have `max-w` qualifier)
- Make the linter fail the build.
- Ship.

**Total: ~13 working days**, phased so each phase is shippable.

---

## Part 9 — Verification protocol

After each phase, screenshot at six viewports and compare to Figma at 1440:

| Width | Why |
|---|---|
| **375px** | iPhone SE — narrowest realistic mobile |
| **768px** | iPad portrait |
| **1024px** | iPad landscape / small laptop — **the most-broken viewport currently** |
| **1280px** | Most-common desktop |
| **1440px** | Designer baseline — should match Figma |
| **1920px** | Ultrawide — should still feel proportional, not sparse |

Use `mcp__Claude_Preview__preview_resize` + `preview_screenshot` for each.

**Acceptance criteria per section:**
1. No horizontal page scroll at any of the six widths.
2. No content clipping where text wraps to N lines instead of M.
3. Card grids reflow `3 → 2 → 1` cleanly with no overflowing cards.
4. At 1440, screenshot matches Figma proportionally.
5. At 1920, content feels intentional (not sparse). Container at 1276 with margins is correct.
6. Decorative elements stay within their intended visual frame at all widths.

---

## Part 10 — Architectural flags (non-responsive issues found during audit)

These are not strictly responsive issues but were surfaced during the line-by-line scan. They should be triaged separately.

1. **Resource Detail download bypasses gating** (`ResourceDetailHero.tsx`):
   - L207-209: `<a href={assetHref} download={assetHref !== "#"}>` direct-streams the asset whenever it exists, regardless of the `gateForm` field on the `resources` collection.
   - The Hero Download button should scroll to the LeadCapture form, render conditionally, or check `gateForm` presence.
   - Per `CLAUDE.md`, `resources.gateForm` is meant to control gating — currently ignored on the Hero CTA.

2. **WCAG 2.5.5 touch-target violations**:
   - `ResourceDetailLeadCapture.tsx` consent checkbox: **14×14 px** (below 24×24 minimum).
   - `WebinarFilters.tsx` checkbox: 20×20 (borderline).
   - Hero search button on multiple pages: 42×42 (1px below 44 floor).

3. **Hardcoded `<br />` in body prose** (AboutHero, AboutOurStory, AboutEcosystems):
   - Forces desktop line-shape onto every viewport. Mobile gets orphans and awkward wraps.
   - Remove all `<br />` from prose; rely on `max-width` + natural wrap.

4. **`AsrPublicImages.tsx` SVG distortion**:
   - Uses `preserveAspectRatio="none"` which stretches connector dashes non-uniformly.
   - Fix: change to `xMidYMid meet` and use a single coordinate system for cards + connectors.

5. **`HowCleanStartHelp.tsx` SVG L-shape distortion**:
   - Same problem — `preserveAspectRatio="none"` distorts the 40px corner radii when SVG is stretched.

6. **`BlogDetailFAQ.tsx` breakpoint mismatch**:
   - Uses `xl:` breakpoint where siblings (`BlogDetailContent`, `BlogDetailAuthor`) use `lg:`.
   - Causes visual misalignment at 1024-1279px viewport.

7. **`.article-body` CSS in globals.css**:
   - All prose styling for blog and news bodies lives here.
   - Verified to use clamps in the audit, but worth a dedicated re-read since long-form reading is high-touch.

8. **`apps/web/src/components/sections/Footer.tsx` CTA slot height**:
   - Currently `h-[460px] sm:h-[400px] lg:h-[330px]` — stepped, not clamped.
   - Every per-page CTA component is locked to one of these three heights. Switching to `clamp()` would let each CTA's content drive height.

9. **No `prefers-reduced-motion` audit was performed during this audit**:
   - Multiple files have motion (`FadeUp`, `BuiltForTeams` carousel, `RocketFlame`, hover transitions).
   - Verify `@media (prefers-reduced-motion: reduce)` is honored everywhere.

10. **Logo strip in `AboutEcosystems.tsx` no `flex-wrap`**:
    - Five logos × 200px + 4 gaps × 120 + 360 padding = ~1480px content
    - Logos get clipped on the right at narrow viewports (caught by `overflow-hidden` but invisible to user).

---

## Appendix A — Common fix recipes

### Recipe 1 — Convert a fixed-height card to fluid

**Before:**
```tsx
<div className="relative h-[374px] w-full overflow-hidden rounded-[24px]">
  <div className="absolute left-[6px] top-[19px] w-[220px] h-[164px]">
    <Image src="..." width={168} height={164} />
  </div>
  <div className="absolute left-1/2 top-[184px] w-[169px] -translate-x-1/2">
    <h3 className="text-[2.0625rem]">{title}</h3>
    <p className="text-lg">{description}</p>
  </div>
  <button className="absolute left-1/2 top-[322px] h-7 w-7 -translate-x-1/2">→</button>
</div>
```

**After:**
```tsx
<div className="@container/card relative w-full overflow-hidden rounded-[24px] flex flex-col min-h-[clamp(280px, 28vw, 374px)] p-card-md">
  <div className="aspect-[220/164] w-[clamp(140px,17vw,220px)] mx-auto">
    <Image src="..." width={168} height={164} className="h-full w-auto" />
  </div>
  <div className="mt-auto flex flex-col items-center gap-card-sm text-center">
    <h3 className="text-card-title-xl">{title}</h3>
    <p className="text-body-md">{description}</p>
  </div>
  <button className="mt-card-md mx-auto h-7 w-7" aria-label="...">→</button>
</div>
```

### Recipe 2 — Fix a fixed-width card with absolute internals

**Before:**
```tsx
<article style={{ width: "404px", height: "528px", position: "relative" }}>
  <div style={{ position: "absolute", top: 12, left: 12, width: 380, height: 200 }}>...</div>
  <div style={{ position: "absolute", top: 247, left: 32, right: 32, bottom: 32 }}>
    <h3 className="text-[clamp(1rem,1.67vw,1.5rem)]">{title}</h3>
    <p className="text-base">{excerpt}</p>
  </div>
</article>
```

**After:**
```tsx
<article className="w-full max-w-[404px] rounded-[32px] flex flex-col overflow-hidden bg-white">
  <div className="aspect-[380/200] p-3">
    <Image src="..." className="rounded-[20px] object-cover h-full w-full" />
  </div>
  <div className="flex flex-col gap-2 p-card-md flex-1">
    <h3 className="text-card-title-md">{title}</h3>
    <p className="text-body-md flex-1">{excerpt}</p>
    <Link className="text-body-md mt-auto" href={href}>Read more →</Link>
  </div>
</article>
```

### Recipe 3 — Fix hardcoded section grid

**Before:**
```tsx
<div style={{ display: "grid", gridTemplateColumns: "606px 595px", gap: 75 }}>
  <Left />
  <Right style={{ paddingLeft: 180 }} />
</div>
```

**After:**
```tsx
<div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-[clamp(32px,3.9vw,75px)]">
  <Left />
  <Right className="lg:pl-[clamp(44px,12.5vw,180px)]" />
</div>
```

### Recipe 4 — Fix decorative absolute coords

**Before:**
```tsx
<div style={{ position: "absolute", left: "-707px", top: "401px", width: "1101px", height: "1101px" }} />
```

**After (proportional to 1276 container):**
```tsx
<div
  className="hidden md:block"
  style={{
    position: "absolute",
    left: "calc(-707px / 1276 * 100%)",
    top: "calc(401px / 1276 * 100%)",
    width: "clamp(600px, 86vw, 1101px)",
    aspectRatio: "1/1",
  }}
/>
```

### Recipe 5 — Replace 2-step Tailwind with single clamp

**Before:**
```tsx
className="text-base lg:text-xl pt-12 lg:pt-[64px]"
```

**After:**
```tsx
className="text-[clamp(1rem,1.2vw,1.25rem)] pt-[clamp(48px,5vw,64px)]"
```

### Recipe 6 — Convert pill / button vars to clamp

**Before:**
```tsx
style={{
  "--cs-btn-h": "40px",
  "--cs-btn-px": "18px",
  "--cs-btn-fs": "20px",
}}
```

**After:**
```tsx
style={{
  "--cs-btn-h": "clamp(36px, 3.5vw, 44px)",
  "--cs-btn-px": "clamp(14px, 1.5vw, 22px)",
  "--cs-btn-fs": "clamp(0.9375rem, 1.2vw, 1.25rem)",
}}
```

---

## Appendix B — Verification widths and Figma frame references

| Viewport | Use case | Container width inside `max-w-[1276px] px-6` |
|---|---|---|
| 375 | iPhone SE | 327 (375 - 48 gutter) |
| 414 | iPhone Plus | 366 |
| 768 | iPad portrait | 720 |
| 1024 | iPad landscape | 976 |
| 1280 | Small desktop | 1232 |
| 1440 | Designer baseline | 1276 (capped) |
| 1920 | Ultrawide | 1276 (capped, plus 322 margin each side) |

**Note**: Figma frames are 1920×N. When extracting Figma coordinates for use in code, the formula is:

- For elements inside the 1276 content rail: `pixelCoordinateInFigma / 1276 * 100%`
- For elements that span beyond the rail (full-bleed decoratives, hero blobs): `pixelCoordinateInFigma / 1920 * 100%`

The two formulas exist because Figma laid out some elements relative to the inner rail and others relative to the outer frame.

---

## Appendix C — Files audited (complete list)

Total: 113 files across 14 page folders + UI primitives + nav + globals.

<details>
<summary>Show full file list</summary>

**Home (16):**
- apps/web/src/components/sections/home/Hero.tsx
- apps/web/src/components/sections/home/HeroOrb.tsx
- apps/web/src/components/sections/home/TrustedByMarquee.tsx
- apps/web/src/components/sections/home/CleanStartFactory.tsx
- apps/web/src/components/sections/home/FactoryEnginePanel.tsx
- apps/web/src/components/sections/home/SecurityNotPatching.tsx
- apps/web/src/components/sections/home/CleanStartAdvantage.tsx
- apps/web/src/components/sections/home/HowCleanStartHelp.tsx
- apps/web/src/components/sections/home/BuiltForTeams.tsx
- apps/web/src/components/sections/home/FrequentlyAskedQuestions.tsx
- apps/web/src/components/sections/home/ResourcesInsights.tsx
- apps/web/src/components/sections/home/ReadyToSecureCTA.tsx
- apps/web/src/components/sections/Header.tsx
- apps/web/src/components/sections/Footer.tsx
- apps/web/src/app/globals.css
- apps/web/src/app/page.tsx

**About (8) / Vulnerability Remediation (9):**
- apps/web/src/components/sections/about/{AboutHero,AboutOurStory,AboutOurVision,AboutWhoWeAre,AboutPowering,AboutEcosystems,AboutCTA}.tsx
- apps/web/src/app/about-us/page.tsx
- apps/web/src/components/sections/vulnerability-remediation/{VulnHero,VulnRethinking,VulnSecurityClean,VulnAdvantage,VulnWhyEliminate,VulnClearImpact,VulnBlogsResources,VulnCTA}.tsx
- apps/web/src/app/vulnerability-remediation/page.tsx

**FIPS (9) / ASR (8):**
- apps/web/src/components/sections/fips/{FipsHero,FipsBall,FipsWhyMatters,FipsEnables,FipsRegulatedEnvironments,FipsMaturityModel,FipsOperationalImpact,FipsCTA}.tsx
- apps/web/src/app/fips/page.tsx
- apps/web/src/components/sections/attack-surface-reduction/{AsrHero,AsrPublicImages,AsrApproach,AsrProductionEnv,AsrFitsBuilt,AsrBusinessDelivers,AsrCTA}.tsx
- apps/web/src/app/attack-surface-reduction/page.tsx

**Blogs list (6) / Blog detail (7):**
- apps/web/src/components/sections/blogs/{BlogsHero,BlogsHeroSearch,LatestBlogs,BlogCard,BlogsCTA}.tsx
- apps/web/src/app/blogs/page.tsx
- apps/web/src/components/sections/blog/{BlogDetailHero,BlogDetailContent,BlogDetailAuthor,BlogDetailFAQ,BlogDetailRelatedPosts,BlogDetailCTA}.tsx
- apps/web/src/app/blog/[slug]/page.tsx

**Resource Center (6) / Resource detail (4) / _shared (1):**
- apps/web/src/components/sections/resource-center/{ResourceCenterHero,ResourceCenterSidebar,ResourceGrid,ResourceCard,ResourceCenterCTA}.tsx
- apps/web/src/app/resource-center/page.tsx
- apps/web/src/components/sections/resource/{ResourceDetailHero,ResourceDetailContent,ResourceDetailLeadCapture}.tsx
- apps/web/src/app/resource/[slug]/page.tsx
- apps/web/src/components/sections/_shared/DetailHero.tsx

**Newsroom (4) / News detail (4) / Events (6):**
- apps/web/src/components/sections/newsroom/{NewsroomHero,NewsroomGrid,NewsroomCard}.tsx
- apps/web/src/app/news/page.tsx
- apps/web/src/components/sections/news-detail/{NewsDetailHero,NewsDetailBody,NewsDetailRelated}.tsx
- apps/web/src/app/news/[slug]/page.tsx
- apps/web/src/components/sections/events/{UpcomingEventHero,EventCard,PastEventsGrid,EventDetailHero}.tsx
- apps/web/src/app/events/page.tsx
- apps/web/src/app/events/[slug]/page.tsx

**Podcast (7) / Webinars (5):**
- apps/web/src/components/sections/podcast/{PodcastHero,PodcastFeaturedContent,PodcastLatestEpisodes,PodcastCTACards}.tsx
- apps/web/src/components/sections/podcast/_components/{PodcastEpisodeCard,YouTubeEmbed}.tsx
- apps/web/src/app/podcast/page.tsx
- apps/web/src/components/sections/webinars/{WebinarsHero,WebinarsGrid,WebinarCard,WebinarFilters}.tsx
- apps/web/src/app/webinars/page.tsx

**UI primitives (8):**
- apps/web/src/components/ui/{FactoryCard,ComparisonCard,FadeUp,RocketFlame,accordion,button,navigation-menu,sheet}.tsx

**Nav (5):**
- apps/web/src/components/nav/{DesktopNav,MobileNav,MegaMenu,CompactDropdown,NavLink}.tsx

</details>

---

## Final note

This audit is exhaustive but it's still just the map. The territory — actually fixing 600+ values across 113 files — is the work ahead. The token system in Part 7 is the lever. Build the lever first, then the rest is mechanical.

When you're ready, the recommended first PR is Phase 1 alone (10 lines of CSS to `globals.css` `@theme`). Zero risk, validates the foundation, unblocks every subsequent phase.
