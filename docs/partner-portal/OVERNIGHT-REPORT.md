# Partner portal overnight build report

Written on 2026-11-13 (IST) by the Wave 2 final verification session (task V). Branch `feat/portal-build`. The code state checked below is `8d5f7bf5` (the last code commit; `43f5cbad` plus one test). The last good tag is `portal-w2`, on the commit that adds this report (`git rev-parse --short portal-w2`). Nothing was pushed.

Hosted demo on mock data (round 3, task D): see `DEMO.md`.

## Summary

The portal is built and runs locally end to end against a fake HubSpot: apply, approve, invite, accept, register a deal, accept the deal, create it in HubSpot, move its stage there and see it on the partner page, request and grant an extension. Every check in step 1 passes on the final tree (1682 unit tests, 78 browser tests, 0 dependency advisories). It has never run against anything real: not HubSpot, R2, Brevo, Turnstile, Google or Microsoft sign in, the droplet, Caddy, Cloudflare, or GitHub Actions. A person must do the droplet and key work first (section "What a person must do next"), then run the HubSpot checklist against a developer account, then the pilot.


## Round 2 update (2026-11-16)

A second round ran on `feat/portal-build` after the product owner's decisions. Nothing was pushed.

- **Sign in is email and password only.** Google and Microsoft sign in are removed: provider code, env variables, buttons, OAuth callback handling, tests, the deploy render step and the docs. Better Auth stays with the password rule, rate limits, optional two-step and password reset. An independent reviewer read the Better Auth code: with no providers the social endpoints answer `PROVIDER_NOT_FOUND` and cannot create a user or session.
- **HubSpot answers recorded** in `HUBSPOT-CAPABILITIES.md`: (b) poll only, no webhook subscription; (d) unique-value properties allowed, so provisioning runs without `--no-unique` (the flag is deleted); (a) association labels: UI check passed, flag stays off; (c) and (e) stay `UNVERIFIED`.
- **`env.ts` production checks** (authorised by the product owner): https `APP_URL` (loopback excepted, parsed hostname, look-alike hosts refused), and one missing-variable message naming `DATABASE_URL`, `AUTH_SECRET`, `DATABASE_OWNER_URL` and `APP_URL`.
- **Manual click-through steps run in a headless browser** against the seeded app: identity (nine steps), registrations and documents (eight). All pass except M3.2 Step 41, which needs a real R2 bucket and stays unticked. Five defects were found and fixed with tests: invite acceptance for a seeded `invited` user, the render after a password change using the revoked session (`getViewer` now reads `cookies()`), removal leaving an open invite usable, `listStaff` managed-partner counts, and the deal page showing the wrong accepted date and length after a granted extension.
- **E2E suite re-reviewed** by an independent reviewer (5 must-fix, 8 should-fix, all fixed): the env-file refusal now uses Next's own loader, scans assert the page rendered, the CSP collector sees every page, tenant search and journey assertions are real, hydration waits replace races, and an intermittent axe contrast failure was root-caused (the page's own fade-in was still running when axe scanned) and fixed. The suite is 116 scenarios (92 desktop, 24 mobile).
- **M5.1 security pass re-reviewed** by an independent reviewer: no must-fix. Follow-ups done: `audit-portal.mjs` fails closed and audits dev dependencies, a stricter rate-limit coverage test, proxy path tests (and a real fix: encoded paths such as `/%61dmin/...` now get the session redirect), email builders throw on unsafe links, subjects are sanitised and capped, Sentry and log redaction widened, job lock error masking fixed, job schedules pinned.
- **Final checks on the merged tree (2026-11-16):** lint, typecheck and 1831 unit tests pass, the build exits 0, `verify-copy` is ok, the dependency audit reports 0 advisories, and the Playwright suite passes 116 of 116 (after the animation fix it was run on the final tree). The isolation matrix is part of the unit run. Docker and CI were not re-run.
- **Still needs a person:** everything in "What a person must do next" (droplet, GitHub settings, real keys, HubSpot smoke and provisioning against portal 245478611, backups, legal text, screen reader pass), plus: a real R2 bucket for M3.2 Step 41; `HUBSPOT_WEBHOOK_SECRET` is still required in production by `env.ts` although nothing subscribes (make it optional if you want); delete any unused `PORTAL_GOOGLE_*` and `PORTAL_MICROSOFT_*` GitHub settings; the "Keep me signed in" default stays ticked (the product owner chose).

## Step 1: checks on the final tree

Run in the worktree on 2026-11-13 between 14:03 and 14:15 IST. The unit run, lint, typecheck and build were repeated after the last test commit (`8d5f7bf5`); the other commands ran on `43f5cbad`, which differs only by that one test.

