# CleanStart CMS — Premium UI Polish: All Screens

This is the companion to `09-PREMIUM-UI-POLISH.md` (list-view tables, page headers/badges, pills, and the token/elevation foundations). This document covers every other surface against the Linear / Vercel / Stripe craft bar — and the verdict is that the CMS is *close* but consistently held back by the same family of papercuts: uncapped form-column widths that stretch inputs to ~848px, fractional sub-pixel type sizes (12.5px / 10.5px / 9.75px) leaking from a 13px base, light-mode hardcoded colors marooned in dark-theme overlays, and missing or instant overlay motion. None of these are architectural failures — the bones are good — but each one is a visible tell that the surface was "good enough" rather than crafted. The current average premium score across these nine surfaces is **5.7 / 10**.

| Surface | Score |
|---|---|
| Edit / Document View | 5 / 10 |
| Forms & Field Renderers | 5 / 10 |
| Left Sidebar & Global Nav | 6 / 10 |
| Dashboard | 6 / 10 |
| Overlays (drawers, dialogs, popovers, palette, toasts) | 6 / 10 |
| Rich-text / Lexical editor | 5 / 10 |
| Login & Auth screens | 6 / 10 |
| Media library, field & pickers | 6 / 10 |
| Buttons, Controls & Icons (system-wide) | 6 / 10 |

---

## Edit / Document View

The edit view is architecturally ambitious — a sticky two-row doc-controls strip, an independent-scroll dual pane, a fullscreen editor toggle, and a rich SEO sidebar — and none of the individual components are embarrassing. But five systemic defects pull the craft score down: the main form column has no max-width cap (a single-line input spans ~848px); the right sidebar is stuck at Payload's ~188px default; the doc-header title over-asserts at 22px/700; the doc-controls strip is a dominant 60px band; and field rhythm uses Payload's inherited fractional 9.75px gap plus a 4px label margin. The save indicator is fully suppressed rather than relocated. What works: the publish split-button hierarchy, the fullscreen editor cluster, the SEO sidebar card shells, and the scroll-shadow animation.

### [MAJOR] Main form column has no max-width — inputs render ~848px wide  (`.document-fields__main` · small)
- **File/selector:** `apps/cms/src/app/(payload)/styles/_chrome.scss:.document-fields--has-sidebar` (around line 321)
- **Now:** No max-width set anywhere. At 1440px, nav (240px) + gutter×2 (120px) + sidebar (~188px) leaves ~892px for the form column, so a 100%-width `<input>` renders ~848px — double the readable scan width.
- **Problem:** Vercel / Linear / Stripe cap form columns at 640–760px. Beyond ~760px the eye loses the end of the line, fields look orphaned in space, and the grid has no optical center.
- **Target:** Inside the `.document-fields--has-sidebar` block, add `> .document-fields__main { max-width: 760px; }`.

### [MAJOR] Right sidebar too narrow at ~188px — SEO card content truncates  (`.document-fields__sidebar` · small)
- **File/selector:** `apps/cms/src/app/(payload)/styles/_tokens.scss::root` and `_chrome.scss:.document-fields__sidebar`
- **Now:** Payload ships `.document-fields__sidebar { width: var(--sidebar-width, 240px) }` but no custom `--sidebar-width` is defined, so it falls back to ~188px. The health chip text (`● GOOD 87/100`) truncates, the permalink mono URL wraps after ~18 chars, the OG preview meta column gets only ~100px.
- **Problem:** Premium dark-theme admins use 280–320px rails for secondary panels of this density.
- **Target:** Define `--sidebar-width: 300px` in `:root`. Add `column-gap: 20px` on `.document-fields--has-sidebar` so the columns don't kiss, and `padding-inline: var(--cs-space-4)` (16px) on `.document-fields__sidebar`.

### [MODERATE] Doc-header title at 22px/700 too large for a sticky chrome band  (`.cs-doc-header__title` · trivial)
- **File/selector:** `apps/cms/src/app/(payload)/styles/_sidebar-seo.scss:.cs-doc-header__title` (~line 2487)
- **Now:** `font-size: 22px; font-weight: 700; letter-spacing: -0.015em` inside a 60px-tall sticky strip that also carries the publish buttons.
- **Problem:** Vercel/Linear render the document name at ~15–17px/600. At 22px/700 the title reads as a page heading rather than a document label, and collides with the publish cluster. Weight 700 is the article-body H1–H3 spec; chrome should use 600.
- **Target:** `.cs-doc-header__title { font-size: 17px; font-weight: 600; letter-spacing: -0.01em; line-height: 1.3; }`. Remove the 560px breakpoint override that drops to 18px.

### [MODERATE] Doc-controls strip min-height 60px is dominant — reduce to 52px  (`.doc-controls__wrapper` · trivial)
- **File/selector:** `apps/cms/src/app/(payload)/styles/_chrome.scss:.doc-controls` (padding lines 76–77) and `.doc-controls__wrapper` (min-height line 85)
- **Now:** `min-height: 60px` + `padding-top/bottom: 12px`. Combined chrome above the first field is app-header (~56px) + breadcrumb (~36px) + strip (60px) = ~152px.
- **Problem:** 152px of chrome before content is 10% of a 1440×900 viewport. Stripe/Vercel cap combined chrome at ~80–96px.
- **Target:** `padding-top: var(--cs-space-2, 8px) !important; padding-bottom: var(--cs-space-2, 8px) !important;` and `min-height: 52px` on `__wrapper`. The 36px buttons fit comfortably in 52px.

### [MODERATE] Field label margin-bottom 4px is cramped  (`.field-label` · trivial)
- **File/selector:** `apps/cms/src/app/(payload)/styles/_forms.scss:.field-label` (line 15)
- **Now:** `margin-bottom: 4px`. At 13px label + 4px gap + 38px input the label and input look glued together.
- **Problem:** Vercel, Linear, Stripe Elements, Radix all use 6–8px. 4px is an un-overridden Payload default.
- **Target:** `margin-bottom: 6px`. Apply the same to sidebar labels (`.cs-slug__label`, `.cs-seo-advanced__label`, `.cs-inbound-redirects__form-label`) where they sit at 4px.

### [MODERATE] Field-to-field gap inherits Payload's fractional 9.75px  (Payload `.field-type` margin · small)
- **File/selector:** `apps/cms/src/app/(payload)/styles/_forms.scss` (after line 16) or `_density.scss` (after line 80)
- **Now:** Payload's `.field-type { margin-bottom: 0.75rem }` resolves to a fractional ~9.75px in the 13px admin context. No top-level override exists.
- **Problem:** Fractional pixels sub-pixel-render inconsistently per DPI and break the "field gap > label-input gap" hierarchy.
- **Target:** Add outside the collapsible scope: `.collection-edit .field-type { margin-bottom: var(--cs-space-4, 16px); } .collection-edit .field-type:last-child { margin-bottom: 0; }`.

### [MODERATE] SavedStateIndicator chip suppressed entirely with `display:none`  (`.cs-saved-indicator` · trivial)
- **File/selector:** `apps/cms/src/app/(payload)/styles/_saved-indicator.scss` (lines 9–13) and `apps/cms/src/payload/payload.config.ts` (`admin.components.actions`)
- **Now:** All `.cs-saved-indicator` variants are `display: none !important`; the component is unmounted from config.
- **Problem:** A floating "Saved 2 min ago" chip is a trust signal Webflow/Notion/Linear surface permanently. Suppressing it makes every save invisible until a toast fires — a regression from premium. The component and CSS are fully implemented and correct.
- **Target:** Remove the `display: none !important` block (lines 9–13) and re-add the component to `admin.components.actions`. It renders `position: fixed; bottom: 16px; right: 16px; z-index: 40` and interferes with nothing.

### [MINOR] Status badge in doc-header: padding asymmetry and 700-weight text  (`.cs-doc-header__badge` · trivial)
- **File/selector:** `apps/cms/src/app/(payload)/styles/_sidebar-seo.scss:.cs-doc-header__badge` (~line 2456)
- **Now:** `padding: 3px 10px; font-size: 10.5px; font-weight: 700; letter-spacing: 0.08em`. The 3px is a half-step on the 4-pt grid; 700 + uppercase + 0.08em tracking is over-stressed; two weight-700 elements share the band.
- **Problem:** Premium status pills use weight 600 max inside uppercase pill text.
- **Target:** `padding: 2px 10px; font-weight: 600;`.

### [MINOR] Publish split-button chevron uses `margin-left: -1px` border overlap  (`.cs-publish-menu__chevron` · trivial)
- **File/selector:** `apps/cms/src/app/(payload)/styles/_editor.scss:.cs-publish-menu__primary > *` (~line 191) and `.cs-publish-menu__chevron` (~line 210)
- **Now:** Chevron overlaps the primary's right border by 1px via negative margin to hide a double-border. On 1× displays the chevron's left radius can leave a hairline artifact.
- **Problem:** Vercel's split-button collapses the seam with `gap: 0` + `border-left: none` on the chevron + `border-inline-end: none` on the primary — no negative margin.
- **Target:** Add `border-inline-end: none` to `.cs-publish-menu__primary > *`; change `.cs-publish-menu__chevron` `margin-left: -1px` → `margin-left: 0` and let its existing `border-left: 1px solid var(--theme-elevation-200)` be the sole seam.

### [MINOR] SEO sidebar card headers use 8px top/bottom padding — too tight at 300px  (sidebar `&__header` · trivial)
- **File/selector:** `apps/cms/src/app/(payload)/styles/_sidebar-seo.scss` — `&__header` blocks for `.cs-seo-advanced`, `.cs-schema-preview`, `.cs-inbound-redirects`, `.cs-outbound-redirect`, `.cs-url-history`
- **Now:** All use `padding: var(--cs-space-2) var(--cs-space-3)` = `8px 12px` (29px header).
- **Problem:** At the widened 300px rail the vertical constraint shows, and 12px side padding presses the title against the card edge.
- **Target:** `padding: 10px var(--cs-space-4)` (10px top/bottom, 16px inline) for a 33px header aligned to the 36px row rhythm.

### [MINOR] Doc-header meta strip font-size 12.5px is fractional  (`.cs-doc-header__meta` · trivial)
- **File/selector:** `apps/cms/src/app/(payload)/styles/_sidebar-seo.scss:.cs-doc-header__meta` (~line 2512)
- **Now:** `font-size: 12.5px` — a half-pixel that rasterizes to 12 or 13 depending on browser, producing inconsistent cap-heights across monitors.
- **Problem:** Meta copy belongs at a whole 12px (compact secondary) or 13px.
- **Target:** `font-size: 12px`. Children `__meta-label` / `__meta-value` inherit.

### [MINOR] Fullscreen editor ContentEditable max-width 800px is too wide  (`.ContentEditable__root` · trivial)
- **File/selector:** `apps/cms/src/app/(payload)/styles/_editor-fullscreen.scss:.rich-text-lexical__wrap.cs-fullscreen-host .ContentEditable__root` (line 59)
- **Now:** `max-width: 800px` + `padding: 48px 24px 64px` → 752px column ≈ 95 chars/line at 15px.
- **Problem:** Notion, Bear, iA Writer, Craft cap line length at 65–75 chars (~640–680px). 95 chars is tiring for long-form editing.
- **Target:** `max-width: 680px` (~86 chars). Pair with `padding: var(--cs-space-12) var(--cs-space-8) var(--cs-space-16)` (48px top, 32px sides, 64px bottom).

---

## Forms & Field Renderers

The form system has solid bones — dark inputs, a focus-ring system, fractional-pixel work in tokens, semantic error states, a good relationship combobox, and a structured SCSS token layer. The SEO sidebar, relationship combobox, and media-field card are notably well-executed, and the timestamp/mono readonly treatment is excellent. It falls short across five compounding problems: the uncapped form column (~848px inputs), compressed label/field rhythm, group/collapsible/array headers with no hierarchy step over field labels, a checkbox label at 14px breaking the 13px rhythm, and a date-picker trigger 2px shorter than every other input.

