# Studio UI and functional issues register

Every known bug, broken behaviour and fragile workaround in the current Payload admin, with how Studio resolves it, which task owns it and how to prove it is gone. Compiled on 2026-10-21 from the admin code, `docs/operations/INCIDENTS.md`, the git history since April 2026 and the project's incident notes. Ids `UI-001` to `UI-162` are stable; cite them in commits and reviews.

How to use it:

- Before building a screen or component, read the rows whose Task column names your task.
- A task is done only when every row it owns passes its Acceptance check.
- Rules the Resolution column cites (for example "contract §5") live in `09-BEHAVIOUR-CONTRACT.md`.
- **Fate** says how the issue ends:
  - **Gone by design:** the cause was patching Payload's DOM, and Studio owns its markup, so the cause cannot exist. Acceptance is the boundary rule in row UI-144.
  - **Fixed in Studio:** Studio implements the behaviour correctly; the Acceptance check proves it.
  - **Backend:** the cause is in Payload config, hooks, endpoints or data. Studio cannot fix it alone. It is a follow-up task (F-1 to F-16 at the end of this file), and Studio must not make it worse.
  - **Keep:** already fixed in the backend; Studio must keep the fix (the Acceptance check guards it).

## A. Navigation and shell

| Id | Issue today | Fate | Studio resolution | Task | Acceptance |
|---|---|---|---|---|---|
| UI-001 | Sidebar starts collapsed on laptops; fixed with timers racing Payload's NavProvider | Gone by design | Sidebar state is Studio state: expanded by default from 1280px, collapsed by default from 1024 to 1279px, user choice saved in `sidebarCollapsed` (contract §13) | T1.10 | At 1440 and 1280 a new user sees the expanded sidebar; at 1100 it is collapsed; reload keeps the user's choice |
| UI-002 | Collapse button did nothing on desktop | Gone by design | One toggle button and ⌘\ | T1.10 | Clicking collapse and pressing ⌘\ both toggle at 1440 |
| UI-003 | Two or three nav togglers stacked in one corner | Gone by design | Exactly one toggle, in the brand row | T1.10 | Only one element with the label "Collapse sidebar" or "Expand sidebar" exists |
| UI-004 | Nav toggler shows through open drawers | Gone by design | Drawers and dialogs render in the top layer above the shell | T0.5 | Open any drawer: no shell control is visible above its backdrop |
| UI-005 | Empty bands in the sidebar; user menu floating mid-column | Gone by design | Sidebar layout in contract §15 S-00: brand row, search, scrollable nav, user row pinned to the bottom | T1.10 | User row sits at the bottom of the window at every height from 700 to 1400px |
| UI-006 | Command palette rendered at 0x0 on the dashboard | Gone by design | Palette mounts once in `AppShell`, outside any hideable container | T6.5 | ⌘K opens a visible palette on every Studio route |
| UI-007 | Brand mark clipped to "Cl..." | Gone by design | `BrandMark` has its own fixed size | T1.10 | Mark and wordmark fully visible in expanded and collapsed sidebars |
| UI-008 | Draft badges injected into Payload's DOM, matched by label, re-injected every 3s | Fixed in Studio | Draft counts come from the shell loader, keyed by collection slug, cached per user for 60s (contract §7.6) | T1.10 | Renaming a collection label does not lose its badge; badges show on the active item |
| UI-009 | Action components remount and refetch on every navigation | Gone by design | Shell lives in the `(app)` layout and persists across client navigations | T1.10 | Navigating between two lists triggers no shell loader request (network panel) |
| UI-010 | Nav group collapse state not remembered | Fixed in Studio | `navGroupsClosed` preference (contract §13) | T1.10 | Close a group, reload: it stays closed |
| UI-011 | Custom views rendered without chrome, or with a double sidebar | Gone by design | Every route under `(app)` gets the shell from one layout | T1.10 | Analytics, cache and every list show exactly one sidebar |
| UI-012 | Whole admin down while `/api/health` is green (global without migration) | Backend | Follow-up F-1: health check reads every global. Studio adds nothing that could repeat it | follow-up | F-1 done before cutover |
| UI-013 | Function in `importMap.generators` breaks every admin page | Backend | Studio does not use Payload's import map | T1.8 | `src/studio` never imports `importMap.js` (boundary check) |
| UI-014 | Dev server strips field overrides from `importMap.js` | Backend | Not used by Studio; stays a trap for the old admin until retirement | follow-up | None for Studio |
| UI-015 | Cold-compile 500 and next/font breaking the admin layout | Fixed in Studio | Studio's root layout is separate; fonts load through `geist` in the Studio layout only | T0.2 | `next dev` cold start renders `/studio/login` with no error |
| UI-016 | Breadcrumbs, title row and doc tabs hidden by CSS | Gone by design | Document header shows breadcrumb and title; Versions is in the More menu and has its own route (S-13) | T4.1, T4.8 | Breadcrumb visible on every document; Versions reachable in two clicks |
| UI-017 | Departmental users land on a dashboard that does not apply to them | Fixed in Studio | Single-domain users are sent to their only collection after sign in (contract §15 S-01) | T1.11 | An `hr`-only user signs in and lands on Jobs |
| UI-018 | Admin was indexable | Keep | Studio layout sets `robots: noindex, nofollow` | T0.2 | `<meta name="robots" content="noindex, nofollow">` on every Studio page |
| UI-019 | Skip link searched Payload markup for a main landmark | Gone by design | `AppShell` renders `<main id="studio-main">`; skip link is the first focusable element | T1.10 | First Tab on any page focuses "Skip to content", Enter moves focus into main |

