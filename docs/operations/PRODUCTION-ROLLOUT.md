# Production Rollout Checklist

> One-shot operations that run against prod Postgres on the droplet before/after first production deploy. Not part of normal CI. Check off each item in the deploy PR description.

**Bulk-run cost note:** re-saving many published docs fires `revalidateWeb` per doc (billed Vercel ISR write). Export `WEB_REVALIDATE_SUPPRESS=true` for bulk runs; the 1h ISR fallback catches up. First-publish hooks (IndexNow/Teams/search) are unaffected.

**Run mechanism:** prod CMS image lacks `scripts/`; `docker cp` the script into `cleanstart-cms-1` and run via `pnpm exec tsx` (no `--env-file` — env is via container vars). See memory note `prod-backfill-script-run-mechanism`.

**Deploy-order hazard:** `apps/cms` and `apps/web` both deploy from `main`, so one
merge fires the Docker build and the Vercel build together, and Vercel normally
wins by several minutes. Any change where the web app stops sending a field that
the CMS `forms` row still marks required will 400 every submission for the length
of that gap. There is no way to sequence the two from a single merge, so relax the
constraint in prod *before* merging: make the field optional, deploy, then run the
script that finishes the job. Field defs are additive-safe in the other direction,
because `validateFields` iterates the form definition and ignores submitted fields
it does not list.

### /industries path rename follow-up (2026-09-08)

Script: `scripts/repoint-industry-paths.ts` — repoints the CMS rows that key on
the two renamed `/industries` paths. Guarded on each row's expected current
value, idempotent, supports `--dry-run`. Two stages, because the new URLs do not
exist in production until the route move deploys:

- `--stage=safe` — **DONE 2026-09-08.** `pageRegistry` id=43, which still held
  `/industries/saas-container-security`, an intermediate slug the SaaS page left
  on 2026-09-02. The live page has had no WebPage node in its JSON-LD graph
  since. Neutral before the deploy, correct after it.
- `--stage=deploy` — **PENDING, run immediately after the deploy lands.**
  `pageRegistry` id=42 and `redirects` id=41. Both are correct against the URLs
  production serves today; moving them early drops the finance page's WebPage
  node and points the live `/financial-services` 301 at a 404.

```bash
ssh cleanstart-cms
docker cp repoint-industry-paths.ts cleanstart-cms-1:/app/apps/cms/scripts/
docker exec -w /app/apps/cms cleanstart-cms-1 pnpm exec tsx \
  scripts/repoint-industry-paths.ts --stage=deploy --dry-run
```

---

## Completed tasks

| # | Task | Status | Date |
|---|------|--------|------|
| 11 | Webflow media filename cleanup | DONE | 2026-06-09 |
| 14 | Legacy Webflow 301 redirects seed | DONE | 2026-06-11 |
| 15 | SEO keywords backfill (guides) | DONE | 2026-06-29 |
| 17 | Forms overhaul field changes (`apply-form-field-changes.ts`) | DONE | 2026-09-09 |
| 18 | Noindex the two duplicate news docs (`noindex-duplicate-news.ts`) | DONE | 2026-09-09 |

---

## Pending tasks

### 1. Lexical list-normalisation backfill

Script: `scripts/normalize-lexical-lists.ts`

**Always run with `--bypass-hooks`** to avoid Teams/IndexNow/Meilisearch/updatedAt side effects.

```bash
# Dry-run:
node --env-file=.env --no-warnings --experimental-strip-types scripts/normalize-lexical-lists.ts --dry-run
# Real run:
node --env-file=.env --no-warnings --experimental-strip-types scripts/normalize-lexical-lists.ts --bypass-hooks
```

Re-runnable. Verify: bullet lists render as single `<ul>`.

### 2. Job `experienceRange` backfill

Script: `scripts/backfill-job-experience-range.ts` — restores from `migrations/webflow-export/raw/jobs.jsonl`. Idempotent. Run in quiet window (afterChange hooks fire).

### 3. Job `department` backfill

