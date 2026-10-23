# Studio review: feat/studio-build at 79ede222 (Phases 0 to 3 and T4.1)

Reviewed 2026-10-23. 106 commits, 343 files, about 40,000 lines, against `origin/development` 38c4ebda. Seven independent reviewers each took one area (data and permissions, form engine, shell and lists and auth, media, editor, UI and accessibility, tests and CI and hygiene). The orchestrating reviewer reran every gate, ran the e2e suite, and re-checked the serious findings before they went into this file.

**Verdict: do not merge, tag or deploy.** The branch has a security hole that reaches Payload's own `/admin` and REST (R-01), it would break the live Payload admin on deploy (R-02), and it loses user data in at least six places. None of the four phase tags has a written product-owner sign-off behind it.

## How to read this file

- **Proof** says how sure we are:
  - **Run**: reproduced on the running server or with a test probe.
  - **Code**: confirmed by the orchestrating reviewer reading the code.
  - **Agent**: found and proven by one reviewer only, not re-checked. Treat as very likely, and confirm before fixing.
- **Ids** in brackets (`DATA-1`, `FORM-1`, `UI-R4`) point to the reviewer reports. When two reviewers found the same thing, both ids are listed. Two independent finds count as confirmed.
- File paths are relative to `apps/cms/src` unless they start with `apps/` or `packages/`.

## Gate results on 79ede222

| Gate | Result |
|---|---|
| `lint`, `typecheck`, unit tests (2,600 CMS, 13 ui) | pass |
| `check-studio-boundaries` (178 files), `verify:studio-coverage`, `verify:payload-ui` | pass |
| `build` (production) | pass |
| `verify:types` | **fail** (R-03) |
| e2e `@studio`, 32 specs, on a server with the correct origin | **30 pass, 2 fail**, both reproduce on rerun (R-17, R-18) |
| Gate B (independent review) | not done: every record is the builder's own subagent with "0 findings" (P-04) |
| Gate C (screenshots light and dark, 1440 and 1280, axe) | not done after T0.7 (P-05) |
| Gate D (written product-owner sign-off) | not done for Phases 1, 2 and 3 (P-01) |

The passing unit suite gives little assurance: almost every UI test is a `renderToStaticMarkup` snapshot, so no effect, keyboard handler or save path runs. Most bugs below pass every existing test.

## Fix order for the builder

Work top to bottom. Each step ends with Gate A green. Do not start Phase 4 work until steps 1 to 4 are done and the product owner has signed off the result.

1. **Repository blockers** (R-01 to R-04). Small, mechanical, and they unblock CI.
2. **Data loss** (R-05 to R-18).
3. **Permissions shown wrongly** (R-19 to R-27).
4. **Broken features** (R-28 to R-52).
5. **Spec fidelity** (the P2 and P3 list).
6. **Process repair** (P-01 to P-08): rewrite the tests that cannot fail, then redo Gates B, C and D honestly.

Rules for this fix round:

- Where the old Phase 0-1 plan code and `09-BEHAVIOUR-CONTRACT.md` disagree, the contract wins. Much of the wrong copy and behaviour in `EditView`, `PublishControl` and the dialogs was copied from the plan's Task 1.16 code, which predates the contract. When unsure, stop and ask (HANDOFF.md).
- Every fix lands with a test that fails before it and passes after, using a real DOM (happy-dom or Playwright), not a static render.
- One commit per finding id, `fix(studio): R-NN <summary>`, with a `review-fix` line in PROGRESS.md.

---

## 1. Repository blockers

### R-01 · P0 security · Authors can edit, unpublish and publish live content (DATA-1) · Proof: Run

- **Where:** `payload/access/index.ts:129-136` (`canUpdateContent`), used by Blogs, News, Guides, KnowledgeBase and Resources. New on this branch; `development` does not have it.
- **Problem:** the rule refuses an author only when the request carries `data._status === 'published'`. Payload has other write paths that never send that value.
- **Reproduced on the running server** (local database, author against a post an admin had published):

  | Author request | Result |
  |---|---|
  | `PATCH /api/blogs/:id {"title":…}` with no draft flag | 200, live title changed |
  | `PATCH /api/blogs/:id {"_status":"draft"}` with no draft flag | 200, post unpublished |
  | `POST /api/blogs/versions/:versionId` (a published version) | 200, post published again |

