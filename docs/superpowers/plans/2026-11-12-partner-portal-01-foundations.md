# Partner portal foundations Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build Wave 0 of the real partner portal on `feat/portal-build`: the tagged and restructured app with every dependency installed once (M0.2), the database with roles, migrations, row level security, test helpers, a dev seed and `db-create.sh` (M0.3), the environment, logging, Sentry and the job infrastructure (M0.4), and the tenant isolation layer with the isolation registry and matrix (M1.2). When this plan is done, every later track can write repo functions, actions and jobs without touching a shared file.

**Architecture:** One Next.js 16 app (`apps/portal`) on Postgres 16 through Drizzle. Two Postgres roles: `portal_owner` owns the schema and runs migrations, `portal_app` is what the app connects as (no `BYPASSRLS`, not the owner), so row level security is real. Two connection pools on the one role: a request pool whose identity is set per transaction by `withViewer`, and a system pool whose every connection carries `app.kind = system` through a startup option. Tenant isolation is application scoping in repo functions, row level security as the backstop, and a matrix test that every repo module registers itself in. Jobs are `node-cron` tasks started from `src/instrumentation.ts`, each run under a Postgres advisory lock.

**Tech Stack:** Next.js 16.2.5, React 19, TypeScript strict, Postgres 16, Drizzle ORM 0.45 and drizzle-kit 0.31, Zod 3.25, `pg`, Vitest 2.1, `node-cron` 4, `@sentry/nextjs` 9, Better Auth (installed here, configured in W0-e), `@hubspot/api-client`, the AWS SDK v3 (installed here, used by track D), Playwright (installed here, used in Wave 2).

**Source of truth:** `docs/superpowers/plans/2026-11-12-partner-portal-00-contracts.md` (called "the contracts") for every name, column, signature and path; `docs/partner-portal/BUILD-HANDOFF.md` for waves, gates and ground rules; `docs/superpowers/plans/2026-11-11-partner-portal-master-plan.md` for what M0.2, M0.3, M0.4 and M1.2 mean. Where a file below is "created from the contracts", the step runs a command that copies the contract's code block mechanically, so no transcription can drift. Everything this plan changes or adds on top of the contracts is listed in "Contract change requests" at the end.

**Owner track:** W0 (steps W0-a to W0-d of the handoff), one agent at a time in the integration worktree, in this order: M0.2, M0.3, M0.4, M1.2. A fifth task, M1.2b (the server action runner), is written here but runs right after W0-f (M1.1) because it needs `getViewer()`.

---

## How to work this plan

1. **Where.** The integration worktree `/Users/a12345/Desktop/AI/cleanstart/cleanstart-website/.claude/worktrees/portal-build` on branch `feat/portal-build` (BUILD-HANDOFF, "Setup"). Run every command from the root of that worktree, never from the main checkout. Paths in commands and `git add` lines start with `apps/portal/` and are relative to the worktree root; the file tables and code headings drop that prefix.
2. **Running one test file.** `pnpm --filter @cleanstart/portal exec vitest run <file>` runs one test file with `apps/portal` as the working directory, so the file argument is relative to `apps/portal` (for example `src/lib/dates.test.ts`).
3. **Before the first step** the contracts, the handoff, the master plan, the HubSpot plan and this plan must already be committed on the branch the worktree was cut from (see "Contract change requests", item 1). Check with `ls docs/superpowers/plans/2026-11-12-partner-portal-0*.md docs/partner-portal/BUILD-HANDOFF.md` inside the worktree: both contracts and this file must be listed.
4. **Test first.** Every task writes the failing test, runs it and reads the failure, then implements. A step that says "Expected: FAIL" means the failure message shown, not just a red run. Where a test guards code that already works (the import rules, the isolation matrix) a step breaks the code on purpose, watches the test fail, and repairs it.
5. **Copying from the contracts.** Several files are created with
   ```bash
   bash apps/portal/scripts/contract-block.sh "<heading prefix>" <block number> > <file>
   ```
   `scripts/contract-block.sh` (created in M0.2) prints the Nth fenced code block under a contracts heading without the fence lines. If it prints `contract-block: no block ...`, the contracts file changed shape: write a `blocked` line, do not copy by hand.
6. **Gate A** (BUILD-HANDOFF step 5), run at the end of every task from the worktree root after `git add` of the task's paths (so the dash check sees the new files):

   ```bash
   pnpm --filter @cleanstart/portal lint
   pnpm --filter @cleanstart/portal typecheck
   pnpm --filter @cleanstart/portal test
   # only one `next build` runs at a time on this machine; take the lock
   until mkdir /tmp/portal-build.lock 2>/dev/null; do sleep 15; done
   pnpm --filter @cleanstart/portal build; BUILD_STATUS=$?
   rmdir /tmp/portal-build.lock
   [ "$BUILD_STATUS" -eq 0 ]
   # no em-dashes or en-dashes (the pattern is their UTF-8 bytes, so this file itself has none), and nothing outside the allowed paths (we are on feat/portal-build itself)
   git diff origin/development -- . | grep '^+' | grep -nE $'\xe2\x80\x94|\xe2\x80\x93' && exit 1
   git diff --name-only origin/development
   ```

   Every task below says which of the four commands can run at that point. In this plan all four can run at the end of every task.
7. **Gate B.** After Gate A is green, a fresh subagent that did not write the code gets `git diff origin/development` for the task and the reviewer checklist in BUILD-HANDOFF ("Reviewer checklist"). Fix every finding, rerun Gate A, and put the result in the progress line.
8. **Commit.** Stage by path (never `git add -A` or `.`), tick this task's checkboxes in this file and include the file in the commit, then commit with `feat(portal): <task id> <summary>`. No attribution lines. Never `--no-verify`, never push.
9. **Progress log.** One `printf '%s\n' "..." >> /Users/a12345/Desktop/AI/cleanstart/cleanstart-website/docs/partner-portal/PROGRESS.md` line at `started` and at `done` of each task, in the format of BUILD-HANDOFF. The sample lines in this plan carry the time `2026-11-13 00:00 IST`; write the real time.
10. **No em-dashes or en-dashes** in code, comments, docs or commit messages. Ranges use "to".
11. **Local Postgres.** The machine has Postgres 16 on `localhost:5432`. If `psql` asks for the `postgres` password, take it from `DATABASE_URI` in `apps/cms/.env` and export it as `PGPASSWORD` without printing it. The roles and databases this plan creates are on the developer's Postgres only, never on the droplet.

---

## File Structure

Every file this plan creates or modifies, with its responsibility. Paths are relative to `apps/portal` unless they start with `docs/`.

### M0.2 (W0-a)

| File | Action | Responsibility |
|---|---|---|
| tag `portal-mock-v1` | create | Recovery point for the mock at `58747992` |
| `package.json` | modify | Dependencies for every wave (installed once), the `test` and `db:*` scripts, description |
| `next.config.ts` | replace | Standalone output switch and repo-root tracing for the Docker image (plan 06 M0.6 reads it; contracts K.3) |
| `vitest.config.ts` | create | Minimal Vitest config (alias only); replaced by the full one in M0.3 |
| `src/structure.test.ts` | create | Asserts the folders, READMEs, scripts and every planned package are present |
| `src/server/README.md`, `src/db/README.md`, `scripts/README.md` | create | One line each saying what the folder holds |
| `scripts/contract-block.sh` | create | Mechanical copy of a contracts code block |
| `README.md` | modify | Says the app is becoming the real portal, how to run tests |
| `docs/partner-portal/HUBSPOT-CAPABILITIES.md` | create | M0.1 stub: five answers, each `UNVERIFIED`, each with its fallback |

### M0.3 (W0-b)

| File | Action | Responsibility |
|---|---|---|
| `scripts/db-bootstrap.sql` | create (contracts C.4) | Roles, database, grants, extension, default privileges, idempotent |
| `scripts/db-create.sh` | create | Idempotent per-worktree database creation, optional `--recreate` |
| `src/env.ts`, `src/env.test.ts` | create (contracts I) | Zod validated environment; created here because `client.ts` imports it |
| `src/lib/{domain,dto,clock,dates,deal-rules}.ts` and tests | create (contracts C.0, H.0, D.5, H.19) | Shared pure types, enum lists, clock, date maths, deal rules |
| `src/server/auth/types.ts` and test | create (contracts D.1) | `Viewer`, `SystemActor`, `RoleKey` |
| `src/db/schema.ts` | create (contracts C.1) | Every table |
| `drizzle.config.ts`, `drizzle/0000_init.sql`, `drizzle/meta/*` | create | drizzle-kit config and the generated, reviewed first migration |
| `src/db/rls.sql` | create (contracts C.3) | Policies, triggers, grants, re-applied after every migration |
| `scripts/migrate.ts` | create | `migrateDatabase()` and the `db:migrate` entry |
| `src/db/client.ts` | create (contracts C.2) | Request pool `appDb` and system pool `db`, `pool` |
| `vitest.config.ts`, `src/db/{test-env,test-global-setup,test-setup}.ts` | replace and create | One database per Vitest worker |
| `src/db/test-helpers.ts` | create | `testDb`, `testPool`, `resetDb`, `make*`, `viewerFor`, `asStaff`, `asPartner` |
| `src/db/schema.test.ts`, `src/db/rls.test.ts` | create | Schema, roles, audit append only, every row level security class |
| `src/db/mock-data/*.json` | create | The mock's seed data, extracted once |
| `src/db/fixtures.ts`, `src/db/fixtures.test.ts` | create | `seedMockData`, `seedDevDatabase` |
| `scripts/seed-dev.ts` | create | `db:seed` entry |
| `tsconfig.json` | modify | Type-check `scripts/` and root config files |
| `README.md` | modify | Local database commands |

### M0.4 (W0-c)

| File | Action | Responsibility |
|---|---|---|
| `.env.example`, `src/env.example.test.ts` | create | Every variable, and a test that a copy of it boots |
| `src/server/log.ts`, `src/server/log.test.ts` | create | JSON logger with redaction |
| `sentry.server.config.ts`, `sentry.edge.config.ts`, `sentry.client.config.ts`, `src/instrumentation-client.ts` | create | Sentry init, PII redaction on the server |
| `src/server/jobs/lock.ts`, `schedule.ts`, `index.ts` and tests | create | Advisory lock, node-cron scheduler, the job registry |
| `src/server/jobs/{hubspot-outbox,hubspot-poll,reconcile,expiry,expiry-reminders,intake,document-purge,retention}.ts` | create | One stub per job so no track edits the registry |
| `src/server/registrations/announce.ts` | create | Stub of `announceRegistrationChange` and the `RegistrationChange` type, so H4.8 compiles; R fills it in M2.3 (contracts H.17) |
| `src/instrumentation.ts`, `src/instrumentation.test.ts` | create | Sentry registration and the `PORTAL_JOBS_ENABLED` gate |
| `package.json` | modify | `build` sets `SKIP_ENV_VALIDATION=1` |

### M1.2 (W0-d) and M1.2b

| File | Action | Responsibility |
|---|---|---|
| `src/server/errors.ts` and test | create (contracts E) | `PortalError` hierarchy |
| `src/server/rate-limit.ts` and test | create | In-process fixed window limiter |
| `src/server/repo/isolation.registry.ts` | create (contracts F.6) | Registry types and `defineIsolation` |
| `src/db/test-helpers.ts` | modify | Add `seedTwoTenants` |
| `src/server/repo/context.ts` and test | create (contracts F.1) | `withViewer`, `withSystem`, `assertStaff` |
| `src/server/actions/result.ts` and test | create (contracts F.7) | `ActionResult`, `issuesToErrors` |
| `src/server/audit/{events,record}.ts` and test | create (contracts F.4) | Closed audit vocabulary and `recordAudit` |
| `src/server/notify.ts` and test | create (contracts F.5) | In-app notifications and email recipient resolution |
| `src/server/repo/imports.test.ts` | create | Who may import which database handle |
| `src/server/repo/isolation.test.ts` | create (contracts F.6, three edits) | The matrix |
| `src/server/actions/run.ts` and test (M1.2b) | create (contracts F.7) | `runViewerAction`, `runPublicAction` |

---

### Task M0.2: Tag the mock, restructure, install every dependency, set up Vitest (W0-a)

**Files:**
- Tag: `portal-mock-v1` on `58747992`
- Modify: `apps/portal/package.json`, `apps/portal/README.md`, `pnpm-lock.yaml`
- Create: `apps/portal/vitest.config.ts`, `apps/portal/src/structure.test.ts`, `apps/portal/src/server/README.md`, `apps/portal/src/db/README.md`, `apps/portal/scripts/README.md`, `apps/portal/scripts/contract-block.sh`, `docs/partner-portal/HUBSPOT-CAPABILITIES.md`

**Gate A at the end:** all four commands run (`test` passes through `src/structure.test.ts`; the Vitest global setup from M0.3 does not exist yet, so no database is needed).

- [ ] **Step 1: Log the start and tag the mock**

```bash
printf '%s\n' "2026-11-13 00:00 IST | M0.2 | started | W0 | - | - | tag, structure, dependencies, vitest" >> /Users/a12345/Desktop/AI/cleanstart/cleanstart-website/docs/partner-portal/PROGRESS.md
git tag portal-mock-v1 58747992
git rev-parse 'portal-mock-v1^{commit}'
```

Expected: the last command prints `58747992b690f93582a847818625d56565acc3c0`. If the tag already exists, `git tag` prints `fatal: tag 'portal-mock-v1' already exists`; then check that `git rev-parse 'portal-mock-v1^{commit}'` prints the same hash and carry on. Replace the time in the log line with the real time.

- [ ] **Step 2: Install Vitest only, then write the failing structure test**

The test must be able to run before the rest of the dependencies exist, so that its first failure is about the missing packages and not about a missing test runner.

```bash
pnpm --filter @cleanstart/portal add -D vitest@^2.1.9
git diff --stat pnpm-workspace.yaml
```

Expected: `pnpm` finishes, and `git diff --stat pnpm-workspace.yaml` prints nothing. If it prints a change (pnpm 10 may add `minimumReleaseAgeExclude` or `allowBuilds` entries), run `git checkout pnpm-workspace.yaml`: that file is outside the allowed paths.

Create `apps/portal/vitest.config.ts` (the minimal version; M0.3 replaces it with the full one from the contracts):

```ts
import { resolve } from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: { alias: { '@': resolve(__dirname, 'src') } },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts', 'scripts/**/*.test.ts'],
  },
});
```

Create `apps/portal/src/structure.test.ts`:

```ts
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const root = fileURLToPath(new URL('../', import.meta.url));

/** Every package the build plans import. A later task that needs another one is `blocked` (BUILD-HANDOFF, amendment 1). */
const PACKAGES = [
  '@aws-sdk/client-s3',
  '@aws-sdk/s3-request-presigner',
  '@cleanstart/forms',
  '@hubspot/api-client',
  '@playwright/test',
  '@sentry/nextjs',
  '@types/pg',
  'better-auth',
  'drizzle-kit',
  'drizzle-orm',
  'node-cron',
  'pg',
  'tsx',
  'vitest',
  'zod',
] as const;

describe('portal structure', () => {
  it.each(PACKAGES)('has %s installed', (name) => {
    expect(existsSync(join(root, 'node_modules', name, 'package.json')), `${name} is not installed`).toBe(true);
  });

  it.each(['src/server', 'src/db', 'scripts'])('has the %s folder with a README', (folder) => {
    expect(existsSync(join(root, folder, 'README.md')), `${folder}/README.md is missing`).toBe(true);
  });

  it('keeps the package scripts the plans call', () => {
    const scripts = (JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')) as { scripts: Record<string, string> }).scripts;
    for (const name of ['lint', 'typecheck', 'test', 'build', 'db:generate', 'db:migrate', 'db:seed']) {
      expect(scripts[name], `script ${name}`).toBeTypeOf('string');
    }
  });
});
```

- [ ] **Step 3: Run it and confirm it fails**

Run: `pnpm --filter @cleanstart/portal exec vitest run src/structure.test.ts`

Expected: FAIL. Every `has <package> installed` case except `vitest` fails with `<package> is not installed`, the three folder cases fail with `<folder>/README.md is missing`, and `keeps the package scripts the plans call` fails on `script test` (the first script that is missing).

- [ ] **Step 4: Install the full dependency set, once**

The handoff expects these packages (amendment 1); the plans' code imports exactly these, plus the `@cleanstart/forms` workspace package that the P track needs (contracts M.2, item 20). `better-auth` is pinned to `1.7.22`, the version plan 02's code and tests ran against (integration review). pnpm 10 edits `pnpm-workspace.yaml` (it adds `minimumReleaseAgeExclude` entries) for versions published within the last day, and `1.7.22` was released on 12 November; that file is outside the allowed paths, so if the install edits it, revert the file, install `better-auth@1.7.18` instead and say so in the progress log (W0-e Step 1 then checks the installed version).

```bash
pnpm --filter @cleanstart/portal add drizzle-orm@^0.45.4 pg@^8.21.0 zod@^3.25.76 better-auth@1.7.22 @hubspot/api-client@^13.5.0 node-cron@^4.6.0 @sentry/nextjs@^9.47.1 @aws-sdk/client-s3@^3.1042.0 @aws-sdk/s3-request-presigner@^3.1042.0 "@cleanstart/forms@workspace:*"
pnpm --filter @cleanstart/portal add -D drizzle-kit@^0.31.11 tsx@^4.19.2 @types/pg@^8.20.0 @playwright/test@^1.59.1
git diff --stat pnpm-workspace.yaml
```

Expected: both installs succeed (the `@cleanstart/forms@workspace:*` argument is quoted because zsh would otherwise try to expand the `*`) and the last command prints nothing (revert it with `git checkout pnpm-workspace.yaml` if it does). Do not add `@types/node-cron`: `node-cron` 4 ships its own types (`node_modules/node-cron/dist/node-cron.d.ts`). Do not add `pino`: M0.4 writes a small logger. `apps/portal/package.json` now lists all of them; open it and confirm `zod` resolved to `3.25.x` (contracts M.1, item 16). If `better-auth@1.7.22` and `better-auth@1.7.18` are both rejected by pnpm, run `npm view better-auth time --json` and pin the newest 1.7.x version that is more than three days old.

- [ ] **Step 5: Update the scripts and the description in `package.json`**

Open `apps/portal/package.json`. Replace the `description` value and the whole `scripts` object so that they read exactly:

```json
  "description": "CleanStart partner portal. The tag portal-mock-v1 is the clickable mock; this branch builds the real app (docs/partner-portal/BUILD-HANDOFF.md).",
  "scripts": {
    "dev": "next dev --port 3004",
    "build": "next build",
    "start": "next start --port 3004",
    "lint": "biome lint src",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "db:generate": "drizzle-kit generate",
    "db:migrate": "tsx --env-file=.env scripts/migrate.ts",
    "db:seed": "tsx --env-file=.env scripts/seed-dev.ts"
  },
```

Leave `name`, `version`, `private`, `type`, the dependency blocks and everything else as pnpm wrote them. The `db:*` scripts point at files that M0.3 creates; nothing runs them before that.

- [ ] **Step 5b: Replace `next.config.ts` with the standalone-ready version**

The Docker image (plan 06, M0.6) runs the Next standalone server, which needs `output: 'standalone'` and a tracing root at the repository root. Write this here, once, so the A track never edits the file (contracts K.3; M5.1 later adds the security headers in Wave 2). Replace the whole of `apps/portal/next.config.ts` with:

```ts
import path from "node:path";
import type { NextConfig } from "next";

const repoRoot = path.resolve(process.cwd(), "..", "..");

const nextConfig: NextConfig = {
  // lets a production build run beside a live dev server without sharing .next
  distDir: process.env.NEXT_DIST_DIR ?? ".next",
  // The Docker image runs the standalone server (apps/portal/Dockerfile sets NEXT_OUTPUT=standalone).
  ...(process.env.NEXT_OUTPUT === "standalone" ? { output: "standalone" as const } : {}),
  // Standalone tracing must see the pnpm workspace, so the server lands at apps/portal/server.js in the output.
  outputFileTracingRoot: repoRoot,
  turbopack: { root: repoRoot },
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }] }];
  },
};

export default nextConfig;
```

Run `pnpm --filter @cleanstart/portal typecheck` (it must stay green).

- [ ] **Step 6: Create the folders with a README each, and the contract copy helper**

```bash
mkdir -p apps/portal/src/server apps/portal/src/db apps/portal/scripts
printf '%s\n' 'Server only code: auth, repository layer, server actions, HubSpot, email, files, jobs. Nothing here is imported by a client component.' > apps/portal/src/server/README.md
printf '%s\n' 'Database code: Drizzle schema, the two connection pools, row level security SQL, test helpers and the dev seed.' > apps/portal/src/db/README.md
printf '%s\n' 'Command line scripts: roles and database creation, migrations, dev seed, HubSpot provisioning. Run with tsx or bash, never imported by the app.' > apps/portal/scripts/README.md
```

Create `apps/portal/scripts/contract-block.sh`:

```bash
#!/usr/bin/env bash
# Prints one fenced code block of the contracts file, without the fence lines.
# Usage: bash apps/portal/scripts/contract-block.sh "### C.1 " 1 > apps/portal/src/db/schema.ts
#   $1  the start of the section heading, e.g. "### C.1 " or "## E. Errors"
#   $2  which fenced block under that heading, counting from 1
# The copy is mechanical on purpose: the contracts file is the single source for these files.
set -euo pipefail

heading="${1:?heading prefix required, for example '### C.1 '}"
want="${2:?block number required, counting from 1}"
here="$(cd "$(dirname "$0")" && pwd)"
contracts="${PORTAL_CONTRACTS_FILE:-$here/../../../docs/superpowers/plans/2026-11-12-partner-portal-00-contracts.md}"

awk -v heading="$heading" -v want="$want" '
  index($0, heading) == 1 { insec = 1; blocks = 0; infence = 0; next }
  insec && !infence && /^## |^### / { insec = 0 }
  insec && /^```/ {
    if (infence) { infence = 0; if (blocks == want) exit } else { infence = 1; blocks++ }
    next
  }
  insec && infence && blocks == want { print; found = 1 }
  END { if (!found) { print "contract-block: no block " want " under \"" heading "\"" > "/dev/stderr"; exit 1 } }
' "$contracts"
```

```bash
chmod +x apps/portal/scripts/contract-block.sh
bash -n apps/portal/scripts/contract-block.sh
bash apps/portal/scripts/contract-block.sh "### D.5 " 1 | head -3
bash apps/portal/scripts/contract-block.sh "### D.5 " 9; echo "exit $?"
```

Expected: the first command prints nothing, the `head -3` prints `// src/lib/clock.ts`, `export interface Clock {`, `  now(): Date;`, and the last pair prints `contract-block: no block 9 under "### D.5 "` then `exit 1`.

- [ ] **Step 7: Write the M0.1 stub**

The handoff says an unattended run skips the HubSpot capability check and writes this stub (BUILD-HANDOFF, "What an overnight run can and cannot finish"; contracts K.2 assigns the file to W0-a). Create `docs/partner-portal/HUBSPOT-CAPABILITIES.md`:

```markdown
# HubSpot capability check (master plan Task 0.1)

Status: UNVERIFIED. The check needs a HubSpot developer test account and a private app, which an unattended build does not have. A person runs it and replaces each `UNVERIFIED` below with the answer and a screenshot or API response saved next to it. Until then the build uses the fallback named in each row, and every fallback ships working.

| # | Question | Answer | Fallback used until verified |
|---|---|---|---|
| a | Can we create custom association labels (partner and customer on the deal to company link)? | UNVERIFIED | `HUBSPOT_USE_ASSOCIATION_LABELS=false` (the default): the deal uses the default association plus the deal property `partner_company_id` (HubSpot plan, Task 4.1). |
| b | Can a private app subscribe to `deal.propertyChange` webhooks for `dealstage` and `protection_end_date`? | UNVERIFIED | Polling alone every 5 minutes. The webhook receiver (HubSpot plan, Task 4.9) is built and unit tested but stays unsubscribed. |
| c | What is the API rate limit on our production plan? | UNVERIFIED | None needed: drain batches are already capped at 20 operations and the client retries 429 responses three times (HubSpot plan, Task 4.2). |
| d | Are unique-value custom properties allowed? | UNVERIFIED | `portal_registration_id` becomes a plain property. Every create first searches for it, so a retried create still cannot duplicate a deal (HubSpot plan, section 5). |
| e | Does `hs_lastmodifieddate` search work on the partner pipeline? | UNVERIFIED | The HubSpot plan defines no fallback: the inbound poll (Task 4.8) is built on this search, so a negative answer is a decision for a person. |

Decided by these answers: HubSpot plan Tasks 4.1 (schema provisioning) and 4.9 (webhook).
```

- [ ] **Step 8: Update the portal README**

Open `apps/portal/README.md`. Replace the first line `# CleanStart partner portal (clickable mock)` and the paragraph under it with:

````markdown
# CleanStart partner portal

This app started as a clickable mock (tag `portal-mock-v1`, commit `58747992`) and is being converted screen by screen into the real partner portal. Until the mock scaffolding is removed (task M5.4) the walkthrough, the banner and the seeded browser state still work as described below. The build plan is in `docs/partner-portal/BUILD-HANDOFF.md`.

## Tests

```bash
pnpm --filter @cleanstart/portal test        # Vitest; needs the databases from "Local database" below
pnpm --filter @cleanstart/portal typecheck
pnpm --filter @cleanstart/portal lint
```
````

Keep every other section of the README as it is.

- [ ] **Step 9: Run the structure test and see it pass**

Run: `pnpm --filter @cleanstart/portal exec vitest run src/structure.test.ts`

Expected: PASS, `Tests  19 passed (19)` (15 packages, 3 folders, 1 scripts case).

- [ ] **Step 10: Stage, run Gate A, run Gate B**

```bash
git add apps/portal/package.json apps/portal/next.config.ts apps/portal/vitest.config.ts apps/portal/README.md apps/portal/src/structure.test.ts apps/portal/src/server/README.md apps/portal/src/db/README.md apps/portal/scripts/README.md apps/portal/scripts/contract-block.sh docs/partner-portal/HUBSPOT-CAPABILITIES.md pnpm-lock.yaml
```

Then Gate A (the block under "How to work this plan", item 6): lint, typecheck, test and build must all pass. `git diff --name-only origin/development` may list only the paths above plus earlier commits of this branch. Then Gate B.

- [ ] **Step 11: Commit and log**

```bash
git add docs/superpowers/plans/2026-11-12-partner-portal-01-foundations.md
git commit -m "feat(portal): M0.2 tag the mock, add folders, dependencies, vitest and the M0.1 stub"
printf '%s\n' "2026-11-13 00:00 IST | M0.2 | done | W0 | $(git rev-parse --short HEAD) | A ok, B ok | portal-mock-v1 tag, deps, structure test" >> /Users/a12345/Desktop/AI/cleanstart/cleanstart-website/docs/partner-portal/PROGRESS.md
```