| Command | Result |
|---|---|
| `pnpm --filter @cleanstart/portal lint` | pass, `Checked 439 files`, no fixes |
| `pnpm --filter @cleanstart/portal typecheck` | pass, exit 0 |
| `pnpm --filter @cleanstart/portal test` | pass, 153 files, 1682 tests (the isolation matrix, `src/server/repo/isolation.test.ts`, is part of it: 31 tests) |
| `pnpm --filter @cleanstart/portal build`, under the lock | pass, exit 0, 29 routes listed, `Proxy (Middleware)` present |
| `PORTAL_E2E_CHANNEL=chrome pnpm --filter @cleanstart/portal exec playwright test`, after `rm -rf apps/portal/.next-e2e` | pass, 78 passed (53 desktop, 25 mobile). The plan expected 64; the suite grew with the M5.1 and M5.2 additions (security, isolation, more axe pages). |
| `node apps/portal/scripts/audit-portal.mjs` | pass, `0 advisories for apps/portal, 0 high or critical.` (the registry was reachable) |
| `node apps/portal/scripts/verify-copy.mjs` | pass, `verify:copy ok (476 files)` |
| `actionlint .github/workflows/portal.yml .github/workflows/deploy-portal.yml` | pass, no output |
| `shellcheck infra/scripts/backup.sh infra/scripts/restore-portal-drill.sh` | pass, no output |
| `docker build --check` on a copied context (Dockerfile only) | pass, `Check complete, no warnings found`, exit 0. This checks syntax only; the image was built and run once locally in M0.6, never on CI. |
| Dash check on the diff | pass, no em-dash or en-dash added |

Tools skipped: none. The "local backup test" in the plan's Gate A line was run in M5.5 with stub `pg_dump`, `pg_restore`, `psql`, `aws` and `curl` (40 and 22 checks, see the log); it was not run again here.

Defects found in step 1: none in the product code. Two gaps found while checking the HubSpot evidence (step 2) and fixed in this commit set:

- `8d5f7bf5` adds the missing test for checklist line 7: accept, undo, accept again queues a second `registration.create` under its own key. Before it, only the key function was tested for that, not the action sequence.
- `docs/partner-portal/HUBSPOT-PROVISIONING.md` named the GitHub secrets `HUBSPOT_PORTAL_TOKEN` and `HUBSPOT_WEBHOOK_SECRET`, but `deploy-portal.yml` reads `secrets.PORTAL_HUBSPOT_TOKEN` and `secrets.PORTAL_HUBSPOT_WEBHOOK_SECRET`. A person following the provisioning note would have created secrets the deploy never reads. Fixed. Also reworded one line of `docs/partner-portal/R2-DOCUMENTS-BUCKET.md`, because the portal database dump now lives in the same bucket under `portal-backups/`.

## Tasks done

Source: the progress log (`docs/partner-portal/PROGRESS.md`). "Gates" is Gate A (lint, typecheck, test, build under the lock, dashes, paths) and Gate B (an independent reviewer that did not write the code). Every Gate A was green when the line was written, and Gate A plus the isolation matrix was re-run on `feat/portal-build` after each merge. A Gate B "fixed" entry means the findings were fixed in the commits listed; the log does not record a second review for those.

### Wave 0 (tag `portal-w0`)

| Task | Commits | Gates | Note |
|---|---|---|---|
| M0.2 | `ede70d80` | A ok, B ok | tag `portal-mock-v1` on `58747992`; dependency set; lockfile peer-suffix change (see path exceptions) |
| M0.3 | `cb45f3e5`, `7996814b` | A ok, B ok | 25 tables, row level security, roles, `0000_init`, `db-create.sh`, seed |
| M0.4 | `7cdb4544`, `858df971` | A ok, B ok | env example, logger, Sentry config, job stubs |
| M1.2 | `c2489ba6`, `ffa225a2`, `bd85850d` | A ok, B ok | tenant layer, rate limiter, isolation matrix |
| M0.7 | `3f26adaa`, `ed26e02d` | A ok, B ok | Better Auth kept. Google and Microsoft sign in were removed on 2026-11-16 by decision of the product owner: sign in is email and password only (see the round 2 update) |
| M1.1a to M1.1c | `56774e70`, `7f0b6f60`, `5f77cfb1`, `7b2c3cf2` | A ok, B fixed | passwords, policies (355 cell tests), sign in gate |
| M1.1d, M1.1e | `d8daa59b`, `a5c8da84`, `f03ced75` | A ok, B must-fix fixed | open redirect through dot segments in `safeNext` fixed |
| M1.1f, M1.1g | `6e11955d`, `fa326d0e`, `61501ee9` | A ok, B fixed | shell, layouts, real sign in screen |
| M1.2b, M0.5a to M0.5d | `0f3a1ae4`, `3e0e8d90`, `545e2709`, `dc540547`, `3b7efb19`, `6aeccdc4` | A ok, B fixed | action runner, email module (21 builders) |
| Wave 0 exit | tag `portal-w0` | A ok: 836 tests, build 0, matrix passing | |

