# Droplet Migration Runbook

Self-contained guide for running the Webflow → Payload migration on the
production droplet. Assumes the deploy is complete (repo present,
Postgres running, `apps/cms/.env` has prod DB + R2 creds).

**Total runtime: ~25–35 min** (mostly asset upload + media registration).

---

## 0 · Pre-flight (~3 min)

```bash
ssh root@<droplet-ip>
cd /opt/cleanstart-website
tmux new -s migration                    # survives SSH disconnects
```

### 0.1 Create `.env.migration` (one-time per droplet — gitignored)

```bash
cat > .env.migration <<'EOF'
export WEBFLOW_API_TOKEN="<paste from 1Password: cleanstart-migration>"
export WEBFLOW_SITE_ID="688cb1df5bbf5068ddce4492"
export WEBFLOW_SITE_URL="https://cleanstart.com"
export PAYLOAD_URL="https://admin.cleanstart.com"
EOF
chmod 600 .env.migration
```

### 0.2 Snapshot Postgres (every run, non-negotiable)

```bash
TS=$(date +%Y%m%d-%H%M%S)
pg_dump cleanstart > /var/backups/cleanstart-pre-migration-$TS.sql
ls -lh /var/backups/cleanstart-pre-migration-$TS.sql
```

### 0.3 Verify the Webflow token is read-only

```bash
source .env.migration
curl -s -o /dev/null -w "GET /sites: %{http_code} (expect 200)\n" \
  -H "Authorization: Bearer $WEBFLOW_API_TOKEN" -H "accept-version: 2.0.0" \
  "https://api.webflow.com/v2/sites/$WEBFLOW_SITE_ID"

curl -s -o /dev/null -w "POST attempt: %{http_code} (expect 403 — missing sites:write)\n" \
  -X POST -H "Authorization: Bearer $WEBFLOW_API_TOKEN" -H "accept-version: 2.0.0" \
  "https://api.webflow.com/v2/sites/$WEBFLOW_SITE_ID/publish"
```

If the POST returns anything other than 403, **stop** and re-mint the
token with read-only scopes (`cms:read / assets:read / forms:read /
pages:read / sites:read`).

---

## 1 · Migration pipeline (~25 min)

Source env once per shell:

```bash
set -a && source apps/cms/.env && source .env.migration && set +a
```

### 1.1 H1 — Export from Webflow (~30 s)

```bash
pnpm tsx migrations/webflow-import/export.ts
wc -l migrations/webflow-export/raw/*.jsonl
```

Expect 12 files, **282 rows total**:
`blogs=50 news=33 guides=52 jobs=60 events=18 webinars=4 authors=6 categories=5 newsCategories=1 jobLocations=6 resources=27 aboutGalleries=20`.

### 1.2 H2 — Schema parity audit (~5 s)

```bash
pnpm tsx migrations/webflow-import/schema-parity-audit.ts
head -40 migrations/SCHEMA-PARITY-AUDIT.md
```

No action needed unless a new unmapped Webflow field appears.

### 1.3 H3 — Transform (~30 s)

```bash
pnpm tsx migrations/webflow-import/transform/index.ts
```

### 1.4 H4.5 — Build asset-context map (~5 s)

```bash
pnpm tsx migrations/webflow-import/build-asset-context-map.ts
```

### 1.5 H5 — Upload assets to R2 (~10 min)

```bash
pnpm tsx migrations/webflow-import/upload-assets.ts
```

Expect ~196 records in `.asset-progress.json`, distributed across
`{R2_UPLOAD_PREFIX}/blog`, `/news`, `/resource`, `/event`, `/about`, etc.

### 1.6 H4 — Rewrite body URLs (~10 s)

```bash
pnpm tsx migrations/webflow-import/rewrite-body-urls.ts
```

Expect ~219 in-place substitutions.

### 1.7 H6a — Register Media docs in Payload (~10 min)

```bash
pnpm --filter @cleanstart/cms exec \
  node --import tsx/esm scripts/register-webflow-media.ts
```