(The plan file is staged here after ticking this task's boxes; see "Contract change requests", item 1, about the allowed path list.)

---

### Task M0.3: Database, roles, migrations, row level security, test helpers, dev seed (W0-b)

**Files:**
- Create: `apps/portal/scripts/db-bootstrap.sql`, `scripts/db-create.sh`, `scripts/migrate.ts`, `scripts/seed-dev.ts`, `drizzle.config.ts`, `drizzle/0000_init.sql`, `drizzle/meta/*`, `src/env.ts`, `src/env.test.ts`, `src/lib/{domain,dto,clock,dates,deal-rules}.ts` (+ tests), `src/server/auth/types.ts` (+ test), `src/db/{schema,client,rls.sql,test-env,test-global-setup,test-setup,test-helpers,fixtures}.ts`, `src/db/{schema,rls,fixtures}.test.ts`, `src/db/mock-data/*.json`
- Modify: `apps/portal/vitest.config.ts`, `apps/portal/tsconfig.json`, `apps/portal/README.md`

**Gate A at the end:** all four commands run. `test` needs the two databases of Step 3 and the `.env` of Step 4.

Order inside this task matters: environment first (`client.ts` imports it), then the pure libraries, then the schema and migration, then the database infrastructure and its tests, then the seed.

- [ ] **Step 1: Log the start and check Postgres**

```bash
printf '%s\n' "2026-11-13 00:00 IST | M0.3 | started | W0 | - | - | database, roles, migrations, RLS, helpers, seed" >> /Users/a12345/Desktop/AI/cleanstart/cleanstart-website/docs/partner-portal/PROGRESS.md
psql "postgresql://postgres@localhost:5432/postgres" -Atc "select split_part(version(), ' ', 2)"
psql "postgresql://postgres@localhost:5432/postgres" -Atc "select name from pg_available_extensions where name = 'pg_trgm'"
```

Expected: `16.14` (any `16.x`) and `pg_trgm`. Anything else, or a password prompt you cannot satisfy, is a `blocked` line (note 11 under "How to work this plan" covers the password).

- [ ] **Step 2: Create the role bootstrap and `scripts/db-create.sh`**

The bootstrap SQL is the contracts' C.4 block (roles `portal_owner` and `portal_app`, the database, `REVOKE ALL ... FROM PUBLIC`, `pg_trgm`, default privileges). It is idempotent, which is what handoff amendment 3 asks for.

```bash
bash apps/portal/scripts/contract-block.sh "### C.4 " 1 > apps/portal/scripts/db-bootstrap.sql
head -3 apps/portal/scripts/db-bootstrap.sql
```

Expected: the first line is `-- scripts/db-bootstrap.sql`, the second `\set ON_ERROR_STOP on`.

Create `apps/portal/scripts/db-create.sh`:

```bash
#!/usr/bin/env bash
# Creates, idempotently, the portal roles and one database for local development or tests.
# Usage: PGPASSWORD=<postgres password> scripts/db-create.sh <database-name> [--recreate]
#   --recreate drops the database first (and, for a *_test database, its four per-worker clones). Only ever
#   use it on this worktree's own databases; it deletes their data.
# The development role passwords below exist only on a developer's own Postgres, never on the droplet.
set -euo pipefail

name="${1:-}"
if [[ ! "$name" =~ ^[a-z][a-z0-9_]{0,62}$ ]]; then
  echo "usage: scripts/db-create.sh <database-name> [--recreate]  (lower case letters, digits and underscores)" >&2
  exit 2
fi

admin_url="${PORTAL_PG_ADMIN_URL:-postgresql://postgres@localhost:5432/postgres}"
here="$(cd "$(dirname "$0")" && pwd)"

if [[ "${2:-}" == "--recreate" ]]; then
  targets=("$name")
  if [[ "$name" == *_test ]]; then
    for n in 1 2 3 4; do targets+=("${name}_w${n}"); done
  fi
  for target in "${targets[@]}"; do
    psql "$admin_url" -q -v ON_ERROR_STOP=1 -v dbname="$target" <<'SQL'
SELECT format('DROP DATABASE IF EXISTS %I WITH (FORCE)', :'dbname') \gexec
SQL
  done
fi

psql "$admin_url" -q -v ON_ERROR_STOP=1 \
  -v dbname="$name" \
  -v owner_password=portal_owner_dev \
  -v app_password=portal_app_dev \
  -v conn_limit=-1 \
  -v allow_createdb=on \
  -f "$here/db-bootstrap.sql"

hostport="$(printf '%s' "$admin_url" | sed -E 's#^[a-z]+://([^@/]*@)?([^/]+)/.*$#\2#')"
echo "Database $name is ready. Put these in apps/portal/.env:"
if [[ "$name" == *_test ]]; then
  echo "PORTAL_TEST_DATABASE_URL=postgresql://portal_app:portal_app_dev@$hostport/$name"
  echo "PORTAL_TEST_OWNER_URL=postgresql://portal_owner:portal_owner_dev@$hostport/$name"
else
  echo "DATABASE_URL=postgresql://portal_app:portal_app_dev@$hostport/$name"
  echo "DATABASE_OWNER_URL=postgresql://portal_owner:portal_owner_dev@$hostport/$name"
fi
```

```bash
chmod +x apps/portal/scripts/db-create.sh
bash -n apps/portal/scripts/db-create.sh
apps/portal/scripts/db-create.sh Bad-Name; echo "exit $?"
```

Expected: the usage line `usage: scripts/db-create.sh <database-name> [--recreate]  (lower case letters, digits and underscores)` on stderr, then `exit 2`.

- [ ] **Step 3: Create this worktree's two databases, twice**

The handoff table names them: `cleanstart_portal` and `cleanstart_portal_test` for `portal-build` (other worktrees use their own names).

```bash
apps/portal/scripts/db-create.sh cleanstart_portal
apps/portal/scripts/db-create.sh cleanstart_portal_test
apps/portal/scripts/db-create.sh cleanstart_portal
psql "postgresql://postgres@localhost:5432/postgres" -Atc "select rolname || ' bypassrls=' || rolbypassrls || ' super=' || rolsuper from pg_roles where rolname like 'portal_%' order by 1"
psql "postgresql://postgres@localhost:5432/postgres" -Atc "select datname || ' owner=' || pg_get_userbyid(datdba) from pg_database where datname like 'cleanstart_portal%' order by 1"
```

Expected: each of the first three commands prints `Database <name> is ready. Put these in apps/portal/.env:` followed by two URL lines (the third run proves idempotence: no error; a psql line `NOTICE:  extension "pg_trgm" already exists, skipping` is normal). The role query prints `portal_app bypassrls=false super=false` and `portal_owner bypassrls=false super=false`. The database query prints `cleanstart_portal owner=portal_owner` and `cleanstart_portal_test owner=portal_owner`.

- [ ] **Step 4: Write `apps/portal/.env` (never committed)**

```bash
cat > apps/portal/.env <<ENV_EOF
APP_URL=http://localhost:3204
DATABASE_URL=postgresql://portal_app:portal_app_dev@localhost:5432/cleanstart_portal
DATABASE_OWNER_URL=postgresql://portal_owner:portal_owner_dev@localhost:5432/cleanstart_portal
PORTAL_TEST_DATABASE_URL=postgresql://portal_app:portal_app_dev@localhost:5432/cleanstart_portal_test
PORTAL_TEST_OWNER_URL=postgresql://portal_owner:portal_owner_dev@localhost:5432/cleanstart_portal_test
AUTH_SECRET=$(openssl rand -base64 32)
ENV_EOF
git check-ignore -v apps/portal/.env
```

Expected: `.gitignore:31:.env	apps/portal/.env`. The `.env` is ignored; never stage it.

- [ ] **Step 5: Write the failing environment test**

The environment module comes first because `src/db/client.ts` imports it. Create `apps/portal/src/env.test.ts`:

```ts
import { describe, expect, it, vi } from 'vitest';
import { loadEnv } from './env';

// Importing ./env parses process.env once at load. These tests call loadEnv with their own objects, so skip that parse.
vi.hoisted(() => {
  process.env.SKIP_ENV_VALIDATION = '1';
});

const base = {
  DATABASE_URL: 'postgresql://portal_app:pw@localhost:5432/cleanstart_portal',
  AUTH_SECRET: 'a'.repeat(32),
};

const production = {
  ...base,
  NODE_ENV: 'production',
  DATABASE_OWNER_URL: 'postgresql://portal_owner:pw@localhost:5432/cleanstart_portal',
  BREVO_API_KEY: 'k',
  BREVO_SENDER_EMAIL: 'partners@cleanstart.com',
  R2_ENDPOINT: 'https://r2.example.com',
  R2_BUCKET: 'b',
  R2_ACCESS_KEY_ID: 'id',
  R2_SECRET_ACCESS_KEY: 'secret',
  HUBSPOT_PORTAL_TOKEN: 't',
  HUBSPOT_PARTNER_PIPELINE_ID: 'p',
  HUBSPOT_WEBHOOK_SECRET: 'w',
  TURNSTILE_SECRET_KEY: 's',
  NEXT_PUBLIC_TURNSTILE_SITE_KEY: 'k',
  SENTRY_DSN: 'https://abc@sentry.example.com/1',
};

describe('loadEnv', () => {
  it('throws naming DATABASE_URL when it is missing', () => {
    expect(() => loadEnv({ AUTH_SECRET: base.AUTH_SECRET })).toThrow(/DATABASE_URL/);
  });

  it('throws when AUTH_SECRET is shorter than 32 characters', () => {
    expect(() => loadEnv({ ...base, AUTH_SECRET: 'short' })).toThrow(/AUTH_SECRET/);
  });

  it('lists every missing variable in one message', () => {
    expect(() => loadEnv({})).toThrow(/DATABASE_URL[\s\S]*AUTH_SECRET/);
  });

  it('applies the defaults', () => {
    const env = loadEnv(base);
    expect(env.APP_URL).toBe('http://localhost:3004');
    expect(env.LOG_LEVEL).toBe('info');
    expect(env.HUBSPOT_USE_ASSOCIATION_LABELS).toBe(false);
    expect(env.PORTAL_JOBS_ENABLED).toBe(false);
    expect(env.PARTNER_AGREEMENT_VERSION).toBe('draft-0');
    expect(env.CMS_API_URL).toBe('http://cms:3000');
  });

  it('parses boolean switches', () => {
    expect(loadEnv({ ...base, PORTAL_JOBS_ENABLED: 'true' }).PORTAL_JOBS_ENABLED).toBe(true);
    expect(loadEnv({ ...base, HUBSPOT_USE_ASSOCIATION_LABELS: '1' }).HUBSPOT_USE_ASSOCIATION_LABELS).toBe(true);
  });

  it('uses the Turnstile test keys outside production only', () => {
    expect(loadEnv(base).NEXT_PUBLIC_TURNSTILE_SITE_KEY).toBe('1x00000000000000000000AA');
    expect(loadEnv(base).TURNSTILE_SECRET_KEY).toBe('1x0000000000000000000000000000000AA');
    expect(loadEnv(production).TURNSTILE_SECRET_KEY).toBe('s');
  });

  it('accepts a complete production environment', () => {
    expect(loadEnv(production).NODE_ENV).toBe('production');
  });

  it('names the missing production variable', () => {
    const { HUBSPOT_PORTAL_TOKEN: _omitted, ...rest } = production;
    expect(() => loadEnv(rest)).toThrow(/HUBSPOT_PORTAL_TOKEN is required in production/);
  });
});
```

- [ ] **Step 6: Run it and confirm it fails**

Run: `pnpm --filter @cleanstart/portal exec vitest run src/env.test.ts`

Expected: FAIL, `Failed to load url ./env` (the module does not exist).

- [ ] **Step 7: Create `src/env.ts` from the contracts and see the test pass**

```bash
bash apps/portal/scripts/contract-block.sh "## I. Environment" 1 > apps/portal/src/env.ts
pnpm --filter @cleanstart/portal exec vitest run src/env.test.ts
```

Expected: PASS, `Tests  8 passed (8)`. (The contracts' "Environment" section lists `env.ts` under W0-c; it is created here because M0.3's `client.ts` imports it. M0.4 adds `.env.example` and the rest of the environment work.)

- [ ] **Step 8: Write the failing tests for the pure libraries and the auth types**

Create these five files.

`apps/portal/src/lib/dates.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { addDays, businessDaysBetween, daysBetween, daysLeft, fmtLong, fmtShort, fmtTimestamp, plural } from './dates';

describe('dates', () => {
  it('counts and adds calendar days across a month and a year end', () => {
    expect(daysBetween('2026-11-06', '2026-12-06')).toBe(30);
    expect(addDays('2026-12-30', 3)).toBe('2027-01-02');
    expect(addDays('2026-11-05', 89)).toBe('2027-02-02');
  });

  it('formats short and long dates and plurals', () => {
    expect(fmtShort('2026-11-04')).toBe('4 Nov');
    expect(fmtLong('2026-11-04')).toBe('4 Nov 2026');
    expect(plural(1, 'day')).toBe('1 day');
    expect(plural(3, 'day')).toBe('3 days');
  });

  it('gives days left, negative once the date has passed', () => {
    expect(daysLeft('2026-11-15', '2026-11-06')).toBe(9);
    expect(daysLeft('2026-11-01', '2026-11-06')).toBe(-5);
  });

  it('counts weekdays in the half open range (from, to]', () => {
    expect(businessDaysBetween('2026-11-06', '2026-11-06')).toBe(0);
    expect(businessDaysBetween('2026-11-06', '2026-11-09')).toBe(1);
    expect(businessDaysBetween('2026-11-04', '2026-11-10')).toBe(4);
  });

  it('labels timestamps against the given today', () => {
    expect(fmtTimestamp('2026-11-06T14:02:00.000Z', '2026-11-06')).toBe('Today, 14:02');
    expect(fmtTimestamp('2026-11-05T16:40:00.000Z', '2026-11-06')).toBe('Yesterday, 16:40');
    expect(fmtTimestamp('2026-10-29T10:12:00.000Z', '2026-11-06')).toBe('29 Oct, 10:12');
  });
});
```

`apps/portal/src/lib/clock.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { fixedClock, systemClock } from './clock';

describe('clocks', () => {
  it('fixedClock returns the same instant and its UTC date every time', () => {
    const clock = fixedClock('2026-11-06T23:59:00Z');
    expect(clock.now().toISOString()).toBe('2026-11-06T23:59:00.000Z');
    expect(clock.today()).toBe('2026-11-06');
    clock.now().setUTCFullYear(2000);
    expect(clock.now().getUTCFullYear()).toBe(2026);
  });

  it('systemClock today is the UTC date of now', () => {
    expect(systemClock.today()).toBe(systemClock.now().toISOString().slice(0, 10));
  });
});
```

`apps/portal/src/lib/deal-rules.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import {
  acceptedOnFor, EXPIRY_REMINDER_DAYS, extendedEnd, isOverSla, PROTECTION_DAYS, protectionEndFor, waitingBusinessDays,
} from './deal-rules';

describe('deal rules', () => {
  it('protects for 90 days counting the acceptance day', () => {
    expect(PROTECTION_DAYS).toBe(90);
    expect(protectionEndFor('2026-11-05')).toBe('2027-02-02');
    expect(acceptedOnFor('2027-02-02')).toBe('2026-11-05');
  });

  it('extends by 30 days', () => {
    expect(extendedEnd('2027-02-02')).toBe('2027-03-04');
  });

  it('flags a registration as over the review target after 2 business days', () => {
    expect(waitingBusinessDays('2026-11-04', '2026-11-06')).toBe(2);
    expect(isOverSla('2026-11-04', '2026-11-06')).toBe(false);
    expect(isOverSla('2026-11-03', '2026-11-06')).toBe(true);
  });

  it('sends reminders 14 and 3 days before the end', () => {
    expect([...EXPIRY_REMINDER_DAYS]).toEqual([14, 3]);
  });
});
```

`apps/portal/src/lib/domain.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import {
  DOC_PRODUCT_LABEL, DOC_PRODUCTS, DOCUMENT_TYPE_LABEL, DOCUMENT_TYPES, isOneOf, NOTIFICATION_CATEGORIES, NOTIFICATION_CATEGORY_OF,
  NOTIFICATION_KINDS, PARTNER_CATEGORIES, PARTNER_CATEGORY_LABEL, PARTNER_STATUSES, PARTNER_STATUS_LABEL, REGISTRATION_STATUS_LABEL,
  REGISTRATION_STATUSES,
} from './domain';

describe('domain enums', () => {
  it('has a display label for every enum value', () => {
    expect(Object.keys(PARTNER_CATEGORY_LABEL).sort()).toEqual([...PARTNER_CATEGORIES].sort());
    expect(Object.keys(PARTNER_STATUS_LABEL).sort()).toEqual([...PARTNER_STATUSES].sort());
    expect(Object.keys(REGISTRATION_STATUS_LABEL).sort()).toEqual([...REGISTRATION_STATUSES].sort());
    expect(Object.keys(DOCUMENT_TYPE_LABEL).sort()).toEqual([...DOCUMENT_TYPES].sort());
    expect(Object.keys(DOC_PRODUCT_LABEL).sort()).toEqual([...DOC_PRODUCTS].sort());
  });

  it('maps every notification kind to a known switch or to staff-always', () => {
    expect(Object.keys(NOTIFICATION_CATEGORY_OF).sort()).toEqual([...NOTIFICATION_KINDS].sort());
    for (const category of Object.values(NOTIFICATION_CATEGORY_OF)) {
      expect(category === null || NOTIFICATION_CATEGORIES.includes(category)).toBe(true);
    }
  });

  it('narrows with isOneOf', () => {
    expect(isOneOf(PARTNER_CATEGORIES, 'channel')).toBe(true);
    expect(isOneOf(PARTNER_CATEGORIES, 'Channel partner')).toBe(false);
    expect(isOneOf(PARTNER_CATEGORIES, 42)).toBe(false);
  });
});
```

`apps/portal/src/server/auth/types.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { publicActor, roleKey, SYSTEM_ACTORS, type Viewer } from './types';

const partner: Viewer = { id: 'u1', kind: 'partner', role: 'sales', partnerId: 'p1', partnerName: 'Kestrel Systems', email: 'a@b.co', name: 'A' };
const staff: Viewer = { id: 'u2', kind: 'staff', role: 'partner_manager', partnerId: null, partnerName: null, region: 'all', email: 'c@d.co', name: 'C' };

describe('auth types', () => {
  it('builds the role key from kind and role', () => {
    expect(roleKey(partner)).toBe('partner.sales');
    expect(roleKey(staff)).toBe('staff.partner_manager');
  });

  it('describes the system actors for the audit log', () => {
    expect(SYSTEM_ACTORS.hubspot).toEqual({ kind: 'system', label: 'HubSpot sync', who: 'sync', roleLabel: 'Automatic sync' });
    expect(publicActor('Neha Joshi')).toEqual({ kind: 'system', label: 'Neha Joshi', who: 'partner', roleLabel: 'Applicant' });
  });
});
```

- [ ] **Step 9: Run them and confirm they fail**

Run: `pnpm --filter @cleanstart/portal exec vitest run src/lib src/server/auth`

Expected: FAIL, five suites each with `Failed to load url ./dates` (and the same for `./clock`, `./deal-rules`, `./domain`, `./types`).

- [ ] **Step 10: Create the libraries, the DTO file and the auth types from the contracts**

```bash
mkdir -p apps/portal/src/lib apps/portal/src/server/auth
bash apps/portal/scripts/contract-block.sh "### C.0 " 1 > apps/portal/src/lib/domain.ts
bash apps/portal/scripts/contract-block.sh "### D.5 " 1 > apps/portal/src/lib/clock.ts
bash apps/portal/scripts/contract-block.sh "### D.5 " 2 > apps/portal/src/lib/dates.ts
bash apps/portal/scripts/contract-block.sh "### H.0 " 1 > apps/portal/src/lib/dto.ts
bash apps/portal/scripts/contract-block.sh "### D.1 " 1 > apps/portal/src/server/auth/types.ts
bash apps/portal/scripts/contract-block.sh "### H.19 " 1 > apps/portal/src/lib/deal-rules.ts
tail -2 apps/portal/src/lib/deal-rules.ts
```

Expected for the last command: the line `export const isOverSla = ...` and the line `export const daysUntil = (endIso: string, today: string): number => daysBetween(today, endIso);`. The contracts' H.19 block no longer re-exports the HubSpot stage names (they live in `@/server/hubspot/types` and `mappers`, created by H4.2 and H4.3), so the file compiles in Wave 0 and nothing is cut.

Run: `pnpm --filter @cleanstart/portal exec vitest run src/lib src/server/auth`

Expected: PASS, `Test Files  5 passed (5)`, `Tests  16 passed (16)`. `dto.ts` is types only and has no test; the typecheck in Gate A covers it.

- [ ] **Step 11: Create the schema and the drizzle config**

```bash
bash apps/portal/scripts/contract-block.sh "### C.1 " 1 > apps/portal/src/db/schema.ts
wc -l apps/portal/src/db/schema.ts
```

Expected: about 630 lines. The file defines 25 tables, the sequence `application_reference_seq`, and the inferred row types.

Create `apps/portal/drizzle.config.ts`:

```ts
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/db/schema.ts',
  out: './drizzle',
  dbCredentials: { url: process.env.DATABASE_OWNER_URL ?? '' },
  strict: true,
  verbose: true,
});
```

- [ ] **Step 12: Generate the first migration and review it by hand**

(Contracts M.1, item 11: drizzle-kit must accept every feature C.1 uses.)

```bash
pnpm --filter @cleanstart/portal exec drizzle-kit generate --name init
ls apps/portal/drizzle apps/portal/drizzle/meta
```

Expected: `25 tables` among the output lines, then `[✓] Your SQL migration file ➜ drizzle/0000_init.sql`; `ls` shows `0000_init.sql` and `meta` containing `0000_snapshot.json` and `_journal.json`. If drizzle-kit rejects the schema (for example a `text(..., { enum })` typing error about a readonly tuple, or an unknown option on `index().using`), use the fallbacks in contracts M.1 item 11 and note it in the progress log; the migration test in Step 16 is the final judge.

Now prepend the extension line (it is a no-op where the bootstrap already created the extension, and it makes the migration self-describing). Open `apps/portal/drizzle/0000_init.sql` and add as the very first line:

```sql
CREATE EXTENSION IF NOT EXISTS pg_trgm;--> statement-breakpoint
```

Review the file against this checklist:

```bash
cd apps/portal
head -2 drizzle/0000_init.sql
grep -c 'CREATE TABLE' drizzle/0000_init.sql
grep -c 'CREATE SEQUENCE' drizzle/0000_init.sql
grep -c 'USING gin' drizzle/0000_init.sql
grep -cE '"verified"|"failed_verification_count"|"locked_until"' drizzle/0000_init.sql
grep -E 'registrations_open_unique|applications_open_portal_email_key|access_requests_open_key|registrations_hubspot_deal_key' drizzle/0000_init.sql | cut -c1-150
grep -c 'ROW LEVEL SECURITY' drizzle/0000_init.sql || true
grep -cE 'portal_app|^GRANT |CREATE POLICY' drizzle/0000_init.sql || true
cd ../..
```

Expected: the first two lines are the extension line and `CREATE SEQUENCE "public"."application_reference_seq" ...`; `25` tables; `1` sequence; `3` for the three `auth_two_factor` columns that Better Auth 1.7 requires (`verified`, `failed_verification_count`, `locked_until`; they are in `0000_init`, there is no separate auth migration); `5` GIN trigram indexes (`partners_name_trgm`, `users_name_trgm`, `users_email_trgm`, `registrations_customer_trgm`, `documents_title_trgm`); four partial unique index lines that each end in a `WHERE` clause (`status in ('pending', 'accepted')` for the registrations one, `status = 'new' and source = 'portal'` for the applications one, `status = 'open'` and `hubspot_deal_id is not null` for the other two); `0` and `0` for the last two counts: row level security, grants and policies belong to `rls.sql`, not to the migration (column names such as `extension_granted_at` are why the grant check anchors on `^GRANT `).

- [ ] **Step 13: Write the failing database tests**

Create `apps/portal/src/db/schema.test.ts`:

```ts
import { Client } from 'pg';
import { describe, expect, it } from 'vitest';
import { resetDb, testDb } from '@/db/test-helpers';
import { sql } from 'drizzle-orm';

const ownerClient = async (): Promise<Client> => {
  const client = new Client({ connectionString: process.env.PORTAL_TEST_OWNER_URL });
  await client.connect();
  return client;
};

/** Drizzle wraps the driver error in "Failed query"; the Postgres message is on `cause`. */
const expectDatabaseError = async (promise: Promise<unknown>, pattern: RegExp): Promise<void> => {
  const error = await promise.then(() => null, (thrown: unknown) => thrown);
  expect(error).not.toBeNull();
  const cause = (error as { cause?: { message?: string } }).cause;
  expect(cause?.message ?? (error as Error).message).toMatch(pattern);
};

const EXPECTED_TABLES = [
  'access_requests', 'applications', 'audit_log', 'auth_account', 'auth_session', 'auth_two_factor',
  'auth_verification', 'document_audience', 'document_opens', 'document_versions', 'documents', 'hubspot_outbox',
  'hubspot_sync_state', 'invites', 'notification_prefs', 'notifications', 'partner_checklist', 'partners',
  'registration_contacts', 'registration_events', 'registration_messages', 'registration_reminders', 'registrations',
  'staff_scopes', 'users',
];

describe('schema', () => {
  it('has every table', async () => {
    const owner = await ownerClient();
    try {
      const { rows } = await owner.query<{ tablename: string }>("select tablename from pg_tables where schemaname = 'public' order by 1");
      expect(rows.map((r) => r.tablename)).toEqual(EXPECTED_TABLES);
    } finally {
      await owner.end();
    }
  });

  it('has the open registration unique index and the trigram indexes', async () => {
    const owner = await ownerClient();
    try {
      const { rows } = await owner.query<{ indexname: string }>("select indexname from pg_indexes where schemaname = 'public'");
      const names = rows.map((r) => r.indexname);
      expect(names).toEqual(expect.arrayContaining([
        'registrations_open_unique', 'registrations_customer_trgm', 'partners_name_trgm', 'documents_title_trgm',
        'users_name_trgm', 'users_email_trgm', 'applications_open_portal_email_key',
      ]));
    } finally {
      await owner.end();
    }
  });

  it('keeps the runtime role from owning tables or bypassing row level security', async () => {
    const owner = await ownerClient();
    try {
      const role = await owner.query<{ rolbypassrls: boolean; rolsuper: boolean }>("select rolbypassrls, rolsuper from pg_roles where rolname = 'portal_app'");
      expect(role.rows[0]).toEqual({ rolbypassrls: false, rolsuper: false });
      const owned = await owner.query("select 1 from pg_tables where schemaname = 'public' and tableowner = 'portal_app'");
      expect(owned.rowCount).toBe(0);
      const forced = await owner.query<{ relname: string }>("select relname from pg_class c join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'public' and c.relkind = 'r' and not (c.relrowsecurity and c.relforcerowsecurity)");
      expect(forced.rows).toEqual([]);
    } finally {
      await owner.end();
    }
  });

  it('rejects UPDATE and DELETE on audit_log for the app role', async () => {
    await resetDb();
    const db = testDb();
    await db.execute(sql`insert into audit_log (actor_label, who, kind, event, text) values ('t', 'staff', 'partners', 'partner.created', 't')`);
    await expectDatabaseError(db.execute(sql`update audit_log set text = 'changed'`), /permission denied/);
    await expectDatabaseError(db.execute(sql`delete from audit_log`), /permission denied/);
  });

  it('changes no audit_log row even for the owner (forced row level security, no UPDATE or DELETE policy)', async () => {
    const owner = await ownerClient();
    try {
      expect((await owner.query("update audit_log set text = 'changed'")).rowCount).toBe(0);
      expect((await owner.query('delete from audit_log')).rowCount).toBe(0);
    } finally {
      await owner.end();
    }
    expect((await testDb().execute(sql`select text from audit_log`)).rows).toEqual([{ text: 't' }]);
  });
});
```

Create `apps/portal/src/db/rls.test.ts`:

```ts
import { Client } from 'pg';
import { beforeAll, describe, expect, it } from 'vitest';
import {
  makeDocument,
  makePartner,
  makeRegistration,
  makeUser,
  resetDb,
  testDb,
  testPool,
} from '@/db/test-helpers';

interface Identity {
  kind: 'partner' | 'staff' | 'system';
  partnerId?: string;
  userId?: string;
}

/** Runs `fn` in a transaction on the system pool with the identity set exactly as withViewer will (set_config, transaction local). */
const as = async <T>(identity: Identity, fn: (q: (sql: string, params?: unknown[]) => Promise<Record<string, unknown>[]>) => Promise<T>): Promise<T> => {
  const client = await testPool().connect();
  try {
    await client.query('begin');
    await client.query("select set_config('app.kind', $1, true), set_config('app.partner_id', $2, true), set_config('app.user_id', $3, true)", [
      identity.kind,
      identity.partnerId ?? '',
      identity.userId ?? '',
    ]);
    const result = await fn(async (text, params) => (await client.query(text, params)).rows);
    await client.query('rollback');
    return result;
  } catch (error) {
    await client.query('rollback');
    throw error;
  } finally {
    client.release();
  }
};

describe('row level security', () => {
  let a = { partnerId: '', registrationId: '', userId: '' };
  let b = { partnerId: '', registrationId: '', userId: '' };
  let staffId = '';
  let docForB = '';

  beforeAll(async () => {
    await resetDb();
    const db = testDb();
    const [pa, pb] = [await makePartner(db, { name: 'Alpha' }), await makePartner(db, { name: 'Beta' })];
    const [ua, ub] = [await makeUser(db, { partnerId: pa.id }), await makeUser(db, { partnerId: pb.id })];
    const [ra, rb] = [await makeRegistration(db, { partnerId: pa.id }), await makeRegistration(db, { partnerId: pb.id })];
    staffId = (await makeUser(db, { kind: 'staff', role: 'partner_manager' })).id;
    docForB = (await makeDocument(db, { partnerIds: [pb.id] })).id;
    await makeDocument(db, { title: 'For everyone' });
    a = { partnerId: pa.id, registrationId: ra.id, userId: ua.id };
    b = { partnerId: pb.id, registrationId: rb.id, userId: ub.id };
  });

  it('shows a partner only its own registrations and company', async () => {
    const rows = await as({ kind: 'partner', partnerId: a.partnerId, userId: a.userId }, (q) => q('select id from registrations'));
    expect(rows.map((r) => r.id)).toEqual([a.registrationId]);
    const companies = await as({ kind: 'partner', partnerId: a.partnerId, userId: a.userId }, (q) => q('select id from partners'));
    expect(companies.map((r) => r.id)).toEqual([a.partnerId]);
  });

  it('shows a partner its colleagues and the active partner managers, not other companies', async () => {
    const rows = await as({ kind: 'partner', partnerId: a.partnerId, userId: a.userId }, (q) => q('select id from users'));
    const ids = rows.map((r) => r.id);
    expect(ids).toContain(a.userId);
    expect(ids).toContain(staffId);
    expect(ids).not.toContain(b.userId);
  });

  it('shows staff and system every registration', async () => {
    for (const kind of ['staff', 'system'] as const) {
      const rows = await as({ kind, userId: staffId }, (q) => q('select id from registrations'));
      expect(rows).toHaveLength(2);
    }
  });

  it('shows a connection with no identity nothing', async () => {
    const client = new Client({ connectionString: process.env.DATABASE_URL });
    await client.connect();
    try {
      expect((await client.query('select id from registrations')).rowCount).toBe(0);
      expect((await client.query('select id from partners')).rowCount).toBe(0);
    } finally {
      await client.end();
    }
  });

  it('applies the audience rule to documents and hides deleted ones', async () => {
    const titles = await as({ kind: 'partner', partnerId: a.partnerId, userId: a.userId }, (q) => q('select title, id from documents'));
    expect(titles.map((r) => r.title)).toEqual(['For everyone']);
    expect(titles.map((r) => r.id)).not.toContain(docForB);
  });

  it('copies partner_id onto child rows from the parent registration and rejects another company', async () => {
    const own = await as({ kind: 'partner', partnerId: a.partnerId, userId: a.userId }, async (q) => {
      await q("insert into registration_events (registration_id, text, by_label, source) values ($1, 'x', 'y', 'portal')", [a.registrationId]);
      return q('select partner_id from registration_events');
    });
    expect(own).toEqual([{ partner_id: a.partnerId }]);
    await expect(
      as({ kind: 'partner', partnerId: a.partnerId, userId: a.userId }, (q) =>
        q("insert into registration_events (registration_id, text, by_label, source) values ($1, 'x', 'y', 'portal')", [b.registrationId]),
      ),
    ).rejects.toThrow(/not found or not visible/);
  });

  it('lets staff lock a registration for update', async () => {
    const rows = await as({ kind: 'staff', userId: staffId }, (q) => q('select id from registrations where id = $1 for update', [b.registrationId]));
    expect(rows).toHaveLength(1);
  });

  it('keeps notifications private to the user, but lets anyone insert one for someone else', async () => {
    await as({ kind: 'partner', partnerId: a.partnerId, userId: a.userId }, async (q) => {
      await q("insert into notifications (user_id, kind, title) values ($1, 'team_joined', 'hi')", [staffId]);
      expect(await q('select id from notifications')).toHaveLength(0);
    });
    await expect(
      as({ kind: 'partner', partnerId: a.partnerId, userId: a.userId }, (q) =>
        q("insert into notifications (user_id, kind, title) values ($1, 'team_joined', 'hi') returning id", [staffId]),
      ),
    ).rejects.toThrow(/row-level security/);
  });

  it('hides the Better Auth tables from every identity except system', async () => {
    for (const kind of ['partner', 'staff'] as const) {
      await expect(
        as({ kind, partnerId: kind === 'partner' ? a.partnerId : '', userId: a.userId }, (q) =>
          q("insert into auth_verification (identifier, value, expires_at) values ('x', 'y', now())"),
        ),
      ).rejects.toThrow(/row-level security/);
    }
  });
});
```

- [ ] **Step 14: Run them and confirm they fail**

Run: `pnpm --filter @cleanstart/portal exec vitest run src/db/schema.test.ts src/db/rls.test.ts`

Expected: FAIL, `Cannot find module '@/db/test-helpers'` for both files.

- [ ] **Step 15: Create the database infrastructure**

`src/db/rls.sql` and the Vitest files that come from the contracts:

```bash
bash apps/portal/scripts/contract-block.sh "### C.3 " 1 > apps/portal/src/db/rls.sql
bash apps/portal/scripts/contract-block.sh "### C.2 " 1 > apps/portal/src/db/client.ts
bash apps/portal/scripts/contract-block.sh "### J.2 " 1 > apps/portal/vitest.config.ts
bash apps/portal/scripts/contract-block.sh "### J.2 " 2 > apps/portal/src/db/test-global-setup.ts
bash apps/portal/scripts/contract-block.sh "### J.2 " 3 > apps/portal/src/db/test-setup.ts
```

The copies are used as they are: the contracts already carry the lint fix in `client.ts` (no assignment inside an expression, which Biome's `noAssignInExpressions` rejects), the pool sizes (request 6, system 8, a 30 second connection timeout) and a `test-setup.ts` that does not assign `NODE_ENV` (Next's types declare it read-only; Vitest already sets it to `test`).

Create `apps/portal/scripts/migrate.ts`:

```ts
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { Pool } from 'pg';

export interface MigrateInput {
  /** Connection string of the owner role (portal_owner), never the runtime role. */
  url: string;
  migrationsFolder: string;
  /** The contents of src/db/rls.sql. Re-applied on every run, so it must stay idempotent. */
  rlsSql: string;
}

/** Drizzle migrations, then rls.sql in one transaction. Safe to run any number of times. */
export async function migrateDatabase(input: MigrateInput): Promise<void> {
  const pool = new Pool({ connectionString: input.url, max: 1 });
  try {
    await migrate(drizzle(pool), { migrationsFolder: input.migrationsFolder });
    const client = await pool.connect();
    try {
      await client.query('begin');
      await client.query(input.rlsSql);
      await client.query('commit');
    } catch (error) {
      await client.query('rollback');
      throw error;
    } finally {
      client.release();
    }
  } finally {
    await pool.end();
  }
}

const isMain = process.argv[1] !== undefined && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isMain) {
  const url = process.env.DATABASE_OWNER_URL;
  if (!url) {
    console.error('DATABASE_OWNER_URL is not set. Run with: tsx --env-file=.env scripts/migrate.ts');
    process.exit(1);
  }
  migrateDatabase({
    url,
    migrationsFolder: join(process.cwd(), 'drizzle'),
    rlsSql: readFileSync(join(process.cwd(), 'src/db/rls.sql'), 'utf8'),
  })
    .then(() => console.info('migrations and row level security applied'))
    .catch((error: unknown) => {
      console.error(error);
      process.exit(1);
    });
}
```

Create `apps/portal/src/db/test-env.ts`:

```ts
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseEnv } from 'node:util';

/** apps/portal/.env merged under process.env, so CI can inject variables and a local .env fills the rest. */
export const loadDotEnv = (): Record<string, string | undefined> => {
  const file = join(process.cwd(), '.env');
  const fromFile = existsSync(file) ? parseEnv(readFileSync(file, 'utf8')) : {};
  return { ...fromFile, ...process.env };
};
```

The next file has everything the contracts' J.3 lists except `seedTwoTenants`, which M1.2 appends once the isolation registry exists, and the `password` option of `makeUser` (and `passwordHash` of `seedMockData`), which task M0.7 (W0-e, plan 02 Step 6b) adds when `hashPassword` exists (see "Contract change requests", items 6 and 7). Create `apps/portal/src/db/test-helpers.ts`:

```ts
import { createHash, randomBytes } from 'node:crypto';
import { eq } from 'drizzle-orm';
import { Client, type Pool } from 'pg';
import { db, type Db, pool } from '@/db/client';
import {
  accessRequests,
  applications,
  documentAudience,
  documents,
  invites,
  partners,
  registrationContacts,
  registrations,
  staffScopes,
  users,
} from '@/db/schema';
import type {
  DealRegion,
  PartnerCategory,
  PartnerRegion,
  PartnerRole,
  Product,
  RegistrationStatus,
  StaffRegion,
  StaffRole,
} from '@/lib/domain';
import type { PartnerViewer, StaffViewer, Viewer } from '@/server/auth/types';

/** System scope db for the worker's database (portal_app, app.kind = 'system'). Same object every call. */
export const testDb = (): Db => db;

/** The pool behind testDb(), for advisory lock tests (runLocked). */
export const testPool = (): Pool => pool;

/**
 * TRUNCATE every table in public except the drizzle migration table, RESTART IDENTITY CASCADE, then restarts
 * application_reference_seq. Runs as portal_owner on its own connection (the app role has no TRUNCATE).
 * The argument is accepted and ignored so the HubSpot plan's `resetDb(db)` call sites work unchanged.
 */
export async function resetDb(_db?: Db): Promise<void> {
  const url = process.env.PORTAL_TEST_OWNER_URL;
  if (!url) throw new Error('PORTAL_TEST_OWNER_URL is not set. The Vitest setup file sets it from apps/portal/.env.');
  const client = new Client({ connectionString: url });
  await client.connect();
  try {
    const { rows } = await client.query<{ tablename: string }>(
      "select tablename from pg_tables where schemaname = 'public' and tablename <> '__drizzle_migrations'",
    );
    const names = rows.map((row) => `"${row.tablename}"`).join(', ');
    await client.query(`truncate ${names} restart identity cascade`);
    await client.query('alter sequence application_reference_seq restart with 1');
  } finally {
    await client.end();
  }
}

let counter = 0;
const next = (): number => {
  counter += 1;
  return counter;
};

const sha256Hex = (value: string): string => createHash('sha256').update(value).digest('hex');

const PRODUCT_BY_LABEL: Record<string, Product> = {
  'CleanStart Images': 'images',
  'Clean Libraries': 'libraries',
  CleanSight: 'cleansight',
};
const REGION_BY_LABEL: Record<string, DealRegion> = { India: 'india', 'Middle East': 'middle_east' };
const STAFF_ONLY_ROLES: ReadonlySet<string> = new Set(['partner_manager', 'marketing']);

type PartnerRow = typeof partners.$inferSelect;
type UserRow = typeof users.$inferSelect;
type RegistrationRow = typeof registrations.$inferSelect;
type ApplicationRow = typeof applications.$inferSelect;
type InviteRow = typeof invites.$inferSelect;
type AccessRequestRow = typeof accessRequests.$inferSelect;
type DocumentRow = typeof documents.$inferSelect;

const first = <T>(rows: T[], what: string): T => {
  const row = rows[0];
  if (!row) throw new Error(`test helper: insert of ${what} returned no row`);
  return row;
};

export interface MakePartnerInput {
  name?: string;
  domain?: string;
  category?: PartnerCategory;
  region?: PartnerRegion;
  status?: PartnerRow['status'];
  managerId?: string | null;
  hubspotCompanyId?: string | null;
}

/** Defaults: unique "Partner N", "partner-n.example.com", category 'channel', region 'india', status 'active'. */
export async function makePartner(database: Db, input: MakePartnerInput): Promise<PartnerRow> {
  const n = next();
  const rows = await database
    .insert(partners)
    .values({
      name: input.name ?? `Partner ${n}`,
      domain: (input.domain ?? `partner-${n}.example.com`).toLowerCase(),
      category: input.category ?? 'channel',
      region: input.region ?? 'india',
      status: input.status ?? 'active',
      managerId: input.managerId ?? null,
      hubspotCompanyId: input.hubspotCompanyId ?? null,
    })
    .returning();
  return first(rows, 'partner');
}

export interface MakeUserInput {
  partnerId?: string | null;
  kind?: 'partner' | 'staff';
  role?: string;
  email?: string;
  name?: string;
  status?: 'invited' | 'active' | 'disabled';
  region?: StaffRegion;
  hubspotContactId?: string | null;
}

/**
 * Defaults to a partner user, role 'partner_admin', status 'active', unique email. A partner user with no partnerId
 * gets a fresh partner. kind 'staff' (or a staff only role such as 'partner_manager' or 'marketing') makes a staff
 * user, default role 'partner_manager', with a staff_scopes row for `region` (default 'all').
 */
export async function makeUser(database: Db, input: MakeUserInput): Promise<UserRow> {
  const n = next();
  const kind = input.kind ?? (input.role !== undefined && STAFF_ONLY_ROLES.has(input.role) ? 'staff' : 'partner');
  const partnerId = kind === 'staff' ? null : (input.partnerId ?? (await makePartner(database, {})).id);
  const rows = await database
    .insert(users)
    .values({
      email: (input.email ?? `user-${n}@example.com`).toLowerCase(),
      name: input.name ?? `User ${n}`,
      kind,
      partnerId,
      role: input.role ?? (kind === 'staff' ? 'partner_manager' : 'partner_admin'),
      status: input.status ?? 'active',
      hubspotContactId: input.hubspotContactId ?? null,
    })
    .returning();
  const user = first(rows, 'user');
  if (kind === 'staff') await database.insert(staffScopes).values({ userId: user.id, region: input.region ?? 'all' });
  return user;
}

export interface MakeRegistrationInput {
  partnerId?: string;
  customerName?: string;
  customerDomain?: string | null;
  /** A code ('libraries') or a display label ('Clean Libraries'); stored as the code. The HubSpot plan passes labels. */
  product?: Product | 'CleanStart Images' | 'Clean Libraries' | 'CleanSight';
  /** A code ('india') or a label ('India', 'Middle East'); stored as the code. */
  region?: DealRegion | 'India' | 'Middle East';
  status?: RegistrationStatus;
  stage?: string;
  registeredOn?: string;
  protectionEnd?: string | null;
  closedOn?: string | null;
  registeredBy?: string | null;
  managerId?: string | null;
  hubspotDealId?: string | null;
  hubspotStageId?: string | null;
  contacts?: Array<{ name: string; role?: string; email?: string; phone?: string }>;
}

/**
 * Defaults: a fresh partner when partnerId is omitted, customer "Customer N", product 'images', region 'india',
 * status 'pending', registeredOn '2026-11-06'. Status 'accepted' without protectionEnd gets '2027-02-02'.
 * Status 'rejected' gets rejection_reason 'Test rejection'. Inserts the contacts into registration_contacts.
 */
export async function makeRegistration(database: Db, input: MakeRegistrationInput): Promise<RegistrationRow> {
  const n = next();
  const partnerId = input.partnerId ?? (await makePartner(database, {})).id;
  const status = input.status ?? 'pending';
  const product = input.product ? (PRODUCT_BY_LABEL[input.product] ?? (input.product as Product)) : 'images';
  const region = input.region ? (REGION_BY_LABEL[input.region] ?? (input.region as DealRegion)) : 'india';
  const registrant = input.registeredBy
    ? first(await database.select({ name: users.name }).from(users).where(eq(users.id, input.registeredBy)), 'registrant')
    : null;
  const rows = await database
    .insert(registrations)
    .values({
      partnerId,
      registeredBy: input.registeredBy ?? null,
      registeredByName: registrant?.name ?? 'Test User',
      customerName: input.customerName ?? `Customer ${n}`,
      customerDomain: input.customerDomain ?? null,
      product,
      region,
      managerId: input.managerId ?? null,
      status,
      ...(input.stage === undefined ? {} : { stage: input.stage }),
      registeredOn: input.registeredOn ?? '2026-11-06',
      protectionEnd: input.protectionEnd !== undefined ? input.protectionEnd : status === 'accepted' ? '2027-02-02' : null,
      closedOn: input.closedOn ?? null,
      rejectionReason: status === 'rejected' ? 'Test rejection' : null,
      hubspotDealId: input.hubspotDealId ?? null,
      hubspotStageId: input.hubspotStageId ?? null,
    })
    .returning();
  const registration = first(rows, 'registration');
  for (const contact of input.contacts ?? []) {
    await database.insert(registrationContacts).values({
      registrationId: registration.id,
      name: contact.name,
      role: contact.role ?? null,
      email: contact.email ?? null,
      phone: contact.phone ?? null,
    });
  }
  return registration;
}

/** The part of FakeHubspot (HubSpot plan 4.2) that makeSyncedDeal uses. FakeHubspot satisfies it structurally. */
export interface SyncedDealHubspot {
  readonly stageIds: Readonly<Record<string, string>>;
  createDeal(properties: Record<string, string>): Promise<{ id: string }>;
}

/**
 * An accepted registration plus the matching deal in `hs` (protection_end '2027-02-02' unless given); stores
 * hubspot_deal_id and hubspot_stage_id (the 'Accepted' stage) on the row. Returns { id, dealId }.
 */
export async function makeSyncedDeal(
  database: Db,
  hs: SyncedDealHubspot,
  input: Pick<MakeRegistrationInput, 'partnerId' | 'customerName' | 'product' | 'region' | 'protectionEnd'>,
): Promise<{ id: string; dealId: string }> {
  const stageId = hs.stageIds.Accepted;
  if (!stageId) throw new Error('test helper: the fake HubSpot has no "Accepted" stage');
  const registration = await makeRegistration(database, { ...input, status: 'accepted', stage: 'Accepted' });
  const deal = await hs.createDeal({
    dealname: registration.customerName,
    dealstage: stageId,
    portal_registration_id: registration.id,
  });
  await database
    .update(registrations)
    .set({ hubspotDealId: deal.id, hubspotStageId: stageId })
    .where(eq(registrations.id, registration.id));
  return { id: registration.id, dealId: deal.id };
}

export async function makeApplication(database: Db, input: Partial<typeof applications.$inferInsert>): Promise<ApplicationRow> {
  const n = next();
  const rows = await database
    .insert(applications)
    .values({
      reference: `APP-2611-${String(n).padStart(4, '0')}`,
      company: `Company ${n}`,
      domain: `company-${n}.example.com`,
      applicantName: `Applicant ${n}`,
      email: `applicant-${n}@company-${n}.example.com`,
      source: 'portal',
      ...input,
    })
    .returning();
  return first(rows, 'application');
}

/** Returns the row and the clear token (the row holds only the SHA-256 hex digest, as hashToken() produces). */
export async function makeInvite(
  database: Db,
  input: Partial<typeof invites.$inferInsert> & { partnerId?: string | null },
): Promise<{ invite: InviteRow; token: string }> {
  const n = next();
  const kind = input.kind ?? 'partner';
  const token = randomBytes(32).toString('base64url');
  const partnerId = kind === 'staff' ? null : (input.partnerId ?? (await makePartner(database, {})).id);
  const rows = await database
    .insert(invites)
    .values({
      email: `invitee-${n}@example.com`,
      role: 'sales',
      expiresAt: new Date('2099-01-01T00:00:00.000Z'),
      ...(kind === 'staff' ? { staffRegion: 'all' as const } : {}),
      ...input,
      kind,
      partnerId,
      tokenHash: sha256Hex(token),
    })
    .returning();
  return { invite: first(rows, 'invite'), token };
}

export async function makeAccessRequest(
  database: Db,
  input: Partial<typeof accessRequests.$inferInsert> & { partnerId: string },
): Promise<AccessRequestRow> {
  const n = next();
  const rows = await database
    .insert(accessRequests)
    .values({ email: `requester-${n}@example.com`, name: `Requester ${n}`, ...input })
    .returning();
  return first(rows, 'access request');
}

/** Inserts the documents row (file_key unique), audience rows for 'named', defaults: type 'datasheet', product 'all', audience 'all'. */
export async function makeDocument(
  database: Db,
  input: Partial<Omit<typeof documents.$inferInsert, 'audienceCategories'>> & {
    audienceCategories?: PartnerCategory[];
    partnerIds?: string[];
  },
): Promise<DocumentRow> {
  const n = next();
  const { partnerIds, ...columns } = input;
  const rows = await database
    .insert(documents)
    .values({
      title: `Document ${n}`,
      type: 'datasheet',
      product: 'all',
      audienceKind: partnerIds && partnerIds.length > 0 ? 'named' : 'all',
      fileKey: `test/doc-${n}.pdf`,
      fileSize: 1024,
      mime: 'application/pdf',
      originalName: `doc-${n}.pdf`,
      ...columns,
    })
    .returning();
  const document = first(rows, 'document');
  for (const partnerId of partnerIds ?? []) {
    await database.insert(documentAudience).values({ documentId: document.id, partnerId });
  }
  return document;
}

/** The Viewer a given user row would get from getViewer(). Loads the partner name; staff region from staff_scopes. */
export async function viewerFor(database: Db, user: UserRow): Promise<Viewer> {
  if (user.kind === 'partner') {
    if (!user.partnerId) throw new Error('test helper: partner user without partner_id');
    const partner = first(await database.select({ name: partners.name }).from(partners).where(eq(partners.id, user.partnerId)), 'partner name');
    return {
      id: user.id,
      kind: 'partner',
      role: user.role as PartnerRole,
      partnerId: user.partnerId,
      partnerName: partner.name,
      email: user.email,
      name: user.name,
    };
  }
  const scope = (await database.select({ region: staffScopes.region }).from(staffScopes).where(eq(staffScopes.userId, user.id)))[0];
  return {
    id: user.id,
    kind: 'staff',
    role: user.role as StaffRole,
    partnerId: null,
    partnerName: null,
    region: scope?.region ?? 'all',
    email: user.email,
    name: user.name,
  };
}

export async function asStaff(
  database: Db,
  role: 'partner_manager' | 'sales' | 'marketing' = 'partner_manager',
  region: StaffRegion = 'all',
): Promise<StaffViewer> {
  const viewer = await viewerFor(database, await makeUser(database, { kind: 'staff', role, region }));
  if (viewer.kind !== 'staff') throw new Error('test helper: asStaff produced a partner viewer');
  return viewer;
}

export async function asPartner(
  database: Db,
  input: { partnerId?: string; role?: 'partner_admin' | 'sales' | 'technical' } = {},
): Promise<PartnerViewer> {
  const viewer = await viewerFor(
    database,
    await makeUser(database, { kind: 'partner', ...(input.partnerId === undefined ? {} : { partnerId: input.partnerId }), role: input.role ?? 'partner_admin' }),
  );
  if (viewer.kind !== 'partner') throw new Error('test helper: asPartner produced a staff viewer');
  return viewer;
}
```

- [ ] **Step 16: Run the database tests and see them pass**

Run: `pnpm --filter @cleanstart/portal exec vitest run src/db/schema.test.ts src/db/rls.test.ts`

Expected: PASS, `Test Files  2 passed (2)`, `Tests  14 passed (14)` (5 schema tests, 9 row level security tests). This run also proves the global setup: it migrates `cleanstart_portal_test`, then clones `cleanstart_portal_test_w1` to `_w4` from it. Confirm with `psql "postgresql://postgres@localhost:5432/postgres" -Atc "select datname from pg_database where datname like 'cleanstart_portal_test%' order by 1"`: five names.

If a test fails with `permission denied` on a table the test needs, `rls.sql` did not grant it: the table is missing from a list in the file (contracts C.3, "A table missing from the lists has no grants"). Do not widen a grant; fix the list.

These two files are also the check for contracts M.1 items 1, 10, 11, 12 and 17. Record the result in the progress log:

```bash
printf '%s\n' "2026-11-13 00:00 IST | M0.3 | note | W0 | - | - | verified: set_config in tx, per worker DB via VITEST_POOL_ID and TEMPLATE, drizzle-kit features, startup option app.kind=system, FOR UPDATE under staff, child trigger, RETURNING under RLS" >> /Users/a12345/Desktop/AI/cleanstart/cleanstart-website/docs/partner-portal/PROGRESS.md
```

If any of those failed and you used a fallback from contracts M.1, name the fallback in that line instead.

- [ ] **Step 17: Apply the migration to the dev database, twice**

```bash
pnpm --filter @cleanstart/portal db:migrate
pnpm --filter @cleanstart/portal db:migrate
psql "postgresql://portal_owner:portal_owner_dev@localhost:5432/cleanstart_portal" -Atc "select count(*) from pg_tables where schemaname = 'public'"
```

Expected: both runs print `migrations and row level security applied` after pnpm's own two header lines and nothing else; the count is `25` (acceptance of M0.3: a fresh database migrates twice, idempotently).

- [ ] **Step 18: Type-check `scripts/` and the root config files too**

Open `apps/portal/tsconfig.json` and replace the `include` array with:

```json
  "include": ["next-env.d.ts", "src/**/*.ts", "src/**/*.tsx", "scripts/**/*.ts", "*.config.ts", ".next/types/**/*.ts"],
```

Run: `pnpm --filter @cleanstart/portal typecheck`

Expected: no output. (`next build` type-checks the same set, so a type error in a script would otherwise fail the build late.)

- [ ] **Step 19: Extract the mock's seed data once**

`src/db/fixtures.ts` must not import from the mock (the mock is deleted in M5.4), so the data is copied out once as JSON. The mock keeps each collection in a slice whose `get()` returns the seed when there is no browser, except the audit seed, which is not exported; export it for the length of this step.

```bash
sed -i '' 's/^const auditSlice/export const auditSlice/' apps/portal/src/data/audit.ts
git diff --stat apps/portal/src/data/audit.ts
```

Expected: `1 file changed, 1 insertion(+), 1 deletion(-)`.

Create `apps/portal/scripts/extract-mock-fixtures.ts` (one shot, deleted below):

```ts
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { auditSlice } from '@/data/audit';
import { dealsSlice } from '@/data/deals';
import { documentsSlice } from '@/data/documents';
import { partnersSlice } from '@/data/partners';
import { accountSlice, staffSlice, teamSlice } from '@/data/team';

const out = join(process.cwd(), 'src/db/mock-data');
mkdirSync(out, { recursive: true });

const files: Record<string, unknown> = {
  'mock-deals': dealsSlice.get(),
  'mock-partners': partnersSlice.get().partners,
  'mock-applications': partnersSlice.get().applications,
  'mock-documents': documentsSlice.get(),
  'mock-audit': auditSlice.get(),
  'mock-team': teamSlice.get(),
  'mock-staff': staffSlice.get(),
  'mock-account': accountSlice.get(),
};

for (const [name, value] of Object.entries(files)) {
  writeFileSync(join(out, `${name}.json`), `${JSON.stringify(value, null, 2)}\n`);
}
console.info(`wrote ${Object.keys(files).length} fixture files to ${out}`);
```

```bash
pnpm --filter @cleanstart/portal exec tsx scripts/extract-mock-fixtures.ts
wc -c apps/portal/src/db/mock-data/*.json
git checkout apps/portal/src/data/audit.ts
rm apps/portal/scripts/extract-mock-fixtures.ts
```

Expected: `wrote 8 fixture files to .../apps/portal/src/db/mock-data`, then these sizes in bytes (the mock at `58747992` has not changed, so they are exact): `226 mock-account.json`, `1389 mock-applications.json`, `5617 mock-audit.json`, `13373 mock-deals.json`, `4900 mock-documents.json`, `9103 mock-partners.json`, `1467 mock-staff.json`, `995 mock-team.json`. `git status --short apps/portal/src/data` prints nothing after the checkout.

- [ ] **Step 20: Write the failing fixtures test**

Create `apps/portal/src/db/fixtures.test.ts`:

```ts
import { sql } from 'drizzle-orm';
import { beforeAll, describe, expect, it } from 'vitest';
import { fixedClock } from '@/lib/clock';
import { parseLastSeen, parseMockDate, seedDevDatabase, seedMockData, type SeedSummary } from './fixtures';
import { resetDb, testDb } from './test-helpers';

const clock = fixedClock('2026-11-06T14:02:00Z');

const rows = async (query: string): Promise<Record<string, unknown>[]> => (await testDb().execute(sql.raw(query))).rows;

describe('mock date parsing', () => {
  it('reads dates with and without a year', () => {
    expect(parseMockDate('6 Nov 2026', 2026)).toBe('2026-11-06');
    expect(parseMockDate('29 Oct, 10:12', 2026)).toBe('2026-10-29');
    expect(() => parseMockDate('someday', 2026)).toThrow(/cannot read a date/);
  });

  it('reads last seen strings relative to the clock', () => {
    expect(parseLastSeen('Now', clock).lastLoginAt?.toISOString()).toBe('2026-11-06T14:02:00.000Z');
    expect(parseLastSeen('2 hours ago', clock).lastLoginAt?.toISOString()).toBe('2026-11-06T12:02:00.000Z');
    expect(parseLastSeen('Invited 5 Nov', clock)).toEqual({ lastLoginAt: null, invitedAt: new Date('2026-11-05T09:00:00.000Z') });
    expect(parseLastSeen('2 Nov 2026', clock).lastLoginAt?.toISOString()).toBe('2026-11-02T09:00:00.000Z');
  });
});

describe('seedMockData', () => {
  let summary: SeedSummary;
  beforeAll(async () => {
    await resetDb();
    summary = await seedMockData(testDb(), { clock });
  });

  it('loads the counts the contracts promise', () => {
    expect(summary).toMatchObject({ partners: 21, registrations: 15, applications: 3, documents: 12, auditEntries: 13 });
  });

  it('loads registrations by status exactly as the mock lists them', async () => {
    const byStatus = Object.fromEntries((await rows('select r.status, count(*)::int as n from registrations r group by r.status')).map((r) => [r.status, r.n]));
    expect(byStatus).toEqual({ pending: 4, accepted: 5, rejected: 2, won: 2, lost: 1, expired: 1 });
    const kestrel = await rows("select r.status, count(*)::int as n from registrations r join partners p on p.id = r.partner_id where p.name = 'Kestrel Systems' group by r.status");
    expect(Object.fromEntries(kestrel.map((r) => [r.status, r.n]))).toEqual({ pending: 2, accepted: 3, rejected: 1, won: 2, lost: 1, expired: 1 });
  });

  it('keeps the partner manager routing and the HubSpot ids of accepted deals', async () => {
    const vardhan = await rows("select hubspot_deal_id, hubspot_synced_at, protection_end::text as protection_end, (select name from users where id = manager_id) as manager from registrations where customer_name = 'Vardhan Capital' and product = 'cleansight'");
    expect(vardhan[0]).toMatchObject({ hubspot_deal_id: '48213', protection_end: '2027-01-12', manager: 'Farhan Qureshi' });
    expect(new Date(String(vardhan[0]?.hubspot_synced_at)).toISOString()).toBe('2026-11-06T14:02:00.000Z');
  });

  it('seeds four Kestrel people, one invited, and the open access request', async () => {
    const people = await rows("select u.name, u.status from users u join partners p on p.id = u.partner_id where p.name = 'Kestrel Systems' order by u.name");
    expect(people.map((p) => `${p.name}:${p.status}`)).toEqual(['Aditi Rao:active', 'Karan Malhotra:active', 'Sneha Iyer:active', 'Vikram Sethi:invited']);
    expect(await rows("select email from access_requests where status = 'open'")).toEqual([{ email: 'rohit.desai@kestrelsystems.in' }]);
  });

  it('reproduces document open counts, partner counts and Kestrel own opens', async () => {
    const stats = await rows(`
      select d.title, count(o.id)::int as opens, count(distinct o.partner_id)::int as partner_count,
             count(o.id) filter (where p.name = 'Kestrel Systems')::int as own
      from documents d left join document_opens o on o.document_id = d.id left join partners p on p.id = o.partner_id
      group by d.title order by d.title`);
    const byTitle = Object.fromEntries(stats.map((s) => [s.title, s]));
    expect(byTitle['CleanSight product walkthrough']).toMatchObject({ opens: 38, partner_count: 14, own: 9 });
    expect(byTitle['Partner sales playbook 2026']).toMatchObject({ opens: 112, partner_count: 18, own: 14 });
    expect(byTitle['Gulf region price list']).toMatchObject({ opens: 9, partner_count: 2, own: 0 });
  });

  it('resolves audit ages against the clock and uses the closed event names', async () => {
    const latest = await rows('select event, at, source from audit_log order by at desc limit 1');
    expect(latest[0]).toMatchObject({ event: 'registration.stage_changed', source: 'crm' });
    expect(new Date(String(latest[0]?.at)).toISOString()).toBe('2026-11-06T14:02:00.000Z');
    expect((await rows('select count(*)::int as n from audit_log where event is null'))[0]).toEqual({ n: 0 });
  });

  it('starts application references after the seeded ones', async () => {
    expect(await rows("select nextval('application_reference_seq')::int as n")).toEqual([{ n: 45 }]);
  });
});

describe('seedDevDatabase', () => {
  it('seeds an empty database once and refuses a second run', async () => {
    await resetDb();
    expect((await seedDevDatabase(testDb(), clock)).partners).toBe(21);
    await expect(seedDevDatabase(testDb(), clock)).rejects.toThrow(/already has partners/);
    expect((await rows('select count(*)::int as n from partners'))[0]).toEqual({ n: 21 });
  });
});
```

Run: `pnpm --filter @cleanstart/portal exec vitest run src/db/fixtures.test.ts`

Expected: FAIL, `Failed to load url ./fixtures`.

- [ ] **Step 21: Create `src/db/fixtures.ts`**

It needs `src/server/audit/events.ts` (the closed audit vocabulary) for the reverse lookup from an action text to an event name. That file is part of M1.2; copy it now from the contracts, unchanged, and M1.2 will find it in place:

```bash
mkdir -p apps/portal/src/server/audit
bash apps/portal/scripts/contract-block.sh "### F.4 " 1 > apps/portal/src/server/audit/events.ts
```

Create `apps/portal/src/db/fixtures.ts`:

```ts
import { createHash } from 'node:crypto';
import { sql } from 'drizzle-orm';
import type { Db } from '@/db/client';
import {
  accessRequests,
  applications,
  auditLog,
  documentAudience,
  documentOpens,
  documents,
  invites,
  notificationPrefs,
  partners,
  registrationContacts,
  registrationEvents,
  registrationMessages,
  registrations,
  staffScopes,
  users,
} from '@/db/schema';
import { addDays } from '@/lib/dates';
import type { Clock } from '@/lib/clock';
import {
  type DocumentType,
  type PartnerCategory,
  type PartnerRegion,
  type PartnerRole,
  type StaffRegion,
  type StaffRole,
  type UserStatus,
  NOTIFICATION_CATEGORIES,
} from '@/lib/domain';
import { AUDIT_EVENTS, type AuditEvent } from '@/server/audit/events';
import mockAccount from './mock-data/mock-account.json';
import mockApplications from './mock-data/mock-applications.json';
import mockAudit from './mock-data/mock-audit.json';
import mockDeals from './mock-data/mock-deals.json';
import mockDocuments from './mock-data/mock-documents.json';
import mockPartners from './mock-data/mock-partners.json';
import mockStaff from './mock-data/mock-staff.json';
import mockTeam from './mock-data/mock-team.json';

/** Development only. Meets the password rule (8 or more characters, a letter, a number, a special character). */
export const DEV_SEED_PASSWORD = 'Portal-dev-2026!';

export interface SeedSummary {
  partners: number;
  users: number;
  registrations: number;
  applications: number;
  documents: number;
  documentOpens: number;
  auditEntries: number;
}

export interface SeedOptions {
  clock: Clock;
}

/* ---------------------------------------------------------------- the shapes of the extracted mock data */

interface MockPerson { name: string; role: string; last: string }
interface MockPartner {
  id: string; name: string; domain: string; category: string; region: string; status: string; last: string; since: string;
  agreement: string; admin: string; manager: string; hs: string; people: MockPerson[];
}
interface MockContact { name: string; role?: string; email?: string; phone?: string }
interface MockMessage { id: string; who: string; org: string; self: boolean; when: string; text: string; auto?: boolean }
interface MockEvent { when: string; text: string; by: string; source: string; auto?: boolean }
interface MockDeal {
  id: string; customer: string; website?: string; partner: string; product: string; region: string; manager: string;
  registeredBy?: string; registered: string; registeredTime?: string; resubmittedOn?: string; status: string; stage: string;
  protectionEnd?: string; closedOn?: string; decidedOn?: string; decidedBy?: string; rejectionReason?: string; crmRef?: string;
  crmSynced?: string; extensionRequested?: boolean; notes?: string; contacts: MockContact[]; thread: MockMessage[]; history: MockEvent[];
}
interface MockApplication {
  reference: string; company: string; domain: string; applicant: string; email?: string; role: string; phone?: string;
  category: string; region: string; submitted: string; reason: string; status: string;
}
interface MockDocument {
  title: string; id: string; type: string; format: string; product: string; summary?: string; updated: string;
  audience: { kind: 'all' } | { kind: 'categories'; categories: string[] } | { kind: 'partners'; partners: string[] };
  opens: number; partnerCount: number; ownOpens: number;
}
interface MockAuditEntry {
  id: string; ageDays: number; when: string; who: string; whoRole: string; whoKind: 'staff' | 'partner' | 'sync'; kind: string;
  action: string; target: string; source: string; before: string; after: string; note: string;
}
interface MockTeamMember { name: string; email: string; role: string; status: string; last: string }
interface MockAccessRequest { name: string; email: string; note: string; role: string }
interface MockStaff { name: string; email: string; role: string; region: string; last: string; status: string }

const partnersData = mockPartners as unknown as MockPartner[];
const dealsData = mockDeals as unknown as MockDeal[];
const applicationsData = mockApplications as unknown as MockApplication[];
const documentsData = mockDocuments as unknown as MockDocument[];
const auditData = mockAudit as unknown as MockAuditEntry[];
const teamData = mockTeam as unknown as { members: MockTeamMember[]; requests: MockAccessRequest[] };
const staffData = mockStaff as unknown as MockStaff[];
const accountData = mockAccount as unknown as { name: string; title: string; phone: string; notify: Record<string, boolean>; twoStepOn: boolean };

/* ---------------------------------------------------------------- small parsers for the mock's display strings */

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] as const;

/** "6 Nov 2026" or "6 Nov" (year from `year`) to YYYY-MM-DD. Throws on anything else, so a bad fixture fails loudly. */
export const parseMockDate = (text: string, year: number): string => {
  const match = /(\d{1,2}) ([A-Z][a-z]{2})(?: (\d{4}))?/.exec(text);
  const month = match ? MONTHS.indexOf(match[2] as (typeof MONTHS)[number]) : -1;
  if (!match || month < 0) throw new Error(`fixture: cannot read a date from "${text}"`);
  return `${match[3] ?? year}-${String(month + 1).padStart(2, '0')}-${String(Number(match[1])).padStart(2, '0')}`;
};

const at = (isoDate: string, time = '09:00'): Date => new Date(`${isoDate}T${time}:00.000Z`);

/** "Now", "Today", "Yesterday", "2 hours ago", "5 Nov", "2 Nov 2026" and "Invited 5 Nov". */
export const parseLastSeen = (text: string, clock: Clock): { lastLoginAt: Date | null; invitedAt: Date | null } => {
  const now = clock.now().getTime();
  const year = Number(clock.today().slice(0, 4));
  const offset = (ms: number): Date => new Date(now - ms);
  if (text === 'Now') return { lastLoginAt: offset(0), invitedAt: null };
  if (text === 'Today') return { lastLoginAt: offset(3 * 3_600_000), invitedAt: null };
  if (text === 'Yesterday') return { lastLoginAt: offset(26 * 3_600_000), invitedAt: null };
  const hours = /^(\d+) hours? ago$/.exec(text);
  if (hours) return { lastLoginAt: offset(Number(hours[1]) * 3_600_000), invitedAt: null };
  if (text.startsWith('Invited ')) return { lastLoginAt: null, invitedAt: at(parseMockDate(text.slice(8), year)) };
  return { lastLoginAt: at(parseMockDate(text, year)), invitedAt: null };
};

const slug = (value: string): string => value.toLowerCase().replace(/[^a-z0-9]+/g, '');
const emailFor = (name: string, domain: string): string => {
  const [first = '', ...rest] = name.split(/\s+/);
  return `${slug(first)}.${slug(rest.join(''))}@${domain}`;
};
const sha256Hex = (value: string): string => createHash('sha256').update(value).digest('hex');

const PARTNER_CATEGORY: Record<string, PartnerCategory> = { Distributor: 'distributor', 'Channel partner': 'channel', 'System integrator': 'integrator' };
const AUDIENCE_CATEGORY: Record<string, PartnerCategory> = { Distributors: 'distributor', 'Channel partners': 'channel', 'System integrators': 'integrator' };
const REGION: Record<string, PartnerRegion> = { India: 'india', 'Middle East': 'middle_east', Elsewhere: 'elsewhere' };
const STAFF_REGION: Record<string, StaffRegion> = { India: 'india', 'Middle East': 'middle_east', 'All regions': 'all' };
const PARTNER_ROLE: Record<string, PartnerRole> = { 'Partner admin': 'partner_admin', Sales: 'sales', Technical: 'technical' };
const STAFF_ROLE: Record<string, StaffRole> = { 'Partner manager': 'partner_manager', Sales: 'sales', Marketing: 'marketing' };
const PRODUCT = { 'CleanStart Images': 'images', 'Clean Libraries': 'libraries', CleanSight: 'cleansight' } as const;
const DOC_PRODUCT = { ...PRODUCT, 'All products': 'all' } as const;
const DOC_TYPE: Record<string, DocumentType> = {
  Datasheet: 'datasheet', 'Solution sheet': 'solution_sheet', Battlecard: 'battlecard', 'Price list': 'price_list', Video: 'video', 'Enablement guide': 'enablement_guide',
};
const AUDIT_KIND = { 'Deal decisions': 'deal_decisions', Partners: 'partners', Documents: 'documents', 'People and access': 'people_access' } as const;
const MIME: Record<string, { mime: string; ext: string }> = {
  PDF: { mime: 'application/pdf', ext: 'pdf' },
  MP4: { mime: 'video/mp4', ext: 'mp4' },
  ZIP: { mime: 'application/zip', ext: 'zip' },
};
const lookup = <T>(table: Record<string, T>, key: string, what: string): T => {
  const value = table[key];
  if (value === undefined) throw new Error(`fixture: unknown ${what} "${key}"`);
  return value;
};

/** "1.1 MB" and "640 KB" to bytes. */
const parseSize = (format: string): number => {
  const match = /([\d.]+) (KB|MB)/.exec(format);
  if (!match) return 1_048_576;
  return Math.round(Number(match[1]) * (match[2] === 'MB' ? 1_048_576 : 1024));
};

const first = <T>(rows: T[], what: string): T => {
  const row = rows[0];
  if (!row) throw new Error(`fixture: insert of ${what} returned no row`);
  return row;
};

const AGREEMENT = /^(v[\d.]+), accepted (\d{1,2} [A-Z][a-z]{2} \d{4})$/;
const FILLER_PARTNERS = 11;

/**
 * Loads the mock's data into the real tables so every screen shows the mock's rows (BUILD-HANDOFF, "Converting a mock
 * screen"). Run on an empty, migrated database as the system role. Dates in the mock that are absolute stay absolute;
 * last-seen strings and audit ages are resolved against `opts.clock`.
 */
export async function seedMockData(db: Db, opts: SeedOptions): Promise<SeedSummary> {
  const { clock } = opts;
  const year = Number(clock.today().slice(0, 4));

  /* staff first, so partners can point at their managers */
  const staffIdByName = new Map<string, string>();
  for (const member of staffData) {
    const role = lookup(STAFF_ROLE, member.role, 'staff role');
    const { lastLoginAt, invitedAt } = parseLastSeen(member.last, clock);
    const status: UserStatus = member.status === 'Invited' ? 'invited' : 'active';
    const row = first(
      await db.insert(users).values({ email: member.email, name: member.name, kind: 'staff', partnerId: null, role, status, lastLoginAt, invitedAt, emailVerified: status === 'active' }).returning({ id: users.id }),
      'staff user',
    );
    staffIdByName.set(member.name, row.id);
    await db.insert(staffScopes).values({ userId: row.id, region: lookup(STAFF_REGION, member.region, 'staff region') });
    if (status === 'invited') {
      await db.insert(invites).values({
        email: member.email, kind: 'staff', partnerId: null, role, staffRegion: lookup(STAFF_REGION, member.region, 'staff region'),
        tokenHash: sha256Hex(`seed-staff-invite:${member.email}`), expiresAt: new Date((invitedAt ?? clock.now()).getTime() + 7 * 86_400_000),
        invitedBy: staffIdByName.get('Farhan Qureshi') ?? null,
      });
    }
  }

  /* the ten detailed partners and their people */
  const partnerIdByName = new Map<string, string>();
  const partnerCategoryById = new Map<string, PartnerCategory>();
  const userIdByName = new Map<string, string>();
  /** Every login of every partner, in insertion order. The first one of a partner stands in for it when opens are generated. */
  const usersByPartner = new Map<string, string[]>();
  const addPartnerUser = (partnerId: string, userId: string): void => void usersByPartner.set(partnerId, [...(usersByPartner.get(partnerId) ?? []), userId]);
  let userCount = staffData.length;
  for (const partner of partnersData) {
    const agreement = AGREEMENT.exec(partner.agreement);
    const category = lookup(PARTNER_CATEGORY, partner.category, 'partner category');
    const row = first(
      await db.insert(partners).values({
        name: partner.name, domain: partner.domain, category, region: lookup(REGION, partner.region, 'partner region'),
        status: partner.status.toLowerCase() as 'active' | 'onboarding' | 'inactive' | 'suspended',
        managerId: staffIdByName.get(partner.manager) ?? null,
        agreementVersion: agreement?.[1] ?? null,
        agreementAcceptedAt: agreement?.[2] ? at(parseMockDate(agreement[2], year)) : null,
        hubspotCompanyId: partner.hs,
        createdAt: at(parseMockDate(partner.since, year)),
      }).returning({ id: partners.id }),
      'partner',
    );
    partnerIdByName.set(partner.name, row.id);
    partnerCategoryById.set(row.id, category);
    for (const person of partner.people) {
      const team = teamData.members.find((m) => m.name === person.name);
      const { lastLoginAt, invitedAt } = parseLastSeen(person.last, clock);
      const status: UserStatus = person.last.startsWith('Invited') ? 'invited' : 'active';
      const email = team?.email ?? emailFor(person.name, partner.domain);
      const isAditi = person.name === accountData.name;
      const created = first(
        await db.insert(users).values({
          email, name: person.name, kind: 'partner', partnerId: row.id, role: lookup(PARTNER_ROLE, person.role, 'partner role'), status,
          lastLoginAt, invitedAt, emailVerified: status === 'active',
          title: isAditi ? accountData.title : null, phone: isAditi ? accountData.phone : null, twoFactorEnabled: isAditi ? accountData.twoStepOn : false,
        }).returning({ id: users.id }),
        'partner user',
      );
      userIdByName.set(person.name, created.id);
      addPartnerUser(row.id, created.id);
      userCount += 1;
      if (status === 'invited') {
        await db.insert(invites).values({
          email, kind: 'partner', partnerId: row.id, role: lookup(PARTNER_ROLE, person.role, 'partner role'),
          tokenHash: sha256Hex(`seed-invite:${email}`), expiresAt: new Date((invitedAt ?? clock.now()).getTime() + 7 * 86_400_000),
          invitedBy: userIdByName.get(partner.admin) ?? null,
        });
      }
    }
  }

  /* the eleven active partners the board counts but does not detail: one admin each, so document opens can name them */
  for (let i = 1; i <= FILLER_PARTNERS; i += 1) {
    const label = String(i).padStart(2, '0');
    const category: PartnerCategory = i % 2 === 1 ? 'distributor' : 'channel';
    const row = first(
      await db.insert(partners).values({
        name: `Seed partner ${label}`, domain: `seed-partner-${label}.example.com`, category, region: (['india', 'middle_east', 'elsewhere'] as const)[i % 3] ?? 'india',
        status: 'active', managerId: staffIdByName.get(i % 2 === 1 ? 'Farhan Qureshi' : 'Omar Nasser') ?? null,
        agreementVersion: 'v1.2', agreementAcceptedAt: at('2026-06-01'), createdAt: at('2026-06-01'),
      }).returning({ id: partners.id }),
      'filler partner',
    );
    partnerIdByName.set(`Seed partner ${label}`, row.id);
    partnerCategoryById.set(row.id, category);
    const admin = first(
      await db.insert(users).values({
        email: `admin@seed-partner-${label}.example.com`, name: `Seed Admin ${label}`, kind: 'partner', partnerId: row.id, role: 'partner_admin',
        status: 'active', emailVerified: true, lastLoginAt: new Date(clock.now().getTime() - i * 86_400_000),
      }).returning({ id: users.id }),
      'filler user',
    );
    addPartnerUser(row.id, admin.id);
    userCount += 1;
  }

  /* Kestrel's access request and Aditi's notification switches */
  const kestrelId = partnerIdByName.get('Kestrel Systems');
  if (!kestrelId) throw new Error('fixture: Kestrel Systems missing');
  for (const request of teamData.requests) {
    await db.insert(accessRequests).values({
      partnerId: kestrelId, email: request.email, name: request.name, note: request.note, requestedRole: lookup({ Sales: 'sales', Technical: 'technical' } as const, request.role, 'requested role'),
      createdAt: clock.now(),
    });
  }
  const aditiId = userIdByName.get(accountData.name);
  if (aditiId) {
    for (const category of NOTIFICATION_CATEGORIES) {
      await db.insert(notificationPrefs).values({ userId: aditiId, category, email: accountData.notify[category] ?? false });
    }
  }

  /* registrations with contacts, thread and history */
  for (const deal of dealsData) {
    const partnerId = partnerIdByName.get(deal.partner);
    if (!partnerId) throw new Error(`fixture: deal ${deal.id} names unknown partner ${deal.partner}`);
    const registrant = deal.history.find((event) => event.text === 'Registered')?.by ?? deal.partner;
    const registeredByName = deal.registeredBy ?? registrant;
    const status = deal.status.toLowerCase() as 'pending' | 'accepted' | 'rejected' | 'expired' | 'won' | 'lost';
    const row = first(
      await db.insert(registrations).values({
        partnerId,
        registeredBy: userIdByName.get(registeredByName) ?? null,
        registeredByName,
        customerName: deal.customer,
        customerDomain: deal.website ?? null,
        product: lookup(PRODUCT, deal.product, 'product'),
        region: lookup({ India: 'india', 'Middle East': 'middle_east' } as const, deal.region, 'deal region'),
        managerId: staffIdByName.get(deal.manager) ?? null,
        notes: deal.notes ?? null,
        status,
        stage: deal.stage,
        registeredOn: deal.registered,
        resubmittedOn: deal.resubmittedOn ?? null,
        decidedBy: deal.decidedBy ? (staffIdByName.get(deal.decidedBy) ?? null) : null,
        decidedByLabel: deal.decidedBy ?? null,
        decidedAt: deal.decidedOn ? at(deal.decidedOn, '12:00') : null,
        rejectionReason: deal.rejectionReason ?? null,
        protectionEnd: deal.protectionEnd ?? null,
        closedOn: deal.closedOn ?? null,
        extensionStatus: deal.extensionRequested ? 'requested' : 'none',
        extensionRequestedAt: deal.extensionRequested ? clock.now() : null,
        hubspotDealId: deal.crmRef ? deal.crmRef.replace(/^HS-/, '') : null,
        hubspotStageId: deal.crmRef ? `seed:${deal.stage}` : null,
        hubspotSyncedAt: deal.crmSynced ? at(parseMockDate(deal.crmSynced, year), /(\d{2}:\d{2})$/.exec(deal.crmSynced)?.[1] ?? '09:00') : null,
        createdAt: at(deal.registered, deal.registeredTime ?? '09:00'),
      }).returning({ id: registrations.id }),
      'registration',
    );
    for (const contact of deal.contacts) {
      await db.insert(registrationContacts).values({
        registrationId: row.id, name: contact.name, role: contact.role ?? null, email: contact.email ?? null, phone: contact.phone ?? null,
      });
    }
    for (const message of deal.thread) {
      await db.insert(registrationMessages).values({
        registrationId: row.id,
        authorId: userIdByName.get(message.who) ?? staffIdByName.get(message.who) ?? null,
        authorName: message.who,
        authorOrg: message.org,
        side: message.self ? 'partner' : 'staff',
        body: message.text,
        auto: message.auto ?? false,
        createdAt: at(parseMockDate(message.when, year), /(\d{2}:\d{2})$/.exec(message.when)?.[1] ?? '09:00'),
      });
    }
    // history is newest first; a minute per position keeps events of the same day in order
    for (const [index, event] of deal.history.entries()) {
      await db.insert(registrationEvents).values({
        registrationId: row.id,
        at: new Date(at(parseMockDate(event.when, year), '12:00').getTime() + (deal.history.length - 1 - index) * 60_000),
        text: event.text,
        byLabel: event.by,
        source: event.source.toLowerCase() as 'portal' | 'crm' | 'system',
        auto: event.auto ?? false,
      });
    }
  }

  /* applications */
  for (const application of applicationsData) {
    await db.insert(applications).values({
      reference: application.reference,
      company: application.company,
      domain: application.domain,
      applicantName: application.applicant,
      email: application.email ?? emailFor(application.applicant, application.domain),
      role: application.role,
      phone: application.phone ?? null,
      category: lookup(PARTNER_CATEGORY, application.category, 'application category'),
      region: lookup(REGION, application.region, 'application region'),
      reason: application.reason,
      source: 'portal',
      status: 'new',
      createdAt: at(parseMockDate(application.submitted, year)),
    });
  }
  // setval needs UPDATE on the sequence, which the runtime role does not have; 44 calls to nextval need only USAGE.
  await db.execute(sql`select count(nextval('application_reference_seq')) from generate_series(1, 44)`);

  /* documents, their audiences and opens */
  const marketingId = staffIdByName.get('Ishita Bose') ?? null;
  const openPool = [...usersByPartner].map(([partnerId, userIds]) => ({ partnerId, userId: userIds[0] ?? '' }));
  let openCount = 0;
  for (const doc of documentsData) {
    const [formatLabel = 'PDF'] = doc.format.split(',');
    const file = lookup(MIME, formatLabel.trim(), 'file format');
    const duration = /(\d+) min/.exec(doc.format);
    const audience = doc.audience;
    const audienceKind = audience.kind === 'partners' ? 'named' : audience.kind;
    const updated = at(parseMockDate(doc.updated, year));
    const row = first(
      await db.insert(documents).values({
        title: doc.title,
        type: lookup(DOC_TYPE, doc.type, 'document type'),
        product: lookup(DOC_PRODUCT, doc.product, 'document product'),
        summary: doc.summary ?? null,
        audienceKind,
        audienceCategories: audience.kind === 'categories' ? audience.categories.map((c) => lookup(AUDIENCE_CATEGORY, c, 'audience category')) : [],
        fileKey: `seed/${doc.id}.${file.ext}`,
        fileSize: parseSize(doc.format),
        mime: file.mime,
        originalName: `${doc.id}.${file.ext}`,
        durationMinutes: duration ? Number(duration[1]) : null,
        uploadedBy: marketingId,
        createdAt: updated,
        updatedAt: updated,
      }).returning({ id: documents.id }),
      'document',
    );
    const namedPartnerIds = audience.kind === 'partners' ? audience.partners.map((name) => partnerIdByName.get(name) ?? '') : [];
    for (const partnerId of namedPartnerIds) {
      if (!partnerId) throw new Error(`fixture: document ${doc.id} names an unknown partner`);
      await db.insert(documentAudience).values({ documentId: row.id, partnerId });
    }

    // Opens: Kestrel gets exactly ownOpens, the other partners that can see the document share the rest, one each at least.
    const eligible = openPool.filter(({ partnerId }) =>
      audience.kind === 'all' ||
      (audience.kind === 'partners' && namedPartnerIds.includes(partnerId)) ||
      (audience.kind === 'categories' && audience.categories.some((c) => lookup(AUDIENCE_CATEGORY, c, 'audience category') === partnerCategoryById.get(partnerId))),
    );
    const own = doc.ownOpens > 0 ? eligible.filter((p) => p.partnerId === kestrelId) : [];
    const others = eligible.filter((p) => p.partnerId !== kestrelId).slice(0, doc.partnerCount - (own.length > 0 ? 1 : 0));
    if (others.length !== doc.partnerCount - (own.length > 0 ? 1 : 0)) throw new Error(`fixture: not enough partners can open ${doc.id}`);
    const share = doc.opens - doc.ownOpens;
    const perPartner = others.map((_, i) => Math.floor(share / others.length) + (i < share % others.length ? 1 : 0));
    const rows: Array<{ userId: string; partnerId: string }> = [];
    const kestrelUsers = (usersByPartner.get(kestrelId) ?? []).map((userId) => ({ partnerId: kestrelId, userId }));
    for (let i = 0; i < doc.ownOpens; i += 1) {
      const user = kestrelUsers[i % kestrelUsers.length];
      if (user) rows.push(user);
    }
    others.forEach((p, i) => {
      for (let n = 0; n < (perPartner[i] ?? 0); n += 1) rows.push(p);
    });
    if (rows.length > 0) {
      await db.insert(documentOpens).values(rows.map((r) => ({ documentId: row.id, userId: r.userId, partnerId: r.partnerId, openedAt: updated })));
    }
    openCount += rows.length;
  }

  /* audit log: ages resolved against the clock, the time of day kept */
  const eventByAction = new Map<string, AuditEvent>(
    (Object.entries(AUDIT_EVENTS) as Array<[AuditEvent, { action: string }]>).map(([event, def]) => [def.action, event]),
  );
  for (const entry of auditData) {
    const event = eventByAction.get(entry.action);
    if (!event) throw new Error(`fixture: no audit event named "${entry.action}"`);
    const time = /(\d{2}:\d{2})$/.exec(entry.when)?.[1] ?? '09:00';
    await db.insert(auditLog).values({
      at: at(addDays(clock.today(), -entry.ageDays), time),
      actorId: userIdByName.get(entry.who) ?? staffIdByName.get(entry.who) ?? null,
      actorLabel: entry.who,
      actorRole: entry.whoRole,
      who: entry.whoKind,
      kind: lookup(AUDIT_KIND, entry.kind, 'audit kind'),
      event,
      action: entry.action,
      target: entry.target,
      text: `${entry.action}: ${entry.target}`,
      source: entry.source === 'HubSpot' ? 'crm' : 'portal',
      before: entry.before || null,
      after: entry.after || null,
      note: entry.note || null,
    });
  }

  const count = async (table: string): Promise<number> => Number((await db.execute(sql.raw(`select count(*)::int as n from ${table}`))).rows[0]?.n ?? 0);
  return {
    partners: await count('partners'),
    users: userCount,
    registrations: await count('registrations'),
    applications: await count('applications'),
    documents: await count('documents'),
    documentOpens: openCount,
    auditEntries: await count('audit_log'),
  };
}

/** What `pnpm db:seed` runs. Refuses a database that already has partners: it never deletes data (CLAUDE.md). */
export async function seedDevDatabase(db: Db, clock: Clock): Promise<SeedSummary> {
  const existing = Number((await db.execute(sql`select count(*)::int as n from partners`)).rows[0]?.n ?? 0);
  if (existing > 0) {
    throw new Error('The database already has partners. Seed a fresh database: scripts/db-create.sh <name>, then pnpm db:migrate, then pnpm db:seed.');
  }
  return seedMockData(db, { clock });
}
```

Run: `pnpm --filter @cleanstart/portal exec vitest run src/db/fixtures.test.ts`

Expected: PASS, `Tests  10 passed (10)`. The figures it asserts are the ones in contracts J.5: 21 partners, 15 registrations (4 pending, 5 accepted, 2 rejected, 2 won, 1 lost, 1 expired), 3 applications, 12 documents, 13 audit entries, Kestrel with 4 people and one open access request, and document open counts that reproduce the mock's `opens`, `partnerCount` and Kestrel's `ownOpens`.

- [ ] **Step 22: Create `scripts/seed-dev.ts` and seed the dev database**

Create `apps/portal/scripts/seed-dev.ts`:

```ts
import { db, pool } from '@/db/client';
import { seedDevDatabase } from '@/db/fixtures';
import { systemClock } from '@/lib/clock';

seedDevDatabase(db, systemClock)
  .then((summary) => console.info('seeded the mock data', summary))
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
```

```bash
pnpm --filter @cleanstart/portal db:seed
pnpm --filter @cleanstart/portal db:seed; echo "exit $?"
```

Expected for the first run: `seeded the mock data { partners: 21, users: 38, registrations: 15, applications: 3, documents: 12, documentOpens: 508, auditEntries: 13 }`. Expected for the second: the message `The database already has partners. Seed a fresh database: scripts/db-create.sh <name>, then pnpm db:migrate, then pnpm db:seed.` and `exit 1` (the seed never deletes data; CLAUDE.md).

- [ ] **Step 23: Document the local database commands**

Append to `apps/portal/README.md`:

````markdown
## Local database

One database and one test database per worktree (names in `docs/partner-portal/BUILD-HANDOFF.md`). The Postgres on `localhost:5432` needs only the `postgres` superuser; the script creates the `portal_owner` and `portal_app` roles.

```bash
apps/portal/scripts/db-create.sh cleanstart_portal        # prints DATABASE_URL and DATABASE_OWNER_URL
apps/portal/scripts/db-create.sh cleanstart_portal_test   # prints PORTAL_TEST_DATABASE_URL and PORTAL_TEST_OWNER_URL
# put the four URLs and AUTH_SECRET (openssl rand -base64 32) in apps/portal/.env, see .env.example
pnpm --filter @cleanstart/portal db:migrate               # Drizzle migrations, then src/db/rls.sql; safe to repeat
pnpm --filter @cleanstart/portal db:seed                  # the mock's data; refuses a database that has partners
```

`db-create.sh <name> --recreate` drops and recreates a database (and the four `_w1` to `_w4` clones of a `_test` one). Use it only on your own worktree's databases, for example after `drizzle/0000_init.sql` is regenerated.
````

- [ ] **Step 24: Stage, run Gate A, run Gate B**

```bash
git add apps/portal/scripts/db-bootstrap.sql apps/portal/scripts/db-create.sh apps/portal/scripts/migrate.ts apps/portal/scripts/seed-dev.ts apps/portal/drizzle.config.ts apps/portal/drizzle apps/portal/vitest.config.ts apps/portal/tsconfig.json apps/portal/README.md apps/portal/src/env.ts apps/portal/src/env.test.ts apps/portal/src/lib apps/portal/src/server/auth apps/portal/src/server/audit/events.ts apps/portal/src/db
git status --short | grep -v '^[AM] ' ; echo "unstaged check done"
```

Expected: the `git status` filter prints nothing before the final echo (every changed path is staged; `.env` is ignored). Run Gate A (lint, typecheck, test, build), then Gate B with the reviewer checklist; in particular the reviewer checks that `rls.sql` grants nothing beyond contracts C.3 and that no test pierces row level security by connecting as `portal_owner` or `postgres` to read data. After Gate A, `pnpm --filter @cleanstart/portal test` reports `Test Files  10 passed (10)` and `Tests  67 passed (67)` at the time of writing.

- [ ] **Step 25: Commit and log**

```bash
git add docs/superpowers/plans/2026-11-12-partner-portal-01-foundations.md
git commit -m "feat(portal): M0.3 database, roles, migrations, row level security, test helpers and dev seed"
printf '%s\n' "2026-11-13 00:00 IST | M0.3 | done | W0 | $(git rev-parse --short HEAD) | A ok, B ok | schema, drizzle/0000_init, rls.sql, db-create.sh, helpers, seed-dev" >> /Users/a12345/Desktop/AI/cleanstart/cleanstart-website/docs/partner-portal/PROGRESS.md
```

---

### Task M0.4: Environment, logging, Sentry, job infrastructure (W0-c)

**Files:**
- Create: `apps/portal/.env.example`, `src/env.example.test.ts`, `src/server/log.ts`, `src/server/log.test.ts`, `sentry.server.config.ts`, `sentry.edge.config.ts`, `sentry.client.config.ts`, `src/instrumentation-client.ts`, `src/server/jobs/{lock,schedule,index}.ts` (+ `lock.test.ts`, `schedule.test.ts`, `index.test.ts`), `src/server/jobs/{hubspot-outbox,hubspot-poll,reconcile,expiry,expiry-reminders,intake,document-purge,retention}.ts`, `src/server/registrations/announce.ts`, `src/instrumentation.ts`, `src/instrumentation.test.ts`
- Modify: `apps/portal/package.json`

`src/env.ts` and its test already exist (M0.3, Steps 5 to 7), so this task does not touch them. `src/server/rate-limit.ts`, which the contracts list here, is created in M1.2 because it throws `RateLimitError` (see "Contract change requests", item 4).

**Gate A at the end:** all four commands run.

- [ ] **Step 1: Log the start**

```bash
printf '%s\n' "2026-11-13 00:00 IST | M0.4 | started | W0 | - | - | .env.example, logger, Sentry, job infrastructure" >> /Users/a12345/Desktop/AI/cleanstart/cleanstart-website/docs/partner-portal/PROGRESS.md
```

- [ ] **Step 2: Write the failing `.env.example` test**

The test keeps the example honest: a copy of it, with only the secret filled in, must be a valid environment, so an optional variable left as an empty `KEY=` line (which the schema rejects) cannot slip in. Create `apps/portal/src/env.example.test.ts`:

```ts
import { readFileSync } from 'node:fs';
import { parseEnv } from 'node:util';
import { describe, expect, it } from 'vitest';
import { loadEnv } from './env';

const example = parseEnv(readFileSync(new URL('../.env.example', import.meta.url), 'utf8'));

describe('.env.example', () => {
  it('fails until AUTH_SECRET is filled in, naming it', () => {
    expect(() => loadEnv(example)).toThrow(/AUTH_SECRET/);
  });

  it('is a valid environment once AUTH_SECRET is set, so a copy of it boots', () => {
    const env = loadEnv({ ...example, AUTH_SECRET: 'x'.repeat(32) });
    expect(env.APP_URL).toBe('http://localhost:3204');
    expect(env.PORTAL_JOBS_ENABLED).toBe(false);
  });
});
```

Run: `pnpm --filter @cleanstart/portal exec vitest run src/env.example.test.ts`

Expected: FAIL, the suite cannot load: `Error: ENOENT: no such file or directory, open '.../apps/portal/.env.example'` and `Tests  no tests`.

- [ ] **Step 3: Create `.env.example`**

Create `apps/portal/.env.example`:

```bash
# CleanStart partner portal. Copy to apps/portal/.env (never commit that file).
# Create each database with scripts/db-create.sh <name>; it prints the four URLs below.
# Required: DATABASE_URL and AUTH_SECRET. Everything else is optional outside production (an optional line
# stays commented out until you need it; an empty value is rejected). A missing service is logged and skipped (email)
# or throws IntegrationError (R2, HubSpot).

# Public origin of this app, no trailing slash. It must match the dev port of the worktree:
# portal-build 3204, portal-h 3214, portal-p 3224, portal-d 3234, portal-r 3244, portal-a 3254.
# The production container serves on 3004. Better Auth rejects its own cookies when this is wrong.
APP_URL=http://localhost:3204

# error | warn | info | debug
LOG_LEVEL=info

# Runtime database: the portal_app role (no BYPASSRLS, not the owner).
DATABASE_URL=postgresql://portal_app:portal_app_dev@localhost:5432/cleanstart_portal
# Migrations only: the portal_owner role. Required in production.
DATABASE_OWNER_URL=postgresql://portal_owner:portal_owner_dev@localhost:5432/cleanstart_portal
# Tests only. The Vitest setup clones the test database once per worker (name_w1 to name_w4).
PORTAL_TEST_DATABASE_URL=postgresql://portal_app:portal_app_dev@localhost:5432/cleanstart_portal_test
PORTAL_TEST_OWNER_URL=postgresql://portal_owner:portal_owner_dev@localhost:5432/cleanstart_portal_test

# Better Auth. At least 32 characters: openssl rand -base64 32
AUTH_SECRET=
# Optional social sign-in. Each provider is enabled only when both of its values are set.
# GOOGLE_CLIENT_ID=
# GOOGLE_CLIENT_SECRET=
# MICROSOFT_CLIENT_ID=
# MICROSOFT_CLIENT_SECRET=
MICROSOFT_TENANT_ID=common

# Partner agreement. draft-0 is the placeholder until legal supplies the text.
PARTNER_AGREEMENT_VERSION=draft-0
# PARTNER_AGREEMENT_KEY=

# Email through Brevo. Unset in development: the transport logs the subject and skips the send.
# BREVO_API_KEY=
# BREVO_SENDER_EMAIL=
# Fallback recipient for staff alerts when no partner manager covers a region.
# PARTNERS_NOTIFY_EMAIL=

# Private R2 bucket for partner documents. Unset in development: file features throw IntegrationError.
# R2_ENDPOINT=
# R2_BUCKET=
# R2_ACCESS_KEY_ID=
# R2_SECRET_ACCESS_KEY=

# HubSpot. Optional outside production: the HubSpot jobs log a warning and return when these are unset.
# HUBSPOT_PORTAL_TOKEN=
# HUBSPOT_PARTNER_PIPELINE_ID=
# Set to true only if the HubSpot capability check shows custom association labels are available.
HUBSPOT_USE_ASSOCIATION_LABELS=false
# HUBSPOT_WEBHOOK_SECRET=
# HUBSPOT_PORTAL_ID=
# HUBSPOT_DEV_PORTAL_ID=

# The job scheduler (node-cron) starts only when this is true. Set it only in the long lived container.
PORTAL_JOBS_ENABLED=false

# Website application intake: the CMS REST API as seen from the portal container, and a read-only API key.
CMS_API_URL=http://cms:3000
# CMS_INTAKE_API_KEY=

# Cloudflare Turnstile. Outside production the always-pass test keys are used when these are unset.
# TURNSTILE_SECRET_KEY=
# NEXT_PUBLIC_TURNSTILE_SITE_KEY=

# Sentry. SENTRY_DSN is the server DSN, NEXT_PUBLIC_SENTRY_DSN the browser one. Both optional.
# SENTRY_DSN=
SENTRY_ENVIRONMENT=development
# NEXT_PUBLIC_SENTRY_DSN=

# Shared password gate of the hosted review copy. Removed with the mock in M5.4.
# PORTAL_REVIEW_PASSWORD=

# Set to 1 only by `next build` (the build script does it): skips validation, nothing may read a secret at build time.
# SKIP_ENV_VALIDATION=1
```

Run: `pnpm --filter @cleanstart/portal exec vitest run src/env.example.test.ts`

Expected: PASS, `Tests  2 passed (2)`.

- [ ] **Step 4: Write the failing logger test**

Create `apps/portal/src/server/log.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { createLogger, redact } from './log';

const capture = (level: 'debug' | 'info' | 'warn' | 'error' = 'info') => {
  const lines: Array<Record<string, unknown>> = [];
  const logger = createLogger({ level, write: (line) => lines.push(JSON.parse(line) as Record<string, unknown>), now: () => new Date('2026-11-06T14:02:00Z') });
  return { lines, logger };
};

describe('logger', () => {
  it('writes one JSON line with level, time, message and fields', () => {
    const { lines, logger } = capture();
    logger.info({ action: 'registration.accept' }, 'done');
    expect(lines).toEqual([{ level: 'info', time: '2026-11-06T14:02:00.000Z', msg: 'done', action: 'registration.accept' }]);
  });

  it('drops entries below the level', () => {
    const { lines, logger } = capture('warn');
    logger.debug({}, 'a');
    logger.info({}, 'b');
    logger.warn({}, 'c');
    expect(lines.map((l) => l.msg)).toEqual(['c']);
  });

  it('redacts authorization, password, token, cookie and secret keys at any depth', () => {
    const { lines, logger } = capture();
    logger.info({ headers: { Authorization: 'Bearer abc', cookie: 'sid=1', ok: 'yes' }, user: { password: 'p', tokenHash: 'h' }, list: [{ clientSecret: 's' }] }, 'x');
    expect(lines[0]).toMatchObject({
      headers: { Authorization: '[redacted]', cookie: '[redacted]', ok: 'yes' },
      user: { password: '[redacted]', tokenHash: '[redacted]' },
      list: [{ clientSecret: '[redacted]' }],
    });
  });

  it('serialises errors with their cause and caps depth', () => {
    const error = new Error('outer', { cause: new Error('inner') });
    const out = redact(error) as { message: string; cause: { message: string } };
    expect(out.message).toBe('outer');
    expect(out.cause.message).toBe('inner');
    const nest = (levels: number): Record<string, unknown> => (levels === 0 ? {} : { next: nest(levels - 1) });
    expect(JSON.stringify(redact(nest(10)))).toContain('[truncated]');
  });
});
```

Run: `pnpm --filter @cleanstart/portal exec vitest run src/server/log.test.ts`

Expected: FAIL, `Failed to load url ./log`.

- [ ] **Step 5: Create the logger**

The contracts describe `log` as "pino style" with `log.info(obj, msg)` and redaction of `authorization`, `password`, `token` and `cookie`. `pino` is not in the handoff's package list, so this is a small logger with the same call shape (and it redacts `secret` keys too). Create `apps/portal/src/server/log.ts`:

```ts
import { env } from '@/env';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const ORDER: Record<LogLevel, number> = { debug: 10, info: 20, warn: 30, error: 40 };
const SENSITIVE_KEY = /authorization|password|token|cookie|secret/i;
const MAX_DEPTH = 6;

/** Copies `value` for logging: sensitive keys become "[redacted]", errors become plain objects, depth is capped. */
export const redact = (value: unknown, depth = 0): unknown => {
  if (value instanceof Error) {
    return {
      name: value.name,
      message: value.message,
      stack: value.stack,
      ...(value.cause === undefined ? {} : { cause: redact(value.cause, depth + 1) }),
    };
  }
  if (value instanceof Date) return value.toISOString();
  if (value === null || typeof value !== 'object') return value;
  if (depth >= MAX_DEPTH) return '[truncated]';
  if (Array.isArray(value)) return value.map((item) => redact(item, depth + 1));
  const out: Record<string, unknown> = {};
  for (const [key, item] of Object.entries(value)) {
    out[key] = SENSITIVE_KEY.test(key) ? '[redacted]' : redact(item, depth + 1);
  }
  return out;
};

export interface Logger {
  debug(fields: Record<string, unknown>, message: string): void;
  info(fields: Record<string, unknown>, message: string): void;
  warn(fields: Record<string, unknown>, message: string): void;
  error(fields: Record<string, unknown>, message: string): void;
}

export interface LoggerOptions {
  level: LogLevel;
  /** Receives one JSON line per entry. */
  write: (line: string) => void;
  now?: () => Date;
}

export const createLogger = ({ level, write, now = () => new Date() }: LoggerOptions): Logger => {
  const emit = (at: LogLevel, fields: Record<string, unknown>, message: string): void => {
    if (ORDER[at] < ORDER[level]) return;
    const body = redact(fields) as Record<string, unknown>;
    write(JSON.stringify({ level: at, time: now().toISOString(), msg: message, ...body }));
  };
  return {
    debug: (fields, message) => emit('debug', fields, message),
    info: (fields, message) => emit('info', fields, message),
    warn: (fields, message) => emit('warn', fields, message),
    error: (fields, message) => emit('error', fields, message),
  };
};

/** The process wide logger. LOG_LEVEL comes from the validated environment (undefined while the build skips validation). */
export const log: Logger = createLogger({
  level: env.LOG_LEVEL ?? 'info',
  write: (line) => process.stdout.write(`${line}\n`),
});
```

Run: `pnpm --filter @cleanstart/portal exec vitest run src/server/log.test.ts`

Expected: PASS, `Tests  4 passed (4)`.

- [ ] **Step 6: Create the Sentry configuration**

No unit test: these files only call `Sentry.init` when a DSN is set, and the build in Gate A plus the smoke test in Step 16 exercise them. The server config strips personal data from error reports the same way `apps/web` does. The client config sends nothing without `NEXT_PUBLIC_SENTRY_DSN` and never records replays.

Create `apps/portal/sentry.server.config.ts`:

```ts
import * as Sentry from '@sentry/nextjs';

const dsn = process.env.SENTRY_DSN;

// Names whose values must never leave the server inside an error report.
const REDACT_KEYS = new Set(['email', 'name', 'phone', 'password', 'token', 'tokenHash', 'authorization', 'cookie', 'ip', 'userAgent', 'turnstileToken']);

const redact = <T>(value: T): T => {
  if (!value || typeof value !== 'object') return value;
  if (Array.isArray(value)) return value.map(redact) as unknown as T;
  const out: Record<string, unknown> = {};
  for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
    out[key] = REDACT_KEYS.has(key) ? '[redacted]' : redact(item);
  }
  return out as T;
};

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.SENTRY_ENVIRONMENT ?? process.env.NODE_ENV,
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 0,
    sendDefaultPii: false,
    beforeSend: (event) => {
      if (event.request?.data) event.request.data = redact(event.request.data);
      if (event.extra) event.extra = redact(event.extra);
      return event;
    },
    beforeBreadcrumb: (breadcrumb) => {
      if (breadcrumb.data) breadcrumb.data = redact(breadcrumb.data);
      return breadcrumb;
    },
  });
}
```

Create `apps/portal/sentry.edge.config.ts`:

```ts
import * as Sentry from '@sentry/nextjs';

const dsn = process.env.SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.SENTRY_ENVIRONMENT ?? process.env.NODE_ENV,
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 0,
    sendDefaultPii: false,
  });
}
```

Create `apps/portal/sentry.client.config.ts`:

```ts
import * as Sentry from '@sentry/nextjs';

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV,
    tracesSampleRate: 0,
    // No session replays: partners' deal data must not be recorded.
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 0,
    sendDefaultPii: false,
  });
}
```

Create `apps/portal/src/instrumentation-client.ts`:

```ts
import * as Sentry from '@sentry/nextjs';
import '../sentry.client.config';

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
```

`withSentryConfig` is not used: the portal has no ad-blocker tunnel to configure and no source map upload yet, and `next.config.ts` stays untouched (a shared file). Add it later, in a task that owns `next.config.ts`, when an auth token exists.

- [ ] **Step 7: Write the failing lock test**

Every scheduled job runs under a Postgres advisory lock (session level, taken and released on one connection). Create `apps/portal/src/server/jobs/lock.test.ts`:

```ts
import { describe, expect, it, vi } from 'vitest';
import { testPool } from '@/db/test-helpers';
import { runLocked } from './lock';

const pool = testPool();

describe('runLocked', () => {
  it('runs the job and reports true', async () => {
    const fn = vi.fn().mockResolvedValue(undefined);
    expect(await runLocked(pool, 'demo', fn)).toBe(true);
    expect(fn).toHaveBeenCalledOnce();
  });

  it('skips the job while another connection holds the lock', async () => {
    const holder = await pool.connect();
    await holder.query("select pg_advisory_lock(hashtext('portal:demo'))");
    const fn = vi.fn();
    expect(await runLocked(pool, 'demo', fn)).toBe(false);
    expect(fn).not.toHaveBeenCalled();
    await holder.query("select pg_advisory_unlock(hashtext('portal:demo'))");
    holder.release();
    expect(await runLocked(pool, 'demo', vi.fn().mockResolvedValue(undefined))).toBe(true);
  });

  it('releases the lock when the job throws', async () => {
    await expect(runLocked(pool, 'demo', () => Promise.reject(new Error('boom')))).rejects.toThrow('boom');
    expect(await runLocked(pool, 'demo', vi.fn().mockResolvedValue(undefined))).toBe(true);
  });

  it('lets two different jobs run at the same time', async () => {
    let inner = false;
    const outer = await runLocked(pool, 'outer', async () => {
      inner = await runLocked(pool, 'inner', async () => undefined);
    });
    expect(outer).toBe(true);
    expect(inner).toBe(true);
  });
});
```

Run: `pnpm --filter @cleanstart/portal exec vitest run src/server/jobs/lock.test.ts`

Expected: FAIL, `Failed to load url ./lock`.

- [ ] **Step 8: Create the lock**

Create `apps/portal/src/server/jobs/lock.ts`:

```ts
import type { Pool } from 'pg';

/** Returns false without running `fn` when another connection already holds the lock for `name`. */
export const runLocked = async (pool: Pool, name: string, fn: () => Promise<void>): Promise<boolean> => {
  const key = `portal:${name}`;
  const client = await pool.connect();
  try {
    const { rows } = await client.query<{ ok: boolean }>('select pg_try_advisory_lock(hashtext($1)) as ok', [key]);
    if (!rows[0]?.ok) return false;
    try {
      await fn();
      return true;
    } finally {
      await client.query('select pg_advisory_unlock(hashtext($1))', [key]);
    }
  } finally {
    client.release();
  }
};
```

Run: `pnpm --filter @cleanstart/portal exec vitest run src/server/jobs/lock.test.ts`

Expected: PASS, `Tests  4 passed (4)`.

- [ ] **Step 9: Write the failing scheduler test**

`node-cron` and Sentry are mocked; the test pins how each job is registered (UTC, its own name, no in-process overlap), that a tick goes through the advisory lock on the system pool, and that a failing job is reported to Sentry without stopping anything. Create `apps/portal/src/server/jobs/schedule.test.ts`:

```ts
import * as Sentry from '@sentry/nextjs';
import cron from 'node-cron';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { runLocked } from './lock';
import { startScheduler } from './schedule';

vi.mock('node-cron', () => ({ default: { schedule: vi.fn(), validate: vi.fn() } }));
vi.mock('@sentry/nextjs', () => ({ captureException: vi.fn() }));
vi.mock('@/db/client', () => ({ pool: { tag: 'system-pool' } }));
vi.mock('./lock', () => ({ runLocked: vi.fn() }));

const tick = (index: number): (() => void) => {
  const call = vi.mocked(cron.schedule).mock.calls[index];
  if (!call) throw new Error(`no schedule call ${index}`);
  return call[1] as () => void;
};

describe('startScheduler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('schedules each job in UTC with its own name', () => {
    const run = vi.fn();
    startScheduler([{ name: 'demo', schedule: '*/5 * * * *', run }]);
    expect(cron.schedule).toHaveBeenCalledWith('*/5 * * * *', expect.any(Function), { timezone: 'UTC', name: 'demo', noOverlap: true });
  });

  it('runs a tick through the advisory lock on the system pool', () => {
    vi.mocked(runLocked).mockResolvedValue(true);
    const run = vi.fn();
    startScheduler([{ name: 'demo', schedule: '* * * * *', run }]);
    tick(0)();
    expect(runLocked).toHaveBeenCalledWith({ tag: 'system-pool' }, 'demo', run);
  });

  it('reports a failing job to Sentry with its name and keeps going', async () => {
    const failure = new Error('boom');
    vi.mocked(runLocked).mockRejectedValue(failure);
    startScheduler([{ name: 'demo', schedule: '* * * * *', run: vi.fn() }]);
    tick(0)();
    await vi.waitFor(() => expect(Sentry.captureException).toHaveBeenCalledWith(failure, { tags: { job: 'demo' } }));
  });
});
```

Run: `pnpm --filter @cleanstart/portal exec vitest run src/server/jobs/schedule.test.ts`

Expected: FAIL, `Failed to load url ./schedule`.

- [ ] **Step 10: Create the scheduler**

Create `apps/portal/src/server/jobs/schedule.ts`:

```ts
import * as Sentry from '@sentry/nextjs';
import cron from 'node-cron';
import { pool } from '@/db/client';
import { runLocked } from './lock';

export interface JobSpec {
  /** Also the advisory lock name: runLocked(pool, name, run). One run at a time across processes. */
  name: string;
  /** Cron expression, evaluated in UTC. */
  schedule: string;
  run: () => Promise<void>;
}

/** Registers every job with node-cron. Each tick runs under an advisory lock; a failure goes to Sentry and never stops the schedule. */
export const startScheduler = (jobs: readonly JobSpec[]): void => {
  for (const job of jobs) {
    cron.schedule(
      job.schedule,
      () => {
        runLocked(pool, job.name, job.run).catch((error: unknown) => Sentry.captureException(error, { tags: { job: job.name } }));
      },
      { timezone: 'UTC', name: job.name, noOverlap: true },
    );
  }
};
```

Run: `pnpm --filter @cleanstart/portal exec vitest run src/server/jobs/schedule.test.ts`

Expected: PASS, `Tests  3 passed (3)`.

- [ ] **Step 11: Write the failing registry test, then create the eight job stubs and the registry**

Create `apps/portal/src/server/jobs/index.test.ts`:

```ts
import cron from 'node-cron';
import { describe, expect, it } from 'vitest';
import { JOBS } from './index';

describe('JOBS', () => {
  it('lists the eight jobs of the registry with unique names', () => {
    expect(JOBS.map((job) => job.name)).toEqual([
      'hubspot-outbox', 'hubspot-poll', 'hubspot-reconcile', 'expiry', 'expiry-reminders', 'website-intake', 'document-purge', 'retention',
    ]);
    expect(new Set(JOBS.map((job) => job.name)).size).toBe(JOBS.length);
  });

  it('uses valid cron expressions and a callable run for every job', () => {
    for (const job of JOBS) {
      expect(cron.validate(job.schedule), job.name).toBe(true);
      expect(typeof job.run, job.name).toBe('function');
    }
  });
});
```

Run: `pnpm --filter @cleanstart/portal exec vitest run src/server/jobs/index.test.ts`

Expected: FAIL, `Failed to load url ./index`.

The contracts (H.17) require one module per job, each exporting an async function with an empty body that the owning track replaces, so that nobody but this task ever edits `index.ts`. Create the eight stubs with:

```bash
cd apps/portal/src/server/jobs
for spec in "hubspot-outbox:runHubspotOutbox:H4.4" "hubspot-poll:runHubspotPoll:H4.8" "reconcile:runReconcile:H4.8" "expiry:runExpiry:H4.8" "expiry-reminders:runExpiryReminders:M2.4" "intake:runIntake:M1.3b" "document-purge:runDocumentPurge:M3.2" "retention:runRetention:M5.3"; do
  IFS=: read -r file fn owner <<< "$spec"
  printf '/** Scheduled job. The body arrives with task %s; until then the schedule runs a no-op. */\nexport const %s = async (): Promise<void> => {};\n' "$owner" "$fn" > "$file.ts"
done
cd ../../../../..
cat apps/portal/src/server/jobs/expiry.ts
```

Expected for the `cat`:

```ts
/** Scheduled job. The body arrives with task H4.8; until then the schedule runs a no-op. */
export const runExpiry = async (): Promise<void> => {};
```

Create `apps/portal/src/server/jobs/index.ts`:

```ts
import { runDocumentPurge } from './document-purge';
import { runExpiry } from './expiry';
import { runExpiryReminders } from './expiry-reminders';
import { runHubspotOutbox } from './hubspot-outbox';
import { runHubspotPoll } from './hubspot-poll';
import { runIntake } from './intake';
import { runReconcile } from './reconcile';
import { runRetention } from './retention';
import type { JobSpec } from './schedule';

export const JOBS: readonly JobSpec[] = [
  { name: 'hubspot-outbox', schedule: '* * * * *', run: runHubspotOutbox },
  { name: 'hubspot-poll', schedule: '*/5 * * * *', run: runHubspotPoll },
  { name: 'hubspot-reconcile', schedule: '30 2 * * *', run: runReconcile },
  { name: 'expiry', schedule: '10 0 * * *', run: runExpiry },
  { name: 'expiry-reminders', schedule: '0 5 * * *', run: runExpiryReminders },
  { name: 'website-intake', schedule: '*/5 * * * *', run: runIntake },
  { name: 'document-purge', schedule: '20 3 * * *', run: runDocumentPurge },
  { name: 'retention', schedule: '40 3 * * *', run: runRetention },
];
```

Run: `pnpm --filter @cleanstart/portal exec vitest run src/server/jobs`

Expected: PASS, `Test Files  3 passed (3)`, `Tests  9 passed (9)`.

The owners, for the record (contracts H.17): `hubspot-outbox` H4.4, `hubspot-poll` and `reconcile` and `expiry` H4.8, `expiry-reminders` M2.4, `intake` M1.3b, `document-purge` M3.2, `retention` M5.3 (W2-e). `hubspot-poll.ts` also gains `triggerPoll` in H4.9.

- [ ] **Step 11b: Create the announce stub (contracts H.17)**

The HubSpot poll and the expiry job (H4.8) tell partners about a stage change, a changed end date or an expiry by calling `announceRegistrationChange` after the change commits. Track R owns the real body (M2.3), but H4.8 may run before R starts, so W0-c creates the file with the final types and an empty body; R replaces the body and widens `deps` to `{ db: Db; transport?: EmailTransport }`.

```bash
mkdir -p apps/portal/src/server/registrations
```

Create `apps/portal/src/server/registrations/announce.ts`:

```ts
import type { Db } from '@/db/client';

export type RegistrationChange =
  | { registrationId: string; kind: 'stage_changed'; stage: string }
  | { registrationId: string; kind: 'protection_end_changed'; protectionEnd: string }
  | { registrationId: string; kind: 'expired' };

/** Called by the HubSpot poll and the expiry job after a change commits. The body arrives with task M2.3; until then it does nothing. */
export async function announceRegistrationChange(_deps: { db: Db }, _change: RegistrationChange): Promise<void> {}
```

Run `pnpm --filter @cleanstart/portal typecheck` and `pnpm --filter @cleanstart/portal exec biome lint src/server/registrations`. Expected: both clean (biome's `noEmptyBlockStatements` is not enabled in this repo; if it is, give the body a `return;`).

- [ ] **Step 12: Write the failing instrumentation test**

Create `apps/portal/src/instrumentation.test.ts`:

```ts
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { register } from './instrumentation';

const { startScheduler, info, envLoaded } = vi.hoisted(() => ({ startScheduler: vi.fn(), info: vi.fn(), envLoaded: vi.fn() }));

vi.mock('@sentry/nextjs', () => ({ captureRequestError: vi.fn() }));
vi.mock('@/env', () => {
  envLoaded();
  return { env: {} };
});
vi.mock('../sentry.server.config', () => ({}));
vi.mock('../sentry.edge.config', () => ({}));
vi.mock('@/server/jobs/schedule', () => ({ startScheduler }));
vi.mock('@/server/jobs', () => ({ JOBS: [{ name: 'demo', schedule: '* * * * *', run: async () => undefined }] }));
vi.mock('@/server/log', () => ({ log: { info } }));

describe('register', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('validates the environment when the Node server starts, and only then', async () => {
    vi.stubEnv('NEXT_RUNTIME', 'edge');
    await register();
    expect(envLoaded).not.toHaveBeenCalled();
    vi.stubEnv('NEXT_RUNTIME', 'nodejs');
    await register();
    expect(envLoaded).toHaveBeenCalledOnce();
  });

  it('does not start the scheduler unless PORTAL_JOBS_ENABLED is true', async () => {
    vi.stubEnv('NEXT_RUNTIME', 'nodejs');
    vi.stubEnv('PORTAL_JOBS_ENABLED', 'false');
    await register();
    expect(startScheduler).not.toHaveBeenCalled();
  });

  it('starts the scheduler with the job registry on the Node runtime when enabled', async () => {
    vi.stubEnv('NEXT_RUNTIME', 'nodejs');
    vi.stubEnv('PORTAL_JOBS_ENABLED', 'true');
    await register();
    expect(startScheduler).toHaveBeenCalledOnce();
    expect(info).toHaveBeenCalledWith({ jobs: ['demo'] }, 'job scheduler started');
  });

  it('never starts jobs on the edge runtime', async () => {
    vi.stubEnv('NEXT_RUNTIME', 'edge');
    vi.stubEnv('PORTAL_JOBS_ENABLED', 'true');
    await register();
    expect(startScheduler).not.toHaveBeenCalled();
  });
});
```

Run: `pnpm --filter @cleanstart/portal exec vitest run src/instrumentation.test.ts`

Expected: FAIL, `Failed to load url ./instrumentation`.

- [ ] **Step 13: Create `src/instrumentation.ts`**

It validates the environment when the Node server starts (importing `@/env` throws a message naming every missing or invalid variable, so a production container with a missing secret never serves), registers Sentry for the Node and edge runtimes, and starts the scheduler only on the Node runtime when `PORTAL_JOBS_ENABLED` is `true` (the same gate as `PAYLOAD_AUTO_RUN` in the CMS). With a `src/` folder Next only picks the hook up from `src/instrumentation.ts`. Create `apps/portal/src/instrumentation.ts`:

```ts
import * as Sentry from '@sentry/nextjs';

export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Importing the environment validates it: a start with a missing or invalid variable stops here and names it.
    await import('@/env');
    await import('../sentry.server.config');
    // Same gate as PAYLOAD_AUTO_RUN in the CMS: tests, builds and local runs must not fire jobs by accident.
    if (process.env.PORTAL_JOBS_ENABLED === 'true') {
      const [{ startScheduler }, { JOBS }, { log }] = await Promise.all([
        import('@/server/jobs/schedule'),
        import('@/server/jobs'),
        import('@/server/log'),
      ]);
      startScheduler(JOBS);
      log.info({ jobs: JOBS.map((job) => job.name) }, 'job scheduler started');
    }
  }
  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('../sentry.edge.config');
  }
}

export const onRequestError = Sentry.captureRequestError;
```

Run: `pnpm --filter @cleanstart/portal exec vitest run src/instrumentation.test.ts`

Expected: PASS, `Tests  4 passed (4)`.

- [ ] **Step 14: Make the build skip environment validation**

The contracts (I) say a `next build` sets `SKIP_ENV_VALIDATION=1`: nothing may read a secret at build time, and the build has none. In `apps/portal/package.json` change the `build` script to:

```json
    "build": "SKIP_ENV_VALIDATION=1 next build",
```

- [ ] **Step 15: Stage and run Gate A**

```bash
git add apps/portal/.env.example apps/portal/package.json apps/portal/sentry.server.config.ts apps/portal/sentry.edge.config.ts apps/portal/sentry.client.config.ts apps/portal/src/env.example.test.ts apps/portal/src/instrumentation.ts apps/portal/src/instrumentation.test.ts apps/portal/src/instrumentation-client.ts apps/portal/src/server/log.ts apps/portal/src/server/log.test.ts apps/portal/src/server/registrations apps/portal/src/server/jobs
```

Run Gate A (lint, typecheck, test, build). At the time of writing `pnpm --filter @cleanstart/portal test` reports `Test Files  16 passed (16)` and `Tests  86 passed (86)`.

- [ ] **Step 16: Smoke test the scheduler in a production build (contracts M.1, item 14)**

It needs the production build that Gate A just made. The step proves three things the unit tests cannot: `register()` runs once in a real `next start`, it does not run during `next build`, and a production start refuses to boot without its required variables.

```bash
lsof -nP -iTCP:3204 -sTCP:LISTEN
```

Expected: no output (the port is free; if something listens on it, use another free port and never kill the process). Then:

```bash
cd apps/portal && { node_modules/.bin/next start --port 3204 > /tmp/portal-w0c-refuse.log 2>&1 & pid=$!; sleep 10; kill "$pid"; }
grep -c 'Invalid environment' /tmp/portal-w0c-refuse.log
```

Expected: `1` or more, and `/tmp/portal-w0c-refuse.log` contains `Failed to prepare server Error: An error occurred while loading instrumentation hook: Invalid environment:` followed by one line per missing variable (`BREVO_API_KEY is required in production` and so on). A production start without `BREVO_API_KEY`, `R2_*`, `HUBSPOT_*`, `TURNSTILE_*`, `SENTRY_DSN` and the rest refuses to boot (master plan Task 0.4: "the app refuses to start when a required variable is missing"). Now with everything set to dummy values:

```bash
cd apps/portal && { env PORTAL_JOBS_ENABLED=true BREVO_API_KEY=k BREVO_SENDER_EMAIL=partners@cleanstart.com R2_ENDPOINT=https://r2.example.com R2_BUCKET=b R2_ACCESS_KEY_ID=i R2_SECRET_ACCESS_KEY=s HUBSPOT_PORTAL_TOKEN=t HUBSPOT_PARTNER_PIPELINE_ID=p HUBSPOT_WEBHOOK_SECRET=w TURNSTILE_SECRET_KEY=s NEXT_PUBLIC_TURNSTILE_SITE_KEY=k SENTRY_DSN=https://abc@sentry.example.com/1 node_modules/.bin/next start --port 3204 > /tmp/portal-w0c-start.log 2>&1 & pid=$!; sleep 10; kill "$pid"; }
grep -c 'job scheduler started' /tmp/portal-w0c-start.log
grep 'job scheduler started' /tmp/portal-w0c-start.log | cut -c1-230
lsof -nP -iTCP:3204 -sTCP:LISTEN
```

Expected: `1`, then one JSON line whose `jobs` array is `["hubspot-outbox","hubspot-poll","hubspot-reconcile","expiry","expiry-reminders","website-intake","document-purge","retention"]`. The last command prints nothing (the server is stopped). The same line must not appear in the output of `next build` (check the build output of Gate A: no `job scheduler started`; it also writes no `Invalid environment`). Record the result:

```bash
printf '%s\n' "2026-11-13 00:00 IST | M0.4 | note | W0 | - | - | verified: instrumentation register runs once in next start, not in next build; scheduler starts with PORTAL_JOBS_ENABLED=true; production start refuses missing env" >> /Users/a12345/Desktop/AI/cleanstart/cleanstart-website/docs/partner-portal/PROGRESS.md
```

If `register()` runs during the build or twice at runtime, use the fallback in contracts M.1 item 14 (a small custom entry) only after writing a `blocked` line: it changes the Docker command and is task M0.6's call.

- [ ] **Step 17: Run Gate B, commit and log**

Run Gate B (the reviewer checklist) on `git diff origin/development`; fix findings and rerun Gate A and Step 16.


```bash
git add docs/superpowers/plans/2026-11-12-partner-portal-01-foundations.md
git commit -m "feat(portal): M0.4 environment example, logger, Sentry and the job infrastructure"
printf '%s\n' "2026-11-13 00:00 IST | M0.4 | done | W0 | $(git rev-parse --short HEAD) | A ok, B ok | .env.example, log, sentry, jobs lock/schedule/index and 8 stubs, instrumentation" >> /Users/a12345/Desktop/AI/cleanstart/cleanstart-website/docs/partner-portal/PROGRESS.md
```

---

### Task M1.2: Tenant isolation layer, audit and notification helpers, the isolation matrix (W0-d)

**Files:**
- Create: `apps/portal/src/server/errors.ts` (+ test), `src/server/rate-limit.ts` (+ test), `src/server/repo/isolation.registry.ts`, `src/server/repo/context.ts` (+ `context.test.ts`), `src/server/actions/result.ts` (+ test), `src/server/audit/record.ts` (+ test), `src/server/notify.ts` (+ test), `src/server/repo/imports.test.ts`, `src/server/repo/isolation.test.ts`
- Modify: `apps/portal/src/db/test-helpers.ts` (append `seedTwoTenants`)
- Already in place from M0.3: `src/server/audit/events.ts`, `src/server/auth/types.ts`, `src/db/rls.sql`

**Gate A at the end:** all four commands run.

This task is what makes tenant isolation checkable: after it, a repo module that exports a function nobody registered in the matrix fails the build, and a partner can never read another partner's rows even through a repo bug, because row level security answers first. Everything after this adds its repo functions to the matrix.

- [ ] **Step 1: Log the start**

```bash
printf '%s\n' "2026-11-13 00:00 IST | M1.2 | started | W0 | - | - | errors, context, audit, notify, isolation matrix" >> /Users/a12345/Desktop/AI/cleanstart/cleanstart-website/docs/partner-portal/PROGRESS.md
```

- [ ] **Step 2: Write the failing errors test**

Create `apps/portal/src/server/errors.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import {
  ConflictError,
  DependencyPending,
  describeError,
  ForbiddenError,
  IntegrationError,
  isPortalError,
  NotFoundError,
  PortalError,
  RateLimitError,
  UnauthenticatedError,
  ValidationError,
} from './errors';

describe('error hierarchy', () => {
  it('carries a code, an http status and a safe message on every class', () => {
    const cases: Array<[PortalError, string, number]> = [
      [new ValidationError([{ path: 'email', message: 'Bad' }]), 'validation', 400],
      [new UnauthenticatedError(), 'unauthenticated', 401],
      [new ForbiddenError('partner.sales may not audit.read'), 'forbidden', 403],
      [new NotFoundError('registration'), 'not_found', 404],
      [new ConflictError('already_decided', 'Already decided.'), 'conflict', 409],
      [new RateLimitError(30), 'rate_limited', 429],
      [new IntegrationError('brevo', 'timeout', { status: 504 }), 'integration', 502],
      [new DependencyPending('company not synced'), 'dependency_pending', 503],
    ];
    for (const [error, code, status] of cases) {
      expect(error.code).toBe(code);
      expect(error.httpStatus).toBe(status);
      expect(error).toBeInstanceOf(PortalError);
      expect(isPortalError(error)).toBe(true);
    }
  });

  it('never puts the internal message into the safe message', () => {
    const forbidden = new ForbiddenError('partner.sales may not audit.read');
    expect(forbidden.message).toBe('partner.sales may not audit.read');
    expect(forbidden.safeMessage).toBe('You do not have access to this.');
    const integration = new IntegrationError('r2', 'bucket cleanstart-partner-docs denied');
    expect(integration.safeMessage).not.toContain('r2');
    expect(integration.upstreamStatus).toBeNull();
  });

  it('describes a validation error with its issues and a rate limit with its retry time', () => {
    const validation = describeError(new ValidationError([{ path: 'contacts.0.email', message: 'Enter an email.' }]));
    expect(validation).toEqual({ code: 'validation', message: 'Check the highlighted fields.', issues: [{ path: 'contacts.0.email', message: 'Enter an email.' }] });
    expect(describeError(new RateLimitError(12))).toMatchObject({ code: 'rate_limited', retryAfterSeconds: 12 });
  });

  it('turns an unknown error into a generic internal message', () => {
    expect(describeError(new Error('connection string postgres://secret'))).toEqual({
      code: 'internal',
      message: 'Something went wrong on our side. Try again.',
    });
    expect(isPortalError(new Error('x'))).toBe(false);
  });

  it('keeps the conflict reason and the not found resource', () => {
    expect(new ConflictError('last_admin', 'x').reason).toBe('last_admin');
    expect(new NotFoundError('document').resource).toBe('document');
  });
});
```

Run: `pnpm --filter @cleanstart/portal exec vitest run src/server/errors.test.ts`

Expected: FAIL, `Failed to load url ./errors`.

- [ ] **Step 3: Create the error hierarchy**

```bash
bash apps/portal/scripts/contract-block.sh "## E. Errors" 1 > apps/portal/src/server/errors.ts
pnpm --filter @cleanstart/portal exec vitest run src/server/errors.test.ts
```

Expected: PASS, `Tests  5 passed (5)`. (There is no `AppError` alias: CLAUDE.md names one, but the portal uses `PortalError`; contracts M.3 decision 4.)

- [ ] **Step 4: Write the failing rate limit test**

Create `apps/portal/src/server/rate-limit.test.ts`:

```ts
import { beforeEach, describe, expect, it } from 'vitest';
import { fixedClock } from '@/lib/clock';
import { RateLimitError } from '@/server/errors';
import { rateLimit, resetRateLimits } from './rate-limit';

const rule = { limit: 3, windowSeconds: 60 };

describe('rateLimit', () => {
  beforeEach(resetRateLimits);

  it('allows `limit` calls in a window and then throws with the seconds left', () => {
    const at = fixedClock('2026-11-06T14:00:00Z');
    for (let i = 0; i < 3; i += 1) rateLimit('apply:ip:1.1.1.1', rule, at);
    try {
      rateLimit('apply:ip:1.1.1.1', rule, fixedClock('2026-11-06T14:00:20Z'));
      expect.unreachable('should have thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(RateLimitError);
      expect((error as RateLimitError).retryAfterSeconds).toBe(40);
    }
  });

  it('starts a new window once the old one has passed', () => {
    for (let i = 0; i < 3; i += 1) rateLimit('k', rule, fixedClock('2026-11-06T14:00:00Z'));
    expect(() => rateLimit('k', rule, fixedClock('2026-11-06T14:01:00Z'))).not.toThrow();
  });

  it('counts each key on its own', () => {
    const at = fixedClock('2026-11-06T14:00:00Z');
    for (let i = 0; i < 3; i += 1) rateLimit('a', rule, at);
    expect(() => rateLimit('b', rule, at)).not.toThrow();
  });
});
```

Run: `pnpm --filter @cleanstart/portal exec vitest run src/server/rate-limit.test.ts`

Expected: FAIL, `Failed to load url ./rate-limit`.

- [ ] **Step 5: Create the rate limiter**

The contracts' signature is `rateLimit(key, rule): void`; the optional third argument is the clock, so the test needs no fake timers (handoff amendment 6). Create `apps/portal/src/server/rate-limit.ts`:

```ts
import { type Clock, systemClock } from '@/lib/clock';
import { RateLimitError } from '@/server/errors';

export interface RateRule {
  limit: number;
  windowSeconds: number;
}

interface Bucket {
  count: number;
  resetAtMs: number;
}

const buckets = new Map<string, Bucket>();
const SWEEP_ABOVE = 10_000;

/**
 * In process fixed window counter (one container, decision 14). Throws RateLimitError with the seconds left in the
 * window once `rule.limit` calls have been made in it. Keys are namespaced: "apply:ip:<ip>", "lookup:user:<id>".
 * shortcut: counters live in memory and reset on restart; move to a Postgres table if the portal runs more than one instance.
 */
export function rateLimit(key: string, rule: RateRule, clock: Clock = systemClock): void {
  const nowMs = clock.now().getTime();
  if (buckets.size > SWEEP_ABOVE) {
    for (const [name, bucket] of buckets) if (bucket.resetAtMs <= nowMs) buckets.delete(name);
  }
  const current = buckets.get(key);
  if (!current || current.resetAtMs <= nowMs) {
    buckets.set(key, { count: 1, resetAtMs: nowMs + rule.windowSeconds * 1000 });
    return;
  }
  if (current.count >= rule.limit) throw new RateLimitError(Math.max(1, Math.ceil((current.resetAtMs - nowMs) / 1000)));
  current.count += 1;
}

/** Tests only: forget every counter. */
export function resetRateLimits(): void {
  buckets.clear();
}
```

Run: `pnpm --filter @cleanstart/portal exec vitest run src/server/rate-limit.test.ts`

Expected: PASS, `Tests  3 passed (3)`.

- [ ] **Step 6: Write the failing tests for the repository context and the action result**

Create `apps/portal/src/server/repo/context.test.ts`:

```ts
import { sql } from 'drizzle-orm';
import { beforeAll, describe, expect, it } from 'vitest';
import { appDb } from '@/db/client';
import { resetDb, seedTwoTenants, testDb } from '@/db/test-helpers';
import { SYSTEM_ACTORS } from '@/server/auth/types';
import type { IsolationContext } from './isolation.registry';
import { assertStaff, withSystem, withViewer } from './context';
import { ForbiddenError } from '@/server/errors';

describe('withViewer and withSystem', () => {
  let ctx: IsolationContext;
  beforeAll(async () => {
    await resetDb();
    ctx = await seedTwoTenants(testDb());
  });

  it('sets the three identity settings for the length of the transaction', async () => {
    const seen = await withViewer(ctx.a.viewer, async (tx) => {
      const rows = await tx.execute(sql`select app_kind() as kind, app_partner_id() as partner, app_user_id() as usr`);
      return rows.rows[0];
    });
    expect(seen).toEqual({ kind: 'partner', partner: ctx.a.partnerId, usr: ctx.a.viewer.id });
  });

  it('does not leak one request identity into the next on a pooled connection', async () => {
    await withViewer(ctx.a.viewer, async (tx) => void (await tx.execute(sql`select 1`)));
    const after = await appDb.execute(sql`select app_kind() as kind, app_partner_id() as partner`);
    expect(after.rows[0]).toEqual({ kind: 'none', partner: null });
    const staffSees = await withViewer(ctx.staff, async (tx) => (await tx.execute(sql`select count(*)::int as n from registrations`)).rows[0]);
    expect(staffSees).toEqual({ n: 2 });
  });

  it('rolls back everything when the callback throws', async () => {
    await expect(
      withViewer(ctx.staff, async (tx) => {
        await tx.execute(sql`update partners set name = 'Changed' where id = ${ctx.a.partnerId}`);
        throw new Error('boom');
      }),
    ).rejects.toThrow('boom');
    const name = await withSystem(SYSTEM_ACTORS.portal, async (tx) => (await tx.execute(sql`select name from partners where id = ${ctx.a.partnerId}`)).rows[0]);
    expect(name).toEqual({ name: 'Alpha' });
  });

  it('runs withSystem with system scope and no partner', async () => {
    const seen = await withSystem(SYSTEM_ACTORS.hubspot, async (tx) => (await tx.execute(sql`select app_kind() as kind, app_partner_id() as partner`)).rows[0]);
    expect(seen).toEqual({ kind: 'system', partner: null });
  });

  it('assertStaff passes staff and throws ForbiddenError for a partner', () => {
    expect(() => assertStaff(ctx.staff)).not.toThrow();
    expect(() => assertStaff(ctx.a.viewer)).toThrow(ForbiddenError);
  });
});
```

Create `apps/portal/src/server/actions/result.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { fail, issuesToErrors, ok } from './result';

describe('ActionResult helpers', () => {
  it('wraps data and errors', () => {
    expect(ok(5)).toEqual({ ok: true, data: 5 });
    expect(fail({ code: 'conflict', message: 'No.' })).toEqual({ ok: false, error: { code: 'conflict', message: 'No.' } });
  });

  it('maps issues to a field to message record', () => {
    expect(
      issuesToErrors({ code: 'validation', message: 'x', issues: [{ path: 'email', message: 'Bad' }, { path: 'phone', message: 'Short' }] }),
    ).toEqual({ email: 'Bad', phone: 'Short' });
    expect(issuesToErrors({ code: 'internal', message: 'x' })).toEqual({});
  });
});
```

Run: `pnpm --filter @cleanstart/portal exec vitest run src/server/repo/context.test.ts src/server/actions/result.test.ts`

Expected: FAIL, `Failed to load url ./context` and `Failed to load url ./result`.

- [ ] **Step 7: Create the isolation registry types, `seedTwoTenants`, the context and the result helpers**

The registry file is types and one identity function, copied from the contracts:

```bash
bash apps/portal/scripts/contract-block.sh "### F.6 " 1 > apps/portal/src/server/repo/isolation.registry.ts
bash apps/portal/scripts/contract-block.sh "### F.1 " 1 > apps/portal/src/server/repo/context.ts
bash apps/portal/scripts/contract-block.sh "### F.7 " 1 > apps/portal/src/server/actions/result.ts
```

Append `seedTwoTenants` to `apps/portal/src/db/test-helpers.ts`. Three edits to that file:

(a) In the import from `'@/db/schema'`, add the names `auditLog`, `documentOpens` and `registrationMessages`.

(b) Under the line `import type { PartnerViewer, StaffViewer, Viewer } from '@/server/auth/types';` add:

```ts
import type { IsolationContext, TenantFixture } from '@/server/repo/isolation.registry';
```

(c) Append this to the end of the file (a blank line first):

```ts
const seedTenant = async (database: Db, name: string): Promise<TenantFixture> => {
  const partner = await makePartner(database, { name });
  const admin = await makeUser(database, { partnerId: partner.id, role: 'partner_admin', name: `${name} Admin` });
  const sales = await makeUser(database, { partnerId: partner.id, role: 'sales', name: `${name} Sales` });
  const adminViewer = await viewerFor(database, admin);
  const salesViewer = await viewerFor(database, sales);
  if (adminViewer.kind !== 'partner' || salesViewer.kind !== 'partner') throw new Error('test helper: tenant users must be partner users');
  const registration = await makeRegistration(database, {
    partnerId: partner.id,
    customerName: `${name} Customer`,
    registeredBy: sales.id,
    contacts: [{ name: `${name} Contact`, email: `contact@${partner.domain}` }],
  });
  const contact = first(await database.select({ id: registrationContacts.id }).from(registrationContacts).where(eq(registrationContacts.registrationId, registration.id)), 'contact');
  const message = first(
    await database
      .insert(registrationMessages)
      .values({ registrationId: registration.id, authorId: sales.id, authorName: sales.name, authorOrg: name, side: 'partner', body: `Note from ${name}` })
      .returning({ id: registrationMessages.id }),
    'message',
  );
  const { invite } = await makeInvite(database, { partnerId: partner.id, role: 'sales' });
  const request = await makeAccessRequest(database, { partnerId: partner.id });
  const document = await makeDocument(database, { title: `${name} only`, partnerIds: [partner.id] });
  const open = first(
    await database
      .insert(documentOpens)
      .values({ documentId: document.id, userId: sales.id, partnerId: partner.id })
      .returning({ id: documentOpens.id }),
    'document open',
  );
  return {
    partnerId: partner.id,
    viewer: adminViewer,
    adminViewer,
    salesViewer,
    userId: sales.id,
    registrationId: registration.id,
    messageId: message.id,
    contactId: contact.id,
    inviteId: invite.id,
    accessRequestId: request.id,
    documentId: document.id,
    openId: open.id,
  };
};

/**
 * Partners A and B, each with an admin, a sales user (userId is the sales user, the "other user of the same partner"
 * for own-user probes), a registration with a message and a contact, an invite, an access request, a document named
 * to that partner only and an open of it; plus a staff partner manager, an application and an audit row.
 * `documentForBOnly` is B's document.
 */
export async function seedTwoTenants(database: Db): Promise<IsolationContext> {
  const a = await seedTenant(database, 'Alpha');
  const b = await seedTenant(database, 'Beta');
  const staff = await asStaff(database, 'partner_manager', 'all');
  const application = await makeApplication(database, {});
  const audit = first(
    await database
      .insert(auditLog)
      .values({ actorLabel: 'Seed', who: 'staff', kind: 'partners', event: 'partner.created', text: 'Added partner: Alpha', partnerId: a.partnerId })
      .returning({ id: auditLog.id }),
    'audit row',
  );
  return {
    a,
    b,
    staff,
    documentForBOnly: b.documentId,
    applicationId: application.id,
    staffUserId: staff.id,
    auditId: audit.id,
  };
}
```

Run: `pnpm --filter @cleanstart/portal exec vitest run src/server/repo/context.test.ts src/server/actions/result.test.ts`

Expected: PASS, `Test Files  2 passed (2)`, `Tests  7 passed (7)`. The context test proves the three settings are transaction local, that a pooled connection carries nothing into the next request (`app_kind()` is `none` outside a transaction on the request pool), and that a thrown callback rolls everything back. This is contracts M.1 item 1 (`set_config` in a transaction); record it at the end of the task.

- [ ] **Step 8: Write the failing audit test, then create `record.ts`**

Create `apps/portal/src/server/audit/record.test.ts`:

```ts
import { desc } from 'drizzle-orm';
import { beforeEach, describe, expect, it } from 'vitest';
import { auditLog } from '@/db/schema';
import { asPartner, asStaff, makePartner, resetDb, testDb } from '@/db/test-helpers';
import { SYSTEM_ACTORS } from '@/server/auth/types';
import { withSystem, withViewer } from '@/server/repo/context';
import { AUDIT_EVENT_NAMES, AUDIT_EVENTS } from './events';
import { recordAudit } from './record';

const latest = async () => {
  const rows = await withSystem(SYSTEM_ACTORS.portal, (tx) => tx.select().from(auditLog).orderBy(desc(auditLog.at)).limit(1));
  const row = rows[0];
  if (!row) throw new Error('no audit row');
  return row;
};

describe('recordAudit', () => {
  beforeEach(async () => {
    await resetDb();
  });

  it('writes a staff entry with the role label and the event vocabulary', async () => {
    const staff = await asStaff(testDb(), 'partner_manager', 'india');
    const partner = await makePartner(testDb(), { name: 'Kestrel Systems' });
    await withViewer(staff, (tx) =>
      recordAudit(tx, staff, {
        event: 'registration.accepted',
        target: 'Vardhan Capital, CleanSight, from Kestrel Systems',
        note: 'Protected until 2027-01-12.',
        partnerId: partner.id,
        subject: { type: 'registration', id: 'r1' },
      }),
    );
    const row = await latest();
    expect(row).toMatchObject({
      actorId: staff.id,
      actorLabel: staff.name,
      actorRole: 'Partner manager',
      who: 'staff',
      kind: 'deal_decisions',
      event: 'registration.accepted',
      action: 'Accepted a registration',
      target: 'Vardhan Capital, CleanSight, from Kestrel Systems',
      text: 'Accepted a registration: Vardhan Capital, CleanSight, from Kestrel Systems',
      source: 'portal',
      note: 'Protected until 2027-01-12.',
      partnerId: partner.id,
      subjectType: 'registration',
      subjectId: 'r1',
    });
  });

  it('writes a partner entry inside the partner transaction even though the partner cannot read audit_log', async () => {
    const partner = await asPartner(testDb(), { role: 'partner_admin' });
    await withViewer(partner, (tx) => recordAudit(tx, partner, { event: 'team.invited', target: 'Vikram Sethi, sales' }));
    const row = await latest();
    expect(row).toMatchObject({ who: 'partner', kind: 'people_access', actorRole: `${partner.partnerName}, partner admin` });
  });

  it('marks system actors as sync and the HubSpot sync as source system unless told otherwise', async () => {
    await withSystem(SYSTEM_ACTORS.hubspot, (tx) =>
      recordAudit(tx, SYSTEM_ACTORS.hubspot, { event: 'registration.stage_changed', target: 'Vardhan Capital', source: 'crm' }),
    );
    expect(await latest()).toMatchObject({ actorId: null, actorLabel: 'HubSpot sync', who: 'sync', source: 'crm' });
    await withSystem(SYSTEM_ACTORS.portal, (tx) => recordAudit(tx, SYSTEM_ACTORS.portal, { event: 'registration.expired', target: 'Acme' }));
    expect(await latest()).toMatchObject({ who: 'sync', source: 'system' });
  });

  it('has an action text and a kind for every event name', () => {
    expect(AUDIT_EVENT_NAMES.length).toBeGreaterThan(40);
    for (const name of AUDIT_EVENT_NAMES) {
      expect(AUDIT_EVENTS[name].action.length).toBeGreaterThan(3);
    }
  });
});
```

Run: `pnpm --filter @cleanstart/portal exec vitest run src/server/audit/record.test.ts`

Expected: FAIL, `Failed to load url ./record` (the closed vocabulary `events.ts` is already there from M0.3).

```bash
bash apps/portal/scripts/contract-block.sh "### F.4 " 2 > apps/portal/src/server/audit/record.ts
pnpm --filter @cleanstart/portal exec vitest run src/server/audit/record.test.ts
```

Expected: PASS, `Tests  4 passed (4)`. The partner case matters: a partner transaction inserts an audit row even though the partner cannot read `audit_log` (insert is allowed for every identity, select is staff only), which is why `recordAudit` never uses `.returning()`.

- [ ] **Step 9: Write the failing notification test, then create `notify.ts`**

Create `apps/portal/src/server/notify.test.ts`:

```ts
import { beforeEach, describe, expect, it } from 'vitest';
import { notificationPrefs, notifications } from '@/db/schema';
import { asPartner, asStaff, makeUser, resetDb, testDb } from '@/db/test-helpers';
import { SYSTEM_ACTORS } from '@/server/auth/types';
import { withSystem, withViewer } from '@/server/repo/context';
import { NOTIFICATION_PREF_DEFAULTS, notifyUsers, resolveEmailRecipients, type NewNotification } from './notify';

describe('notifications', () => {
  beforeEach(async () => {
    await resetDb();
  });

  it('inserts in-app rows for another user without needing to read them back', async () => {
    const staff = await asStaff(testDb());
    const partner = await asPartner(testDb());
    await withViewer(partner, (tx) =>
      notifyUsers(tx, [{ userId: staff.id, kind: 'registration_submitted', title: 'New registration', link: '/admin/approvals' }]),
    );
    const rows = await withSystem(SYSTEM_ACTORS.portal, (tx) => tx.select().from(notifications));
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ userId: staff.id, kind: 'registration_submitted', title: 'New registration', body: null, link: '/admin/approvals', readAt: null });
  });

  it('does nothing for an empty list', async () => {
    await withSystem(SYSTEM_ACTORS.portal, (tx) => notifyUsers(tx, []));
    expect(await resolveEmailRecipients([])).toEqual([]);
  });

  it('applies the defaults, the stored switches, the disabled flag and the always-email staff kinds', async () => {
    const db = testDb();
    const on = await makeUser(db, {});
    const off = await makeUser(db, {});
    const gone = await makeUser(db, { status: 'disabled' });
    const staff = await makeUser(db, { kind: 'staff' });
    await db.insert(notificationPrefs).values({ userId: off.id, category: 'decision', email: false });
    const item = (userId: string, kind: NewNotification['kind']): NewNotification => ({ userId, kind, title: 't' });
    const recipients = await resolveEmailRecipients([
      item(on.id, 'registration_accepted'),
      item(off.id, 'registration_accepted'),
      item(gone.id, 'registration_accepted'),
      item(on.id, 'document_new'),
      item(staff.id, 'registration_submitted'),
    ]);
    expect(recipients.map((r) => `${r.userId}:${r.kind}`).sort()).toEqual([`${on.id}:registration_accepted`, `${staff.id}:registration_submitted`].sort());
    expect(NOTIFICATION_PREF_DEFAULTS.docs).toBe(false);
  });
});
```

Run: `pnpm --filter @cleanstart/portal exec vitest run src/server/notify.test.ts`

Expected: FAIL, `Failed to load url ./notify`.

```bash
bash apps/portal/scripts/contract-block.sh "### F.5 " 1 > apps/portal/src/server/notify.ts
pnpm --filter @cleanstart/portal exec vitest run src/server/notify.test.ts
```

Expected: PASS, `Tests  3 passed (3)`.

- [ ] **Step 10: Write the import rules test and prove it bites**

The rule (contracts F.1): only `src/server/repo/context.ts` may import `appDb` from `@/db/client`, and nothing under `src/server/repo/**` or `src/server/actions/**` may import `db`, `systemDb` or `pool` as a value. Test files are exempt (the context test needs `appDb` to prove that identities do not leak). Create `apps/portal/src/server/repo/imports.test.ts`:

```ts
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { describe, expect, it } from 'vitest';

const SRC = join(__dirname, '..', '..');

const walk = (dir: string): string[] =>
  readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry);
    return statSync(full).isDirectory() ? walk(full) : [full];
  });

/** Names imported as values (not `import type`, not `type X` specifiers) from '@/db/client' in one file. */
const clientValueImports = (source: string): string[] => {
  const names: string[] = [];
  for (const match of source.matchAll(/import\s+(type\s+)?\{([^}]*)\}\s+from\s+['"]@\/db\/client['"]/g)) {
    if (match[1]) continue;
    for (const part of (match[2] ?? '').split(',')) {
      const trimmed = part.trim();
      if (!trimmed || trimmed.startsWith('type ')) continue;
      names.push((trimmed.split(/\s+as\s+/)[0] ?? '').trim());
    }
  }
  return names;
};

const files = walk(SRC).filter((file) => /\.tsx?$/.test(file));
const rel = (file: string): string => relative(SRC, file).split(sep).join('/');

describe('database client import rules', () => {
  it('detects value imports and ignores type imports', () => {
    expect(clientValueImports("import { db, type Db, pool as p } from '@/db/client';")).toEqual(['db', 'pool']);
    expect(clientValueImports("import type { Db } from '@/db/client';")).toEqual([]);
    expect(clientValueImports("import { appDb } from '@/db/client'")).toEqual(['appDb']);
  });

  it('lets only server/repo/context.ts (and test files) import appDb', () => {
    const offenders = files
      .filter((file) => rel(file) !== 'server/repo/context.ts' && !/\.test\.tsx?$/.test(file))
      .filter((file) => clientValueImports(readFileSync(file, 'utf8')).includes('appDb'))
      .map(rel);
    expect(offenders).toEqual([]);
  });

  it('keeps db, systemDb and pool out of repo and action code (tests excepted)', () => {
    const offenders = files
      .filter((file) => /^server\/(repo|actions)\//.test(rel(file)))
      .filter((file) => rel(file) !== 'server/repo/context.ts' && !/\.test\.tsx?$/.test(file))
      .filter((file) => clientValueImports(readFileSync(file, 'utf8')).some((name) => ['db', 'systemDb', 'pool'].includes(name)))
      .map(rel);
    expect(offenders).toEqual([]);
  });
});
```

Run: `pnpm --filter @cleanstart/portal exec vitest run src/server/repo/imports.test.ts`

Expected: PASS, `Tests  3 passed (3)` (this test guards code that does not exist yet).

Now break the rule twice and watch the test fail:

```bash
printf "import { appDb } from '@/db/client';\nexport const bad = appDb;\n" > apps/portal/src/server/actions/zz-bad-action.ts
printf "import { db } from '@/db/client';\nexport const worse = db;\n" > apps/portal/src/server/repo/zz-bad-repo.ts
pnpm --filter @cleanstart/portal exec vitest run src/server/repo/imports.test.ts
```

Expected: FAIL in two tests. `lets only server/repo/context.ts (and test files) import appDb` shows `server/actions/zz-bad-action.ts` in the received array; `keeps db, systemDb and pool out of repo and action code (tests excepted)` shows `server/repo/zz-bad-repo.ts`. Then remove both files:

```bash
rm apps/portal/src/server/actions/zz-bad-action.ts apps/portal/src/server/repo/zz-bad-repo.ts
pnpm --filter @cleanstart/portal exec vitest run src/server/repo/imports.test.ts
```

Expected: PASS again.

- [ ] **Step 11: Write the isolation matrix test (it fails until `seedTwoTenants` exists, which Step 7 did; so first prove it fails for the right reason)**

This is the contracts' F.6 test with three edits: it imports `sql` from `drizzle-orm`; the repo modules are loaded by absolute path with `@vite-ignore` (Vite warns about a variable import inside the file's own directory); and it has a first test that seeds two tenants and asserts, through `withViewer`, that every partner scoped table shows each partner only its own rows, so the file has a real test even before the first repo module exists. Create `apps/portal/src/server/repo/isolation.test.ts`:

```ts
// src/server/repo/isolation.test.ts  (W0-d, M1.2; every later repo module is picked up automatically)
import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { sql } from 'drizzle-orm';
import { beforeAll, describe, expect, it } from 'vitest';
import { NotFoundError, ForbiddenError } from '@/server/errors';
import { resetDb, seedTwoTenants, testDb } from '@/db/test-helpers';
import { withViewer } from './context';
import type { IsolationContext, IsolationEntry } from './isolation.registry';

const REPO_DIR = join(__dirname);
const NOT_REPO = new Set(['context', 'isolation.registry', 'isolation', 'imports']);

const files = readdirSync(REPO_DIR)
  .filter((f) => f.endsWith('.ts') && !f.endsWith('.test.ts'))
  .map((f) => f.replace(/\.ts$/, ''))
  .filter((name) => !NOT_REPO.has(name));

/** Absolute path and @vite-ignore: Vite cannot analyse a variable import inside its own directory. */
const loadRepoModule = (name: string): Promise<unknown> => import(/* @vite-ignore */ join(REPO_DIR, `${name}.ts`));

const isEmptyResult = (value: unknown): boolean => {
  if (value === null || value === undefined || value === 0) return true;
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') return Object.values(value as Record<string, unknown>).every(isEmptyResult);
  return false;
};

describe('repo isolation matrix', () => {
  let ctx: IsolationContext;
  beforeAll(async () => {
    await resetDb(testDb());
    ctx = await seedTwoTenants(testDb());
  });

  it('seeds two tenants that cannot see each other through withViewer', async () => {
    for (const [mine, theirs] of [[ctx.a, ctx.b], [ctx.b, ctx.a]] as const) {
      const seen = await withViewer(mine.viewer, async (tx) => {
        const rows = await tx.execute(sql`select partner_id from registrations union all select partner_id from registration_messages union all select partner_id from registration_contacts union all select partner_id from registration_events union all select partner_id from document_opens union all select partner_id from access_requests`);
        return rows.rows.map((row) => row.partner_id);
      });
      expect(seen.length).toBeGreaterThan(0);
      expect(seen.every((partnerId) => partnerId === mine.partnerId)).toBe(true);
      expect(seen).not.toContain(theirs.partnerId);
    }
  });

  for (const name of files) {
    describe(name, () => {
      it('registers every exported function in `isolation`', async () => {
        const mod = (await loadRepoModule(name)) as Record<string, unknown>;
        const registry = mod.isolation as Record<string, IsolationEntry> | undefined;
        expect(registry, `${name}.ts must export \`isolation\``).toBeDefined();
        const exported = Object.entries(mod)
          .filter(([key, value]) => key !== 'isolation' && typeof value === 'function')
          .map(([key]) => key)
          .sort();
        expect(Object.keys(registry ?? {}).sort()).toEqual(exported);
      });

      it('leaks nothing across tenants', async () => {
        const mod = (await loadRepoModule(name)) as Record<string, unknown>;
        const registry = (mod.isolation ?? {}) as Record<string, IsolationEntry>;
        for (const [fnName, entry] of Object.entries(registry)) {
          if (entry.scope === 'public' || entry.scope === 'exempt') continue;
          const outcome = await withViewer(ctx.a.viewer, async (tx) => {
            try {
              const result = entry.scope === 'rls-only' ? await entry.probe(tx, ctx) : await entry.probe(tx, ctx.a.viewer, ctx);
              return { ok: true as const, result };
            } catch (error) {
              return { ok: false as const, error };
            }
          });
          const label = `${name}.${fnName}`;
          if (entry.scope === 'rls-only') {
            expect(outcome.ok, label).toBe(true);
            if (outcome.ok) entry.check(outcome.result);
            continue;
          }
          if (entry.expect === 'empty') expect(outcome.ok && isEmptyResult(outcome.result), label).toBe(true);
          else if (entry.expect === 'not_found') expect(!outcome.ok && outcome.error instanceof NotFoundError, label).toBe(true);
          else if (entry.expect === 'forbidden') expect(!outcome.ok && outcome.error instanceof ForbiddenError, label).toBe(true);
          else expect(outcome.ok, label).toBe(true);
        }
      });
    });
  }
});
```

Run: `pnpm --filter @cleanstart/portal exec vitest run src/server/repo/isolation.test.ts`

Expected: PASS, `Tests  1 passed (1)`: `seeds two tenants that cannot see each other through withViewer`. (The two per-module tests are generated per repo file; there are none yet.)

- [ ] **Step 12: Prove the matrix catches a missing registration and a leak**

Create a throwaway repo module that registers its one function correctly:

```bash
cat > apps/portal/src/server/repo/zz-probe.ts <<'ZZ_EOF'
import { eq } from 'drizzle-orm';
import { registrations } from '@/db/schema';
import type { Viewer } from '@/server/auth/types';
import type { Tx } from './context';
import { defineIsolation } from './isolation.registry';

