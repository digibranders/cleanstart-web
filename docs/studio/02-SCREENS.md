# Studio screens

Every screen in Studio, with its route, who can open it, what it replaces, its layout regions, the components it uses, the data it loads, the actions it runs, its states and its keyboard model. Component names refer to `01-DESIGN-SYSTEM.md`. Field and component mappings are in `03-FIELD-AND-COMPONENT-MAP.md`. Roles and rules come from `research/workflows-and-roles.md`.

Conventions:

- Routes are under `apps/cms/src/app/(studio)/studio/`. `(app)` is the signed-in route group with the app shell.
- **Loader** = a server function in `apps/cms/src/studio/server/**` called from the route's server component.
- **Action** = a server action in `apps/cms/src/studio/server/actions/**`, always run as the signed-in user (ADR-2).
- **REST** = an existing Payload or custom endpoint called from the browser on the same origin. Studio never re-implements an endpoint that exists.
- Every screen has four standard states: loading (Skeleton matching the layout), empty, error (Banner plus retry) and forbidden (S-51). Only extra states are listed.

## Screen index

| Id | Screen | Route | Phase |
|---|---|---|---|
| S-00 | App shell | (all `(app)` routes) | 1 |
| S-01 | Sign in | `/studio/login` | 1 |
| S-02 | Forgot password | `/studio/forgot-password` | 1 |
| S-03 | Reset password | `/studio/reset-password/[token]` | 1 |
| S-04 | Account | `/studio/account` | 1 |
| S-05 | Home dashboard | `/studio` | 6 |
| S-10 | Collection list | `/studio/collections/[collection]` | 1 (base), 5 (extras) |
| S-11 | Create document | `/studio/collections/[collection]/new` | 1 |
| S-12 | Edit document | `/studio/collections/[collection]/[id]` | 1 (base), 2 to 4 (full) |
| S-13 | Version history | `/studio/collections/[collection]/[id]/versions` | 4 |
| S-14 | Compare and restore version | `/studio/collections/[collection]/[id]/versions/[versionId]` | 4 |
| S-15 | Global edit and versions | `/studio/globals/[global]` (+ `/versions`, `/versions/[versionId]`) | 2 (seoDefaults), 5 (others) |
| S-20 | Media library | `/studio/collections/media` (library variant of S-10) | 2 |
| S-21 | Media detail | `/studio/collections/media/[id]` (media variant of S-12) | 2 |
| S-22 | Media picker | dialog, opened from upload fields and the editor | 2 |
| S-30 | Leads | `/studio/collections/leads` (+ `/[id]`) | 5 |
| S-31 | Applications and registrations | `/studio/collections/{partner-applications,deal-registrations,career-applications,resumes}` | 5 |
| S-32 | Users | `/studio/collections/users` (+ `/[id]`) | 5 |
| S-33 | Integrations | `/studio/collections/integrations` (+ `/[id]`) | 5 |
| S-34 | Page registry and schema manager | `/studio/collections/pageRegistry` (+ `/[id]`) | 5 |
| S-35 | Email signatures and templates | `/studio/collections/{emailSignatures,signatureTemplates}` | 5 |
| S-36 | Broken links | `/studio/collections/brokenLinks` | 5 |
| S-37 | Redirects | `/studio/collections/redirects` | 1 (base), 5 (staleness, locks) |
| S-38 | System records | `/studio/collections/{audit-log,consentLog,searchLog,previewAudit,analyticsCache,webhooks_dead_letter}` | 5 |
| S-40 | Analytics | `/studio/analytics` | 6 |
| S-41 | Content insights | `/studio/content-insights` | 6 |
| S-42 | Lead attribution | `/studio/lead-attribution` | 6 |
| S-43 | Cache | `/studio/cache` | 6 |
| S-50 | Component lab | `/studio/lab` | 0 |
| S-51 | Not found, forbidden, error, narrow window | (framework routes) | 1 |

---

## S-00 App shell

**Replaces:** Payload's nav and template, `SidebarHeader`, `UserMenu`, `NavOpenOnDesktop`, `NavGroupPersistence`, `NavBadges`, `SkipLink`, `ToastBus`, `CommandPalette` (mount), `ShortcutHelpDialog`, `SaveShortcut` (global part).

**Layout:** sidebar (232px, collapsible to 56px) sits directly on the window (`--bg-canvas`) with no border; main is one floating sheet (`--bg-surface`, `--radius-lg`, `--shadow-sheet`) inset 8px on top, right and bottom. The sheet is the only scroll container. No global top bar; each screen owns its `PageHeader` inside the sheet. The current nav item is a small raised tile (`--bg-surface`, `--shadow-raised`); other items are `--text-secondary` with 15px icons, so the sidebar recedes.

