# Studio behaviour contract

The exact rules for how Studio behaves: what it computes, what it shows, what it says and what happens on every edge. It settles every ambiguity found in the 2026-10-21 spec review, so an implementer never has to choose. `01` says how things look, `02` says where they are, this file says how they behave.

Precedence: where `02-SCREENS.md` or `01-DESIGN-SYSTEM.md` is silent or vague, this file decides. Where this file contradicts them, that is a bug in the docs: stop and ask (`06` §9).

Copy in this file is final. Strings appear in double quotes; `{braces}` are placeholders. `{Singular}` and `{Plural}` are the collection's labels; `{singular}` and `{plural}` are the same labels lower-cased by the rule in §11.6.

---

## 1. Document status

One function decides a document's status everywhere: list rows, list groups, view-tab counts, the document header, the palette and the dashboard.

- Lives in `apps/cms/src/studio/server/status.ts` as `getDocStatus(doc, context)` and a batched `getDocStatuses(collection, ids)`.
- Only for collections with `versions.drafts`. Other collections have no status and show none.

| Status | Rule (checked in this order; the first match wins) | Label | Glyph |
|---|---|---|---|
| Scheduled | An open `payload-jobs` row exists with `taskSlug: 'schedulePublish'`, `waitUntil > now`, `completedAt` empty, and `input.doc` matching this document | "Scheduled" | `Clock`, `--accent-text` |
| Unpublished changes | The document has a published version, and its newest version is a draft | "Unpublished changes" | `CircleHalf`, `--warning` |
| Published | The newest version is published | "Published" | `CheckCircle` fill weight, `--success` |
| Draft | Nothing has ever been published | "Draft" | `CircleDashed`, `--text-tertiary` |

- Data: the main collection row's `_status` says whether a published version exists. "Newest version is a draft" comes from `findVersions({ where: { parent: { in: ids }, latest: { equals: true } } })`, read as the user. Scheduled comes from one `payload-jobs` query for the page's ids.
- The status label "Unpublished changes" replaces every older wording ("Published, changes", "Published, with changes", "Published with changes") in all docs and UI.
- Counts for view tabs and list groups use the same precedence, so each document is counted in exactly one status and **All equals the sum of the four**.

## 2. Permissions

### 2.1 Source

- The shell reads `getAccessResults({ req })` once per request (collection and global level: create, read, update, delete).
- A document reads `docAccessOperation` for its own update and delete (document-level rules, for example D-6 ownership).
- Field-level access comes from the schema (`access.read`, `access.update` on fields), evaluated on the server and sent as flags.

### 2.2 Publish permission

- `canPublish` = the collection's update access evaluated with the document and `data: { _status: 'published' }`. It is a separate value from `canUpdate`. ADR-2's sentence "Publish permission equals update permission" is replaced by this rule.
- `canUnpublish` = `canPublish` and the document has a published version.
- `canSchedule` = `canPublish`.
- Authors (D-6): `canUpdate` is true on their own documents, `canPublish` is false.

### 2.3 Hide or disable

| Situation | UI |
|---|---|
| The user can never do the action on this screen (no permission) | Hide the control |
| The user could do it but not right now (blocker, upload in progress, nothing changed) | Show it with `aria-disabled="true"` and the reason as visible text next to or under it; never a tooltip-only reason, never the `disabled` attribute on a control that explains itself |
| The document is locked by someone else | Every field read-only, actions hidden except Preview, Versions and Copy link; banner §4.3 |

### 2.4 Author specifics (D-6)

- An author may delete their own document only when it is not live: the main row's `_status` is `draft`. A live document with a newer draft has `_status: 'published'` on its main row, so its author cannot delete it.
- Under Save draft, authors see the muted line "An editor publishes this."
- Authors can upload to Media but cannot edit or delete media records: in S-21 and the upload field, Rename, Replace, Edit details and Delete are hidden for them. Alt text entered at upload is sent in the create request.

### 2.5 Events role specifics

The `events` role is scoped to events, webinars, webinarTypes and podcastEpisodes (`lib/wire-scoped-nav.ts`), and the backend grants it more than its navigation shows. Studio follows the backend access exactly:

- Media: create; update only on files whose folder is `web/event` or `web/webinar`; no delete; no rename (the rename endpoint is admin and editor only).
- Forms: read and create; update only on forms attached as an event's or webinar's `registrationForm`; fields `postSubmit`, `crmHandlers`, `notifyTo`, `hubspotFormGuid` and `hubspotSubscriptionTypeId` are admin and editor only and render read-only for events (§8.2).
- Preview and the publish checklist: allowed inside its own domain only.
- Forms stay out of the events sidebar (as today); events users reach a registration form from the event's relationship field.

---

## 3. Saving, form state and concurrency

### 3.1 Save actions

| Collection | Primary | Secondary | Shortcut |
|---|---|---|---|
| With drafts | Publish (popover from Phase 4; plain button in Phase 1, §17) | Save draft | ⌘S saves a draft, never publishes |
| Without drafts | Save | none | ⌘S saves |
| Global without drafts (all three today) | Save | none | ⌘S saves |

- Save draft and Save are enabled only when the form is dirty. When clean they show `aria-disabled` with "No changes to save." under the button on hover or focus.
- While any upload in the form is in progress, Save draft, Save, Publish and ⌘S are unavailable with "Wait for the upload to finish."

### 3.2 Dirty state

- Dirty = any registered field differs from its loaded value (deep compare for arrays, blocks and rich text).
- Only top-level keys that changed are sent (ADR-7, `buildPatch`).

### 3.3 Save in flight and the response

- The save snapshots the form values when it starts.
- When the response arrives:
  - If nothing changed since the snapshot, replace the form's values with the saved document, mark clean.
  - If the user typed during the save, keep their newer values, merge in only the server-written fields (any field the user did not touch since the snapshot, for example `updatedAt`, `wordCount`, `readingMinutes`, `tableOfContents`, generated ids), and keep the form dirty.
- Typing never waits for a save; the form never re-mounts on save.

### 3.4 Stale edits (conflict)

