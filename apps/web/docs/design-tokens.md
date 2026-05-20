# CleanStart Design Tokens (extracted from Figma)

> **v3 Consistency Layer is canonical for component work.** Every component touched after 2026-05-20 must pick its sizes from the **role → token mapping tables** in the section below. The lint gate (Sprint 1 Day 4 of the v3 plan) enforces "no arbitrary values"; this section enforces *which* token. Figma values live in this file's later sections for re-extraction reference; the *role assignments* below are the source of truth.

---

## v3 Consistency Layer — role → token mapping (canonical)

This is the contract. Every PR touching a component must quote the rows below it honors. The mapping is locked across every page, every section, every card; never invented per-file.

Backed by research summary at the end of this section (Butterick, NN/g 2024, WCAG 2.2 SC 1.4.4/1.4.12, web.dev typography-for-reading, Apple HIG, Material 3, established CMS reference sizes).

### Typography role → token

| Role | Token | Anchor 375 → 1920 |
|---|---|---|
| Page display H1 (hero) | `text-display-lg` | 36→72px |
| Section H2 | `text-display-md` | 32→62px |
| Sub-section H3 / mid-CTA | `text-display-sm` | 28→55px |
| Feature-card title (hero rank — `FactoryCard`, `AboutPowering` `FeatureCard`) | `text-card-title-xl` | 24→33px |
| Standard card title (Security headers, HowCleanStartHelp, AsrApproach, AsrFitsBuilt, AboutWhoWeAre pillars) | `text-card-title-lg` | 22→32px |
| Compact card title (blog/news/podcast/event/resource/webinar cards) | `text-card-title-md` | 18→24px |
| Pill / tab / micro-heading (`ResourcesInsights` tabs, site-wide pills) | `text-card-title-sm` | 16→21px |
| Lead body (section intro paragraph below H2) | `text-body-xl` | 17→24px |
| Card body (default — `SecurityNotPatching` bullets, `HowCleanStartHelp` feature body, `ReadyToSecureCTA` body) | `text-body-lg` | 16→22px |
| Card body (compact — secondary text, compact grids, marquee strap) | `text-body-md` | 15→18px |
| Meta / caption (timestamps, author meta, share rail, table cells) | `text-body-sm` | 14→16px |
| Eyebrow / breadcrumb / tag (kicker labels) | `text-body-xs` | 12→14px |
| Primary CTA label | discrete `--btn-fs-lg` (20px fixed) | fixed |
| Secondary CTA label | discrete `--btn-fs-md` (16px fixed) | fixed |
| Utility CTA label (`data-cta-utility` opt-out) | discrete `--btn-fs-sm` (14px) | fixed |

### Section vertical-padding role → token

| Section type | Token | Anchor 375 → 1920 | Where |
|---|---|---|---|
| CTA-overlap reservation (sits above `<Footer />`) | `py-section-cta` | 160→250px | every page's last section before the Footer |
| Feature / hero-adjacent | `py-section-lg` | 80→150px | high-prominence sections (`CleanStartAdvantage`, ASR hero-pair, `VulnHero` second pane) |
| Standard | `py-section-md` | 64→120px | the majority of body sections |
| Tight / sequential grid | `py-section-sm` | 48→80px | grid sections needing denser rhythm (`PastEventsGrid`, `LatestBlogs`, `NewsroomGrid`) |

### Card-padding role → token

| Card type | Token | Anchor 375 → 1920 | Where |
|---|---|---|---|
| Hero / feature card | `p-card-lg` | 24→40px | `FactoryCard`, `AboutPowering FeatureCard`, `ReadyToSecureCTA` Kubr card |
| Standard card | `p-card-md` | 20→32px | `BlogCard`, `NewsroomCard`, `ResourceCard`, `EventCard`, `WebinarCard`, `PodcastEpisodeCard`, `PodcastCTACards`, `ComparisonCard` |
| Compact card | `p-card-sm` | 16→24px | pill cards, dense lists, sidebar items |