### [MAJOR] Edit view: no form column max-width — inputs span 848px  (`.document-fields__main` · small)
- **File/selector:** `apps/cms/src/app/(payload)/styles/_chrome.scss:.document-fields__main`
- **Now:** No max-width; main column takes ~860px after the sidebar, inputs stretch to fill.
- **Problem:** ~848px single-line inputs are painful to scan and look like a broken layout. Linear/Vercel/Stripe cap at 640–760px.
- **Target:** `.document-fields__main > .render-fields, .document-fields__main > .field-type { max-width: 760px; }` (or scope to `@media (min-width: 1280px)` to keep narrow viewports full-width).

### [MAJOR] Field label margin-bottom 4px too cramped — label bleeds into input  (`.field-label` · trivial)
- **File/selector:** `apps/cms/src/app/(payload)/styles/_forms.scss:.field-label` (line 15)
- **Now:** `margin-bottom: 4px` — visual breath under the 13px/600 label is less than the input's 1px border.
- **Problem:** Premium tools use 6–8px; combined with the fractional field gap the form reads as a block of collapsed text.
- **Target:** `margin-bottom: 6px`. Also `.cs-array__row-body .field-label` (line 620) 2px → 4px, and `.cs-media-field__label` (`_media-field.scss` line 31) 4px → 6px.

### [MODERATE] Field vertical gap: fractional 9.75px from 0.75rem on 13px base  (`.field-type` margin / group bodies · small)
- **File/selector:** `apps/cms/src/app/(payload)/styles/_tokens.scss`
- **Now:** `--cs-space-3` resolves to a non-whole-pixel ~9.75px gap; visually indistinguishable from 8px (`--cs-space-2`).
- **Problem:** Sub-pixel shimmer on retina, and the field gap can't establish the "field gap > label-input gap" hierarchy.
- **Target:** Add explicit whole-pixel tokens: `--cs-space-field-gap: 20px` and `--cs-space-label-input: 6px`. Use `.field-type { margin-bottom: var(--cs-space-field-gap, 20px) }` and `gap: var(--cs-space-field-gap, 20px)` inside `.cs-group__body`, `.cs-collapsible__body`, `.cs-tabs__panel`. Keep 12px (`--cs-space-3`) for nested array/collapsible bodies.

### [MODERATE] Input height 38px vs date-picker trigger 36px — 2px mismatch  (`.cs-datetime__trigger` · trivial)
- **File/selector:** `apps/cms/src/app/(payload)/styles/_forms.scss:.cs-datetime__trigger` (line 959)
- **Now:** `height: 36px` while all other inputs lock to `min-height: 38px` in `_density.scss`.
- **Problem:** Adjacent to a text field in a Row, the 2px delta reads as misalignment slop. The custom DateTimePicker slipped the density normalization.
- **Target:** `height: 38px`. The clear button (`top: 50%; transform: translateY(-50%)`) still centers. Also `.cs-datetime__time input` padding `4px 8px` → `5px 8px`.

### [MODERATE] Group / array legend: same 13px/600 as field labels — no hierarchy  (`.cs-array__legend` / `.cs-group__legend` · trivial)
- **File/selector:** `apps/cms/src/app/(payload)/styles/_forms.scss` (lines 432–441, 794–801)
- **Now:** `font-size: 13px; font-weight: 600; letter-spacing: 0.02em; text-transform: uppercase` — identical size to field labels, differentiated only by uppercase.
- **Problem:** In Linear/Vercel section headers are visually distinct from field labels. `BODY CONTENT` reads at the same weight as `Title` inside it, collapsing the hierarchy.
- **Target:** Eyebrow treatment: `font-size: 11px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: var(--theme-text-soft)`. Smaller and softer but tighter-tracked = section divider, not competing label.

### [MODERATE] Tabs field: tab padding/font too tight, active indicator 2px insufficient  (`.cs-tabs__tab` / `.tabs-field__tab-button` · trivial)
- **File/selector:** `apps/cms/src/app/(payload)/styles/_forms.scss` (lines 382–399)
- **Now:** `.cs-tabs__tab { padding: var(--cs-space-2) var(--cs-space-3); font-size: 13px; font-weight: 500; border-bottom: 2px solid transparent }`; `.tabs-field__tab-button` at 36px height (via `_paper-cuts.scss`).
- **Problem:** A 2px bottom border disappears on dark at non-retina; 36px tabs feel cramped at 13.5px text. Linear uses a 3px indicator and 40px-tall tabs.
- **Target:** `border-bottom-width: 3px`; `.cs-tabs__tab { padding: 10px var(--cs-space-4) }`; `.tabs-field__tab-button { height: 40px; padding-inline: var(--cs-space-4) }`.

### [MODERATE] Collapsible summary: 13px/600 indistinct from field labels, chevron too small  (`.cs-collapsible__summary` · trivial)
- **File/selector:** `apps/cms/src/app/(payload)/styles/_forms.scss` (lines 828–835)
- **Now:** `font-size: 13px; font-weight: 600; padding: var(--cs-space-3) var(--cs-space-4)`; chevron inherits ~12px.
- **Problem:** Collapsible headers match body field labels; the 12px chevron is hard to track on a full-width form.
- **Target:** `font-weight: 700`; `padding: 14px var(--cs-space-4)`; `.cs-collapsible__chevron { width: 16px; height: 16px }`. Keep `.cs-collapsible__body` top padding at 16px.

### [MODERATE] Array row header: 6px vertical padding collapses below 36px  (`.cs-array__row-header` · trivial)
- **File/selector:** `apps/cms/src/app/(payload)/styles/_forms.scss:.cs-array__row-header` (line 530)
- **Now:** `padding: 6px var(--cs-space-2)` → ~25px row, below the density minimum (`.array-field__row-header` enforces `min-height: 38px` but the custom class bypasses it).
- **Problem:** Drag handles and remove buttons are cramped at 25px.
- **Target:** `padding: 8px var(--cs-space-2)`; combined with the existing `min-height: 36px` the row expands to 36px. Grid `20px 1fr 28px` is already correct.

### [MODERATE] Array/blocks add button: no height — renders ~23px  (`.cs-array__action` / `.cs-array__add` · trivial)
- **File/selector:** `apps/cms/src/app/(payload)/styles/_forms.scss` (lines 457–479)
- **Now:** `.cs-array__action { padding: 4px var(--cs-space-2); font-size: 11px }` → ~23px; `.cs-array__add` child has no height.
- **Problem:** ~23px action buttons fail the 44px WCAG 2.5.5 advisory and look undersized next to 38px inputs. Stripe/Linear use 32px minimum.
- **Target:** `.cs-array__action { padding: 0 var(--cs-space-2); height: 28px }`; the bottom `+ Add item` child button gets `height: 36px; padding-inline: var(--cs-space-4)`.

### [MINOR] Select field min-height matches input but lacks explicit height — drift  (`.field-type.select .rs__control` · small)
- **File/selector:** `apps/cms/src/app/(payload)/styles/_forms.scss` (line 219) / `_density.scss` (line 36)
- **Now:** `min-height: 38px` only; react-select renders 1–3px taller with a value selected.
- **Problem:** In a Row alongside a text input, the select misaligns vertically.
- **Target:** Add `height: 38px`; `.rs__value-container { padding: 0 8px }`; `.rs__indicators { height: 36px }`.

### [MINOR] Checkbox label 14px mismatches 13px field labels  (`.cs-checkbox-field__label` · trivial)
- **File/selector:** `apps/cms/src/app/(payload)/styles/_ui-primitives.scss:.cs-checkbox-field__label` (line 1436)
- **Now:** `font-size: 0.875rem` = 14px; all field labels are 13px.
- **Problem:** The checkbox label reads as bold/prominent relative to nearby labels meant to be at the same weight.
- **Target:** `font-size: 13px`. Keep the 18×18 box.

### [MINOR] Relationship inputrow: min-height 38px but padding chain ≠ 38px  (`.cs-relationship-field__inputrow` · trivial)
- **File/selector:** `apps/cms/src/app/(payload)/styles/_ui-primitives.scss` (lines 1058–1064)
- **Now:** `min-height: 38px; padding: 4px 4px 4px 6px` with inner input `padding: 4px 8px`.
- **Problem:** Renders 2–4px shorter than a text input.
- **Target:** `padding: 6px 4px 6px 8px`; inner `.cs-relationship-field__input { padding: 2px 8px }`; `min-height: 40px` to match the rendered height.

### [MINOR] Radio pill: 6px vertical padding, no height pin — ambiguous height zone  (`.cs-radio-field__pill` · trivial)
- **File/selector:** `apps/cms/src/app/(payload)/styles/_ui-primitives.scss:.cs-radio-field__pill` (line 1450)
- **Now:** `padding: 6px 12px` → ~28px, between input (38px) and badge (22px).
- **Problem:** On a RowField next to a text input the baseline mismatch is jarring.
- **Target:** `padding: 5px 14px; height: 30px; align-items: center` — the correct input 38 / pill 30 / badge 22 tier. Keep `.cs-radio-field__dot` at 10×10.

### [MINOR] SEO sidebar input padding `0.4rem 0.65rem` — fractional pixels  (`.cs-seo-advanced__input` · trivial)
- **File/selector:** `apps/cms/src/app/(payload)/styles/_sidebar-seo.scss` (line 159; `.cs-schema-preview__btn` line 807)
- **Now:** `padding: 0.4rem 0.65rem` = 6.4px × 10.4px.
- **Problem:** Fractional padding blurs borders on non-retina/Windows Chrome, especially visible in the narrow rail.
- **Target:** `padding: 6px 10px` on both selectors.

### [MINOR] Blocks picker grid `minmax(160px, 1fr)` ignores context width  (`.cs-blocks__picker` · small)
- **File/selector:** `apps/cms/src/app/(payload)/styles/_forms.scss:.cs-blocks__picker` (line 682)
- **Now:** `repeat(auto-fit, minmax(160px, 1fr))` — only ~5 tiles per row at 860px, single-column in a 188px sidebar.
- **Problem:** The grid doesn't respond to its container.
- **Target:** Add `container-type: inline-size` to `.cs-blocks`; base `minmax(140px, 1fr)` with `@container (min-width: 480px) { .cs-blocks__picker { grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); } }` and a `minmax(120px, 1fr)` narrow fallback.

### [MINOR] Auto-grow textarea has no max-height cap — runaway expansion  (`.cs-textarea-field__input` · trivial)
- **File/selector:** `apps/cms/src/app/(payload)/styles/_ui-primitives.scss` (lines 1340–1345)
- **Now:** `min-height: 0; overflow-y: hidden; resize: none` with JS auto-grow and no max-height.
- **Problem:** Pasting long content pushes following fields 400px+ off-screen. Contentful/Sanity cap at 240–320px.
- **Target:** Add `max-height: 320px; overflow-y: auto`.

### [MINOR] Group/array top margin (24px) gives field→group a triple gap  (`.cs-group` / `.cs-array` · trivial)
- **File/selector:** `apps/cms/src/app/(payload)/styles/_forms.scss` (lines 789, 425)
- **Now:** `margin: var(--cs-space-6) 0` (24px). With a 12px field margin above, the effective gap is ~36px — nearly 3× the field gap.
- **Problem:** The group card floats away from the field above it; Linear separators are 1.5–2× the field gap, not 3×.
- **Target:** `margin-top: 20px; margin-bottom: 20px` (with the 20px field-gap token → clean 2× separation). If the field-gap token is unchanged, use `var(--cs-space-4, 16px)`.

---

## Left Sidebar & Global Nav