- Save sends the `updatedAt` the form loaded (or last saved).
- If the server's `updatedAt` is newer, the action returns `{ ok: false, error: { kind: 'conflict' } }` and nothing is written.
- The form shows a banner: "This {singular} changed since you opened it. Reload to see the latest version, or save yours over it." with buttons "Reload" and "Save anyway". "Reload" asks for confirmation if the form is dirty ("Discard your changes and reload?"). "Save anyway" saves without the check.
- Add `conflict` to `ActionErrorKind` in `server/errors.ts` with message "This document changed since you opened it."

### 3.5 Validation errors

- Server issues map onto fields by path. Fields show their message under the input in `--danger` with a 14px `WarningCircle`.
- A validation summary banner appears at the top of the writing column: "{n} fields need attention." with one link per issue ("{Field label} in {Section or tab}: {message}"). Issues for fields that are not rendered (hidden, conditional, other tab) are still listed.
- Some server errors have a path that is not a field (the publish gate uses `slug` and `jsonld-override`). Map `jsonld-override` to the JSON-LD override field in the SEO tab; any other unknown path appears in the summary as "{message}" with no link.
- After a failed save, focus moves to the summary. Activating a link opens the tab or collapsible that holds the field, scrolls to it and focuses it.
- Client validation shows errors only after the first save attempt, or after the user leaves a field they changed. A pristine new document shows no errors.

### 3.6 Session expiry

- A save, lock refresh or loader that returns 401 keeps the form as is and opens a dialog: title "Your session ended", body "Sign in again to save your changes. Nothing on this page is lost.", primary "Sign in" (opens `/studio/login?next=/studio/reauth` in a new tab), secondary "Not now".
- `/studio/reauth` is a tiny page that says "Signed in. You can close this tab." and posts a `BroadcastChannel('studio-auth')` message. The editor tab listens and retries the save once.

### 3.6a Staying signed in

- Payload's token lasts 8 hours (`tokenExpiration`). While the user is active (input in the last 15 minutes), Studio calls `POST /api/users/refresh-token` when fewer than 10 minutes remain, the same thing Payload's admin does.
- When the user is inactive and 5 minutes remain, a toast that stays: "Your session ends in 5 minutes." with "Stay signed in" (refreshes the token). If it expires anyway, §3.6 applies and nothing on the page is lost.

### 3.7 Offline and failures

- While `navigator.onLine` is false, a banner at the top of the sheet: "You are offline. Your changes stay on this page until you reconnect." Save buttons are unavailable with "Offline."
- A failed save (network, 5xx, timeout after 30 seconds) keeps the form dirty, sets save status to "Save failed. Retry" (Retry re-sends) and shows an error toast that stays until dismissed: "Could not save. Check your connection and try again."

### 3.8 Local recovery copy

- While dirty, the form writes its changed values to `localStorage` under `studio-recovery:{collection}:{id or 'new'}` at most once every 2 seconds. A successful save or a discard deletes it.
- Opening the document with a recovery copy newer than the document's `updatedAt` shows a banner: "You have unsaved changes from {time}." with "Restore" and "Discard". Restore applies the values and marks the form dirty.
- Recovery copies older than 7 days are deleted on Studio load. Nothing is sent to the server.

### 3.9 Create