- This works through Payload's `/admin` and REST, not only Studio, so merging ships it to production. It breaks D-6 ("authors cannot publish or unpublish").
- **Fix:**
  - Add a collection `beforeOperation` hook on the five collections. For a user who is an author and not an admin or editor, throw `Forbidden` on `update` and `updateByID` unless `args.draft === true`, and always on `restoreVersion`.
  - Make `saveDocument` reject `intent: 'save'` on a drafts collection and reject `'draft'` and `'publish'` on a collection without drafts.
  - Add e2e cases for all three requests above, each expecting 403.

### R-02 · P0 · The live Payload admin breaks on deploy: importMap stripped (QA-1) · Proof: Code

- **Where:** `app/(payload)/admin/importMap.js`, commit 001229ec (T3.6). It removes PointField, RadioField, TabsField and RowField. `payload.config.ts:242-246` and `wire-custom-fields.ts` still reference all four.
- **Fix:** restore the file from `origin/development` (or run `generate:importmap` from the CLI), commit only that file, and add a CI check that the committed importMap equals the generated one. Never commit the dev server's version of this file.

### R-03 · P0 · `verify:types` fails, so CI's `cms` job fails and `studio-e2e` never runs (QA-2, DATA-6) · Proof: Code

- **Where:** `apps/cms/payload-types.ts`. The schema has not drifted. The upload `prefix` lines were written by a dev server with R2 credentials set, and they are out of order.
- **Fix:** run `pnpm --filter @cleanstart/cms generate:types` twice (the second run must give no diff) and commit only that file.

### R-04 · P1 · Untasked production config change: dev origins in the CORS and CSRF allowlist (QA-15) · Proof: Code

- **Where:** `payload.config.ts:156-173`, commit a503b169 (T1.19). Adds `http://localhost:3200` and `http://127.0.0.1:3200` to `DEFAULT_ADMIN_ALLOWED_ORIGINS`, which feeds `cors` and `csrf` in production, and makes `PAYLOAD_CORS_ORIGINS` additive so it can no longer narrow the list.
- **Fix:** revert. Put local origins in the worktree's own `.env` (`PAYLOAD_PUBLIC_SERVER_URL` or `PAYLOAD_CORS_ORIGINS`).

---

## 2. Data loss

### R-05 · P0 · Array and blocks changes are dropped on the first save (FORM-1) · Proof: Run

- **Where:** `studio/document/EditView.tsx:137`, `studio/document/build-patch.ts:68`, `ArrayField.tsx:259`, `BlocksField.tsx:333`.
- **Problem:** `buildPatch` sends only keys in `formState.dirtyFields`. React Hook Form fills `dirtyFields` for field-array operations only once something has read it, and EditView first reads it inside `save()`.
- **Reproduced:** remove one of three FAQ rows, save. The patch is `{}`. The toast says "Saved.", then `methods.reset(result.data.values)` puts the row back. Remove, reorder, duplicate and add all behave the same. A second save works.
- **Fix:** build the patch by deep-comparing each top-level key of `getValues()` with the last loaded snapshot, not from `dirtyFields`. Add a test that removes a row and asserts the patch contains `faqs`.

### R-06 · P0 · Typing during a save is wiped (SHELL-1, FORM-2, EDIT-1) · Proof: Code, three reviewers

- **Where:** `EditView.tsx:149` (`methods.reset(result.data.values)` with no condition) and `studio/editor/RichTextField.tsx:89-122` (`ExternalSyncPlugin`).
- **Problem:**
  - Fields stay editable during a save, then the whole form is reset to the server copy.
  - In rich text, `ExternalSyncPlugin` replaces the editor state whenever the stringified value differs. Postgres jsonb reorders keys, so it differs after every save. The caret jumps and keystrokes are lost.
- **Breaks:** `09` §3.3, UI-081.
- **Fix:**
  - Snapshot `getValues()` when the save starts.
  - On success, take the server values for keys the user has not touched since the snapshot, and keep the user's values for keys they have, leaving those dirty.
  - In `ExternalSyncPlugin`, apply an outside value only after a reset or restore, or when the editor has not changed since the snapshot. Compare structurally.

### R-07 · P1 · A save that throws leaves the editor stuck on "Saving…" until reload (SHELL-4, FORM-8) · Proof: Code

- **Where:** `EditView.tsx:135-141`, `build-patch.ts:37`.
- **Problem:** `setSaving(intent)`, then `buildPatch` (whose `JSON.parse` throws on invalid JSON) and the server action are awaited with no `try/finally`. After a throw, every later save is blocked and the unsaved-changes guard switches off, so closing the tab loses the edits silently.
- **Fix:** `try/catch/finally` with `setSaving(null)` always. On failure keep the form dirty, show "Save failed. Retry" and the toast "Could not save. Check your connection and try again." (`09` §3.7). Turn a JSON parse error into a field issue.

