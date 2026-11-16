# Partner portal security pass (M5.1)

Date: 2026-11-13. Branch `feat/portal-build`. Run by the orchestrator (Wave 2, W2-c). Gate B found a lockfile problem and four documentation and deploy gaps; all are fixed in the follow-up commits and the lockfile claim below is the corrected one.

| Check | Command or test | Result |
|---|---|---|
| Dependency audit before | `node apps/portal/scripts/audit-portal.mjs` | `39 advisories for apps/portal, 18 high or critical.` (Next 16.2.5, Sentry 9.47.1 and the Vitest 2 toolchain) |
| Dependency audit after | `pnpm --filter @cleanstart/portal audit:deps` | `0 advisories for apps/portal, 0 high or critical.` |
| Security headers | `vitest run src/server/security/headers.test.ts src/proxy.test.ts` | 37 passed |
| CSP unit tests | `vitest run src/server/security/csp.test.ts` | 8 passed |
| CSP in a browser (development server) | `playwright test e2e/security.spec.ts --project=desktop` | 6 passed (the three header tests and the three `securitypolicyviolation` tests). Historical: a full e2e run during the 2026-11-13 pass (before commit `2c83f7f3`) reported 73 passed and 5 failed accessibility findings; no log of that run is kept and it has not been repeated since, so treat it as unverified. |
| CSP in a browser (production build) | a one-off Playwright script against `next start`, signed out, as a partner admin and as a partner manager, 15 routes including `/apply` with Turnstile | 0 `securitypolicyviolation` events |
| CSP header on a production build | `next start` with production variables, `curl /sign-in` | every `<script>` and stylesheet link carries the request nonce; the header carries `strict-dynamic`, HSTS and `upgrade-insecure-requests` |
| Cookie flags | `auth-session.test.ts` "session cookie" | passed (8 in the file) |
| Session fixation and logout | `auth-session.test.ts` "session fixation and logout" | passed |
| No account discovery | `auth.test.ts` "sign in gate" (W0-f) | passed |
| Rate limits: sign in, second step, per email | `auth.test.ts` "rate limits" (W0-f), `auth-session.test.ts` "which client address is trusted" | passed |
| Rate limits: public actions | `rate-limit-coverage.test.ts` | 20 passed on 2026-11-16 (the stricter round 2 version: comments stripped, every `ctx.ip` use checked, `invite-preview.ts` scanned, bypass fixtures) |
| Client address is not spoofable | `client-ip.test.ts`, `proxy.test.ts` "client address header", production smoke (below) | passed |
| Isolation matrix | `vitest run src/server/repo/isolation.test.ts` | 31 tests passed, measured again on 2026-11-16 (portal round 2, branch `feat/portal-s` cut from `47cc7d4a`). The global setup migrates the test database with `migrate.ts` and `rls.sql`, the same inputs as production; there is no staging database (CLAUDE.md deploy rules). |
| Tracked env files, secret scan | the two greps in plan 06 M5.1 step 9 | both print nothing, `exit=1` |

Production smoke on a real `next start` (production variables, `PORTAL_TRUSTED_PROXY_HOPS=1`): twelve sign in attempts with a different leftmost `X-Forwarded-For` entry and the same last entry returned `401` ten times and then `429` twice; a request with another last entry still got `401`. `/api/health` answered `200` with `Content-Security-Policy: default-src 'none'; frame-ancestors 'none'` and HSTS.

## Verification status (2026-11-16)

Re-measured in round 2: the isolation matrix (31 passed) and the dependency audit (`audit:deps` now audits production and development dependencies and fails with exit 2 when the registry cannot be read; 0 advisories for apps/portal). The per file test counts in the table above are from 2026-11-13 and have changed since (several of those files gained cases in round 2), so they are history, not a current count.

Not re-verified in round 2, and not provable from the repository: the Playwright runs (development server, production build and the 15 route CSP check), the production smoke with `PORTAL_TRUSTED_PROXY_HOPS=1`, and the two greps in plan 06 M5.1 step 9. They were run by hand on 2026-11-13 and left no log in the repository.

## What changed

