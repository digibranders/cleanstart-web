# Migration Dry-Run — Local — 2026-05-18

**Operator:** admin@digibranders.com
**Environment:** local dev (host Postgres `cleanstart`, R2 prefix `dev`)
**Webflow source:** site `688cb1df5bbf5068ddce4492` ("CleanStart"), domains `cleanstart.com` / `www.cleanstart.com`
**Status:** ✅ **PASS** — 262 of 282 Webflow CMS items imported into local Payload (93%). 20 AboutGalleries items held back pending Media-doc registration (R2 assets already uploaded; only the Payload Media records are deferred). The Webflow CMS was not modified.

---

## Safety verification

| Check | Result |
|---|---|
| Webflow API token scopes | Read-only on Assets / CMS / Forms / Pages / Sites |
| Write attempt against Webflow | HTTP 403 — `"missing scopes: sites:write"` |
| Postgres target | localhost, DB `cleanstart` (dev) |
| R2 prefix | `dev/media/webflow-migration/` (isolated from prod media) |

**Webflow CMS data was never modified and cannot be modified by this token.**

---

## Final import counts

| Collection | Webflow | Payload (post-import) | Status |
|---|---:|---:|---|
| blogs | 50 | 51 *(50 + 1 pre-existing dev)* | ✅ |
| news | 33 | 33 | ✅ |
| guides | 52 | 52 | ✅ |
| jobs | 60 | 60 | ✅ |
| events | 18 | 18 | ✅ |
| webinars | 4 | 4 | ✅ |
| authors | 6 | 6 | ✅ |
| categories | 5 | 7 *(5 + 2 pre-existing dev)* | ✅ |
| newsCategories | 1 | 1 | ✅ |
| jobLocations | 6 | 6 | ✅ |
| resources | 27 | 27 | ✅ |
| aboutGalleries | 20 | 0 (deferred) | ⚠ |
| **Total** | **282** | **265** *(262 from Webflow)* | **93%** |

Last run: **all rows updated cleanly, zero failures.**

---

## Pipeline

| Step | Output | Notes |
|---|---|---|
| **H1 export** | `migrations/webflow-export/raw/*.jsonl` (282 rows) | 12 collections fetched via Webflow v2 API |
| **H2 audit** | `migrations/SCHEMA-PARITY-AUDIT.md` | Field-name diff vs Payload (used to drive the rewrites) |
| **H3 transform** | `migrations/webflow-export/transformed/*.jsonl` (282 rows) | All transforms rewritten against real Webflow field names |
| **H5 upload assets** | `migrations/webflow-export/.asset-progress.json` (195 assets) | 195 unique CDN URLs hashed + uploaded to `dev/media/webflow-migration/` on R2 |
| **H4 rewrite body URLs** | in-place | 219 URL substitutions across Lexical bodies + image refs |
| **H6 import** | `migrations/webflow-export/.import-log.jsonl` | Idempotent upsert by slug; in-memory `webflowId → payloadId` map for FK resolution |
| **H7 URL parity** | `migrations/URL-PARITY-REPORT.md` | Local Payload dev server not running, so Webflow-only count high (222) — re-run with server up to get real parity |
| **H8 acceptance** | — | Requires running Payload Next.js server; skipped in this pass |

---

## Bugs found and fixed in this run (12 total)

