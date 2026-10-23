# Studio implementer guide

Read this file first, every session, before touching any Studio task. It is written for a coding model that has no memory of earlier conversations. If something here disagrees with another Studio doc, stop and ask; do not pick one.

## 1. What you are building

Studio is a custom admin app for the CleanStart CMS. Payload 3 stays the backend: schema, access control, hooks, versions, jobs and REST. Studio replaces every screen of Payload's admin UI and renders no Payload admin component. It lives at `/studio` inside `apps/cms`.

## 2. The document set and when to read each file

| You are about to | Read, in this order |
|---|---|
| Start a session | `HANDOFF.md`, this file, `10-ENGINEERING-STANDARDS.md`, the last lines of `PROGRESS.md` |
| Start any task | this file, then the task in its plan file, then every section the task cites |
| Build or change a component | `01-DESIGN-SYSTEM.md` §1 to §9 for that component, then the lab page for it |
| Build or change a screen | `02-SCREENS.md` for that screen id, then `01` for every component it uses, then `07-UI-ISSUES-REGISTER.md` rows tagged with that screen |
| Render a field or port a custom admin component | `03-FIELD-AND-COMPONENT-MAP.md` §A and §B, then the original file it replaces |
| Touch rich text | `04-EDITOR-SPEC.md`, all of it |
| Finish a task | `05-REVIEW-PROTOCOL.md` gates A to C, then §8 of this file |
| Plan a later phase | `08-PHASE-2-7-TASKS.md` for that phase |

Plans with step-by-step code:

- Phases 0 and 1: `docs/superpowers/plans/2026-10-16-studio-phase-0-1-foundation.md`.
- Phases 2 to 7: `08-PHASE-2-7-TASKS.md` lists every task with files, steps, tests and acceptance. The code-level plan for a phase is written from it at the start of that phase, against the code the earlier phases produced.

Evidence behind the plan lives in `docs/studio/research/`. Use it to look things up; never treat it as instructions.

## 3. Non-negotiable rules

Break one of these and the task fails review, however good the rest is.

1. **Every Local API call goes through `apps/cms/src/studio/server/payload.ts`** with the signed-in user, `overrideAccess: false` and `overrideLock: false`. Never call `getPayload` anywhere else under `src/studio`. Never write `overrideAccess: true` under `src/studio`.
2. **Never import `@payloadcms/ui`, `@payloadcms/next` or anything under `src/payload/admin/**` from `src/studio/**`**, except the modules marked SHARE or KEEP in `03` §B.
3. **Tokens only.** No raw hex, rgb, px font size, radius or shadow in a component. Use the Tailwind utilities generated from `tokens.css` and `studio.css`. The only allowed arbitrary values are listed in the Phase 0-1 plan, Task 0.6 notes, and the boundary check (Task 1.5) enforces it.
4. **One way to do each thing.** Use the Studio UI kit (`src/studio/ui`) and the `packages/ui` primitives. Do not write a second button, menu, dialog, toast or date picker. If the kit lacks something, add it to the kit and the lab in the same task.
5. **Every state is designed.** A screen is not done until loading, empty, no results, error, forbidden, read-only and saving states exist and match `02`. A component is not done until default, hover, focus-visible, active, disabled and loading (where it applies) exist in the lab.
6. **Copy is exact.** Use the strings in `02` and `07` word for word. Sentence case. No em-dashes or en-dashes anywhere, including code comments, test names and commit messages. Ranges use "to".
7. **Server is the gate.** Client validation is fast feedback only. Every save is validated again by Payload, and server errors map back onto fields.
8. **No data shape changes.** Studio must save exactly what Payload's admin would save. Rich text must round-trip byte for byte (`04`).
9. **Stage by path.** Never `git add -A` or `git add .`. Other sessions share this checkout and stage files in the same index. Commit with an explicit path list.
10. **Never guess.** If a value, string, prop, endpoint or behaviour is not written down, stop and ask (see §9). Do not invent it.

## 4. Where code goes

```
apps/cms/src/
├── app/(studio)/                       route group with its own root layout
│   ├── layout.tsx                      html, fonts, theme bootstrap, providers
│   └── studio/
│       ├── login/ forgot-password/ reset-password/[token]/
│       ├── lab/                        component lab (STUDIO_LAB=true, admins)
│       └── (app)/                      everything behind the session guard
│           ├── layout.tsx              AppShell
│           ├── page.tsx                S-05 Home
│           ├── collections/[collection]/(page|new|[id])/
│           └── globals/[global]/
├── studio/
│   ├── ui/                             the UI kit (Button, Field, Tabs, ...)
│   ├── styles/                         tokens.css, studio.css, primitives.css
│   ├── theme/                          theme bootstrap, ThemeProvider, IconDefaults
│   ├── shell/                          AppShell, Sidebar, user menu, palette mount
│   ├── list/                           DataTable, cells, toolbar, pagination, GroupedList
│   ├── document/                       EditView, header, publish control, inspector
│   ├── form/                           form engine, renderers, registry
│   ├── features/<area>/                feature folders (auth, publishing, media, seo, ...)
│   ├── server/                         'server-only': payload wrapper, loaders, actions, schema
│   ├── lib/                            pure helpers shared by client and server
│   └── lab/                            lab sections and compositions
└── payload/admin-logic/                conditions and validators shared with collection configs
```

