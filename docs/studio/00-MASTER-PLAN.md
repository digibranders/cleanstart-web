# CleanStart Studio: master plan

Status: signed off 2026-10-16, direction B 2026-10-19, hardened for implementation 2026-10-21 · Owner: Gaurav Jadhav

Studio is a custom admin app for the CleanStart CMS. Payload stays as the backend (schema, access control, hooks, versions, jobs, REST). Studio replaces every screen of Payload's admin UI. No Payload admin component renders inside Studio.

## Documents in this set

| Doc | What it is for |
|---|---|
| `00-MASTER-PLAN.md` (this file) | Scope, architecture decisions, phases, exit criteria, risks, timeline |
| `01-DESIGN-SYSTEM.md` | Tokens, type, color, motion, every UI component with its states |
| `02-SCREENS.md` | Every screen: route, layout, regions, components, data, states, keyboard |
| `03-FIELD-AND-COMPONENT-MAP.md` | Every field type, every collection and global, and every existing admin file mapped to its Studio replacement |
| `04-EDITOR-SPEC.md` | The rich-text editor: nodes, JSON contract, features, tests |
| `05-REVIEW-PROTOCOL.md` | The review gates every task passes, with checklists |
| `06-IMPLEMENTER-GUIDE.md` | Read first: rules, file map, recipes, repo traps, when to stop and ask |
| `07-UI-ISSUES-REGISTER.md` | Every known bug in the current admin (UI-001 to UI-162), how Studio resolves it, the owning task and its acceptance check; backend follow-ups F-1 to F-16 |
| `08-PHASE-2-7-TASKS.md` | Every task of Phases 2 to 7 with scope, behaviour, tests and acceptance |
| `09-BEHAVIOUR-CONTRACT.md` | Exact behaviour and copy: status model, permissions, saving and concurrency, locks, publishing, lists, fields, media, preview, keyboard, preferences, screen states |
| `research/` | Evidence the plan is built on: schema dump, component catalog, workflows and roles, Lexical contract, design inputs |
| `../superpowers/plans/2026-10-16-studio-phase-0-1-foundation.md` | Step-by-step tasks for Phases 0 and 1 |

Phases 2 to 7 are broken into tasks in `08-PHASE-2-7-TASKS.md`. Their code-level steps are written at the start of each phase from that file, against the code the earlier phases produced, because writing code now would mean guessing at interfaces that do not exist yet.

## Why Studio exists

The current admin is Payload's admin with about 21,500 lines of SCSS and 238 custom component files on top. It looks and feels broken because it fights Payload's markup:

- 222 `!important` rules override Payload CSS that changes between releases.
- 19 components work by finding Payload's DOM (`#action-save`, `.document-fields--has-sidebar`, `.nav-group`) and patching it with MutationObservers.
- Payload's root font size is about 13px, so rem values land on half pixels and text blurs.
- Payload rebuilds form state on the server as you edit, so typing in a long document feels slow.

Restyling more cannot fix these. Owning the markup can.

## Goals

1. Every screen, field, workflow and rule that editors use today works in Studio, verified against the maps in `03-FIELD-AND-COMPONENT-MAP.md`.
2. A restrained, consistent UI in the Linear and Vercel tradition (direction B, D-10): one type scale, one spacing grid, one radius scale, full light and dark themes, keyboard first.
3. No change to stored data. Every document Studio saves is one Payload would accept and `apps/web` renders the same way.
4. Payload access control, hooks and locking stay the single source of truth.
5. Interaction stays fast: typing in a field never waits on the network, list pages render on the server, and the target INP is under 200ms.

## Non-goals for v1

- New editorial features beyond parity, except where a current behaviour is broken (listed under "Fixes Studio makes by design").
- Autosave. No collection has it today.
- Changing roles or access rules, with one signed-off exception: author own-draft editing (D-6). Other gaps found in research are logged as follow-ups.
- Mobile layouts below 1024px. Studio supports 1280px and up, and stays usable from 1024px (sidebar collapsed, inspector as a drawer).
- Localization. The CMS has none.

## Fixes Studio makes by design

These come free with owning the UI, so they are in scope:

- ⌘S saves a draft and never publishes (today it clicks Publish on draft collections, UI-038). Every other deliberate change from today's behaviour is listed in `09` §18.
- One toast system instead of two (`ToastBus` and `ToastProvider`).
- The command palette navigates client side and runs one search request instead of a full reload plus 10 REST calls.
- Native `alert()` and `confirm()` calls are replaced by `ConfirmDialog`.
- Keyboard access for the date picker grid, command palette, media grid and context menu (audit score 6/10 today).
- The publish checklist refreshes after every save instead of going stale.
- The shortcut sheet matches the real shortcuts. Today the help dialog says ⌘/ toggles focus mode, but ⌘/ actually reopens the help dialog.
- The SEO fields move into the inspector's SEO tab as 5 sections (about 20 stacked cards today, per `docs/cms-audit/05`).
- `BytesCell` is mounted for media `filesize` (wired today but never rendered).

## Architecture decisions

Each decision has an id so reviews can cite it.

### ADR-1: Studio lives inside `apps/cms` as its own route group

- Routes live in `apps/cms/src/app/(studio)/studio/**` with their own root layout. `src/app` has no top-level `layout.tsx`, so `(payload)` and `(studio)` are independent root layouts. Moving between them is a full page load, which keeps Payload's CSS out of Studio and Studio's CSS out of Payload.
- The implementation lives in `apps/cms/src/studio/**`. Route files stay thin and import from there.
- Same origin as the API means the `payload-token` cookie, CORS, CSRF and CSP all work unchanged. The proxy (`src/proxy.ts`) only matches `/api/:path*`, so it does not touch `/studio`.
- Rejected: a separate `apps/studio`. It would need a new deploy target, cross-origin cookies, CORS changes, CSP changes on `apps/web` and a REST-only data layer.

### ADR-2: Reads and writes go through Payload's Local API, always as the user

- Server components and server actions call `find`, `findByID`, `findDistinct`, `count`, `create`, `update`, `delete`, `duplicate`, `findVersions`, `findVersionByID`, `restoreVersion`, `findGlobal`, `updateGlobal`, `findGlobalVersions`, `restoreGlobalVersion`, `jobs.queue` and the `payload-locked-documents` operations through one wrapper, `apps/cms/src/studio/server/payload.ts` (`studioApi(session)`). A method the wrapper does not expose is added there first, never called directly.
- The wrapper builds a request with `createLocalReq({ user, req: { headers } }, payload)` and always passes `overrideAccess: false`, `overrideLock: false` and `req`. Without these, the Local API skips every access rule and ignores locks (`payload/dist/collections/operations/local/update.js:7`, `utilities/checkDocumentLockStatus.js:3`).
- A boundary check (`verify:studio-boundaries`) fails the build if any file under `src/studio/**` imports `getPayload` outside the wrapper or contains `overrideAccess: true`.
- Duplicate and delete go through `payload.duplicate` and `payload.delete` so `beforeDuplicate`, audit, search and revalidate hooks fire.
- Permissions come from `getAccessResults({ req })`, the same function Payload's `/api/access` uses, and `docAccessOperation` for one document. Publish permission is the update access evaluated with `data: { _status: 'published' }` (the check Payload makes in `getDocumentPermissions.js:30-37`); it is a separate value from update, because authors (D-6) can update their drafts but not publish (`09` §2.2).

### ADR-3: Auth stays on Payload's REST endpoints

- Login, logout, forgot password and reset password forms post to `/api/users/login`, `/logout`, `/forgot-password` and `/reset-password` from the browser. Payload keeps owning cookies, sessions (`useSessions` is on), the 5-attempt lockout and the `enabled` check in `beforeLogin`.
- The session cookie stays `payload-token`. The proxy and the planned Cloudflare cache bypass key on it.
- Reset emails link to `/admin/reset/:token` today (`forgotPassword.js:93-96`). Phase 7 sets `auth.forgotPassword.generateEmailHTML` on Users to link to `/studio/reset-password/:token`, built on the existing Brevo layout.

### ADR-4: Uploads go through REST, everything else through server actions

- File uploads post to `/api/media` (and `/api/emailAssets`) with `XMLHttpRequest` so editors get a progress bar. Next server actions cap request bodies at 1MB by default and report no progress.
- Rename uses `POST /api/media/:id/rename`. URL ingest uses `POST /api/media-ingest-url`.

