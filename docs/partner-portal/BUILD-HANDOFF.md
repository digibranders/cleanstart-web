# Partner portal build handoff

For the coding session that builds the real partner portal (`apps/portal`), including an unattended overnight run. Read this file first, then follow it exactly.

## Where things stand (2026-11-12)

- Two plans are written and committed on `development` (`2b56b861`): `docs/superpowers/plans/2026-11-11-partner-portal-master-plan.md` (the whole app, task level) and `docs/superpowers/plans/2026-11-11-partner-portal-hubspot-integration.md` (HubSpot, code level).
- `apps/portal` is a clickable mock (commit `58747992`, not deployed). No backend, no database, no auth. The build converts it screen by screen into the real app.
- Nothing from the plans has been built. The code samples in the HubSpot plan have not been compiled; treat a sample that does not compile against the real repo as a `blocked` case (see "When to stop").
- Decisions D1 to D10 are settled (master plan section 2). Auth library is Better Auth, with Auth.js v5 as the fallback if the Task 0.7 spike fails.

## Reading order

1. This file.
2. Master plan sections 1 to 5 (architecture, decisions, layout, data model, permissions), then the section for the task in hand.
3. HubSpot plan sections 1 to 3 and the task in hand (HubSpot tasks only).
4. `CLAUDE.md` at the repo root (git rules, conventions, no em-dashes or en-dashes anywhere).
5. The last 20 lines of the progress log (see "Progress log").

## Task ids

Both plans number tasks 4.x. In every log line, commit and brief, prefix the id: `M` for the master plan (`M1.2`, `M4.3`) and `H` for the HubSpot plan (`H4.4`). Master plan Task 2.5 is satisfied by the whole `H` track.

## Amendments to the plans

These override the plans where they differ.

1. **Dependencies are installed once, in `W0-a`.** The agent reads the plan code, lists every package it imports (expected: `drizzle-orm`, `drizzle-kit`, `pg`, `zod`, `better-auth`, `@hubspot/api-client`, `node-cron`, `vitest`, `@sentry/nextjs`, `@aws-sdk/client-s3`, `@aws-sdk/s3-request-presigner`, `@playwright/test`), and adds them all, so later tracks never edit `package.json` and `pnpm-lock.yaml` cannot conflict. A later task that needs another package is `blocked`; the orchestrator adds it.
2. **Test database name comes from the environment** (`PORTAL_TEST_DATABASE_URL`), not a hard-coded `cleanstart_portal_test`, so every worktree runs tests against its own database. `testDb` and `testPool` in `src/db/test-helpers.ts` read it.
3. **Task M0.3 also delivers `scripts/db-create.sh <name>`**: idempotently creates the `portal_owner` and `portal_app` roles (cluster-wide, so a `DO` block that checks `pg_roles`), a database owned by `portal_owner`, `REVOKE ALL ... FROM PUBLIC`, and grants for `portal_app`. Used for every local and test database.
4. **Task M0.3 migrations include `CREATE EXTENSION IF NOT EXISTS pg_trgm`** and trigram indexes for the Task M4.3 search (registrations, partners, documents, people). Only Wave 0 writes migrations. A later task that needs a schema change is `blocked`; the orchestrator batches schema changes into one numbered migration.
5. **Dev port.** The mock's script uses 3004. In worktrees run `next dev --port <n>` with the track's own port (table below). Never kill a process to free a port.
6. **Pure functions that tests pin (mappers, expiry maths) take the clock as an argument** instead of calling `Date.now()` inside, so tests need no fake timers.

## What an overnight run can and cannot finish

