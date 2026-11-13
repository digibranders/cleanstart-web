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
| 1.5 | Add the `portal` service from `infra/docker-compose.yml` to `/opt/cleanstart/compose.yml` (it has `profiles: ["portal"]`, so `docker compose up -d` with no profile still starts only Postgres and Meilisearch). Compare the two files with `diff` first and keep everything else in the droplet's file as it is. | `docker compose config --services` lists the `portal` service |
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
