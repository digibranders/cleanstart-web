# Partner portal admin, infrastructure and hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give the partner portal its container image, CI and deploy workflows, the audit log screen with CSV export, the Ctrl K search, and then, once every track has merged, remove the mock scaffolding, add the browser test suite, and harden the app (security headers, rate limits, accessibility, retention, backups, runbook) so that a person can run the pilot.

**Architecture:** Two parts. Part 1 is Track A (Wave 1, own worktree): M0.6 (Dockerfile, `/api/health`, `portal.yml`, `deploy-portal.yml`, the compose service, a runbook with the Caddy block), M4.2 (audit log screen, `repo/audit.ts`, export, HubSpot health card) and M4.3 (`repo/search.ts` with `pg_trgm`, `searchAction`, the Ctrl K palette). Part 2 is Wave 2 (the orchestrator alone on `feat/portal-build`, serial): M5.4, the Playwright `@portal` suite with `FakeHubspot`, M5.1, M5.2, M5.3, M5.5, M5.9 and the final verification and report. Nothing in this plan touches the droplet. Every piece of code in it was written against the contracts and, where it could be, compiled and run in a scratch harness against a real Postgres 16 with the contracts' schema and `rls.sql` (see "How this plan was verified").

**Tech Stack:** Next.js 16 (App Router, `proxy.ts`), TypeScript strict (`exactOptionalPropertyTypes`, `noUncheckedIndexedAccess`), Drizzle ORM on `pg`, Postgres 16 with `pg_trgm` and row level security, Zod 3, Better Auth, Vitest 2, Playwright with `@axe-core/playwright`, Docker (Next standalone output), GitHub Actions, Caddy, bash.

**Source of truth:** `docs/superpowers/plans/2026-11-12-partner-portal-00-contracts.md` (called "the contracts"), `docs/superpowers/plans/2026-11-11-partner-portal-master-plan.md`, `docs/partner-portal/BUILD-HANDOFF.md`, and HubSpot plan section 6. Names, signatures, columns and paths below are the contracts' own. Anything not in the contracts is written out in full here.

---

## Scope, tracks and branches

| Part | Master tasks | Where it runs | Owner |
|---|---|---|---|
| 1 | M0.6, M4.2, M4.3 | Track A, worktree `.claude/worktrees/portal-a`, branch `feat/portal-a` (from the tip of `feat/portal-build` at `portal-w0`), database `cleanstart_portal_a`, test database `cleanstart_portal_a_test`, dev port 3254 | the track A agent |
| 2 | M5.4, E2E, M5.1, M5.2, M5.3, M5.5, M5.9, final verification | `feat/portal-build`, serial, after every Wave 1 track is merged (tag `portal-w1`), database `cleanstart_portal`, E2E database `cleanstart_portal_e2e`, E2E dev port 3290 | the orchestrator |

Skipped on purpose (a person does them): M5.6 pilot, M5.7 production provisioning, M5.8 cutover. The last section before the self-review, "Handover checklist for a person", lists exactly what remains.

**Allowed paths and shared files.** Wave 1 follows BUILD-HANDOFF: Track A edits only the files it owns and asks for shared files through "Contract change requests" (the last section; each has exact code). Wave 2 runs with nobody else working, so edits to `shell.tsx`, `package.json`, `portal.css`, `components/ui/**`, `next.config.ts`, `proxy.ts` and `tsconfig.json` are made directly and every one is listed in the task's Files block. Never `ssh`, never push, never touch the droplet, never `git add -A`.

**Modules from Wave 0 and from the other tracks that this plan imports and does not define.** If one is missing, append a `blocked` line and stop that step.

- Wave 0: `@/env`, `@/lib/{clock,dates,domain,dto,routes}`, `@/db/{schema,client,test-helpers}`, `@/server/{errors,log,rate-limit,notify,urls}`, `@/server/audit/{events,record}`, `@/server/auth/{types,policies,viewer,auth}`, `@/server/repo/{context,isolation.registry}`, `@/server/actions/{run,result}`, `@/server/jobs/{index,schedule}`, `scripts/{migrate.ts,db-create.sh,seed-dev.ts}`.
- Track H: `@/server/repo/integration-health` (`integrationHealth`, `retryFailedOutbox`, H4.10), `@/server/hubspot/{fake,handlers,outbox,poll}` (H4.2, H4.4, H4.6, H4.8).
- Track D: `@/server/files/{fake,storage}` and `@/server/jobs/document-purge.ts` (`purgeDocumentFiles`, `runDocumentPurge`, plan 05 task M3.2).
- Track P: `@/server/repo/invites` (`resendInvite`) and the public actions named in contracts H.20.
- Existing in the mock and kept: `components/reports/download-csv.ts` (`downloadCsv(filename, csv)`), `components/ui/{dropdown,overlay,toast,badge}.tsx`, `components/icon.tsx`.

## Findings that shaped this plan

Found while reading the repo and running the real tools on 12 and 13 November 2026. Each one is handled in a task below.

1. **The pinned Next.js has known critical advisories.** `pnpm audit --prod` reports 21 advisories on the path `apps__portal>next` for `next@16.2.5` (5 critical, 7 high; the highest fix is 16.4.1; 16.4.6 is the latest release). `apps/cms` and `apps/web` carry the same advisories. M5.1 bumps the portal only; the other two apps are outside this plan, so tell their owners.
2. **The review gate would break the health check.** `src/proxy.ts` answers 401 to every path while `PORTAL_REVIEW_PASSWORD` is set. The Docker healthcheck, the deploy smoke probe and the HubSpot webhook would all fail. M0.6 exempts `/api/health` (CCR-2) and M5.1 exempts the webhook too.
3. **Postgres connection budget.** `docs/operations/INCIDENTS.md` (14 October) records `max_connections = 20` on the droplet. The CMS pool is 15 and the portal uses 14 (6 request, 8 system; contracts C.2, decided at the integration review). That does not fit. Raise `max_connections` (suggested 50) before the pilot, which needs a Postgres restart and the operator's approval; it is on the handover checklist (item 1.3), in contracts C.4 and an open decision for the user.
4. **The CMS bucket is public.** `cdn.cleanstart.com` serves the CMS R2 bucket, which also holds `backups/*.dump`. The portal dump must not go there. M5.5 sends it to the portal's private bucket (read from `/opt/cleanstart/portal.env`) and refuses to use the CMS bucket.
5. **CSP versus inline styles.** The screens use inline `style="..."` attributes, which a nonce cannot cover. The policy therefore uses `style-src` with a nonce plus `style-src-attr 'unsafe-inline'` (attributes only, so an injected `<style>` element is still blocked). Scripts use a nonce and `'strict-dynamic'`, no `'unsafe-inline'`.
6. **Accessibility baseline of the mock (axe, 1440 px, 19 routes).** Two violations only: the Privacy policy link on `/apply` (contrast 1.64:1 against its text) and `aria-controls="cust-sugg"` on `/partner/deals/new` pointing at an element that is not rendered. At 375 px the top bar search button has no accessible name. `biome.json` switches off four a11y rules, not two (`noSvgWithoutTitle` 0 sites, `useKeyWithClickEvents` 7, `useFocusableInteractive` 4, `useSemanticElements` 33 on the mock).
7. **The container needs a migration entry that survives `output: 'standalone'`.** The standalone image has no `tsx` and no Drizzle migrator, so `scripts/migrate.ts` is bundled into `scripts/migrate.cjs` at build time with the esbuild that ships inside `tsx` (no new dependency).
8. **Client address behind Cloudflare and Caddy.** Rate limits key on `x-forwarded-for`. Caddy must overwrite it with `CF-Connecting-IP`, and the droplet firewall should accept port 443 from Cloudflare only, otherwise a visitor can choose their own address.

## How this plan was verified

A scratch harness outside the repo (`.../scratchpad/plan06/h`, deleted with the session) holds the contracts' own `schema.ts`, `domain.ts`, `dto.ts`, `rls.sql`, role bootstrap SQL, `errors.ts`, `context.ts`, `record.ts`, `policies.ts` and `run.ts`, extracted verbatim, applied to a real local Postgres 16 as `portal_owner` with `portal_app` as the runtime role (RLS forced). In it: every repo, action, job, security and library test in this plan was run and passes (audit 10, search 12, audit and search actions 9, retention 5, CSP 8, headers 4, proxy 4, health 2, libraries 18); `tsc --noEmit` is clean under the portal's strict settings; `biome lint` is clean; `backup.sh` and `restore-portal-drill.sh` ran against two scratch databases with a stub `aws` (success, portal upload failure, missing portal database, same-bucket refusal, bad env file, bad name); both workflows pass `actionlint`; the Dockerfile passes `docker build --check`; the compose file passes `docker compose config`; the deploy env-rendering script was run with and without its required variables. What could not be run is listed in "Known unknowns", each with a first step that verifies it and a fallback.

## Conventions used in every task

**Gate A** is the BUILD-HANDOFF block. Every task states which of its parts apply. Run from the worktree root:

```bash
pnpm --filter @cleanstart/portal lint
pnpm --filter @cleanstart/portal typecheck
pnpm --filter @cleanstart/portal test
until mkdir /tmp/portal-build.lock 2>/dev/null; do sleep 15; done
pnpm --filter @cleanstart/portal build; BUILD_STATUS=$?
rmdir /tmp/portal-build.lock
[ "$BUILD_STATUS" -eq 0 ]
node apps/portal/scripts/verify-copy.mjs
git diff --name-only feat/portal-build
```

`verify-copy.mjs` (created in M0.6) is the dash check for `src`, `e2e`, `scripts` and `drizzle`. For files it does not cover (workflows, docs, infra scripts) use this one-liner, which contains neither dash character:

```bash
node -e "const d=new RegExp('['+String.fromCharCode(8211,8212)+']');let bad=0;for(const f of process.argv.slice(1)){require('fs').readFileSync(f,'utf8').split('\n').forEach((l,i)=>{if(d.test(l)){console.log(f+':'+(i+1));bad=1}})}process.exit(bad)" <files>
```

Expected: no output, exit 0. On `feat/portal-build` itself compare `git diff --name-only` against `origin/development`.

**Gate B** is the BUILD-HANDOFF independent review. The reviewer checklist applies unchanged. For this plan, the reviewer also checks: audit and search read paths are staff or viewer scoped, no `.returning()` on a cross-user insert, no secret in a log line, no `any`, every new repo export is in its `isolation` map.

**Commits** stage specific paths and use `feat(portal): <task id> <summary>`. Tick this task's checkboxes in this file in the same commit.

**"Verify:" steps** are first steps for anything this plan could not run. Each names the fallback and where it is recorded.

**Progress log.** Start and finish every task with a one line `printf '%s\n' "..." >> /Users/a12345/Desktop/AI/cleanstart/cleanstart-website/docs/partner-portal/PROGRESS.md` as BUILD-HANDOFF describes.

## File Structure

Paths relative to `apps/portal` unless they start with `docs/`, `infra/` or `.github/`. **C** create, **M** modify, **X** delete.

| Path | Task | |
|---|---|---|
| `Dockerfile`, `Dockerfile.dockerignore` | M0.6 | C |
| `scripts/bundle-migrate.mjs` | M0.6 | C |
| `scripts/verify-copy.mjs` | M0.6 | C |
| `src/app/api/health/route.ts`, `route.test.ts` | M0.6 | C |
| `.github/workflows/portal.yml`, `.github/workflows/deploy-portal.yml` | M0.6 | C |
| `infra/docker-compose.yml` | M0.6 | M |
| `docs/operations/PARTNER-PORTAL.md` | M0.6 (sections 1 to 3), M5.9 (sections 4 to 11) | C, then M |
| `next.config.ts`, `src/proxy.ts` | written in Wave 0 (M0.2 Step 5b and M1.1e, which already carry CCR-1 and CCR-2), M5.1 (final) | M |
| `src/lib/audit-filters.ts`, `audit-csv.ts` and their tests | M4.2 | C |
| `src/server/repo/audit.ts`, `audit.test.ts` | M4.2 | C |
| `src/server/actions/audit.ts`, `audit.test.ts` | M4.2 | C |
| `src/components/screens/AdminAudit.tsx`, `src/components/people/AuditDrawer.tsx`, `src/app/admin/audit/page.tsx` | M4.2 | M |
| `src/components/audit/IntegrationHealthCard.tsx` | M4.2 | C |
| `src/lib/search-pages.ts` and test | M4.3 | C |
| `src/server/repo/search.ts`, `search.test.ts` | M4.3 | C |
| `src/server/actions/search.ts`, `search.test.ts` | M4.3 | C |
| `src/components/shell/search-palette.tsx` | M4.3 | C |
| `src/components/shell/shell.tsx` | W2-a step 0 (CCR-3 here and the notifications change of plan 04, in that order), M5.4, M5.2 | M |
| `src/lib/slice.ts`, `demo-date.ts`, `src/components/shell/personas.ts`, `src/tour/**`, `src/data/**` | M5.4 | X |
| `playwright.config.ts`, `e2e/**`, `.gitignore` | E2E | C |
| `package.json`, `tsconfig.json`, `biome.json` | E2E, M5.1, M5.2, M5.4 | M |
| `src/server/security/{csp,limits,auth-rate-limit}.ts` and tests | M5.1 | C |
| `scripts/audit-portal.mjs` | M5.1 | C |
| `docs/partner-portal/{SECURITY-PASS,A11Y-PASS}.md` | M5.1, M5.2 | C |
| `src/components/ui/scrim.tsx` | M5.2 | C |
| `src/server/jobs/retention.ts`, `retention.test.ts`, `purge-jobs.test.ts`, `registry.test.ts` | M5.3 | M, C |
| `infra/scripts/backup.sh` | M5.5 | M |
| `infra/scripts/restore-portal-drill.sh` | M5.5 | C |
| `docs/operations/INCIDENTS.md` | M5.9 | M |
| `docs/partner-portal/OVERNIGHT-REPORT.md` | final | C |

---

# Part 1: Track A (Wave 1)

Start: `git worktree add .claude/worktrees/portal-a -b feat/portal-a feat/portal-build`, then in it `pnpm install` and `bash apps/portal/scripts/db-create.sh cleanstart_portal_a` and `... cleanstart_portal_a_test`. Put the two databases in `apps/portal/.env` (never committed) as the handoff describes. Port check: `lsof -nP -iTCP:3254 -sTCP:LISTEN` must print nothing; never kill a process to free a port.


### Task M0.6: Container image, health route, CI and deploy workflows, compose service, runbook

**Gate A for this task:** the standard block, plus `docker build --check`, `actionlint` on both workflows, `docker compose config`, and the local container run in Step 12.

**Files:**
- Create: `apps/portal/Dockerfile`, `apps/portal/Dockerfile.dockerignore`, `apps/portal/scripts/bundle-migrate.mjs`, `apps/portal/scripts/verify-copy.mjs`, `apps/portal/.gitignore`, `apps/portal/src/app/api/health/route.ts`, `.github/workflows/portal.yml`, `.github/workflows/deploy-portal.yml`, `docs/operations/PARTNER-PORTAL.md`
- Modify: `infra/docker-compose.yml`
- Shared files: nothing to request. `apps/portal/next.config.ts` (standalone output, CCR-1) is written by M0.2 Step 5b and `apps/portal/src/proxy.ts` (the `/api/health` exemption, CCR-2) by M1.1e, both in Wave 0
- Test: `apps/portal/src/app/api/health/route.test.ts`

Nothing here runs on the droplet. The workflows cannot run until the branch is pushed, which this plan never does: say so in the progress log line.

- [ ] **Step 1: Preconditions**

```bash
git tag | grep -x portal-w0
ls apps/portal/scripts/migrate.ts apps/portal/scripts/db-create.sh apps/portal/src/db/rls.sql apps/portal/drizzle
grep -n "output" apps/portal/next.config.ts || echo "no output setting yet"
```

Expected: `portal-w0`, the four paths listed, and a `next.config.ts` line containing `standalone` (M0.2 Step 5b wrote it). If a path is missing Wave 0 did not finish: append a `blocked` line and stop.

- [ ] **Step 2: Check the two shared-file changes that Wave 0 made**

The standalone build needs `output: 'standalone'` and the monorepo tracing root (CCR-1, written by M0.2 Step 5b), and the review gate must not cover `/api/health` (CCR-2, written by M1.1e). Check both, and carry on; if either is missing, append a `blocked` line naming it (the code is in "Contract change requests").

```bash
grep -n "standalone\|outputFileTracingRoot" apps/portal/next.config.ts
grep -n '"/api/health"' apps/portal/src/proxy.ts
```

Expected: the first prints the `standalone` and `outputFileTracingRoot` lines, the second prints the `/api/health` exemption.

- [ ] **Step 3: Write the failing health route test**

Create `apps/portal/src/app/api/health/route.test.ts`:

```ts
import { afterEach, describe, expect, it, vi } from 'vitest';
import { db } from '@/db/client';
import { GET } from './route';

afterEach(() => vi.restoreAllMocks());

describe('GET /api/health', () => {
  it('answers 200 with status ok when the database responds, and is never cached', async () => {
    const response = await GET();
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ status: 'ok' });
    expect(response.headers.get('cache-control')).toBe('no-store');
  });

  it('answers 503 when the database does not respond, without leaking the error', async () => {
    vi.spyOn(db, 'execute').mockRejectedValueOnce(new Error('connect ECONNREFUSED 10.0.0.5:5432'));
    const response = await GET();
    expect(response.status).toBe(503);
    const body = await response.text();
    expect(body).toBe('{"status":"database_unreachable"}');
    expect(body).not.toContain('10.0.0.5');
  });
});
```

Run: `pnpm --filter @cleanstart/portal exec vitest run src/app/api/health/route.test.ts`
Expected: FAIL, `Failed to resolve import "./route"`.

- [ ] **Step 4: Implement the health route**

Create `apps/portal/src/app/api/health/route.ts`. It is the system `db` (contracts L: public, no auth, no write) and returns no internal detail:

```ts
import { sql } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { db } from '@/db/client';
import { log } from '@/server/log';

export const dynamic = 'force-dynamic';

const NO_STORE = { 'Cache-Control': 'no-store' };

/** Liveness for the Docker healthcheck and the deploy smoke probe: the process is up and the database answers. */
export async function GET(): Promise<NextResponse> {
  try {
    await db.execute(sql`select 1`);
    return NextResponse.json({ status: 'ok' }, { headers: NO_STORE });
  } catch (error) {
    log.error({ err: error }, 'health check: database unreachable');
    return NextResponse.json({ status: 'database_unreachable' }, { status: 503, headers: NO_STORE });
  }
}
```

Run the test again. Expected: PASS, 2 tests.

- [ ] **Step 5: Create the dash check script**

`apps/portal/scripts/verify-copy.mjs` is the portal's counterpart of `apps/web`'s `verify:copy` (CLAUDE.md: no em-dashes or en-dashes in code-owned copy). It is built from code points so the file itself contains neither character. CI calls it directly, so no `package.json` change is needed.

```js
// Fails when a source file, spec or script contains an em-dash or an en-dash (CLAUDE.md: no AI-tell punctuation in
// code-owned copy). Mirrors apps/web `verify:copy`. Run: pnpm --filter @cleanstart/portal verify:copy
import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIRS = ['src', 'e2e', 'scripts', 'drizzle'];
const FILES = ['next.config.ts', 'playwright.config.ts', 'README.md'];
const SKIP = new Set(['node_modules', '.next', '.next-e2e', 'playwright-report', 'test-results', '.auth', 'meta']);
// Built from code points so this file itself contains neither character.
const DASH = new RegExp(`[${String.fromCharCode(8211, 8212)}]`);

const walk = (dir) =>
  readdirSync(dir).flatMap((name) => {
    if (SKIP.has(name)) return [];
    const full = path.join(dir, name);
    return statSync(full).isDirectory() ? walk(full) : [full];
  });

const exists = (p) => {
  try {
    return statSync(p).isFile();
  } catch {
    return false;
  }
};

const files = [
  ...DIRS.flatMap((d) => (exists(path.join(root, d)) || statSync(path.join(root, d), { throwIfNoEntry: false })?.isDirectory() ? walk(path.join(root, d)) : [])),
  ...FILES.map((f) => path.join(root, f)).filter(exists),
];

const hits = [];
for (const file of files) {
  if (!/\.(ts|tsx|mjs|cjs|js|json|sql|css|md)$/.test(file)) continue;
  readFileSync(file, 'utf8')
    .split('\n')
    .forEach((line, index) => {
      if (DASH.test(line)) hits.push(`${path.relative(root, file)}:${index + 1}: ${line.trim().slice(0, 100)}`);
    });
}

if (hits.length > 0) {
  console.error(`Found ${hits.length} em-dash or en-dash line(s). Use a comma, a colon, a full stop, or "to" for ranges:`);
  for (const hit of hits) console.error(`  ${hit}`);
  process.exit(1);
}
console.info(`verify:copy ok (${files.length} files)`);
```

Run: `node apps/portal/scripts/verify-copy.mjs`
Expected: `verify:copy ok (<n> files)`, exit 0.

- [ ] **Step 6: Create the migration bundler**

`scripts/migrate.ts` runs the Drizzle migrations and then `src/db/rls.sql` (contracts C.5). The standalone image has neither `tsx` nor the migrator, so this script bundles the entry to one CommonJS file at image build time. esbuild is resolved through `tsx` (a root devDependency that depends on it), so nothing is added to `package.json`.

```js
// Bundles scripts/migrate.ts into one CommonJS file for the production image, which carries only the files Next
// traced (no tsx, no drizzle migrator). Run from the Dockerfile: node apps/portal/scripts/bundle-migrate.mjs
// esbuild is a dependency of tsx (a root devDependency), not of this app, so it is resolved through tsx and
// no dependency is added.
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const tsxPackage = createRequire(path.join(appRoot, 'package.json')).resolve('tsx/package.json');
const esbuild = createRequire(tsxPackage)('esbuild');

await esbuild.build({
  entryPoints: [path.join(appRoot, 'scripts/migrate.ts')],
  outfile: path.join(appRoot, 'scripts/migrate.cjs'),
  tsconfig: path.join(appRoot, 'tsconfig.json'),
  bundle: true,
  platform: 'node',
  target: 'node22',
  format: 'cjs',
  external: ['pg-native'],
  // CommonJS has no import.meta; keep scripts that read it working from the bundle's own location.
  define: { 'import.meta.url': '__importMetaUrl', 'import.meta.dirname': '__dirname' },
  banner: { js: "const __importMetaUrl = require('node:url').pathToFileURL(__filename).href;" },
  logLevel: 'info',
});
```

Run: `node apps/portal/scripts/bundle-migrate.mjs && ls -l apps/portal/scripts/migrate.cjs`
Expected: esbuild prints the output size, the file exists. Then check the bundle behaves like the source against the track's database, twice (idempotent, contracts M0.3 acceptance):

```bash
cd apps/portal
set -a; . ./.env; set +a
node scripts/migrate.cjs && node scripts/migrate.cjs
echo "exit=$?"
rm scripts/migrate.cjs
cd ../..
```

Expected: both runs exit 0 and the second changes nothing. **Verify (contracts M.1 item 18):** if the bundle cannot find `drizzle/` or `src/db/rls.sql`, `scripts/migrate.ts` resolves them from somewhere other than `process.cwd()` or its own folder. The image runs the bundle from `apps/portal` with both paths present (Step 7), so the fix is in `scripts/migrate.ts` (a W0-b file): append a `blocked` line asking for `process.cwd()`-relative paths. `migrate.cjs` is generated: it is ignored by the `apps/portal/.gitignore` line added in Step 12 and never committed.

- [ ] **Step 7: Create the Dockerfile and its ignore file**

The build context is the repository root (a pnpm workspace). `Dockerfile.dockerignore` sits next to the Dockerfile and replaces the root `.dockerignore` for this build (BuildKit looks for `<Dockerfile name>.dockerignore` first); `apps/cms` and `apps/web` stay in the context because pnpm checks the lockfile against every workspace `package.json`.

```dockerfile
# syntax=docker/dockerfile:1

# Build context is the repository root (pnpm workspace):
#   docker build -f apps/portal/Dockerfile -t portal:local .
# The image is a Next.js standalone server, a few hundred MB, unlike the 4.4 GB CMS image.

# ─── Stage 1: builder ─────────────────────────────────────────────────────────
# One stage for install and build, like apps/cms/Dockerfile: the pnpm lockfile gives reproducibility and a
# split deps stage loses the workspace symlinks.
FROM node:22-alpine AS builder
RUN corepack enable && corepack prepare pnpm@10.30.3 --activate
WORKDIR /app

COPY . .
RUN pnpm install --frozen-lockfile --prefer-offline

# NEXT_PUBLIC_* values are inlined into the browser bundle, so the Turnstile site key is a build argument.
# It is public by design. Secrets (database, auth, HubSpot, Brevo, R2) are runtime only and never in the image.
ARG NEXT_PUBLIC_TURNSTILE_SITE_KEY=
ENV NEXT_PUBLIC_TURNSTILE_SITE_KEY=$NEXT_PUBLIC_TURNSTILE_SITE_KEY
ENV NEXT_OUTPUT=standalone
ENV NEXT_TELEMETRY_DISABLED=1
# src/env.ts returns an unparsed object when this is 1; nothing reads a secret at build time.
ENV SKIP_ENV_VALIDATION=1

RUN pnpm --filter @cleanstart/portal build
# The standalone output has no tsx and no drizzle migrator, so the migration entry is bundled into one file.
RUN node apps/portal/scripts/bundle-migrate.mjs

# ─── Stage 2: runner ─────────────────────────────────────────────────────────
FROM node:22-alpine AS runner

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 portal
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3004
ENV HOSTNAME=0.0.0.0
ENV NEXT_TELEMETRY_DISABLED=1
# 2 GB droplet shared with Postgres and the CMS (master plan task 0.6).
ENV NODE_OPTIONS="--no-deprecation --max-old-space-size=384"

# outputFileTracingRoot is the monorepo root, so the server lands at apps/portal/server.js inside the standalone dir.
COPY --from=builder --chown=portal:nodejs /app/apps/portal/.next/standalone ./
COPY --from=builder --chown=portal:nodejs /app/apps/portal/.next/static ./apps/portal/.next/static
COPY --from=builder --chown=portal:nodejs /app/apps/portal/public ./apps/portal/public
# Read at runtime by the migration entry: the SQL migrations and the row level security script.
COPY --from=builder --chown=portal:nodejs /app/apps/portal/drizzle ./apps/portal/drizzle
COPY --from=builder --chown=portal:nodejs /app/apps/portal/src/db/rls.sql ./apps/portal/src/db/rls.sql
COPY --from=builder --chown=portal:nodejs /app/apps/portal/scripts/migrate.cjs ./apps/portal/scripts/migrate.cjs

USER portal
WORKDIR /app/apps/portal

EXPOSE 3004

HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --retries=5 \
  CMD wget -qO- http://127.0.0.1:3004/api/health || exit 1

# Migrations are idempotent (drizzle journal, then rls.sql), so running them on every start is safe.
CMD ["sh", "-c", "node scripts/migrate.cjs && node server.js"]
```

```text
# Used instead of the repository .dockerignore when building apps/portal/Dockerfile (BuildKit looks for
# <Dockerfile name>.dockerignore next to the Dockerfile first). Same rules, plus the large directories the
# portal build does not need. apps/cms and apps/web stay in the context because pnpm checks the lockfile
# against every workspace package.json.
.git
.gitignore
.claude
.claude-brain
.gstack
.impeccable
.superpowers
.vercel
.playwright-mcp
docs
infra
migrations
**/node_modules
**/.next
**/out
**/.env
**/.env.local
**/.env.development
**/.env.production
**/.turbo
**/coverage
**/playwright-report
**/test-results
**/*.log
.DS_Store
**/.DS_Store
.idea
.vscode
```

Verify the syntax without a full build (a tiny context is enough):

```bash
rm -rf /tmp/p06ctx && mkdir -p /tmp/p06ctx/apps/portal && cp apps/portal/Dockerfile /tmp/p06ctx/apps/portal/ && (cd /tmp/p06ctx && docker build --check -f apps/portal/Dockerfile .) ; rm -rf /tmp/p06ctx
```

Expected: `Check complete, no warnings found.`

- [ ] **Step 8: Reconcile and extend `infra/docker-compose.yml`**

The repo copy is out of date: it has no `cms` service and publishes Postgres and Meilisearch on all interfaces. The droplet's file (`/opt/cleanstart/compose.yml`, documented as section 6.1 of `docs/operations/CMS-DEPLOYMENT.md`) binds to `127.0.0.1`, tunes Meilisearch and has the `cms` service. The droplet file is never read here (no `ssh`); section 6.1 is the evidence. `profiles` are added because `deploy-cms.yml` already runs `docker compose --profile cms up -d --wait cms`. Replace the whole file:

```yaml
# Mirrors /opt/cleanstart/compose.yml on the droplet (docs/operations/CMS-DEPLOYMENT.md section 6.1).
# Profiles keep each deploy to its own service: `docker compose --profile cms up -d cms` and
# `docker compose --profile portal up -d portal`. Postgres and Meilisearch have no profile, so they always run.
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: cleanstart
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:?POSTGRES_PASSWORD is required}
    volumes:
      - pgdata:/var/lib/postgresql/data
    ports:
      - "127.0.0.1:5432:5432"
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres -d cleanstart"]
      interval: 10s
      timeout: 5s
      retries: 5

  meilisearch:
    image: getmeili/meilisearch:v1.9
    command: ["meilisearch", "--max-indexing-memory", "512Mb", "--max-indexing-threads", "1"]
    environment:
      MEILI_MASTER_KEY: ${MEILISEARCH_API_KEY:?MEILISEARCH_API_KEY is required}
      MEILI_ENV: production
    volumes:
      - meilidata:/meili_data
    ports:
      - "127.0.0.1:7700:7700"
    restart: unless-stopped
    healthcheck:
      # `curl` ships in the meilisearch image; `wget` does not (false-negative).
      test: ["CMD-SHELL", "curl -fsS http://localhost:7700/health || exit 1"]
      interval: 15s
      timeout: 5s
      retries: 3

  cms:
    image: cms:current # deploy-cms.yml tags the built image as cms:<sha> and cms:current
    profiles: ["cms"]
    depends_on:
      postgres:
        condition: service_healthy
      meilisearch:
        condition: service_healthy
    env_file: .env
    ports:
      - "127.0.0.1:3000:3000"
    volumes:
      - /var/lib/cleanstart/lead-fallback-queue:/var/lib/cleanstart/lead-fallback-queue
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "wget -qO- http://localhost:3000/api/health || exit 1"]
      interval: 30s
      timeout: 5s
      retries: 5
      start_period: 60s

  portal:
    image: portal:current # deploy-portal.yml tags the built image as portal:<sha> and portal:current
    profiles: ["portal"]
    depends_on:
      postgres:
        condition: service_healthy
    # The portal has its own env file, so it never sees the CMS secrets and the CMS never sees the portal's.
    env_file: portal.env
    ports:
      - "127.0.0.1:3004:3004"
    # 2 GB droplet shared with Postgres and the CMS. The image also sets --max-old-space-size=384.
    mem_limit: 512m
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "wget -qO- http://127.0.0.1:3004/api/health || exit 1"]
      interval: 30s
      timeout: 5s
      retries: 5
      start_period: 60s

volumes:
  pgdata:
  meilidata:
```

Run: `POSTGRES_PASSWORD=x MEILISEARCH_API_KEY=y docker compose -f infra/docker-compose.yml config -q && echo COMPOSE_OK`
Expected: `COMPOSE_OK`. Then confirm the portal profile resolves: `touch infra/portal.env infra/.env; POSTGRES_PASSWORD=x MEILISEARCH_API_KEY=y docker compose -f infra/docker-compose.yml --profile portal config --services; rm infra/portal.env infra/.env`
Expected: `meilisearch`, `postgres`, `portal`.

The operator compares this file with the droplet's before copying it (handover item 2). The reconciliation is by documentation only, so the compare is the real check.

- [ ] **Step 9: Write `portal.yml`**

CI on `apps/portal/**`, `packages/forms/**`, `packages/ui/**`: a Postgres 16 service with the superuser `postgres`, the two roles and the test database created by the track's own `scripts/db-create.sh`, then lint, typecheck, test (which includes the isolation matrix), the dash check and the build with `SKIP_ENV_VALIDATION=1`. A second job runs the browser suite for pull requests into `main` and on demand (it is slow, like the web `lhci` job). The CI Postgres service user differs from contracts J.2's statement ("PORTAL_TEST_OWNER_URL points at the superuser"): here the owner URL is `portal_owner`, which `db-create.sh` creates with `CREATEDB`, so CI exercises the same role split as production.

```yaml
name: Portal CI

# Fires only when something the portal build can be affected by changes (same allow-list idea as ci.yml and web.yml).
on:
  push:
    branches: [main, development]
    paths:
      - 'apps/portal/**'
      - '!apps/portal/**/*.md'
      - 'packages/forms/**'
      - 'packages/ui/**'
      - '!packages/ui/**/*.md'
      - 'packages/config/**'
      - 'pnpm-lock.yaml'
      - 'turbo.json'
      - '.github/workflows/portal.yml'
  pull_request:
    branches: [main, development]
    paths:
      - 'apps/portal/**'
      - '!apps/portal/**/*.md'
      - 'packages/forms/**'
      - 'packages/ui/**'
      - '!packages/ui/**/*.md'
      - 'packages/config/**'
      - 'pnpm-lock.yaml'
      - 'turbo.json'
      - '.github/workflows/portal.yml'
  workflow_dispatch:

concurrency:
  group: portal-${{ github.ref }}
  cancel-in-progress: true

env:
  NODE_VERSION: 24

jobs:
  portal:
    name: apps/portal · lint · typecheck · test · build
    runs-on: ubuntu-latest
    timeout-minutes: 25
    services:
      postgres:
        image: postgres:16-alpine
        env:
          POSTGRES_USER: postgres
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: postgres
        ports:
          - 5432:5432
        options: >-
          --health-cmd "pg_isready -U postgres"
          --health-interval 5s
          --health-timeout 5s
          --health-retries 10
    env:
      # scripts/db-create.sh reads these two; it creates portal_owner and portal_app with the development passwords.
      PGPASSWORD: postgres
      PORTAL_PG_ADMIN_URL: postgresql://postgres@localhost:5432/postgres
      PORTAL_TEST_DATABASE_URL: postgresql://portal_app:portal_app_dev@localhost:5432/cleanstart_portal_test
      PORTAL_TEST_OWNER_URL: postgresql://portal_owner:portal_owner_dev@localhost:5432/cleanstart_portal_test
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v4

      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: pnpm

      - name: Install
        run: pnpm install --frozen-lockfile

      - name: Build workspace dependencies
        run: pnpm --filter "@cleanstart/portal^..." --if-present build

      - name: Create the test database
        run: bash apps/portal/scripts/db-create.sh cleanstart_portal_test

      - name: Lint
        run: pnpm --filter @cleanstart/portal lint

      - name: Typecheck
        run: pnpm --filter @cleanstart/portal typecheck

      # Includes the tenant isolation matrix (src/server/repo/isolation.test.ts), which must stay green.
      - name: Test
        run: pnpm --filter @cleanstart/portal test

      - name: Verify no em-dashes or en-dashes in code-owned copy
        run: node apps/portal/scripts/verify-copy.mjs

      - name: Build
        run: pnpm --filter @cleanstart/portal build
        env:
          # env.ts must not validate at build time; nothing reads a secret during the build.
          SKIP_ENV_VALIDATION: '1'

  # Browser suite. Slow, so it runs for pull requests into main and on demand, like the web lhci job.
  e2e:
    name: apps/portal · e2e (@portal) · axe
    needs: portal
    if: github.event_name == 'workflow_dispatch' || github.base_ref == 'main'
    runs-on: ubuntu-latest
    timeout-minutes: 30
    services:
      postgres:
        image: postgres:16-alpine
        env:
          POSTGRES_USER: postgres
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: postgres
        ports:
          - 5432:5432
        options: >-
          --health-cmd "pg_isready -U postgres"
          --health-interval 5s
          --health-timeout 5s
          --health-retries 10
    env:
      PGPASSWORD: postgres
      PORTAL_PG_ADMIN_URL: postgresql://postgres@localhost:5432/postgres
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v4

      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: pnpm

      - name: Install
        run: pnpm install --frozen-lockfile

      - name: Build workspace dependencies
        run: pnpm --filter "@cleanstart/portal^..." --if-present build

      - name: Install Chromium
        run: pnpm --filter @cleanstart/portal exec playwright install --with-deps chromium

      - name: Create the e2e database
        run: bash apps/portal/scripts/db-create.sh cleanstart_portal_e2e

      - name: E2E
        run: pnpm --filter @cleanstart/portal exec playwright test
        env:
          CI: 'true'

      - name: Upload Playwright report
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: portal-playwright-report
          path: |
            apps/portal/playwright-report/
            apps/portal/test-results/
          if-no-files-found: ignore
          retention-days: 14
```

- [ ] **Step 10: Write `deploy-portal.yml`**

A copy of `deploy-cms.yml` in shape (wait for green CI on the same SHA, buildx and the GHA cache, `docker save | scp`, render the env file, `docker compose up -d --wait`, retention of the current image plus two tags, a retried local smoke probe on `127.0.0.1:3004/api/health`), with these deliberate differences: it renders `/opt/cleanstart/portal.env`, the portal's own file; it writes only non-empty values (`env.ts` rejects `KEY=` for optional variables, which would crash the container); it fails the deploy by variable name when a required production setting is missing, and when a database password is not URL safe; the Turnstile site key goes in as a build argument because `NEXT_PUBLIC_*` values are inlined into the browser bundle; and nothing deploys until the repository variable `PORTAL_DEPLOY_ENABLED` is `true` (set by the operator after the droplet steps, handover item 1).

```yaml
name: Deploy Portal

# Same shape as deploy-cms.yml: ship only a commit that Portal CI verified, build the image on the runner,
# send it to the droplet with `docker save | scp`, render the env file, restart one compose service, probe it.
#
# Nothing deploys until the repository variable PORTAL_DEPLOY_ENABLED is 'true'. The operator sets it after the
# droplet steps in docs/operations/PARTNER-PORTAL.md are done (database, compose file, Caddy block, DNS).
# Manual override stays via workflow_dispatch (input SHA, no CI check), still gated by the same variable.
on:
  workflow_run:
    workflows: ['Portal CI']
    types: [completed]
    branches: [main]
  workflow_dispatch:
    inputs:
      sha:
        description: 'Optional git SHA to deploy (defaults to the branch HEAD this run was triggered from)'
        required: false

# Serialize deploys to the prod droplet: no two builds racing the same `portal:current` tag.
concurrency:
  group: deploy-portal-prod
  cancel-in-progress: false

jobs:
  deploy:
    if: >-
      ${{ vars.PORTAL_DEPLOY_ENABLED == 'true' &&
          (github.event_name == 'workflow_dispatch' ||
           github.event.workflow_run.conclusion == 'success') }}
    runs-on: ubuntu-latest
    timeout-minutes: 30
    env:
      DEPLOY_SHA: >-
        ${{ inputs.sha
            || github.event.workflow_run.head_sha
            || github.sha }}
    steps:
      - name: Checkout
        uses: actions/checkout@v4
        with:
          ref: ${{ env.DEPLOY_SHA }}

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      # NEXT_PUBLIC_* values are inlined into the browser bundle at build time, so the Turnstile site key is a
      # build argument. It is public by design. Secrets never go into the image.
      - name: Build image (portal:${{ env.DEPLOY_SHA }})
        uses: docker/build-push-action@v5
        with:
          context: .
          file: apps/portal/Dockerfile
          tags: portal:${{ env.DEPLOY_SHA }}
          load: true
          build-args: |
            NEXT_PUBLIC_TURNSTILE_SITE_KEY=${{ vars.PORTAL_TURNSTILE_SITE_KEY }}
          cache-from: type=gha,scope=portal-deploy
          cache-to: type=gha,scope=portal-deploy,mode=max

      - name: Save image tarball
        run: docker save portal:${{ env.DEPLOY_SHA }} | gzip > /tmp/portal.tar.gz

      - name: Set up SSH to droplet
        env:
          SSH_PRIVATE_KEY: ${{ secrets.DROPLET_SSH_KEY }}
        run: |
          mkdir -p ~/.ssh
          chmod 700 ~/.ssh
          echo "$SSH_PRIVATE_KEY" > ~/.ssh/id_deploy
          chmod 600 ~/.ssh/id_deploy
          ssh-keyscan ${{ secrets.DROPLET_HOST }} >> ~/.ssh/known_hosts 2>/dev/null

      - name: Ship image to droplet
        run: |
          scp -i ~/.ssh/id_deploy /tmp/portal.tar.gz \
            ${{ secrets.DROPLET_USER }}@${{ secrets.DROPLET_HOST }}:/tmp/portal.tar.gz

      # Renders /opt/cleanstart/portal.env, the portal's own file (never the CMS's .env). Empty values are not
      # written: env.ts rejects an empty string for an optional variable, so `KEY=` would crash the container.
      # Required production variables are checked first so a missing one fails the deploy with its name, not the
      # container with a crash loop.
      - name: Render portal.env to droplet
        env:
          # Variables
          APP_URL: ${{ vars.PORTAL_APP_URL }}
          PARTNER_AGREEMENT_VERSION: ${{ vars.PARTNER_AGREEMENT_VERSION }}
          BREVO_SENDER_EMAIL: ${{ vars.PORTAL_BREVO_SENDER_EMAIL }}
          PARTNERS_NOTIFY_EMAIL: ${{ vars.PARTNERS_NOTIFY_EMAIL }}
          R2_ENDPOINT: ${{ vars.PORTAL_R2_ENDPOINT }}
          R2_BUCKET: ${{ vars.PORTAL_R2_BUCKET }}
          HUBSPOT_PARTNER_PIPELINE_ID: ${{ vars.HUBSPOT_PARTNER_PIPELINE_ID }}
          HUBSPOT_USE_ASSOCIATION_LABELS: ${{ vars.HUBSPOT_USE_ASSOCIATION_LABELS }}
          HUBSPOT_PORTAL_ID: ${{ vars.HUBSPOT_PORTAL_ID }}
          PORTAL_JOBS_ENABLED: ${{ vars.PORTAL_JOBS_ENABLED }}
          NEXT_PUBLIC_TURNSTILE_SITE_KEY: ${{ vars.PORTAL_TURNSTILE_SITE_KEY }}
          MICROSOFT_TENANT_ID: ${{ vars.PORTAL_MICROSOFT_TENANT_ID }}
          GOOGLE_CLIENT_ID: ${{ vars.PORTAL_GOOGLE_CLIENT_ID }}
          MICROSOFT_CLIENT_ID: ${{ vars.PORTAL_MICROSOFT_CLIENT_ID }}
          # Secrets
          PORTAL_OWNER_DB_PASSWORD: ${{ secrets.PORTAL_OWNER_DB_PASSWORD }}
          PORTAL_APP_DB_PASSWORD: ${{ secrets.PORTAL_APP_DB_PASSWORD }}
          AUTH_SECRET: ${{ secrets.PORTAL_AUTH_SECRET }}
          GOOGLE_CLIENT_SECRET: ${{ secrets.PORTAL_GOOGLE_CLIENT_SECRET }}
          MICROSOFT_CLIENT_SECRET: ${{ secrets.PORTAL_MICROSOFT_CLIENT_SECRET }}
          BREVO_API_KEY: ${{ secrets.BREVO_API_KEY }}
          R2_ACCESS_KEY_ID: ${{ secrets.PORTAL_R2_ACCESS_KEY_ID }}
          R2_SECRET_ACCESS_KEY: ${{ secrets.PORTAL_R2_SECRET_ACCESS_KEY }}
          HUBSPOT_PORTAL_TOKEN: ${{ secrets.PORTAL_HUBSPOT_TOKEN }}
          HUBSPOT_WEBHOOK_SECRET: ${{ secrets.PORTAL_HUBSPOT_WEBHOOK_SECRET }}
          CMS_INTAKE_API_KEY: ${{ secrets.PORTAL_CMS_INTAKE_API_KEY }}
          TURNSTILE_SECRET_KEY: ${{ secrets.PORTAL_TURNSTILE_SECRET_KEY }}
          SENTRY_DSN: ${{ secrets.PORTAL_SENTRY_DSN }}
          PORTAL_REVIEW_PASSWORD: ${{ secrets.PORTAL_REVIEW_PASSWORD }}
        run: |
          set -euo pipefail

          missing=""
          for key in APP_URL PORTAL_OWNER_DB_PASSWORD PORTAL_APP_DB_PASSWORD AUTH_SECRET BREVO_API_KEY \
                     BREVO_SENDER_EMAIL R2_ENDPOINT R2_BUCKET R2_ACCESS_KEY_ID R2_SECRET_ACCESS_KEY \
                     HUBSPOT_PORTAL_TOKEN HUBSPOT_PARTNER_PIPELINE_ID HUBSPOT_WEBHOOK_SECRET \
                     TURNSTILE_SECRET_KEY NEXT_PUBLIC_TURNSTILE_SITE_KEY SENTRY_DSN; do
            if [ -z "${!key:-}" ]; then missing="$missing $key"; fi
          done
          if [ -n "$missing" ]; then
            echo "::error::Missing required portal settings:$missing"
            exit 1
          fi

          # The database passwords go into connection URLs, so they must be URL safe (use: openssl rand -hex 24).
          for key in PORTAL_OWNER_DB_PASSWORD PORTAL_APP_DB_PASSWORD; do
            if ! [[ "${!key}" =~ ^[A-Za-z0-9]+$ ]]; then
              echo "::error::$key must be letters and digits only (openssl rand -hex 24)"
              exit 1
            fi
          done
          if [ "${#AUTH_SECRET}" -lt 32 ]; then
            echo "::error::PORTAL_AUTH_SECRET must be at least 32 characters (openssl rand -base64 32)"
            exit 1
          fi

          emit() { if [ -n "${2:-}" ]; then printf '%s=%s\n' "$1" "$2"; fi; }

          {
            emit NODE_ENV production
            emit PORT 3004
            emit HOSTNAME 0.0.0.0
            emit APP_URL "$APP_URL"
            emit DATABASE_URL "postgres://portal_app:${PORTAL_APP_DB_PASSWORD}@postgres:5432/cleanstart_portal"
            emit DATABASE_OWNER_URL "postgres://portal_owner:${PORTAL_OWNER_DB_PASSWORD}@postgres:5432/cleanstart_portal"
            emit AUTH_SECRET "$AUTH_SECRET"
            emit GOOGLE_CLIENT_ID "$GOOGLE_CLIENT_ID"
            emit GOOGLE_CLIENT_SECRET "$GOOGLE_CLIENT_SECRET"
            emit MICROSOFT_CLIENT_ID "$MICROSOFT_CLIENT_ID"
            emit MICROSOFT_CLIENT_SECRET "$MICROSOFT_CLIENT_SECRET"
            emit MICROSOFT_TENANT_ID "$MICROSOFT_TENANT_ID"
            emit PARTNER_AGREEMENT_VERSION "$PARTNER_AGREEMENT_VERSION"
            emit BREVO_API_KEY "$BREVO_API_KEY"
            emit BREVO_SENDER_EMAIL "$BREVO_SENDER_EMAIL"
            emit PARTNERS_NOTIFY_EMAIL "$PARTNERS_NOTIFY_EMAIL"
            emit R2_ENDPOINT "$R2_ENDPOINT"
            emit R2_BUCKET "$R2_BUCKET"
            emit R2_ACCESS_KEY_ID "$R2_ACCESS_KEY_ID"
            emit R2_SECRET_ACCESS_KEY "$R2_SECRET_ACCESS_KEY"
            emit HUBSPOT_PORTAL_TOKEN "$HUBSPOT_PORTAL_TOKEN"
            emit HUBSPOT_PARTNER_PIPELINE_ID "$HUBSPOT_PARTNER_PIPELINE_ID"
            emit HUBSPOT_USE_ASSOCIATION_LABELS "$HUBSPOT_USE_ASSOCIATION_LABELS"
            emit HUBSPOT_WEBHOOK_SECRET "$HUBSPOT_WEBHOOK_SECRET"
            emit HUBSPOT_PORTAL_ID "$HUBSPOT_PORTAL_ID"
            emit PORTAL_JOBS_ENABLED "${PORTAL_JOBS_ENABLED:-true}"
            emit CMS_API_URL http://cms:3000
            emit CMS_INTAKE_API_KEY "$CMS_INTAKE_API_KEY"
            emit TURNSTILE_SECRET_KEY "$TURNSTILE_SECRET_KEY"
            emit NEXT_PUBLIC_TURNSTILE_SITE_KEY "$NEXT_PUBLIC_TURNSTILE_SITE_KEY"
            emit SENTRY_DSN "$SENTRY_DSN"
            emit SENTRY_ENVIRONMENT production
            emit PORTAL_REVIEW_PASSWORD "$PORTAL_REVIEW_PASSWORD"
          } | ssh -i ~/.ssh/id_deploy \
            ${{ secrets.DROPLET_USER }}@${{ secrets.DROPLET_HOST }} \
            'umask 077 && cat > /opt/cleanstart/portal.env && chmod 600 /opt/cleanstart/portal.env'

      - name: Load image + restart portal
        run: |
          ssh -i ~/.ssh/id_deploy \
            ${{ secrets.DROPLET_USER }}@${{ secrets.DROPLET_HOST }} \
            'set -e
             cd /opt/cleanstart
             docker load < /tmp/portal.tar.gz
             docker tag portal:${{ env.DEPLOY_SHA }} portal:current
             docker compose --profile portal up -d --wait --wait-timeout 300 portal

             # Retention: keep portal:current + 2 most recent SHA tags for fast rollback.
             docker images portal --format "{{.Tag}}\t{{.CreatedAt}}" \
               | grep -v "^current\b" \
               | sort -k2 -r \
               | tail -n +3 \
               | awk "{print \$1}" \
               | xargs -r -I{} docker rmi "portal:{}" || true
             docker image prune -f

             rm -f /tmp/portal.tar.gz
             echo "--- portal container status ---"
             docker ps --filter name=cleanstart-portal-1 --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
             echo "--- last 20 lines of portal log ---"
             docker logs --tail 20 cleanstart-portal-1
             echo "--- droplet disk after deploy ---"
             df -h / | tail -1'

      - name: Smoke probe
        run: |
          # compose --wait already gated on the container healthcheck; retry the local probe (6 x 5s) so a slow
          # first response does not red an otherwise-healthy deploy. A sustained failure still fails the job.
          ssh -i ~/.ssh/id_deploy \
            ${{ secrets.DROPLET_USER }}@${{ secrets.DROPLET_HOST }} \
            'for i in $(seq 1 6); do
               code=$(curl -sS -o /dev/null -w "%{http_code}" --max-time 10 http://127.0.0.1:3004/api/health || echo 000)
               echo "attempt $i: local 127.0.0.1:3004/api/health -> HTTP $code"
               [ "$code" = "200" ] && exit 0
               [ "$i" -lt 6 ] && sleep 5
             done
             echo "local health probe failed after 6 attempts"
             exit 1'
          curl -sS -o /dev/null -w "public partners.cleanstart.com -> HTTP %{http_code}\n" --max-time 10 https://partners.cleanstart.com/api/health || true
```

- [ ] **Step 11: Lint both workflows and the env rendering**

```bash
actionlint .github/workflows/portal.yml .github/workflows/deploy-portal.yml && echo ACTIONLINT_OK
```

Expected: `ACTIONLINT_OK` (actionlint runs shellcheck over every `run:` block). Then exercise the rendering logic with a throwaway script that extracts the `Render portal.env to droplet` step, replaces its `ssh` pipe with `cat`, and runs it three ways:

```bash
python3 - <<'PY'
import os, re, subprocess, yaml
d = yaml.safe_load(open('.github/workflows/deploy-portal.yml'))
step = next(s for s in d['jobs']['deploy']['steps'] if s.get('name') == 'Render portal.env to droplet')
script = re.sub(r"\} \| ssh .*?\n\s+'umask 077.*?'\n", "} | cat\n", step['run'], flags=re.S)
base = {k: '' for k in step['env']}
base.update(APP_URL='https://partners.cleanstart.com', PORTAL_OWNER_DB_PASSWORD='abc123', PORTAL_APP_DB_PASSWORD='def456',
  AUTH_SECRET='x' * 40, BREVO_API_KEY='k', BREVO_SENDER_EMAIL='p@cleanstart.com', R2_ENDPOINT='https://r2', R2_BUCKET='b',
  R2_ACCESS_KEY_ID='a', R2_SECRET_ACCESS_KEY='s', HUBSPOT_PORTAL_TOKEN='t', HUBSPOT_PARTNER_PIPELINE_ID='p1',
  HUBSPOT_WEBHOOK_SECRET='w', TURNSTILE_SECRET_KEY='ts', NEXT_PUBLIC_TURNSTILE_SITE_KEY='tk', SENTRY_DSN='https://x@y/1')
def run(**over):
    r = subprocess.run(['bash', '-c', script], env={**os.environ, **base, **over}, capture_output=True, text=True)
    return r.returncode, r.stdout.strip().splitlines()[:1] or r.stdout
print('complete   ->', run()[0])
print('no secret  ->', run(AUTH_SECRET=''))
print('bad pw     ->', run(PORTAL_APP_DB_PASSWORD='a/b+c'))
PY
```

Expected: `complete -> 0`; `no secret -> (1, ['::error::Missing required portal settings: AUTH_SECRET'])`; `bad pw -> (1, ['::error::PORTAL_APP_DB_PASSWORD must be letters and digits only (openssl rand -hex 24)'])`.

- [ ] **Step 12: Run the image locally** (needs the Wave 0 `next.config.ts` and `proxy.ts` changes checked in Step 2)

Add the generated bundle to `apps/portal/.gitignore` (a new file inside the portal), build, and run the container against the local Postgres with throwaway values. The production environment check demands every production variable, so the placeholders below satisfy it; nothing sends mail or calls HubSpot from `/api/health`.

```bash
grep -qx 'scripts/migrate.cjs' apps/portal/.gitignore 2>/dev/null || printf '%s\n' 'scripts/migrate.cjs' >> apps/portal/.gitignore
bash apps/portal/scripts/db-create.sh cleanstart_portal_docker
docker build -f apps/portal/Dockerfile -t portal:local .
docker image ls portal:local --format '{{.Size}}'
docker run -d --name portal-local -p 127.0.0.1:3304:3004 \
  -e APP_URL=http://localhost:3304 \
  -e DATABASE_URL=postgresql://portal_app:portal_app_dev@host.docker.internal:5432/cleanstart_portal_docker \
  -e DATABASE_OWNER_URL=postgresql://portal_owner:portal_owner_dev@host.docker.internal:5432/cleanstart_portal_docker \
  -e AUTH_SECRET=local-docker-secret-local-docker-secret-1234 \
  -e BREVO_API_KEY=placeholder -e BREVO_SENDER_EMAIL=placeholder@example.com \
  -e R2_ENDPOINT=http://localhost:9 -e R2_BUCKET=placeholder -e R2_ACCESS_KEY_ID=placeholder -e R2_SECRET_ACCESS_KEY=placeholder \
  -e HUBSPOT_PORTAL_TOKEN=placeholder -e HUBSPOT_PARTNER_PIPELINE_ID=placeholder -e HUBSPOT_WEBHOOK_SECRET=placeholder \
  -e TURNSTILE_SECRET_KEY=placeholder -e NEXT_PUBLIC_TURNSTILE_SITE_KEY=placeholder -e SENTRY_DSN=https://k@o1.ingest.sentry.io/1 \
  portal:local
sleep 25
docker logs portal-local 2>&1 | tail -15
curl -sS -i http://127.0.0.1:3304/api/health | head -12
docker inspect --format '{{.State.Health.Status}}' portal-local
docker rm -f portal-local
```

Expected: the image size is a few hundred MB; the log shows the migration finishing and `Ready`; the health call is `HTTP/1.1 200`, body `{"status":"ok"}` with `Cache-Control: no-store` and `Content-Security-Policy: default-src 'none'; frame-ancestors 'none'` once M5.1 has landed; the health status becomes `healthy`. **Verify (contracts M.1 item 18):** if the container exits with `Cannot find module '/app/apps/portal/server.js'`, the standalone folder is not nested (tracing root not applied): `docker run --rm --entrypoint sh portal:local -c 'find /app -maxdepth 3 -name server.js'` shows where it is. Fix the `COPY` and `WORKDIR` lines of the Dockerfile to that path and record it in the progress log. If the container exits before the migration, read the error: the usual cause is a variable the production check requires.

- [ ] **Step 13: Write the runbook sections 1 to 3**

Create `docs/operations/PARTNER-PORTAL.md` (if H or another track already created it, append the sections below instead of overwriting). M5.9 adds sections 4 to 11 later. These are the one-time droplet steps, as a person will run them; each is "read the command first".

````markdown
# Partner portal runbook

The partner portal is `apps/portal`: one Next.js container on the production droplet, beside the CMS, behind Caddy and Cloudflare at `partners.cleanstart.com`, with its own database `cleanstart_portal` in the droplet's Postgres, a private R2 bucket for documents, Brevo for email and HubSpot for deals. Product and design decisions are in `docs/superpowers/plans/2026-11-11-partner-portal-master-plan.md`; the build contracts are in `docs/superpowers/plans/2026-11-12-partner-portal-00-contracts.md`. This file is how to run it.

Sections 1 to 3 are written by the build (M0.6). Sections 4 to 11 are the operations half (M5.9).

## 1. One-time droplet setup (a person, once)

Nothing here is automated. Read each command before you run it. Take a droplet snapshot first.

| # | Step | Done when |
|---|---|---|
| 1.1 | Take a DigitalOcean snapshot of the droplet. | snapshot listed |
| 1.2 | Resize one size up (CPU and RAM only, reversible). The portal, the CMS and Postgres share one vCPU and 2 GB. | `free -m` shows the new RAM |
| 1.3 | Raise Postgres connections. The droplet runs `max_connections = 20` (INCIDENTS 2026-10-14); the CMS pool takes 15 and the portal up to 14 (6 request, 8 system, `CONNECTION LIMIT` 20). `docker compose -f /opt/cleanstart/compose.yml exec -T postgres psql -U postgres -c "ALTER SYSTEM SET max_connections = 50;"` then restart Postgres in a quiet minute: `docker compose -f /opt/cleanstart/compose.yml restart postgres`. This restarts the database the production CMS uses, so it needs the operator's explicit approval. | `SHOW max_connections;` prints 50 |
| 1.4 | Create the roles and the database. Copy `apps/portal/scripts/db-bootstrap.sql` to the droplet, read it, then run it as the Postgres superuser with passwords made by `openssl rand -hex 24` (hex keeps them URL safe): `psql -v ON_ERROR_STOP=1 -v dbname=cleanstart_portal -v owner_password=<hex> -v app_password=<hex> -v conn_limit=20 -v allow_createdb=off -f db-bootstrap.sql` against the `postgres` database of the compose Postgres. | `\l` lists `cleanstart_portal` owned by `portal_owner`; `\du` lists `portal_owner` and `portal_app` |
| 1.5 | Replace `/opt/cleanstart/compose.yml` with `infra/docker-compose.yml` from the repo after comparing the two (`diff`). The `cms` and `portal` services use profiles, so `docker compose up -d` with no profile still starts only Postgres and Meilisearch. | `docker compose config --services` lists postgres, meilisearch, cms, portal |
| 1.6 | Add the Caddy block below to `/etc/caddy/Caddyfile`, then `caddy validate --config /etc/caddy/Caddyfile` and `systemctl reload caddy`. | validate prints "Valid configuration" |
| 1.7 | Cloudflare: an `A` record `partners` to the droplet (proxied, SSL Full strict, as for `cms`), and the same WAF rule set that `cms.cleanstart.com` has. | the record resolves |
| 1.8 | Firewall: accept port 443 only from Cloudflare's published ranges (`ufw`), so a visitor cannot reach Caddy directly and invent a client address (the Caddy block trusts `CF-Connecting-IP`). | `ufw status` shows the Cloudflare ranges |
| 1.9 | Check that the Brevo account allows the droplet's address (it already does for the CMS). | a test send from the portal succeeds later |

Caddy block (same log settings as `cms.cleanstart.com`, a separate file):

```
partners.cleanstart.com {
  encode zstd gzip

  reverse_proxy localhost:3004 {
    # Cloudflare is in front: take the visitor's address from its header, never from the request.
    header_up X-Forwarded-For {http.request.header.CF-Connecting-IP}
    header_up X-Real-IP {http.request.header.CF-Connecting-IP}
  }

  log {
    output file /var/log/caddy/portal-access.log {
      roll_size 10mb
      roll_keep 7
    }
    format json
  }
}
```

## 2. GitHub settings (a person, once)

Repository variables (Settings, Secrets and variables, Variables):

| Variable | Value |
|---|---|
| `PORTAL_DEPLOY_ENABLED` | `true` only after section 1 is finished. Until then the deploy workflow does nothing. |
| `PORTAL_APP_URL` | `https://partners.cleanstart.com` |
| `PORTAL_TURNSTILE_SITE_KEY` | the portal's own Turnstile widget (hostname `partners.cleanstart.com`), public |
| `PORTAL_BREVO_SENDER_EMAIL` | the verified sender address |
| `PORTAL_R2_ENDPOINT`, `PORTAL_R2_BUCKET` | the private documents bucket (`cleanstart-partner-docs`) |
| `PARTNER_AGREEMENT_VERSION` | the label legal gives (until then the build default `draft-0` shows on the invite screen) |
| `PARTNERS_NOTIFY_EMAIL` | fallback staff address |
| `HUBSPOT_PARTNER_PIPELINE_ID`, `HUBSPOT_PORTAL_ID`, `HUBSPOT_USE_ASSOCIATION_LABELS` | from `docs/partner-portal/HUBSPOT-PROVISIONING.md` |
| `PORTAL_JOBS_ENABLED` | leave unset (the workflow renders `true`) |
| `PORTAL_GOOGLE_CLIENT_ID`, `PORTAL_MICROSOFT_CLIENT_ID`, `PORTAL_MICROSOFT_TENANT_ID` | optional, only when sign in with Google or Microsoft is enabled |

Repository secrets: `PORTAL_OWNER_DB_PASSWORD`, `PORTAL_APP_DB_PASSWORD` (the two hex passwords from step 1.4), `PORTAL_AUTH_SECRET` (`openssl rand -base64 32`), `BREVO_API_KEY` (shared with the CMS: it is the same Brevo account), `PORTAL_R2_ACCESS_KEY_ID`, `PORTAL_R2_SECRET_ACCESS_KEY` (scoped to the private bucket only), `PORTAL_HUBSPOT_TOKEN`, `PORTAL_HUBSPOT_WEBHOOK_SECRET`, `PORTAL_CMS_INTAKE_API_KEY` (the CMS service user's API key), `PORTAL_TURNSTILE_SECRET_KEY`, `PORTAL_SENTRY_DSN`, and optionally `PORTAL_REVIEW_PASSWORD`, `PORTAL_GOOGLE_CLIENT_SECRET`, `PORTAL_MICROSOFT_CLIENT_SECRET`. `DROPLET_SSH_KEY`, `DROPLET_HOST` and `DROPLET_USER` already exist for the CMS deploy.

## 3. Deploy and roll back

Deploys run from `.github/workflows/deploy-portal.yml` after the `Portal CI` run for the same commit on `main` is green (or by hand with `workflow_dispatch`). It builds `portal:<sha>`, ships it, renders `/opt/cleanstart/portal.env`, runs `docker compose --profile portal up -d --wait portal` and probes `127.0.0.1:3004/api/health`. The container runs the migrations on start, then the server.

Roll back to the previous image (the droplet keeps `portal:current` and two older tags):

```bash
cd /opt/cleanstart
docker images portal --format "{{.Tag}}\t{{.CreatedAt}}"      # pick the previous sha
docker tag portal:<previous-sha> portal:current
docker compose --profile portal up -d --wait portal
curl -fsS http://127.0.0.1:3004/api/health
```

Migrations only move forward. A release that added a column is rolled back to an image that ignores it; never drop a column in the same release that stops using it.
````

- [ ] **Step 14: Gate A and commit**

Run the standard Gate A block. Extra checks for this task:

```bash
node -e "const d=new RegExp('['+String.fromCharCode(8211,8212)+']');let bad=0;for(const f of process.argv.slice(1)){require('fs').readFileSync(f,'utf8').split('\n').forEach((l,i)=>{if(d.test(l)){console.log(f+':'+(i+1));bad=1}})}process.exit(bad)" .github/workflows/portal.yml .github/workflows/deploy-portal.yml infra/docker-compose.yml apps/portal/Dockerfile apps/portal/Dockerfile.dockerignore docs/operations/PARTNER-PORTAL.md
git status --short
```

Expected: no dash output; `git status` lists only the paths in the Files block plus `apps/portal/.gitignore` (and no `migrate.cjs`). Then Gate B, then:

```bash
git add apps/portal/Dockerfile apps/portal/Dockerfile.dockerignore apps/portal/scripts/bundle-migrate.mjs apps/portal/scripts/verify-copy.mjs apps/portal/src/app/api/health/route.ts apps/portal/src/app/api/health/route.test.ts .github/workflows/portal.yml .github/workflows/deploy-portal.yml infra/docker-compose.yml docs/operations/PARTNER-PORTAL.md apps/portal/.gitignore docs/superpowers/plans/2026-11-12-partner-portal-06-admin-infra-hardening.md
git commit -m "feat(portal): M0.6 container image, health route, CI and deploy workflows, compose service, runbook"
```

Record the `done` line with the workflow note ("workflows written, cannot run before a push; docker build run locally: yes or no").


### Task M4.2: Audit log screen with filters, CSV export and the HubSpot health card

**Gate A for this task:** the standard block. `pnpm --filter @cleanstart/portal test` includes the isolation matrix, which picks `repo/audit.ts` up automatically through its `isolation` export.

**Files:**
- Create: `src/lib/audit-filters.ts`, `src/lib/audit-csv.ts`, `src/server/repo/audit.ts`, `src/server/actions/audit.ts`, `src/components/audit/IntegrationHealthCard.tsx`
- Modify (convert from the mock): `src/components/screens/AdminAudit.tsx`, `src/components/people/AuditDrawer.tsx`, `src/app/admin/audit/page.tsx`
- Test: `src/lib/audit-filters.test.ts`, `src/lib/audit-csv.test.ts`, `src/server/repo/audit.test.ts`, `src/server/actions/audit.test.ts`

All paths below are under `apps/portal`. Behaviour comes from the mock (`AdminAudit.tsx`, `AuditDrawer.tsx`, `data/audit.ts`) and contracts H.12 and F.4: the filters are Action (`AuditKind`), Who (`AuditWho`) and Period (7, 30, 90 days); the table is When, Who, Action, On, Source; the drawer shows When, Who, Role, Action, On, Source, the Before and After change and the Details note; the export is a CSV of the filtered set. Only the partner manager may open it (`audit.read`, `audit.export`).

Design decisions (all recorded here, none changes a contract):
- The filters live in the URL (`?period=7d&kind=partners&who=sync&q=pearl&cursor=...`). The page is a Server Component that parses them with `parseAuditView`, loads one page with `listAudit` and passes it down. No list action is needed (contracts H.20 lists only `exportAuditAction` and `retryFailedOutboxAction`). Typing in the search box updates the URL 300 ms after the last key.
- Paging is by cursor on `(at, id)`; the cursor carries the timestamp as Postgres prints it (microseconds), because a JS `Date` keeps only milliseconds and rows can share a millisecond.
- The CSV is built in the browser from the rows `exportAuditAction` returns (cap 5000, `ValidationError` above). A cell that starts with `=`, `+`, `-`, `@` or a control character gets a leading apostrophe, because partner names and notes are typed by visitors and a spreadsheet would run them as formulas.
- The health card is passed to the screen as a ReactNode slot by the page, so the screen does not depend on track H's `integration-health.ts`. Steps 1 to 6 do not need H4.10; steps 7 to 9 do.

- [ ] **Step 1: Write the failing library tests**

Create `src/lib/audit-filters.test.ts` and `src/lib/audit-csv.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { auditViewToExportFilter, auditViewToQuery, parseAuditView } from './audit-filters';

describe('parseAuditView', () => {
  it('defaults to the last 30 days with no other filter', () => {
    expect(parseAuditView({})).toEqual({ period: '30d', kind: null, who: null, q: '', cursor: null });
  });

  it('reads known values and ignores unknown ones', () => {
    expect(parseAuditView({ period: '7d', kind: 'partners', who: 'sync', q: ' pearl ' })).toEqual({
      period: '7d',
      kind: 'partners',
      who: 'sync',
      q: 'pearl',
      cursor: null,
    });
    expect(parseAuditView({ period: '1y', kind: 'drop table', who: 'robots' })).toMatchObject({
      period: '30d',
      kind: null,
      who: null,
    });
  });

  it('takes the first value of a repeated parameter and caps the search text', () => {
    expect(parseAuditView({ period: ['90d', '7d'] }).period).toBe('90d');
    expect(parseAuditView({ q: 'x'.repeat(500) }).q).toHaveLength(100);
    expect(parseAuditView({ cursor: 'c'.repeat(301) }).cursor).toBeNull();
  });
});

describe('auditViewToQuery', () => {
  it('writes nothing for the default view and only the changed filters otherwise', () => {
    expect(auditViewToQuery(parseAuditView({}))).toBe('');
    expect(auditViewToQuery({ period: '7d', kind: 'documents', who: null, q: 'a b', cursor: 'abc' })).toBe(
      '?period=7d&kind=documents&q=a+b&cursor=abc',
    );
  });

  it('round trips through parseAuditView', () => {
    const view = { period: '90d', kind: 'people_access', who: 'staff', q: 'Omar', cursor: null } as const;
    const params = Object.fromEntries(new URLSearchParams(auditViewToQuery(view)));
    expect(parseAuditView(params)).toEqual(view);
  });
});

describe('auditViewToExportFilter', () => {
  it('leaves out the cursor and the unset filters', () => {
    expect(auditViewToExportFilter({ period: '7d', kind: null, who: 'sync', q: '', cursor: 'abc' })).toEqual({
      period: '7d',
      who: 'sync',
    });
  });
});
```

```ts
import { describe, expect, it } from 'vitest';
import type { AuditEntryDto } from '@/lib/dto';
import { auditToCsv, csvCell, fullTimestamp } from './audit-csv';

const entry = (over: Partial<AuditEntryDto> = {}): AuditEntryDto => ({
  id: 'e1',
  at: '2026-11-06T14:02:00.000Z',
  actorId: null,
  actorLabel: 'Omar Nasser',
  actorRole: 'Partner manager',
  whoKind: 'staff',
  kind: 'deal_decisions',
  event: 'registration.accepted',
  action: 'Accepted a registration',
  target: 'Pearl Gulf Bank, CleanSight',
  source: 'portal',
  before: null,
  after: null,
  note: 'Protected until 3 Feb 2027.',
  partnerId: null,
  ...over,
});

describe('csvCell', () => {
  it('quotes and doubles embedded quotes', () => {
    expect(csvCell('say "hi", now')).toBe('"say ""hi"", now"');
  });

  it.each(['=SUM(A1:A9)', '+1', '-2', '@cmd', '\tx'])('neutralises a formula start: %s', (value) => {
    expect(csvCell(value)).toBe(`"'${value}"`);
  });
});

describe('auditToCsv', () => {
  it('writes a header and one row per event with the source label', () => {
    const csv = auditToCsv([entry(), entry({ id: 'e2', actorRole: null, note: null, source: 'crm', target: '=HYPERLINK("x")' })]);
    expect(csv.split('\n')).toEqual([
      '"When","Who","Role","Action","On","Source","Details"',
      '"6 Nov 2026, 14:02","Omar Nasser","Partner manager","Accepted a registration","Pearl Gulf Bank, CleanSight","Portal","Protected until 3 Feb 2027."',
      '"6 Nov 2026, 14:02","Omar Nasser","","Accepted a registration","\'=HYPERLINK(""x"")","CRM",""',
    ]);
  });

  it('formats the timestamp in UTC like the drawer', () => {
    expect(fullTimestamp('2026-11-06T23:59:00.000Z')).toBe('6 Nov 2026, 23:59');
  });
});
```

Run: `pnpm --filter @cleanstart/portal exec vitest run src/lib/audit-filters.test.ts src/lib/audit-csv.test.ts`
Expected: FAIL, both modules cannot be resolved.

- [ ] **Step 2: Implement the two libraries**

Both are pure and client safe (no `@/db`, no `next/*`).

```ts
import { AUDIT_KIND_LABEL, AUDIT_KINDS, AUDIT_WHO, type AuditKind, type AuditWho, isOneOf } from '@/lib/domain';
import type { AuditPeriod } from '@/lib/dto';

/** The Audit log filters as they live in the URL. Pure and client safe; the page parses, the screen writes. */
export interface AuditView {
  period: AuditPeriod;
  kind: AuditKind | null;
  who: AuditWho | null;
  q: string;
  cursor: string | null;
}

export const AUDIT_PERIODS = ['7d', '30d', '90d'] as const satisfies readonly AuditPeriod[];
export const DEFAULT_AUDIT_PERIOD: AuditPeriod = '30d';
export const AUDIT_Q_MAX = 100;

export const AUDIT_PERIOD_LABEL: Record<AuditPeriod, string> = {
  '7d': 'Last 7 days',
  '30d': 'Last 30 days',
  '90d': 'Last 90 days',
};

export const AUDIT_WHO_LABEL: Record<AuditWho, string> = {
  staff: 'CleanStart team',
  partner: 'Partner users',
  sync: 'HubSpot sync',
};

export const ALL_ACTIONS_LABEL = 'All actions';
export const ANYONE_LABEL = 'Anyone';

export interface Choice<T extends string> {
  value: T | '';
  label: string;
}

export const KIND_CHOICES: Choice<AuditKind>[] = [
  { value: '', label: ALL_ACTIONS_LABEL },
  ...AUDIT_KINDS.map((value) => ({ value, label: AUDIT_KIND_LABEL[value] })),
];
export const WHO_CHOICES: Choice<AuditWho>[] = [
  { value: '', label: ANYONE_LABEL },
  ...AUDIT_WHO.map((value) => ({ value, label: AUDIT_WHO_LABEL[value] })),
];
export const PERIOD_CHOICES: Choice<AuditPeriod>[] = AUDIT_PERIODS.map((value) => ({
  value,
  label: AUDIT_PERIOD_LABEL[value],
}));

type Params = Record<string, string | string[] | undefined>;

const first = (value: string | string[] | undefined): string | undefined => (Array.isArray(value) ? value[0] : value);

/** Anything unknown falls back to the default, so a hand edited URL never throws. */
export function parseAuditView(params: Params): AuditView {
  const period = first(params.period);
  const kind = first(params.kind);
  const who = first(params.who);
  const cursor = first(params.cursor);
  return {
    period: isOneOf(AUDIT_PERIODS, period) ? period : DEFAULT_AUDIT_PERIOD,
    kind: isOneOf(AUDIT_KINDS, kind) ? kind : null,
    who: isOneOf(AUDIT_WHO, who) ? who : null,
    q: (first(params.q) ?? '').trim().slice(0, AUDIT_Q_MAX),
    cursor: cursor && cursor.length <= 300 ? cursor : null,
  };
}

/** "" for the default view, otherwise "?period=7d&kind=partners". Defaults are omitted to keep URLs short. */
export function auditViewToQuery(view: AuditView): string {
  const search = new URLSearchParams();
  if (view.period !== DEFAULT_AUDIT_PERIOD) search.set('period', view.period);
  if (view.kind) search.set('kind', view.kind);
  if (view.who) search.set('who', view.who);
  if (view.q) search.set('q', view.q);
  if (view.cursor) search.set('cursor', view.cursor);
  const text = search.toString();
  return text ? `?${text}` : '';
}

/** The filter the export action takes: everything except the cursor. */
export function auditViewToExportFilter(view: AuditView): {
  period: AuditPeriod;
  kind?: AuditKind;
  who?: AuditWho;
  q?: string;
} {
  return {
    period: view.period,
    ...(view.kind ? { kind: view.kind } : {}),
    ...(view.who ? { who: view.who } : {}),
    ...(view.q ? { q: view.q } : {}),
  };
}
```

```ts
import { EVENT_SOURCE_LABEL } from '@/lib/domain';
import { fmtLong } from '@/lib/dates';
import type { AuditEntryDto } from '@/lib/dto';

const HEADER = ['When', 'Who', 'Role', 'Action', 'On', 'Source', 'Details'] as const;

/**
 * A cell that starts with = + - @ or a control character is read as a formula by Excel and Sheets. Partner names
 * and notes are typed by visitors, so such a cell gets a leading apostrophe instead of being able to run.
 */
const FORMULA_START = /^[=+\-@\t\r]/;

export const csvCell = (value: string): string => {
  const safe = FORMULA_START.test(value) ? `'${value}` : value;
  return `"${safe.replaceAll('"', '""')}"`;
};

/** "6 Nov 2026, 14:02" in UTC, the same text the drawer shows. */
export const fullTimestamp = (iso: string): string => `${fmtLong(iso)}, ${iso.slice(11, 16)}`;

export function auditToCsv(rows: readonly AuditEntryDto[]): string {
  const lines = rows.map((e) =>
    [
      fullTimestamp(e.at),
      e.actorLabel,
      e.actorRole ?? '',
      e.action,
      e.target,
      EVENT_SOURCE_LABEL[e.source],
      e.note ?? '',
    ]
      .map(csvCell)
      .join(','),
  );
  return [HEADER.map(csvCell).join(','), ...lines].join('\n');
}
```

Run the same command. Expected: PASS, 14 tests.

- [ ] **Step 3: Write the failing repo test**

Create `src/server/repo/audit.test.ts`. It runs against the real test database with row level security on, through `withViewer`, and covers: period and total, filters, search with `%` and `_` as plain characters, paging over rows that share one timestamp, a bad cursor, the entry `recordAudit` writes for the HubSpot sync actor, the 5000 row export cap, and a partner viewer being refused.

```ts
import { sql } from 'drizzle-orm';
import { beforeEach, describe, expect, it } from 'vitest';
import { auditLog } from '@/db/schema';
import { asPartner, asStaff, makePartner, resetDb, testDb } from '@/db/test-helpers';
import { fixedClock } from '@/lib/clock';
import { recordAudit } from '@/server/audit/record';
import { SYSTEM_ACTORS } from '@/server/auth/types';
import { ForbiddenError, ValidationError } from '@/server/errors';
import { exportAudit, listAudit } from './audit';
import { withViewer } from './context';

const db = testDb();
const clock = fixedClock('2026-11-06T14:02:00Z');

type NewRow = Partial<typeof auditLog.$inferInsert> & { at: Date };

const daysAgo = (days: number): Date => new Date(clock.now().getTime() - days * 86_400_000);

const insertRows = async (rows: NewRow[]): Promise<void> => {
  await db.insert(auditLog).values(
    rows.map((row, index) => ({
      actorLabel: 'Omar Nasser',
      actorRole: 'Partner manager',
      who: 'staff' as const,
      kind: 'deal_decisions' as const,
      event: 'registration.accepted',
      action: 'Accepted a registration',
      target: `Customer ${index}`,
      text: `Accepted a registration: Customer ${index}`,
      ...row,
    })),
  );
};

beforeEach(() => resetDb(db));

describe('listAudit', () => {
  it('returns the period newest first with the full count', async () => {
    const staff = await asStaff(db);
    await insertRows([
      { at: daysAgo(1), target: 'Yesterday deal' },
      { at: daysAgo(10), target: 'Ten days ago deal' },
      { at: daysAgo(40), target: 'Forty days ago deal' },
    ]);
    const page = await withViewer(staff, (tx) => listAudit(tx, staff, { period: '30d' }, clock));
    expect(page.rows.map((r) => r.target)).toEqual(['Yesterday deal', 'Ten days ago deal']);
    expect(page.total).toBe(2);
    expect(page.nextCursor).toBeNull();
    const wide = await withViewer(staff, (tx) => listAudit(tx, staff, { period: '90d' }, clock));
    expect(wide.total).toBe(3);
    const narrow = await withViewer(staff, (tx) => listAudit(tx, staff, { period: '7d' }, clock));
    expect(narrow.total).toBe(1);
  });

  it('filters by kind, who and partner', async () => {
    const staff = await asStaff(db);
    const partner = await makePartner(db, {});
    await insertRows([
      { at: daysAgo(1), kind: 'partners', who: 'staff', partnerId: partner.id, target: 'A' },
      { at: daysAgo(1), kind: 'documents', who: 'staff', target: 'B' },
      { at: daysAgo(1), kind: 'deal_decisions', who: 'sync', target: 'C' },
    ]);
    const run = (filter: Parameters<typeof listAudit>[2]) =>
      withViewer(staff, async (tx) => (await listAudit(tx, staff, filter, clock)).rows.map((r) => r.target));
    expect(await run({ period: '30d', kind: 'partners' })).toEqual(['A']);
    expect(await run({ period: '30d', who: 'sync' })).toEqual(['C']);
    expect(await run({ period: '30d', partnerId: partner.id })).toEqual(['A']);
  });

  it('searches actor, action and target, and treats % and _ as plain characters', async () => {
    const staff = await asStaff(db);
    await insertRows([
      { at: daysAgo(1), target: 'Pearl 100% Gulf Bank' },
      { at: daysAgo(2), target: 'Dunes Networks', actorLabel: 'Farhan Qureshi' },
      { at: daysAgo(3), target: 'Plain name' },
    ]);
    const run = (q: string) =>
      withViewer(staff, async (tx) => (await listAudit(tx, staff, { period: '30d', q }, clock)).rows.map((r) => r.target));
    expect(await run('100%')).toEqual(['Pearl 100% Gulf Bank']);
    expect(await run('farhan')).toEqual(['Dunes Networks']);
    expect(await run('_')).toEqual([]);
    expect(await run('accepted a reg')).toHaveLength(3);
  });

  it('pages with a cursor without skipping or repeating rows that share a timestamp', async () => {
    const staff = await asStaff(db);
    const same = daysAgo(1);
    await insertRows([0, 1, 2, 3, 4].map((i) => ({ at: same, target: `Row ${i}` })));
    const seen: string[] = [];
    let cursor: string | undefined;
    let pages = 0;
    do {
      const page = await withViewer(staff, (tx) =>
        listAudit(tx, staff, { period: '30d', limit: 2, ...(cursor ? { cursor } : {}) }, clock),
      );
      seen.push(...page.rows.map((r) => r.target));
      expect(page.total).toBe(5);
      cursor = page.nextCursor ?? undefined;
      pages += 1;
    } while (cursor);
    expect(pages).toBe(3);
    expect(new Set(seen).size).toBe(5);
  });

  it('rejects a cursor that is not one of ours', async () => {
    const staff = await asStaff(db);
    await expect(
      withViewer(staff, (tx) => listAudit(tx, staff, { period: '30d', cursor: 'not-a-cursor' }, clock)),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it('shows what recordAudit wrote, including the HubSpot sync actor', async () => {
    const staff = await asStaff(db);
    await db.transaction(async (tx) => {
      await recordAudit(tx, SYSTEM_ACTORS.hubspot, {
        event: 'registration.stage_changed',
        target: 'Vardhan Capital, CleanSight',
        note: 'Stage changed to Proposal sent',
        source: 'crm',
      });
    });
    const page = await withViewer(staff, (tx) => listAudit(tx, staff, { period: '7d' }, fixedClock(new Date().toISOString())));
    expect(page.rows[0]).toMatchObject({
      actorLabel: 'HubSpot sync',
      whoKind: 'sync',
      source: 'crm',
      action: 'Stage changed',
      target: 'Vardhan Capital, CleanSight',
    });
  });

  it('refuses a partner viewer before the database does', async () => {
    const partner = await asPartner(db);
    await expect(withViewer(partner, (tx) => listAudit(tx, partner, { period: '30d' }, clock))).rejects.toBeInstanceOf(
      ForbiddenError,
    );
  });
});

describe('exportAudit', () => {
  it('returns every matching row without paging', async () => {
    const staff = await asStaff(db);
    await insertRows([0, 1, 2].map((i) => ({ at: daysAgo(i + 1) })));
    const rows = await withViewer(staff, (tx) => exportAudit(tx, staff, { period: '30d' }, clock));
    expect(rows).toHaveLength(3);
  });

  it('stops at 5000 rows with a ValidationError that names the period field', async () => {
    const staff = await asStaff(db);
    await db.execute(sql`
      insert into audit_log (at, actor_label, who, kind, event, text)
      select now() - (g || ' seconds')::interval, 'Bulk', 'staff', 'partners', 'partner.created', 'Added partner: ' || g
      from generate_series(1, 5001) as g`);
    const attempt = withViewer(staff, (tx) => exportAudit(tx, staff, { period: '7d' }, fixedClock(new Date().toISOString())));
    await expect(attempt).rejects.toMatchObject({ issues: [{ path: 'period' }] });
  });

  it('refuses a partner viewer', async () => {
    const partner = await asPartner(db);
    await expect(withViewer(partner, (tx) => exportAudit(tx, partner, { period: '30d' }, clock))).rejects.toBeInstanceOf(
      ForbiddenError,
    );
  });
});
```

Run: `pnpm --filter @cleanstart/portal exec vitest run src/server/repo/audit.test.ts`
Expected: FAIL, `./audit` cannot be resolved.

- [ ] **Step 4: Implement `repo/audit.ts`**

Staff only (`assertStaff` first, so a partner gets `ForbiddenError` before row level security is consulted). No function here writes: the write helper is `recordAudit` (contracts F.4). Only `listAudit` and `exportAudit` are exported as functions, which keeps the isolation test's "every export is registered" rule satisfied; helpers stay private.

```ts
import { and, count, desc, eq, getTableColumns, gte, ilike, or, type SQL, sql } from 'drizzle-orm';
import { z } from 'zod';
import { auditLog } from '@/db/schema';
import { type Clock, systemClock } from '@/lib/clock';
import type { AuditKind, AuditWho } from '@/lib/domain';
import type { AuditEntryDto, AuditPeriod, PageDto } from '@/lib/dto';
import type { Viewer } from '@/server/auth/types';
import { ValidationError } from '@/server/errors';
import { assertStaff, type Tx } from './context';
import { defineIsolation } from './isolation.registry';

export interface AuditFilter {
  period: AuditPeriod;
  kind?: AuditKind;
  who?: AuditWho;
  q?: string;
  partnerId?: string;
  cursor?: string;
  limit?: number;
}

const PERIOD_DAYS: Record<AuditPeriod, number> = { '7d': 7, '30d': 30, '90d': 90 };
const DAY_MS = 86_400_000;
const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 200;
const EXPORT_CAP = 5000;

const cursorSchema = z.object({ at: z.string().min(1).max(40), id: z.string().uuid() });

/** The cursor carries the timestamp as Postgres prints it (microseconds), because a JS Date keeps only milliseconds. */
const encodeCursor = (at: string, id: string): string => Buffer.from(JSON.stringify({ at, id })).toString('base64url');

const decodeCursor = (cursor: string): z.infer<typeof cursorSchema> => {
  try {
    return cursorSchema.parse(JSON.parse(Buffer.from(cursor, 'base64url').toString('utf8')));
  } catch {
    throw new ValidationError([{ path: 'cursor', message: 'That page link is not valid.' }]);
  }
};

const escapeLike = (value: string): string => value.replace(/[\\%_]/g, '\\$&');

function conditions(input: Omit<AuditFilter, 'cursor' | 'limit'>, clock: Clock): SQL[] {
  const since = new Date(clock.now().getTime() - PERIOD_DAYS[input.period] * DAY_MS);
  const parts: SQL[] = [gte(auditLog.at, since)];
  if (input.kind) parts.push(eq(auditLog.kind, input.kind));
  if (input.who) parts.push(eq(auditLog.who, input.who));
  if (input.partnerId) parts.push(eq(auditLog.partnerId, input.partnerId));
  const q = input.q?.trim();
  if (q) {
    const pattern = `%${escapeLike(q)}%`;
    const match = or(ilike(auditLog.actorLabel, pattern), ilike(auditLog.action, pattern), ilike(auditLog.target, pattern));
    if (match) parts.push(match);
  }
  return parts;
}

type AuditRow = typeof auditLog.$inferSelect;

const toDto = (row: AuditRow): AuditEntryDto => ({
  id: row.id,
  at: row.at.toISOString(),
  actorId: row.actorId,
  actorLabel: row.actorLabel,
  actorRole: row.actorRole,
  whoKind: row.who,
  kind: row.kind,
  event: row.event,
  action: row.action ?? row.text,
  target: row.target ?? '',
  source: row.source,
  before: row.before,
  after: row.after,
  note: row.note,
  partnerId: row.partnerId,
});

/** Partner manager only. Newest first. `q` matches actor, action and target. */
export async function listAudit(
  tx: Tx,
  viewer: Viewer,
  input: AuditFilter,
  clock: Clock,
): Promise<PageDto<AuditEntryDto>> {
  assertStaff(viewer);
  const limit = Math.min(Math.max(Math.trunc(input.limit ?? DEFAULT_LIMIT), 1), MAX_LIMIT);
  const parts = conditions(input, clock);
  const where = and(...parts);

  const pageParts = [...parts];
  if (input.cursor) {
    const cursor = decodeCursor(input.cursor);
    pageParts.push(sql`(${auditLog.at}, ${auditLog.id}) < (${cursor.at}::timestamptz, ${cursor.id}::uuid)`);
  }

  const rows = await tx
    .select({ ...getTableColumns(auditLog), atText: sql<string>`${auditLog.at}::text` })
    .from(auditLog)
    .where(and(...pageParts))
    .orderBy(desc(auditLog.at), desc(auditLog.id))
    .limit(limit + 1);
  const [counted] = await tx.select({ total: count() }).from(auditLog).where(where);

  const page = rows.slice(0, limit);
  const last = page.at(-1);
  return {
    rows: page.map(toDto),
    total: counted?.total ?? 0,
    nextCursor: rows.length > limit && last ? encodeCursor(last.atText, last.id) : null,
  };
}

/** Partner manager only. Same filters, no paging, capped at 5000 rows (ValidationError above that). */
export async function exportAudit(
  tx: Tx,
  viewer: Viewer,
  input: Omit<AuditFilter, 'cursor' | 'limit'>,
  clock: Clock,
): Promise<AuditEntryDto[]> {
  assertStaff(viewer);
  const rows = await tx
    .select()
    .from(auditLog)
    .where(and(...conditions(input, clock)))
    .orderBy(desc(auditLog.at), desc(auditLog.id))
    .limit(EXPORT_CAP + 1);
  if (rows.length > EXPORT_CAP) {
    throw new ValidationError([
      { path: 'period', message: `More than ${EXPORT_CAP} events match. Narrow the period or the filters.` },
    ]);
  }
  return rows.map(toDto);
}

export const isolation = defineIsolation<'listAudit' | 'exportAudit'>({
  listAudit: {
    scope: 'staff-only',
    expect: 'forbidden',
    probe: (tx, viewer) => listAudit(tx, viewer, { period: '90d' }, systemClock),
  },
  exportAudit: {
    scope: 'staff-only',
    expect: 'forbidden',
    probe: (tx, viewer) => exportAudit(tx, viewer, { period: '90d' }, systemClock),
  },
});
```

Run the repo test. Expected: PASS, 10 tests. Run the isolation matrix: `pnpm --filter @cleanstart/portal exec vitest run src/server/repo/isolation.test.ts`. Expected: PASS, with `audit` among the modules it iterates (`registers every exported function in isolation` and `leaks nothing across tenants`).

- [ ] **Step 5: Write the failing export action test, then the action**

Create `src/server/actions/audit.test.ts` (this version covers the export only; Step 8 extends it), then `src/server/actions/audit.ts`. `exportAuditAction` follows the F.8 pattern: Zod parse, `assertCan(viewer, 'audit.export')`, repo call inside `withViewer`. Validation errors come back as `{ ok: false, error: { code: 'validation', issues } }`.

```ts
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { auditLog } from '@/db/schema';
import { asPartner, asStaff, resetDb, testDb } from '@/db/test-helpers';
import { requireActionViewer } from '@/server/auth/viewer';
import { exportAuditAction } from './audit';

vi.mock('@/server/auth/viewer', () => ({ requireActionViewer: vi.fn() }));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
vi.mock('next/headers', () => ({ headers: vi.fn() }));
vi.mock('@sentry/nextjs', () => ({ captureException: vi.fn() }));

const db = testDb();
const signedInAs = (viewer: Awaited<ReturnType<typeof asStaff>> | Awaited<ReturnType<typeof asPartner>>): void => {
  vi.mocked(requireActionViewer).mockResolvedValue(viewer);
};

beforeEach(() => resetDb(db));

describe('exportAuditAction', () => {
  it('returns the matching rows for a partner manager', async () => {
    signedInAs(await asStaff(db, 'partner_manager'));
    await db.insert(auditLog).values({
      actorLabel: 'Omar Nasser', who: 'staff', kind: 'partners', event: 'partner.created', text: 'Added partner: Acme', target: 'Acme',
    });
    const result = await exportAuditAction({ period: '7d', kind: 'partners', q: 'acme' });
    expect(result.ok && result.data.map((r) => r.target)).toEqual(['Acme']);
  });

  it('refuses staff sales and partner users with a forbidden error', async () => {
    signedInAs(await asStaff(db, 'sales', 'india'));
    expect(await exportAuditAction({ period: '7d' })).toMatchObject({ ok: false, error: { code: 'forbidden' } });
    signedInAs(await asPartner(db));
    expect(await exportAuditAction({ period: '7d' })).toMatchObject({ ok: false, error: { code: 'forbidden' } });
  });

  it('rejects an unknown period or kind with field issues', async () => {
    signedInAs(await asStaff(db));
    const result = await exportAuditAction({ period: '1y', kind: 'everything' });
    expect(result).toMatchObject({ ok: false, error: { code: 'validation' } });
  });
});
```

Run it. Expected: FAIL (`./audit` missing). Then create the action:

```ts
'use server';

import { z } from 'zod';
import { AUDIT_KINDS, AUDIT_WHO } from '@/lib/domain';
import type { AuditEntryDto } from '@/lib/dto';
import { assertCan } from '@/server/auth/policies';
import { exportAudit } from '@/server/repo/audit';
import { withViewer } from '@/server/repo/context';
import type { ActionResult } from './result';
import { runViewerAction } from './run';

const exportSchema = z.object({
  period: z.enum(['7d', '30d', '90d']),
  kind: z.enum(AUDIT_KINDS).optional(),
  who: z.enum(AUDIT_WHO).optional(),
  q: z.string().trim().max(100).optional(),
  partnerId: z.string().uuid().optional(),
});

/** The CSV is built in the browser from these rows (src/lib/audit-csv.ts), so the server never formats a file. */
export async function exportAuditAction(raw: unknown): Promise<ActionResult<AuditEntryDto[]>> {
  return runViewerAction({ name: 'audit.export', schema: exportSchema }, raw, async (ctx, input) => {
    assertCan(ctx.viewer, 'audit.export');
    const filter = {
      period: input.period,
      ...(input.kind ? { kind: input.kind } : {}),
      ...(input.who ? { who: input.who } : {}),
      ...(input.q ? { q: input.q } : {}),
      ...(input.partnerId ? { partnerId: input.partnerId } : {}),
    };
    return withViewer(ctx.viewer, (tx) => exportAudit(tx, ctx.viewer, filter, ctx.clock));
  });
}
```

Run it again. Expected: PASS, 3 tests.

- [ ] **Step 6: Convert the screen, the drawer and the page**

The markup and class names are the mock's. What changes: props instead of `useAudit()`, the DTO instead of `AuditEntry`, filters in the URL, `exportAuditAction` instead of the local CSV code, the "Older events" and "Newest events" links for paging, the source shown through `EVENT_SOURCE_LABEL`, and no `data-tour` attributes (the walkthrough is removed in M5.4). `downloadCsv` is the mock's existing helper in `components/reports/download-csv.ts`.

Replace `src/components/people/AuditDrawer.tsx`:

```tsx
import { Drawer } from '@/components/ui/overlay';
import { fullTimestamp } from '@/lib/audit-csv';
import { EVENT_SOURCE_LABEL } from '@/lib/domain';
import type { AuditEntryDto } from '@/lib/dto';

export function AuditDrawer({
  entry,
  onClose,
}: {
  entry: AuditEntryDto | null;
  onClose: () => void;
}): React.JSX.Element | null {
  if (!entry) return null;
  return (
    <Drawer
      open
      onClose={onClose}
      title={entry.action}
      subtitle={entry.target}
      footer={
        <button type="button" className="btn btn-s" onClick={onClose}>
          Close
        </button>
      }
    >
      <dl className="dl">
        <dt>When</dt>
        <dd>{fullTimestamp(entry.at)}</dd>
        <dt>Who</dt>
        <dd>{entry.actorLabel}</dd>
        <dt>Role</dt>
        <dd>{entry.actorRole ?? ''}</dd>
        <dt>Action</dt>
        <dd>{entry.action}</dd>
        <dt>On</dt>
        <dd>{entry.target}</dd>
        <dt>Source</dt>
        <dd>{EVENT_SOURCE_LABEL[entry.source]}</dd>
      </dl>
      {entry.before ? (
        <div className="fg">
          <span className="lbl">Change</span>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <div className="note" style={{ background: '#FDF3F3', color: '#8A1717', border: '1px solid #F5D9D9' }}>
              <span>
                <b>Before</b>
                <br />
                {entry.before}
              </span>
            </div>
            <div className="note" style={{ background: '#EFF8F2', color: '#17663A', border: '1px solid #CDEAD7' }}>
              <span>
                <b>After</b>
                <br />
                {entry.after ?? ''}
              </span>
            </div>
          </div>
        </div>
      ) : null}
      {entry.note ? (
        <div className="fg">
          <span className="lbl">Details</span>
          <p style={{ margin: 0, fontSize: 13, lineHeight: 1.55, color: '#4A4858' }}>{entry.note}</p>
        </div>
      ) : null}
    </Drawer>
  );
}
```

Replace `src/components/screens/AdminAudit.tsx`:

```tsx
'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useCallback, useEffect, useState, useTransition } from 'react';
import { Icon } from '@/components/icon';
import { AuditDrawer } from '@/components/people/AuditDrawer';
import { downloadCsv } from '@/components/reports/download-csv';
import { Dropdown } from '@/components/ui/dropdown';
import { useToast } from '@/components/ui/toast';
import { auditToCsv } from '@/lib/audit-csv';
import {
  AUDIT_PERIODS,
  type AuditView,
  auditViewToExportFilter,
  auditViewToQuery,
  KIND_CHOICES,
  PERIOD_CHOICES,
  WHO_CHOICES,
} from '@/lib/audit-filters';
import { fmtTimestamp, plural } from '@/lib/dates';
import { AUDIT_KINDS, AUDIT_WHO, EVENT_SOURCE_LABEL, isOneOf } from '@/lib/domain';
import type { AuditEntryDto, PageDto } from '@/lib/dto';
import { exportAuditAction } from '@/server/actions/audit';

const SEARCH_DEBOUNCE_MS = 300;

export interface AdminAuditProps {
  page: PageDto<AuditEntryDto>;
  view: AuditView;
  /** The server's UTC date, for "Today" and "Yesterday" labels. */
  today: string;
  /** The HubSpot sync health card, rendered by the page (a server component) so this screen does not depend on it. */
  healthSlot: React.ReactNode;
}

export function AdminAudit({ page, view, today, healthSlot }: AdminAuditProps): React.JSX.Element {
  const toast = useToast();
  const router = useRouter();
  const pathname = usePathname();
  const [, startTransition] = useTransition();
  const [q, setQ] = useState(view.q);
  const [viewing, setViewing] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const closeView = useCallback((): void => setViewing(null), []);

  const go = useCallback(
    (next: AuditView): void => startTransition(() => router.replace(`${pathname}${auditViewToQuery(next)}`)),
    [router, pathname],
  );

  // After a navigation (Clear filters, browser back) show the URL's search text.
  useEffect(() => setQ(view.q), [view.q]);

  // The URL, and so the server query, follows the box 300 ms after the last keystroke.
  useEffect(() => {
    if (q.trim() === view.q) return;
    const timer = setTimeout(() => go({ ...view, q: q.trim(), cursor: null }), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [q, view, go]);

  const exportCsv = async (): Promise<void> => {
    setExporting(true);
    const result = await exportAuditAction(auditViewToExportFilter(view));
    setExporting(false);
    if (!result.ok) {
      toast(result.error.message);
      return;
    }
    downloadCsv('cleanstart-audit-log.csv', auditToCsv(result.data));
    toast(`Exported ${plural(result.data.length, 'event')} to CSV`);
  };

  const selected = page.rows.find((e) => e.id === viewing) ?? null;
  const filtered = view.kind !== null || view.who !== null || view.q !== '';

  return (
    <div className="wrap">
      <div className="head">
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
          <h1 className="h1">Audit log</h1>
          <span className="h1-sub">Every approval, upload and access change in the portal, newest first.</span>
        </div>
        <button type="button" className="btn btn-s" onClick={exportCsv} disabled={exporting}>
          <Icon name="dl" />
          Export CSV
        </button>
      </div>

      {healthSlot}

      <section aria-label="Events" className="card clip">
        <div className="toolbar">
          <div className="filters">
            <label className="sr" htmlFor="aq">
              Search
            </label>
            <input
              id="aq"
              className="finput"
              type="search"
              placeholder="Filter by partner, customer or person"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
            <Dropdown
              ariaLabel="Action"
              value={view.kind ?? ''}
              options={KIND_CHOICES}
              onChange={(v) => go({ ...view, kind: isOneOf(AUDIT_KINDS, v) ? v : null, cursor: null })}
            />
            <Dropdown
              ariaLabel="Who"
              value={view.who ?? ''}
              options={WHO_CHOICES}
              onChange={(v) => go({ ...view, who: isOneOf(AUDIT_WHO, v) ? v : null, cursor: null })}
            />
            <Dropdown
              ariaLabel="Period"
              value={view.period}
              options={PERIOD_CHOICES}
              onChange={(v) => go({ ...view, period: isOneOf(AUDIT_PERIODS, v) ? v : view.period, cursor: null })}
            />
          </div>
          <span className="card-meta tnum">{plural(page.total, 'event')}</span>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className="tbl">
            <thead>
              <tr>
                <th scope="col">When</th>
                <th scope="col">Who</th>
                <th scope="col">Action</th>
                <th scope="col">On</th>
                <th scope="col">Source</th>
              </tr>
            </thead>
            <tbody>
              {page.rows.map((e) => (
                <tr key={e.id}>
                  <td className="tnum t-sec">{fmtTimestamp(e.at, today)}</td>
                  <td>
                    <span className="li-t">
                      <span className="li-n" style={{ fontSize: 13 }}>
                        {e.actorLabel}
                      </span>
                      <span className="li-s">{e.actorRole ?? ''}</span>
                    </span>
                  </td>
                  <td>
                    <button type="button" className="linkbtn" onClick={() => setViewing(e.id)}>
                      {e.action}
                    </button>
                  </td>
                  <td style={{ whiteSpace: 'normal' }}>{e.target}</td>
                  <td className="t-muted">{EVENT_SOURCE_LABEL[e.source]}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {page.rows.length === 0 ? (
            <div className="empty">
              No events match these filters.{' '}
              {filtered || view.period !== '90d' ? (
                <button
                  type="button"
                  className="btn btn-g"
                  onClick={() => go({ period: '90d', kind: null, who: null, q: '', cursor: null })}
                  style={{ height: 24, padding: '0 6px', fontSize: 12 }}
                >
                  Clear filters
                </button>
              ) : null}
            </div>
          ) : null}
        </div>
        {view.cursor || page.nextCursor ? (
          <div className="toolbar" style={{ justifyContent: 'space-between' }}>
            {view.cursor ? (
              <Link href={`${pathname}${auditViewToQuery({ ...view, cursor: null })}`} className="btn btn-g">
                Newest events
              </Link>
            ) : (
              <span />
            )}
            {page.nextCursor ? (
              <Link href={`${pathname}${auditViewToQuery({ ...view, cursor: page.nextCursor })}`} className="btn btn-s">
                Older events
              </Link>
            ) : null}
          </div>
        ) : null}
      </section>

      <AuditDrawer entry={selected} onClose={closeView} />
    </div>
  );
}
```

Replace `src/app/admin/audit/page.tsx` (this is the version without the health card; Step 9 swaps it):

```tsx
import type { Metadata } from 'next';
import { AdminAudit } from '@/components/screens/AdminAudit';
import { parseAuditView } from '@/lib/audit-filters';
import { systemClock } from '@/lib/clock';
import { requireCan } from '@/server/auth/viewer';
import { listAudit } from '@/server/repo/audit';
import { withViewer } from '@/server/repo/context';

export const metadata: Metadata = { title: 'Audit log' };
export const dynamic = 'force-dynamic';

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}): Promise<React.JSX.Element> {
  const viewer = await requireCan('audit.read');
  const view = parseAuditView(await searchParams);
  const page = await withViewer(viewer, (tx) =>
    listAudit(
      tx,
      viewer,
      {
        period: view.period,
        ...(view.kind ? { kind: view.kind } : {}),
        ...(view.who ? { who: view.who } : {}),
        ...(view.q ? { q: view.q } : {}),
        ...(view.cursor ? { cursor: view.cursor } : {}),
      },
      systemClock,
    ),
  );
  return <AdminAudit page={page} view={view} today={systemClock.today()} healthSlot={null} />;
}
```

Run: `pnpm --filter @cleanstart/portal typecheck`
Expected: no errors. If `requireCan` is typed differently from contracts H.18 (`requireCan(action: Action, subject?: PolicySubject): Promise<Viewer>`), fix only the call here.

- [ ] **Step 7: Check that H4.10 is merged** (needed for Steps 8 and 9)

```bash
git merge feat/portal-build
ls apps/portal/src/server/repo/integration-health.ts
```

Expected: the file exists. If not, append `blocked | M4.2 | steps 8 and 9 need H4.10 (integration-health.ts)`, skip to Step 10 (Gate A and commit the rest), and come back when the orchestrator reports H4.10 merged. The screen works without the card.

- [ ] **Step 8: Add the retry action and its tests**

`retryFailedOutboxAction` sets failed HubSpot rows back to `pending` (H's `retryFailedOutbox`) and writes one `integration.outbox_retried` audit entry in the same transaction. Replace `src/server/actions/audit.ts` with the full file and `src/server/actions/audit.test.ts` with the full test:

```ts
'use server';

import { z } from 'zod';
import { AUDIT_KINDS, AUDIT_WHO } from '@/lib/domain';
import type { AuditEntryDto } from '@/lib/dto';
import { ROUTES } from '@/lib/routes';
import { recordAudit } from '@/server/audit/record';
import { assertCan } from '@/server/auth/policies';
import { exportAudit } from '@/server/repo/audit';
import { withViewer } from '@/server/repo/context';
import { retryFailedOutbox } from '@/server/repo/integration-health';
import type { ActionResult } from './result';
import { runViewerAction } from './run';

const exportSchema = z.object({
  period: z.enum(['7d', '30d', '90d']),
  kind: z.enum(AUDIT_KINDS).optional(),
  who: z.enum(AUDIT_WHO).optional(),
  q: z.string().trim().max(100).optional(),
  partnerId: z.string().uuid().optional(),
});

/** The CSV is built in the browser from these rows (src/lib/audit-csv.ts), so the server never formats a file. */
export async function exportAuditAction(raw: unknown): Promise<ActionResult<AuditEntryDto[]>> {
  return runViewerAction({ name: 'audit.export', schema: exportSchema }, raw, async (ctx, input) => {
    assertCan(ctx.viewer, 'audit.export');
    const filter = {
      period: input.period,
      ...(input.kind ? { kind: input.kind } : {}),
      ...(input.who ? { who: input.who } : {}),
      ...(input.q ? { q: input.q } : {}),
      ...(input.partnerId ? { partnerId: input.partnerId } : {}),
    };
    return withViewer(ctx.viewer, (tx) => exportAudit(tx, ctx.viewer, filter, ctx.clock));
  });
}

const retrySchema = z.object({});

/** Sets failed HubSpot sync rows back to pending (health card on the Audit log screen). */
export async function retryFailedOutboxAction(raw: unknown): Promise<ActionResult<{ retried: number }>> {
  return runViewerAction({ name: 'integration.retry_failed', schema: retrySchema }, raw, async (ctx) => {
    assertCan(ctx.viewer, 'integration.retry_failed');
    const retried = await withViewer(ctx.viewer, async (tx) => {
      const count = await retryFailedOutbox(tx, ctx.viewer);
      await recordAudit(tx, ctx.viewer, {
        event: 'integration.outbox_retried',
        target: `${count} failed HubSpot ${count === 1 ? 'sync' : 'syncs'}`,
      });
      return count;
    });
    ctx.revalidate(ROUTES.admin.audit);
    return { retried };
  });
}
```

```ts
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { auditLog, hubspotOutbox } from '@/db/schema';
import { asPartner, asStaff, resetDb, testDb } from '@/db/test-helpers';
import { requireActionViewer } from '@/server/auth/viewer';
import { exportAuditAction, retryFailedOutboxAction } from './audit';

vi.mock('@/server/auth/viewer', () => ({ requireActionViewer: vi.fn() }));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
vi.mock('next/headers', () => ({ headers: vi.fn() }));
vi.mock('@sentry/nextjs', () => ({ captureException: vi.fn() }));

const db = testDb();
const signedInAs = (viewer: Awaited<ReturnType<typeof asStaff>> | Awaited<ReturnType<typeof asPartner>>): void => {
  vi.mocked(requireActionViewer).mockResolvedValue(viewer);
};

beforeEach(() => resetDb(db));

describe('exportAuditAction', () => {
  it('returns the matching rows for a partner manager', async () => {
    signedInAs(await asStaff(db, 'partner_manager'));
    await db.insert(auditLog).values({
      actorLabel: 'Omar Nasser', who: 'staff', kind: 'partners', event: 'partner.created', text: 'Added partner: Acme', target: 'Acme',
    });
    const result = await exportAuditAction({ period: '7d', kind: 'partners', q: 'acme' });
    expect(result.ok && result.data.map((r) => r.target)).toEqual(['Acme']);
  });

  it('refuses staff sales and partner users with a forbidden error', async () => {
    signedInAs(await asStaff(db, 'sales', 'india'));
    expect(await exportAuditAction({ period: '7d' })).toMatchObject({ ok: false, error: { code: 'forbidden' } });
    signedInAs(await asPartner(db));
    expect(await exportAuditAction({ period: '7d' })).toMatchObject({ ok: false, error: { code: 'forbidden' } });
  });

  it('rejects an unknown period or kind with field issues', async () => {
    signedInAs(await asStaff(db));
    const result = await exportAuditAction({ period: '1y', kind: 'everything' });
    expect(result).toMatchObject({ ok: false, error: { code: 'validation' } });
  });
});

describe('retryFailedOutboxAction', () => {
  it('puts failed rows back to pending and writes one audit entry', async () => {
    const staff = await asStaff(db, 'partner_manager');
    signedInAs(staff);
    await db.insert(hubspotOutbox).values([
      { op: 'partner.upsert', subjectId: 'a', idempotencyKey: 'a', status: 'failed', attempts: 6, lastError: 'boom' },
      { op: 'partner.upsert', subjectId: 'b', idempotencyKey: 'b', status: 'done' },
    ]);
    expect(await retryFailedOutboxAction({})).toEqual({ ok: true, data: { retried: 1 } });
    const rows = await db.select().from(hubspotOutbox);
    expect(rows.find((r) => r.subjectId === 'a')).toMatchObject({ status: 'pending', attempts: 0 });
    const audit = await db.select().from(auditLog);
    expect(audit).toHaveLength(1);
    expect(audit[0]).toMatchObject({ event: 'integration.outbox_retried', target: '1 failed HubSpot sync', actorId: staff.id });
  });

  it('is forbidden for everyone but a partner manager', async () => {
    signedInAs(await asStaff(db, 'marketing'));
    expect(await retryFailedOutboxAction({})).toMatchObject({ ok: false, error: { code: 'forbidden' } });
  });
});
```

Run: `pnpm --filter @cleanstart/portal exec vitest run src/server/actions/audit.test.ts`
Expected: PASS, 5 tests (export x3, retry x2).

- [ ] **Step 9: Add the health card and wire it into the page**

The card shows four figures from `IntegrationHealthDto` (waiting, failed with a Retry button, last HubSpot check, last error). It uses the existing `card kpis` classes. Create `src/components/audit/IntegrationHealthCard.tsx`, then replace the page with the full version:

```tsx
'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { fmtTimestamp, plural } from '@/lib/dates';
import type { IntegrationHealthDto } from '@/lib/dto';
import { retryFailedOutboxAction } from '@/server/actions/audit';
import { useToast } from '../ui/toast';

/** HubSpot sync health for the partner manager: what is queued, what failed, when HubSpot was last read. */
export function IntegrationHealthCard({
  health,
  today,
}: {
  health: IntegrationHealthDto;
  today: string;
}): React.JSX.Element {
  const toast = useToast();
  const router = useRouter();
  const [retrying, setRetrying] = useState(false);

  const retry = async (): Promise<void> => {
    setRetrying(true);
    const result = await retryFailedOutboxAction({});
    setRetrying(false);
    if (!result.ok) {
      toast(result.error.message);
      return;
    }
    toast(`${plural(result.data.retried, 'failed sync')} queued again`);
    router.refresh();
  };

  return (
    <section aria-label="HubSpot sync" className="card kpis">
      <div className="kpi">
        <span className="kpi-l">Waiting to send</span>
        <span className="kpi-v">{health.pending}</span>
        <span className="kpi-f">Changes queued for HubSpot</span>
      </div>
      <div className="kpi">
        <span className="kpi-l">Failed</span>
        <span className={`kpi-v${health.failed > 0 ? ' t-amber' : ''}`}>{health.failed}</span>
        {health.failed > 0 ? (
          <button type="button" className="linkbtn" onClick={retry} disabled={retrying} style={{ alignSelf: 'flex-start' }}>
            {retrying ? 'Retrying' : 'Retry failed syncs'}
          </button>
        ) : (
          <span className="kpi-f">Nothing stuck</span>
        )}
      </div>
      <div className="kpi">
        <span className="kpi-l">Last HubSpot check</span>
        <span className="kpi-v" style={{ fontSize: 14 }}>
          {health.lastPollAt ? fmtTimestamp(health.lastPollAt.toISOString(), today) : 'Never'}
        </span>
        <span className="kpi-f">Checked every 5 minutes</span>
      </div>
      <div className="kpi">
        <span className="kpi-l">Last error</span>
        <span className="kpi-v" style={{ fontSize: 13, fontWeight: 600, overflowWrap: 'anywhere' }}>
          {health.lastError ?? 'None'}
        </span>
      </div>
    </section>
  );
}
```

```tsx
import type { Metadata } from 'next';
import { IntegrationHealthCard } from '@/components/audit/IntegrationHealthCard';
import { AdminAudit } from '@/components/screens/AdminAudit';
import { parseAuditView } from '@/lib/audit-filters';
import { systemClock } from '@/lib/clock';
import { requireCan } from '@/server/auth/viewer';
import { listAudit } from '@/server/repo/audit';
import { withViewer } from '@/server/repo/context';
import { integrationHealth } from '@/server/repo/integration-health';

export const metadata: Metadata = { title: 'Audit log' };
export const dynamic = 'force-dynamic';

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}): Promise<React.JSX.Element> {
  const viewer = await requireCan('audit.read');
  const view = parseAuditView(await searchParams);
  const today = systemClock.today();
  const { page, health } = await withViewer(viewer, async (tx) => ({
    page: await listAudit(
      tx,
      viewer,
      {
        period: view.period,
        ...(view.kind ? { kind: view.kind } : {}),
        ...(view.who ? { who: view.who } : {}),
        ...(view.q ? { q: view.q } : {}),
        ...(view.cursor ? { cursor: view.cursor } : {}),
      },
      systemClock,
    ),
    health: await integrationHealth(tx),
  }));
  return (
    <AdminAudit
      page={page}
      view={view}
      today={today}
      healthSlot={<IntegrationHealthCard health={health} today={today} />}
    />
  );
}
```

Run: `pnpm --filter @cleanstart/portal typecheck`. Expected: no errors.

- [ ] **Step 10: Look at it**

```bash
lsof -nP -iTCP:3254 -sTCP:LISTEN            # must print nothing
pnpm --filter @cleanstart/portal exec next dev --port 3254
```

In another shell seed the track database (`pnpm --filter @cleanstart/portal db:seed`), open `http://localhost:3254/sign-in` in a browser at 1440 by 900 and sign in as the seeded partner manager, Farhan Qureshi (his email and the shared development password `DEV_SEED_PASSWORD` are in `src/db/fixtures.ts`). Check against the mock's numbers (contracts J.5): `/admin/audit` shows **12 events** for the default 30 days and **13** for Last 90 days; the newest row is the HubSpot sync "Stage changed" entry (the seed resolves the mock's relative days against the day you seeded, so seed and look on the same day); clicking an action opens the drawer with Before and After for "Accepted the partner agreement"; typing `pearl` narrows the list and the URL gains `?q=pearl`; Export CSV downloads `cleanstart-audit-log.csv` whose first line is `"When","Who","Role","Action","On","Source","Details"`. Signed in as a partner admin the page redirects to `/partner/overview`. Stop the dev server with Ctrl C (never kill another process).

- [ ] **Step 11: Gate A and commit**

Run the standard Gate A block, then Gate B, then (stage the health card paths only if Step 8 and 9 were done; otherwise omit them and the commit message ends "without the health card"):

```bash
git add apps/portal/src/lib/audit-filters.ts apps/portal/src/lib/audit-filters.test.ts apps/portal/src/lib/audit-csv.ts apps/portal/src/lib/audit-csv.test.ts apps/portal/src/server/repo/audit.ts apps/portal/src/server/repo/audit.test.ts apps/portal/src/server/actions/audit.ts apps/portal/src/server/actions/audit.test.ts apps/portal/src/components/screens/AdminAudit.tsx apps/portal/src/components/people/AuditDrawer.tsx apps/portal/src/app/admin/audit/page.tsx apps/portal/src/components/audit/IntegrationHealthCard.tsx docs/superpowers/plans/2026-11-12-partner-portal-06-admin-infra-hardening.md
git commit -m "feat(portal): M4.2 audit log screen with URL filters, paging, CSV export and HubSpot health card"
```


### Task M4.3: Global search (Ctrl K) over deals, partners, documents and people

**Gate A for this task:** the standard block. The isolation matrix runs inside `pnpm test` and picks `repo/search.ts` up through its `isolation` export.

**Files (under `apps/portal`):**
- Create: `src/lib/search-pages.ts`, `src/server/repo/search.ts`, `src/server/actions/search.ts`, `src/components/shell/search-palette.tsx`
- Test: `src/lib/search-pages.test.ts`, `src/server/repo/search.test.ts`, `src/server/actions/search.test.ts`
- Shared file by request only: `src/components/shell/shell.tsx` (CCR-3, exact code in the last section)

What the mock does (`shell.tsx`): a Ctrl K palette with a hard coded "Pages" group and three or four fake data groups, opened from the top bar button or the Help menu. What this task builds (contracts H.13): `searchAll(tx, viewer, { q, limit })` over `registrations` (customer), `partners` (name), `documents` (title) and `users` (name and email) with `pg_trgm`, scoped exactly like the list functions; the "Pages" group stays static client data.

Scope rules (one function per group, all tested):

| Group | Who may search it | Filter |
|---|---|---|
| Deals | partner admin, partner sales, staff partner manager, staff sales (`registration.read`) | admin: own company; sales: `registered_by = viewer.id`; staff sales: own region; manager: all. Partner technical and marketing: none |
| Partners | staff partner manager and staff sales (`partner.read`) | sales: own region. Partner viewers use "People" for their own team instead |
| Documents | everyone | the `documents_select` policy applies the audience rule and the soft delete for partners; staff see everything not deleted |
| People | partner admin (own company), staff partner manager (everyone) | disabled users never appear. Others: none |

Matching: `ILIKE '%q%'` (uses the trigram index, `%` and `_` in the query are escaped so they are plain characters) or the typo tolerant word match `q <% column` (`word_similarity`), ranked by `greatest(similarity, word_similarity)`. A query shorter than 2 characters returns nothing; each group returns at most `limit` hits (never more than 10).

Known limit: a staff member's hit on a deal opens `/admin/approvals`, a partner hit opens `/admin/partners`, and a document or person hit opens the owning list. The staff screens have no per-record route in the contracts' route map, so the palette cannot deep link. A later task can add `?focus=<id>` handling to those screens.

- [ ] **Step 1: Write the failing "Pages" group test**

```ts
import { describe, expect, it } from 'vitest';
import { ADMIN_NAV, PARTNER_NAV, ROUTES } from '@/lib/routes';
import { buildPageHits } from './search-pages';

describe('buildPageHits', () => {
  it('lists the whole sidebar for an empty query, and the account page for partners only', () => {
    const partner = buildPageHits(PARTNER_NAV, 'partner', '');
    expect(partner.map((p) => p.label)).toEqual([...PARTNER_NAV.map((n) => n.label), 'Your account']);
    expect(partner.at(-1)?.href).toBe(ROUTES.partner.account);
    expect(buildPageHits(ADMIN_NAV, 'admin', '').map((p) => p.label)).toEqual(ADMIN_NAV.map((n) => n.label));
  });

  it('filters by label without caring about case', () => {
    expect(buildPageHits(ADMIN_NAV, 'admin', 'AUD').map((p) => p.label)).toEqual(['Audit log']);
    expect(buildPageHits(PARTNER_NAV, 'partner', 'zzz')).toEqual([]);
  });

  it('only offers pages from the nav it was given', () => {
    const technical = PARTNER_NAV.filter((n) => n.href === ROUTES.partner.documents);
    expect(buildPageHits(technical, 'partner', 'deals')).toEqual([]);
  });

  it('caps the group', () => {
    expect(buildPageHits(PARTNER_NAV, 'partner', '', 2)).toHaveLength(2);
  });
});
```

Run: `pnpm --filter @cleanstart/portal exec vitest run src/lib/search-pages.test.ts`
Expected: FAIL, `./search-pages` cannot be resolved.

- [ ] **Step 2: Implement the "Pages" group**

It is built from the viewer's own sidebar (`PARTNER_NAV` or `ADMIN_NAV`, or whatever `navFor(viewer)` returns, passed in by the shell) plus the account page for partners, so it can never list a screen the viewer cannot open. `SEARCH_MIN_CHARS` is shared with the server.

```ts
import type { IconName } from '@/components/icon-paths';
import { type NavItem, type PortalKind, ROUTES } from '@/lib/routes';

/** Shorter queries return nothing: one letter matches half the database and costs a query. */
export const SEARCH_MIN_CHARS = 2;
export const SEARCH_Q_MAX = 80;

export interface PageHit {
  label: string;
  href: string;
  icon: IconName;
}

/** Partners reach their account from the profile menu, not the sidebar, so it is added to the Pages group. */
const ACCOUNT_PAGE: PageHit = { label: 'Your account', href: ROUTES.partner.account, icon: 'team' };

/**
 * The "Pages" group of the palette. Static: it is the viewer's own sidebar plus the account page, so it can never
 * list a screen the viewer cannot open. With no query it shows every page; with one it filters by label.
 */
export function buildPageHits(nav: readonly NavItem[], kind: PortalKind, q: string, limit = 8): PageHit[] {
  const pages: PageHit[] = nav.map((item) => ({ label: item.label, href: item.href, icon: item.icon }));
  if (kind === 'partner') pages.push(ACCOUNT_PAGE);
  const needle = q.trim().toLowerCase();
  return pages.filter((page) => !needle || page.label.toLowerCase().includes(needle)).slice(0, limit);
}
```

Run the test. Expected: PASS, 4 tests.

- [ ] **Step 3: Write the failing repo test**

It seeds partner A (Kestrel Systems, channel, India) and partner B (Kestrel Gulf Networks, distributor, Middle East), their people and deals, documents with every audience kind, and runs `searchAll` as a partner manager, staff sales, marketing, a partner admin, partner sales and partner technical. It proves: group order and hints, typo tolerance, no hits for one or two characters or for `%` and `_`, the per group cap, soft deleted documents and disabled people hidden, regional limits, one partner never seeing another partner's deals, record or colleagues, and the document audience (all, matching category, named, not another partner's).

```ts
import { beforeEach, describe, expect, it } from 'vitest';
import {
  asPartner,
  asStaff,
  makeDocument,
  makePartner,
  makeRegistration,
  makeUser,
  resetDb,
  testDb,
} from '@/db/test-helpers';
import { ROUTES } from '@/lib/routes';
import { withViewer } from './context';
import { searchAll } from './search';

const db = testDb();

interface World {
  a: Awaited<ReturnType<typeof makePartner>>;
  b: Awaited<ReturnType<typeof makePartner>>;
  aAdmin: Awaited<ReturnType<typeof asPartner>>;
  aSales: Awaited<ReturnType<typeof asPartner>>;
  aTech: Awaited<ReturnType<typeof asPartner>>;
  dealA: Awaited<ReturnType<typeof makeRegistration>>;
  dealB: Awaited<ReturnType<typeof makeRegistration>>;
}

/** Partner A (India, channel) and partner B (Middle East, distributor), one deal each, same customer word. */
const seed = async (): Promise<World> => {
  const a = await makePartner(db, { name: 'Kestrel Systems', category: 'channel', region: 'india' });
  const b = await makePartner(db, { name: 'Kestrel Gulf Networks', category: 'distributor', region: 'middle_east' });
  const aAdmin = await asPartner(db, { partnerId: a.id, role: 'partner_admin' });
  const aSales = await asPartner(db, { partnerId: a.id, role: 'sales' });
  const aTech = await asPartner(db, { partnerId: a.id, role: 'technical' });
  const dealA = await makeRegistration(db, { partnerId: a.id, customerName: 'Vardhan Capital', region: 'india', registeredBy: aAdmin.id });
  const dealB = await makeRegistration(db, { partnerId: b.id, customerName: 'Vardhan Holdings', region: 'middle_east' });
  return { a, b, aAdmin, aSales, aTech, dealA, dealB };
};

const search = async (viewer: Awaited<ReturnType<typeof asStaff>> | Awaited<ReturnType<typeof asPartner>>, q: string, limit = 5) =>
  withViewer(viewer, (tx) => searchAll(tx, viewer, { q, limit }));

beforeEach(() => resetDb(db));

describe('searchAll as staff', () => {
  it('finds deals, partners, documents and people, one group after the other', async () => {
    const w = await seed();
    await makeDocument(db, { title: 'Kestrel partner playbook' });
    const staff = await asStaff(db, 'partner_manager', 'all');
    await makeUser(db, { partnerId: w.a.id, role: 'sales', name: 'Kestrel Vikram', email: 'vikram@kestrel.example.com' });

    const hits = await search(staff, 'kestrel');
    expect(hits.map((h) => h.group)).toEqual(['partners', 'partners', 'documents', 'people']);
    expect(hits.find((h) => h.label === 'Kestrel Systems')).toMatchObject({
      group: 'partners',
      hint: 'Channel partner, India',
      href: ROUTES.admin.partners,
      icon: 'bld',
    });
    expect(hits.find((h) => h.group === 'people')).toMatchObject({ hint: 'Kestrel Systems, Sales', href: ROUTES.admin.partners });

    const deals = await search(staff, 'vardhan');
    expect(deals.map((h) => h.label).sort()).toEqual(['Vardhan Capital', 'Vardhan Holdings']);
    expect(deals[0]).toMatchObject({ group: 'registrations', href: ROUTES.admin.approvals, icon: 'approve' });
    expect(deals.find((h) => h.label === 'Vardhan Holdings')?.hint).toBe('Kestrel Gulf Networks, pending');
  });

  it('tolerates a typo and matches inside a word', async () => {
    await seed();
    const staff = await asStaff(db);
    expect((await search(staff, 'kestrl')).map((h) => h.label)).toContain('Kestrel Systems');
    expect((await search(staff, 'rdhan cap')).map((h) => h.label)).toContain('Vardhan Capital');
  });

  it('returns nothing for a short query, and treats % and _ as plain characters', async () => {
    await seed();
    const staff = await asStaff(db);
    expect(await search(staff, 'k')).toEqual([]);
    expect(await search(staff, '  ')).toEqual([]);
    expect(await search(staff, '%%')).toEqual([]);
    expect(await search(staff, '__')).toEqual([]);
  });

  it('caps each group at the limit and never above 10', async () => {
    const staff = await asStaff(db);
    for (let i = 0; i < 12; i += 1) await makePartner(db, { name: `Orbit Partner ${i}` });
    expect((await search(staff, 'orbit', 3)).length).toBe(3);
    expect((await search(staff, 'orbit', 99)).length).toBe(10);
  });

  it('hides soft deleted documents and disabled people from staff too', async () => {
    const w = await seed();
    await makeDocument(db, { title: 'Retired price list', deletedAt: new Date() });
    await makeUser(db, { partnerId: w.a.id, name: 'Retired Person', status: 'disabled' });
    const staff = await asStaff(db);
    expect(await search(staff, 'retired')).toEqual([]);
  });

  it('limits staff sales to their region and gives marketing documents only', async () => {
    await seed();
    await makeDocument(db, { title: 'Vardhan case study' });
    const india = await asStaff(db, 'sales', 'india');
    const labels = (await search(india, 'vardhan')).map((h) => h.label);
    expect(labels).toContain('Vardhan Capital');
    expect(labels).not.toContain('Vardhan Holdings');
    expect((await search(india, 'gulf')).map((h) => h.label)).toEqual([]);
    const marketing = await asStaff(db, 'marketing', 'all');
    expect((await search(marketing, 'vardhan')).map((h) => h.group)).toEqual(['documents']);
    expect(await search(marketing, 'kestrel')).toEqual([]);
  });
});

describe('searchAll as a partner', () => {
  it('shows a partner admin only their own company, and never another partner', async () => {
    const w = await seed();
    await makeUser(db, { partnerId: w.b.id, role: 'sales', name: 'Gulf Colleague' });
    const hits = await search(w.aAdmin, 'vardhan');
    expect(hits).toEqual([
      expect.objectContaining({ group: 'registrations', label: 'Vardhan Capital', href: ROUTES.partner.deal(w.dealA.id), hint: 'CleanStart Images, pending' }),
    ]);
    expect(await search(w.aAdmin, 'gulf')).toEqual([]);
    expect((await search(w.aAdmin, 'kestrel')).filter((h) => h.group === 'partners')).toEqual([]);
  });

  it('lets an admin find their own colleagues and nobody else', async () => {
    const w = await seed();
    const mate = await makeUser(db, { partnerId: w.a.id, role: 'technical', name: 'Meera Colleague', email: 'meera@kestrel.example.com' });
    await makeUser(db, { partnerId: w.b.id, role: 'technical', name: 'Meera Elsewhere' });
    const people = (await search(w.aAdmin, 'meera')).filter((h) => h.group === 'people');
    expect(people).toEqual([expect.objectContaining({ label: mate.name, hint: 'Kestrel Systems, Technical', href: ROUTES.partner.team })]);
    expect(await search(w.aSales, 'meera')).toEqual([]);
  });

  it('shows partner sales only the deals they registered', async () => {
    const w = await seed();
    await makeRegistration(db, { partnerId: w.a.id, customerName: 'Vardhan Mine', registeredBy: w.aSales.id });
    expect((await search(w.aSales, 'vardhan')).map((h) => h.label)).toEqual(['Vardhan Mine']);
  });

  it('gives partner technical documents only', async () => {
    const w = await seed();
    await makeDocument(db, { title: 'Vardhan integration guide' });
    expect((await search(w.aTech, 'vardhan')).map((h) => h.group)).toEqual(['documents']);
  });

  it('applies the document audience: all, matching category, named, and not another partner', async () => {
    const w = await seed();
    await makeDocument(db, { title: 'Doc for all', audienceKind: 'all' });
    await makeDocument(db, { title: 'Doc for channel', audienceKind: 'categories', audienceCategories: ['channel'] });
    await makeDocument(db, { title: 'Doc for distributors', audienceKind: 'categories', audienceCategories: ['distributor'] });
    await makeDocument(db, { title: 'Doc named for A', audienceKind: 'named', partnerIds: [w.a.id] });
    await makeDocument(db, { title: 'Doc named for B', audienceKind: 'named', partnerIds: [w.b.id] });
    const titles = (await search(w.aAdmin, 'doc')).map((h) => h.label).sort();
    expect(titles).toEqual(['Doc for all', 'Doc for channel', 'Doc named for A']);
  });

  it('points a video document at the play icon', async () => {
    const w = await seed();
    await makeDocument(db, { title: 'Walkthrough video', type: 'video' });
    expect(await search(w.aAdmin, 'walkthrough')).toEqual([expect.objectContaining({ icon: 'play', hint: 'Video' })]);
  });
});
```

Run: `pnpm --filter @cleanstart/portal exec vitest run src/server/repo/search.test.ts`
Expected: FAIL, `./search` cannot be resolved.

- [ ] **Step 4: Implement `repo/search.ts`**

The `isolation` entry is scope `tenant`: as partner A it searches broadly and returns only the hits that point at partner B's deal (none may). The explicit tests above are the stronger proof; the entry keeps the matrix's "every export is registered" rule satisfied.

```ts
import { and, asc, desc, eq, isNull, ne, or, type SQL, sql } from 'drizzle-orm';
import type { AnyPgColumn } from 'drizzle-orm/pg-core';
import { documents, partners, registrations, users } from '@/db/schema';
import {
  DOCUMENT_TYPE_LABEL,
  isOneOf,
  PARTNER_CATEGORY_LABEL,
  PARTNER_REGION_LABEL,
  PARTNER_ROLE_LABEL,
  PARTNER_ROLES,
  PRODUCT_LABEL,
  REGISTRATION_STATUS_LABEL,
  STAFF_ROLE_LABEL,
  STAFF_ROLES,
} from '@/lib/domain';
import type { SearchHitDto } from '@/lib/dto';
import { ROUTES } from '@/lib/routes';
import { SEARCH_MIN_CHARS } from '@/lib/search-pages';
import type { Viewer } from '@/server/auth/types';
import type { Tx } from './context';
import { defineIsolation } from './isolation.registry';

const MAX_PER_GROUP = 10;

const escapeLike = (value: string): string => value.replace(/[\\%_]/g, '\\$&');

/** A substring match (uses the trigram index) or a typo tolerant word match (pg_trgm `<%`). */
const matches = (column: AnyPgColumn, q: string, pattern: string): SQL =>
  sql`(${column} ILIKE ${pattern} OR ${q} <% ${column})`;

const rank = (column: AnyPgColumn, q: string): SQL =>
  sql`greatest(similarity(${column}, ${q}), word_similarity(${q}, ${column}))`;

/** 'none' means the role has no business searching this group; undefined means no extra filter. */
type Scope = SQL | undefined | 'none';

/** Deals follow `registration.read`: partner admin the company, partner sales their own, staff by role and region. */
function registrationScope(viewer: Viewer): Scope {
  if (viewer.kind === 'partner') {
    if (viewer.role === 'partner_admin') return eq(registrations.partnerId, viewer.partnerId);
    if (viewer.role === 'sales') {
      return and(eq(registrations.partnerId, viewer.partnerId), eq(registrations.registeredBy, viewer.id));
    }
    return 'none';
  }
  if (viewer.role === 'partner_manager') return undefined;
  if (viewer.role === 'sales') return viewer.region === 'all' ? undefined : eq(registrations.region, viewer.region);
  return 'none';
}

/** Partners follow `partner.read`: partner manager all, staff sales their region. Partners search their own team instead. */
function partnerScope(viewer: Viewer): Scope {
  if (viewer.kind !== 'staff') return 'none';
  if (viewer.role === 'partner_manager') return undefined;
  if (viewer.role === 'sales') return viewer.region === 'all' ? undefined : eq(partners.region, viewer.region);
  return 'none';
}

/** People follow `team.read` (partner admin: own company) and `staff.read` (partner manager: everyone). */
function peopleScope(viewer: Viewer): Scope {
  if (viewer.kind === 'partner') {
    return viewer.role === 'partner_admin' ? eq(users.partnerId, viewer.partnerId) : 'none';
  }
  return viewer.role === 'partner_manager' ? undefined : 'none';
}

const roleLabel = (role: string): string => {
  if (isOneOf(PARTNER_ROLES, role)) return PARTNER_ROLE_LABEL[role];
  if (isOneOf(STAFF_ROLES, role)) return STAFF_ROLE_LABEL[role];
  return role;
};

async function searchRegistrations(tx: Tx, viewer: Viewer, q: string, pattern: string, limit: number): Promise<SearchHitDto[]> {
  const scope = registrationScope(viewer);
  if (scope === 'none') return [];
  const rows = await tx
    .select({
      id: registrations.id,
      customer: registrations.customerName,
      product: registrations.product,
      status: registrations.status,
      partnerName: partners.name,
    })
    .from(registrations)
    .innerJoin(partners, eq(partners.id, registrations.partnerId))
    .where(and(matches(registrations.customerName, q, pattern), scope))
    .orderBy(desc(rank(registrations.customerName, q)), desc(registrations.registeredOn))
    .limit(limit);
  return rows.map((r) => {
    const status = REGISTRATION_STATUS_LABEL[r.status].toLowerCase();
    return viewer.kind === 'partner'
      ? { group: 'registrations', label: r.customer, hint: `${PRODUCT_LABEL[r.product]}, ${status}`, href: ROUTES.partner.deal(r.id), icon: 'deals' }
      : { group: 'registrations', label: r.customer, hint: `${r.partnerName}, ${status}`, href: ROUTES.admin.approvals, icon: 'approve' };
  });
}

async function searchPartners(tx: Tx, viewer: Viewer, q: string, pattern: string, limit: number): Promise<SearchHitDto[]> {
  const scope = partnerScope(viewer);
  if (scope === 'none') return [];
  const rows = await tx
    .select({ name: partners.name, category: partners.category, region: partners.region })
    .from(partners)
    .where(and(matches(partners.name, q, pattern), scope))
    .orderBy(desc(rank(partners.name, q)), asc(partners.name))
    .limit(limit);
  return rows.map((p) => ({
    group: 'partners',
    label: p.name,
    hint: `${PARTNER_CATEGORY_LABEL[p.category]}, ${PARTNER_REGION_LABEL[p.region]}`,
    href: ROUTES.admin.partners,
    icon: 'bld',
  }));
}

/** The audience rule (and soft delete, for partners) is enforced by the documents_select policy; see rls.sql. */
async function searchDocuments(tx: Tx, viewer: Viewer, q: string, pattern: string, limit: number): Promise<SearchHitDto[]> {
  const rows = await tx
    .select({ title: documents.title, type: documents.type })
    .from(documents)
    .where(and(isNull(documents.deletedAt), matches(documents.title, q, pattern)))
    .orderBy(desc(rank(documents.title, q)), asc(documents.title))
    .limit(limit);
  return rows.map((d) => ({
    group: 'documents',
    label: d.title,
    hint: DOCUMENT_TYPE_LABEL[d.type],
    href: viewer.kind === 'partner' ? ROUTES.partner.documents : ROUTES.admin.documents,
    icon: d.type === 'video' ? 'play' : 'file',
  }));
}

async function searchPeople(tx: Tx, viewer: Viewer, q: string, pattern: string, limit: number): Promise<SearchHitDto[]> {
  const scope = peopleScope(viewer);
  if (scope === 'none') return [];
  const rows = await tx
    .select({ name: users.name, role: users.role, kind: users.kind, partnerName: partners.name })
    .from(users)
    .leftJoin(partners, eq(partners.id, users.partnerId))
    .where(and(ne(users.status, 'disabled'), scope, or(matches(users.name, q, pattern), sql`${users.email} ILIKE ${pattern}`)))
    .orderBy(desc(rank(users.name, q)), asc(users.name))
    .limit(limit);
  return rows.map((u) => ({
    group: 'people',
    label: u.name,
    hint: `${u.partnerName ?? 'CleanStart'}, ${roleLabel(u.role)}`,
    href: viewer.kind === 'partner' ? ROUTES.partner.team : u.kind === 'staff' ? ROUTES.admin.team : ROUTES.admin.partners,
    icon: 'team',
  }));
}

/**
 * pg_trgm over registrations (customer), partners (name), documents (title) and people (name, email), scoped by the
 * viewer exactly like the list functions. At most `limit` hits per group (never more than 10), groups in a fixed
 * order. A query shorter than SEARCH_MIN_CHARS returns nothing. The static "Pages" group is client data.
 */
export async function searchAll(tx: Tx, viewer: Viewer, input: { q: string; limit: number }): Promise<SearchHitDto[]> {
  const q = input.q.trim();
  if (q.length < SEARCH_MIN_CHARS) return [];
  const pattern = `%${escapeLike(q)}%`;
  const limit = Math.min(Math.max(Math.trunc(input.limit), 1), MAX_PER_GROUP);
  return [
    ...(await searchRegistrations(tx, viewer, q, pattern, limit)),
    ...(await searchPartners(tx, viewer, q, pattern, limit)),
    ...(await searchDocuments(tx, viewer, q, pattern, limit)),
    ...(await searchPeople(tx, viewer, q, pattern, limit)),
  ];
}

export const isolation = defineIsolation<'searchAll'>({
  searchAll: {
    scope: 'tenant',
    expect: 'empty',
    // As partner A, search broadly and return only the hits that point at partner B's deal. None may.
    probe: async (tx, viewer, ctx) =>
      (await searchAll(tx, viewer, { q: 'er', limit: 10 })).filter((hit) => hit.href.includes(ctx.b.registrationId)),
  },
});
```

Run the repo test. Expected: PASS, 12 tests. Then the matrix: `pnpm --filter @cleanstart/portal exec vitest run src/server/repo/isolation.test.ts`. Expected: PASS with `search` among the modules.

- [ ] **Step 5: Write the failing action test, then the action**

`searchAction` is the only caller of `searchAll`: Zod (`q` at most 80 characters, `limit` 1 to 10, default 5), `assertCan(viewer, 'search.use')`, a rate limit of 30 searches per 10 seconds per person (the palette debounces at 150 ms, so normal typing stays far below it), a short query answered without touching the database, then `withViewer`. The test mocks the session, `next/cache`, `next/headers` and Sentry only.

```ts
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { asPartner, asStaff, makePartner, resetDb, testDb } from '@/db/test-helpers';
import { requireActionViewer } from '@/server/auth/viewer';
import { searchAction } from './search';

vi.mock('@/server/auth/viewer', () => ({ requireActionViewer: vi.fn() }));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
vi.mock('next/headers', () => ({ headers: vi.fn() }));
vi.mock('@sentry/nextjs', () => ({ captureException: vi.fn() }));

const db = testDb();
beforeEach(() => resetDb(db));

describe('searchAction', () => {
  it('returns the viewer scoped hits', async () => {
    await makePartner(db, { name: 'Kestrel Systems' });
    vi.mocked(requireActionViewer).mockResolvedValue(await asStaff(db));
    const result = await searchAction({ q: 'kest' });
    expect(result.ok && result.data.map((h) => h.label)).toEqual(['Kestrel Systems']);
  });

  it('answers a short query with an empty list and does not touch the database', async () => {
    vi.mocked(requireActionViewer).mockResolvedValue(await asStaff(db));
    expect(await searchAction({ q: 'k' })).toEqual({ ok: true, data: [] });
  });

  it('rejects a query over 80 characters and a limit over 10', async () => {
    vi.mocked(requireActionViewer).mockResolvedValue(await asStaff(db));
    expect(await searchAction({ q: 'x'.repeat(81) })).toMatchObject({ ok: false, error: { code: 'validation' } });
    expect(await searchAction({ q: 'kestrel', limit: 11 })).toMatchObject({ ok: false, error: { code: 'validation' } });
  });

  it('rate limits one person at 30 searches per 10 seconds', async () => {
    vi.mocked(requireActionViewer).mockResolvedValue(await asPartner(db));
    for (let i = 0; i < 30; i += 1) expect((await searchAction({ q: 'kestrel' })).ok).toBe(true);
    expect(await searchAction({ q: 'kestrel' })).toMatchObject({ ok: false, error: { code: 'rate_limited' } });
  });
});
```

Run it. Expected: FAIL, `./search` cannot be resolved. Then:

```ts
'use server';

import { z } from 'zod';
import type { SearchHitDto } from '@/lib/dto';
import { SEARCH_MIN_CHARS, SEARCH_Q_MAX } from '@/lib/search-pages';
import { assertCan } from '@/server/auth/policies';
import { withViewer } from '@/server/repo/context';
import { searchAll } from '@/server/repo/search';
import { rateLimit } from '@/server/rate-limit';
import type { ActionResult } from './result';
import { runViewerAction } from './run';

const schema = z.object({
  q: z.string().trim().max(SEARCH_Q_MAX),
  limit: z.number().int().min(1).max(10).default(5),
});

/** 30 searches in 10 seconds per person: fast typing with the palette's own debounce stays far below it. */
const SEARCH_RATE_LIMIT = { limit: 30, windowSeconds: 10 };

export async function searchAction(raw: unknown): Promise<ActionResult<SearchHitDto[]>> {
  return runViewerAction({ name: 'search.query', schema }, raw, async (ctx, input) => {
    assertCan(ctx.viewer, 'search.use');
    rateLimit(`search:user:${ctx.viewer.id}`, SEARCH_RATE_LIMIT);
    if (input.q.length < SEARCH_MIN_CHARS) return [];
    return withViewer(ctx.viewer, (tx) => searchAll(tx, ctx.viewer, input));
  });
}
```

Run it again. Expected: PASS, 4 tests.

- [ ] **Step 6: Build the palette component**

It keeps the mock's markup and classes (`dialog palette`, `pal-in`, `pal-list`, `pal-g`, `pal-item`). It owns its own state and the Ctrl K shortcut, and opens when anything dispatches `OPEN_SEARCH_EVENT` on `window`, so the shell needs no shared state. Behaviour: opens with the field focused; Escape closes and returns focus to what opened it; Tab stays inside; ArrowDown moves from the field into the results and back; Enter opens the first result; answers arrive in order (a slow reply to "ke" never replaces the reply to "kestrel"); a failed search says so and the Pages group keeps working. The click-away layer is a real button with `tabIndex={-1}` and an accessible name, so it does not need a lint suppression.

```tsx
'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useId, useRef, useState } from 'react';
import type { IconName } from '@/components/icon-paths';
import type { SearchHitDto } from '@/lib/dto';
import { buildPageHits, SEARCH_MIN_CHARS } from '@/lib/search-pages';
import type { NavItem, PortalKind } from '@/lib/routes';
import { searchAction } from '@/server/actions/search';
import { Icon } from '../icon';

/** Anything that wants the palette open (the top bar button, the Help menu) dispatches this on `window`. */
export const OPEN_SEARCH_EVENT = 'portal:open-search';

const DEBOUNCE_MS = 150;
const GROUP_LABEL: Record<SearchHitDto['group'], string> = {
  registrations: 'Deals',
  partners: 'Partners',
  documents: 'Documents',
  people: 'People',
};
const PLACEHOLDER: Record<PortalKind, string> = {
  partner: 'Search deals, documents and pages',
  admin: 'Search partners, registrations and pages',
};

interface Row {
  key: string;
  label: string;
  hint: string;
  href: string;
  icon: IconName;
}

/**
 * Ctrl K search. Pages come from the viewer's own sidebar (static); deals, partners, documents and people come from
 * searchAction, which scopes every group to what the viewer may read. Mounted once by the shell.
 */
export function SearchPalette({ kind, nav }: { kind: PortalKind; nav: readonly NavItem[] }): React.JSX.Element | null {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [hits, setHits] = useState<SearchHitDto[]>([]);
  const [failed, setFailed] = useState(false);
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const requestId = useRef(0);
  const opener = useRef<HTMLElement | null>(null);
  const titleId = useId();

  const show = useCallback((): void => {
    opener.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setQuery('');
    setHits([]);
    setFailed(false);
    setOpen(true);
  }, []);

  const hide = useCallback((): void => {
    setOpen(false);
    requestId.current += 1;
    opener.current?.focus?.();
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent): void => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        show();
      }
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener(OPEN_SEARCH_EVENT, show);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener(OPEN_SEARCH_EVENT, show);
    };
  }, [show]);

  // The newest answer wins: a slow reply to "ke" must not replace the reply to "kestrel".
  useEffect(() => {
    if (!open) return;
    const q = query.trim();
    if (q.length < SEARCH_MIN_CHARS) {
      requestId.current += 1;
      setHits([]);
      setFailed(false);
      return;
    }
    const mine = requestId.current + 1;
    requestId.current = mine;
    const timer = setTimeout(async () => {
      const result = await searchAction({ q, limit: 5 });
      if (requestId.current !== mine) return;
      setFailed(!result.ok);
      setHits(result.ok ? result.data : []);
    }, DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [open, query]);

  const focusables = (): HTMLElement[] =>
    Array.from(dialogRef.current?.querySelectorAll<HTMLElement>('input, button:not([tabindex="-1"]), a[href]') ?? []);

  useEffect(() => {
    if (open) dialogRef.current?.querySelector<HTMLInputElement>('input')?.focus();
  }, [open]);

  if (!open) return null;

  const q = query.trim();
  const groups: Array<{ name: string; rows: Row[] }> = [
    {
      name: 'Pages',
      rows: buildPageHits(nav, kind, q).map((p) => ({ key: `page-${p.href}`, label: p.label, hint: '', href: p.href, icon: p.icon })),
    },
    ...(['registrations', 'partners', 'documents', 'people'] as const).map((group) => ({
      name: GROUP_LABEL[group],
      rows: hits
        .filter((h) => h.group === group)
        .map((h, i) => ({ key: `${group}-${i}-${h.href}`, label: h.label, hint: h.hint, href: h.href, icon: h.icon })),
    })),
  ].filter((g) => g.rows.length > 0);

  const onDialogKey = (event: React.KeyboardEvent): void => {
    if (event.key === 'Escape') {
      event.stopPropagation();
      hide();
      return;
    }
    const firstRow = groups[0]?.rows[0];
    if (event.key === 'Enter' && event.target instanceof HTMLInputElement && firstRow) {
      event.preventDefault();
      hide();
      router.push(firstRow.href);
      return;
    }
    const items = focusables();
    const index = items.indexOf(document.activeElement as HTMLElement);
    if (event.key === 'Tab' && items.length > 0) {
      const last = items.length - 1;
      if (event.shiftKey && index <= 0) {
        event.preventDefault();
        items[last]?.focus();
      } else if (!event.shiftKey && index === last) {
        event.preventDefault();
        items[0]?.focus();
      }
    } else if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      const links = Array.from(dialogRef.current?.querySelectorAll<HTMLElement>('a.pal-item') ?? []);
      const at = links.indexOf(document.activeElement as HTMLElement);
      const target = event.key === 'ArrowDown' ? links[at + 1] : at <= 0 ? dialogRef.current?.querySelector<HTMLElement>('input') : links[at - 1];
      if (target) {
        event.preventDefault();
        target.focus();
      }
    }
  };

  return (
    <>
      <button
        type="button"
        className="cs-scrim"
        aria-label="Close search"
        tabIndex={-1}
        onClick={hide}
        style={{ border: 0, padding: 0, cursor: 'default' }}
      />
      <div
        ref={dialogRef}
        className="dialog palette"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onKeyDown={onDialogKey}
      >
        <div className="pal-in">
          <Icon name="search" />
          <label className="sr" htmlFor={`${titleId}-q`} id={titleId}>
            Search
          </label>
          <input
            id={`${titleId}-q`}
            type="search"
            placeholder={PLACEHOLDER[kind]}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoComplete="off"
          />
          <button type="button" className="ibtn" onClick={hide} aria-label="Close search" style={{ width: 26, height: 26 }}>
            <Icon name="x" />
          </button>
        </div>
        <div className="pal-list" aria-live="polite">
          {groups.map((g) => (
            <div key={g.name}>
              <div className="pal-g">{g.name}</div>
              {g.rows.map((row) => (
                <Link key={row.key} href={row.href} className="pal-item" onClick={() => setOpen(false)}>
                  <span className="li-ic">
                    <Icon name={row.icon} />
                  </span>
                  <span>{row.label}</span>
                  <span className="li-s">{row.hint}</span>
                </Link>
              ))}
            </div>
          ))}
          {groups.length === 0 ? <div className="empty">Nothing matches {query}.</div> : null}
          {failed ? <div className="empty">Search is not available right now. Pages still work.</div> : null}
        </div>
      </div>
    </>
  );
}
```

Run: `pnpm --filter @cleanstart/portal typecheck`. Expected: no errors.

- [ ] **Step 7: Ask for the shell wiring**

`shell.tsx` is a shared file that this track does not edit. The orchestrator applies CCR-3 in W2-a step 0 (delete the mock's search data and state, replace the inline palette with `<SearchPalette kind={kind} nav={nav} />`, make both openers dispatch `OPEN_SEARCH_EVENT`, name the top bar button for screen readers). This is planned work, not a blocker: append a `note` line and carry on.

```bash
printf '%s\n' "$(date '+%Y-%m-%d %H:%M IST') | M4.3 | note | A | - | - | search-palette.tsx ready; shell.tsx wiring is W2-a step 0 (CCR-3 in plan 06)" >> /Users/a12345/Desktop/AI/cleanstart/cleanstart-website/docs/partner-portal/PROGRESS.md
```

- [ ] **Step 8: Check it in the browser** (only possible once W2-a step 0 has wired the shell; in Wave 1 the palette is covered by its unit and action tests, so write `not visually checked` in the `done` line)

Run `pnpm --filter @cleanstart/portal exec next dev --port 3254` (check the port first), sign in as the seeded partner manager, press Ctrl K on `/admin/approvals`: the palette opens with the field focused and the six admin pages listed; type `kest`: Partners shows Kestrel Systems with "Channel partner, India" and Deals shows Kestrel's deals; Escape closes and focus returns to the top bar button. Sign in as the seeded Kestrel partner admin: search `arbor` shows nothing from another partner. At 375 px wide the top bar search button is announced as "Search deals and documents" (no empty button name). If CCR-3 is not merged yet, skip this step and say so in the `done` line; the E2E task (`e2e/admin.spec.ts`) proves it later.

- [ ] **Step 9: Gate A and commit**

Run the standard Gate A block, then Gate B, then:

```bash
git add apps/portal/src/lib/search-pages.ts apps/portal/src/lib/search-pages.test.ts apps/portal/src/server/repo/search.ts apps/portal/src/server/repo/search.test.ts apps/portal/src/server/actions/search.ts apps/portal/src/server/actions/search.test.ts apps/portal/src/components/shell/search-palette.tsx docs/superpowers/plans/2026-11-12-partner-portal-06-admin-infra-hardening.md
git commit -m "feat(portal): M4.3 global search over deals, partners, documents and people with pg_trgm"
```


---

# Part 2: Wave 2 (the orchestrator, serial, on `feat/portal-build`)

Start when every Wave 1 track is merged and `portal-w1` is tagged. Work in the integration worktree `.claude/worktrees/portal-build` (database `cleanstart_portal`, test database `cleanstart_portal_test`). Nobody else edits files in this part, so the shared files named in each Files block are edited directly. Order is the handoff's: M5.4, E2E, M5.1, M5.2, M5.3, M5.5 with M5.9, then the final verification.

Before the first task:

```bash
git tag | grep -x portal-w1
pnpm install
pnpm --filter @cleanstart/portal lint && pnpm --filter @cleanstart/portal typecheck && pnpm --filter @cleanstart/portal test
```

Expected: `portal-w1`, then all three green. If any is red, stop: the merge of Wave 1 is not clean and this part must not start.

### Task M5.4: Wire the shell, then remove the mock scaffolding (W2-a)

**Gate A for this task:** the standard block, plus the removal greps in Step 8.

- [ ] **Step 0: Wire the shell (the single owner of these `shell.tsx` and layout edits)**

Apply, in this order, on `feat/portal-build`: first the notifications change (plan 04, "Contract change requests", item 5, which edits `shell.tsx`, `src/app/partner/layout.tsx` and `src/app/admin/layout.tsx`), then CCR-3 below (the search palette). Both are written against the mock regions that W0-f leaves alone. Check: `grep -n "searchOpen\|PARTNER_SEARCH\|notesRead\|partnerNotes" apps/portal/src/components/shell/shell.tsx` prints nothing; typecheck and the build are clean.

**Files (under `apps/portal`):**
- Delete: `src/lib/slice.ts`, `src/lib/demo-date.ts`, `src/components/shell/personas.ts`, `src/tour/tour-provider.tsx`, `src/tour/steps.ts`, `src/data/deals.ts`, `src/data/partners.ts`, `src/data/documents.ts`, `src/data/team.ts`, `src/data/audit.ts`, `src/data/reports.ts` (the exact list is the contracts' module map, K.1)
- Modify: `src/app/layout.tsx`, `src/components/shell/shell.tsx`, `src/components/ui/password-field.tsx`, `src/styles/portal.css`, every `.tsx` that still carries a `data-tour` attribute, `package.json`, `README.md`
- Keep: `scripts/seed-dev.ts` and `src/db/fixtures.ts` (Wave 0 copied the mock's arrays into `fixtures.ts`, so the originals are no longer imported by anything)

Decision recorded: `PORTAL_REVIEW_PASSWORD` and the review gate in `src/proxy.ts` **stay**. The master plan keeps the gate on until launch and the pilot is invite-only behind it; the `env.ts` comment that said "removed in M5.4" was wrong and the contracts now say "stays until launch" (CCR-5a). Removing the gate is a launch step on the handover checklist.

- [ ] **Step 1: Baseline what still points at the scaffolding**

```bash
cd apps/portal
grep -rnE "@/lib/slice|createSlice|shell/personas|\./personas|@/tour|driver\.js|@/data/|@/lib/demo-date" src scripts e2e 2>/dev/null | cut -c1-150
```

Expected after Wave 1: only the files that are about to be deleted, plus `src/app/layout.tsx` (TourProvider) and `src/components/shell/shell.tsx`. Any other hit is a screen a track did not finish converting: read its import, replace it with the DTO from `src/lib/dto.ts` ("Mock to DTO" table in the contracts, H.0) and the repo call its page already makes, or append a `blocked` line naming the file and stop. `createSlice` inside `shell.tsx` means Step 0 did not apply the notifications change: do it now, because this task must not delete the state the popover still reads.

- [ ] **Step 2: Remove every `data-tour` attribute**

The walkthrough is going, so its anchors go with it. They appear as plain strings and as JSX expressions, so a small script with a brace matcher does it (about 45 sites on the mock). Save this as `/tmp/strip-data-tour.mjs`, run it, delete it:

```js
// One time script for M5.4: removes every data-tour attribute (plain string and JSX expression forms) from src/**/*.tsx.
// Usage: node strip-data-tour.mjs <srcDir>
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const walk = (dir) =>
  readdirSync(dir).flatMap((name) => {
    const full = path.join(dir, name);
    return statSync(full).isDirectory() ? walk(full) : [full];
  });

/** Index just past the closing brace that matches the "{" at `open`, skipping string and template literals. */
const closeBrace = (text, open) => {
  let depth = 0;
  for (let i = open; i < text.length; i += 1) {
    const ch = text[i];
    if (ch === '"' || ch === "'" || ch === '`') {
      const quote = ch;
      i += 1;
      while (i < text.length && text[i] !== quote) {
        if (text[i] === '\\') i += 1;
        else if (quote === '`' && text[i] === '$' && text[i + 1] === '{') i = closeBrace(text, i + 1) - 1;
        i += 1;
      }
    } else if (ch === '{') depth += 1;
    else if (ch === '}') {
      depth -= 1;
      if (depth === 0) return i + 1;
    }
  }
  throw new Error('unbalanced braces');
};

let removed = 0;
for (const file of walk(process.argv[2]).filter((f) => f.endsWith('.tsx'))) {
  let text = readFileSync(file, 'utf8');
  const before = text;
  text = text.replace(/\s+data-tour="[^"]*"/g, () => {
    removed += 1;
    return '';
  });
  for (;;) {
    const at = text.search(/\s+data-tour=\{/);
    if (at === -1) break;
    const open = text.indexOf('{', at);
    text = text.slice(0, at) + text.slice(closeBrace(text, open));
    removed += 1;
  }
  if (text !== before) writeFileSync(file, text);
}
console.info(`removed ${removed} data-tour attributes`);
```

```bash
node /tmp/strip-data-tour.mjs apps/portal/src && rm /tmp/strip-data-tour.mjs
grep -rn "data-tour" apps/portal/src | grep -v "^apps/portal/src/tour/"
```

Expected: `removed <n> data-tour attributes`, and no remaining hit. One component prop remains by hand: the `tour` parameter of `RowAction` in `src/components/partners/applications-table.tsx` (it existed only to carry `data-tour`). Find it with `grep -n "tour" apps/portal/src/components/partners/applications-table.tsx` and delete the destructured `tour,` parameter, the `tour?: string;` member and the `{...(a.id === firstOpenId ? { tour: "application-approve" } : {})}` spread, then `firstOpenId` if it is now unused (typecheck says).

- [ ] **Step 3: Delete the scaffolding files**

```bash
cd apps/portal
git rm src/lib/slice.ts src/lib/demo-date.ts src/components/shell/personas.ts src/tour/tour-provider.tsx src/tour/steps.ts src/data/deals.ts src/data/partners.ts src/data/documents.ts src/data/team.ts src/data/audit.ts src/data/reports.ts
ls src/tour src/data 2>&1 | head
cd ../..
```

Expected: `git rm` lists 11 files; `ls` says both directories no longer exist.

- [ ] **Step 4: Edit the layout, the shell and the password field**

`src/app/layout.tsx`: remove the `TourProvider` import and element, and drop "(mock)" from the titles. Replace the metadata and the body:

```tsx
export const metadata: Metadata = {
  title: { default: "CleanStart Partner Portal", template: "%s | CleanStart Partner Portal" },
  description: "CleanStart partner portal: deal registration, documents and your team.",
  robots: { index: false, follow: false },
};
```

```tsx
      <body>
        <ToastProvider>{children}</ToastProvider>
      </body>
```

and delete the line `import { TourProvider } from "@/tour/tour-provider";`.

`src/components/shell/shell.tsx`: delete the banner (three lines) and the now unused `slug` helper:

```tsx
      <div className="mock-banner">
        Clickable mock for review. All names and numbers are made up and nothing is sent.
      </div>
```

Then `grep -n "slug\|createSlice\|personaFor\|Persona" apps/portal/src/components/shell/shell.tsx`: every remaining hit is dead code (the real viewer replaced the persona in W0-f, the notifications popover replaced `notesRead`); remove it until `pnpm --filter @cleanstart/portal typecheck` reports no unused local.

`src/components/ui/password-field.tsx`: the rule list was duplicated in the mock; point it at the shared pure function (`checkPassword`, contracts H.18) so the client and the server cannot disagree. Replace the function `passwordRules` with:

```tsx
import { checkPassword } from "@/lib/password-rules";

/** Portal password rule: 8+ characters with a letter, a number and a special character. */
export function passwordRules(value: string): PasswordRule[] {
  return checkPassword(value).rules;
}
```

(keep the `PasswordRule` interface where it is; put the import with the other imports.)

- [ ] **Step 5: Remove the mock styles**

Save as `/tmp/strip-mock-css.py`, run, delete. It drops the `.mock-banner`, `.tour-*` and `.driver-*` rules (one rule per line in this file), removes the `--banner-h` variable and makes `.app` the full viewport height again (it used to subtract the 28 px banner):

```python
"""One time script for M5.4: removes the mock banner, walkthrough and Driver.js rules from portal.css.
Usage: python3 strip-mock-css.py src/styles/portal.css"""
import re
import sys

path = sys.argv[1]
css = open(path).read()
lines = css.split('\n')
drop = re.compile(r'^\s*(\.mock-banner|\.tour-|\.driver-)')
kept = [line for line in lines if not drop.match(line)]
text = '\n'.join(kept)
text = text.replace(':root{--banner-h:28px;--side-w:228px}', ':root{--side-w:228px}')
text = text.replace('height:calc(100dvh - var(--banner-h))', 'height:100dvh')
open(path, 'w').write(text)
print(f'removed {len(lines) - len(kept)} rule lines')
```

```bash
python3 /tmp/strip-mock-css.py apps/portal/src/styles/portal.css && rm /tmp/strip-mock-css.py
grep -n "banner\|tour\|driver" apps/portal/src/styles/portal.css || echo "css clean"
grep -n "^\.app{display:grid" apps/portal/src/styles/portal.css | cut -c1-200
```

Expected: `removed 23 rule lines` on the mock's CSS, `css clean`, and the `.app` rule containing `height:100dvh`. If `--banner-h` is used by a rule the script did not know (a Wave 1 addition), `grep -n "banner-h" apps/portal/src/styles/portal.css` shows it: replace `calc(100dvh - var(--banner-h))` with `100dvh` there too.

- [ ] **Step 6: Remove Driver.js and the mock wording**

```bash
pnpm --filter @cleanstart/portal remove driver.js
node -e "
const fs=require('fs');
const p='apps/portal/package.json';
const pkg=JSON.parse(fs.readFileSync(p,'utf8'));
pkg.description='CleanStart partner portal (partners.cleanstart.com): deal registration, documents and team management for partners and CleanStart staff.';
fs.writeFileSync(p,JSON.stringify(pkg,null,2)+'\n');
"
grep -n "driver" apps/portal/package.json || echo "no driver.js"
```

Replace `apps/portal/README.md` with the real app's README:

````markdown
# CleanStart partner portal

`partners.cleanstart.com`: partners register deals and read documents, CleanStart staff approve deals and manage partners, and approved deals sync to HubSpot. One Next.js 16 app, its own Postgres database, a private R2 bucket for documents, Brevo for email.

Runbook: `docs/operations/PARTNER-PORTAL.md`. Build contracts: `docs/superpowers/plans/2026-11-12-partner-portal-00-contracts.md`.

## Run it locally

```bash
bash apps/portal/scripts/db-create.sh cleanstart_portal        # roles and database, once
cp apps/portal/.env.example apps/portal/.env                    # then fill in AUTH_SECRET (openssl rand -base64 32)
pnpm --filter @cleanstart/portal db:migrate
pnpm --filter @cleanstart/portal db:seed                        # the mock's data, every login uses the development password in src/db/fixtures.ts
pnpm --filter @cleanstart/portal exec next dev --port 3004
```

## Checks

```bash
pnpm --filter @cleanstart/portal lint
pnpm --filter @cleanstart/portal typecheck
pnpm --filter @cleanstart/portal test            # includes the tenant isolation matrix
pnpm --filter @cleanstart/portal build
pnpm --filter @cleanstart/portal e2e             # needs bash apps/portal/scripts/db-create.sh cleanstart_portal_e2e and e2e:install once
```

## Where things live

- `src/components/screens/`: one file per screen. `src/components/shell/`: sidebar, top bar, Ctrl K search, notifications.
- `src/server/repo/`: every database read and write, scoped to the viewer. `src/server/actions/`: server actions. `src/server/hubspot/`: the HubSpot outbox and sync. `src/server/jobs/`: scheduled jobs.
- `src/db/`: schema, row level security (`rls.sql`), test helpers, development fixtures.
- `e2e/`: the Playwright `@portal` and `@a11y` suites.
````

- [ ] **Step 7: Rebuild and fix what the removal exposed**

```bash
pnpm --filter @cleanstart/portal typecheck
```

Expected: no errors. Each error is an import or an unused local that the deleted code used to satisfy: fix it in the file the error names, keeping the edit as small as possible. Do not restore a deleted file.

- [ ] **Step 8: Prove the scaffolding is gone**

```bash
cd apps/portal
grep -rnE "@/lib/slice|createSlice|shell/personas|\./personas|@/tour|driver\.js|@/data/|@/lib/demo-date|mock-banner|TourProvider|data-tour" src e2e scripts ../../.github 2>/dev/null; echo "scaffolding grep exit=$?"
grep -rnE "localStorage|sessionStorage" src; echo "storage grep exit=$?"
grep -rni "clickable mock\|(mock)" src ../../docs/operations/PARTNER-PORTAL.md; echo "wording grep exit=$?"
cd ../..
```

Expected: each grep prints nothing and `exit=1` (no match). A `localStorage` hit is the mock's persisted state: it must be gone; a legitimate use (a remembered tab) needs a comment saying why. Only `scripts/seed-dev.ts` and `src/db/fixtures.ts` may mention the mock's seed data, and neither imports from `src/data`.

- [ ] **Step 9: Gate A and commit**

Run the standard Gate A block, then Gate B, then stage the exact paths (list the modified files from `git status --short`; the command below is the shape):

```bash
git add -u apps/portal pnpm-lock.yaml
git add docs/superpowers/plans/2026-11-12-partner-portal-06-admin-infra-hardening.md
git status --short | grep -v '^[MD] ' ; echo "unexpected entries above"
git commit -m "feat(portal): M5.4 remove the mock banner, walkthrough, Driver.js, slices, personas and seed data"
```

`git add -u` stages deletions and modifications of tracked files only, so nothing untracked from another session can enter; the `git status` line must print no unexpected entry. Tag nothing yet (`portal-w2` comes after the final verification).

### Task E2E: Playwright `@portal` suite with FakeHubspot, plus the `@a11y` suite

**Gate A for this task:** the standard block, plus `pnpm --filter @cleanstart/portal exec playwright test` green (Step 12).

**Files (under `apps/portal`):**
- Create: `playwright.config.ts`, `e2e/global-setup.ts`, `e2e/support/{env,db,hubspot,ui}.ts`, `e2e/{journey,documents,admin,a11y,security}.spec.ts`, `.gitignore` entries
- Modify: `package.json` (scripts, `@axe-core/playwright`), `tsconfig.json` (include)
- Temporary: `e2e/probe.spec.ts`, `e2e/probe.config.ts` (deleted in Step 6)

What the master plan (section 7) asks for: apply, approve, invite, accept, register, accept deal, a HubSpot stage change visible to the partner (with `FakeHubspot`), document download denied for a non-audience partner. This task builds that and adds the audit log, the search palette, security headers and axe.

How the suite runs (decisions, all recorded in `playwright.config.ts`):
- **The app starts in development mode, on its own port and build directory.** `next dev --port 3290` with `NEXT_DIST_DIR=.next-e2e`, so it never collides with a dev server in the same folder. Production mode would require the real Brevo, R2 and HubSpot variables; in development the email transport logs and skips, R2 download links are only computed (nothing is sent to `localhost:9`), Turnstile uses Cloudflare's always-pass test keys, and the background jobs are off. Playwright never reuses or kills a server: if the port is busy the run stops with a clear error.
- **HubSpot is in the test process.** The app never talks to HubSpot in this run. The test calls the real `buildHandlers`, `drainOutbox` and `pollDeals` against the app's database with one in-memory `FakeHubspot`, exactly the work the scheduled jobs do, so the whole path (approval writes an outbox row, the drain creates the deal, a stage change in the fake, the poll applies it, the partner sees it) is exercised without an HTTP call.
- **Invite tokens.** Only the hash is stored and email is skipped, so the journey asks `resendInvite` (the same function the Resend button calls) for a fresh token.
- **Labels in one file.** Every button and field name the specs use is in `e2e/support/ui.ts`, taken from the mock's markup. After the conversion some names may differ; fixing them is a one file change (Step 11).
- The Apply step needs outbound HTTPS to `challenges.cloudflare.com` (the Turnstile widget and its check). That is the only external call.
- Local only: `localhost`, never `127.0.0.1` (a dev server reached by IP does not hydrate).

- [ ] **Step 1: Dependencies, scripts, gitignore, database**

```bash
pnpm --filter @cleanstart/portal add -D @axe-core/playwright@^4.11.3
node -e "
const fs=require('fs');
const p='apps/portal/package.json';
const pkg=JSON.parse(fs.readFileSync(p,'utf8'));
Object.assign(pkg.scripts,{e2e:'playwright test','e2e:install':'playwright install chromium','verify:copy':'node scripts/verify-copy.mjs','audit:deps':'node scripts/audit-portal.mjs'});
fs.writeFileSync(p,JSON.stringify(pkg,null,2)+'\n');
"
printf '%s\n' 'e2e/.auth/' 'playwright-report/' 'test-results/' '.next-e2e/' >> apps/portal/.gitignore
pnpm --filter @cleanstart/portal exec playwright install chromium
bash apps/portal/scripts/db-create.sh cleanstart_portal_e2e
lsof -nP -iTCP:3290 -sTCP:LISTEN
```

`@axe-core/playwright` is already in the lockfile (apps/web and apps/cms use `^4.11.3`), so `pnpm-lock.yaml` only gains one importer entry. `@playwright/test` was added in Wave 0 (BUILD-HANDOFF amendment 1). Expected: Chromium installs, the database is created, and the last command prints nothing.

Edit `apps/portal/tsconfig.json`: add `"e2e/**/*.ts"` and `"playwright.config.ts"` to the `include` array (exact edit: `".next/types/**/*.ts"]` becomes `".next/types/**/*.ts", "e2e/**/*.ts", "playwright.config.ts"]`). Check: `grep -n '"include"' apps/portal/tsconfig.json`.

- [ ] **Step 2: Environment and database helpers**

`env.ts` is imported by the config, the global setup and every spec, so the test process, the app's modules it imports and the dev server all see the same database and fakes. It removes (never blanks) every variable that would make the app contact a real service, because an empty string fails env validation.

```ts
// Environment for the Playwright run. Imported by the config, the global setup and every spec, so the test process,
// the helpers it imports from src/ and the Next dev server all see the same database and the same fakes.

const PORT = 3290;
const DB = 'cleanstart_portal_e2e';
const APP_URL = `postgresql://portal_app:portal_app_dev@localhost:5432/${DB}`;
const OWNER_URL = `postgresql://portal_owner:portal_owner_dev@localhost:5432/${DB}`;

/** Variables that would make the app talk to a real service or turn on a gate. They are removed, not blanked, because an empty string fails validation. */
const SCRUBBED = [
  'PORTAL_REVIEW_PASSWORD',
  'BREVO_API_KEY',
  'BREVO_SENDER_EMAIL',
  'PARTNERS_NOTIFY_EMAIL',
  'HUBSPOT_PORTAL_TOKEN',
  'HUBSPOT_PARTNER_PIPELINE_ID',
  'HUBSPOT_WEBHOOK_SECRET',
  'CMS_INTAKE_API_KEY',
  'TURNSTILE_SECRET_KEY',
  'SENTRY_DSN',
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
  'MICROSOFT_CLIENT_ID',
  'MICROSOFT_CLIENT_SECRET',
];
for (const key of SCRUBBED) delete process.env[key];

const serverEnv: Record<string, string> = {
  APP_URL: `http://localhost:${PORT}`,
  DATABASE_URL: APP_URL,
  DATABASE_OWNER_URL: OWNER_URL,
  AUTH_SECRET: 'e2e-secret-e2e-secret-e2e-secret-1234',
  PORTAL_JOBS_ENABLED: 'false',
  // Presigned links are computed locally; nothing is ever sent to this address.
  R2_ENDPOINT: 'http://localhost:9',
  R2_BUCKET: 'e2e-docs',
  R2_ACCESS_KEY_ID: 'e2e-access-key',
  R2_SECRET_ACCESS_KEY: 'e2e-secret-key',
  // Cloudflare's published always-pass Turnstile site key. The matching secret is applied by env.ts outside production.
  NEXT_PUBLIC_TURNSTILE_SITE_KEY: '1x00000000000000000000AA',
  // A separate build directory, so the e2e dev server never collides with a dev server in the same folder.
  NEXT_DIST_DIR: '.next-e2e',
  NEXT_TELEMETRY_DISABLED: '1',
};

// The helpers imported from src/ (test-helpers, repos, HubSpot code) read these in the test process.
Object.assign(process.env, serverEnv, {
  PORTAL_TEST_DATABASE_URL: APP_URL,
  PORTAL_TEST_OWNER_URL: OWNER_URL,
});

export const E2E = {
  port: PORT,
  baseUrl: `http://localhost:${PORT}`,
  database: DB,
  serverEnv,
  pipelineId: 'pipe-e2e',
  /** Meets the password rule (8 or more characters, a letter, a number, a special character). Exists only in this throwaway database. */
  password: 'E2e-Passw0rd!x',
} as const;

export const PERSONAS = {
  manager: { email: 'manager@cleanstart.test', name: 'Omar E2E', file: 'e2e/.auth/manager.json' },
  marketing: { email: 'marketing@cleanstart.test', name: 'Ishita E2E', file: 'e2e/.auth/marketing.json' },
  kestrelAdmin: { email: 'aditi@kestrel-e2e.test', name: 'Aditi E2E', file: 'e2e/.auth/kestrel-admin.json' },
  kestrelSales: { email: 'vikram@kestrel-e2e.test', name: 'Vikram E2E', file: 'e2e/.auth/kestrel-sales.json' },
  kestrelTechnical: { email: 'meera@kestrel-e2e.test', name: 'Meera E2E', file: 'e2e/.auth/kestrel-technical.json' },
  arborAdmin: { email: 'priya@arbor-e2e.test', name: 'Priya E2E', file: 'e2e/.auth/arbor-admin.json' },
} as const;

export type PersonaKey = keyof typeof PERSONAS;

export const KESTREL = 'Kestrel E2E';
export const ARBOR = 'Arbor E2E';
export const RESTRICTED_DOC = 'Kestrel only playbook';
export const OPEN_DOC = 'Open datasheet for every partner';
```

`db.ts` seeds two partners (Kestrel E2E, channel, India; Arbor E2E, distributor, Middle East) with an admin each plus Kestrel sales and technical users, two staff (a partner manager and marketing), a pending Kestrel deal, one document open to Kestrel only and one open to everyone, and two audit rows. It uses the contracts' J.3 helpers (`makePartner`, `makeUser` with a `password`, `makeRegistration`, `makeDocument`, `resetDb`).

```ts
import { eq } from 'drizzle-orm';
import type { Db } from '@/db/client';
import { auditLog, documents, partners, registrations, users } from '@/db/schema';
import { makeDocument, makePartner, makeRegistration, makeUser, resetDb, testDb } from '@/db/test-helpers';
import { recordAudit } from '@/server/audit/record';
import { SYSTEM_ACTORS } from '@/server/auth/types';
import { ARBOR, E2E, KESTREL, OPEN_DOC, PERSONAS, RESTRICTED_DOC } from './env';

export const db = (): Db => testDb();

/** Two partners, their people, two staff, two documents and a few audit rows. Runs once, before the browser tests. */
export async function seedBase(): Promise<void> {
  const d = db();
  await resetDb(d);

  const kestrel = await makePartner(d, { name: KESTREL, domain: 'kestrel-e2e.test', category: 'channel', region: 'india' });
  const arbor = await makePartner(d, { name: ARBOR, domain: 'arbor-e2e.test', category: 'distributor', region: 'middle_east' });

  const staff = (key: 'manager' | 'marketing', role: 'partner_manager' | 'marketing') =>
    makeUser(d, { kind: 'staff', role, region: 'all', email: PERSONAS[key].email, name: PERSONAS[key].name, password: E2E.password });
  await staff('manager', 'partner_manager');
  await staff('marketing', 'marketing');

  const partnerUser = (key: 'kestrelAdmin' | 'kestrelSales' | 'kestrelTechnical' | 'arborAdmin', partnerId: string, role: 'partner_admin' | 'sales' | 'technical') =>
    makeUser(d, { partnerId, role, email: PERSONAS[key].email, name: PERSONAS[key].name, password: E2E.password });
  const kestrelAdmin = await partnerUser('kestrelAdmin', kestrel.id, 'partner_admin');
  await partnerUser('kestrelSales', kestrel.id, 'sales');
  await partnerUser('kestrelTechnical', kestrel.id, 'technical');
  await partnerUser('arborAdmin', arbor.id, 'partner_admin');

  await makeRegistration(d, { partnerId: kestrel.id, customerName: 'Vardhan Capital E2E', product: 'cleansight', region: 'india', status: 'pending', registeredBy: kestrelAdmin.id });

  await makeDocument(d, { title: RESTRICTED_DOC, type: 'datasheet', audienceKind: 'named', partnerIds: [kestrel.id] });
  await makeDocument(d, { title: OPEN_DOC, type: 'datasheet', audienceKind: 'all' });

  await d.transaction(async (tx) => {
    await recordAudit(tx, SYSTEM_ACTORS.portal, { event: 'partner.created', target: KESTREL, partnerId: kestrel.id });
    await recordAudit(tx, SYSTEM_ACTORS.hubspot, { event: 'registration.stage_changed', target: 'Vardhan Capital E2E, CleanSight', note: 'Stage changed to Discovery', source: 'crm' });
  });
}

export async function documentIdByTitle(title: string): Promise<string> {
  const [row] = await db().select({ id: documents.id }).from(documents).where(eq(documents.title, title));
  if (!row) throw new Error(`seeded document not found: ${title}`);
  return row.id;
}

export async function seededRegistrationId(customer: string): Promise<string> {
  const [row] = await db().select({ id: registrations.id }).from(registrations).where(eq(registrations.customerName, customer));
  if (!row) throw new Error(`registration not found: ${customer}`);
  return row.id;
}

export async function registrationByCustomer(customer: string): Promise<typeof registrations.$inferSelect> {
  const [row] = await db().select().from(registrations).where(eq(registrations.customerName, customer));
  if (!row) throw new Error(`registration not found: ${customer}`);
  return row;
}

export async function userByEmail(email: string): Promise<typeof users.$inferSelect> {
  const [row] = await db().select().from(users).where(eq(users.email, email));
  if (!row) throw new Error(`user not found: ${email}`);
  return row;
}

export async function partnerByName(name: string): Promise<typeof partners.$inferSelect> {
  const [row] = await db().select().from(partners).where(eq(partners.name, name));
  if (!row) throw new Error(`partner not found: ${name}`);
  return row;
}

export async function auditCount(): Promise<number> {
  return (await db().select().from(auditLog)).length;
}
```

- [ ] **Step 3: HubSpot and UI helpers**

`hubspot.ts` plays the scheduler. `drainOutboxNow` runs the real outbox drain; a handler that waits for a related record reschedules itself a minute out, so later passes use a clock two minutes ahead. Signatures are the HubSpot plan's: `buildHandlers(db, hs, pipelineId, clock?)`, `drainOutbox({ db, handlers, clock })`, `pollDeals({ db, hs, pipelineId, clock })`.

```ts
import { fixedClock, systemClock } from '@/lib/clock';
import { FakeHubspot } from '@/server/hubspot/fake';
import { buildHandlers } from '@/server/hubspot/handlers';
import { drainOutbox } from '@/server/hubspot/outbox';
import { type PollResult, pollDeals } from '@/server/hubspot/poll';
import { db } from './db';
import { E2E } from './env';

/** The one in-memory HubSpot of the run. The app process never talks to it: the test process plays the scheduler. */
export const hubspot = new FakeHubspot();

/**
 * Runs the outbox drain the way the scheduled job would, until it has nothing due. A handler that waits for a
 * related record reschedules itself a minute out, so later passes use a clock that is two minutes ahead.
 */
export async function drainOutboxNow(): Promise<void> {
  const handlers = buildHandlers(db(), hubspot, E2E.pipelineId);
  for (let pass = 0; pass < 4; pass += 1) {
    const clock = pass === 0 ? systemClock : fixedClock(new Date(Date.now() + pass * 120_000).toISOString());
    const result = await drainOutbox({ db: db(), handlers, clock });
    if (result.done + result.retried + result.failed + result.waiting === 0) return;
  }
}

/** One inbound poll, as the five minute job would run it. */
export function pollNow(): Promise<PollResult> {
  return pollDeals({ db: db(), hs: hubspot, pipelineId: E2E.pipelineId, clock: systemClock });
}
```

`ui.ts` is the single place for labels, ids and role names:

```ts
import type { Page } from '@playwright/test';
import { E2E } from './env';

/**
 * Every label and role name the specs click lives in this file. The names are the ones the screens carry in the
 * mock (commit 58747992, markup unchanged by the conversion). If a screen renames something, fix it here once.
 */
export async function signInThroughTheForm(page: Page, email: string, password: string = E2E.password): Promise<void> {
  await page.goto('/sign-in');
  await page.getByLabel('Work email').fill(email);
  await page.getByLabel('Password', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
}

export async function signIn(page: Page, email: string): Promise<void> {
  await signInThroughTheForm(page, email);
  await page.waitForURL(/\/(partner|admin)\//);
}

export interface ApplicantInput {
  company: string;
  website: string;
  name: string;
  title: string;
  email: string;
  phone: string;
}

export async function fillApplication(page: Page, a: ApplicantInput): Promise<void> {
  await page.goto('/apply');
  await page.locator('#ap-company').fill(a.company);
  await page.locator('#ap-site').fill(a.website);
  await page.locator('#ap-name').fill(a.name);
  await page.locator('#ap-title').fill(a.title);
  await page.locator('#ap-email').fill(a.email);
  await page.locator('#ap-phone').fill(a.phone);
  await page.getByRole('button', { name: 'Channel partner', exact: true }).click();
  await page.getByRole('button', { name: 'India', exact: true }).click();
  await page.locator('#ap-how').fill('Found CleanStart through a customer evaluation.');
  await page.getByRole('button', { name: 'Submit application' }).click();
}

export async function openApplicationsTab(page: Page): Promise<void> {
  await page.goto('/admin/partners');
  await page.getByRole('button', { name: /Applications/ }).click();
}

export async function acceptInvite(page: Page, name: string, password: string = E2E.password): Promise<void> {
  await page.locator('#name').fill(name);
  await page.getByLabel('Password', { exact: true }).fill(password);
  await page.getByLabel('Confirm password', { exact: true }).fill(password);
  await page.getByRole('checkbox', { name: /I accept the partner agreement/ }).check();
  await page.getByRole('button', { name: 'Accept and continue' }).click();
}

export interface DealInput {
  customer: string;
  contactName: string;
  contactEmail: string;
  product: 'CleanStart Images' | 'Clean Libraries' | 'CleanSight';
}

export async function registerDeal(page: Page, d: DealInput): Promise<void> {
  await page.goto('/partner/deals/new');
  await page.locator('#customer').fill(d.customer);
  await page.locator('#contact').fill(d.contactName);
  await page.locator('#cemail').fill(d.contactEmail);
  await page.getByRole('button', { name: new RegExp(d.product) }).click();
  await page.getByRole('button', { name: 'India', exact: true }).click();
  await page.getByRole('button', { name: 'Submit for approval' }).click();
}

export const acceptButton = (page: Page, customer: string, partner: string) =>
  page.getByRole('button', { name: `Accept ${customer} from ${partner}` });
```

- [ ] **Step 4: Global setup and config**

The global setup migrates the e2e database exactly as production does (the contracts' `migrateDatabase`: Drizzle migrations, then `rls.sql`), seeds it and signs every persona in once, saving a session file per persona. Playwright starts the dev server before it runs.

```ts
import { mkdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { chromium, type FullConfig } from '@playwright/test';
import { migrateDatabase } from '../scripts/migrate';
import { seedBase } from './support/db';
import { E2E, PERSONAS, type PersonaKey } from './support/env';
import { signIn } from './support/ui';

/**
 * Runs after the dev server is up and before the first test: migrate the e2e database exactly as production does
 * (drizzle migrations, then rls.sql), seed it, and sign each persona in once so specs start from a stored session.
 */
export default async function globalSetup(config: FullConfig): Promise<void> {
  const root = process.cwd();
  await migrateDatabase({
    url: process.env.PORTAL_TEST_OWNER_URL ?? '',
    migrationsFolder: join(root, 'drizzle'),
    rlsSql: readFileSync(join(root, 'src/db/rls.sql'), 'utf8'),
  });
  await seedBase();

  mkdirSync(join(root, 'e2e/.auth'), { recursive: true });
  const browser = await chromium.launch(config.projects[0]?.use.channel ? { channel: config.projects[0].use.channel } : {});
  try {
    for (const key of Object.keys(PERSONAS) as PersonaKey[]) {
      const context = await browser.newContext({ baseURL: E2E.baseUrl });
      const page = await context.newPage();
      await signIn(page, PERSONAS[key].email);
      await context.storageState({ path: join(root, PERSONAS[key].file) });
      await context.close();
    }
  } finally {
    await browser.close();
  }
}
```

```ts
import { defineConfig, devices } from '@playwright/test';
import { E2E } from './e2e/support/env';

/**
 * Portal E2E (`@portal`) and accessibility (`@a11y`) suites.
 *
 * Boot model: Playwright starts `next dev` on its own port with its own build directory against the
 * cleanstart_portal_e2e database (create it with scripts/db-create.sh). The dev server runs in development mode on
 * purpose: production mode requires the real Brevo, R2 and HubSpot variables. In development the email transport
 * logs and skips, R2 links are only computed, Turnstile uses Cloudflare's test keys, and background jobs are off.
 * HubSpot is the in-memory FakeHubspot driven from the test process (e2e/support/hubspot.ts).
 *
 * localhost, never 127.0.0.1: a dev server reached by IP does not hydrate (see apps/portal docs).
 */
export default defineConfig({
  testDir: './e2e',
  testMatch: /.*\.spec\.ts/,
  globalSetup: './e2e/global-setup.ts',
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  timeout: 90_000,
  expect: { timeout: 15_000 },
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: E2E.baseUrl,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    actionTimeout: 15_000,
    navigationTimeout: 60_000,
    // Set PORTAL_E2E_CHANNEL=chrome to use the installed Chrome when the Playwright browser cache is missing.
    ...(process.env.PORTAL_E2E_CHANNEL ? { channel: process.env.PORTAL_E2E_CHANNEL } : {}),
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } } },
    { name: 'mobile', use: { ...devices['Pixel 7'] }, grep: /@a11y axe/ },
  ],
  webServer: {
    command: `pnpm exec next dev --port ${E2E.port}`,
    url: `${E2E.baseUrl}/api/health`,
    env: E2E.serverEnv,
    // Never reuse and never kill: if the port is busy the run stops with a clear error.
    reuseExistingServer: false,
    timeout: 180_000,
    stdout: 'pipe',
  },
});
```

- [ ] **Step 5: Verify that specs can import the app's modules** (the one thing this plan could not assume)

A temporary probe checks that Playwright's TypeScript loader resolves the `@/` paths, that the contracts' `testDb()` reaches the e2e database, and that the support files load. It uses its own config, so no server or setup runs.

```ts
import { expect, test } from '@playwright/test';
import { sql } from 'drizzle-orm';
import { systemClock } from '@/lib/clock';
import { db } from './support/db';
import { E2E } from './support/env';
import { hubspot } from './support/hubspot';

// Temporary: proves that specs can import the app's modules through the tsconfig paths and reach the e2e database.
test('the app modules load under Playwright and the e2e database answers', async () => {
  expect(systemClock.today()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  expect((await db().execute(sql`select current_database() as name`)).rows[0]).toEqual({ name: E2E.database });
  expect(hubspot.deals.size).toBe(0);
});
```

```ts
import { defineConfig } from '@playwright/test';

// Temporary: runs the probe without starting the dev server or the global setup.
export default defineConfig({ testDir: '.', testMatch: /probe\.spec\.ts/ });
```

Run: `(cd apps/portal && pnpm exec playwright test --config e2e/probe.config.ts)`
Expected: `1 passed`. The same probe passed in the scratch harness with Playwright 1.59.1 against a real Postgres.

**Verify (fallback):** if `@/` imports fail, `testDb()` ignores `PORTAL_TEST_DATABASE_URL`, or the HubSpot modules throw on import, do not rewrite the helpers. Make `e2e/support/db.ts` build its own pool and Drizzle client from `process.env.DATABASE_URL` (`new Pool({ connectionString, options: '-c app.kind=system' })` and `drizzle(pool, { schema })`), import the repo, HubSpot and invite modules by relative path (`../../src/...`), and record the change in the progress log. The specs themselves stay as written.

- [ ] **Step 6: Delete the probe**

```bash
rm apps/portal/e2e/probe.spec.ts apps/portal/e2e/probe.config.ts
```

- [ ] **Step 7: The lifecycle spec (failing first)**

`journey.spec.ts` is one serial run with each actor in their own browser context: a company applies and sees its `APP-YYMM-NNNN` reference; the partner manager approves it (the partner exists with status `onboarding`); the invited person accepts the invite and the agreement and is signed in (the test also accepts a redirect to `/sign-in`, which P's flow may use); the partner registers a deal; staff accept it and protection starts; the outbox drain creates exactly one HubSpot deal and stores its id; a stage change made in the fake is applied by the poll and shown on the partner's deal page; the audit log shows approval, acceptance and the stage change. A last test checks that a partner cannot open `/admin/audit`.

```ts
import { type Browser, type BrowserContext, expect, type Page, test } from '@playwright/test';
import { eq } from 'drizzle-orm';
import { invites } from '@/db/schema';
import { viewerFor } from '@/db/test-helpers';
import { systemClock } from '@/lib/clock';
import { withViewer } from '@/server/repo/context';
import { resendInvite } from '@/server/repo/invites';
import { db, partnerByName, registrationByCustomer, userByEmail } from './support/db';
import { PERSONAS } from './support/env';
import { drainOutboxNow, hubspot, pollNow } from './support/hubspot';
import {
  acceptButton,
  acceptInvite,
  fillApplication,
  openApplicationsTab,
  registerDeal,
  signInThroughTheForm,
} from './support/ui';

/**
 * The whole partner lifecycle in one serial run, each actor in their own browser context:
 * apply, approve, invite, accept, register a deal, accept the deal, then a stage change made in HubSpot (the
 * in-memory FakeHubspot) reaches the partner's deal page. One test per step so a failure names the step.
 */
const COMPANY = 'Lattice Cloud Services E2E';
const APPLICANT = { name: 'Rohan Mehta', email: 'rohan@lattice-cloud-e2e.test' };
const CUSTOMER = 'Gulfway Freight E2E';

test.describe.configure({ mode: 'serial' });

test.describe('@portal partner lifecycle', () => {
  let applicant: BrowserContext;
  let staff: BrowserContext;
  let partner: BrowserContext;
  let staffPage: Page;
  let partnerPage: Page;
  let registrationId = '';

  test.beforeAll(async ({ browser }: { browser: Browser }) => {
    applicant = await browser.newContext();
    staff = await browser.newContext({ storageState: PERSONAS.manager.file });
    partner = await browser.newContext();
    staffPage = await staff.newPage();
    partnerPage = await partner.newPage();
  });

  test.afterAll(async () => {
    await Promise.all([applicant.close(), staff.close(), partner.close()]);
  });

  test('a company applies and sees its reference', async () => {
    const page = await applicant.newPage();
    await fillApplication(page, {
      company: COMPANY,
      website: 'lattice-cloud-e2e.test',
      name: APPLICANT.name,
      title: 'Director of Alliances',
      email: APPLICANT.email,
      phone: '+91 98765 43210',
    });
    await expect(page).toHaveURL(/\/apply\/done/);
    await expect(page.getByText(/APP-\d{4}-\d{4}/)).toBeVisible();
  });

  test('a partner manager approves the application and the invite goes out', async () => {
    await openApplicationsTab(staffPage);
    await staffPage.getByRole('button', { name: `Approve ${COMPANY}` }).click();
    await expect(staffPage.getByText('Approved, invite sent')).toBeVisible();
    expect((await partnerByName(COMPANY)).status).toBe('onboarding');
  });

  test('the invited person accepts the invite and the agreement', async () => {
    // Only the hash of the invite token is stored and email is skipped in this run, so the test takes a fresh
    // token the way the Resend button does.
    const manager = await userByEmail(PERSONAS.manager.email);
    const viewer = await viewerFor(db(), manager);
    const [invite] = await db().select().from(invites).where(eq(invites.email, APPLICANT.email));
    if (!invite) throw new Error('the approval did not create an invite');
    const created = await withViewer(viewer, (tx) => resendInvite(tx, viewer, { inviteId: invite.id }, systemClock));

    const page = await partner.newPage();
    await page.goto(`/accept-invite?token=${encodeURIComponent(created.token)}`);
    await acceptInvite(page, APPLICANT.name);
    await page.waitForURL(/\/(partner\/welcome|sign-in)/);
    if (page.url().includes('/sign-in')) {
      await signInThroughTheForm(page, APPLICANT.email);
      await page.waitForURL(/\/partner\//);
    }
    await expect(page).toHaveURL(/\/partner\//);
    expect((await userByEmail(APPLICANT.email)).status).toBe('active');
    expect((await partnerByName(COMPANY)).agreementAcceptedAt).not.toBeNull();
    partnerPage = page;
  });

  test('the partner registers a deal and it waits for review', async () => {
    await registerDeal(partnerPage, {
      customer: CUSTOMER,
      contactName: 'Nadia Karim',
      contactEmail: 'nadia@gulfway-e2e.test',
      product: 'CleanSight',
    });
    await partnerPage.goto('/partner/deals');
    await expect(partnerPage.getByText(CUSTOMER).first()).toBeVisible();
    const row = await registrationByCustomer(CUSTOMER);
    expect(row.status).toBe('pending');
    registrationId = row.id;
  });

  test('staff accept the deal and protection starts', async () => {
    await staffPage.goto('/admin/approvals');
    await acceptButton(staffPage, CUSTOMER, COMPANY).click();
    await expect.poll(async () => (await registrationByCustomer(CUSTOMER)).status).toBe('accepted');
    expect((await registrationByCustomer(CUSTOMER)).protectionEnd).not.toBeNull();
  });

  test('the approval reaches HubSpot, and a stage change made there shows on the partner deal page', async () => {
    await drainOutboxNow();
    const created = [...hubspot.deals.values()].filter((d) => d.properties.portal_registration_id === registrationId);
    expect(created).toHaveLength(1);
    const [deal] = created;
    if (!deal) throw new Error('no HubSpot deal');
    expect((await registrationByCustomer(CUSTOMER)).hubspotDealId).toBe(deal.id);

    await hubspot.updateDeal(deal.id, { dealstage: hubspot.stageIds['Technical evaluation'] });
    expect(await pollNow()).toMatchObject({ applied: 1 });
    expect((await registrationByCustomer(CUSTOMER)).stage).toBe('Technical evaluation');

    await partnerPage.goto(`/partner/deals/${registrationId}`);
    await expect(partnerPage.getByText('Technical evaluation').first()).toBeVisible();
  });

  test('every step left an audit entry that the partner manager can read', async () => {
    await staffPage.goto('/admin/audit');
    await expect(staffPage.getByRole('button', { name: 'Approved an application' }).first()).toBeVisible();
    await expect(staffPage.getByRole('button', { name: 'Accepted a registration' }).first()).toBeVisible();
    await expect(staffPage.getByRole('button', { name: 'Stage changed' }).first()).toBeVisible();
  });
});

test.describe('@portal sign in', () => {
  test('a partner user cannot open the admin area', async ({ page }) => {
    await signInThroughTheForm(page, PERSONAS.arborAdmin.email);
    await page.waitForURL(/\/partner\//);
    await page.goto('/admin/audit');
    await expect(page).toHaveURL(/\/partner\//);
  });
});
```

Run: `pnpm --filter @cleanstart/portal exec playwright test e2e/journey.spec.ts --project=desktop`
Expected before the screens match the selectors: FAIL at the first step that names a label that differs. Expected once they match: `8 passed`.

- [ ] **Step 8: The documents spec**

An outsider and a missing id get byte-identical 404s; the library never lists the restricted document for the outsider; the audience partner is redirected to a link that expires in at most 60 seconds and no response contains a storage key; a signed out request never reaches storage.

```ts
import { expect, test } from '@playwright/test';
import { documentIdByTitle } from './support/db';
import { OPEN_DOC, PERSONAS, RESTRICTED_DOC } from './support/env';

/**
 * Document access. The seeded "Kestrel only playbook" is open to Kestrel alone. A partner outside its audience must
 * get the same 404 as for an id that does not exist, so file ids cannot be probed, and must not see it listed.
 * Download links are computed locally (no R2 request is made): the test reads the redirect and never follows it.
 */
test.describe('@portal documents', () => {
  test.describe('a partner outside the audience', () => {
    test.use({ storageState: PERSONAS.arborAdmin.file });

    test('gets a 404 for the file, identical to a missing id', async ({ request }) => {
      const id = await documentIdByTitle(RESTRICTED_DOC);
      const denied = await request.get(`/api/files/${id}`, { maxRedirects: 0 });
      const missing = await request.get('/api/files/00000000-0000-4000-8000-000000000000', { maxRedirects: 0 });
      expect(denied.status()).toBe(404);
      expect(missing.status()).toBe(404);
      expect(await denied.text()).toBe(await missing.text());
    });

    test('does not see the document in the library, but sees the open one', async ({ page }) => {
      await page.goto('/partner/documents');
      await expect(page.getByText(OPEN_DOC).first()).toBeVisible();
      await expect(page.getByText(RESTRICTED_DOC)).toHaveCount(0);
    });
  });

  test.describe('a partner inside the audience', () => {
    test.use({ storageState: PERSONAS.kestrelAdmin.file });

    test('is sent to a short lived download link and never sees the storage key', async ({ request }) => {
      const id = await documentIdByTitle(RESTRICTED_DOC);
      const response = await request.get(`/api/files/${id}`, { maxRedirects: 0 });
      expect(response.status()).toBe(302);
      const location = response.headers().location ?? '';
      expect(location).toContain('localhost:9');
      expect(location).toMatch(/X-Amz-Expires=\d+/);
      expect(Number(/X-Amz-Expires=(\d+)/.exec(location)?.[1])).toBeLessThanOrEqual(60);
      expect(await response.text()).not.toContain('documents/');
    });

    test('sees the document in the library', async ({ page }) => {
      await page.goto('/partner/documents');
      await expect(page.getByText(RESTRICTED_DOC).first()).toBeVisible();
    });
  });

  test.describe('signed out', () => {
    test('is turned away from the file route', async ({ request }) => {
      const id = await documentIdByTitle(OPEN_DOC);
      const response = await request.get(`/api/files/${id}`, { maxRedirects: 0 });
      expect([401, 302, 307, 404]).toContain(response.status());
      expect(response.headers().location ?? '').not.toContain('localhost:9');
    });
  });
});
```

Run: `pnpm --filter @cleanstart/portal exec playwright test e2e/documents.spec.ts --project=desktop`
Expected: `5 passed`.

- [ ] **Step 9: The audit log and search spec**

```ts
import { readFile } from 'node:fs/promises';
import { expect, type Locator, type Page, test } from '@playwright/test';
import { KESTREL, PERSONAS } from './support/env';

/** Types into the palette and waits for the server action's answer, so an empty list is the real answer. */
async function searchFor(page: Page, dialog: Locator, text: string): Promise<void> {
  const answered = page.waitForResponse((response) => response.request().method() === 'POST');
  await dialog.getByRole('searchbox').fill(text);
  await answered;
}

/** The Audit log screen and the Ctrl K palette, as a partner manager and as a partner admin. */
test.describe('@portal audit log', () => {
  test.use({ storageState: PERSONAS.manager.file });

  test('lists events, filters through the URL and exports the filtered set', async ({ page }) => {
    await page.goto('/admin/audit');
    await expect(page.getByRole('heading', { name: 'Audit log' })).toBeVisible();
    await expect(page.getByRole('region', { name: 'HubSpot sync' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Stage changed' }).first()).toBeVisible();

    await page.getByLabel('Search', { exact: true }).fill('Kestrel');
    await expect(page).toHaveURL(/q=Kestrel/);
    await expect(page.getByRole('button', { name: 'Added partner' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Stage changed' })).toHaveCount(0);

    const [download] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Export CSV' }).click()]);
    expect(download.suggestedFilename()).toBe('cleanstart-audit-log.csv');
    const body = await readFile(await download.path(), 'utf8');
    expect(body.split('\n')[0]).toBe('"When","Who","Role","Action","On","Source","Details"');
    expect(body).toContain(KESTREL);
  });

  test('opens an event in the drawer with its details', async ({ page }) => {
    await page.goto('/admin/audit');
    await page.getByRole('button', { name: 'Stage changed' }).first().click();
    await expect(page.getByText('Stage changed to Discovery')).toBeVisible();
    await expect(page.getByText('CRM')).toBeVisible();
  });
});

test.describe('@portal search', () => {
  test.describe('as a partner manager', () => {
    test.use({ storageState: PERSONAS.manager.file });

    test('Ctrl K finds a partner and Enter opens the first result', async ({ page }) => {
      await page.goto('/admin/approvals');
      await page.keyboard.press('Control+K');
      const dialog = page.getByRole('dialog', { name: 'Search' });
      await expect(dialog).toBeVisible();
      await dialog.getByRole('searchbox').fill('kestrl');
      await expect(dialog.getByText(KESTREL)).toBeVisible();
      await expect(dialog.getByText('Vardhan Capital E2E')).toBeVisible();
      await dialog.getByRole('searchbox').press('Escape');
      await expect(dialog).toBeHidden();
    });
  });

  test.describe('as a partner admin of another company', () => {
    test.use({ storageState: PERSONAS.arborAdmin.file });

    test('never returns another partner or its deals', async ({ page }) => {
      await page.goto('/partner/documents');
      await page.keyboard.press('Control+K');
      const dialog = page.getByRole('dialog', { name: 'Search' });
      await searchFor(page, dialog, 'Vardhan');
      await expect(dialog.getByText('Nothing matches')).toBeVisible();
      await searchFor(page, dialog, 'Kestrel');
      await expect(dialog.getByText(KESTREL)).toHaveCount(0);
    });
  });
});
```

Run: `pnpm --filter @cleanstart/portal exec playwright test e2e/admin.spec.ts --project=desktop`
Expected: `4 passed` (needs CCR-3 merged for the two search tests).

- [ ] **Step 10: The security and accessibility specs**

`security.spec.ts` checks the headers on real responses and proves the policy does not block the app: the browser reports every blocked resource as a `securitypolicyviolation` event and none may occur across the signed out pages, the partner admin pages, the palette and the manager pages. (It passes fully only after M5.1 installs the policy; until then its first group fails, which is the point of writing it here.) `a11y.spec.ts` runs axe (WCAG 2.0 and 2.1, A and AA) on every route as the role that uses it, at desktop width and, through the `mobile` project, at 393 px, failing on serious and critical violations and attaching the rest; then three keyboard tests: the palette (focus in, Tab stays inside, Escape returns focus), a drawer (focus trap, Escape, focus return) and a Tab walk over the deals page that compares each stop's paint with and without focus, so an element with no visible indicator fails.

```ts
import { expect, type Page, test } from '@playwright/test';
import { PERSONAS } from './support/env';

/**
 * Security headers on real responses, and proof that the Content-Security-Policy does not break the app: the browser
 * reports every blocked resource as a securitypolicyviolation event, and none may happen on the main routes.
 * The development server serves the development policy ('unsafe-eval' allowed); the production policy is unit tested
 * in src/server/security/csp.test.ts and src/proxy.test.ts.
 */
const watchViolations = async (page: Page): Promise<() => Promise<string[]>> => {
  await page.addInitScript(() => {
    const seen: string[] = [];
    (window as unknown as { __csp: string[] }).__csp = seen;
    document.addEventListener('securitypolicyviolation', (event) => {
      seen.push(`${event.violatedDirective} blocked ${event.blockedURI || 'inline'}`);
    });
  });
  return () => page.evaluate(() => (window as unknown as { __csp?: string[] }).__csp ?? []);
};

test.describe('@portal security headers', () => {
  test('a page response carries a nonce policy and the static protections', async ({ request }) => {
    const response = await request.get('/sign-in');
    const headers = response.headers();
    expect(headers['content-security-policy']).toMatch(/script-src [^;]*'nonce-[A-Za-z0-9+/=]+'/);
    expect(headers['content-security-policy']).toContain("frame-ancestors 'none'");
    expect(headers['x-frame-options']).toBe('DENY');
    expect(headers['x-content-type-options']).toBe('nosniff');
    expect(headers['referrer-policy']).toBe('strict-origin-when-cross-origin');
    expect(headers['cross-origin-opener-policy']).toBe('same-origin');
    expect(headers['x-powered-by']).toBeUndefined();
  });

  test('the nonce changes on every request', async ({ request }) => {
    const nonce = async (): Promise<string> =>
      /'nonce-([^']+)'/.exec((await request.get('/sign-in')).headers()['content-security-policy'] ?? '')?.[1] ?? '';
    expect(await nonce()).not.toBe(await nonce());
  });

  test('API routes answer with a closed policy', async ({ request }) => {
    const response = await request.get('/api/health');
    expect(response.headers()['content-security-policy']).toBe("default-src 'none'; frame-ancestors 'none'");
  });
});

test.describe('@portal csp does not block the app', () => {
  test('signed out pages', async ({ page }) => {
    const violations = await watchViolations(page);
    for (const path of ['/sign-in', '/apply']) {
      await page.goto(path);
      await page.waitForLoadState('networkidle');
    }
    expect(await violations()).toEqual([]);
  });

  test.describe('partner admin', () => {
    test.use({ storageState: PERSONAS.kestrelAdmin.file });
    test('overview, deals, documents, team, account and the search palette', async ({ page }) => {
      const violations = await watchViolations(page);
      for (const path of ['/partner/overview', '/partner/deals', '/partner/deals/new', '/partner/documents', '/partner/team', '/partner/account']) {
        await page.goto(path);
        await page.waitForLoadState('networkidle');
      }
      await page.keyboard.press('Control+K');
      await page.getByRole('searchbox').fill('Vardhan');
      await page.waitForLoadState('networkidle');
      expect(await violations()).toEqual([]);
    });
  });

  test.describe('partner manager', () => {
    test.use({ storageState: PERSONAS.manager.file });
    test('approvals, partners, documents, reports, team and audit', async ({ page }) => {
      const violations = await watchViolations(page);
      for (const path of ['/admin/approvals', '/admin/partners', '/admin/documents', '/admin/reports', '/admin/team', '/admin/audit']) {
        await page.goto(path);
        await page.waitForLoadState('networkidle');
      }
      expect(await violations()).toEqual([]);
    });
  });
});
```

```ts
import AxeBuilder from '@axe-core/playwright';
import { expect, type Page, test, type TestInfo } from '@playwright/test';
import { seededRegistrationId } from './support/db';
import { PERSONAS, type PersonaKey } from './support/env';

/**
 * Accessibility: axe on every route as the role that uses it, then the keyboard behaviour axe cannot see.
 * Fails on serious and critical violations (WCAG 2.0 and 2.1, levels A and AA). Moderate and minor ones are attached
 * to the report so they can be triaged. Runs at desktop width and, through the `mobile` project, at 393 px.
 */
const WCAG = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];

interface Group {
  as: PersonaKey | null;
  paths: string[];
}

/** ':seeded' stands for the id of the seeded Kestrel registration. */
const GROUPS: Group[] = [
  { as: null, paths: ['/sign-in', '/apply'] },
  {
    as: 'kestrelAdmin',
    paths: [
      '/partner/overview',
      '/partner/welcome',
      '/partner/deals',
      '/partner/deals/new',
      '/partner/deals/:seeded',
      '/partner/documents',
      '/partner/team',
      '/partner/company',
      '/partner/account',
    ],
  },
  { as: 'kestrelTechnical', paths: ['/partner/documents'] },
  { as: 'manager', paths: ['/admin/approvals', '/admin/partners', '/admin/documents', '/admin/reports', '/admin/team', '/admin/audit'] },
  { as: 'marketing', paths: ['/admin/documents'] },
];

async function scan(page: Page, label: string, testInfo: TestInfo): Promise<void> {
  const results = await new AxeBuilder({ page }).withTags(WCAG).analyze();
  const blocking = results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
  const advisory = results.violations.filter((v) => v.impact !== 'serious' && v.impact !== 'critical');
  if (advisory.length > 0) {
    await testInfo.attach(`${label} advisory`, { body: JSON.stringify(advisory, null, 2), contentType: 'application/json' });
  }
  expect(
    blocking.map((v) => `${v.id} (${v.impact}): ${v.nodes.map((n) => n.target.join(' ')).slice(0, 3).join(' | ')}`),
    label,
  ).toEqual([]);
}

for (const group of GROUPS) {
  test.describe(`@a11y axe, ${group.as ?? 'signed out'}`, () => {
    test.use({ storageState: group.as ? PERSONAS[group.as].file : { cookies: [], origins: [] } });
    for (const route of group.paths) {
      test(route, async ({ page }, testInfo) => {
        const path = route.replace(':seeded', route.includes(':seeded') ? await seededRegistrationId('Vardhan Capital E2E') : '');
        await page.goto(path);
        await page.waitForLoadState('networkidle');
        await scan(page, `${group.as ?? 'signed out'} ${path}`, testInfo);
      });
    }
  });
}

test.describe('@a11y keyboard', () => {
  test.use({ storageState: PERSONAS.kestrelAdmin.file });

  test('Ctrl K opens the palette with focus in the field, Tab stays inside, Escape returns focus', async ({ page }) => {
    await page.goto('/partner/overview');
    const trigger = page.locator('button.search');
    await trigger.focus();
    await page.keyboard.press('Control+K');
    const dialog = page.getByRole('dialog', { name: 'Search' });
    await expect(dialog.getByRole('searchbox')).toBeFocused();
    for (let i = 0; i < 6; i += 1) {
      await page.keyboard.press('Tab');
      expect(await dialog.evaluate((el) => el.contains(document.activeElement))).toBe(true);
    }
    await scan(page, 'palette open', test.info());
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await expect(trigger).toBeFocused();
  });

  test('a drawer traps focus, closes on Escape and returns focus to what opened it', async ({ page }) => {
    await page.goto('/partner/team');
    const opener = page.getByRole('button', { name: /Invite/ }).first();
    await opener.focus();
    await page.keyboard.press('Enter');
    const drawer = page.getByRole('dialog').first();
    await expect(drawer).toBeVisible();
    for (let i = 0; i < 10; i += 1) {
      await page.keyboard.press('Tab');
      expect(await drawer.evaluate((el) => el.contains(document.activeElement))).toBe(true);
    }
    await scan(page, 'drawer open', test.info());
    await page.keyboard.press('Escape');
    await expect(drawer).toBeHidden();
    await expect(opener).toBeFocused();
  });

  test('every Tab stop on the deals page shows a focus indicator', async ({ page }) => {
    await page.goto('/partner/deals');
    const stops = new Set<string>();
    for (let i = 0; i < 40; i += 1) {
      await page.keyboard.press('Tab');
      // Compare the focused element's paint with the same element after it loses focus: if nothing changes,
      // a keyboard user cannot see where they are.
      const result = await page.evaluate(() => {
        const el = document.activeElement as HTMLElement | null;
        if (!el || el === document.body) return null;
        const signature = (): string => {
          const s = getComputedStyle(el);
          return [s.outlineStyle, s.outlineWidth, s.boxShadow, s.backgroundColor, s.borderTopColor, s.color, s.textDecorationLine].join('|');
        };
        const focused = signature();
        el.blur();
        const blurred = signature();
        el.focus();
        return { tag: el.tagName, text: (el.textContent ?? '').trim().slice(0, 30), changed: focused !== blurred };
      });
      if (result) {
        stops.add(`${result.tag} ${result.text}`);
        expect(result.changed, `no visible focus indicator on ${result.tag} "${result.text}"`).toBe(true);
      }
    }
    expect(stops.size).toBeGreaterThan(10);
  });
});
```

- [ ] **Step 11: Run the whole suite and sweep the selectors**

```bash
pnpm --filter @cleanstart/portal exec playwright test
```

Expected counts: desktop 45 tests (journey 8, documents 5, admin 4, security 6, axe 19, keyboard 3) and mobile 19 (axe only), 64 in total. The `security` headers tests and the `a11y` failures that M5.1 and M5.2 fix are allowed to fail at this point; every other failure is a selector or a real defect. For a selector failure, open the trace (`pnpm exec playwright show-report`), correct the label in `e2e/support/ui.ts` only, and rerun the file. For a real defect, fix it in the file that owns it if it is inside this plan's scope, otherwise append a `blocked` line naming the owner and the symptom. Do not weaken an assertion to make a test pass.

- [ ] **Step 12: Gate A and commit**

Run the standard Gate A block (its `typecheck` now includes `e2e/**` and `playwright.config.ts`), then `pnpm --filter @cleanstart/portal exec playwright test` once more, then Gate B, then:

```bash
git add apps/portal/playwright.config.ts apps/portal/e2e apps/portal/.gitignore apps/portal/package.json apps/portal/tsconfig.json pnpm-lock.yaml docs/superpowers/plans/2026-11-12-partner-portal-06-admin-infra-hardening.md
git commit -m "feat(portal): E2E Playwright portal suite with FakeHubspot, audit, search, security and axe specs"
```



### Task M5.1: Security pass

**Gate A for this task:** the standard block, plus `node apps/portal/scripts/audit-portal.mjs` exiting 0, plus the E2E `security` spec green.

**Files (under `apps/portal`):**
- Create: `src/server/security/csp.ts`, `src/server/security/limits.ts`, `src/server/security/auth-rate-limit.ts`, `scripts/audit-portal.mjs`, and `docs/partner-portal/SECURITY-PASS.md` (from the repo root)
- Modify: `next.config.ts` (full replacement), `src/proxy.ts`, `src/server/auth/auth.ts` (three small additions), `package.json` (`next`), possibly the public action files (one line each)
- Test: `src/server/security/{csp,headers,per-email-limit,auth-session,rate-limit-coverage}.test.ts`, `src/proxy.test.ts`

What the master plan asks for: headers and CSP, cookie flags, rate limits on sign in, one-time code and invite endpoints, session fixation and logout checks, a dependency audit, and the isolation matrix run. Each is a test or a command below; nothing is "reviewed by eye".

Decisions recorded:
- **The CSP lives in `src/proxy.ts`, not `next.config.ts`.** A nonce is per request and `next.config.ts` headers are static. `next.config.ts` carries every static header and a closed policy for API routes; `proxy.ts` adds the nonce policy to page responses (Next docs, "Content Security Policy", read from the installed Next on 13 November 2026).
- **`'unsafe-inline'` is not allowed for scripts.** The policy is `'self'`, a nonce and `'strict-dynamic'`; `'unsafe-eval'` only in development. Styles: a nonce for `<style>` elements plus `style-src-attr 'unsafe-inline'`, because the screens use inline `style="..."` attributes that no nonce can cover.
- **Rate limits are layered.** Better Auth's own limiter per client address (enabled explicitly, because the library enables it only in production), a per email limit in a `hooks.before` handler, and `rateLimit()` calls in every public server action.
- **`DATABASE_OWNER_URL` is inside the app container** (the migration runs on start, contracts C.5). A code execution bug in the app would therefore hold the owner credentials and could bypass row level security. Accepted for the pilot and recorded as CCR-5 (run migrations as a one-shot job and make the variable optional in production).

- [ ] **Step 1: Baseline the dependency audit**

`pnpm audit` covers the whole monorepo, so a small script keeps only the advisories whose path starts at `apps__portal` and fails on high or critical.

```js
// Dependency audit for the portal only. `pnpm audit` covers the whole monorepo; this keeps the advisories whose
// dependency path starts at apps__portal, prints them, and exits 1 when any is high or critical.
// Run from anywhere in the repo: pnpm --filter @cleanstart/portal audit:deps
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const BLOCKING = new Set(['high', 'critical']);
const ORDER = ['critical', 'high', 'moderate', 'low', 'info'];

// pnpm audit exits non-zero whenever it finds anything, so the exit code is not used; the JSON is.
const run = spawnSync('pnpm', ['audit', '--prod', '--json'], { cwd: repoRoot, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
let report;
try {
  report = JSON.parse(run.stdout);
} catch {
  console.error('pnpm audit did not return JSON (offline or registry error):');
  console.error(run.stderr || run.stdout);
  process.exit(2);
}

const rows = new Map();
for (const advisory of Object.values(report.advisories ?? {})) {
  for (const finding of advisory.findings ?? []) {
    for (const dependencyPath of finding.paths ?? []) {
      if (!dependencyPath.startsWith('apps__portal>')) continue;
      const key = `${advisory.github_advisory_id}|${advisory.module_name}@${finding.version}`;
      rows.set(key, {
        severity: advisory.severity,
        id: advisory.github_advisory_id,
        module: `${advisory.module_name}@${finding.version}`,
        vulnerable: advisory.vulnerable_versions,
        patched: advisory.patched_versions,
        via: dependencyPath.replace('apps__portal>', ''),
      });
    }
  }
}

const list = [...rows.values()].sort((a, b) => ORDER.indexOf(a.severity) - ORDER.indexOf(b.severity));
for (const row of list) {
  console.info(`${row.severity.padEnd(9)} ${row.id}  ${row.module}  vulnerable ${row.vulnerable}  fixed in ${row.patched}  via ${row.via}`);
}
const blocking = list.filter((row) => BLOCKING.has(row.severity));
console.info(`\n${list.length} advisories for apps/portal, ${blocking.length} high or critical.`);
process.exit(blocking.length > 0 ? 1 : 0);
```

Run: `node apps/portal/scripts/audit-portal.mjs; echo "exit=$?"`
Expected on 13 November 2026 (the numbers move as advisories are published): `21 advisories for apps/portal, 12 high or critical.`, every line about `next@16.2.5`, the highest fix `>=16.4.1`, `exit=1`.

- [ ] **Step 2: Upgrade Next.js for the portal**

```bash
pnpm --filter @cleanstart/portal add --save-exact next@16.4.6
node apps/portal/scripts/audit-portal.mjs; echo "exit=$?"
```

Expected: `0 high or critical`, `exit=0`. Anything still listed is triaged in `SECURITY-PASS.md` (fix, or accept with a reason and an expiry). The pin in `CLAUDE.md` ("Next.js 16.2.5") is for `apps/cms` and `apps/web`; the portal deviates on purpose. `apps/cms` and `apps/web` carry the same advisories: put one line in the report for their owner. Then re-run the three quick gates (`lint`, `typecheck`, `test`) and a build, because a framework bump can change behaviour. **Verify (known unknown U1):** read `apps/portal/node_modules/next/dist/docs/01-app/02-guides/content-security-policy.md` again; if nonce handling or the `proxy.ts` API changed since 16.2.5, adapt Step 4 and record it.

- [ ] **Step 3: Write the failing policy tests**

`csp.test.ts` pins the policy directive by directive (nonce and `strict-dynamic`, no `unsafe-inline` or `unsafe-eval` for scripts in production, inline style attributes only, frame, object, base and form restrictions, Turnstile and the document bucket in `connect-src`, upgrade in production only, development additions). `headers.test.ts` loads `next.config.ts` fresh for each environment and pins the static headers, HSTS in production only, the closed API policy and the standalone switch.

```ts
import { describe, expect, it } from 'vitest';
import { buildCsp, createNonce, originsFromEnv } from './csp';

const directive = (csp: string, name: string): string[] =>
  (csp.split('; ').find((d) => d.startsWith(`${name} `)) ?? '').split(' ').slice(1);

describe('buildCsp', () => {
  const prod = buildCsp({ nonce: 'abc123', isDev: false, connectOrigins: ['https://acct.r2.cloudflarestorage.com'] });

  it('allows scripts only by nonce and strict-dynamic, and never unsafe-inline or unsafe-eval in production', () => {
    const scripts = directive(prod, 'script-src');
    expect(scripts).toContain("'nonce-abc123'");
    expect(scripts).toContain("'strict-dynamic'");
    expect(scripts).not.toContain("'unsafe-inline'");
    expect(scripts).not.toContain("'unsafe-eval'");
  });

  it('allows inline style attributes but not inline style elements', () => {
    expect(directive(prod, 'style-src')).toEqual(["'self'", "'nonce-abc123'"]);
    expect(directive(prod, 'style-src-attr')).toEqual(["'unsafe-inline'"]);
  });

  it('blocks framing, plugins and base tag tricks, and keeps forms on our own origin', () => {
    expect(directive(prod, 'frame-ancestors')).toEqual(["'none'"]);
    expect(directive(prod, 'object-src')).toEqual(["'none'"]);
    expect(directive(prod, 'base-uri')).toEqual(["'self'"]);
    expect(directive(prod, 'form-action')).toEqual(["'self'"]);
    expect(directive(prod, 'default-src')).toEqual(["'self'"]);
  });

  it('lists Turnstile for scripts, frames and connections, and the document bucket for connections', () => {
    expect(directive(prod, 'script-src')).toContain('https://challenges.cloudflare.com');
    expect(directive(prod, 'frame-src')).toEqual(['https://challenges.cloudflare.com']);
    expect(directive(prod, 'connect-src')).toEqual(["'self'", 'https://challenges.cloudflare.com', 'https://acct.r2.cloudflarestorage.com']);
  });

  it('upgrades insecure requests in production only', () => {
    expect(prod).toContain('upgrade-insecure-requests');
    expect(buildCsp({ nonce: 'n', isDev: true, connectOrigins: [] })).not.toContain('upgrade-insecure-requests');
  });

  it('adds unsafe-eval and the dev socket in development only', () => {
    const dev = buildCsp({ nonce: 'n', isDev: true, connectOrigins: [] });
    expect(directive(dev, 'script-src')).toContain("'unsafe-eval'");
    expect(directive(dev, 'connect-src')).toContain('ws://localhost:*');
    expect(directive(prod, 'connect-src')).not.toContain('ws://localhost:*');
  });
});

describe('originsFromEnv', () => {
  it('keeps the origin of the R2 endpoint and of the Sentry DSN, and drops anything unset or malformed', () => {
    expect(
      originsFromEnv({ R2_ENDPOINT: 'https://acct.r2.cloudflarestorage.com/bucket', SENTRY_DSN: 'https://key@o1.ingest.sentry.io/42' }),
    ).toEqual(['https://acct.r2.cloudflarestorage.com', 'https://o1.ingest.sentry.io']);
    expect(originsFromEnv({ R2_ENDPOINT: 'not a url' })).toEqual([]);
    expect(originsFromEnv({})).toEqual([]);
  });
});

describe('createNonce', () => {
  it('is unpredictable and different every time', () => {
    const nonces = new Set(Array.from({ length: 50 }, () => createNonce()));
    expect(nonces.size).toBe(50);
    expect([...nonces][0]).toMatch(/^[A-Za-z0-9+/]{22}==$/);
  });
});
```

```ts
import { afterEach, describe, expect, it, vi } from 'vitest';

type HeaderRule = { source: string; headers: Array<{ key: string; value: string }> };

/** Loads next.config.ts fresh, because it reads NODE_ENV and NEXT_OUTPUT when it is evaluated. */
const loadConfig = async (env: Record<string, string>) => {
  vi.resetModules();
  for (const [key, value] of Object.entries(env)) vi.stubEnv(key, value);
  return (await import('../../../next.config')).default;
};

const headersOf = async (env: Record<string, string>): Promise<Map<string, string>> => {
  const config = await loadConfig(env);
  const rules = (await config.headers?.()) as HeaderRule[];
  const all = rules.find((r) => r.source === '/:path*');
  return new Map((all?.headers ?? []).map((h) => [h.key, h.value]));
};

afterEach(() => vi.unstubAllEnvs());

describe('next.config security headers', () => {
  it('sends the static protections on every path', async () => {
    const headers = await headersOf({ NODE_ENV: 'production' });
    expect(headers.get('X-Content-Type-Options')).toBe('nosniff');
    expect(headers.get('X-Frame-Options')).toBe('DENY');
    expect(headers.get('Referrer-Policy')).toBe('strict-origin-when-cross-origin');
    expect(headers.get('Permissions-Policy')).toContain('camera=()');
    expect(headers.get('Cross-Origin-Opener-Policy')).toBe('same-origin');
    expect(headers.get('X-Robots-Tag')).toBe('noindex, nofollow');
  });

  it('adds HSTS in production only', async () => {
    expect((await headersOf({ NODE_ENV: 'production' })).get('Strict-Transport-Security')).toBe('max-age=31536000; includeSubDomains');
    expect((await headersOf({ NODE_ENV: 'development' })).has('Strict-Transport-Security')).toBe(false);
  });

  it('gives the API routes a closed policy', async () => {
    const config = await loadConfig({ NODE_ENV: 'production' });
    const rules = (await config.headers?.()) as HeaderRule[];
    const api = rules.find((r) => r.source === '/api/:path*');
    expect(api?.headers).toEqual([{ key: 'Content-Security-Policy', value: "default-src 'none'; frame-ancestors 'none'" }]);
  });

  it('turns on standalone output only when asked, and always hides the framework header', async () => {
    expect((await loadConfig({ NEXT_OUTPUT: 'standalone' })).output).toBe('standalone');
    const plain = await loadConfig({ NEXT_OUTPUT: '' });
    expect(plain.output).toBeUndefined();
    expect(plain.poweredByHeader).toBe(false);
  });
});
```

Run: `pnpm --filter @cleanstart/portal exec vitest run src/server/security/csp.test.ts src/server/security/headers.test.ts`
Expected: FAIL (`./csp` cannot be resolved; the headers test fails on the missing headers).

- [ ] **Step 4: Implement the policy and the static headers**

```ts
/**
 * Content Security Policy for the portal. Pure, so the same function is used by src/proxy.ts and by its tests.
 *
 * script-src: a per request nonce plus 'strict-dynamic', so only the scripts Next renders (and scripts those load)
 * run. Cloudflare Turnstile is listed for browsers without 'strict-dynamic'. 'unsafe-eval' is development only
 * (React uses eval for debugging information there; Next documents this).
 *
 * style-src: the nonce covers the <style> tags Next renders. The screens use inline style="..." attributes, which a
 * nonce cannot cover, so style-src-attr allows attributes only: an injected <style> element is still blocked.
 *
 * connect-src: our own origin, Turnstile, and the origins the browser talks to directly: the document bucket
 * (presigned uploads) and Sentry. Pass them in `connectOrigins`; use originsFromEnv for the real values.
 */
export interface CspInput {
  nonce: string;
  isDev: boolean;
  /** Absolute origins such as "https://abc.r2.cloudflarestorage.com". */
  connectOrigins: readonly string[];
}

const TURNSTILE = 'https://challenges.cloudflare.com';

export function buildCsp({ nonce, isDev, connectOrigins }: CspInput): string {
  const directives: Record<string, readonly string[]> = {
    'default-src': ["'self'"],
    'script-src': ["'self'", `'nonce-${nonce}'`, "'strict-dynamic'", TURNSTILE, ...(isDev ? ["'unsafe-eval'"] : [])],
    'style-src': ["'self'", `'nonce-${nonce}'`],
    'style-src-attr': ["'unsafe-inline'"],
    'img-src': ["'self'", 'data:', 'blob:'],
    'font-src': ["'self'"],
    'connect-src': ["'self'", TURNSTILE, ...connectOrigins, ...(isDev ? ['ws://localhost:*'] : [])],
    'frame-src': [TURNSTILE],
    'object-src': ["'none'"],
    'base-uri': ["'self'"],
    'form-action': ["'self'"],
    'frame-ancestors': ["'none'"],
  };
  const parts = Object.entries(directives).map(([name, values]) => `${name} ${values.join(' ')}`);
  if (!isDev) parts.push('upgrade-insecure-requests');
  return parts.join('; ');
}

/** The origin of a URL, or null when it is unset or not a URL. */
const originOf = (value: string | undefined): string | null => {
  if (!value) return null;
  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
};

/** Origins the browser must reach: the R2 endpoint (browser PUT of uploads) and the Sentry ingest host. */
export function originsFromEnv(source: Record<string, string | undefined>): string[] {
  return [originOf(source.R2_ENDPOINT), originOf(source.SENTRY_DSN)].filter((o): o is string => o !== null);
}

/** 16 random bytes, base64. A new one per request. */
export function createNonce(): string {
  return Buffer.from(crypto.getRandomValues(new Uint8Array(16))).toString('base64');
}
```

Replace `next.config.ts` (this supersedes the minimal CCR-1 change from M0.6; it keeps `distDir` and `turbopack.root`, which the mock already had):

```ts
import path from 'node:path';
import type { NextConfig } from 'next';

const repoRoot = path.resolve(process.cwd(), '..', '..');
const isProduction = process.env.NODE_ENV === 'production';

/**
 * Static security headers, sent on every response. The Content-Security-Policy that carries a nonce is per request
 * and is set in src/proxy.ts; the API routes get a closed policy here because they never serve a document.
 */
const SECURITY_HEADERS = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), serial=(), bluetooth=()' },
  { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
  { key: 'Cross-Origin-Resource-Policy', value: 'same-origin' },
  { key: 'X-Robots-Tag', value: 'noindex, nofollow' },
  ...(isProduction ? [{ key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' }] : []),
];

const nextConfig: NextConfig = {
  // lets a production build run beside a live dev server without sharing .next
  distDir: process.env.NEXT_DIST_DIR ?? '.next',
  // The Docker image runs the standalone server (apps/portal/Dockerfile sets NEXT_OUTPUT=standalone).
  ...(process.env.NEXT_OUTPUT === 'standalone' ? { output: 'standalone' as const } : {}),
  // Standalone tracing must see the pnpm workspace, so the server lands at apps/portal/server.js in the output.
  outputFileTracingRoot: repoRoot,
  turbopack: { root: repoRoot },
  poweredByHeader: false,
  async headers() {
    return [
      { source: '/:path*', headers: SECURITY_HEADERS },
      { source: '/api/:path*', headers: [{ key: 'Content-Security-Policy', value: "default-src 'none'; frame-ancestors 'none'" }] },
    ];
  },
};

export default nextConfig;
```

Run the two test files. Expected: PASS, 12 tests.

- [ ] **Step 5: Wire the policy into `proxy.ts`**

First read the file the Wave 0 session left: `grep -n "export\|matcher\|OPEN\|health" apps/portal/src/proxy.ts`. W0-f added a session redirect beside the review gate; the edit below keeps all of that exactly as it is by renaming the existing function and wrapping it, so it works whatever the redirect looks like. Three edits:

1. Add the import and the open path list at the top of the file:

```ts
import { buildCsp, createNonce, originsFromEnv } from '@/server/security/csp';

/** Paths that answer without the review password: the container health check and the signed HubSpot webhook. */
const OPEN_PATHS: readonly string[] = ['/api/health', '/api/hubspot/webhook'];
```

2. Rename the existing function `export function proxy(request: NextRequest): NextResponse {` to `function gate(request: NextRequest): NextResponse {` (if W0-f made it `async`, keep `async` and the `Promise<NextResponse>` return type), and delete the early return for `/api/health` that M1.1e added inside it (the wrapper handles it now).
3. Add the wrapper between `gate` and `export const config`:

```ts
/**
 * Review gate first, then the Content-Security-Policy with a fresh nonce. Next reads the nonce from the request's
 * CSP header while it renders, so the header goes on the request as well as the response (Next docs, "Content
 * Security Policy"). API routes return JSON, so they get no per request policy; next.config.ts closes them.
 */
export async function proxy(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl;
  if (OPEN_PATHS.includes(pathname)) return NextResponse.next();

  const gated = await gate(request);
  // Anything but a pass-through (the gate's 401, a redirect to sign in) is returned as it is.
  if (gated.status !== 200 || pathname.startsWith('/api/')) return gated;

  const nonce = createNonce();
  const csp = buildCsp({
    nonce,
    isDev: process.env.NODE_ENV === 'development',
    connectOrigins: originsFromEnv(process.env),
  });
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-nonce', nonce);
  requestHeaders.set('Content-Security-Policy', csp);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  for (const [key, value] of gated.headers) {
    if (!key.startsWith('x-middleware-') && key !== 'set-cookie') response.headers.set(key, value);
  }
  for (const cookie of gated.headers.getSetCookie()) response.headers.append('set-cookie', cookie);
  response.headers.set('Content-Security-Policy', csp);
  return response;
}
```

The matcher stays as it is (it already excludes static assets). Now the test, which runs with real `NextRequest` objects: a fresh nonce per request in the response policy and in the request header Next reads, no policy on API routes, the review gate (401 everywhere except `/api/health` and the webhook), and a request with the right password getting the policy.

```ts
import { NextRequest } from 'next/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { proxy } from './proxy';

const get = (path: string, headers: Record<string, string> = {}): NextRequest =>
  new NextRequest(`http://localhost:3004${path}`, { headers });

const nonceOf = (csp: string | null): string => /'nonce-([^']+)'/.exec(csp ?? '')?.[1] ?? '';

afterEach(() => vi.unstubAllEnvs());

describe('proxy security headers', () => {
  it('gives each page request its own nonce, in the response policy and in the request header Next reads', async () => {
    const a = await proxy(get('/sign-in'));
    const b = await proxy(get('/sign-in'));
    const csp = a.headers.get('Content-Security-Policy');
    expect(csp).toContain("script-src 'self' 'nonce-");
    expect(nonceOf(csp)).not.toBe('');
    expect(nonceOf(csp)).not.toBe(nonceOf(b.headers.get('Content-Security-Policy')));
    expect(a.headers.get('x-middleware-override-headers')).toContain('content-security-policy');
    expect(a.headers.get('x-middleware-request-x-nonce')).toBe(nonceOf(csp));
    expect(a.headers.get('x-middleware-request-content-security-policy')).toBe(csp);
  });

  it('leaves API routes without a per request policy', async () => {
    expect((await proxy(get('/api/auth/get-session'))).headers.get('Content-Security-Policy')).toBeNull();
  });
});

describe('proxy review gate', () => {
  it('asks for the review password everywhere except the health check and the webhook', async () => {
    vi.stubEnv('PORTAL_REVIEW_PASSWORD', 'letmein');
    expect((await proxy(get('/sign-in'))).status).toBe(401);
    expect((await proxy(get('/api/files/abc'))).status).toBe(401);
    expect((await proxy(get('/api/health'))).status).toBe(200);
    expect((await proxy(get('/api/hubspot/webhook'))).status).toBe(200);
  });

  it('lets a request with the right password through and still sets the policy', async () => {
    vi.stubEnv('PORTAL_REVIEW_PASSWORD', 'letmein');
    const ok = await proxy(get('/sign-in', { authorization: `Basic ${btoa('anyone:letmein')}` }));
    expect(ok.status).toBe(200);
    expect(ok.headers.get('Content-Security-Policy')).toContain("object-src 'none'");
    const bad = await proxy(get('/sign-in', { authorization: `Basic ${btoa('anyone:nope')}` }));
    expect(bad.status).toBe(401);
  });
});
```

Run: `pnpm --filter @cleanstart/portal exec vitest run src/proxy.test.ts`
Expected: PASS, 4 tests. (If W0-f's gate redirects signed out visitors, add one case for it: a redirect response comes back unchanged and carries no policy.)

- [ ] **Step 6: Write the failing session, cookie and rate limit tests**

`auth-session.test.ts` drives the real Better Auth handler (`auth.handler(new Request(...))`) against the test database: the session cookie is `HttpOnly`, `SameSite=Lax`, site wide and expiring; `useSecureCookies` is set explicitly; a session cookie planted before sign in is ignored and a new one is issued; every sign in gets its own session; sign out ends the session on the server (the cookie no longer returns a user and the `auth_session` row is gone); a wrong password, an unknown address, a disabled user and a suspended partner's user all get the same status and body (no account discovery); the library limiter is on; repeated sign ins from one address, repeated sign ins on one account from many addresses, and repeated second step guesses all end in 429. `per-email-limit.test.ts` tests the per email function on its own.

```ts
import { eq } from 'drizzle-orm';
import { beforeEach, describe, expect, it } from 'vitest';
import { authSessions } from '@/db/schema';
import { makePartner, makeUser, resetDb, testDb } from '@/db/test-helpers';
import { auth } from '@/server/auth/auth';

/**
 * Sessions through the real Better Auth handler: cookie flags, session fixation, logout, no account discovery, and
 * the rate limits. Needs APP_URL to be the origin the handler trusts (src/db/test-setup.ts sets it).
 */
const db = testDb();
const ORIGIN = process.env.APP_URL ?? 'http://localhost:3004';
const PASSWORD = 'Sess1on-Test!9';

interface CallInit {
  method?: string;
  body?: unknown;
  cookie?: string;
  ip?: string;
}

const call = (path: string, init: CallInit = {}): Promise<Response> =>
  auth.handler(
    new Request(`${ORIGIN}/api/auth${path}`, {
      method: init.method ?? 'GET',
      headers: {
        origin: ORIGIN,
        'content-type': 'application/json',
        'x-forwarded-for': init.ip ?? '203.0.113.10',
        ...(init.cookie ? { cookie: init.cookie } : {}),
      },
      ...(init.body === undefined ? {} : { body: JSON.stringify(init.body) }),
    }),
  );

const signIn = (email: string, password: string, ip?: string): Promise<Response> =>
  call('/sign-in/email', { method: 'POST', body: { email, password }, ...(ip ? { ip } : {}) });

const sessionSetCookie = (response: Response): string | null =>
  response.headers.getSetCookie().find((c) => /session_token=/.test(c)) ?? null;

/** "name=value" of a Set-Cookie header, as a browser would send it back. */
const pair = (setCookie: string): string => setCookie.split(';')[0] ?? '';

const newUser = async (email: string, overrides: { status?: 'active' | 'disabled'; partnerStatus?: 'active' | 'suspended' } = {}) => {
  const partner = await makePartner(db, { status: overrides.partnerStatus ?? 'active' });
  return makeUser(db, { partnerId: partner.id, role: 'partner_admin', email, status: overrides.status ?? 'active', password: PASSWORD });
};

beforeEach(() => resetDb(db));

describe('session cookie', () => {
  it('is HttpOnly, SameSite=Lax, site wide and expires', async () => {
    await newUser('flags@session.test');
    const response = await signIn('flags@session.test', PASSWORD);
    expect(response.status).toBe(200);
    const cookie = sessionSetCookie(response) ?? '';
    expect(cookie).toMatch(/HttpOnly/i);
    expect(cookie).toMatch(/SameSite=Lax/i);
    expect(cookie).toMatch(/Path=\//i);
    expect(cookie).toMatch(/Max-Age=\d+/i);
  });

  it('is configured explicitly for Secure in production', () => {
    expect(typeof auth.options.advanced?.useSecureCookies).toBe('boolean');
  });
});

describe('session fixation and logout', () => {
  it('ignores a session cookie planted before sign in and issues a new one', async () => {
    await newUser('fixation@session.test');
    const planted = 'better-auth.session_token=attacker-chosen-value.signature';
    const response = await call('/sign-in/email', { method: 'POST', body: { email: 'fixation@session.test', password: PASSWORD }, cookie: planted });
    const issued = pair(sessionSetCookie(response) ?? '');
    expect(issued).not.toBe('');
    expect(issued).not.toContain('attacker-chosen-value');
    const stillPlanted = await call('/get-session', { cookie: planted });
    expect(await stillPlanted.json()).toBeNull();
  });

  it('gives every sign in its own session', async () => {
    const user = await newUser('twice@session.test');
    const a = pair(sessionSetCookie(await signIn('twice@session.test', PASSWORD)) ?? '');
    const b = pair(sessionSetCookie(await signIn('twice@session.test', PASSWORD)) ?? '');
    expect(a).not.toBe(b);
    expect(await db.select().from(authSessions).where(eq(authSessions.userId, user.id))).toHaveLength(2);
  });

  it('ends the session on the server at sign out, not only in the browser', async () => {
    const user = await newUser('logout@session.test');
    const cookie = pair(sessionSetCookie(await signIn('logout@session.test', PASSWORD)) ?? '');
    expect((await (await call('/get-session', { cookie })).json())?.user?.email).toBe('logout@session.test');
    expect((await call('/sign-out', { method: 'POST', body: {}, cookie })).status).toBe(200);
    expect(await (await call('/get-session', { cookie })).json()).toBeNull();
    expect(await db.select().from(authSessions).where(eq(authSessions.userId, user.id))).toHaveLength(0);
  });
});

describe('no account discovery', () => {
  const failure = async (response: Response): Promise<{ status: number; body: unknown }> => ({
    status: response.status,
    body: await response.json(),
  });

  it('answers a wrong password, an unknown address, a disabled user and a suspended partner the same way', async () => {
    await newUser('active@session.test');
    await newUser('disabled@session.test', { status: 'disabled' });
    await newUser('suspended@session.test', { partnerStatus: 'suspended' });
    const wrong = await failure(await signIn('active@session.test', 'Wrong-Passw0rd!', '198.51.100.1'));
    expect(wrong.status).toBe(401);
    for (const email of ['nobody@session.test', 'disabled@session.test', 'suspended@session.test']) {
      expect(await failure(await signIn(email, PASSWORD, '198.51.100.2'))).toEqual(wrong);
    }
  });
});

describe('rate limits', () => {
  it('turns the library limiter on in every environment', () => {
    expect(auth.options.rateLimit?.enabled).toBe(true);
  });

  it('stops repeated sign in attempts from one address', async () => {
    const statuses: number[] = [];
    for (let i = 0; i < 12; i += 1) statuses.push((await signIn('flood-ip@session.test', 'Wrong-Passw0rd!', '198.51.100.50')).status);
    expect(statuses).toContain(429);
  });

  it('stops repeated attempts on one account from many addresses', async () => {
    const statuses: number[] = [];
    for (let i = 0; i < 12; i += 1) statuses.push((await signIn('flood-email@session.test', 'Wrong-Passw0rd!', `198.51.100.${100 + i}`)).status);
    expect(statuses).toContain(429);
  });

  it('stops repeated second step code guesses from one address', async () => {
    const statuses: number[] = [];
    for (let i = 0; i < 8; i += 1) {
      statuses.push((await call('/two-factor/verify-totp', { method: 'POST', body: { code: '000000' }, ip: '198.51.100.77' })).status);
    }
    expect(statuses).toContain(429);
  });
});
```

```ts
import { describe, expect, it } from 'vitest';
import { enforcePerEmailLimit } from './auth-rate-limit';

describe('enforcePerEmailLimit', () => {
  it('lets 10 sign in attempts per address in and stops the 11th, ignoring case and spaces', () => {
    for (let i = 0; i < 10; i += 1) expect(() => enforcePerEmailLimit('/sign-in/email', { email: ' Target@Example.com ' })).not.toThrow();
    expect(() => enforcePerEmailLimit('/sign-in/email', { email: 'target@example.com' })).toThrow(/Too many attempts/);
  });

  it('counts each address separately and ignores paths and bodies it has no rule for', () => {
    for (let i = 0; i < 12; i += 1) expect(() => enforcePerEmailLimit('/get-session', { email: 'x@example.com' })).not.toThrow();
    expect(() => enforcePerEmailLimit('/sign-in/email', { email: 'other@example.com' })).not.toThrow();
    expect(() => enforcePerEmailLimit('/sign-in/email', {})).not.toThrow();
    expect(() => enforcePerEmailLimit('/sign-in/email', null)).not.toThrow();
  });
});
```

Run: `pnpm --filter @cleanstart/portal exec vitest run src/server/security/auth-session.test.ts src/server/security/per-email-limit.test.ts`
Expected: `per-email-limit` fails to resolve `./auth-rate-limit`; in `auth-session` the tests that exercise the new wiring fail (`turns the library limiter on`, the two flood tests, the `useSecureCookies` check) while the cookie flag, fixation, logout and no-account-discovery tests pass if W0-f built them right. Every failure here is a real gap: do not edit a test to pass.

**Verify (known unknown U5):** the tests assume the sign in endpoint is `POST /api/auth/sign-in/email`, the session cookie name contains `session_token`, and the handler trusts `APP_URL` as origin (set by `src/db/test-setup.ts`). If the handler rejects the request with an origin error, look at `trustedOrigins` in `src/server/auth/auth.ts`; if it needs the `nextCookies` plugin's request context, the plugin skips safely outside Next (checked in the library source), so the failure is something else, read the response body printed by the assertion.

- [ ] **Step 7: Implement the limits and wire them into `auth.ts`**

`limits.ts` holds the Better Auth limiter options (explicitly enabled; sign in 10 per minute per address, second step 5, password reset 5 per 10 minutes) and the per email rules. `auth-rate-limit.ts` holds the per email check and a ready made hook.

```ts
import type { BetterAuthOptions } from 'better-auth';

/**
 * Better Auth's built in limiter, per client address (in memory, one container). Enabled explicitly because the
 * library only turns it on in production, which would leave tests and development unprotected and unverified.
 * Rules are keyed by path below /api/auth and override the library defaults for the same path.
 * shortcut: counters live in memory and reset on restart; fine for one container (contracts decision 14).
 */
export const authRateLimit = {
  enabled: true,
  window: 60,
  max: 100,
  customRules: {
    '/sign-in/email': { window: 60, max: 10 },
    '/two-factor/verify-totp': { window: 60, max: 5 },
    '/two-factor/verify-backup-code': { window: 60, max: 5 },
    '/request-password-reset': { window: 600, max: 5 },
    '/forget-password': { window: 600, max: 5 },
    '/reset-password': { window: 600, max: 10 },
  },
} satisfies NonNullable<BetterAuthOptions['rateLimit']>;

/**
 * Limits keyed by the email in the request body, on top of the per address limit above, so one account cannot be
 * guessed at from many addresses. Values are attempts per window.
 */
export const PER_EMAIL_RULES: Readonly<Record<string, { limit: number; windowSeconds: number }>> = {
  '/sign-in/email': { limit: 10, windowSeconds: 600 },
  '/request-password-reset': { limit: 5, windowSeconds: 3600 },
  '/forget-password': { limit: 5, windowSeconds: 3600 },
};
```

```ts
import { APIError, createAuthMiddleware } from 'better-auth/api';
import { RateLimitError } from '@/server/errors';
import { rateLimit } from '@/server/rate-limit';
import { PER_EMAIL_RULES } from './limits';

/**
 * Limits sign in and password reset requests per email address, on top of the per address limit (authRateLimit),
 * which cannot stop one account being guessed at from many addresses. The answer is the same 429 whether or not
 * the account exists. Call it from a Better Auth `hooks.before` handler.
 */
export function enforcePerEmailLimit(path: string, body: unknown): void {
  const rule = PER_EMAIL_RULES[path];
  if (!rule) return;
  const email = typeof (body as { email?: unknown } | null | undefined)?.email === 'string'
    ? (body as { email: string }).email.trim().toLowerCase()
    : '';
  if (!email) return;
  try {
    rateLimit(`auth:${path}:email:${email}`, rule);
  } catch (error) {
    if (error instanceof RateLimitError) throw new APIError('TOO_MANY_REQUESTS', { message: error.safeMessage });
    throw error;
  }
}

/** The ready made hook, for an auth instance that has no `hooks.before` of its own. */
export const perEmailRateLimit = createAuthMiddleware(async (ctx) => {
  enforcePerEmailLimit(ctx.path, ctx.body);
});
```

Open `apps/portal/src/server/auth/auth.ts` (W0-e and W0-f wrote it) and make exactly three additions inside the `betterAuth({ ... })` options object. Find the object with `grep -n "betterAuth(" apps/portal/src/server/auth/auth.ts`.

1. `rateLimit: authRateLimit,` with `import { authRateLimit } from '@/server/security/limits';`.
2. Cookie flags: an `advanced` object containing `useSecureCookies: env.NODE_ENV === 'production',` (merge into the `advanced` object if it exists; keep `ipAddress` settings, which must still read `x-forwarded-for`: Caddy overwrites it from `CF-Connecting-IP`).
3. The per email limit: `hooks: { before: perEmailRateLimit },` with `import { perEmailRateLimit } from '@/server/security/auth-rate-limit';`. If the options already have `hooks.before`, do not replace it: call the function inside the existing handler as its first line, `enforcePerEmailLimit(ctx.path, ctx.body);`, importing `enforcePerEmailLimit` instead.

Run both test files again. Expected: PASS, 10 tests in `auth-session` and 2 in `per-email-limit`. **Verify (known unknown U5):** `customRules` keys must match the library's paths; the flood test proves it for sign in and the second step. If `/two-factor/verify-totp` is not the path (the TOTP plugin in the installed version names it differently), print the real path from the library's rate limit rules in `node_modules/better-auth/dist/plugins/two-factor` and change the two keys in `limits.ts`.

- [ ] **Step 8: Prove every public server action is rate limited**

Apply, request access, invite preview and accept, and password reset have no session, so a script can hit them. The test reads the action files and fails for any function that calls `runPublicAction(` without calling `rateLimit(`. It also pins the set of public actions to the six the contracts name, so a seventh needs a deliberate edit here.

```ts
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Every server action that runs without a session (runPublicAction) must call rateLimit() before it does work:
 * apply, request access, invite preview and accept. A new public action that forgets it fails here. Password reset is not a server
 * action: Better Auth serves it with its own per IP and per email limits (plan 02, M1.1c; the rules are tightened in M5.1).
 */
const ACTIONS_DIR = join(process.cwd(), 'src/server/actions');

const publicActions = (): Array<{ file: string; name: string; body: string }> =>
  readdirSync(ACTIONS_DIR)
    .filter((f) => f.endsWith('.ts') && !f.endsWith('.test.ts'))
    .flatMap((file) =>
      readFileSync(join(ACTIONS_DIR, file), 'utf8')
        .split(/^export async function /m)
        .slice(1)
        .map((chunk) => ({ file, name: /^(\w+)/.exec(chunk)?.[1] ?? '', body: chunk }))
        .filter((fn) => fn.body.includes('runPublicAction(')),
    );

describe('public server actions are rate limited', () => {
  const actions = publicActions();

  it('finds the public actions the contracts name', () => {
    expect(actions.map((a) => a.name).sort()).toEqual(
      [
        'acceptInviteAction',
        'previewInviteAction',
        'requestAccessAction',
        'submitApplicationAction',
      ].sort(),
    );
  });

  it.each(actions.map((a) => [a.name, a] as const))('%s calls rateLimit()', (_name, action) => {
    expect(action.body, `${action.file}: ${action.name} must call rateLimit(...)`).toContain('rateLimit(');
  });
});
```

Run: `pnpm --filter @cleanstart/portal exec vitest run src/server/security/rate-limit-coverage.test.ts`
Expected: PASS, 5 tests (the list test and one per action). For a failing action add, as the first statement of its handler:

```ts
rateLimit(`<action-name>:ip:${ctx.ip ?? 'unknown'}`, { limit: 10, windowSeconds: 60 });
```

with `import { rateLimit } from '@/server/rate-limit';`. Use the action's name as the key prefix (`invite-preview`, `invite-accept`, `access-request`, `apply`); `invite-preview` and `invite-accept` limit token guessing, so keep them at 10 per minute. A `RateLimitError` becomes an `ActionResult` failure with code `rate_limited` through `runPublicAction`, and the screens already show `error.message`.

- [ ] **Step 9: Run the isolation matrix and the repository checks**

```bash
pnpm --filter @cleanstart/portal exec vitest run src/server/repo/isolation.test.ts src/server/repo/imports.test.ts src/db/schema.test.ts
git ls-files apps/portal | grep -E '(^|/)\.env' | grep -v '\.env\.example$'; echo "tracked env files exit=$?"
git grep -nE "(AKIA[0-9A-Z]{16}|xox[bp]-[0-9A-Za-z-]+|-----BEGIN (RSA|EC|OPENSSH|PRIVATE) KEY|sk_live_|hubspot.*pat-[a-z0-9-]{20,})" -- apps/portal; echo "secret scan exit=$?"
```

Expected: the three suites pass (the matrix covers every repo export, the import test proves only `context.ts` imports `appDb`, `schema.test.ts` proves `portal_app` is not the owner and cannot touch `audit_log`); both greps print nothing and `exit=1`. The master plan says "run against the staging database": there is none (CLAUDE.md deploy rules), so the matrix runs against the freshly migrated local test database, which is built by the same `migrate.ts` and `rls.sql` as production. Record that sentence in the report.

- [ ] **Step 10: Run the browser security spec**

```bash
pnpm --filter @cleanstart/portal exec playwright test e2e/security.spec.ts --project=desktop
```

Expected: `6 passed`. A CSP failure names the directive and the blocked URL (`script-src blocked inline`, `connect-src blocked https://...`): fix the policy in `csp.ts` (and its test) or, if the blocked thing is wrong, the code that loads it. Never add `'unsafe-inline'` to scripts. If Turnstile is blocked, check the widget loads from `https://challenges.cloudflare.com` and that `frame-src` and `connect-src` list it (they do).

- [ ] **Step 11: Write the report**

Create `docs/partner-portal/SECURITY-PASS.md` and fill every row with the real output (a pasted line, not a summary):

````markdown
# Partner portal security pass (M5.1)

Date, commit, who ran it.

| Check | Command or test | Result |
|---|---|---|
| Dependency audit before | `node apps/portal/scripts/audit-portal.mjs` | paste the last line |
| Dependency audit after the Next bump | same | paste the last line |
| Security headers | `vitest run src/server/security/headers.test.ts src/proxy.test.ts` | pass count |
| CSP unit tests | `vitest run src/server/security/csp.test.ts` | pass count |
| CSP in a browser | `playwright test e2e/security.spec.ts --project=desktop` | pass count |
| Cookie flags | `auth-session.test.ts` "session cookie" | pass count |
| Session fixation and logout | `auth-session.test.ts` "session fixation and logout" | pass count |
| No account discovery | `auth-session.test.ts` "no account discovery" | pass count |
| Rate limits: sign in, second step, per email | `auth-session.test.ts` "rate limits", `per-email-limit.test.ts` | pass count |
| Rate limits: public actions | `rate-limit-coverage.test.ts` | pass count |
| Isolation matrix | `vitest run src/server/repo/isolation.test.ts` | pass count and the sentence from Step 9 |
| Tracked env files, secret scan | the two greps in Step 9 | exit codes |

## Decisions and accepted risks

- CSP in `proxy.ts` with a nonce, `style-src-attr 'unsafe-inline'` for the screens' inline styles (reason in the plan).
- Next.js is 16.4.6 in the portal (advisories fixed); `apps/cms` and `apps/web` are still on 16.2.5 and carry the same advisories (reported to their owner on the date above).
- `DATABASE_OWNER_URL` is present in the app container because migrations run on start. Follow up: run migrations as a one-shot job (CCR-5).
- Rate limits are in memory and reset on restart (one container).
- The Caddy block trusts `CF-Connecting-IP`; the droplet firewall must accept 443 from Cloudflare only (handover item 7). Not verifiable from the repo.
- The review password gate stays on until launch.

## Open items

List anything a check could not cover, with the owner.
````

- [ ] **Step 12: Gate A and commit**

Run the standard Gate A block, then the audit script (`exit=0`), then Gate B, then:

```bash
git add apps/portal/src/server/security apps/portal/src/proxy.ts apps/portal/src/proxy.test.ts apps/portal/next.config.ts apps/portal/scripts/audit-portal.mjs apps/portal/src/server/auth/auth.ts apps/portal/package.json pnpm-lock.yaml docs/partner-portal/SECURITY-PASS.md docs/superpowers/plans/2026-11-12-partner-portal-06-admin-infra-hardening.md
git add -u apps/portal/src/server/actions
git commit -m "feat(portal): M5.1 security pass with CSP, headers, rate limits, session checks and dependency audit"
```



### Task M5.2: Accessibility pass

**Gate A for this task:** the standard block, plus `pnpm --filter @cleanstart/portal exec playwright test --grep @a11y` green (desktop and mobile projects).

**Files (under `apps/portal`):**
- Create: `src/components/ui/scrim.tsx`, `docs/partner-portal/A11Y-PASS.md` (from the repo root)
- Modify: `biome.json`, `src/components/ui/overlay.tsx`, `src/components/ui/dropdown.tsx`, `src/components/shell/shell.tsx`, `src/styles/portal.css`, `src/components/screens/Apply.tsx`, `src/components/screens/RegisterDeal.tsx`, and every file the lint pass below names

What the master plan asks for: keyboard, focus, contrast, and the a11y lint rules the mock turned off "fixed or justified". The mock switches off **four** rules in `biome.json`, not two. Baseline measured on the mock (commit 58747992) with all four on: `noSvgWithoutTitle` 0 sites, `useKeyWithClickEvents` 7, `useFocusableInteractive` 4, `useSemanticElements` 33. Policy, decided here:

| Rule | Decision | Why |
|---|---|---|
| `noSvgWithoutTitle` | turn on | 0 sites: every icon is `aria-hidden`. |
| `useKeyWithClickEvents` | turn on, fix at the root | All 7 are the dimmed click-away layer behind overlays. One shared `Scrim` component carries the single, justified suppression (it is `aria-hidden`, and Escape closes every overlay), instead of 7 scattered ones. |
| `useFocusableInteractive` | turn on, fix or justify per site | A listbox whose options are focusable buttons needs no tab stop of its own: justify with a reason in the suppression. Anything actually interactive gets `tabIndex`. |
| `useSemanticElements` | stays off, justified in `A11Y-PASS.md` | 33 sites use `role="group"`, `role="listbox"`, `role="status"` and `role="dialog"` on elements that carry the reviewed design. Native `<fieldset>`, `<select>` and `<dialog>` would change layout and behaviour; the roles are valid ARIA. Real accessibility is proven by axe and the keyboard tests, which this rule cannot see. |

Axe baseline of the mock (19 routes at 1440 px, WCAG 2.0 and 2.1 A and AA): `/apply` Privacy policy link contrast 1.64:1 against the surrounding text (`link-in-text-block`), `/partner/deals/new` `aria-controls="cust-sugg"` pointing at an element that is not rendered (`aria-valid-attr-value`, critical); at 375 px the top bar search button has no accessible name (`button-name`, fixed by CCR-3). Everything else was clean. The conversion may have added more; the suite finds them.

- [ ] **Step 1: Measure the lint baseline on the converted tree**

```bash
mkdir -p /tmp/p06biome && cat > /tmp/p06biome/biome.json <<EOF
{
  "\$schema": "https://biomejs.dev/schemas/1.9.4/schema.json",
  "extends": ["$(git rev-parse --show-toplevel)/biome.json"],
  "linter": { "rules": { "suspicious": { "noArrayIndexKey": "off" }, "style": { "noNonNullAssertion": "off" } } }
}
EOF
cd apps/portal
pnpm exec biome lint --config-path=/tmp/p06biome src --max-diagnostics=500 --reporter=github 2>&1 | grep -oE "lint/a11y/[A-Za-z]+" | sort | uniq -c
pnpm exec biome lint --config-path=/tmp/p06biome src --max-diagnostics=500 --reporter=github 2>&1 | grep -E "a11y" | sed -E 's/::error title=lint\/a11y\/([A-Za-z]+),file=([^,]+),line=([0-9]+).*/\1 \2:\3/' | sort > /tmp/p06-a11y-sites.txt
wc -l /tmp/p06-a11y-sites.txt
cd ../..
```

Expected: a count per rule close to the mock's (the exact numbers depend on Wave 1). Keep `/tmp/p06-a11y-sites.txt`: it is the worklist and the "before" column of the report.

- [ ] **Step 2: The shared click-away layer**

Create `src/components/ui/scrim.tsx`. Verified in the scratch harness: lint with all four rules on reports nothing for it.

```tsx
/**
 * The dimmed layer behind a drawer, dialog, popover or dropdown. Clicking it closes the overlay for mouse users.
 * It is hidden from assistive technology and has no key handler on purpose: keyboard users close every overlay
 * with Escape (handled by the overlay itself), so a second, focusable "close" target would only be noise.
 */
export function Scrim({
  onClose,
  className = "cs-scrim",
  style,
}: {
  onClose: () => void;
  className?: "cs-scrim" | "dd-scrim";
  style?: React.CSSProperties;
}): React.JSX.Element {
  // biome-ignore lint/a11y/useKeyWithClickEvents: aria-hidden click-away layer, Escape closes the overlay
  return <div className={className} onClick={onClose} aria-hidden="true" style={style} />;
}
```

Replace every div-based layer with it using a one time script (it also adds the import; it handles the `style` prop the mobile menu layer carries). Save as `/tmp/use-scrim.py`, run it over the three files that own layers, delete it:

```python
"""One time script for M5.2: replaces every click-away layer written as a div with the shared Scrim component.
Usage: python3 use-scrim.py <file.tsx> ...   (prints how many it replaced per file and adds the import)"""
import re
import sys

PATTERN = re.compile(r'<div className="(cs|dd)-scrim" onClick=\{(.+?)\} aria-hidden="true"(?: style=\{\{(.+?)\}\})? />')


def replace(match: re.Match) -> str:
    kind, handler, style = match.groups()
    extra = f' style={{{{{style}}}}}' if style else ''
    return f'<Scrim className="{kind}-scrim" onClose={{{handler}}}{extra} />'


for path in sys.argv[1:]:
    text = open(path).read()
    text, count = PATTERN.subn(replace, text)
    if count and 'import { Scrim }' not in text:
        source = './scrim' if '/components/ui/' in path.replace('\\', '/') else '@/components/ui/scrim'
        text = re.sub(r'^(import .+;\n)(?!import )', lambda m: m.group(1) + f'import {{ Scrim }} from "{source}";\n', text, count=1, flags=re.M)
    open(path, 'w').write(text)
    print(f'{path}: {count} replaced')
```

```bash
python3 /tmp/use-scrim.py apps/portal/src/components/shell/shell.tsx apps/portal/src/components/ui/dropdown.tsx apps/portal/src/components/ui/overlay.tsx && rm /tmp/use-scrim.py
grep -rnE 'className="(cs|dd)-scrim"' apps/portal/src | grep -v "<Scrim"
```

Expected on the mock: `shell.tsx: 5 replaced` (4 after CCR-3 removed the palette's own), `dropdown.tsx: 1 replaced`, `overlay.tsx: 1 replaced`; the grep prints nothing. Any other file with a layer of this kind shows in the lint output of Step 1: run the script on it too.

- [ ] **Step 3: A real focus trap for drawers and dialogs**

The mock's overlay moves focus in, closes on Escape and returns focus, but lets Tab leave the dialog (its own comment says "no focus trap"). In `src/components/ui/overlay.tsx` replace everything from the comment `// shortcut: no focus trap...` through the end of the function `useOverlayBehaviour` with the version below (the `Scrim` import was added by Step 2). Verified compiled in the scratch harness with the mock's own overlay file:

```tsx
const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]):not([type=hidden]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/** Focus goes in when the overlay opens, stays inside while it is open (Tab and Shift+Tab wrap), Escape closes it, and focus returns to what opened it. */
function useOverlayBehaviour(open: boolean, onClose: () => void): React.RefObject<HTMLElement | null> {
  const ref = useRef<HTMLElement | null>(null);
  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    const first = ref.current?.querySelector<HTMLElement>(
      "[autofocus], input:not([type=hidden]), textarea, select, button.btn-p",
    );
    first?.focus();
    const onKey = (event: KeyboardEvent): void => {
      if (event.key === "Escape") {
        onClose();
        return;
      }
      if (event.key !== "Tab" || !ref.current) return;
      const items = Array.from(ref.current.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (el) => el.getClientRects().length > 0,
      );
      const firstItem = items[0];
      const lastItem = items.at(-1);
      if (!firstItem || !lastItem) return;
      const active = document.activeElement;
      const outside = !ref.current.contains(active);
      if (event.shiftKey && (active === firstItem || outside)) {
        event.preventDefault();
        lastItem.focus();
      } else if (!event.shiftKey && (active === lastItem || outside)) {
        event.preventDefault();
        firstItem.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      previous?.focus?.();
    };
  }, [open, onClose]);
  return ref;
}
```

- [ ] **Step 4: Skip link and the main landmark**

Keyboard users otherwise tab through the whole sidebar on every page (WCAG 2.4.1). In `src/components/shell/shell.tsx` add as the first child of the returned fragment (before `<div className="app">`):

```tsx
      <a className="skip" href="#main">
        Skip to main content
      </a>
```

and change `<main className="content">` to `<main id="main" className="content" tabIndex={-1}>`. In `src/styles/portal.css`, after the `.app` rules, add:

```css
.skip{position:fixed;left:8px;top:8px;z-index:100;padding:8px 12px;border-radius:6px;background:#151021;color:#FFFFFF;font-weight:600;transform:translateY(-200%)}
.skip:focus{transform:none}
.content:focus{outline:none}
```

- [ ] **Step 5: The three findings the mock already has**

1. `src/components/screens/Apply.tsx`: the Privacy policy link is indistinguishable from the text around it. Find it with `grep -n "privacy-policy" apps/portal/src/components/screens/Apply.tsx` and add an underline to that anchor:

```tsx
<a href="https://www.cleanstart.com/privacy-policy" target="_blank" rel="noreferrer noopener" style={{ textDecoration: "underline" }}>
```

2. `src/components/screens/RegisterDeal.tsx`: the customer field points at a suggestion list that is only rendered when there are suggestions. Replace `aria-controls="cust-sugg"` with `aria-controls={suggestions.length > 0 ? "cust-sugg" : undefined}`.
3. The top bar search button's name is fixed by CCR-3 (`aria-label`). Check: `grep -n 'aria-label={kind === "partner" ? "Search deals and documents"' apps/portal/src/components/shell/shell.tsx`.

- [ ] **Step 6: Turn the lint rules on and clear the worklist**

Replace `apps/portal/biome.json` (only `useSemanticElements` stays off; the other three are on):

```json
{
  "$schema": "https://biomejs.dev/schemas/1.9.4/schema.json",
  "extends": ["../../biome.json"],
  "linter": {
    "rules": {
      "a11y": {
        "useSemanticElements": "off"
      },
      "suspicious": {
        "noArrayIndexKey": "off"
      },
      "style": {
        "noNonNullAssertion": "off"
      }
    }
  }
}
```

Run `pnpm --filter @cleanstart/portal lint`. Every remaining diagnostic is handled by the rule's policy, one site at a time:
- `useKeyWithClickEvents` on something that is not a click-away layer: make it a real `<button type="button">` (keeps its classes), never add a key handler to a `div`.
- `useFocusableInteractive` on a `role="listbox"` or `role="menu"` whose items are buttons: add on the line above the element `{/* biome-ignore lint/a11y/useFocusableInteractive: the options are buttons and focusable; the list itself is not a tab stop */}` (or the `//` form inside a prop list). On an element that is actually interactive: add `tabIndex={0}` and the key handling it needs.
- `noSvgWithoutTitle`: add `aria-hidden="true"` for a decorative icon, or a `<title>` for one that carries meaning.
No other suppression is allowed, and each suppression has a reason in the comment. Expected end state: lint passes.

- [ ] **Step 7: Run the axe and keyboard suite, and fix what it finds**

```bash
pnpm --filter @cleanstart/portal exec playwright test --grep @a11y
```

Expected: 19 axe tests on `desktop`, 19 on `mobile`, 3 keyboard tests on `desktop`, all green. A failure names the rule, the impact and up to three selectors. Fix in the component, not in the test. The usual causes and fixes: `color-contrast` (darken the foreground token in `portal.css` until the ratio is at least 4.5:1, or 3:1 for text of 18.66 px bold or 24 px and up; do not change a background that carries brand colour without asking), `label` or `button-name` (add a visible label or `aria-label` that contains the visible text), `aria-valid-attr-value` (render the target or drop the attribute), `region` (content outside a landmark), `target-size` (the mobile project, controls under 24 by 24 px). A rule that cannot be fixed (a third party widget) is disabled by id in `a11y.spec.ts` with a one line reason and listed in the report.

- [ ] **Step 8: Write the report**

Create `docs/partner-portal/A11Y-PASS.md` with the real numbers:

````markdown
# Partner portal accessibility pass (M5.2)

Date, commit, who ran it.

## Lint rules

| Rule | Mock baseline | Now | Decision |
|---|---|---|---|
| `noSvgWithoutTitle` | 0 | paste the count (expect 0) | on |
| `useKeyWithClickEvents` | 7 | paste (expect 1 suppression, in `scrim.tsx`) | on |
| `useFocusableInteractive` | 4 | paste, with one line per suppression: file, reason | on |
| `useSemanticElements` | 33 | not measured (off) | off: roles on divs are valid ARIA and native elements would change the reviewed layout; axe and the keyboard tests cover behaviour |

## Axe

| Project | Routes | Violations before | After |
|---|---|---|---|
| desktop 1440 | 19 | paste (mock: 2) | 0 serious or critical |
| mobile 393 | 19 | paste | 0 serious or critical |

List each fix: file, rule, what changed. List each moderate or minor advisory the report still attaches, with a decision.

## Keyboard

Palette, drawers and the Tab walk: pass counts. Skip link added.

## Not covered

Screen reader testing (VoiceOver, NVDA), zoom to 400 percent, forced colors and reduced motion were not run. A person should do a 30 minute pass with a screen reader before the pilot.
````

- [ ] **Step 9: Gate A and commit**

Run the standard Gate A block, the a11y suite once more, then Gate B, then:

```bash
git add apps/portal/biome.json apps/portal/src/components/ui apps/portal/src/components/shell/shell.tsx apps/portal/src/styles/portal.css apps/portal/src/components/screens/Apply.tsx apps/portal/src/components/screens/RegisterDeal.tsx docs/partner-portal/A11Y-PASS.md docs/superpowers/plans/2026-11-12-partner-portal-06-admin-infra-hardening.md
git add -u apps/portal/src
git commit -m "feat(portal): M5.2 accessibility pass with focus trap, skip link, scrim, lint rules on and axe suite green"
```

### Task M5.3: Retention jobs

**Gate A for this task:** the standard block. The new tests run against the real test database.

**Files (under `apps/portal`):**
- Modify: `src/server/jobs/retention.ts` (replaces the Wave 0 stub body; `runRetention` and its schedule `40 3 * * *` are fixed by contracts H.17)
- Create: `src/server/jobs/purge-jobs.test.ts`, `src/server/jobs/registry.test.ts`
- Test: `src/server/jobs/retention.test.ts`

Mirrors the CMS purge jobs (`apps/cms/src/payload/jobs/purge-deal-registrations.ts` and friends: a retention constant of 365 days, a daily cron, one result object, a log line). The scheduler, the advisory lock per job name and the `PORTAL_JOBS_ENABLED` gate already exist (W0-c: `src/server/jobs/{lock,schedule,index}.ts`, `src/instrumentation.ts`); this task adds a job body and tests, and edits none of them.

What is purged, and what is deliberately not:

| Record | Rule | Source |
|---|---|---|
| `applications` with status `declined` | removed 365 days after `decided_at` (fallback `updated_at`) | master plan M5.3, contracts B.6 |
| `registrations` with status `rejected` | removed 365 days after `decided_at`, with their contacts, messages, timeline events and reminders, in batches of 500 | same |
| document old files | `document-purge` (track D, `20 3 * * *`): versions past `purge_after` and soft deleted documents older than 30 days | plan 05, `purgeDocumentFiles` |
| `audit_log` | never deleted (append only for every role, contracts B.6) | open question below |
| `access_requests` | not purged: `portal_app` has no DELETE grant on it (rls.sql); needs a contract change (CCR-8) | |
| accepted, won, lost, expired registrations, approved applications | never purged in v1 | |

Open question for the owner (listed in the report): `audit_log` text contains customer and person names forever. A retention rule for it needs a decision (and a grant), so v1 keeps it.

- [ ] **Step 1: Write the failing retention test**

Five tests: declined applications older than a year are removed and everything else kept (recent declined, old approved, old `new`); an old rejected registration is removed with its contacts, messages and timeline; recent rejections and any registration that was ever accepted are kept however old; batches work and the second run is a no-op; documents and the audit log are never touched. It uses `makeApplication`, `makePartner`, `makeRegistration`, `makeDocument` from the contracts' J.3 helpers.

```ts
import { eq } from 'drizzle-orm';
import { beforeEach, describe, expect, it } from 'vitest';
import {
  applications,
  auditLog,
  documents,
  registrationContacts,
  registrationEvents,
  registrationMessages,
  registrations,
} from '@/db/schema';
import { makeApplication, makeDocument, makePartner, makeRegistration, resetDb, testDb } from '@/db/test-helpers';
import { fixedClock } from '@/lib/clock';
import { purgeExpiredRecords, RETENTION_DAYS } from './retention';

const db = testDb();
const clock = fixedClock('2026-11-06T14:02:00Z');
const daysAgo = (days: number): Date => new Date(clock.now().getTime() - days * 86_400_000);

beforeEach(() => resetDb(db));

const withChildren = async (registrationId: string, partnerId: string): Promise<void> => {
  await db.insert(registrationContacts).values({ registrationId, partnerId, name: 'Nadia Karim', email: 'nadia@gulfway.example.com' });
  await db.insert(registrationMessages).values({ registrationId, partnerId, authorName: 'Omar', authorOrg: 'CleanStart', side: 'staff', body: 'Already registered.' });
  await db.insert(registrationEvents).values({ registrationId, partnerId, text: 'Rejected', byLabel: 'Omar', source: 'portal' });
};

describe('purgeExpiredRecords', () => {
  it('removes declined applications older than a year and keeps everything else', async () => {
    const oldDeclined = await makeApplication(db, { status: 'declined', decidedAt: daysAgo(RETENTION_DAYS + 1) });
    const recentDeclined = await makeApplication(db, { status: 'declined', decidedAt: daysAgo(RETENTION_DAYS - 1) });
    const oldApproved = await makeApplication(db, { status: 'approved', decidedAt: daysAgo(900) });
    const oldNew = await makeApplication(db, { status: 'new' });
    await db.update(applications).set({ createdAt: daysAgo(900) }).where(eq(applications.id, oldNew.id));

    const result = await purgeExpiredRecords({ db, clock });

    expect(result.applications).toBe(1);
    const left = (await db.select({ id: applications.id }).from(applications)).map((a) => a.id).sort();
    expect(left).toEqual([recentDeclined.id, oldApproved.id, oldNew.id].sort());
    expect(left).not.toContain(oldDeclined.id);
  });

  it('removes a rejected registration older than a year with its contacts, messages and timeline', async () => {
    const partner = await makePartner(db, {});
    const old = await makeRegistration(db, { partnerId: partner.id, status: 'rejected' });
    await db.update(registrations).set({ decidedAt: daysAgo(RETENTION_DAYS + 5) }).where(eq(registrations.id, old.id));
    await withChildren(old.id, partner.id);

    const result = await purgeExpiredRecords({ db, clock });

    expect(result.registrations).toBe(1);
    expect(await db.select().from(registrations)).toHaveLength(0);
    expect(await db.select().from(registrationContacts)).toHaveLength(0);
    expect(await db.select().from(registrationMessages)).toHaveLength(0);
    expect(await db.select().from(registrationEvents)).toHaveLength(0);
  });

  it('keeps recent rejections and every registration that was ever accepted, however old', async () => {
    const partner = await makePartner(db, {});
    const recent = await makeRegistration(db, { partnerId: partner.id, status: 'rejected' });
    await db.update(registrations).set({ decidedAt: daysAgo(30) }).where(eq(registrations.id, recent.id));
    const accepted = await makeRegistration(db, { partnerId: partner.id, status: 'accepted' });
    await db.update(registrations).set({ decidedAt: daysAgo(900) }).where(eq(registrations.id, accepted.id));

    expect(await purgeExpiredRecords({ db, clock })).toEqual({ applications: 0, registrations: 0 });
    expect(await db.select().from(registrations)).toHaveLength(2);
  });

  it('works in batches and is a no-op the second time', async () => {
    const partner = await makePartner(db, {});
    for (let i = 0; i < 3; i += 1) {
      const r = await makeRegistration(db, { partnerId: partner.id, status: 'rejected', customerName: `Old customer ${i}` });
      await db.update(registrations).set({ decidedAt: daysAgo(RETENTION_DAYS + 10) }).where(eq(registrations.id, r.id));
    }
    expect((await purgeExpiredRecords({ db, clock })).registrations).toBe(3);
    expect(await purgeExpiredRecords({ db, clock })).toEqual({ applications: 0, registrations: 0 });
  });

  it('never touches documents or the audit log', async () => {
    await makeDocument(db, { title: 'Old but live', deletedAt: null });
    await db.insert(auditLog).values({ at: daysAgo(900), actorLabel: 'Omar', who: 'staff', kind: 'partners', event: 'application.declined', text: 'Declined an application: Acme' });
    await purgeExpiredRecords({ db, clock });
    expect(await db.select().from(documents)).toHaveLength(1);
    expect(await db.select().from(auditLog)).toHaveLength(1);
  });
});
```

Run: `pnpm --filter @cleanstart/portal exec vitest run src/server/jobs/retention.test.ts`
Expected: FAIL (`purgeExpiredRecords is not a function`: the Wave 0 stub only exports `runRetention`).

- [ ] **Step 2: Implement the job**

Replace the whole of `src/server/jobs/retention.ts`. It runs on the system `db` (jobs may import `db`, contracts F.1), deletes children before parents (the foreign keys have no cascade), and never throws on an empty table.

```ts
import { and, eq, inArray, sql } from 'drizzle-orm';
import { db, type Db } from '@/db/client';
import {
  applications,
  registrationContacts,
  registrationEvents,
  registrationMessages,
  registrationReminders,
  registrations,
} from '@/db/schema';
import { type Clock, systemClock } from '@/lib/clock';
import { log } from '@/server/log';

/** Declined applications and rejected registrations are kept this long, then removed (the CMS purge jobs use 365 too). */
export const RETENTION_DAYS = 365;
const DAY_MS = 86_400_000;
/** Registrations go in batches so one run never holds a long transaction. */
const BATCH_SIZE = 500;

export interface RetentionResult {
  applications: number;
  registrations: number;
}

/**
 * Removes what the applicant or the partner no longer has a reason for us to keep: applications declined and
 * registrations rejected more than RETENTION_DAYS ago, with the contacts, messages, timeline and reminders that hang
 * off a registration. The age counts from the decision (decided_at), falling back to the last update.
 *
 * Never touched: accepted, won, lost and expired registrations, approved applications, documents and their old files
 * (document-purge owns those), and the audit log, which is append only for everyone (contracts B.6).
 */
export async function purgeExpiredRecords(deps: { db: Db; clock: Clock }): Promise<RetentionResult> {
  const cutoff = new Date(deps.clock.now().getTime() - RETENTION_DAYS * DAY_MS);
  const result: RetentionResult = { applications: 0, registrations: 0 };

  const removed = await deps.db
    .delete(applications)
    .where(
      and(
        eq(applications.status, 'declined'),
        sql`coalesce(${applications.decidedAt}, ${applications.updatedAt}) < ${cutoff}`,
      ),
    )
    .returning({ id: applications.id });
  result.applications = removed.length;

  for (;;) {
    const due = await deps.db
      .select({ id: registrations.id })
      .from(registrations)
      .where(
        and(
          eq(registrations.status, 'rejected'),
          sql`coalesce(${registrations.decidedAt}, ${registrations.updatedAt}) < ${cutoff}`,
        ),
      )
      .limit(BATCH_SIZE);
    if (due.length === 0) break;
    const ids = due.map((r) => r.id);
    await deps.db.transaction(async (tx) => {
      await tx.delete(registrationReminders).where(inArray(registrationReminders.registrationId, ids));
      await tx.delete(registrationContacts).where(inArray(registrationContacts.registrationId, ids));
      await tx.delete(registrationMessages).where(inArray(registrationMessages.registrationId, ids));
      await tx.delete(registrationEvents).where(inArray(registrationEvents.registrationId, ids));
      await tx.delete(registrations).where(inArray(registrations.id, ids));
    });
    result.registrations += ids.length;
    if (due.length < BATCH_SIZE) break;
  }
  return result;
}

/** The scheduled job (src/server/jobs/index.ts, daily 03:40 UTC, one run at a time through the advisory lock). */
export const runRetention = async (): Promise<void> => {
  const result = await purgeExpiredRecords({ db, clock: systemClock });
  log.info({ job: 'retention', ...result }, 'retention purge finished');
};
```

Run the test. Expected: PASS, 5 tests.

- [ ] **Step 3: Test the jobs together and the registry**

`purge-jobs.test.ts` runs the retention job and track D's `purgeDocumentFiles` against the same database with a `FakeFileStorage`: only the two expired R2 keys are deleted, live documents and their keys are untouched, old rejected registrations and declined applications are gone, and a second run changes nothing. It follows plan 05's documented behaviour (the purge tombstones a soft deleted document by setting `file_key` to `purged/<id>`); if D's job differs, fix this test to D's documented behaviour, not the job. `registry.test.ts` pins the schedule.

```ts
// src/server/jobs/purge-jobs.test.ts
import { eq } from 'drizzle-orm';
import { beforeEach, describe, expect, it } from 'vitest';
import { applications, documentVersions, documents, registrations } from '@/db/schema';
import { makeApplication, makeDocument, makePartner, makeRegistration, resetDb, testDb } from '@/db/test-helpers';
import { fixedClock } from '@/lib/clock';
import { FakeFileStorage } from '@/server/files/fake';
import { purgeDocumentFiles } from './document-purge';
import { RETENTION_DAYS, purgeExpiredRecords } from './retention';

const db = testDb();
const clock = fixedClock('2026-11-06T14:02:00Z');
const daysAgo = (days: number): Date => new Date(clock.now().getTime() - days * 86_400_000);

beforeEach(() => resetDb(db));

describe('the two purge jobs together', () => {
  it('delete only what has expired, each in its own area, and are idempotent', async () => {
    const partner = await makePartner(db, {});

    const live = await makeDocument(db, { title: 'Live datasheet' });
    const replaced = await makeDocument(db, { title: 'Replaced datasheet' });
    await db.insert(documentVersions).values({
      documentId: replaced.id, version: 1, fileKey: 'documents/old/v1/old.pdf', fileSize: 10, mime: 'application/pdf',
      originalName: 'old.pdf', replacedAt: daysAgo(40), purgeAfter: daysAgo(10),
    });
    const deleted = await makeDocument(db, { title: 'Deleted datasheet', deletedAt: daysAgo(40) });

    const rejected = await makeRegistration(db, { partnerId: partner.id, status: 'rejected' });
    await db.update(registrations).set({ decidedAt: daysAgo(RETENTION_DAYS + 1) }).where(eq(registrations.id, rejected.id));
    const declined = await makeApplication(db, { status: 'declined', decidedAt: daysAgo(RETENTION_DAYS + 1) });

    const storage = new FakeFileStorage();
    const files = await purgeDocumentFiles({ storage, clock });
    const records = await purgeExpiredRecords({ db, clock });

    expect(files.failed).toEqual([]);
    expect([...storage.deleted].sort()).toEqual(['documents/old/v1/old.pdf', deleted.fileKey].sort());
    expect(storage.deleted).not.toContain(live.fileKey);
    expect(records).toEqual({ applications: 1, registrations: 1 });
    expect(await db.select().from(registrations).where(eq(registrations.id, rejected.id))).toHaveLength(0);
    expect(await db.select().from(applications).where(eq(applications.id, declined.id))).toHaveLength(0);
    expect((await db.select().from(documents).where(eq(documents.id, live.id)))[0]?.fileKey).toBe(live.fileKey);

    storage.deleted.length = 0;
    expect((await purgeDocumentFiles({ storage, clock })).purged).toBe(0);
    expect(await purgeExpiredRecords({ db, clock })).toEqual({ applications: 0, registrations: 0 });
    expect(storage.deleted).toEqual([]);
  });
});
```

```ts
// src/server/jobs/registry.test.ts
import cron from 'node-cron';
import { describe, expect, it } from 'vitest';
import { JOBS } from './index';

describe('job registry', () => {
  it('lists every job once, with a valid cron expression and a function to run', () => {
    expect(new Set(JOBS.map((j) => j.name)).size).toBe(JOBS.length);
    for (const job of JOBS) {
      expect(cron.validate(job.schedule), `${job.name}: ${job.schedule}`).toBe(true);
      expect(typeof job.run).toBe('function');
    }
  });

  it('keeps the two purge jobs at their contract times, daily, UTC', () => {
    const at = (name: string): string | undefined => JOBS.find((j) => j.name === name)?.schedule;
    expect(at('document-purge')).toBe('20 3 * * *');
    expect(at('retention')).toBe('40 3 * * *');
  });

  it('names the eight jobs of contracts H.17', () => {
    expect(JOBS.map((j) => j.name).sort()).toEqual(
      ['document-purge', 'expiry', 'expiry-reminders', 'hubspot-outbox', 'hubspot-poll', 'hubspot-reconcile', 'retention', 'website-intake'],
    );
  });
});
```

Create both files, then run: `pnpm --filter @cleanstart/portal exec vitest run src/server/jobs`
Expected: PASS for `retention.test.ts` (5), `purge-jobs.test.ts` (1), `registry.test.ts` (3), and track D's `document-purge.test.ts` (3, plan 05 step 24).

- [ ] **Step 4: Gate A and commit**

Run the standard Gate A block, then Gate B, then:

```bash
git add apps/portal/src/server/jobs/retention.ts apps/portal/src/server/jobs/retention.test.ts apps/portal/src/server/jobs/purge-jobs.test.ts apps/portal/src/server/jobs/registry.test.ts docs/superpowers/plans/2026-11-12-partner-portal-06-admin-infra-hardening.md
git commit -m "feat(portal): M5.3 retention job for declined applications and rejected registrations, purge job tests"
```



### Task M5.5: Backups: dump the portal database too, and a restore drill

**Gate A for this task:** `bash -n` and `shellcheck` on both scripts, and `bash /tmp/backup-local-test.sh` printing `ALL OK` (Step 4). The portal workspace gates are unaffected (no portal code changes), so run only the quick ones: `pnpm --filter @cleanstart/portal lint && pnpm --filter @cleanstart/portal typecheck`.

**Files:**
- Modify: `infra/scripts/backup.sh`
- Create: `infra/scripts/restore-portal-drill.sh` (outside the handoff's allowed path list; CCR-6)
- Not edited: `infra/scripts/run-backup.sh`, `infra/scripts/restore.sh`, the droplet's cron entry

What the master plan says, and what is true: the nightly job (`/etc/cron.d/cleanstart-backup`, 02:00 UTC, through `run-backup.sh`, which loads `/opt/cleanstart/.env` and forces `DATABASE_URI` to the localhost `cleanstart` database) dumps only the CMS database. Until `backup.sh` also dumps `cleanstart_portal`, the portal's approvals, agreements and audit log have no backup. CLAUDE.md requires verifying the heartbeat after any change to the backup script.

Design (every point is covered by the local test in Step 4):
- **Order:** CMS dump, upload, then the portal dump and upload, then the heartbeat. The heartbeat is the last statement, so it fires only if every dump and upload succeeded. A failure exits non-zero before it.
- **Where the portal dump goes:** not the CMS bucket. `cdn.cleanstart.com` serves that bucket publicly and the portal dump holds people's details and password hashes. The portal's R2 settings are read, literally and never sourced, from `/opt/cleanstart/portal.env` (`R2_ENDPOINT`, `R2_BUCKET`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, the private documents bucket and its token) and the key is `portal-backups/<UTC timestamp>.dump`. If those settings point at the CMS bucket the script refuses. No change to `run-backup.sh` is needed.
- **When the portal database does not exist yet:** the script logs a loud `WARNING` and skips it, so shipping the script before the portal is provisioned does not break the CMS backup or its heartbeat. Once the database exists a missing or incomplete `portal.env` is a hard failure, so a gap is an alert, never silent.
- **Integrity:** each dump is checked with `pg_restore --list` before upload; temp files are removed on every exit path (the old script left them on failure).
- **`DRY_RUN`** still does nothing and touches no database; it now prints the plan for both dumps.
- **Retention:** the CMS bucket's lifecycle rule covers `backups/`. The portal prefix needs its own rule on the private bucket (handover item 6).

- [ ] **Step 1: Baseline**

```bash
bash -n infra/scripts/backup.sh && shellcheck infra/scripts/backup.sh && echo BASELINE_OK
```

Expected: `BASELINE_OK` (the current script is clean).

- [ ] **Step 2: Replace `infra/scripts/backup.sh`**

```bash
#!/usr/bin/env bash
# Postgres backup to Cloudflare R2: the CMS database, and the partner portal database once it exists.
#
# Required env vars:
#   DATABASE_URI              - postgres connection string of the CMS database
#   R2_ENDPOINT               - R2 S3-compatible endpoint URL
#   R2_ACCESS_KEY_ID          - R2 access key
#   R2_SECRET_ACCESS_KEY      - R2 secret key
#   R2_BUCKET                 - destination bucket name (the CMS bucket, which also serves public media)
#
# Optional env vars:
#   BETTERSTACK_HEARTBEAT_URL - pinged after EVERY dump succeeded, for uptime monitoring
#   DRY_RUN                   - set to any non-empty value to skip dump/upload and print the plan
#   PORTAL_DB_NAME            - portal database name (default cleanstart_portal)
#   PORTAL_DATABASE_URI       - portal connection string (default: DATABASE_URI with the database name swapped)
#   PORTAL_ENV_FILE           - the portal's env file (default /opt/cleanstart/portal.env)
#
# The portal dump never goes to the public media bucket. Its destination is read from PORTAL_ENV_FILE
# (R2_ENDPOINT, R2_BUCKET, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY: the private partner documents bucket) and
# lands under portal-backups/. If the portal database exists and that file cannot supply a destination, the
# script fails before the heartbeat, so a missing portal backup is an alert and never a silent gap.
set -euo pipefail

: "${DATABASE_URI:?DATABASE_URI is required}"
: "${R2_ENDPOINT:?R2_ENDPOINT is required}"
: "${R2_ACCESS_KEY_ID:?R2_ACCESS_KEY_ID is required}"
: "${R2_SECRET_ACCESS_KEY:?R2_SECRET_ACCESS_KEY is required}"
: "${R2_BUCKET:?R2_BUCKET is required}"

TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
BACKUP_FILE="/tmp/cleanstart-${TIMESTAMP}.dump"
S3_KEY="backups/${TIMESTAMP}.dump"
DRY_RUN="${DRY_RUN:-}"

PORTAL_DB_NAME="${PORTAL_DB_NAME:-cleanstart_portal}"
PORTAL_ENV_FILE="${PORTAL_ENV_FILE:-/opt/cleanstart/portal.env}"
PORTAL_BACKUP_FILE="/tmp/cleanstart-portal-${TIMESTAMP}.dump"
PORTAL_S3_KEY="portal-backups/${TIMESTAMP}.dump"
DATABASE_URI_BASE="${DATABASE_URI%%\?*}"
PORTAL_DATABASE_URI="${PORTAL_DATABASE_URI:-${DATABASE_URI_BASE%/*}/${PORTAL_DB_NAME}}"

log() { echo "[backup] $*" >&2; }

cleanup() { rm -f "${BACKUP_FILE}" "${PORTAL_BACKUP_FILE}"; }
trap cleanup EXIT

# The last value of KEY in a KEY=VALUE env file, read literally. The file is never sourced because values may
# contain spaces (the same reason run-backup.sh parses .env line by line).
env_file_value() {
  local file="$1" key="$2" line value=""
  while IFS= read -r line || [[ -n "${line}" ]]; do
    if [[ "${line}" == "${key}="* ]]; then value="${line#*=}"; fi
  done < "${file}"
  printf '%s' "${value}"
}

r2_put() { # endpoint access_key secret_key bucket file key
  AWS_ACCESS_KEY_ID="$2" AWS_SECRET_ACCESS_KEY="$3" \
    aws s3 cp --endpoint-url "$1" "$5" "s3://$4/$6"
}

if [[ ! "${PORTAL_DB_NAME}" =~ ^[a-z_][a-z0-9_]*$ ]]; then
  log "PORTAL_DB_NAME must match ^[a-z_][a-z0-9_]*\$ (got '${PORTAL_DB_NAME}')"
  exit 1
fi

log "Starting backup - ${TIMESTAMP}"

if [[ -n "${DRY_RUN}" ]]; then
  log "DRY_RUN set: would dump the CMS database to ${BACKUP_FILE} and upload to s3://${R2_BUCKET}/${S3_KEY}"
  log "DRY_RUN set: would dump ${PORTAL_DB_NAME} (if it exists) to ${PORTAL_BACKUP_FILE} and upload it to the bucket named in ${PORTAL_ENV_FILE} under ${PORTAL_S3_KEY}"
  exit 0
fi

log "Dumping CMS database..."
pg_dump -Fc "${DATABASE_URI}" > "${BACKUP_FILE}"
pg_restore --list "${BACKUP_FILE}" > /dev/null
log "CMS dump complete - $(du -sh "${BACKUP_FILE}" | cut -f1)"

log "Uploading CMS dump to R2..."
r2_put "${R2_ENDPOINT}" "${R2_ACCESS_KEY_ID}" "${R2_SECRET_ACCESS_KEY}" "${R2_BUCKET}" "${BACKUP_FILE}" "${S3_KEY}"
log "CMS upload complete - s3://${R2_BUCKET}/${S3_KEY}"

PORTAL_EXISTS=$(psql "${DATABASE_URI}" -Atqc "SELECT 1 FROM pg_database WHERE datname = '${PORTAL_DB_NAME}'")
if [[ "${PORTAL_EXISTS}" == "1" ]]; then
  [[ -r "${PORTAL_ENV_FILE}" ]] || { log "${PORTAL_DB_NAME} exists but ${PORTAL_ENV_FILE} is not readable"; exit 1; }
  PORTAL_ENDPOINT=$(env_file_value "${PORTAL_ENV_FILE}" R2_ENDPOINT)
  PORTAL_BUCKET=$(env_file_value "${PORTAL_ENV_FILE}" R2_BUCKET)
  PORTAL_ACCESS_KEY=$(env_file_value "${PORTAL_ENV_FILE}" R2_ACCESS_KEY_ID)
  PORTAL_SECRET_KEY=$(env_file_value "${PORTAL_ENV_FILE}" R2_SECRET_ACCESS_KEY)
  if [[ -z "${PORTAL_ENDPOINT}" || -z "${PORTAL_BUCKET}" || -z "${PORTAL_ACCESS_KEY}" || -z "${PORTAL_SECRET_KEY}" ]]; then
    log "${PORTAL_ENV_FILE} must define R2_ENDPOINT, R2_BUCKET, R2_ACCESS_KEY_ID and R2_SECRET_ACCESS_KEY"
    exit 1
  fi
  if [[ "${PORTAL_BUCKET}" == "${R2_BUCKET}" && "${PORTAL_ENDPOINT}" == "${R2_ENDPOINT}" ]]; then
    log "refusing to put the portal dump in the CMS bucket (${R2_BUCKET}); it also serves public media"
    exit 1
  fi

  log "Dumping portal database ${PORTAL_DB_NAME}..."
  pg_dump -Fc "${PORTAL_DATABASE_URI}" > "${PORTAL_BACKUP_FILE}"
  pg_restore --list "${PORTAL_BACKUP_FILE}" > /dev/null
  log "portal dump complete - $(du -sh "${PORTAL_BACKUP_FILE}" | cut -f1)"

  log "Uploading portal dump to R2..."
  r2_put "${PORTAL_ENDPOINT}" "${PORTAL_ACCESS_KEY}" "${PORTAL_SECRET_KEY}" "${PORTAL_BUCKET}" "${PORTAL_BACKUP_FILE}" "${PORTAL_S3_KEY}"
  log "portal upload complete - s3://${PORTAL_BUCKET}/${PORTAL_S3_KEY}"
else
  log "WARNING: database ${PORTAL_DB_NAME} does not exist on this server; skipping the portal dump"
fi

# The heartbeat is the last thing that happens, so it fires only when every dump above succeeded.
if [[ -n "${BETTERSTACK_HEARTBEAT_URL:-}" ]]; then
  curl -fsS --max-time 10 "${BETTERSTACK_HEARTBEAT_URL}" > /dev/null || true
  log "Heartbeat pinged"
fi

log "Backup finished successfully - ${TIMESTAMP}"
```

Keep the file executable: `chmod +x infra/scripts/backup.sh`.

- [ ] **Step 3: Create the restore drill script**

It never touches the live database: it restores a dump into a scratch database (`cleanstart_portal_drill` by default; it refuses `cleanstart_portal`, `cleanstart` and `postgres` as the scratch name), counts rows in the key tables, prints the newest `audit_log` entry, and drops the scratch database on exit. It needs `ALLOW_RESTORE=yes` like `restore.sh`. With no argument it lists the portal backups; with a timestamp it downloads `portal-backups/<timestamp>.dump` from the bucket named in `portal.env`; with `--file` it uses a local dump.

```bash
#!/usr/bin/env bash
# Restore drill for the partner portal database: restores a backup into a SCRATCH database and checks it.
# It never touches the live database. Log each drill in docs/operations/RESTORE-LOG.md.
#
# Usage:
#   ALLOW_RESTORE=yes ./restore-portal-drill.sh                          # list portal backups in R2
#   ALLOW_RESTORE=yes ./restore-portal-drill.sh 2026-11-20T02:00:00Z     # download that backup and restore it
#   ALLOW_RESTORE=yes ./restore-portal-drill.sh --file /tmp/portal.dump  # restore a local dump
#
# Required env vars:
#   ALLOW_RESTORE             - must be exactly 'yes'
#   DATABASE_URI              - CMS connection string on the same server (used to derive the admin connection)
# Optional env vars:
#   PORTAL_DRILL_ADMIN_URI    - superuser connection to the maintenance database (default: DATABASE_URI with database 'postgres')
#   PORTAL_DRILL_DB           - scratch database name (default cleanstart_portal_drill)
#   PORTAL_DB_NAME            - the live portal database, which the drill refuses to overwrite (default cleanstart_portal)
#   PORTAL_ENV_FILE           - portal env file with the R2 settings (default /opt/cleanstart/portal.env)
#   PORTAL_DRILL_TABLES       - space separated tables that must exist and be readable after the restore
#   KEEP_DRILL_DB             - set to 1 to keep the scratch database for inspection
set -euo pipefail

log() { echo "[portal-drill] $*" >&2; }

if [[ "${ALLOW_RESTORE:-}" != "yes" ]]; then
  log "ERROR: set ALLOW_RESTORE=yes to proceed."
  exit 1
fi
: "${DATABASE_URI:?DATABASE_URI is required}"

PORTAL_DB_NAME="${PORTAL_DB_NAME:-cleanstart_portal}"
DRILL_DB="${PORTAL_DRILL_DB:-cleanstart_portal_drill}"
PORTAL_ENV_FILE="${PORTAL_ENV_FILE:-/opt/cleanstart/portal.env}"
DATABASE_URI_BASE="${DATABASE_URI%%\?*}"
ADMIN_URI="${PORTAL_DRILL_ADMIN_URI:-${DATABASE_URI_BASE%/*}/postgres}"
DRILL_URI="${ADMIN_URI%/*}/${DRILL_DB}"
TABLES="${PORTAL_DRILL_TABLES:-users partners registrations registration_events documents audit_log hubspot_outbox invites}"

if [[ ! "${DRILL_DB}" =~ ^[a-z_][a-z0-9_]*$ ]]; then
  log "PORTAL_DRILL_DB must match ^[a-z_][a-z0-9_]*\$ (got '${DRILL_DB}')"
  exit 1
fi
if [[ "${DRILL_DB}" == "${PORTAL_DB_NAME}" || "${DRILL_DB}" == "cleanstart" || "${DRILL_DB}" == "postgres" ]]; then
  log "refusing to use '${DRILL_DB}' as the scratch database"
  exit 1
fi

env_file_value() {
  local file="$1" key="$2" line value=""
  while IFS= read -r line || [[ -n "${line}" ]]; do
    if [[ "${line}" == "${key}="* ]]; then value="${line#*=}"; fi
  done < "${file}"
  printf '%s' "${value}"
}

r2() {
  AWS_ACCESS_KEY_ID="$(env_file_value "${PORTAL_ENV_FILE}" R2_ACCESS_KEY_ID)" \
  AWS_SECRET_ACCESS_KEY="$(env_file_value "${PORTAL_ENV_FILE}" R2_SECRET_ACCESS_KEY)" \
    aws --endpoint-url "$(env_file_value "${PORTAL_ENV_FILE}" R2_ENDPOINT)" "$@"
}

DUMP_FILE=""
DOWNLOADED=""
cleanup() {
  [[ -n "${DOWNLOADED}" ]] && rm -f "${DOWNLOADED}"
  if [[ "${KEEP_DRILL_DB:-}" != "1" ]]; then
    psql "${ADMIN_URI}" -qc "DROP DATABASE IF EXISTS ${DRILL_DB} WITH (FORCE)" > /dev/null 2>&1 || true
  fi
}
trap cleanup EXIT

case "${1:-}" in
  "")
    [[ -r "${PORTAL_ENV_FILE}" ]] || { log "${PORTAL_ENV_FILE} is not readable"; exit 1; }
    log "available portal backups:"
    r2 s3 ls "s3://$(env_file_value "${PORTAL_ENV_FILE}" R2_BUCKET)/portal-backups/" | sort
    exit 0
    ;;
  --file)
    DUMP_FILE="${2:?--file needs a path}"
    [[ -r "${DUMP_FILE}" ]] || { log "${DUMP_FILE} is not readable"; exit 1; }
    ;;
  *)
    [[ -r "${PORTAL_ENV_FILE}" ]] || { log "${PORTAL_ENV_FILE} is not readable"; exit 1; }
    DOWNLOADED="/tmp/cleanstart-portal-drill-$(date -u +%s).dump"
    DUMP_FILE="${DOWNLOADED}"
    log "downloading portal-backups/$1.dump..."
    r2 s3 cp "s3://$(env_file_value "${PORTAL_ENV_FILE}" R2_BUCKET)/portal-backups/$1.dump" "${DUMP_FILE}"
    ;;
esac

START=$(date -u +%s)
log "creating scratch database ${DRILL_DB}"
psql "${ADMIN_URI}" -qc "DROP DATABASE IF EXISTS ${DRILL_DB} WITH (FORCE)" -c "CREATE DATABASE ${DRILL_DB}"

log "restoring ${DUMP_FILE}"
pg_restore --no-owner --no-privileges --exit-on-error -d "${DRILL_URI}" "${DUMP_FILE}"

log "checking restored data"
for table in ${TABLES}; do
  [[ "${table}" =~ ^[a-z_][a-z0-9_]*$ ]] || { log "bad table name '${table}'"; exit 1; }
  count=$(psql "${DRILL_URI}" -Atqc "SELECT count(*) FROM ${table}")
  log "  ${table}: ${count} rows"
done
if psql "${DRILL_URI}" -Atqc "SELECT 1 FROM information_schema.tables WHERE table_name = 'audit_log'" | grep -q 1; then
  log "  newest audit_log entry: $(psql "${DRILL_URI}" -Atqc "SELECT coalesce(max(at)::text, 'none') FROM audit_log")"
fi

log "drill passed in $(( $(date -u +%s) - START )) seconds. Add a line to docs/operations/RESTORE-LOG.md."
```

`chmod +x infra/scripts/restore-portal-drill.sh`.

- [ ] **Step 4: Run the local test**

The test creates two scratch databases on your own Postgres, stubs `aws` (it copies into a temp folder) and `curl` (it logs the heartbeat), and checks 17 things: both scripts pass `bash -n`; a dry run does nothing; both dumps land in their own buckets and exactly one heartbeat follows; temp files are removed; a failed portal upload fails the run with no heartbeat; a missing portal database warns, skips and still pings; the CMS bucket, an incomplete env file and a bad database name are all refused with no heartbeat; the drill restores into a scratch database, counts rows and drops it, refuses the live name and needs `ALLOW_RESTORE`. Save it as `/tmp/backup-local-test.sh` and run it from the repository root:

```bash
#!/usr/bin/env bash
# Local test of infra/scripts/backup.sh and infra/scripts/restore-portal-drill.sh against scratch databases on your
# own Postgres, with stub `aws` and `curl` programs that write into a temp folder. Touches no R2, no network, no
# droplet, no real data.
# Needs: psql, pg_dump, pg_restore, and a local Postgres where the user `postgres` connects without a password.
# Run from the repository root:  bash /tmp/backup-local-test.sh
set -euo pipefail

REPO="$(git rev-parse --show-toplevel)"
BACKUP="${REPO}/infra/scripts/backup.sh"
DRILL="${REPO}/infra/scripts/restore-portal-drill.sh"
WORK="$(mktemp -d)"
PG=(psql -h localhost -U postgres -d postgres -q)
CMS_DB=p06bk_cms
PORTAL_DB=p06bk_portal
pass() { echo "ok: $*"; }
fail() { echo "FAIL: $*" >&2; exit 1; }
# expect "description" command args...   (passes when the command succeeds)
expect() { local desc="$1"; shift; if "$@"; then pass "${desc}"; else fail "${desc}"; fi; }
# refuse "description" command args...   (passes when the command fails)
refuse() { local desc="$1"; shift; if "$@" >/dev/null 2>&1; then fail "${desc}"; else pass "${desc}"; fi; }

cleanup() {
  "${PG[@]}" -c "DROP DATABASE IF EXISTS ${CMS_DB}" -c "DROP DATABASE IF EXISTS ${PORTAL_DB}" -c "DROP DATABASE IF EXISTS p06bk_drill" >/dev/null 2>&1 || true
  rm -rf "${WORK}"
}
trap cleanup EXIT

mkdir -p "${WORK}/bin" "${WORK}/out"
cat > "${WORK}/bin/aws" <<'SHIM'
#!/usr/bin/env bash
# stub: aws s3 cp --endpoint-url URL FILE s3://bucket/key -> $SHIM_DIR/bucket/key; a bucket named in SHIM_FAIL_BUCKET fails
set -euo pipefail
src=""; dst=""; skip=0
for a in "$@"; do
  if [[ ${skip} -eq 1 ]]; then skip=0; continue; fi
  case "$a" in
    s3|cp) ;;
    --endpoint-url) skip=1;;
    s3://*) dst="${a#s3://}";;
    *) src="$a";;
  esac
done
if [[ -n "${SHIM_FAIL_BUCKET:-}" && "${dst}" == "${SHIM_FAIL_BUCKET}/"* ]]; then exit 7; fi
mkdir -p "${SHIM_DIR}/$(dirname "${dst}")"
cp "${src}" "${SHIM_DIR}/${dst}"
SHIM
cat > "${WORK}/bin/curl" <<'SHIM'
#!/usr/bin/env bash
echo "$*" >> "${SHIM_DIR}/heartbeats.log"
SHIM
chmod +x "${WORK}/bin/aws" "${WORK}/bin/curl"

"${PG[@]}" -c "DROP DATABASE IF EXISTS ${CMS_DB}" -c "DROP DATABASE IF EXISTS ${PORTAL_DB}" -c "CREATE DATABASE ${CMS_DB}" -c "CREATE DATABASE ${PORTAL_DB}" 2>/dev/null
psql -h localhost -U postgres -d "${CMS_DB}" -q -c "create table t(a int); insert into t values (1)"
psql -h localhost -U postgres -d "${PORTAL_DB}" -q -c "create table audit_log(id int, at timestamptz default now()); insert into audit_log(id) values (1),(2),(3)"
printf 'R2_ENDPOINT=https://portal.example\nR2_BUCKET=portal-private\nR2_ACCESS_KEY_ID=portalkey\nR2_SECRET_ACCESS_KEY=secret with spaces\n' > "${WORK}/portal.env"
printf 'R2_ENDPOINT=https://cms.example\nR2_BUCKET=cms-public\nR2_ACCESS_KEY_ID=a\nR2_SECRET_ACCESS_KEY=b\n' > "${WORK}/same-bucket.env"
printf 'R2_BUCKET=only-this\n' > "${WORK}/partial.env"

export PATH="${WORK}/bin:${PATH}" SHIM_DIR="${WORK}/out"
export DATABASE_URI="postgres://postgres@localhost:5432/${CMS_DB}" R2_ENDPOINT=https://cms.example R2_ACCESS_KEY_ID=cmskey \
  R2_SECRET_ACCESS_KEY=cmssecret R2_BUCKET=cms-public PORTAL_DB_NAME="${PORTAL_DB}" PORTAL_ENV_FILE="${WORK}/portal.env" \
  BETTERSTACK_HEARTBEAT_URL="https://heartbeat.example/beat"
beats() { if [[ -f "${SHIM_DIR}/heartbeats.log" ]]; then wc -l < "${SHIM_DIR}/heartbeats.log" | tr -d ' '; else echo 0; fi; }
dumps() { find "${SHIM_DIR}/$1" -name '*.dump' 2>/dev/null | wc -l | tr -d ' '; }

expect "bash -n on both scripts" bash -c "bash -n '${BACKUP}' && bash -n '${DRILL}'"

DRY_RUN=1 bash "${BACKUP}" >/dev/null 2>&1
expect "dry run does nothing and pings nothing" test "$(beats)" = 0

bash "${BACKUP}" >/dev/null 2>&1
expect "the CMS dump goes to the CMS bucket" test "$(dumps cms-public/backups)" = 1
expect "the portal dump goes to its own private bucket" test "$(dumps portal-private/portal-backups)" = 1
expect "one heartbeat after both dumps" test "$(beats)" = 1
expect "temp files are removed" test -z "$(ls /tmp/cleanstart-*.dump 2>/dev/null || true)"

refuse "a failed portal upload fails the run" env SHIM_FAIL_BUCKET=portal-private bash "${BACKUP}"
expect "and sends no heartbeat" test "$(beats)" = 1

OUT="$(PORTAL_DB_NAME=p06bk_absent bash "${BACKUP}" 2>&1)"
expect "no portal database yet: it warns and skips" grep -q "skipping the portal dump" <<<"${OUT}"
expect "and the CMS only run still pings" test "$(beats)" = 2

refuse "the CMS bucket is refused for the portal dump" env PORTAL_ENV_FILE="${WORK}/same-bucket.env" bash "${BACKUP}"
refuse "an incomplete portal env file fails" env PORTAL_ENV_FILE="${WORK}/partial.env" bash "${BACKUP}"
refuse "a bad database name fails" env "PORTAL_DB_NAME=x';drop" bash "${BACKUP}"
expect "none of those three pinged" test "$(beats)" = 2

DUMP="$(find "${SHIM_DIR}/portal-private/portal-backups" -name '*.dump' | head -1)"
export ALLOW_RESTORE=yes PORTAL_DRILL_DB=p06bk_drill PORTAL_DRILL_TABLES=audit_log
OUT="$(bash "${DRILL}" --file "${DUMP}" 2>&1)"
expect "the drill restores the dump into a scratch database and counts its rows" grep -q "audit_log: 3 rows" <<<"${OUT}"
expect "and drops the scratch database" test "$("${PG[@]}" -Atc "select count(*) from pg_database where datname = 'p06bk_drill'")" = 0
refuse "the drill refuses the live database name" env "PORTAL_DRILL_DB=${PORTAL_DB}" bash "${DRILL}" --file "${DUMP}"
refuse "the drill needs ALLOW_RESTORE=yes" env ALLOW_RESTORE=no bash "${DRILL}"
echo "ALL OK"
```

```bash
shellcheck /tmp/backup-local-test.sh infra/scripts/backup.sh infra/scripts/restore-portal-drill.sh && echo SHELLCHECK_OK
bash /tmp/backup-local-test.sh 2>&1 | grep -E "^ok|^FAIL|ALL OK"
rm /tmp/backup-local-test.sh
```

Expected: `SHELLCHECK_OK`, 17 `ok:` lines and `ALL OK`. This ran in the scratch harness against Postgres 16.14 with exactly these scripts. What it cannot prove: the real `aws` download and `ls` paths of the drill (only uploads are stubbed), Cloudflare lifecycle rules, and the real heartbeat.

- [ ] **Step 5: Record what is not verified**

```bash
printf '%s\n' "$(date '+%Y-%m-%d %H:%M IST') | M5.5 | note | ORCH | - | local test ALL OK | backup.sh edited and tested locally with stub aws and curl. LIVE HEARTBEAT NOT VERIFIED: needs the droplet. Restore drill never run against real R2. Portal dump bucket and lifecycle rule for portal-backups/ not created." >> /Users/a12345/Desktop/AI/cleanstart/cleanstart-website/docs/partner-portal/PROGRESS.md
```

The report (final task) lists this under UNVERIFIED, and the handover checklist has the person steps: copy the script to `/opt/cleanstart/scripts/backup.sh`, run it with `DRY_RUN=1` and then for real, confirm the heartbeat arrives, create the lifecycle rule, run the drill, add a line to `docs/operations/RESTORE-LOG.md`.

- [ ] **Step 6: Commit**

```bash
git add infra/scripts/backup.sh infra/scripts/restore-portal-drill.sh docs/superpowers/plans/2026-11-12-partner-portal-06-admin-infra-hardening.md
git commit -m "feat(portal): M5.5 nightly backup dumps the portal database to its own bucket, restore drill script"
```

### Task M5.9: Runbook and incident template

**Gate A for this task:** the dash check on the two docs (the one-liner in Conventions) and a read-through that every command in the runbook names a real file, service or script in the repo.

**Files:**
- Modify: `docs/operations/PARTNER-PORTAL.md` (M0.6 wrote sections 1 to 3; this adds 4 to 11)
- Modify: `docs/operations/INCIDENTS.md` (an entry template for the portal; CCR-6)

- [ ] **Step 1: Append sections 4 to 11 to `docs/operations/PARTNER-PORTAL.md`**

````markdown
## 4. What runs where

| Thing | Where | Notes |
|---|---|---|
| Portal app | container `cleanstart-portal-1`, image `portal:current`, `127.0.0.1:3004` | Next.js standalone, 512 MB limit, runs migrations on start |
| Reverse proxy | Caddy on the host, `partners.cleanstart.com` | logs `/var/log/caddy/portal-access.log` |
| Database | `cleanstart_portal` in the compose Postgres | roles `portal_owner` (migrations) and `portal_app` (runtime, row level security applies to it) |
| Env file | `/opt/cleanstart/portal.env`, mode 600 | rendered by the deploy workflow, never edited by hand |
| Documents | private R2 bucket `cleanstart-partner-docs` | presigned links that live 60 seconds |
| Email | Brevo, sender name `CleanStart Partners` (set in code) | |
| Deals | HubSpot, pipeline "Partner deals" | `docs/partner-portal/HUBSPOT-PROVISIONING.md` |
| Background jobs | inside the app process (`PORTAL_JOBS_ENABLED=true`) | no cron entries, no HTTP endpoints |
| Errors | Sentry project for the portal | |

## 5. Health and monitoring

- `https://partners.cleanstart.com/api/health` answers `{"status":"ok"}` (200) when the process is up and the database answers, `503` otherwise. The review password does not apply to it.
- On the droplet: `docker compose -f /opt/cleanstart/compose.yml ps portal`, `docker logs --tail 100 cleanstart-portal-1`, `docker stats --no-stream cleanstart-portal-1`.
- Add to BetterStack (same as the CMS monitors): an HTTP probe on the health URL, memory over 85 percent for 5 minutes, disk under 20 percent, and the backup heartbeat (section 9).
- In the app: the Audit log screen (partner manager) shows the HubSpot sync health card: waiting, failed, last check, last error.
- Postgres connections: `docker compose -f /opt/cleanstart/compose.yml exec -T postgres psql -U postgres -c "select usename, count(*) from pg_stat_activity group by 1"`. The portal uses up to 14 (request pool 6 plus system pool 8); the CMS up to 15; `max_connections` must be 50 (section 1.3).

## 6. Background jobs

All run in the portal process, one run at a time through a Postgres advisory lock named after the job, in UTC. Logs are JSON lines with a `job` field: `docker logs cleanstart-portal-1 2>&1 | grep '"job":"retention"'`.

| Job | Schedule | Does |
|---|---|---|
| `hubspot-outbox` | every minute | sends queued changes to HubSpot (20 per batch, retries with back off, the sixth failure marks the row failed) |
| `hubspot-poll` | every 5 minutes | reads stage and end date changes from HubSpot |
| `hubspot-reconcile` | 02:30 | flags deals that no longer exist in HubSpot |
| `expiry` | 00:10 | expires accepted registrations past their protection end |
| `expiry-reminders` | 05:00 | emails partners 14 and 3 days before protection ends |
| `website-intake` | every 5 minutes | imports Become a Partner form entries from the CMS (does nothing until the CMS API key is set) |
| `document-purge` | 03:20 | deletes replaced files 30 days after replacement and files of deleted documents |
| `retention` | 03:40 | deletes declined applications and rejected registrations 365 days after the decision |

If a job stops: check `docker logs` for its name, check the container was not restarted (`docker ps`), and check that `PORTAL_JOBS_ENABLED=true` is in `portal.env`. A job that throws is logged and sent to Sentry; the next tick runs it again.

## 7. HubSpot

- HubSpot owns a deal after approval. The portal writes through an outbox, so approvals never wait for HubSpot. If HubSpot is down, approvals keep working and the Audit log health card shows "Waiting to send" growing; when HubSpot is back the queue drains by itself and nothing is duplicated.
- "Failed" greater than zero means a change failed six times. Read the last error on the card, fix the cause (a revoked token, a renamed property), then press "Retry failed syncs" (partner manager). Each retry writes an audit entry.
- Rotating the token: create a new private app token in HubSpot, update the `PORTAL_HUBSPOT_TOKEN` GitHub secret, run the deploy workflow. The webhook secret works the same way (`PORTAL_HUBSPOT_WEBHOOK_SECRET`, and the same value in the HubSpot webhook subscription).
- Provisioning and the production checklist are in `docs/partner-portal/HUBSPOT-PROVISIONING.md`.

## 8. Email

Brevo sends everything; the sender name is fixed in code (`CleanStart Partners`). If a person does not receive an invite: check spam, then `docker logs cleanstart-portal-1 2>&1 | grep -i brevo`, then Brevo's blocklist (an address on it is silently dropped; the CMS has had this happen to `hr@`). Invites can be re-sent from the Team screen; the old link stops working when a new one is sent.

## 9. Backups and restore

The nightly cron (02:00 UTC, `/etc/cron.d/cleanstart-backup` through `run-backup.sh`) runs `/opt/cleanstart/scripts/backup.sh`, which dumps the CMS database to `backups/<UTC timestamp>.dump` in the CMS bucket and, once it exists, `cleanstart_portal` to `portal-backups/<UTC timestamp>.dump` in the private bucket named in `/opt/cleanstart/portal.env`. The BetterStack heartbeat is pinged only after both dumps and uploads succeeded: a missing heartbeat means at least one backup did not happen, so look at the cron log first.

After any change to `backup.sh`: copy it to `/opt/cleanstart/scripts/`, run `DRY_RUN=1 /opt/cleanstart/scripts/backup.sh`, then run it for real, confirm both keys appear in R2 and that the heartbeat monitor shows a ping.

Restore drill (do it before launch, then every quarter; it never touches the live database):

```bash
cd /opt/cleanstart
set -a; . ./.env; set +a        # not used for the portal credentials, only DATABASE_URI for the superuser connection
export DATABASE_URI="postgres://postgres:${POSTGRES_PASSWORD}@127.0.0.1:5432/cleanstart"
ALLOW_RESTORE=yes ./scripts/restore-portal-drill.sh                      # lists portal backups
ALLOW_RESTORE=yes ./scripts/restore-portal-drill.sh 2026-12-01T02:00:00Z # restores one into cleanstart_portal_drill and checks it
```

Expected: row counts per table and the newest audit log time, "drill passed in N seconds", the scratch database dropped. Add a line to `docs/operations/RESTORE-LOG.md` (date, backup, duration, who).

A real restore (the live database is damaged). The drill proves the dump is readable and complete; it does not prove this swap, so rehearse these steps once on the droplet before launch and write down anything that differs. The intended path keeps ownership, grants and row level security exactly as the migrations make them, by restoring only the data into a freshly migrated database:

1. Snapshot the droplet. Stop the portal: `docker compose --profile portal stop portal`.
2. Create a new empty database with the bootstrap script (the roles already exist): `psql -v ON_ERROR_STOP=1 -v dbname=cleanstart_portal_new -v owner_password=x -v app_password=x -v conn_limit=20 -v allow_createdb=off -f db-bootstrap.sql` (the two passwords are ignored for roles that exist).
3. Run the migrations against it with the image you deployed: `docker compose run --rm --no-deps -e DATABASE_OWNER_URL=postgres://portal_owner:<owner password>@postgres:5432/cleanstart_portal_new portal node scripts/migrate.cjs`.
4. Load the data as the superuser, with triggers disabled for the load (the audit log is append only by trigger): download the dump (the drill script's download step) and run `pg_restore --data-only --disable-triggers --no-owner -d postgres://postgres:<password>@127.0.0.1:5432/cleanstart_portal_new <dump>`.
5. Check row counts against the drill output, then swap: `ALTER DATABASE cleanstart_portal RENAME TO cleanstart_portal_broken; ALTER DATABASE cleanstart_portal_new RENAME TO cleanstart_portal;` (no connections may be open), start the portal, run the section 5 checks.

Anything written after the dump is gone: the HubSpot poll and outbox reconcile deals, but approvals taken in that window must be done again by staff. Keep `cleanstart_portal_broken` until the partner manager has confirmed the data.

## 10. Data retention and privacy

| Data | Kept | Then |
|---|---|---|
| Declined applications | 365 days from the decision | deleted by `retention` |
| Rejected registrations, with contacts, messages and timeline | 365 days from the decision | deleted by `retention` |
| Replaced document files | 30 days | deleted by `document-purge` |
| Deleted documents | 30 days | file deleted, the row stays as a tombstone so the audit log still makes sense |
| Accepted, won, lost, expired registrations; approved applications | for the life of the partnership | not purged in v1 |
| People (users) | never deleted; a removed person is `disabled` and their deals stay with the company | |
| Audit log | append only, no one can edit or delete a row through the app | retention rule is an open decision |

Requests to erase a person's data are not automated in v1. Do not run ad hoc SQL against the production database; raise it with the privacy owner, who decides what the audit log and the partner's records must keep.

## 11. Common problems

| Symptom | First checks | Fix |
|---|---|---|
| Site down, Caddy answers 502 | `docker compose ps portal`, `docker logs --tail 100 cleanstart-portal-1` | container exited: read the last error. A bad env value stops the app at start and names the variable. Roll back (section 3) if a deploy caused it |
| Health 503 | `docker compose ps postgres`, connection count (section 5) | Postgres down or out of connections; restart the portal after Postgres is healthy |
| Everyone signed out | did `PORTAL_AUTH_SECRET` change, was the container recreated with a new one | expected after a rotation; users sign in again |
| Partner cannot sign in | the user's status and the partner's status (read only query below) | `disabled` or `suspended` partners see the same message as a wrong password, on purpose. Restore the partner from Admin, Partners |
| Deal stuck "Awaiting review" after approval | Audit log health card, `docker logs ... | grep hubspot` | failed outbox rows: fix the cause, Retry |
| Stage in the portal differs from HubSpot | last HubSpot check on the card | the poll runs every 5 minutes; if "last check" is old, look at the `hubspot-poll` job log and the token |
| Emails not arriving | section 8 | |
| Disk full | `df -h`, `docker system df` | `docker image prune -f`; old images are pruned by the deploy; Caddy logs roll at 10 MB |
| High memory | `docker stats` | the container is capped at 512 MB with a 384 MB heap; repeated restarts mean a leak: capture the logs and open an incident entry |

Read only queries (superuser, bypasses row level security, so never paste results into a ticket without removing personal data):

```bash
cd /opt/cleanstart
docker compose exec -T postgres psql -U postgres -d cleanstart_portal -c "select status, count(*) from hubspot_outbox group by 1"
docker compose exec -T postgres psql -U postgres -d cleanstart_portal -c "select op, subject_id, attempts, left(last_error, 120) from hubspot_outbox where status = 'failed' order by updated_at desc limit 10"
docker compose exec -T postgres psql -U postgres -d cleanstart_portal -c "select key, updated_at from hubspot_sync_state"
docker compose exec -T postgres psql -U postgres -d cleanstart_portal -c "select u.email, u.status, p.status as partner_status from users u left join partners p on p.id = u.partner_id where lower(u.email) = lower('person@example.com')"
```

Secrets and where they rotate: `PORTAL_AUTH_SECRET` (signs everyone out), database passwords (`ALTER ROLE portal_app PASSWORD '...'` as the superuser, update the GitHub secret, deploy), HubSpot token and webhook secret (section 7), `BREVO_API_KEY` (shared with the CMS, rotate both), R2 keys (the private bucket token only), Turnstile secret, Sentry DSN, `PORTAL_REVIEW_PASSWORD` (the pilot gate). All live in GitHub secrets; a deploy writes them to `portal.env`.
````

- [ ] **Step 2: Add the incident template to `docs/operations/INCIDENTS.md`**

Insert this block directly under the paragraph that starts "**Format:**" (above the first dated entry). It adds the portal's extra fields and a copy-paste entry; the existing entries and the "newest first" rule do not change.

````markdown
> **Partner portal entries (`apps/portal`).** Name the layer in **Area**: screen, server action, repo, job, HubSpot sync, deploy, database, proxy or Caddy. Add **Impact** (which partners or staff, how many, for how long), **Detection** (alert or person, and how long it was broken before anyone knew), and **Data** (was any partner data wrong, lost or exposed, and what was done about the audit log and the HubSpot outbox). A cross-tenant leak, a wrong approval or a lost registration is always an incident, even if it was fixed in minutes.

Copy this for a new entry, newest first:

```markdown
## YYYY-MM-DD - one line: what the user saw

- **Area:** `apps/portal` - layer (screen | server action | repo | job | HubSpot sync | deploy | database | proxy or Caddy), file or job name.
- **Symptom:** what a partner or staff member saw, with the time it started and stopped.
- **Impact:** who and how many; whether any partner could see or change another partner's data.
- **Detection:** how it was noticed and how long it ran before that.
- **Root cause:** the actual cause, one or two sentences, with the evidence that proves it (log line, query, commit).
- **Fix:** what changed (commit or PR), and any one-off data repair (what was run, by whom, in a transaction or not).
- **Data:** records wrong, lost or exposed; HubSpot deals that needed repair; whether the audit log shows it.
- **Status:** Fixed and verified | Fixed, verification pending | Mitigated | Open.
- **Reusable lesson:** the part that generalises beyond this bug.
```
````

- [ ] **Step 3: Check the runbook against the repo**

```bash
for f in infra/docker-compose.yml infra/scripts/backup.sh infra/scripts/restore-portal-drill.sh infra/scripts/run-backup.sh apps/portal/scripts/db-bootstrap.sql .github/workflows/deploy-portal.yml docs/partner-portal/HUBSPOT-PROVISIONING.md; do [ -e "$f" ] && echo "ok  $f" || echo "MISSING  $f"; done
node -e "const d=new RegExp('['+String.fromCharCode(8211,8212)+']');let bad=0;for(const f of process.argv.slice(1)){require('fs').readFileSync(f,'utf8').split('\n').forEach((l,i)=>{if(d.test(l)){console.log(f+':'+(i+1));bad=1}})}process.exit(bad)" docs/operations/PARTNER-PORTAL.md docs/operations/INCIDENTS.md
```

Expected: `ok` for every path (if `HUBSPOT-PROVISIONING.md` is MISSING, track H has not written it: list it in the report) and no dash output.

- [ ] **Step 4: Commit**

```bash
git add docs/operations/PARTNER-PORTAL.md docs/operations/INCIDENTS.md docs/superpowers/plans/2026-11-12-partner-portal-06-admin-infra-hardening.md
git commit -m "feat(portal): M5.9 partner portal runbook and incident entry template"
```



### Task V: Final verification (HubSpot section 6) and the overnight report

**Gate A for this task:** the standard block on `feat/portal-build`, the E2E suite, the dependency audit, `docker build --check`, `actionlint`, `shellcheck`, the local backup test, and a report whose every row is a pasted result.

**Files:**
- Create: `docs/partner-portal/OVERNIGHT-REPORT.md`
- Tag: `portal-w2` on the last good commit

The orchestrator writes this report at the end of the run (BUILD-HANDOFF, "Morning report"). Nothing here is pushed.

- [ ] **Step 1: Run every check once, on the final tree, and keep the output**

```bash
pnpm --filter @cleanstart/portal lint
pnpm --filter @cleanstart/portal typecheck
pnpm --filter @cleanstart/portal test
until mkdir /tmp/portal-build.lock 2>/dev/null; do sleep 15; done
pnpm --filter @cleanstart/portal build; BUILD_STATUS=$?
rmdir /tmp/portal-build.lock
[ "$BUILD_STATUS" -eq 0 ]
pnpm --filter @cleanstart/portal exec playwright test
node apps/portal/scripts/audit-portal.mjs
node apps/portal/scripts/verify-copy.mjs
actionlint .github/workflows/portal.yml .github/workflows/deploy-portal.yml
shellcheck infra/scripts/backup.sh infra/scripts/restore-portal-drill.sh
REPO="$(git rev-parse --show-toplevel)"; rm -rf /tmp/p06ctx && mkdir -p /tmp/p06ctx/apps/portal && cp "$REPO/apps/portal/Dockerfile" /tmp/p06ctx/apps/portal/
(cd /tmp/p06ctx && docker build --check -f apps/portal/Dockerfile .); rm -rf /tmp/p06ctx
```

Expected: every command exits 0, `pnpm test` includes the isolation matrix and every suite from this plan, Playwright reports 64 passed (45 desktop, 19 mobile). Any failure stops this task: fix it in the owning task, rerun, and note it in the report.

- [ ] **Step 2: Run the HubSpot plan's section 6 checklist**

HubSpot plan section 6 has ten lines. Most need a live HubSpot, which this run does not have, so each line is answered with the automated evidence that exists and an honest status. Run the evidence commands:

```bash
pnpm --filter @cleanstart/portal exec vitest run src/server/hubspot src/server/jobs src/app/api/hubspot src/server/repo/integration-health.test.ts src/server/repo/isolation.test.ts
pnpm --filter @cleanstart/portal exec playwright test e2e/journey.spec.ts e2e/admin.spec.ts --project=desktop
```

Then record each line in the report with one of three statuses: **PASS (automated)** when a named test proves the whole line; **PARTIAL (automated)** when tests prove the portal's half and the live half is missing; **UNVERIFIED (needs live HubSpot)**. The expected mapping, to be confirmed against the actual test names:

| Section 6 line | Evidence | Expected status |
|---|---|---|
| Approve a registration: a deal appears in the Partner deals pipeline with the right name, product, region, protection end, partner company, customer company, contact | H4.6 handler tests (properties, associations) and `journey.spec.ts` "the approval reaches HubSpot" (one deal, id stored) against `FakeHubspot` | PARTIAL (automated); the real pipeline view is UNVERIFIED |
| Move the deal through every stage: partner sees it within 5 minutes, Closed won shows Won | H4.3 mapper and H4.8 poll tests, `journey.spec.ts` stage change visible on the partner page, `registry.test.ts` poll schedule `*/5 * * * *` | PARTIAL (automated) |
| Grant an extension: HubSpot's end date changes | R's extension tests and H's `registration.update_end` handler test | PARTIAL (automated) |
| Registration passes its end date: nightly job expires it and the deal moves to Registration expired | H4.8 `expireRegistrations` tests, `registry.test.ts` expiry schedule | PARTIAL (automated) |
| Switch HubSpot off: approvals still work, backlog grows, drains with no duplicates after restore | H4.4 outbox retry tests, and the whole E2E run: approvals work with no HubSpot token at all | PARTIAL (automated); revoking a live token is UNVERIFIED |
| Approve the same registration twice by double click: one deal | idempotency key tests (H4.4 `enqueue`), R's `acceptRegistration` `already_decided` test | PASS (automated) |
| Accept, undo, accept again before the deal exists: one deal, second accept queued its own create | R's undo tests (version is the decision time) and H4.4 key tests | PASS (automated) |
| Token unset (development): approvals work, jobs log "HubSpot is not configured", webhook answers 503 | H job tests with a null config, the webhook route test, and the E2E journey (runs with no token) | PASS (automated) |
| The 6 existing deals in the default Sales Pipeline are untouched | provisioning script is dry-run first (H4.1) and never writes to the default pipeline | UNVERIFIED (needs live HubSpot) |
| A partner user cannot read another partner's deal through the customer lookup, the deal page or the thread | isolation matrix (`getRegistration`, `listMessages`, `customerSuggestions`), `search.test.ts`, `e2e/admin.spec.ts` search isolation | PASS (automated) |

- [ ] **Step 3: Write `docs/partner-portal/OVERNIGHT-REPORT.md`**

Use this template. Every table row is filled from a command, never from memory. The commands that fill the first three tables read the progress log (columns: `time | task | event | track | sha | gates | note`):

```bash
LOG=/Users/a12345/Desktop/AI/cleanstart/cleanstart-website/docs/partner-portal/PROGRESS.md
awk -F' [|] ' '$3=="done"{printf "| %s | %s | %s | %s |\n", $2, $5, $6, $7}' "$LOG"                      # tasks done
awk -F' [|] ' '$3=="blocked"{printf "| %s | %s | %s |\n", $2, $4, $7}' "$LOG"                           # tasks blocked
grep -iE 'UNVERIFIED|PROVISIONAL|NOT VERIFIED' "$LOG" | awk -F' [|] ' '{printf "| %s | %s |\n", $2, $7}'  # unverified items
git tag --list 'portal-*'; git log --oneline -1
```

````markdown
# Partner portal overnight build report

Written on <date> by <session>. Branch `feat/portal-build`, last good tag `portal-w2` at `<short sha>`. Nothing was pushed.

## Summary

Three or four sentences: what works end to end, what does not, what a person must do next.

## Tasks done

| Task | Commit | Gates | Note |
|---|---|---|---|
(output of the first awk command)

## Tasks blocked

| Task | Track | What it needs |
|---|---|---|
(output of the second command; "none" if empty)

## UNVERIFIED and PROVISIONAL

| Item | Why it could not be verified |
|---|---|
(output of the third command, plus every item in "Known unknowns" of plan 06 that was not resolved, plus: Docker image built end to end on CI; workflows run on GitHub; Caddy, Cloudflare and the droplet firewall; the live backup heartbeat and a restore from real R2; Google and Microsoft sign in; real Brevo send; real R2 upload; HubSpot against a live portal; screen reader testing)

## HubSpot verification checklist (HubSpot plan section 6)

| Line | Status | Evidence |
|---|---|---|
(ten rows from Task V step 2)

## Security pass

Link to `docs/partner-portal/SECURITY-PASS.md`. State: Next.js bumped for the portal to <version>; audit result line; the two findings for other owners (`apps/cms` and `apps/web` still on 16.2.5 with the same advisories; Postgres `max_connections = 20` cannot hold the CMS and the portal).

## Accessibility pass

Link to `docs/partner-portal/A11Y-PASS.md`. State the axe result on desktop and mobile and what was not covered (screen readers, zoom, forced colors).

## Gate B findings deferred

| Task | Finding | Why deferred | Owner |
|---|---|---|---|
(from the progress log notes, or "none")

## Run it locally

```bash
bash apps/portal/scripts/db-create.sh cleanstart_portal
pnpm --filter @cleanstart/portal db:migrate && pnpm --filter @cleanstart/portal db:seed
pnpm --filter @cleanstart/portal exec next dev --port 3204
```

Sign in as any seeded user (emails and the shared development password are in `apps/portal/src/db/fixtures.ts`).

## What a person must do next

Link to the "Handover checklist for a person" section of plan 06, with the three that block the pilot named first.
````

- [ ] **Step 4: Tag and commit**

```bash
git add docs/partner-portal/OVERNIGHT-REPORT.md docs/superpowers/plans/2026-11-12-partner-portal-06-admin-infra-hardening.md
git commit -m "feat(portal): final verification and overnight report"
git tag portal-w2
```

Append the `done` line, then stop. The orchestrator tells the product owner the report is ready.

---

# Handover checklist for a person

Everything below needs a human, a credential, the droplet or a decision. None of it was done, tried or simulated by this plan. Items 1 to 6 block the pilot; M5.6 (pilot), M5.7 (production provisioning) and M5.8 (cutover) follow them.

1. **Droplet, in this order** (`docs/operations/PARTNER-PORTAL.md` section 1, read each command first): snapshot; resize one size up; raise Postgres `max_connections` from 20 to 50 (the CMS pool is 15, the portal 14; this needs a Postgres restart and the operator's approval); create `portal_owner`, `portal_app` and the `cleanstart_portal` database with `scripts/db-bootstrap.sql` and passwords from `openssl rand -hex 24`; compare and copy `infra/docker-compose.yml` to `/opt/cleanstart/compose.yml`; add the Caddy block and reload; `ufw` to accept 443 from Cloudflare only.
2. **DNS and Cloudflare:** the `partners` record (proxied, SSL Full strict) and the WAF rule set `cms.cleanstart.com` has. A Turnstile widget for `partners.cleanstart.com` (site key to a GitHub variable, secret to a GitHub secret).
3. **GitHub:** every variable and secret in runbook section 2, then set `PORTAL_DEPLOY_ENABLED=true` and run the deploy workflow once by hand (`workflow_dispatch`). Check the first Portal CI run on GitHub (the workflows have never run) and the first Docker build there.
4. **Real keys:** the private R2 bucket `cleanstart-partner-docs` with a token scoped to it only, the Sentry project and DSN, Brevo (verified sender, droplet address allowed), the CMS service user and its API key for the website intake job.
5. **HubSpot:** the capability check (master task M0.1), the production private app, the provisioning dry run and then apply (`docs/partner-portal/HUBSPOT-PROVISIONING.md`), the webhook subscription, the pipeline id into a GitHub variable. Explicit go-ahead before anything touches production HubSpot.
6. **Backups:** copy `infra/scripts/backup.sh` to `/opt/cleanstart/scripts/`, `DRY_RUN=1` then a real run, confirm both keys in R2 and the heartbeat ping, create the lifecycle rule for `portal-backups/` on the private bucket, run `restore-portal-drill.sh`, rehearse the real restore path (runbook section 9), add a line to `docs/operations/RESTORE-LOG.md`.
7. **OAuth apps** for Google and Microsoft sign in (development and production). The provider code is behind environment variables and was never proven.
8. **Legal:** the partner agreement text and its version label (`PARTNER_AGREEMENT_VERSION`); until then invite screens show `draft-0`.
9. **Decisions:** the deal rules the proposal lists as open (`src/lib/deal-rules.ts`); audit log retention; erasure requests (runbook section 10); who may add CleanStart teammates (the build gives it to the partner manager only).
10. **Other apps:** `apps/cms` and `apps/web` are on Next.js 16.2.5 with the same critical advisories the portal had. Their owner decides the upgrade.
11. **Screen reader pass** (30 minutes, VoiceOver or NVDA) before partners log in.
12. **Launch:** after the pilot, remove `PORTAL_REVIEW_PASSWORD` from GitHub secrets and redeploy; the `/deal-registration` redirect (M5.8); consider running migrations as a one-shot job so the app container no longer holds `DATABASE_OWNER_URL` (CCR-5).

---

# Contract change requests

**Integration review resolution (13 November 2026).** Every request below was decided; the contracts and the plans were edited accordingly, so the request text is kept only as the record of what was asked.

| # | Decision | Reason and where it landed |
|---|---|---|
| CCR-1 | Accept | Written in plan 01 M0.2 Step 5b (W0-a), so the A track needs no request; M5.1 supersedes it in Wave 2 (contracts K.3). |
| CCR-2 | Accept | Written in plan 02 M1.1e (with a test); M5.1 replaces it with the open path list. |
| CCR-3 | Accept | Applied by W2-a Step 0 (M5.4) after plan 04 CCR 5; M4.3 now logs a `note`, not `blocked`. |
| CCR-4 | Accept | Wave 2 edits `package.json` and `tsconfig.json` serially (contracts K.3). The Next bump is for the portal only; `apps/cms` and `apps/web` have the same advisories (open item for the user). |
| CCR-5 | Modify | (a) accepted: the `env.ts` comment now says the gate stays until launch. (b) deferred to a person: `DATABASE_OWNER_URL` stays in the container so it can migrate on start; a one-shot migration service is an open decision for the user. |
| CCR-6 | Accept | Contracts K.2 and the handoff allowed paths. |
| CCR-7 | Modify | Pools are request 6 and system 8, `CONNECTION LIMIT` 20, `max_connections` 50 (not 40): contracts C.2 and C.4, the runbook step 1.3 and U14 here. Open decision for the user. |
| CCR-8 | Reject | Not in v1; contracts M.3 item 34. |
| CCR-9 | Accept | Contracts J.2 text. |
| CCR-10 | Accept | Contracts I comment. |

Per the contracts' Contract Change rule, this plan codes against the contracts as written. What it needs changed, or what is a shared file, is listed here with the exact change. Nothing here is applied by this plan except where a Wave 2 task says it edits the file directly.

**CCR-1. `apps/portal/next.config.ts`: standalone output for the Docker image (needed by M0.6 step 12).** Owner: orchestrator on `feat/portal-build`. Replace the file with the following (it keeps `distDir` and `turbopack.root`; M5.1 later replaces it with the full version that adds the security headers):

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

**CCR-2. `apps/portal/src/proxy.ts`: the review gate must not cover `/api/health` (needed by M0.6).** Owner: orchestrator. Add as the first statement of the exported `proxy` function (after W0-f's edits, wherever the function starts):

```ts
  if (request.nextUrl.pathname === "/api/health") return NextResponse.next();
```

Without it, setting `PORTAL_REVIEW_PASSWORD` makes the Docker healthcheck, the deploy smoke probe and `compose --wait` fail with 401. M5.1 replaces this line with the `OPEN_PATHS` list (health and the HubSpot webhook).

**CCR-3. `apps/portal/src/components/shell/shell.tsx`: wire the search palette (M4.3).** Owner: orchestrator. All edits are in this one file, anchored on the mock's text (`grep -n "searchOpen\|setSearchOpen\|setQuery\|PARTNER_SEARCH\|ADMIN_SEARCH\|SearchEntry" apps/portal/src/components/shell/shell.tsx` finds every site; W0-f's persona to viewer change does not touch them):

1. Add the import: `import { OPEN_SEARCH_EVENT, SearchPalette } from "./search-palette";`
2. Delete `interface SearchEntry { ... }` (the block of four fields) and the two constants `PARTNER_SEARCH` and `ADMIN_SEARCH` (about 90 lines, from `const PARTNER_SEARCH` to the closing `};` of `ADMIN_SEARCH`). Keep `slug` (M5.4 removes it) and the `IconName` import (the notification list uses it).
3. Delete the two state lines `const [searchOpen, setSearchOpen] = useState(false);` and `const [query, setQuery] = useState("");`.
4. Replace the Escape and Ctrl K effect body so that only Escape remains (the palette owns Ctrl K itself):

```tsx
  useEffect(() => {
    const onKey = (event: KeyboardEvent): void => {
      if (event.key === "Escape") {
        setPop(null);
        setProfileOpen(false);
        setMenuOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
```

5. Delete the computation block that starts `const searchData = kind === "partner" ? PARTNER_SEARCH : ADMIN_SEARCH;` and ends with the `.filter((g) => g.items.length > 0);` of `groups`.
6. The top bar button: replace its `onClick` with the version below and add `aria-label` (it is the only name the button has on narrow screens, where the visible text is hidden; the label repeats the visible words as WCAG 2.5.3 asks):

```tsx
                aria-label={kind === "partner" ? "Search deals and documents" : "Search partners and registrations"}
                onClick={() => {
                  setPop(null);
                  window.dispatchEvent(new Event(OPEN_SEARCH_EVENT));
                }}
```

7. The Help menu item "Search the portal": replace its `onClick` body (`setPop(null); setSearchOpen(true); setQuery("");`) with `setPop(null); window.dispatchEvent(new Event(OPEN_SEARCH_EVENT));`.
8. Replace the whole block that starts `{searchOpen ? (` and ends with its matching `) : null}` (the inline palette: scrim, `dialog palette`, input, list) with:

```tsx
      <SearchPalette kind={kind} nav={nav} />
```

(`nav` is the sidebar item list the shell already computes: `PARTNER_NAV` or `ADMIN_NAV`, or `navFor(viewer)` after W0-f.) Check: the same grep as above prints nothing, and `pnpm --filter @cleanstart/portal typecheck` is clean.

**CCR-4. `apps/portal/package.json` and `tsconfig.json` (Wave 2, made directly by the tasks that need them).** E2E: devDependency `@axe-core/playwright@^4.11.3`, scripts `e2e`, `e2e:install`, `verify:copy`, `audit:deps`, and `e2e/**/*.ts` plus `playwright.config.ts` in the tsconfig `include`. M5.1: `next` to `16.4.6`. M5.4: remove `driver.js`, new `description`. Listed here so the contracts' module map and dependency list stay accurate (BUILD-HANDOFF amendment 1 says later tasks do not edit `package.json`; Wave 2 is the stated exception).

**CCR-5. Environment and container hardening (contracts I and C.5).** Owner: orchestrator, before the pilot, not blocking the build. (a) `src/env.ts` comment on `PORTAL_REVIEW_PASSWORD` says "removed in M5.4"; it stays until launch (this plan, M5.4). (b) `DATABASE_OWNER_URL` is required in production and therefore present in the app container, so a code execution bug could use it to bypass row level security. Request: drop `'DATABASE_OWNER_URL'` from the production `required` list in `env.ts`, and run migrations as a one-shot compose service (`portal-migrate`, same image, `command: node scripts/migrate.cjs`, with the owner URL in its own env file) that the deploy runs before starting `portal`, whose `CMD` becomes `node server.js`. This plan implements the contract as written (migrate on start).

**CCR-6. Module map, allowed paths and ownership (K.2 and BUILD-HANDOFF).** Add to K.2, owner A or ORCH: `src/lib/audit-filters.ts` and `src/lib/audit-csv.ts` (A, M4.2); `src/components/ui/scrim.tsx` (ORCH, M5.2); `src/server/security/{csp,limits,auth-rate-limit}.ts` and tests (ORCH, M5.1); `scripts/{bundle-migrate.mjs,verify-copy.mjs,audit-portal.mjs}` (A and ORCH); `apps/portal/Dockerfile.dockerignore` and `apps/portal/.gitignore` (A); `docs/partner-portal/{SECURITY-PASS,A11Y-PASS}.md` (ORCH). Add to the allowed paths: `infra/scripts/restore-portal-drill.sh` (M5.5) and `docs/operations/INCIDENTS.md` (M5.9, named in the master plan). Note for K.2: HubSpot plan CCR-5 already moves its runbook text to `docs/partner-portal/HUBSPOT-PROVISIONING.md`, so `docs/operations/PARTNER-PORTAL.md` is written only by M0.6 and M5.9.

**CCR-7. Database capacity (C.2, C.4 and the HubSpot plan's CCR-1).** The droplet's Postgres allows 20 connections (INCIDENTS 2026-10-14); the CMS pool takes 15; the portal needs 11 now and 14 under the HubSpot plan's proposal. Request: state in C.4 that the droplet's `max_connections` is raised to 40 before launch (runbook step 1.3) and that the sum of the CMS pool, the portal pools and 3 reserved superuser slots must stay under it. Whichever pool sizes the orchestrator approves for the HubSpot plan, record them there.

**CCR-8. Retention of declined access requests (B.6, C.3).** B.6 does not list `access_requests`, and `rls.sql` grants `DELETE` only on a fixed list that excludes it, so the 365 day rule cannot cover them. If the product owner wants declined access requests purged, add `access_requests` to the `GRANT DELETE` list and to this task's job (`purgeExpiredRecords`, one more `delete ... where status = 'declined'` with the same cutoff). Not done in v1.

**CCR-9. CI database roles (J.2).** J.2 says "In CI the Postgres service user is a superuser and `PORTAL_TEST_OWNER_URL` points at it." `portal.yml` instead creates `portal_owner` and `portal_app` with `scripts/db-create.sh` and points the owner URL at `portal_owner`, so CI runs the same role split as production. Please amend J.2.

**CCR-10. `PORTAL_JOBS_ENABLED` default in deploy.** `deploy-portal.yml` renders `PORTAL_JOBS_ENABLED=true` when the GitHub variable is unset (the portal needs its jobs in production; `env.ts` defaults to `false` for development). Note it in section I.

---

# Known unknowns

*Consolidated, de-duplicated and ordered by first verifying task in contracts M.5 (integration review, 13 November 2026); this list stays as the local detail.*

Each was not verifiable without the real environment. The first step that verifies it, and its fallback, are in the task named.

| # | Unknown | Where verified | Fallback |
|---|---|---|---|
| U1 | After the Next 16.4.6 bump, `proxy.ts` and nonce CSP behave as documented for 16.2.5 | M5.1 step 2 (re-read the installed docs, run the proxy and E2E tests) | adapt `proxy.ts`; the pure policy in `csp.ts` is unaffected |
| U2 | `output: 'standalone'` with `outputFileTracingRoot` at the repo root nests the server at `apps/portal/server.js` | M0.6 step 12 | adjust the Dockerfile `COPY` and `WORKDIR` to the path `find` shows |
| U3 | `scripts/migrate.ts` finds `drizzle/` and `src/db/rls.sql` when bundled to CommonJS and run from `apps/portal` | M0.6 step 6 | ask W0-b for `process.cwd()` relative paths (a `blocked` line) |
| U4 | Playwright's loader resolves `@/` imports and `testDb()` honours `PORTAL_TEST_DATABASE_URL` | E2E step 5 (the probe passed in the scratch harness) | the fallback in that step |
| U5 | Better Auth config details: `rateLimit.customRules` paths, `advanced.useSecureCookies`, a single `hooks.before`, the session cookie name, origin checks in `auth.handler` | M5.1 steps 6 and 7 | adjust keys in `limits.ts`, merge into the existing hook |
| U6 | Caddy `header_up X-Forwarded-For {http.request.header.CF-Connecting-IP}` replaces the header the app reads | handover item 1, check `docker logs` shows the visitor address on a real request | add `trusted_proxies` for Cloudflare ranges |
| U7 | `aws s3 ls` and `aws s3 cp` download paths of the restore drill and the R2 lifecycle rule | handover item 6 | none needed beyond fixing the command |
| U8 | The Apply step of the lifecycle spec needs outbound HTTPS to `challenges.cloudflare.com` | E2E step 7 | run the suite on a networked machine; there is no offline mode |
| U9 | The spec labels from the mock still match the converted screens | E2E step 11 (selector sweep in `e2e/support/ui.ts`) | edit that one file |
| U10 | axe at 393 px finds nothing new beyond the mock's baseline | M5.2 step 7 | fix per rule, or disable one by id with a reason |
| U11 | `pnpm audit --json` keeps the `advisories[].findings[].paths` shape used by `audit-portal.mjs` | M5.1 step 1 | adapt the parser; exit code 2 means the JSON could not be read |
| U12 | GitHub Actions details that `actionlint` cannot know: `psql` on the runner, the `workflow_run` plus `vars` gate, the `db-create.sh` call against the service container | first CI run (handover item 3) | adjust `portal.yml`; add `apt-get install postgresql-client` if `psql` is missing |
| U13 | The Docker image has only been checked with `docker build --check`, not built end to end in this plan | M0.6 step 12 (needs CCR-1 and CCR-2) | read the build error; the usual cause is a path in a `COPY` line |
| U14 | Raising `max_connections` to 50 fits the droplet's memory after the resize | handover item 1 | lower the pools instead (system 4, request 3, `CONNECTION LIMIT` 8) |

---

# Self-review

**Master plan coverage.**

| Master task | Plan task |
|---|---|
| 0.6 CI, image and droplet deploy (repo side) | M0.6 (Dockerfile, health route, `portal.yml`, `deploy-portal.yml`, compose reconciliation and `portal` service, Caddy snippet in the runbook); the droplet half is the handover checklist |
| 4.2 Audit log screen, filters, CSV export | M4.2 (including AdminAudit, AuditDrawer, `repo/audit.ts`, the health card) |
| 4.3 Global search with `pg_trgm`, scoped by viewer | M4.3 (`repo/search.ts`, `searchAction`, palette, CCR-3 for the shell) |
| 5.1 Security pass | M5.1 |
| 5.2 Accessibility pass | M5.2 |
| 5.3 Retention jobs | M5.3 (with the document purge verified, not re-implemented) |
| 5.4 Remove mock scaffolding | M5.4 |
| 5.5 Backups | M5.5 |
| 5.9 Runbook and incident template | M5.9 (sections 1 to 3 in M0.6) |
| Section 7 testing (E2E, isolation matrix) | Task E2E, M5.1 step 9 |
| HubSpot plan section 6 | Task V step 2 |
| 5.6, 5.7, 5.8 | skipped on purpose; "Handover checklist for a person" |

**Placeholder scan.** The finished file was searched for the placeholder phrases the writing-plans skill bans (deferred decisions, to-do and fix-me markers, "similar to Task N", "add appropriate handling", "write tests for the above"): no match. The report and result templates contain angle bracket fields such as `<date>` and `<short sha>` because those are facts known only when the run finishes; every other step has its code and its command. Every `@@` include in the drafts was replaced by the real file text, which was compiled or run where this plan says so.

**Name consistency with the contracts.** Verified by compiling in the scratch harness against the contracts' own extracted types: `listAudit(tx, viewer, input, clock)` and `exportAudit` with `AuditFilter`, `AuditEntryDto`, `PageDto`, `AuditPeriod` (H.12, H.0); `searchAll(tx, viewer, { q, limit })` and `SearchHitDto` (H.13); `exportAuditAction`, `retryFailedOutboxAction`, `searchAction` (H.20); `retryFailedOutbox`, `integrationHealth`, `IntegrationHealthDto` (H.13b); `withViewer`, `assertStaff`, `Tx` (F.1); `recordAudit`, `SYSTEM_ACTORS`, `AUDIT_EVENTS` event names (F.4, D.1); `runViewerAction`, `ActionResult` (F.7); `rateLimit` (H.18); `defineIsolation`, `IsolationMap` (F.6); `JOBS`, job names and schedules (H.17); `purgeExpiredFiles` and `purgeDocumentFiles` (H.11, plan 05); `makePartner`, `makeUser`, `makeRegistration`, `makeDocument`, `makeApplication`, `asStaff`, `asPartner`, `resetDb`, `testDb` (J.3); `ROUTES` and the nav items of `routes.ts`; `fmtLong`, `fmtTimestamp`, `plural` (D.5). New names introduced here and defined in full: `buildCsp`, `createNonce`, `originsFromEnv`, `authRateLimit`, `PER_EMAIL_RULES`, `enforcePerEmailLimit`, `perEmailRateLimit`, `parseAuditView`, `auditViewToQuery`, `auditViewToExportFilter`, `auditToCsv`, `csvCell`, `fullTimestamp`, `buildPageHits`, `SEARCH_MIN_CHARS`, `SEARCH_Q_MAX`, `OPEN_SEARCH_EVENT`, `SearchPalette`, `Scrim`, `IntegrationHealthCard`, `purgeExpiredRecords`, `RETENTION_DAYS`.

**Dashes.** Run the one-liner from Conventions over this file; it prints nothing.