export const findRegistration = async (tx: Tx, _viewer: Viewer, id: string) =>
  tx.select({ id: registrations.id }).from(registrations).where(eq(registrations.id, id));

export const isolation = defineIsolation<'findRegistration'>({
  findRegistration: {
    scope: 'tenant',
    probe: (tx, viewer, ctx) => findRegistration(tx, viewer, ctx.b.registrationId),
    expect: 'empty',
  },
});
ZZ_EOF
pnpm --filter @cleanstart/portal exec vitest run src/server/repo/isolation.test.ts
```

Expected: PASS, `Tests  3 passed (3)`: the two generated tests for `zz-probe` pass because row level security hides partner B's registration from partner A.

Add an export nobody registered:

```bash
printf '\nexport const unregistered = async (): Promise<number> => 1;\n' >> apps/portal/src/server/repo/zz-probe.ts
pnpm --filter @cleanstart/portal exec vitest run src/server/repo/isolation.test.ts
```

Expected: FAIL, `repo isolation matrix > zz-probe > registers every exported function in \`isolation\``, with `expected [ 'findRegistration' ] to deeply equal [ 'findRegistration', 'unregistered' ]`.

Now make the probe leak by passing partner A's own id instead of B's, which the matrix must reject:

```bash
sed -i '' "s/ctx.b.registrationId/ctx.a.registrationId/; /^export const unregistered/d" apps/portal/src/server/repo/zz-probe.ts
pnpm --filter @cleanstart/portal exec vitest run src/server/repo/isolation.test.ts
```

