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
| 1.10 | Install the backup scripts, after the first portal deploy has rendered `/opt/cleanstart/portal.env` and not before. Deploys do not copy scripts, so copy `infra/scripts/backup.sh` and `infra/scripts/restore-portal-drill.sh` to `/opt/cleanstart/scripts/`. Until you do, the old `backup.sh` keeps sending a green heartbeat while the portal has no backup, which is a silent gap. If you install the new one while `cleanstart_portal` exists (step 1.4) but `portal.env` does not, every night fails before the heartbeat and the missing heartbeat is a P1. Then run the checks in section 9: `command -v psql pg_dump pg_restore aws`, a `DRY_RUN` run, a real run. | both `backups/` and `portal-backups/` have a new object and the heartbeat monitor shows a ping |

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

Repository secrets: `PORTAL_OWNER_DB_PASSWORD`, `PORTAL_APP_DB_PASSWORD` (the two hex passwords from step 1.4), `PORTAL_AUTH_SECRET` (`openssl rand -base64 32`), `BREVO_API_KEY` (shared with the CMS: it is the same Brevo account), `PORTAL_R2_ACCESS_KEY_ID`, `PORTAL_R2_SECRET_ACCESS_KEY` (scoped to the private bucket only), `PORTAL_HUBSPOT_TOKEN`, `PORTAL_CMS_INTAKE_API_KEY` (the CMS service user's API key), `PORTAL_TURNSTILE_SECRET_KEY`, `PORTAL_SENTRY_DSN`, and optionally `PORTAL_REVIEW_PASSWORD` and `PORTAL_HUBSPOT_WEBHOOK_SECRET` (leave the latter unset: nothing subscribes to webhooks). `DROPLET_SSH_KEY`, `DROPLET_HOST` and `DROPLET_USER` already exist for the CMS deploy.

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

The render step fails the deploy when `PORTAL_APP_URL` does not start with `https://`, and `src/env.ts` repeats the check at start: in production the app refuses to boot when `APP_URL` is unset or not https (loopback hosts `localhost`, `127.0.0.1` and `[::1]` excepted, for a local smoke test), so an http `APP_URL` can no longer pass `/api/health`. The same check names every missing required variable in one message, `DATABASE_URL`, `AUTH_SECRET` and `DATABASE_OWNER_URL` included. If you ever render `portal.env` by hand, the container will say what is wrong instead of starting.

Migrations only move forward. A release that added a column is rolled back to an image that ignores it; never drop a column in the same release that stops using it.

### Known caveats

- **Owner credential in the app container.** The portal container runs the migrations on start, so `DATABASE_OWNER_URL` (the `portal_owner` role, which bypasses row level security) is in the app container's environment, and a code execution bug in the app would expose it. Recommended before real partner data goes in: a one-shot migration service (plan 06, CCR-5b) that holds the owner URL, so the app container only gets `DATABASE_URL`. Nothing in the build changes this today (BUILD-HANDOFF open decision 4).
- **Deploy trigger.** `deploy-portal.yml` deploys a `workflow_run` only when the `Portal CI` run was started by a `push` to `main`. `workflow_run` filtered by branch alone also matches a pull request from a fork whose branch is named `main`. `deploy-cms.yml` has the same shape and does not have that check; it belongs to the CMS and is not changed here, so someone should review it.
- **Secrets with special characters.** The deploy renders `portal.env` with unquoted `KEY=VALUE` lines. A secret with a newline is not supported, and compose interpolates `$` in an `env_file`, so generate secrets with `openssl rand` (hex or base64) and avoid `$`.

## 4. What runs where

| Thing | Where | Notes |
|---|---|---|
| Portal app | container `cleanstart-portal-1`, image `portal:current`, bound to `127.0.0.1:3004` | Next.js standalone, 512 MB limit with a 384 MB heap, runs the migrations on start (section 3) |
| Reverse proxy | Caddy on the host, `partners.cleanstart.com` | access log `/var/log/caddy/portal-access.log` (section 1) |
| Database | `cleanstart_portal` in the compose Postgres | roles `portal_owner` (migrations) and `portal_app` (runtime, row level security applies to it) |
| Env file | `/opt/cleanstart/portal.env`, mode 600 | rendered by `deploy-portal.yml` on every deploy, so a hand edit does not survive the next deploy |
| Documents | private R2 bucket `cleanstart-partner-docs` | files reach the browser only through presigned links that live 60 seconds (`docs/partner-portal/R2-DOCUMENTS-BUCKET.md`) |
| Backups | host cron at 02:00 UTC, `/opt/cleanstart/scripts/backup.sh` | the portal dump goes to the same private bucket under `portal-backups/` (section 9) |
| Email | Brevo, sender name `CleanStart Partners` | the name is fixed in code (`PORTAL_SENDER_NAME` in `src/server/email/transport.ts`) |
| Deals | HubSpot, pipeline "Partner deals" | `docs/partner-portal/HUBSPOT-PROVISIONING.md` |
| Background jobs | inside the app process, started when `PORTAL_JOBS_ENABLED=true` | no host cron entries; the list is `src/server/jobs/index.ts` (section 6) |
| Errors | Sentry, project set by `SENTRY_DSN` | job failures and failed HubSpot writes are sent there |

Setting names: `portal.env` holds the names `src/env.ts` reads (`AUTH_SECRET`, `HUBSPOT_PORTAL_TOKEN`, `R2_BUCKET` and so on). The GitHub secrets and variables behind them carry a `PORTAL_` prefix (section 2), and `deploy-portal.yml` maps one to the other.

## 5. Health and monitoring

- `https://partners.cleanstart.com/api/health` answers `{"status":"ok"}` with 200 when the process is up and the database answers, and `{"status":"database_unreachable"}` with 503 when it does not. The review password does not apply to it.
- On the droplet:

  ```bash
  cd /opt/cleanstart
  docker ps --filter name=cleanstart-portal-1
  docker logs --tail 100 cleanstart-portal-1
  docker stats --no-stream cleanstart-portal-1
  ```

- BetterStack: add an HTTP probe on the health URL, as the CMS has. The backup heartbeat is the one the CMS already uses (section 9). Host memory, swap and disk are watched per droplet (`docs/operations/CMS-DEPLOYMENT.md`), so the portal needs no separate host monitor.
- In the app: the Audit log screen (`/admin/audit`, partner manager) has a HubSpot sync card: waiting to send, failed, last HubSpot check and last error.
- Postgres connections. The portal opens up to 14 (request pool 6, system pool 8), the CMS up to 15, and `portal_app` has `CONNECTION LIMIT 20`. The server limit must be 50 (section 1.3). Count them with:

  ```bash
  cd /opt/cleanstart
  docker compose exec -T postgres psql -U postgres -c "select usename, count(*) from pg_stat_activity group by 1"
  docker compose exec -T postgres psql -U postgres -c "show max_connections"
  ```

  The two changes below are written here and are not run by the build. Each needs the operator's approval. `ALTER SYSTEM` does not restart anything: the new `max_connections` applies only after the separate restart of Postgres, and that restart interrupts the production database (the CMS uses it too):

  ```bash
  docker compose exec -T postgres psql -U postgres -c "ALTER SYSTEM SET max_connections = 50;"   # then restart postgres in a quiet minute
  docker compose exec -T postgres psql -U postgres -c "ALTER ROLE portal_app CONNECTION LIMIT 20;"
  ```

## 6. Background jobs

All jobs run in the portal process, on a UTC schedule. Each tick takes a Postgres advisory lock named after the job and a tick that finds the lock taken does nothing, so one run of a job at a time. A job that throws is logged as `job failed` with its name and sent to Sentry; the next tick runs it again. Logs are JSON lines on stdout.

| Job | Schedule (UTC) | Does |
|---|---|---|
| `hubspot-outbox` | every minute | sends queued changes to HubSpot, 20 per batch; a failed change is retried after 1 minute, 5 minutes, 30 minutes, 2 hours and 12 hours, and the sixth failure marks it failed |
| `hubspot-poll` | every 5 minutes | reads deal stage and protection end date changes from HubSpot |
| `hubspot-reconcile` | 02:30 | flags accepted and expired registrations whose HubSpot deal no longer exists |
| `expiry` | 00:10 | expires accepted registrations whose protection end date has passed |
| `expiry-reminders` | 05:00 | for registrations ending in exactly 14 or 3 days: an in-app notification, and an email to each person whose expiry switch allows it |
| `website-intake` | every 5 minutes | imports partner applications from the CMS (does nothing until `CMS_INTAKE_API_KEY` is set) |
| `document-purge` | 03:20 | deletes replaced files 30 days after the replacement, and the files of deleted documents 30 days after the deletion |
| `retention` | 03:40 | deletes declined applications and rejected registrations 365 days after the decision (section 10) |

The HubSpot jobs and `document-purge` log a warning and skip their run when HubSpot or R2 is not configured.

If a job seems to have stopped:

```bash
cd /opt/cleanstart
docker ps --filter name=cleanstart-portal-1                      # was the container restarted?
docker logs cleanstart-portal-1 2>&1 | grep 'job failed'          # which job, and why
grep '^PORTAL_JOBS_ENABLED=' portal.env                           # must be true
```

## 7. HubSpot

- HubSpot owns a deal after approval. The portal writes through an outbox, so an approval never waits for HubSpot. If HubSpot is down, approvals keep working, the "Waiting to send" figure on the Audit log card grows, and the queue drains by itself when HubSpot is back. Each change carries an idempotency key, so a retry does not duplicate a deal.
- "Failed" above zero means a change failed six times. Read the last error on the card, fix the cause (a revoked token, a renamed property), then press "Retry failed syncs" (partner manager). A retry that queues anything writes an audit entry.
- Rotating the token: create a new private app token in HubSpot, update the GitHub secret `PORTAL_HUBSPOT_TOKEN`, run the deploy workflow; it renders the value as `HUBSPOT_PORTAL_TOKEN`. The webhook secret is optional: the portal polls only, `src/env.ts` does not require `HUBSPOT_WEBHOOK_SECRET` in production, and `/api/hubspot/webhook` answers 404 while it is unset. If you ever set it (`PORTAL_HUBSPOT_WEBHOOK_SECRET`, rendered as `HUBSPOT_WEBHOOK_SECRET`), the route verifies signatures again and you rotate it with the token.
- HubSpot capability check (`docs/partner-portal/HUBSPOT-CAPABILITIES.md`): the product owner decided on 2026-11-16 to poll only (the 5 minute poll is the only inbound path; the webhook route is deployed but stays unsubscribed, so add no webhook subscription and no Cloudflare skip rule for it) and reported that unique-value properties are allowed, so `provision-hubspot.ts` has no `--no-unique` flag. Association labels passed a UI check but not a token check, so `HUBSPOT_USE_ASSOCIATION_LABELS` stays `false`. The rate limit (c) and `hs_lastmodifieddate` search (e) are still UNVERIFIED.
- Provisioning and the production checklist: `docs/partner-portal/HUBSPOT-PROVISIONING.md`. That file names the two HubSpot secrets without the `PORTAL_` prefix; the names the deploy workflow reads are the ones in section 2 above.

## 8. Email

Brevo sends everything; the sender name is fixed in code (`CleanStart Partners`). If a person does not receive an invite, check in this order:

1. Their spam folder.
2. The portal log: `docker logs cleanstart-portal-1 2>&1 | grep -i brevo`.
3. Brevo's blocklist. An address on it receives nothing.

An invite can be sent again from the Team screen. That issues a new link, the old link stops working, and the invite is valid for 7 days from the new send. In development, with no Brevo key set, the portal logs the subject and skips the send.

## 9. Backups and restore

The nightly cron (02:00 UTC, `/etc/cron.d/cleanstart-backup`, through `run-backup.sh`) runs `/opt/cleanstart/scripts/backup.sh`. The script does these in order:

1. Dumps the CMS database to `backups/<UTC timestamp>.dump` in the CMS bucket, which also serves public media.
2. If the database `cleanstart_portal` exists, dumps it, checks the dump with `pg_restore --list`, and uploads it to `portal-backups/<UTC timestamp>.dump` in the private bucket named in `/opt/cleanstart/portal.env`. The script refuses to use the CMS bucket for this. If the database does not exist yet, it logs a WARNING and skips this step.
3. Pings the BetterStack heartbeat, only if every earlier step succeeded.

A missing heartbeat therefore means at least one backup did not happen: read the cron log first. Once the portal database exists, a portal dump that fails, or a `portal.env` that is unreadable or lacks `R2_ENDPOINT`, `R2_BUCKET`, `R2_ACCESS_KEY_ID` or `R2_SECRET_ACCESS_KEY`, fails the run before the heartbeat. The CMS dump has been uploaded by then. The script needs `psql`, `pg_dump`, `pg_restore` and `aws` on the host (without `psql` or `pg_restore` it stops with a message after the CMS upload and sends no heartbeat), and the cron user must be able to read `portal.env` (mode 600). Install the new `backup.sh` only after the first portal deploy has rendered `portal.env` (step 1.10): if `cleanstart_portal` exists and `portal.env` does not, every night fails before the heartbeat. Dump files are written owner-only (`umask 077`).

The deploy workflows do not copy the scripts, and the old `backup.sh` keeps a green heartbeat with no portal backup, so a script that is not copied is a silent gap. After any change to `backup.sh` or `restore-portal-drill.sh`, copy both from `infra/scripts/` to `/opt/cleanstart/scripts/`, then:

```bash
command -v psql pg_dump pg_restore aws                        # all four must print a path
DRY_RUN=1 /opt/cleanstart/scripts/run-backup.sh               # prints the plan, touches nothing
/opt/cleanstart/scripts/run-backup.sh                         # a real run, the way cron runs it
```

Then confirm that `backups/` in the CMS bucket and `portal-backups/` in the private bucket each have a new object, and that the BetterStack heartbeat monitor shows a ping. The heartbeat and the first real portal dump are not verified yet. The portal prefix also needs its own lifecycle rule on the private bucket, matching the rule on the CMS bucket's `backups/` prefix. The portal app's R2 token can read, overwrite and delete every object in the bucket, so a compromised app could also read, overwrite or delete `portal-backups/`. The bucket has no versioning, and no lifecycle rule is configured for the prefix (`docs/operations/CMS-DEPLOYMENT.md` covers the CMS bucket only). The stricter follow-up is a separate bucket and token for backups, which needs a change to `backup.sh`.

Restore drill (before launch, then every quarter). It restores a backup into a scratch database `cleanstart_portal_drill`, counts rows in the main tables, prints the newest audit log time, and drops the scratch database. It never touches the live database: the scratch name must contain `drill`, and the script refuses the live name. By default it connects as `postgres` to `127.0.0.1:5432`; set `PORTAL_DRILL_ADMIN_URI` (without a password) to change that.

```bash
cd /opt/cleanstart
# The password goes in PGPASSWORD, never in a connection string, so it stays out of every command line and `ps`.
# Read the one line; never source .env (a value with a space breaks it, as it did for run-backup.sh).
export PGPASSWORD=$(grep '^POSTGRES_PASSWORD=' .env | cut -d= -f2-)
ALLOW_RESTORE=yes ./scripts/restore-portal-drill.sh                       # lists the portal backups
ALLOW_RESTORE=yes ./scripts/restore-portal-drill.sh 2026-12-01T02:00:00Z  # restores that one into the scratch database
unset PGPASSWORD
```

Expected: a row count per table, the newest audit log time, "drill passed in N seconds". Add a line to `docs/operations/RESTORE-LOG.md` (date, backup, duration, who). `restore.sh` is for the CMS database only: it reads the `backups/` prefix and replaces the database named in `DATABASE_URI`.

A real restore, when the live database is damaged. The drill shows that a dump is readable and complete. It does not rehearse the swap below, so do the swap once on the droplet before launch and write down anything that differs. The path keeps ownership, grants and row level security exactly as the migrations make them, by loading only the data into a freshly migrated database:

1. Snapshot the droplet. Stop the portal: `docker compose --profile portal stop portal`.
2. Create a new empty database with the bootstrap script. First check the roles: run `docker compose exec -T postgres psql -U postgres -c '\du'`. If it does not list both `portal_owner` and `portal_app`, stop and use step 1.4 with real passwords instead. Only when both exist, run the commands below; the two passwords in them are never used:

   ```bash
   cd /opt/cleanstart                                                  # apps/portal/scripts/db-bootstrap.sql copied here
   {
     printf '\\set owner_password unused\n\\set app_password unused\n'
     printf '\\set dbname cleanstart_portal_new\n\\set conn_limit 20\n\\set allow_createdb off\n'
     cat db-bootstrap.sql
   } | docker compose exec -T postgres psql -U postgres -d postgres -v ON_ERROR_STOP=1
   ```

3. Run the migrations against it with the image that is deployed. The owner password is in the operator's store (it is also inside `DATABASE_OWNER_URL` in `portal.env`); read it from a prompt so it stays out of history and `ps`:

   ```bash
   read -rs -p "owner password: " OWNER_PW; echo
   export DATABASE_OWNER_URL="postgres://portal_owner:${OWNER_PW}@postgres:5432/cleanstart_portal_new"
   docker compose --profile portal run --rm --no-deps -e DATABASE_OWNER_URL portal node scripts/migrate.cjs
   unset OWNER_PW DATABASE_OWNER_URL
   ```

4. Download the dump with the portal's R2 settings, then load the data as the superuser with triggers disabled for the load (the audit log is protected by a trigger, and another trigger sets `partner_id` on child rows). `-n public` skips the migration journal, which step 3 already filled:

   ```bash
   cd /opt/cleanstart
   umask 077                                                           # the dump holds partner details
   v() { grep "^$1=" portal.env | cut -d= -f2-; }
   AWS_ACCESS_KEY_ID="$(v R2_ACCESS_KEY_ID)" AWS_SECRET_ACCESS_KEY="$(v R2_SECRET_ACCESS_KEY)" \
     aws --endpoint-url "$(v R2_ENDPOINT)" s3 cp "s3://$(v R2_BUCKET)/portal-backups/<timestamp>.dump" /tmp/portal-restore.dump
   docker compose exec -T postgres pg_restore -U postgres --data-only --disable-triggers -n public \
     -d cleanstart_portal_new < /tmp/portal-restore.dump
   rm -f /tmp/portal-restore.dump
   ```

5. Compare row counts with the drill output, then swap. No connection may be open to either database:

   ```bash
   docker compose exec -T postgres psql -U postgres -d postgres \
     -c "ALTER DATABASE cleanstart_portal RENAME TO cleanstart_portal_broken" \
     -c "ALTER DATABASE cleanstart_portal_new RENAME TO cleanstart_portal"
   docker compose --profile portal up -d --wait portal
   ```

   Then run the section 5 checks.

Anything written after the dump is gone. The HubSpot poll and the outbox reconcile deals, but approvals taken in that window must be done again by staff. Keep `cleanstart_portal_broken` until the partner manager has confirmed the data.

## 10. Data retention and privacy

| Data | Kept | Then |
|---|---|---|
| Declined applications | 365 days from the decision | deleted by `retention` |
| Rejected registrations, with their contacts, messages and timeline | 365 days from the decision | deleted by `retention` |
| Replaced document files | 30 days | deleted by `document-purge` |
| Deleted documents | 30 days | files deleted; the row stays as a tombstone so the audit log still makes sense |
| Accepted, won, lost and expired registrations; approved applications | for the life of the partnership | not purged in v1 |
| Access requests | | not purged in v1 |
| People (users) | never deleted | a removed person is set to `disabled` and their deals stay with the company |
| Audit log | append only; no role can edit or delete a row through the app | the retention rule is an open decision, so v1 keeps it |
| Database backups | per the lifecycle rule on `portal-backups/` | a record purged from the live database stays in older dumps until they expire |

Requests to erase a person's data are not automated in v1. Do not run ad hoc SQL against the production database for this: raise it with the privacy owner, who decides what the audit log and the partner's records must keep.

## 11. Common problems

| Symptom | First checks | Fix |
|---|---|---|
| Site down, Caddy answers 502 | `docker ps --filter name=cleanstart-portal-1`, `docker logs --tail 100 cleanstart-portal-1` | the container exited: read the last error. A bad or missing env value stops the app at start and names the variable. Roll back (section 3) if a deploy caused it |
| Health returns 503 | `docker compose ps postgres`, the connection count (section 5) | Postgres is down or out of connections; restart the portal once Postgres is healthy |
| Everyone signed out | was `AUTH_SECRET` changed, or the container recreated with a new one | expected after a rotation; people sign in again |
| Partner cannot sign in | the user's status and the partner's status (first query below) | a `disabled` user or a `suspended` partner sees the same message as a wrong password, on purpose. Restore a suspended partner with "Restore access" on the partner's page under Admin, Partners |
| "Too many attempts" for normal traffic on apply, invite or sign in; the log says `Rate limiting could not determine a client IP` | `grep '^PORTAL_TRUSTED_PROXY_HOPS=' /opt/cleanstart/portal.env` | it must be `1` in production, and the Caddy block and the firewall rule from section 1 must be in place (section 1, "Client address and rate limits") |
| Deal stuck "Awaiting review" after approval | the Audit log HubSpot card; `docker logs cleanstart-portal-1 2>&1 \| grep -i hubspot` | failed outbox rows: fix the cause, then "Retry failed syncs" |
| Stage in the portal differs from HubSpot | "Last HubSpot check" on the card | the poll runs every 5 minutes; if the last check is old, read the `hubspot-poll` log lines and check the token |
| Emails not arriving | section 8 | |
| Disk full | `df -h`, `docker system df` | `docker image prune -f`; the deploy keeps `portal:current` and two older images; Caddy logs roll at 10 MB and keep 7 files |
| High memory | `docker stats --no-stream cleanstart-portal-1` | the container is capped at 512 MB with a 384 MB heap; repeated restarts mean a leak: keep the logs and open an incident entry (`docs/operations/INCIDENTS.md`) |

Read only queries. They run as the superuser, which bypasses row level security, so remove personal data before pasting a result into a ticket:

```bash
cd /opt/cleanstart
docker compose exec -T postgres psql -U postgres -d cleanstart_portal -c "select u.email, u.status, p.status as partner_status from users u left join partners p on p.id = u.partner_id where lower(u.email) = lower('person@example.com')"
docker compose exec -T postgres psql -U postgres -d cleanstart_portal -c "select status, count(*) from hubspot_outbox group by 1"
docker compose exec -T postgres psql -U postgres -d cleanstart_portal -c "select op, subject_id, attempts, left(last_error, 120) from hubspot_outbox where status = 'failed' order by updated_at desc limit 10"
docker compose exec -T postgres psql -U postgres -d cleanstart_portal -c "select key, updated_at from hubspot_sync_state"
```

Secrets and where they rotate. All live in GitHub; a deploy writes them to `portal.env`.

- `PORTAL_AUTH_SECRET` (rendered as `AUTH_SECRET`): signs everyone out.
- The database passwords: `ALTER ROLE portal_app PASSWORD '...'` as the superuser (and the same for `portal_owner`), update `PORTAL_APP_DB_PASSWORD` and `PORTAL_OWNER_DB_PASSWORD`, then deploy.
- The HubSpot token and webhook secret: section 7.
- `BREVO_API_KEY`: shared with the CMS, so rotate both.
- The R2 keys (`PORTAL_R2_ACCESS_KEY_ID`, `PORTAL_R2_SECRET_ACCESS_KEY`): the private bucket token only. `backup.sh` reads the same values from `portal.env`, so the next nightly run uses the new ones after the deploy.
- The Turnstile secret, the Sentry DSN, and `PORTAL_REVIEW_PASSWORD` (the pilot gate).
