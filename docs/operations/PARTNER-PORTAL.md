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
| 1.4 | Create the roles and the database with the commands under the table (run on the droplet, inside the compose Postgres container, like step 1.3). The two passwords are made by `openssl rand -hex 24` (hex keeps them URL safe) and are also the GitHub secrets `PORTAL_OWNER_DB_PASSWORD` and `PORTAL_APP_DB_PASSWORD`. | `\l` lists `cleanstart_portal` owned by `portal_owner`; `\du` lists `portal_owner` and `portal_app` |
| 1.5 | Add the `portal` service from `infra/docker-compose.yml` to `/opt/cleanstart/compose.yml` (it has `profiles: ["portal"]`, so `docker compose up -d` with no profile still starts only Postgres and Meilisearch). Compare the two files with `diff` first and keep everything else in the droplet's file as it is. Then confirm that `docker compose --profile cms up -d --wait cms` still works with the droplet's Compose version while `/opt/cleanstart/portal.env` does not exist yet (the existing CMS deploy runs that command; a service whose `env_file` is missing must not break a profile it is not part of). | `docker compose --profile portal config --services` lists `portal` (with `postgres` and `meilisearch`), and the `cms` profile command above still succeeds |
| 1.6 | Add the Caddy block below to `/etc/caddy/Caddyfile`, then `caddy validate --config /etc/caddy/Caddyfile` and `systemctl reload caddy`. | validate prints "Valid configuration" |
| 1.7 | Cloudflare: an `A` record `partners` to the droplet (proxied, SSL Full strict, as for `cms`), and the same WAF rule set that `cms.cleanstart.com` has. | the record resolves |
| 1.8 | Firewall: accept port 443 only from Cloudflare's published ranges (`ufw`), so a visitor cannot reach Caddy directly and invent a client address (the Caddy block trusts `CF-Connecting-IP`). | `ufw status` shows the Cloudflare ranges |
| 1.9 | Check that the Brevo account allows the droplet's address (it already does for the CMS). | a test send from the portal succeeds later |

Step 1.4 commands. The `postgres` superuser needs no password here: `psql` runs inside the container over its local socket, the same way step 1.3 runs it. Do not put the passwords in `-v` options: they would land in your shell history and in the process list (`ps`) of the droplet. This reads them from a prompt and passes them on standard input only:

```bash
cd /opt/cleanstart
# paste the two hex passwords when prompted; nothing is echoed, stored in history or shown in ps
read -rs -p "owner password: " OWNER_PW; echo
read -rs -p "app password: " APP_PW; echo
{
  printf '\\set owner_password %s\n\\set app_password %s\n' "$OWNER_PW" "$APP_PW"
  printf '\\set dbname cleanstart_portal\n\\set conn_limit 20\n\\set allow_createdb off\n'
  cat db-bootstrap.sql   # copy apps/portal/scripts/db-bootstrap.sql to /opt/cleanstart first, and read it
} | docker compose -f compose.yml exec -T postgres psql -U postgres -d postgres -v ON_ERROR_STOP=1
unset OWNER_PW APP_PW
```

If you would rather connect from the host over TCP, the superuser password is `POSTGRES_PASSWORD` in `/opt/cleanstart/.env`; supply it through a `PGPASSFILE` (mode 600) and not on the command line.

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

### Client address and rate limits (the trusted proxy)

Per address rate limits (sign in, one time codes, apply, invites) are only as good as the client address. The app never uses the leftmost `X-Forwarded-For` entry, because a client can write it and rotate it to get a fresh allowance on every request. `src/proxy.ts` resolves the address once, from the setting `PORTAL_TRUSTED_PROXY_HOPS`, and passes it on in an internal header that a client cannot set:

| Setting | Meaning |
|---|---|
| `0` or unset (the default, also for development) | No proxy is trusted. Every client counts as unknown and shares one rate limit bucket. Safe, but a busy site is throttled together. |
| `1` (production) | One proxy, Caddy, writes `X-Forwarded-For`. The app takes the last entry, the address Caddy saw or wrote. |
| `2` to `5` | That many proxies append to the header; the app skips them from the right. |