### Radius (locked — NOT fluid)

| Element | Token | Value |
|---|---|---|
| Hero / feature cards | `rounded-cs-card-lg` (`--radius-cs-card-lg`) | 40px |
| Standard cards | `rounded-cs-card` (`--radius-cs-card`) | 24px |
| Pills / buttons | `rounded-cs-pill` (`--radius-cs-pill`) | 8px |
| Round (full) | `rounded-full` | n/a |

### Decorative-position formula (locked)

| Element scope | Formula |
|---|---|
| Inside the `max-w-[1276px]` content rail | `(figmaPx / 1276) × 100%` |
| Spans beyond the rail (full-bleed blobs, hero grids) | `(figmaPx / 1920) × 100%` |
| Hide below `md` if decorative-only | `hidden md:block` |
| SVG with intrinsic ratio | `viewBox` + `preserveAspectRatio="xMidYMid meet"` (NEVER `"none"`) |

### Grid-reflow breakpoints (locked)

| Grid type | Template |
|---|---|
| 3-up card grid | `grid-cols-1 md:grid-cols-2 xl:grid-cols-3` |
| 2-up content + sidebar | `grid-cols-1 lg:grid-cols-[1fr_1fr]` or `lg:grid-cols-[Xpx_1fr]` |
| Auto-fit card grid | `grid-template-columns: repeat(auto-fit, minmax(min(100%, 320px), 404px))` — copy from `PastEventsGrid.tsx` |

### Touch-target floor (WCAG 2.5.8)

- Primary CTAs (every `<Button>` without `data-cta-utility`): **height ≥ 44px**.
- Icon-only buttons: **44×44** hit area.
- Form checkboxes: **24×24** visual minimum, wrapped in **44×44** hit area.
- Utility / dense controls (filter chips, breadcrumbs, inline secondary): may use the smaller scale steps with explicit `data-cta-utility` attribute; lint allows.

### CMS-prose typography (`.article-body` and any Lexical-render container)

CMS long-form prose uses **different sizes** than marketing card body. Body is *larger* because the page's job is sustained reading, not scanning. Line length is constrained to 60–75 ch via 680px reading column (`BlogDetailContent.tsx` gold standard).

| Element | Clamp range | Anchor 375 → 1920 | Line-height | Rationale |
|---|---|---|---|---|
| `h1` (article title — DetailHero, not body) | `clamp(2rem, 4.8vw, 3.5rem)` | 32→56px | 1.1 | Largest hierarchy stop |
| `h2` (section heading) | `clamp(1.5rem, 2.6vw, 2.25rem)` | 24→36px | 1.2 | ~2× body |
| `h3` (sub-section) | `clamp(1.25rem, 1.9vw, 1.75rem)` | 20→28px | 1.25 | ~1.5× body |
| `h4` | `clamp(1.125rem, 1.4vw, 1.375rem)` | 18→22px | 1.3 | ~1.2× body |
| `p` (body) | `clamp(1.0625rem, 1.2vw, 1.1875rem)` | 17→19px | 1.65 | Inside Medium / Substack / NYT consensus |
| `blockquote` | `clamp(1.125rem, 1.5vw, 1.375rem)` | 18→22px | 1.5 | Signals pull-quote |
| `code` / `pre` | `clamp(0.875rem, 1.05vw, 1rem)` | 14→16px | 1.55 | Monospace renders ~10% smaller optically |
| `figcaption` | `clamp(0.875rem, 0.95vw, 1rem)` | 14→16px | 1.45 | Below body; never below 14 |
| Inline `<a>` | inherits `<p>` | n/a | n/a | Underline at all sizes per WCAG 1.4.1 |
| `ul`/`ol` `li` | inherits `<p>`; `gap: 0.5em` | n/a | 1.6 | Match prose rhythm |
| Heading-anchor scroll-offset | `scroll-margin-top: clamp(80px, 10vw, 120px)` | 80→120px | n/a | Compensates for sticky `<Header />` |