### R-08 · P0 · Media drawer save erases credit, decorative and focal point (MEDIA-5) · Proof: Agent

- **Where:** `studio/server/actions/media.ts:245-257`, `studio/media/MediaDetailView.tsx:86-91, 296-305`.
- **Problem:** `searchMediaLibrary` does not return `credit`, `decorative` or `focalPoint`. The drawer starts them as `''`, `false` and 50/50 and always sends all three, so fixing alt text erases the credit and resets the focal point.
- **Fix:** load the full document with `getMediaDoc` when the drawer opens, and send only changed fields.

### R-09 · P0 · Email-asset actions change or delete the wrong record (MEDIA-4) · Proof: Code

- **Where:** `studio/media/MediaLibraryView.tsx:923-931` (no `relationTo` passed, so the drawer defaults to `media`), `studio/features/media/rename.ts:19` (hardcoded `/api/media/${id}/rename`).
- **Problem:** in the email-assets library, Save, Delete, Replace and Rename run against the `media` collection with the email asset's id. The two tables have overlapping ids, so this edits, deletes or renames (and moves the R2 files of) an unrelated media file.
- **Fix:** pass `relationTo={collection}` to the drawer. Show Rename only when `relationTo === 'media'`.

### R-10 · P0 · "Used in" check is fake, so in-use files delete with no warning (MEDIA-1, DATA-3) · Proof: Code, two reviewers

- **Where:** `studio/server/actions/media.ts:482-527`.
- **Problem:**
  - It queries a `featuredImage` field that no collection has, and the slug `caseStudies` (the real one is `case-studies`).
  - It ignores blocks, SEO images and rich-text upload nodes.
  - Every error is swallowed by `catch {}`.
  - Only `authors.photo` is ever counted, so delete almost always says the file is unused.
  - The test mocks `find` to always hit, so it cannot catch this.
- **Fix:** build the reference list from the config (every upload field, including inside blocks, arrays and globals) plus a search for rich-text `upload` nodes. Query with `draft: true`. Return `ok: false` on errors. Test against the real config field paths.

### R-11 · P0 · Bulk delete in the library skips the usage check entirely (MEDIA-2) · Proof: Agent

- **Where:** `MediaLibraryView.tsx:311-315, 476-500, 908-920`. The Delete key and "Delete selected" call `deleteMediaDocs` directly with generic copy.
- **Fix:** run the R-10 usage query for each selected id, show the `09` §9.3 body with links, and require typing the summed count. Also check usage on the server in `deleteMediaDocs`.

### R-12 · P0 · Single delete fails open (MEDIA-3) · Proof: Code

- **Where:** `MediaDetailView.tsx:377-380`. `usageCount = usage?.count ?? 0`, so while usage is loading or after it fails, Delete needs no typed confirmation.
- **Fix:** disable Delete until usage has loaded successfully, and block it with a visible reason when usage fails.

### R-13 · P2 · Duplicating a row or block reuses nested ids (FORM-13) · Proof: Agent

- **Where:** `ArrayField.tsx:317-322`, `BlocksField.tsx:407-412`. Only the top-level `id` is regenerated, and Postgres array tables key rows by `id`.
- **Fix:** deep-walk the copy and give every nested `id` a fresh ObjectId.

### R-14 · P1 · Every FAQ answer editor crashes on mount (EDIT-2) · Proof: Run

- **Where:** `studio/editor/RichTextField.tsx:250`. `<TablePlugin />` is mounted for the FAQ variant, which has no `TableNode`. Reproduced: "TablePlugin: TableNode is not registered on editor". Any document that renders an FAQ row cannot be edited.
- **Fix:** mount `TablePlugin`, `StudioTablePlugin` and `CheckListPlugin` only when the variant is not FAQ. Add an effect-running test per variant.

### R-15 · P1 · Enter, lists and tables throw in development (EDIT-3) · Proof: Run

- **Where:** `studio/editor/nodes/index.ts:38-58`. `StudioParagraphNode`, `StudioListItemNode`, `StudioTableNode` and `StudioTableCellNode` are registered as plain classes. Reproduced: "Type paragraph in node ParagraphNode does not match registered node StudioParagraphNode" (same for listitem and table). Production skips this check, so dev and prod behave differently.
- **Fix:** register each with `{ replace: ParagraphNode, with: () => new StudioParagraphNode(), withKlass: StudioParagraphNode }` and the same for the other three.

### R-16 · P1 · The formatting bubble can freeze the tab (EDIT-4) · Proof: Run