Expected: FAIL, `repo isolation matrix > zz-probe > leaks nothing across tenants` with `AssertionError: zz-probe.findRegistration: expected false to be true` (the probe returned a row, so its result was not empty). Remove the probe and confirm green:

```bash
rm apps/portal/src/server/repo/zz-probe.ts
pnpm --filter @cleanstart/portal exec vitest run src/server/repo/isolation.test.ts
```

Expected: PASS, `Tests  1 passed (1)`.

- [ ] **Step 13: Record the verification and run the whole suite**

```bash
printf '%s\n' "2026-11-13 00:00 IST | M1.2 | note | W0 | - | - | verified: withViewer set_config is transaction local and never leaks across a pooled connection; matrix fails on an unregistered export and on a leak; import rules fail on appDb/db in repo and actions" >> /Users/a12345/Desktop/AI/cleanstart/cleanstart-website/docs/partner-portal/PROGRESS.md
pnpm --filter @cleanstart/portal test
```

Expected: PASS, no Vite warning about `dynamic-import-vars`. At the time of writing: `Test Files  24 passed (24)`, `Tests  112 passed (112)`.

- [ ] **Step 14: Stage, run Gate A, run Gate B**

```bash
git add apps/portal/src/server apps/portal/src/db/test-helpers.ts
git status --short | grep -v '^[AM] '; echo "unstaged check done"
```