| Item | Overnight form | Left for a person |
|---|---|---|
| M0.1 HubSpot capability check | Skip. Write `docs/partner-portal/HUBSPOT-CAPABILITIES.md` as a stub where each of the five answers is marked `UNVERIFIED` and names the fallback the HubSpot plan already provides (association labels off, polling only, and for the unique property the fallback in HubSpot plan section 5). | Run the check on a HubSpot developer account. |
| M0.7 auth spike | Prove email and password, email one-time code, database sessions and `getViewer()` locally. Google and Microsoft sign-in cannot be proven without a dev OAuth app: write the provider config behind env vars and mark the spike result `PROVISIONAL (OAuth unverified)`. Better Auth is kept if the other items pass. | Create the dev OAuth apps and confirm. |
| Droplet, Caddy, Cloudflare, resize, DNS (M0.3, M0.6) | Write the files in the repo only (compose service, Caddy block as a snippet in `docs/operations/PARTNER-PORTAL.md`). Never `ssh`. | Everything on the droplet. |
| M0.6 workflows | Write `portal.yml` and `deploy-portal.yml`. They cannot run before a push. | First CI run and first deploy. |
| M1.3b website intake | Test against a local stub HTTP server that mimics the CMS REST shape. No CMS service user exists. | Create the CMS service user and API key. |
| Turnstile, Brevo, R2, HubSpot | Interfaces plus fakes in tests (`EmailTransport`, `FileStorage`, `HubspotApi`). Real adapters are written and unit tested with stubbed HTTP. Turnstile uses Cloudflare's published always-pass test keys in dev and test only. | Real keys, one real send, one real upload. |
| Legal agreement text | `agreement_version` is the placeholder `draft-0`, shown on the invite screen as is. | Legal text and the real version label. |
| Deal rules still open | Defaults from the proposal, all in `deal-rules.ts`. | Confirm. |
| M5.5 backups | Edit `infra/scripts/backup.sh` and run `bash -n` on it. Log "heartbeat not verified". | Verify the heartbeat and run the restore drill. |
| M5.6, M5.7, M5.8 | Do not start. | Pilot, production provisioning, cutover. |

## Ground rules for an unattended run

- **Allowed paths only:** `apps/portal/**`, `docs/partner-portal/**`, `docs/operations/PARTNER-PORTAL.md`, `docs/superpowers/plans/2026-11-11-partner-portal-*.md` (tick steps, and record the M0.7 result in the Decisions table), `.github/workflows/portal.yml`, `.github/workflows/deploy-portal.yml`, `infra/docker-compose.yml`, `infra/scripts/backup.sh`, `pnpm-lock.yaml` (orchestrator only). Anything under `apps/cms`, `apps/web` or `packages/` is `blocked`.
- **Never:** `git push`, open a PR, `ssh` to the droplet, use a production token or the CMS `.env` secrets, call HubSpot or Brevo or R2 for real, `git add -A` or `git add .`, `--no-verify`, commit `.env*`, drop a database other than the track's own, kill a process on a port, edit `apps/cms/payload-types.ts`.
- **Gates are the definition of done.** A task without a green Gate A and a Gate B record is not `done`.
- **No em-dashes or en-dashes** in code, comments, copy, commit messages or docs.

## Setup

The build lives in its own git worktree on the short-lived branch `feat/portal-build`, so the shared checkout (where other sessions work) is never touched. This follows the Studio precedent and needs a short pointer in `CLAUDE.md` and `AGENTS.md` (same text in both): "Portal build: read `docs/partner-portal/BUILD-HANDOFF.md` first". `CLAUDE.md` bans feature branches for routine work; the product owner approved this one by asking for the overnight build. Delete the branch after the merge to `development`.

Integration worktree (orchestrator):

```bash
cd /Users/a12345/Desktop/AI/cleanstart/cleanstart-website
git fetch origin
git worktree add .claude/worktrees/portal-build -b feat/portal-build origin/development
cd .claude/worktrees/portal-build
pnpm install
```

Local database (password is in `DATABASE_URI` in `apps/cms/.env`; the dev databases never touch the droplet). After M0.3 lands, create one per worktree with `scripts/db-create.sh`. `W0-b` creates the first two by hand, then writes that script:

| Worktree | Branch | Database | Test database | Dev port |
|---|---|---|---|---|
| `portal-build` | `feat/portal-build` | `cleanstart_portal` | `cleanstart_portal_test` | 3204 |
| `portal-h` | `feat/portal-h` | `cleanstart_portal_h` | `cleanstart_portal_h_test` | 3214 |
| `portal-p` | `feat/portal-p` | `cleanstart_portal_p` | `cleanstart_portal_p_test` | 3224 |
| `portal-d` | `feat/portal-d` | `cleanstart_portal_d` | `cleanstart_portal_d_test` | 3234 |
| `portal-r` | `feat/portal-r` | `cleanstart_portal_r` | `cleanstart_portal_r_test` | 3244 |
| `portal-a` | `feat/portal-a` | `cleanstart_portal_a` | `cleanstart_portal_a_test` | 3254 |

Each worktree gets its own `apps/portal/.env` (never committed) with its database URLs and `AUTH_SECRET` from `openssl rand -base64 32`. Track branches are created from the tip of `feat/portal-build` after Wave 0 and are deleted when their last task is merged.

Check a port first with `lsof -nP -iTCP:<port> -sTCP:LISTEN`. Playwright uses `localhost`, never `127.0.0.1`.

## The task graph

A **track** is an ordered list of tasks worked by one agent at a time. Tracks run in parallel in their own worktrees. At most **4 tracks at once** (one CPU, one Postgres, one Mac).

### Wave 0: foundations (serial, integration worktree, one agent at a time)

| Step | Task | Notes |
|---|---|---|
| W0-a | M0.2, plus the dependency set (amendment 1) | Tag `portal-mock-v1` on `58747992` first. |
| W0-b | M0.3 | Schema, RLS, roles, migrations, helpers, `seed-dev.ts`, `db-create.sh`, trigram indexes. |
| W0-c | M0.4 | `env.ts`, logging, Sentry config. |
| W0-d | M1.2 | Tenant isolation layer and the isolation matrix. Everything after this adds its repo functions to the matrix. |
| W0-e | M0.7 | Auth spike, then record the result in the master plan Decisions table. |
| W0-f | M1.1 | Sessions, guards, `getViewer()`, `policies.ts`, sign in. |
| W0-g | M0.5 | Email module (small, own folder). |

**Exit:** all Gate A commands green on `feat/portal-build`, isolation matrix passing, tag `portal-w0`. If W0 cannot finish, stop the whole run and write the report: nothing in Wave 1 can proceed safely.

### Wave 1: parallel tracks

| Track | Tasks in order | Starts when | Owns (no other track edits these) |
|---|---|---|---|
| **H** HubSpot | H4.1, H4.2, H4.3, H4.4, H4.5, H4.6, H4.7, H4.8, H4.9, H4.10 | `portal-w0` | `src/server/hubspot/**`, `src/server/jobs/**`, `scripts/*hubspot*`, `src/app/api/hubspot/**`, health panel |
| **P** Identity | M1.3, M1.3b, M1.4, M1.5, M1.6, M1.7, M1.8, M4.1 | `portal-w0` | `Apply*`, `SignIn`, `AcceptInvite`, `PartnerWelcome`, `Team`, `Account`, `Company`, `AdminTeam`, `AdminPartners`, `components/partners/**`, `components/people/**`, `src/server/intake/**`, `repo/{applications,invites,team,account,staff}.ts` |
| **D** Documents | M3.1, M3.2, M3.3 | `portal-w0` | `Documents`, `AdminDocuments`, `components/documents/**`, `src/server/files/**`, `repo/documents.ts` |
| **A** Admin and infra | M0.6, M4.2, M4.3 | `portal-w0` | `AdminAudit`, `AuditDrawer`, search, `Dockerfile`, workflows, compose, `src/app/api/health/**` |
| **R** Registrations | M2.1, M2.3, M2.2, M2.4, M2.6, M4.4 | `H4.2` merged for M2.1; `H4.4` merged before M2.2 and M2.4; start when D or A finishes (the 4 track cap) | `Deals`, `DealDetail`, `RegisterDeal`, `AdminApprovals`, `PartnerOverview`, `AdminReports`, `components/{deals,reports}/**`, `repo/{registrations,messages,notifications,overview,reports}.ts` |

M2.5 is the H track. R uses the `HubspotApi` interface and `FakeHubspot` from H4.2, and calls the outbox `enqueue` from H4.4; it never imports the real client.