### Wave 1 (tag `portal-w1`, merge `dc15f3bb`, 1587 tests)

| Task | Commits | Gates | Note |
|---|---|---|---|
| H4.1 | `59f6b65f` | A ok, B fixed | step 6 (run against a developer HubSpot account) is for a person |
| H4.2, H4.7, H4.3 | `7ec068ee`, `16bb35c5`, `22572a1f` | A ok, B fixed | HubSpot interface, real and fake client, lookup, mappers |
| H4.4 | `051993ca`, `bb833409` | A ok, B must-fix fixed | outbox; `ON CONFLICT DO NOTHING` without a target (see deferred findings) |
| H4.5, H4.6 | `85ac18c8`, `06ff5918`, `bb686df8` | A ok, B must-fix fixed | handlers; deal id stored only while status is accepted |
| H4.8, H4.9, H4.10 | `d522a996`, `3890a459`, `21a3be30`, review fixes `683e2549` | A ok, B must-fix fixed | poll, expiry, reconcile, webhook, health data, smoke and import scripts |
| M3.1, M3.2 | `40ee25bd`, `12169a31`, fixes `f98159ea` | A ok, B fixed | storage, file route, document library, upload; checked against `FakeFileStorage` only |
| M3.3 | `c32d815d` | A ok, B no must-fix | public datasheets, tested against a local stub of the CMS |
| M0.6 | `501907ce`, fixes `faefd46a` | A ok, B no must-fix | Dockerfile, health route, two workflows, compose service; image built and run once locally |
| M4.3 | `95925a5b` | A ok, B no must-fix | search; palette wired into the shell in M5.4 |
| M4.2 | `6ecff550`, `6658527b`, fixes `aa945f88` | A ok, B no must-fix | audit log screen and export, health card (steps 7 to 9 after H4.10) |
| M1.3, M1.3b, M1.4 | `bf49bf80`, `fca66b27`, `611defe2`, `8330c8d5`, fixes `e9ae6e0f` | A ok, B must-fix fixed | apply page prerendered with a baked Turnstile key: fixed with `force-dynamic` |
| M1.5, M1.6, M1.8 | `c3067d0e`, `da33a782`, `15d973bf`, fixes `13101b67` | A ok, B no must-fix | invites, team, staff admin |
| M1.7, M1.7b, M4.1 | `5edcbc68`, `d70cfa3d`, `4cd67253`, fixes `e80cf2ed` | A ok, B no must-fix | account, company, security cards, partners list |
| M2.1, M2.3, M2.2 | `4567e20a`, `15009094`, `62a36960`, fixes `35ea54d5` | A ok, B no must-fix | register deal, thread, approvals, undo |
| M2.4, M2.6, M4.4 | `102a70f3`, `5e4a5c1b`, `8ad4bb2d`, fixes `8c6f94b3` | A ok, B no must-fix | extensions, reminders, overview, reports, notifications popover |
| Merges | `af4d868d`, `b274a931`, `04216af1`, `883ba9aa`, `b8cf7fbd`, `cafa7c9a`, `44f7e97d`, `b9dfc2ae`, `f24b6711`, `b7aee2d9`, `a5385ba9`, `dc15f3bb` | A ok after each | |

### Wave 2

| Task | Commits | Gates | Note |
|---|---|---|---|
| M5.4 | `db1f8887`, `9eaf683e` | A ok, B no must-fix | shell wired (notifications, search), mock scaffolding and Driver.js removed |
| E2E | `0a586201`, `946298b7`, `f835e618`, `fe0ba5dd` | A ok, B not recorded in the log | harness hardening in its own commit; Chrome channel because Playwright's Chromium is not cached |
| M5.1 | `c9fe47a4`, `9ca51fb6`, `49c4faf2`, `2c83f7f3`, `4ebd5489`, `1d104a3f`, `8d3dc73d` | A ok, B must-fix fixed (lockfile), re-check not recorded | Next 16.4.6, Sentry 9.47.2, Vitest 4, nonce CSP, trusted proxy, audit script. `docs/partner-portal/SECURITY-PASS.md` |
| M5.2 | `2fb72400`, `a90b9b12`, `a1318946` | A ok, B fixed | axe 0 failures at 1440 and 393 px, focus trap, skip link. `docs/partner-portal/A11Y-PASS.md` |
| M5.3 | `bf6b2355`, `a2aa630c` | A ok, B fixed | retention: declined applications and rejected registrations after 365 days |
| M5.5 | `8a5d8a8e`, `1e33d96b` | A ok, B fixed | portal dump in `backup.sh`, `restore-portal-drill.sh`; stub runs only |
| M5.9 | `56ae8c0b`, `fe3e2eb0` | A ok, B fixed | runbook sections 4 to 11, incident template |
| V | `8d5f7bf5` and this report | step 1 all green | |

