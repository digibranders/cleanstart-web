# Studio engineering standards

How senior engineers write Studio code. `06-IMPLEMENTER-GUIDE.md` says what is non-negotiable and where things go; this file says how to write each line well, with a do and a don't for every rule. When this file and the repo's `CLAUDE.md` disagree, `CLAUDE.md` wins (for example, it prefers three similar lines over an early abstraction, so this file does too).

## 1. Work in this order

1. **Understand.** Read the task, every doc section it cites, and every file it touches. Write down, in the task notes, the inputs, outputs and failure cases in three lines.
2. **Shape the data first.** Define the types and Zod schemas before any logic. If the data shape is wrong, everything built on it is wrong.
3. **Plan the test.** Decide what proves the task works: which unit tests, which e2e step, which `07` acceptance checks.
4. **Write the failing test.** Run it. See it fail for the expected reason.
5. **Implement the smallest change** that passes. Follow the plan's code when the plan gives code.
6. **Review your own diff** against §9 before asking anyone else to.

## 2. Types

| Do | Don't |
|---|---|
| Type every exported function's return: `export function save(input: unknown): Promise<ActionResult<SaveResult>>` | Let exports infer their return type |
| Use `unknown` for untrusted input and narrow it with Zod | Use `any`, or `as SomeType` on input you have not checked |
| Model states as discriminated unions: `{ ok: true; data } \| { ok: false; error }` | Use optional fields that are "set when it worked" |
| Keep `undefined` (not set) and `null` (explicitly cleared) distinct; Payload uses both | Use `value \|\| default` on values where `0`, `''` or `false` are valid |
| Type optional props as `?: T \| undefined` (the repo has `exactOptionalPropertyTypes` on) | Pass `undefined` to a prop typed `?: T` |
| Use `readonly` on props and on data you pass around | Mutate props, form values or loader results in place |
| Use `as unknown as T` only at a documented boundary, with a one-line why | Chain casts to silence the compiler |

## 3. Boundaries and validation

| Do | Don't |
|---|---|
| Parse every server action argument, route param, search param and REST response with Zod at the boundary | Trust data because "the client always sends it" |
| Validate once at the boundary, then trust the typed value inside | Re-check the same value in every function (CLAUDE.md: validate at system boundaries only) |
| Keep server-only code in `src/studio/server/**` with `import 'server-only'` (except modules that scripts load) | Import a server module from a `'use client'` file |
| Send only serializable data from server to client (no Dates, Maps, class instances, functions) | Pass a `Date` and hope it survives |
| Keep logic in pure functions under `src/studio/lib` or `server`, and keep components thin | Put business rules (status, permissions, publish rules) inside JSX |

## 4. Errors

| Do | Don't |
|---|---|
| Wrap server actions in `runAction` so Payload errors become an `ActionError` with a kind (`06` §6.2) | Throw from a server action and let the client crash |
| Show the user the message from `09` §11.5 for that kind | Show raw error text, stack traces or "Error: …" |
| Report unexpected errors to Sentry once (`runAction` does this) | `console.log(error)` and move on |
| Keep the user's work on every failure (form stays dirty, values stay on screen) | Reset a form or navigate away after a failed save |
| Fail loudly in development when an invariant breaks (`throw new Error('… should never happen because …')`) | Add defensive checks for states the types already rule out |

## 5. React and Next.js

| Do | Don't |
|---|---|
| Default to server components; add `'use client'` only to the leaf that needs state, effects or event handlers | Mark a whole page `'use client'` because one button needs a click handler |
| Read data in loaders and pass it down as props | Fetch the same data again on the client after the server rendered it |
| Use react-hook-form field subscriptions so typing re-renders one field (ADR-7) | Keep the whole document in `useState` |
| Compute derived values during render | Mirror props into state with `useEffect` |
| Clean up every effect (listeners, timers, abort controllers) | Leave intervals running after unmount |
| Abort a superseded fetch with `AbortController` and ignore stale responses | Let a slow response overwrite newer state (UI-121) |
| Keep keys stable and unique (ids, field paths) | Use array indexes as keys for lists that reorder |
| Memoize only what a profile shows is slow | Wrap everything in `useMemo` and `useCallback` "just in case" |
| Capture `event.currentTarget` before the first `await` | Read it after an `await` (it is `null` by then) |
| Navigate with Next's router through `NavigationGuard` (`09` §6) | Use `window.location` for in-app navigation |

## 6. Data and Payload