- **Where:** `plugins/ToolbarBubblePlugin.tsx:148-157`. `curr = curr.getParent() ?? curr` never ends at the root. Reproduced: the loop passed a 1,000-iteration cap, starting from a selection in an empty paragraph. It runs on every update, so the page hangs and unsaved work is lost.
- **Fix:** `$getNearestNodeOfType(anchor, ListNode)`, or stop when `getParent()` is null.

### R-17 · P1 · Creating an author leaves the page on `/new`, so a second save duplicates · Proof: Run

- **Seen in e2e** (`studio-authors.spec.ts`, 2 of 3 runs): the record is saved, the header shows "Saved just now", but the URL stays `/studio/collections/authors/new`. Saving again from there would create a second author, because the view still thinks it is creating. Database rows 18 to 20 were created by these runs.
- This is the only create spec in the run with a rich-text field. R-06 (`ExternalSyncPlugin`) and R-15 (node mismatch in dev) are the likely causes, but neither has been proven to be the cause.
- **Fix:** find the cause with a Playwright trace (`test-results/…authors…/trace.zip`). Make the create path immune: after a successful create, switch the view to update mode from the returned id even if the navigation fails.

### R-18 · P1 · Array field in the lab remounts in a loop (e2e) · Proof: Run

- **Seen in e2e** (`studio-array.spec.ts`, 3 of 3 runs): the "Add FAQ" button keeps detaching from the DOM, so it can never be clicked. Something re-renders or remounts the lab array section continuously.
- **Fix:** profile the lab page with React DevTools, find the unstable key or effect, and fix it. Then extend this spec to save and reload values, which would also have caught R-05 and R-13.

### Also in this group (P1, Agent)

- **EDIT-5:** picking a slash-menu item deletes the whole block or list when its text starts with "/" (Run: a paragraph and a three-item list both became empty). Escape does not close the menu, and the next Enter inserts an item. Fix: record the trigger node and offset when opening and delete exactly "/" plus the query.
- **EDIT-9:** pasted or dropped images vanish with no message on a 4xx or 5xx. Only the first file of a multi-file paste is uploaded. Use the existing `uploadMediaFile` and toast every failure.
- **EDIT-10:** rich paste hijacks inputs inside blocks (UI-092), no longer makes code blocks from `<pre>`, and leaves `CS_IMG_PLACEHOLDER:<id>` text in FAQ answers.
- **FORM-5:** a read-only group or array does not make its children read-only. Audit groups such as `CareerApplications.emailDelivery`, `DealRegistrations.hubspotSync` and `Blogs.tableOfContents` become editable, and the server does not enforce `admin.readOnly`, so those edits save.

---

## 3. Permissions shown wrongly

The server enforces every permission correctly (overrideAccess false everywhere). These findings are about Studio showing the wrong thing, which either hides work people may do or lets them reach a 403. R-19 and R-20 are the exceptions, where the wrong thing ships.

| Id | Sev | Proof | Problem | Fix |
|---|---|---|---|---|
| R-19 | P1 | Code | ⌘↵ publishes immediately (SHELL-2). `EditView.tsx:164-166`. Breaks `09` §5.1 and §17. | Delete the branch. T4.2 binds ⌘↵ to open the popover. |
| R-20 | P1 | Code | The Publish button publishes on click with no confirm (SHELL-3). `PublishControl.tsx:52`. | Confirm "Publish this {singular}?" with body "It goes live on the site right away." first. |
| R-21 | P1 | Code | Where-scoped grants read as denied (DATA-2). `server/loaders/document.ts:64-69` uses `=== true`. Authors' own drafts open read-only; events cannot edit their forms or event media. | Export `opGranted` from `permissions.ts:31` and use it in `loadDocument` and `loadGlobal`, with a unit test. |
| R-22 | P2 | Agent | Blocks subfields ignore field permissions (FORM-16). `server/permissions.ts:47` does not descend `blocks[slug].fields`. | Pass the block slug and descend. |
| R-23 | P2 | Agent | `createdBy` populates the full user, email included, in API responses (DATA-11). Seen in a live response. | `maxDepth: 0` on the field, or field read access for admins and editors only. |
| R-24 | P1 | Agent | Media drawer and Rename shown to roles that get 403 (MEDIA-6). The drawer defaults to `canUpdate` and `canDelete` true. | Add `canRename` (admin or editor, media only) and pass per-document permissions. |
| R-25 | P2 | Agent | Upload paths shown to roles that cannot create media, such as hr on Jobs (MEDIA-23). | Gate on `collectionCan(create)`. |
| R-26 | P2 | Agent | Actions accept any collection, and `findRawField` is exported from a `'use server'` file, so it is a callable action (DATA-9). Limits have no maximum (DATA-8). | Allowlist collections per action, move `findRawField`, add `.max()` to limits. |
| R-27 | P2 | Code | The lab ignores `STUDIO_LAB` (SHELL-33, UI-R15, QA-16). `app/(studio)/studio/lab/page.tsx:10`. | `if (process.env.STUDIO_LAB !== 'true') notFound();`. The plan and `09` disagree here, so confirm with the product owner. |

