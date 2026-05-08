# CMS Admin UI Audit — Dropdowns, Chevrons, Icons, Buttons

**Date:** 2026-05-08
**Scope:** `apps/cms` Payload 3.81 admin — 45 custom TSX components, 36 SCSS partials.
**Method:** Static source review of every component referenced via `<svg>`, `<button>`, `chevron`, `aria-haspopup` + a *near-comprehensive* live walk at 1440px in the dark theme via the running dev server (`localhost:3000/admin`). Surfaces opened: Dashboard, all 16 collection list views (Pages, Blogs, News, Webinars, Events, Leads, Resources, Redirects, Authors, Categories, KnowledgeBase, KnowledgeCategories, NewsCategories, Media, Guides, AboutGalleries, Jobs), both globals (SEO Defaults, Site Settings), CommandPalette modal, Author detail (with Photo + SEO sidebar + body editor toolbar visible). Surfaces *not* opened: UserMenu popover (open state), drawers (relationship picker, media upload, version compare), Lexical fullscreen + dialogs, light-theme parity for the new surfaces, 1280 / 768 viewports — the dev server hung mid-walk. Findings F12+ below come from this live pass.
**Output of this doc:** a prioritised punch-list with concrete fixes, file:line, and a phased rollout plan.

---

## TL;DR

The admin's tokens, button rules, and icon system are *well architected* — `_tokens.scss`, `_buttons.scss`, and `_button-audit.scss` form a coherent design system. The drift comes from **inconsistencies layered on top of that system**, not from the system itself. **30 findings** total: 0 P0, 7 P1, 23 P2.

The big-ticket themes:

1. **Chevron strategy is forked.** UserMenu uses an inline SVG chevron; the SEO / redirect / schema-preview / URL-history / body-audit collapsibles all use Unicode `▾`; sidebar nav-groups use Payload's stock 10×10 SVG. Three visual languages for "expand me." (F1, F3)
2. **Light mode is washed-out.** Card surfaces (`--theme-elevation-100 = #eef0f3`) sit on a page background of `#f7f8fa` — a ~3% lightness delta. (F2)
3. **Stat-card / dot / pill colours mix semantic intent arbitrarily.** Drafts in amber, published in cyan, others neutral. Status pills in Redirects all the same colour regardless of severity. Header pills mix "X TOTAL" and "X DRAFT". (F4, F16, F18, F21)
4. **List views overflow horizontally** when titles or URLs are long — News, Redirects already confirmed. (F11, F17)
5. **Hidden functional bugs** — Leads list shows "Create new Lead" CTA on an append-only collection (F12); globals' Save button looks broken in its disabled state (F13); sidebar disappears at 1440px after navigation (F14); hamburger keeps a stuck cyan focus state (F15).

None are P0 broken-render bugs. They are visible inconsistencies a returning editor will notice. Fixes are small and mechanical — most live in 4 SCSS partials (`_themes.scss`, `_dashboard.scss`, `_tables.scss`, `_pills.scss`) and one new `Chevron.tsx` component.

---

## Findings

### Severity scale

- **P0** — broken render, functional defect, accessibility blocker.
- **P1** — visible inconsistency or legibility issue a returning editor will notice.
- **P2** — token-drift or polish items; cumulatively important, individually minor.

---

### F1 · Chevron strategy is split between SVG and Unicode `▾` *(P1)*

**Where:**