Expected: the filter prints nothing before the echo. Run Gate A (lint, typecheck, test, build), then Gate B. The reviewer looks specifically at: `withViewer` is the only caller of `appDb`; no repo-facing export takes `db` or `pool`; `seedTwoTenants` inserts as the system role and never as a viewer; and the matrix file loads modules without a glob that could silently skip one.

- [ ] **Step 15: Commit and log**

```bash
git add docs/superpowers/plans/2026-11-12-partner-portal-01-foundations.md
git commit -m "feat(portal): M1.2 tenant isolation layer, audit and notification helpers, isolation matrix"
printf '%s\n' "2026-11-13 00:00 IST | M1.2 | done | W0 | $(git rev-parse --short HEAD) | A ok, B ok | errors, withViewer/withSystem, recordAudit, notify, rate-limit, isolation registry and matrix, import rules" >> /Users/a12345/Desktop/AI/cleanstart/cleanstart-website/docs/partner-portal/PROGRESS.md
```

---

### Task M1.2b: The server action runner (runs right after W0-f)

**Why it is separate.** The contracts attach `src/server/actions/run.ts` to W0-d, but `runViewerAction` calls `requireActionViewer()` from `src/server/auth/viewer.ts`, which M1.1 (W0-f) creates. Before W0-f the file cannot compile. Run this task immediately after W0-f's merge and before any Wave 1 track starts (see "Contract change requests", item 5).