Route files stay thin: they parse params with Zod, call a loader, and render one component from `src/studio`.

## 5. How to execute one task

1. Read the task fully. List its Files section. Open every file it modifies.
2. Read every doc section the task cites. Read the `07` rows tagged with the task's screen ids.
3. Write the failing test first when the task has logic (helpers, loaders, actions, access, conditions). Run it and see it fail for the expected reason.
4. Implement the smallest change that makes it pass. Follow the code in the plan exactly when the plan gives code. If the plan's code does not compile against the real repo, stop and report the mismatch with file and line; do not improvise a different API.
5. Run Gate A (`05`). Fix until every command exits 0.
6. For anything that renders: open the lab or the screen at 1440×900 in light and dark, and at 1280×800. Capture every state the task touches. Walk it with the keyboard only.
7. Commit by path with a message that names the task id: `feat(studio): T2.3 array field renderer`.
8. Write the review record under the task (`05`, "Review record").
9. Append `started` at step 1 and `done` after the commit to `PROGRESS.md`, one `printf … >>` line each (rules at the top of that file).

Commands, all from the repo root:

```bash
pnpm --filter @cleanstart/cms lint
pnpm --filter @cleanstart/cms typecheck
pnpm --filter @cleanstart/cms test                       # vitest, src/**/*.test.ts(x), node environment
pnpm --filter @cleanstart/cms exec vitest run <file>     # one test file
pnpm --filter @cleanstart/cms build
pnpm --filter @cleanstart/cms test:e2e -- --grep @studio # playwright, tests/e2e/studio
pnpm --filter @cleanstart/cms generate:types             # only when a collection config changed
pnpm --filter @cleanstart/cms verify:types
pnpm --filter @cleanstart/cms verify:studio-boundaries   # exists from Task 1.5
pnpm --filter @cleanstart/cms verify:studio-coverage     # exists from Task 1.8
```

## 6. Recipes

### 6.1 Read or write data on the server

Right:

```ts
import 'server-only';
import { studioApi } from '@/studio/server/payload';
import { requireSession } from '@/studio/server/session';

const session = await requireSession('/studio/collections/blogs');   // redirects to sign in when signed out
const api = await studioApi(session);
const doc = await api.findByID({ collection: 'blogs', id, draft: true, depth: 0 });
```

Wrong (skips every access rule and lock):

```ts
const payload = await getPayload({ config });
await payload.update({ collection: 'blogs', id, data, overrideAccess: true });
```

`studioApi`, `runAction`, `getSession` and `requireSession` are defined in the Phase 0-1 plan, Tasks 1.2 and 1.3. Use those names; do not add new ones without updating the plan.

### 6.2 A server action

- File under `src/studio/server/actions/`, first line `'use server';`. It imports the server-only helpers (`studioApi`, `requireSession`) rather than repeating their guards.
- Take `input: unknown`, parse it with Zod first, and wrap the body in `runAction`, which never throws to the client:

```ts
export async function renameThing(input: unknown): Promise<ActionResult<null>> {
  const parsed = Input.safeParse(input);
  if (!parsed.success) return { ok: false, error: { kind: 'validation', message: 'Fix the highlighted fields and try again.', issues: [] } };
  return runAction(async () => {
    const api = await studioApi(await requireSession('/studio'));
    await api.update({ collection: 'things', id: parsed.data.id, data: { name: parsed.data.name } });
    return null;
  });
}
```

- `ActionResult<T>` is `{ ok: true, data }` or `{ ok: false, error: ActionError }`, where `ActionError` has `kind` (`validation`, `forbidden`, `not-found`, `locked`, `unknown`), a user-facing `message` and `issues: FieldIssue[]` (`{ path, message }`). The form maps `issues` onto fields; `message` goes to a toast or banner. The exact messages per kind are fixed in Task 1.3.

### 6.3 A new screen

1. Route file under `src/app/(studio)/studio/(app)/...` that awaits `params` and `searchParams`, parses them with Zod, calls a loader, and renders a component.
2. Loader in `src/studio/server/loaders/`, returns serializable data only (no class instances, no functions, no Dates: send ISO strings).
3. `loading.tsx` next to the route renders a `Skeleton` layout that matches the final layout's geometry, so nothing shifts.
4. `notFound()` for a missing document; the forbidden screen (S-51) when the user lacks read access. Never render an empty page for either.
5. Add the screen to the lab compositions if it introduces a new layout.