### ADR-5: Studio reads the schema from the Payload config, at runtime

- `buildStudioSchema(slug)` walks the sanitized config (`payload.collections[slug].config`, `payload.globals.config`) and returns a serializable `StudioSchema`: field tree, labels, options, relations, positions, descriptions, read-only flags, plus keys for conditions, validators and custom components.
- New fields in a collection appear in Studio with no Studio change, rendered by the generic renderer for their type.

### ADR-6: Conditions and validators move to one shared, client-safe module

- 87 `admin.condition` functions and 62 `validate` functions are inline today. A function cannot be sent from server to client, and Payload works around that by rebuilding form state on the server, which is what makes editing slow.
- Pure conditions move to `apps/cms/src/payload/admin-logic/conditions.ts` and pure validators to `admin-logic/validators.ts`. Collection configs import them from there, so there is one source of truth. Both modules import nothing server-side.
- `buildStudioSchema` maps each function back to its key through a registry. A test fails if any condition in the config is not registered.
- Validators that need the database (the slug collision check in `fields/slug.ts:98-135`, for example) stay server-only. Studio shows their result from the save response.

### ADR-7: Client form state uses react-hook-form, the server stays the gate

- One form store per document, with field-level subscriptions so typing re-renders one field.
- On the client: required, min/max length, number bounds, email shape, and the shared pure validators.
- On save: Payload validates everything. Errors come back as `{ path, message }[]` and land under the right field, the same pattern `apps/web` forms use with `issuesToErrors()`.
- Adds the dependency `react-hook-form` (MIT, no transitive dependencies). The alternative, a hand-written store with nested arrays, blocks and subscriptions, is weeks of work.

### ADR-8: Custom field UIs resolve through a registry that is checked in CI

- The config names custom components by path (for example `@/payload/admin/components/SeoTitleField.tsx#SeoTitleField`). Studio keeps `src/studio/form/registry.ts`, which maps each path to a Studio component or to "use the generic renderer".
- A coverage test loads the config, collects every component path, and fails if one has no registry entry. The same test covers cell components and row labels.

### ADR-9: The rich-text editor is Lexical, hosted directly, with Payload's exact node shapes

- Studio mounts `lexical` and `@lexical/react` 0.41.0 (already installed) with node classes that serialize exactly as Payload's: link v3, autolink v2, upload v3, block v2, relationship v2, plus the existing `embed` node.
- A round-trip test is the gate: for every fixture document, load the JSON, export it unchanged, and require deep equality. Fixtures come from `migrations/webflow-export/transformed/blogs.jsonl` (59 blogs, already in the repo) plus hand-built fixtures for embed, upload, inlineCta and tables.
- Full contract in `04-EDITOR-SPEC.md`.

### ADR-10: Studio styles with Tailwind v4 and its own tokens

- Tailwind v4.3 is already in the workspace for `apps/web`. Studio adds `tailwindcss` and `@tailwindcss/postcss` to `apps/cms` and imports one stylesheet, `src/studio/styles/studio.css`, only from the Studio root layout.
- `packages/ui` primitives keep their `cs-*` class names. Studio defines those classes in `src/studio/styles/primitives.css` from Studio tokens, so both apps share one set of accessible primitives.
- Fonts come from the `geist` package through `next/font`, which serves the files from `/_next/static/media`; the CSP only allows same-origin fonts, and these are same origin (D-1).

### ADR-11: Studio and Payload's admin run side by side until cutover

- Both are deployed together from Phase 1. Studio is reachable at `/studio` for signed-in users. Nothing links to it until a collection reaches parity.
- Each collection is "Studio-ready" only after its row in `03-FIELD-AND-COMPONENT-MAP.md` §C is ticked and its e2e test passes.
- Editing the same document in both admins is safe because both honour Payload's document locks (ADR-2).
- Cutover and retirement are in Phase 7.

## Decisions (signed off 2026-10-16)

Walked through one by one with the product owner on 2026-10-16. D-1 and D-2 were revised and D-10 added on 2026-10-19, when the product owner rejected the first mockups for looking like the current admin and approved direction B (`01-DESIGN-SYSTEM.md`).