## B. Lists

| Id | Issue today | Fate | Studio resolution | Task | Acceptance |
|---|---|---|---|---|---|
| UI-020 | N+1 relationship lookups (about 75 requests for 25 rows) | Fixed in Studio | One batched title query per related collection, as the user (contract §7.4) | T1.15 | A 25-row blogs list makes at most one query per related collection (unit test counts calls) |
| UI-021 | Batched lookups truncated at Payload's default limit of 10 | Fixed in Studio | Batch queries pass `limit` equal to the number of ids and `pagination: false` | T1.15 | 25 distinct authors on a page all resolve |
| UI-022 | Column picker crashed | Gone by design | Columns are Studio state | T1.15 | Column picker opens and toggles on every collection |
| UI-023 | Columns cannot be reordered | Fixed in Studio | Display popover: drag or Alt+Arrow to reorder (contract §7.2) | T5.2 | Reordered columns persist after reload |
| UI-024 | Sorting crashed React (DOM rewritten by an observer) | Gone by design | No DOM patching | T1.15 | Sort every column twice on blogs with no console error |
| UI-025 | Status chips coupled to Payload cell markup | Gone by design | `StatusBadge` from the status model (contract §1) | T1.15 | Status column shows the right glyph and word for all four states |
| UI-026 | Column widths grafted on with inline `!important` | Fixed in Studio | Widths are Studio state, applied by the table (contract §7.2) | T5.2 | Resize, reload, width kept; no inline `!important` in `src/studio` |
| UI-027 | No list virtualisation | Fixed in Studio | Server pagination, page size at most 100; no virtualisation needed (contract §7.1) | T1.15 | 100-row page renders under 500ms server time |
| UI-028 | Bulk Edit probably does nothing | Fixed in Studio | Bulk edit is not offered in v1 (not used by editors; non-goal). Bulk actions are Duplicate, Delete, Publish, Unpublish (contract §7.5) | T5.2 | No "Edit" in the selection bar |
| UI-029 | Bulk duplicate serial, then a hard reload wipes its toast | Fixed in Studio | One server action, up to 4 in parallel, returns per-item results; list refreshes with `router.refresh()`, never a reload (contract §7.5) | T5.2 | Duplicate 10 rows: one toast with the result, no page reload |
| UI-030 | Bulk actions reloaded silently on failure | Keep | Per-item results with partial-failure toast (contract §7.5) | T5.2 | Forced failure on 1 of 3 shows "Deleted 2 of 3 blogs…" |
| UI-031 | No bulk publish or unpublish | Fixed in Studio | Added for users with publish permission (contract §7.5) | T5.2 | Editor publishes 3 drafts at once; author sees no Publish in the bar |
| UI-032 | Saved views dropped the search term | Keep | Saved view stores q, filters, sort, columns, layout | T5.2 | Saved view with a search restores it |
| UI-033 | Export drawer closed when picking a date preset | Gone by design | Menus inside dialogs use top-layer popovers from `packages/ui` | T5.2 | Pick each preset; drawer stays open |
| UI-034 | Export runs with `overrideAccess: true`; HR cannot export career applications | Backend | Follow-up F-2. Studio's Export calls the existing endpoint and shows its errors | follow-up | F-2 done before cutover |
| UI-035 | Leads "Create New" hidden by a CSS href match | Gone by design | New button follows create permission; S-30 never shows it (contract §15) | T5.3 | No New button on leads for any role |
| UI-036 | Leads CSV truncation detected by patching `window.fetch`; partner export uses `alert()` | Fixed in Studio | Export action returns `{ rows, truncated }`; banner from the response; errors in toasts | T5.3 | Truncated export shows the banner; no `window.fetch` override in `src/studio` |
| UI-037 | Cache search ignored a pasted URL | Keep | Cache search normalises a full URL to its path | T6.4 | Pasting `https://www.cleanstart.com/blog/x` finds `/blog/x` |