Script: `scripts/backfill-job-department.ts` — maps Webflow `job-summary` → enum. Idempotent. Watch for "unmapped" warnings.

### 4. Job `hiringStatus` backfill

Script: `scripts/backfill-job-hiring-status.ts` — restores open/closed from Webflow export. Keeps all jobs published. Idempotent.

### 5. Guide inline-FAQ strip

Script: `scripts/strip-guide-inline-faqs.ts` — removes duplicate FAQ from body (structured `faqs` field stays). Recomputes TOC/wordCount. Supports `--dry-run`. Idempotent. Logic: `lib/webflow-import/strip-faqs.ts`.

### 6. Legal documents seed

Script: `scripts/seed-legal.ts` — seeds 8 legal docs from `scripts/data/legal-seed.ts`. Requires migration `20260605_094837_add_legal_documents` first. Skip-safe (existing slugs skipped). `--force` to overwrite, `--dry-run` to preview.

### 7. Guide inline-CTA card backfill

Script: `scripts/migrate-guide-cta-cards.ts` — converts flattened CTA headings to `inlineCta` Lexical blocks. Default: clean CTAs only; `--include-mid-sentence` for others. Idempotent. Logic: `lib/webflow-import/cta-cards.ts`.

### 8. Event `country` backfill

Script: `scripts/backfill-event-country.ts` — maps `venue` → country enum. Requires migration `20260608_121245_add_event_country` first. Idempotent.

### 9. News `region` placeholder backfill

Script: `scripts/backfill-news-region.ts` — assigns PLACEHOLDER regions round-robin. ⚠ Not accurate — replace in admin. Requires migration `20260608_140513_add_news_region`. Idempotent.

### 10. Knowledge Hub seed (Academy import)

Script: `scripts/seed-knowledge-base.ts` — seeds 50 categories + 253 articles from `scripts/data/academy-kb.json`. Requires migration `20260608_144837_add_kb_category_display_order`. Skip-safe. First-publish hooks DO fire (253 Teams notifications — consider unsetting `WEBHOOK_TEAMS_URL`).

**Lesson videos:** after seed + migration `20260608_153417_add_kb_video_url`, run `scripts/backfill-knowledge-video.ts` for 24 articles with lesson MP4s.

### 12. Meilisearch index backfill