**Sidebar regions, top to bottom:**

1. Brand row: monochrome `Icon` mark plus "CleanStart" and a muted "Studio", collapse button (⌘\).
2. Search button: a raised field-shaped button ("Search", `Kbd` ⌘K). Opens the command palette.
3. "Home".
4. Navigation groups. Each group is a `Collapsible`; open state is saved in `users.preferences.navGroups`. Items show the collection's plural label and a draft count badge when drafts exist (replaces `NavBadges`, computed in the shell loader with one `count` query per draft-enabled collection the user can read, cached for 60s).
5. Bottom: user row (Avatar, name, role) opening the user menu: Account, Theme (System, Light, Dark), Keyboard shortcuts (?), Open published site, Sign out.

**Navigation groups (proposed, decision D-9 in the master plan):**

| Group | Items (collection or global slug) | Visible to |
|---|---|---|
| Content | blogs, news, guides, case-studies, knowledgeBase, resources, events, webinars, podcastEpisodes, jobs, pages, legalDocuments, authors, aboutGalleries | per collection read access and departmental scoping |
| Media | media, emailAssets | read access |
| Taxonomies | categories, newsCategories, knowledgeCategories, industries, resourceTypes, departments, regions, pressTypes, webinarTypes, jobLocations | read access |
| Marketing | leads, forms, partner-applications, deal-registrations, Lead attribution (S-42) | read access; report for admin and editor |
| Recruiting | career-applications, resumes | read access |
| SEO | redirects, pageRegistry, brokenLinks, seoDefaults (global), Analytics (S-40), Content insights (S-41) | read access; reports for admin and editor |
| Brand | emailSignatures, signatureTemplates | read access |
| Settings | siteSettings, impactStats, spotlights, legal (globals), users, integrations, Cache (S-43) | per access; Cache for admin |
| System | audit-log, consentLog, searchLog, previewAudit, analyticsCache, webhooks_dead_letter | admin (per access) |

Hidden always: `payload-kv`, `payload-jobs`, `payload-locked-documents`, `payload-preferences`, `payload-migrations`, global `payload-jobs-stats`.

Scoping rule (mirrors `lib/wire-scoped-nav.ts:59-148`): a user whose roles are only departmental (`hr`, `events`, `legal`) sees only their domains (hr: jobs, career-applications, resumes, departments, jobLocations, emailSignatures; events: events, webinars, webinarTypes, podcastEpisodes; legal: legalDocuments) and no globals. This is navigation only; access functions remain the real gate.

**Loader:** `getShellData()` returns user, permissions (from `getAccessResults`), nav groups after scoping, draft counts, preferences.

**Global keyboard:** ⌘K palette · ⌘\ toggle sidebar · ? shortcut sheet (not while typing) · G then H Home · G then B Blogs · Esc closes the top overlay.

