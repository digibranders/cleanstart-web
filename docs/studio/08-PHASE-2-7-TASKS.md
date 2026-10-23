# Studio Phases 2 to 7: task breakdown

Every task an implementer needs after Phase 1, in build order. Each task names its screens (`02`), the old admin files it replaces (`03` §B), the collections it unlocks (`03` §C), the issues it must fix (`07`), its files, its behaviour, its tests and its acceptance check. The code-level plan for a phase is written from this file at the start of the phase, against the interfaces Phase 1 actually produced; this file fixes the scope and the rules so that plan cannot drift.

Read `06-IMPLEMENTER-GUIDE.md` before any task here. Every task passes the gates in `05`.

## Conventions used below

- **Id:** `T<phase>.<n>`. Commit messages use it: `feat(studio): T2.4 relationship field`.
- **Fixes:** issue ids from `07-UI-ISSUES-REGISTER.md`. A task is not done until each listed issue's acceptance check passes.
- **Tests:** unit tests are Vitest files next to the code (`*.test.ts(x)`, node environment, components rendered with `renderToStaticMarkup`). Interaction tests are Playwright specs in `apps/cms/tests/e2e/studio/`, tagged `@studio` and `@studio-p<phase>`.
- **Lab:** every new component gets a lab section showing every state in both themes in the same task.
- **New dependencies** are listed per task. Add nothing else without asking.

---

## Phase 2: Form engine and media

Entry: Phase 1 signed off and tagged `studio-p1`.
Exit: the 9 simple taxonomies, `media`, `emailAssets`, `aboutGalleries` and `seoDefaults` reach parity, each with its `03` §C row ticked and an e2e spec passing. `authors` and `forms` contain rich text, so their parity is ticked at the Phase 3 exit (contract §17).

### T2.1 Media library composition

- Screens: S-20, S-21, S-22 as lab compositions with fixture data, approved before T2.8 starts (the same gate Phase 0 used for list and edit).
- Files: `src/studio/lab/compositions/MediaLibraryComposition.tsx`, `MediaDetailComposition.tsx`, `MediaPickerComposition.tsx`, fixtures.
- Acceptance: product owner signs off in this file under the task, in both themes.

### T2.2 Group, collapsible, row and tabs renderers

- Replaces: `fields/GroupField.tsx`, `CollapsibleField.tsx`, `RowField.tsx`, `TabsField.tsx`.
- Behaviour:
  - Group: a `Section` with the group label as title and its description below; children use the group's path prefix (`seo.title`). A group with `admin.hideGutter` renders without the section title.
  - Collapsible: a `Collapsible` with a chevron rotating 90 degrees; initial state from `admin.initCollapsed`; open state saved per user and field path in the `collapsibles` preference (`09` §13). When a child has a validation error, the collapsible opens itself and shows an error dot next to its label.
  - Row: children side by side in a CSS grid, equal columns unless a child sets `admin.width` (percent). Below 1280px the row stacks.
  - Tabs: segmented `Tabs` (design system §7.3). A tab with an error shows a danger dot. Named tabs prefix their children's path; unnamed tabs do not. The selected tab is kept in the URL hash (`#tab-seo`) so a reload returns to it.
- Tests: path prefixing for named and unnamed tabs and groups; error dot appears on the right tab and collapsible.
- Acceptance: a fixture schema with nested group in tabs in collapsible saves the same JSON Payload's admin saves (compare against a recorded save).

### T2.3 Array field