## C. Document edit and publish

| Id | Issue today | Fate | Studio resolution | Task | Acceptance |
|---|---|---|---|---|---|
| UI-038 | ⌘S publishes live instead of saving a draft | Fixed in Studio | ⌘S only ever saves a draft (or saves, without drafts). Publishing always goes through the publish popover (contract §5, §12) | T1.16, T4.1 | e2e: on a published blog, edit, ⌘S, then load the live page: unchanged |
| UI-039 | ⌘⇧S also fires Publish | Fixed in Studio | ⌘⇧S opens the popover with Schedule selected; it never publishes. Every shortcut checks all modifiers exactly (contract §12) | T4.2 | e2e: ⌘⇧S opens the popover; nothing is published |
| UI-040 | Shortcut sheet wrong | Fixed in Studio | Sheet generated from `shortcuts.ts` (contract §12) | T6.6 | Unit test: every binding in `shortcuts.ts` appears in the sheet and vice versa |
| UI-041 | Unpublish unreachable on 12 draft-enabled collections | Fixed in Studio | Publish menu is generic for every draft-enabled collection (contract §5) | T4.2 | Unpublish available on categories, forms and signatureTemplates for an editor |
| UI-042 | Checklist banner may never appear (3-segment root endpoint) | Fixed in Studio | Checklist read through a Studio loader calling the checklist logic as the user, not the REST route (contract §5.4) | T4.6 | Checklist shows on a blog with an empty slug |
| UI-043 | "Publish anyway" works by hijacking clicks | Fixed in Studio | SEO length warning inside the publish popover (contract §5.3) | T4.6 | Long SEO title: popover shows the warning and "Publish anyway" |
| UI-044 | Slug guard disables Payload buttons by DOM mutation | Fixed in Studio | Blockers computed live from form values (contract §5.4) | T4.6 | Clearing the slug makes the popover's action unavailable with the reason, instantly |
| UI-045 | "Slug is required" on a pristine new document | Keep | Errors appear only after a save attempt or blur of that field (contract §8.3) | T1.16 | New document shows no errors until Save |
| UI-046 | Jump to first invalid field polls the DOM | Fixed in Studio | After a failed save, focus moves to the validation summary; each entry links to its field (contract §3.5) | T1.16 | Failed save: focus on summary; Enter on an entry focuses the field and opens its tab or collapsible |
| UI-047 | Two schedule dialogs could stack | Gone by design | One popover instance | T4.2 | Pressing ⌘⇧S twice leaves one popover |
| UI-048 | Schedule edge cases (empty job on delete, needs PAYLOAD_AUTO_RUN, runs as scheduler) | Backend | Cancel deletes the job row directly (contract §5.2). Disable user and role change warn about pending schedules. Follow-up F-3 for the runner | T4.2, T5.4 | Cancel leaves no job row; disabling a user with schedules shows the warning |
| UI-049 | Publish hung for minutes | Keep | Publish action has a 30s client timeout with "Still publishing…" after 5s; never blocks typing | T4.2 | Slow publish shows progress text; UI stays responsive |
| UI-050 | Publish purged the cache before its commit | Keep | Studio publishes through Payload; hooks own revalidation | T4.2 | e2e: publish a new page; it returns 200 on the web within 60s |
| UI-051 | Live pages not updated after edits; pages and podcastEpisodes lack a revalidate hook | Backend | Follow-up F-4 | follow-up | F-4 done before Phase 4 exit |
| UI-052 | Old post opened with a backdating warning | Keep | Warnings only after the user changes the date | T4.12 | Opening an old blog shows no warning |
| UI-053 | No autosave, no stale-edit banner, no local recovery | Fixed in Studio | No autosave (non-goal), but: local recovery copy, stale-edit detection on save, offline handling (contract §3) | T4.9, T4.10 | Kill the tab with unsaved edits, reopen: banner "You have unsaved changes from 2:31 PM." with Restore |
| UI-054 | No trash; deletes are permanent | Fixed in Studio (copy) | Delete confirm says it cannot be undone and lists live documents (contract §11.4). Trash is out of scope (non-goal) | T4.7 | Confirm body names the live count |
| UI-055 | Bulk scripts re-dated articles | Keep | Studio never writes `contentUpdatedAt` except through the field | T4.12 | Saving a draft does not change `contentUpdatedAt` |
| UI-056 | SEO title and description silently mirror the document title | Fixed in Studio | Studio never writes `seo.title` or `seo.description` automatically; an empty value shows the title as placeholder text (contract §8.6). T4.5 first confirms `apps/web` falls back to the title when they are empty; if it does not, stop and ask | T4.5 | Retitling a post leaves `seo.title` unchanged in the saved JSON |
| UI-057 | Disable user and Replace file end in a hard reload | Fixed in Studio | `router.refresh()` and local state; toasts survive | T5.4, T2.9 | Replace a file: toast stays, no reload |
| UI-058 | Dead custom edit-view shell in the old admin | Backend | Removed in the retirement plan (T7.5) | T7.5 | None for Studio |
| UI-059 | Publish gate shallow (two blockers, nine collections) | Fixed in Studio (visibility) | Checklist shows every check with status; blockers unchanged (no new rules, non-goal) | T4.6 | Checklist tab lists every check |