The sidebar is architecturally sound — branded header, persistent group collapse, user menu pinned to the floor, draft badges injected. Above-average for a Payload admin. But eight discrete gaps keep it below the bar: the rail is fractionally narrow (240px); nav click targets fight between 30px and 36px; group eyebrows at 10.5px sit below the all-caps legibility floor; the active stripe is a near-invisible 2px with no glow; the search trigger is 2px shorter than the Dashboard link; the "CMS" eyebrow border competes with active accents; the user-menu avatar is undersized at 28px; and the user menu popover opens with no entrance animation.

### [MAJOR] Nav item click-target floor fight — 36px in `_nav.scss` overridden to 30px  (`.nav__link` · trivial)
- **File/selector:** `apps/cms/src/app/(payload)/styles/_density.scss` (line 101) and `_nav.scss` (`.nav__link`)
- **Now:** `_density.scss` sets `.nav .nav-group__content a { min-height: 36px }` but `_nav.scss` sets `.nav__link { min-height: 30px }`; the rendered floor is 30px.
- **Problem:** 30px is below WCAG 2.5.5 (44px) and below the Linear/Vercel ~32–34px floor; hard to click accurately in a 240px rail.
- **Target:** Unify at 34px: `.nav__link { min-height: 34px }` in `_nav.scss`; `.nav .nav-group__content a { min-height: 34px }` in `_density.scss`.

### [MODERATE] Nav rail too narrow — badge text and long names clip  (`--nav-width` · trivial)
- **File/selector:** `apps/cms/src/app/(payload)/styles/_tokens.scss::root`
- **Now:** `--nav-width: 240px`. "Knowledge Hub" + a 2-digit draft badge barely fits; UserMenu name+email collides.
- **Problem:** Vercel is 256px, Linear 260px — 240px is below the comfortable floor.
- **Target:** `--nav-width: 256px`.

### [MODERATE] Group eyebrow label 10.5px below all-caps legibility floor  (`.nav-group__toggle` · trivial)
- **File/selector:** `apps/cms/src/app/(payload)/styles/_nav.scss` (lines 64–71)
- **Now:** `font-size: 10.5px; letter-spacing: 0.1em; font-weight: 700; text-transform: uppercase`.
- **Problem:** 10.5px is fractional, and 10–11px uppercase on dark hits the illegibility floor on non-retina. Stripe/Linear/Vercel use 11px.
- **Target:** `font-size: 11px; letter-spacing: 0.08em`.

### [MODERATE] Active-item left stripe lacks glow — nearly invisible on dark  (`.nav__link--active` · small)
- **File/selector:** `apps/cms/src/app/(payload)/styles/_nav.scss` (lines 133–143)
- **Now:** `box-shadow: inset 2px 0 0 0 var(--cs-cyan-500)` — a hairline on dark that forces the eye to check text weight instead.
- **Problem:** Linear/Vercel use a 3px stripe plus a faint bloom so the active state registers peripherally.
- **Target:** `box-shadow: inset 3px 0 0 0 var(--cs-cyan-500), inset 8px 0 12px -6px rgba(6, 199, 242, 0.15)`.

### [MODERATE] User menu avatar undersized at 28px, lacks depth  (`.cs-user-menu__avatar` · small)
- **File/selector:** `apps/cms/src/app/(payload)/styles/_user-menu.scss` (lines 111–127)
- **Now:** `28×28; background: var(--cs-tint-brand-soft); color: var(--cs-cyan-500); border-radius: 50%; font-size: 11px` — the 8% tint is near-invisible on dark; initials float mid-air; name→email gap is 1px.
- **Problem:** Smallest avatar in any premium reference (Vercel 32px). No ring, no surface response on hover.
- **Target:** `30×30; border: 1px solid rgba(6, 199, 242, 0.25); background: var(--cs-tint-brand-medium); font-weight: 600`. Identity column `gap: 2px`.

### [MODERATE] User menu popover opens with no entrance animation  (`.cs-user-menu__popover` · small)
- **File/selector:** `apps/cms/src/app/(payload)/styles/_user-menu.scss` (lines 162–177)
- **Now:** No animation; conditional render = instant appear.
- **Problem:** Every premium reference animates popovers with a 150–200ms ease-out scale+fade. The instant flash reads as a glitch, and every other Payload overlay uses `var(--cs-motion-modal)`.
- **Target:** `@keyframes cs-user-menu-in { 0% { opacity: 0; transform: translateY(4px) scale(0.98) } 100% { opacity: 1; transform: translateY(0) scale(1) } }`; apply `animation: cs-user-menu-in 160ms cubic-bezier(0.16, 1, 0.3, 1) both`. Add a `prefers-reduced-motion` guard.

### [MINOR] Dashboard link (32px) and Search trigger (30px) inconsistent heights  (`.cs-sidebar-search` / `.cs-sidebar-dashboard` · trivial)
- **File/selector:** `apps/cms/src/app/(payload)/styles/_sidebar-header.scss` (lines 112, 169)
- **Now:** `.cs-sidebar-dashboard { min-height: 32px }`; `.cs-sidebar-search { min-height: 30px }`.
- **Problem:** The 2px-shorter search row disrupts the header block rhythm.
- **Target:** Snap all three header-block rows to `min-height: 32px`; search padding `7px 8px 7px 10px`.

### [MINOR] "CMS" eyebrow pill full-weight cyan border competes with active accent  (`.cs-sidebar-header__eyebrow` · trivial)
- **File/selector:** `apps/cms/src/app/(payload)/styles/_sidebar-header.scss` (lines 91–101)
- **Now:** `border: 1px solid var(--cs-cyan-500); color: var(--cs-cyan-500); font-size: 9.5px`.
- **Problem:** A second full-opacity brand-cyan source in the header, indistinguishable from the active stripe; 9.5px is fractional.
- **Target:** `border: 1px solid rgba(6, 199, 242, 0.35); color: var(--cs-cyan-400); font-size: 10px`.

### [MINOR] Nav group top-spacing rhythm inconsistent (first crowded, rest over-spaced)  (`.nav-group` · trivial)
- **File/selector:** `apps/cms/src/app/(payload)/styles/_nav.scss` (lines 44–54) and `_sidebar-header.scss` (line 39)
- **Now:** `.nav-group { margin-bottom: 4px; padding-top: 12px } .nav-group:first-of-type { padding-top: 4px }`.
- **Problem:** The asymmetry makes the first group read as part of the header; uneven vertical breathing.
- **Target:** Remove the `:first-of-type` exception. `.cs-sidebar-header { margin-bottom: 12px }` (from 8px); `.nav-group { padding-top: 8px; margin-bottom: 4px }`.

### [MINOR] Sidebar scrollbar 10px wide — intrudes on the narrow rail  (`aside.nav` scrollbar · trivial)
- **File/selector:** `apps/cms/src/app/(payload)/styles/_scrollbars.scss` (line 9)
- **Now:** Global `::-webkit-scrollbar { width: 10px }` hits the nav scroll container.
- **Problem:** Vercel uses 6px, Linear overlays; 10px compresses the 240px rail further.
- **Target:** Scope `aside.nav ::-webkit-scrollbar, .nav__scroll::-webkit-scrollbar { width: 5px }` + `aside.nav { scrollbar-width: thin }`. Keep the global 10px for main content.

