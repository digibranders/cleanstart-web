# Partner portal demo

A hosted copy of the real `apps/portal` on mock data, for reviewers and partners to click through. It is the same build as production. The only difference is what sits behind the app: the adapters for HubSpot, file storage, email and background jobs. Every screen is the screen the real app renders: there is no banner, no extra element, no shortcut login button and no demo markup of any kind.

Status: built on branch `feat/portal-r3-d`, not deployed. Nothing here touches Vercel or the database: the person deploying creates the Vercel project and runs `demo:setup`.

## How it is switched on

`PORTAL_DEMO_MODE=1`, exactly the string `1` (`true`, ` 1` or anything else is off). It is a runtime variable, never `NEXT_PUBLIC_*`, so one build serves the demo and the real portal. It is off by default and the deploy workflows never set it.

## What is simulated

| Part | In demo mode | Where |
| --- | --- | --- |
| HubSpot | An in memory fake seeded with the mock partners as companies (under the HubSpot ids the seed stores), their customers, and the mock's accepted and won deals as deals in a `demo-pipeline`. One extra open deal (Vyom Digital on Meridian Insurance) makes the staff queue show a conflict hint. The portal reads it as configured, so customer suggestions and conflict hints work. Writes go to the fake and are lost on a restart. | `src/server/hubspot/demo.ts`, `client.ts` |
| Files | Presigned style URLs served by the app itself (`/api/demo-files/put` and `/get`, 404 outside demo mode). A seeded document downloads as a generated placeholder (PDF, ZIP or MP4 container) whose text is the document title, the same bytes every time. An upload is checked against its ticket (type, exact size, signature, 10 minute expiry, HMAC) and kept in a small `demo_files` table (not part of the real schema, created by `demo:setup`), up to 8 MB. | `src/server/files/demo*.ts` |
| Email | The log transport: nothing is sent, even if Brevo variables are set. Invite and reset links are therefore not delivered: use the seeded accounts. | `src/server/email/transport.ts` |
| Jobs | The scheduler never starts (`PORTAL_JOBS_ENABLED` is forced off), so nothing polls HubSpot, drains the outbox or purges data. | `src/env.ts`, `src/instrumentation.ts` |
| Public datasheets | The Documents page lists none instead of calling a CMS. | `src/server/files/public-resources.ts` |
| Turnstile | Cloudflare's published always-pass test keys are the only values allowed: site key `1x00000000000000000000AA`, secret `1x0000000000000000000000000000000AA`. Unset, they are the default; any other value stops the start. | `src/env.ts` |

Not simulated: the database (real Postgres, real row level security, real sign in), the audit log and every permission rule.

## Guard rails