- Replaces: `fields/ArrayField.tsx`, row label components (`FaqRowLabel`, `TocRowLabel`, `MentionRowLabel` in Phase 5).
- New dependency: `@dnd-kit/core@6.3.1` and `@dnd-kit/sortable@10.0.0` (MIT), the exact versions `@payloadcms/ui` already pulls in, so the lockfile gains no new copies. Chosen because they ship a keyboard sensor.
- Behaviour:
  - Each row is a collapsible card (`--bg-raised`, `--radius-md`) with a drag handle, the row label (custom label component from the registry, else "Row 1", "Row 2"), a collapse toggle and a more menu (Move up, Move down, Duplicate, Remove).
  - Drag with mouse or keyboard: focus the handle, Space to lift, arrow keys to move, Space to drop, Esc to cancel. Screen readers hear "Row 3 of 7 lifted", "moved to position 5", "dropped".
  - Add row button under the list ("Add FAQ", using `labels.singular`), disabled with a tooltip at `maxRows`. Below `minRows` the field shows an error on save.
  - Remove is immediate and shows the toast and Undo from contract §8.11. Undo restores the row with its values and collapse state.
  - New rows open expanded and focus their first input. Existing rows load collapsed when the field sets `admin.initCollapsed` or when there are more than 5 rows; otherwise expanded.
  - Row ids: keep Payload's `id` per row; new rows get `new ObjectID().toHexString()` from `bson-objectid` (24 hex characters, the library Payload uses; already a dependency for the editor, `04` §3).
- Tests: reorder, add, remove and undo keep values and ids; minRows and maxRows; keyboard drag in Playwright.
- Fixes: issues tagged "array" in `07`.

### T2.4 Blocks field

- Replaces: `fields/BlocksField.tsx`.
- Behaviour: rows as in T2.3, each headed by the block's label and icon. "Add block" opens a picker popover listing blocks with their `labels.singular`, `admin.description` and a search box when there are more than 6. Collapsed blocks show a one-line summary: the first non-empty text field of the block, truncated with an ellipsis at the row width.
- Tests: add each block type in a fixture; summary text; JSON round-trip equals a recorded Payload save.

### T2.5 Relationship field

- Replaces: `fields/RelationshipField.tsx`, `fields/relationship-value.ts` (SHARE), `lib/quick-create-config.ts` (SHARE), `RelationshipCell` already ported in Phase 1.
- Behaviour:
  - Single and many, polymorphic (`relationTo` array shows a collection switcher inside the combobox), `filterOptions` applied on the server for every search.
  - Combobox with server search per contract §8.8 (debounced 250 ms, 20 results per page, "Load more" at the end), showing the related document's `useAsTitle`, its status glyph when the related collection has drafts, and for many, removable chips in order with drag reorder when `isSortable`.
  - Values stay numbers for numeric ids. Polymorphic values stay `{ relationTo, value }`. One helper converts at the boundary (`relationship-value.ts`).
  - "Create new" at the bottom of the results opens `QuickCreateDialog` when the user can create in the related collection; on success the new document is selected.
  - A selected document the user cannot read shows "Restricted document" (id visible on hover), not an empty chip.
  - An unpublished related document shows its title with the draft glyph, so editors see they are linking to something not live.
- Tests: numeric ids never stringified; polymorphic save shape; filterOptions enforced server side (a crafted request outside the filter is rejected).
- Fixes: the "relationship ids stringified" and "dropdown clipped in array rows" issues in `07`.

### T2.6 Upload field and join field

- Replaces: `MediaField/MediaField.tsx`, `MediaField/MediaCell.tsx`, `MediaField/PdfThumb.tsx`, `fields/JoinField.tsx`, `MediaSizeWarningField.tsx`.
- Behaviour:
  - Upload field: empty state is a drop zone ("Drop a file or choose from the library", buttons "Upload" and "Choose"). Filled state shows a 64px thumbnail (PDF first page through `pdfjs-dist`), file name, dimensions and size, and actions Replace, Edit details (opens S-21 in a drawer), Remove.
  - Size warning, per-field `folderHint`, `accept` and `guidance`, client type and size pre-check, and "Change" (not "Replace") semantics: all as `09` §9.0 and §9.1.
  - Join field: read-only list of the joined documents with links, "No linked documents" when empty, paginated by 10.
- Tests: upload progress events; remove sends `null`; join pagination.

### T2.7 Code and point fields, `ui` host

- Replaces: `fields/CodeField.tsx`, `fields/PointField.tsx`, `HiddenField.tsx`.
- Behaviour: CodeMirror 6 (installed) themed from tokens, Geist Mono 12px, line numbers, the language from `admin.language`, height 160px growing to 480px then scrolling. Point: two number inputs labelled Longitude and Latitude. `ui` fields resolve through the registry; an unregistered path fails the coverage check.

