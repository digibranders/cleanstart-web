# Partner portal plan set: integration review

Reviewed 13 November 2026. Inputs: the contracts, the six area plans, the HubSpot plan, the master plan and `BUILD-HANDOFF.md`. All edits were made in place; backups of every original are in the session scratchpad (`.../scratchpad/review/`). Nothing was committed, no app code was written, no code was executed (see "What was and was not checked").

## (a) Contract change requests: resolution

73 requests: 57 accepted, 7 modified, 9 rejected. "Modify" means the request was accepted in substance but the mechanism changed.

| Plan | # | Request | Decision | Reason and where it landed |
|---|---|---|---|---|
| 01 foundations | 1 | Allowed-path glob widened; commit and push the plans before the worktree is cut | Accept | Glob in the handoff; Setup says a person commits and pushes first. |
| 01 foundations | 2 | `deal-rules.ts` re-exports of HubSpot stage names cannot compile in Wave 0 | Accept | Dropped from contracts H.19; plan 04 imports `StageLabel` from `@/server/hubspot/types`. |
| 01 foundations | 3 | `env.ts` created in M0.3, not M0.4 | Accept | Decision g; contracts I, K.2, handoff. |
| 01 foundations | 4 | `rate-limit.ts` in M1.2 with optional clock | Accept | Decision g; contracts H.18, K.2. |
| 01 foundations | 5 | `run.ts` after W0-f | Accept | Decision g; new handoff row W0-fb. |
| 01 foundations | 6 | Passwords for `makeUser` and the seed arrive in W0-f | Modify | They are needed by M0.7 (W0-e), so plan 02 Step 6b adds them; plan 02 had no step for it (a real gap). |
| 01 foundations | 7 | `makeSyncedDeal` takes a structural type | Accept | Contracts J.3. |
| 01 foundations | 8 | `testDb`/`testPool` return the system pools | Accept | Contracts J.3. |
| 01 foundations | 9 | Fixture details (JSON, filler admins, categories, nextval, seedDevDatabase, opens) | Accept | Contracts J.5. |
| 01 foundations | 10 | `client.ts` lint fix | Accept | Fixed in contracts C.2; plan 01 post-edit removed. |
| 01 foundations | 11 | `test-setup.ts` NODE_ENV line | Accept | Fixed in contracts J.2; plan 01 post-edit removed. |
| 01 foundations | 12 | Import rule exempts test files | Accept | Contracts F.1. |
| 01 foundations | 13 | `isolation.test.ts` three edits | Accept | Contracts F.6 text. |
| 01 foundations | 14 | No `pino`; small JSON logger | Accept | Contracts F.7 text. |
| 01 foundations | 15 | Package notes (no `@types/node-cron`, better-auth pin, forms workspace dep) | Modify | Pin is 1.7.22 (what plan 02 verified) with fallback 1.7.18, not 1.7.18 only. |
| 01 foundations | 16 | Sentry and instrumentation file layout | Accept | Already in K.2. |
| 01 foundations | 17 | `build` script and tsconfig include | Accept | Contracts K.1. |
| 01 foundations | 18 | `contract-block.sh` and `db-create.sh --recreate` | Accept | Contracts K.2, C.5. |
| 02 auth and email | 1 | `auth_two_factor` needs three more columns (migration 0001) | Modify | Accepted, folded into `0000_init` and C.1 (decision f); no 0001; plan 02 Step 5 only checks. |
| 02 auth and email | 2 | `getAuth()` plus lazy `auth` | Accept | Contracts H.18. |
| 02 auth and email | 3 | `loadViewer`, `viewerFromHeaders`, `src/lib/next-path.ts` | Accept | Contracts H.18, K.2. |
| 02 auth and email | 4 | `listSessions` clock, `currentSessionToken` | Accept | Contracts H.18. |
| 02 auth and email | 5 | No reset server actions; Better Auth endpoints | Accept | Removed from contracts H.20 and L; plan 06 coverage test fixed (it would have failed). |
| 02 auth and email | 6 | `acceptInvite` must set `email_verified` and the credential account | Accept | Plan 03 M1.5 already does (checked in its tests). |
| 02 auth and email | 7 | Second-step account actions use Better Auth | Accept | Plan 03 M1.7b; contracts H.20 lists the two extra actions. |
| 02 auth and email | 8 | New shared files list | Accept | Contracts K.2. |
| 02 auth and email | 9 | `client.ts` lint (duplicate of plan 01 item 10) | Accept | Fixed once in contracts C.2. |
| 02 auth and email | 10 | `getShell` isolation entry; P adds the rest | Accept | Contracts H.4. |
| 02 auth and email | 11 | `PASSWORD_RULES_NOT_MET` message | Accept | Contracts H.18. |
| 03 identity | 1 | Ownership gap: security cards, reset page, account actions | Accept | Decision h; M1.7b builds them, plan 02 none; K.1, K.2, H.20, handoff agree. |
| 03 identity | 2 | DTO additions (accepted-by, invited-at, partner KPIs) and `invites.invitee_name` | Reject | Needs columns with no source and a migration; the plan already degrades each screen. Recorded in contracts H.0 notes. |
| 03 identity | 3 | Delete sessions in the action after commit | Accept | Contracts B.6, H.3, H.5, H.6. |
| 03 identity | 4 | Additions inside P modules | Accept | Registry in H.1 and H.6; files in K.2. |
| 03 identity | 5 | `createPartner` always creates the invite row | Accept | Contracts H.6. |
| 03 identity | 6 | `partner.upsert` version for edits | Accept | Contracts G. |
| 03 identity | 7 | CMS cursor operator `greater_than_equal` | Accept | Contracts H.16. |
| 03 identity | 8 | Audit subject type `access_request` | Accept | Contracts F.4. |
| 03 identity | 9 | Manager-change email | Reject | No template or kind; scope; M4.1 drops the promise from the hint. |
| 03 identity | 10 | Agreement PDF route | Reject | Legal has not supplied the PDF; button says so. |
| 03 identity | 11 | Turnstile site key as a prop | Accept | Contracts I. |
| 03 identity | 12 | Invite-only rows have the invite id | Accept | Contracts H.0 notes. |
| 03 identity | 13 | Route map: pages do not call `listOpenInvites`; `?selected=` | Accept | Contracts L. |
| 03 identity | 14 | `previewInvite` agreement version | Accept | Contracts H.0 notes. |
| 03 identity | 15 | Won YTD semantics | Accept | Contracts H.0 notes. |
| 03 identity | 16 | QR code for two-step enrolment | Reject | Dependency not in the list; key plus link works; M.3 item 33. |
| 04 registrations | 1 | New ConflictError reasons | Accept | Contracts E. |
| 04 registrations | 2 | Staff DELETE policy on `registration_events` and `registration_messages` | Accept | Decision i; contracts C.3, copied by plan 01. |
| 04 registrations | 3 | `sendManagerMessageAction` input | Accept | Contracts H.20. |
| 04 registrations | 4 | H4.8 announces stage change, end change, expiry; extension hazard | Modify | Decision d; R owns `announceRegistrationChange` (W0-c stub), H4.8 calls it; poll rule (never move an extension back, ignore end date while `update_end` is pending or failed) and 7 tests added in the HubSpot plan; echo of the portal expiry is not announced twice. |
| 04 registrations | 5 | Shell and layouts: real notifications | Accept | Applied by W2-a Step 0 (plan 06 M5.4), before CCR-3; contracts K.1, K.3. |
| 04 registrations | 6 | Additive contract entries (`conflictInputs`, `hubspotConflictHintsAction`, `sendExpiryReminders`, files, `getShell` usage) | Accept | Contracts H.7, H.17, H.20, K.2. |
| 05 documents | 1 | Allowed-path glob | Accept | Same as plan 01 item 1. |
| 05 documents | 2 | Inline video playback | Reject | v1 downloads videos; M.3 item 35. |
| 05 documents | 3 | Sweep of abandoned uploads | Reject | Not needed for launch. |
| 05 documents | 4 | Configurable `PUBLIC_SITE_URL` | Reject | No staging site; a constant is enough. |
| 05 documents | 5 | Hard delete of documents | Reject | Tombstones keep open history. |
| 05 documents | 6 | Client-safe upload types in `src/lib/document-upload.ts` | Accept | Contracts K.2. |
| 05 documents | 7 | Delete `src/data/documents.ts` in M5.4 | Accept | Already in plan 06 M5.4. |
| 06 admin, infra | CCR-1 | `next.config.ts` standalone output | Accept | Written in plan 01 M0.2 Step 5b (W0-a); no request needed. |
| 06 admin, infra | CCR-2 | `/api/health` exempt from the review gate | Accept | Written in plan 02 M1.1e with a test. |
| 06 admin, infra | CCR-3 | Wire the search palette into `shell.tsx` | Accept | W2-a Step 0; M4.3 logs a `note`, not `blocked`. |
| 06 admin, infra | CCR-4 | `package.json`/`tsconfig.json` edits in Wave 2; Next bump | Accept | Wave 2 serial (K.3); bump is portal only (decision j). |
| 06 admin, infra | CCR-5 | Env comment; `DATABASE_OWNER_URL` in the container | Modify | (a) accepted; (b) deferred, an open decision for the user. |
| 06 admin, infra | CCR-6 | Module map, allowed paths additions | Accept | Contracts K.2; handoff paths. |
| 06 admin, infra | CCR-7 | Database capacity | Modify | Decision a: pools 6 and 8, limit 20, `max_connections` 50 (plan asked 40), open decision. |
| 06 admin, infra | CCR-8 | Retention of declined access requests | Reject | Not in v1. |
| 06 admin, infra | CCR-9 | CI database roles | Accept | Contracts J.2. |
| 06 admin, infra | CCR-10 | `PORTAL_JOBS_ENABLED` default in deploy | Accept | Contracts I comment. |
| HubSpot | 1 | System pool starves the jobs | Accept | Decision a; contracts C.2 (8 and 6, 30 s timeout), limit 20. |
| HubSpot | 2 | `runExpiry` keeps enqueueing when HubSpot is unconfigured | Accept | Decision b; contracts M.2 item 17 rewritten. |
| HubSpot | 3 | `hubspotForRequest()` for track R | Accept | Decision c; contracts H.13c; H4.7 code and tests; plan 04 uses it. |
| HubSpot | 4 | No owner for stage and expiry notifications | Modify | Decision d: owner is R's `announceRegistrationChange`; the proposed in-transaction `notifyStageChange` is rejected. |
| HubSpot | 5 | Module map additions | Accept | Contracts K.2. |