## D. Fields and forms

| Id | Issue today | Fate | Studio resolution | Task | Acceptance |
|---|---|---|---|---|---|
| UI-060 | Select dropdown clipped inside array rows | Gone by design | All popovers in the top layer (contract §8.1) | T0.5 | Select inside an array row opens fully visible |
| UI-061 | Custom fields ignore read-only and disabled | Fixed in Studio | Every renderer takes `readOnly` from one source: field access, document permission, lock state (contract §8.2) | T1.13 | Read-only fixture: every field type renders read-only; e2e with a read-only role |
| UI-062 | FAQ bulk paste crashed and wrote "[object Object]" | Keep | Bulk paste writes plain text to text fields and Lexical JSON to rich text fields only | T4.12 | Paste 5 Q and A pairs into FAQs; saved JSON matches fixture |
| UI-063 | FAQ editor allowed stripped features; CSS leaked | Fixed in Studio | FAQ answer uses the FAQ editor config (`04`) | T3.6 | FAQ answer toolbar lacks headings and images |
| UI-064 | FAQ bulk paste injected into Payload's array header | Gone by design | Button in the array field header slot | T4.12 | Button present without observers |
| UI-065 | Per-field copy and paste failed silently | Fixed in Studio | Not offered (removed today; non-goal) | none | None |
| UI-066 | Required asterisk needs a custom label | Fixed in Studio | Required and optional markers from contract §8.3 | T1.13 | Optional fields show "Optional"; required show nothing |
| UI-067 | Hidden fields missing from form state | Fixed in Studio | Hidden fields stay registered with their loaded value and are sent back unchanged (contract §8.4) | T1.12 | Saving a document never drops a hidden field's value |
| UI-068 | Integration secrets masked on internal reads | Keep | Secret fields show the sentinel `SECRET_MASK_SENTINEL` and send it back unchanged unless replaced (contract §8.7) | T5.5 | Saving an integration without touching a secret keeps it working (Test passes) |
| UI-069 | OG image asked for a typed Media id | Keep | Upload field with picker | T4.5 | Social card section uses the picker |
| UI-070 | Canonical and topic endpoints 403 (`user.role`) | Keep | Fixed in commit 5c12fb1a; Studio calls them as the user | T4.5 | Keywords and Canonical sections load for an editor |
| UI-071 | Schema add-ons unreachable | Backend | Follow-up F-5 (decide whether to expose); Studio renders the field when `admin.hidden` is removed | follow-up | None until F-5 |
| UI-072 | Structural fields still rendered by Payload | Gone by design | Studio renders every structural field (T2.2 to T2.4) | T2.2 | No Payload component in `src/studio` (boundary check) |
| UI-073 | JSON field is a plain textarea that once clobbered edits | Fixed in Studio | CodeMirror JSON editor, parse on blur, invalid JSON shows an error and is not saved (contract §8.5) | T1.13 | Invalid JSON blocks save with "Invalid JSON on line 3." |
| UI-074 | Events users' edits to restricted form fields vanish silently | Fixed in Studio | Fields without update access render read-only with "Only admins can change this." (contract §8.2) | T1.13 | Events role sees restricted form fields as read-only |
| UI-075 | Gated download form coupled to field names | Backend | Follow-up F-6; Studio shows a warning on the content-gated form's field names section | T5.10 | Warning visible on that form |

## E. Relationships