### T2.8 Media library (S-20)

- Replaces: `MediaBrowseDialog.tsx` (picker part goes to T2.10), `views/list` media variant.
- Behaviour: grid (default) and list layouts with a switch saved per user; folders from the existing folder field; search; filters (type and folder, `09` §9.4; there is no uploader data); upload by button and by dropping files anywhere on the sheet (a full-sheet drop target appears while dragging); per-file progress rows in a tray at the bottom right with Cancel; failed files stay in the tray with the error and Retry.
- Keyboard: arrow keys move focus in the grid, Enter opens detail, Space selects, Delete asks to delete selected.
- Tests: upload tray states; drop target; keyboard grid navigation.

### T2.9 Media detail (S-21)

- Replaces: `MediaSelfChrome.tsx`, `BytesCell.tsx`.
- Behaviour: large preview with a focal point picker writing `focalPoint.x` and `focalPoint.y` (`09` §9.2), fields alt, caption, credit; rename through `POST /api/media/:id/rename` through one client shared by every caller (UI-100); Replace file (overwrites everywhere, with the `09` §9.0 confirm); Copy URL; Delete with the usage rule in `09` §9.3.
- Fixes: the "media rename lives in two surfaces" issue.

### T2.10 Media picker (S-22)

- Behaviour: a large Dialog with the library grid, search and folder filter, Upload inside the dialog, single or multiple selection per field config, "Choose" disabled until something is selected. Opened from upload fields and later from the editor's image insert.

### T2.11 Parity: taxonomies, media, emailAssets, aboutGalleries, seoDefaults

- For each collection: open every field in Studio, save, compare the saved JSON to a save from Payload's admin with the same inputs, tick its `03` §C row with the e2e test id.
- Global `seoDefaults` uses S-15 (global edit) with `GlobalSchemaView` and `SchemaOverrideField` ported.

---

## Phase 3: Rich-text editor

Entry: Phase 2 tagged. The Phase 0 census confirmed every production node type.
Exit: a blog, a guide and a knowledge-base article edit and save with no diff in untouched nodes, and `apps/web` renders them unchanged (visual diff). `authors` and `forms` reach parity (T3.8).

Everything in this phase follows `04-EDITOR-SPEC.md`. The tasks below fix the order.

### T3.1 Editor composition

Lab composition of the writing column with toolbar bubble, slash menu, insert menu, link popover, table picker and image dialogs, approved before T3.3.

### T3.2 Node classes and the round-trip gate

- All node classes with Payload's exact `type` and `version` (`04`). The round-trip test over every fixture (59 blogs plus hand-built fixtures) runs in CI and blocks the phase.
- Acceptance: deep equality on every fixture; a deliberately changed node version makes the test fail.

### T3.3 Editor host and form integration

- One `LexicalComposer` per rich-text field, registered with the form engine so the document's dirty state and save include it. Typing never triggers a network call.

### T3.4 Formatting bubble, block handle, slash menu and insert menu

- Replaces: `SlashMenuPlugin`, `AddMenu/*`, `StockToolbarSuppressorPlugin` (dropped).
- The bubble appears on a non-empty selection, above it, flipping below when there is no room; it never covers the selection.

### T3.5 Links

- Replaces: `LinkPopover*`, `LinkInternalSearch`, `internal-routes.ts` (SHARE).
- Fixes: all four link bugs in `07` (internal and external switch, selection lost on create, and the rest listed there). The create path restores the selection with `$setSelection` before inserting.

### T3.6 Tables, code blocks, embeds, inline images, inline CTA, rich paste

- Replaces the remaining editor files in `03` §B phase 3.
- Each feature gets its own fixture in the round-trip test.

### T3.7 Focus mode and editor keyboard map

- ⌘⇧F toggles focus mode (sidebar, header actions and inspector hidden, writing column centred). Every editor shortcut is in `shortcuts.ts` and the shortcut sheet.

### T3.8 Parity: authors and forms

- Both collections hold rich text (`bioLong`, `postSubmit.body`), so they are ticked here, as T2.11.