## (b) Edits made, per file

Edit counts are the number of separate replacements.

- `2026-11-12-partner-portal-00-contracts.md` (about 85): C.1 three `auth_two_factor` columns; C.2 pools 6 and 8 with a connection timeout and the lint fix; C.3 staff DELETE policies; C.4 `conn_limit=20` and the droplet capacity paragraph (open decision); C.5 no auth migration, `--recreate`, `contract-block.sh`; B.6 and H.3, H.5, H.6 session deletion after commit; E three ConflictError reasons; F.1 test-file exemption; F.4 `access_request`; F.6 isolation test notes; F.7 logger; G `partner.upsert` version; H.0 notes (invite-only rows, dropped mock details); H.1, H.6, H.7, H.11 registry additions (`listManagerRecipients`, `listPartnerAdminRecipients`, `conflictInputs`, three document functions); H.13c new (`lookupCustomer`, `conflictingDeals`, `hubspotForRequest`); H.14 D-owned extras; H.16 cursor and `createCmsClient(config?)`; H.17 `announce.ts` stub and `sendExpiryReminders`; H.18 `getAuth`, `loadViewer`, `viewerFromHeaders`, `listSessions` clock, `currentSessionToken`, rate-limit in M1.2, no reset actions; H.19 no HubSpot re-exports; H.20 account actions, `sendManagerMessageAction` input, `hubspotConflictHintsAction`; I env owner and comments, Turnstile prop; J.2 NODE_ENV line and CI roles; J.3 `testDb`, `makeUser` password timing, structural `makeSyncedDeal`; J.5 fixture changes; K intro, K.1 rows, K.2 rows, new K.3 (shared file owner per phase); L route changes; M.1 intro, M.2 items 16 and 17, M.3 item 13 and new decisions 31 to 35, new M.5 consolidated unknowns.
- `2026-11-12-partner-portal-01-foundations.md` (22): better-auth pin; `next.config.ts` Step 5b; `deal-rules.ts` copied whole; migration checklist for the three columns; Step 15 post-copy edits removed; announce stub Step 11b; password timing text; `conn_limit=20`; file tables; CCR resolution; unknowns pointer.
- `2026-11-12-partner-portal-02-auth-and-email.md` (15): Step 5 replaced (no 0001); new Step 6b (passwords in helpers, seed, fixtures test); `/api/health` exemption and test in `proxy.ts`; verified-facts and file-table text; unknown 4 resolved; CCR resolution.
- `2026-11-12-partner-portal-03-identity.md` (2): CCR resolution table, unknowns pointer. The plan itself needed no code change.
- `2026-11-12-partner-portal-04-registrations.md` (11): M2.3 replaces the announce stub; `readOnlyHubspot` through `hubspotForRequest`; `StageLabel` import; `expireRegistrations({ db, clock })` fix (it would not have compiled); prerequisites and start conditions; CCR resolution.
- `2026-11-12-partner-portal-05-documents.md` (3): `document-purge.ts` is a Modify of the W0-c stub, not a Create; CCR resolution; unknowns pointer.
- `2026-11-12-partner-portal-06-admin-infra-hardening.md` (26): M0.6 no longer asks for CCR-1 and CCR-2; M4.3 `note` instead of `blocked`; M5.4 gains Step 0 (shell wiring); coverage test no longer lists the two reset actions; `max_connections` 50 and `conn_limit=20` throughout; CCR resolution.
- `2026-11-11-partner-portal-hubspot-integration.md` (26): `hubspotForRequest` (code, tests, step 5 text); `pollDeals` extension rule, announce call and 7 new tests; `expireRegistrations` announce call and test; reconciliation items 22; CCR resolution; W0-b wording for `env.ts`.
- `2026-11-11-partner-portal-master-plan.md` (1): errata note under the title.
- `docs/partner-portal/BUILD-HANDOFF.md` (20): state, reading order, "Plans" table, amendments 7 to 9, overnight row for `max_connections`, allowed paths, Setup pre-commit step, Wave 0 table (W0-fb), Wave 1 tables (new orders, owned paths), dependency table, W2-a Step 0, route table, kickstart prompt, subagent brief, sample-line note, open decisions.
- `docs/partner-portal/PLAN-REVIEW.md`: this file.