Not planned, left to a person: M0.1 (HubSpot capability check, stub only), M5.6 (pilot), M5.7 (production provisioning), M5.8 (cutover). M0.7-F (Auth.js fallback) was not needed and was not run. M2.5 is the H track.

## Tasks blocked

| Task | Track | What it needs |
|---|---|---|
| M4.2 steps 8 and 9 | A | Was blocked on H4.10. Resolved: done in `6658527b` after H4.10 merged. Nothing needed now. |
| M1.4 enqueue steps | P | Was blocked on H4.4. Resolved: done in `8330c8d5`. Nothing needed now. |
| M5.1 `env.ts` check | O | Done on 2026-11-16 (the product owner authorised the edit): in production `APP_URL` must be https (loopback excepted) and the first missing-variable message names `DATABASE_URL`, `AUTH_SECRET` and `DATABASE_OWNER_URL` together. History: it was blocked by contracts K.3. |

Manual steps left unticked in the plans (the code and its automated tests are done; each step needs a person, a credential or a live service):

| Plan task | Unticked step | Why |
|---|---|---|
| HubSpot 4.1 | Step 6, dry run then apply against a developer account | needs a HubSpot developer account token |
| HubSpot 4.9 | Step 5, webhook subscription and the Cloudflare skip rule | not needed: the product owner decided on 2026-11-16 to poll only and not subscribe. The receiver stays deployed and unsubscribed |
| HubSpot 4.10 / section 6 | ten checklist lines | see the table below; none ticked, because six need a live HubSpot |
| 02 M0.7-F | Steps 1 to 9 | Auth.js fallback, not needed: Better Auth passed the spike |
| 03 M1.3, M1.4, M1.5, M1.6, M1.7, M1.7b, M1.8, M4.1 | the "Manual check" step of each (21, 18, 22, 18, 17, 12, 10, 14) | click-through on seed data not run; the repo and action tests and the E2E journey cover the same flows |
| 04 M2.1 | Step 1 (library behaviour scratch check) and Step 20 | scratch check skipped because repo tests cover it; manual check not run |
| 04 M2.3, M2.2, M2.4, M2.6, M4.4 | "Gate A and the manual check" (steps 9, 12, 11, 13, 5) | Gate A ran green; the manual part was not run. A smoke of `/partner/deals`, `/new`, `/[id]` and `/admin/approvals` on a seeded database returned 200 (log, 12:02). |
| 05 M3.1, M3.2 | Steps 24 and 41 | the R2 lines need a real bucket; the rest was seen in the browser pane against `FakeFileStorage` |
| 06 Task V | none left: steps 1 to 4 ticked in this commit | |

## UNVERIFIED and PROVISIONAL

| Item | Why it could not be verified |
|---|---|
| Google and Microsoft sign in (M0.7) | Removed on 2026-11-16 (product owner decision). Nothing to verify. The unused `PORTAL_GOOGLE_*` and `PORTAL_MICROSOFT_*` GitHub variables and secrets, if they were ever created, can be deleted; an existing `portal.env` on the droplet may still hold the old variables, which `env.ts` ignores. |
| HubSpot capabilities, master task M0.1 | `docs/partner-portal/HUBSPOT-CAPABILITIES.md`: (a) association labels: UI check passed on 2026-11-16 (custom labels can be created; not yet tried through a private app token; the build default `HUBSPOT_USE_ASSOCIATION_LABELS=false` stays); (b) webhooks: decided poll only, no subscription; (d) unique-value properties: allowed, reported by the product owner (no screenshot); (c) rate limit and (e) `hs_lastmodifieddate` search: `UNVERIFIED`. Answer e has no fallback: the inbound poll depends on it, so the smoke script must run against the real portal before the pilot. |
| HubSpot against a live portal | `provision-hubspot.ts` (now run without `--no-unique`; H4.1 step 6) and `hubspot-smoke.ts` were never run. There is no webhook subscription (poll only). The webhook header names and signing secret for a private app stay `UNVERIFIED`, now moot while unsubscribed. |
| Cloudflare R2 | The adapter was verified offline. No real upload, download, CORS, `HEAD` content type or ranged read. The bucket `cleanstart-partner-docs` does not exist yet. |
| Brevo | The adapter was tested against a stubbed `fetch`. No real send. The sender and droplet address are not set up. |
| Cloudflare Turnstile | Cloudflare's always-pass test keys only, in development and test. The production widget and key do not exist. |
| Website intake (M1.3b) | Tested against a local stub of the CMS REST shape. No CMS service user or API key exists. |
| Droplet | Nothing was run on it (no ssh by rule): resize, `max_connections`, roles and database, compose copy, `ufw`. |
| Caddy and Cloudflare | The Caddy block is a snippet in `docs/operations/PARTNER-PORTAL.md`. Whether `header_up X-Forwarded-For {http.request.header.CF-Connecting-IP}` really replaces the header the app reads (unknown U6) is unproven. DNS, proxying, SSL mode and the WAF rule are not done. |
| CI workflows | `portal.yml` and `deploy-portal.yml` pass `actionlint` and have never run on GitHub. Unknowns U12 (`psql` on the runner, the `workflow_run` plus `vars` gate, `db-create.sh` against the service container) are open. |
| Docker image on CI | Built and run once locally (305 MB, migrate then server, `/api/health` 200). Not built on CI. |
| Backup heartbeat and restore | `backup.sh` and `restore-portal-drill.sh` were run only with stub tools. The live heartbeat was not verified, the restore drill was never run against a real database or real R2, the lifecycle rule for `portal-backups/` does not exist, and the scripts are not yet copied to `/opt/cleanstart/scripts`. The runbook's restore swap steps are untested. |
| Postgres `max_connections` | 20 on the droplet today; CMS pool 15 plus portal pools 14 need about 50. Not touched (restarts production Postgres). Unknown U14: that 50 fits the droplet's memory after the resize. |
| Better Auth rate limit and cookie details in production | Checked on `next start` locally. Behaviour behind Caddy and Cloudflare is untested (see per-IP trust below). |
| Screen readers, zoom, forced colors, reduced motion | Not run. Axe, keyboard tests and focus checks only. |
| Real browser check of the second sign-in step | The two-step view was exercised in unit tests and the account screen tests, not live (M1.1g log). |
| Legal text | `agreement_version` is `draft-0`; the agreement PDF is not served. |
| Deal rules | Defaults from the proposal in `src/lib/deal-rules.ts`, not confirmed by the core team. |
| `isolation` run against a staging database | There is no staging database (CLAUDE.md); the matrix ran on a freshly migrated local database built by the same `migrate.ts` and `rls.sql` as production. |

