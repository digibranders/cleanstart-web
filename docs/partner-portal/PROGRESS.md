# Partner portal build progress

One line per event. Columns: time | task | event | track | sha | gates | note. Events: started, done, blocked, review-pending, merged, note.
Append only, one shell append per line. Never open this file in an editor tool.
2026-11-13 08:40 IST | setup | note | O | - | - | worktree portal-build created from origin/development e1f29982
2026-11-13 08:40 IST | M0.2 | started | O | - | - | tag, structure, dependencies, vitest
2026-11-13 08:41 IST | M0.2 | done | O | ede70d80 | A ok, B pending | portal-mock-v1 tag, deps, structure test; lockfile peer-suffix reshuffle for shared packages (kysely, noble/hashes), no version bumps
2026-11-13 08:43 IST | M0.2 | done | O | ede70d80 | A ok, B ok | B should-fix accepted: lockfile re-resolves jsdom optional peer @noble/hashes 1.8.0 to 2.4.0 (peer-suffix churn, in range; flag for morning review, check isomorphic-dompurify in cms/web)
2026-11-13 08:43 IST | M0.3 | started | O | - | - | W0-b
2026-11-13 08:45 IST | M0.3 | note | O | - | - | verified: set_config in tx, per worker DB via VITEST_POOL_ID and TEMPLATE, drizzle-kit features (gin op class, partial unique, sequence, check), startup option app.kind=system, FOR UPDATE under staff, child trigger, RETURNING under RLS; no fallbacks needed
2026-11-13 08:47 IST | M0.3 | done | O | cb45f3e5 | A ok, B pending | schema (25 tables incl. 3 auth_two_factor cols), drizzle/0000_init (pg_trgm + 5 trigram indexes), rls.sql, roles, db-create.sh, helpers, seed-dev; dbs cleanstart_portal and cleanstart_portal_test created; 10 files 67 tests
2026-11-13 08:51 IST | M0.3 | note | O | 7996814b | A ok | B findings 1-4 fixed, nits 5-6 skipped
2026-11-13 08:51 IST | M0.3 | done | O | cb45f3e5+7996814b | A ok, B ok | review fixes applied
2026-11-13 08:51 IST | M0.4 | started | O | - | - | W0-c
2026-11-13 08:52 IST | M0.4 | note | O | - | - | verified: instrumentation register runs once in next start, not in next build; scheduler starts with PORTAL_JOBS_ENABLED=true; production start refuses missing env
2026-11-13 08:52 IST | M0.4 | done | O | 7cdb4544 | A ok, B pending | .env.example, log, sentry, jobs lock/schedule/index and 8 stubs, announce stub, instrumentation; 17 files 91 tests
2026-11-13 08:55 IST | M0.4 | note | O | 858df971 | A ok | B findings 2,3,4(msg),6 fixed; finding 1 (env.ts superRefine does not name DATABASE_OWNER_URL until DATABASE_URL and AUTH_SECRET are set) left, contract copy; log redaction nits left
2026-11-13 08:55 IST | M0.4 | done | O | 7cdb4544+858df971 | A ok, B ok | 
2026-11-13 08:55 IST | M1.2 | started | O | - | - | W0-d
2026-11-13 08:56 IST | M1.2 | done | O | c2489ba6 | A ok, B pending | errors, withViewer/withSystem, recordAudit, notify, rate-limit, isolation registry and matrix (1 seed test, no repo modules yet), import rules; 25 files 119 tests; run.ts is M1.2b
2026-11-13 09:00 IST | M1.2 | note | O | ffa225a2 | A ok | B findings 2,3 fixed; finding 1 (isolation.test unchanged-probe does not snapshot untouched rows; contract F.6 change request) and nits 4-8 deferred
2026-11-13 09:00 IST | M1.2 | done | O | c2489ba6+ffa225a2+bd85850d | A ok, B ok | imports.test allow-list matches contracts F.1 (jobs, hubspot, auth, intake)
2026-11-13 09:00 IST | M0.7 | started | O | - | - | W0-e
2026-11-13 09:03 IST | M0.7 | done | O | 3f26adaa | A ok, B pending | Better Auth kept; S1-S5, S7 pass (password, TOTP second step, database sessions, getViewer, reset, lazy build); email one-time code also exercised in a throwaway test and passed; OAuth config only: PROVISIONAL (OAuth unverified); 26 files 160 tests
2026-11-13 09:08 IST | M0.7 | note | O | ed26e02d | A ok | B should-fix 1,2 and reset .catch fixed; nits left: disabled user/suspended company still get a session at sign-in (refusal planned in plan 02 around line 2255, M1.1), 2-step lockout untested, https APP_URL in prod not enforced by env.ts, MICROSOFT_TENANT_ID defaults to common
2026-11-13 09:08 IST | M0.7 | done | O | 3f26adaa+ed26e02d | A ok, B ok | Better Auth kept, PROVISIONAL (OAuth unverified)
2026-11-13 09:09 IST | M1.1a | started | O | - | - | W0-f, password rule, tokens
2026-11-13 09:09 IST | M1.1a | done | O | 56774e70 | A ok, B pending | checkPassword, assertPasswordOk, tokens; passwords.ts keeps the M0.7 hardening (caps, salt and key length) instead of the plan's replacement; M0.7 verifyPassword tests kept; 28 files 189 tests
2026-11-13 09:09 IST | M1.1b | started | O | - | - | W0-f, policies and permission matrix
2026-11-13 09:10 IST | M1.1b | done | O | 7f0b6f60 | A ok, B pending | ACTIONS, can, assertCan, 355 cell tests; matrix verified against contracts D.3 table (58 rows) and rules against D.4 mechanically; 29 files 544 tests
2026-11-13 09:10 IST | M1.1c | started | O | - | - | W0-f, sign in gate, rate limits, password rule, reset audit
2026-11-13 09:11 IST | M1.1c | done | O | 5f77cfb1 | A ok, B pending | gate, per-email and per-IP limits, password rule on reset and change, last login, reset audit; keeps the M0.7 .catch on the reset mail and adds the same catch on the changed notice (a failed mail must not fail the reset); closes the M0.7 nit (disabled user and suspended company no longer get a session); 30 files 555 tests
2026-11-13 09:14 IST | M1.1a-c | note | O | 56774e70,7f0b6f60,5f77cfb1 | A ok, B ok | B should-fix 1 (x-forwarded-for trust for per-IP rate limits, advanced.ipAddress/trustedProxies) deferred to W2-c security pass M5.1 and must be fixed before deploy; should-fix 2 (timing) fixed in next commit; D.3 vs D.4 null-region wording is a contract text discrepancy, code matches D.4
2026-11-13 09:14 IST | M1.1c | note | O | 7b2c3cf2 | A ok (lint, typecheck, test) | fix: refused sign in (disabled, invited, suspended company) now runs one scrypt verify against a random dummy hash before the same error; build run with M1.1d
2026-11-13 09:14 IST | M1.1d | started | O | - | - | W0-f, sessions, guards, homeFor, getShell
2026-11-13 09:16 IST | M1.1d | done | O | d8daa59b | A ok, B pending | next-path (safeNext, PATH_HEADER), sessions, requireViewer/Kind/Can/ActionViewer, homeFor, getShell + isolation entry; viewer.ts keeps the M0.7 loadViewer/viewerFromHeaders/getViewer unchanged and appends the guards; getShell probe passes on real Postgres RLS (known unknown 3 resolved); 34 files 602 tests, build exit 0
2026-11-13 09:16 IST | M1.1e | started | O | - | - | W0-f, proxy session redirect
2026-11-13 09:17 IST | M1.1e | done | O | a5c8da84 | A ok, B pending | proxy session cookie redirect with ?next, x-portal-path always overwritten, review gate kept first and /api/health exempt; gate adds a try/catch so a malformed Basic header answers 401 instead of throwing (2 extra tests, 24 total); getSessionCookie and Node runtime facts verified; 35 files 626 tests, build exit 0, Proxy listed
2026-11-13 09:21 IST | M1.1d-e | note | O | 7b2c3cf2,d8daa59b,a5c8da84 | A ok, B found 1 must-fix (safeNext open redirect via dot segments) + 2 should-fix | fixes in progress. Reviewer disclosed running pkill -f next-server; another session's Next dev server may have been stopped around 09:21
2026-11-13 09:22 IST | M1.1d | note | W0 | f03ced75 | A ok | fix: safeNext refuses dot-segment //host results, backslashes and /sign-in in any case or form; review gate compares SHA-256 digests with timingSafeEqual (build ok with node:crypto in proxy); dummy verify password sliced to 256
2026-11-13 09:22 IST | M1.1f | started | W0 | - | - | routes, layouts, shell
2026-11-13 09:25 IST | M1.1f | done | O | 6e11955d | A ok, B pending | navFor, layouts, shell without personas; checked over HTTP on a throwaway db cleanstart_portal_m11f (not in the browser pane); personas.ts, mock banner, notes and search data stay mock until M5.4/W2-a
2026-11-13 09:25 IST | M1.1d-e | note | O | f03ced75 | A ok | B must-fix (safeNext open redirect) and should-fix 2,3,4 fixed
2026-11-13 09:26 IST | M1.1g | started | O | - | - | SignIn conversion
2026-11-13 09:28 IST | M1.1g | done | O | fa326d0e | A ok, B pending | SignIn real (password, second step, social by configured keys, reset request); page decides signed in with getViewer, next only via safeNext; checked in the browser pane on throwaway db cleanstart_portal_m11g (dropped), second step view not exercised live; page.test.ts added (needs global React for vitest JSX)
2026-11-13 09:31 IST | M1.1f-g | note | O | 6e11955d,fa326d0e | A ok, B no must-fix | B should-fix: network-failure handling in SignIn/sign-out (fix in progress). Carry-over for every Wave 1 screen conversion: each converted page must call requireCan itself, the layouts only run requireKind (mock pages under partner/ and admin/ have no requireCan yet, a layout does not re-run on soft navigation)
2026-11-13 09:32 IST | M1.1f-g | note | O | 61501ee9 | A ok | network-failure fix: settleAuth helper (lib/auth-call.ts) turns a thrown auth call into {error}, SignIn handlers and signOut use it; signInWith shows the existing social error line; sign out stays and toasts on failure; no component test setup so logic is unit tested in the helper
2026-11-13 09:32 IST | M1.2b | started | O | - | - | runViewerAction and runPublicAction
2026-11-13 09:33 IST | M1.2b | done | O | 0f3a1ae4 | A ok, B pending | runViewerAction, runPublicAction copied from contracts F.7 unchanged; 10 tests; run.ts does not itself assertCan or audit (handlers do, per F.8); zod parse runs before the session check, as the contract and its test pin; revalidatePath-after-handler still to be proven in the first converted screen (M.1 item 8)
2026-11-13 09:34 IST | M0.5a | started | O | - | - | email layout and transport
2026-11-13 09:36 IST | M0.5a | done | O | 3e0e8d90 | A ok, B pending | EmailTransport, Brevo adapter (10s timeout, no retry, stubbed fetch tests), renderEmail, sendEmail, FakeEmailTransport, urls; 32 tests; plan code used as written; one addition: send.test stubs global fetch so a shell with Brevo keys can never reach the network
2026-11-13 09:36 IST | M0.5b | started | O | - | - | onboarding templates
2026-11-13 09:37 IST | M0.5b | done | O | 0a627949 | A ok, B pending | 10 builders (12 cases, 60 tests) plus shared helpers and the escaping harness; plan code used as written; M0.5c (11 more builders) replaces templates/index.ts
2026-11-13 09:38 IST | M0.5b | note | O | 545e2709 | A ok | amended the commit (sha above replaces the one in the done line): the harness dash check had literal en and em dashes in its regex, now written as unicode escapes so the dash grep is clean; lint, typecheck, test re-run green, build unaffected (test file only)
2026-11-13 09:38 IST | M1.1f-g | note | O | 61501ee9 | A ok | B should-fix (network failures in SignIn and sign-out) fixed via settleAuth helper
2026-11-13 09:39 IST | M0.5c | started | O | - | - | deal, extension, document and manager templates
2026-11-13 09:40 IST | M0.5c | done | O | dc540547 | A ok, B pending | 11 builders (13 cases, 65 tests) and the 21 export index, email folder 155 tests; plan code used as written; whole suite 49 files 830 tests, build exit 0; M0.5c steps ticked
2026-11-13 09:40 IST | M0.5d | started | O | - | - | wire auth mail
2026-11-13 09:41 IST | M0.5d | done | O | 3b7efb19 | A ok, B pending | auth-mail.ts sends through sendEmail with buildPasswordReset and buildPasswordChanged (plan code as written); extra test: a failed send resolves and never logs the token; auth.ts catch wrappers unchanged; spike gate still 7 pass; 50 files 834 tests, build exit 0. Note: log transport (M0.5a) logs links outside production, so in dev without Brevo the reset link appears in the console; production never
2026-11-13 09:44 IST | M1.2b,M0.5a-d | done | O | 0f3a1ae4,3e0e8d90,545e2709,dc540547,3b7efb19,6aeccdc4 | A ok, B ok | B should-fix: log transport now logs links only when NODE_ENV=development (fixed); void sendPasswordResetEmail may be dropped on serverless, use after() (deferred to W2-c M5.1); nits deferred
2026-11-13 09:44 IST | W0 | done | O | 6aeccdc4 | A ok (836 tests, build 0, isolation matrix passing) | tag portal-w0