`deploy-portal.yml` renders `PORTAL_TRUSTED_PROXY_HOPS=1` into `/opt/cleanstart/portal.env`. This is only correct while the Caddy block above overwrites the header (`header_up X-Forwarded-For {http.request.header.CF-Connecting-IP}`; a `header_up` replaces the value, it does not append) and port 443 is reachable only from Cloudflare (step 1.8). Do not remove either: with a directly reachable Caddy a visitor could send their own `CF-Connecting-IP`. Symptoms of a wrong setting: with `0` in production, applications and invite links start returning "too many attempts" under normal traffic (one shared bucket), and the log shows `Rate limiting could not determine a client IP`; with a value that is too high, every request counts as unknown.

## 2. GitHub settings (a person, once)

Repository variables (Settings, Secrets and variables, Variables):

| Variable | Value |
|---|---|
| `PORTAL_DEPLOY_ENABLED` | `true` only after section 1 is finished. Until then the deploy workflow does nothing. |
| `PORTAL_APP_URL` | `https://partners.cleanstart.com`. Must start with `https://`: the deploy refuses anything else. |
| `PORTAL_TURNSTILE_SITE_KEY` | the portal's own Turnstile widget (hostname `partners.cleanstart.com`), public |
| `PORTAL_BREVO_SENDER_EMAIL` | the verified sender address |
| `PORTAL_R2_ENDPOINT`, `PORTAL_R2_BUCKET` | the private documents bucket (`cleanstart-partner-docs`) |
| `PARTNER_AGREEMENT_VERSION` | the label legal gives (until then the build default `draft-0` shows on the invite screen) |
| `PARTNERS_NOTIFY_EMAIL` | fallback staff address |
| `HUBSPOT_PARTNER_PIPELINE_ID`, `HUBSPOT_PORTAL_ID`, `HUBSPOT_USE_ASSOCIATION_LABELS` | from `docs/partner-portal/HUBSPOT-PROVISIONING.md` |
| `PORTAL_JOBS_ENABLED` | leave unset (the workflow renders `true`) |
| `PORTAL_GOOGLE_CLIENT_ID`, `PORTAL_MICROSOFT_CLIENT_ID`, `PORTAL_MICROSOFT_TENANT_ID` | optional, only when sign in with Google or Microsoft is enabled. The tenant id defaults to `common`, which accepts an account from any Entra tenant and personal Microsoft accounts. Linking still needs the `xms_edov` claim (add it as an optional claim on the app registration) and an existing active user with that exact email, but set the tenant id to CleanStart's own tenant, or `organizations`, before enabling it for partners. |

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

The render step fails the deploy when `PORTAL_APP_URL` does not start with `https://`. `src/env.ts` does not check the scheme yet (the change is proposed, see `docs/partner-portal/SECURITY-PASS.md`); until it does, an http `APP_URL` in production passes `/api/health` and the deploy smoke test and fails at the first sign in, because `createAuth()` refuses it. If you ever render `portal.env` by hand, check the scheme yourself.

Migrations only move forward. A release that added a column is rolled back to an image that ignores it; never drop a column in the same release that stops using it.

### Known caveats

- **Owner credential in the app container.** The portal container runs the migrations on start, so `DATABASE_OWNER_URL` (the `portal_owner` role, which bypasses row level security) is in the app container's environment, and a code execution bug in the app would expose it. Recommended before real partner data goes in: a one-shot migration service (plan 06, CCR-5b) that holds the owner URL, so the app container only gets `DATABASE_URL`. Nothing in the build changes this today (BUILD-HANDOFF open decision 4).
- **Deploy trigger.** `deploy-portal.yml` deploys a `workflow_run` only when the `Portal CI` run was started by a `push` to `main`. `workflow_run` filtered by branch alone also matches a pull request from a fork whose branch is named `main`. `deploy-cms.yml` has the same shape and does not have that check; it belongs to the CMS and is not changed here, so someone should review it.
- **Secrets with special characters.** The deploy renders `portal.env` with unquoted `KEY=VALUE` lines. A secret with a newline is not supported, and compose interpolates `$` in an `env_file`, so generate secrets with `openssl rand` (hex or base64) and avoid `$`.
