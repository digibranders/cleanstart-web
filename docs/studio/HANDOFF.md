# Studio build handoff

For the coding session that builds Studio. Read this file first, then follow it exactly.

## Where things stand (2026-10-21)

- The full spec is written, reviewed and committed on `development` (latest spec commit `d3ed9980`). Nothing is built yet.
- Task 0.1 is done. The build starts at **Task 0.2** of the Phase 0-1 plan.
- The approved visual direction is the private mockup artifact "CleanStart Studio mockups" (https://claude.ai/artifact/4fBv4T7CevcGC4eKvJAk9Z). The docs win where they differ.

## Reading order

1. `docs/studio/06-IMPLEMENTER-GUIDE.md` (rules, file map, recipes, traps, when to stop)
2. `docs/studio/10-ENGINEERING-STANDARDS.md` (do and don't for every line you write)
3. `docs/studio/05-REVIEW-PROTOCOL.md` (gates A to D)
4. The plan for the current phase:
   - Phases 0 and 1: `docs/superpowers/plans/2026-10-16-studio-phase-0-1-foundation.md`
   - Phases 2 to 7: `docs/studio/08-PHASE-2-7-TASKS.md`
5. For each task, the sections it cites in `00` to `04`, `07-UI-ISSUES-REGISTER.md` and `09-BEHAVIOUR-CONTRACT.md`.
6. The last 20 lines of `docs/studio/PROGRESS.md`, to see what is done and what is in flight.

## One-time setup: the worktree

Studio is built in its own git worktree on the short-lived branch `feat/studio-build`, so the shared checkout (where other sessions work) is never touched. The branch is merged into `development` at each phase sign-off.

```bash
cd /Users/a12345/Desktop/AI/cleanstart/cleanstart-website
git fetch origin
git worktree add .claude/worktrees/studio-build -b feat/studio-build origin/development
cd .claude/worktrees/studio-build
pnpm install
cp /Users/a12345/Desktop/AI/cleanstart/cleanstart-website/apps/cms/.env apps/cms/.env
```

Give Studio its own local database, so its migrations (Task 1.19) never touch the database the main checkout uses:

```bash
export PGPASSWORD='<the password from DATABASE_URI in apps/cms/.env>'
createdb -h localhost -U postgres cleanstart_studio
pg_dump -h localhost -U postgres cleanstart | psql -q -h localhost -U postgres -d cleanstart_studio
```

Then, in the worktree's `apps/cms/.env` only, change the database name at the end of `DATABASE_URI` from `cleanstart` to `cleanstart_studio`. Never commit `.env`.

Run the CMS dev server from the worktree on port 3200, so it never clashes with the main checkout's server on 3000. Check first with `lsof -nP -iTCP:3200 -sTCP:LISTEN`; never kill a process on a port, pick another free port instead.

```bash
cd apps/cms
PAYLOAD_DB_PUSH=false STUDIO_LAB=true NODE_OPTIONS=--no-deprecation pnpm exec next dev --port 3200
```

Playwright against it: `CMS_BASE_URL=http://localhost:3200 pnpm --filter @cleanstart/cms test:e2e -- --grep @studio` (use `localhost`, not `127.0.0.1`).

## The loop for every task

1. Append a `started` line to `docs/studio/PROGRESS.md` (rules in that file; always the one-line `printf … >>` append).
2. Read the task and everything it cites. Read the `07` rows whose Task column names it.
3. Write the failing test, implement, and run Gate A (`05`). For UI, capture the Gate C evidence.
4. Get Gate B: have a reviewer that did not write the code review the diff against `05` Gate B and `10` §9, and fix every finding. Use whatever your tool offers (Claude Code `/code-review`, Codex `/review`, or a fresh session or second model given the diff). If no reviewer is available, write "Gate B pending human review" in the task's review record and continue; the human reviews before the phase sign-off.
5. Commit in the worktree, staging by path, with the message `feat(studio): T<id> <summary>`, including the `PROGRESS.md` line.
6. Append the `done` line with the commit sha and gate results, and commit that line with the next task (or on its own: `docs(studio): progress`).
7. Tick the task's steps (`- [x]`) in its plan file in the same commit.

## Subagents

- One task per subagent. Give it the task id, the plan file, and this file.
- Never run two subagents that touch the same files at the same time. Tasks that touch only their own new files may run in parallel; anything that edits a shared file (`studio.css`, `primitives.css`, `ui/index.ts`, `payload.ts`, collection configs, `package.json`) runs alone.
- Subagents write code and append their own `PROGRESS.md` lines. They never commit. The orchestrating session reviews each subagent's diff, runs the gates, and commits.

## When to stop and ask

Stop that task (others may continue), append a `blocked` line, and ask the product owner when:

- a doc is ambiguous or two docs disagree;
- the plan's code does not compile against the real repo, or calls an API that does not exist;
- a step needs a new dependency, a migration or a config change the task does not list;
- a step needs production access (Task 0.9, the rich-text census, runs on the production droplet and needs written approval first);
- a phase is complete (Gate D: the product owner signs off before the merge to `development` and the `studio-p<N>` tag).

## Phase end

1. Every task in the phase has a `done` line and its commit.
2. Gate D evidence is ready (`05`): demo of each exit criterion in both themes, `03` rows ticked.
3. Append `PHASE-<N> | signed-off` only after the product owner signs off in writing.
4. Merge `origin/development` into `feat/studio-build`, open a PR into `development`, and after it merges create the tag `studio-p<N>` on `development`.

## Kickstart prompt

Paste this into a new coding session opened in the main checkout. It works the same in Claude Code, Codex and Antigravity: they all read the Studio section of `AGENTS.md` or `CLAUDE.md` at the repo root, which points here.

```text
You are building "Studio", a custom Next.js admin that replaces Payload's admin UI in the CleanStart monorepo at /Users/a12345/Desktop/AI/cleanstart/cleanstart-website (app: apps/cms). The full spec is written and approved; your job is to implement it exactly, task by task, without guessing.

Start by reading docs/studio/HANDOFF.md and do exactly what it says:
1. Do the one-time setup in its "One-time setup" section: create the worktree .claude/worktrees/studio-build on branch feat/studio-build from origin/development, run pnpm install, copy apps/cms/.env, create the separate cleanstart_studio database and point the worktree's DATABASE_URI at it. Work only inside that worktree from then on. Never run git add -A or git add . and never commit .env.
2. Read, in order: docs/studio/06-IMPLEMENTER-GUIDE.md, docs/studio/10-ENGINEERING-STANDARDS.md, docs/studio/05-REVIEW-PROTOCOL.md, and the top of docs/superpowers/plans/2026-10-16-studio-phase-0-1-foundation.md.
3. Read the last 20 lines of docs/studio/PROGRESS.md. Task 0.1 is done; start at Task 0.2 unless the log shows later tasks done.
4. For each task, follow the loop in HANDOFF.md: append a "started" line to docs/studio/PROGRESS.md with a single printf >> append (never rewrite that file), read every section the task cites (including rows in docs/studio/07-UI-ISSUES-REGISTER.md that name the task and the rules in docs/studio/09-BEHAVIOUR-CONTRACT.md), write the failing test first, implement the plan's code exactly, run Gate A until every command passes, collect Gate C evidence for anything that renders, get an independent review of the diff (your tool's review command or a second model) and fix all findings, commit by path with "feat(studio): T<id> <summary>", then append a "done" line with the short commit sha and gate results.
5. If you use subagents: one task each, never two on the same files at once, subagents append their own PROGRESS.md lines but never commit; you review, run the gates and commit.
6. Stop and ask me (append a "blocked" line first) whenever a doc is ambiguous, two docs disagree, the plan's code does not compile against the real repo, a step needs something the task does not list, a step needs production access (Task 0.9), or a phase is complete and needs my sign-off. Do not invent values, strings, props, endpoints or behaviour.

Rules that always apply: no em-dashes or en-dashes anywhere (code, comments, copy, commits); every Local API call goes through studioApi(session) with overrideAccess false and overrideLock false; tokens only in UI; copy strings exactly as the docs give them; the dev server runs on port 3200 from the worktree and you never kill a process on any port.

Begin now with the setup, then Task 0.2. After each task, tell me in one line what you finished and what is next.
```