## HubSpot verification checklist (HubSpot plan section 6)

Evidence commands, run on 2026-11-13: `vitest run src/server/hubspot src/server/jobs src/app/api/hubspot src/server/repo/integration-health.test.ts src/server/repo/isolation.test.ts` gave 26 files, 180 tests, all passed; `playwright test e2e/journey.spec.ts e2e/admin.spec.ts --project=desktop` gave 13 passed. The portal tests use `FakeHubspot`; "automated" below never means a live HubSpot. None of the ten boxes in the HubSpot plan was ticked, because only a run in the developer account closes them.

| # | Line | Status | Evidence |
|---|---|---|---|
| 1 | Approve a registration: a deal appears in the Partner deals pipeline with the right fields | PARTIAL (automated) | `src/server/hubspot/handlers.registration.test.ts`: "creates the deal, the customer company and links partner, customer and contact", "maps the stored codes to HubSpot labels and values", "does not create a second deal when it runs twice". `e2e/journey.spec.ts:118` "the approval reaches HubSpot" (one deal, id stored). The real pipeline view in HubSpot is UNVERIFIED. |
| 2 | Move the deal through every stage: partner sees it within 5 minutes, Closed won shows Won | PARTIAL (automated) | `src/server/hubspot/mappers.test.ts` (`decideInbound`, `STAGE_TO_STATUS covers every stage label`), `src/server/hubspot/poll.test.ts` ("applies a stage move, writes a timeline event and stores the cursor"), `e2e/journey.spec.ts:118` (stage change shows on the partner page). The 5 minute cadence is set in `src/server/jobs/index.ts` (`*/5 * * * *`) but no test pins it: `src/server/jobs/registry.test.ts` only validates cron strings and pins the two purge times, so the plan's expectation that it pins the poll schedule does not hold. The timing against a real HubSpot is UNVERIFIED. |
| 3 | Grant an extension: HubSpot's protection end changes | PARTIAL (automated) | `src/server/actions/extension.test.ts` ("grants: moves the end date, queues one update_end with the new date as its version"), `handlers.registration.test.ts` ("registration.update_end and registration.expire > writes the new protection end"), `e2e/journey.spec.ts:134`. Poll rule tests (`poll.test.ts`: "never moves a granted extension backwards", "keeps the same extension when the queued write has failed"). Live write UNVERIFIED. |
| 4 | A registration passes its end date: nightly job expires it and the deal moves to Registration expired | PARTIAL (automated) | `src/server/jobs/expiry.test.ts` ("expires accepted registrations whose protection ended and queues the HubSpot write", "runExpiry > still expires and queues the HubSpot write while HubSpot is not configured"), `handlers.registration.test.ts` ("moves the deal to Registration expired"). The `10 0 * * *` schedule is in `jobs/index.ts` and not pinned by a test. Live move UNVERIFIED. |
| 5 | Switch HubSpot off: approvals still work, backlog grows, drains with no duplicates after restore | PARTIAL (automated) | `src/server/hubspot/outbox.test.ts` ("retries with backoff and records the error", "marks the operation failed after the fifth attempt", "lets two concurrent drains handle each row once", "ignores a duplicate with the same idempotency key"), `src/server/repo/integration-health.test.ts` (pending and failed counts, staff retry), `src/server/jobs/hubspot-outbox.test.ts`. The E2E run has no HubSpot token at all (the harness scrubs it) and approvals work. The health card was seen in a browser with a seeded failed row (M4.2 log). Revoking a live token is UNVERIFIED. |
| 6 | Approve the same registration twice by double click: one deal | PASS (automated) | `src/server/actions/decisions.test.ts` ("is a conflict the second time and leaves one outbox row"; the concurrent case "give exactly one success and one already_decided"), `src/server/repo/registrations.decide.test.ts` ("decides once: a second accept is already_decided"), `src/server/hubspot/outbox.test.ts` ("ignores a duplicate with the same idempotency key", "stores one row and raises no error when two partner viewers insert the same key"), `handlers.registration.test.ts` ("does not create a second deal when it runs twice"). The concurrent test compares accept against reject and asserts at most one row; the exact-one assertion is the sequential test. |
| 7 | Accept, undo, accept again before the deal exists: one deal, second accept queued its own create | PASS (automated) | New in this task: `src/server/actions/decisions.test.ts` "queues a second create under its own key when a decision is undone and taken again" (`8d5f7bf5`). Also `outbox.test.ts` ("treats a second decision time as a new operation"), `registrations.decide.test.ts` ("allows a decision to be taken again after an undo"), `handlers.registration.test.ts` ("does not store the deal id when the registration was undone between the HubSpot create and the database write"). The two creates share one deal in HubSpot through the unique `portal_registration_id` search, which only the fake exercises. |
| 8 | Token unset (development): approvals work, jobs log "HubSpot is not configured", webhook answers 503 | PASS (automated) | `src/server/jobs/hubspot-poll.test.ts`, `hubspot-outbox.test.ts`, `reconcile.test.ts` (each "does nothing while HubSpot is not configured"), `src/app/api/hubspot/webhook/route.test.ts` ("answers 503 and does not poll while the secret is not configured"), `lookup.test.ts` ("hubspotForRequest is null while HubSpot is not configured"), and the E2E journey with no token. The log line `HubSpot is not configured; poll skipped` appeared in the test output. |
| 9 | The 6 existing deals in the default Sales Pipeline are untouched | UNVERIFIED (needs live HubSpot) | Design evidence only: `provision-hubspot.ts` is a dry run by default and never writes to the default pipeline; `listOpenDealsForCompany` filters by pipeline (`client.test.ts`). Nothing was run against a portal. |
| 10 | A partner user cannot read another partner's deal through the customer lookup, the deal page or the thread | PASS (automated) | `src/server/repo/isolation.test.ts` (31 tests, registered functions include `getRegistration`, `listMessages`, `customerSuggestions`), `src/server/repo/search.test.ts` ("shows a partner admin only their own company, and never another partner"), `e2e/isolation.spec.ts` (another company's deal id answers exactly like a missing id), `e2e/admin.spec.ts:66` (search as another partner admin returns nothing of the other company). Caveat: inside one company, partner sales see colleagues' deals in the customer suggestions (accepted, see deferred findings). |