### T3.9 Visual diff on `apps/web`

- Render the three acceptance documents on `apps/web` before and after a Studio save; pixel diff under 0.1 percent.

---

## Phase 4: Document workflow and SEO

Entry: Phase 3 tagged.
Exit: the 12 routed content collections reach parity.

### T4.1 Document header and save status (S-12)

- Replaces: `DocHeader`, `SavedStateIndicator`, `SaveShortcut`.
- Behaviour: breadcrumb, live title, save status ("Unsaved changes" with a warning dot, "Saving…", "Saved 2 min ago" refreshed every 30 seconds, "Save failed" with Retry), Preview, more menu, inspector toggle, Publish split button. ⌘S saves a draft (or saves, without drafts).

### T4.2 Publish popover, schedule, unpublish

- Replaces: `CmsPublishButton`, `SchedulePublishDialog`, `PublishOverrideGuard`.
- Behaviour exactly as contract §5 and `02` S-12 "Publish popover". With a blocker the popover still opens and its action is `aria-disabled` with the blocker sentence under it. Authors never see it (D-6).

### T4.3 Inspector with Details, SEO and Checklist tabs

- Replaces the right rail and `DocSidebarResizer`. Sections per `02` S-12 "Inspector". Width 280 to 440, saved per user; collapsible to a 40px strip; keyboard resize with arrow keys on the focused handle.

### T4.4 Property chips under the title

- Authors, category, display date and slug as chips; each opens a popover editor bound to the same form value as the inspector. "+ Property" pins any other sidebar field.

### T4.5 SEO cards

- Replaces every SEO component in `03` §B phase 4 (title, description, indexable, SERP preview, keywords, canonical, social card, outbound redirect, head tags, URL history, schema preview, advanced, health score, permalink).
- The `user.role` bug in `topic-suggestions.ts` and `canonical-check.ts` was fixed in 5c12fb1a (UI-070); the first step of this task confirms both return 200 for an editor before building the sections.

### T4.6 Checklist, slug guard, SEO length confirm

- Replaces: `PublishChecklistBanner`, `SlugRequirementGuard`, `lib/slug-status-store.ts` (dropped).
- Blockers are computed live from form values; the checklist re-fetches after every save (contract §5.4). The SEO length warning lives inside the publish popover with "Publish anyway" (contract §5.3).

### T4.7 Discard, duplicate, delete, purge page, copy actions

- Replaces: `DocKebabExtras`, `cache/PurgePageButton`.
- Every destructive action uses `ConfirmDialog` with the copy in `02`.

### T4.8 Versions (S-13, S-14)

- New dependency: `diff` (BSD-3) for text diffs.
- Field-by-field compare; rich text compared by paragraph text; restore through `restoreVersion` as the user, then back to S-12 with a toast "Version restored. It is a draft until you publish."

### T4.9 Locks

- Exactly contract §4: acquire with update permission, refresh every 60 seconds whether dirty or not, one lock per tab, release on `pagehide` with `sendBeacon`, takeover confirm, read-only with "Copy my changes" for the editor who lost the lock. Also the stale-edit conflict check (contract §3.4).

### T4.10 Unsaved-changes guard

- `NavigationGuard` exactly as contract §6, plus local recovery copies (contract §3.8), session refresh and expiry handling (§3.6, §3.6a) and offline handling (§3.7).

### T4.11 Preview pane and share links

- Replaces: `PreviewMenu`, `CopyPreviewLink`.
- Saved-draft iframe (D-7), `SplitPane` 50/50, ⌘⌥P toggle, one token per editing session, breakpoint switcher and share links, all per contract §10.

### T4.12 Blog-specific fields

- FAQ bulk paste, TOC rows, CTA auto-pick (`BlogCtaAutoPick`, calling `/api/blog-cta-suggestion`), journey mirror warning, display published date.

### T4.13 Parity for the 12 routed collections

- Per collection, as T2.11.

---

## Phase 5: Remaining collections and list power features

Entry: Phase 4 tagged.
Exit: every row in `03` §C is ticked.

### T5.1 Grouped List layout and view tabs (S-10)