**Reading column widths (locked):**

- Blog / Resource / Knowledge-Hub article body: `max-width: 680px` (≈66ch at 1rem). Gold standard: `BlogDetailContent.tsx`.
- News article outer: 820px with embedded 680px reading column. Gold standard: `NewsDetailBody.tsx`.
- Mobile: edge-to-edge minus `px-6` gutter (`100vw - 48px`), giving 50–55ch at 375px — still inside the 45–75ch comfort band.

**Paragraph spacing rules (locked, derived from WCAG 1.4.12 + Butterick):**

- Paragraph-to-paragraph: `margin-block: 1em` (with `line-height: 1.65`, this satisfies the SC 1.4.12 2em paragraph-spacing requirement automatically).
- Heading-to-following-paragraph: `margin-block-start: 1.8em` on the heading, `margin-block-end: 0.4em`.
- Heading-to-heading: `margin-block-start: 2em` on the lower-level heading.
- Lists: `padding-inline-start: 1.5em`.
- Letter-spacing on `<h1>`/`<h2>`: `-0.02em` (tight, matches marketing display rhythm). Body: `0`.

**Card body vs CMS prose body — non-confusion rule:**

| Surface | Token | At 1440 | Why |
|---|---|---|---|
| Card body (scanning) | `text-body-lg` | ~22px | Cards scanned, not read; short lines |
| CMS prose body (reading) | `.article-body p` clamp | ~18px | Sustained reading; 60–66ch in 680px column |

A 22px body inside a 680px column produces ~50ch (below comfort); 18px delivers 60–66ch (in the band). Two distinct optima, two distinct tokens, never confused.

### Research sources (industry consensus, May 2026)

- Butterick, *Practical Typography* — body 15–25px; 45–90ch per line; line-height 1.2–1.45× type for body.
- Nielsen Norman Group, *Legibility, Readability, and Comprehension* (2024) — minimum 16px primary body web; 18px+ improves long-form comprehension measurably.
- WCAG 2.2 — SC 1.4.4 (resize to 200%), SC 1.4.12 (paragraph spacing ≥ 2× font, line-height ≥ 1.5×).
- web.dev *typography for reading on the web* (2024) — `clamp()` with line-height correlation; body 1rem–1.25rem; line-height 1.5–1.7 for prose.
- Reference CMS body sizes at 100% desktop zoom: Medium ≈ 21px, Substack ≈ 20px, NYT ≈ 17–18px, The Verge ≈ 18px, Stripe blog ≈ 19px.
- Smashing / A List Apart — H1 ~2.5–3× body; H2 ~1.8–2.2× body; H3 ~1.4–1.6× body; H4 ~1.2× body.
- Apple HIG / Material 3 — minimum interactive text 14px; minimum non-interactive body 12px (caption only); minimum touch target 44pt (HIG) / 48dp (Material).

### Lint allow-list and escape hatches

The lint gate (`apps/web/eslint.config.mjs`, Sprint 1 Day 4) forbids arbitrary `text-[*rem]`, bare `h-[*px]` on `*Card*` files, bare `w-[*px]` without `max-w`, `preserveAspectRatio="none"`, flat-px `fontSize:` inline styles, `<Image>` without `sizes`, `<br />` in prose.

Two opt-out attributes are allowed:

- **`data-cta-utility`** — on `<Button>` or `<a>`-as-button to declare the element is a *utility* control (filter chip, breadcrumb home, inline secondary) and therefore exempt from the 44×44 axe-core `target-size` rule. Only use when the control is densely-clustered and not a primary conversion CTA.
- **`data-cta-fluid`** — on a marketing-display CTA paired with a fluid display headline. Permits `padding` clamp (font and height stay on the discrete scale per Part 11.5 of the audit). Document the reason in a sibling comment.

Both attributes are PR-visible; reviewers must justify their use.