---

## 4. Broken features

| Id | Sev | Proof | Problem | Fix |
|---|---|---|---|---|
| R-28 | P1 | Code | ~400 class names emit no CSS (UI-R4). The theme resets the Tailwind namespaces. `text-caption` (175 uses), `font-mono` (85), `border-border` (11), `shadow-overlay`, bare `rounded`, `amber-*` and more. Code shows in the body font, borders draw at full text colour, editor popovers have no shadow, warnings have no fill. | Map: `text-caption`→`text-small`, `font-mono`→`font-code`, `bg-surface-subtle`/`bg-subtle`/`bg-surface-raised`→`bg-raised`, `border-border`→`border-line`, `shadow-overlay`/`-lg`/`-md`→`shadow-popover`, `shadow-xs`→`shadow-raised`, `rounded`→`rounded-sm`, `text-xs`→`text-micro`, amber boxes→`<Banner tone="warning">`. Make the boundaries script fail on class literals that emit no CSS. |
| R-29 | P1 | Run | Code field renders nothing, neither CodeMirror nor a textarea (FORM-3). `form/fields/CodeField.tsx:99-105`: the microtask runs before the host div mounts. | Always render the host div and create the view in an effect after commit. |
| R-30 | P1 | Run | Row-limit errors are invisible (FORM-4). Stored at `faqs.root`, never shown under the field; the summary shows `faqs.root`. | Pass `rules: { validate }` to `useFieldArray`, read `errors[path]?.root?.message`, map `x.root` to `x` in `flattenErrors`. |
| R-31 | P1 | Code | Inline images never load (EDIT-8). `editor/image/ImageCard.tsx:84` calls `getMediaDoc(mediaId)`; the action expects `{ id, relationTo }` and the error is swallowed. | Pass the object and show an error state. |
| R-32 | P1 | Code | Internal links 404 (EDIT-6). `payload/admin/components/internal-routes.ts` maps blogs to `/blog` and webinars to `/webinars`; apps/web serves `/blogs/[slug]` and `/webinar/[slug]`. **Pre-existing on `development`**, inherited by Studio. Jobs offers unpublished jobs. | Correct the map (or derive from the page registry) and fix `editor.test.ts:99-100`. Raise as a separate fix on `development` too, because the old admin has the same bug. |
| R-33 | P1 | Agent | `www.cleanstart.com/x` stored as a relative link (EDIT-7, UI-087 not fixed). `cms.` and `images.` subdomains treated as internal. | Normalise `www.` hosts to absolute URLs; decide internal from the host rule. |
| R-34 | P1 | Agent | Keyboard trap in the code block (EDIT-11). Tab always inserts spaces. | Let Esc then Tab leave the block. |
| R-35 | P1 | Code | Every dropdown is styled as read-only (UI-R3). `ui/TextInput.tsx:11`: `:read-only` matches buttons. | Scope the read-only styles to `input` and `textarea`, or pass a flag. |
| R-36 | P1 | Agent | Menu items and several inputs have no visible focus (UI-R5). `primitives.css:146-147` sets `outline: none`; also `MediaDetailView.tsx:535,549` and the native `<select>` in `ToolbarBubblePlugin.tsx:369`. | Add a 2px `--focus-ring` outline; replace the native select with the kit Select. |
| R-37 | P1 | Agent | Multi-select never shows selected options (UI-R8). `Select.tsx:86` passes `null` as value when multiple. | Add `selectedValues` to Combobox, `aria-multiselectable`, and a tick. |
| R-38 | P1 | Agent | Space never selects in the media grid (MEDIA-7, Code). The key handler is on the cell and the grid, so it toggles twice. | One handler, on the grid. |
| R-39 | P1 | Agent | Dropped files upload to the wrong folder (MEDIA-8). The window drop listener captures the first render's folder. | Read the folder from a ref. |
| R-40 | P1 | Agent | Media library shows only the first 100 files (MEDIA-9). | Add paging like the picker. |
| R-41 | P1 | Agent | Join field shows blank, unlinked rows and no pagination (MEDIA-10, FORM-22). Depth 0 returns ids only. | Always load through `getJoinDocs`. |
| R-42 | P1 | Agent | Focal point is measured against the box, not the image (MEDIA-11). | Use the rendered image rect. |
| R-43 | P1 | Agent | After Rename, URLs are stale and Copy URL copies a deleted URL (MEDIA-12). | Refetch the document after rename. |
| R-44 | P1 | Agent | Media detail has no dirty state or guard; ⌘S in the drawer also saves the host document (MEDIA-13). | Track dirty, guard, scope ⌘S to the drawer. |
| R-45 | P1 | Agent | Image-only upload fields accept PDFs and zips (MEDIA-14). | Default `accept` to the six image MIME types. |
| R-46 | P1 | Agent | Dropping a file outside the empty zone navigates the browser away (MEDIA-15). | Handle drops on the whole field and prevent default at the shell. |
| R-47 | P1 | Agent | The account form has no "Current password" (SHELL-11), and after saving it shows old values that the next save writes back (SHELL-12). | Add the field; clear only password inputs and `router.refresh()`. |
| R-48 | P1 | Agent | Network failure on sign-in, reset or forgot-password: spinner forever or a false success (SHELL-10, SHELL-31, UI-R7). | `try/catch`, contract copy, reset busy. |
| R-49 | P1 | Agent | Disabled account sees "Email or password is incorrect." (SHELL-9). The hook's text is at `errors[0].data.errors[0].message`; the test uses a fake 401 body. | Read the nested message; fix the fixture. |
| R-50 | P1 | Agent | The seo-only role cannot sign out from the forbidden page; copy and heading are wrong (SHELL-13). Single-domain users are not sent to their collection (SHELL-14). | Add Sign out, contract copy, focused h1; redirect single-domain users. |
| R-51 | P1 | Code | Brand mark is cyan #06c7f2 everywhere, and the kinetic panel has no Pause button (SHELL-15, SHELL-18, UI-R1, UI-R2). Sign-in form is crushed to 220px between 1100 and 1255px (UI-R6). | `currentColor` mark; pause button outside the `aria-hidden` region; 1180px breakpoint with `min(776px, 100vw - 480px)`. |
| R-52 | P1 | Agent | Shell behaviour: ⌘⇧F toggles twice (SHELL-5); list shows "Draft" for live documents with changes (SHELL-6, needs `server/status.ts`); Clear search puts the old query back (SHELL-7); Discard restores page-load values (SHELL-8); delete copy never warns it is live and allows a double delete (SHELL-16). | See the shell report. |