1. **Deployment guard** (`assertDemoModeAllowed`, `src/server/demo.ts`). It runs first thing in `register()` (`src/instrumentation.ts`, from the raw process environment, so it holds even with `SKIP_ENV_VALIDATION`), again in `loadEnv`, and at the start of both scripts. In production it refuses a `DATABASE_URL` or `DATABASE_OWNER_URL` whose host is loopback or a bare internal name (the droplet's database is `postgres` on the compose network). In every environment it refuses a host under `cleanstart.com`, a host on `PORTAL_DEMO_DENY_HOSTS` (comma separated hosts or parent domains) and an `APP_URL` of `partners.cleanstart.com`. It never prints a password. A refusal prints `Demo mode refused: ...` and exits non-zero in production (it throws elsewhere, like an invalid environment). Limit: it checks host names, so an IP alias of a denied host is not seen: put such an address on `PORTAL_DEMO_DENY_HOSTS`.
2. **Relaxed checks only for the demo.** With the switch on, `R2_*`, `BREVO_*`, `HUBSPOT_*` and `SENTRY_DSN` are not required in production. With the switch off nothing is relaxed (tested).
3. **Review gate.** In demo mode in production `PORTAL_REVIEW_PASSWORD` is required, so a hosted demo can never start open. It is the existing HTTP Basic gate in `src/proxy.ts`: everything is behind it except `/api/health`, `/api/hubspot/webhook` (answers 404, no secret is set), `robots.txt` and static assets.
4. **Never indexed.** Every response carries `X-Robots-Tag: noindex, nofollow` (`next.config.ts` sets it on every route and, in demo mode, the proxy sets it again on its own answers: the 401, redirects and health). `robots.txt` is `Disallow: /`. The real portal's output is unchanged.
5. **Reset needs the same guard.** `demo:reset` truncates every table, so it refuses unless `PORTAL_DEMO_MODE=1` and the deployment guard passes for both database URLs.

## Accounts

One shared demo password for every account: `Portal-dev-2026!` (the dev seed password, `DEV_SEED_PASSWORD` in `src/db/fixtures.ts`). It is demo only and not a secret; the review password in front of the site is the real gate. Role (screen set) in brackets.

Staff (CleanStart):

| Account | Role |
| --- | --- |
| gaurav.jadhav@cleanstart.com | Partner manager, India |
| omar.nasser@cleanstart.com | Partner manager, Middle East |
| rahul.menon@cleanstart.com | Sales, India |
| sara.almansoori@cleanstart.com | Sales, Middle East |
| ishita.bose@cleanstart.com | Marketing, all regions |

Partner users at Kestrel Systems (the partner the mock is written around):

| Account | Role |
| --- | --- |
| aditi.rao@kestrelsystems.in | Partner admin |
| karan.malhotra@kestrelsystems.in | Sales |
| sneha.iyer@kestrelsystems.in | Technical |

Other partner admins: layla.haddad@arborcyber.ae (Arbor Cyber), rahul.bhatia@saffronsecure.com (Saffron Secure), faisal.rahman@dunesnetworks.ae (Dunes Networks), ishaan.verma@vyomdigital.in (Vyom Digital), and `admin@seed-partner-01.example.com` to `admin@seed-partner-11.example.com` for the filler partners. Invited people (for example vikram.sethi@kestrelsystems.in, kunal.shah@cleanstart.com) have no login yet.

Sign in is limited to 10 attempts a minute for the whole site (one shared bucket on Vercel unless `PORTAL_TRUSTED_PROXY_HOPS=1` is set, see below), so a group of reviewers signing in together can see "too many attempts" for a minute.

## Setup and reset

Both read the environment of the shell, and `.env.demo.local` (git ignored) if it exists. Set `PORTAL_DEMO_MODE=1`, `DATABASE_URL`, `DATABASE_OWNER_URL` and `AUTH_SECRET` first.

```bash
pnpm --filter @cleanstart/portal demo:setup   # migrate, create demo_files, seed once
pnpm --filter @cleanstart/portal demo:reset   # truncate every table, then the same as setup
```

- `demo:setup` runs the migrations and `rls.sql` as `portal_owner` (`DATABASE_OWNER_URL`), creates the `demo_files` table with a grant to `portal_app`, then seeds the mock data (the dev seed, 21 partners, 15 registrations, 12 documents) if the `partners` table is empty. A second run seeds nothing. It creates no role and no extension: `portal_owner`, `portal_app` and `pg_trgm` must already exist (the first migration runs `CREATE EXTENSION IF NOT EXISTS pg_trgm`, which does nothing when the extension is there).
- `demo:reset` empties every table in the `public` schema (drizzle's migration history is kept), restarts the sequences, then runs setup. Run it before a review session to put the demo back to the seed.
- Both refuse unless `PORTAL_DEMO_MODE=1` and the deployment guard passes.

## The demo database

A Postgres 16 server with a database `portal_demo`, the roles `portal_owner` (owns the schema, used for setup and reset) and `portal_app` (what the running app uses; neither is a superuser and neither bypasses row level security) and `pg_trgm` installed. No hosted database service is involved.

- **TLS only.** The URLs carry `?sslmode=require` and the server certificate is self signed. The installed `pg` (8.21, `pg-connection-string` 2.13) reads `sslmode=require` as `verify-full`, which would refuse that certificate. `src/db/connection.ts` (`poolConnection`) therefore turns `sslmode=require` into an encrypted connection with `rejectUnauthorized: false`, which is what `require` means in libpq. It is used by the app's pools, `scripts/migrate.ts`, `scripts/demo.ts` and `drizzle.config.ts`. A URL without `sslmode`, or with any other mode, is passed through unchanged. Trade-off: the link is encrypted but the server is not authenticated, which is acceptable for a database of mock data and not for anything else; never use `verify-full` here without a CA file.
- **Direct connection, no connection pooler.** The system pool sets its role with a startup option (`-c app.kind=system`), and every request transaction sets `app.kind`, `app.partner_id` and `app.user_id` with `set_config(..., true)` for row level security. A transaction pooler (pgbouncer in transaction mode, Neon's pooled host) does not accept the startup option and must not be put between the app and the database: use the server's own host and port.
- **Connections.** The server allows 40. In demo mode each serverless instance holds two pools of one connection each (`src/db/pool-size.ts`), so two connections per warm instance. `PORTAL_DB_POOL_MAX` overrides both pools.

## Vercel project

Create a separate project for the demo. Do not reuse the website project.

| Setting | Value |
| --- | --- |
| Framework preset | Next.js |
| Root Directory | `apps/portal` |
| Include source files outside of the Root Directory | Enabled (the app imports the workspace package `@cleanstart/forms` and `next.config.ts` traces from the repository root) |
| Install Command | `cd ../.. && pnpm install --frozen-lockfile --filter @cleanstart/portal...` |
| Build Command | `pnpm run build` (this is `SKIP_ENV_VALIDATION=1 next build`: no variable is read at build time) |
| Output Directory | default (`.next`) |
| Node.js version | 22.x |
| Production branch | the branch you deploy the demo from |

Output mode: `next.config.ts` uses `output: 'standalone'` only when `NEXT_OUTPUT=standalone` is set, which only the Docker build does. Vercel does not set it, so the default Next output is built and nothing needs overriding. Do not set `NEXT_OUTPUT` on Vercel.

Environment variables (Production, and Preview if previews are used; all are runtime variables):

| Name | Value or source | Required |
| --- | --- | --- |
| `PORTAL_DEMO_MODE` | `1` | Yes |
| `PORTAL_REVIEW_PASSWORD` | a password you choose; reviewers type it in the browser prompt | Yes (the app refuses to start without it in demo mode) |
| `PORTAL_DEMO_DENY_HOSTS` | the production database hosts and addresses, comma separated (for example the droplet's IP and `cleanstart.com`) | Yes, as a second line of defence |
| `DATABASE_URL` | `postgresql://portal_app:<password>@<demo-vm-host>:5432/portal_demo?sslmode=require` (direct, see above) | Yes |
| `DATABASE_OWNER_URL` | `postgresql://portal_owner:<password>@<demo-vm-host>:5432/portal_demo?sslmode=require`. The running app does not use it; it is required in production and the guard checks it. Needed by `demo:setup` and `demo:reset` wherever they run. | Yes |
| `AUTH_SECRET` | at least 32 random characters (`openssl rand -base64 32`); signs sessions and the demo file tokens | Yes |
| `APP_URL` | the demo's public https address, no trailing slash, for example `https://portal-demo.example.net`; it must not be `https://partners.cleanstart.com` | Yes |
| `PORTAL_TRUSTED_PROXY_HOPS` | `1`: Vercel writes the visitor address as the last `x-forwarded-for` entry; without it all visitors share one sign in rate limit bucket | Yes |
| `PORTAL_DB_POOL_MAX` | leave unset (1 per pool in demo mode); set `2` only if requests wait for a connection | No |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY` | leave unset (the test keys above are the default); if set, only the test values are accepted | No |
| `LOG_LEVEL` | `info` (default) | No |

Do not set: `HUBSPOT_*`, `BREVO_*`, `R2_*`, `SENTRY_*`, `CMS_*`, `PORTAL_JOBS_ENABLED`, `NEXT_OUTPUT`. They are ignored or refused in demo mode and must never carry real credentials.

Setting the database side: the demo database needs the two roles and `pg_trgm` once (`apps/portal/scripts/db-bootstrap.sql` is the reference for the grants: `portal_app` gets `CONNECT` and schema `USAGE` only, the tables and their grants come from the migrations and `rls.sql` that `demo:setup` runs as `portal_owner`). Then run `demo:setup` from any machine that can reach the server, with the two URLs above.

Function limits to know: a Vercel function request body is limited to 4.5 MB, so a demo upload larger than that fails at the platform, and the app itself limits demo uploads to 8 MB. `/api/health` is open (it answers `{"status":"ok"}` after `select 1`), so Vercel and uptime checks work without the review password.

## Evidence

Recorded on 2026-11-17 against a local production build (`next start`, `NODE_ENV=production`, port 3294) with a scratch database `cleanstart_portal_r3d_demo` on the host Postgres. The database host was written as `localtest.me`, a public DNS name that resolves to 127.0.0.1: the guard checks host names, so the production rule "no loopback database" does not see through it (the limit named above), and `next start` always runs with `NODE_ENV=production`.

- **Setup, idempotence and reset.** `demo:setup` on an empty database migrated, created `demo_files` and seeded 21 partners, 38 users, 15 registrations, 3 applications, 12 documents. A second run printed `demo data already present, nothing seeded`. `demo:reset` truncated and reseeded (sequences restarted). Both refuse without `PORTAL_DEMO_MODE=1`.
- **Walk as every role, at 1440 and at 393 pixels wide.** One headless Chrome script signed in through the sign in form as Aditi Rao (partner admin), Karan Malhotra (sales), Sneha Iyer (technical), Gaurav Jadhav (partner manager), Rahul Menon (staff sales) and Ishita Bose (marketing) and opened 52 pages across the 12 role and width combinations: all answered 200, none raised a console or page error, and the six pages a role may not open (for example `/partner/team` for sales) redirected to that role's home as the real app does. Screenshots are kept outside the repository. With one connection per pool in demo mode nothing waited for a connection.
- **axe** (WCAG 2.0 and 2.1, A and AA) on `/partner/overview`, `/partner/deals` and `/partner/documents` as the partner admin at 1440: 0 violations, 0 serious or critical.
- **The fakes work through the real screens.** The staff queue shows `Conflict: Vyom Digital already has an open deal for this customer in HubSpot` on Meridian Insurance (the fake HubSpot, read by the request path). A seeded document opened through `/api/files/<id>` answered 302 to `/api/demo-files/get?t=...` and then 200 with `application/pdf` and `attachment; filename="clean-libraries-solution-sheet.pdf"`, a valid one page PDF. As Ishita Bose an upload of a PDF through the Upload document form ran ticket, `PUT /api/demo-files/put` (200), the signature check and document creation, and the document appeared in the library.
- **HTML equality, the same build with the switch on and off.** The demo server and a real mode server (`NODE_ENV=production`, dummy R2, Brevo, HubSpot and Sentry values, outbound requests to those services blocked) were run one after the other on the same port against the same database. Each was fetched with its own session for `/sign-in`, `/apply`, the partner overview, deals, documents and team pages (as Aditi Rao) and the staff approvals, partners, documents and audit pages (as Gaurav Jadhav). With the CSP nonce, ISO timestamps and the clock text masked, 8 of the 10 pages are byte for byte identical, and so are all the response headers, apart from the header name case of `X-Robots-Tag` and the `connect-src` origins of the dummy R2 and Sentry values given to the real mode server. The other two (admin documents, partner documents) differ only in the open counters of one document (61 against 63), which my own download test raised between the two fetches. The demo has no banner, no extra element and no demo only markup.
- **Switch off means unchanged.** The real mode server answered `/api/demo-files/get` with 404, set `X-Robots-Tag` itself, and proxy tests assert that with `PORTAL_DEMO_MODE` set to anything but `1` no header is added and no check is relaxed (`src/proxy.test.ts`, `src/env.test.ts`).
- **Never indexed, gate.** Unauthenticated: every page 401, `/api/health` 200, `robots.txt` 200 with `Disallow: /`; every response carried `X-Robots-Tag: noindex, nofollow`.
- **Gate A.** lint, typecheck and the build (exit 0) pass, `verify:copy` passes (512 files). The unit suites that touch this work (env, instrumentation, proxy, db, scripts, files, hubspot, email, actions, registrations, app, structure) pass: 805 tests. The full suite and the Playwright suite were not run, by the owner's instruction to keep the machine light.

What was not exercised: a real Vercel build and deploy, the remote Azure database (TLS handling is covered by unit tests of `poolConnection` only), uploads above 4.5 MB on Vercel, and two warm serverless instances sharing the `demo_files` table (the table is what makes that work, but it was only run on one process).