Counts: PASS (automated) 4 (lines 6, 7, 8, 10), PARTIAL (automated) 5 (lines 1 to 5), UNVERIFIED 1 (line 9).

## Security pass

`docs/partner-portal/SECURITY-PASS.md`. Next.js bumped for the portal to 16.4.6 (Sentry 9.47.2, Vitest 4). Audit: before `39 advisories for apps/portal, 18 high or critical`; after, and on the final tree, `0 advisories for apps/portal, 0 high or critical.` Two findings for other owners: `apps/cms` and `apps/web` are still on Next 16.2.5 and Sentry 9.47.1 with the same advisories, and Postgres `max_connections = 20` cannot hold the CMS and the portal.

## Accessibility pass

`docs/partner-portal/A11Y-PASS.md`. Axe (WCAG 2.0 and 2.1, A and AA; serious and critical fail) on 25 pages at 1440 px and 393 px: 0 failing on both; before the pass, 1 failing on desktop and 3 on mobile. Three keyboard tests pass (palette, focus indicators, drawer focus trap). Not covered: screen readers, zoom to 400 percent, forced colors, reduced motion, hover and disabled contrast states.

## Gate B findings deferred

| Task | Finding | Why deferred | Owner |
|---|---|---|---|
| M0.3 | review nits 5 and 6 | cosmetic, skipped | none |
| M0.4 | `env.ts` check did not name `DATABASE_OWNER_URL` until `DATABASE_URL` and `AUTH_SECRET` were set; log redaction nits | fixed on 2026-11-16 (env check) and in package S (redaction) | done |
| M1.2 | the isolation test's unchanged-probe does not snapshot untouched rows (contract F.6 change request); nits 4 to 8 | contract text change | contracts owner |
| M0.7 | two-step lockout untested | Better Auth's default lockout is on; no test covers it | operator or a later pass |
| M1.1a to M1.1c | D.3 and D.4 differ on the wording for a null region; the code follows D.4 | contract text discrepancy | contracts owner |
| M1.1a to M1.1c | per-IP limits trusted `x-forwarded-for` | fixed in M5.1 with `PORTAL_TRUSTED_PROXY_HOPS`; the model still depends on Caddy overwriting `X-Forwarded-For` and the firewall admitting Cloudflare only, which nobody could test | operator, first deploy |
| M5.1 | in the app's own `rateLimit()` an IPv6 client is keyed by full address, not /64 | a client with a /64 can rotate there; the per email and per domain limits still apply; Better Auth's limiter does normalise to /64 | later |
| M1.2b, M0.5 | `void sendPasswordResetEmail` may be dropped on serverless | fixed in M5.1 with `after()`; other nits left | none |
| M1.4 | the `existing_partner` outcome of the apply form discloses a partner name for a domain | the spec and the mock require it; accepted risk | product owner |
| M1.7b | `regenerateBackupCodesAction` writes no audit entry | needs a new audit event in contracts F.4 (change request) | contracts owner |
| M2.1 to M2.3 | `customerSuggestions` is company wide, so partner sales see colleagues' deals | accepted by the plan (known unknown 12) | product owner |
| M2.1 to M2.3 | `computeChecks` matches on customer name and product only (no domain, no protection window) | accepted by the plan | product owner |
| M2.2 | undoing a decision leaves a stale `registration.create` outbox row; a deal already created in HubSpot stays there, because `HubspotApi` has no archive call (a later accept reuses it through `portal_registration_id`) | `bb686df8` stops the stale row writing the deal id, but cannot remove the deal | later |
| M2.2 | reject reason prefill is neutral and no longer names the rival partner | deliberate deviation from the plan text (avoids cross-tenant disclosure) | product owner to confirm |
| M2.3 | a partner message on a deal with no manager notifies nobody | the plan names a fallback only for submissions | product owner |
| H4.4 | `enqueue` uses `ON CONFLICT DO NOTHING` without a target, because partner transactions have no SELECT policy on `hubspot_outbox` | signature unchanged; contracts G and plan 4.4 wording should say so (change request) | contracts owner |
| H4.9 | webhook header names and signing secret for a private app unverified | moot while the receiver stays unsubscribed (poll only); needs a live app if subscribing later | person with HubSpot access |
| M3.1, M3.2 | an open is recorded without de-duplication; the download toast cannot see the response; other nits not recorded in the log | S1 and S2 were fixed; the rest is an accepted v1 limit (contracts M.5 item 28) | later |
| M4.2 | the audit note for a retry does not carry the op counts | needs a change in `repo/integration-health.ts` | later |
| M5.2 | one vitest run showed one unidentified failure, then four clean reruns | the flaky hubspot-outbox test was root-caused and fixed in `a1318946` (database `now()` has microseconds, the app clock milliseconds); the unidentified one may have been the same | watch in CI |
| M5.5, M5.9 | restore swap steps untested; HubSpot secret names in `HUBSPOT-PROVISIONING.md`; R2 bucket wording | the last two are fixed in this commit set | operator for the restore |