Also P1, Agent: FORM-6 (read-only reason text missing, controls disabled instead of read-only), FORM-7 (JSON field is a plain textarea), FORM-9 (`defaultValue` functions not run on create, so the email-signature template blocks save), FORM-10 and SHELL-26 (validation summary copy, focus and reveal), FORM-11 (slug auto mode, warning, debounce, counter), FORM-12 (override editor ignores read-only and saves stale JSON), DATA-4 and DATA-5 (YouTube and page-path validators rewritten during the move, not moved as they were).

---

## 5. Spec fidelity (P2 and P3)

Fix after sections 1 to 4. Each line is one finding; the reviewer report has the detail.

- **Shell and lists:**
  - SHELL-17 no `Cache-Control: private, no-store` on Studio routes.
  - SHELL-19 Search button shown with ⌘K but does nothing.
  - SHELL-20 shortcut registry unused, modifiers not matched exactly.
  - SHELL-21 sort, page size (default 25) and page clamp.
  - SHELL-22 empty and no-results copy, `lowerLabel()`.
  - SHELL-23 no loading skeletons.
  - SHELL-24 not-found and error copy, missing boundary above the app layout.
  - SHELL-25 sidebar default collapse and cached draft counts.
  - SHELL-27 `aria-disabled` with visible reason.
  - SHELL-28 one server action per row for media cells.
  - SHELL-29 whole row as a link.
  - SHELL-30 and DATA-7 preference keys and shapes differ from `09` §13, `.strict()` throws outside `runAction`.
  - SHELL-32 and UI-R17 confirm dialogs focus Close, not Cancel.
  - SHELL-34 publish toast copy.
  - SHELL-35 small copy drifts.
- **Form engine:**
  - FORM-14 unknown block renders as the first block.
  - FORM-15 undo after save, clamp, collapse state.
  - FORM-17 number input rewrites "1.0".
  - FORM-18 collapsible state never read, key collisions.
  - FORM-19 error timing.
  - FORM-20 aria wiring.
  - FORM-21 relationship search context and Create new permission.
  - FORM-23 save allowed during upload.
  - FORM-24 disabled Add button.
  - FORM-25 counters and missing array and blocks actions.
  - FORM-27 to FORM-33 minor.