## (c) Dependency table

Wave 0 order: W0-a M0.2, W0-b M0.3, W0-c M0.4, W0-d M1.2, W0-e M0.7, W0-f M1.1a to g, W0-fb M1.2b, W0-g M0.5a to d. Track orders: H 4.1, 4.2, 4.7, 4.3, 4.4, 4.5, 4.6, 4.8, 4.9, 4.10; P M1.3, M1.3b, M1.4, M1.5, M1.6, M1.8, M1.7, M1.7b, M4.1; D M3.1, M3.2, M3.3; A M0.6, M4.3, M4.2; R M2.1, M2.3, M2.2, M2.4, M2.6, M4.4.

| Task | Needs merged first | Source |
|---|---|---|
| H4.2, H4.3, H4.1 | Wave 0 | plans |
| H4.7 | H4.2 | `lookup.ts` imports `client` and `types` |
| H4.4 | H4.2, H4.3 | outbox uses types and `nextDelayMs` |
| H4.5, H4.6 | H4.4 | `Handlers` map |
| H4.8 | H4.3, H4.4 | `decideInbound`, `enqueue`; announce stub from W0-c |
| H4.9 | H4.8 | `triggerPoll` |
| H4.10 | H4.4 | `hubspot_outbox` |
| P M1.4, M1.5, M4.1 | H4.4 for the enqueue steps only | plan 03 "Requires H4.4" steps |
| P M1.5 to M1.8 | the previous P task | invite core, invites repo |
| A M0.6 | Wave 0 (`next.config.ts` M0.2, `/api/health` M1.1e) | CCR-1, CCR-2 |
| A M4.2 steps 7 to 9 | H4.10 | health card |
| R M2.1 | H4.2, H4.7, P M1.5, P M1.8 | `hubspotForRequest`, `sendManagerMessageAction`, `listManagerOptions` |
| R M2.2 | M2.1, M2.3, H4.4, H4.7 | `enqueue`, conflict hint |
| R M2.4 | M2.2, H4.4, H4.8 | `update_end`, black box test of `expireRegistrations` |
| R M2.6 | M2.4, D M3.2 | `listNewDocuments` |
| D M3.x | Wave 0 | templates (W0-g), `run.ts` (W0-fb) |
| W2-a to W2-h | all Wave 1 merged | serial |