| Id | Issue today | Fate | Studio resolution | Task | Acceptance |
|---|---|---|---|---|---|
| UI-076 | String ids caused "invalid relationships" | Keep | Ids keep their native type end to end (contract §8.8) | T2.5 | Unit test: numeric ids stay numbers through load, edit and save |
| UI-077 | Picker ignores `filterOptions` | Fixed in Studio | Search runs on the server and applies `filterOptions` for the field (contract §8.8) | T2.5 | Authors opted out of bylines never appear; a crafted out-of-filter id is rejected on save |
| UI-078 | Labels from a hard-coded hint table | Fixed in Studio | Labels from the related collection's `useAsTitle` in the schema | T2.5 | jobLocations shows city names with no table |
| UI-079 | Quick create limited; Authors field does not default to the current user | Fixed in Studio | Quick create wherever the user can create in the related collection; author defaulting stays a backend `defaultValue` (no new behaviour) | T2.5 | Quick create offered for categories when the user can create them |

## F. Rich text editor

| Id | Issue today | Fate | Studio resolution | Task | Acceptance |
|---|---|---|---|---|---|
| UI-080 | New links silently not created | Fixed in Studio | Create path per `04` link spec, restoring the selection before insert | T3.5 | e2e: select text, add link, save: link in saved JSON |
| UI-081 | Links vanished after a stale server form state | Gone by design | No server form-state round trips; editor state is client-owned (ADR-7) | T3.3 | Type and link while a save is in flight; nothing is lost (contract §3.3) |
| UI-082 | Editor can repaint blank before Save | Gone by design | Same as UI-081 | T3.3 | No blank repaint in the link e2e |
| UI-083 | Overlapping selection edited the inner link | Keep | `04` link rules | T3.5 | e2e for the overlap case |
| UI-084 | Path suggestion click closed the popover | Keep | Popover outside-click ignores detached targets | T3.5 | e2e clicks a suggestion |
| UI-085 | Clicking a link opened its URL | Fixed in Studio | Links are inert in the editor; ⌘-click opens in a new tab | T3.5 | Click on a link places the caret |
| UI-086 | Link button dead with the caret inside a link | Keep | Toolbar link button edits the current link | T3.5 | e2e |
| UI-087 | www links shown as External with nofollow | Keep | Internal detection per `04` | T3.5 | `www.cleanstart.com/x` is Internal |
| UI-088 | Link popover jumped, closed mid-edit, clipped | Gone by design | One popover per editor, top layer | T3.5 | Two editors on a page: popover stays with its editor |
| UI-089 | Stock editor UI hidden by CSS and observers | Gone by design | Studio hosts Lexical directly | T3.3 | No Payload editor component in `src/studio` |
| UI-090 | Slash trigger may stay in text mid-paragraph | Fixed in Studio | Slash menu removes exactly the typed trigger and query, wherever it is | T3.4 | "Text /tab" then Enter leaves "Text " plus a table |
| UI-091 | Inline code mark grew forever | Keep | `04` code rules | T3.6 | e2e |
| UI-092 | Rich paste hijacked code blocks; false toast | Keep | Rich paste skips code blocks; toast only after insert succeeds | T3.6 | e2e |
| UI-093 | Several document-level paste listeners compete | Fixed in Studio | Paste handled by the focused editor or field only, never on `document` (contract §8.9) | T3.6 | No `document.addEventListener('paste'` in `src/studio` |
| UI-094 | Inline-image controls dispatched twice | Keep | One handler per control | T3.6 | e2e |
| UI-095 | Fullscreen only on the first editor | Fixed in Studio | Focus mode is a document-level mode (T3.7) | T3.7 | Focus mode works from any rich text field |
| UI-096 | Toolbar scrolled away | Fixed in Studio | Formatting bubble follows the selection; no fixed toolbar | T3.4 | Bubble visible at the selection in a long document |
| UI-097 | Body editor capped at 85vh with inner scroll | Fixed in Studio | Editor grows with content; the writing column scrolls (contract §15 S-12) | T3.3 | Only one scrollbar in the writing column |
| UI-098 | Field label inside the editor card | Keep | Label above the editor like every field | T3.3 | Visual check in the lab |
| UI-099 | Messy migrated link data | Backend | Follow-up F-7 (data clean-up). Studio round-trips links unchanged | T3.2 | Round-trip test passes on migrated fixtures |

## G. Media and uploads