**Shortcut sheet:** a `Dialog` listing every shortcut in Studio, generated from one `shortcuts.ts` registry so the sheet cannot drift from the bindings (fixes today's ⌘/ mismatch).

**Acceptance:** sidebar matches permissions for each of the 7 roles (e2e per role); skip link is the first tab stop; collapsed sidebar shows tooltips on every item.

---

## S-01 Sign in

**Replaces:** Payload login plus `CmsLoginHero`, `CmsLoginFooter`.

**Layout:** split (design system §7.7). Left: form side on `--bg-surface`, brand row top-left, form centred in 360px, footer line bottom-left. Right: 776px brand panel inset 8px with the website's dark band and faded hero grid, the white mark, and a kinetic headline: "Write the next" over a slot that rolls through "blog post", "guide", "case study", "webinar", "press release" and "podcast episode" every 2.4s, the sentence "Studio is where every page on cleanstart.com is written, reviewed and published.", and a bottom row of chips for the same six types that lights in step with the word. The panel is decorative (`aria-hidden`), holds on the first word under reduced motion, and is hidden below 1100px. S-02 and S-03 use the same layout.

**Content:** title "Welcome back" (`--type-display`) with "Sign in with your CleanStart work account." below; Email; Password (show/hide toggle); "Forgot password?" link; primary "Sign in" (ink, 40px, full width); footer line "Need access? Ask an admin." with the help contact used by `CmsLoginFooter`.

**REST:** `POST /api/users/login` with `{ email, password }`. On success redirect to `?next=` (same-origin paths only) or `/studio`.

**States:** wrong credentials ("Email or password is incorrect."); locked after 5 attempts ("Too many attempts. Try again in 10 minutes."); disabled account (message from the `beforeLogin` hook, `Users.ts:59-71`); `seo`-only account (signed in but `access.admin` is false, so show S-51 forbidden with "Your role cannot use Studio.").

**Keyboard:** Enter submits; focus starts in Email.

## S-02 Forgot password

**Content:** Email field, "Send reset link". After submit, always the same message: "If that email has an account, a reset link is on its way." (no account enumeration).

**REST:** `POST /api/users/forgot-password`.

## S-03 Reset password

**Content:** New password and Confirm password, with a live rule list (at least 12 characters, matches). "Set password".

**REST:** `POST /api/users/reset-password` with `{ token, password }`. Success signs the user in (Payload returns a token cookie) and redirects to `/studio`. Expired token: "This link has expired. Request a new one." with a link to S-02.

**Note:** reset emails point at `/admin/reset/:token` until Phase 7 changes `generateEmailHTML` (ADR-3). Until then this screen is reachable but unused.

## S-04 Account

**Replaces:** `CmsAccountView`, `CmsAccountForm`.

**Layout:** PageHeader "Account"; content column 560px with sections Profile (name, email), Password (new, confirm), Appearance (theme), Two-factor (placeholder text "Not available yet", matching today).

**Action:** `updateAccount({ name, email, password? })` → `payload.update({ collection: 'users', id: self })` as the user.

**States:** email already used; password too short; saved toast.

---

## S-05 Home dashboard

**Replaces:** `Dashboard/Dashboard.tsx` (the 599-line server view). `AnalyticsCards` stays dead.

**Layout:** PageHeader "Home" with greeting line. Three regions:

1. **Needs attention** (row of up to 4 compact cards): drafts with unpublished changes, scheduled in the next 7 days, broken links found today (admin, editor), webhook failures (admin). Each card is a count plus a link to a filtered list. Cards a role cannot read are not shown.
2. **Recent activity:** day-grouped list of recently updated documents across the collections the user can read (5 per collection, same query as today: `payload.find` with `draft: true`, sorted by `updatedAt`), each row with StatusBadge, title, collection, editor avatar, relative time.
3. **Quick create:** buttons for the collections the user can create in, in nav order.

**Loader:** `getDashboard(user)` using the scoped collection list (`scopedCollectionSlugsForUser`).

**Acceptance:** an `hr` user sees only hr collections; a role with no create permission sees no quick-create buttons.

---

## S-10 Collection list

**Replaces:** `CmsListView`, `ListHeader`, `BulkActionBar`, `ColumnPicker`, `ColumnResizer`, `SavedViews`, `ExportDrawer`, `ListFilterBar`, `MultiSelectFilterPill`, `list-filter-*`, `export-*`, `ListCellEnhancer` (dead), Payload's table and pagination.

**Layout:**

```
PageHeader: Content
            Blogs 312                         [List|Table] [Display] [Export] [⋯] [New blog]
Toolbar:    All 312  Drafts 41  Scheduled 1  Published 270   [Author is Ana ×] [+ Filter]   [Search blogs  /]

List layout (default for draft-enabled collections, Phase 5):
  ▸ ◷ Scheduled 1
      ◷  FedRAMP-ready base images, explained          Compliance  Oct 22, 9:00 AM   MI   12 min ago
  ▸ ◐ Published, with changes 1
      ◐  BusyBox in production images: the risk…       Security                       RM AR  Yesterday
  ▸ ◌ Drafts 4
    ☑ ◌  What an SBOM tells you, and what it does not  Security                       AR     3 hr ago
  ▸ ● Published 27
                         ╭ 2 selected │ Duplicate  Delete │ esc ╮   floating selection bar

Table layout (Phase 1, and the only layout for collections without drafts):
            ☐  Title                 Authors   Categories  Status        Published     Updated
            ☐  Zero CVE images…      Ana R.    Security    ✓ Published   Oct 12, 2026  2h ago
Footer:     1 to 25 of 312                                   [25 ▾]  ‹  ›
```

The List and Table switch is saved per user and collection (`users.preferences.listLayout[collection]`). Groups in the List layout come from one count query per status and one page of rows per open group, so a group is never split by pagination; each group shows "Show 25 more" at its end.

**Columns:** default from `admin.defaultColumns`, else `useAsTitle` plus `updatedAt`. Visibility, order and widths saved per user (`users.preferences.columns[collection]`, same store as `lib/column-widths.ts`). Cells chosen by field type and the custom cell registry (`03` §B).

**Search:** across `admin.listSearchableFields`, else `useAsTitle`. Debounced 250ms, kept in the URL as `?q=`.

**Filters (Phase 5):** pills from `LIST_FILTER_FIELDS` (`list-filter-config.ts`) plus status and date presets. URL keeps `where` in Payload's query string format.

**Saved views (Phase 5):** named combinations of search, filters, sort and columns, stored in `users.preferences.savedViews` (`lib/saved-views.ts`).

**Bulk actions (Phase 5):** shown when rows are selected: Duplicate as draft (create permission, not on auth collections), Delete (delete permission). Both behind ConfirmDialog. Delete uses `payload.delete({ where: { id: { in } } })` as the user.

**Export (Phase 5):** Drawer with column checklist, date presets and format (CSV, XLSX), calling `GET /api/:collection/export` (admin and editor only, `build-export-endpoint.ts`). Only on exportable collections (`exportable-collections.ts:20-38`).

**Per-collection list chrome (above the table), from `beforeListTable` today:**

| Collection | Chrome |
|---|---|
| leads | S-30 |
| partner-applications | Export CSV button (`/api/partner-applications/export-csv`) |
| pageRegistry | Kind and override filter pills (S-34) |

**Loader:** `listDocuments({ collection, page, limit, sort, where, q, draft: true, depth: 0, select })` returning rows plus totals. Relationship titles resolved in one batched query per relation (port of `lib/related-docs.ts`), never N+1.

**States:** "No blogs yet" with "New blog"; "No results" with "Clear filters"; immutable collections show no "New" button (`leads`, `consentLog`, `audit-log`, etc. per access).

**Keyboard:** `/` focuses search · J and K move row focus · Enter opens · X selects · ⌘A selects all on page · C creates (when allowed) · Esc clears selection.

**Acceptance:** sort, search, pagination and column choices survive reload; rows match `payload.find` as the same user; a role without read access gets S-51.

---

## S-11 Create document

Same layout as S-12 with an empty document. Title "New blog". Primary actions: "Save draft" and "Publish" for draft-enabled collections, "Create" otherwise. After first save the URL changes to `/[id]` without a page load. Default values come from the field config. Quick create from relationship fields uses `QuickCreateDialog` (`packages/ui`) instead of this screen.

---

## S-12 Edit document

**Replaces:** Payload's document view and every edit-view component: `DocHeader`, `CmsPublishButton`, `DocKebabExtras`, `PurgePageButton`, `PublishChecklistBanner`, `PublishOverrideGuard`, `SlugRequirementGuard`, `PreviewMenu`, `CopyPreviewLink`, `SchedulePublishDialog`, `SavedStateIndicator`, `SaveShortcut`, `ScrollToInvalidField`, `FieldDescriptionTooltip`, `DocSidebarResizer`, `EditorFullscreenToggle`, plus all field components (see `03`).

### Layout

```
┌ Document header (54, sticky, no divider) ─────────────────────────────────────────────────────────────┐
│ Blogs / Zero CVE images for…  ● Published, changes   Unsaved changes   [Preview ▾] [Save draft] [Publish ▾] [⋯] │
├ Banner stack ──────────────────────────────────────────────────────────────────────────────┤
│ (lock) Ana is editing this blog. You can view it; editing is off.        [Take over]        │
│ (blockers) 1 issue blocks publishing: Slug is empty.                     [Show]            │
├ Writing column (max 680, centred) ──────────────────────┬ Inspector (320) [Details|SEO|Checklist] ┤
│ Title                                                    │ Publishing                       │
│ Abstract                                                 │ URL                              │
│ Hero image                                               │ Search appearance                │
│ Body (rich text editor)                                  │ Social                           │
│ FAQs                                                     │ Keywords                         │
│ Related content                                          │ Structured data                  │
│ …                                                        │ Advanced                         │
│                                                          │ Checklist                        │
└──────────────────────────────────────────────────────────┴──────────────────────────────────┘
```

### Document header

| Element | Behaviour | Source today |
|---|---|---|
| Breadcrumb | Collection plural label (link to S-10) / live title from `useAsTitle` | DocHeader |
| StatusBadge | Draft, Published, Published with changes, Scheduled (§2.3 of the design system) | DocHeader |
| SaveStatus | Unsaved changes, Saving…, Saved n min ago, Save failed (retry) | SavedStateIndicator |
| Meta tooltip on the title | Word count, reading time, created, updated, id (copy) | DocHeader |
| Preview SplitButton | Main: toggle preview pane. Menu: Open in new tab, Share link…, Manage share links | PreviewMenu, CopyPreviewLink |
| Save draft | Secondary button, ⌘S. Saves with `draft: true`. Disabled when not modified. | CmsPublishButton, SaveShortcut |
| Publish SplitButton | Main: opens the publish popover with "Publish now" selected (enabled when the user can update and there is something to publish). Menu: Schedule… (⌘⇧S, opens the popover with "Schedule" selected), Unpublish (only if published) | CmsPublishButton, SchedulePublishDialog |
| Save (no drafts) | Primary "Save" for collections without drafts | Payload default |
| More menu | Versions, Duplicate, Discard changes, Purge page from cache, Copy link to this document, Copy API URL, Copy id, Delete | DocKebabExtras, PurgePageButton |

Users collection header adds: Disable user, Reassign content (admin only, not on self). See S-32.

Publish rules (from `CmsPublishButton.tsx:93-124`): Publish enabled when `canPublish && (modified || hasUnpublishedVersion || !hasPublishedDoc) && !uploading`. Unpublish enabled when `canPublish && hasPublishedDoc && drafts`. `canPublish` comes from the update access rule asked with `_status: 'published'`, the same check Payload makes; it is false for authors (D-6), who see Save draft only.

### Banner stack (top of content, in this order)

1. **Lock:** another user holds the lock (`payload-locked-documents`, 300s duration). Read-only form plus "Take over" (writes the lock to the current user, the other editor sees "Your editing was taken over by …"). Lock is acquired on open, refreshed every 60s while the form is modified, released on leave.
2. **Publish blockers:** from the checklist (slug present without spaces; valid JSON-LD override). Only on the 9 gated collections.
3. **Validation summary:** after a failed save, "3 fields need attention" with links that scroll to and focus each field (replaces `ScrollToInvalidField`).
4. **Immutable notice:** for collections where update is denied to everyone (leads, partner-applications, deal-registrations, career-applications, consentLog, audit-log, webhooks_dead_letter): "Leads cannot be edited. They are kept as submitted." (replaces `LeadsImmutableBanner`, `LockedReason`).

### Content column

- Optional cover first (the collection's hero image field, in a 6px raised shell), then the `useAsTitle` text field as the document title in `--type-doc-title` without a visible label, then the abstract field (when the collection has one) in `--type-doc-lead`.
- Property chips under the lead (Phase 4): authors, category, display date and slug as chips that open a popover editor, plus "+ Property" for any other sidebar field the user wants pinned. They edit the same form values as the inspector.
- Other main-position fields render in config order through the form engine (`03` §A).
- Tabs render as segmented `Tabs`; collapsibles as `Collapsible`; groups as `Section`.
- Field descriptions show below the label (replaces `FieldDescriptionTooltip`).
- Focus mode (⌘⇧F): hides sidebar, header actions and rail, centres the editor (replaces `EditorFullscreenToggle`; the old ⌘/ binding is not reused).

### Inspector

Fields with `admin.position: 'sidebar'`, shown in a tabbed inspector instead of a stack of cards. Phase 1 shows a single Details tab. From Phase 4 the tabs are Details (Publishing, URL, Advanced), SEO (search preview first, then Search appearance, Social, Keywords, Structured data) and Checklist (with a count of open items). Sections inside a tab have a `--type-heading` title and no card. The section grouping for the SEO22 collections:

| Section | Fields (config names) |
|---|---|
| Publishing | `displayPublishedAt`, `contentUpdatedAt` (read only), `createdBy` (read only, D-6), `featured`, `pinned`, upcoming scheduled jobs |
| URL | `slug`, `permalink`, `urlChangeHistory`, `redirect` |
| Search appearance | `seoHealthScore`, `seoTitle`, `seoDescription`, `seoIndexable`, `serpPreview` |
| Social | `socialCard` |
| Keywords | `keywords` |
| Structured data | `schemaPreview` |
| Advanced | `canonicalUrl`, `headTags`, `seoAdvanced`, `tocDepth` |
| Checklist | publish checklist items with status icons; re-fetched after every save (`GET /api/:collection/:id/checklist`) |

Collection-specific sidebar fields not in this table (for example `journeyMirrorWarning` on blogs) go in the section named in `03` §C for that collection. The inspector is resizable (280 to 440px, ← and → when the handle is focused) and collapsible; width and collapsed state are saved per user.

### Preview pane

- Toggle from the Preview SplitButton or ⌘⇧P. Splits the content area 50/50 with `SplitPane`.
- iframe `src` = `/api/preview/redirect?collection=…&docId=…` (mints a 24h token, `preview.ts:261-333`). Reloads after each successful save.
- Breakpoint switcher: Mobile 375, Tablet 768, Laptop 1280, Desktop 1440 (from `lib/wire-preview.ts:11-16`). The iframe scales to fit.
- Only on previewable collections (`lib/preview/paths.ts:19-31`) and only once the document has a slug.

### Share link dialog

Title "Share a preview link". TTL segmented control (1 hour, 1 day, 3 days, 7 days, 30 days; default 1 day), optional label (120 characters), "Create link" → `POST /api/preview/token`. Result row with Copy. "Manage share links" lists this document's `previewAudit` rows (label, created by, expires, status) with Revoke (`POST /api/preview/revoke`, admin and editor).

### Publish popover

Opens from the Publish button or ⌘↵ instead of a modal; ⌘↵ inside it confirms. Shell form (design system §7.4), 380px. Options as a radio list: "Publish now" (with the live URL it goes to) and "Schedule" (date and time with `DateTimePicker`, timezone select). Below the options, the checklist summary ("1 checklist warning. Publishing is still allowed." or the blocker). Footer: ⌘↵ hint, Cancel, and the ink action button that reads "Publish" or "Schedule". A toast confirms with Undo where the action allows it. Authors (D-6) never see the popover; they get Save draft only.

### Schedule details

Replaces `SchedulePublishDialog` (the Schedule option of the publish popover, plus Unpublish scheduling from the More menu). Fields: Action (Publish or Unpublish), Date and time (DateTimePicker, min now), Timezone (defaults to the user's). Lists upcoming schedules for this document from `payload-jobs` (`taskSlug: schedulePublish`, `waitUntil > now`, matching `input.doc`) with Cancel. Action: `scheduleDocument` queues `payload.jobs.queue({ task: 'schedulePublish', input: { type, doc, user: user.id, timezone }, waitUntil })`; cancel deletes the job row (not the empty-job workaround Payload's handler uses).

### Unsaved changes

Navigating away with changes opens ConfirmDialog "Discard unsaved changes?" (Discard, Keep editing). Closing the tab triggers the browser's own prompt.

### Actions (server)

`saveDocument`, `publishDocument`, `unpublishDocument`, `scheduleDocument`, `cancelSchedule`, `duplicateDocument`, `deleteDocument`, `acquireLock`, `refreshLock`, `releaseLock`, `takeOverLock`. All pass the user, `overrideAccess: false`, `overrideLock: false`. Save errors return `{ path, message }[]` mapped onto fields.

### Keyboard

⌘S save draft (or save) · ⌘⇧S schedule · ⌘↵ opens the publish popover, ⌘↵ again publishes (with confirm when SEO lengths are off) · ⌘⇧P preview pane · ⌘⇧F focus mode · ⌘. toggle inspector · Esc closes overlays.

### Acceptance

- Saving a document without touching it produces no change in the stored JSON (round-trip e2e per collection).
- A user without update permission sees the whole form read-only with the reason in a Banner.
- Two browser sessions on the same document: the second sees the lock banner; takeover works both ways.

---

## S-13 Version history

**Replaces:** Payload versions view (and the dead `CmsVersionsView`).

**Layout:** PageHeader "Versions" with breadcrumb back to the document. Table: version date and status (Draft or Published), with a "Current" badge on the latest. Payload versions do not record who saved them, so there is no author column. Row click opens S-14.

**Loader:** `payload.findVersions({ collection, where: { parent: { equals: id } }, sort: '-updatedAt' })` as the user. Max 25 per document (100 for drafts-only collections, unlimited for legalDocuments, per config).

## S-14 Compare and restore version

**Layout:** two columns, "This version" and "Current", field by field. Changed fields highlighted; unchanged fields collapsed behind "Show 12 unchanged fields". Rich text diff shows paragraphs added, removed and changed (text-level diff inside a paragraph). Primary "Restore this version" → ConfirmDialog → `payload.restoreVersion({ collection, id: versionId })` as the user, then back to S-12.

---

## S-15 Global edit

Same anatomy as S-12 without slug, preview, publish split or locking differences beyond Payload's. Globals with versions (siteSettings, legal, seoDefaults) get "Versions" in the More menu and S-13/S-14 equivalents under `/studio/globals/[global]/versions`. `seoDefaults` hosts `GlobalSchemaView` and `SchemaOverrideField` (S-34 components).

Access: siteSettings, legal and seoDefaults are update-admin only; impactStats and spotlights are admin and editor (`research/workflows-and-roles.md` §1.6).

---

## S-20 Media library

**Replaces:** Payload's media list, `MediaCell` (list use), `PdfThumb` (list use).

**Layout:** PageHeader "Media" with Upload button. Toolbar: search (filename, alt), folder filter, type filter (Images, PDFs, Video, Other), Grid or List toggle. Left: folder list (from the `folder` field values). Main: grid of 160px tiles (thumbnail, filename, size) or the standard DataTable. Drop files anywhere on the page to upload.

**Upload:** XHR `POST /api/media` per file with progress, up to 3 in parallel. Filename rules, size limits and SVG sanitising happen on the server (`Media.ts` beforeValidate). Errors per file inline.

**Keyboard:** arrow keys move through the grid, Enter opens, Space toggles selection, Delete deletes selected (with confirm).

**Variants:** `emailAssets` uses the same library (PNG, JPEG, GIF only, admin write). `resumes` uses the plain list (private files, no thumbnails, open through access-controlled URL).

## S-21 Media detail

**Replaces:** `MediaSelfChrome`, `MediaSizeWarningField`, Payload's upload edit view.

**Layout:** left 60%: large preview with focal point picker (click to set `focalPoint`), Replace file, Download. Right: Alt text (required unless Decorative), Decorative, Caption, Credit, Folder, filename with Rename (`POST /api/media/:id/rename`), dimensions, size, sizes generated (thumb 400, card 800, hero 1600), size warning (over 2MB or 4000px), "Used in" list (documents referencing this media; Phase 5).

## S-22 Media picker

**Replaces:** `MediaBrowseDialog`, dead `MediaPicker`.

**Layout:** Dialog xl. Tabs: Library (grid with search, folder and type filters, infinite scroll, no 24-item cap), Upload (drop zone), From URL (`POST /api/media-ingest-url`). Selected tile shows a check and accent ring. Footer: "Insert" or "Select" (primary), Cancel.

---

## S-30 Leads

**Replaces:** `LeadsImmutableBanner`, `LeadsCsvTruncationBanner`, `DsarActionsPanel`, `FlaggedLeadsTab`, `LeadContactCell`, `LeadSyncCell`.

**List:** tabs "All leads" and "Flagged" (honeypot not empty or Turnstile failed). Columns: Contact (email and name from `fields`), Form, Source page, Synced (steps with tooltip breakdown), Created. Immutable notice above the table. No "New" button.

**Header actions:** Export CSV (admin, editor; `GET /api/leads/export-csv` with form and date filters; shows a warning Banner when the response has `x-leads-truncated`, read from the response itself instead of patching `window.fetch`). "Privacy requests" (admin) opens a Drawer: find by email (`GET /api/leads/dsar/find`), results, "Delete all data for this email" (`POST /api/leads/dsar/delete`) behind a typed confirmation (type the email).

**Detail:** read-only KeyValue of the lead, consent, attribution, sync status per destination with "Retry failed syncs" (admin; `POST /api/leads/:id/retry-sync`). Delete (admin).

**Flagged tab:** bulk delete (admin), using `payload.delete` per id as the user.

## S-31 Applications and registrations

partner-applications, deal-registrations, career-applications: read-only lists and details (no update for anyone). Partner applications have Export CSV (`/api/partner-applications/export-csv`). Career applications show the linked resume (S-20 private file). Resumes: list of files, update and delete for admin, editor, hr.

## S-32 Users

**Replaces:** Payload users list and edit, `DisableUserAction`, `ReassignContentAction`.

**List:** Name, Email, Roles (badges), Status (Enabled or Disabled), Last updated. "Invite user" (admin) opens a Drawer: name, email, roles, temporary password (generated, copyable once).

**Detail:** name, email, roles (admin only), enabled (admin only), API key section (admin; enable, regenerate, with a warning). More menu: Disable user (admin, not self; ConfirmDialog; `payload.update({ enabled: false })`), Reassign content (admin; Dialog to pick from and to author; `POST /api/users/reassign-content`). Non-admins can only open their own record, which redirects to S-04.

## S-33 Integrations

**Replaces:** `AuditTrail`, `CollectionsMultiSelect`, `ClarityConfigNote`, `EventsMultiSelect`, `FormSlugsMultiSelect`, `HealthBadge`, `TestButton`, `MentionRowLabel`, dead `AnalyticsTab`.

**Detail layout:** header with HealthBadge (last 24h, `GET /api/integrations/:id/health`) and "Send test event" (`POST /api/integrations/:id/test`). Sections: Connection (kind is fixed after create; secrets show the masked sentinel and are sent back unchanged unless replaced), Routing (events, collections, form slugs multi-selects, minimum lead score), per-kind config, Recent failures (audit trail, `GET /api/integrations/:id/audit`). Admin only.

## S-34 Page registry and schema manager

**Replaces:** `PageSchemaFilters`, `CurrentSchemaView`, `SchemaAllowBlock`, `SchemaBlockBuilder`, `SchemaHistory`, `SchemaOverrideField`, `SchemaSidebarInfo`, `GlobalSchemaView`.

**List:** default sort `order`; filter pills Kind (static, collection) and Override (has override, none). No create (rows are seeded).

**Detail:** read-only identity (path, title, kind, order, backing collection). Tabs: Live schema (per block JSON-LD with lint results, `GET /api/pageRegistry/live-schema`), Override (paste or upload JSON-LD, validate, 16KB cap; admin and seo), Builder (starter blocks by type), History (override history per `@type`), Allowed types (reference). Sidebar: override dates and status.

## S-35 Email signatures and templates

Signatures: standard form plus "Rendered signature" preview card (`GET /api/emailSignatures/:slug/render`). Templates: HTML in `CodeEditor` with a live sandboxed iframe preview beside it (`SignatureTemplatePreview`), "Default template" checkbox (server clears other defaults).

## S-36 Broken links

List: URL (clickable), Status (readable HTTP status and how long broken), Source page (link to its Studio edit page and live page), First seen, Last checked. Detail read-only. Delete admin only.

## S-37 Redirects

List: From, To, Status (301, 302, 410), Source (manual, slug-change), Hits, Staleness pill (hot, active, cold, never hit). Rows with source `slug-change` show `from`, `to` and `status` read-only with the reason. "To" hidden when status is 410. Bulk import (Phase 5): Drawer with CSV paste or upload, dry run preview, then import (`POST /api/redirects/import`).

## S-38 System records

audit-log, consentLog, searchLog, previewAudit, analyticsCache, webhooks_dead_letter: read-only lists and KeyValue details using the generic engine. previewAudit allows Revoke (sets `revokedAt`). Delete where access allows (admin). JSON fields shown in a read-only CodeEditor.

---

## S-40 Analytics

**Replaces:** `Analytics/*` (15 files).

**Layout:** PageHeader "Analytics" with date range and refresh. Rows: KPI cards with change versus previous period; traffic trend; top pages and top queries (BarList); countries; CTR versus position scatter; position histogram; Core Web Vitals (CrUX); realtime users widget (polls `GET /api/dashboards/ga4-realtime` every 30s while visible).

**REST:** `GET /api/dashboards/ga4-overview`, `/gsc-overview`, `/crux`, `/ga4-realtime` (admin, editor).

## S-41 Content insights

**Replaces:** `ContentInsights/*` (11 files). Panels: decay queue, striking distance, low CTR, cannibalisation, orphan pages, leaderboards, indexation rollup, publishing velocity, attribution. Each panel is a Card with a table and a link to the document in Studio. `GET /api/content-insights[?refresh=1]`.

## S-42 Lead attribution

**Replaces:** `LeadAttribution/*` (4 files). Date range, leads per day bars, split tables by channel, campaign and landing page. `GET /api/lead-attribution`.

## S-43 Cache

**Replaces:** `cache/CacheView`, `CacheClient`. Admin only. Sections: Purge a page (search with `GET /api/cache-search`, purge selected), Purge by path or tag (custom), Purge everything (danger, typed confirmation). `POST /api/cache-purge`.

---

## S-50 Component lab

Admin only, noindex, not in navigation. Left list of components; right: every variant and state of the selected component in both themes side by side, keyboard notes, and the five key compositions from Phase 0. The lab is the reference for UI review.

## S-51 Not found, forbidden, error, narrow window

- **Not found:** "This page does not exist." with Home.
- **Forbidden:** "You do not have access to this." with the reason when known (role name) and Home.
- **Error:** "Something went wrong." with Retry and the Sentry event id (copyable). Logged to Sentry.
- **Narrow window (under 1024px):** "Studio needs a wider window." with a link to the published site.