Shared files that no track edits directly: `shell.tsx`, `routes.ts`, `portal.css`, `components/ui/**`, `src/db/schema.ts`, `src/env.ts`, `package.json`. A track that needs a change there writes a `blocked` line naming the file and the change, and carries on with a task that does not need it. The orchestrator makes the change on `feat/portal-build` and the track merges it in.

### Wave 2: convergence (after every Wave 1 track is merged, serial)

| Step | Task | Notes |
|---|---|---|
| W2-a | M5.4 | Remove the mock banner, tour, Driver.js, `slice.ts`, personas and seed slices. Keep `seed-dev.ts`. |
| W2-b | E2E | Playwright `@portal` suite from master plan section 7, using `FakeHubspot`. |
| W2-c | M5.1 | Security pass. |
| W2-d | M5.2 | Accessibility pass. |
| W2-e | M5.3 | Retention jobs (mirror the CMS purge jobs; reuse `jobs/lock.ts` and `schedule.ts`). |
| W2-f | M5.5, M5.9 | Backup script edit, runbook `docs/operations/PARTNER-PORTAL.md`, incident template. |
| W2-g | H section 6 | Run the HubSpot verification checklist and record each line. |
| W2-h | Report | Write `docs/partner-portal/OVERNIGHT-REPORT.md`. |

A run may stop anywhere. Each wave boundary is a tag (`portal-w0`, `portal-w1`, `portal-w2`) so the morning review can start from the last good point.

## Converting a mock screen to a real one

The mock keeps state in `src/lib/slice.ts` and seed arrays in `src/data/*`. The real app replaces them. For every screen:

1. Keep the markup, class names and CSS unchanged. Visual changes are out of scope; the mock was reviewed.
2. `page.tsx` becomes a Server Component: `const viewer = await getViewer()`, load data through repo functions inside `withViewer(viewer, ...)`, pass serializable props to the existing client component.
3. Each place the mock called a slice setter becomes a server action in `src/server/actions/*`: Zod parse, `assertCan(viewer, ...)`, repo call, audit entry, outbox op where the plans say so, then `revalidatePath`. The client calls the action and shows the returned error inline or a toast, never `window.alert`.
4. Replace the persona switch in `shell.tsx` with the viewer's real role (done once, in `W0-f`; screens read the viewer from props).
5. Every screen gets a loading skeleton, an empty state and an error state, matching the existing `loading-skeleton.tsx` shapes.
6. Every new repo function is added to the isolation matrix in the same commit, or the lint-style test fails.
7. The mock's seed numbers become test fixtures, so the real screens show the same figures as the mock in `seed-dev`.

| Route | Component | Real data source | Task |
|---|---|---|---|
| `/sign-in` | `SignIn`, `people/{PasswordCard,TwoStepCard}` | auth, sessions | M1.1 |
| `/apply`, `/apply/done` | `Apply`, `ApplyDone` | `applications` | M1.3 |
| `/accept-invite` | `AcceptInvite`, `people/InviteCard` | `invites` | M1.5 |
| `/partner/welcome` | `PartnerWelcome` | `users`, agreement | M1.5 |
| `/partner/team` | `Team`, `people/*` | `users`, `invites`, `access_requests` | M1.6 |
| `/partner/account` | `Account` | `users`, sessions | M1.7 |
| `/partner/company` | `Company` | `partners` | M1.7 |
| `/admin/team` | `AdminTeam`, `StaffInviteDrawer` | `users`, `staff_scopes` | M1.8 |
| `/admin/partners` | `AdminPartners`, `partners/*` | `partners`, `applications` | M1.4, M4.1 |
| `/partner/deals`, `/new`, `/[id]` | `Deals`, `RegisterDeal`, `DealDetail`, `deals/*` | `registrations*` | M2.1, M2.3 |
| `/admin/approvals` | `AdminApprovals` | `registrations`, outbox | M2.2, M2.4 |
| `/partner/overview` | `PartnerOverview`, `reports/*` | SQL aggregates | M2.6 |
| `/admin/reports` | `AdminReports`, `reports/*` | SQL aggregates | M2.6 |
| `/partner/documents` | `Documents`, `documents/*` | `documents`, R2 | M3.2 |
| `/admin/documents` | `AdminDocuments`, `UploadDocumentForm`, `DocumentEditDrawer` | `documents`, R2 | M3.2 |
| `/admin/audit` | `AdminAudit`, `AuditDrawer` | `audit_log` | M4.2 |
| Ctrl K, notification popovers | `shell.tsx` | search, `notifications` | M4.3, M4.4 |