No cycle: H needs only Wave 0; P needs H4.4 for three steps; R needs H, P, D; A needs H4.10 for one step. Before the review the handoff let R start M2.1 at H4.2 and put M1.8 after M1.7b, which would have left R unable to start; it also let A reach M4.2 before H4.10.

## (d) Consolidated known unknowns, in verification order

This is a copy of contracts M.5.

| # | Unknown | First task that verifies it | Fallback |
|---|---|---|---|
| 1 | pnpm 10 edits `pnpm-workspace.yaml` for packages younger than a day; `better-auth@1.7.22` installs cleanly; `zod` resolves to 3.25.x; `@sentry/nextjs` 9.47 peer range names Next 15 (01 1, 2, 3; M.1 16) | W0-a, M0.2 Steps 2 and 4 | revert the workspace file and install `better-auth@1.7.18`; `zod@^3.25`; if Sentry events never arrive, move to a Sentry major that supports Next 16 in M5.1 |
| 2 | HubSpot capability check: association labels, webhooks on our plan, unique custom property, the sandbox or developer account tier, rate limits | M0.1 stub in W0-a (UNVERIFIED), a person later | association labels off, polling only, the fallback in HubSpot plan section 5 |
| 3 | Drizzle and drizzle-kit features in C.1 (gin trigram, `pgSequence`, partial unique on an expression, `check`, readonly enum tuples), `Tx` typing, `set_config` in a transaction (M.1 1, 11; 01 10) | W0-b, M0.3 Steps 11 and 12 | hand edit `0000_init.sql`; local `Writer` type; `schema.test.ts` is the judge |
| 4 | Custom `app.kind` startup option on the system pool; `VITEST_POOL_ID` per worker; `CREATE DATABASE ... TEMPLATE` needs `CREATEDB` for the owner (M.1 10, 12; 01 4) | W0-b, M0.3 Steps 13 to 17 | `pool.on('connect')` set_config; `fileParallelism: false` |
| 5 | RLS plus `FORCE`, `FOR UPDATE` and `RETURNING`, the `child_partner_id` trigger, the new staff DELETE policies; partner admins taking `FOR UPDATE` on `users`, `invites`, `access_requests` (M.1 17; 03 6) | W0-b, M0.3 Step 16 (`rls.test.ts`), then P at M1.5 | add the SELECT clause to the UPDATE policy; `pg_advisory_xact_lock(hashtext(id))` |
| 6 | The mock JSON sizes and the exact counts in the schema and fixtures tests (25 tables, 5 gin indexes, 508 opens) hold only while `apps/portal/src` is unchanged since `58747992`; a drizzle-kit patch release can change the SQL text; other Postgres majors (01 6, 7, 10) | W0-b, M0.3 Steps 12, 19, 20 | compare the figures in the fixtures test instead of the byte sizes |
| 7 | `node-cron` started from `instrumentation.ts` runs once per process, not in `next build`; `register()` in `next start` and in the standalone image (M.1 14, 18; 01 5; U2, U3, U13) | W0-c, M0.4 Step 16; standalone in A, M0.6 Step 12 | start the scheduler from a small custom server entry; copy `drizzle/` and `rls.sql` explicitly in the Dockerfile |
| 8 | Next 16 server actions: `revalidatePath` after the handler returns, plain objects reach a client component, `'use server'` exports (M.1 8, 9; 01 9; 05 2) | W0-d, M1.2b Step 2, then the first converted screen | call `revalidatePath` inside the handler; `router.refresh()` in the client |
| 9 | Better Auth with `users` as the user model, Postgres generated ids, the `auth_*` table shapes, scrypt hashing, accept-invite credential rows, `twoFactor` TOTP with 10 backup codes (M.1 2 to 5; 02 1; 01 2) | W0-e, M0.7 Steps 1 to 11 (the S1 to S7 gate) | `auth_user` table; default hasher; email-code second step; Auth.js v5 (M0.7-F, unrun code) |
| 10 | Google and Microsoft sign in end to end, including the Entra optional claims `email` and `xms_edov` (M.1 6; 02 2) | a person, with dev OAuth apps (result stays `PROVISIONAL (OAuth unverified)`) | Google only, or Auth.js |
| 11 | The Next 16 `proxy.ts` runs on Node, `getSessionCookie` reads the cookie, the path header name `x-middleware-request-x-portal-path` (M.1 7; 02 6) | W0-f, M1.1e Steps 2 and 6 | proxy only checks that a session cookie exists; read `x-middleware-override-headers` |
| 12 | Real Postgres RLS against the plan 02 tests that ran on PGlite: the `getShell` isolation probe and the manager and `staff_scopes` lookup as a partner (02 3) | W0-f, M1.1d Steps 8 and 9 | report `blocked`, do not weaken the test; check the policies against C.3 |
| 13 | The per IP limit key behind Caddy and Cloudflare trusts `x-forwarded-for` (02 5; U6) | M5.1 (W2-c), then the first real request after deploy | `trusted_proxies` for Cloudflare ranges; `advanced.ipAddress.ipAddressHeaders` |
| 14 | The Sign in client code has no DOM test; the two-step view is exercised end to end only after P builds the screen that turns the second step on (02 7) | W0-f, M1.1g Step 6 (manual), then M1.7b Step 12 and the W2-b E2E | none needed beyond the manual and E2E checks |
| 15 | Email builders: invite URL, inviter name, decline reason, requester name and partner and document titles appear in the HTML and are escaped; wording is not pinned (03 10; 04 8; 05 4) | W0-g, M0.5b and M0.5c tests, then each track's first email assertion | adjust the assertion, not the builder call |
| 16 | `@hubspot/api-client` `apiRequest` shape and `fetch`-style `Response` (M.1 15) | H4.2 | a thin `fetch` wrapper with the bearer token and the same 429 retry |
| 17 | `makeSyncedDeal` against the real `FakeHubspot` (structural type, `stageIds`, `createDeal`); `FakeHubspot` member names frozen (01 8) | H4.2 typecheck | adapt `makeSyncedDeal` in a Wave 0 follow-up |
| 18 | HubSpot webhook signature scheme and the poll rule for extensions (decided at the review) | H4.8, H4.9 | polling alone ships |
| 19 | Drizzle query forms used at runtime: `onConflictDoNothing({ target })` on a unique index, nested `select({ user: users, region: ... })`, `` sql`excluded.email` ``, `.for('update')` after `limit()`, `getTableColumns` with joins, correlated `notExists`, `min` and `max` on timestamptz, `count(*) filter`, the wrapped `DrizzleQueryError` (03 5; 04 1, 2, 3; 05 3) | the first test that runs each: P M1.3 and M1.5, R M2.1 step 1 and M2.4 step 2, D M3.2 Step 8 | the fallback written in each step (no target, two queries, raw `sql`) |
| 20 | Test helper defaults satisfy the constraints; `rateLimit` allows exactly `limit` calls per window; `asStaff`, `asPartner`, `makeInvite`, `makeDocument` behave as J.3 says; `seedMockData` figures (03 7, 8; 04 6, 9; 05 4, 5) | the first test of each track that uses them | fix the test, not the helper; report a seed defect as W0's |
| 21 | Better Auth server-side calls inside actions: `signInEmail` plus `nextCookies` persists the cookie after accept-invite; `auth.api.getSession`; `enableTwoFactor`, `verifyTOTP`, `changePassword` and the error codes in `auth-errors.ts` (03 1, 2, 11) | P, M1.5 Step 1 and M1.7b Step 12 | `signedIn: false` and sign in by hand; map errors by message text, or call `authClient` from the client |
| 22 | Turnstile explicit rendering and siteverify; real keys cannot run overnight (03 3) | P, M1.3, then a person with production keys | always-pass test keys in development |
| 23 | Payload REST query for the website application intake (`where[createdAt][greater_than_equal]`, `Authorization: users API-Key`, `hasNextPage`) (03 4) | P, M1.3b stub test, then a person once the CMS service user exists | `greater_than` with a cursor one second earlier |
| 24 | R2 presigned PUT and GET against a real bucket: CORS, `HEAD` content type, ranged read; no streaming of videos in v1 (M.1 13; 05 1, 6; U7) | D, M3.1 Step 24 and M3.2 Step 41 (R2 lines, a person with a dev bucket) | compare content type lower cased, rely on magic bytes; `readHead` with a `Range` |
| 25 | `listNewDocuments` semantics (documents added or replaced in the last 30 days relative to the passed clock, filtered by audience) (04 7) | R, M2.6, after D's M3.2 | fix the test in R's file |
| 26 | `exactOptionalPropertyTypes` is on (03 9) | P, M1.3 typecheck | harmless if off |
| 27 | Undo and the outbox race: the window between HubSpot creating a deal and the portal storing its id; decision emails go out inside the undo window; a missed reminder day; UTC dates (04 10 to 14) | accepted limits, documented; pinned by R's tests where possible | none; revisit after the pilot |
| 28 | Open recording is not de-duplicated; fan out of `document_new` notifications is one insert per active partner user; abandoned uploads and a failed R2 delete leave orphans; material requests with no recipient are logged only (05 7 to 11) | accepted limits for v1 | 60 second de-duplication in `recordDocumentOpen`; a sweep job; an email outbox |
| 29 | After the Next 16.4.6 bump (portal only) `proxy.ts` and nonce CSP behave as documented (U1) | M5.1 step 2 (W2-c) | adapt `proxy.ts`; `csp.ts` is pure |
| 30 | Better Auth rate limit keys, `useSecureCookies`, a single `hooks.before` (U5); `pnpm audit --json` shape (U11); GitHub Actions details `actionlint` cannot know (U12); Playwright resolves `@/` imports and honours `PORTAL_TEST_DATABASE_URL` (U4); outbound HTTPS to `challenges.cloudflare.com` for the Apply E2E step (U8); spec labels still match the converted screens (U9); axe at 393 px (U10) | M5.1 steps 6 and 7; M5.1 step 1; the first CI run; E2E step 5; E2E step 7; E2E step 11; M5.2 step 7 | each row's fallback in plan 06 |
| 31 | The restore drill's `aws s3` paths and the R2 lifecycle rule (U7 of plan 06) | M5.5 (W2-f), handover item 6 | fix the command |
| 32 | Raising `max_connections` to 50 fits the droplet's memory after the resize (U14) | handover item 1.3, with the operator | lower the pools (system 4, request 3, `CONNECTION LIMIT` 8) |