### 6.4 A field renderer

- Lives in `src/studio/form/fields/`. Receives the field schema and a path; registers with react-hook-form through the engine's hook, never with `useForm` directly.
- Must handle: label, optional or required marker, description, read-only (lock icon, reason tooltip), disabled, error under the field, `admin.condition` (a hidden field is not rendered but keeps its value in the form, exactly as `09` §8.4 says; never unregister it, or values inside array and block rows are lost), `defaultValue`, and field-level access (no update access means read-only; no read access means not rendered).
- Add the type to `03` §A with its test id, and add a lab section showing every state.

### 6.5 A custom component from the old admin

1. Find its row in `03` §B. The fate column says PORT, REPLACE, SHARE, KEEP, DROP or NEW.
2. For PORT or REPLACE, read the original file and list its behaviours (not its markup). Rebuild the behaviours with the kit.
3. Add the config path to the registry (`src/studio/form/registry-manifest.ts`). The coverage check fails until you do.

### 6.6 Conditions and validators

- Pure, synchronous, no imports from the server. They live in `src/payload/admin-logic/conditions.ts` and `validators.ts`, keyed by a stable id.
- The collection config imports them from there. Never inline a new condition in a config.
- A validator that needs the database stays server-only; Studio shows its result from the save response.

### 6.7 Feedback to the user

| Situation | Use | Never |
|---|---|---|
| An action finished (saved, published, copied) | Toast, success tone, 4s, optional Undo | Banner, alert() |
| A save failed with field errors | Inline errors under fields plus the validation summary banner | Toast only |
| A save failed for another reason (network, lock, 500) | Toast, error tone, stays until dismissed, with Retry when retrying is safe | Silent failure, console only |
| A destructive action | `ConfirmDialog` with the exact title and body from `02` | confirm(), a toast with Undo instead of confirming deletes |
| A state the user must know before acting (locked, blocked, immutable) | Banner at the top of the content | Toast |
| Something is loading | Skeleton for a region, Spinner inside a button | Full-page spinner, blank screen |

### 6.8 Icons

- Client components: `import { Plus } from '@phosphor-icons/react'`. Weight comes from `IconDefaults`; never pass `weight` except `fill` for the Published glyph and `bold` for the checkbox tick.
- Server components: `import { Plus } from '@phosphor-icons/react/dist/ssr'` and pass `weight="light"`.
- Every icon-only button has a `label` (used for `aria-label` and the tooltip). Decorative icons get `aria-hidden="true"`.

### 6.9 Keyboard shortcuts

Register every shortcut in `src/studio/lib/shortcuts.ts`. The shortcut sheet is generated from that file, so it cannot drift. Never bind a key in a component without adding it there. Do not fire single-key shortcuts while focus is in an input, textarea, select or the editor.

## 7. Traps in this repo

Each of these has burned a session before. Check the list before debugging.