- Next.js 16.4.6 (portal only), Sentry 9.47.2, Vitest 4 (`maxWorkers: 4` in place of `poolOptions`). Two scoped overrides in `pnpm-workspace.yaml` keep the test runner off the vulnerable toolchain: `vitest@4>vite` pins vite 6.4.6 and `vite@6.4.6>postcss` pins postcss 8.5.23. Only the portal uses Vitest 4 and vite 6.4.6, so no other workspace is affected.
- Release age exception: `next@16.4.6` and `vite@6.4.6` were published on 9 Nov 2026, under two weeks before this pass. They are security fixes that plan 06 M5.1 mandates, so the age rule is waived for them. `audit-portal.mjs` reports only the advisories on the path `apps__portal` and exits 1 on high or critical.
- Content Security Policy with a per request nonce in `src/proxy.ts`; the static headers and the closed API policy in `next.config.ts`; no `unsafe-inline` or `unsafe-eval` for scripts in production. The development server injects inline `<style>` elements with no nonce, so development (only) allows inline styles; the production build has none, which the production browser run confirms.
- The client address is resolved once in `src/proxy.ts` from `PORTAL_TRUSTED_PROXY_HOPS` and passed on in `x-portal-client-ip`, which the proxy deletes from every incoming request first. Better Auth's limiter and session record (`advanced.ipAddress.ipAddressHeaders`), `ctx.ip` and the accept-invite page read only that header. Default `0` trusts no forwarded header: every client is unknown and shares one bucket. Production sets `1` (Caddy overwrites `X-Forwarded-For`). If the address is unknown, rate limits still apply with the shared `unknown` bucket; none is skipped.
- The password reset email is sent with `after()` from `next/server`, so a frozen worker cannot drop it and the response does not depend on whether the address exists. Outside a request scope (tests, scripts) it runs immediately and is logged on failure.
- `useSecureCookies` is explicit (on exactly for https in production), and `src/env.ts` refuses to load a production `APP_URL` that is not https (loopback hosts excepted, for a local smoke test), and `createAuth()` keeps the same check through `assertSecureAppUrl` as a second line of defence for a start with `SKIP_ENV_VALIDATION`.

## Decisions and accepted risks

- CSP in `proxy.ts` with a nonce, `style-src-attr 'unsafe-inline'` for the screens' inline styles (reason in the plan). The prerendered `/_not-found` page is static, so it has no nonce and its scripts are blocked; the page is plain HTML.
- Next.js is 16.4.6 in the portal (advisories fixed); `apps/cms` and `apps/web` are still on 16.2.5 and carry the same advisories (to report to their owner).
- `pnpm-lock.yaml` was regenerated from the pre-M5.1 lockfile so that no version resolved for `apps/cms`, `apps/web` or `packages/*` moves (checked with a transitive closure comparison of every non-portal importer against `946298b7`). One residual difference: the `@ladle/react` entry of `packages/ui` gains an optional peer resolution of `@swc/helpers@0.5.23` (a version `next@16.4.6` brings into the lockfile). No version that `packages/ui` already resolved changed.
- `DATABASE_OWNER_URL` is present in the app container because migrations run on start. Follow up: run migrations as a one-shot job (CCR-5).
- `src/env.ts` was edited on 2026-11-16 with the product owner's authorisation (contracts K.3 otherwise forbids it) to close two gaps: in production `APP_URL` must be https (loopback hosts excepted), and the production check now lists `DATABASE_URL`, `AUTH_SECRET` and `DATABASE_OWNER_URL` together in one message instead of hiding `DATABASE_OWNER_URL` until the first two are set. `PORTAL_TRUSTED_PROXY_HOPS` is read by `proxy.ts` directly from the environment, as `PORTAL_REVIEW_PASSWORD` is, for the same reason.
- Google and Microsoft sign in were removed on 2026-11-16 (product owner decision), so the `MICROSOFT_TENANT_ID` risk no longer exists. Sign in is email and password with the optional second step.
- Rate limits are in memory and reset on restart (one container). IPv6 clients are keyed by full address, not by /64, in the app's own `rateLimit()`, which covers the per address limits on applications (`apply:ip`), invite preview and accept (`invite:ip`) and access requests (`access:ip`). A client that owns a /64 can rotate through it there; the per email and per domain limits on applications and access requests still apply. Better Auth's built in limiter (sign in, second step, password reset endpoints) normalises IPv6 to /64 by default, so it is not affected. The per user limits do not use an address.
- The unknown address bucket is shared: with `PORTAL_TRUSTED_PROXY_HOPS` wrong in production, applications and invite lookups are throttled together. That is the safe failure; the runbook lists the symptom.
- The Caddy block overwrites `X-Forwarded-For` with `CF-Connecting-IP`; the droplet firewall must accept 443 from Cloudflare only (handover item 7). Not verifiable from the repo.
- CSRF and origin checks: none were added. Better Auth checks the `Origin` of its own endpoints and Next checks the `Origin` of server actions. The HubSpot webhook and the health check are exempt from the review gate in `proxy.ts` and get no per request policy, so nothing added here can block them (tested in `proxy.test.ts`).
- The review password gate stays on until launch.

## Open items

- Gate B follow-ups (lockfile, https deploy check, ignore rules) are done; the reviewer's confirmation is not yet recorded.
- Report to the owners of `apps/cms` and `apps/web`: Next 16.2.5 advisories, Sentry 9.47.1.
- CCR-5b (migration as a one-shot service) and the `env.ts` changes above need the product owner or the contracts owner.
- Production `PORTAL_TRUSTED_PROXY_HOPS=1` is rendered by `deploy-portal.yml`; the first deploy must confirm the Caddy block really overwrites the header (a person, droplet).