## (e) Open decisions for the user

1. **Second sign-in step required or optional.** Built as optional per user (the proposal lists it open). Recommendation: required for CleanStart staff, optional for partners at launch, revisit after the pilot. A one-line change in the sign-in gate when decided.
2. **Postgres `max_connections` on the droplet (20 today).** The CMS pool takes 15, the portal 14 (request 6, system 8, `CONNECTION LIMIT` 20), so the droplet needs about 50. It is a Postgres restart on the database the production CMS uses, so it needs the operator's approval (handover item 1.3); no agent runs it. If declined, lower the pools (system 4, request 3, limit 8) and accept slower jobs. Recommendation: raise to 50 in a quiet minute after the resize.
3. **Next.js advisories in `apps/cms` and `apps/web`.** `next@16.2.5` has 21 advisories (5 critical, 7 high); M5.1 bumps the portal only. The CMS and the web app carry the same advisories. Recommendation: bump them in their own change with their own build and test pass, before the portal's launch, not as part of this build.
4. **`DATABASE_OWNER_URL` inside the app container** (plan 06 CCR-5b). The container migrates on start, so the owner credential, which bypasses row level security, is in its environment; a code-execution bug could use it. A one-shot migration service removes this. Recommendation: do it before real partner data goes in; it is a small compose and Dockerfile change that the build deliberately does not make.
5. **Product limits kept for v1, each cheap to add later:** no QR code in two-step enrolment; no purge of declined access requests; videos download instead of streaming; no email when a partner manager changes; the agreement PDF is not served and `agreement_version` is `draft-0` until legal supplies the text; dropped mock details ("Accepted by", "Invited 5 Nov", two partner KPIs). Recommendation: accept for v1.
6. **Deal rules to confirm** (all in `deal-rules.ts`): 90 day protection counting the acceptance day, one 30 day extension, 2 business day review target, UTC calendar (a registration submitted between 00:00 and 05:30 IST carries the previous Indian date), a partner manager may decide any region, only partner managers manage CleanStart staff, staff marketing may upload documents, a technical partner user sees no deals. Recommendation: confirm with the core team before the pilot.
7. **Email is best effort with no email outbox** (contracts M.3 item 15): a crash between commit and send loses that email; invites and resets have a resend, deal emails have the in-app notification. Recommendation: accept.
8. **Plans must be committed and pushed to `development` before the run** (the worktree is cut from `origin/development` and Wave 0 copies code out of the contracts file). They are untracked today.
9. **Operator tasks the build cannot do:** Google and Microsoft OAuth apps (including the Entra claims `email` and `xms_edov`), the CMS service user and API key for website intake, Turnstile production keys, the private R2 bucket and CORS, the production HubSpot private app and webhook secret, the Brevo sender, DNS and Caddy for `partners.cleanstart.com`.