| Id | Decision | Outcome |
|---|---|---|
| D-1 | UI typeface | **Geist** for all UI text; **Geist Mono** for code, ids, slugs and keys. Both from the `geist` package through `next/font` (same-origin files). Revised 2026-10-19; was Inter and JetBrains Mono. |
| D-2 | Icon set | **`@phosphor-icons/react`**, **Light** weight (through `IconContext` for client components; server components pass it), 16px default, one family everywhere (the Published status glyph uses `fill`). Revised 2026-10-19; was Regular. |
| D-3 | Default theme | **Follow the system setting**, with a toggle in the user menu and on the Account page. Both themes designed and reviewed. |
| D-4 | URL | **`/studio`, permanently.** At cutover `/` redirects to `/studio`. |
| D-5 | Form library | **`react-hook-form`** (ADR-7). |
| D-6 | Author role | **Build own-draft editing** (changed from the recommendation). Details below. |
| D-7 | Preview pane | **Saved-draft iframe** that reloads after each save. |
| D-8 | Payload admin after cutover | **Admins keep `/admin` for 30 days**, then the Payload admin UI is retired in its own task. |
| D-9 | Sidebar grouping | **Regrouped navigation** from `02-SCREENS.md` S-00. |
| D-10 | Visual direction | **Direction B** (2026-10-19): warm neutral greys, a floating sheet inset on a tinted window, ink for primary actions, ultramarine (`#3451e6` light, `#8ea0ff` dark) for focus, selection and links, brand cyan retired from the UI, split sign-in with the website's brand band. Details in `01-DESIGN-SYSTEM.md`. |

### D-6 in detail: authors draft their own content