## Path exceptions for morning review

Everything changed outside the allowed paths, against `e1f29982` (the branch point): exactly two files.

- `pnpm-workspace.yaml`: two overrides scoped to Vitest 4 (`vitest@4>vite` pins 6.4.6, `vite@6.4.6>postcss` pins 8.5.23). They keep the test runner off a vulnerable toolchain without moving any version other workspaces resolve.
- `pnpm-lock.yaml`: regenerated from the pre-M5.1 lockfile so no version resolved for `apps/cms`, `apps/web` or `packages/*` moves. Checked in M5.1 with a closure comparison of every non-portal importer. Residual changes: `packages/ui` gains an optional `@swc/helpers@0.5.23` peer resolution for `@ladle/react` (brought in by `next@16.4.6`); and from M0.2 the jsdom optional peer `@noble/hashes` re-resolves from 1.8.0 to 2.4.0 (peer-suffix change, in range; check `isomorphic-dompurify` in `apps/cms` and `apps/web`).
- Portal-only dependency bumps that the lockfile carries: `next` 16.4.6, `@sentry/nextjs` 9.47.2, `vitest` ^4.1.12. `next@16.4.6` and `vite@6.4.6` were published on 9 November 2026, under the two week age rule; waived because the plan mandates them as security fixes.
- `apps/cms` and `apps/web` carry the same Next advisories and are outside this plan.