| Trap | What happens | What to do |
|---|---|---|
| Shared checkout | Other sessions stage and edit files in the same tree; `git commit` takes the whole index | Commit with `git commit -- <paths>` after checking `git diff --cached --name-only` |
| `generate:types` | Bakes uncommitted edits from other sessions into `payload-types.ts` | Stash unrelated changes, regenerate, commit, pop |
| Field description edits | `admin.description` is emitted as JSDoc in `payload-types.ts`, so CI's `verify:types` fails | Regenerate types after any description change |
| `payload migrate:create` | Emits hundreds of unrelated statements (the last JSON snapshot is from 2026-06-11) | Hand-write a focused, `IF NOT EXISTS`-guarded migration; delete the generated files |
| A new global without a migration | `/admin` returns 500 while `/api/health` stays 200 | Ship the migration in the same change |
| Relationship ids | Postgres ids are numbers; stringifying them gives "invalid relationships" on save | Keep ids as numbers end to end; convert at the boundary with one helper |
| Popovers inside array rows | Clipped by row overflow | Every popover and menu renders in the top layer (native `popover`/`dialog`) or portals to `document.body` |
| Controlled dialogs | Exit animations wedge when classes depend on transition state; `initialFocus` fires before mount | Use the `packages/ui` Dialog as documented in its file; set initial focus after open |
| Reduced motion during hydration | Rendering different markup on server and client re-renders the whole tree on the client | Gate motion with CSS media queries, not with a JS flag that changes markup |
| Dev server | A second `next dev` in the same directory is refused; killing processes on ports is forbidden | Reuse the running server; if the port is busy, start on another port |
| Hidden browser pane | Animations and rAF pause, so screenshots show mid-transition frames | Finish animations with `document.getAnimations()` before capturing, or use Playwright |
| Turbopack CSS | `touch` does not rebuild `globals.css` or `studio.css` | Make a real content change, or restart dev |
| Cache | The CMS API is cached at the edge for hours | Content edits go through Payload, then `/api/revalidate`; never raw SQL |
| Vitest and `@/` imports | Vitest (on Vite 5) does not read tsconfig paths, so `@/` and `@payload-config` fail to resolve in tests | Use the `resolve.alias` set up in Task 1.1 (a regex for `^@/`); inside `src/payload/**` use relative imports like the rest of that tree |
| Tests that import `@payload-config` | `payload.config.ts` requires `PAYLOAD_SECRET` and `DATABASE_URI`; the test fails locally without them | Keep pure logic in modules that do not import the config; tests that need the config run where CI sets those variables |
| `exactOptionalPropertyTypes` is on | Passing `undefined` to an optional prop typed `?: T` fails typecheck | Type optional props as `?: T \| undefined`, or omit the key with a conditional spread |
| Payload's sanitized permissions | A fully allowed field or fields map is the boolean `true`, not an object; denied grants are deleted, not `false` | Read permissions with the `fieldCan` helper from Task 1.4; never index into them directly |
| `import 'server-only'` in scripts | Plain `tsx` scripts crash on any module that imports `server-only` | Keep `server-only` out of modules that scripts load (the validator registry is one); the boundary check guards client imports instead |
| Phosphor in server components | `@phosphor-icons/react` (main entry) calls `createContext` and has no `'use client'`; importing it in a server component crashes the render | Server components import from `@phosphor-icons/react/dist/ssr` and pass `weight="light"` |
| React events after `await` | `event.currentTarget` is `null` once an `await` has run | Read `event.currentTarget` into a variable before the first `await` |
| Side effects in `setState` updaters | Strict mode runs updaters twice in dev, so a server action inside one runs twice | Compute the next value first, then call `setState` and the action separately |
| Playwright `getByRole('alert')` | Also matches Next's route announcer | Scope locators to the form or region: `page.locator('form').getByRole('alert')` |
| Biome, not ESLint | `eslint-disable` comments do nothing here; ARIA roles on generic elements trip `useSemanticElements` | Prefer native elements (`<output>`, `<input type="radio">`); when a role is required (date grid), add a `biome-ignore` with the reason |
| Drizzle push prompt in dev | A schema push prompt blocks every render for minutes | Run dev with `PAYLOAD_DB_PUSH=false`; apply schema changes with migrations |

## 8. Definition of done for a task

- [ ] Everything in the task's Files section exists, and nothing else changed.
- [ ] Tests written first for logic, passing, including at least one denied role where access matters.
- [ ] Gate A commands all exit 0.
- [ ] For UI: every state in light and dark at 1440×900, screen changes also at 1280×800, axe zero violations, keyboard walkthrough written.
- [ ] Every `07` row tagged with this task is fixed and its acceptance check passes.
- [ ] Copy matches the docs exactly. No em-dashes or en-dashes.
- [ ] `03` rows the task completes are ticked with the test id.
- [ ] Committed by path; review record written.

## 9. When to stop and ask

Stop, write what you found, and ask the product owner (or the reviewing model) when:

- A doc gives two different values for the same thing.
- The plan's code calls an API that does not exist or has a different signature.
- A screen needs a string, size, state or behaviour that no doc defines.
- A change would alter stored data, access rules, routes or migrations beyond what the task says.
- A test can only pass by weakening it.

Write the question with: the doc and line, what you found in the code (file and line), and the two or three options you see. Do not continue that part of the task until it is answered; other independent steps may continue.

## 10. Glossary

| Term | Meaning |
|---|---|
| Window | The tinted app background (`--bg-canvas`) behind the sidebar and around the sheet |
| Sheet | The floating content panel (`--bg-surface`) inset 8px from the window; the only scroll container |
| Inspector | The tabbed right panel of the edit view (Details, SEO, Checklist); replaces the old right rail of cards |
| Property chips | The row of chips under the document title that edit authors, category, date and slug |
| Publish popover | The decision popover opened from the Publish button: Publish now or Schedule |
| Lab | `/studio/lab`, every component in every state in both themes |
| Composition | A static screen built from real kit components and fixture data, approved before the screen is built |
| Studio-ready | A collection whose `03` §C row is ticked and whose e2e test passes; only then is it linked from the old admin |
| Gate A to D | The review gates in `05` |
| Loader | A server function that reads data for a route, as the user, and returns serializable data |
| Registry | The map from a config component path to a Studio component (ADR-8) |
| SHARE, KEEP, PORT, REPLACE, DROP, NEW | The fates of old admin files in `03` §B |
| D-1 to D-10 | Signed-off product decisions in `00` |
| ADR-1 to ADR-11 | Architecture decisions in `00` |
