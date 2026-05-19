# CMS Deployment — `cms.cleanstart.com`

Canonical operations doc for deploying and operating **apps/cms** on a DigitalOcean droplet via **GitHub Actions + Caddy**. Companion to `docs/WEB-PRODUCTION.md` (which owns everything `apps/web`).

**This doc covers:** initial droplet bootstrap, locked configuration decisions, phased setup runbook, the per-droplet done checklist, and the operational backlog of what's still pending.

**This doc does NOT cover:**

- The marketing site on Vercel — see `docs/WEB-PRODUCTION.md`
- Webflow → Payload data migration — see `migrations/webflow-import/` + arch doc §`#migration`
- Emergency rollback after a failed cutover — see `docs/migration/rollback-runbook.md`
- Restore drills — see `docs/RESTORE-LOG.md` + arch doc §`#restore-runbook`

**Source of truth:** when this doc disagrees with `docs/cleanstart-cms-architecture.html` on product/architecture, the arch doc wins. When it disagrees with `CLAUDE.md` on code/ops conventions, CLAUDE.md wins. This doc wins for the *concrete deploy sequence* and is the place to record per-droplet state.

> **2026-05-19 — CTO-level review history.** This doc went through three rounds of locked-decision revision the same day:
>
> 1. **Round 1** (morning) — initial locks based on the arch doc: Caddy on host + Coolify v4.0.0-beta.470 pinned.
> 2. **Round 2** (midday) — after standing up Coolify GA: shifted to Coolify-managed Traefik because Coolify GA wouldn't get out of its own way.
> 3. **Round 3** (afternoon) — full CTO challenge: Coolify cost ~450 MB RAM (22% of the box) for one app and one operator. Switched to **GitHub Actions building + shipping the image** with **Caddy on host** for TLS. Coolify removed entirely.
>
> The §5 deviations table captures the audit trail. Previous versions are recoverable via git. The current doc reflects Round 3 only.

---

## 1. Locked decisions

Every row here is a decision we will not relitigate during the deploy. Each links back to its source so future operators can see *why*.

| #   | Decision                  | Locked value                                                                                                                | Source                                                  |
| --- | ------------------------- | --------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| 1   | Hosting model             | Single DO droplet, $12/mo, **2 GB RAM / 1 vCPU**, Bangalore                                                                 | arch doc §`#hosting`                                    |
| 2   | OS                        | Ubuntu 22.04 or 24.04 LTS (24.04 verified on current droplet)                                                               | —                                                       |
| 3   | Swap                      | **2 GB** swap file, mandatory before any service starts                                                                     | arch doc §`#droplet-tuning` #4                          |
| 4   | Kernel tuning             | `vm.swappiness=10`, `vm.vfs_cache_pressure=50`                                                                              | arch doc §`#droplet-tuning` #4                          |
| 5   | Postgres                  | **PG 16** (alpine image), localhost-bound, tuned per §droplet-tuning #1                                                     | `infra/docker-compose.yml`                              |
| 6   | Postgres tuning           | `shared_buffers=128MB · work_mem=4MB · effective_cache_size=1GB · max_connections=20 · maintenance_work_mem=64MB`           | arch doc §`#droplet-tuning` #1                          |
| 7   | Search                    | **Meilisearch v1.9**, localhost-bound, `--max-indexing-memory 512Mb --max-indexing-threads 1`                               | `infra/docker-compose.yml` + §droplet-tuning #3         |
| 8   | Sharp                     | `sharp.concurrency(1)`, `sharp.cache(false)`; `SHARP_CONCURRENCY=1` already set in `apps/cms/Dockerfile`                    | arch doc §`#droplet-tuning` #2                          |
| 9   | Reverse proxy + TLS       | **Caddy on host** (apt-installed, `/etc/caddy/Caddyfile`); auto-Let's Encrypt for `cms.cleanstart.com`                      | 2026-05-19 round 3 review                               |
| 10  | Deploy orchestrator       | **None — GitHub Actions builds + ships.** `.github/workflows/deploy-cms.yml` runs on push to `main`. No Coolify, no Portainer, no Dokku. | 2026-05-19 round 3 review                               |
| 11  | CDN / WAF                 | Cloudflare proxied (orange cloud) on `cms.cleanstart.com`; SSL/TLS mode **Full (strict)**                                   | arch doc §`#hosting`                                    |
| 12  | TLS termination           | Caddy terminates TLS on the droplet (auto-LE); CF is in front (Full Strict)                                                 | 2026-05-19 round 3 review                               |
| 13  | Public hostname (prod)    | **`cms.cleanstart.com`**                                                                                                    | `CLAUDE.md`, arch doc §`#hosting`                       |
| 14  | Proxy hops                | `TRUSTED_PROXY_HOPS=2` (Cloudflare → Caddy → app)                                                                           | `apps/cms/.env.example`                                 |
| 15  | Concurrency               | `WEB_CONCURRENCY=1`, `RATE_LIMIT_BACKEND=memory` (single-process)                                                           | `apps/cms/.env.example`                                 |
| 16  | Jobs gate                 | `PAYLOAD_AUTO_RUN=true` in prod (cron jobs fire)                                                                            | `apps/cms/.env.example`                                 |
| 17  | Media                     | Cloudflare R2, `R2_UPLOAD_PREFIX=web`, public base `https://cdn.cleanstart.com`                                             | `apps/cms/.env.example`                                 |
| 18  | Lead fallback queue       | Host-mounted volume `/var/lib/cleanstart/lead-fallback-queue`, **never** inside `.next`                                     | `apps/cms/.env.example` `LEAD_QUEUE_LOCAL_DIR`          |
| 19  | Live preview              | `WEB_BASE_URL=https://cleanstart.com`; matching `LIVE_PREVIEW_SECRET` + `PREVIEW_JWT_SECRET` in both apps' env              | `apps/cms/.env.example`                                 |
| 20  | Cross-process ISR         | `WEB_REVALIDATE_URL=https://cleanstart.com/api/revalidate` + shared `WEB_REVALIDATE_SECRET`                                 | commit `316b559`; `apps/web/.env.example`               |
| 21  | Backup target             | Cloudflare R2 bucket, `backups/{ISO-ts}.dump`, daily                                                                        | `infra/scripts/backup.sh`                               |
| 22  | Backup retention          | 7 daily, 4 weekly, 3 monthly (lifecycle rules on R2; **not yet configured** — backlog B4)                                   | arch doc §`#restore-runbook`                            |
| 23  | Backup heartbeat          | BetterStack heartbeat URL, **alert on missing ping** (not on success)                                                       | arch doc §`#restore-runbook`                            |
| 24  | RTO / RPO                 | RTO 30 min, RPO 24 h                                                                                                        | arch doc §`#restore-runbook`                            |
| 25  | 2FA                       | Mandatory for every admin user; recovery seeds in `cleanstart-migration` 1Password vault                                    | `CLAUDE.md`                                             |
| 26  | Branch → env mapping      | `main` → prod (`cms.cleanstart.com`, this droplet) · `development` → staging (`cms-dev.cleanstart.com`, separate machine)   | `CLAUDE.md`, arch doc §`#staging`, `.github/workflows/web.yml` |
| 27  | Deploy mechanism          | **Pull-based via GitHub Actions.** `.github/workflows/deploy-cms.yml` builds the image on the GHA runner, ships via SSH (`docker save \| gzip \| scp`), and runs `docker compose up -d --wait`. Image tags are git SHAs; never `:latest`. No GHA → server SSH happens outside this workflow. | 2026-05-19 round 3 review |
| 28  | Image storage             | **Local Docker cache on the droplet.** No external registry. The deploy workflow retains the last 5 SHAs for fast rollback (`docker tag cms:<prev-sha> cms:current`). Locks single-host architecture. | 2026-05-19 round 3 review |
| 29  | Droplet access            | **SSH key auth only** (`mac-mini-gaurav-jadhav` ED25519 key). UFW allows 22/80/443 only. GitHub Actions uses a dedicated deploy key (`gha-deploy`, separate from operator keys). | 2026-05-19 round 3 review |
| 30  | Host metrics              | **DigitalOcean `do-agent`** (ships pre-installed) is primary for RAM/CPU/swap/disk. BetterStack adds only the HTTP probe + backup heartbeat. | 2026-05-19 round 2 review                               |
| 31  | App-config backup         | **App DB only** (`infra/scripts/backup.sh` → R2). Caddyfile, compose files, and `.env` are reproducible from this doc + 1Password. No platform UI config exists to back up. | 2026-05-19 round 3 review                               |
| 32  | Secret rotation           | Manual, on incident only. No calendar. Known list lives at §6 of this doc.                                                  | 2026-05-19 round 2 review                               |
| 33  | DNS TTL during failover   | **Effective 0s.** Cloudflare proxied = TTL belongs to CF's anycast, not DNS. Rollback DNS changes propagate within seconds. | 2026-05-19 round 2 review                               |

