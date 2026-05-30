# CleanStart CMS Audit — Cross-cutting (@payloadcms/ui import compliance & hook-API misuse, responsive/tablet/mobile readiness, config wiring & dead code)

Scope: systemic issues spanning the whole admin — forbidden/render-side or non-existent `@payloadcms/ui` usage, mobile/tablet usability, and components built-but-never-wired.

## Summary

| Area | Critical | High | Medium | Low | Info |
|------|:--------:|:----:|:------:|:---:|:----:|
| crosscut-payloadui-imports | 0 | 0 | 4 | 2 | 5 |
| crosscut-responsive | 0 | 0 | 8 | 7 | 2 |
| crosscut-config-wiring | 0 | 1 | 4 | 7 | 1 |
| **Total** | **0** | **1** | **16** | **16** | **8** |

---

## crosscut-payloadui-imports

> The codebase has a well-maintained in-repo enforcement mechanism (`scripts/check-payload-ui-allowlist.ts`) that extends CLAUDE.md's documented allow-list with explicitly justified transitional entries. The allowlist script passes clean across all 540 scanned files, TypeScript typechecks clean, and no hook destructures a member that does not exist on Payload 3.84's runtime API — the previously-reported `setActiveColumns` bug is NOT present; `setActiveColumns` is in `ITableColumns`. The main issues are: (1) CLAUDE.md's allowed-hook list is materially shorter than the script's actual allow-list, creating a documentation gap where legitimate hooks (`useForm`, `useAllFormFields`, `useRowLabel`, `useNav`, `useStepNav`, `useServerFunctions`) are used throughout but only appear approved in the script; (2) several render-side components from `@payloadcms/ui` are in active use with Wave N replacement targets but no clear ownership or deadline tracking; (3) one unsafe `as unknown as` type cast in SchedulePublishDialog bypasses TypeScript for the schedulePublish call. No runtime-breaking or logic bugs were found.

**Counts:** critical 0 · high 0 · medium 4 · low 2 · info 5

### [MEDIUM] CLAUDE.md allowed-hook list does not match the enforced allowlist script  (confidence: high · effort: trivial · status: unverified)

- **File:** `apps/cms/scripts/check-payload-ui-allowlist.ts:20`  **Category:** convention-violation
- **Problem:** CLAUDE.md documents nine allowed hooks from `@payloadcms/ui` (`useField`, `useFormFields`, `useTableColumns`, `useDocumentInfo`, `useDocumentDrawer`, `useAuth`, `useConfig`, `useLocale`, `useTranslation`). The actual enforcement script (`scripts/check-payload-ui-allowlist.ts`) allows a much larger set: `useForm`, `useFormModified`, `useAllFormFields`, `useRowLabel`, `useNav`, `useStepNav`, `useServerFunctions`, and several others. These additional hooks are used in production components (CmsPublishButton, ArrayField, BlocksField, FaqBulkPaste, TocRowLabel, NavOpenOnDesktop, CmsListView, SchedulePublishDialog) with no CLAUDE.md coverage. Any new engineer reading CLAUDE.md would believe these imports are forbidden and might remove them or file incorrect reviews.
- **Evidence:**
```
CLAUDE.md allow-list: useField|useFormFields|useTableColumns|useDocumentInfo|useDocumentDrawer|useAuth|useConfig|useLocale|useTranslation.
Script allow-list additionally includes: useForm, useFormModified, useAllFormFields, useRowLabel, useNav, useStepNav, useServerFunctions, useRowLabel, ListQueryProvider, SelectionProvider, etc.
```
- **Fix:** Update CLAUDE.md's `@payloadcms/ui` allowed list to match the script. The script is authoritative; the doc is stale. Also add a CI step that runs `pnpm --filter @cleanstart/cms verify:payload-ui` so the check is enforced on every PR.

### [MEDIUM] Render-side @payloadcms/ui imports: RenderFields used in five custom field components with no remediation schedule  (confidence: high · effort: small · status: unverified)

- **File:** `apps/cms/src/payload/admin/components/fields/ArrayField.tsx:4`  **Category:** convention-violation
- **Problem:** `RenderFields` (a React.FC render component) is imported from `@payloadcms/ui` in ArrayField.tsx, BlocksField.tsx, CollapsibleField.tsx, GroupField.tsx, TabsField.tsx, and RowField.tsx. The allowlist script documents these as 'Wave 8 follow-up' but there is no ticket, no milestone date, and no incremental decomposition plan. Each file also imports `RowLabelProvider` (ArrayField) — another render-side component. These imports are not data-layer-only per CLAUDE.md's architectural contract.
- **Evidence:**
```
import { RenderFields, RowLabelProvider, useField, useForm } from '@payloadcms/ui'; // ArrayField.tsx:4.
GroupField.tsx comment: 'RenderFields is a transitional render-side import … replacing it cleanly is a Wave 8 follow-up'
```
- **Fix:** Create a tracked issue for Wave 8 with a concrete decomposition: replace `RenderFields` with a thin wrapper that accepts a `schemaPath` + fields config and renders via the `@cleanstart/ui` field registry. Until then the current approach is safe and documented, but the 'Wave 8' comment should reference an actual backlog item.

### [MEDIUM] Render-side @payloadcms/ui imports: Gutter, PageControls, SelectionProvider in CmsListView  (confidence: high · effort: small · status: unverified)

- **File:** `apps/cms/src/payload/admin/components/views/list/CmsListView.tsx:15`  **Category:** convention-violation
- **Problem:** CmsListView imports three render components from `@payloadcms/ui`: `Gutter` (layout wrapper), `PageControls` (pagination bar, marked `@internal` by Payload), and `SelectionProvider` (context provider with render children). `Gutter` is also used in Dashboard.tsx. The allowlist script documents `PageControls` as 'Wave 9 TODO'. `PageControls` is explicitly marked `@internal` in Payload's type definitions, meaning Payload may remove or change it without a semver bump.
- **Evidence:**
```
import { Gutter, PageControls, SelectionProvider, useConfig, useListQuery, useStepNav } from '@payloadcms/ui'; CmsListView.tsx:15.
PageControls d.ts: '* @internal'
```
- **Fix:** Replace `PageControls` with a `@cleanstart/ui` Pagination component before any Payload minor version bump. `SelectionProvider` provides required context for row-selection cells and has no `@internal` marker — it can stay. `Gutter` is purely a layout div that should be trivially replaceable with a local div.

### [MEDIUM] Render-side @payloadcms/ui imports: DocumentFields in CmsEditView and PopupList in DocKebabExtras  (confidence: high · effort: small · status: unverified)