### Footer CTA slot contract (locked)

Every page's last-section-before-`<Footer />` renders its CTA into the slot defined in `apps/web/src/components/sections/Footer.tsx`. The slot is the single source of truth for CTA-card geometry; per-page CTAs paint *inside* it via the `cta` prop and never set their own width/height/border-radius.

| Property | Value | Why |
|---|---|---|
| Outer wrapper padding | `px-6 sm:px-8 md:px-12 lg:px-16 xl:px-20` | Scales the side-gutter with the viewport. Measured at 1440: 113+128 px gutters. At 1920: 353+368 (≈18.7% each side). At 375: the default `px-6` matches the page rail. |
| Card max-width | **1200px** | Reduced from 1276 so the card no longer kisses the viewport edges at xl/2xl. |
| Card height | `420 sm:360 lg:300` px | Tightened from 460/400/330 to match the reduced width visually. |
| Card border-radius | 40px | Locked. |
| Card z-index | 20 | Sits above the Footer's gradient. |
| Card overlap | `top: -170px` (absolute) | The card overhangs the page's last section by 170px. Every page's last bg-providing element must extend ≥170px below its natural content so the overlap lands on real bg, not body white. Convention: `padding-bottom: 250px` on the last section. |

**Inner CTA content rules:**

- Heading: `clamp(28px, 2.86vw, 55px)` (or the equivalent `text-display-sm` token) — 28→55px range; longer heading copy may extend the floor to 34→55.
- Body: `text-body-lg` token (16→22px). Never inline-flat `1.3125rem` or one-off clamps.
- Buttons: `--btn-fs-md` (16) for inline secondary; `--btn-fs-lg` (20) for primary CTA labels. Height defaults via `cs-btn-*` classes — no inline `height` override.
- Newsletter inputs (BlogsCTA / EventsCTA / WebinarsCTA): the email input wrapper is `flex-1 min-w-0` inside a `w-full` form. **Never** set a fixed `width: 427px` (the historic value) — it overflows the 1200 slot at narrow desktops.
- Below `lg`: every column-split CTA stacks via `flex-col lg:flex-row` (BlogsCTA, EventsCTA, WebinarsCTA pattern). Fixed `w-[401px]` / `w-[493px]` columns become `lg:max-w-[401px]` / `lg:max-w-[493px]`.

### Shared `SearchBar` primitive contract

The shared `SearchBar` at `src/components/sections/_shared/SearchBar.tsx` defaults to fluid sizing for every CMS-listing caller (BlogsHero, KnowledgeHubArticleHero, ResourceCenterHero).

- Form wrapper: `w-full max-w-[674px] mx-auto`.
- Input wrapper: `flex-1 min-w-0` — fills the available form width minus the 52px submit button.
- Submit button: 52×44 fixed (touch-target floor; matches `--btn-h-lg`).
- Callers may override the input wrapper via `inputWidthClassName` only if the input needs an explicit cap (e.g. compact hero variants); the default is correct for every standard listing-page hero.

### Section padding normalization commitment (2026-05-20)

Every non-hero section on the marketing site uses **one** of the four `--spacing-section-*` tokens documented above. Hardcoded raw paddings (60 / 72 / 80 / 88 / 100 / 120 px) and the Tailwind triplet `py-16 md:py-20 xl:py-[120px]` shape are forbidden in new code; the lint gate's `flat-px paddingTop:` and `arbitrary py-[Xpx]` rules catch new additions.

- `py-section-md` (64→120) is the **default** for every section that doesn't have a specific role.
- `py-section-sm` (48→80) for tighter card-grid heading bands.
- `py-section-lg` (80→150) reserved for feature/hero-adjacent prominence.
- `py-section-cta` (160→250) reserved for the last section before `<Footer />` so the CTA-card overlap lands cleanly.

Heros are explicitly excluded from this rule: their top padding includes the fixed-header offset and uses a clamp like `clamp(96px, 11vw, 178px)` to absorb the header height + breathing room.