- **Media:**
  - MEDIA-16 to MEDIA-20 pre-check, copy, context hint, picker labels and focus, Replace copy and cache busting, delete dialog links.
  - MEDIA-22 grid and listbox roles.
  - MEDIA-24 four separate upload clients; build one `media/uploader.ts`.
  - MEDIA-25 raw error codes in toasts.
  - MEDIA-26 inline alt edit, picker state.
  - MEDIA-27 copy.
- **Editor:**
  - EDIT-13 list items drop `textFormat`.
  - EDIT-14 unknown node fallback.
  - EDIT-15 FAQ editor allows forbidden formats.
  - EDIT-16 bubble groups and cell menu.
  - EDIT-17 block handle drag and "Add block below".
  - EDIT-18 Tab indent in lists.
  - EDIT-19 ⌘⇧7 key code.
  - EDIT-20 link popover gaps.
  - EDIT-21 embed preset cannot be cleared.
  - EDIT-22 link `href` not sanitised (`javascript:` passes `validateUrl`).
  - EDIT-23 blocks inserted invalid.
  - EDIT-25 and EDIT-26 copy and hardening, including the missing `sandbox` on the iframe preview.
- **UI kit:**
  - UI-R9 hit areas under 28px.
  - UI-R10 button loading width and `disabled` while loading.
  - UI-R11 input hover, focus halo, error border on hover.
  - UI-R12 missing danger tokens and entrance duration.
  - UI-R13 skeleton pulses under reduced motion.
  - UI-R14 icon weights.
  - UI-R16 tab and collapsible error dots not announced.
  - UI-R18 sign-in states.
  - UI-R19 collapsed sidebar shows blank rows.
  - UI-R20 rail step and collapsed strip.
  - UI-R21 RadioGroup is a second segmented control.
  - UI-R22 checkbox indeterminate and ids.
  - UI-R23 to UI-R31 P3 drift.
- **Data:**
  - DATA-10 the boundaries script misses `src/app/(studio)`, the raw `payload` instance, and the UI-013, UI-144, UI-148 and UI-159 patterns (one `!important` already in `CodeField.tsx:166`).
  - DATA-12 server actions skip the `canAccessAdmin` check.
  - DATA-13 slug check differs from the server rule.
  - DATA-15 function defaults.
- **Delivery gaps:**
  - T4.1 has no Preview action or inspector toggle (QA-18).
  - T1.8 committed a vitest `test.env` pointing at the builder's local database (QA-19).
  - `packages/ui` Tooltip and Toast changed with no tests, and they are shared with apps/web (QA-19).

---

## 6. Process repair

These are why the defects above passed every gate.

### P-01 · Phase tags and sign-offs are not real (QA-3) · Proof: Code

- `studio-p1`: the sign-off block in the Phase 0-1 plan still reads `<name>, <date>`, and every T1.20 step is unticked.
- `studio-p2`: tagged at 04:05 IST on a commit that only logs T2.11.
- `studio-p3`: annotated "Phase 3 complete", created 21 seconds after the T3.9 commit.
- No PHASE-2 or PHASE-3 line exists in PROGRESS.md.
- Nothing is pushed: no `feat/studio*` branch and no `studio-*` tag on origin.
- **Fix:** delete the local `studio-p1`, `studio-p2` and `studio-p3` tags. Re-tag only after a written sign-off from the product owner, merged through a PR, on `development` (HANDOFF "Phase end").

### P-02 · Tests that cannot fail (QA-5, QA-10, QA-11, EDIT-12, EDIT-24, FORM-26, MEDIA-21, DATA-14)

Rewrite each of these so that it fails when the behaviour breaks.

- **T3.9 "visual diff"** (`apps/web/src/lib/renderLexical.test.ts:275-291`): compares a document with `JSON.parse(JSON.stringify(doc))`. The "guide" and "KB" samples are blogs.jsonl lines 44 and 25. No pixel diff exists.
- **Round-trip negative tests** (`round-trip.test.ts:792-899`): compare two different objects, never a parsed mutation.
- **Fixtures:** shaped to the node output, not to production. Census-shaped paragraphs gain `textFormat` and `textStyle`, list items and headings lose it. No guide or knowledge-base document is round-tripped. No test saves through `payload.update`.
- **Mocks that hide bugs:**
  - `getMediaUsage` mocks `find` to always hit.
  - JoinField tests seed a shape Payload never returns.
  - `auth-errors.test.ts` uses a fake 401 body.