| Id | Issue today | Fate | Studio resolution | Task | Acceptance |
|---|---|---|---|---|---|
| UI-100 | Rename logic duplicated in two drifting components | Fixed in Studio | One `renameMedia(id, filename)` client in `features/media` used by every caller | T2.9 | grep: one call site of `/rename` in `src/studio` |
| UI-101 | Uploads kept junk export names | Keep | Uploads send `x-media-context-hint` (reuse `InlineImage/context-hint.ts`, SHARE) | T2.8 | Upload "WhatsApp Image 2026…jpg" from a blog: renamed by the hint |
| UI-102 | Upload stuck at 0% (non-ASCII header) | Keep | Header values are encoded with `encodeURIComponent` | T2.8 | Upload with title "Café’s guide" succeeds |
| UI-103 | One pasted image filled every empty media field | Fixed in Studio | Paste goes to the focused field only (contract §8.9) | T2.6 | Paste with two empty upload fields fills only the focused one |
| UI-104 | "Edit image" clicks a hidden stock button | Gone by design | Studio's own S-21 drawer | T2.9 | No hidden buttons |
| UI-105 | Replace file forces a reload | Fixed in Studio | Replace by XHR, then update local state | T2.9 | No reload; preview updates |
| UI-106 | Media delete has no usage check | Fixed in Studio | Delete shows "Used in n documents" with links and requires typing the count to confirm when n > 0 (contract §9.3) | T2.9 | Delete of a used image shows its usage list |
| UI-107 | Events role blocked from media rename and podcast thumbnail alt | Backend | Follow-up F-8 (access rule). Studio hides actions the user cannot perform (contract §2) | T2.9 | Events role sees no Rename; no 403 reaches the user |
| UI-108 | URL ingest hint copy is stale | Fixed in Studio | Copy: "Paste an image URL. Studio downloads it on the server and adds it to Media." | T3.6 | String matches |
| UI-109 | Webflow ids leaked into filenames and alt | Keep | Nothing in Studio writes ids into names | none | None |
| UI-110 | PDF tiles render broken without the canvas path | Keep | `PdfThumb` port renders page one with `pdfjs-dist` | T2.6 | PDF upload shows its first page |

## H. Preview

| Id | Issue today | Fate | Studio resolution | Task | Acceptance |
|---|---|---|---|---|---|
| UI-111 | Live preview hides the form | Fixed in Studio | Side-by-side preview pane (D-7) | T4.11 | Form and preview visible together at 1440 |
| UI-112 | Preview menu clicks hidden stock togglers | Gone by design | Studio's own Preview split button | T4.11 | None hidden |
| UI-113 | Every preview mints a token and writes an audit row | Fixed in Studio | One token per document per editing session, reused for reloads (contract §10) | T4.11 | Ten saves with the pane open write one previewAudit row |
| UI-114 | Preview 409 until slug saved; case studies not previewable; no revoke all | Fixed in Studio (copy) | Preview disabled with "Add a slug to preview this blog." until saved; case studies previewable once the web route exists (follow-up F-9); "Revoke all" in the share-link list | T4.11 | Strings match; Revoke all works |
| UI-115 | Share dialog kept a stale label after a failed mint | Keep | Dialog shows the error and no link | T4.11 | Forced failure shows the error |
| UI-116 | Edge cache could serve editors anonymous responses | Keep | Studio routes send `Cache-Control: private, no-store` | T1.10 | Header present on every Studio response |

## I. Locks and concurrency

| Id | Issue today | Fate | Studio resolution | Task | Acceptance |
|---|---|---|---|---|---|
| UI-117 | Stock locks; custom fields ignore read-only | Fixed in Studio | Lock model in contract §4; read-only per contract §8.2 | T4.9 | Second user sees the lock banner and a fully read-only form |
| UI-118 | No stale-edit detection | Fixed in Studio | Save sends the loaded `updatedAt`; a newer server value returns a conflict (contract §3.4) | T4.9 | e2e: edit in two sessions; the second save shows the conflict banner |
| UI-119 | Late server form state overwrites live state | Gone by design | Client-owned form state (ADR-7); save response merge rule (contract §3.3) | T1.12 | Keystrokes typed during a save survive the response |
| UI-120 | Saved indicator polled 7 times a second | Fixed in Studio | SaveStatus is derived from form state; relative time refreshes every 30s with no request | T4.1 | No network request from SaveStatus |
| UI-121 | Slow analytics response overwrote a newer filter | Keep | Every client fetch is keyed and aborted when superseded | T6.3 | Rapid filter changes show the last request's data |
| UI-122 | Forms `schemaVersion` incremented non-atomically | Backend | Follow-up F-10 | follow-up | None for Studio |

## J. Permissions and roles

