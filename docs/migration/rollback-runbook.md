# Rollback Runbook — CleanStart CMS Migration

This runbook covers the H10 rollback procedure for reverting to Webflow after a failed or aborted CMS cutover. Estimated RTO: **30 minutes**.

## Prerequisites

- Access to Cloudflare dashboard (DNS)
- Access to Coolify dashboard (deployments)
- `ALLOW_RESTORE=yes` and R2 credentials available in the terminal session
- The timestamp of the pre-migration Postgres backup (should be recorded in `docs/RESTORE-LOG.md`)

---

## Step 1 — Stop the CMS deployment (5 min)

1. Open Coolify → select the `cleanstart-cms` service.
2. Click **Stop** (not Delete — preserve the environment and volumes).
3. Confirm the container stops. The admin URL will return 502 — expected.

> Do NOT destroy the Coolify environment. It preserves the Postgres volume for inspection.

---

## Step 2 — Restore Postgres from pre-migration backup (10 min)

```bash
# Set required env vars (or source from your shell profile)
export DATABASE_URI="postgres://postgres:PASSWORD@localhost:5432/cleanstart"
export R2_ENDPOINT="https://ACCOUNT.r2.cloudflarestorage.com"
export R2_ACCESS_KEY_ID="..."
export R2_SECRET_ACCESS_KEY="..."
export R2_BUCKET="cleanstart-backups"

# List available backups to find the pre-migration snapshot
ALLOW_RESTORE=yes ./infra/scripts/restore.sh

# Restore the pre-migration snapshot (use the timestamp from docs/RESTORE-LOG.md)
ALLOW_RESTORE=yes ./infra/scripts/restore.sh 2026-05-12T02:00:00Z
```

Verify restore succeeded:
```bash
psql "$DATABASE_URI" -c "SELECT count(*) FROM payload_collections_blogs;"
```

---

## Step 3 — Repoint DNS to Webflow (5 min)

1. Open Cloudflare dashboard → DNS for `cleanstart.com`.
2. Find the `CNAME` or `A` record for `@` (root) and `www`.
3. Update both to point back to Webflow's proxy target:
   - Webflow custom domain target: `proxy-ssl.webflow.com` (CNAME)
4. Set TTL to **Auto** (Cloudflare proxied = near-instant propagation).
5. Verify with: `curl -I https://cleanstart.com | grep -i location`

---

## Step 4 — Verify Webflow is serving (5 min)

- [ ] `https://cleanstart.com` returns 200 with Webflow content
- [ ] `https://www.cleanstart.com` returns 200 or redirects to root
- [ ] A sample blog post URL loads correctly
- [ ] Forms on the site submit without errors

---

## Step 5 — Log the incident (5 min)

Add an entry to `docs/RESTORE-LOG.md`:

```
| {date} | {backup timestamp} | {duration} | {operator} | Rollback after cutover attempt on {date} |
```

---

## After rollback

- Do not delete the CMS Coolify environment — retain it for post-mortem.
- Schedule a post-mortem within 48 hours.
- Identify what caused the rollback before scheduling a second cutover attempt.
- The pre-migration backup snapshot in R2 should be retained until the next successful cutover.