### Unresolved sub-decisions

| #   | Question                            | Default                                                                              | Resolve by  |
| --- | ----------------------------------- | ------------------------------------------------------------------------------------ | ----------- |
| L2  | Backup time of day                  | **02:00 UTC** (arch doc says "daily, 03:00 IST = 21:30 UTC"; pick one and commit)    | Phase 11    |
| L3  | Secondary backup mirror (DO Spaces) | Defer past go-live; tracked in backlog as P2                                         | Post-launch |

**Resolved sub-decisions (kept for history):**

- **L1 (2026-05-19) — Public hostname locked to `cms.cleanstart.com`.** Bulk-renamed from `admin.*` across the repo. `infra/caddy/Caddyfile` was deleted as part of the round-2 review, then Caddy reinstated in round 3 with config now written directly into `/etc/caddy/Caddyfile` (no committed Caddyfile).
- **L4 (2026-05-19) — Deploy mechanism = GitHub Actions, not Coolify.** Round-3 CTO review. Rationale: Coolify GA consumed ~450 MB RAM on the 2 GB box (22% of memory), conflicted with locked decisions on port bindings + Traefik-vs-Caddy + beta-vs-GA churn, and offered no value for our single-app / single-operator topology. GHA + a 60-line workflow does the same thing with no platform overhead.

---

## 2. Infrastructure inventory

```
┌─────────────────────────────────────────────────────────────────────┐
│  Cloudflare (DNS · WAF · CDN · TLS-from-client)                     │
│  ├── cms.cleanstart.com  ─ proxied (orange) ─┐                      │
│  ├── cms-dev.cleanstart.com (staging, TBD)   │                      │
│  └── cdn.cleanstart.com  ─ proxied ──────────┼──→ R2 bucket         │
└──────────────────────────────────────────────┼──────────────────────┘
                                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│  DO Droplet · 64.227.152.63 · 2 GB / 1 vCPU · Ubuntu 24.04.4        │
│                                                                     │
│  ┌─── Host services ────────────────────────────────────────────┐   │
│  │  Caddy (apt)         :80, :443  ── auto-LE certs             │   │
│  │  UFW · fail2ban · unattended-upgrades · do-agent · sshd      │   │
│  │  Backup cron (02:00 UTC) → R2                                │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                       Caddy reverse_proxy ↓                         │
│  ┌─── Docker (docker-compose) ──────────────────────────────────┐   │
│  │  apps-cms container  127.0.0.1:3000  ←─ GHA ships this image │   │
│  │  postgres:16-alpine  127.0.0.1:5432                          │   │
│  │  meilisearch:v1.9    127.0.0.1:7700                          │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  Paths: /opt/cleanstart (compose + env) · /var/lib/cleanstart       │
│  (lead-fallback-queue mount) · 2 GB swap                            │
└─────────────────────────────────────────────────────────────────────┘
        │                            │                      │
        ▼                            ▼                      ▼
   R2 (media + backups)         BetterStack            GitHub Actions
                              (probe + heartbeat)     builds + ships
                                                      images on `main`
```

External managed services:

- **GitHub Actions** — CI workflows (`ci.yml`, `web.yml`) and the deploy workflow (`deploy-cms.yml`)
- **R2** — media (`web/*`) + DB backups (`backups/*.dump`)
- **Brevo** — transactional email
- **Sentry** — exceptions, both apps
- **BetterStack** — uptime probe (CMS `/api/health`) + backup heartbeat. Host metrics come from **DO agent** (locked row 30).
- **HubSpot** — primary CRM

### 2.1 Host vs Docker — what runs where

Two reasons this split matters: (a) **state safety** — the data layer (Postgres + Meilisearch) lives in its own compose stack so a CMS redeploy can never recycle DB volumes; (b) **operational simplicity** — one process per role, all configured via files we own.

#### Runs natively on the host (systemd / cron / kernel / apt)