| Do | Don't |
|---|---|
| Go through `studioApi(session)` for every read and write (ADR-2) | Call `getPayload` or pass `overrideAccess: true` under `src/studio` |
| Batch lookups: one query per related collection with `limit` equal to the id count | Query inside a loop (N+1, UI-020) |
| Send only changed top-level keys on save (`buildPatch`) | Send the whole document back |
| Keep ids in their native type (numbers stay numbers) | `String(id)` on the way in or out (UI-076) |
| Read permissions with the helpers in `server/permissions.ts` | Index into Payload's sanitized permission objects directly |
| Hand-write migrations, guarded with `IF NOT EXISTS`, and regenerate types after a config change | Trust `payload migrate:create` or hand-edit `payload-types.ts` |

## 7. Tests

The pyramid: most tests are fast unit tests of pure logic, fewer are component render tests, and a small set of Playwright specs prove the real flows.

| Layer | What | Where | Rules |
|---|---|---|---|
| Unit | Pure functions: status, permissions, patch building, formatting, conditions, validators | `*.test.ts` next to the file | No network, no database; under 50 ms each |
| Component | Rendered markup and attributes of kit components and renderers | `*.test.tsx` with `renderToStaticMarkup` | Assert roles, labels and classes that carry meaning, not snapshots of whole trees |
| E2E | Real flows: sign in, list, edit, save, publish, permissions per role | `apps/cms/tests/e2e/studio/*.spec.ts`, tagged `@studio` | Use roles and visible text as locators, scoped to a region; include one denied role per flow |

| Do | Don't |
|---|---|
| Name tests for behaviour: `it('keeps typed text that arrives during a save')` | Name tests for implementation: `it('calls setValue')` |
| Arrange, act, assert, in that order, one behaviour per test | Assert ten unrelated things in one test |
| Test the failure path and a denied role | Test only the happy path |
| Fix the code when a test fails | Weaken, skip or delete a test to make it pass |
| Keep fixtures small and realistic (real field names, real shapes) | Use `foo`, `bar` and shapes Payload never produces |

## 8. Security, accessibility and performance

| Area | Do | Don't |
|---|---|---|
| Secrets | Read them from env on the server only; send the integration sentinel back unchanged (`09` §8.7) | Log, render or commit a secret, token or `.env` file |
| Authorization | Check permission on the server for every action, even when the UI hides the control | Rely on a hidden button as the guard |
| Injection | Render user content as text; sandbox HTML previews with `sandbox=""` | Use `dangerouslySetInnerHTML` with anything a user typed |
| Accessibility | Native elements first (`button`, `a`, `input`, `output`), visible focus, labels on every control, keyboard path for every action | `div` with `onClick`, focus outline removed, icon-only button without a label |
| Performance | Server-render lists, paginate, debounce search, lazy-load heavy editors | Fetch on every keystroke, render unbounded lists, ship the editor on the list page |

## 9. Self-review checklist (before Gate A)

Correctness

1. [ ] Does exactly what the task says, nothing more, nothing missing.
2. [ ] Handles `null`, `undefined`, empty arrays, empty strings, zero and very long text.
3. [ ] Every await is needed; no race between save, lock, upload and navigation (`09` §3, §4).
4. [ ] Errors are caught at the boundary and shown with the contract's message; the user's work is kept.

Types

5. [ ] No `any`, no unexplained cast, explicit return types on exports.
6. [ ] Optional values are handled, not assumed.

Security

7. [ ] Every input is parsed with Zod at the boundary.
8. [ ] Every action is authorized on the server, as the user.
9. [ ] No secret, token or personal data in logs, URLs or client bundles.

Performance

10. [ ] No query inside a loop; lookups are batched.
11. [ ] No work on every keystroke beyond the field itself.
12. [ ] Lists are paginated and bounded.

Accessibility and UI

13. [ ] Tokens only; every state from `02` and `09` §15 is present.
14. [ ] Keyboard path works and focus is visible and lands where `09` §14 says.

Maintainability

15. [ ] Names say what things are (`isPublishing`, not `flag`).
16. [ ] No function over about 50 lines without a reason; no file doing two jobs.
17. [ ] No speculative abstraction; three similar lines are fine.
18. [ ] Comments explain why, not what; no commented-out code, no TODO without an issue.

Tests and records

19. [ ] Tests cover the behaviour, a failure path and a denied role.
20. [ ] `07` rows owned by the task pass; the progress log line is appended (`HANDOFF.md`).

## 10. Decisions you must not make alone

Write them down and ask (`06` §9) instead of deciding:

- A new dependency.
- Any change to stored data shape, access rules, routes, migrations or Payload config beyond what the task says.
- A new architectural pattern (a new state library, a new data-fetching layer, a new styling approach).
- Anything that would make a `07` acceptance check or a `09` rule untrue.

Record an approved decision as an ADR in `00-MASTER-PLAN.md` with: context, decision, alternatives considered, consequences.