## The loop for every task

Run inside the track's worktree.

1. Append a `started` line to the progress log.
2. Read the task, the sections it cites, and the mock files in the table above.
3. Write the failing test first (repository and policy tests run against the real local Postgres; HubSpot, Brevo, R2 and Turnstile use the fakes).
4. Implement the plan's code. If the plan's code does not compile or an API it names does not exist, fix it only when the fix stays inside the task and is obvious (a wrong import path, a missing type); otherwise `blocked`.
5. **Gate A**, all must pass:

   ```bash
   pnpm --filter @cleanstart/portal lint
   pnpm --filter @cleanstart/portal typecheck
   pnpm --filter @cleanstart/portal test
   # only one `next build` runs at a time on this machine; take the lock
   until mkdir /tmp/portal-build.lock 2>/dev/null; do sleep 15; done
   pnpm --filter @cleanstart/portal build; BUILD_STATUS=$?
   rmdir /tmp/portal-build.lock
   [ "$BUILD_STATUS" -eq 0 ]
   # no em-dashes or en-dashes, and nothing outside the allowed paths
   git diff feat/portal-build -- . | grep '^+' | grep -nE '—|–' && exit 1
   git diff --name-only feat/portal-build
   # on feat/portal-build itself, compare against origin/development instead
   ```

6. **Gate B**, an independent review: a fresh subagent that did not write the code gets the diff and the checklist below, and returns findings. Fix every finding and re-run Gate A. Record the result in the `done` line.

   Reviewer checklist: tenant scoping (every repo read and write goes through `withViewer`, and is in the isolation matrix); `assertCan` before every action; Zod at every boundary; no `any`; typed errors; secrets never logged; no HubSpot call inside a request; idempotency keys on outbox ops; audit entry for every state change; dashes; no code outside the task's scope.

7. Commit in the track worktree, staging by path: `feat(portal): <task id> <summary>`. Tick the task's steps in the plan file in the same commit. No attribution lines.
8. Append the `done` line with the short sha and the gate results.
9. Tell the orchestrator the task is ready to merge (see below).

Subagents write code and tests and append their own log lines. In a track worktree the track's agent commits. Only the orchestrator merges.

## Merging

- The orchestrator merges a track branch into `feat/portal-build` after each `done` task, in the integration worktree: `git merge --no-ff feat/portal-<x>`.
- After a merge it runs Gate A and the isolation matrix on `feat/portal-build`. A red result is fixed on the integration branch by the orchestrator, or the merge is reverted and the task becomes `blocked`.
- Each track merges `feat/portal-build` into its own branch before starting its next task, so it always builds on the current tree.
- Conflicts in shared files are resolved by the orchestrator; a track never resolves a conflict in a file it does not own.
- Concurrency: tests that use `FOR UPDATE SKIP LOCKED` or advisory locks must pass when two test files run at the same time, because each worktree has its own database but one process can run several files.

## When to stop and ask

Stop that task (other tracks continue), append a `blocked` line naming what is needed, and move to the next task the track can do:

- a doc is ambiguous or two docs disagree;
- the plan's code does not compile against the real repo in a non-obvious way;
- a step needs a dependency, a migration, a shared file or an environment variable the task does not list;
- a step needs production access, a real credential, the droplet, or a person (see the overnight table);
- Gate A is still red after 3 repair attempts, or Gate B returns the same finding twice.

Do not invent values, endpoints, strings or behaviour. A `blocked` task that blocks every later task in its track ends that track.

## Progress log

One append-only file shared by every session: `/Users/a12345/Desktop/AI/cleanstart/cleanstart-website/docs/partner-portal/PROGRESS.md`, in the **main checkout**, by absolute path, so it does not depend on which worktree writes it. It is untracked there. The orchestrator copies it into `feat/portal-build` at each wave boundary and commits the copy.