**Files:**
- Create: `apps/portal/src/server/actions/run.ts`, `apps/portal/src/server/actions/run.test.ts`

**Gate A at the end:** all four commands run.

- [ ] **Step 1: Check the prerequisite, log the start**

```bash
grep -n "export async function requireActionViewer\|export const requireActionViewer" apps/portal/src/server/auth/viewer.ts
printf '%s\n' "2026-11-13 00:00 IST | M1.2b | started | W0 | - | - | runViewerAction and runPublicAction" >> /Users/a12345/Desktop/AI/cleanstart/cleanstart-website/docs/partner-portal/PROGRESS.md
```

Expected: one matching line. If `viewer.ts` or the export is missing, W0-f has not landed: write a `blocked` line and stop.

- [ ] **Step 2: Write the failing runner test**

The test mocks `@/server/auth/viewer`, `next/cache`, `next/headers`, `@sentry/nextjs` and the logger, so it needs no session and no database. Create `apps/portal/src/server/actions/run.test.ts`:

```ts
import * as Sentry from '@sentry/nextjs';
import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import type { Viewer } from '@/server/auth/types';
import { requireActionViewer } from '@/server/auth/viewer';
import { ConflictError, UnauthenticatedError } from '@/server/errors';
import { runPublicAction, runViewerAction } from './run';

vi.mock('@sentry/nextjs', () => ({ captureException: vi.fn() }));
vi.mock('@/server/log', () => ({ log: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() } }));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
vi.mock('next/headers', () => ({ headers: vi.fn() }));
vi.mock('@/server/auth/viewer', () => ({ requireActionViewer: vi.fn() }));

const staff: Viewer = {
  id: '00000000-0000-4000-8000-000000000001',
  kind: 'staff',
  role: 'partner_manager',
  partnerId: null,
  partnerName: null,
  region: 'all',
  email: 'farhan@cleanstart.com',
  name: 'Farhan Qureshi',
};

const schema = z.object({ id: z.string().uuid() });
const spec = { name: 'test.action', schema };
const goodInput = { id: '00000000-0000-4000-8000-0000000000aa' };

describe('runViewerAction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requireActionViewer).mockResolvedValue(staff);
  });

  it('returns validation issues and never calls the handler or loads the viewer for bad input', async () => {
    const handler = vi.fn();
    const result = await runViewerAction(spec, { id: 'nope' }, handler);
    expect(result).toMatchObject({ ok: false, error: { code: 'validation', issues: [{ path: 'id' }] } });
    expect(handler).not.toHaveBeenCalled();
    expect(requireActionViewer).not.toHaveBeenCalled();
  });

  it('maps a missing session to unauthenticated', async () => {
    vi.mocked(requireActionViewer).mockRejectedValue(new UnauthenticatedError());
    const result = await runViewerAction(spec, goodInput, vi.fn());
    expect(result).toEqual({ ok: false, error: { code: 'unauthenticated', message: 'Sign in to continue.' } });
  });

  it('passes the viewer, a clock and the parsed input to the handler and returns its data', async () => {
    const result = await runViewerAction(spec, goodInput, async (ctx, input) => ({ who: ctx.viewer.name, today: ctx.clock.today().length, id: input.id }));
    expect(result).toEqual({ ok: true, data: { who: 'Farhan Qureshi', today: 10, id: goodInput.id } });
  });

  it('runs after commit effects only once the handler has returned, in order', async () => {
    const order: string[] = [];
    await runViewerAction(spec, goodInput, async (ctx) => {
      ctx.afterCommit(async () => void order.push('email'));
      ctx.revalidate('/admin/approvals');
      order.push('handler done');
    });
    expect(order).toEqual(['handler done', 'email']);
    expect(revalidatePath).toHaveBeenCalledWith('/admin/approvals');
  });

  it('does not run effects when the handler throws', async () => {
    const effect = vi.fn();
    const result = await runViewerAction(spec, goodInput, async (ctx) => {
      ctx.afterCommit(effect);
      throw new ConflictError('already_decided', 'Already decided.');
    });
    expect(result).toEqual({ ok: false, error: { code: 'conflict', message: 'Already decided.' } });
    expect(effect).not.toHaveBeenCalled();
    expect(Sentry.captureException).not.toHaveBeenCalled();
  });

  it('logs a failing effect to Sentry and still returns success', async () => {
    const failure = new Error('smtp down');
    const result = await runViewerAction(spec, goodInput, async (ctx) => {
      ctx.afterCommit(async () => {
        throw failure;
      });
      return 'saved';
    });
    expect(result).toEqual({ ok: true, data: 'saved' });
    expect(Sentry.captureException).toHaveBeenCalledWith(failure, { tags: { action: 'test.action', phase: 'after_commit' } });
  });

  it('turns an unexpected error into a generic internal failure and reports it', async () => {
    const failure = new Error('relation "x" does not exist');
    const result = await runViewerAction(spec, goodInput, async () => {
      throw failure;
    });
    expect(result).toEqual({ ok: false, error: { code: 'internal', message: 'Something went wrong on our side. Try again.' } });
    expect(Sentry.captureException).toHaveBeenCalledWith(failure, { tags: { action: 'test.action' } });
  });
});

describe('runPublicAction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('reads the first address of x-forwarded-for', async () => {
    vi.mocked(headers).mockResolvedValue(new Headers({ 'x-forwarded-for': '203.0.113.9, 10.0.0.1' }) as never);
    const result = await runPublicAction(spec, goodInput, async (ctx) => ctx.ip);
    expect(result).toEqual({ ok: true, data: '203.0.113.9' });
  });

  it('gives a null ip when the header is absent and never loads a viewer', async () => {
    vi.mocked(headers).mockResolvedValue(new Headers() as never);
    const result = await runPublicAction(spec, goodInput, async (ctx) => ctx.ip);
    expect(result).toEqual({ ok: true, data: null });
    expect(requireActionViewer).not.toHaveBeenCalled();
  });

  it('returns validation issues for bad input', async () => {
    const result = await runPublicAction(spec, {}, vi.fn());
    expect(result).toMatchObject({ ok: false, error: { code: 'validation' } });
  });
});
```