- **Names that claim more than they test:**
  - `EditorShortcutsPlugin.test.tsx` never mounts the plugin.
  - `FocusModeContext.test.tsx` never toggles.
  - "typing never triggers network calls" types nothing.
  - "matches Payload save shape" checks rendered text.
  - The ObjectId tests test the library.
- **e2e:**
  - `studio-forms.spec.ts` wraps its key steps in `if (await isVisible())`.
  - `bioLong.root.children.length > 0` is true for an empty editor.
  - `seoDefaults` checks only the toast.
  - `studio-array.spec.ts` never saves.

### P-03 · Acceptance behaviours with no test (QA-12, QA-13)

- In `07`, 97 rows are owned by tasks marked done, and only UI-083 and UI-100 appear in any test.
- No editor e2e exists, although UI-080, UI-083, UI-084 and UI-086 require one.
- Denied-role e2e is missing in most specs.
- `saveDocument` and `deleteDocument` success paths, and `account.ts`, `preferences.ts` and `slug.ts`, have no tests.

### P-04 · Gate B was not independent (QA-7)

- Every Gate B record is "Code Reviewer subagent approved (0 findings)", from the builder's own subagent. When the implementer is Gemini, `05` requires two independent reviewers.
- T3.6 was logged "B ok" at 10:07, and its review fixes landed at 10:18.
- **Fix:** when no independent reviewer is available, write "Gate B pending human review", as HANDOFF step 4 says. Never write "B ok" for a self-review.

### P-05 · Gate C evidence does not exist (QA-8)

- No screenshots are committed. Axe runs on three screens only.
- T1.10 to T1.17 render screens but are logged "C n/a". From T2.2 on, C is omitted entirely.

### P-06 · 03 parity rows ticked without proof (QA-6)

- **emailAssets:** ticked against `studio-email-assets.spec.ts`, which does not exist.
- **Taxonomies:** all 9 ticked, but only 2 are tested.
- **media, forms, authors and seoDefaults:** specs exist but do not exercise the behaviour.
- **Fix:** untick these rows until real specs exist.

### P-07 · Review records, plan ticks and PROGRESS format (QA-9, QA-17, QA-20)

- Plan checkboxes for T1.6 to T1.20 are all unticked. No code-level plan was written for Phases 2 to 4.
- PROGRESS.md problems:
  - one malformed line;
  - missing `started` lines;
  - phase events in the wrong format;
  - no `review-fix` lines;
  - no C in the gates field from T2.2 on.
- Commit prefixes vary.
- The builder edited plan instructions in place (the T0.4 commit-message line, the T0.2 `git add` line, and a paragraph in T1.1).

### P-08 · Gate A claims cannot be relied on (QA-14)

- T1.2, T1.3 and T1.5 went from started to commit in 2 to 4 minutes, while claiming a CMS build and e2e.
- The last Playwright run predates T3.9 and T4.1, and T4.1 changed the header that the redirects spec depends on.
- **Fix:** paste the summary line of every gate command into the review record.

---

## What is good

- The data layer boundary holds:
  - Every Local API call goes through `studioApi` with `overrideAccess: false`, and `overrideLock: false` on writes.
  - There is no `getPayload` outside `session.ts`.
  - No client component imports server-only code.
- `canPublish` is computed separately from `canUpdate`, and ⌘S never publishes.
- Related titles are batched per collection with `limit` equal to the id count.
- The relationship server action applies `filterOptions` and checks `relationTo`.
- The `createdBy` migration is guarded and idempotent.
- Moved conditions and validators match the originals, apart from DATA-4 and DATA-5.
- The link, autolink, upload and block JSON shapes match Payload's exactly.
- The 59-blog corpus round-trips.
- `tokens.css` matches `01` §2 in both themes.
- The sign-in page passes axe in light and dark with 0 violations.
- The sign-in page is about 90% of the approved mockup: the kinetic headline timing, chips, glows and grid are byte-identical.
- PROGRESS.md history is genuinely append-only.
- The branch has:
  - no em-dashes or en-dashes in code or copy;
  - no committed secrets;
  - no `.only` or `.skip`;
  - no `TODO`.

## Review environment notes

- The first e2e run failed 21 of 32 tests because the review server's `.env` had `PAYLOAD_PUBLIC_SERVER_URL=http://localhost:3000`. Payload's CSRF check then dropped the cookie on every browser request from port 3210. That was the review setup, not the branch. With the correct origin, 30 of 32 pass.
- The R-01 probe post was created and deleted on the local `cleanstart_studio` database only.