Create it once with this header, then only append:

```text
# Partner portal build progress

One line per event. Columns: time | task | event | track | sha | gates | note. Events: started, done, blocked, review-pending, merged, note.
Append only, one shell append per line. Never open this file in an editor tool.
```

```bash
printf '%s\n' "2026-11-12 23:40 IST | H4.2 | done | H | 1a2b3c4 | A ok, B ok | HubspotApi, RealHubspot, FakeHubspot" >> /Users/a12345/Desktop/AI/cleanstart/cleanstart-website/docs/partner-portal/PROGRESS.md
```

## Morning report

At the end (or at the hard stop time) the orchestrator writes `docs/partner-portal/OVERNIGHT-REPORT.md` on `feat/portal-build`: tasks done and their shas, tasks blocked and what each needs, every `UNVERIFIED` and `PROVISIONAL` item, the Gate B findings that were deferred, the last good tag, and the three commands to run the app locally. Nothing is pushed; the product owner reads the report, then decides on the push and the PR.

## Limits

- Hard stop time: set in the kickstart prompt. After it, no new task starts; running tasks finish their gates or are marked `blocked`.
- Four tracks at once. One `next build` at a time (the lock above). Do not run `next dev` in more than the worktrees you are testing in.
- 3 repair attempts per gate failure, then `blocked`.
- If the Mac sleeps or the machine runs low on disk (under 5 GB free), stop launching tasks and write the report.

## Kickstart prompt (orchestrator)

Paste this into a new session opened in the main checkout, with the hard stop time filled in. It works in Claude Code, Codex and Antigravity.

```text
You are the orchestrator for the build of the real CleanStart partner portal (apps/portal) in the monorepo at /Users/a12345/Desktop/AI/cleanstart/cleanstart-website. The plans are written and approved; implement them without guessing.

Start by reading docs/partner-portal/BUILD-HANDOFF.md and follow it exactly:
1. Do the Setup: worktree .claude/worktrees/portal-build on branch feat/portal-build from origin/development; create the progress log in the main checkout with its header. Work only in worktrees. Never push, never ssh to the droplet, never use production credentials, never git add -A.
2. Run Wave 0 in order, one agent at a time, each task through the loop in the handoff (failing test first, Gate A, an independent Gate B reviewer that did not write the code, commit by path, progress line). Tag portal-w0 when the exit criteria hold. If Wave 0 cannot finish, stop and write the report.
3. Then run Wave 1 as parallel tracks H, P, D, A and R in their own worktrees, at most 4 at once, one subagent per task, never two subagents on the same files, merging each finished task into feat/portal-build yourself and running Gate A and the isolation matrix after every merge.
4. Then Wave 2, then write docs/partner-portal/OVERNIGHT-REPORT.md.
5. A task that needs a person, a credential, the droplet, a shared file, a new dependency or a schema change is blocked: log it and move on. Do not invent values or behaviour. Keep the allowed paths rule. No em-dashes or en-dashes anywhere.

Hard stop time: <FILL IN, e.g. 06:30 IST>. Do not start a task after it.

Begin now with Setup and W0-a. After each merged task, log it; do not wait for me.
```

## Subagent brief (one per task)

The orchestrator sends this, filled in, to each task agent:

```text
Task <id> of the partner portal build. Worktree: <path>. Branch: <branch>. Database: <db> (test: <testdb>). Port: <port>.
Read docs/partner-portal/BUILD-HANDOFF.md (ground rules, loop, stop rules), then <plan file> task <id> and the sections it cites, and the mock files for this screen from the screen table.
You own only these paths: <owned paths>. Do not edit any other file; if you need to, append a blocked line and stop that step.
Write the failing test first, implement, and run Gate A until it passes. Append started and done lines to the progress log by absolute path with one printf. Commit by path as "feat(portal): <id> <summary>", with the plan steps ticked. Do not merge, push or create branches. Reply with: the commit sha, the Gate A result, anything blocked, and anything the reviewer should look at.
```