Run: `pnpm --filter @cleanstart/portal exec vitest run src/server/actions/run.test.ts`

Expected: FAIL, `Failed to load url ./run`.

- [ ] **Step 3: Create the runner from the contracts**

```bash
bash apps/portal/scripts/contract-block.sh "### F.7 " 2 > apps/portal/src/server/actions/run.ts
pnpm --filter @cleanstart/portal exec vitest run src/server/actions/run.test.ts
```

Expected: PASS, `Tests  10 passed (10)`. This also settles contracts M.1 item 8 as far as a unit test can (an effect that runs after the handler returns, a failing effect does not fail the action, `headers()` is awaited). The real check that `revalidatePath` works from inside a server action after the handler returns, and that a plain object reaches a client component, happens in the first Wave 1 screen conversion; if it does not, use the fallback in contracts M.1 item 8 (call `revalidatePath` inside the handler).

Contracts M.1 item 9 (`'use server'` files export only async functions) is not exercised here: `run.ts` is not a `'use server'` file. The first action file (track P, `actions/apply.ts`) is the check.

- [ ] **Step 4: Stage, run Gate A, run Gate B, commit, log**

```bash
git add apps/portal/src/server/actions/run.ts apps/portal/src/server/actions/run.test.ts docs/superpowers/plans/2026-11-12-partner-portal-01-foundations.md
```