- Behaviour: `02` S-10, design system `GroupedList`, contract §1 (status), §7.3 (tabs and groups), §7.5 (selection bar), §7.7a (locked rows).
- Files: `src/studio/list/GroupedList.tsx`, `ViewTabs.tsx`, `LayoutSwitch.tsx`, `SelectionBar.tsx`; `src/studio/server/status.ts` (`getDocStatus`, `getDocStatuses`, `countByStatus`); loader changes in `server/loaders/list.ts`.
- Tests: `status.test.ts` covers every row of the §1 precedence table, including a scheduled document that also has unpublished changes (counted once, as Scheduled) and All equal to the sum; e2e switches layouts, collapses a group, reloads, and sees both kept.
- Fixes: UI-025.
- Acceptance: on blogs, tab counts add up to All; each document appears in exactly one group; a row locked in `/admin` shows the lock and cannot be selected.

### T5.2 Filters, saved views, column resize, export, bulk actions

- Replaces: `views/list/*` in `03` §B phase 5.
- Behaviour: `02` S-10, contract §7.2 (Display popover), §7.5 (bulk), §7.7 (URL parameters).
- New: bulk Publish and Unpublish (UI-031); bulk field editing is not offered (`09` §18).
- Tests: Zod rejects unknown filter operators; bulk action returns per-item results; partial failure toast copy; saved view restores q, filters, sort, columns and layout.
- Fixes: UI-023, UI-026, UI-028, UI-029, UI-030, UI-031, UI-032, UI-033.
- Acceptance: export of a filtered list matches the filter; bulk delete of 3 with 1 locked deletes 2 and reports the third.

### T5.3 Leads and applications (S-30, S-31)

- Behaviour: `02` S-30 and S-31, contract §11.4 (DSAR confirm), §15 rows S-30 and S-31.
- Files: `src/studio/features/leads/*`, `features/applications/*`.
- Calls: `GET /api/leads/export-csv` (truncation from the response header, never by patching fetch), `GET /api/leads/dsar/find`, `POST /api/leads/dsar/delete`, retry sync through a Studio action that runs the retry logic as the user (the REST path is a 3-segment root endpoint, UI-131).
- Tests: no New button for any role; DSAR typed confirmation enables only on a case-insensitive match; truncation banner.
- Fixes: UI-035, UI-036, UI-131.

### T5.4 Users (S-32)

- Behaviour: `02` S-32, contract §8.15 (users), §11.4 (Disable user confirm with the schedules warning).
- New user creates with a random password and sends the reset email; no password is ever shown.
- Tests: non-admin opening another user gets S-51; admin cannot disable themselves ("You cannot disable your own account."); the confirm lists pending schedules.
- Fixes: UI-057 (no reload), UI-132 (copy until F-13).

### T5.5 Integrations (S-33)

- Behaviour: `02` S-33, contract §8.7 (secrets), §8.15 (reserved kinds, no Duplicate).
- Calls: `/api/integrations/:id/test`, `/health`, `/audit` (admin only).
- Tests: saving without touching a secret sends the sentinel and the Test still passes; reserved kinds absent from the picker; no Duplicate in the More menu.
- Fixes: UI-068.

### T5.6 Page registry and schema manager (S-34)

- Behaviour: `02` S-34. Override editing admin only; `webPageType` and `notes` editable by admin and editor.
- Calls: `GET /api/pageRegistry/live-schema`; JSON-LD preview `POST /api/jsonld/:collection/:id` (admin only).
- Tests: 16KB cap error; editor sees Override read-only.
- Fixes: UI-130.

### T5.7 Email signatures and templates (S-35)

- Behaviour: `02` S-35. Template preview iframe uses `sandbox=""` (no scripts, no same origin) with `srcdoc`, updated 300 ms after typing stops.
- Default template: the create form gets the default template from the server (contract §3.9).
- Tests: preview never runs a script in the template; "Default template" clears the others (server).

### T5.8 Broken links, redirects extras, system records (S-36, S-37, S-38)