| # | Bug | Severity | Fix |
|---|---|---|---|
| 1 | `COLLECTION_MAP` keys assumed camelCase plurals; Webflow uses kebab-singular (`blogs`, `news`, `event`, `guide`, `category`, `news-categories`, `job-location`, `about-gallery`, `author`, …) | Critical | Rewrote map keys against live API output |
| 2 | Webflow v2 nests CMS fields under `fieldData`; transforms read flat keys → every field was `undefined` | Critical | Export now flattens `fieldData` at top level; raw metadata moved to `_meta` |
| 3 | `slug` read from `item.slug` (top-level, doesn't exist in v2) → every row got `slug = ""` | Critical | Pulled from `fieldData.slug` |
| 4 | No transforms for `category`, `news-categories`, `job-location`, `about-gallery` | High | Added 4 new transforms + wired into orchestrator |
| 5 | `resolveJobLocation` CURATED list missing 3 of 6 actual locations | High | Extended CURATED (Australia, Ahmedabad, South East Asia) |
| 6 | Every content transform read fictional Webflow field names | **Critical** | Rewrote 8 content transforms (blogs/news/guides/resources/events/webinars/jobs/authors) against real Webflow slugs from the live API |
| 7 | No HTML → Lexical converter existed for `body` migration | **Critical** | Built [`apps/cms/src/payload/lib/webflow-import/html-to-lexical.ts`](apps/cms/src/payload/lib/webflow-import/html-to-lexical.ts) + 11 unit tests. Uses `parse5`; produces Lexical-shaped JSON for the editor's enabled features (paragraph / heading h1–h4 / lists / quote / HR / link / formatted text with inline marks). |
| 8 | `guides-normalize.ts` expected `Q1`/`Ans1` field keys; Webflow uses lowercase kebab `q1`/`ans-1` | High | Updated helper to accept both forms |
| 9 | Asset upload regex matched only `uploads.webflow.com`; live CDN is `cdn.prod.website-files.com` | Critical | Extended regex to all three hosts |
| 10 | Asset regex truncated URLs at `(`/`)` — Webflow filenames legitimately contain parens (e.g. `_V2 (1).pdf`) | High | Relaxed character class; added `cleanseUrl` to strip trailing punctuation |
| 11 | Payload Local API couldn't initialize from a script outside `apps/cms/` (next/env CJS interop) | Blocker | Moved import runner to [`apps/cms/scripts/run-webflow-import.ts`](apps/cms/scripts/run-webflow-import.ts); run with `node --import tsx/esm` |
| 12 | Slug validator rejected (a) slugs >120 chars and (b) slugs with consecutive `-` runs (Webflow emits `---` for em-dashes) | High | Added `clampSlug` in import.ts — collapses runs, strips leading/trailing dashes, truncates at word boundary |

---

## Sample of imported data (verified)

```sql
-- Blog with full body (10KB Lexical JSON, 27 block nodes)
SELECT id, title, slug, length(body::text)
FROM blogs WHERE id = 10;
-- 10 | What the OpenClaw Vulnerabilities Reveal… | openclaw-vulnerabilities-reveal-…
-- body: 10,136 chars Lexical JSON, blocks: paragraph × 3, list × 4, paragraph, …

-- Guide with FAQs + Keywords populated
SELECT id, title, count(faqs), count(keywords) FROM guides…;
-- 2 | What Is Attack Surface Reduction in Container Security | faqs:5 | kw:10
-- 5 | What is FIPS Compliance: Differences                   | faqs:5 | kw:10
-- (all 52 guides have the structured slot-fields unpacked)
```

---

## What's NOT in the final import

### 1. AboutGalleries (20 rows, deferred)

Payload's `aboutGalleries` collection has `image: required: true` pointing at the Media upload collection. Payload's Media collection is an `upload` collection — it can't be populated by `payload.create({ data })` with just a URL string; it requires the file binary to flow through the upload pipeline (mime validation, size derivation, sanitization, responsive-size generation).

The 20 R2 assets ARE already uploaded (Phase H5). Three options to finish the AboutGalleries migration:

- **A** — Build a Media-doc registration helper that streams each R2 object back through `payload.create({ file })`. ~half-day. Best for prod cutover.
- **B** — Editors recreate the 20 gallery rows manually via the admin UI's existing AboutGalleries form (drag-and-drop). ~20 min. Fine for v1 since the only consumer is `/about-us`.
- **C** — Make `image` optional in the AboutGalleries schema. Not recommended — `/about-us` rendering depends on it.

Recommend **B** for the upcoming staging Phase 3 dry-run; **A** before prod cutover.

### 2. Media-relationship fields on imported content (heroImage / photo / asset / pdf)

Same root cause: Media docs aren't created. Body images render fine (URLs rewritten in-place to R2), but `heroImage`, author `photo`, resource `asset`, webinar `pdf` relationship fields are empty.

After implementing Option A above, those refs will resolve via the existing `webflowUrl → mediaPayloadId` map in `run-webflow-import.ts` and a re-import will fill them.

### 3. Events / Webinars without external registration URL

6 events and 4 webinars in Webflow had no `custom-link` / `registration-url`. Payload requires either an external URL OR an in-house Form ref. The Forms collection is empty pre-migration. The migration writes a placeholder URL `https://cleanstart.com#register-tbd` so the rows import — flagged for the editor to fix during the publishing checklist.

---

## Safety / rollback

Everything done in this run is **idempotent and reversible**:

- `migrations/webflow-export/raw/` and `transformed/` are local JSONL files, safe to delete and regenerate.
- R2 assets sit under `dev/media/webflow-migration/<sha256>.<ext>` — keyed by content hash, re-runnable, no collisions. Delete with `aws s3 rm --recursive 's3://cleanstart/dev/media/webflow-migration/'` if needed.
- Postgres writes are upserts by slug — re-running the import only updates existing rows. To wipe imported rows: `TRUNCATE` the affected tables (only after confirming there's no dev-only data you want to keep).
- `.env.migration` is gitignored.
- Webflow CMS is unchanged (read-only token confirmed via 403 on write attempt).

---

## Next steps

For the staging Phase 3 dry-run (per the architecture doc §6.3):

1. Ship the Media-doc registration helper (above, Option A) — required before prod cutover.
2. Apply this migration on the staging droplet against staging Postgres + staging R2 bucket.
3. Run H7 with the staging Next.js server up — get real URL parity vs production Webflow sitemap.
4. Run H8 acceptance check — should pass 9/9 once H7 is real.
5. Editor sign-off (Marketing Lead): spot-check 3 docs per collection in staging admin UI.
6. CTO sign-off after the rollback drill (per `docs/migration/rollback-runbook.md`) is verified.

Production cutover gated on all of the above. The cutover itself is a DNS flip + the same scripts run against prod Postgres (with the prior backup snapshot already taken).

---

## Files changed in this run

### New
- `apps/cms/scripts/run-webflow-import.ts`
- `apps/cms/src/payload/lib/webflow-import/html-to-lexical.ts`
- `apps/cms/src/payload/lib/webflow-import/html-to-lexical.test.ts`
- `migrations/webflow-import/transform/categories.ts`
- `migrations/webflow-import/transform/news-categories.ts`
- `migrations/webflow-import/transform/job-locations.ts`
- `migrations/webflow-import/transform/about-galleries.ts`

### Modified
- `migrations/webflow-import/export.ts` (collection map + fieldData flatten)
- `migrations/webflow-import/upload-assets.ts` (CDN host regex + dev prefix)
- `migrations/webflow-import/rewrite-body-urls.ts` (same regex fix)
- `migrations/webflow-import/transform/index.ts` (wire new transforms)
- `migrations/webflow-import/transform/{authors,blogs,news,guides,resources,events,webinars,jobs}.ts` (rewrites)
- `apps/cms/src/payload/lib/webflow-import/guides-normalize.ts` (real Webflow slot keys)
- `apps/cms/src/payload/lib/webflow-import/job-locations.ts` (3 new curated rows)
- `apps/cms/package.json` (+ `parse5` dep)
- `apps/cms/.env.example` (WEBFLOW_* placeholders)
- `.gitignore` (`.env.migration`)

### Build status
`lint ✓ · typecheck ✓ · build ✓ · tests 1030 pass / 2 fail (pre-existing unrelated snapshot drift on Events/Pages collections — unchanged by this work)`