- Default values: `buildStudioSchema` cannot send functions, so the create loader evaluates every `defaultValue` function on the server for the current user (including async ones such as the email signature's default template and `publicationDate = now`) and sends the results as the form's initial values.
- The create screen (S-11) saves with `draft: true` for draft collections. After the first save the URL becomes `/studio/collections/{collection}/{id}` with `router.replace(…, { scroll: false })`; the form is marked clean first so the navigation guard does not fire; the lock is acquired right after.

---

## 4. Locks

### 4.1 Acquire and refresh

Studio follows Payload's lock timing so the two admins agree while both run:

- On open, Studio reads the lock. If someone else holds it, the form opens read-only with the §4.3 banner. Otherwise nothing is locked yet; opening a document to read it never blocks colleagues.
- The lock is acquired on the user's first change, only when they have update permission. If acquiring fails because someone else took it in the meantime, the change is kept on screen, the form turns read-only and the §4.4 banner shows.
- While held, the lock is refreshed every 60 seconds. Payload's lock lasts 300 seconds.
- Each refresh returns the current owner. If the owner is someone else, the form switches to read-only (§4.4).
- After a successful save the lock is released, as Payload does, and re-acquired on the next change.
- One lock per browser tab: the tab id is generated per tab and stored in `sessionStorage`. A second tab of the same user on the same document opens read-only with the banner "You are editing this {singular} in another tab." and a "Edit here instead" button that takes the lock for this tab.

### 4.2 Release

- On `pagehide`, `navigator.sendBeacon('/studio/api/lock/release', …)` releases the lock. The route handler runs as the user through the wrapper.
- Navigating inside Studio releases it through the server action before navigating.

### 4.3 Someone else holds the lock

- Banner: "{Name} is editing this {singular}. You can read it, but editing is off." with button "Take over".
- Take over asks: title "Take over editing?", body "{Name} will lose any changes they have not saved.", buttons "Cancel" and "Take over".

### 4.4 Your lock was taken over

- The form turns read-only immediately, keeping the user's unsaved values on screen.
- Banner: "{Name} took over editing at {time}. Your unsaved changes were not saved." with button "Copy my changes", which copies the changed fields as JSON to the clipboard and shows the toast "Changes copied."

---

## 5. Publish, schedule and unpublish

### 5.1 Controls

- Schedule items appear only on collections with `versions.drafts.schedulePublish` (blogs, news, guides, case-studies, knowledgeBase, resources, events, webinars, podcastEpisodes, jobs, pages, legalDocuments) and only on saved documents. Other draft collections (taxonomies, authors, forms, aboutGalleries, signatureTemplates) get Publish and Unpublish without Schedule.
- Unpublish never discards unsaved edits: it changes the status only, and any unsaved changes stay in the form as unsaved changes.
- The Publish split button's main action opens the publish popover with "Publish now" selected. Its menu holds: "Schedule publish…" (⌘⇧S), "Schedule unpublish…" (only when published), "Unpublish" (only when published).
- Publishing always goes through the popover's action button. No shortcut publishes directly: ⌘↵ opens the popover, ⌘↵ inside it confirms.
- Publish stays reachable when there is a blocker: the popover opens and shows the blocker; the action button is `aria-disabled` with the blocker sentence under it.

### 5.2 Schedule

- Scheduling saves the form as a draft first, then queues the job. The popover states: "Changes you save before then will also be published."
- Date and time use `DateTimePicker` with a minimum of now plus 5 minutes; timezone defaults to the browser's.
- Upcoming schedules for the document are listed in the popover and in the inspector's Details tab with one component, `UpcomingSchedules`: each row shows the action, the date and time with timezone, and "Cancel". Cancel asks "Cancel this scheduled {action}?" and deletes the job row. The cancel action first checks `canPublish` on the job's `input.doc` and refuses otherwise; `payload-jobs` has Payload's default access, so this check is the only thing stopping a user cancelling someone else's schedule (follow-up F-17 restricts it on the server).

### 5.3 SEO length warning

- When publishing and the SEO title is outside 30 to 60 characters or the meta description outside 70 to 160, the popover shows a warning banner in place of the checklist summary: "SEO title is {n} characters. Aim for 30 to 60." (one line per problem) and the action button reads "Publish anyway". No second dialog.

### 5.4 Blockers and checklist

- Blockers for slug (present, no spaces) and for a JSON-LD override (valid JSON) are computed live from form values on the client, so they update as the user types.
- The full checklist comes from a Studio loader that runs the checklist logic as the user (not the 3-segment REST route), refreshed after every save, labelled "As of your last save".

### 5.5 Results

| Action | Toast | Undo |
|---|---|---|
| Publish now | "{Singular} published." with "View" (opens the live URL in a new tab) | No |
| Schedule publish | "Scheduled for {date, time}." | Yes: cancels the job |
| Schedule unpublish | "Unpublish scheduled for {date, time}." | Yes: cancels the job |
| Unpublish | "{Singular} unpublished." | No |
| Publish failed | Error toast with the server message, stays until dismissed | No |

- After 5 seconds without a response the button shows "Still publishing…". After 30 seconds the request is treated as failed (§3.7) but the result is re-checked on the next load.

---

## 6. Navigation guard

- `NavigationGuard` (client context in `src/studio/shell/`) wraps every internal navigation: `StudioLink`, `router.push`, the sidebar, the palette, breadcrumbs and Sign out.
- When the active form is dirty, navigation is paused and a dialog asks: title "Discard unsaved changes?", body "Your changes to this {singular} have not been saved.", buttons "Keep editing" (focused) and "Discard" (danger).
- Browser back and forward: a `popstate` sentinel re-pushes the current entry and shows the same dialog.
- Tab close, reload and leaving for `/admin`: `beforeunload` (the browser shows its own text).
- "Discard changes" in the More menu uses the same dialog with the title "Discard changes since your last save?" and then restores the last saved values.

---

## 7. Lists

### 7.1 Search, sort and pagination

- Search runs from the first character, debounced 250 ms, kept in the URL as `q`. Changing `q`, a filter or the sort resets `page` to 1.
- Esc in a non-empty search clears it; in an empty search it blurs the field.
- Page sizes 10, 25 (default), 50, 100. Footer: "{from} to {to} of {total}"; with no rows "0 results".
- Sort is one column at a time, shown with `aria-sort`; clicking cycles ascending, descending, default.

### 7.2 Display popover

- "Display" opens a popover with Columns (checklist plus drag or Alt+Arrow to reorder), Density ("Comfortable" 44px rows, "Compact" 32px rows) and, in the Table layout only, Page size.
- Column widths are resizable in the Table layout (Phase 5) by dragging the header edge or, with the header focused, Alt+Left and Alt+Right in steps of 16px.

### 7.3 View tabs and the List layout (Phase 5)

- Tabs: "All", "Drafts", "Unpublished changes", "Scheduled", "Published", each with its count (§1). Tabs are links that set `status` in the URL.
- List layout groups rows by status in the order Scheduled, Unpublished changes, Drafts, Published. All groups open by default; closed groups are saved in `listGroupsClosed[collection]`.
- Inside a group: Scheduled sorts by the scheduled time ascending; the others by `updatedAt` descending. Each group loads 25 rows and ends with "Show 25 more".
- A group with no rows is not shown. When every group is empty, the list empty state shows (§11.3).
- Row: checkbox (visible on hover, on focus-within, or when any row is selected), status glyph, title, up to 2 chips (from the chip fields in §8.12), up to 3 author avatars then "+{n}" with a tooltip of names, scheduled time for scheduled rows, relative `updatedAt`, more button (visible on hover and focus-within).

### 7.4 Related titles

- One query per related collection per page, as the user, with `limit` equal to the number of ids and `pagination: false`. An id the user cannot read shows "Restricted" in `--text-tertiary`.

### 7.5 Selection and bulk actions

- Selecting a row shows the floating selection bar centred 22px above the sheet's bottom edge; the list body gains 72px of bottom padding so the bar never covers the last row; toasts stack above the bar.
- Bar: "{n} selected", then actions the user may perform on every selected document: "Publish", "Unpublish", "Duplicate", "Delete", and "Esc" hint.
- Bulk actions run in one server action, at most 4 documents in parallel, and return per-document results.
- Delete confirm: title "Delete {n} {plural}?", body "{m} of them are live on the site and will be removed from it. This cannot be undone." (omit the second sentence's first clause when m is 0), buttons "Cancel" and "Delete {n} {plural}".
- Results: all succeeded "{Done verb} {n} {plural}." (for example "Deleted 3 blogs."); partial "{Done verb} {k} of {n} {plural}. {n-k} could not be {done verb}: {first reason}." as an error toast that stays.
- After a bulk action the list refreshes with `router.refresh()` and the selection clears. Never a full reload.
- Duplicate creates drafts; the toast says "Duplicated {n} {plural} as drafts."

### 7.6 Nav draft counts

- Computed in the shell loader with one count per draft-enabled collection the user can read, cached for 60 seconds **per user id** (never shared between users).

### 7.7 URL parameters

- Every list parameter is parsed with Zod. Filters accept only the operators `equals`, `not_equals`, `in`, `like`, `greater_than`, `less_than` and `exists`, and only on fields in the collection's filter config. Anything else is dropped silently and the URL is rewritten without it.

### 7.7a Locked rows, default sort, descriptions

- A row locked by another user shows a lock icon (with "{Name} is editing" in its tooltip and accessible name) in place of the checkbox and cannot be selected for bulk actions.
- The default sort is the collection's `admin.defaultSort` when set (aboutGalleries `displayOrder`, pageRegistry `order`), else `-updatedAt`.
- A collection's `admin.description` shows under the page title in `--type-small`, `--text-secondary`.
- Page size default is 25 (today's admin defaults to 10). Studio does not migrate the old admin's list preferences; users start from the schema defaults.

### 7.8 Row interaction

- Clicking a row opens the document; ⌘-click or middle-click opens it in a new tab (rows are real links).
- J and K move row focus, Enter opens, X toggles selection, ⌘A selects all rows on the page only when focus is inside the list, C creates (when allowed). See §12 for typing guards.

---

## 8. Fields

### 8.1 Overlays inside fields

Every popover, menu, combobox list and date picker renders in the top layer (native `popover` or `dialog`, from `packages/ui`). Nothing a field opens can be clipped by an array row, a collapsible or the sheet.

### 8.2 Read-only

A field is read-only when any of these is true; the first that applies gives the help text shown under the field (visible text, the lock icon is decorative):

| Cause | Help text |
|---|---|
| Document locked by someone else | none (the banner explains it) |
| User cannot update the document | none (the whole form is read-only; a banner says "You can view this {singular} but not change it.") |
| Field-level update access denied | "Only admins can change this." when the rule is admin-only, else "You cannot change this field." |
| `admin.readOnly` in the config | "Set automatically." |

Read-only inputs have no border, `--bg-surface` background and `--text-secondary` text, stay focusable, and their value can be selected and copied.

### 8.3 Labels, required and optional, error timing

- Required fields show nothing extra. Non-required fields show "Optional" after the label in `--text-tertiary`. A field required only on publish (gate fields) shows "Required to publish" instead.
- Errors appear per §3.5 timing.
- Descriptions are visible help text under the label, never tooltip-only.

### 8.4 Hidden and conditional fields

- `admin.hidden` fields stay registered with their loaded value and are sent back unchanged when their top-level key is in the patch.
- A field whose `admin.condition` is false is not rendered. Its value stays in the form; it is sent only when its top-level key is dirty for another reason (matches Payload's admin).
- Errors on unrendered fields still appear in the validation summary (§3.5).

### 8.5 JSON and code

- CodeMirror 6 with token colours, Geist Mono 12px, line numbers.
- JSON parses on blur. Invalid JSON shows "Invalid JSON on line {n}." under the field and blocks save with the summary entry.

### 8.6 SEO title and description

- Studio never writes `seo.title` or `seo.description` automatically. An empty value shows the document title (or abstract) as placeholder text and the counter reads the placeholder's length with the hint "Uses the title".
- Before T4.5, confirm that `apps/web` falls back to the title and abstract when these are empty. If it does not, stop and ask.

### 8.7 Secrets (integrations)

- Secret inputs load the sentinel value from the server (`SECRET_MASK_SENTINEL` in `apps/cms/src/payload/collections/Integrations.ts`) and show it as "Saved. Paste a new value to replace it." in place of the value.
- Untouched, the sentinel is sent back unchanged (the server keeps the stored secret). "Replace" clears the input for a new value; "Cancel" restores the sentinel.

### 8.8 Relationships

- Values keep their native id type (numbers stay numbers). Polymorphic values stay `{ relationTo, value }`. One helper (`relationship-value.ts`, SHARE) converts at the boundary.
- Search runs on the server, debounced 250 ms, 20 results per page with "Load more", applying the field's `filterOptions` for the current user and document.
- Up to 100 options in a static select: plain list with search above 8 options. Above 100: virtualised list.
- Multi-select shows up to 3 chips in the closed control, then "+{n}"; the open control lists all selected.

### 8.9 Paste and drop routing

- Paste is handled only by the focused field or editor. Nothing listens for paste on `document`.
- Files dropped on an upload field go to that field; files dropped anywhere else on the media library go to the library upload. Elsewhere, drops are ignored (the browser's default navigation is prevented).

### 8.10 Counters

- Format "{n} / {max}". `--text-tertiary` until the limit, `--danger` above a hard `maxLength` (typing past it is blocked). SEO recommended ranges are soft: `--warning` outside the range, never blocking.
- Counters appear when the value reaches 80 percent of the limit, and always on SEO fields.

### 8.11 Arrays and blocks undo

- Remove shows the toast "{Row label} removed." with "Undo" for 10 seconds (§11.1). Undo reinserts at the original index, clamped to the current length. Undo is no longer offered once the form is saved.

### 8.12 Document presentation per collection

The writing-first layout (cover, title, lead, property chips) reads these fields. The map lives in `apps/cms/src/studio/lib/document-presentation.ts`; a unit test asserts every path exists in the schema with the listed type, so a renamed field fails CI. A collection not in the table has no cover, no lead and no chips.

| Collection | Cover (upload) | Lead (textarea) | Chips |
|---|---|---|---|
| blogs | `heroImage` | `abstract` | `authors`, `categories`, display date, slug |
| news | `heroImage` | `abstract` | `authors`, `newsCategories`, `pressType`, slug |
| guides | none | `abstract` | `authors`, display date, slug |
| knowledgeBase | `heroImage` | `abstract` | `category`, display date, slug |
| resources | `heroImage` | `summary` | display date, slug |
| case-studies | `coverImage` | `summary` | slug |
| events | `heroImage` | `abstract` | slug |
| webinars | `heroImage` | `abstract` | `webinarType`, display date, slug |
| podcastEpisodes | none | `abstract` | display date, slug |
| jobs | none | `abstract` | `department`, display date, slug |
| pages | none | `abstract` | display date, slug |
| legalDocuments | none | none | display date, slug |

- "display date" is the collection's display-published-date field; "slug" is the shared slug field. T4.4 verifies the table against the schema before writing the test; any mismatch is corrected here first.
- "+ Property" pins any other sidebar field as a chip, saved in `pinnedProperties[collection]` (at most 6). Each pinned chip's popover has "Remove from chips".

### 8.13 Slug

- Auto mode follows the source field (title or name) only while the document has never been published and the user has not edited the slug by hand. Published documents open with Auto off, so retitling a live page never changes its URL.
- Editing the slug of a published document shows a warning under the field: "Changing the slug changes the page's URL. A redirect from the old URL is created when you publish."
- The collision check (400 ms debounce) queries the same collection; for `pages` it also matches `parent`, because page slugs are unique per parent. It fails open on network errors; the server is the gate.
- Slugs are normalised on blur, max 120 characters, with the counter from 80.

### 8.14 Fields that save immediately

A few fields act on other records, outside the document's save. Each shows the help text "Changes here save immediately." and its own success toast:

- The outbound redirect section (creates, updates and deletes a redirect).
- Inline alt text edited from an upload field (updates the shared media record; shown only when the user can update that media).

### 8.15 Field details carried from today

- Relationship fields show `admin.custom.emptyPlaceholder` when set (for example "Automatic, click to choose one").
- A field the user may not set on create (`access.create` false) renders read-only on the create screen with "Set automatically." and is not sent.
- Integrations: reserved kinds (for example `zohoCrm`) are not offered in the kind picker; `kind` is read-only after create; Duplicate is not offered on integrations (a duplicate would copy the secret mask instead of the secret).
- Pages: `parent` is an editable relationship (with the server's cycle check); `path` and breadcrumbs are read-only.
- Users: `roles` defaults to Author on create; `enabled` and `roles` are editable by admins only; the API key section shows only to admins on S-32 (needed for the preview bot's key) and never on S-04 Account (follow-up F-18 restricts the fields on the server).

---

## 9. Media

### 9.0 Two kinds of Replace

- **Replace on an upload field** (in a document) picks or uploads a different file and points the field at it. The shared media record is untouched. Button label "Change".
- **Replace file on media detail** (S-21) overwrites the file in place, so every document using it changes. Confirm: title "Replace this file everywhere?", body "It is used in {n} documents. They all show the new file." (or "It is not used anywhere yet." when n is 0), button "Replace file".

### 9.1 Upload

- Uploads use XHR to `/api/media` with progress. Each file is a row in the upload tray (bottom right of the sheet): name, progress bar, Cancel. Done rows close after 4 seconds; failed rows stay with the error and "Retry".
- The `x-media-context-hint` header is URI-encoded.
- Per-field upload settings in `admin.custom` are honoured: `folderHint` sets the folder sent with the upload (it decides the storage path and public URL), `accept` limits the file chooser and drop target, and `guidance` shows as help text.
- Before uploading, the client checks type and size against `lib/upload-limits.ts` (SHARE): images 25 MB, PDF 50 MB, video 200 MB, zip 100 MB, doc and docx 10 MB; types jpeg, png, webp, avif, svg, gif, pdf, doc, docx, mp4 and zip. The server still enforces them.
- The size warning on an image says "This image is large ({size}, {width} px wide). Pages load faster with images under 2 MB and 4000 px." when it is over 2 MB or 4000 px wide.
- Error copy: too large "{file} is larger than {limit}.", wrong type "{file} is not a supported type.", other "Could not upload {file}."

### 9.2 Media detail save model (S-21)

- Alt, Decorative, Caption, Credit and Folder form a normal form with Save (⌘S), dirty state and the navigation guard.
- Rename and Replace act immediately through REST with their own confirmation: Rename shows an inline input with "Rename" and "Cancel"; Replace opens the file chooser and uploads with `PATCH /api/media/{id}` (multipart, XHR).
- Focal point writes the custom `focalPoint.x` and `focalPoint.y` fields (0 to 100, default 50), not Payload's `focalX` and `focalY`. Click to set; with the preview focused, arrow keys move 1 percent, Shift plus arrow 10 percent; X and Y percent inputs below show and edit the value.

### 9.3 Delete

- Before deleting, a usage query lists documents referencing the file (upload fields, rich-text upload nodes). With no usage: confirm "Delete {file}?" / "This cannot be undone." / "Delete". With usage: body "Used in {n} documents. They will show a broken image until you replace it." followed by up to 5 links and "+{n} more", and the user must type the number {n} to enable "Delete".

### 9.4 Library filters

- Type: Images (`image/*`), PDFs (`application/pdf`), Video (`video/*`), Other (anything else). Folder: the 12 folder values from the Media config (default `web/general`). There is no "Uploaded by" filter: media records do not store an uploader.
- Drop overlay text: "Drop files to upload".
- Grid keyboard: arrow keys move focus, Enter opens detail, Space toggles selection, Delete or Backspace asks to delete the selection.

### 9.5 Picker (S-22)

- Single-select fields: action "Select". `hasMany` fields: "Select {n}". From the editor: "Insert".
- A file uploaded inside the picker is selected automatically.
- Focus starts in the search field; closing returns focus to the trigger.

---

## 10. Preview and share links

- One preview token per document per editing session, minted on first open of the pane and reused; reloads add `?ts={time}` so the iframe refreshes. A new token is minted only when the old one is within 1 hour of expiry.
- The pane reloads after each successful save and keeps its scroll position when the preview page reports it (same origin `postMessage`), else starts at the top.
- Preview is unavailable until the document has a saved slug: "Add a slug to preview this {singular}." Collections without a web route show no Preview.
- Breakpoint switcher: a segmented control in a 40px bar above the iframe with "Mobile" (390), "Tablet" (820), "Laptop" (1280, default), "Desktop" (fills the pane).
- With the pane open below 1440px wide, the sidebar collapses and the inspector becomes a strip automatically; closing the pane restores them.
- Share links: TTL select with "1 hour", "1 day", "7 days" (default), "30 days". Creating copies the link and shows "Link copied." The list shows each link's expiry and status ("Active", "Expired", "Revoked"), "Revoke" per link and "Revoke all". Revoke confirm: "Revoke this link?" / "Anyone using it loses access." Only admins and editors see the share-link list and Revoke (the list reads `previewAudit`, which only they can read). Authors and events users can create links and copy them, but see no list.

---

## 11. Feedback and copy

### 11.1 Toasts

- Bottom right, above the selection bar when it shows, width 360px, at most 3 visible; a 4th replaces the oldest non-error toast.
- Durations: plain 4 seconds; with an action (Undo, View, Retry) 10 seconds; errors stay until dismissed. Timers pause on hover and focus-within.
- The toast region is reachable with F6 and announces with `role="status"` (errors `role="alert"`).

### 11.2 Save status strings

"Unsaved changes" · "Saving…" · "Saved just now" (under 60 seconds) · "Saved {n} min ago" (updated every 30 seconds, then "Saved at {time}" after 60 minutes) · "Save failed. Retry" · "Offline" · "Signed out. Sign in to save".

### 11.3 Empty and no-results states

| State | Title | Body | Action |
|---|---|---|---|
| Collection empty | "No {plural} yet" | "{Plural} you create appear here." | "New {singular}" (only with create permission) |
| No results | "No results" | "Nothing matches your search or filters." | "Clear filters" |
| Group empty in List layout | (group hidden) | | |
| Versions empty | "No versions yet" | "Versions appear after the first save." | none |
| Media empty | "No media yet" | "Drop files here or upload." | "Upload" |
| Broken links empty | "No broken links found" | "The last scan found every link working." | none |
| Join field empty | "No linked documents" | | |

### 11.4 Confirm dialogs

| Action | Title | Body | Confirm button |
|---|---|---|---|
| Delete one document | "Delete this {singular}?" | Live: "It is live on the site and will be removed from it. This cannot be undone." Not live: "This cannot be undone." | "Delete" |
| Bulk delete | §7.5 | | |
| Discard changes | "Discard changes since your last save?" | "Your changes to this {singular} will be lost." | "Discard" |
| Leave with unsaved changes | §6 | | |
| Restore version | "Restore this version?" | "It becomes a new draft. The live page does not change until you publish." | "Restore" (calls `restoreVersion` with `draft: true` on draft collections, so a published version is never republished by a restore; T4.8 verifies the option exists in Payload 3.84 and stops if it does not) |
| Unpublish | "Unpublish this {singular}?" | "It will be removed from the live site. You can publish it again later." | "Unpublish" |
| Take over lock | §4.3 | | |
| Disable user | "Disable {name}?" | "{Name} can no longer sign in. Sessions already open stay active until they expire, up to 8 hours." (until F-13 ships; then "{Name} is signed out everywhere and can no longer sign in.") If they have scheduled jobs, add: "{Name} has {n} scheduled publishes. They will fail unless someone else reschedules them." | "Disable" |
| DSAR delete | "Delete all data for {email}?" | "Deletes every lead and career application for this email, and asks HubSpot to erase the contact. This cannot be undone. Type the email to confirm." | "Delete all data" (enabled when the typed email matches, case-insensitive, trimmed) |
| Purge everything (cache) | "Purge the whole site cache?" | "Every page is rebuilt on its next visit, which is slower for a few minutes. Type purge everything to confirm." | "Purge everything" |
| Revoke share link | §10 | | |
| Cancel schedule | §5.2 | | |

The safe button ("Cancel" unless stated) is focused first in every destructive dialog.

### 11.5 Error messages

| Situation | Message |
|---|---|
| Wrong email or password | "Email or password is incorrect." |
| Locked after 5 attempts | "Too many attempts. Try again in 10 minutes." (the minutes come from the Users `lockTime`) |
| Disabled account | The message from the `beforeLogin` hook |
| Network failure | "Could not reach Studio. Check your connection and try again." |
| Origin rejected (REST 403 from the CSRF check) | "Studio could not reach the server from this address." |
| Forbidden action | "You do not have permission to do that." |
| Not found | "This document no longer exists." |
| Locked | "Someone else is editing this document." |
| Conflict | "This document changed since you opened it." |
| Unknown | "Something went wrong. Try again." |

### 11.6 Label casing

`{singular}` and `{plural}` lower-case the label only when its second character is lower case, so "FAQs", "SEO defaults" and "AI policies" keep their capitals and "Blog posts" becomes "blog posts".

### 11.7 Remove and Delete

"Remove" takes something out of the current document (array row, block, image from a field, link from text). "Delete" destroys a record. "Duplicate", "Preview" and "Discard" are the only words for those actions.

---

## 12. Keyboard

### 12.1 Rules

- Every binding is registered in `apps/cms/src/studio/lib/shortcuts.ts` with its keys, scope (global, list, document, editor, dialog) and label. The shortcut sheet is generated from it.
- Modifiers must match exactly: ⌘S does not fire for ⌘⇧S.
- Single-key and sequence shortcuts fire only when focus is not in an input, textarea, contenteditable, combobox or the editor, and only when the user has not turned them off (Account, "Single-key shortcuts", default on, preference `singleKeyShortcuts`).
- Sequences (G then H) must complete within 1000 ms.
- On Windows and Linux, ⌘ reads as Ctrl.

### 12.2 Bindings

| Keys | Scope | Action | Phase |
|---|---|---|---|
| ⌘K | global | Open command palette | 6 |
| ⌘\ | global | Toggle sidebar | 1 |
| ? | global (single key) | Shortcut sheet | 6 |
| G then H | global (sequence) | Go to Home | 6 |
| G then B | global (sequence) | Go to Blogs | 6 |
| / | list (single key) | Focus search | 1 |
| J, K | list (single key) | Next, previous row | 5 |
| Enter | list | Open focused row | 5 |
| X | list (single key) | Select focused row | 5 |
| ⌘A | list (focus inside the list) | Select all on page | 5 |
| C | list (single key) | New document | 1 |
| ⌘S | document | Save draft, or save | 1 |
| ⌘↵ | document | Open publish popover; inside it, confirm | 4 |
| ⌘⇧S | document | Open publish popover with Schedule selected | 4 |
| ⌘⌥P | document | Toggle preview pane | 4 |
| ⌘. | document | Toggle inspector | 4 |
| ⌘⇧F | document | Toggle focus mode | 3 |
| Esc | any | See §12.3 | 1 |

- ⌘⌥P replaces ⌘⇧P for the preview pane because Firefox reserves ⌘⇧P. T6.6 checks every binding in Chrome, Safari and Firefox on macOS and Chrome on Windows, and records any conflict in `shortcuts.ts` with its fallback.

### 12.3 Esc order

Esc closes, in this order, the first that applies: an open menu or popover, a dialog or drawer, the palette, focus mode, the list selection, then blurs the search field.

---

## 13. Preferences

Stored in `users.preferences.studio` (one namespace, so Payload's admin keys such as `columnWidths` and saved views are never touched) through `updateStudioPreferences`, validated with Zod. Unknown keys are dropped. The action reads the user's stored preferences inside the request (not the session's copy) and merges only the changed Studio keys, so two tabs never overwrite each other. Payload's admin still writes the whole JSON from its cached copy, so while both admins run, an old-admin preference change can revert a Studio preference saved after that page loaded; this is accepted (preferences only) and ends at cutover.

| Key | Type | Default | Used by |
|---|---|---|---|
| `theme` | `'system' \| 'light' \| 'dark'` | `'system'` | Theme, mirrored to `localStorage['studio-theme']` for the bootstrap |
| `sidebarCollapsed` | boolean | false at 1280px and up, true below | Sidebar |
| `navGroupsClosed` | string[] | [] | Sidebar groups |
| `listLayout` | Record<collection, 'list' \| 'table'> | 'list' for draft collections, else 'table' | S-10 |
| `listGroupsClosed` | Record<collection, string[]> | {} | S-10 List layout |
| `columns` | Record<collection, { key: string; width?: number }[]> | schema default | S-10 Table |
| `density` | `'comfortable' \| 'compact'` | 'comfortable' | Lists |
| `savedViews` | Record<collection, SavedView[]> | {} | S-10 |
| `inspector` | { width: number; collapsed: boolean } | { width: 320, collapsed: false } | S-12 |
| `collapsibles` | Record<collection, Record<path, boolean>> | {} | Collapsible fields |
| `pinnedProperties` | Record<collection, string[]> (max 6) | {} | Property chips |
| `mediaView` | `'grid' \| 'list'` | 'grid' | S-20 |
| `singleKeyShortcuts` | boolean | true | §12 |
| `recentDocuments` | { collection: string; id: string \| number; title: string }[] (max 8) | [] | Palette "Recent" |

The theme is the one exception that is also in `localStorage`, because the bootstrap runs before any data loads.

---

## 14. Accessibility rules

- Inline links in body text are always underlined (1px, 2px offset); colour alone never marks a link.
- Unavailable actions use `aria-disabled` with visible reasons (§2.3), so keyboard users can reach the explanation.
- Hit areas are at least 28 by 28 px, including checkboxes (padding around the 16px box).
- Focus moves: opening a dialog focuses its first field or its safe button; closing returns focus to the trigger; after a delete in a list, focus goes to the next row (or the previous when it was last); after a failed save, to the validation summary; on S-51, to the heading.
- The sign-in brand panel's kinetic headline has a "Pause animation" button (and "Play animation") in its bottom right corner, outside the `aria-hidden` region, so the motion can be stopped (WCAG 2.2.2).
- Status never relies on colour: glyph plus word everywhere (§1).
- Charts have a text alternative: a visually hidden table of the plotted values.

---

## 15. Screen states

Every screen implements every row that applies. Skeletons match the final layout's geometry.

| Screen | Loading | Empty / no results | Error | Forbidden | Focus on arrival | Below 1280 | Acceptance (e2e) |
|---|---|---|---|---|---|---|---|
| S-00 shell | Nav skeleton: 8 grey bars of item height | n/a | Shell loader fails: sheet shows "Studio could not load. Reload the page." with "Reload" | n/a | Skip link first in tab order | Sidebar collapsed by default; collapsed groups open as flyout menus; nav list scrolls, brand row, search and user row stay pinned | Each of the 6 Studio roles sees exactly the collections it can read |
| S-01 sign in | Button shows spinner, inputs read-only while submitting | n/a | §11.5 messages in a banner above the fields, `role="alert"`, fields `aria-invalid` | seo-only user: S-51 forbidden after sign in | Email field | Brand panel hidden below 1180px; panel width `min(776px, 100vw - 480px)` above | Wrong password, lockout, disabled, success to `next`, success to single-domain landing (UI-017), already signed in redirects to `/studio` |
| S-02 forgot | Spinner in button | n/a | Network message | n/a | Email | as S-01 | Same message whether or not the account exists |
| S-03 reset | Spinner in button | n/a | "Passwords do not match.", "Use at least 12 characters.", invalid or expired token "This link is not valid or has expired. Request a new one." with link to S-02 | n/a | New password | as S-01 | Success signs in and lands on `/studio` |
| S-04 account | Field skeletons | n/a | "This email is already used by another account." under Email | n/a | First field | Single column | Save, theme change, password change asks for the current password |
| S-05 home | Card skeletons per region; each region loads independently | New user with no activity: "Nothing here yet. Create your first {singular}." per role's main collection | A failing region shows "Could not load this section." with "Retry"; others still render | n/a | Heading | Cards wrap to 2 columns | Role-scoped content for admin, editor, author, hr, events |
| S-10 list | Row skeletons matching density and layout | §11.3 | "Could not load {plural}." with "Retry" | S-51 | Search field when `q` is set, else the list | Table drops columns in reverse priority (Updated, Published, Category) | Search, sort, pagination, page size, columns survive reload; denied role gets S-51 |
| S-11 create | Form skeleton | n/a | Save errors §3.5 | S-51 when no create permission | Title field | Inspector becomes a drawer | Create, first save replaces URL, guard does not fire |
| S-12 edit | Header, title and field skeletons; inspector skeleton | Deleted while open: banner "This {singular} was deleted." with "Back to {plural}" | §3.5, §3.6, §3.7 | S-51 | Title for a new document; else nothing (page top) | Inspector becomes a drawer opened by ⌘.; title truncates first; Preview becomes an icon button below 120px of free title width | Save draft, publish, schedule, unpublish, conflict, lock, takeover, author restrictions, upload in progress |
| S-13 versions | Row skeletons | "No versions yet" | Retry | S-51 | Heading | Single column | Badges "Latest" and "Live"; pagination for legalDocuments |
| S-14 compare | Two-column skeleton | n/a | Retry | S-51 | Heading | Columns stack | Changed fields carry a "Changed" badge; restore disabled while the open form is dirty ("Save or discard your changes first.") |
| S-15 global | as S-12 | n/a | as S-12 | S-51 | First field | as S-12 | Save (globals have no drafts today); locking with the global slug |
| S-20 media | Tile skeletons | §11.3 media | Upload errors §9.1 | Authors: Upload only | Search | Grid columns reduce | Upload, drop, tray states, keyboard grid |
| S-21 media detail | Preview and field skeletons | n/a | §9 | Read-only for users without update | Alt field | Preview above fields | Save, rename, replace, focal keyboard, delete with usage |
| S-22 picker | Tile skeletons | Empty library message plus Upload | Upload errors | n/a | Search | Dialog full screen | Select, Select n, Insert, upload auto-select, focus return |
| S-30 leads | Row skeletons | "No leads yet" | Retry; retry sync messages "Nothing to retry." (no failed syncs) and "Too many retries. Try again in a minute." (rate limited) | S-51 | Search | Single column | No New button for any role; DSAR flow; export truncation banner |
| S-31 applications | Row skeletons | "No {plural} yet" | Resume download failure "Could not open this file." | S-51 | Search | Single column | Read-only detail; resume opens |
| S-32 users | Row skeletons | n/a | Self-disable guard: "You cannot disable your own account." | S-51 | Search | Single column | Disable with schedule warning; reassign content |
| S-33 integrations | Row skeletons | "No integrations yet" | Test failure shows the response message | S-51 | Search | Single column | Secret sentinel round trip; health states "Healthy", "Degraded", "Failing", "Unknown" |
| S-34 to S-38 | Row skeletons | Per §11.3 | Retry | S-51 | Search | Single column | Per collection in `08` |
| S-40 to S-43 | Panel skeletons | "No data for this period." | Per panel: "Could not load this panel." with "Retry"; not configured: "Connect Google Analytics in Integrations to see this." | S-51 | Heading | Panels stack | Each panel fails independently |
| S-50 lab | n/a | n/a | n/a | Requires `STUDIO_LAB=true` and the admin role | Heading | n/a | Every kit component in every state |
| S-51 | n/a | Not found: "This page does not exist." Deleted document: "This {singular} was deleted." | Error: "Something went wrong." with the Sentry event id (from `captureException`, else `error.digest`) and "Reload" | Forbidden: "You do not have access to this page." seo-only: "Your role cannot use Studio." with "Sign out" | Heading | n/a | Each variant reachable and focused |

---

## 16. Overflow and limits

| Element | Rule |
|---|---|
| Sidebar items (about 50 for admins) | Nav list scrolls; brand row, search and user row pinned |
| Document title in the header | Truncates with an ellipsis, full title in a tooltip; minimum 120px before actions collapse |
| Author avatars | Up to 3, then "+{n}" with names in a tooltip; chips up to 2 then "+{n}" |
| Form tabs | Up to 5 fit; more scroll horizontally with fade edges and arrow buttons |
| Select options | §8.8 |
| Toasts | §11.1 |
| Palette results | Up to 5 per group, 8 in Documents; empty "No results for “{q}”" |
| Quick create on Home | Up to 6 from the Content group in nav order, then "New…" menu for the rest |
| Breadcrumb | Collection plus title only; never deeper |
| Long words and URLs in cells | `overflow-wrap: anywhere` in prose; cells truncate with an ellipsis and a tooltip |

---

## 17. What each phase shows

So nothing appears before it works:

| Element | Phase 1 | Changes |
|---|---|---|
| Sidebar search button and the "Keyboard shortcuts" menu item | Hidden | Shown in Phase 6 |
| Publish on draft collections | A plain primary "Publish" button that publishes immediately after the confirm "Publish this {singular}?" / "It goes live on the site right away." | Phase 4: split button and popover |
| ⌘S | Bound | |
| ⌘↵, ⌘., ⌘⇧S, ⌘⌥P | Not bound | Phase 4 |
| Inspector | One "Details" section listing sidebar fields | Phase 4: tabs |
| Property chips, cover, lead | Not shown; title only | Phase 4 |
| Rich text fields | Placeholder: "Edit this field in the classic admin for now." with a link to the same document in `/admin` | Phase 3: editor |
| Collections with rich text (authors, forms) | Parity ticked in Phase 3, not Phase 2 | |
| Grouped List layout and view tabs | Table only | Phase 5 |
| Locks, conflict check, navigation guard, local recovery | Not active. A save while someone else holds the lock in `/admin` fails with the `locked` toast (`overrideLock: false`), so nothing is overwritten | Phase 4 (T4.9, T4.10): §3.4, §3.8, §4, §6 |
| Session refresh and expiry dialog | Not active; an expired session sends the user to sign in on the next navigation | Phase 4 (T4.10): §3.6, §3.6a |

---

## 18. Deliberate changes from today's admin

Each is intended. A reviewer who finds one of these is not looking at a regression.

| Today | Studio | Why |
|---|---|---|
| ⌘S on a draft collection clicks Publish | ⌘S saves a draft only | Stops accidental publishing (UI-038) |
| H1 can be inserted in rich text | H2 to H4 only; H1 loads and is kept | The page title is the only H1 |
| Slash menu without Table | Table added | Same as the insert menu |
| List page size default 10 | Default 25 | Fewer page turns |
| Bulk "Edit" drawer (field edits on many documents) | Not offered; bulk Publish and Unpublish added | Bulk field edits are rare and risky; bulk publish was its only real use |
| Compare a version against any other version, "modified only" toggle | Same: S-14 compares any two versions (pickers for both sides, default "This version" and "Latest") with "Show changed fields only", on by default | Parity |
| In-app JSON view of a document | "Copy API URL" only | Rarely used; the URL opens the JSON in a new tab |
| Inspector width 300 to 640, default 440 | 280 to 440, default 320 | Writing column keeps 680 px at 1440 wide |
| Restore re-publishes a published version | Restore always creates a draft | No accidental live changes |
| Lists and nav state in localStorage and payload-preferences | `users.preferences.studio` | Follows the user across devices |
| Array rows open unless `initCollapsed` | Honour `admin.initCollapsed`; otherwise collapsed when there are more than 5 rows | Long arrays stay scannable |