Script: `scripts/reindex-search.ts` — forces full reindex (bypasses daily job's count-drift gate). Run after the doc-id separator fix (`buildSearchDocumentId` colon→underscore) deploys. Verify: `/indexes/content/stats` shows ~508 docs.

### 13. Draft-content lockdown — provision `preview-bot`

Manual: create `preview-bot@cleanstart.com` user in admin (no roles, API key enabled). Set `CMS_API_KEY=<key>` in web env. Requires migration `20260610_085422_add_users_api_key`.

### 15b. SEO keywords reindex

Push `keywords` as searchable + filterable attribute to Meilisearch. Use `scripts/reindex-search.ts`. The backfill (15a) is done.

### 16. Leaked `<style>` CSS strip

Script: `scripts/strip-leaked-style-css.ts` — strips 1 blog (`what-if-mythos-claims-to-be-true`). Idempotent. Logic: `lib/webflow-import/strip-style-css.ts`.

### 17. Inline body-image backfill (17 blogs / 38 images)

Script: `scripts/backfill-blog-body-images.ts` — uploads images from Webflow CDN + regenerates bodies. **Run before Webflow DNS cutover** (needs `cdn.prod.website-files.com`). Idempotent. Data: `scripts/data/blog-body-images.json`.

### 18. Publish mis-imported Webflow drafts

Script: `scripts/publish-misimported-webflow-drafts.ts` — publishes 4 stuck pages (2 blogs + 2 guides). First-publish hooks fire. Idempotent.

### 19. Filter→taxonomy promotion (6 taxonomies)

Seed + backfill scripts for: industries, resourceTypes, departments, regions, pressTypes, webinarTypes. Full spec: `docs/superpowers/specs/2026-06-23-promote-filters-to-taxonomies-design.md`. Requires interactive `migrate:create` first. Legacy enum columns stay until web is switched.

### 20. Deal-registration → HubSpot Deals provisioning

Operator must: (a) run `scripts/setup-hubspot-deal-properties.ts`, (b) set `HUBSPOT_DEAL_PIPELINE`/`HUBSPOT_DEAL_STAGE`, (c) create `integrations` row `kind: 'hubspotCrm'`. Until provisioned, submissions captured with `hubspotSync.status = skipped`; `retryDealSync` cron back-fills.

### 21. Newsletter subscription opt-in

Operator must: (a) create "Newsletter" subscription type in HubSpot, (b) set `HUBSPOT_NEWSLETTER_SUBSCRIPTION_TYPE_ID`, (c) build HubSpot welcome-email workflow. Requires migration `20260623_140000_add_forms_hubspot_subscription_type_id`.

### 22. Advisories collection + first advisory (PHP2Shell)

Requires migration `20261023_120000_add_advisories` (runs on CMS deploy). Then, in the cms container:
(a) `/app/node_modules/.bin/tsx scripts/seed-page-registry.ts` adds the `/advisories` and `/advisories/[slug]` rows;
(b) Done on 2026-10-23 and later reverted: PHP2Shell went back to the blog and its advisory is a draft (the copy script was removed with the 2026-10-27 model change).

### 23. Structured advisories (client brief, 2026-10-27)

Requires migration `20261027_120000_advisories_structured_fields` (additive: CVE IDs, technology, CVSS score, fix status, impact, resolution). The hidden blog-era columns stay until a separately approved migration drops them. To load the first advisory, in the cms container: `/app/node_modules/.bin/tsx scripts/seed-node-brotli-advisory.ts` creates CVE-2026-111497 as a draft; add `--publish` to publish it and purge `/advisories`. Idempotent: skips if the slug exists. Deploy `apps/web` before publishing.

### 24. Single advisory content box (2026-10-28)

No migration. The advisory body is now one rich-text box (`body`, "Advisory content"); `impact` and `resolution` are hidden and their columns stay. Deploy `apps/web` and `apps/cms` first. Then merge the existing advisories in the cms container: `/app/node_modules/.bin/tsx scripts/merge-advisory-sections.ts` is a dry run, add `--apply` to write. It folds Impacted packages and Resolution into `body` under Heading 2s, clears the two old boxes and purges `/advisories`. Idempotent. Until it runs, the page still renders the old three sections for advisories that have them.

### 25. Dropped two Knowledge Hub pages (2026-10-28)

Done on prod already; nothing to run. `knowledge-hub/no-shell-read-only` (a stub pointing at two other guides) and `knowledge-hub/rekor-publishing` were deleted with `scripts/drop-knowledge-hub-pages.ts`, which first wrote a 301 for each: to `/knowledge-hub/combined-security-model` and `/knowledge-hub/image-signing-sigstore`. The script purges the web cache, but a script that ends with `process.exit` kills the deferred search-index delete, so the two Meilisearch documents (`knowledgeBase_3`, `knowledgeBase_84`) had to be removed by hand. After any scripted delete, check the index. The sitemap needed its `sitemap:knowledgeBase` tag purged as well.

### 26. Videos CMS cutover

Until this runs, `/videos` reads `apps/web/src/lib/videos-catalog.ts` plus the YouTube RSS feed. The `videos` and `videoTopics` collections, the hourly `syncYoutubeVideos` task and the web CMS reader are already in the code; `VIDEOS_SOURCE` decides which one the site uses.

0. **Create the YouTube API key** (the length of each video is read from YouTube with it, and videos that go private or are removed are hidden from the page). In Google Cloud: create or pick a project, enable "YouTube Data API v3", create an API key under Credentials and restrict it to that API. Add it as the GitHub Actions secret `YOUTUBE_API_KEY`. The key is free for this volume (one small request per hour).
1. **Deploy the CMS** (migration `20261031_100000_add_videos` runs on boot). Check `/api/health`, then that the `videos` collection opens in the admin.
2. **Backfill.** The production image does not ship `scripts/`, so copy the script and its data file into the container first (both ASCII-only; the data file is re-encoded with `\u` escapes so nothing depends on the SSH pipe), check the checksums, then run it. From a checkout at `origin/main`:
   ```bash
   git show origin/main:apps/cms/scripts/seed-videos-from-catalog.ts > /tmp/seed-videos-from-catalog.ts
   git show origin/main:apps/cms/scripts/data/videos-catalog.json \
     | python3 -c 'import json,sys; sys.stdout.write(json.dumps(json.load(sys.stdin), indent=2, ensure_ascii=True)+"\n")' > /tmp/videos-catalog.json
   cat /tmp/seed-videos-from-catalog.ts | ssh cleanstart-cms 'docker exec -i cleanstart-cms-1 sh -c "cat > /app/apps/cms/scripts/seed-videos-from-catalog.ts"'
   cat /tmp/videos-catalog.json | ssh cleanstart-cms 'docker exec -i cleanstart-cms-1 sh -c "mkdir -p /app/apps/cms/scripts/data && cat > /app/apps/cms/scripts/data/videos-catalog.json"'
   ssh cleanstart-cms 'docker exec cleanstart-cms-1 sha256sum /app/apps/cms/scripts/seed-videos-from-catalog.ts /app/apps/cms/scripts/data/videos-catalog.json'
   shasum -a 256 /tmp/seed-videos-from-catalog.ts /tmp/videos-catalog.json   # must match the two lines above
   ```
   Dry run (writes nothing; `PAYLOAD_AUTO_RUN=false` stops this one-off process from starting the cron jobs):
   ```bash
   ssh cleanstart-cms 'docker exec -w /app/apps/cms -e PAYLOAD_AUTO_RUN=false cleanstart-cms-1 /app/node_modules/.bin/tsx scripts/seed-videos-from-catalog.ts'
   ```
   Read the plan it prints: `conflicts` must be empty. Videos the hourly sync already imported as needs-review drafts show up under `videosUpdate` (they are adopted, keeping the catalog slug). Then add `--apply` to the same command to write. It creates 11 topics and publishes the 14 explainers and product demos with the slugs from the code catalog. A slug conflict stops the run before any write. Re-running plans nothing. Publish webhooks are skipped and web revalidation is sent once at the end. The copied files vanish on the next deploy.
3. **Compare.** Open `/videos` with `VIDEOS_SOURCE=cms` on a preview deploy and check it matches production. There are no per-video pages: videos play inline.
4. **Flip.** Set `VIDEOS_SOURCE=cms` in Vercel production env and redeploy. Rollback is unsetting it and redeploying.
5. **Keep for a week**, then delete `videos-catalog.ts` and the feed merge from `apps/web`.

**Suggested category and the Teams message.** Create two public YouTube playlists on the channel, one for explainers and one for product demos, and set the repository variables `YOUTUBE_EXPLAINER_PLAYLIST_ID` and `YOUTUBE_DEMO_PLAYLIST_ID` (a playlist id or its full `youtube.com/playlist?list=` URL), then redeploy the CMS. Adding a new upload to one of them before the next hourly run pre-fills its Category; a video in both playlists, or in neither, gets no suggestion. The value is written only when the draft is created and is never touched by later syncs. For the "new videos need review" Teams message, add a Teams integration row with the event `video.needs-review` (or leave its events empty for all events); one message goes out per sync run that imports at least one video, with a button to the Needs review list, which is built from `PAYLOAD_PUBLIC_SERVER_URL`.

New uploads land as `needs-review` drafts. An editor chooses the category, at least one topic and a summary, then publishes (the publish gate blocks otherwise). The admin dashboard shows a "Videos to review" card that opens the filtered list. Without `YOUTUBE_API_KEY` the sync falls back to the YouTube RSS feed, which carries no length and cannot tell that a video was removed, so editors would type the length in the "Length" field; YouTube's feed endpoint has also been seen returning 404, which is another reason to set the key.