| Thing                                              | Why on host                                                              |
| -------------------------------------------------- | ------------------------------------------------------------------------ |
| **Caddy** (`/etc/caddy/Caddyfile`)                 | TLS termination + reverse proxy to `127.0.0.1:3000`; auto-LE cert; host-readable JSON access log at `/var/log/caddy/access.log` |
| **UFW + fail2ban + unattended-upgrades**           | Kernel-level firewall and security tools                                 |
| **Swap file** (`/swapfile`, 2 GB)                  | Kernel feature                                                           |
| **sysctl tunes** (`vm.swappiness`, etc.)           | Kernel feature                                                           |
| **DigitalOcean `do-agent`**                        | Ships pre-installed on DO Ubuntu images; primary host metrics            |
| **Backup cron** (`/etc/cron.d/cleanstart-backup`)  | Runs as system cron; needs `pg_dump` + `aws` on the host                 |
| **`awscli` + `postgresql-client-16`**              | Apt packages used by `infra/scripts/backup.sh` and `restore.sh`          |
| **`sshd`** (default)                               | GitHub Actions deploy workflow connects via SSH key                      |

#### Runs inside Docker

All three containers are managed by **one** `docker-compose.yml` on the droplet (`/opt/cleanstart/compose.yml`) — single orchestration source.

| Container          | Image                                | Volume                                                  | Network binding             |
| ------------------ | ------------------------------------ | ------------------------------------------------------- | --------------------------- |
| `postgres`         | `postgres:16-alpine`                 | `pgdata`                                                | `127.0.0.1:5432`            |
| `meilisearch`      | `getmeili/meilisearch:v1.9`          | `meilidata`                                             | `127.0.0.1:7700`            |
| `cms`              | `cms:<git-sha>` (built by GHA, loaded on droplet) | `/var/lib/cleanstart/lead-fallback-queue` (host-mounted) | `127.0.0.1:3000`            |

#### How the CMS container reaches Postgres + Meilisearch

All three containers share one compose-defined bridge network. DNS works by service name:

```
DATABASE_URI=postgres://postgres:***@postgres:5432/cleanstart
MEILISEARCH_URL=http://meilisearch:7700
```

No `host.docker.internal` indirection needed. UFW already blocks external traffic.

### 2.2 RAM budget — predicted vs actual

The 2 GB / 1 vCPU box has no slack. Every install must be measured at the time it lands so we know how close we are to the OOM cliff. Once the CMS is live, BetterStack monitors RAM > 85% × 5 min as P1 (locked row 23). This subsection is the **historical record** that pre-dates BetterStack: it tells us *why* the budget looks how it does today.

#### Predicted budget — arch doc §`#droplet-tuning` (post round-3 review)

| Process                               | Idle      | Peak              |
| ------------------------------------- | --------- | ----------------- |
| Postgres 16 (tuned)                   | ~250 MB   | ~400 MB           |
| Payload + Node runtime                | ~250 MB   | ~500 MB           |
| Meilisearch (capped, 290 docs)        | ~100 MB   | ~300 MB           |
| Sharp (per concurrent op)             | 0         | +50–150 MB        |
| Caddy + OS                            | ~80 MB    | ~120 MB           |
| **Total**                             | **~680 MB** | **~1.32 GB**    |
| Headroom on 2 GB                      | ~~~~~500 MB → **~680 MB**~~ (plus 2 GB swap as panic buffer)                                  |

> The post-Coolify budget restores ~170 MB of headroom that Round 1/2 numbers consumed. The arch doc §`#droplet-tuning` table was updated in the same review.

#### Live measurements — append a row on every install milestone

Capture command (run on the droplet after each install completes):

```bash
free -m | awk 'NR==2'                                                # total / used / free / shared / buff/cache / available
ps -eo rss,comm --sort=-rss | head -10                               # top 10 host processes by RSS
docker stats --no-stream --format 'table {{.Name}}\t{{.MemUsage}}'   # per-container
```