---

## Original Figma extraction (reference, not canonical for component sizing)

## Layout
- Frame width: **1920px**
- Container width: **1276px** (centered, 322px side margin)
- Header pill: 1295×70, padding 16, x=313 (slightly wider than container)
- Hero block: 1201px wide, 360px from left
- Section gaps: ~96–110px vertical between sections

## Typography

Typography moved to [typography.md](./typography.md) — canonical token table, role → font/size map, and component cheatsheet live there. Site fonts: **Manrope** (headings via `font-display`) and **Sora** (body via `font-sans`). All sizes are `rem` or `clamp(rem, vw, rem)`.

## Colors
### Brand
- Hero gradient stop 0 — `#151021` (deep navy purple)
- Hero gradient stop 60% — `#131E8F` (deep blue)
- Hero gradient stop 75% — `#471EC0` (purple)
- Hero gradient stop 84% — `#471FC3`
- Engine panel gradient — same start, ends `#551EC3`
- Cyan accent — `#2CC1EB` (used at 0.4 opacity in comparison cards)
- Lavender highlight — `#DAB6F3` (radial-gradient strokes on glassy elements)

### Neutrals
- White — `#FFFFFF` (display headings on dark sections)
- Off-black text — `#111111` at 80% opacity (description copy on light sections)

## Hero gradient (linear, ~vertical)
```css
background: linear-gradient(180deg,
  #151021 0%,
  #10123E 45%,
  #131E8F 60.7%,
  #471EC0 74.7%,
  #471FC3 83.5%,
  rgba(70,30,191,.85) 87.6%,
  rgba(66,30,188,.4) 94.5%,
  rgba(66,30,188,0) 98.6%);
```

## Engine panel gradient (linear, ~vertical)
```css
background: linear-gradient(180deg, #151021 0%, #131E8F 71%, #551EC3 100%);
```

## Effects
### Engine panel drop shadow stack
```css
box-shadow:
  -8px 4px 20px 0 rgba(0,0,0,.23),
  -33px 16px 37px 0 rgba(0,0,0,.20),
  -74px 37px 49px 0 rgba(0,0,0,.12),
  -131px 65px 59px 0 rgba(0,0,0,.03);
```

### Comparison card (Public Images / CleanStart)
- 622×600, corner-radius **40**, white fill stacked with cyan `#2CC1EB` at 40% layer opacity (glass tint)

### Header "Book a Demo" pill
- 153×38, corner-radius **8**, padding 0
- Fill: linear gradient grey 20% opacity
- Stroke: linear gradient grey 1.5px
- Glass effect: blur 4

### Hero "Browse Images" pill
- 205×40, corner-radius **8**, padding 9 vertical / 18 horizontal
- Fill: white 65% opacity + radial-gradient highlights (linear-dodge blend)
- Stroke: white SOFT_LIGHT + lavender radial gradient

## Cards row
- Frame 1276×374, horizontal layout, gap **28px**
- Each card: **233×374**, corner-radius from icon mask groups

## Engine arrow
- SVG asset at `/public/images/engine-arrow.svg`
- 154×71, gradient fill `#33BAEC → #131E8F → #222594` with lavender radial stroke

## Assets exported
- `logo-cleanstart.png` 153×32
- `factory-card-{1..5}.png` 302×312 (the orb icon graphics)
- `kubr-bird.png` 290×299
- `advantage-bg.jpg` 1920×817
- `engine-arrow.svg` vector
- 75 SVGs in `public/images/trusted/` (community/CNCF logos)

## Key Figma node IDs (for re-extraction if needed)
- Home page frame: `108:7624`
- Header: `108:8867`
- Hero headline+CTA: `108:9108`
- Trusted by strip: `108:9116`
- Cards row (5 cards): `108:9151`
- Engine panel: `108:9288`
- Security section: `108:7892`
- Advantage section: `108:7864`