- **File:** `apps/cms/src/payload/admin/components/views/edit/CmsEditView.tsx:13`  **Category:** convention-violation
- **Problem:** CmsEditView imports `DocumentFields` (React.FC, render-side) from `@payloadcms/ui` with a detailed inline comment acknowledging the violation and deferring to 'Wave 9+'. DocKebabExtras imports `PopupList` (namespace with Button component) from `@payloadcms/ui` with a 'Wave 6 TODO' comment. Neither Wave 6 nor Wave 9 has a concrete milestone date. `DocumentFields` owns autosave orchestration, server-action error boundaries, and the form body — it is the hardest component on the list to replace.
- **Evidence:**
```
// CLAUDE.md says `@payloadcms/ui` is data-layer-only — `DocumentFields` is a render-side export. We import it here under a narrow, documented exception. CmsEditView.tsx:3-11.
import { PopupList, useConfig, useDocumentInfo, useForm, useFormModified } from '@payloadcms/ui'; DocKebabExtras.tsx:5
```
- **Fix:** For DocKebabExtras: replace `PopupList.Button` with `@cleanstart/ui` primitives (it only uses `href` and `disabled` props — a simple anchor/button suffices). For DocumentFields: the inline rationale is sound; this needs a first-party form shell to replace and is correctly deferred, but the Wave 9+ comment should reference a backlog item.

### [LOW] Render-side @payloadcms/ui import: Gutter in Dashboard server component  (confidence: high · effort: trivial · status: unverified)

- **File:** `apps/cms/src/payload/admin/components/Dashboard/Dashboard.tsx:1`  **Category:** convention-violation
- **Problem:** Dashboard.tsx is an async server component that imports `Gutter` from `@payloadcms/ui` for its outer layout wrapper. `Gutter` is a render-side React.FC. The component itself is correctly server-rendered, but using `Gutter` couples the dashboard layout to Payload's internal CSS class conventions (`gutter--left`, `gutter--right`) rather than the project's own spacing tokens.
- **Evidence:**
```
import { Gutter } from '@payloadcms/ui'; // line 1.
<Gutter className="cs-dashboard"> wraps all dashboard content.
```
- **Fix:** Replace `Gutter` with a local div — `Gutter` is a simple padding/margin wrapper. This is a one-line fix: `<div className="gutter cs-dashboard">` or introduce a local layout primitive that applies the same padding tokens.

### [LOW] Unsafe `as unknown as` type cast for schedulePublish call in SchedulePublishDialog  (confidence: high · effort: trivial · status: unverified)

- **File:** `apps/cms/src/payload/admin/components/SchedulePublishDialog.tsx:222`  **Category:** type-safety
- **Problem:** The primary `schedulePublish` invocation (for creating a new scheduled event) casts through `as unknown as (a: Record<string, unknown>) => Promise<...>` to bypass TypeScript's type checking on the argument shape. The actual call site passes an object that is structurally compatible with `SchedulePublishHandlerArgs` at runtime, so there is no runtime bug, but the cast suppresses compile-time safety and violates the project's 'no unsafe casts' convention. The secondary call on line 245 (passing only `{ deleteID }`) is correctly typed without a cast.
- **Evidence:**
```ts
const result = (await (
  schedulePublish as unknown as (a: Record<string, unknown>) => Promise<{ error?: string } | undefined>
)(args)) ?? undefined; // SchedulePublishDialog.tsx:222-224
```
- **Fix:** Remove the cast. The actual argument type is compatible once you add a proper type annotation: `const args: Omit<SchedulePublishHandlerArgs, 'clientConfig' | 'req'> = { type, date: new Date(when), timezone: tz }`. TypeScript will accept this without the escape hatch.

### [INFO] setActiveColumns IS present on ITableColumns — previously-reported bug does not exist  (confidence: high · effort: trivial · status: unverified)

- **File:** `apps/cms/src/payload/admin/components/views/list/ColumnPicker.tsx:20`  **Category:** runtime-bug
- **Problem:** The task description mentioned a confirmed bug where `useTableColumns().setActiveColumns` is not a function. This was verified against the actual installed Payload types (3.84.1). `ITableColumns` does include `setActiveColumns: (columns: string[]) => Promise<void>`. The ColumnPicker correctly destructures it and calls it in `toggle()`. No runtime bug is present here.
- **Evidence:**
```
ITableColumns in dist/providers/TableColumns/types.d.ts: setActiveColumns: (columns: string[]) => Promise<void>;
ColumnPicker.tsx:20: const { setActiveColumns } = useTableColumns();
```
- **Fix:** No action needed. The allowlist script, TypeScript check, and Payload type definitions all confirm this usage is correct.

### [INFO] useStepNav destructures setStepNav — member exists and the usage is correct  (confidence: high · effort: trivial · status: unverified)

- **File:** `apps/cms/src/payload/admin/components/views/list/CmsListView.tsx:54`  **Category:** runtime-bug
- **Problem:** CmsListView destructures `{ setStepNav }` from `useStepNav()`. Verified against Payload's StepNav context type: `ContextType` has `setStepNav: (items: StepNavItem[]) => void`. The `useEffect` on line 54 calls `setStepNav([{ label, url }])` with a correctly-shaped `StepNavItem`. No runtime bug.
- **Evidence:**
```
StepNav/types.d.ts: setStepNav: (items: StepNavItem[]) => void.
CmsListView useEffect: setStepNav([{ label: collectionLabel, url: ... }])
```
- **Fix:** No action needed.

### [INFO] useAllFormFields returns [FormState, Dispatch] tuple — PublishOverrideGuard destructuring is correct  (confidence: high · effort: trivial · status: unverified)

- **File:** `apps/cms/src/payload/admin/components/PublishOverrideGuard.tsx:45`  **Category:** runtime-bug
- **Problem:** `useAllFormFields()` returns `FormFieldsContextType = [FormState, Dispatch<FieldAction>]`. PublishOverrideGuard destructures it as `const [fields] = useAllFormFields()` which gives `fields: FormState`. `FormState` is a `Record<string, FieldState>` and `.value` is present on `FieldState`. The field lookups (`fields?.['seo.title']?.value`, etc.) are therefore safe. No bug.
- **Evidence:**
```
FormFieldsContextType = [FormState, Dispatch<FieldAction>] from types.d.ts.
const [fields] = useAllFormFields() → fields: FormState (index 0 of tuple).
```
- **Fix:** No action needed.

### [INFO] BulkActionBar where[id][in]=ids.join(',') correctly handled by Payload's sanitizeQueryValue  (confidence: high · effort: trivial · status: unverified)

- **File:** `apps/cms/src/payload/admin/components/views/list/BulkActionBar.tsx:20`  **Category:** logic-bug
- **Problem:** BulkActionBar builds the bulk-delete URL as `url.searchParams.set('where[id][in]', ids.join(','))`. `qs.parse` with Payload's options converts this to `{ where: { id: { in: '1,2,3' } } }` — a string, not an array. However, `@payloadcms/drizzle`'s `sanitizeQueryValue` explicitly calls `createArrayFromCommaDelineated` on string values for the 'in' operator, converting `'1,2,3'` → `['1','2','3']` before the `inArray()` call. The pattern is correct and intentional.
- **Evidence:**
```js
sanitizeQueryValue.js: if (['all','in','not_in'].includes(operator)) { if (typeof formattedValue === 'string') { formattedValue = createArrayFromCommaDelineated(formattedValue); }}
```
- **Fix:** No action needed. The pattern is safe.