## (f) Residual risks I could not resolve

- **Nothing was run.** The plans' code was compiled and tested by their authors in scratch environments. My own additions (the poll rule and its 7 tests, the announce stub, `hubspotForRequest`, Step 6b helper edits, the proxy test, `next.config.ts` Step 5b) were written against the plans' code by reading and were not executed. A wrong test count or an anchor drift is possible; each is a Gate A failure that an agent fixes inside its task.
- **Track P is about 14,000 lines and serial** and R starts M2.1 only after P's M1.8. On one CPU with four tracks at once, P may not reach M1.8 before an unattended run ends; R would then idle. Mitigation in the handoff (M1.8 moved up); a person may want to start P first.
- **Better Auth version drift.** Plan 02 ran against 1.7.22, plan 01 originally pinned 1.7.18; the pin is now 1.7.22 with a fallback. A minor version change means re-running the S1 to S7 gate.
- **The Auth.js fallback code (M0.7-F) is unrun**, so a failed spike costs a day, not an hour.
- **Poll rule, failed `update_end` rows.** While an extension write is failed, the portal keeps its date and HubSpot keeps the old one until a person retries it from the health card; that is deliberate (a visible backlog, no silent loss) but it needs someone to look.
- **Shell wiring waits for Wave 2.** Until W2-a Step 0, signed-in users see the mock's search entries and bell items (static data, no leak), and the search palette and notifications popover are covered only by unit tests.
- **Exact test and file counts in plan steps** (for example "122 tests in 25 files") are from the authors' scratch runs and will drift by one or two after my additions; an agent should read a count mismatch as a prompt to check, not a failure.
- **Not reviewed in depth:** the long copy and screen markup edits in plans 03 to 05 (Before and After blocks against the mock) and the email template copy. I did not re-verify the "Before" blocks byte for byte.

