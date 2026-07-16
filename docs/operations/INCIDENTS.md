# Incident & Bug Log

A running, reverse-chronological log of production incidents and non-obvious bugs — what broke, the **root cause**, the fix, and the **reusable lesson**. The goal: next time (in this repo or another), we recognise the pattern fast instead of re-deriving it.

**When to add an entry:** any prod incident, any bug whose root cause was non-obvious, any "this looked like a one-liner but wasn't." Skip trivial typo fixes.

**Format:** newest first. Keep each entry tight. Mark **Status** honestly (`Fixed & verified`, `Fixed, verification pending`, `Mitigated`, `Open`). Call out the **Reusable lesson** — the part that generalises beyond this codebase.

> This log complements Claude Code's per-session auto-memory (`~/.claude/projects/<proj>/memory/`). The memory is auto-loaded each session for *this* repo; this file is committed so it travels with the code and is visible to every developer and every project checkout.

---

## 2026-07-16 — Lexical link editor: new links silently do nothing

- **Area:** `apps/cms` — CMS rich-text editor (`LinkPopoverPlugin.tsx`), Payload `@payloadcms/richtext-lexical`.
- **Symptom:** In the blog/body editor, selecting text and adding a link (internal *or* external) via the popover did nothing — no link appeared, nothing "updated." Reported by editor.
- **Root cause:** The custom link popover steals DOM focus, so at **Add link** time the editor's live selection is no longer the picked text. The create path needs to restore the selection captured when the popover opened, then dispatch `TOGGLE_LINK_COMMAND`. The real defect was in *how* that restore was done: an intermediate fix called `selection.extract()` **in the same `editor.update` before dispatch**. `extract()` splits text nodes at the selection boundary and leaves the restored selection pointing at now-stale nodes, so Payload's `$toggleLink` — which runs its **own** `selection.extract()` — found nothing and wrapped no text. Net: no link created.
- **How it was actually diagnosed (the important part):** black-box reasoning was wrong **twice** (two bad deploys). What worked: stand up a **local** CMS I fully controlled (`PAYLOAD_DB_PUSH=false` to skip the schema-drift push prompt; seed a throwaway admin + blog), then **instrument the live Lexical editor from the page** (`root.__lexicalEditor`, wrap `editor.dispatchCommand`, read `editor.getEditorState()`). That revealed: (a) the stock `$toggleLink` *does* create links with a live range selection — proving it wasn't a selection-loss/early-return problem; (b) a same-tick `toJSON()` read after dispatch shows 0 links purely because Lexical commits async (timing artifact that caused a false "it no-ops" conclusion); (c) a `savedLinkCount:0` after Save that was actually an **autosave race** from doing two rapid edits in a test, not a persistence bug — a single clean link edit persists end-to-end.
- **Fix:** Snapshot the `RangeSelection` on popover open (`createSelectionRef = selection.clone()`), and on the create path restore it with `$setSelection(savedSelection.clone())` in one `editor.update`, then dispatch `TOGGLE_LINK_COMMAND` with `selectedNodes: []`. Let `$toggleLink` do its own `extract()` on the intact restored selection. **Do NOT pre-`extract()`** — that was the bug.
- **Commits:** `82a3a942` + `5950d508` were the two wrong attempts; **`b833d591` is the correct fix** (restore-only). All on `main` + `development`, deployed.
- **Status:** **Fixed & verified end-to-end** on a local instance — internal + external links create, reach form state, Save Draft, and re-render as `<a>` on reload; server accepts link nodes via API (`PATCH`), confirming no server-side stripping.
- **Reusable lessons:**
  1. *(Payload/Lexical)* A custom link/format popover that takes focus must restore the selection captured on open, then dispatch `TOGGLE_LINK_COMMAND` and let `$toggleLink` extract — **never** pre-mutate the tree with `extract()`/`splitText` before the command runs.
  2. *(debugging)* Don't fix editor bugs blind. Reading `editor.getEditorState().toJSON()` in the **same tick** as a dispatch reads pre-commit state — poll across ticks. And reproduce in an environment you can instrument (`root.__lexicalEditor`) rather than deploying on reasoning.
  3. *(local CMS)* `PAYLOAD_DB_PUSH=false` runs the dev server against the existing local DB without the interactive drizzle rename/create prompt that otherwise wedges boot.

## 2026-07-16 — Departmental users saw cross-domain nav, globals, and Dashboard content

- **Area:** `apps/cms` — new `hr` / `events` least-privilege roles (RBAC + admin nav scoping).
- **Symptom (staged, three sub-bugs):** (a) scoped users could be blocked from writing but still saw every collection in the nav; then after collection-nav hiding, (b) they still saw all **globals** (SEO defaults, Site settings, etc.); and (c) the custom Dashboard still showed cross-domain "Recent edits" and "New blog post" quick actions that 404'd on their access.
- **Root cause:** (a/b) `admin.hidden` scoping was applied to collections but not globals. (c) The custom Dashboard (`Dashboard.tsx`) queries content via the **local API with `overrideAccess`**, so it ignores the logged-in user's access and pulls everything.
- **Fix:** Centralised nav scoping in `apps/cms/src/payload/lib/wire-scoped-nav.ts` (`isScopedOnlyUser`, `wireScopedNav` for collections, `wireScopedNavGlobal` for globals), `.map()`ed over both arrays in `payload.config.ts`. Made the Dashboard role-aware via `scopedCollectionSlugsForUser(user)` — restricts counts, recent-edits, and quick-links to the user's own collections and drops leads/redirects cards. The Payload `/admin` root can't be removed from nav (login lands there), so scope its *content* instead.
- **Commits:** `853715ff` (globals hiding) + `30e21c94` (scoped Dashboard) — earlier collection RBAC + roles enum in `68e87a5d`/prior. Deployed.
- **Status:** Fixed & verified (nav confirmed scoped in-browser).
- **Open caveat:** content collections read via `publishedOrAuthenticated` = any logged-in user can still **read** other domains' drafts by direct API. Isolation covers write + nav + Dashboard, not draft read.
- **Reusable lesson:** In Payload, `admin.hidden` is a **nav-only** concern and must be applied to *both* `collections` and `globals`. Any custom Dashboard/home widget that uses `overrideAccess` will leak cross-tenant data unless you scope its queries yourself — hiding nav is not enough.

## 2026-07-16 — CI coverage gate (not lint/test) blocked the roles PR

- **Area:** `apps/cms` CI.
- **Symptom:** Local `pnpm --filter @cleanstart/cms test` passed (1746 tests) but CI failed: `Coverage for functions (87.5%) does not meet "src/payload/access/**/*.ts" threshold (95%)`.
- **Root cause:** New access helpers (`isAdminEditorOrHr`/`isAdminEditorOrEvents`) were untested. The 95% function-coverage gate on `access/**` is enforced only by CI's `test:coverage`, **not** by plain `test`.
- **Fix:** Added unit tests for the new helpers; re-ran `test:coverage` locally before pushing.
- **Reusable lesson:** For `apps/cms`, run `pnpm --filter @cleanstart/cms test:coverage` (not just `test`) when touching `src/payload/access/**` — plain `test` won't catch the coverage-gate failure.