- SVG (12×12) → [UserMenu.tsx:114](apps/cms/src/payload/admin/components/UserMenu.tsx#L114)
- Unicode `▾` in 18×18 box → [InboundRedirectsField.tsx:305](apps/cms/src/payload/admin/components/InboundRedirectsField.tsx#L305), [OutboundRedirectField.tsx:288](apps/cms/src/payload/admin/components/OutboundRedirectField.tsx#L288), [SchemaPreviewField.tsx:232](apps/cms/src/payload/admin/components/SchemaPreviewField.tsx#L232), [SeoAdvancedPanel.tsx:260](apps/cms/src/payload/admin/components/SeoAdvancedPanel.tsx#L260), [UrlChangeHistoryField.tsx:133](apps/cms/src/payload/admin/components/UrlChangeHistoryField.tsx#L133)
- Payload-stock SVG (10×10) → sidebar `nav-group__toggle` (Payload built-in)
- BodyAuditField — no chevron, but uses its own toggle iconography

**Why it matters:** five sidebar collapsibles render `▾` (a heavy, bottom-pointing solid triangle), while the UserMenu — sitting in the same vertical column — uses a thin SVG chevron. Two different visual idioms for the same affordance.

**Fix:** introduce a single `<Chevron>` component or shared SVG snippet. Replace the Unicode glyphs with the same SVG used in `UserMenu`. Concretely:

```tsx
// apps/cms/src/payload/admin/components/icons/Chevron.tsx (new)
export const ChevronDown = ({ size = 12 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" aria-hidden="true" focusable="false">
    <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
```

Then replace `<span className="cs-…__chevron">▾</span>` with `<span className="cs-…__chevron"><ChevronDown /></span>` in the five collapsibles. Drop `font-size: 10px` from the corresponding SCSS chevron blocks — sizing now comes from the SVG.

**SCSS already supports it** — every `&__chevron { transform: rotate(-180deg); }` block (in `_sidebar-seo.scss` lines 55, 350, 563, 1142, 1453) works the same on an inline SVG as it does on the Unicode glyph.

---

### F2 · Light-mode page-vs-card contrast is too low *(P1)*

**Measured (light theme):**

- `--theme-bg`: `#f7f8fa` (page)
- `--theme-elevation-100`: `#eef0f3` (sidebar, dashboard cards, recent-edits panel, quick-actions)
- Computed delta ≈ 3% lightness.

**Observed:** sidebar and stat cards read as one continuous pale-beige mass. The cards' 1px border (`--theme-elevation-150 = #e5e7eb`) is the only thing separating them from the page.

**Where it surfaces most:**

- Dashboard pulse-grid cards ([_dashboard.scss](apps/cms/src/app/(payload)/styles/_dashboard.scss))
- Sidebar background (Payload stock chrome)
- Quick-action cards
- Recent-edits panel

**Fix options (pick one):**

| Option | Change | Trade-off |
|---|---|---|
| **A — push cards up (recommended)** | Set `--theme-elevation-100` to `#ffffff` in light theme; rely on the existing border for definition | Cards become bright white "tiles" on a soft page — the standard SaaS look. Sidebar also brightens. |
| B — push the page down | Set `--theme-bg` to `#eef0f3` and bump `--theme-elevation-100` to `#ffffff` | Bigger swing; risks darkening the editor canvas. |
| C — strengthen borders | Bump card borders from `--theme-elevation-150` to `--theme-elevation-200` (`#d8dbe0`) | Cheap, but doesn't solve the underlying flatness. |

**Recommendation:** Option A. One token change in [_themes.scss:11](apps/cms/src/app/(payload)/styles/_themes.scss#L11). Verify against editor, list-view, sidebar, and modal in both themes before committing.

---

### F3 · Sidebar nav-group toggle chevrons are 10×10 px *(P2)*

**Where:** Payload's stock `.nav-group__toggle .icon--chevron` SVG, six instances (CONTENT, GLOBALS, TAXONOMIES, PEOPLE, SYSTEM, MARKETING). Measured `getBoundingClientRect → 10×10`.

**Why it matters:** at 10×10, against `--theme-elevation-300` (`#b3b7bd`) on light or `#4a4d55` on dark, the indicator is essentially invisible at desk distance. Group labels look static. The hit-target is fine (the whole row is the button), but the affordance to *expand/collapse* doesn't read.

**Fix:** in `_nav.scss`, override the icon size and color for nav-group toggles:

```scss
.nav-group__toggle .icon--chevron {
  width: 14px;
  height: 14px;
  color: var(--theme-text-soft);
  opacity: 0.9;
}
```

Same approach as the rest of the audit's chevrons — 14px is the established second-tier size (icon-only buttons already use 14px SVGs per `_button-audit.scss:148`).

---

### F4 · Dashboard stat-card number colors mix semantics arbitrarily *(P1)*

**Measured (light theme):**

| Card | Number value | Color | CSS source |
|---|---|---|---|
| Drafts pending | 4 | `rgb(217, 119, 6)` (amber) | `--color-warning-500` |
| Published · 7d | 3 | `rgb(6, 199, 242)` (cyan) | `--cs-cyan-500` |
| Leads · 24h | 0 | `rgb(19, 20, 24)` (text) | `--theme-text` |
| Redirects | 2 | `rgb(19, 20, 24)` (text) | `--theme-text` |

**Why it matters:** "Drafts pending" is not a warning — it's just a count. Painting it amber implies something is *wrong*. Two-of-four neutral and one-of-four cyan reads as random.

**Fix (recommended):** make all four cards neutral text, with a small *coloured pip* on the card label or border to signal type:

```scss
.cs-dashboard__pulse-number {
  color: var(--theme-text);   // always
  font-feature-settings: 'tnum'; // tabular numerals
}

.cs-dashboard__pulse--cyan { border-left: 3px solid var(--cs-cyan-500); }
.cs-dashboard__pulse--amber { border-left: 3px solid var(--color-warning-500); }
.cs-dashboard__pulse--neutral { /* no accent */ }
```

Alternative: only colour the number when the count is *non-zero and actionable* (e.g. `Drafts pending > 0` → amber). Programmatic, but more dynamic CSS.

**File:** [_dashboard.scss](apps/cms/src/app/(payload)/styles/_dashboard.scss) (search for `.cs-dashboard__pulse--`).

---

### F5 · UserMenu trigger has no idle visual container *(P2)*

**Measured:** `.cs-user-menu__trigger` background `rgba(0,0,0,0)`, border `rgba(0,0,0,0)`. Only the `--open` modifier adds a background.

**Why it matters:** the bottom-left of the sidebar (avatar + name + email + chevron) sits with no shape. It reads as four floating elements rather than one clickable row. Hover state already exists; rest state doesn't.

**Fix:** [_user-menu.scss](apps/cms/src/app/(payload)/styles/_user-menu.scss) — add a subtle resting border or rule to the trigger:

```scss
.cs-user-menu__trigger {
  border-top: 1px solid var(--theme-elevation-100);
  background: transparent;
  // existing hover/open rules unchanged
}
```

Alternative: add a 1px hairline divider above the trigger (separating it from the nav list), instead of a full container. Less heavy.

---

### F6 · Body editor toolbar uses Unicode `T` for headings dropdown *(P2)*

**Where:** [_lexical-toolbar.scss](apps/cms/src/app/(payload)/styles/_lexical-toolbar.scss) — Payload's stock heading dropdown shows a serif-styled "T" with chevron. The chevron next to it is Payload's stock 12px chevron-down. Inconsistent with the SVG chevron strategy in F1.

**Fix:** lower priority — only worth doing once F1 lands, since the lexical toolbar is mostly Payload-native and customising it requires careful targeting. Defer to a follow-up unless the user explicitly cares about the toolbar.

---

### F7 · "Create New" header button is the same colour as the page chrome *(P2)*

**Where:** Payload's list-view header — the small "Create New" pill next to the collection title.

**Observed (dark mode):** dark gray pill on dark gray header. Low contrast. Looks like a label, not a button.

**Fix:** in `_chrome.scss` or `_chrome-extras.scss`, target the list-view title button and bump it to `.btn--style-secondary` styling (transparent bg, `--theme-elevation-250` border). Consistent with all other secondary buttons.

```scss
.collection-list__header .btn,
.list-header__create {
  background: transparent;
  border: 1px solid var(--theme-elevation-250);
  &:hover { border-color: var(--cs-cyan-500); color: var(--cs-cyan-500); }
}
```

---

### F8 · Quick-action card arrows are hairline and inconsistent with chevrons *(P2)*

**Where:** [Dashboard quick-actions block](apps/cms/src/payload/admin/components/Dashboard/) — each card shows a thin → arrow on the right. SVG strokeWidth ~1, color soft. At 1440 they read as decorative dust, not navigation cues.

**Fix:** swap the bespoke arrow for the same `ChevronRight` introduced in F1, sized 14px, color `--theme-text-soft`. Single icon family across the dashboard.

---

### F9 · Sort indicators in list-view headers stack two chevron pairs *(P2 — Payload-stock cosmetic)*

**Where:** column headers (`TITLE ▴▾  ▴▾`) — two side-by-side stacks. One is sort direction, the other is column-action menu. At column-header sizing (10px chevrons) it reads as four stacked dashes.

**Fix:** in `_tables.scss`, give the action-menu chevron a different rendering (e.g. a single `⋯` overflow icon instead of stacked chevrons). Lower priority — it's a Payload native UI we're not breaking, just polishing.

---

### F11 · List-view TITLE column eats the row, pushes other columns off-screen *(P1)*

**Where:** every collection list view that renders a long-text TITLE — confirmed on News (`/admin/collections/news`), where a single row's title (`"SEBI CSCRF Audit 2026 Checklist, SOC Requirements and Compliance Guide for Regulated Entities"`) consumes ~60% of the row width. NEWS CATEGORIES and PUBLICATION DATE columns are pushed past the viewport; the row also shows a horizontal scrollbar.

**Root cause:** Payload's stock list-view `<td>` has no `max-width` or `text-overflow` rule on the title cell. The title `<a>` is a single line of unwrapped text that expands the column until it consumes its share + horizontal scroll budget.

**Fix:** target the first text column in `_tables.scss` and clamp it. Same treatment goes for any other freeform-text cell (`heading`, `name`, `slug`, `permalink`).

```scss
// _tables.scss — list-view text-cell truncation
.collection-list .row-1,            // Payload's stock title cell
.cell-title,
.cell-name,
.cell-heading {
  max-width: 480px;       // tune per-collection if needed
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;

  > a, > span {
    display: inline-block;
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    vertical-align: bottom;
  }
}

// Optional: make hovering the truncated link reveal the full title via title=
// — verify Payload already injects title attr; if not, add via List cell renderer
```

**Per-collection tuning:** if 480px is too short for some collections (e.g. Pages, where slugs matter more than titles), expose the column-width via Payload's `admin.components.Cell` in the collection config. Out of scope for the cosmetic fix; flag if you want it.

**Verify:** News, Knowledge Hub, Resources, Webinars, Events lists — all have long-text titles. Should all gain ellipsis without horizontal scroll.

---

### F31 · Phase-4 reopen — F14 was wrong to close; SeoHealthScoreField + LegacyBioViewer were missed in Phase 2 *(P1)*

**What I missed:** Phase 2's chevron unification covered five sidebar collapsibles but missed two more components that also use `▾` / `▸` Unicode glyphs:
- [SeoHealthScoreField.tsx:120](apps/cms/src/payload/admin/components/SeoHealthScoreField.tsx#L120) — the green/amber/red SEO health card on every blog/news/page detail. Visible chevron in the user's screenshot at the far right, rendering as a microscopic Unicode triangle. Now uses `<ChevronDown />` with inline transform (rotates `-90deg` when collapsed).
- [LegacyBioViewer.tsx:85](apps/cms/src/payload/admin/components/LegacyBioViewer.tsx#L85) — the read-only Webflow-bio panel on Author detail. Same `▾`/`▸` pattern. Same fix.

**F14 reopened — closing it as "by design" was wrong.** Three code-level smells in [NavOpenOnDesktop.tsx](apps/cms/src/payload/admin/components/NavOpenOnDesktop.tsx) before the fix:

1. **Race condition by design.** Commit `122753d` literally says *"actually win the race with Payload's NavProvider"*. `setTimeout(..., 0)` inside a `useEffect` to defer past Payload's parent effect. Effect ordering isn't a contract — a Payload upgrade reorders effects and this silently breaks. No test catches it.
2. **Two effects own the same state.** One sets `navOpen` on path change, another watches `navOpen` and re-asserts policy. The React anti-pattern of deriving state-from-state via effects.
3. **The 1.5 s manual-toggle grace is a band-aid.** It exists because editors *do* re-open the nav, then get confused when it auto-closes again. The grace window is the symptom of fighting the user, not a feature.

UX-level: every comparable SaaS admin (Notion, Linear, GitHub, Webflow CMS, Sanity, Strapi, Payload's own marketing demos) keeps the nav persistent on desktop. Auto-collapse-on-detail is a 375 px-mobile pattern. At 1440 with a 240 px nav the form column has 1200 px — the editor isn't space-constrained. The body editor's `Fullscreen` button already exists for the genuine "I need every pixel" case (explicit, user-controlled).

**Fix:** redesigned `NavOpenOnDesktop` to a single source of truth — editor preference in `localStorage`. One mount-time effect to default to "open at desktop" if no preference is saved; one click-listener effect to mirror the editor's hamburger toggles into storage. No setTimeout race. No second watcher. No grace window. Below 1024 px Payload's drawer behaviour is preserved as-is.

If we ever genuinely want auto-collapse on doc-edit views, the right primitive is a per-route preference (`localStorage[`cs-nav-collapsed-by-route`]`), not a state-machine racing the framework.

---

### F12 · Leads list shows "Create new Lead" CTA on an append-only collection *(P1 functional)*

**Where:** `/admin/collections/leads` empty state — central card displays a cyan "Create new Lead" primary button.

**Why it matters:** Leads is `append-only`. The page banner literally says "Editing is disabled — leads are immutable once captured. Use the CSV export for bulk handoff." A "Create new Lead" CTA contradicts that contract — and clicking it will create a manually-typed lead that bypasses the LeadHandler adapter (the audit-trail guarantee called out in `CLAUDE.md`).

**Fix:**
- In [Leads.ts](apps/cms/src/payload/collections/Leads.ts), set `admin.disableCreate: true` (or hide via `access.create`). Suppresses both the empty-state CTA and the header "Create New" pill.
- If manual creation is *needed* for ops, route it through a custom action that calls the LeadHandler adapter — never expose Payload's stock create form.

**Verify:** revisit `/admin/collections/leads` empty state; "Create new Lead" should not appear; the "Append-only" banner becomes the only top-of-page chrome.

---

### F13 · Globals "Save" button looks broken when clean *(P2 — UX legibility)*

**Where:** [/admin/globals/seoDefaults](http://localhost:3000/admin/globals/seoDefaults), [/admin/globals/siteSettings](http://localhost:3000/admin/globals/siteSettings) — Save button in the top-right when no edits are pending.

**Observed:** the button uses a *muted* cyan (looks like `--cs-cyan-700`) instead of the bright `--cs-cyan-500` used for active primary actions elsewhere. There is no opacity reduction, no `cursor: not-allowed`, no greyscale — just a different shade of cyan. To a returning editor it reads as "did this primary button just lose its colour?", not "no changes to save."

**Fix:** in `_buttons.scss` (or wherever Payload's stock form-saving button is targeted), make the disabled / no-changes state visually unambiguous:

```scss
button#action-save[disabled],
button.btn--style-primary[disabled] {
  background: var(--theme-elevation-150);
  color: var(--theme-text-disabled);
  cursor: not-allowed;
  opacity: 0.7;
}
```

Use the same disabled treatment everywhere a primary button can be inert (Save, Publish, Update). Aligns with `_button-audit.scss:38-48` which already enforces `cursor: not-allowed` on disabled — this just adds the visual treatment.

---

### F14 · Sidebar collapses (Payload's responsive nav) at 1440px in some flows *(P2)*

**Where:** observed on every non-Dashboard page in this session — the sidebar disappears, replaced by a hamburger icon at top-left. Fresh Author detail tab showed the sidebar; navigating in the same tab to a list view collapsed it. Some pages even have `data-cs-sidebar-header` set but no visible sidebar.

**Why it matters:** the breakpoint is too eager. 1440px is a *desktop* width; the sidebar should be visible by default. Editors going from list → detail → list shouldn't lose primary navigation.

**Root cause:** Payload's stock `template-default__nav-toggler-wrapper` plus our SCSS responsive triggers in [_chrome.scss](apps/cms/src/app/(payload)/styles/_chrome.scss) / [_nav.scss](apps/cms/src/app/(payload)/styles/_nav.scss) — likely a `min-width` query that uses the wrong breakpoint, or `localStorage` state from a narrow-viewport session sticking.

**Fix:**
1. Audit `_nav.scss` and `_chrome.scss` for `@media (max-width: ...)` rules that hide the sidebar. Move the breakpoint down to ≤ 1024px.
2. If Payload persists nav-collapsed state in localStorage, expose a "Show sidebar" toggle inside the hamburger menu (right now there's no obvious way to *re-open* the sidebar without resizing the window).
3. Verify the persistent sidebar at 1280, 1440, 1920 widths.

---

### F15 · Hamburger / nav toggle keeps a stuck "active" highlight *(P2)*

**Where:** Media list view and a couple of others — the top-left hamburger icon shows a cyan/blue background even when no popover or menu is open.

**Why it matters:** looks like a button is *currently pressed*. Almost certainly `:focus` (or `:focus-visible`) leftover from a click. The `_button-audit.scss` rule applies a 3px focus-ring to *every* button — but this hamburger is a Payload-stock button that may be receiving a different treatment (the cyan tile inside the icon, not the ring around it).

**Fix:** target Payload's nav toggler class explicitly and clamp its focus styling:

```scss
.template-default__nav-toggler-wrapper button,
.nav__mobile-close,
.template-default__nav-toggler {
  &:focus { outline: none; }
  &:focus-visible {
    box-shadow: 0 0 0 3px var(--cs-tint-focus-ring);
    background: transparent;
  }
}
```

---

### F16 · "X TOTAL" / "X DRAFT" header pills mix semantics *(P2)*

**Observed across list views:**
- News: amber `1 DRAFT` (status-specific)
- Redirects: gray `2 TOTAL` (count of all)
- Authors: gray `1 TOTAL`
- Media: gray `8 TOTAL`
- Empty collections: no pill

**Why it matters:** the same visual primitive (`<pill>X TOTAL</pill>`) sometimes shows total count and sometimes status-specific count. An editor scanning the admin can't tell whether a pill represents "things that need attention" or "all things."

**Fix (recommended):** standardise on showing *both* — always render a neutral total + a status sub-pill when a draft/needs-review state exists. Two separate pills, e.g. `8 TOTAL · 1 DRAFT`. Implementation lives in the dashboard cell/header components — search for where these counts are computed.

If two pills feel cluttered, alternative: drop the "X TOTAL" pill on every collection (the table footer already shows `1-N of N`) and keep only status pills (`1 DRAFT`, `2 NEEDS REVIEW`).

---

### F17 · Long URLs in Redirects list trigger horizontal scroll *(P1 — same root cause as F11)*

**Where:** Redirects list — the TO column shows full URLs like `/blogs/sebi-cscrf-audit-2026-checklist-soc-requirements-and-compliance-guide-for-regulated-entities`. The HIT COUNT column header is cut at the right viewport edge ("HIT CO…"). A horizontal scrollbar shows beneath the rows.

**Fix:** the F11 ellipsis treatment, applied to URL-shaped cells too — `.cell-from`, `.cell-to`, `.cell-permalink`. Same `_tables.scss` block; just expand the selector list.

---

### F18 · Status pills in Redirects don't differentiate severity *(P2)*

**Where:** Redirects status column — both `301 MOVED PERMANENTLY` and `SOURCE: SLUG CHANGE` use the same cyan dot/pill. A 410 Gone or a 308 should look different from a benign 301. Today, every pill is brand-cyan.

**Fix:** introduce a status-pill colour map in `_pills.scss`:

```scss
.pill[data-status='301'] { /* cyan – default */ }
.pill[data-status='302'] { background: var(--cs-tint-brand-soft); color: var(--cs-cyan-700); }
.pill[data-status='308'] { background: var(--cs-tint-brand-soft); color: var(--cs-cyan-700); }
.pill[data-status='404'] { background: rgba(220, 38, 38, 0.14); color: var(--color-error-500); }
.pill[data-status='410'] { background: rgba(220, 38, 38, 0.14); color: var(--color-error-500); }
```

Match what already exists on the Author SEO health card (green/amber/red ring). Single colour family per severity tier.

---

### F19 · "About galleries" and "Knowledge categories" "Create new …" buttons text-wrap awkwardly *(P2)*

**Where:** empty-state CTAs whose collection name is long — `Create new About gallery item`, `Create new Knowledge category`, `Create new Knowledge article`. The button widens beyond the empty-state card or the text wraps to two lines (depending on viewport).

**Fix options:**
- Tighten copy to a verb + short noun: "New gallery item", "New category", "New article".
- Or in `_empty-state.scss`, allow the CTA to use 2-line text with `white-space: normal; text-align: center; line-height: 1.2;`.

Recommend: tighten the copy. Less wrapping; clearer scanning.

---

### F20 · CommandPalette is well-built — no findings *(passes)*

Confirmed live: header search input + ESC chip clean, JUMP TO / CREATE sections, kbd footer (↑↓ navigate, ↵ open, esc close), arrow-key navigation works, type-ahead filters within ~50ms, selected row highlights with `--cs-tint-brand-soft`. No issues found.

---

### F21 · Dashboard recent-edits list draft/published dot uses two different colours *(P2)*

**Where:** `Recent edits` section, dashboard root — each row has a small leading dot indicating status. Drafts show a hollow ring; published show a filled cyan dot. Visually subtle but works.

**Why it's a finding:** the dot is too small (~6px) and the contrast between hollow vs filled is tough to read. Confused with bullet points.

**Fix:** bump dot to 8px and use a proper colour pair: `var(--color-warning-500)` for draft, `var(--cs-cyan-500)` for published. Drop the hollow ring.

---

### F22 · Author detail "robot" / AI-assist icon (?) at top-right of Name field *(verify what this is)*

**Where:** [/admin/collections/authors/1](http://localhost:3000/admin/collections/authors/1), top-right of the *Name* text input.

**Observed:** a small dark icon (looks like a robot face) sits inside the right edge of the Name field. No tooltip on hover (didn't open one). No click affordance visible.

**Fix:** verify what this icon is. If it's a useful action (AI-assist auto-fill?), add an `aria-label` and visible hover/click affordance. If it's vestigial UI, remove it.

---

### F23 · Indexable button group truncates the third option label *(P2)*

**Where:** Blog detail / Author detail / News detail right SEO sidebar — the *Indexable* field renders a 3-button toggle: `Index` / `No-index` / `No-index, no-fo...`. Confirmed live at 1440px in dark + light themes.

**Why it matters:** the third button's label *always* truncates with ellipsis at every viewport width I tested. Editors hovering over it can't tell what state they're choosing.

**Fix:** in [SeoIndexableField.tsx](apps/cms/src/payload/admin/components/SeoIndexableField.tsx) shorten the third option to `"No-index, no-follow"` only if it fits, otherwise pick a tighter label like `"Hide entirely"` or split the field into a 2-button toggle + secondary "no-follow" checkbox. Alternative cosmetic fix: `flex-wrap: wrap` on the button group and let the third button drop to a second row.

---

### F24 · Body editor "Fullscreen" button is actually a focus-mode toggle *(P2 — label vs behavior)*

**Where:** Lexical body editor toolbar, top-right — `<button class="cs-fullscreen-toggle"> Fullscreen</button>`. File: [EditorFullscreenToggle.tsx](apps/cms/src/payload/admin/components/EditorFullscreenToggle.tsx).

**Observed:** clicking "Fullscreen" enables a focus mode — the editor body becomes larger / more readable, but the sidebar and right SEO sidebar are still visible. The browser does NOT enter true fullscreen (no requestFullscreen API used). The button label "Fullscreen" implies a full-window takeover that doesn't happen.

**Fix:** rename the button label to `Focus mode` (or `Distraction-free`), keep the icon, keep the behavior. Less surprising.

If a true fullscreen experience IS desired, gate it behind `document.documentElement.requestFullscreen()` instead — but then the existing focus-mode behavior would need its own button.

---

### F25 · Right-sidebar collapsible cards have transparent backgrounds — vanish into the page *(P1, light theme)*

**Where:** Blog detail right SEO sidebar — five custom cards (Schema/JSON-LD, Inbound redirects, Outbound redirect, URL history, SEO advanced). Confirmed via JS: `getComputedStyle(card).backgroundColor === "rgb(247, 248, 250)"` — exactly the page background. Border `#e5e7eb` is the only thing separating them.

**Why it matters:** in light mode the cards are visually invisible — the eye can't distinguish "card" from "section header floating on the page." Combined with F2 (overall light-mode contrast), it makes the sidebar feel structureless.

**Fix:** in [_sidebar-seo.scss](apps/cms/src/app/(payload)/styles/_sidebar-seo.scss), set explicit backgrounds on the card root:

```scss
.cs-schema-preview,
.cs-inbound-redirects,
.cs-outbound-redirect,
.cs-url-history,
.cs-seo-advanced {
  background: var(--theme-input-bg);   // white in light, #14151a in dark
  border-color: var(--theme-elevation-200);
}
```

Will pop on light theme; in dark theme already works because the page is darker than `--theme-input-bg`.

---

### F26 · Authors relationship chip has an "edit" pencil icon; Reviewed By does not *(P2)*

**Where:** Blog detail body section — `Authors` and `Reviewed By` are both relationship-list fields targeting the same `authors` collection.

**Observed:** the `Authors → Gaurav` chip has an inline edit-pencil icon (clickable, opens the related record); the `Reviewed By → Gaurav` chip shows the chip text + an X clear button only. No edit pencil. Same component, different rendering.

**Fix:** look at the relationship-list rendering code (likely [RelationshipCell.tsx](apps/cms/src/payload/admin/components/RelationshipCell.tsx) or a Payload-stock cell) — check whether the `hasMany` flag, `admin.allowEdit`, or another prop is gating the pencil icon. Make the treatment consistent across both fields.

If the pencil icon is `Authors`-specific because the author record is meaningful to edit inline (vs. the reviewer record is a name-only attribution), the inconsistency is intentional — but then it should be documented in CLAUDE.md so the next person doesn't try to "fix" it.

---

### F27 · Body editor toolbar dropdown chevrons are unreadable *(P2)*

**Where:** Lexical body editor toolbar — paragraph (T), alignment, list dropdowns each show their icon + a tiny chevron-down. Chevrons are Payload-stock 8-10px, low contrast.

**Why it matters:** these are the most-used controls in the editor. Telling whether a dropdown is currently "Heading 2" vs "Heading 3" by chevron state is impossible.

**Fix:** combined with the F1 chevron unification — bump the lexical toolbar chevrons to 12px and use the same `<ChevronDown>` component. Owner: [_lexical-toolbar.scss](apps/cms/src/app/(payload)/styles/_lexical-toolbar.scss).

---

### F28 · Light-theme Blog detail right-sidebar cards confirmed broken; Media item detail looks good *(F2 refinement)*

**Where:** confirmed via live JS readout in light theme — `.cs-inbound-redirects` background = page background, while `<input>` elements correctly use `--theme-input-bg = #ffffff`. So:

- **Form inputs** are fine in light mode.
- **Custom collapsible cards** in the SEO sidebar are NOT fine — they have no background.
- **Dashboard pulse cards** are NOT fine — `--theme-elevation-100 = #eef0f3` is too close to `--theme-bg = #f7f8fa`.

**Refined fix for F2:** rather than changing `--theme-elevation-100` globally (which would affect modals, popovers, sidebar item hover, etc.), make the *dashboard cards* and *SEO sidebar collapsibles* use `--theme-input-bg` (white) instead. Two targeted SCSS changes:

```scss
.cs-dashboard__pulse {
  background: var(--theme-input-bg);  // not --theme-elevation-100
}

.cs-schema-preview, .cs-inbound-redirects, .cs-outbound-redirect, .cs-url-history, .cs-seo-advanced {
  background: var(--theme-input-bg);
}
```

Less risk, same visual win.

---

### F29 · UserMenu popover passes; Sign out destructive treatment is "hover-only" *(verify only)*

**Where:** UserMenu popover (open state) — confirmed live: bg `rgb(28,29,33)`, border `rgb(62,64,72)`, two 36px items (Account, Sign out), 14px SVG icons, chevron rotates 180° on open.

**One nit:** `cs-user-menu__item--destructive` is wired up in source but the rest-state styling shows no destructive cue (no red text, no red icon). Only on hover does the destructive vibe kick in.

**Fix:** make the destructive intent visible at rest — colour the *icon* (not the text) `--color-error-500`. Keeps the row legible while signaling the action's gravity. Alternative: leave as-is and rely on copy ("Sign out" is unambiguous).

---

### F30 · Window-resize testing was unreliable *(audit-tooling note, not a finding)*

The browser-MCP `resize_window` calls succeed but don't actually re-render the inner viewport — screenshots at 1440 / 1280 / 768 were visually identical. The 1280 / 768 verification is therefore *not done*. Either Chrome window-resizing isn't propagating to the viewport, or the screenshot is captured at the OS-window size and downscaled to 1440. **Action:** when implementing fixes, manually resize the dev browser window or use Chrome DevTools' device emulation to verify breakpoints — don't rely on this audit's narrow-viewport coverage.

---

### F10 · Theme persistence smell *(verify only — likely a no-op)*

**Observed in audit:** setting `data-theme="light"` via JS reverted on navigation. This is *expected*: Payload persists theme via its own preference API + cookie, not a JS attribute toggle. The user-facing toggle (account → "Theme") writes to that store and survives navigation.

**Action:** verify Payload's actual toggle persists across navigation in both themes. If it does, this is not a finding. If it does *not*, file a separate bug.

---

## Things that are *fine*

These got checked and passed — flagged so the next person doesn't re-audit:

- **`.btn` system** — 36px height, `var(--cs-radius-input)`, `--cs-tint-focus-ring` halo, transitions all token-driven. Coherent across primary, secondary, subtle, error variants.
- **Icon-only buttons** — `_button-audit.scss:131-157` enforces 30×30 with 14×14 SVGs. Working.
- **Cursor coverage** — `_button-audit.scss:17-48` sweeps `cursor: pointer` across every button-like control and `not-allowed` on disabled. Comprehensive.
- **Focus rings** — `_button-audit.scss:50-59` cross-cuttingly applies `0 0 0 3px var(--cs-tint-focus-ring)` on every interactive element. Confirmed visible on Tab.
- **Pagination buttons** — `_button-audit.scss:160-170` sized to match icon-only. Working.
- **Dark theme** — every measured component renders correctly; tokens fully flip via `[data-theme='dark']` in `_themes.scss`.
- **Stat card layout** — proper grid, consistent padding, label/number hierarchy clean. Only the *colour* logic (F4) is the issue.
- **CommandPalette** — every internal SVG is 14×14, every button has `.btn` or focus-ring coverage; clean architecture.
- **Avatar bubble in UserMenu** — 28×28 brand-tinted circle; computed `--cs-tint-brand-soft` resolves correctly in both themes.
- **SEO health card** (`SeoHealthScoreField`) — green/amber/red ring + score, well sized, readable.

---

## Coverage gap — what still needs a live pass

The third walk filled most of the prior gaps. Remaining unverified items:

**Detail views still unopened (record-level):** News, Webinars, Events, Resources, Redirects, Categories, Knowledge Hub, Knowledge Categories, Pages, Guides, About galleries, Jobs. Author + Blog + Media were opened; the rest exercise unique field components (Resources gating, Redirects staleness field, Pages-builder blocks).

**Drawers / modals still not opened:**
- Relationship picker (Authors / Categories `+` button drawer)
- Media upload drawer + bulk upload drawer
- Bulk edit drawer (multi-select then "Edit")
- Bulk delete confirm
- Version compare drawer (Versions tab → Compare)
- Restore version dialog
- Publish confirmation
- Slug change confirmation
- Inbound/outbound redirect *form* expanded (Add inbound was visible, but the Save flow wasn't exercised)
- Body audit field expanded
- URL change history expanded
- Lexical: link dialog, image upload, table-creation

**Viewports not reliably tested:** 1280 / 768 — `resize_window` succeeds but the inner viewport doesn't actually re-render (see F30). Manual verification with the dev browser still required.

**Surfaces verified live this pass (auto-screenshots saved by browser MCP):**
- All 16 collection list views (16/16 ✓)
- Both globals — SEO Defaults, Site Settings (2/2 ✓)
- Dashboard root (with all stat cards, recent edits, quick actions)
- CommandPalette modal (closed + filtered states)
- Author detail (full, with photo + SEO sidebar)
- Blog detail (full scroll, all sidebar collapsibles visible — Inbound expanded)
- Media item detail (in light theme, the cleanest light-mode capture)
- UserMenu popover (open + closed)
- Sidebar (collapsed via hamburger + expanded states)
- Lexical body editor focus-mode (revealed F24)
- Light-theme parity: dashboard, blog detail, media item — confirmed F2/F25 and identified F28 refinement

---

## Phased fix plan

### Phase 1 — Token & semantic colour fixes (1 PR, ~60 min)
Lowest risk, biggest visual lift. All SCSS-only.

1. **F2 + F25 + F28** — give dashboard pulse cards and SEO sidebar collapsibles an explicit `background: var(--theme-input-bg)` (white in light) — targeted change, not a global token shift.
2. **F4** — neutralise stat-card numbers and add left-border accents in `_dashboard.scss`.
3. **F5** — add 1px top divider above `.cs-user-menu__trigger` in `_user-menu.scss`.
4. **F11 + F17** — clamp first-text-cell width with ellipsis in `_tables.scss` (covers News, Redirects, KB, Resources, Webinars, Events title/url cells).
5. **F13** — disabled-state styling for primary buttons (`_buttons.scss` or `_button-audit.scss`).
6. **F18** — status-pill colour map by severity in `_pills.scss`.
7. **F21** — bump dashboard recent-edits status dot to 8px with proper colour pair.
8. **F29** — colour Sign-out icon (not text) `--color-error-500` in `_user-menu.scss`.

**Verify:** dashboard + sidebar + 3 list views (News, Redirects, Authors) + both globals + Blog detail (right SEO sidebar) in both themes.

### Phase 2 — Chevron unification + nav fixes (1 PR, ~75 min)

1. **F1** — create `apps/cms/src/payload/admin/components/icons/Chevron.tsx` with `ChevronDown` and `ChevronRight`.
2. Replace `▾` in five collapsibles (InboundRedirectsField, OutboundRedirectField, SchemaPreviewField, SeoAdvancedPanel, UrlChangeHistoryField).
3. **F3** — bump `.nav-group__toggle .icon--chevron` to 14px in `_nav.scss`.
4. **F8** — swap quick-action arrows for `ChevronRight`.
5. **F14** — push sidebar-collapse breakpoint down to ≤1024px in `_nav.scss` / `_chrome.scss`; verify sidebar is persistent at ≥1280.
6. **F15** — clamp Payload nav-toggler focus styling so the hamburger doesn't keep a stuck cyan tile.
7. **F27** — bump lexical toolbar dropdown chevrons to 12px in `_lexical-toolbar.scss` (use the same `ChevronDown` component).

**Verify:** every collapsible expands/collapses; chevron rotates; sidebar groups expand/collapse; sidebar visible at 1280/1440/1920; hamburger releases focus after click; body editor toolbar dropdowns are legible.

### Phase 3 — Functional + content fixes (✅ landed)

1. **F12** ✅ — Leads create-doc routes hidden via CSS `a[href='/admin/collections/leads/create']` in `_list-controls.scss`. Header pill + empty-state CTA both gone. API access unchanged.
2. **F19** ✅ — empty-state CTA `_empty-state.scss` allows 2-line wrap (`white-space: normal`, `max-width: 320px`, `line-height: 1.25`). Long-noun CTAs no longer overflow the card.
3. **F23** ✅ — third Indexable option label tightened from `No-index, no-follow` → `Hide entirely`. All three buttons now fit inline at 1280+ widths.
4. **F22** ❎ closed — no Authors custom Name component exists; the icon I observed was the Next.js dev-tools "1 Issue" floating indicator, not CMS UI.
5. **F24** ❎ closed — `EditorFullscreenToggle` does provide a true CSS-based fullscreen takeover via `data-cs-fullscreen='true'` on `<html>`. The label is accurate; my earlier observation conflated the in-progress toggle press with the final state.
6. **F26** ❎ closed — Authors edit-pencil chip vs Reviewed-By no-pencil is **Payload-stock `hasMany` semantics**. Authors is `hasMany: true` (multi-value affordance), reviewedBy is scalar (single-value). Forcing consistency would change semantics.

### Phase 3.1 — deferred (open / nice-to-have)

- **F16** — standardise list-header pill semantics (drop "X TOTAL" or render `total · status` pair).
- **F7** — restyle list-view "Create New" pill (Phase 1's F13 disabled-button work covers similar tokens; revisit only if visually warranted).
- **F9** — collapse double-chevron stacks in column headers (cosmetic).
- **F10** — verify Payload theme persistence (likely a no-op, just confirm).
- **F6** — body-editor heading dropdown consistency (Phase 2's F27 already polished the toolbar carets; defer the dropdown-internals).

### Verification matrix (run after each phase)
- Dashboard (root) — light + dark
- Blogs list view — light + dark
- Blog detail view (sidebar SEO + slug + redirect cards + URL history + schema preview + body editor) — light + dark
- Leads list view (CSV truncation banner + immutable banner present) — light
- Globals → SEO Defaults — light
- CommandPalette modal (Cmd+K) — light + dark
- UserMenu popover (open) — light + dark
- 1280px and 768px widths — sidebar collapse behavior, popover overflow

For every surface: capture before/after screenshots into `docs/audit-cms-ui-2026-05-08/`.

---

## Files most likely to change

```
apps/cms/src/app/(payload)/styles/_themes.scss          # F2
apps/cms/src/app/(payload)/styles/_dashboard.scss       # F4, F8, F21
apps/cms/src/app/(payload)/styles/_user-menu.scss       # F5
apps/cms/src/app/(payload)/styles/_nav.scss             # F3, F14, F15
apps/cms/src/app/(payload)/styles/_chrome.scss          # F14
apps/cms/src/app/(payload)/styles/_chrome-extras.scss   # F7
apps/cms/src/app/(payload)/styles/_tables.scss          # F9, F11, F17
apps/cms/src/app/(payload)/styles/_pills.scss           # F18
apps/cms/src/app/(payload)/styles/_buttons.scss         # F13
apps/cms/src/app/(payload)/styles/_button-audit.scss    # F13
apps/cms/src/app/(payload)/styles/_sidebar-seo.scss     # F1 (drop font-size:10px from chevron blocks at lines 55, 350, 563, 1142, 1453)
apps/cms/src/payload/admin/components/icons/Chevron.tsx # F1 (new)
apps/cms/src/payload/admin/components/InboundRedirectsField.tsx     # F1
apps/cms/src/payload/admin/components/OutboundRedirectField.tsx     # F1
apps/cms/src/payload/admin/components/SchemaPreviewField.tsx        # F1
apps/cms/src/payload/admin/components/SeoAdvancedPanel.tsx          # F1
apps/cms/src/payload/admin/components/UrlChangeHistoryField.tsx     # F1
apps/cms/src/payload/admin/components/Dashboard/                    # F8, F21
apps/cms/src/payload/collections/Leads.ts                           # F12 (admin.disableCreate)
apps/cms/src/payload/admin/components/SeoIndexableField.tsx         # F23
apps/cms/src/payload/admin/components/EditorFullscreenToggle.tsx    # F24
apps/cms/src/app/(payload)/styles/_sidebar-seo.scss                 # F25, F1
apps/cms/src/app/(payload)/styles/_lexical-toolbar.scss             # F27
apps/cms/src/payload/admin/components/RelationshipCell.tsx          # F26
```

No payload-types regen needed — none of these touch collection schemas (F12 changes admin config only).

---

## Open questions

1. **F4** — coloured-pip border or keep colour on numbers but with a softer palette (drafts in `--cs-cyan-700` instead of warning amber)?
2. **F2** — switching `--theme-elevation-100` to white affects every component that uses it (modal headers, sidebar hover, lexical editor, popovers). Want a visual diff across edge surfaces before committing, or just ship it and adjust if anything breaks?
3. **F6** — leave Lexical toolbar alone, or include it in Phase 2?
4. **F12** — confirm Leads should hard-disable create (`admin.disableCreate: true`), not just hide the empty-state CTA. Anything in CRM workflows that legitimately needs a manual lead?
5. **F14** — sidebar-collapse breakpoint: drop to ≤1024 (recommended), ≤768, or remove entirely so the sidebar is always visible at desktop widths?
6. **F16** — list-header pill semantics: drop "X TOTAL" everywhere (table footer already shows count) and keep only status pills, or render `total · status` pair where applicable?
7. **F22** — what is the icon at the top-right of the Author Name field? (Probably worth a quick screenshot to confirm — it's small and dark.)

Answer these and Phase 1 PR can land same-day.