---

## crosscut-responsive

> The CMS admin is a desktop-only tool with minimal mobile/tablet hardening. It has one genuine responsive media query for drawers at 768px and a handful of dashboard grid breakpoints. The core two-column edit layout (main form + SEO sidebar), the sticky doc-controls strip with 60px horizontal gutters, the fixed 240px nav rail, the lexical toolbar, and the table views are all designed and tested only at laptop widths (1280–1440px). On a 768–1024px tablet most of these surfaces will be cramped but functional via Payload's own built-in nav-toggle collapse. Below 600px the admin is effectively unusable — the dual-pane scroll setup locks body overflow to hidden and overflows-scroll horizontally; the doc-controls strip has no breakpoint-specific wrapping for its title+meta+buttons layout; and the lexical toolbar's fixed `padding-right:124px` for the fullscreen pill wastes significant narrow-screen real estate. Touch targets are generally below the 44px WCAG floor in several places (nav links at 30–36px, lexical toolbar icon buttons at 28px, array row remove buttons at 24px, schema addons chip remove buttons at 18px). The Payload-native sidebar hamburger/collapse works on narrow viewports and there is a `min-height: 44px` rule for `.nav__link` scoped to `max-width: 768px`, which is the one intentional mobile concession. For a production CMS used exclusively on desktop by editors, the current state is acceptable for its primary use case. However any admin access from an iPad or similar device will surface multiple layout and touch-target problems.

**Counts:** critical 0 · high 0 · medium 8 · low 7 · info 2

### [MEDIUM] Dual-pane scroll layout locks body overflow on all viewport sizes  (confidence: high · effort: medium · status: confirmed)