## (g) Readiness verdict

**Wave 0 can start now**, once a person commits and pushes the contracts, the plans and `BUILD-HANDOFF.md` to `development` (open decision 8). What could stop it, in order of likelihood:

1. pnpm editing `pnpm-workspace.yaml` or rejecting `better-auth@1.7.22` at install (fallback written).
2. The first real run of drizzle-kit on the full schema or of the RLS script (M.5 rows 3 to 5); the plans carry fallbacks, but a failure there blocks everything after it.
3. The Better Auth spike (M.5 row 9): OAuth stays `PROVISIONAL`, the rest has a fallback chain ending in Auth.js.
4. Local Postgres or disk state on the Mac (the memory notes a machine-wide `node_modules` wipe on 1 October: run `ls node_modules` before blaming a Turbopack crash).

Wave 1 can start from the `portal-w0` tag with the orders above. The droplet changes, the production HubSpot app, the OAuth apps and the CMS service user are not on the critical path of the build.

## What was and was not checked

Checked by script: every `@/` import in all nine plan documents resolves to a module a plan or the contracts creates, and every imported name is exported somewhere (a per-module check covers most files; the rest were read); audit event names, Action strings, email builder names and notification kinds used in code against the closed lists in the contracts (no mismatches); `table.column` references against C.1 (no missing columns); the isolation registry unions against the contracts (four additions made); file creation and modification per task across plans (one duplicate found and fixed, cross-plan edits recorded in K.3); `contract-block.sh` run against the edited contracts for every call in plan 01; dashes in every changed file (none added). Checked by reading: the CCR and known-unknown sections of all seven plans in full, the file structure, prerequisites, task headers and the code around every place an edit was made, the handoff and the contracts K, L and M. Not checked: runtime behaviour of any code, library behaviour, the byte match of every Find/Replace block in the plans against the mock, copy and markup edits, and anything on the droplet or in HubSpot.