| Id | Issue today | Fate | Studio resolution | Task | Acceptance |
|---|---|---|---|---|---|
| UI-123 | Departmental scoping is visual only; drafts readable by API | Backend | Follow-up F-11 (read access per domain). Studio scopes navigation the same way and reads as the user | follow-up | F-11 decision recorded before Phase 5 |
| UI-124 | Scoped users saw all globals and broken quick actions | Fixed in Studio | Shell and dashboard built from the user's permissions (contract §2) | T1.10, T6.2 | `hr` user sees no globals and no actions they cannot use |
| UI-125 | Dashboard queries skip access checks | Fixed in Studio | Dashboard loaders read as the user (ADR-2) | T6.2 | Author's dashboard shows no lead or redirect counts |
| UI-126 | `seo` role cannot sign in | Backend | Unchanged; S-51 shows "Your role cannot use Studio." with Sign out (contract §15 S-51) | T1.11 | seo user sees the message and can sign out |
| UI-127 | `author` role has no write access | Fixed (D-6) | Task 1.19 | T1.19 | Author edits own draft; cannot publish |
| UI-128 | Publish equals update; no Publisher role | Fixed in Studio | `canPublish` is evaluated separately (contract §2.2) | T1.4 | Author cannot publish though they can update own drafts |
| UI-129 | Page cache purge allowed for any user | Backend | Follow-up F-12. Studio shows Purge page only to admin and editor | T4.7 | Author sees no Purge page |
| UI-130 | JSON-LD override shown to admins only though seo may edit | Fixed in Studio | Shown read-only to editors, editable by admins; seo cannot enter Studio | T4.5 | Editor sees it read-only |
| UI-131 | Retry lead sync has no UI | Fixed in Studio | "Retry sync" on S-30 detail calls the logic through a Studio action | T5.3 | Retry sync on a failed lead succeeds |
| UI-132 | Disabling a user keeps their sessions; audit entry never written | Backend | Follow-up F-13 (master plan follow-ups 4 and 6). Confirm copy states the session caveat until fixed (contract §11.4) | T5.4 | Confirm body matches the contract |
| UI-133 | URL ingest bypassed create access; spotlight PATCH open | Keep | Fixed in commits 5c12fb1a and f93e79e8 | none | None |

## K. Dashboards and reports

| Id | Issue today | Fate | Studio resolution | Task | Acceptance |
|---|---|---|---|---|---|
| UI-134 | Analytics "Couldn't load" from route shadowing | Keep | Studio loaders call the logic directly | T6.3 | Analytics loads |
| UI-135 | Realtime widget wrote a cache row per minute per viewer | Keep | Same cadence rules as the fixed widget | T6.3 | One cache row per minute total |
| UI-136 | Per-document Analytics tab never mounted | Fixed in Studio | Out of v1 scope; recorded as follow-up F-14 | follow-up | None |
| UI-137 | Dead dashboard cards | Gone by design | Dashboard built fresh per S-05 | T6.2 | None |
| UI-138 | Native selects ignored the theme | Gone by design | No native selects (01 §7.2) | T0.6 | No `<select>` in `src/studio` |

## L. Auth

| Id | Issue today | Fate | Studio resolution | Task | Acceptance |
|---|---|---|---|---|---|
| UI-139 | Stock login with injected hero; no 2FA | Fixed in Studio (login); Backend (2FA, follow-up F-15) | S-01 per design system §7.7 | T1.11 | Login matches the approved mockup |
| UI-140 | Email and password change without current password; length client-only | Backend | Follow-up F-16 (master plan follow-up 5). Studio asks for the current password in the UI and sends it; server check is F-16 | T1.17 | Account form has "Current password" |
| UI-141 | Wrong origin returns a 403 that looks like RBAC | Fixed in Studio | Studio actions run server side, so the browser origin check does not apply to them; REST calls (uploads, auth) show "Studio could not reach the server from this address." on an origin 403 | T1.11, T2.8 | Message shown on a forced origin 403 |
| UI-142 | Reset email links to /admin; `payload-token` cookie load-bearing | Keep | ADR-3; reset link switched in T7.4 | T7.4 | Reset email opens S-03 after T7.4 |

## M. Performance

| Id | Issue today | Fate | Studio resolution | Task | Acceptance |
|---|---|---|---|---|---|
| UI-143 | Pool sizing caused queues and 500s | Keep | Studio loaders use the shared pool; no per-request clients | none | None |
| UI-144 | About 10 body-wide MutationObservers and timers on every page | Gone by design | Boundary rule: no `MutationObserver`, `querySelector` on markup Studio does not own, `setInterval` under 1s, or `window.fetch` patching in `src/studio` (checked by `verify:studio-boundaries`, Task 1.5) | T1.5 | Boundary check passes and includes these patterns |
| UI-145 | Bundle budget gate measures nothing | Fixed in Studio | Per-route JS budget for Studio routes enforced in CI (T7.3) | T7.3 | CI fails when a Studio route exceeds its budget |
| UI-146 | CMS API sends no Cache-Control | Keep | Studio responses are `private, no-store` (UI-116) | T1.10 | Header check |
| UI-147 | Drizzle push prompt blocks dev renders | Keep | Dev runs with `PAYLOAD_DB_PUSH=false` (06 §7) | none | None |