Run Gate A, then Gate B (the reviewer checks that no error other than a `PortalError` is shown to a user, that Sentry receives every unexpected error and every failed after-commit effect, and that a Zod failure never reaches the handler).

```bash
git commit -m "feat(portal): M1.2b server action runner"
printf '%s\n' "2026-11-13 00:00 IST | M1.2b | done | W0 | $(git rev-parse --short HEAD) | A ok, B ok | runViewerAction, runPublicAction" >> /Users/a12345/Desktop/AI/cleanstart/cleanstart-website/docs/partner-portal/PROGRESS.md
```

Expected totals after this task: `Test Files  25 passed (25)`, `Tests  122 passed (122)`. Wave 0 steps W0-e (auth spike), W0-f (sessions and guards) and W0-g (email) continue from here; the exit criterion of Wave 0 is all of Gate A green, the isolation matrix passing, and the tag `portal-w0`.

---

## Contract change requests

**Integration review resolution (13 November 2026).** Every request below was decided; the contracts and the plans were edited accordingly, so the request text is kept only as the record of what was asked.

| # | Decision | Reason and where it landed |
|---|---|---|
| 1 | Accept | Allowed paths glob widened to `2026-1*-partner-portal-*.md` in BUILD-HANDOFF; the handoff Setup now says a person commits and pushes the plans before the worktree is cut. |
| 2 | Accept | Contracts H.19 no longer re-exports the HubSpot stage names; code imports them from `@/server/hubspot/types` and `mappers`. Step 10 copies the block whole. |
| 3 | Accept | `env.ts` and its test are W0-b (contracts I, K.2, handoff table). |
| 4 | Accept | `rate-limit.ts` is W0-d with the optional clock argument and `resetRateLimits` (contracts H.18, K.2). |
| 5 | Accept | `run.ts` runs right after W0-f as step W0-fb (handoff wave table, contracts K.2). |
| 6 | Modify | Passwords arrive in M0.7 (W0-e), not M1.1: the M0.7 spike test already calls `makeUser({ password })` and plan 02 had no step for it. Plan 02 Step 6b adds it to `test-helpers.ts`, `fixtures.ts` and `seed-dev.ts` with a test. |
| 7 | Accept | `makeSyncedDeal` takes the structural `SyncedDealHubspot` (contracts J.3). |
| 8 | Accept | `testDb()` and `testPool()` return the `db` and `pool` of `@/db/client` (contracts J.3). |
| 9 | Accept | Contracts J.5 amended (JSON extraction, filler admin logins, alternating categories, `nextval`, `seedDevDatabase`, deterministic opens). |
| 10 | Accept | Fixed in contracts C.2; the post-copy edit in Step 15 was removed. |
| 11 | Accept | Fixed in contracts J.2; the post-copy edit in Step 15 was removed. |
| 12 | Accept | Contracts F.1 text: the `appDb` import rule exempts `*.test.ts`. |
| 13 | Accept | Contracts F.6 text records the three `isolation.test.ts` edits. |
| 14 | Accept | Contracts F.7 text: a small JSON logger, no `pino`. |
| 15 | Modify | `better-auth` is pinned to `1.7.22` (the version plan 02 verified), falling back to `1.7.18` if pnpm edits the workspace file; `@types/node-cron` and `pino` are not installed; `@cleanstart/forms` is a workspace dependency. Step 4 updated. |
| 16 | Accept | Files already in contracts K.2; nothing further to change. |
| 17 | Accept | Contracts K.1 row for `package.json` and `tsconfig.json`; the `build` script is M0.4 Step 14. |
| 18 | Accept | Contracts K.2 and C.5 list `contract-block.sh` and `db-create.sh --recreate`. |

Nothing below was applied to the contracts file. Each item says what, why, and the text the orchestrator can fold in. Items 2 to 5 change who creates a file or when; items 6 to 12 change what a contract block says; the rest are additions. Every one is already reflected in the steps above, so the orchestrator only needs to update the contracts and tell the other area plans.

1. **BUILD-HANDOFF allowed paths, and committing the plans.** The allowed list names `docs/superpowers/plans/2026-11-11-partner-portal-*.md` for ticking steps and the plan files of 12 November (`2026-11-12-partner-portal-00-contracts.md`, this file and the others) do not match it, while every task here ticks its checkboxes in its own plan file in the task commit. Proposed text: `docs/superpowers/plans/2026-11-1*-partner-portal-*.md`. Also: the contracts and the plans are untracked or modified today (`git status`), and the worktree is cut from `origin/development`; they must be committed and pushed to `development` before `git worktree add`, or `scripts/contract-block.sh` has nothing to read.
2. **H.19 `deal-rules.ts` re-exports.** The last three lines of the contracts' block (`export { STAGE_LABELS, type StageLabel } from '@/server/hubspot/types'; export { STAGE_TO_STATUS } from '@/server/hubspot/mappers';`) cannot compile in Wave 0: those files are created by H4.2 and H4.3. W0-b ships `deal-rules.ts` without them (Step 10 of M0.3 cuts the block at `daysUntil`). Proposed: either the orchestrator appends the two lines in the merge that lands H4.3, or the contracts drop them and client code imports `STAGE_LABELS` and `STAGE_TO_STATUS` from `@/server/hubspot/types` and `@/server/hubspot/mappers` (both are client safe by the HubSpot plan).
3. **K.2 and I: `src/env.ts` and `src/env.test.ts` are created in M0.3 (W0-b), not M0.4 (W0-c).** C.2's `client.ts` imports `@/env`, and the handoff runs W0-b before W0-c. `.env.example` and `src/env.example.test.ts` stay in M0.4.
4. **K.2 and H.18: `src/server/rate-limit.ts` is created in M1.2 (W0-d), not M0.4 (W0-c).** It throws `RateLimitError`, which M1.2 creates. The signature gains an optional third parameter: `rateLimit(key: string, rule: { limit: number; windowSeconds: number }, clock?: Clock): void` (default `systemClock`, so tests need no fake timers), and the module exports `resetRateLimits(): void` for tests.
5. **K.2 and F.7: `src/server/actions/run.ts` runs after W0-f.** It imports `requireActionViewer` from `src/server/auth/viewer.ts` (M1.1). `result.ts` stays in W0-d. This plan calls the task M1.2b; the orchestrator runs it right after W0-f and before Wave 1.
6. **J.3 `makeUser` and J.5 `seedMockData`: passwords arrive in W0-f.** Both need `hashPassword` (M1.1). W0-b ships `makeUser` without the `password` option and `seedMockData` with `SeedOptions = { clock }`. Proposed: M1.1 adds `password?: string` to `MakeUserInput` (inserting the Better Auth credential account with `hashPassword(password)`), adds `passwordHash?: string` to `SeedOptions` (an `auth_account` row with `providerId = 'credential'`, `accountId = user.id` for every seeded login), and makes `scripts/seed-dev.ts` pass `await hashPassword(DEV_SEED_PASSWORD)`. `DEV_SEED_PASSWORD` already exists in `src/db/fixtures.ts`. `makeInvite` hashes its token locally with SHA-256 hex, the same digest as `hashToken()`.
7. **J.3 `makeSyncedDeal`.** It takes a structural `SyncedDealHubspot` (`readonly stageIds: Readonly<Record<string, string>>` and `createDeal(properties): Promise<{ id: string }>`) instead of importing the `FakeHubspot` type, because `@/server/hubspot/fake` does not exist until H4.2. `FakeHubspot` satisfies it as written in HubSpot plan 4.2; H must keep the members `stageIds` and `createDeal` (HubSpot plan, item 18 already freezes them). The deal it creates carries `dealname`, `dealstage` and `portal_registration_id`.
8. **J.3 `testDb()` and `testPool()`** return the system `db` and `pool` exported by `@/db/client` (one set of pools per process), not separate pools. Same object on every call, as the contract already says.
9. **J.5 fixtures.** (a) The mock's arrays are extracted once to `src/db/mock-data/*.json` (M0.3 Step 19) and read by `fixtures.ts`, instead of being copied into it as TypeScript constants; the extraction script is not kept. (b) The 11 filler partners each get one `partner_admin` login (`admin@seed-partner-NN.example.com`); the contract says "no users", but `document_opens` needs a user per opening partner and the mock's `partnerCount` reaches 18 while only 10 partners are detailed. (c) Filler categories alternate `distributor` and `channel`, so the playbook (audience: distributors and channel partners, 18 partners) is satisfiable. (d) The sequence is advanced with 44 calls to `nextval`, because `setval` needs UPDATE on the sequence and `portal_app` has USAGE and SELECT only. (e) Adds `seedDevDatabase(db, clock)`, which refuses a database that already has partners and is what `scripts/seed-dev.ts` calls. (f) Document opens are generated deterministically: Kestrel gets exactly `ownOpens`, the other eligible partners share the rest, one each at least.
10. **C.2 `client.ts`.** Replace `const pools = (globalForDb.portalPools ??= createPools());` with `const pools = globalForDb.portalPools ?? createPools();` and `globalForDb.portalPools = pools;` (the repo's Biome rule `noAssignInExpressions` rejects the first form).
11. **J.2 `test-setup.ts`.** Delete `process.env.NODE_ENV = 'test';`: Next's types make `NODE_ENV` read-only (a type error) and Vitest already sets it.
12. **F.1 import rule.** "Fails if any file outside `context.ts` imports `appDb`" exempts `*.test.ts` files, because `context.test.ts` must use `appDb` to prove a request identity does not leak into the next transaction.
13. **F.6 `isolation.test.ts`.** Three edits: `import { sql } from 'drizzle-orm'`; repo modules are loaded with `import(/* @vite-ignore */ <absolute path>)` (Vite warns on `import(\`./${name}\`)` inside the file's own directory); and a first test, `seeds two tenants that cannot see each other through withViewer`, so the file has a real test before the first repo module exists (Vitest fails a file whose only suite is empty).
14. **K.2 `log.ts`.** There is no `pino` (not in the handoff's package list). `src/server/log.ts` exports `log`, `createLogger` and `redact`, writes one JSON line per entry, keeps the contract's call shape `log.info(fields, message)` and redacts keys matching `authorization|password|token|cookie|secret`.
15. **Packages.** `node-cron` 4 ships its own types, so `@types/node-cron` (which HubSpot plan 4.4 tells the agent to add) is not installed. `better-auth` is pinned to `1.7.18` (pnpm 10 edits `pnpm-workspace.yaml` for packages younger than a day). `@cleanstart/forms` is a workspace dependency (contracts M.2, item 20). Nothing else is installed.
16. **K.2 Sentry and instrumentation.** `sentry.client.config.ts` holds the client init and is imported by `src/instrumentation-client.ts` (the file Next 16 loads with Turbopack). `src/instrumentation.ts` also imports `@/env` on the Node runtime, so a production start with a missing variable refuses to boot (master plan 0.4), and logs `job scheduler started`. `NEXT_PUBLIC_SENTRY_DSN` is read straight from `process.env` by the client config and is not in the env schema. `next.config.ts` is not wrapped in `withSentryConfig`.
17. **Build script and tsconfig.** `apps/portal/package.json` `build` becomes `SKIP_ENV_VALIDATION=1 next build` (contracts I), and `tsconfig.json` `include` gains `scripts/**/*.ts` and `*.config.ts`, so scripts and root config files are type checked by `typecheck` and by `next build`.
18. **New dev tools.** `scripts/contract-block.sh` (mechanical copy of a contracts code block) and `scripts/db-create.sh <name> --recreate` (drop and recreate a worktree's own database, with its `_w1` to `_w4` clones for a `_test` database). Add both to K.2 and C.5. The `--recreate` flag is needed whenever `0000_init.sql` is regenerated (contracts M.1 items 2 and 3 allow W0-e to do that), because the Drizzle migrator re-applies a changed first migration.

---

## Known unknowns

*Consolidated, de-duplicated and ordered by first verifying task in contracts M.5 (integration review, 13 November 2026); this list stays as the local detail.*

Checked while writing this plan, in a scratch workspace outside the repository (same package versions, a real Postgres 16.14, `next build` and `next start` with Next 16.2.5): the SQL, the schema, every test in this plan (122 tests in 25 files, all green, `tsc` and `biome lint` clean), the migration applied twice, the seed, the instrumentation hook. Not checked, and how to check it:

1. **The real worktree's pnpm.** pnpm 10.30 edits `pnpm-workspace.yaml` (`minimumReleaseAgeExclude`, `allowBuilds`) in some installs. M0.2 Steps 2 and 4 run `git diff --stat pnpm-workspace.yaml` after each install and revert it. If an install still fails, name the package in a `blocked` line.
2. **`better-auth@1.7.18`.** Pinned, not exercised: W0-e proves it. If the spike needs a newer release, the orchestrator bumps the pin (and may need to allow the workspace file edit).
3. **`@sentry/nextjs` 9.47 on Next 16.** Its peer range names Next 15. The scratch build and `next start` worked with the hook, and `apps/web` and `apps/cms` run the same pair. Whether events actually reach Sentry is not checked (no DSN). If they do not, move to a Sentry major whose peer range includes Next 16 in M5.1.
4. **CI.** `globalSetup` uses `CREATE DATABASE ... TEMPLATE` through `PORTAL_TEST_OWNER_URL`, which needs the owner to have `CREATEDB` (local `db-create.sh` grants it) or to be a superuser (the CI Postgres service user is). The CI workflow is M0.6's; unverified there.
5. **The standalone Docker image.** `register()` was checked with `next start` only. Whether `output: 'standalone'` keeps `drizzle/` and `src/db/rls.sql` for the container start migration is contracts M.1 item 18, owned by M0.6.
6. **Other Postgres majors.** Only 16.14 was used.
7. **The mock JSON sizes** in M0.3 Step 19 hold while `apps/portal/src` is unchanged since `58747992` (`git diff 58747992 HEAD -- apps/portal` was empty on 13 November). If the mock changed, the sizes differ; compare the figures in the fixtures test instead.
8. **`makeSyncedDeal` against the real `FakeHubspot`.** Compatibility is reasoned from HubSpot plan 4.2, not compiled. H4.2's typecheck is the check; H must keep `stageIds` and `createDeal`.
9. **Server action behaviour in Next 16** (contracts M.1 items 8 and 9: `revalidatePath` after the handler returns, plain objects reaching a client component, `'use server'` exports). Only the unit level is covered here; the first converted screen is the real test.
10. **Exact counts.** `25 tables`, `5 USING gin`, the byte sizes and the test totals are from the scratch run. A drizzle-kit patch release can change the generated SQL text; the checklist in M0.3 Step 12 greps for names, and the migration test is the judge.

---

## Self-review

**Spec coverage.** Every task of this area in the master plan maps to a task here:

| Master plan task and handoff step | Where it is built |
|---|---|
| M0.2: tag `portal-mock-v1`, create `src/server`, `src/db`, `scripts` with a README line each, update `package.json` description and `README.md`; handoff amendment 1 (all dependencies once); the M0.1 stub that contracts K.2 assigns to W0-a; vitest and the `test` and `db:*` scripts | Task M0.2, Steps 1 to 9 |
| M0.3: `drizzle.config.ts`, `schema.ts` (every table), `client.ts`, `0000_init`, `rls.sql`, `test-helpers.ts` with `testDb`, `testPool`, `resetDb`, `makePartner`, `makeUser`, `makeRegistration`, `makeSyncedDeal`; schema test (tables, unique index, audit_log rejects UPDATE and DELETE, app role does not own tables); two roles; migrate twice; `seed-dev.ts`; amendments 2 (test database name from the environment), 3 (`db-create.sh`), 4 (`pg_trgm` and trigram indexes), 6 (clock argument, `src/lib/clock.ts`) | Task M0.3, Steps 2 to 4 (roles, databases), 11 to 12 (schema, migration), 13 to 17 (tests, rls, client, helpers, migrate), 19 to 22 (seed). The droplet one-time SQL is `scripts/db-bootstrap.sql` (read and run by the operator, `conn_limit=20`, `allow_createdb=off`); nothing here runs against the droplet |
| M0.4: `env.ts` with its missing-variable test, `log.ts`, Sentry config, `.env.example`, plus the job infrastructure the contracts give W0-c (`lock`, `schedule`, `index`, one stub per job, `instrumentation.ts`) | Task M0.3 Steps 5 to 7 (`env.ts`, moved forward, item 3) and Task M0.4 |
| M1.2: `context.ts` (`withViewer`), `rls.sql`, the isolation test that fails when a repo export is missing from the matrix; the registry, errors, audit, notify, result helpers | Task M1.2 (and `rls.sql` in M0.3); `run.ts` in Task M1.2b |

**Placeholder scan.** The text above was read for placeholder markers, for deferred work ("later", "as needed") that is not tied to a named task, and for vague instructions of the kind the writing-plans skill bans; there are none. The one deliberate empty body is the eight job stubs of M0.4 Step 11, which the contracts (H.17) require, and each carries its owner task in a doc comment. The file contains no em-dash and no en-dash. Every code step is a full file or a mechanical copy from the contracts with its edits written out; every run step has the command and the expected output.

**Type and name consistency with the contracts.** Names, signatures, columns and paths are those of the contracts, copied mechanically by `contract-block.sh` for: `domain.ts` (C.0), `schema.ts` (C.1), `client.ts` (C.2), `rls.sql` (C.3), `db-bootstrap.sql` (C.4), `types.ts` (D.1), `clock.ts` and `dates.ts` (D.5), `errors.ts` (E), `context.ts` (F.1), `events.ts` and `record.ts` (F.4), `notify.ts` (F.5), `isolation.registry.ts` (F.6), `result.ts` and `run.ts` (F.7), `dto.ts` (H.0), `deal-rules.ts` (H.19), `env.ts` (I), the three Vitest files (J.2). The code written here uses those names only: `Tx`, `Db`, `Viewer`, `PartnerViewer`, `StaffViewer`, `SystemActor`, `SYSTEM_ACTORS`, `Clock`, `fixedClock`, `systemClock`, `IsolationContext`, `TenantFixture`, `PortalError` and subclasses, `AUDIT_EVENTS`, `NOTIFICATION_PREF_DEFAULTS`, `withViewer`, `withSystem`, `assertStaff`, `recordAudit`, `notifyUsers`, `resolveEmailRecipients`, `defineIsolation`, `runViewerAction`, `runPublicAction`. The `JobSpec` interface, the eight job names and schedules, and the eight module and function names (`runHubspotOutbox`, `runHubspotPoll`, `runReconcile`, `runExpiry`, `runExpiryReminders`, `runIntake`, `runDocumentPurge`, `runRetention`) are those of H.17. Deviations are exactly the "Contract change requests" above.