- **File:** `apps/cms/src/app/(payload)/styles/_chrome.scss:237`  **Category:** responsive-mobile
- **Problem:** The `:has(.document-fields--has-sidebar)` block sets `html,body { overflow: hidden }` and `height: 100%` unconditionally, with no breakpoint guard. On a tablet or narrow viewport, the document-fields two-column flex layout cannot reflow to a single column, causing the main form column and the SEO rail to try to share the viewport width at fixed proportions, producing horizontal scroll or invisible content.
- **Evidence:**
```scss
html:has(.collection-edit .document-fields--has-sidebar), body:has(.collection-edit .document-fields--has-sidebar) { height: 100%; overflow: hidden; }
```
- **Fix:** Wrap the dual-pane `overflow:hidden` rules in `@media (min-width: 1024px)`. Below 1024px, let the form stack vertically (sidebar below main) and restore normal body scroll. The `:has()` selector chain from `.template-default__wrap` down to `.document-fields--has-sidebar > .document-fields__main` also needs a matching breakpoint guard so `overflow: hidden; min-height: 0` on each ancestor doesn't trap content on narrow viewports.

  _[verifier note: Mechanism in the finding is partially wrong: Payload 3.84.1 DOES collapse `.document-fields` to single column below 1024px (mid-break = max-width:1024px), so there is no "fixed-proportion two-column share" or horizontal-scroll cause. The actual breakage is vertical: the unguarded `html,body { overflow:hidden; height:100% }` (+ the 100vh ancestor chain) combined with CleanStart's unlayered `height:100%` on the now-block-stacked `__main`/`__sidebar` pushes the SEO rail below the fold while body scroll is disabled — content becomes unreachable. The recommended fix (wrap the entire dual-pane block, lines 237-343, in `@media (min-width:1024px)`) is correct; matching Payload's own 1024px mid-break breakpoint is the clean choice. Below 1024px, do nothing — Payload's native rules already stack the sidebar and use normal scroll. Severity lowered high→medium: internal admin only, editor-facing, password-gated, and only at <1024px which is an uncommon CMS-editing viewport.]_

### [MEDIUM] Lexical toolbar icon buttons are 28px — below 44px touch target floor  (confidence: high · effort: small · status: unverified)

- **File:** `apps/cms/src/app/(payload)/styles/_lexical-toolbar.scss:213`  **Category:** responsive-mobile
- **Problem:** All icon-only toolbar buttons in the Lexical editor (`.toolbar-popup__button`) are sized to 28×28px. WCAG 2.5.5 (Level AA) requires interactive targets to be at least 44×44px. On a touch device the small hit areas make formatting interactions unreliable.
- **Evidence:**
```scss
.toolbar-popup__button { width: 28px; height: 28px; min-width: 28px; }
```
- **Fix:** On touch devices (use `@media (pointer: coarse)`) expand these to at least 40px (or 44px). A common pattern is to keep the visible glyph at 28px but add transparent padding to inflate the tappable area to 44px using `padding: 8px` or a `::before` pseudo-element covering the full 44px area.

### [MEDIUM] Nav links are 30px by default; 44px floor only applied below 768px  (confidence: high · effort: trivial · status: unverified)

- **File:** `apps/cms/src/app/(payload)/styles/_nav.scss:118`  **Category:** responsive-mobile
- **Problem:** `.nav__link` has `min-height: 30px`. The 44px touch-target override in `_a11y.scss` is gated to `@media (max-width: 768px)`. On a 1024px-wide tablet (which Payload's nav treats as desktop — sidebar is open), touch targets are 30px, below the 44px minimum.
- **Evidence:**
```scss
_nav.scss: min-height: 30px;
_a11y.scss: @media (max-width: 768px) { .nav__link { min-height: 44px; } }
```
- **Fix:** Change the base `.nav__link` min-height to 36px (already used in `_density.scss` for `.nav .nav-group__content a`). Then use `@media (pointer: coarse)` instead of a width breakpoint to apply the 44px floor: `@media (pointer: coarse) { .nav__link { min-height: 44px; } }`. This covers all touch devices regardless of viewport width.

### [MEDIUM] Array row remove button is 24px — critically below touch target floor  (confidence: high · effort: trivial · status: unverified)

- **File:** `apps/cms/src/app/(payload)/styles/_forms.scss:629`  **Category:** responsive-mobile
- **Problem:** `.cs-array__row-remove` is sized to 24×24px with no padding. At 24px this is barely usable with a mouse and effectively untappable on touch. Array fields are used heavily (FAQs, TOC, Authors, Block lists) so this affects a core editing workflow.
- **Evidence:**
```scss
.cs-array__row-remove { height: 24px; width: 24px; } — no padding, no touch enlargement
```
- **Fix:** Add `padding: 10px; box-sizing: content-box;` (or use a transparent `::after` pseudo-element) to inflate the tap area to 44px while keeping the visible glyph at 24px. Alternatively set `min-width: 44px; min-height: 44px;` with the icon centered inside.

### [MEDIUM] Schema addons chip remove button is 18px — far below touch floor  (confidence: high · effort: small · status: unverified)

- **File:** `apps/cms/src/app/(payload)/styles/_ui-primitives.scss:1663`  **Category:** responsive-mobile
- **Problem:** `.cs-schema-addons__chip-remove` and `.cs-relationship-field__pill-remove` (inline variant, 18px) are 18×18px with no padding expansion. Multiple similar small remove buttons appear throughout the relationship and upload fields. 18px is below the 24px WCAG 2.5.8 minimum and well below the 44px recommended target.
- **Evidence:**
```scss
.cs-schema-addons__chip-remove { width: 18px; height: 18px; }
.cs-relationship-field__pill-remove { width: 18px; height: 18px; }
```
- **Fix:** Apply `padding: 13px; box-sizing: content-box;` (or equivalent transparent hit-area expansion) so the effective tap target is 44px. Keep the visual icon at 18px via `width` on the SVG child.

### [MEDIUM] Lexical fixed-toolbar padding-right: 124px wastes layout space on narrow screens  (confidence: high · effort: trivial · status: unverified)

- **File:** `apps/cms/src/app/(payload)/styles/_lexical-toolbar.scss:194`  **Category:** responsive-mobile
- **Problem:** The fixed Lexical toolbar reserves `padding-right: 124px` to prevent the fullscreen pill from overlapping rightmost buttons. On a 768px viewport, the sidebar nav is collapsed but the editor canvas is still only ~520px wide after gutters. The 124px reservation leaves only 396px for all format buttons, causing the flex-wrap to push buttons to a second row unnecessarily.
- **Evidence:**
```scss
.fixed-toolbar { padding-right: 124px; } // 'Pill width ≈ 110px + 8px right offset + 6px breathing room'
```
- **Fix:** Gate the reservation with `@media (min-width: 1024px)` and let smaller viewports use a smaller value (e.g. `padding-right: 44px` to keep only the icon, which hides the label at ≤600px per the media query in `_editor-fullscreen.scss`).

### [MEDIUM] Table layout is fixed-column with no horizontal-scroll wrapper  (confidence: high · effort: small · status: unverified)

- **File:** `apps/cms/src/app/(payload)/styles/_tables.scss:198`  **Category:** responsive-mobile
- **Problem:** `.table > table { table-layout: fixed; width: 100%; }` with fixed per-column widths (36px select, 200px `_status`, 160px dates, 180px relationships). On a 768–1024px viewport the table can be ~920px total, wider than the viewport. `.cs-list__gutter` tightens padding to 16px but adds no `overflow-x: auto` wrapper around the table. The result is horizontal page-level overflow rather than a scrollable table card.
- **Evidence:**
```scss
.table > table { table-layout: fixed; width: 100%; } with explicit column widths summing >600px.
.cs-list__table { overflow: hidden; } — `overflow:hidden` clips rather than scrolls
```
- **Fix:** Change `.cs-list__table { overflow: hidden }` to `overflow-x: auto` and add `min-width: 600px` on the inner `<table>` element. This gives the table card a horizontal scrollbar on narrow viewports without breaking the fixed-column layout.

### [MEDIUM] LinkPopover is 360px fixed width — overflows narrow viewports  (confidence: high · effort: trivial · status: unverified)

- **File:** `apps/cms/src/payload/admin/components/LinkPopover.scss:17`  **Category:** responsive-mobile
- **Problem:** `.cs-link-popover { width: 360px; }` with no max-width guard or responsive override. On a phone (360px viewport) this popover will be exactly full-width with no margin, and on slightly narrower viewports it will overflow. The popover is `position: absolute` without `max-width: calc(100vw - 16px)` or similar clamp.
- **Evidence:**
```scss
.cs-link-popover { position: absolute; z-index: 50; width: 360px; } — no max-width, no vw clamp
```
- **Fix:** Change to `width: min(360px, calc(100vw - 16px))` so the popover gracefully shrinks on narrow viewports. Also confirm the component's JS positioning logic clamps the popover inside the viewport bounds.

### [LOW] Input font sizes are 13–14px, triggering iOS Safari auto-zoom on focus  (confidence: high · effort: small · status: confirmed)

- **File:** `apps/cms/src/app/(payload)/styles/_forms.scss:178`  **Category:** responsive-mobile
- **Problem:** Most admin text inputs use `font-size: 14px` (`_forms.scss`) or `font-size: 13.5px` (`_list-controls.scss` search input, `_ui-primitives.scss` combobox at 0.875rem = 14px, relationship input at 0.875rem, cs-quick-create inputs at 13.5px). iOS Safari auto-zooms the viewport when an input receives focus with font-size < 16px, disrupting layout. CLAUDE.md documents this rule for apps/web (`--fs-input: 16px fixed — iOS zoom rule`) but it has not been applied to the admin.
- **Evidence:**
```scss
.field-type.text input { font-size: 14px; } .cs-list__search-input { font-size: 13px; } .cs-combobox__input { font-size: 0.875rem; } .cs-text-field__input { font-size: 0.875rem; }
```
- **Fix:** Add `@media (pointer: coarse) { input, textarea, select { font-size: 16px !important; min-height: 44px; } }` as a targeted mobile override. This is acceptable as a progressive enhancement — desktop gets the compact 13–14px sizing while iOS gets zoom-safe 16px. Scope it to the admin chrome, not the Lexical editor content area.

  _[verifier note: Severity overstated as high. This is the operator/editor-only CMS admin (cms.cleanstart.com), password-gated behind Cloudflare WAF, and is a desktop-first content-editing tool — CLAUDE.md scopes the iOS-zoom rule explicitly to apps/web and pointedly does not require it for admin. The impact is cosmetic: iOS Safari zooms the viewport on input focus (pinch-out to recover); inputs stay fully functional, no data loss, no security/functional break. The finding's own wording ("acceptable as a progressive enhancement") frames it as polish, not a defect. Hence low (not high). Fix correction: the recommended `@media (pointer: coarse) { input, textarea, select { font-size: 16px !important; min-height: 44px } }` is fine for the font-size part (and the finding correctly says to scope it away from the Lexical editor content area), but the `min-height: 44px` is a separate tap-target concern that, applied broadly, would disrupt the deliberately dense admin layout — recommend shipping the font-size:16px override alone and treating min-height separately if at all.]_

### [LOW] Drawer close button is 36px — marginally below 44px floor, noted in source but unresolved  (confidence: high · effort: trivial · status: unverified)

- **File:** `apps/cms/src/app/(payload)/styles/_overlays.scss:93`  **Category:** responsive-mobile
- **Problem:** The drawer close buttons are styled to 36×36px. The code comment explicitly acknowledges 'bumps the touch target to 36×36 (close to the 44px WCAG floor — Payload's container forces a 32px outer cap)'. 36px still fails WCAG 2.5.5 at Level AA. The close button is the primary escape affordance for drawers.
- **Evidence:**
```scss
.drawer__close, .drawer-close-button { width: 36px; min-width: 36px; height: 36px; } // comment: 'close to the 44px WCAG floor'
```
- **Fix:** Override Payload's container cap constraint using `margin: -4px` (negative margin to expand outside the container's padding without triggering overflow) or `padding: 4px` with `box-sizing: content-box` to reach 44px effective tap area. Alternatively confirm the container does not hard-clip beyond 36px — if it does not, simply set `width: 44px; height: 44px`.

### [LOW] Modal/confirmation close button is 28px — below touch floor  (confidence: high · effort: trivial · status: unverified)

- **File:** `apps/cms/src/app/(payload)/styles/_overlays.scss:411`  **Category:** responsive-mobile
- **Problem:** `.close-modal-button` is 28×28px. Confirmation modals (delete, leave-without-saving) appear on all viewports. Missing the cancel/close target is an accessibility problem.
- **Evidence:**
```scss
.close-modal-button { width: 28px; height: 28px; }
```
- **Fix:** Expand to 44×44px or add 8px of transparent padding on all sides using `padding: 8px; box-sizing: content-box;`.

### [LOW] TableGridPicker cells are 18px × 18px — untappable on touch  (confidence: medium · effort: small · status: unverified)

- **File:** `apps/cms/src/payload/admin/components/TableGridPicker.scss:39`  **Category:** responsive-mobile
- **Problem:** `.cs-table-picker__cell { width: 18px; height: 18px; }` with 2px gaps. The grid picker is used to select table dimensions when inserting a table into the Lexical editor. 18px cells make precise selection impossible on touch without a stylus.
- **Evidence:**
```scss
.cs-table-picker__cell { width: 18px; height: 18px; border-radius: 2px; cursor: pointer; }
```
- **Fix:** Use `@media (pointer: coarse)` to scale up to `width: 32px; height: 32px;` on touch devices, shrinking the visible outer border while keeping the opaque colored square centered. Alternatively replace the grid picker with a numeric two-input dialog on touch.

### [LOW] CommandPalette is fixed-positioned correctly but has no portrait-phone breakpoint  (confidence: medium · effort: trivial · status: unverified)

- **File:** `apps/cms/src/app/(payload)/styles/_command-palette.scss:11`  **Category:** responsive-mobile
- **Problem:** The command palette uses `width: min(640px, calc(100vw - 32px))` and `top: 12vh`, which is correct fluid sizing. However `max-height: min(560px, 76vh)` at 12vh top means on a 600px tall phone it will try to be 76% of 600px = 456px tall starting from 72px down — leaving only 528px of visible space. This is fine. The footer row with keyboard shortcut hints (`cs-cmdk__foot`) uses non-wrapping flex and `flex-wrap` is not set, so at very narrow widths the kbd hints may overflow. Low severity because the admin is desktop-primary.
- **Evidence:**
```scss
.cs-cmdk { width: min(640px, calc(100vw - 32px)); max-height: min(560px, 76vh); } .cs-cmdk__foot { display: flex; gap: 16px; } — no flex-wrap
```
- **Fix:** Add `flex-wrap: wrap; gap: var(--cs-space-2)` to `.cs-cmdk__foot` so keyboard hint tokens reflow gracefully on narrow viewports.

### [LOW] Shortcut help dialog has no responsive panel sizing below desktop  (confidence: medium · effort: trivial · status: unverified)

- **File:** `apps/cms/src/app/(payload)/styles/_chrome-extras.scss:24`  **Category:** responsive-mobile
- **Problem:** `.cs-shortcut-help__panel { max-width: 520px; max-height: 80vh; }` uses no fluid width constraint below 520px. On a 400px viewport this panel will be full width (width:100%), which triggers the `padding: 24px` in `__backdrop` to clip horizontal breathing room. The keyboard shortcut list itself has no wrapping override for narrow screens.
- **Evidence:**
```scss
.cs-shortcut-help__panel { width: 100%; max-width: 520px; } with position: relative inside a fixed inset:0 container with padding: 24px
```
- **Fix:** Change `max-width` to `min(520px, calc(100vw - 32px))` to match the pattern used by the confirmation modal (`width: min(540px, 92vw)`).

### [LOW] Aside nav is min-height: 100vh — may cause double scrollbar on short viewports  (confidence: medium · effort: small · status: unverified)

- **File:** `apps/cms/src/app/(payload)/styles/_user-menu.scss:69`  **Category:** responsive-mobile
- **Problem:** `aside.nav, .nav { min-height: 100vh; }` forces the sidebar to always be at least full viewport height. Combined with `overflow: hidden` on `html/body` for edit views, this is fine. But on list views (no dual-pane, body scrolls normally) a sidebar taller than content with its own scrollable nav creates a redundant scrollbar column on the right. On short viewports (768px height tablets in landscape), the sidebar UserMenu popover (`bottom: calc(100% + 6px)`) may clip above the viewport.
- **Evidence:**
```scss
aside.nav, .nav { min-height: 100vh; } — unconditional.
.cs-user-menu__popover { position: absolute; bottom: calc(100% + 6px); left: 0; right: 0; } — no viewport-clamp
```
- **Fix:** Replace `min-height: 100vh` with `min-height: 100%` (relative to the flex parent) so the nav fills its available space without forcing a viewport-height floor. For the UserMenu popover, add `max-height: calc(100vh - 80px); overflow-y: auto` so it never clips on short viewports.

### [INFO] No viewport meta tag enforcement in custom admin layout — Payload default may be insufficient  (confidence: low · effort: trivial · status: unverified)

- **File:** `apps/cms/src/app/(payload)/styles/_tokens.scss:1`  **Category:** responsive-mobile
- **Problem:** Responsive layout corrections require `<meta name='viewport' content='width=device-width, initial-scale=1'>`. Payload injects this by default but the CMS has a custom layout file. If any custom layout override omits or overrides the viewport meta, mobile browsers will render at the desktop-emulation width (typically 980px), making the 768px breakpoints in the SCSS effectively unreachable.
- **Evidence:**
```
No viewport meta tag found anywhere in the SCSS scope. Cannot verify the layout HTML from CSS alone. The risk is: if a custom `layout.tsx` in `apps/cms/src/app/(payload)/` exists and does not include the Payload default head, the viewport meta could be missing.
```
- **Fix:** Verify that `apps/cms/src/app/(payload)/layout.tsx` (or whichever file wraps the Payload admin shell) preserves Payload's `<meta name='viewport'>`. Grep for `viewport` in all `(payload)` layout/root files to confirm.

### [INFO] Dashboard grid correctly responsive; other grids lack phone-width breakpoints  (confidence: high · effort: small · status: unverified)

- **File:** `apps/cms/src/app/(payload)/styles/_dashboard.scss:41`  **Category:** responsive-mobile
- **Problem:** The dashboard pulse-cards grid and quick-links grid have proper breakpoints at 1100px (2-column) and 600px (1-column). This is the only section in the entire SCSS codebase with real grid-reflowing media queries. All other multi-column layouts (cs-blocks__picker, cs-schema-addons__grid, cs-point-field__row, cs-row) use CSS auto-fit or fixed columns with no phone-width override.
- **Evidence:**
```scss
@media (max-width: 1100px) { grid-template-columns: repeat(2, 1fr); } @media (max-width: 600px) { grid-template-columns: 1fr; } — present only in _dashboard.scss
```
- **Fix:** The dashboard pattern is correct. For completeness, add similar 1-column fallbacks to `.cs-blocks__picker`, `.cs-schema-addons__grid`, and the SEO panel `.cs-seo-advanced__og-preview` grid at 600px breakpoints. This is low priority given the desktop-primary admin context.

---

## crosscut-config-wiring

> The configuration wiring is largely sound — GraphQL is correctly disabled, all 27 collections and 9 globals are registered, the wire-* pipeline is clean, and the core custom-view path (CmsListView, ColumnPicker, etc.) is correctly stamped. However three concrete runtime problems exist: (1) ColumnPicker calls `useTableColumns().setActiveColumns()` but TableColumnsProvider is absent from the React tree when CmsListView overrides the default list view, making every column toggle throw at runtime. (2) Eight field-type overrides registered in wire-custom-fields.ts (PointField, RadioField, DateField, CollapsibleField, TabsField, RowField, JoinField, CodeField) are absent from importMap.js, so Payload cannot resolve them and silently falls back to its stock renderer — custom field chrome is invisible for those types. (3) A substantial body of edit-view infrastructure (CmsEditView, CmsVersionsView, EditChrome, PublishMenu) is fully built but permanently dead because wireCustomEditView is an explicit no-op pass-through. Beyond that, five additional admin components (BodyAuditField, KeywordTargetField, MediaPicker, RelationshipPicker, SavedStateIndicator) and two UI sub-components (BytesCell, DateCell) exist on disk with no wiring path. The codebase is mature and well-organized; the dead code is documented debt rather than accident.

**Counts:** critical 0 · high 1 · medium 4 · low 7 · info 1

### [HIGH] ColumnPicker calls setActiveColumns on an empty context — throws at runtime whenever the column drawer is opened  (confidence: high · effort: small · status: confirmed)

- **File:** `apps/cms/src/payload/admin/components/views/list/ColumnPicker.tsx:19`  **Category:** runtime-bug
- **Problem:** CmsListView replaces Payload's DefaultListView entirely via wireCustomListView. DefaultListView wraps its children with TableColumnsProvider; the `@payloadcms/next` RSC route does NOT mount TableColumnsProvider before calling the custom Component. The default context is created as `createContext({})` — so `useTableColumns()` returns an empty object at runtime. ColumnPicker destructures `setActiveColumns` from that empty object (undefined) and then calls `void setActiveColumns(next)` inside `toggle()`, producing 'setActiveColumns is not a function' the moment an editor opens the column drawer and clicks any checkbox.
- **Evidence:**
```
const { setActiveColumns } = useTableColumns(); ... void setActiveColumns(next);
— confirmed by reading node_modules/@payloadcms/ui/dist/providers/TableColumns/context.js: 'export const TableColumnContext = createContext({})' and @payloadcms/next/dist/views/List/index.js has 0 occurrences of TableColumnsProvider.
```
- **Fix:** Wrap the ColumnPicker content (or the entire drawer body) in a TableColumnsProvider imported from `@payloadcms/ui`, passing `collectionSlug` and `columnState`. Alternatively, use the `toggleColumn(accessor)` function already present on the real ITableColumns rather than `setActiveColumns` — but the provider still needs to be in the tree. The cleanest fix: inside CmsListView, wrap children with `<TableColumnsProvider collectionSlug={collectionSlug} columnState={columnState}>` and remove the TableColumnsProvider import from `@payloadcms/ui` allowlist notes if it should remain data-layer-only.

  _[verifier note: The bug is real and reachable, but I'd correct the severity from critical to high. It is a runtime TypeError, but the blast radius is limited: it only fires when an editor opens the column drawer (Columns… menu) and clicks a checkbox. It does not crash the list view on load, does not affect data integrity, and does not block any CRUD/publishing flow — the rest of CmsListView (search, sort, pagination, bulk actions, table render) works because those rely on SelectionProvider/ListQueryProvider, which ARE mounted. The column picker is also explicitly marked "Reordering lands in Wave 8" and is non-load-bearing chrome. So: a definite, user-reachable crash of one secondary feature = high, not critical._

  _On the fix: the recommendation is correct that the provider must be in the tree — switching from `setActiveColumns` to `toggleColumn` does NOT avoid the crash (both live on the same empty context). Wrap the list (or at minimum the ColumnPicker) in `<TableColumnsProvider collectionSlug={collectionSlug} columnState={columnState}>`; both props are already available in CmsListView. Caveat the finding correctly raises: `TableColumnsProvider` is a render-side export of @payloadcms/ui, which violates this repo's "@payloadcms/ui is data-layer-only" allow-list rule (ESLint flips to error in Wave 8). So this fix introduces a documented allow-list exception that must be recorded, OR the team builds a thin local provider. Either way, this is a known tension, not a clean drop-in. Also verified that the prior dev's intent (per the file's own docstring) was to lean on Payload's preferences-backed setActiveColumns — that intent is unfulfilled precisely because the provider was never wired.]_

### [MEDIUM] wireCustomEditView is a permanent no-op — CmsEditView, CmsVersionsView, EditChrome, PublishMenu are fully built but never mounted  (confidence: high · effort: large · status: unverified)

- **File:** `apps/cms/src/payload/lib/wire-custom-edit-view.ts:20`  **Category:** dead-code
- **Problem:** wireCustomEditView explicitly returns its argument unchanged ('const wireCustomEditView = (entity) => entity'). The comment explains this was a conscious deferral. As a result, the four files implementing the custom edit-view chrome — CmsEditView.tsx (203 lines), CmsVersionsView.tsx (55 lines), EditChrome.tsx (76 lines), and PublishMenu.tsx (143 lines) — are never reached. None appear in importMap.js. The CmsPublishButton and DocKebabExtras ARE wired via docStatusBarEditConfig directly on individual collections, so those are fine. But the core edit-view layout shell and its publish split-button are dead.
- **Evidence:**
```ts
export const wireCustomEditView = <T extends CollectionConfig | GlobalConfig>(entity: T): T => entity; — confirmed no-op.
grep for CmsEditView/CmsVersionsView in importMap.js returns empty.
grep for CmsEditView in all .ts/.tsx files returns only the wire-custom-edit-view.ts comment and a wire-custom-list-view.ts comment.
```
- **Fix:** Either: (a) proceed with the deferred wave — implement the Form provider wiring and activate wireCustomEditView, which will pull CmsEditView/CmsVersionsView into the live path; or (b) delete these four files to reduce confusion about what is production-active. The comment in wire-custom-edit-view.ts accurately describes the risk of the deferred approach. If keeping as future work, add a TODO to the BACKLOG.md so the debt is tracked explicitly.

### [MEDIUM] BodyAuditField and KeywordTargetField exist but are wired nowhere — not in any field config, not in importMap  (confidence: high · effort: small · status: unverified)

- **File:** `apps/cms/src/payload/admin/components/BodyAuditField.tsx:49`  **Category:** under-implemented
- **Problem:** BodyAuditField (139 lines) and KeywordTargetField (196 lines) are fully implemented sidebar components — BodyAuditField reads the lexical body and surfaces link counts, alt-coverage, readability band, and featured-snippet signal; KeywordTargetField reads seo.keywordTarget and scores body density + title/description coverage. Neither is referenced in any collection's field config or wired as a ui-type field anywhere. Neither appears in importMap.js. The seo.ts file contains a comment mentioning KeywordTargetField as the intended display surface for keywordTargetField data, but no actual Field path is wired. The data field exists (keywordTargetField in seoField), the component exists, but the connection is missing.
- **Evidence:**
```
grep for 'BodyAuditField' across all .ts/.tsx files returns only the component file itself.
grep for 'KeywordTargetField' returns the component file and one comment in seo.ts ('KeywordTargetField sidebar density readout') but no ui-field path wiring.
```
- **Fix:** For KeywordTargetField: add a ui-type field to seoSidebarFields() in seo.ts with path `'@/payload/admin/components/KeywordTargetField.tsx#KeywordTargetField'` and clientProps `{ titleSource, descriptionSource }`. For BodyAuditField: add a ui-type sidebar field to collections with body fields (Blogs, News, Guides, KnowledgeBase, Resources). Then run generate:importmap to register both. If the feature is deferred, add explicit BACKLOG entries so the dead code is tracked.

### [MEDIUM] SchemaAddonsAdder exported but superseded — SchemaAddonsSection is the live component; SchemaAddonsAdder has incorrect setValue logic  (confidence: high · effort: trivial · status: unverified)

- **File:** `apps/cms/src/payload/admin/components/SchemaAddonsAdder.tsx:273`  **Category:** dead-code
- **Problem:** SchemaAddonsAdder.tsx exports two components: SchemaAddonsSection (the active one, reads row count from form state, drives Payload's stock drawer programmatically) and SchemaAddonsAdder (the legacy entry point, manipulates the schemaAddons value directly via setValue). The file comment on SchemaAddonsAdder reads 'Legacy entry point — now suppressed via SCSS along with the rest of the standalone field chrome; kept exported so the existing config import path keeps resolving.' However, neither SchemaAddonsAdder nor SchemaAddonsSection appears in importMap.js, and SchemaAddonsAdder is not imported anywhere. Additionally, SchemaAddonsAdder.addBlock calls setValue with a new array directly — bypassing Payload's sub-state and field path bookkeeping that SchemaAddonsSection correctly delegates to the stock drawer.
- **Evidence:**
```
grep for 'SchemaAddonsAdder|SchemaAddonsSection' excluding the source file returns no references. Neither appears in importMap.js. The comment in the file explicitly calls it 'legacy' and 'suppressed via SCSS'.
```
- **Fix:** Remove SchemaAddonsAdder entirely from the file. If SchemaAddonsSection is still needed as a wired component, add its import path to the appropriate field's admin.components.beforeInput config and run generate:importmap. If the entire schema-addons widget has been retired, delete the file.

### [LOW] Eight field-type overrides missing from importMap.js — custom field chrome silently absent for point, radio, date, collapsible, tabs, row, join, code fields  (confidence: high · effort: trivial · status: uncertain)

- **File:** `apps/cms/src/payload/lib/wire-custom-fields.ts:32`  **Category:** under-implemented
- **Problem:** wire-custom-fields.ts registers client-component paths for 8 field types in FIELD_OVERRIDES: point, radio, date, collapsible, tabs, row, join, code. Payload resolves these paths at runtime by looking them up in the importMap. None of these 8 paths appear in importMap.js (grep returns empty). When Payload cannot find a component path in the importMap it either throws or silently falls back to its stock field renderer — meaning the custom chrome for these types (PointField, RadioField, DateField, CollapsibleField, TabsField, RowField, JoinField, CodeField) is never actually mounted in the admin. The importMap is generated by 'pnpm generate:importmap' (predev/prebuild); it was last generated before these overrides were added.
- **Evidence:**
```
grep for 'PointField|RadioField|DateField|CollapsibleField|TabsField|RowField|JoinField|CodeField' in importMap.js returns empty. All 8 are present in FIELD_OVERRIDES and implemented in apps/cms/src/payload/admin/components/fields/. The importMap does contain TextField, CheckboxField, GroupField, ArrayField, etc. (wave-1 overrides), confirming the newer entries were simply never regenerated.
```
- **Fix:** Run 'pnpm --filter @cleanstart/cms generate:importmap' and commit the updated importMap.js. This is a one-command fix. The generated map will pick up all 8 paths automatically because they are already correctly referenced in the FIELD_OVERRIDES map which is evaluated when payload.config.ts is loaded.

  _[verifier note: Count is 7, not 8 — `date` is intentionally excluded from FIELD_OVERRIDES (wire-custom-fields.ts L28-30) and must be dropped from the finding. The proposed one-command fix (`generate:importmap`) will NOT add the missing entries while these field types are unused, because the importMap generator only emits paths attached to live fields — wireCustomFields stamps the override only when a matching field exists. The real, durable fix is one of: (a) when a field of one of these types is first introduced, ensure generate:importmap is re-run (CI already fails on drift, so this is largely self-correcting), or (b) prune the 7 dead entries from FIELD_OVERRIDES until the corresponding components are actually needed, to avoid the latent foot-gun where a future field renders empty. The genuinely useful sub-finding here is the latent trap: if anyone adds a radio/code/tabs/row/collapsible/point/join field and the importMap is not regenerated, the field input will silently render blank (no stock fallback) — worth a guard/test, but it is not a current production defect.]_

### [LOW] MediaPicker and RelationshipPicker exist but are unreferenced — dead code  (confidence: high · effort: trivial · status: unverified)

- **File:** `apps/cms/src/payload/admin/components/pickers/MediaPicker.tsx:1`  **Category:** dead-code
- **Problem:** MediaPicker.tsx and RelationshipPicker.tsx exist under the pickers/ subdirectory but are not imported by any other file in the codebase. Neither appears in importMap.js. They are picker abstractions that may have been written speculatively or have been superseded by the inline MediaBrowseDialog / Payload's stock document drawer.
- **Evidence:**
```
grep for 'MediaPicker|RelationshipPicker' excluding the files themselves returns empty. Both files exist at apps/cms/src/payload/admin/components/pickers/.
```
- **Fix:** Delete both files if no planned consumer exists in the near-term roadmap. If intended for a future wave, add to BACKLOG.md.

### [LOW] SavedStateIndicator is built and documented but removed from the wired actions list — orphaned module with active event listeners  (confidence: high · effort: trivial · status: unverified)

- **File:** `apps/cms/src/payload/admin/components/SavedStateIndicator.tsx:65`  **Category:** dead-code
- **Problem:** SavedStateIndicator was removed from admin.components.actions in payload.config.ts (the comment says 'SavedStateIndicator removed — the floating Saved X ago pill was redundant'). The component file (205 lines) still exists, and SaveShortcut.tsx still dispatches a 'cs-cms:saving' event that was designed to drive the indicator's saving state. The dispatchSaveError helper exported from this file is advertised in its JSDoc as importable by other components, but nothing actually imports it. The file is complete dead code.
- **Evidence:**
```
payload.config.ts lines 209-213 explicitly document its removal. grep for 'SavedStateIndicator|dispatchSaveError' in all .ts/.tsx files finds only: the component file itself, the payload.config.ts comment, and a SaveShortcut.tsx comment noting the event it dispatches. No component imports dispatchSaveError.
```
- **Fix:** Delete SavedStateIndicator.tsx. Remove the cs-cms:saving event dispatch from SaveShortcut.tsx (or document that it now serves no listener). If dispatchSaveError is wanted as a utility, extract it to a standalone toast-helper module and wire it to ToastBus instead.

### [LOW] BytesCell and DateCell are built but never wired to any collection's list-view cell  (confidence: high · effort: small · status: unverified)

- **File:** `apps/cms/src/payload/admin/components/BytesCell.tsx:24`  **Category:** dead-code
- **Problem:** BytesCell (human-readable filesize cell) and DateCell (relative-time date cell) are fully implemented list-cell components. Neither is referenced in any collection definition, cell override config, or importMap.js entry. BytesCell would be a natural fit for Media.filesize; DateCell would be useful for any date column across all collections. Without wiring, they render nothing and Payload uses its stock cell renderers.
- **Evidence:**
```
grep for 'BytesCell|DateCell' excluding the two source files themselves returns empty across all .ts/.tsx files. Neither is in importMap.js.
```
- **Fix:** Wire BytesCell to the Media collection's filesize column via admin.components.cells. Wire DateCell to updatedAt/createdAt/publishedAt columns on content collections. Then run generate:importmap. Alternatively, delete them if the list-view column work is deferred.

### [LOW] InboundRedirectsField fully implemented but wired nowhere — seo.ts comment references it but the field path was removed  (confidence: high · effort: trivial · status: unverified)

- **File:** `apps/cms/src/payload/admin/components/InboundRedirectsField.tsx:82`  **Category:** under-implemented
- **Problem:** InboundRedirectsField (620 lines) is a complete CRUD sidebar widget for managing inbound redirects per document. The seoSidebarFields() factory in seo.ts previously included it (there is a comment: 'Renamed from outboundRedirect; the inbound-redirect sidebar card was removed'). The OutboundRedirectField now covers the simpler redirect affordance, but InboundRedirectsField — which lets editors create/edit/delete redirect rows inline — was removed without deletion. The component has no wiring path, no importMap entry, and is never imported.
- **Evidence:**
```
grep for 'InboundRedirectsField' excluding the source file returns only a Notice.tsx doc comment ('across InboundRedirectsField, LeadsCsvTruncationBanner, and friends') with no import or wiring. seo.ts lines 665-682 document that this sidebar card was 'removed'.
```
- **Fix:** Delete InboundRedirectsField.tsx since seo.ts explicitly documents its removal. The functionality is intentionally replaced by the Redirects collection list view. Retaining it creates confusion about what is active.

### [LOW] cleanstartBlockHandleFeature (drag-to-reorder blocks) defined but not included in the Lexical editor config  (confidence: high · effort: trivial · status: unverified)

- **File:** `apps/cms/src/payload/lib/lexical/block-handle-feature.ts:11`  **Category:** under-implemented
- **Problem:** block-handle-feature.ts exports cleanstartBlockHandleFeature with its ClientFeature path wired to CleanstartBlockHandleFeatureClient, which mounts BlockHandlePlugin (DraggableBlockPlugin_EXPERIMENTAL). The feature is never passed to the features() array in editor-config.ts. Neither CleanstartBlockHandleFeatureClient nor BlockHandlePlugin appears in importMap.js. The drag-handle affordance was planned for 'Wave 7 part 2' but was never activated.
- **Evidence:**
```
grep for 'cleanstartBlockHandleFeature|block-handle-feature' in all .ts/.tsx files returns only the feature file itself. editor-config.ts features() array does not include it (confirmed by reading the full file). 'CleanstartBlockHandleFeatureClient' does not appear in importMap.js.
```
- **Fix:** Either add cleanstartBlockHandleFeature() to the features array in editor-config.ts to activate it, or delete block-handle-feature.ts, BlockHandlePlugin.tsx, and CleanstartBlockHandleFeatureClient.ts if Wave 7 part 2 is shelved.

### [LOW] wirePreviewControls wires preview controls onto taxonomy and form collections that have no public preview URL  (confidence: medium · effort: trivial · status: unverified)

- **File:** `apps/cms/src/payload/lib/preview/paths.ts:13`  **Category:** ux-question
- **Problem:** PREVIEWABLE_COLLECTIONS includes 'authors', 'newsCategories', 'knowledgeCategories', 'categories', and 'forms'. wirePreviewControls stamps a PreviewMenu and a livePreview URL resolver onto every collection in this list. For taxonomy/form collections, the redirect endpoint (/api/preview/redirect?collection=categories&docId=X) is registered, but the web app likely has no preview route for these. The PreviewMenu will appear in the edit view of a Category or Form, and clicking Preview will fire the redirect endpoint and result in a 404 on the web side. Editors may assume their category has a preview-able public page.
- **Evidence:**
```
PREVIEWABLE_COLLECTIONS as const list at paths.ts:13-29 includes 'authors', 'newsCategories', 'knowledgeCategories', 'categories', 'forms'. wirePreviewControls at wire-preview.ts:34 gates on isPreviewableCollection() which includes all of these. No exclusion path exists for non-content-page collections.
```
- **Fix:** Narrow PREVIEWABLE_COLLECTIONS to only collections that have a corresponding public web route (blogs, news, pages, jobs, events, webinars, guides, knowledgeBase, podcastEpisodes, resources). Remove authors, newsCategories, knowledgeCategories, categories, and forms from the list to prevent misleading Preview controls on taxonomy and utility collections.

### [INFO] purgePreviewAuditTask (7th cron job) exists in config but is absent from the CLAUDE.md job table  (confidence: high · effort: trivial · status: unverified)

- **File:** `apps/cms/src/payload.config.ts:342`  **Category:** convention-violation
- **Problem:** payload.config.ts registers 10 tasks and 11 autoRun cron entries. CLAUDE.md documents 6 cron jobs. The discrepancy is: purgePreviewAuditTask (queue: previewAuditPurge, cron: 30 3 * * *), dashboardRefreshFrequentTask, dashboardRefreshDailyTask, analyticsCachePruneTask, and the 'default' queue runner are all missing from the CLAUDE.md table. CLAUDE.md states 'Never change a job schedule without updating this table.' The table is stale.
- **Evidence:**
```
payload.config.ts lines 342-395 list 11 autoRun entries; CLAUDE.md 'Background jobs' section lists exactly 6. The previewAuditPurge, dashboardRefreshFrequent, dashboardRefreshDaily, analyticsCachePrune, and default-queue runner are all absent from the doc.
```
- **Fix:** Update the Background jobs table in CLAUDE.md to add the 5 missing entries: previewAuditPurge (daily 03:30 UTC), dashboardRefreshFrequent (every 15 min), dashboardRefreshDaily (daily 06:00 UTC), analyticsCachePrune (daily 07:00 UTC), and the default queue runner (every minute, for schedulePublish).