- **Ownership:** a new `createdBy` field (relationship to users) on the five collections below. It is set automatically to the user who creates the document and is never editable. This keeps CLAUDE.md's locked decision that Authors has no `linkedUser`.
- **Collections:** blogs, news, guides, knowledgeBase, resources.
- **What an author can do on documents they created:** create drafts, edit them (including saving a new draft of their own published document), share preview links, and delete their own documents that are not live (the main row's `_status` is draft; a live document with a newer draft is not deletable by its author).
- **What an author cannot do:** publish, schedule, unpublish, or edit anyone else's document. An editor or admin publishes.
- **Media:** authors may **upload** to Media (create only; no editing or deleting existing media). This reverses the deliberate restriction noted at `apps/cms/src/payload/collections/Media.ts:77-78` ("Authors no longer upload directly").
- **Scope:** this is a change to Payload's access rules, so it applies in the old admin as well as Studio, from the day it ships. It is built in Phase 1 (Task 1.19 of the Phase 0-1 plan), independent of the Studio screens for these collections, which arrive in Phase 4.
- **Existing documents** have no `createdBy`, so only admins and editors can edit them, exactly as today.

## Phases

Each phase ends with a demo, a product sign-off and a tag (`studio-p<N>`). Every task inside a phase passes the gates in `05-REVIEW-PROTOCOL.md`.

### Phase 0: Decisions, design system and lab (1 week)

- Decisions D-1 to D-9 were signed off on 2026-10-16 and D-10 on 2026-10-19 (see Decisions).
- Tokens, fonts, Tailwind setup, `primitives.css` restyling `packages/ui`.
- Studio UI kit (names as in `01` §7): `Button`, `IconButton`, `TextInput`, `Textarea`, `Select`, `Checkbox`, `Switch`, `RadioGroup`, `Field`, `Badge`, `StatusBadge`, `Kbd`, `Card`, `Section`, `Tabs`, `Skeleton`, `EmptyState`, `Banner`, `Avatar`, `PageHeader`. `Tooltip` and the overlays come from `packages/ui`. Built later, each in the phase that first needs it: `SplitButton` (4), `ButtonGroup` (1, list layout switch from 5), `Collapsible` (2), `Divider` (1), `Spinner` (0, restyled primitive), `SaveStatus` (1), `KeyValue` (5). The data table is built with the list view in Phase 1.
- A lab route `/studio/lab` (admins only, noindex) that shows every component in every state, in both themes, plus static compositions of the list and edit screens built from the real components and fixture data. The media library, editor and dashboard compositions are designed the same way as the first task of Phases 2, 3 and 6, so every screen is approved before it is built.
- A read-only census of rich-text node types in production, counts only (needs your approval to run on the droplet; no data leaves it).
- **Exit:** UI/UX review passes on the lab in both themes; you approve the list and edit compositions.

### Phase 1: Foundation (2 weeks)

- Route group, root layout, auth screens, session guard.
- App shell: sidebar navigation built from the config and the user's permissions (including departmental scoping), user menu, theme toggle, toasts, 404, error and forbidden screens. There is no global top bar; each screen owns its header.
- Server data layer (ADR-2), permissions, `buildStudioSchema` (ADR-5), the conditions and validators move (ADR-6), the component registry and its coverage test (ADR-8), the boundary check.
- Generic list view: server-rendered table, search, sort, pagination, column visibility, the standard cells.
- Author drafting (D-6): `createdBy` on five collections, new access rules, author media uploads (Payload side, so it applies to both admins).
- Generic edit view for flat collections: text, textarea, number, email, checkbox, select, radio, date, json, read-only fields, sidebar position, conditions, server error mapping, save draft, publish (a plain button with a confirm in Phase 1; the popover arrives in Phase 4, `09` §17), create, delete.
- **Exit:** `jobLocations` and `redirects` (which use only Phase 1 field types) are fully editable in Studio, their e2e tests pass, and the boundary and coverage checks are green in CI.

### Phase 2: Form engine and media (2 weeks)

- Array (drag sort, collapse, row labels, undo remove), blocks (picker with descriptions, collapsed summaries), group, collapsible, row, tabs, relationship (single, many, polymorphic, quick create), join (read only), code (CodeMirror), point, upload field, and the `ui` field host.
- Media library (grid and list, folders, filters, search, upload with progress, drag and drop), media detail (alt, caption, credit, focal point, rename, replace, size warning), media picker dialog, PDF thumbnails.
- **Exit:** the 9 simple taxonomies (their form, not yet the SEO inspector tab), `media`, `emailAssets`, `aboutGalleries` and `seoDefaults` reach parity. `authors` and `forms` hold rich text, so they reach parity at the Phase 3 exit.

### Phase 3: Rich-text editor (2.5 weeks)

- The editor in `04-EDITOR-SPEC.md`: both configs, all nodes, toolbar, inline toolbar, slash menu, insert menu, link popover with internal search, table grid picker, embed dialog, inline image insert and edit, code block, inline CTA, rich paste, focus mode.
- The round-trip test passes on every fixture. The census from Phase 0 shows no node type in production that Studio cannot load.
- **Exit:** a blog, a guide and a knowledge-base article can be edited and saved with no diff in untouched nodes; `apps/web` renders them unchanged (visual diff); `authors` and `forms` reach parity.

### Phase 4: Document workflow and SEO inspector (2 weeks)

- Document header, publish control (publish, schedule, unpublish), the publish popover (Publish now or Schedule, with upcoming jobs and the checklist summary), property chips under the title, the tabbed inspector (Details, SEO, Checklist), publish checklist panel, slug guard, SEO length confirm, discard changes, duplicate, delete, purge page, version history with diff and restore, lock banner and takeover, unsaved-changes guard, keyboard save.
- Preview pane, share-link dialog, preview-link list with revoke.
- The SEO inspector tab: every SEO22 component from the catalog, as sections (title, description, indexable, SERP preview, keywords, canonical, social card, redirect, head tags, URL history, schema preview, advanced, health score, permalink).
- Blog-specific fields: FAQ bulk paste, TOC rows, CTA auto-pick, journey mirror warning, display published date.
- **Exit:** the 12 routed content collections (blogs, news, guides, case-studies, knowledgeBase, legalDocuments, resources, events, webinars, podcastEpisodes, jobs, pages) reach parity.

### Phase 5: Remaining collections and list power features (2 weeks)

- Leads (immutable notice, flagged leads, DSAR find and delete, retry sync, CSV export with truncation notice), partner applications, deal registrations, career applications, resumes.
- Users (roles, enable/disable, reassign content), integrations (encrypted config, routing multi-selects, health, test, audit trail), page registry and schema manager, email signatures and signature templates (code field and sandboxed preview), broken links, preview audit, audit log, consent log, search log, analytics cache, webhook dead letters, globals.
- List extras: the grouped List layout (status groups, floating selection bar) as the default for draft-enabled collections with a List and Table switch, view tabs with counts, saved views, column resize, filter chips, export drawer (CSV/XLSX), bulk delete and duplicate.
- **Exit:** every row in `03` §C is ticked.

### Phase 6: Dashboards and global tools (1.5 weeks)

- Home dashboard (role-scoped), analytics, content insights, lead attribution, cache purge, command palette, shortcut sheet.
- **Exit:** every screen in `02-SCREENS.md` is built and reviewed.

### Phase 7: Parity, hardening and cutover (2 weeks)

- A full parity walkthrough against `03` with you and one editor.
- Accessibility pass (axe clean on every screen, keyboard-only walkthrough), performance pass (INP, list render time, bundle size per route).
- Reset email link switched to Studio. `/` redirects to `/studio`. The Payload admin stays reachable for admins (D-8).
- Retirement plan for the Payload admin layer, written as its own plan. `Embed/EmbedNode.ts` and `Embed/embed-providers.ts` must survive it, because server code and `next.config.ts` import them.
- **Exit:** cutover done; a rollback is one config change (point `/` back to `/admin`).

## Timeline

| Phase | Weeks | Cumulative |
|---|---|---|
| 0 Design system and lab | 1 | 1 |
| 1 Foundation | 2 | 3 |
| 2 Form engine and media | 2 | 5 |
| 3 Editor | 2.5 | 7.5 |
| 4 Document workflow and SEO inspector | 2 | 9.5 |
| 5 Remaining collections | 2 | 11.5 |
| 6 Dashboards and tools | 1.5 | 13 |
| 7 Parity and cutover | 2 | 15 |

This is longer than the 11 to 13 weeks estimated earlier because every task now carries three review gates. Phases 5 and 6 can overlap if two people drive agents in parallel, which saves about 1.5 weeks.

## Risk register

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Editor changes stored rich text (link URLs, node versions, ids) | Medium | High: posts render wrong on the live site | ADR-9 round-trip gate; production census before Phase 3; visual diff of rendered pages |
| A Local API call skips access or locks | Medium | High: data leak or overwrite | One wrapper (ADR-2); boundary check in CI; e2e tests per role |
| A field or component is missed | Medium | Medium | Coverage test (ADR-8); `03` map ticked per collection; parity walkthrough |
| Conditions or validators drift between config and Studio | Low | Medium | One shared module (ADR-6); registry test |
| Payload upgrade changes Local API behaviour | Low | Medium | Pin Payload minor during the build; Local API is Payload's stable public API |
| Scope creep into new features | High | Medium | Non-goals list; new ideas go to the backlog |
| Two admins confuse editors during rollout | Medium | Low | Studio is unlinked until a collection is ready; one "Open in Studio" link per ready collection |
| Author drafting (D-6) changes who can write in the live admin | Medium | Medium | Access rules unit-tested per role; e2e proves an author cannot publish or touch others' documents; editors briefed before Task 1.19 ships to production |

## Follow-ups found during research (not fixed inside Studio)

Each one is its own small task. Evidence is in `research/workflows-and-roles.md`. The full list of backend follow-ups found since, with ids F-1 to F-16, is at the end of `07-UI-ISSUES-REGISTER.md`.

1. ~~`topic-suggestions.ts` and `canonical-check.ts` checked `user.role` (singular), so both endpoints returned 403.~~ Fixed in f325a07c and 5c12fb1a (UI-070).
2. ~~`media-ingest-url.ts` called `payload.create` without `overrideAccess: false`.~~ Fixed in 5c12fb1a (UI-133).
3. ~~The `author` role description says "own drafts" but the role is read-only.~~ Resolved by D-6: built in Phase 1, Task 1.19.
4. `audit-log` defines `user_disabled` but nothing writes it (F-13).
5. Account password change has no server-side policy (12 characters is HTML `minLength` only) and no current-password check (F-16).
6. Disabling a user does not end their existing sessions (F-13).

## Definition of done for the whole project

- Every row in `03-FIELD-AND-COMPONENT-MAP.md` is ticked with a test id.
- Every screen in `02-SCREENS.md` has passed UI/UX review in both themes.
- CI runs lint, typecheck, unit tests, build, `verify:studio-boundaries`, `verify:studio-coverage`, the editor round-trip test and the Studio e2e suite on every push.
- Editors have used Studio for two weeks with no P1 issue open.