- Behaviour: `02` S-36 to S-38. Redirect staleness: Hot at 1,000 hits or more, "Never hit, safe to remove" with 0 hits, Cold when the last hit is more than 90 days ago, else Active (from `RedirectStalenessField.tsx`; labels without emoji). Statuses and sources exactly as `02` S-37. Import drawer: dry run table of rows with result per row, then Import.
- Tests: slug-change rows read-only with the reason; 410 hides To; import dry run shows errors per row.

### T5.9 Globals (S-15)

- Behaviour: `02` S-15 and contract §3.1: siteSettings, legal, seoDefaults, impactStats and spotlights. Today none has drafts, so each shows Save; versions where configured (50).
- Tests: access per global (`02` S-15); scoped departmental users see no globals.

### T5.10 Parity for every remaining collection

- Per collection, as T2.11, until every row in `03` §C is ticked.

---

## Phase 6: Dashboards and global tools

Entry: Phase 5 tagged.
Exit: every screen in `02` is built and reviewed.

### T6.1 Dashboard composition

Lab composition of S-05 for each role, approved before T6.2.

### T6.2 Home dashboard (S-05)

- Behaviour: `02` S-05 (stat cells, recent activity, quick create, greeting), contract §15 row S-05 (each region loads and fails independently).
- Files: `src/studio/server/loaders/dashboard.ts`, `src/studio/features/dashboard/*`.
- Tests: an author sees no lead or redirect counts (UI-125); an hr user sees only hr collections; a role with no create permission sees no quick create.
- Fixes: UI-124, UI-125, UI-137.

### T6.3 Analytics (S-40), content insights (S-41), lead attribution (S-42)

- Behaviour: `02` S-40 to S-42. Date ranges: "Last 7 days", "Last 28 days" (default), "Last 90 days", compared with the previous period of the same length. Not configured: "Connect Google Analytics in Integrations to see this." Each panel loads and fails on its own.
- Charts ported from the current components and restyled with tokens; no chart library from a CDN; each chart has a visually hidden table (contract §14).
- Every client fetch is keyed and aborted when superseded (UI-121). Realtime polls every 30 seconds only while the page is visible.
- Fixes: UI-121, UI-134, UI-135.

### T6.4 Cache (S-43)

- Behaviour: `02` S-43, contract §11.4 (purge everything typed confirmation "purge everything"). A pasted full URL is reduced to its path (UI-037).
- Tests: non-admin gets S-51; typed confirmation required.

### T6.5 Command palette

- Replaces: `CommandPalette.tsx`.
- Behaviour: server action `searchDocuments({ q })` in `src/studio/server/actions/search.ts` runs `find` as the user on each readable collection's `useAsTitle` with `like`, in parallel, 3 per collection, and returns at most 8 documents with status, collection label and URL; debounced 150 ms; client-side navigation. Groups: Recent (from the `recentDocuments` preference, last 8 opened), Go to (collections and screens the user can open), Create, Documents, Actions. Limits and empty state per contract §16.
- Tests: results respect access (an author never sees leads); navigation goes through `NavigationGuard`.
- Fixes: UI-006.

### T6.6 Shortcut sheet and browser check

- The sheet is generated from `shortcuts.ts` (UI-040). Check every binding in contract §12.2 in Chrome, Safari and Firefox on macOS and Chrome on Windows; record conflicts and fallbacks in `shortcuts.ts`.
- Add the Account setting "Single-key shortcuts" (contract §12.1).

---

## Phase 7: Parity, hardening and cutover

### T7.1 Parity walkthrough

With the product owner and one editor, against every row of `03` and every row of `07`.

### T7.2 Accessibility pass

axe zero on every screen in both themes; a keyboard-only walkthrough of every flow in `02`; screen reader smoke test (VoiceOver) of sign in, list, edit, publish.

### T7.3 Performance pass

INP under 200ms on the edit view with a 5,000-word blog; list render under 500ms server time for 25 rows; per-route JS budget recorded and enforced in CI.

### T7.4 Reset email to Studio, `/` to `/studio`

### T7.5 Retirement plan for the Payload admin layer

A separate plan. `Embed/EmbedNode.ts` and `Embed/embed-providers.ts` must survive it.
