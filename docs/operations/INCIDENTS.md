# Incident & Bug Log

A running, reverse-chronological log of production incidents and non-obvious bugs — what broke, the **root cause**, the fix, and the **reusable lesson**. The goal: next time (in this repo or another), we recognise the pattern fast instead of re-deriving it.

**When to add an entry:** any prod incident, any bug whose root cause was non-obvious, any "this looked like a one-liner but wasn't." Skip trivial typo fixes.

**Format:** newest first. Keep each entry tight. Mark **Status** honestly (`Fixed & verified`, `Fixed, verification pending`, `Mitigated`, `Open`). Call out the **Reusable lesson** — the part that generalises beyond this codebase.

> This log complements Claude Code's per-session auto-memory (`~/.claude/projects/<proj>/memory/`). The memory is auto-loaded each session for *this* repo; this file is committed so it travels with the code and is visible to every developer and every project checkout.

---

## 2026-07-16 — Lexical link editor: new links silently do nothing

- **Area:** `apps/cms` — CMS rich-text editor (`LinkPopoverPlugin.tsx`), Payload `@payloadcms/richtext-lexical`.
- **Symptom:** In the blog/body editor, selecting text and adding a link (internal *or* external) via the popover did nothing — no link appeared, nothing "updated." Reported by editor.
- **Root cause:** The custom link popover steals DOM focus (its inputs). By the time the user clicks **Add link**, the Lexical editor's live selection is no longer a `RangeSelection`. Payload's `$toggleLink` guards: `if (!$isRangeSelection(sel) && (payload === null || !payload.selectedNodes?.length)) return;`. The create path dispatched `TOGGLE_LINK_COMMAND` with `selectedNodes: []`, so with no range selection **and** empty `selectedNodes` it early-returned — the link was never created. (The *edit* path was already selection-independent via a captured node key; only *create* was affected. An earlier memory even wrongly assumed "create path live selection survives.")
- **Diagnosis note:** confirmed live in the browser by monkey-patching `editor.dispatchCommand` — the toggle produced **0** link nodes in the model.
- **Fix:** (1) Snapshot the `RangeSelection` when the popover opens (`createSelectionRef = selection.clone()` inside the `read()` in `openForCurrentSelection`). (2) On the create path, inside **one** `editor.update`: `$setSelection(restored.clone())` **and** `selectedNodes = restored.extract()`, then dispatch `TOGGLE_LINK_COMMAND` with those `selectedNodes`. Passing extracted nodes bypasses the range-selection requirement; `extract()` splits text nodes so partial selections wrap exactly the chosen text. A first attempt that only *restored the selection* in a separate `editor.update` before dispatch did **not** work — the restored selection didn't survive to the command's own update while the editor was blurred.
- **Commits:** `82a3a942` (selection restore) + `5950d508` (extract + pass `selectedNodes`). On `main` + `development`, deployed to prod.
- **Status:** Fixed, **end-to-end verification pending** — automated browser verification couldn't be completed (prod admin session logged out; local dev hit an unrelated schema-drift push prompt). Root cause and fix confirmed against Payload source + live instrumentation.
- **Reusable lesson (any Payload/Lexical project):** A custom link/format popover that takes focus must **not** rely on the editor's live selection at save time. Capture the selection when the popover opens, and pass `selectedNodes` (from `selection.extract()`) into `$toggleLink` / `TOGGLE_LINK_COMMAND` — don't just try to restore the selection.

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