### [MINOR] Nav group chevron pseudo-element desyncs from Payload's toggle state  (`.nav-group__header::after` · small)
- **File/selector:** `apps/cms/src/app/(payload)/styles/_chrome-extras.scss` (lines 275–299) and `_nav.scss`
- **Now:** A CSS `::after` chevron reads `data-collapsed` on the header, but `NavGroupPersistence.tsx` toggles `.nav-group__toggle--open`. Two chevrons likely render (the pseudo-element plus Payload's SVG inside the toggle) and can desync.
- **Problem:** State desync risk plus a visual stutter (two rotating elements).
- **Target:** Remove the `.nav-group__header::after` / `.nav__group-header::after` block entirely. In `_nav.scss` add `.nav-group__toggle--open svg { transform: rotate(180deg); }` with a micro transition — single 14px chevron synced to Payload's real state class.

### [MINOR] User menu separator uses elevation-200 — too strong on dark canvas  (`.cs-user-menu` border-top · trivial)
- **File/selector:** `apps/cms/src/app/(payload)/styles/_user-menu.scss` (line 29)
- **Now:** `border-top: 1px solid var(--theme-elevation-200)` (#34363d) — reads almost as strongly as the header divider.
- **Problem:** Makes the UserMenu a second section instead of a grounded footer.
- **Target:** `border-top: 1px solid var(--cs-border-subtle)` (≈#2a2c33) — symmetric whisper divider matching the header.

---

## Dashboard

The dashboard has solid information architecture — greeting, four KPI pulse cards, analytics snapshot, timeline, quick actions — over a clean token system. Five interrelated craft gaps stop it short of the bar: the pulse cards are flat (accent is only a 3px border, no surface differentiation); the KPI number and label collapse into one block with a uniform 4px gap; the analytics grid uses a `min-height: 110px` floor that yields uneven card heights; the "Connect analytics" strip uses a raw `→` glyph; and the timeline hairline anchors to magic pixel offsets that break on variable row heights. Fractional values (12.5/10.5/11.5px) recur throughout, and the quick-action section title is heavier than the cards it introduces.

### [MAJOR] Pulse-card surface has no elevation layering — all four read identically  (`.cs-dashboard__pulse` · small)
- **File/selector:** `apps/cms/src/app/(payload)/styles/_dashboard.scss:.cs-dashboard__pulse`
- **Now:** `background: var(--theme-input-bg); border: 1px solid var(--theme-elevation-150); border-left: 3px solid var(--theme-elevation-200)`. Tone variants only swap the left-border color; surface is identical and shadow is zero.
- **Problem:** Premium stat cards differentiate the primary-signal card from neutral counters; a 3px accent alone is too subtle to form a priority hierarchy.
- **Target:** Tinted surfaces — `--cyan`: `background: color-mix(in srgb, var(--cs-cyan-500) 6%, var(--theme-input-bg))`; `--amber`: `color-mix(in srgb, var(--color-warning-500) 5%, var(--theme-input-bg))`; `--neutral`: keep `var(--theme-input-bg)`. Add `box-shadow: var(--cs-shadow-lift-sm)` at rest and `border-left-width: 4px`. Replace the hover `translateY(-1px)` with border brightening + `box-shadow: var(--cs-shadow-lift-md)`.

### [MAJOR] Pulse-card internal spacing collapses number and label into one block  (`.cs-dashboard__pulse-*` · small)
- **File/selector:** `apps/cms/src/app/(payload)/styles/_dashboard.scss`
- **Now:** `.cs-dashboard__pulse { gap: 4px; padding: var(--cs-space-4) }`; value 32px/700; label 11px/700.
- **Problem:** Uniform 4px gap between label→number and number→caption gives no H→V→footnote read; 16px all-around leaves no sky above the eyebrow.
- **Target:** `gap: 0` with explicit margins: `__pulse-label { margin-bottom: 6px }`, `__pulse-value { margin-bottom: 4px; font-weight: 600 }` (700 shouts at this size). Padding `20px 20px 16px`.

### [MODERATE] Fractional pixel values throughout dashboard CSS  (multiple selectors · trivial)
- **File/selector:** `apps/cms/src/app/(payload)/styles/_dashboard.scss`
- **Now:** 12.5px (`__pulse-caption`, `__type-cell`, `__time-cell`, `__analytics-connect-label`, `__section-link`, `__analytics-url`, `__quick-desc`, `__analytics-title`), 10.5px (`__analytics-meta`, `__analytics-grid dt`, `__timeline-type`), 11.5px (`__timeline-time`).
- **Problem:** Fractional px sub-pixel-blur on 1x/1.5x displays.
- **Target:** Resolve to whole px — `__pulse-caption`/`__type-cell`/`__time-cell`/`__analytics-url` → 12px; `__analytics-connect-label`/`__section-link`/`__quick-desc`/`__analytics-title` → 13px; `__analytics-meta`/`__analytics-grid dt`/`__timeline-type` → 11px; `__timeline-time` → 12px.

### [MODERATE] Analytics card `min-height: 110px` produces uneven card heights  (`.cs-dashboard__analytics-card` · small)
- **File/selector:** `apps/cms/src/app/(payload)/styles/_dashboard.scss`
- **Now:** `min-height: 110px` — providers render 2–4 data points, so the 2-point Clarity card is shorter.
- **Problem:** `min-height` raises the floor but doesn't equalize a row; the grid looks uneven.
- **Target:** Remove `min-height: 110px`; set `.cs-dashboard__analytics-grid-cards { grid-auto-rows: 1fr }`. The flex body (`flex: 1`) pushes footers to the bottom. Add `padding: 20px` to match the pulse cards.

### [MODERATE] Timeline vertical hairline uses magic pixel offsets  (`.cs-dashboard__timeline-rows::before` · trivial)
- **File/selector:** `apps/cms/src/app/(payload)/styles/_dashboard.scss`
- **Now:** `top: 12px; bottom: 12px; left: 5px`; dot center is at 8px, so the line runs 3px left of center, and the top/bottom math only holds for exactly 24px rows.
- **Problem:** Line doesn't thread the dot centers and breaks on wrapped titles.
- **Target:** `left: 7px` (half of 16px − 1px line); `top: 20px; bottom: 20px`.

### [MODERATE] Quick-action section title (18px/700) heavier than the cards it introduces  (`.cs-dashboard__section-title` · small)
- **File/selector:** `apps/cms/src/app/(payload)/styles/_dashboard.scss` and `Dashboard.tsx`
- **Now:** `__section-title { font-size: 18px; font-weight: 700 }` applied to both "Recent edits" and "Quick actions"; `__quick-label` is 14px/600.
- **Problem:** For a utility shortcut grid, 18px/700 reads as a content heading. Vercel uses a lighter label for utility grids.
- **Target:** Add `cs-dashboard__section-title--utility` on the Quick actions `<h2>`: `font-size: 13px; font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase; color: var(--cs-text-secondary)`.

### [MODERATE] Pulse-grid gap (12px) too tight for KPI cards  (`.cs-dashboard__pulse-grid` · trivial)
- **File/selector:** `apps/cms/src/app/(payload)/styles/_dashboard.scss`
- **Now:** Both `__pulse-grid` and `__analytics-grid-cards` use `gap: var(--cs-space-3)` (12px); pulse-grid `margin-bottom: var(--cs-space-8)` (32px).
- **Problem:** With cards sharing the canvas background, a 12px gutter reads as one compound block. Vercel uses 16px.
- **Target:** `gap: var(--cs-space-4)` (16px) on both; `__pulse-grid margin-bottom: 40px` (add `--cs-space-10: 2.5rem`).

### [MINOR] Analytics section-head baseline alignment mismatch  (`.cs-dashboard__section-head` · trivial)
- **File/selector:** `apps/cms/src/app/(payload)/styles/_dashboard.scss`
- **Now:** `align-items: baseline` with an 18px/700 title and a 12.5px/500 link of differing line-heights; the link floats ~4px low.
- **Problem:** Baseline alignment only reads as intentional with matching baseline rows.
- **Target:** `align-items: center`; `margin-bottom: var(--cs-space-4)` (16px); `__section-link { line-height: 1; font-size: 13px }`.

### [MINOR] Timeline group gap token `--cs-space-5` undefined — falls back to 16px  (`.cs-dashboard__timeline` · trivial)
- **File/selector:** `apps/cms/src/app/(payload)/styles/_dashboard.scss` / `_tokens.scss`
- **Now:** `gap: var(--cs-space-5, var(--cs-space-4))` — `--cs-space-5` is undefined, so the intended 20px silently degrades to 16px.
- **Problem:** Missing tokens are a design-system liability.
- **Target:** Add `--cs-space-5: 1.25rem; /* 20px */` to `_tokens.scss` between `--cs-space-4` and `--cs-space-6`; simplify to `gap: var(--cs-space-5)`.

### [MINOR] Quick-action arrow absolute top-right occludes label on narrow cards  (`.cs-dashboard__quick-arrow` · small)
- **File/selector:** `apps/cms/src/app/(payload)/styles/_dashboard.scss`
- **Now:** `position: absolute; top: var(--cs-space-3); right: var(--cs-space-3); font-size: 16px`; label has no right padding.
- **Problem:** At ~250px cards (4-col) the label runs under the 16px icon.
- **Target:** Add `padding-right: 28px` to `__quick-label`, or move the icon inline via `display: grid; grid-template-columns: 1fr auto`.

### [MINOR] Connect-analytics strip uses raw `→` text character  (`.cs-dashboard__analytics-connect-arrow` · trivial)
- **File/selector:** `apps/cms/src/payload/admin/components/Dashboard/AnalyticsCards.tsx` (line 257)
- **Now:** `<span ...>→</span>` at 14px cyan.
- **Problem:** Raw glyph varies in stroke by font and sits below optical center. The codebase already has a `ChevronRight` SVG.
- **Target:** `import { ChevronRight } from '../icons/Chevron'; <ChevronRight size={16} />`; remove `font-size: 14px`, add `display: inline-flex; align-items: center`. Same fix for the `→` in `Dashboard.tsx` line 229.

### [MINOR] Dashboard greeting title 28px/700 too large  (`.cs-dashboard__title` · trivial)
- **File/selector:** `apps/cms/src/app/(payload)/styles/_dashboard.scss`
- **Now:** `font-size: 28px; font-weight: 700; line-height: 1.15; letter-spacing: -0.018em` — a marketing H2 scale.
- **Problem:** Vercel/Linear greetings are 20–22px/600; at 28px the greeting dominates and the KPI cards feel like an afterthought.
- **Target:** `font-size: 22px; font-weight: 600; line-height: 1.2; letter-spacing: -0.014em`; `__subtitle { font-size: 13px }`; `__header { margin-bottom: var(--cs-space-5) }`. Keep the cyan name accent.

### [MINOR] Analytics card shows "fresh" status label — reads as debug output  (`.cs-dashboard__analytics-meta` · small)
- **File/selector:** `apps/cms/src/payload/admin/components/Dashboard/AnalyticsCards.tsx` (line 56)
- **Now:** `{stale ? '· stale ·' : 'fresh'}`.
- **Problem:** Persistently showing "fresh" has no utility; premium UIs surface only warnings.
- **Target:** `{stale ? '· stale' : \`updated ${shortRelativeTime(capturedAt)}\`}` with a `shortRelativeTime` helper and the `--stale` amber modifier for the stale case.

### [MINOR] Section spacing uniform (32px) — sections lack grouping  (`.cs-dashboard__section` · trivial)
- **File/selector:** `apps/cms/src/app/(payload)/styles/_dashboard.scss`
- **Now:** `margin-bottom: var(--cs-space-8)` (32px) on all sections.
- **Problem:** A uniform gap makes the page a continuous list; premium dashboards use a heavier gap before a new logical cluster.
- **Target:** `margin-bottom: 40px` (or `var(--cs-space-10)`); optionally `border-top: 1px solid var(--cs-border-subtle); padding-top: 40px` on the Quick actions section.

### [MINOR] Timeline "live" dot 4px brand-tint halo is noisy  (`.cs-dashboard__timeline-dot--live` · trivial)
- **File/selector:** `apps/cms/src/app/(payload)/styles/_dashboard.scss`
- **Now:** `box-shadow: 0 0 0 1px var(--cs-cyan-500), 0 0 0 4px var(--cs-tint-brand-soft)` — effective radius ~18px, dwarfing draft dots.
- **Problem:** In a dense 10-row timeline the halo reads as noise and bleeds into the guide-rail spacing.
- **Target:** `box-shadow: 0 0 0 1px var(--cs-cyan-500)` — the cyan fill already communicates "live".

---

## Overlays — drawers, dialogs, popovers, command palette, tooltips, toasts

Strong bones: native dialog, correct z-stacking, token-driven colors, no white-input bugs, solid a11y foundations. What keeps it below the bar is a cluster of precision defects rather than architectural failure: the dialog/drawer backdrop blur is 2px (imperceptible on dark); drawer entry uses a linear full-slide instead of a spring; the toast bus uses input radius (6px) and skips exit animation; the link popover is a light-mode island with hardcoded `#fff`; the confirm modal close is 28px while the drawer close is 36px; and several surfaces skip the dismiss transition entirely — the single most unpolished thing an overlay can do.

### [MAJOR] Drawer enter animation — full-slide instead of spring  (drawer keyframes · small)
- **File/selector:** `apps/cms/src/app/(payload)/styles/_ui-primitives.scss:@keyframes cs-drawer-in-right / cs-drawer-in-left`; `_tokens.scss` motion tokens
- **Now:** `from { transform: translateX(100%) } to { transform: translateX(0) }` at `--cs-motion-modal` (240ms) — same curve as the dialog, no exit animation.
- **Problem:** A 540–1080px panel sliding full-width reads as a stock browser slide; sharing 240ms with the dialog erases the perceptual weight difference.
- **Target:** Add `--cs-motion-drawer: 280ms cubic-bezier(0.16,1,0.3,1)`. Enter: `from { transform: translateX(28px); opacity: 0.7 } to { transform: translateX(0); opacity: 1 }` at 280ms. Add `.cs-drawer__panel.is-closing { animation: cs-drawer-out-right 180ms ease-in forwards }` with `@keyframes cs-drawer-out-right { to { transform: translateX(28px); opacity: 0 } }`. Mirror left.

### [MAJOR] Toast bus — no exit animation, wrong radius, too-flat shadow  (`.cs-toast-bus__item` · small)
- **File/selector:** `apps/cms/src/app/(payload)/styles/_chrome-extras.scss:.cs-toast-bus__item`; `apps/cms/src/payload/admin/components/ToastBus.tsx`
- **Now:** `border-radius: var(--cs-radius-input)` (6px); enter only; no exit; `border: 1px solid var(--theme-elevation-200)` (barely lifts on dark); `box-shadow: var(--cs-shadow-lift-md)`.
- **Problem:** Items pop out of existence; 6px is input-tier radius; the toast barely lifts off the page.
- **Target:** `border-radius: var(--cs-radius-card)` (8px); `box-shadow: 0 8px 28px -6px rgba(0,0,0,0.40), 0 2px 8px rgba(0,0,0,0.20)`; `border: 1px solid var(--theme-elevation-300)`. Add `[data-dismissing='true']` driving `@keyframes cs-toast-bus-out { to { opacity: 0; transform: translateX(12px) }}` at 150ms ease-in, then dismiss on `animationend`.

### [MAJOR] Link popover — hardcoded light-mode colors on a dark admin  (`.cs-link-popover` · small)
- **File/selector:** `apps/cms/src/payload/admin/components/LinkPopover.scss`
- **Now:** `background: var(--theme-elevation-0, #fff)`; borders `#e5e7eb`; text `#111827`; focus ring `rgba(37,99,235,0.18)` (Tailwind blue); primary button `#2563eb`.
- **Problem:** Every fallback is light-mode → a glaring white island on dark; the accent is blue, not brand cyan (#06c7f2).
- **Target:** `background: var(--theme-elevation-100)`; border `var(--theme-elevation-200)`; input bg `var(--theme-input-bg, var(--theme-elevation-50))`; text `var(--theme-text)`; focus `box-shadow: 0 0 0 2px var(--cs-tint-focus-ring)`; primary `var(--cs-cyan-500)` (hover `--cs-cyan-600)`; results list `var(--theme-elevation-100)`, hover `var(--cs-tint-brand-soft)`. Add `box-shadow: 0 16px 40px -8px rgba(0,0,0,0.50)`.

### [MODERATE] cs-dialog backdrop blur 2px is imperceptible  (`.cs-dialog::backdrop` · trivial)
- **File/selector:** `apps/cms/src/app/(payload)/styles/_ui-primitives.scss:.cs-dialog::backdrop / .cs-drawer::backdrop`; `_overlays.scss:body:has(.drawer--is-open)::after`
- **Now:** `background: rgba(8,12,28,0.55); backdrop-filter: blur(2px)`.
- **Problem:** 2px on dark is invisible; the background bleeds through at full saturation. Linear uses 8–12px.
- **Target:** `.cs-dialog::backdrop { background: rgba(8,12,28,0.60); backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px) }`. Payload stock drawer backdrop: `blur(6px)`.

### [MODERATE] Command palette backdrop too weak (4px), no exit animation  (`.cs-cmdk` · small)
- **File/selector:** `apps/cms/src/app/(payload)/styles/_command-palette.scss:.cs-cmdk::backdrop, .cs-cmdk__esc`; `_tokens.scss`
- **Now:** backdrop `blur(4px)`; panel enters `cms-popup-in` at 120ms with no exit; ESC badge `border-radius: var(--cs-radius-chip)` (4px), 10.5px/700.
- **Problem:** 4px blur is barely visible; 120ms is too fast for a 640px overlay; it cuts to black on close; the ESC badge is overcrowded.
- **Target:** backdrop `blur(12px)`; add `--cs-motion-cmdk: 200ms cubic-bezier(0.16,1,0.3,1)` for the enter; add `[data-closing]` → `@keyframes cs-cmdk-out { to { opacity:0; transform:translateX(-50%) translateY(-4px) scale(0.99) }}` at 120ms ease-in. ESC badge `border-radius: 3px; font-size: 10px; font-weight: 500; letter-spacing: 0.05em; padding: 2px 5px`.

### [MODERATE] Command palette footer kbd caps over-tall, misaligned baseline  (`.cs-cmdk__foot kbd` · trivial)
- **File/selector:** `apps/cms/src/app/(payload)/styles/_command-palette.scss:.cs-cmdk__foot kbd, .cs-cmdk__foot`
- **Now:** kbd `height: 16px; min-width: 16px; padding: 0 4px; border-radius: 3px; font-size: 10px`; foot 11px.
- **Problem:** 16px caps at 10px font look pinched; the 1px top border is invisible on `--cs-surface-canvas`.
- **Target:** kbd `height: 18px; min-width: 18px; padding: 0 5px; font-size: 11px; border-bottom-width: 2px; border-radius: 4px`. foot `padding: 7px var(--cs-space-4); background: var(--cs-surface-canvas); border-top: 1px solid var(--cs-border-strong)`.

### [MODERATE] FieldDescriptionTooltip info button — 14×14px target too small  (`.cs-field-info` · trivial)
- **File/selector:** `apps/cms/src/app/(payload)/styles/_forms.scss:.field-label .cs-field-info` and `#cs-field-info-tooltip`
- **Now:** `14×14; font-size: 9px; font-style: italic`.
- **Problem:** Below the 16px minimum target; the 9px italic "i" is nearly illegible.
- **Target:** `16×16; font-size: 10px; font-style: normal; font-weight: 600`. Widen tooltip `max-width: 300px; line-height: 1.5`.

### [MODERATE] Confirmation modal close 28×28px vs drawer close 36×36px  (`.close-modal-button` · trivial)
- **File/selector:** `apps/cms/src/app/(payload)/styles/_overlays.scss:.close-modal-button`
- **Now:** `28×28`; hover lights brand cyan, while the drawer close hovers red — inconsistent mental model within one overlay family.
- **Problem:** Same surface family, mismatched targets and hover semantics.
- **Target:** `width: 32px; height: 32px`; unify hover to destructive red: `color: var(--color-error-500); border-color: var(--color-error-500); background: rgba(220,38,38,0.08)`.

### [MINOR] Combobox option hardcoded 6px border-radius bypasses token  (`.cs-combobox__option` · trivial)
- **File/selector:** `apps/cms/src/app/(payload)/styles/_ui-primitives.scss:.cs-combobox__option`
- **Now:** `border-radius: 6px` hardcoded.
- **Problem:** Diverges from the token system; will drift if the token changes.
- **Target:** `border-radius: var(--cs-radius-input)`.

### [MINOR] cs-dialog/drawer footer background — elevation-50 light-mode rgba fallback  (`.cs-dialog__footer` · trivial)
- **File/selector:** `apps/cms/src/app/(payload)/styles/_ui-primitives.scss:.cs-dialog__footer, .cs-drawer__footer`
- **Now:** `background: var(--theme-elevation-50, rgba(0,0,0,0.02))` — 2% opacity, imperceptible on dark.
- **Problem:** Footer and body share an identical background; no visual floor.
- **Target:** `background: var(--theme-elevation-100)` on both footers.

### [MINOR] Popover enter — translateY(-2px) too subtle, wrong amplitude  (`@keyframes cs-popover-in` · trivial)
- **File/selector:** `apps/cms/src/app/(payload)/styles/_ui-primitives.scss:@keyframes cs-popover-in`
- **Now:** `from { opacity: 0; transform: translateY(-2px) } to { ... }` — 2px over 120ms is imperceptible.
- **Problem:** Near-instant opacity flash with no directional cue.
- **Target:** `from { opacity: 0; transform: translateY(-4px) scale(0.99) } to { opacity: 1; transform: translateY(0) scale(1) }`. Add `@keyframes cs-popover-out` for dismiss.

### [MINOR] cs-schedule select height 36px inconsistent with form inputs  (`.cs-schedule__select` · trivial)
- **File/selector:** `apps/cms/src/app/(payload)/styles/_ui-primitives.scss:.cs-schedule__select` (lines 1894–1919)
- **Now:** `height: 36px` with a fragile CSS-triangle chevron.
- **Problem:** 36px pinched next to 38px inputs / 40px collections-select; the gradient chevron is fragile.
- **Target:** `height: 38px`; replace the gradient chevron with the SVG data-URL chevron from `.cs-native-select`.

### [MINOR] cs-btn padding 6px 14px → ~31px height, below 36px minimum  (`.cs-btn` · trivial)
- **File/selector:** `apps/cms/src/app/(payload)/styles/_ui-primitives.scss:.cs-btn`
- **Now:** `padding: 6px 14px; font-size: 0.875rem` → ~32–34px.
- **Problem:** Dialog footer buttons are below the 36px minimum and misalign with the 38px native select in the same footer.
- **Target:** `padding: 8px 16px` (~34px); primary/danger `padding: 9px 18px` (~36px). Footer `align-items: center`.

---

## Rich-text / Lexical editor

The editor chrome has been deliberately re-styled from Payload's defaults and shows real craft: the sticky fixed-toolbar, branded selection color, fullscreen focus mode, and custom add-menu/link popovers are all considered. But several surfaces betray provisional origins: the LinkPopover and TableGridPicker hardcode light-mode colors and a blue success accent; toolbar buttons (28px) are cramped; there is no empty-canvas placeholder; heading spacing is flat across levels; the code block is under-styled; and the inline-image dialog's active accent is sky blue (#0ea5e9) instead of brand cyan.

### [MAJOR] LinkPopover hardcodes light-mode colors, breaks dark theme  (`.cs-link-popover` · small)
- **File/selector:** `apps/cms/src/payload/admin/components/LinkPopover.scss`
- **Now:** `background: #fff`; borders `#e5e7eb`; raw text hexes `#111827`/`#4b5563`/`#374151`/`#6b7280`; focus ring `rgba(37,99,235,0.18)`; primary `#2563eb`.
- **Problem:** Renders as a bright white card with near-black text on dark; the primary is blue, not brand cyan. No token theming at all.
- **Target:** background `var(--theme-elevation-100)`; border `var(--theme-elevation-200)`; text `var(--theme-text)` / `var(--theme-text-soft)`; input bg `var(--theme-input-bg)`; focus `0 0 0 2px var(--cs-tint-focus-ring)`; primary `var(--cs-cyan-600)` (hover `--cs-cyan-700`, color `#04212a`); results list `var(--theme-elevation-100)`, hover `var(--cs-tint-brand-soft)`. Width 360px; padding 14px; border-radius 10px.

### [MAJOR] TableGridPicker hardcodes light-mode colors, blue active cells  (`.cs-table-picker` · small)
- **File/selector:** `apps/cms/src/payload/admin/components/TableGridPicker.scss`
- **Now:** `background: #fff`; cell active `#2563eb`/`#1d4ed8`; cells 18×18.
- **Problem:** White square on dark; blue active cells break brand; 18px cells hard to hover.
- **Target:** background `var(--theme-elevation-100)`; border `var(--theme-elevation-200)`; cell rest bg `var(--theme-elevation-150)`; cell active `var(--cs-cyan-500)` / border `var(--cs-cyan-600)`; cell 20×20; label 12px/500 `var(--theme-text)`; border-radius 8px; `box-shadow: 0 8px 24px rgba(0,0,0,0.32)`.

### [MODERATE] Toolbar icon buttons 28px cramped; active state lacks border accent  (`.toolbar-popup__button` · trivial)
- **File/selector:** `apps/cms/src/app/(payload)/styles/_lexical-toolbar.scss`
- **Now:** `28×28`; active = tinted background only; SVG 14×14.
- **Problem:** 28px is below the comfortable 32px; the tint-only active state lacks the crisp read of a bottom border.
- **Target:** `30×30` (toolbar lands at 44px); SVG 15×15; active adds `border-bottom: 1.5px solid var(--cs-cyan-500)` plus the tint, with a border-color transition.

### [MODERATE] Toolbar group dividers 18px float in a 44px bar  (`.divider` · trivial)
- **File/selector:** `apps/cms/src/app/(payload)/styles/_lexical-toolbar.scss`
- **Now:** `height: 18px` in a 44px container — 13px of dead space top and bottom.
- **Problem:** Dividers disappear at a glance. Premium toolbars span ~70% of bar height.
- **Target:** `height: 28px`.

### [MODERATE] Add-menu / slash-menu rows 6px 10px padding read as a compact list  (`.cs-add-menu__item` · trivial)
- **File/selector:** `apps/cms/src/app/(payload)/styles/_lexical-toolbar.scss`
- **Now:** `padding: 6px 10px; border-radius: var(--cs-radius-chip)` (4px) inside an 8px-radius card; menu `min-width: 180px`; icon stays desaturated on row hover.
- **Problem:** ~26px rows feel cramped; 4px items in an 8px card look like a rounding mismatch; "Numbered list" clips at 180px.
- **Target:** `padding: 8px 12px; border-radius: var(--cs-radius-input)` (6px); `min-width: 200px`; icon inherits text color on hover with a `color var(--cs-motion-micro)` transition.

### [MODERATE] Empty writing canvas has no placeholder  (`.ContentEditable__root` · small)
- **File/selector:** `apps/cms/src/app/(payload)/styles/_editor.scss`
- **Now:** No placeholder; empty editor shows a blank 320px void with only the cursor.
- **Problem:** Notion/Craft/Ghost all show a placeholder that doubles as slash-menu discoverability.
- **Target:** `.ContentEditable__root:not(:focus):empty::before { content: 'Start typing or press / for commands'; color: var(--theme-text-disabled); font-size: 15px; font-style: italic; pointer-events: none; position: absolute }` with `.ContentEditable__root { position: relative }`. Nested editors: `'Type here…'`, `position: static`.

### [MODERATE] Heading spacing flat across h1–h6 — hierarchy collapses  (`.LexicalEditorTheme__h1–h6` · trivial)
- **File/selector:** `apps/cms/src/app/(payload)/styles/_editor.scss`
- **Now:** All headings `margin: var(--cs-space-6) 0 var(--cs-space-3) 0` (24px top / 12px bottom).
- **Problem:** A flat 24px top margin erases the major-vs-minor heading distinction.
- **Target:** H1 36/12, H2 32/10, H3 24/8, H4 16/6, H5–H6 12/4 (top/bottom px). Paragraph bottom stays 12px.

### [MODERATE] Code block under-styled — looks like a textarea  (`.LexicalEditorTheme__code` · trivial)
- **File/selector:** `apps/cms/src/app/(payload)/styles/_editor.scss`
- **Now:** `background: var(--theme-elevation-100); border: 1px solid var(--theme-elevation-150); border-radius: var(--cs-radius-input)` (6px); `padding: 12px`.
- **Problem:** No language signal, no atomic-unit treatment.
- **Target:** `border-radius: 8px`; `border-left: 3px solid var(--theme-elevation-300)`; `box-shadow: inset 0 1px 0 rgba(0,0,0,0.08)`; `padding: 14px 16px`; `position: relative` for a future language/copy chip.

### [MINOR] Blockquote left border only 3px  (`.LexicalEditorTheme__quote` · trivial)
- **File/selector:** `apps/cms/src/app/(payload)/styles/_editor.scss`
- **Now:** `border-inline-start: 3px solid var(--cs-cyan-500); padding-inline-start: 16px; margin: 16px 0`.
- **Problem:** 3px disappears at reading distance on dark; 16px margins stack tightly.
- **Target:** `border-inline-start: 4px`; `padding-inline-start: 20px`; `margin: var(--cs-space-6) 0` (24px); add `opacity: 0.9`.

### [MINOR] Fullscreen content max-width 800px too wide  (`.cs-fullscreen-host .ContentEditable__root` · trivial)
- **File/selector:** `apps/cms/src/app/(payload)/styles/_editor-fullscreen.scss`
- **Now:** `max-width: 800px; padding: 48px 24px 64px` → ~752px column.
- **Problem:** Long line lengths; ideal prose measure is ~640–680px (65–75 chars).
- **Target:** `max-width: 680px; padding: var(--cs-space-16) var(--cs-space-8) var(--cs-space-16)` (64px top, 32px sides, 64px bottom).

### [MINOR] Fullscreen exit cluster background too opaque  (`.cs-fullscreen-cluster` · trivial)
- **File/selector:** `apps/cms/src/app/(payload)/styles/_editor-fullscreen.scss`
- **Now:** `background: var(--theme-elevation-100); border: 1px solid var(--theme-elevation-200); border-radius: 999px`.
- **Problem:** elevation-100 (#23242a) blends into the #1c1d21 background; doesn't read as a floating pill.
- **Target:** `background: var(--theme-elevation-150)`; `box-shadow: 0 4px 16px rgba(0,0,0,0.4), 0 1px 0 rgba(255,255,255,0.04)`.

### [MODERATE] Inline image dialog tab active color is sky blue, not brand cyan  (`.cs-inline-image-dialog__tab.is-active` · small)
- **File/selector:** `apps/cms/src/app/(payload)/styles/_inline-image.scss`
- **Now:** Tab active, primary button, toggle active, focal dot, and focus outline all use `var(--theme-success-500, #0ea5e9)` (sky blue).
- **Problem:** The most-used editor modal uses a different accent from every other editor surface; the cyan→blue mismatch is visible in one session.
- **Target:** Replace every `--theme-success-500` with `var(--cs-cyan-600)` (backgrounds/borders) and `var(--cs-cyan-500)` (focus outline, focal dot); chip-primary hover `var(--cs-cyan-700)`; focus `box-shadow: 0 0 0 2px var(--cs-tint-focus-ring)`. Replace the `__close` 22px glyph with a 16×16 SVG X.

### [MINOR] Embed dialog input height 42px vs admin 38px  (`.cs-embed-dialog__input` · trivial)
- **File/selector:** `apps/cms/src/app/(payload)/styles/_editor.scss`
- **Now:** `height: 42px !important; padding: 0 12px !important`.
- **Problem:** Visible size discrepancy vs system inputs; `!important` makes it hard to update.
- **Target:** `height: 38px !important; padding: 0 10px !important`; keep font-size 14px.

### [MINOR] Toolbar dropdown items min-width 180px clips labels  (`.toolbar-popup__dropdown-items` · trivial)
- **File/selector:** `apps/cms/src/app/(payload)/styles/_lexical-toolbar.scss`
- **Now:** `min-width: 180px; padding: 4px; gap: 1px`; item `padding: 6px 10px`.
- **Problem:** "Bulleted list" barely fits with no breathing room; 1px gap gives no hover separation.
- **Target:** `min-width: 200px; gap: 2px`; item `padding: 7px 12px`; active item `font-weight: 500` (600 reads as a header).

### [MINOR] Toolbar dropdown trigger 12.5px fractional, 28px height  (dropdown trigger · trivial)
- **File/selector:** `apps/cms/src/app/(payload)/styles/_lexical-toolbar.scss`
- **Now:** `height: 28px; font-size: 12.5px`; label `max-width: 12ch`.
- **Problem:** Fractional font; 2px misalignment once icon buttons move to 30px; "Heading 3" truncates at 12ch.
- **Target:** `height: 30px; font-size: 13px`; label `max-width: 14ch`.

---

## Login & Auth Screens

The login/auth screens are structurally sound and directionally correct — dark gradient backdrop, branded hero, card elevation, error callout, footer watermark, all present (Wave 5 already lifts this above stock Payload). But specific values keep it short: the form card padding undershoots and uses a radius mismatch; there is no max-width cap so the card stretches at 1440px; the inputs lack an explicit height lock; the submit button borrows the 36px chrome height; the hero eyebrow and footer brand share a register; and the 2FA reserved section's dashed border reads as an unfinished wireframe. The backdrop gradient is well-executed.

### [MAJOR] Login card padding undershoots (32px) for a centred auth surface  (`.template-minimal .form-wrap` · trivial)
- **File/selector:** `apps/cms/src/app/(payload)/styles/_login.scss:.template-minimal .form-wrap, .template-minimal form`
- **Now:** `padding: var(--cs-space-8)` (32px).
- **Problem:** On the only object on screen, 32px crowds the card edge — utilitarian, not crafted. Vercel/Linear/Stripe give 40–48px.
- **Target:** `padding: 40px` (`2.5rem`), or add `--cs-space-10: 2.5rem` and use it.

### [MAJOR] Login card has no max-width — stretches at 1440px  (`.template-minimal .form-wrap` · trivial)
- **File/selector:** `apps/cms/src/app/(payload)/styles/_login.scss:.template-minimal .form-wrap, .template-minimal form`
- **Now:** No max-width cap; relies on Payload's own width logic which can stretch to 420–500px+.
- **Problem:** A login card should be intimate; 400px is the gold standard (Vercel/Linear/Stripe). No cap risks silent widening on Payload updates.
- **Target:** `max-width: 400px; width: 100%; margin-inline: auto`.

### [MODERATE] Login inputs inherit fractional padding instead of explicit height  (`.template-minimal` inputs · small)
- **File/selector:** `apps/cms/src/app/(payload)/styles/_login.scss`
- **Now:** Stock Payload `field-type` inputs fall through to global density; the 9.75px fractional padding bug can surface on the highest-visibility surface.
- **Problem:** Input height must be rock-solid here regardless of cascade order.
- **Target:** Under `.template-minimal`: `input[type='email'], input[type='password'], input[type='text'] { height: 40px !important; padding: 0 12px !important; font-size: 14px !important; }`.

### [MODERATE] Login submit button inherits 36px chrome height — too small  (`.template-minimal form button[type='submit']` · small)
- **File/selector:** `apps/cms/src/app/(payload)/styles/_login.scss`
- **Now:** Inherits `.btn--style-primary` at `height: 36px`.
- **Problem:** Auth CTAs on premium products are 44–48px; 36px reads as a config form, not "sign in".
- **Target:** `form button[type='submit'], form .btn--style-primary { height: 44px !important; font-size: 14px !important; font-weight: 600 !important; width: 100% !important; border-radius: var(--cs-radius-input) !important; }`.

### [MODERATE] Hero eyebrow and footer brand share the same visual register  (`.cs-login-hero__eyebrow` · trivial)
- **File/selector:** `apps/cms/src/app/(payload)/styles/_login.scss:.cs-login-hero__eyebrow, .cs-login-footer__brand`
- **Now:** Both 11px mono; eyebrow `var(--cs-cyan-600)` / 0.12em / `margin-bottom: var(--cs-space-1)`; footer mono / 0.04em / opacity 0.7.
- **Problem:** Eyebrow and footer compete for the "small administrative text" slot; neither has authority.
- **Target:** Eyebrow `color: var(--cs-cyan-500); margin-bottom: var(--cs-space-2)` (8px). Footer brand `font-size: 10px; opacity: 0.5`. Support line stays 12px. Three tiers: eyebrow 11px cyan / support 12px soft / watermark 10px faint.

### [MODERATE] Hero `margin-bottom` 24px gives insufficient separation from the form  (`.cs-login-hero` · trivial)
- **File/selector:** `apps/cms/src/app/(payload)/styles/_login.scss:.cs-login-hero`
- **Now:** `margin-bottom: var(--cs-space-6)` (24px).
- **Problem:** The eye moves from lede to form label with no pause; Vercel/Linear/Clerk use 32–40px to separate identity from form.
- **Target:** `margin-bottom: var(--cs-space-8)` (32px).

### [MODERATE] Account form `cs-account__field` gap 4px — label-to-input too tight  (`.cs-account__field` · trivial)
- **File/selector:** `apps/cms/src/app/(payload)/styles/_login.scss:.cs-account__field`
- **Now:** `gap: var(--cs-space-1)` (4px).
- **Problem:** Same cramped label-input issue as the global form audit, more visible inside the card.
- **Target:** `gap: var(--cs-space-2)` (8px) — matches `cs-quick-create` fields.

### [MODERATE] 2FA reserved section dashed border reads as a wireframe artefact  (`.cs-account__group--reserved` · small)
- **File/selector:** `apps/cms/src/app/(payload)/styles/_login.scss:.cs-account__group--reserved` and `apps/cms/src/payload/admin/components/auth/CmsAccountForm.tsx`
- **Now:** `background: transparent; border-style: dashed` with active-fieldset layout.
- **Problem:** A dashed border signals "drop something here" / "unfinished" — the editor questions it every visit.
- **Target:** `opacity: 0.45; border-color: var(--theme-elevation-100); border-style: solid`; wrap the fieldset with `pointer-events: none`.

### [MINOR] Login card uses `--cs-radius-modal` (12px) but is not a modal  (`.template-minimal .form-wrap` · trivial)
- **File/selector:** `apps/cms/src/app/(payload)/styles/_login.scss:.template-minimal .form-wrap, .template-minimal form`
- **Now:** `border-radius: var(--cs-radius-modal)` (12px).
- **Problem:** 16px reads as a deliberate card choice at this scale (Vercel/Linear/Stripe).
- **Target:** Add `--cs-radius-login: 16px` to `_tokens.scss` and use it.

### [MINOR] Hero title sits too close to subtitle lede (8px)  (`.cs-login-hero__title` · trivial)
- **File/selector:** `apps/cms/src/app/(payload)/styles/_login.scss:.cs-login-hero__title`
- **Now:** `font-size: 28px; margin-bottom: var(--cs-space-2)` (8px); line-height unset.
- **Problem:** ~6px cap-to-baseline distance merges title and lede into one block.
- **Target:** `margin-bottom: var(--cs-space-3)` (12px); confirm `line-height: 1.2`.

### [MINOR] Error callout radius (8px) mismatches the 16px card  (`.template-minimal ... .errors` · trivial)
- **File/selector:** `apps/cms/src/app/(payload)/styles/_login.scss:.template-minimal .form-wrap .errors, ...`
- **Now:** `border-radius: var(--cs-radius-card)` (8px) against a (proposed) 16px card.
- **Problem:** Inner radius should be outer minus inset (~6px).
- **Target:** `border-radius: var(--cs-radius-input)` (6px).

### [MINOR] Account fieldset legend uppercase without the eyebrow tracking token  (`.cs-account__group legend` · trivial)
- **File/selector:** `apps/cms/src/app/(payload)/styles/_login.scss:.cs-account__group legend`
- **Now:** `text-transform: uppercase; letter-spacing: 0.02em; font-size: 13px; font-weight: 600`.
- **Problem:** 0.02em at 13px reads as neither label nor heading; inconsistent with page eyebrows (0.12em).
- **Target:** `letter-spacing: 0.08em; font-size: 11px; font-weight: 600`.

### [MINOR] Account title 26px vs login hero 28px  (`.cs-account__title` · trivial)
- **File/selector:** `apps/cms/src/app/(payload)/styles/_login.scss:.cs-account__title`
- **Now:** `font-size: 26px`; `.cs-login-hero__title` is 28px; no letter-spacing.
- **Problem:** 2px difference between sibling views reads as "something is off", not hierarchy.
- **Target:** `font-size: 28px; line-height: 1.2; letter-spacing: -0.01em`.

### [MINOR] Backdrop radial gradient cyan stop 0.15 too weak  (`[data-theme='dark'] .template-minimal::before` · trivial)
- **File/selector:** `apps/cms/src/app/(payload)/styles/_login.scss`
- **Now:** Dark: cyan `rgba(6,199,242,0.15)`, purple `rgba(93,4,216,0.18)` peaked at the viewport edge.
- **Problem:** 0.15 renders as grey at realistic gamma; Vercel/Linear use 0.20–0.28.
- **Target:** Both stops at `0.22` for atmospheric parity.

### [MINOR] Account view side padding asymmetric (32/24)  (`.cs-account` · trivial)
- **File/selector:** `apps/cms/src/app/(payload)/styles/_login.scss:.cs-account`
- **Now:** `max-width: 720px; padding: var(--cs-space-8) var(--cs-space-6)` (32px top/bottom, 24px sides).
- **Problem:** Below ~900px canvas the fields hit the sidebar edge with only 24px gutter.
- **Target:** `padding: var(--cs-space-8)` (symmetric 32px) — unifies with the login card.

### [MINOR] Logo SVG inline style duplicates SCSS centering  (`Logo.tsx` · trivial)
- **File/selector:** `apps/cms/src/payload/admin/Logo.tsx` and `_login.scss .graphic-logo svg`
- **Now:** `display: block; margin: 0 auto` declared both inline (wins specificity) and in SCSS.
- **Problem:** Split ownership; the inline `margin` fights any SCSS height update.
- **Target:** Remove `style={{ display: 'block', margin: '0 auto' }}` from `<svg>`; the SCSS rule already handles it.

---

## Media library, media field & pickers

The media surfaces are well ahead of stock Payload — dark theme, checkered transparency backgrounds, skeleton states, debounced search, native dialog focus-traps, keyboard nav in the browse grid. The filled-card layout, transparency pattern, rename-in-place UX, skeleton animation, copy-state feedback, and preview lightbox all work well. Rough edges keep it below the bar: a 24×24 MediaCell thumb, uncontrolled browse-dialog grid columns, irregular tile text padding, no selected-tile state before close, a hardcoded-hex size-warning banner, Unicode-glyph URL-action icons, a 4px progress bar, and a 36px browse-search input that mismatches the 38px standard.

### [MAJOR] Browse-dialog grid columns uncontrolled — rhythm collapses  (`.cs-media-field__browse-grid` · trivial)
- **File/selector:** `apps/cms/src/app/(payload)/styles/_media-field.scss:.cs-media-field__browse-grid`
- **Now:** `grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: var(--cs-space-2)` (8px). At 720px → 4 tiles at 174px (24% too wide) or 3 cramped tiles when resized.
- **Problem:** No defined column count locks the grid; the type badge looks adrift; the 8px gap reads as stacked.
- **Target:** `grid-template-columns: repeat(4, 1fr); gap: var(--cs-space-3)` (12px) → 162px tiles.

### [MAJOR] Browse-tile has no selected/active state before close  (`.cs-media-field__browse-tile` · small)
- **File/selector:** `apps/cms/src/app/(payload)/styles/_media-field.scss:.cs-media-field__browse-tile`; `apps/cms/src/payload/admin/components/MediaBrowseDialog.tsx`
- **Now:** Hover lifts; click immediately fires onSelect+onClose with no intermediate state.
- **Problem:** On a slow connection the dialog snaps shut with no confirmation — feels broken. Linear flashes a cyan ring for ~80ms.
- **Target:** `:active { border-color: var(--cs-cyan-500); background: var(--cs-tint-brand-soft); box-shadow: 0 0 0 2px var(--cs-tint-focus-ring); transform: scale(0.97); }`; add a 60ms `setTimeout` before `onClose()`.

### [MODERATE] MediaCell thumbnail 24×24 — too small to be useful  (`.cs-media-cell__thumb` · trivial)
- **File/selector:** `apps/cms/src/app/(payload)/styles/_media-cell.scss:.cs-media-cell__thumb`
- **Now:** `width: 24px; height: 24px; border-radius: 4px` (hardcoded).
- **Problem:** Favicon-sized; reads as a colored dot, not a preview. Linear/Notion/Vercel use 32–40px.
- **Target:** `width: 36px; height: 36px; border-radius: var(--cs-radius-chip)`; keep `flex-shrink: 0`.

### [MODERATE] MediaSizeWarningField uses raw inline hex styles  (`MediaSizeWarningField` · small)
- **File/selector:** `apps/cms/src/payload/admin/components/MediaSizeWarningField.tsx`
- **Now:** `style={{ background: '#3a2f0f', border: '1px solid #c79a2e', color: '#f0c45a', ... }}`.
- **Problem:** Raw hexes bypass the token system, fight the cascade, and read as a debug banner.
- **Target:** Extract to `.cs-media-size-warning` in `_media.scss`: `background: rgba(199,154,46,0.10); border: 1px solid rgba(199,154,46,0.40); border-radius: var(--cs-radius-input); color: #e8b84b; font-size: 12px; padding: 8px 12px`; use a 16×16 `⚠` SVG.

### [MODERATE] URL-action icon buttons use OS-rendered Unicode glyphs (✓ ⧉ ↗)  (`.cs-media-self__url-action` · small)
- **File/selector:** `apps/cms/src/payload/admin/components/MediaSelfChrome.tsx`
- **Now:** `'✓'`/`'⧉'` for copy, `'↗'` for open-in-tab as button text.
- **Problem:** `⧉` (U+29C9) is a math operator that tofus on some Linux stacks; glyph sizes vary by OS. Every other CMS icon is inline SVG.
- **Target:** Replace with 14×14 inline SVG (`stroke='currentColor' strokeWidth='1.5'`) — clipboard, checkmark `M3 8l3 3 7-7`, arrow-up-right (reuse the MediaField.tsx SVG).

### [MINOR] MediaPicker drawer tile hover missing lift; gap too tight  (`.cs-media-picker__tile` · trivial)
- **File/selector:** `apps/cms/src/app/(payload)/styles/_ui-primitives.scss:.cs-media-picker__tile`
- **Now:** Hover only changes border-color; `gap: var(--cs-space-1)` (4px).
- **Problem:** Should feel identical to MediaBrowseDialog tiles (which lift); the 4px gap bleeds the name into the image.
- **Target:** `:hover { border-color: var(--cs-cyan-500); transform: translateY(-1px); box-shadow: var(--cs-shadow-lift-md); background: var(--cs-tint-brand-soft) }` with transitions; `gap: 0`, name `padding: 4px 8px 6px`.

### [MINOR] Progress bar 4px below perceptible threshold  (`.cs-media-field__progress` · trivial)
- **File/selector:** `apps/cms/src/app/(payload)/styles/_media-field.scss:.cs-media-field__progress`
- **Now:** `height: 4px`.
- **Problem:** Barely visible on HiDPI dark; it's the only upload feedback. GitHub/Linear/Vercel use 6px.
- **Target:** `height: 6px`; optional fill glow `box-shadow: 0 0 6px rgba(6,199,242,0.5)`.

### [MINOR] Browse-search input 36px mismatches 38px standard  (`.cs-media-field__browse-search` · trivial)
- **File/selector:** `apps/cms/src/app/(payload)/styles/_media-field.scss:.cs-media-field__browse-search`
- **Now:** `height: 36px` next to a 30px close button — 4px top-alignment skew in the header row.
- **Problem:** Two heights in one flex row.
- **Target:** `height: 38px; padding: 0 var(--cs-space-3)`.

### [MINOR] Browse-tile text area has irregular padding stack  (`.cs-media-field__browse-tile-*` · small)
- **File/selector:** `apps/cms/src/app/(payload)/styles/_media-field.scss`
- **Now:** name `padding 6px 8px 2px`; type `margin 0 8px 6px, padding 2px 6px`; dims `padding 0 8px 6px` — unequal 6/2/6 spacing, name and badge appear to touch.
- **Problem:** Margin-based badge positioning is fragile; the 2px name→badge gap is invisible.
- **Target:** Single flex-column container below the image: `padding: 8px 8px 6px; gap: 4px`; name `padding: 0; font-size: 12px`; type `margin: 0; padding: 1px 5px; border-radius: 3px`; dims `padding: 0; font-size: 10px`.

### [MINOR] Dropzone glyph circle has no border  (`.cs-media-field__dropzone-glyph` · trivial)
- **File/selector:** `apps/cms/src/app/(payload)/styles/_media-field.scss:.cs-media-field__dropzone-glyph`
- **Now:** `44×44; background: var(--cs-tint-brand-soft)` (8% — near-invisible on dark), no border.
- **Problem:** The circle reads as an arrow floating in space; 44px is undersized (Vercel 48px).
- **Target:** `48×48; border: 1px solid rgba(6,199,242,0.22)`; keep token bg/color; inner SVG 28×28.

### [MINOR] MediaCell fallback is a plain grey square — no file-type signal  (`.cs-media-cell__thumb-fallback` · small)
- **File/selector:** `apps/cms/src/app/(payload)/styles/_media-cell.scss` and `apps/cms/src/payload/admin/components/MediaField/MediaCell.tsx`
- **Now:** A 12×12 `var(--theme-elevation-200)` div inside the thumb container.
- **Problem:** A grey box signals nothing; at 12×12 it looks like a rendering artifact. MediaBrowseDialog/MediaField use a MIME label.
- **Target:** Remove the div; render a MIME-label `<span>` (extract `typeLabelForMime` to `lib/mime-labels.ts`): `font-family: var(--font-mono); font-size: 9px; font-weight: 600; letter-spacing: 0.04em; color: var(--theme-text-soft); text-align: center`.

### [MINOR] List-view header buttons 32px / 12.5px violate rhythm  (`.collection-list--media .list-header .btn` · trivial)
- **File/selector:** `apps/cms/src/app/(payload)/styles/_media.scss` (lines 43–47)
- **Now:** `height: 32px; font-size: 12.5px`.
- **Problem:** Shorter than the 40px standard CTA; 12.5px is fractional; buttons look deflated.
- **Target:** `height: 36px; font-size: 13px`.

---

## Buttons, Controls & Icons — system-wide

The control system is architecturally sound — tokens, four named variants, fractional-pixel awareness, motion tokens, a clean single-file icons directory. Primary/secondary/subtle/ghost variants exist and mostly work. But a cluster of real gaps keeps it below the bar: a parallel `.cs-btn` family with a different height than `.btn`; a Chevron viewBox/path mismatch rendering off-center arrows; a kebab button that shows as a bare "-" because there's no glyph fallback; an Index/No-Index toggle built from radio pills instead of a true segmented control; five different button font sizes; split icon-only sizes (28/30px); a literal `#04212a` text color in two files; and a duplicated disabled-opacity rule (0.6 vs 0.7).

### [MAJOR] Kebab button in doc-controls renders as a bare text character  (`.doc-controls__popup .popup-button` · trivial)
- **File/selector:** `apps/cms/src/app/(payload)/styles/_density.scss`
- **Now:** Payload's `.popup-button` has no icon SVG in some 3.x renders; the content is `-`/`–`. The wrapper is sized 36×36 but there's no glyph-injection fallback (unlike the drawer close `&:empty::after`).
- **Problem:** The kebab is the entry to Duplicate, Delete, Versions, API URL, Discard — a bare dash reads as broken UI.
- **Target:** Append at the end of the `.doc-controls__popup .popup-button` block: `&:empty::after { content: ''; display: inline-block; width: 14px; height: 14px; background: currentColor; -webkit-mask: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><circle cx="8" cy="3" r="1.5"/><circle cx="8" cy="8" r="1.5"/><circle cx="8" cy="13" r="1.5"/></svg>') no-repeat center / contain; mask: same; }`.

### [MAJOR] Dual button class families with mismatched heights  (`.btn` vs `.cs-btn` · small)
- **File/selector:** `apps/cms/src/app/(payload)/styles/_ui-primitives.scss:.cs-btn`
- **Now:** `.btn` (`_buttons.scss`): 36px, 13.5px, weight 600. `.cs-btn` (`_ui-primitives.scss`): no explicit height → ~30px from `padding: 6px 14px` + 14px font, weight 500. They appear side-by-side in dialog/confirm footers.
- **Problem:** Two primitives at 36px vs ~30px / 600 vs 500 look like different controls in the same footer.
- **Target:** Unify `.cs-btn` to `.btn`: `padding: 0 14px; height: 36px; font-weight: 600; font-size: 13.5px; letter-spacing: 0.005em`. Variants inherit height.

### [MODERATE] Button font-size scattered across 5 values  (multiple selectors · small)
- **File/selector:** `apps/cms/src/app/(payload)/styles/_buttons.scss` (+ `_ui-primitives.scss`, `_lexical-toolbar.scss`, `_sidebar-seo.scss`)
- **Now:** `.btn` 13.5px; `.cs-btn` 14px; `.cs-embed-dialog__confirm` 13px; `.cs-seo-advanced__add` / `__og-pick` 12.5px; `.cs-inbound-redirects__btn` / `.cs-outbound-redirect__btn` 12px; `.cs-schema-preview__btn` 12.5px.
- **Problem:** Five sizes look inconsistent when they share a surface (SEO sidebar, dialog footers).
- **Target:** Two tiers — standard 36px buttons at 13.5px (`.btn`, `.cs-btn`, embed confirm/cancel); compact in-sidebar 30px buttons at 12.5px (`__add`, `--og-pick`, `__schema-preview__btn`, redirects buttons). Eliminate the 13px and 12px outliers.

### [MODERATE] Chevron viewBox/path mismatch — arrows render visually high  (`Chevron.tsx` · trivial)
- **File/selector:** `apps/cms/src/payload/admin/components/icons/Chevron.tsx`
- **Now:** `viewBox='0 0 16 16'`, `d='M4 6l4 4 4-4'` rendered at size 12 — the arc sits high in the box with ~38% empty space above.
- **Problem:** Off-center in any 12px slot (sidebar expand, segmented chevron, schedule chevron). Lucide/Radix optically center their chevrons.
- **Target:** Adopt the Lucide path: `viewBox='0 0 24 24'`, `d='m6 9 6 6 6-6'` (optically centered at any size). Update both `ChevronDown` and `ChevronRight`.

### [MODERATE] No true segmented control for the Index/No-Index toggle  (`.cs-radio-field__pill` → `.cs-segmented-control` · medium)
- **File/selector:** `apps/cms/src/app/(payload)/styles/_ui-primitives.scss`
- **Now:** The Indexable field renders two separate `.cs-radio-field__pill` chips with an 8px gap, each fully pill-shaped — looks like a multi-select tag field; wraps on a 188px rail.
- **Problem:** Vercel/Linear/Stripe use a gap-less joined two-segment control with a filled selected segment for binary choices.
- **Target:** Add a `.cs-segmented-control` variant: `display: inline-flex; border: 1px solid var(--theme-elevation-250); border-radius: var(--cs-radius-input); overflow: hidden; height: 30px`. Options: `flex: 1; padding: 0 10px; border-right: 1px solid var(--theme-elevation-200); font-size: 12.5px; font-weight: 500; color: var(--theme-text-soft)`; last child no right border; selected `background: var(--cs-cyan-500); color: #04212a; font-weight: 600`. Swap the radio-pill group for it in the Indexable field.

### [MODERATE] List-toolbar kebab/views trigger has no explicit icon  (`.cs-list__menu-trigger` · trivial)
- **File/selector:** `apps/cms/src/app/(payload)/styles/_list-controls.scss:.cs-list__menu-trigger`
- **Now:** `36×36` flex-center with no icon or glyph injection; renders Payload's default text or empty depending on version.
- **Problem:** Empty/text trigger at 36px reads as a broken affordance — the entry to column toggles, saved views, and row actions.
- **Target:** Add `position: relative` and the same `&:empty::after` three-dot mask SVG used by `.drawer__close`; plus hover/focus states (`background: var(--cs-tint-brand-soft); color: var(--cs-cyan-500); border-radius: var(--cs-radius-input)`).

### [MINOR] Disabled opacity inconsistency: 0.6 vs 0.7  (`button[disabled]` · trivial)
- **File/selector:** `apps/cms/src/app/(payload)/styles/_button-audit.scss` (line 47) and `_buttons.scss` (lines 148, 189)
- **Now:** `_button-audit.scss` uses 0.6; `_buttons.scss` uses 0.7 on primary/Save-Draft disabled.
- **Problem:** Disabled buttons on the same doc-controls strip render at different opacities — a visible flicker on state toggle.
- **Target:** Lock to `opacity: 0.5` everywhere (the Vercel/Linear value).

### [MINOR] Icon-only button size splits 28px vs 30px with no rule  (`.btn--icon-only` / `.toolbar-popup__button` · trivial)
- **File/selector:** `apps/cms/src/app/(payload)/styles/_button-audit.scss` (+ `_density.scss`, `_lexical-toolbar.scss`)
- **Now:** Global `.btn--icon-only` 30px; Lexical `.toolbar-popup__button` 28px — both with 14×14 SVG; the difference is undocumented drift.
- **Problem:** 28px and 30px buttons near each other misalign a row.
- **Target:** Keep 30px globally, 28px in the Lexical toolbar only; add a comment `/* intentionally 28px for toolbar density — do not align to global 30px */`. No value change, just documentation.

### [MINOR] Primary button text/bg use literal hex rather than tokens  (`button.btn--style-primary` · trivial)
- **File/selector:** `apps/cms/src/app/(payload)/styles/_buttons.scss` (lines 46, 167); `_tokens.scss`
- **Now:** `color: #04212a` appears twice in `_buttons.scss`; `.cs-btn--primary` uses `#fff` in `_ui-primitives.scss`.
- **Problem:** A brand-cyan hue shift would miss two raw hexes; the two primary contexts disagree silently.
- **Target:** Add `--cs-on-cyan: #04212a` to `_tokens.scss`; replace both `#04212a` occurrences with `var(--cs-on-cyan)`. Add a comment clarifying the intentional `#fff`-on-cyan-600 split.

### [MINOR] Secondary button hover swaps text to cyan — low-contrast, reads as selected  (`.btn--style-secondary:hover` · trivial)
- **File/selector:** `apps/cms/src/app/(payload)/styles/_button-audit.scss`
- **Now:** `_button-audit.scss` hover sets `color: var(--cs-cyan-500)`; `_buttons.scss` keeps text neutral — the cascade winner is source-order-dependent.
- **Problem:** Electric-cyan text on hover reads as "selected" not "hovered"; the dual rules render unpredictably.
- **Target:** Align both to the calmer pattern: `border-color: var(--cs-cyan-500); background: var(--cs-tint-brand-soft); color: var(--theme-text)` — hover signal is the bright border + faint tint only.

---

## Polish checklist (prioritized)

Ordered biggest-visible-premium-gain first. Each item is implementation-ready from its target values above.

- [ ] **Cap form column max-width to 760px** — `.document-fields__main` in `_chrome.scss`. Fixes the single most visible defect (848px inputs) across every edit screen.
- [ ] **Widen the right sidebar to 300px** — define `--sidebar-width: 300px` in `_tokens.scss`; add `column-gap: 20px` + `padding-inline: 16px`. Stops SEO card truncation.
- [ ] **Widen the nav rail to 256px** — `--nav-width` in `_tokens.scss`. Ends badge/name clipping.
- [ ] **Re-tint LinkPopover + TableGridPicker + inline-image dialog to dark-theme tokens + brand cyan** — `LinkPopover.scss`, `TableGridPicker.scss`, `_inline-image.scss`. Kills the white-island and sky-blue-accent regressions.
- [ ] **Fix field rhythm** — label `margin-bottom: 6px` (`_forms.scss`), explicit `--cs-space-field-gap: 20px` field gap, group/array legends to 11px/700 eyebrows. Whole-pixel, hierarchical.
- [ ] **Pulse-card elevation + internal spacing** — tinted tone surfaces, `box-shadow: var(--cs-shadow-lift-sm)`, `gap: 0` with explicit label/value margins, value weight 600 (`_dashboard.scss`).
- [ ] **Nav active states + click targets** — 3px stripe + bloom, unify link `min-height: 34px` (`_nav.scss` / `_density.scss`).
- [ ] **Overlay depth + motion** — backdrop blur 8px (dialog) / 6px (drawer) / 12px (cmdk), drawer spring `--cs-motion-drawer: 280ms` with exit, toast 8px radius + exit + lift shadow, user-menu popover entrance animation.
- [ ] **Fix the kebab icon** — `&:empty::after` three-dot mask on `.doc-controls__popup .popup-button` (`_density.scss`) and `.cs-list__menu-trigger` (`_list-controls.scss`).
- [ ] **Unify the button system** — `.cs-btn` to 36px/600/13.5px, two font-size tiers, disabled opacity 0.5, `--cs-on-cyan` token, calmer secondary hover.
- [ ] **Build a true segmented control** for the Index/No-Index toggle (`.cs-segmented-control` in `_ui-primitives.scss`).
- [ ] **Doc-header + doc-controls calm-down** — title 17px/600, strip `min-height: 52px` with 8px padding.
- [ ] **Re-enable the SavedStateIndicator chip** — remove `display: none` (`_saved-indicator.scss`) + re-mount in `payload.config.ts`.
- [ ] **Login card polish** — `max-width: 400px`, `padding: 40px`, 44px full-width CTA, 40px locked input height, 32px hero separation.
- [ ] **Editor canvas + headings + code block** — empty-state placeholder, tapered h1–h6 margins, code-block left rail + radius, 30px toolbar buttons with bottom-border active state, 28px dividers, 680px fullscreen column.
- [ ] **Media surfaces** — 4-column browse grid + 12px gap, active-tile state before close, 36px MediaCell thumb, `.cs-media-size-warning` class, SVG URL-action icons, 6px progress bar, 38px browse-search.
- [ ] **Sweep remaining fractional-px to whole pixels** — dashboard 12.5/10.5/11.5px, doc-header meta 12.5px, eyebrow 10.5px → 11px, SEO sidebar `0.4rem 0.65rem` → `6px 10px`, list-header 12.5px → 13px.
- [ ] **Chevron icon optical center** — adopt the Lucide `m6 9 6 6 6-6` path in `Chevron.tsx`.
- [ ] **Tighten remaining height mismatches** — date-picker trigger 38px, schedule select 38px, embed input 38px, account form gaps, group/array top margins, 2FA reserved opacity-state, scrollbar/divider/separator refinements.