Expect ~195/196 mapped. (1 PDF — `Architectural Insight; CIS Hardening…` —
fails Payload's `validatePDF` quirk; editor uploads manually after cutover.)

### 1.8 H6b — Import content into Payload (~2 min)

```bash
pnpm --filter @cleanstart/cms exec \
  node --import tsx/esm scripts/run-webflow-import.ts
```

---

## 2 · End-to-end verification (~5 min)

### 2.1 Row counts + media ref coverage

```bash
psql -h localhost -U postgres -d cleanstart -A -F'|' -c "
SELECT 'blogs', _status::text, count(*), count(hero_image_id) FROM blogs GROUP BY _status
UNION ALL SELECT 'news', _status::text, count(*), count(hero_image_id) FROM news GROUP BY _status
UNION ALL SELECT 'guides', _status::text, count(*), count(hero_image_id) FROM guides GROUP BY _status
UNION ALL SELECT 'events', _status::text, count(*), count(hero_image_id) FROM events GROUP BY _status
UNION ALL SELECT 'webinars', _status::text, count(*), count(hero_image_id) FROM webinars GROUP BY _status
UNION ALL SELECT 'jobs', _status::text, count(*), 0 FROM jobs GROUP BY _status
UNION ALL SELECT 'resources', _status::text, count(*), count(asset_id) FROM resources GROUP BY _status
UNION ALL SELECT 'authors', '-', count(*), count(photo_id) FROM authors
UNION ALL SELECT 'categories', '-', count(*), count(icon_id) FROM categories
UNION ALL SELECT 'about_galleries', _status::text, count(*), count(image_id) FROM about_galleries GROUP BY _status
ORDER BY 1, 2;"
```

**Expected:**

| Collection      | Rows | Hero / Asset / Image |
| --------------- | ---: | -------------------- |
| blogs           | 50   | 50/50                |
| news            | 33   | 33/33                |
| guides          | 52   | 1/1                  |
| events          | 18   | 18/18                |
| webinars        | 4    | 4/4                  |
| jobs            | 60   | n/a                  |
| resources       | 27   | 26/27                |
| authors         | 6    | 2/2                  |
| categories      | 5    | 5/5                  |
| about_galleries | 19   | 19/19                |

### 2.2 Filename canonicality

```bash
psql -h localhost -U postgres -d cleanstart -A -F'|' -c "
SELECT folder, count(*),
       count(*) FILTER (WHERE filename ~ '^[a-z][a-z0-9-]+-[0-9a-f]{8}\.(webp|svg|pdf)\$') AS canonical
FROM media GROUP BY folder ORDER BY 1;"
```

`canonical` should equal `count` for every Webflow-folder row.

### 2.3 Date parity (createdAt / updatedAt)

```bash
python3 <<'EOF'
import json, subprocess, os, re
from datetime import datetime, timezone
def pg(q):
    return subprocess.run(['psql','-h','localhost','-U','postgres','-d','cleanstart',
                           '-t','-A','-F','|','-c',q], capture_output=True, text=True).stdout.strip()
def parse_ts(s):
    if not s: return None
    s = s.strip().replace(' ','T')
    m = re.match(r'^(.*?\.)(\d{1,6})(.*)$', s)
    if m: s = m.group(1) + m.group(2).ljust(6,'0')[:6] + m.group(3)
    s = s.replace('Z', '+00:00')
    try: return datetime.fromisoformat(s).astimezone(timezone.utc)
    except: return None
def clamp(slug):
    s = re.sub(r'-+','-', slug).strip('-')
    return s[:120] if len(s) > 120 else s

TABLES = {'blogs':'blogs','news':'news','guides':'guides','events':'events','webinars':'webinars',
          'jobs':'jobs','resources':'resources','authors':'authors','categories':'categories',
          'newsCategories':'news_categories','jobLocations':'job_locations'}
tc = tu = tr = 0
for src,tbl in TABLES.items():
    path=f'migrations/webflow-export/raw/{src}.jsonl'
    if not os.path.exists(path): continue
    exp={}
    for line in open(path):
        r=json.loads(line); m=r.get('_meta') or {}
        if r.get('slug') and m.get('createdOn'):
            exp[r['slug']]=(m['createdOn'], m.get('lastUpdated',''))
    if not exp: continue
    rows=pg(f"SELECT slug, created_at, updated_at FROM {tbl};").split('\n')
    db={p[0]:(p[1],p[2]) for p in (r.split('|') for r in rows) if len(p)==3}
    okc=oku=0
    for slug,(wc,wu) in exp.items():
        rec = db.get(slug) or db.get(clamp(slug))
        if not rec: continue
        dc, du = rec
        if (t:=parse_ts(wc)) and (d:=parse_ts(dc)) and abs((t-d).total_seconds())<2: okc+=1
        if wu and (t:=parse_ts(wu)) and (d:=parse_ts(du)) and abs((t-d).total_seconds())<2: oku+=1
    print(f'{src:<16} {len(exp):3}  created {okc}/{len(exp)}  updated {oku}/{len(exp)}')
    tc+=okc; tu+=oku; tr+=len(exp)
print(f'{"TOTAL":<16} {tr:3}  created {tc}/{tr}  updated {tu}/{tr}')
EOF
```

Expect **262/262** for both. Anything less means a row drifted —
investigate per slug.

### 2.4 R2 inventory

```bash
pnpm --filter @cleanstart/cms exec node --import tsx/esm scripts/r2-list.ts
```

Expect ~950 R2 objects (~230 MB) — ~5 responsive variants × 194 source
assets, plus the canonical main file per asset.

### 2.5 Spot-check the admin UI

Open `https://admin.cleanstart.com/admin` and check one row per
collection:

- Body has rich-text content (paragraphs, lists, headings)
- Hero image renders
- Authors / categories / FAQ rows / keywords populated
- `publishedAt` matches Webflow's `lastPublished`

### 2.6 URL parity vs the Webflow sitemap

```bash
pnpm tsx migrations/webflow-import/url-parity.ts
head -60 migrations/URL-PARITY-REPORT.md
```

The "Webflow-only" list becomes the redirect inventory for Phase 4 cutover.

### 2.7 Acceptance check

```bash
pnpm tsx migrations/webflow-import/acceptance-check.ts
```

Exit 0 = all 9 assertions pass.

---

## 3 · Rollback (~5 min RTO)

```bash
docker compose -f /opt/cleanstart/docker-compose.yml down cms

TS=<from step 0.2>
psql -h localhost -U postgres -c "DROP DATABASE cleanstart;"
psql -h localhost -U postgres -c "CREATE DATABASE cleanstart OWNER postgres;"
psql -h localhost -U postgres -d cleanstart < /var/backups/cleanstart-pre-migration-$TS.sql

# Optional: wipe migration R2 objects so re-runs start clean
pnpm --filter @cleanstart/cms exec \
  node --import tsx/esm scripts/wipe-webflow-media.ts

docker compose -f /opt/cleanstart/docker-compose.yml up -d cms
```

Full DNS-flip rollback (after cutover):
[`docs/migration/rollback-runbook.md`](rollback-runbook.md).

---

## 4 · Cutover (separate from this runbook)

Per arch doc §6.3:

1. **T+0** — flip DNS from `proxy-ssl.webflow.com` to the droplet (Cloudflare)
2. **T+1h** — canary check (screenshot diff vs Webflow baseline, error rate, 404 rate on the trafficked URL list)
3. **T+24h** — post-launch validation, then publish redirects from the URL-parity report

---

## One-page command reference

```bash
# Prep
tmux new -s migration
pg_dump cleanstart > /var/backups/cleanstart-pre-migration-$(date +%Y%m%d-%H%M%S).sql
set -a && source apps/cms/.env && source .env.migration && set +a

# Pipeline
pnpm tsx migrations/webflow-import/export.ts
pnpm tsx migrations/webflow-import/schema-parity-audit.ts
pnpm tsx migrations/webflow-import/transform/index.ts
pnpm tsx migrations/webflow-import/build-asset-context-map.ts
pnpm tsx migrations/webflow-import/upload-assets.ts
pnpm tsx migrations/webflow-import/rewrite-body-urls.ts
pnpm --filter @cleanstart/cms exec node --import tsx/esm scripts/register-webflow-media.ts
pnpm --filter @cleanstart/cms exec node --import tsx/esm scripts/run-webflow-import.ts

# Verify
pnpm tsx migrations/webflow-import/url-parity.ts
pnpm tsx migrations/webflow-import/acceptance-check.ts
```