## N. Visual and styling

| Id | Issue today | Fate | Studio resolution | Task | Acceptance |
|---|---|---|---|---|---|
| UI-148 | 225 `!important` declarations | Gone by design | Zero `!important` in `src/studio` (boundary check) | T1.5 | grep returns nothing |
| UI-149 | 21.5k lines of SCSS targeting Payload classes | Gone by design | Tailwind and tokens only | T0.3 | No `.scss` in `src/studio` |
| UI-150 | Drawers with duplicate close buttons and partial dimming | Gone by design | `packages/ui` Drawer restyled once | T0.5 | One close button; full backdrop |
| UI-151 | Uneven control heights | Gone by design | Control height tokens (01 §4.2) | T0.6 | Lab: buttons and kebab share height |
| UI-152 | Unicode glyph icons rendered inconsistently | Gone by design | Phosphor only (01 §6) | T0.6 | No ×, ✓ or → characters used as icons |
| UI-153 | Date picker clear button a stray block | Gone by design | Restyled picker in the lab | T0.5 | Lab state "with value" |
| UI-154 | Phantom "[" beside select chips | Gone by design | Studio Select | T0.6 | Lab multi-select |
| UI-155 | Stale CSS chunk paired with new JS | Fixed in Studio | Studio CSS is one stylesheet imported by its layout and fingerprinted with its JS | T0.3 | None beyond build |

## O. Accessibility

| Id | Issue today | Fate | Studio resolution | Task | Acceptance |
|---|---|---|---|---|---|
| UI-156 | Toolbar buttons without names | Gone by design | Every icon button requires `label` (type-checked) | T0.6 | axe zero on the editor |
| UI-157 | Field descriptions only on hover | Fixed in Studio | Descriptions render as visible help text under the label (01 §7.2) | T1.13 | No description is tooltip-only |
| UI-158 | Listboxes built from divs | Fixed in Studio | `Combobox` from `packages/ui` with the ARIA combobox pattern | T0.6 | axe zero; keyboard test in the lab |
| UI-159 | Native `alert` and `confirm` | Fixed in Studio | `ConfirmDialog` and toasts only | T1.5 | Boundary check rejects `alert(`, `confirm(`, `prompt(` in `src/studio` |
| UI-160 | Focus outline removed on inputs and the editor | Fixed in Studio | Visible focus on every focusable element (01 §9) | T0.6 | axe and the keyboard walkthrough |
| UI-161 | LockedReason announced twice | Fixed in Studio | Read-only reason is visible text; lock icon decorative (contract §8.2) | T1.13 | Screen reader reads the reason once |
| UI-162 | Missing aria-expanded on menus (fixed) | Keep | `packages/ui` menus set it | T0.5 | axe |

## Backend follow-ups F-1 to F-16 (not built inside Studio)

Each is its own small task, outside the Studio phases unless noted. They must be done before cutover (T7.4) unless marked otherwise.

| Id | Follow-up | Issues |
|---|---|---|
| F-1 | Health check that reads every global and fails when a table is missing | UI-012 |
| F-2 | Export endpoint: run as the user; let HR export career applications | UI-034 |
| F-3 | Schedule runner: alert when a scheduled job fails; document `PAYLOAD_AUTO_RUN` | UI-048 |
| F-4 | Add `revalidateWeb` hooks to pages and podcastEpisodes; restore the recent purges log | UI-051 |
| F-5 | Decide whether schema add-ons are exposed | UI-071 |
| F-6 | Decouple the gated-download popup from stored field names | UI-075 |
| F-7 | Clean migrated link data (www absolute links, junk characters) | UI-099 |
| F-8 | Events role: media rename and podcast thumbnail alt | UI-107 |
| F-9 | Web route for case-study preview | UI-114 |
| F-10 | Atomic `schemaVersion` increment on forms | UI-122 |
| F-11 | Read access scoped per department, or a written decision to keep it visual only | UI-123 |
| F-12 | Page cache purge limited to admin and editor | UI-129 |
| F-13 | End sessions on disable; write the `user_disabled` audit entry | UI-132 |
| F-14 | Per-document analytics tab | UI-136 |
| F-15 | Two-factor sign in | UI-139 |
| F-16 | Server-side password policy and current-password check | UI-140 |
| F-17 | Access rules on `payload-jobs`: today any signed-in user can queue or delete schedule jobs over REST, and a job without `input.user` publishes with `overrideAccess`. Restrict create and delete to the server | parity audit row 14 |
| F-18 | Field access on the built-in API key fields of Users, so users cannot enable a key on their own record over REST (a key outlives sessions and disabling) | parity audit row 151 |