| Milestone                                  | Date       | Total | Used | Avail | Swap | Per-process / per-container breakdown                                                                                          |
| ------------------------------------------ | ---------- | ----- | ---- | ----- | ---- | ------------------------------------------------------------------------------------------------------------------------------ |
| Fresh droplet (baseline)                   | 2026-05-19 | 1967 MB | ~370 MB | ~1.6 GB | 0 MB | DO image baseline; sshd, systemd, kernel only                                                                                  |
| + 2 GB swap + sysctl tunes                 | 2026-05-19 | 1967 MB | ~377 MB | ~1.6 GB | 0 MB | No new processes; swap available as panic buffer                                                                               |
| + UFW + fail2ban + unattended-upgrades     | 2026-05-19 | 1967 MB | ~410 MB | ~1.5 GB | 0 MB | `fail2ban-server` ~35 MB                                                                                                       |
| + Docker engine 29.5.1                     | 2026-05-19 | 1967 MB | ~600 MB | ~1.35 GB | 0 MB | `dockerd` ~117 MB · `containerd` ~63 MB                                                                                        |
| Round 1/2: Coolify v4.1.0 (8 containers)   | 2026-05-19 | 1967 MB | 1055 MB | 912 MB | 0 MB | Peak Coolify footprint; informed the round-3 decision to remove it                                                             |
| + Postgres 16 (tuned, idle)                | 2026-05-19 | 1967 MB | ~1070 MB | ~900 MB | 0 MB | `infra-postgres-1` 15 MB at idle (still inside Coolify-era stack)                                                              |
| + Meilisearch (capped)                     | 2026-05-19 | 1967 MB | (same)  | (same)   | 0 MB | `infra-meilisearch-1` 15 MB at idle; healthy after curl-vs-wget fix                                                            |
| **Round 3 droplet wipe (clean baseline)** | 2026-05-19 11:14 | 1967 MB | **456 MB** | 1.5 GB | 0 MB | All containers/volumes/networks removed; `/data/coolify` + `/opt/cleanstart` gone. Only Docker engine + host services running. |
| + Caddy on host — Phase 4                  | 2026-05-19 11:25 | 1967 MB | ~480 MB | ~1.48 GB | 0 MB | Caddy v2.11.3, ~25 MB resident. LE cert issued on first probe.                                                               |
| + Postgres 16 + Meilisearch — Phase 6      | 2026-05-19 11:27 | 1967 MB | **504 MB** | 1.46 GB | 0 MB | Both containers `(healthy)`. Postgres ~15 MB + Meilisearch ~15 MB at idle (containers themselves). Tuning all 5 params verified. |
| + apps/cms container — Phase 9             | _pending_  | — | — | — | — | Expect ~+250 MB idle, ~+500 MB peak                                                                                           |
| First media upload burst (Sharp transient) | _pending_  | — | — | — | — | Expect +50–150 MB transient                                                                                                   |
| First Meilisearch reindex                  | _pending_  | — | — | — | — | Watch for the [Meili LMDB overrun](https://github.com/meilisearch/meilisearch/issues/3725) — swap should absorb               |

#### What "Used" actually means

`free -m` "used" already excludes buff/cache reclaimable memory but **includes** Docker container memory. Numbers above are taken at idle; under a synthetic load (upload burst, Meili reindex) the peak row in the predicted table is the target — anything beyond it is a regression to investigate.

#### Variance flags so far

- **Coolify GA cost was the headline finding of round 3** — ~450 MB across 8 containers, ~22% of the 2 GB box. Removing it returns the budget to the arch doc's original prediction.
- **Tripwire (locked row 1):** if Phase 9 measurement crosses 1.5 GB used at idle with the CMS up, bump to 4 GB ($24/mo). At ~1.2 GB predicted idle post-Coolify, we have room.

---

## 3. Prerequisites — gather before starting

Check each off before touching the droplet. Most live in 1Password vault `cleanstart-migration`.

### Accounts + access

- [ ] DO droplet provisioned (2 GB / 1 vCPU / 60 GB / Ubuntu 22.04 or 24.04)
- [ ] Operator SSH key registered with DO (fingerprint matches operator's local key)
- [ ] Cloudflare zone `cleanstart.com` under team control
- [ ] R2 bucket `cleanstart` exists; access key with **write** scope
- [ ] R2 bucket `cleanstart-backups` exists; **lifecycle rule "7 daily / 4 weekly / 3 monthly"** (locked row 22; backlog B4)
- [ ] Domain `cms.cleanstart.com` ready to assign to droplet IP
- [ ] Domain `cdn.cleanstart.com` configured as R2 custom domain
- [ ] BetterStack account; uptime monitor + heartbeat URL created

### GitHub Actions secrets (in the repo settings)

- [ ] `DROPLET_HOST` = `64.227.152.63` (or DNS name)
- [ ] `DROPLET_USER` = `root`
- [ ] `DROPLET_SSH_KEY` = the private ED25519 key whose public part is in `/root/.ssh/authorized_keys` on the droplet (use a **separate key from the operator's**, named `gha-deploy`)
- [ ] `CMS_ENV_FILE` = full contents of `/opt/cleanstart/.env` on the droplet (the GHA workflow renders this into the droplet on every deploy, replacing the file atomically — so .env on the droplet is reproducible from this single secret)

### Integration tokens (loaded into `CMS_ENV_FILE`)

- [ ] HubSpot Private App token (scopes: `crm.objects.contacts.read|write`)
- [ ] Brevo API key + lead-notification template ID
- [ ] Cloudflare Turnstile site + secret keys
- [ ] Sentry DSN
- [ ] Google service-account JSON (GA4 + GSC)
- [ ] Microsoft Clarity API token

### Generated secrets in 1Password

- [ ] `POSTGRES_PASSWORD`
- [ ] `PAYLOAD_SECRET`
- [ ] `MEILISEARCH_MASTER_KEY`
- [ ] `LIVE_PREVIEW_SECRET`
- [ ] `PREVIEW_JWT_SECRET`
- [ ] `WEB_REVALIDATE_SECRET`

Generate any missing with: `openssl rand -base64 32`.

---

## 4. Deployment phases

Each phase is one commit-sized unit of work. Verify the **Done when** clause before moving on.

### Phase 1 — Droplet baseline (host-only changes)

| #   | Step                                                                                       | Done when                         |
| --- | ------------------------------------------------------------------------------------------ | --------------------------------- |
| 1.1 | SSH in as `root`                                                                           | `whoami` returns `root`           |
| 1.2 | `apt-get update` (index refresh only — no installs)                                       | exit 0                            |
| 1.3 | Add 2 GB swap (`/swapfile`) + persist in `/etc/fstab`                                      | `free -h` shows 2 GiB swap        |
| 1.4 | Write `/etc/sysctl.d/99-cleanstart.conf` with swappiness + cache_pressure                  | `sysctl vm.swappiness` = `10`     |
| 1.5 | `DEBIAN_FRONTEND=noninteractive apt-get -y -o Dpkg::Options::='--force-confold' upgrade`   | exit 0, no broken services        |

**Note on SSH hardening:** for a **single-operator droplet behind Cloudflare WAF with key-only auth**, sticking with root SSH is acceptable. The GHA deploy workflow uses its own dedicated key. Revisit when a second operator is added (locked row 29).

### Phase 2 — Firewall + auto-updates + fail2ban

| #   | Step                                                                                                  | Done when                                       |
| --- | ----------------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| 2.1 | `apt-get install -y ufw fail2ban unattended-upgrades`                                                 | exit 0                                          |
| 2.2 | `ufw allow 22/tcp && ufw allow 80/tcp && ufw allow 443/tcp`                                           | three rules listed                              |
| 2.3 | `ufw default deny incoming && ufw default allow outgoing`                                             | defaults set                                    |
| 2.4 | `ufw enable` (**verify SSH still works in a 2nd session before closing the first**)                   | `ufw status` = active                           |
| 2.5 | `dpkg-reconfigure --priority=low unattended-upgrades`                                                 | `/etc/apt/apt.conf.d/20auto-upgrades` present   |
| 2.6 | `systemctl enable --now fail2ban`                                                                     | `systemctl is-active fail2ban` = active         |

### Phase 3 — Docker

| #   | Step                                       | Done when                               |
| --- | ------------------------------------------ | --------------------------------------- |
| 3.1 | `curl -fsSL https://get.docker.com \| sh`  | `docker --version` works                |
| 3.2 | `systemctl enable --now docker`            | `systemctl is-active docker` = active   |
| 3.3 | `docker compose version` works             | exit 0                                  |

### Phase 4 — Caddy on host

Caddy listens on `:443`, terminates TLS, reverse-proxies to `localhost:3000`. Auto-issues + renews the Let's Encrypt cert; no certbot setup needed.

| #   | Step                                                                                                                                   | Done when                                              |
| --- | -------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| 4.1 | Install Caddy via Cloudsmith apt repo: `curl -1sLf https://dl.cloudsmith.io/public/caddy/stable/gpg.key \| gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg && curl -1sLf https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt > /etc/apt/sources.list.d/caddy-stable.list && apt-get update && apt-get install -y caddy` | `caddy version` works |
| 4.2 | Write `/etc/caddy/Caddyfile` (config below)                                                                                            | file present, mode 644                                 |
| 4.3 | `install -d -m 755 -o caddy -g caddy /var/log/caddy`                                                                                   | dir exists                                             |
| 4.4 | `systemctl reload caddy` (Caddy installed enabled by the apt package)                                                                  | `systemctl is-active caddy` = active                   |
| 4.5 | After Phase 7 sets the DNS A record + Phase 9 brings the app up: `curl -I https://cms.cleanstart.com` returns 502 from Caddy (no app yet) with a **valid LE cert** in browser | cert valid; HTTP 526 from CF before app, 502 after Phase 9 build |

**`/etc/caddy/Caddyfile`** (full config — 5 lines):

```
cms.cleanstart.com {
  reverse_proxy localhost:3000

  log {
    output file /var/log/caddy/access.log {
      roll_size 10mb
      roll_keep 7
    }
    format json
  }
}
```

### Phase 5 — Compose + secrets on droplet

The droplet needs (a) the compose file that runs Postgres + Meilisearch + the (yet-to-deploy) CMS container, (b) the env file with all runtime secrets, and (c) the lead-fallback-queue host directory. Everything goes in `/opt/cleanstart/`.

| #   | Step                                                                                                                              | Done when             |
| --- | --------------------------------------------------------------------------------------------------------------------------------- | --------------------- |
| 5.1 | `mkdir -p /opt/cleanstart && cd /opt/cleanstart`                                                                                  | dir exists            |
| 5.2 | Generate secrets: `openssl rand -base64 32` for each of `POSTGRES_PASSWORD`, `MEILISEARCH_API_KEY`, `PAYLOAD_SECRET`, `LIVE_PREVIEW_SECRET`, `PREVIEW_JWT_SECRET`, `WEB_REVALIDATE_SECRET` | all saved to 1Password |
| 5.3 | Write `/opt/cleanstart/.env` from the template at §6 below (chmod 600). Long-term: this file is overwritten by GHA on every deploy from the `CMS_ENV_FILE` repo secret. | file exists, mode 600 |
| 5.4 | Write `/opt/cleanstart/compose.yml` from the template at §6.1 below                                                               | file present          |
| 5.5 | `mkdir -p /var/lib/cleanstart/lead-fallback-queue && chown 1001:1001 /var/lib/cleanstart/lead-fallback-queue`                     | dir exists, uid 1001  |

### Phase 6 — Postgres + Meilisearch (compose, app deferred to Phase 9)

| #   | Step                                                                                                                                                | Done when                                                      |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| 6.1 | From `/opt/cleanstart`: `docker compose up -d postgres meilisearch`                                                                                  | both containers `(healthy)` after ~30s                         |
| 6.2 | Apply Postgres tuning via `ALTER SYSTEM` then restart: `shared_buffers=128MB, work_mem=4MB, effective_cache_size=1GB, max_connections=20, maintenance_work_mem=64MB` | all five `SHOW` queries return the locked values               |
| 6.3 | `docker compose exec postgres pg_isready -U postgres -d cleanstart`                                                                                 | exit 0                                                         |
| 6.4 | `curl -sS http://127.0.0.1:7700/health`                                                                                                             | `{"status":"available"}`                                       |

### Phase 7 — DNS + Cloudflare

| #   | Step                                                            | Done when                |
| --- | --------------------------------------------------------------- | ------------------------ |
| 7.1 | Cloudflare DNS: `A cms → <droplet-ip>` (proxied 🟧)            | record present, orange   |
| 7.2 | Cloudflare SSL/TLS mode = **Full (strict)**                     | confirmed                |
| 7.3 | Cloudflare WAF: Managed + OWASP rulesets enabled                | both on                  |
| 7.4 | Cloudflare rate limit on `/admin/*` (e.g. 100 req/min/IP)       | rule active              |
| 7.5 | `dig +short cms.cleanstart.com` returns Cloudflare anycast IPs  | resolves to `104.x` / `172.67.x` |

### Phase 8 — GitHub Actions deploy workflow

This is the heart of the new approach. One workflow file, one droplet SSH key, three repo secrets.

| #   | Step                                                                                                                              | Done when                                                 |
| --- | --------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| 8.1 | On the operator's Mac, generate a fresh ED25519 key for GHA: `ssh-keygen -t ed25519 -f ~/.ssh/gha-deploy -N '' -C gha-deploy`     | both files present                                        |
| 8.2 | Add the public key to the droplet: `cat ~/.ssh/gha-deploy.pub \| ssh root@<ip> 'cat >> /root/.ssh/authorized_keys'`              | `ssh -i ~/.ssh/gha-deploy root@<ip> whoami` returns `root` |
| 8.3 | Add GitHub repo secrets (Settings → Secrets and variables → Actions): `DROPLET_HOST`, `DROPLET_USER=root`, `DROPLET_SSH_KEY` (paste the **private** key from `~/.ssh/gha-deploy`), `CMS_ENV_FILE` (paste the full contents of `/opt/cleanstart/.env`) | all 4 secrets present                                     |
| 8.4 | Write `.github/workflows/deploy-cms.yml` from the template at §6.2 below; commit + push                                           | workflow visible in Actions tab                           |
| 8.5 | Trigger manually via **Actions → Deploy CMS → Run workflow** (workflow_dispatch); watch it build, ship the image, and start the container | workflow green; last step prints `cms is healthy`  |

### Phase 9 — First real deploy + smoke probe

| #   | Step                                                                                                  | Done when                                |
| --- | ----------------------------------------------------------------------------------------------------- | ---------------------------------------- |
| 9.1 | After Phase 8.5 succeeds: `curl -I https://cms.cleanstart.com/admin`                                  | HTTP 200/307 with CF + Caddy headers; cert valid in browser |
| 9.2 | `docker logs --tail 100 $(docker compose -f /opt/cleanstart/compose.yml ps -q cms)` shows `pnpm migrate` succeeded, then `Server listening on 3000` | log confirms     |
| 9.3 | Append Phase 9 RAM snapshot to §2.2 table                                                              | row added                                |
| 9.4 | Verify the lead-fallback queue volume is writable by uid 1001 inside the container                    | `docker exec cms touch /var/lib/cleanstart/lead-fallback-queue/.ok` exits 0 |

### Phase 10 — Bootstrap Payload admin + 2FA

| #    | Step                                                                                           | Done when      |
| ---- | ---------------------------------------------------------------------------------------------- | -------------- |
| 10.1 | First-run wizard creates initial Payload superadmin (personal email + hardware-key-backed account) | login works    |
| 10.2 | Enable TOTP immediately; save recovery seed in 1Password                                       | 2FA active     |
| 10.3 | Add teammates as users; require 2FA on each                                                    | every user 2FA |

### Phase 11 — Backups + monitoring

| #    | Step                                                                                                                            | Done when             |
| ---- | ------------------------------------------------------------------------------------------------------------------------------- | --------------------- |
| 11.1 | `apt-get install -y awscli postgresql-client-16`                                                                                | both installed        |
| 11.2 | Create BetterStack heartbeat monitor (grace 26 h); copy URL                                                                     | URL in 1Password      |
| 11.3 | Write `/etc/cron.d/cleanstart-backup` invoking `infra/scripts/backup.sh` at **02:00 UTC** (L2 → locked) with all required env vars | cron registered       |
| 11.4 | `DRY_RUN=1 /opt/cleanstart/scripts/backup.sh` then real run                                                                     | first `.dump` in R2   |
| 11.5 | Configure R2 lifecycle rules: keep 7 daily / 4 weekly / 3 monthly (locked row 22 / backlog B4)                                  | rule confirmed in R2  |
| 11.6 | BetterStack monitors: HTTP probe on `https://cms.cleanstart.com/api/health`, RAM > 85% × 5m, swap > 100 MB × 5m, disk < 20%    | all 4 in place        |
| 11.7 | DO `do-agent` host metrics confirmed visible in DO dashboard (RAM/CPU/swap/disk) — no extra agent install needed                | dashboards populated  |

### Phase 12 — Smoke test (gate to "live")

Walk every external integration end-to-end. Failure on any one of these blocks "live" — fix before letting editors in.

- [ ] Admin login + 2FA at `https://cms.cleanstart.com/admin`
- [ ] Create + publish a Blog → row appears in `blogs` table
- [ ] Upload an image → object at `s3://cleanstart/web/general/<slug>.webp` in R2, public URL resolves on `cdn.cleanstart.com`
- [ ] `curl -X POST https://cms.cleanstart.com/api/leads/submit …` with a Turnstile token → row in `leads` + Brevo email sent
- [ ] Publish doc → wait ≤ 2 min → Meilisearch returns hit via CMS search
- [ ] `docker logs cms \| grep '\[jobs\]'` shows at least one `lead-queue-drain` tick after 5 min
- [ ] Manual `/opt/cleanstart/scripts/backup.sh` produces a fresh `.dump` in R2 and pings BetterStack
- [ ] `ALLOW_RESTORE=yes /opt/cleanstart/scripts/restore.sh <ts>` against a throwaway local DB succeeds; record outcome in `docs/RESTORE-LOG.md`

### Phase 13 — Confirm auto-deploy

| #    | Step                                                                                                       | Done when |
| ---- | ---------------------------------------------------------------------------------------------------------- | --------- |
| 13.1 | The workflow's `on: push.branches: [main]` is already in `deploy-cms.yml` (Phase 8.4); no toggle needed   | yaml shows the trigger |
| 13.2 | Push a no-op commit to `main`, watch deploy-cms.yml run and the new container swap in                      | green     |

---

## 5. Per-droplet done checklist — `64.227.152.63`

Snapshot of this droplet's state. Update as phases land.

### Identity

- **Hostname:** `cleanstart-cms`
- **IP:** `64.227.152.63`
- **OS:** Ubuntu 24.04.4 LTS
- **Spec:** 2 GB RAM / 1 vCPU
- **Created:** 2026-05-19

### Phase status (post round-3 wipe — 2026-05-19 11:14 UTC)

After the round-3 CTO review, the droplet was wiped clean of Coolify + all application-layer state (containers, volumes, networks, `/data/coolify`, `/opt/cleanstart`, etc.) so the GHA + Caddy path could be executed against a clean slate. **Host baseline (Phases 1–3 + Phase 7 DNS) survived the wipe** — no reason to redo kernel/firewall/Docker work.

**Surviving (KEPT) from prior work:**

- [x] Phase 1.1 — SSH access verified (key fingerprint `8f:f9:d2:f3:64:ee:68:24:39:4c:4c:b2:c8:43:a1:16` = `mac-mini-gaurav-jadhav`)
- [x] Phase 1.2 — `apt-get update` ran clean
- [x] Phase 1.3 — 2 GB swap active; `/etc/fstab` persists
- [x] Phase 1.4 — sysctl: `vm.swappiness=10`, `vm.vfs_cache_pressure=50`
- [x] Phase 1.5 — `apt upgrade` ran clean; kernel `6.8.0-117-generic`
- [x] Phase 2 — UFW active (22/80/443 only) · fail2ban active (sshd jail) · unattended-upgrades active
- [x] Phase 3 — Docker Engine 29.5.1, compose v5.1.3 (engine kept; all containers/volumes/networks wiped)
- [x] Phase 7 — Cloudflare DNS A record `cms.cleanstart.com → 64.227.152.63` (proxied 🟧); resolves through CF; SSL/TLS Full

**To do from clean baseline:**

- [x] Phase 4 — Caddy v2.11.3 installed, `/etc/caddy/Caddyfile` deployed, log dir at `/var/log/caddy`, LE cert issued (HTTPS probe through CF returns 502 = origin reachable + valid cert)
- [x] Phase 5 — `/opt/cleanstart/{compose.yml,.env}` written (`.env` chmod 600); `/var/lib/cleanstart/lead-fallback-queue` owned by uid 1001
- [x] Phase 6 — Postgres 16 + Meilisearch via unified compose; both `(healthy)`; all 5 Postgres tunables verified (`shared_buffers=128MB`, `max_connections=20`, etc.)
- [ ] Phase 8 — GHA deploy workflow + repo secrets + dedicated `gha-deploy` key
- [ ] Phase 9 — First CMS deploy via workflow_dispatch
- [ ] Phase 10 — Payload admin user + 2FA
- [ ] Phase 11 — Backups + R2 lifecycle + BetterStack
- [ ] Phase 12 — Smoke test
- [ ] Phase 13 — Push-to-main confirmation

**RAM baseline after wipe:** 456 MB used / 1.5 GB available / 0 swap. Forecast at peak (Phase 9+): ~1.4 GB used, ~600 MB headroom.

### Deviations from locked decisions (audit trail)

| Date       | Round | What changed                                                                 | Why                                                                                                                                                                |
| ---------- | ----- | ---------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 2026-05-19 | —     | Ubuntu 24.04.4 LTS chosen over 22.04                                         | Within locked-row-2 range; newer LTS, supported until 2029                                                                                                         |
| 2026-05-19 | 2     | Coolify v4.0.0-beta.470 pin → Coolify v4.1.0 GA pin                          | Installer ignored `COOLIFY_VERSION` env; pinned `:4.1.0` instead in `docker-compose.prod.yml`                                                                      |
| 2026-05-19 | 2     | Caddy on host → Traefik (Coolify-managed)                                    | Coolify GA shipped Traefik bound to 80/443. Disabling it was a fight; embraced the default.                                                                        |
| 2026-05-19 | 3     | **Reverted to Caddy + dropped Coolify entirely**                             | RAM: Coolify consumed ~450 MB on a 2 GB box. Friction: every default conflicted with locks. ROI: one app, one operator, no platform value. Switched to GHA deploy. |

---

## 6. Runtime config templates

### 6.1 `/opt/cleanstart/compose.yml`

Single compose file with all three services. Shared bridge network so `cms` reaches `postgres` + `meilisearch` by service name.

```yaml
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
      test: ["CMD-SHELL", "curl -fsS http://localhost:7700/health || exit 1"]
      interval: 15s
      timeout: 5s
      retries: 3

  cms:
    image: cms:current        # GHA tags the built image as `cms:<sha>` AND `cms:current`
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

volumes:
  pgdata:
  meilidata:
```

### 6.2 `.github/workflows/deploy-cms.yml`

```yaml
name: Deploy CMS
on:
  push:
    branches: [main]
    paths:
      - 'apps/cms/**'
      - 'packages/**'
      - 'pnpm-lock.yaml'
      - 'apps/cms/Dockerfile'
      - '.github/workflows/deploy-cms.yml'
  workflow_dispatch:
    inputs:
      sha:
        description: 'Optional git SHA to deploy (default: current HEAD)'
        required: false

concurrency:
  group: deploy-cms-prod
  cancel-in-progress: false

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          ref: ${{ inputs.sha || github.sha }}

      - name: Build image
        run: |
          docker build \
            -f apps/cms/Dockerfile \
            -t cms:${{ github.sha }} \
            .

      - name: Save image tarball
        run: docker save cms:${{ github.sha }} | gzip > /tmp/cms.tar.gz

      - name: Set up SSH key
        run: |
          mkdir -p ~/.ssh
          echo "${{ secrets.DROPLET_SSH_KEY }}" > ~/.ssh/id_deploy
          chmod 600 ~/.ssh/id_deploy
          ssh-keyscan -H ${{ secrets.DROPLET_HOST }} >> ~/.ssh/known_hosts

      - name: Ship image to droplet
        run: |
          scp -i ~/.ssh/id_deploy /tmp/cms.tar.gz \
            ${{ secrets.DROPLET_USER }}@${{ secrets.DROPLET_HOST }}:/tmp/cms.tar.gz

      - name: Render .env from secret
        run: |
          ssh -i ~/.ssh/id_deploy ${{ secrets.DROPLET_USER }}@${{ secrets.DROPLET_HOST }} \
            'umask 077 && cat > /opt/cleanstart/.env' <<'EOF'
          ${{ secrets.CMS_ENV_FILE }}
          EOF

      - name: Load + restart
        run: |
          ssh -i ~/.ssh/id_deploy ${{ secrets.DROPLET_USER }}@${{ secrets.DROPLET_HOST }} '
            set -e
            cd /opt/cleanstart
            docker load < /tmp/cms.tar.gz
            docker tag cms:${{ github.sha }} cms:current
            docker compose up -d --wait cms
            docker image prune -f --filter "label!=keep"
            rm -f /tmp/cms.tar.gz
            echo "cms is healthy"
          '
```

### 6.3 `/opt/cleanstart/.env` template

Paste this template, replace `<from-1pw>` with values from the `cleanstart-migration` vault, then mirror the full contents into the GitHub repo secret `CMS_ENV_FILE` so deploys can re-render it.

```ini
# ─── Runtime ───────────────────────────────────────────────
NODE_ENV=production
PORT=3000
PAYLOAD_AUTO_RUN=true
PAYLOAD_PUBLIC_ENV=production
PAYLOAD_PUBLIC_SERVER_URL=https://cms.cleanstart.com
PAYLOAD_CORS_ORIGINS=https://cms.cleanstart.com,https://cleanstart.com
TRUSTED_PROXY_HOPS=2
WEB_CONCURRENCY=1
RATE_LIMIT_BACKEND=memory

# ─── Database (uses compose service DNS) ───────────────────
POSTGRES_PASSWORD=<from-1pw>
DATABASE_URI=postgres://postgres:<from-1pw>@postgres:5432/cleanstart
PAYLOAD_SECRET=<from-1pw>

# ─── R2 (media + backups) ──────────────────────────────────
R2_ACCESS_KEY_ID=<from-1pw>
R2_SECRET_ACCESS_KEY=<from-1pw>
R2_BUCKET=cleanstart
R2_ENDPOINT=https://394d5e2bbba246d392071093599eba52.r2.cloudflarestorage.com
R2_PUBLIC_BASE=https://cdn.cleanstart.com
R2_UPLOAD_PREFIX=web

# ─── Meilisearch (compose service DNS) ─────────────────────
MEILISEARCH_URL=http://meilisearch:7700
MEILISEARCH_API_KEY=<from-1pw>
MEILISEARCH_MASTER_KEY=<from-1pw>

# ─── Lead fallback queue (host-mounted) ────────────────────
LEAD_QUEUE_LOCAL_DIR=/var/lib/cleanstart/lead-fallback-queue

# ─── Site + preview + revalidate ───────────────────────────
NEXT_PUBLIC_SITE_URL=https://cleanstart.com
NEXT_PUBLIC_SITE_ORIGIN=https://cleanstart.com
NEXT_PUBLIC_SITE_HOSTS=cleanstart.com,www.cleanstart.com
WEB_BASE_URL=https://cleanstart.com
LIVE_PREVIEW_SECRET=<from-1pw>
PREVIEW_JWT_SECRET=<from-1pw>
WEB_REVALIDATE_URL=https://cleanstart.com/api/revalidate
WEB_REVALIDATE_SECRET=<from-1pw>

# ─── Integrations (fill in as channels go live) ────────────
TURNSTILE_SITE_KEY=
TURNSTILE_SECRET_KEY=
BREVO_API_KEY=
BREVO_TEMPLATE_ID=
SENTRY_DSN=
WEBHOOK_TEAMS_URL=
WEBHOOK_GENERIC_URL=
WEBHOOK_GENERIC_SIGNING_SECRET=
INDEXNOW_KEY=
HUBSPOT_PRIVATE_APP_TOKEN=
GOOGLE_APPLICATION_CREDENTIALS_JSON=
CLARITY_API_TOKEN=
CLOUDFLARE_API_TOKEN=
CLOUDFLARE_ACCOUNT_TAG=
CALCOM_SIGNING_SECRET=
BREVO_INBOUND_TOKEN=
```

### Secrets-to-rotate list (locked row 32)

Manual rotation on incident only. Known list:

- `PAYLOAD_SECRET`
- `POSTGRES_PASSWORD`
- `MEILISEARCH_API_KEY` (also `MEILISEARCH_MASTER_KEY` if regenerated)
- `LIVE_PREVIEW_SECRET`
- `PREVIEW_JWT_SECRET`
- `WEB_REVALIDATE_SECRET`
- `WEBHOOK_GENERIC_SIGNING_SECRET`
- `R2_ACCESS_KEY_ID` + `R2_SECRET_ACCESS_KEY`
- All integration tokens (`HUBSPOT_PRIVATE_APP_TOKEN`, `BREVO_API_KEY`, `TURNSTILE_SECRET_KEY`, `CLARITY_API_TOKEN`, `CLOUDFLARE_API_TOKEN`, `CALCOM_SIGNING_SECRET`, `BREVO_INBOUND_TOKEN`, `GOOGLE_APPLICATION_CREDENTIALS_JSON`)
- `DROPLET_SSH_KEY` (the `gha-deploy` private key — re-roll annually or on operator change)

---

## 7. Operational backlog

Open items, in priority order. Move into the per-droplet checklist or close out as they land.

### Pre-launch blockers

- **B2 — Resolve backup time (L2).** Lock at **02:00 UTC** in this doc and in the cron snippet. (Phase 11.3 closes this.)
- **B3 — First restore drill.** Per arch doc §`#restore-runbook`: "first drill must complete *before* the migration cutover, not after." `docs/RESTORE-LOG.md` is currently empty.
- **B4 — Configure R2 lifecycle rules.** Locked row 22 says 7/4/3 daily/weekly/monthly. Not yet enforced on the R2 bucket. Phase 11.5.
- **B5 — Coolify uninstall** (round-3 cleanup on the current droplet). One-time: `cd /data/coolify/source && docker compose down -v && rm -rf /data/coolify`. ~450 MB RAM returns.

### Post-launch (within 30 days)

- **P1 — Staging droplet at `cms-dev.cleanstart.com`** (locked row 26). Separate machine, behind Cloudflare Access, `R2_UPLOAD_PREFIX=dev`, read-only R2 keys, `PAYLOAD_PUBLIC_ROBOTS_DISALLOW=true`. Required for ongoing restore drills and CSS/template change verification. Same GHA workflow with a different `DROPLET_HOST` secret.
- **P2 — Cross-cloud backup mirror (L3).** Arch doc §`#restore-runbook` calls for nightly sync R2 → DO Spaces (~$5/mo). Without this, R2 is a single point of failure for backups + media + lead-fallback queue.
- **P3 — Monthly restore drill cadence.** Calendar reminder, rotating Q1 from R2, Q2 from Spaces, etc., so both restore paths get exercised at least twice a year.
- **P4 — Inverted heartbeat alert.** BetterStack rule that fires *when the backup heartbeat is missing for 25 h*, not when it succeeds. Alert-on-success masks silent cron failure for days.
- **P5 — Sentry + log shipping.** Wire Sentry DSN; add JSON access-log shipping to BetterStack Logs or Axiom (1 GB/mo free tier). Caddy already emits JSON to `/var/log/caddy/access.log` — ship from there.
- **P6 — Rate limiter backend swap.** Move `RATE_LIMIT_BACKEND` from `memory` to `redis` (or `postgres`) the moment we run > 1 worker (locked row 15 tripwire).

### Documentation

- **D1 — Operator runbook for common failures.** Caddy 502 / GHA deploy SSH fail / Postgres connection storm / OOM-killed CMS — each with one-command diagnostic.
- **D2 — Manual deploy runbook** (`docs/runbooks/manual-deploy.md`). When GHA itself is unavailable: pull a previously shipped image still in the droplet's local Docker cache, or build the image on the operator's laptop and `scp` the tarball up.

### Known gaps in shipped infra (now mostly closed)

- ~~G1 — Postgres/Meili on `0.0.0.0`~~ **CLOSED 2026-05-19** — committed compose binds `127.0.0.1`.
- ~~G2 — Meilisearch tuning flags missing~~ **CLOSED 2026-05-19** — committed compose has `command: …`.
- ~~G3 — Meilisearch healthcheck used `wget`~~ **CLOSED 2026-05-19** — switched to `curl`.
- ~~G4 — No `Dockerfile` `HEALTHCHECK` on CMS container~~ **CLOSED 2026-05-19** — compose-level healthcheck on `cms` service hits `/api/health`.
- ~~G5 — `infra/caddy/Caddyfile` committed but unused~~ **CLOSED 2026-05-19** — deleted; the round-3 Caddyfile lives only on the droplet (no committed source; the 5-line config is in §4.2 above for reproducibility).

---

## 8. Reference index

| Need                                                   | Look here                                                   |
| ------------------------------------------------------ | ----------------------------------------------------------- |
| Droplet tuning (Postgres / Sharp / Meilisearch / swap) | arch doc §`#droplet-tuning`                                |
| Backup retention + restore procedure                   | arch doc §`#restore-runbook`                               |
| Logging, alerts, on-call                               | arch doc §`#logging-alerting`                              |
| Staging environment spec                               | arch doc §`#staging`                                       |
| Security headers + CSP                                 | arch doc §`#security-headers` (apps/web concern)           |
| Cron job catalog                                       | arch doc §`#cron-jobs`                                     |
| Env var reference                                      | `apps/cms/.env.example` (annotated)                         |
| Compose file (Postgres + Meilisearch + CMS)            | §6.1 of this doc (`/opt/cleanstart/compose.yml` on droplet) |
| GitHub Actions deploy workflow                         | §6.2 of this doc (`.github/workflows/deploy-cms.yml`)       |
| Caddyfile                                              | §4.2 of this doc (`/etc/caddy/Caddyfile` on droplet)        |
| Env file template                                      | §6.3 of this doc (`/opt/cleanstart/.env` + `CMS_ENV_FILE` repo secret) |
| Backup / restore scripts                               | `infra/scripts/backup.sh` · `infra/scripts/restore.sh`     |
| Production Dockerfile                                  | `apps/cms/Dockerfile`                                       |
| CI workflows (test only, not deploy)                   | `.github/workflows/ci.yml` · `.github/workflows/web.yml`   |
| Webflow rollback                                       | `docs/migration/rollback-runbook.md`                        |
| Restore drill log                                      | `docs/RESTORE-LOG.md`                                       |
| apps/web production                                    | `docs/WEB-PRODUCTION.md`                                    |
| Conventions (code, deploy, forbidden actions)          | `CLAUDE.md`                                                 |