## Open decisions for the product owner

1. Second sign-in step: required or optional. Built as optional per user. Recommendation: required for CleanStart staff, optional for partners, revisit after the pilot.
2. Postgres `max_connections` on the droplet (20 today). The CMS pool takes 15 and the portal 14, so about 50 is needed. It restarts production Postgres, so the operator approves and runs it. If declined, lower the pools (system 4, request 3, `CONNECTION LIMIT` 8).
3. Next.js advisories in `apps/cms` and `apps/web`. Bump them in their own change before the portal launches.
4. `DATABASE_OWNER_URL` inside the app container. The container migrates on start, so the owner credential (which bypasses row level security) is in its environment. A one-shot migration service removes that. Recommendation: before real partner data goes in (plan 06 CCR-5b).
5. Product limits kept for v1: no QR code in two-step enrolment; no purge of declined access requests; videos download instead of streaming; no email when a partner manager changes; the agreement PDF is not served; `agreement_version` is `draft-0`.
6. Also open from the plan review: the deal rules in `deal-rules.ts` (90 day protection, one 30 day extension, UTC dates), email is best effort with no outbox, audit log retention, erasure requests.

## Deviations from the handoff process

- Gate B reviews were combined per batch of tasks, and reviewers ran per batch, not per task (for example one review for M1.1a to M1.1c, one for M1.1d and M1.1e, one for the whole of track P batch 2).
- The orchestrator session was interrupted from 10:02 to 11:30 IST. Four subagents were stopped; they were resumed (track D M3.3, the H review fix, and the A and P Gate B reviews were relaunched).
- A reviewer ran `pkill -f next-server` at about 09:21 IST (logged). That may have stopped another session's Next dev server.
- E2E, M5.1, M5.5 and M5.9 have no recorded second Gate B pass after their fixes.
- The progress log in this repository ends at the commit time of this report; the main-checkout copy carries the final `done` line for V.

## Run it locally

```bash
PGPASSWORD=<postgres password from DATABASE_URI in apps/cms/.env> bash apps/portal/scripts/db-create.sh cleanstart_portal
cp apps/portal/.env.example apps/portal/.env   # set AUTH_SECRET with openssl rand -base64 32, DATABASE_URL and DATABASE_OWNER_URL for cleanstart_portal
pnpm --filter @cleanstart/portal db:migrate && pnpm --filter @cleanstart/portal db:seed
pnpm --filter @cleanstart/portal exec next dev --port 3204
```

Sign in as any seeded user. Emails and the shared development password are in `apps/portal/src/db/fixtures.ts` (the constant is `DEV_SEED_PASSWORD`; it works only on a local database). Leave `PORTAL_REVIEW_PASSWORD` unset locally.

## How to review

- Last good tags: `portal-mock-v1` (the mock, `58747992`), `portal-w0` (foundations), `portal-w1` (all tracks merged), `portal-w2` (this report). `git tag --list 'portal-*'`.
- Start with `git log --oneline portal-mock-v1..portal-w2` (the whole build), then `git log --oneline portal-w1..portal-w2` (Wave 2) and `git diff --stat portal-w1 portal-w2`.
- The progress log is `docs/partner-portal/PROGRESS.md`. The security and accessibility notes are `SECURITY-PASS.md` and `A11Y-PASS.md` in the same folder; the runbook is `docs/operations/PARTNER-PORTAL.md`.
- Nothing was pushed, no PR was opened, and no production credential, droplet or live service was touched. `feat/portal-build` exists only in this checkout.

## What a person must do next

The full list is "Handover checklist for a person" at the end of Part 2 of `docs/superpowers/plans/2026-11-12-partner-portal-06-admin-infra-hardening.md`. The three that block the pilot come first:

1. The droplet, in the order of runbook section 1: snapshot, resize, raise Postgres `max_connections` (operator approval), create the portal roles and database, compose file, Caddy block, firewall to Cloudflare only. Then DNS and the Cloudflare WAF rule.
2. GitHub: every variable and secret in runbook section 2 (use the `PORTAL_` secret names), set `PORTAL_DEPLOY_ENABLED=true`, run the deploy once by hand, and check the first Portal CI run and the first Docker build on GitHub (neither has ever run).
3. Real keys: the private R2 bucket and its scoped token, Brevo sender, Turnstile widget, Sentry DSN, the CMS service user for website intake, and the HubSpot private app, capability check (M0.1), provisioning dry run and apply, webhook subscription, and the section 6 checklist above. Explicit go-ahead before anything touches production HubSpot.

Then: backups (copy `backup.sh`, dry run, real run, confirm the heartbeat, run the restore drill), the legal text and its version label, a 30 minute screen reader pass, and the decisions above. M5.6 (pilot), M5.7 (production provisioning) and M5.8 (cutover) follow.
