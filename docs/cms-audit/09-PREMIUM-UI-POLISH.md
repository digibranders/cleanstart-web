# CleanStart CMS — Premium UI Polish & Alignment Spec

The CleanStart admin has a genuinely solid foundation — a custom `CmsListView`/`ListHeader` component layer that replaces Payload defaults, a semantic token architecture, live DOM-injected nav/count badges, and intentional dark-theme color work — but it is consistently undermined one layer down, at the pixel. A systemic fractional-px cascade (Payload's admin shell runs `html` at ~13 px, so every rem-based spacing token resolves to half-pixels), a flat near-equal table column strategy that starves the most important column (Title), count badges that borrow live status colors, and a header that floats its title block out of alignment with the toolbar combine to produce a "slightly off, slightly cheap" feel that no amount of color work can fix. None of this is structural — the tokens, the component seams, and the semantics layer are all in the right place. It is finish work.

**Current average premium score: 4/10.**

| Area | Score |
|---|---|
| Tables & List Views | 4/10 |
| Page Headers, Titles & Count Badges | 4/10 |
| Pills, Badges & Chips | 4/10 |
| Premium Foundations | 4/10 |

> ### Design principles
> - **Whole-pixel values.** Every font-size, padding, gap, and dot dimension must resolve to an integer pixel. No `10.5px`, `13.5px`, `0.15rem`, or `0.06em`-on-11px (= 0.66px). Half-pixels render blurry and read as accidental.
> - **Alignment hierarchy.** The primary column (Title) is greedy; metadata columns are tight. Dates right-align; status pills center; content left-aligns. The title block and the toolbar share one vertical center axis.
> - **Color restraint.** Semantic status colors (green/amber/red) are reserved for lifecycle state only. Counts, quantities, and metadata are always neutral. Reusing status-green for a row count is a hard information-architecture error.
> - **Layered elevation.** Depth on a dark theme comes from a hairline top inner-highlight (white at 5–6%) plus a darker-than-canvas outer shadow plus a border one step above canvas — not from a single faint glow.
> - **Type hierarchy.** Three crisp tiers: body 14px → secondary/nav/tabs 13px → chips 11px. Headings get tight line-heights (1.15–1.27), never paragraph leading (1.55–1.64).

---

## Tables & List Views

**Assessment.** The list view has a real structural foundation — a custom `CmsListView`, semantic tokens, a card-bordered table wrapper, and some column-width rules — but live measurements expose four compounding problems that kill the premium feel. (1) The column-width strategy is near-equal when it should be radically Title-greedy: the most important column gets ~203px while Status steals 200px for a one-word pill, and the two date columns together consume 363px for two short strings. (2) Critical numeric values are fractional — cell padding 9.75px, font-size 13.5px, badge font 10.5px — caused by unresolved CSS custom-property math against a 13px root, producing blurry text and jittery row heights; the H1 line-height ratio of 1.64 makes the title block feel unintentionally spacious. (3) The "57 PUBLISHED" count badge uses the same success-green as the Published pill (a semantic mismatch that makes an aggregate count read like a live status) and sits on its own line below the H1 instead of inline with it. (4) The Categories column silently renders "—" at full text color because the SCSS `:empty` rules never match the rendered `cs-relationship-cell__missing` span, so an absent value is indistinguishable from a real one.

### [MAJOR] Fractional cell font-size (13.5px) and padding (9.75px)  (`.table tbody td` · trivial)
- **File/selector:** `apps/cms/src/app/(payload)/styles/_tables.scss: .table td { padding; font-size }`
- **Now:** font-size 13.5px (body cascade); `padding: var(--cs-space-3) var(--cs-space-3)` intended 12px but measured 9.75px (Payload's gutter override winning + 13px root).
- **Problem:** Sub-pixel font-size and fractional padding land on half-pixels in WebKit, producing blurry text and jittery row heights that feel unbuilt.
- **Target:** Add explicit `font-size: 14px` on `.table tbody td` and lock `padding: 10px 16px` (whole-pixel; `var(--cs-space-4)` inline, explicit 10px block). First/last-child keep `padding-inline-start/end: var(--cs-space-4)`.

### [MAJOR] Column-width strategy: Title starved, Status over-wide, dates over-wide  (`.table thead th[id]`, `td.cell-*` · small)
- **File/selector:** `apps/cms/src/app/(payload)/styles/_tables.scss: column-width block (~line 210)`
- **Now:** checkbox 36px / Title 203px (leftover) / Authors 180px / Categories 180px / Status 200px / publicationDate 203px / updatedAt 160px. Assigned ≈1162px leaves Title nothing to breathe; Status holds an ~80px pill in 200px; the two date columns eat 363px.
- **Problem:** A premium table is title-greedy with tight metadata columns. Title truncates at ~25 chars (the primary scan/click target) while Status wastes ~120px around a 6-char pill, and Authors/Categories get identical 180px despite very different content.
- **Target:** Give Title **no explicit width** (auto-expands under `table-layout: fixed`). Set the rest: `_select` (checkbox) `40px`; `_status` `108px`; `authors` `140px`; `categories` `120px` (and the `newsCategories`/`knowledgeCategories` variants); `publicationDate` `128px`; `updatedAt`/`createdAt` `128px`. Apply via:
  - `th[id='heading-_select'], td.cell-_select { width: 40px }`
  - `th[id='heading-_status'], td.cell-_status { width: 108px }`
  - `th[id^='heading-updatedAt'], th[id^='heading-createdAt'], th[id^='heading-publicationDate'], td.cell-updatedAt, td.cell-createdAt, td.cell-publicationDate { width: 128px }`
  - `th[id='heading-authors'], td.cell-authors { width: 140px }`
  - `th[id='heading-categories'], td.cell-categories, th[id^='heading-newsCategories'], td.cell-newsCategories, th[id^='heading-knowledge'], td.cell-knowledgeCategories { width: 120px }`
  - Remove the old 180px / 200px / 160px / 203px rules. Title lands at ~497px (≈43% of a ~1161px table).

### [MODERATE] Header H1 line-height ratio 1.64 is too loose  (`.cs-list__title` · trivial)
- **File/selector:** `apps/cms/src/app/(payload)/styles/_list-controls.scss: .cs-list__title (~line 40)`
- **Now:** `font-size: 22px`; no explicit `line-height` (inherits body 1.55 → measured 36px / ratio 1.64); `letter-spacing: -0.01em`.
- **Problem:** A 22px single-line display heading at 1.64 carries ~14px of dead leading above/below — it reads like a multi-line paragraph and pushes the title block visually lower than the right-aligned controls, breaking vertical centering.
- **Target:** `line-height: 1.2`, `letter-spacing: -0.02em`, and drop `font-size` to `20px` (this is a list-view label, not a document title — 20px/600 Manrope reads confidently without consuming vertical space).

### [MODERATE] Date columns left-aligned instead of right-aligned with tabular nums  (`td.cell-updatedAt`/`createdAt`/`publicationDate` + headers · trivial)
- **File/selector:** `_tables.scss (date column block) + _list-controls.scss (.cs-date-cell) + _typography.scss (.cell-updatedAt block)`
- **Now:** `text-align: left` (inherited). `_typography.scss` adds `font-feature-settings: 'tnum'` to `.cell-updatedAt`/`.cell-createdAt` but no `text-align: right` and no matching header alignment.
- **Problem:** Dates are metadata, not content. Right-aligned dates (with right-aligned headers) form a hard vertical wall — the Linear/Vercel/Stripe pattern. Left-aligned dates force the eye to hunt the trailing digit; an un-aligned header reads as misaligned when sorted.
- **Target:** Add `text-align: right` to the date-column `td` selectors **and** the matching `thead th` selectors in `_tables.scss`; add `text-align: right` to `.cs-date-cell` in `_list-controls.scss` and to the `.cell-updatedAt` block in `_typography.scss`.

### [MODERATE] Sticky table header missing — column labels scroll away invisibly  (`.table thead` · small)
- **File/selector:** `_tables.scss: .table thead th + _list-controls.scss: .cs-list__table`
- **Now:** `.table thead { background: transparent }` (~line 51); no `position: sticky`; the card wrapper uses `overflow: hidden`.
- **Problem:** On a 20+ row list the header scrolls off after ~10 rows. Premium tables pin the header with a shadow/border that intensifies once rows scroll under it.
- **Target:** On `.table thead th`: `position: sticky; top: 0; z-index: 2; background: var(--theme-elevation-50); box-shadow: 0 1px 0 0 var(--theme-elevation-200)` (box-shadow renders above the sticky band where a `border-bottom` would not). Change `.cs-list__table` from `overflow: hidden` to `overflow: auto` (verify the card border-radius still clips — use `overflow: clip` if needed).

### [MODERATE] Empty Categories cell ("—") renders at full text color  (`td.cell-categories .cs-relationship-cell__missing` · trivial)
- **File/selector:** `_list-controls.scss: add .cs-relationship-cell__missing + .cs-date-cell--missing`
- **Now:** `RelationshipCell` renders `<span class="cs-relationship-cell cs-relationship-cell__missing">—</span>`. The `_tables.scss` `:empty` / `:has(> span:only-child:empty)` rules (~lines 286–289) never match (the td has a child span, the span has text), so the dash sits at full `var(--theme-text)` (#e6e8ec). The `__missing` class has no rule anywhere.
- **Problem:** An editor cannot tell a genuinely empty category from a failed-to-resolve one — both look identical to a real value.
- **Target:** Add `.cs-relationship-cell__missing { color: var(--cs-text-muted); font-style: normal; letter-spacing: 0; }` (`--cs-text-muted` = `var(--theme-text-disabled)`). Add the same rule for `.cs-date-cell--missing`, which has the identical defect.

### [MINOR] Row height 52px is off the 4pt grid  (`.table tbody tr` · trivial)
- **File/selector:** `_tables.scss: .table tbody tr (~line 82)`
- **Now:** `height: 52px`.
- **Problem:** 52px is not on the 4pt grid; the density file targets 48px and the condensed variant uses 40px. 52px is 4px taller for no reason — neither spacious (56px) nor tight (44px) — and the rhythm reads arbitrary.
- **Target:** `height: 48px`. Keep the condensed variant at `40px` (already grid-aligned).

### [MINOR] Table header 11px uppercase barely reads at 1440px  (`.table thead th` · trivial)
- **File/selector:** `_tables.scss: .table thead th (~lines 55–58)`
- **Now:** `font-size: 11px; text-transform: uppercase; letter-spacing: 0.06em; font-weight: 600`.
- **Problem:** 11px uppercase is the Stripe micro-label pattern, but on a dark background in Sora (wide optical weight) it reads as subtext, not a column anchor. Vercel/Linear use 12px/500 mixed-case — descenders add visual mass and the eye reads words by shape.
- **Target:** `font-size: 12px; font-weight: 500; text-transform: none; letter-spacing: -0.01em; color: var(--theme-text-soft)` (drop to 500 so removing the caps transform doesn't read too bold; slight negative tracking offsets Sora).

### [MINOR] Row hover too strong — flat elevation-100 slab  (`.table tbody tr:hover` · trivial)
- **File/selector:** `_tables.scss: .table tbody tr:hover (~line 85)`
- **Now:** `background: var(--theme-elevation-100)`; no border transition.
- **Problem:** On dark, elevation-100 is a visible gray that jumps abruptly — a harsh boxy flash with no text separation.
- **Target:** `background: var(--cs-tint-brand-soft)` (rgba(6,199,242,0.08)) — a brand-tinged whisper. For the active/selected row, bump to `var(--cs-tint-brand-medium)` (≈0.14) so selection is distinct from hover. Keep the existing transition.

### [MINOR] Search input font-size 13.5px (fractional)  (`.search-filter input` · trivial)
- **File/selector:** `_list-controls.scss: .search-filter input (~line 219)`
- **Now:** `font-size: 13.5px`.
- **Problem:** Half-pixel value renders blurry; no grounding in the 13/14px steps.
- **Target:** `font-size: 13px` (matches `.cs-list__search-input`, already 13px at ~line 70 — unifies all search/filter inputs).

---

## Page Headers, Titles & Count Badges

**Assessment.** The header layout has good bones — `CmsListView`/`ListHeader` already replaces Payload defaults, and `NavBadges` injects the count chips live. The critical failures: (1) the H1 at 22px/lh-36px is undersized with an absurdly loose 1.64 ratio for a single-line heading; (2) `.cs-list__header` uses `align-items: flex-start`, so the title/badge block and the right controls don't share a center axis even when they fit on one row; (3) the count badge is DOM-injected as a sibling after the H1 inside a plain `block` container, forcing it onto its own line below the title instead of inline on the baseline; (4) the chip colors (PUBLISHED=green, DRAFT=amber) reuse lifecycle-status colors, training editors to read a quantity as a document status; (5) fractional 10.5px (chips) and 13.5px (cells) render blurry; (6) the kebab can fall back to a visible "-" text character when its SVG fails to paint.

### [MAJOR] H1 title too small with grotesquely loose line-height  (`.cs-list__title` · trivial)
- **File/selector:** `apps/cms/src/app/(payload)/styles/_list-controls.scss: .cs-list__title`
- **Now:** `font-size: 22px; font-weight: 600; letter-spacing: -0.01em`; no explicit line-height (body 1.55 → ~34–36px, ratio ≈1.55–1.64).
- **Problem:** 22px is card-title territory, and the default leading adds ~12px of dead air, making the header read as a loose paragraph label rather than a confident page title. Linear/Vercel/Stripe use 24–28px / 600 / lh 1.15–1.2.
- **Target:** `font-size: 26px; font-weight: 600; line-height: 1.15; letter-spacing: -0.02em`.

### [MAJOR] List-header not vertically centering title block against toolbar  (`.cs-list__header` · trivial)
- **File/selector:** `_list-controls.scss: .cs-list__header`
- **Now:** `align-items: flex-start; flex-wrap: wrap; gap: var(--cs-space-4)` (16px).
- **Problem:** `flex-start` top-aligns the title block to the controls row. The 36px controls are internally centered, but the title baseline sits ~4–6px above the button midline — a broken visual axis. Premium admins center the title and the toolbar on one midline.
- **Target:** `align-items: center`; add `align-self: center` on `.cs-list__heading`; reduce the gap to `var(--cs-space-3)` (12px) — 16px creates a noticeable rift on a single row.

### [MAJOR] Count-badge chips use semantic status colors for quantity info  (`.cs-list-badge__chip--published`/`--draft` · small)
- **File/selector:** `apps/cms/src/app/(payload)/styles/_paper-cuts.scss: .cs-list-badge__chip--published, .cs-list-badge__chip--draft`
- **Now:** `--published`: color #00c46a on rgba(0,196,106,0.14), border rgba(0,196,106,0.28) — identical to the Published row pill. `--draft`: #fbbf24 amber — identical to the Draft pill. Both carry a leading colored dot like the status pill.
- **Problem:** "57 PUBLISHED" in status-green reads as a live document status, not a tally; the colored dot compounds the confusion and the header turns into a wall of green against the row pills. Count chips must be subordinate and neutral.
- **Target:** Both chips → `color: var(--theme-text-soft); background: var(--theme-elevation-150); border-color: var(--theme-elevation-200)`; **remove the `::before` colored dot** (a dot is a lifecycle indicator, not a count indicator). Differentiate by label only. If filter-affordance is needed, add hover `background: var(--cs-tint-brand-soft); color: var(--cs-cyan-500)`.

### [MAJOR] Count-badge renders below the title on a separate line  (`.cs-list__heading` / `.cs-list-badge` · small)
- **File/selector:** `_list-controls.scss: .cs-list__heading + apps/cms/src/payload/admin/components/views/list/ListHeader.tsx`
- **Now:** `NavBadges.tsx` injects `.cs-list-badge` as the H1's `nextSibling` inside `.cs-list__heading`, which has no display rule (defaults to `block`), so the inline-flex badge wraps to a new line below the H1. `.cs-list-badge` also adds `margin-inline-start: var(--cs-space-3)` (12px).
- **Problem:** The badge floats on its own line, reading as supplementary caption text rather than an inline count chip beside the title.
- **Target:** On `.cs-list__heading`: `display: flex; align-items: center; gap: var(--cs-space-2)` so the H1 and injected badge are flex siblings on one row. Remove the `margin-inline-start` from `.cs-list-badge` (the parent gap handles spacing). Wrap title + badge in a baseline-flex `.cs-list__title-row` in `ListHeader.tsx` and keep `.cs-list__description` as a block sibling below.

### [MODERATE] Doc-header (edit view) H1 also 22px with loose ratio  (`.cs-doc-header__title` · trivial)
- **File/selector:** `apps/cms/src/app/(payload)/styles/_sidebar-seo.scss: .cs-doc-header__title (~line 2487)`
- **Now:** `font-size: 22px; font-weight: 700; line-height: 1.2; letter-spacing: -0.015em`.
- **Problem:** 22px is too small for a document title a user stares at for minutes; it reads at the visual weight of a large card title. Notion/Linear/Stripe document titles use 24–28px.
- **Target:** `font-size: 24px; font-weight: 700; line-height: 1.15; letter-spacing: -0.02em` (a 2px lift reads dramatically larger with no layout change).

### [MODERATE] Count-badge chip font-size fractional (10.5px)  (`.cs-list-badge__chip` and siblings · trivial)
- **File/selector:** `_paper-cuts.scss: [class^='cell-'] [class^='selected--'], .bool-cell, .cs-list-badge__chip`
- **Now:** `font-size: 10.5px` (all three).
- **Problem:** 10.5px rounds to 10 or 11px per subpixel phase, producing blurry uppercase PUBLISHED/DRAFT labels.
- **Target:** `font-size: 11px` on all three declarations (the whole-pixel minimum for legible all-caps chips).

### [MODERATE] Table cell font-size fractional (13.5px)  (`.table` · trivial)
- **File/selector:** `_tables.scss: .table`
- **Now:** `font-size: 13.5px` (also on `.tabs-field__tab-button` and `.doc-controls .btn--style-secondary`).
- **Problem:** Anti-aliasing flickers between 13px and 14px across adjacent rows, producing uneven density.
- **Target:** `font-size: 13px` on `.table` and `.tabs-field__tab-button`. Buttons (`.doc-controls .btn.save-draft` / `.btn--style-secondary` in `_density.scss`) → `14px` (buttons, not cells).

### [MODERATE] Table cell padding fractional (9.75px)  (`tbody td` · small)
- **File/selector:** `_tables.scss: .table td, .table thead th`
- **Now:** `padding: var(--cs-space-3) var(--cs-space-3)` → intended 12px but measured 9.75px (0.75rem × 13px root).
- **Problem:** 9.75px vertical padding yields a 32.5px fractional content area inside a 52px row — content lands at a non-integer Y offset, blurry on Retina. Root cause is the drifted root font-size.
- **Target:** Explicit px: `td { padding: 10px 12px }` (52 − 20 = 32px integer); `th { padding: 8px 12px }`; first/last child `padding-inline-start/end: 16px`. Or fix the root cascade (see Premium Foundations — convert `--cs-space-*` to px).

### [MAJOR] Status column over-wide (200px); Title starved  (`th[id='heading-_status']`, etc. · small)
- **File/selector:** `_tables.scss: .table thead th[id='heading-_status'], th[id='heading-authors'], th[id='heading-categories'], th[id='heading-updatedAt']`
- **Now:** `_status` 200px; Title leftover ~203px → truncates ~30 chars; both date columns comfortably wide.
- **Problem:** A status pill is ≤90–100px intrinsic; 200px wastes ~100px that belongs to Title, the primary scan column. Truncating titles at the most-used viewport is a direct productivity failure.
- **Target:** Status `120px`; Authors `140px`; Categories `140px`; publishedAt `160px`; updatedAt `140px`; Title **no explicit width** (absorbs ~425px). Add `overflow: hidden; text-overflow: ellipsis; white-space: nowrap` on the title `td`. (Reconcile with the tighter Tables-section widths above — prefer the tighter set; both are title-greedy and acceptable, this is the conservative fallback.)

### [MODERATE] Kebab button renders as a "-" dash in some builds  (`.cs-list__menu-trigger` · small)
- **File/selector:** `_list-controls.scss: .cs-list__menu-trigger + ListHeader.tsx (the SVG)`
- **Now:** Inline SVG with three circles (cx 3/8/13, r 1.4), `viewBox='0 0 16 16'`. When the SVG fails to paint, the button falls back to a text "-"; `cs-btn--subtle` may not guarantee a 16px paint area.
- **Problem:** A kebab rendering as a plain "-" reads as broken/disabled — a critical polish failure.
- **Target:** On `.cs-list__menu-trigger`: `overflow: visible; width: 36px; height: 36px; font-size: 0` (suppresses any text-node fallback). On the SVG element in `ListHeader.tsx`: `style={{ display: 'block', flexShrink: 0 }}`, explicit `width: 16px; height: 16px; fill: none` so only the circle fills paint.

### [MINOR] Count-badge letter-spacing fractional (0.66px)  (`.cs-list-badge__chip` and `selected--` chips · trivial)
- **File/selector:** `_paper-cuts.scss (all chip letter-spacing declarations)`
- **Now:** `letter-spacing: 0.06em` on 11px = 0.66px (sub-pixel).
- **Problem:** Browser applies sub-pixel tracking inconsistently — uneven label spacing across rows.
- **Target:** `letter-spacing: 0.05em` (= 0.55px, snaps cleaner) or absolute `letter-spacing: 1px` (the Stripe approach for uppercase status chips).

### [MINOR] Doc-header badge font-size fractional (10.5px)  (`.cs-doc-header__badge` · trivial)
- **File/selector:** `_sidebar-seo.scss: .cs-doc-header__badge`
- **Now:** `font-size: 10.5px; letter-spacing: 0.08em`.
- **Problem:** Blurry uppercase text in the sticky edit-view header.
- **Target:** `font-size: 11px; letter-spacing: 0.07em`.

---

## Pills, Badges & Chips

**Assessment.** The chip/pill/badge family shares one intent but is implemented across three SCSS blocks (`_pills.scss`, `_paper-cuts.scss`, `_nav.scss`) with no canonical size spec — yielding four de-facto chip sizes (22px pill, ~20px `selected--` chip, 18px nav badge, an unstyled integrations health badge) with non-matching padding, font, and dot geometry. The most glaring defect is the 10.5px fractional font-size on every table chip and list count badge — it reads as "cheap CMS" at a glance. The count badges reuse full semantic green/amber, collapsing the color grammar (count is not status). A two-tier spec (SM 20px / MD 24px), whole-pixel fonts (11px / 12px), one shared dot size (5px), one radius (999px), and a reserved palette (status colors for lifecycle only; counts neutral) would unify the family at Linear/Stripe quality.

### [MAJOR] Fractional 10.5px font-size on all table chips and count badges  (`selected--` chips, `.cs-list-badge__chip`, `.bool-cell` · trivial)
- **File/selector:** `apps/cms/src/app/(payload)/styles/_paper-cuts.scss: [class^='cell-'] [class^='selected--'], .bool-cell, .cs-list-badge__chip`
- **Now:** `font-size: 10.5px` (all three).
- **Problem:** Sub-pixel value renders as a blurry 10–11px hybrid; exists nowhere in the 4pt grid; reads as accidental. Linear/Stripe/Vercel use 11–12px integers.
- **Target:** `font-size: 11px` (SM tier — the correct floor for uppercase tabular text on a dark UI).

### [MAJOR] Count badges use semantic status colors (green/amber)  (`.cs-list-badge__chip--published`/`--draft` · trivial)
- **File/selector:** `_paper-cuts.scss: .cs-list-badge__chip--draft, .cs-list-badge__chip--published`
- **Now:** `--published` #00c46a (= Published pill); `--draft` #fbbf24 (= Draft pill).
- **Problem:** The H1 badge is a record count, not the status of the viewed record; status-green collapses the color grammar and competes with the green row pills.
- **Target:** Both → NEUTRAL: `color: var(--theme-text-soft); background: var(--theme-elevation-150); border-color: var(--theme-elevation-200)`. Differentiate by label only. Optional hover for filter affordance: `background: var(--cs-tint-brand-soft); color: var(--cs-cyan-500)`. Reserve green/amber for in-row `.cell-_status` chips.

### [MAJOR] Four de-facto chip heights with no shared size spec  (`.pill`, `selected--`, `.cs-nav-badge`, `.cs-list-badge__chip` · small)
- **File/selector:** `_pills.scss (.pill), _paper-cuts.scss (selected-- / .bool-cell / .cs-list-badge__chip), _nav.scss (.cs-nav-badge)`
- **Now:** `.pill` 22px; `selected--` ~19.6px; `.cs-nav-badge` 18px; `.cs-list-badge__chip` ~19.6px (no explicit height) — four unrelated heights.
- **Problem:** A premium chip system has exactly two sizes. The four-height spread looks assembled from different eras.
- **Target:** Two tiers:
  - **SM** — `height: 20px; padding: 0 8px; font-size: 11px; font-weight: 600; line-height: 20px`. Apply to `.cs-nav-badge` (18→20px), `[class^='selected--']` chips, `.cs-list-badge__chip`, `.bool-cell`.
  - **MD** — `height: 24px; padding: 0 10px; font-size: 12px; font-weight: 600; line-height: 24px`. Apply to `.pill` (22→24px).
  - Dot indicator `5px × 5px` everywhere (down from 6px). `border-radius: 999px` universal (already correct).

### [MODERATE] `.bool-cell` duplicates the chip spec inline instead of sharing a base  (`.bool-cell` · small)
- **File/selector:** `_paper-cuts.scss: .bool-cell (~lines 135–174)`
- **Now:** Full verbatim copy of the `selected--` chip base (`inline-flex`, `gap: 6px`, `padding: 3px 10px`, `radius: 999px`, `font-size: 10.5px`, `weight: 700`, `letter-spacing: 0.06em`, `uppercase`, `line-height: 1.2`).
- **Problem:** Duplicated geometry is a maintenance trap — the next size change updates one selector and misses the other.
- **Target:** Extract a `.cs-chip-sm` base (`height: 20px; padding: 0 8px; font-size: 11px; font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase; border-radius: 999px; border: 1px solid transparent; display: inline-flex; align-items: center; gap: 5px`). Compose both `[class^='selected--']` chips and `.bool-cell` from it; keep color overrides local.

### [MODERATE] HealthBadge has no SCSS definition — unstyled component  (`.cs-integrations-health` · small)
- **File/selector:** `_paper-cuts.scss (or a new _integrations.scss) — add .cs-integrations-health`
- **Now:** No rule exists for `.cs-integrations-health` or its `--green/--yellow/--red/--loading/--error` modifiers; `HealthBadge.tsx` renders bare unstyled spans.
- **Problem:** A broken surface in the Integrations list and edit drawer — monochrome unstyled text with no traffic-light coding.
- **Target:** Apply the SM chip base, then variants:
  - `--green`: color #00c46a, bg rgba(0,196,106,0.14), border rgba(0,196,106,0.28)
  - `--yellow`: color #fbbf24, bg rgba(251,191,36,0.14), border rgba(251,191,36,0.30)
  - `--red`: color #ff5c5c, bg rgba(220,38,38,0.14), border rgba(220,38,38,0.28)
  - `--loading` / `--error`: neutral (`theme-text-soft` on `elevation-150`)
  - `__dot` child: 5px, `background: currentColor`.

### [MODERATE] Nav category eyebrow fractional (10.5px)  (`.nav-group__toggle` · trivial)
- **File/selector:** `_nav.scss: .nav-group__toggle`
- **Now:** `font-size: 10.5px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase`.
- **Problem:** Same fractional-blur defect on the nav eyebrows (CONTENT, GLOBALS, TAXONOMIES…); already distinct via weight/tracking, so it doesn't need to be this small.
- **Target:** `font-size: 11px` (the chip-system floor; hierarchy vs the 13px nav item is preserved).

### [MINOR] Nav badge border-radius hard-coded 9px  (`.cs-nav-badge` · trivial)
- **File/selector:** `_nav.scss: .nav__link .cs-nav-badge`
- **Now:** `border-radius: 9px` (height/2).
- **Problem:** Height-derived radius breaks the moment height changes; the rest of the family uses 999px; 9px gives a barely-rounded box.
- **Target:** `border-radius: 999px` (height-independent).

### [MINOR] Nav badge oval (not circle) for single-digit counts  (`.cs-nav-badge` · trivial)
- **File/selector:** `_nav.scss: .nav__link .cs-nav-badge`
- **Now:** `min-width: 18px; height: 18px; padding: 0 5px` — `0 5px` stretches "3" to ~28px wide.
- **Problem:** Lozenge where a circle is expected for single digits.
- **Target:** `height: 20px; min-width: 20px; padding: 0 6px; border-radius: 999px; font-size: 11px` — circle at one digit, graceful lozenge at "12".

### [MINOR] `.pill` dot doubled at 6px — heavy against the label  (`.pill::before` · trivial)
- **File/selector:** `_pills.scss: .pill::before (+ matching ::before in _paper-cuts.scss)`
- **Now:** `width: 6px; height: 6px`.
- **Problem:** At a 22px chip a 6px dot is ~27–50% of chip height — it reads as a prominent circle, not a subtle status mark (target ratio ~25–28%).
- **Target:** `width: 5px; height: 5px` across all four `::before` implementations (`.pill`, `selected--`, `.bool-cell`, `.cs-list-badge__chip`).

### [MINOR] Toast font-size fractional (13.5px)  (`.payload-toast` / `[data-sonner-toast]` · trivial)
- **File/selector:** `_paper-cuts.scss: .payload-toast / [data-sonner-toast]`
- **Now:** `font-size: 13.5px`.
- **Problem:** Blurry prose-weight toast text.
- **Target:** `font-size: 14px` (body scale).

### [MINOR] Tab strip font-size fractional (13.5px)  (`.tabs-field__tab-button` · trivial)
- **File/selector:** `_paper-cuts.scss: .tabs-field__tabs .tabs-field__tab-button`
- **Now:** `font-size: 13.5px`.
- **Problem:** Blurry edit-view tab labels (SEO, Content…).
- **Target:** `font-size: 13px` (one step below 14px body, two above 11px chips).

### [MINOR] SEO sidebar chips fractional (11.5px / 10.5px)  (`.cs-seo-health__chip`, `__score` · trivial)
- **File/selector:** `_sidebar-seo.scss: .cs-seo-health__chip, .cs-seo-health__score`
- **Now:** `__chip` 11.5px/500; `__score` 10.5px/600. 11.5px is the worst — between the 11px and 12px tiers.
- **Problem:** Two more fractional sizes in the chip family.
- **Target:** `__chip: font-size: 12px` (MD tier); `__score: font-size: 11px` (SM tier).

### [MINOR] Dashboard pulse-caption fractional (12.5px)  (`.cs-dashboard__pulse-caption`, `.__type-cell` · trivial)
- **File/selector:** `_dashboard.scss: .cs-dashboard__pulse-caption, .__type-cell`
- **Now:** `font-size: 12.5px` on both.
- **Problem:** Rounds to 12 or 13px per display — not whole-pixel.
- **Target:** `font-size: 13px` on both (secondary text tier, matching nav/section-meta).

---

## Premium Foundations

**Assessment.** The admin has a solid token architecture and intentional design language but is undermined at the pixel level by a systemic fractional-px cascade: Payload's admin shell sets `html` at ~13px (not 16px), so every rem-based spacing token resolves to non-integer values (0.75rem → 9.75px, 0.5rem → 6.5px, 0.25rem → 3.25px). Literal fractional values (13.5px button/cell font, 0.15rem/0.65rem pill padding, 0.4rem pill gap) compound it. The result is sub-pixel artifacts, blurry text, and a "slightly off" feel no color work can fix. Beyond the pixel budget, the column strategy is flat with a starved Title, the count badge misuses success-green and misaligns vertically, and the dark surface/shadow set is thin — lift shadows but no layered elevation with hairline inner highlights, so cards and panels lack depth. All fixable; the foundation tokens and semantics layer are well structured.

### [MAJOR] Fractional-px root cause: rem base is 13px, not 16px  (`html` + `--cs-space-*` · small)
- **File/selector:** `apps/cms/src/app/(payload)/styles/_tokens.scss: :root { --cs-space-* }`
- **Now:** `html` ≈ 13px; `--cs-space-*` are rem-based, so 0.25/0.5/0.75/1/1.5/2rem resolve to 3.25 / 6.5 / 9.75 / 13 / 19.5 / 26px — the odd ones fractional, poisoning all cell padding, form margins, and pill spacing.
- **Problem:** The 9.75px cell padding is the single root cause of the "cheap" table feel — sub-pixel padding renders content off-center with hairline border artifacts and slightly blurred text. Every rem-based value inherits it.
- **Target:** Convert all `--cs-space-*` to whole px in `:root`: `--cs-space-1: 4px; --cs-space-2: 8px; --cs-space-3: 12px; --cs-space-4: 16px; --cs-space-6: 24px; --cs-space-8: 32px; --cs-space-12: 48px; --cs-space-16: 64px`. Identical intent, immune to the html cascade. rem is only valuable where chrome must scale with user font prefs — not here.

### [MAJOR] Fractional font-size 13.5px on cells and buttons  (`.table`, `.btn` · small)
- **File/selector:** `_tables.scss:41 · _buttons.scss:8,49,167,225 · _density.scss:224,247 · _list-controls.scss:219,283`
- **Now:** `13.5px` literal across tables/buttons; `12.5px` on small buttons in `_density.scss`.
- **Problem:** 13.5px is off the 4pt grid and not a browser-snap value — it rounds differently per DPI and sub-pixel engine. Premium dashboards use 13px or 14px.
- **Target:** Global replace `13.5px → 13px` and `12.5px → 12px` across all partials: table cell 13px; button base 13px; small button 12px.

### [MAJOR] Pill padding and gap use fractional rem  (`.pill` · trivial)
- **File/selector:** `_pills.scss:9,13`
- **Now:** `padding: 0.15rem 0.65rem` (→ 1.95px 8.45px); `gap: 0.4rem` (→ 5.2px).
- **Problem:** Non-integer results fight the fixed 22px height — squashed/asymmetric vertical centering.
- **Target:** `padding: 2px 10px; gap: 6px` (centers the label at the locked 22px). Medium variant `.pill--size-medium`: `padding: 3px 10px` (26px height); `font-size: 12px` (whole) instead of 12.5px.

### [MAJOR] Column-width strategy: Title starved, Status/dates over-wide  (`.table thead th[id]` · small)
- **File/selector:** `_tables.scss: th[id='heading-_status'], th[id='heading-updatedAt'], th[id='heading-createdAt'], th[id='heading-publicationDate'], th[id='heading-authors'], th[id='heading-categories']`
- **Now:** title ~203px (leftover); status 200px; publishedAt 203px; updatedAt 160px; authors 180px; categories 180px — near-equal, Title narrowest, truncates ~32 chars.
- **Problem:** No visual hierarchy; the table's job is to make Title scannable, and Title is the narrowest column while a ≤90px pill gets 200px.
- **Target:** Title — **no explicit width** (absorbs leftover, ~469px ≈ 40% of a 1161px table); authors `140px`; categories `128px`; status `120px`; publishedAt `140px`; updatedAt `128px`. Remove explicit width on the title cells.

### [MODERATE] Every column left-aligned, including Status and dates  (`.table td/th` · trivial)
- **File/selector:** `_tables.scss: new alignment rules after the width block`
- **Now:** `text-align: left` (default) on all `th`/`td`.
- **Problem:** Alignment hierarchy is a primary premium signal — dates/numerics/status should right- or center-align so columns snap to a grid.
- **Target:** `th[id='heading-_status'], td.cell-_status { text-align: center }` (centers the pill); date headers + cells (`updatedAt`/`createdAt`/`publicationDate`) `{ text-align: right }`. Title/Authors/Categories stay left.

### [MODERATE] Row height 52px tall; loose, unrefined rhythm  (`.table tbody tr`, `.table td` · trivial)
- **File/selector:** `_tables.scss:82 (height), :97 (padding)`
- **Now:** `height: 52px`; cell padding 12px all sides (after rem fix); cell font 13.5px.
- **Problem:** 52px with 12px uniform padding leaves only 28px content height — neither compact (36–40px) nor comfortable (48px); 12px horizontal crowds narrow columns and over-pads Title.
- **Target:** `tbody tr { height: 48px }`; `td { padding: 10px 12px }`; `.table--appearance-condensed tbody tr { height: 36px }`.

### [MODERATE] Page title line-height excessively loose (ratio 1.64)  (`.cs-list__title` · trivial)
- **File/selector:** `_list-controls.scss: .cs-list__title`
- **Now:** `font-size: 22px`; no explicit line-height (computes 36px, ratio 1.64); `letter-spacing: -0.01em`.
- **Problem:** 1.64 is paragraph leading on a heading — the title floats in too much vertical space, worsened by the count badge dropping to a second line.
- **Target:** `line-height: 28px` (ratio 1.27, on the 4pt grid); `letter-spacing: -0.015em` (matches the `_typography.scss` heading rule). 22px/600/-0.015em/28px reads as a confident header.

### [MODERATE] Count badge uses status-green and renders on its own line  (count pill · small)
- **File/selector:** `_list-controls.scss: .cs-list__heading + a count-badge override block`
- **Now:** `font-size: 10.5px; weight: 700; letter-spacing: 0.63px; padding: 3px 10px; radius: 999px`; color rgb(0,196,106) on rgba(0,196,106,0.14) (= Published pill); renders below the H1.
- **Problem:** False status signal + two-line title block vs single-line toolbar = vertically misaligned header; font-size and tracking fractional.
- **Target:** Override the count pill: `font-size: 11px; font-weight: 600; letter-spacing: 0.04em; padding: 2px 8px; border-radius: var(--cs-radius-chip); color: var(--theme-text-soft); background: var(--theme-elevation-150); border: 1px solid var(--theme-elevation-200)`. Make `.cs-list__heading` `display: flex; align-items: center; gap: 8px` so the badge sits beside the H1.

### [MODERATE] Dark-theme elevation lacks hairline inner-highlight (depth flat)  (`--cs-shadow-*` · small)
- **File/selector:** `_tokens.scss: --cs-shadow-* token block (+ .cs-list__table in _list-controls.scss)`
- **Now:** `--cs-shadow-input-rest: inset 0 1px 0 rgba(255,255,255,0.02)` (2%, invisible); `--cs-shadow-lift-sm: 0 2px 6px rgba(0,0,0,0.06)`; `--cs-shadow-lift-md: 0 4px 12px rgba(0,0,0,0.08)`; `.cs-list__table` has only a bare border.
- **Problem:** A 2% highlight contributes nothing; cards/inputs read as the same plane. Premium dark UIs use a bright top inner edge + darker-than-canvas outer shadow + a border one step above canvas.
- **Target:**
  - `--cs-shadow-input-rest: inset 0 1px 0 rgba(255,255,255,0.06)`
  - `--cs-shadow-lift-sm: inset 0 1px 0 rgba(255,255,255,0.04), 0 2px 8px rgba(0,0,0,0.16)`
  - `--cs-shadow-lift-md: inset 0 1px 0 rgba(255,255,255,0.05), 0 4px 16px rgba(0,0,0,0.24)`
  - New `--cs-shadow-surface-raised: inset 0 1px 0 rgba(255,255,255,0.05), 0 0 0 1px var(--theme-elevation-150)`; apply it to `.cs-list__table` in place of the bare border.

### [MINOR] Focus ring 3px at 22% cyan — too soft, wrong geometry  (`--cs-focus-ring` · small)
- **File/selector:** `_semantics.scss: --cs-focus-ring · _tokens.scss: --cs-tint-focus-ring · _buttons.scss: .btn:focus-visible`
- **Now:** `--cs-focus-ring: 0 0 0 3px rgba(6,199,242,0.22)` (fuzzy glow); `--cs-focus-outline: 2px solid var(--cs-cyan-500)` defined but unused on buttons.
- **Problem:** 22% cyan on #1c1d21 can fail WCAG 2.2 SC 2.4.11 (3:1) and looks fuzzy/cheap.
- **Target:** `--cs-tint-focus-ring: rgba(6,199,242,0.40)`. On `.btn:focus-visible` and `input:focus-visible`: `outline: 2px solid var(--cs-cyan-500); outline-offset: 2px` (remove the box-shadow ring). Keep a box-shadow ring (`0 0 0 2px var(--cs-cyan-500)`, 100%) only where outline clips inside `overflow: hidden` cards.

### [MINOR] Row hover transition snaps (no hover easing)  (`.table tbody tr` · trivial)
- **File/selector:** `_tokens.scss (add --cs-motion-hover) · _tables.scss:81`
- **Now:** `transition: background-color var(--cs-motion-micro)` (120ms ease-out).
- **Problem:** 120ms is right for an active press but strobes on a fast passive hover sweep down the list.
- **Target:** Add `--cs-motion-hover: 160ms ease`; apply it to row hover (and nav/card passive hovers). Reserve `--cs-motion-micro` (120ms) for active press states.

### [MINOR] Table header has no background band  (`.table thead` · trivial)
- **File/selector:** `_tables.scss:50`
- **Now:** `thead { background: transparent }`; only a 1px bottom border separates it from rows.
- **Problem:** The header reads at the same surface level as rows — interchangeable with a normal uppercase row.
- **Target:** `.table thead { background: var(--theme-elevation-100) }` (= `--cs-surface-raised`, one step above canvas); keep the existing `border-bottom`. Optionally add `position: sticky; top: 0; z-index: 5`.

### [MINOR] Spacing token `--cs-space-5` (20px) is missing  (`:root` scale · trivial)
- **File/selector:** `_tokens.scss: :root spacing scale`
- **Now:** Scale jumps 16px → 24px (an 8px gap, no 20px step).
- **Problem:** Several places need 20px and must choose 16px (too tight) or 24px (too loose); premium scales always include 20px.
- **Target:** Add `--cs-space-5: 20px` between `--cs-space-4` and `--cs-space-6`. Apply to `.cs-list__header { gap: var(--cs-space-5); margin-bottom: var(--cs-space-5) }` and `.doc-controls__controls-wrapper { column-gap: var(--cs-space-5) }`.

---

## Polish checklist (prioritized)

Ordered for a first polish sprint — biggest visible premium gains first.

- [ ] **Column widths + alignment (Tables).** Give Title no explicit width; set `_select` 40px / `_status` 108px (or 120px) / authors 140px / categories 120px / dates 128px. Add `text-align: right` to date columns + headers, `text-align: center` to the status column. (`_tables.scss`)
- [ ] **Count-badge recolor.** `.cs-list-badge__chip--published` and `--draft` → `color: var(--theme-text-soft); background: var(--theme-elevation-150); border-color: var(--theme-elevation-200)`; remove the `::before` dot. (`_paper-cuts.scss`)
- [ ] **Count-badge inline + header alignment.** `.cs-list__header { align-items: center; gap: var(--cs-space-3) }`; `.cs-list__heading { display: flex; align-items: center; gap: var(--cs-space-2) }`; remove `.cs-list-badge` `margin-inline-start`. (`_list-controls.scss` + `ListHeader.tsx`)
- [ ] **Fractional-px root fix.** Convert all `--cs-space-*` to whole px in `:root` (4/8/12/16/20/24/32/48/64); add `--cs-space-5: 20px`. (`_tokens.scss`)
- [ ] **Global half-pixel font sweep.** Replace `13.5px → 13px`, `12.5px → 12px`, `11.5px → 12px`, `10.5px → 11px` across `_tables.scss`, `_buttons.scss`, `_density.scss`, `_paper-cuts.scss`, `_nav.scss`, `_sidebar-seo.scss`, `_dashboard.scss`, `_list-controls.scss`. Buttons → 14px where they are buttons not cells.
- [ ] **H1 line-height + size.** `.cs-list__title { font-size: 20px; line-height: 1.2; letter-spacing: -0.02em }` (or 26px/1.15 for a larger page title — pick one and apply consistently); `.cs-doc-header__title { font-size: 24px; line-height: 1.15; letter-spacing: -0.02em }`. (`_list-controls.scss`, `_sidebar-seo.scss`)
- [ ] **Cell padding + row height.** `.table tbody td { padding: 10px 16px; font-size: 14px }`; `.table tbody tr { height: 48px }`. (`_tables.scss`)
- [ ] **Pill padding/gap whole-px.** `.pill { padding: 2px 10px; gap: 6px }`; medium variant `padding: 3px 10px; font-size: 12px`. (`_pills.scss`)
- [ ] **Two-tier chip spec + shared base.** Extract `.cs-chip-sm` (20px) / define `.pill` MD (24px); dot 5px everywhere; `border-radius: 999px` on `.cs-nav-badge`; nav badge `20×20 / padding 0 6px`. Compose `.bool-cell` and `selected--` chips from the base. (`_pills.scss`, `_paper-cuts.scss`, `_nav.scss`)
- [ ] **Style the HealthBadge.** Add `.cs-integrations-health` (SM chip base) + `--green/--yellow/--red/--loading/--error` variants + 5px `__dot`. (`_paper-cuts.scss` or new `_integrations.scss`)
- [ ] **Empty-cell dimming.** `.cs-relationship-cell__missing, .cs-date-cell--missing { color: var(--cs-text-muted) }`. (`_list-controls.scss`)
- [ ] **Sticky table header + background band.** `.table thead { background: var(--theme-elevation-100) }`; `thead th { position: sticky; top: 0; z-index: 2; box-shadow: 0 1px 0 0 var(--theme-elevation-200) }`; `.cs-list__table { overflow: auto }`. (`_tables.scss`, `_list-controls.scss`)
- [ ] **Mixed-case table headers.** `.table thead th { font-size: 12px; font-weight: 500; text-transform: none; letter-spacing: -0.01em; color: var(--theme-text-soft) }`. (`_tables.scss`)
- [ ] **Row hover tint + hover easing.** `.table tbody tr:hover { background: var(--cs-tint-brand-soft) }`, active row `--cs-tint-brand-medium`; add `--cs-motion-hover: 160ms ease` and apply it. (`_tables.scss`, `_tokens.scss`)
- [ ] **Layered elevation.** Update `--cs-shadow-input-rest` (6%), `--cs-shadow-lift-sm/md` (inner highlight + stronger outer shadow), add `--cs-shadow-surface-raised`; apply the raised token to `.cs-list__table`. (`_tokens.scss`, `_list-controls.scss`)
- [ ] **Focus ring geometry.** `--cs-tint-focus-ring: rgba(6,199,242,0.40)`; switch `.btn`/`input` focus to `outline: 2px solid var(--cs-cyan-500); outline-offset: 2px`. (`_semantics.scss`, `_tokens.scss`, `_buttons.scss`)
- [ ] **Kebab fallback hardening.** `.cs-list__menu-trigger { overflow: visible; font-size: 0 }`; SVG `display: block; flex-shrink: 0; width: 16px; height: 16px; fill: none`. (`_list-controls.scss`, `ListHeader.tsx`)
