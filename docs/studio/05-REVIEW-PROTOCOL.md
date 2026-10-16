# Studio review protocol

Every task in every Studio plan passes three gates before it is committed, and every phase passes a fourth before it is tagged. A task that fails a gate goes back to the implementer with the failing items; it is not committed "to fix later".

Work happens on `development` (repo branching policy). One task is one commit, staged by path (never `git add -A`), with a message that names the task id, for example `feat(studio): T1.4 server data layer`.

## Gate A: automated checks (implementer runs them, reviewer re-runs them)

```bash
pnpm --filter @cleanstart/cms lint
pnpm --filter @cleanstart/cms typecheck
pnpm --filter @cleanstart/cms test
pnpm --filter @cleanstart/cms verify:studio-boundaries
pnpm --filter @cleanstart/cms verify:studio-coverage
pnpm --filter @cleanstart/cms build
pnpm --filter @cleanstart/cms test:e2e -- --grep @studio
```

- `verify:studio-boundaries` and `verify:studio-coverage` are created in Phase 1 (Tasks 1.5 and 1.8). Before they exist, the gate skips them.
- When a task changes a collection config (the ADR-6 move), also run `pnpm --filter @cleanstart/cms generate:types` and `verify:types`; commit the regenerated types if they changed.
- The build is checked in a clean worktree when other sessions have uncommitted work in the shared checkout (see the project memory note on verifying builds in a clean worktree).

Pass: every command exits 0. Paste the summary line of each into the task notes.

## Gate B: senior engineer review

Run by a reviewer who did not write the code: Codex (`/codex` review of the task diff) and Claude (`/code-review high` on the same diff). Both reports are attached to the task. Every finding is fixed or answered in writing.

Checklist:

- [ ] Does exactly what the task says. Nothing extra, nothing missing.
- [ ] Every Local API call goes through `studio/server/payload.ts` with the user, `overrideAccess: false`, `overrideLock: false` (ADR-2). No `overrideAccess: true` anywhere in `src/studio`.
- [ ] No import of `@payloadcms/ui`, `@payloadcms/next` or `src/payload/admin/**` from `src/studio/**`, except the SHARE and KEEP modules listed in `03` §B.
- [ ] Server-only modules start with `import 'server-only'`.
- [ ] Inputs crossing a boundary (server actions, route params, search params, REST responses) are parsed with Zod.
- [ ] Errors are typed (`ValidationError`, `NotFoundError` and the other `AppError` subclasses); user-facing messages are plain and actionable.
- [ ] TypeScript strict: no `any`, no unchecked casts, explicit return types on exports, `undefined` vs `null` kept distinct.
- [ ] Tests cover the behaviour, including the failure paths and at least one role that must be denied.
- [ ] No dead code, no commented-out code, no TODO without an issue link.
- [ ] Follows the existing repo conventions in `CLAUDE.md` (comment only the non-obvious why, no premature helpers).
- [ ] Performance: no N+1 queries, no per-keystroke server calls, no unbounded lists.

## Gate C: UI and UX review

Required for any task that renders something. Run by a reviewer who did not build it, with the design system open.

Evidence the implementer attaches:

- Screenshots at 1440×900 in light and dark of every state the task touches (default, hover or focus where it matters, loading, empty, error, disabled, read-only, forbidden).
- A 1280×800 screenshot of each screen-level change.
- The axe result from the e2e run (zero violations).
- A short keyboard walkthrough: which keys were pressed and what happened.

Checklist (same as `01-DESIGN-SYSTEM.md` §10):

- [ ] Uses tokens only. No raw hex, px font size, radius or shadow in the component.
- [ ] Matches the lab component, or the lab was updated in the same change.
- [ ] Every state shown: default, hover, focus, active, disabled, loading, empty, error.
- [ ] Both themes checked at 1440×900 with screenshots attached.
- [ ] Keyboard path works, focus visible, focus returns to the trigger after closing an overlay.
- [ ] One primary action per view.
- [ ] Copy follows the design system copy rules. No em-dashes or en-dashes.
- [ ] No layout shift when data loads (skeleton matches final layout).
- [ ] Motion follows the motion rules and is off under reduced motion.
- [ ] axe reports zero violations.
- [ ] Nothing in the AI-tell list: no gradient text, no glow, no decorative dots, no emoji, no three identical cards in a row, no filler copy.

## Gate D: phase sign-off

At the end of each phase:

1. Demo of every exit criterion in the master plan, in both themes.
2. The parity rows in `03` §C that the phase covers are ticked with passing test ids.
3. You (product owner) sign off in writing in the phase's plan file. The tag `studio-p<N>` is created on `development` after sign-off.
4. Anything deferred is written into the next phase's plan, with a reason.

## Review record

Each task's notes (in its plan file, under the task) end with:

```
Gate A: lint ✓ · typecheck ✓ · test ✓ (n passed) · boundaries ✓ · coverage ✓ · build ✓ · e2e ✓
Gate B: Codex: n findings, all resolved · code-review: n findings, all resolved
Gate C: screenshots attached (light, dark, 1280) · axe 0 · reviewer: <name>
Commit: <sha>
```
