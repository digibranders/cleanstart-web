# Videos CMS and YouTube Sync Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Marketing manages videos, formats and topics in the Payload admin, new YouTube uploads arrive on their own as reviewed drafts with duration, description and suggested topics, and `/videos` reads from the CMS with zero URL changes for the 15 videos already live.

**Architecture:** A new routed collection `videos` (drafts, scheduled publish) plus a lean taxonomy `videoTopics`. An hourly Payload task pulls the channel through the YouTube Data API, plans the changes as a pure function, and applies them: new videos become `needs-review` drafts, existing videos only get their sync-owned `source` snapshot refreshed. The web app reads the CMS through `fetchCMS` with cache tags and on-demand revalidation, behind a `VIDEOS_SOURCE` switch so cutover and rollback are one environment variable.

**Tech Stack:** Payload 3.81 (Postgres, hand-written migrations), Next.js 16 ISR with cache tags, Zod 3 at the API boundary, Vitest, YouTube Data API v3 (API key, read only).

**This is Plan 1 of 2.** Plan 2 (Vimeo or other uploaded video, transcripts, chapters, video sitemap) is outlined in section 12 and gets its own document, because it needs decisions and credentials that do not exist yet.

---

## 0. Decisions needed before PR 1 starts

| # | Decision | Recommendation | Why it matters |
|---|---|---|---|
| 1 | New YouTube uploads: auto-publish or land as drafts for review? | Drafts for review, with an env switch (`VIDEOS_AUTO_PUBLISH=true`) if marketing later wants hands-off | Today the failure mode is a video appearing with no category and no topics. A review step costs about 30 seconds per upload and removes that. |
| 2 | Who owns the YouTube API key? | CleanStart's Google Cloud project, key restricted to "YouTube Data API v3" | Someone with access to the CleanStart Google account must create it. Claude cannot and should not hold it. |
| 3 | Which host for non-YouTube uploads (Plan 2)? | Vimeo if the client already pays for it, otherwise Cloudflare Stream (CleanStart already runs on Cloudflare) | Not needed for Plan 1, but the `provider` field is designed now so Plan 2 is additive. |
| 4 | One channel or several? | One channel (`UC13c-XRmRlkWpp6WMG9SDjw`) | Multiple channels are a one-line change later, not a design change. |
| 5 | Keep the "Videos" link in the Resources menu? | Yes, but only merge it after the CMS cutover | It is its own commit on `feat/videos-page`, so it can ship or wait independently. |

Nothing below needs answers to 3 to 5 to start. Decisions 1 and 2 gate PR 2.

---

## 1. Where we are and why this changes

`/videos` today is `apps/web/src/lib/videos-catalog.ts` (15 hand-written entries: slug, title, format, topics, duration, summary) merged with the YouTube RSS feed (`youtube-feed.ts`).

What that costs:

- Editors cannot change anything. Every category or topic edit is a code change and a deploy.
- The RSS feed returns only the newest 15 uploads and carries no duration, tags or format. A video with no catalog entry disappears once 15 newer ones exist.
- An unfiled upload gets its URL from its title, so renaming it on YouTube changes the URL.
- Vimeo or any other host has no home.

What stays good and must survive: the page design, URL-state filters, the watch page, the pure helpers in `videos-utils.ts` (tested), and all 15 existing URLs.

---

## 2. Target architecture

```
                  hourly (PAYLOAD_AUTO_RUN=true)
YouTube Data API ------------------------------> syncYoutubeVideos task
  channels.list        (1 unit, once)              |
  playlistItems.list   (1 unit per 50)             |  planSync()  pure, unit tested
  videos.list          (1 unit per 50)             |  applyPlan() per-item try/catch
                                                   v
                                    Payload `videos` (draft, needs-review)
                                    Payload `videoTopics` (editor managed)
                                                   |
                       editor classifies + publishes (publish gate enforces format, topic, summary)
                                                   |
                          afterChange hooks: search sync, IndexNow, revalidateWeb(tag "videos")
                                                   v
apps/web  getVideos() --fetchCMS(tags:["videos"], revalidate 3600 backstop)--> /videos, /videos/[slug], sitemap
```

Principles:

1. **One source of truth per field.** Sync owns the `source` group. Editors own everything else. Neither overwrites the other.
2. **The network is a boundary.** Every YouTube response goes through Zod before it touches a Payload write.
3. **Pure core, thin shell.** Planning the sync is a pure function over plain data, so the risky logic is tested without a database or the network.
4. **Never lose the last good page.** If the CMS is down during an ISR revalidation, the web app throws so Next keeps serving the previous static page. It must not cache an empty listing.
5. **Reversible rollout.** The web app can read the old catalog or the CMS by flipping one env var.

---

## 3. Design decisions (with the alternatives that were rejected)

| # | Decision | Rejected alternative | Reason |
|---|---|---|---|
| D1 | New Payload collection `videos` is the source of truth | Keep the code catalog and add a webhook | Editorial fields (format, topics, slug, featured) do not exist on YouTube, a review workflow needs draft state, and the CMS already carries ten routed collections with the same machinery. |
| D2 | `provider` select with `youtube` and `vimeo` now, `vimeo` rejected by a hook until Plan 2 | Add the field in Plan 2 | Adding an enum value later is a Postgres enum migration. One unused value costs nothing today. |
| D3 | `format` is a fixed `select` (explainer, demo, talk). Topics are a taxonomy collection. | Taxonomy for both | Formats are a page design decision (three tabs), not content. Topics are content and must be editable without a deploy. The repo is still unwinding enum+Ref pairs (see memory `taxonomy-enum-migration-status`), so no new pair is created: `format` has no twin. |
| D4 | YouTube Data API v3 with an API key | RSS only | RSS caps at 15, has no duration, tags or privacy status. The API costs about 3 quota units per run against a 10,000 per day budget. |
| D5 | New uploads become drafts with `syncState = needs-review` | Auto-publish | See decision 1. Also guards against unlisted or private videos going public by accident (only `privacyStatus = public` is ever imported). |
| D6 | `source` group is read-only and sync-owned. `title` is copied from it once, at creation, then belongs to the editor. | Overwrite title on every sync | Editors fix capitalisation and wording. A sync that undoes their edits would be re-introducing the bug the catalog's `title` override solved. |
| D7 | Topics are suggested from YouTube `tags` and description hashtags by exact normalised match against `videoTopics.name` plus `aliases`. Format is never guessed. | Fuzzy or LLM classification | Deterministic and testable. A wrong auto-category is worse than a missing one, and the publish gate forces a human to confirm. |
| D8 | No `schemaAddons` field and no CMS JSON-LD branch | Copy Advisories fully | The CMS "Schema Manager" JSON-LD engine is not what production serves; apps/web composes its own (memory `schema-two-disconnected-systems`). Skipping it removes about 20 `blocks_*` tables from the migration. Verified in Task 2 Step 5. |
| D9 | Sync settings are env vars (`YOUTUBE_API_KEY`, `YOUTUBE_CHANNEL_ID`, `VIDEOS_AUTO_PUBLISH`) | A new Payload global | A global needs its own migration (memory `global-without-migration-crashes-admin`). Add one only if marketing asks to flip auto-publish themselves. |
| D10 | Cutover behind `VIDEOS_SOURCE=catalog|cms` | Big-bang switch | Gives an instant rollback and lets the CMS be populated and checked before any visitor sees it. |
| D11 | Existing slugs are preserved by a backfill, not regenerated | Let the CMS generate slugs | URLs are commitments. A changed slug is a lost ranking. |

---

## 4. Data model

### `videoTopics` (taxonomy, no versions, no SEO fields)

| Field | Type | Notes |
|---|---|---|
| `name` | text, required | "Base images" |
| `slug` | slugField(source: name) | used in `?topic=` URLs, so equal to today's ids (`base-images`, `attack-surface`, ...) |
| `description` | textarea | optional |
| `aliases` | array of `{ value: text }` | matched against YouTube tags and hashtags, normalised |

It has no URL of its own (topics are filters on `/videos`), so it skips `buildTaxonomyFields`' SEO and media fields and drafts. Fewer tables, simpler migration.

### `videos` (routed collection, drafts, schedulePublish, maxPerDoc 25)

| Field | Type | Owner | Notes |
|---|---|---|---|
| `title` | contentTitleField | editor | initialised from `source.title` |
| `slug` | slugField(source: title) | editor | permanent after publish (slug change redirect hook already exists) |
| `provider` | select youtube / vimeo, required, default youtube | system | see D2 |
| `externalId` | text, required, unique, indexed | system | YouTube video id |
| `format` | select explainer / demo / talk | editor | required to publish |
| `topics` | relationship to `videoTopics`, hasMany | editor, seeded by sync | at least one required to publish |
| `summary` | textarea, max 320 | editor | card blurb and meta description, required to publish. Pre-filled from the first paragraph of `source.description`. |
| `featured` | checkbox, sidebar | editor | hero pick, newest when none |
| `transcript` | textarea | editor | stored now, rendered in Plan 2 |
| `source` | group, every field read-only | sync | `title`, `description`, `durationSeconds`, `publishedAt`, `tags[]`, `privacyStatus`, `embeddable`, `hasMaxres`, `thumbnailUrl`, `contentHash`, `fetchedAt` |
| `syncState` | select synced / needs-review / missing / manual | sync | `manual` = created by hand, never touched by sync |
| `publishedAt`, `displayPublishedAt`, `contentUpdatedAt` | shared fields | hooks | `publishedAt` is set from `source.publishedAt` so old videos keep their real date |
| `permalink`, SEO sidebar | shared | editor | `descriptionSource: 'summary'` |

---

## 5. Touchpoint map: how to wire a new routed collection

The Advisories commit `15fbe79f` touched about 45 files to add one collection. That commit is the checklist, and the repo gives you a way to find every spot mechanically:

```bash
cd /Users/a12345/Desktop/AI/cleanstart/cleanstart-website
rg -l "'advisories'|\"advisories\"|advisories:" apps/cms/src apps/web/src
git show --stat 15fbe79f
```

For each hit, add `videos` the same way, with these deliberate exceptions:

| Skip or change | Why |
|---|---|
| `lib/jsonld/dispatch.ts`, `endpoints/jsonld.ts`, `SchemaPreviewField.tsx`, `schemaAddonsField` | D8: production JSON-LD is built in apps/web. |
| `authors`, `reviewedBy`, `AuthorCredibilityField`, `user-offboard.ts` author logic | Videos have no authors. |
| `sitemap/image.ts` | No hero image field. Use the poster only if the sitemap helper accepts a URL field; otherwise skip. |
| `page-registry-seed.ts` | Change the existing `/videos` row from `static` to `cms-listing` (backingCollection `videos`), add `/videos/[slug]` as `cms-template`, and remove `/videos/[slug]` from `INTENTIONALLY_UNREGISTERED` in `page-registry-coverage.ts`. |
| `ROUTE_PREFIX`, `LISTING_PATH_OVERRIDE` in `route-prefixes.ts` | `videos: '/videos'`. `videoTopics` has no prefix, so add `videoTopics: '/videos'` to `LISTING_PATH_OVERRIDE` (same trick `resourceTypes` uses) so a topic edit purges the listing. |
| `detail-route-not-found-guard.ts` (web) | Add `{ prefix: "/videos/", collection: "videos", extraFilter: PUBLISHED_FILTER }`. This gives real 404s for unpublished or unknown slugs. |
| `publish-gate.ts`, `wire-publish-gate.ts` | Add `videos` to `GATED_SLUGS` and the video-specific blockers in Task 9. |
| Tests that count collections | `web-pages.test.ts` (PURGEABLE_COLLECTIONS 14 to 15), `schema-surface.test.ts`, `cache-purge-field.test.ts`, `Pages.snap.json`, new `Videos.snap.json`. |

---

## 6. File map

**Create (CMS)**

- `apps/cms/src/payload/collections/Videos.ts`
- `apps/cms/src/payload/collections/VideoTopics.ts`
- `apps/cms/src/migrations/20261024_100000_add_videos.ts`
- `apps/cms/src/payload/lib/videos/youtube-client.ts` and `.test.ts`
- `apps/cms/src/payload/lib/videos/plan-sync.ts` and `.test.ts`
- `apps/cms/src/payload/lib/videos/apply-sync.ts` and `.test.ts`
- `apps/cms/src/payload/lib/videos/run-sync.ts`
- `apps/cms/src/payload/jobs/sync-youtube-videos.ts`
- `apps/cms/scripts/seed-videos-from-catalog.ts`
- `apps/cms/scripts/data/videos-catalog.json`

**Modify (CMS):** every file the section 5 search finds, plus `payload.config.ts` (collections, task, cron), `lib/integrations/credentials.ts`, `.env.example`, `.github/workflows/deploy-cms.yml`, `payload-types.ts` (generated).

**Create (web)**

- `apps/web/src/lib/videos-cms.ts` and `.test.ts` (CMS read and mapping)

**Modify (web):** `lib/videos.ts` (source switch), `lib/videos-utils.ts` (taxonomy as data), `lib/videos-catalog.ts` (becomes seed-only, deleted in PR 4), `app/sitemap.ts`, `app/preview/[collection]/[slug]/page.tsx`, `components/search/search-ui.tsx`, `lib/detail-route-not-found-guard.ts`, `VideosBrowser.tsx`, `VideoSelect` callers, `app/videos/**`.

**Docs:** `CLAUDE.md` jobs table, `docs/web/WEB-PAGES.md`, `docs/operations/PRODUCTION-ROLLOUT.md`, `docs/operations/CMS-DEPLOYMENT.md`.

---

## 7. Delivery plan

| PR | Content | Visible to visitors? | Estimate |
|---|---|---|---|
| 1 | Collections, migration, all wiring, generated types, schema tests | No | 2.5 days (the migration is the long pole) |
| 2 | YouTube client, planSync, applySync, task, env and deploy plumbing, publish gate, optional Teams event | No (creates drafts only) | 2 days |
| 3 | Backfill script, web CMS reader, source switch, sitemap, guard, preview, search, docs. Merge with `VIDEOS_SOURCE=catalog`. | No until the flip | 2.5 days |
| flip | Run backfill on prod, verify, set `VIDEOS_SOURCE=cms` in Vercel, redeploy | Yes | 0.5 day |
| 4 | Delete the catalog and the switch, remove dual-read code | No | 0.5 day, after one week of soak |

Total about 8 engineer days plus the one-week soak.

**Rollout order (prod)**

1. Deploy PR 1 (CMS image, migration runs). Verify `/admin` loads and `/api/health` is 200 (a missing migration 500s the admin, see memory `global-without-migration-crashes-admin`).
2. Deploy PR 2 with `YOUTUBE_API_KEY` set. Run the task once from the admin jobs view. Expect the 15 existing videos to be created as drafts (the sync does not know about the catalog yet).
3. Deploy PR 3. Run the backfill in dry-run, read the report, run `--apply`. It merges onto the synced drafts by `externalId`, sets slugs and editorial fields, publishes. Web still reads the catalog.
4. Compare: `curl` both sources, assert identical slugs, titles, topics and order (Task 12 provides the script).
5. Flip `VIDEOS_SOURCE=cms`, redeploy web, run the verification checklist in Task 14.

**Rollback:** set `VIDEOS_SOURCE=catalog` and redeploy web (about 2 minutes). The CMS data stays. If the migration itself must be reverted, restore from the droplet backup (`docs/operations/RESTORE-LOG.md`); the migration is additive only.

---

## 8. Tasks

### Task 1: `videoTopics` taxonomy

**Files:**
- Create: `apps/cms/src/payload/collections/VideoTopics.ts`
- Modify: `apps/cms/src/payload.config.ts`, `apps/cms/src/payload/lib/route-prefixes.ts`

- [ ] **Step 1: Create the collection**

```ts
import type { CollectionConfig } from 'payload';

import { isAdminOrEditor } from '../access';
import { slugField } from '../fields/slug';
import {
  revalidateWebAfterDeleteHook,
  revalidateWebPublishAfterChangeHook,
} from '../hooks/revalidate-web-publish';

/**
 * Topics for /videos. Topics are filters on the listing, not pages, so this
 * taxonomy has no SEO fields, no drafts and no URL of its own. `aliases` are the
 * YouTube tags and hashtags that should suggest the topic on import.
 */
export const VideoTopics: CollectionConfig = {
  slug: 'videoTopics',
  labels: { singular: 'Video topic', plural: 'Video topics' },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'slug', 'updatedAt'],
    group: 'Taxonomies',
  },
  access: {
    read: () => true,
    create: isAdminOrEditor,
    update: isAdminOrEditor,
    delete: isAdminOrEditor,
  },
  fields: [
    { name: 'name', type: 'text', required: true },
    slugField({ source: 'name' }),
    { name: 'description', type: 'textarea' },
    {
      name: 'aliases',
      type: 'array',
      labels: { singular: 'Alias', plural: 'Aliases' },
      admin: {
        description:
          'YouTube tags and hashtags that suggest this topic on import, e.g. "sbom" or "software bill of materials". Case and spacing are ignored.',
      },
      fields: [{ name: 'value', type: 'text', required: true }],
    },
  ],
  hooks: {
    afterChange: [revalidateWebPublishAfterChangeHook('videoTopics')],
    afterDelete: [revalidateWebAfterDeleteHook('videoTopics')],
  },
  timestamps: true,
};
```

- [ ] **Step 2: Register it**

In `payload.config.ts` add `import { VideoTopics } from './payload/collections/VideoTopics';` and `VideoTopics,` in the `collections` array, next to `Advisories`.

In `route-prefixes.ts`, inside `LISTING_PATH_OVERRIDE`, add:

```ts
  // Topics render as the /videos filter, so a topic edit must purge that listing.
  videoTopics: '/videos',
```

- [ ] **Step 3: Commit**

```bash
git add apps/cms/src/payload/collections/VideoTopics.ts apps/cms/src/payload.config.ts apps/cms/src/payload/lib/route-prefixes.ts
git commit -m "feat(cms): videoTopics taxonomy for /videos"
```

### Task 2: `videos` collection

**Files:**
- Create: `apps/cms/src/payload/collections/Videos.ts`
- Modify: `apps/cms/src/payload.config.ts`, `apps/cms/src/payload/lib/route-prefixes.ts`

- [ ] **Step 1: Add the route prefix**

In `route-prefixes.ts`, add `videos: '/videos',` to `ROUTE_PREFIX`. No `LISTING_PATH_OVERRIDE` entry is needed because the listing and detail prefix are the same.

- [ ] **Step 2: Create the collection**

```ts
import type { CollectionBeforeChangeHook, CollectionConfig } from 'payload';
import { ValidationError } from 'payload';

import { isAdminOrEditor, publishedOrAuthenticated } from '../access';
import { docStatusBarEditConfig } from '../admin/doc-status-bar-mount';
import { contentUpdatedAtField } from '../fields/content-updated-at';
import { displayPublishedAtField } from '../fields/display-published-at';
import { publishedAtField } from '../fields/published-at';
import { seoFieldsForSidebar, seoSidebarFields } from '../fields/seo';
import { slugField } from '../fields/slug';
import { contentTitleField } from '../fields/title';
import { contentUpdatedAtHook } from '../hooks/content-updated-at';
import { displayPublishedAtAuditHook } from '../hooks/display-published-at-audit';
import { displayPublishedAtBackfillHook } from '../hooks/display-published-at-backfill';
import { firstPublishHook } from '../hooks/first-publish';
import { indexNowPublishAfterChangeHook } from '../hooks/indexnow-publish';
import {
  revalidateWebAfterDeleteHook,
  revalidateWebPublishAfterChangeHook,
} from '../hooks/revalidate-web-publish';
import { searchSyncAfterChangeHook, searchSyncAfterDeleteHook } from '../hooks/search-sync';
import { slugChangeRedirectHook } from '../hooks/slug-change-redirect';
import { webhooksPublishAfterChangeHook } from '../hooks/webhooks-publish';
import { ROUTE_PREFIX } from '../lib/route-prefixes';

/** Plan 2 adds 'vimeo'. The enum value exists now so that is not an enum migration. */
export const SUPPORTED_PROVIDERS: readonly string[] = ['youtube'];

const SUMMARY_MAX = 320;

const readOnly = { update: () => false } as const;

const enforceSupportedProviderHook: CollectionBeforeChangeHook = ({ data }) => {
  const provider = (data as { provider?: string }).provider;
  if (provider && !SUPPORTED_PROVIDERS.includes(provider)) {
    throw new ValidationError({
      errors: [{ path: 'provider', message: `Provider "${provider}" is not enabled yet.` }],
    });
  }
  return data;
};

/** Old videos keep their real date: publishedAt follows the upload date until an editor sets one. */
const publishedAtFromSourceHook: CollectionBeforeChangeHook = ({ data, operation }) => {
  const source = (data as { source?: { publishedAt?: string } }).source;
  const current = (data as { publishedAt?: string | null }).publishedAt;
  if (operation === 'create' && !current && source?.publishedAt) {
    return { ...data, publishedAt: source.publishedAt };
  }
  return data;
};

export const Videos: CollectionConfig = {
  slug: 'videos',
  labels: { singular: 'Video', plural: 'Videos' },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'format', 'syncState', '_status', 'publishedAt'],
    group: 'Content',
    components: {
      edit: docStatusBarEditConfig({ showStats: false, showPublishedAt: true, showPurge: true }),
    },
  },
  access: {
    read: publishedOrAuthenticated,
    create: isAdminOrEditor,
    update: isAdminOrEditor,
    delete: isAdminOrEditor,
  },
  fields: [
    contentTitleField,
    slugField({ source: 'title' }),
    {
      name: 'provider',
      type: 'select',
      required: true,
      defaultValue: 'youtube',
      options: [
        { label: 'YouTube', value: 'youtube' },
        { label: 'Vimeo', value: 'vimeo' },
      ],
      access: readOnly,
      admin: { position: 'sidebar' },
    },
    {
      name: 'externalId',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      access: readOnly,
      admin: { position: 'sidebar', description: 'The video id on the host (the 11 characters in a YouTube link).' },
    },
    {
      name: 'format',
      type: 'select',
      options: [
        { label: 'Explainer', value: 'explainer' },
        { label: 'Product demo', value: 'demo' },
        { label: 'Talk or webinar', value: 'talk' },
      ],
      admin: { position: 'sidebar', description: 'Required to publish. Drives the format tabs on /videos.' },
    },
    {
      name: 'topics',
      type: 'relationship',
      relationTo: 'videoTopics',
      hasMany: true,
      admin: { description: 'At least one is required to publish. Suggested from YouTube tags on import.' },
    },
    {
      name: 'summary',
      type: 'textarea',
      maxLength: SUMMARY_MAX,
      admin: { description: `Card text and meta description. Required to publish, up to ${SUMMARY_MAX} characters.` },
    },
    {
      name: 'featured',
      type: 'checkbox',
      defaultValue: false,
      admin: { position: 'sidebar', description: 'Plays in the /videos hero. When none is featured, the newest video is.' },
    },
    { name: 'transcript', type: 'textarea', admin: { description: 'Optional. Shown on the watch page once Plan 2 ships.' } },
    {
      name: 'syncState',
      type: 'select',
      defaultValue: 'manual',
      options: [
        { label: 'Synced', value: 'synced' },
        { label: 'Needs review', value: 'needs-review' },
        { label: 'Missing on YouTube', value: 'missing' },
        { label: 'Manual', value: 'manual' },
      ],
      access: readOnly,
      admin: { position: 'sidebar', description: 'Set by the YouTube sync. "Missing" means the video is gone or private on YouTube; it is not unpublished automatically.' },
    },
    {
      name: 'source',
      type: 'group',
      admin: { description: 'Copied from the host by the sync. Read only.' },
      fields: [
        { name: 'title', type: 'text', access: readOnly },
        { name: 'description', type: 'textarea', access: readOnly },
        { name: 'durationSeconds', type: 'number', access: readOnly },
        { name: 'publishedAt', type: 'date', access: readOnly },
        { name: 'tags', type: 'array', access: readOnly, fields: [{ name: 'value', type: 'text' }] },
        { name: 'privacyStatus', type: 'text', access: readOnly },
        { name: 'embeddable', type: 'checkbox', access: readOnly },
        { name: 'hasMaxres', type: 'checkbox', access: readOnly },
        { name: 'thumbnailUrl', type: 'text', access: readOnly },
        { name: 'contentHash', type: 'text', access: readOnly, admin: { hidden: true } },
        { name: 'fetchedAt', type: 'date', access: readOnly },
      ],
    },
    {
      name: 'permalink',
      type: 'ui',
      admin: {
        position: 'sidebar',
        components: {
          Field: {
            path: '@/payload/admin/components/PermalinkField.tsx#PermalinkField',
            clientProps: { pathPrefix: ROUTE_PREFIX.videos },
          },
        },
      },
    },
    publishedAtField,
    displayPublishedAtField,
    contentUpdatedAtField,
    ...seoSidebarFields({ pathPrefix: ROUTE_PREFIX.videos, descriptionSource: 'summary' }),
    ...seoFieldsForSidebar('videos'),
  ],
  hooks: {
    beforeChange: [
      enforceSupportedProviderHook,
      publishedAtFromSourceHook,
      contentUpdatedAtHook(),
      firstPublishHook(),
      displayPublishedAtBackfillHook,
    ],
    afterChange: [
      slugChangeRedirectHook('videos'),
      displayPublishedAtAuditHook('videos'),
      searchSyncAfterChangeHook('videos'),
      webhooksPublishAfterChangeHook('videos'),
      indexNowPublishAfterChangeHook('videos'),
      revalidateWebPublishAfterChangeHook('videos'),
    ],
    afterDelete: [searchSyncAfterDeleteHook('videos'), revalidateWebAfterDeleteHook('videos')],
  },
  versions: { drafts: { schedulePublish: true }, maxPerDoc: 25 },
  timestamps: true,
};
```

- [ ] **Step 3: Register it** next to `Advisories` in `payload.config.ts`.

- [ ] **Step 4: Typecheck**

Run: `pnpm --filter @cleanstart/cms typecheck`
Expected: errors only about `'videos'` / `'videoTopics'` missing from generated union types (fixed in Task 3).

- [ ] **Step 5: Check D8**

Run: `rg -n "schemaAddons|validateOverrideForCollection" apps/cms/src/payload/hooks apps/cms/src/payload/lib/jsonld/override-validator.ts | head`
Expected: no code path requires a `schemaAddons` field on every collection. If one does, add `schemaAddonsField` to `Videos.ts` and budget the extra `blocks_*` tables in Task 4.

- [ ] **Step 6: Commit**

```bash
git add apps/cms/src/payload/collections/Videos.ts apps/cms/src/payload.config.ts apps/cms/src/payload/lib/route-prefixes.ts
git commit -m "feat(cms): videos collection"
```

### Task 3: Wire `videos` into every registry, regenerate types

**Files:** every hit from the section 5 search.

- [ ] **Step 1: List the places**

Run: `rg -l "'advisories'|\"advisories\"|advisories:" apps/cms/src apps/web/src > /tmp/advisory-touchpoints.txt && cat /tmp/advisory-touchpoints.txt`

- [ ] **Step 2: Add `videos` at each hit**, applying the exceptions table in section 5. Examples of the exact edits:

```ts
// apps/cms/src/payload/lib/sitemap/collect.ts
{ collection: 'videos', defaultPriority: 0.6, defaultChangeFreq: 'weekly', listingPath: '/videos' },

// apps/cms/src/payload/lib/web-pages.ts
videos: { detailPrefix: '/videos', listingPath: '/videos' },

// apps/cms/src/payload/lib/search/index-schema.ts   (weight lower than advisories: 95)
videos: 70,

// apps/cms/src/payload/admin/components/internal-routes.ts
videos: '/videos',

// apps/cms/src/payload/admin/components/views/list/filters/list-filter-config.ts
videos: [
  { kind: 'select', name: 'format', label: 'Format' },
  { kind: 'select', name: 'syncState', label: 'Sync state' },
  STATUS_FILTER,
],
```

Open each neighbouring entry first and copy its exact shape. If `kind: 'select'` is not a supported filter kind in `list-filter-config.ts`, use the kind its other select filters use.

- [ ] **Step 3: Page registry**

In `page-registry-seed.ts` replace the `/videos` row and add the template row:

```ts
  { path: '/videos', title: 'Videos', kind: 'cms-listing', order: 61, backingCollection: 'videos' },
  { path: '/videos/[slug]', title: 'Video (template)', kind: 'cms-template', order: 62, backingCollection: 'videos' },
```

In `page-registry-coverage.ts` remove the `'/videos/[slug]'` entry and its comment from `INTENTIONALLY_UNREGISTERED`.

- [ ] **Step 4: Update the count tests**

`apps/cms/src/payload/lib/web-pages.test.ts`: add `'videos'` to the expected list and change `toHaveLength(14)` to `15`.

- [ ] **Step 5: Regenerate types and snapshots**

```bash
pnpm --filter @cleanstart/cms generate:types
pnpm --filter @cleanstart/cms test -- schema-surface cache-purge-field web-pages
```
Expected: schema-surface fails once with a new snapshot to approve. Run with `-u` only for `Videos.snap.json` and `Pages.snap.json`, then read the diff and confirm it contains only `videos` additions.

- [ ] **Step 6: Gate and commit**

```bash
pnpm --filter @cleanstart/cms lint && pnpm --filter @cleanstart/cms typecheck && pnpm --filter @cleanstart/cms verify:page-registry
git add -A apps/cms apps/web/src
git commit -m "feat(cms): wire videos into the routed-collection registries"
```
Review `git status` before `git add -A`: stage only the files in the touchpoint list (the repo forbids `git add -A` at the root, and sibling sessions may have unrelated edits).

### Task 4: Migration (the long pole)

**Files:**
- Create: `apps/cms/src/migrations/20261024_100000_add_videos.ts`
- Modify: `apps/cms/src/migrations/index.ts`

Do **not** trust `payload migrate:create` (CLAUDE.md, mandatory check 6): it diffs against a stale June snapshot and emits hundreds of unrelated statements. Use it only to read the SQL for the new tables.

- [ ] **Step 1: Build two scratch databases from a dump of local dev**

```bash
pg_dump -Fc cleanstart > /tmp/cs-base.dump
createdb cs_vid_a && pg_restore -d cs_vid_a /tmp/cs-base.dump
createdb cs_vid_b && pg_restore -d cs_vid_b /tmp/cs-base.dump
```

- [ ] **Step 2: Let Payload push the true schema onto clone A**

Local dev runs in push mode. Start the CMS once against `DATABASE_URI=postgres://postgres:1234@localhost:5432/cs_vid_a`, wait for it to boot, stop it. Then:

```bash
pg_dump --schema-only cs_vid_a > /tmp/schema-a.sql
pg_dump --schema-only cs_vid_b > /tmp/schema-base.sql
diff /tmp/schema-base.sql /tmp/schema-a.sql > /tmp/videos-ddl.diff
```
`/tmp/videos-ddl.diff` is the truth to transcribe.

- [ ] **Step 3: Write the migration, guarded and idempotent**

Follow `20261023_120000_add_advisories.ts` exactly in structure. Every statement must be re-runnable because local databases already have these objects:

```ts
import { type MigrateDownArgs, type MigrateUpArgs, sql } from '@payloadcms/db-postgres'

const UP = [
  sql`DO $$ BEGIN CREATE TYPE "public"."enum_videos_provider" AS ENUM('youtube', 'vimeo'); EXCEPTION WHEN duplicate_object THEN null; END $$;`,
  sql`DO $$ BEGIN CREATE TYPE "public"."enum_videos_format" AS ENUM('explainer', 'demo', 'talk'); EXCEPTION WHEN duplicate_object THEN null; END $$;`,
  sql`DO $$ BEGIN CREATE TYPE "public"."enum_videos_sync_state" AS ENUM('synced', 'needs-review', 'missing', 'manual'); EXCEPTION WHEN duplicate_object THEN null; END $$;`,
  // ... CREATE TABLE IF NOT EXISTS for: video_topics, video_topics_aliases,
  //     videos, videos_topics (rel), videos_source_tags, _videos_v, _videos_v_version_source_tags,
  //     _videos_v_rels, plus indexes, copied from /tmp/videos-ddl.diff.
  // The three non-obvious touches, copied from the advisories migration:
  sql`ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "videos_id" integer;`,
  sql`ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "video_topics_id" integer;`,
  sql`ALTER TABLE "pages_rels" ADD COLUMN IF NOT EXISTS "videos_id" integer;`,
  sql`ALTER TABLE "_pages_v_rels" ADD COLUMN IF NOT EXISTS "videos_id" integer;`,
  sql`ALTER TYPE "public"."enum_integrations_routing_collections" ADD VALUE IF NOT EXISTS 'videos';`,
]

export async function up({ db }: MigrateUpArgs): Promise<void> {
  for (const statement of UP) await db.execute(statement)
}

export async function down(_args: MigrateDownArgs): Promise<void> {
  // Additive only. Restore from the droplet backup if this must be reverted.
}
```
The `payload_locked_documents_rels` columns are the ones that took the whole admin down in the 2026-06-24 taxonomy incident when omitted. Do not skip them.

- [ ] **Step 4: Register it** in `apps/cms/src/migrations/index.ts` (import plus array entry, same shape as the advisories lines).

- [ ] **Step 5: Prove it against the real thing**

```bash
DATABASE_URI=postgres://postgres:1234@localhost:5432/cs_vid_b pnpm --filter @cleanstart/cms migrate
pg_dump --schema-only cs_vid_b > /tmp/schema-b.sql
diff /tmp/schema-a.sql /tmp/schema-b.sql && echo "SCHEMA MATCH"
DATABASE_URI=postgres://postgres:1234@localhost:5432/cs_vid_b pnpm --filter @cleanstart/cms migrate   # second run must be a no-op
```
Expected: `SCHEMA MATCH`, and the second run reports nothing to run. Then start the CMS against `cs_vid_b`, open `/admin`, open Videos and Video topics lists and create one of each.

- [ ] **Step 6: Commit**

```bash
git add apps/cms/src/migrations/20261024_100000_add_videos.ts apps/cms/src/migrations/index.ts
git commit -m "feat(cms): migration for videos and videoTopics"
```

### Task 5: YouTube client with Zod at the boundary

**Files:**
- Create: `apps/cms/src/payload/lib/videos/youtube-client.ts`, `youtube-client.test.ts`

- [ ] **Step 1: Write the failing tests**

```ts
import { describe, expect, it, vi } from 'vitest';
import { YoutubeApiError, createYoutubeClient, parseIsoDuration } from './youtube-client';

const json = (body: unknown, status = 200): Response =>
  ({ ok: status < 400, status, json: async () => body }) as Response;

describe('parseIsoDuration', () => {
  it.each([
    ['PT1M41S', 101],
    ['PT59S', 59],
    ['PT27M46S', 1666],
    ['PT1H2M3S', 3723],
    ['PT0S', 0],
    ['P1DT1H', 90000],
  ])('%s -> %i seconds', (iso, seconds) => {
    expect(parseIsoDuration(iso)).toBe(seconds);
  });
  it('rejects garbage', () => {
    expect(() => parseIsoDuration('1:41')).toThrow(YoutubeApiError);
  });
});

describe('createYoutubeClient', () => {
  it('walks the uploads playlist and reports whether it saw everything', async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(json({ items: [{ contentDetails: { relatedPlaylists: { uploads: 'UUabc' } } }] }))
      .mockResolvedValueOnce(json({ items: [{ contentDetails: { videoId: 'AAAAAAAAAAA' } }], nextPageToken: 'p2' }))
      .mockResolvedValueOnce(json({ items: [{ contentDetails: { videoId: 'BBBBBBBBBBB' } }] }));
    const client = createYoutubeClient({ apiKey: 'k', fetchImpl });
    expect(await client.listUploadIds('UCabc')).toEqual({ ids: ['AAAAAAAAAAA', 'BBBBBBBBBBB'], complete: true });
  });

  it('marks the listing incomplete when it hits the page cap', async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(json({ items: [{ contentDetails: { relatedPlaylists: { uploads: 'UUabc' } } }] }))
      .mockResolvedValue(json({ items: [{ contentDetails: { videoId: 'AAAAAAAAAAA' } }], nextPageToken: 'more' }));
    const client = createYoutubeClient({ apiKey: 'k', fetchImpl });
    const result = await client.listUploadIds('UCabc', { maxPages: 2 });
    expect(result.complete).toBe(false);
  });

  it('maps a video, reading maxres from the thumbnails', async () => {
    const fetchImpl = vi.fn().mockResolvedValueOnce(
      json({
        items: [
          {
            id: 'AAAAAAAAAAA',
            snippet: {
              title: 'T', description: 'D', publishedAt: '2026-10-13T14:17:14Z', tags: ['sbom'],
              liveBroadcastContent: 'none',
              thumbnails: { default: { url: 'u' }, maxres: { url: 'https://i.ytimg.com/vi/AAAAAAAAAAA/maxresdefault.jpg' } },
            },
            contentDetails: { duration: 'PT1M41S' },
            status: { privacyStatus: 'public', embeddable: true },
          },
        ],
      }),
    );
    const [video] = await createYoutubeClient({ apiKey: 'k', fetchImpl }).getVideos(['AAAAAAAAAAA']);
    expect(video).toMatchObject({ id: 'AAAAAAAAAAA', durationSeconds: 101, hasMaxres: true, tags: ['sbom'] });
  });

  it('throws a typed error that never contains the API key', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(json({ error: { message: 'quota' } }, 403));
    const client = createYoutubeClient({ apiKey: 'SECRET-KEY', fetchImpl });
    const error = await client.getVideos(['AAAAAAAAAAA']).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(YoutubeApiError);
    expect(String((error as Error).message)).not.toContain('SECRET-KEY');
  });

  it('rejects a response that does not match the schema', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(json({ items: [{ id: 'short' }] }));
    await expect(createYoutubeClient({ apiKey: 'k', fetchImpl }).getVideos(['AAAAAAAAAAA'])).rejects.toBeInstanceOf(YoutubeApiError);
  });

  it('batches video ids in groups of 50', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(json({ items: [] }));
    const ids = Array.from({ length: 120 }, (_, i) => String(i).padStart(11, 'x'));
    await createYoutubeClient({ apiKey: 'k', fetchImpl }).getVideos(ids);
    expect(fetchImpl).toHaveBeenCalledTimes(3);
  });
});
```

- [ ] **Step 2: Run, expect failure**

Run: `pnpm --filter @cleanstart/cms exec vitest run src/payload/lib/videos/youtube-client.test.ts`
Expected: FAIL, cannot find module `./youtube-client`.

- [ ] **Step 3: Implement**

```ts
import { z } from 'zod';

export class YoutubeApiError extends Error {
  constructor(
    message: string,
    readonly status: number | null = null,
  ) {
    super(message);
    this.name = 'YoutubeApiError';
  }
}

const ISO_DURATION = /^P(?:(\d+)D)?T?(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/;

export const parseIsoDuration = (iso: string): number => {
  const match = ISO_DURATION.exec(iso);
  if (!match) throw new YoutubeApiError(`Unparseable duration: ${iso}`);
  const [, d = '0', h = '0', m = '0', s = '0'] = match;
  return Number(d) * 86_400 + Number(h) * 3_600 + Number(m) * 60 + Number(s);
};

const Id = z.string().length(11);

const ChannelsResponse = z.object({
  items: z
    .array(z.object({ contentDetails: z.object({ relatedPlaylists: z.object({ uploads: z.string() }) }) }))
    .default([]),
});

const PlaylistItemsResponse = z.object({
  items: z.array(z.object({ contentDetails: z.object({ videoId: Id }) })).default([]),
  nextPageToken: z.string().optional(),
});

const VideosResponse = z.object({
  items: z
    .array(
      z.object({
        id: Id,
        snippet: z.object({
          title: z.string(),
          description: z.string().default(''),
          publishedAt: z.string(),
          tags: z.array(z.string()).default([]),
          liveBroadcastContent: z.enum(['none', 'live', 'upcoming']).default('none'),
          thumbnails: z.record(z.object({ url: z.string() })).default({}),
        }),
        contentDetails: z.object({ duration: z.string() }),
        status: z.object({
          privacyStatus: z.enum(['public', 'unlisted', 'private']),
          embeddable: z.boolean().default(true),
        }),
      }),
    )
    .default([]),
});

export interface YoutubeVideo {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly publishedAt: string;
  readonly durationSeconds: number;
  readonly tags: readonly string[];
  readonly privacyStatus: 'public' | 'unlisted' | 'private';
  readonly embeddable: boolean;
  readonly liveBroadcastContent: 'none' | 'live' | 'upcoming';
  readonly hasMaxres: boolean;
}

export interface YoutubeClient {
  listUploadIds(
    channelId: string,
    options?: { maxPages?: number },
  ): Promise<{ ids: string[]; complete: boolean }>;
  getVideos(ids: readonly string[]): Promise<YoutubeVideo[]>;
}

interface ClientOptions {
  apiKey: string;
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
}

const BASE = 'https://www.googleapis.com/youtube/v3';
const BATCH = 50;

export const createYoutubeClient = ({
  apiKey,
  fetchImpl = fetch,
  timeoutMs = 10_000,
}: ClientOptions): YoutubeClient => {
  const get = async <T>(
    path: string,
    params: Record<string, string>,
    schema: z.ZodType<T>,
  ): Promise<T> => {
    const url = `${BASE}/${path}?${new URLSearchParams({ ...params, key: apiKey }).toString()}`;
    let res: Response;
    try {
      res = await fetchImpl(url, { signal: AbortSignal.timeout(timeoutMs) });
    } catch {
      // The URL carries the key, so never forward the underlying error text.
      throw new YoutubeApiError(`YouTube request failed: ${path}`);
    }
    if (!res.ok) throw new YoutubeApiError(`YouTube ${path} returned ${res.status}`, res.status);
    const parsed = schema.safeParse(await res.json());
    if (!parsed.success) throw new YoutubeApiError(`YouTube ${path} response did not match the expected shape`);
    return parsed.data;
  };

  return {
    async listUploadIds(channelId, { maxPages = 20 } = {}) {
      const channels = await get('channels', { part: 'contentDetails', id: channelId }, ChannelsResponse);
      const uploads = channels.items[0]?.contentDetails.relatedPlaylists.uploads;
      if (!uploads) throw new YoutubeApiError(`No uploads playlist for channel ${channelId}`);
      const ids: string[] = [];
      let pageToken: string | undefined;
      for (let page = 0; page < maxPages; page += 1) {
        const res = await get(
          'playlistItems',
          { part: 'contentDetails', playlistId: uploads, maxResults: String(BATCH), ...(pageToken ? { pageToken } : {}) },
          PlaylistItemsResponse,
        );
        ids.push(...res.items.map((i) => i.contentDetails.videoId));
        pageToken = res.nextPageToken;
        if (!pageToken) return { ids, complete: true };
      }
      return { ids, complete: false };
    },

    async getVideos(ids) {
      const out: YoutubeVideo[] = [];
      for (let i = 0; i < ids.length; i += BATCH) {
        const res = await get(
          'videos',
          { part: 'snippet,contentDetails,status', id: ids.slice(i, i + BATCH).join(',') },
          VideosResponse,
        );
        for (const v of res.items) {
          out.push({
            id: v.id,
            title: v.snippet.title,
            description: v.snippet.description,
            publishedAt: v.snippet.publishedAt,
            durationSeconds: parseIsoDuration(v.contentDetails.duration),
            tags: v.snippet.tags,
            privacyStatus: v.status.privacyStatus,
            embeddable: v.status.embeddable,
            liveBroadcastContent: v.snippet.liveBroadcastContent,
            hasMaxres: 'maxres' in v.snippet.thumbnails,
          });
        }
      }
      return out;
    },
  };
};
```

- [ ] **Step 4: Run, expect pass**, then commit.

```bash
pnpm --filter @cleanstart/cms exec vitest run src/payload/lib/videos/youtube-client.test.ts
git add apps/cms/src/payload/lib/videos/youtube-client.ts apps/cms/src/payload/lib/videos/youtube-client.test.ts
git commit -m "feat(cms): YouTube Data API client with schema-checked responses"
```

### Task 6: `planSync`, the pure core

**Files:**
- Create: `apps/cms/src/payload/lib/videos/plan-sync.ts`, `plan-sync.test.ts`

- [ ] **Step 1: Write the failing tests**

```ts
import { describe, expect, it } from 'vitest';
import type { YoutubeVideo } from './youtube-client';
import { contentHash, normaliseTag, planSync, suggestTopicIds, toSource } from './plan-sync';

const video = (over: Partial<YoutubeVideo> = {}): YoutubeVideo => ({
  id: 'AAAAAAAAAAA', title: 'T', description: 'First paragraph.\n\n#SBOM #VEX', publishedAt: '2026-10-13T14:17:14Z',
  durationSeconds: 101, tags: [], privacyStatus: 'public', embeddable: true, liveBroadcastContent: 'none', hasMaxres: true,
  ...over,
});
const topics = [
  { id: 1, name: 'SBOM', aliases: ['software bill of materials'] },
  { id: 2, name: 'VEX', aliases: [] },
  { id: 3, name: 'Base images', aliases: [] },
];

describe('normaliseTag', () => {
  it('ignores case, hashes and spacing', () => {
    expect(normaliseTag('#Base Images')).toBe('baseimages');
    expect(normaliseTag('base-images')).toBe('baseimages');
  });
});

describe('suggestTopicIds', () => {
  it('matches hashtags in the description and YouTube tags, once each', () => {
    const ids = suggestTopicIds({ tags: ['Software Bill of Materials'], description: 'x\n\n#VEX #ContainerSecurity #sbom' }, topics);
    expect(ids).toEqual([1, 2]);
  });
  it('suggests nothing when nothing matches', () => {
    expect(suggestTopicIds({ tags: ['kubernetes'], description: '#devops' }, topics)).toEqual([]);
  });
});

describe('planSync', () => {
  const base = { existing: [], complete: true, topics };

  it('creates a needs-review draft for a new public video, with suggested topics', () => {
    const plan = planSync({ ...base, fetched: [video()] });
    expect(plan.creates).toHaveLength(1);
    expect(plan.creates[0]).toMatchObject({ externalId: 'AAAAAAAAAAA', suggestedTopicIds: [1, 2] });
  });

  it.each([
    ['unlisted', video({ privacyStatus: 'unlisted' }), 'not-public'],
    ['private', video({ privacyStatus: 'private' }), 'not-public'],
    ['not embeddable', video({ embeddable: false }), 'not-embeddable'],
    ['upcoming', video({ liveBroadcastContent: 'upcoming' }), 'not-finished'],
    ['live', video({ liveBroadcastContent: 'live' }), 'not-finished'],
  ])('skips a %s video', (_label, v, reason) => {
    const plan = planSync({ ...base, fetched: [v] });
    expect(plan.creates).toEqual([]);
    expect(plan.skipped).toEqual([{ externalId: 'AAAAAAAAAAA', reason }]);
  });

  it('leaves an unchanged video alone', () => {
    const v = video();
    const plan = planSync({
      ...base, fetched: [v],
      existing: [{ id: 9, externalId: v.id, syncState: 'synced', contentHash: contentHash(toSource(v)), status: 'published' }],
    });
    expect(plan).toMatchObject({ creates: [], updates: [], unchanged: 1 });
  });

  it('updates only the source when YouTube content changed', () => {
    const v = video({ description: 'edited' });
    const plan = planSync({
      ...base, fetched: [v],
      existing: [{ id: 9, externalId: v.id, syncState: 'synced', contentHash: 'old', status: 'published' }],
    });
    expect(plan.updates).toEqual([{ id: 9, source: toSource(v), restoreFromMissing: false }]);
  });

  it('flags a vanished video as missing, but only when the listing was complete', () => {
    const existing = [{ id: 9, externalId: 'GONEGONEGON', syncState: 'synced' as const, contentHash: 'h', status: 'published' as const }];
    expect(planSync({ ...base, fetched: [], existing }).missing).toEqual([9]);
    expect(planSync({ ...base, fetched: [], existing, complete: false }).missing).toEqual([]);
  });

  it('never touches manual documents', () => {
    const existing = [{ id: 5, externalId: 'MANUALMANUA', syncState: 'manual' as const, contentHash: null, status: 'published' as const }];
    const plan = planSync({ ...base, fetched: [], existing });
    expect(plan.missing).toEqual([]);
  });

  it('brings a missing video back when it reappears', () => {
    const v = video();
    const plan = planSync({
      ...base, fetched: [v],
      existing: [{ id: 9, externalId: v.id, syncState: 'missing', contentHash: contentHash(toSource(v)), status: 'published' }],
    });
    expect(plan.updates).toEqual([{ id: 9, source: toSource(v), restoreFromMissing: true }]);
  });
});
```

- [ ] **Step 2: Run, expect failure** (module not found).

- [ ] **Step 3: Implement**

```ts
import { createHash } from 'node:crypto';

import type { YoutubeVideo } from './youtube-client';

export type SyncState = 'synced' | 'needs-review' | 'missing' | 'manual';
export type SkipReason = 'not-public' | 'not-embeddable' | 'not-finished';
type DocId = number | string;

export interface SourceSnapshot {
  readonly title: string;
  readonly description: string;
  readonly durationSeconds: number;
  readonly publishedAt: string;
  readonly tags: readonly string[];
  readonly privacyStatus: string;
  readonly embeddable: boolean;
  readonly hasMaxres: boolean;
  readonly thumbnailUrl: string;
}

export interface ExistingVideo {
  readonly id: DocId;
  readonly externalId: string;
  readonly syncState: SyncState;
  readonly contentHash: string | null;
  readonly status: 'draft' | 'published';
}

export interface TopicRef {
  readonly id: DocId;
  readonly name: string;
  readonly aliases: readonly string[];
}

export interface SyncPlan {
  readonly creates: { externalId: string; source: SourceSnapshot; suggestedTopicIds: DocId[] }[];
  readonly updates: { id: DocId; source: SourceSnapshot; restoreFromMissing: boolean }[];
  readonly unchanged: number;
  readonly missing: DocId[];
  readonly skipped: { externalId: string; reason: SkipReason }[];
}

export const normaliseTag = (raw: string): string => raw.toLowerCase().replace(/[^a-z0-9]/g, '');

export const toSource = (v: YoutubeVideo): SourceSnapshot => ({
  title: v.title,
  description: v.description,
  durationSeconds: v.durationSeconds,
  publishedAt: v.publishedAt,
  tags: v.tags,
  privacyStatus: v.privacyStatus,
  embeddable: v.embeddable,
  hasMaxres: v.hasMaxres,
  thumbnailUrl: `https://i.ytimg.com/vi/${v.id}/${v.hasMaxres ? 'maxresdefault' : 'hqdefault'}.jpg`,
});

export const contentHash = (source: SourceSnapshot): string =>
  createHash('sha256').update(JSON.stringify(source)).digest('hex');

const HASHTAG = /(?:^|\s)#([\p{L}\p{N}_]+)/gu;

export const suggestTopicIds = (
  input: { tags: readonly string[]; description: string },
  topics: readonly TopicRef[],
): DocId[] => {
  const candidates = new Set<string>([
    ...input.tags.map(normaliseTag),
    ...[...input.description.matchAll(HASHTAG)].map((m) => normaliseTag(m[1] ?? '')),
  ]);
  return topics
    .filter((t) => [t.name, ...t.aliases].some((label) => candidates.has(normaliseTag(label))))
    .map((t) => t.id);
};

const skipReason = (v: YoutubeVideo): SkipReason | null => {
  if (v.privacyStatus !== 'public') return 'not-public';
  if (!v.embeddable) return 'not-embeddable';
  if (v.liveBroadcastContent !== 'none') return 'not-finished';
  return null;
};

export const planSync = ({
  existing,
  fetched,
  complete,
  topics,
}: {
  existing: readonly ExistingVideo[];
  fetched: readonly YoutubeVideo[];
  complete: boolean;
  topics: readonly TopicRef[];
}): SyncPlan => {
  const byExternalId = new Map(existing.map((e) => [e.externalId, e]));
  const seen = new Set<string>();
  const creates: SyncPlan['creates'] = [];
  const updates: SyncPlan['updates'] = [];
  const skipped: SyncPlan['skipped'] = [];
  let unchanged = 0;

  for (const v of fetched) {
    seen.add(v.id);
    const reason = skipReason(v);
    if (reason) {
      skipped.push({ externalId: v.id, reason });
      continue;
    }
    const source = toSource(v);
    const current = byExternalId.get(v.id);
    if (!current) {
      creates.push({
        externalId: v.id,
        source,
        suggestedTopicIds: suggestTopicIds({ tags: v.tags, description: v.description }, topics),
      });
    } else if (current.syncState === 'manual') {
      unchanged += 1;
    } else if (current.contentHash === contentHash(source) && current.syncState !== 'missing') {
      unchanged += 1;
    } else {
      updates.push({ id: current.id, source, restoreFromMissing: current.syncState === 'missing' });
    }
  }

  const missing = complete
    ? existing
        .filter((e) => e.syncState !== 'manual' && e.syncState !== 'missing' && !seen.has(e.externalId))
        .map((e) => e.id)
    : [];

  return { creates, updates, unchanged, missing, skipped };
};
```

- [ ] **Step 4: Run, expect pass, commit**

```bash
pnpm --filter @cleanstart/cms exec vitest run src/payload/lib/videos/plan-sync.test.ts
git add apps/cms/src/payload/lib/videos/plan-sync.ts apps/cms/src/payload/lib/videos/plan-sync.test.ts
git commit -m "feat(cms): pure planner for the YouTube video sync"
```

### Task 7: `applyPlan`, the Payload shell

**Files:**
- Create: `apps/cms/src/payload/lib/videos/apply-sync.ts`, `apply-sync.test.ts`

The shell takes a structurally typed `payload` (the pattern in `purge-preview-audit.ts`) so tests use a fake. One failing document must never abort the batch.

- [ ] **Step 1: Write the failing tests** (fake payload recording calls)

```ts
import { describe, expect, it, vi } from 'vitest';
import { applyPlan } from './apply-sync';
import { toSource } from './plan-sync';

const source = toSource({
  id: 'AAAAAAAAAAA', title: 'T', description: 'First paragraph.\n\nmore', publishedAt: '2026-10-13T14:17:14Z',
  durationSeconds: 101, tags: [], privacyStatus: 'public', embeddable: true, liveBroadcastContent: 'none', hasMaxres: true,
});
const emptyPlan = { creates: [], updates: [], unchanged: 0, missing: [], skipped: [] };

const fakePayload = () => ({
  create: vi.fn().mockResolvedValue({ id: 1 }),
  update: vi.fn().mockResolvedValue({ id: 1 }),
  logger: { info: vi.fn(), error: vi.fn() },
});

describe('applyPlan', () => {
  it('creates drafts in needs-review and pre-fills title, slug input, summary and topics', async () => {
    const payload = fakePayload();
    const result = await applyPlan(payload, { ...emptyPlan, creates: [{ externalId: 'AAAAAAAAAAA', source, suggestedTopicIds: [1, 2] }] }, { autoPublish: false });
    expect(payload.create).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'videos',
        draft: true,
        overrideAccess: true,
        data: expect.objectContaining({
          provider: 'youtube', externalId: 'AAAAAAAAAAA', title: 'T', summary: 'First paragraph.',
          topics: [1, 2], syncState: 'needs-review', _status: 'draft',
        }),
      }),
    );
    expect(result.created).toBe(1);
  });

  it('writes only the source group when updating', async () => {
    const payload = fakePayload();
    await applyPlan(payload, { ...emptyPlan, updates: [{ id: 9, source, restoreFromMissing: false }] }, { autoPublish: false });
    const args = payload.update.mock.calls[0]?.[0] as { data: Record<string, unknown> };
    expect(Object.keys(args.data)).toEqual(['source']);
  });

  it('restores syncState when a missing video returns', async () => {
    const payload = fakePayload();
    await applyPlan(payload, { ...emptyPlan, updates: [{ id: 9, source, restoreFromMissing: true }] }, { autoPublish: false });
    expect((payload.update.mock.calls[0]?.[0] as { data: Record<string, unknown> }).data.syncState).toBe('synced');
  });

  it('marks vanished videos missing without unpublishing them', async () => {
    const payload = fakePayload();
    await applyPlan(payload, { ...emptyPlan, missing: [4] }, { autoPublish: false });
    expect(payload.update).toHaveBeenCalledWith(expect.objectContaining({ id: 4, data: { syncState: 'missing' } }));
  });

  it('keeps going when one item fails and reports it', async () => {
    const payload = fakePayload();
    payload.create.mockRejectedValueOnce(new Error('boom')).mockResolvedValueOnce({ id: 2 });
    const plan = { ...emptyPlan, creates: [
      { externalId: 'AAAAAAAAAAA', source, suggestedTopicIds: [] },
      { externalId: 'BBBBBBBBBBB', source, suggestedTopicIds: [] },
    ] };
    const result = await applyPlan(payload, plan, { autoPublish: false });
    expect(result).toMatchObject({ created: 1, failed: 1 });
    expect(payload.logger.error).toHaveBeenCalled();
  });

  it('auto-publishes only when asked and only when classification is complete', async () => {
    const payload = fakePayload();
    await applyPlan(payload, { ...emptyPlan, creates: [{ externalId: 'AAAAAAAAAAA', source, suggestedTopicIds: [1] }] }, { autoPublish: true });
    // No format can be guessed, so the publish gate would reject it: it stays a draft.
    expect((payload.create.mock.calls[0]?.[0] as { data: { _status: string } }).data._status).toBe('draft');
  });
});
```

- [ ] **Step 2: Run, expect failure.**

- [ ] **Step 3: Implement**

```ts
import { contentHash, type SourceSnapshot, type SyncPlan } from './plan-sync';

type DocId = number | string;

export interface SyncPayload {
  create(args: {
    collection: 'videos';
    data: Record<string, unknown>;
    draft: boolean;
    overrideAccess: boolean;
    depth: number;
  }): Promise<{ id: DocId }>;
  update(args: {
    collection: 'videos';
    id: DocId;
    data: Record<string, unknown>;
    overrideAccess: boolean;
    depth: number;
  }): Promise<unknown>;
  logger: {
    info(meta: Record<string, unknown>, message: string): void;
    error(meta: Record<string, unknown>, message: string): void;
  };
}

export interface ApplyResult {
  created: number;
  updated: number;
  markedMissing: number;
  failed: number;
}

const FIRST_PARAGRAPH_MAX = 320;

const firstParagraph = (text: string): string => {
  const paragraph = text.split(/\n\s*\n/).map((p) => p.replace(/\s+/g, ' ').trim()).find((p) => p.length > 0) ?? '';
  if (paragraph.length <= FIRST_PARAGRAPH_MAX) return paragraph;
  const cut = paragraph.slice(0, FIRST_PARAGRAPH_MAX);
  return `${cut.slice(0, Math.max(cut.lastIndexOf(' '), 0) || FIRST_PARAGRAPH_MAX).replace(/[,;:\s]+$/, '')}.`;
};

const sourceData = (source: SourceSnapshot, fetchedAt: string): Record<string, unknown> => ({
  title: source.title,
  description: source.description,
  durationSeconds: source.durationSeconds,
  publishedAt: source.publishedAt,
  tags: source.tags.map((value) => ({ value })),
  privacyStatus: source.privacyStatus,
  embeddable: source.embeddable,
  hasMaxres: source.hasMaxres,
  thumbnailUrl: source.thumbnailUrl,
  contentHash: contentHash(source),
  fetchedAt,
});

export const applyPlan = async (
  payload: SyncPayload,
  plan: SyncPlan,
  // `autoPublish` is accepted so the env switch has one place to be honoured, but a new
  // video is never published here: the publish gate needs a format, which nothing guesses.
  _options: { autoPublish: boolean },
  now: () => Date = () => new Date(),
): Promise<ApplyResult> => {
  const result: ApplyResult = { created: 0, updated: 0, markedMissing: 0, failed: 0 };
  const fetchedAt = now().toISOString();

  const attempt = async (what: string, ref: Record<string, unknown>, run: () => Promise<unknown>): Promise<boolean> => {
    try {
      await run();
      return true;
    } catch (error) {
      result.failed += 1;
      payload.logger.error({ ...ref, error: error instanceof Error ? error.message : String(error) }, `videos sync: ${what} failed`);
      return false;
    }
  };

  for (const item of plan.creates) {
    const ok = await attempt('create', { externalId: item.externalId }, () =>
      payload.create({
        collection: 'videos',
        draft: true,
        overrideAccess: true,
        depth: 0,
        data: {
          provider: 'youtube',
          externalId: item.externalId,
          title: item.source.title,
          summary: firstParagraph(item.source.description),
          topics: item.suggestedTopicIds,
          syncState: 'needs-review',
          source: sourceData(item.source, fetchedAt),
          _status: 'draft',
        },
      }),
    );
    if (ok) result.created += 1;
  }

  for (const item of plan.updates) {
    const data: Record<string, unknown> = { source: sourceData(item.source, fetchedAt) };
    if (item.restoreFromMissing) data.syncState = 'synced';
    const ok = await attempt('update', { id: item.id }, () =>
      payload.update({ collection: 'videos', id: item.id, data, overrideAccess: true, depth: 0 }),
    );
    if (ok) result.updated += 1;
  }

  for (const id of plan.missing) {
    const ok = await attempt('mark missing', { id }, () =>
      payload.update({ collection: 'videos', id, data: { syncState: 'missing' }, overrideAccess: true, depth: 0 }),
    );
    if (ok) result.markedMissing += 1;
  }

  payload.logger.info({ ...result, unchanged: plan.unchanged, skipped: plan.skipped.length }, 'videos sync applied');
  return result;
};
```

- [ ] **Step 4: Run, expect pass, commit.**

```bash
pnpm --filter @cleanstart/cms exec vitest run src/payload/lib/videos/apply-sync.test.ts
git add apps/cms/src/payload/lib/videos/apply-sync.ts apps/cms/src/payload/lib/videos/apply-sync.test.ts
git commit -m "feat(cms): apply a video sync plan with per-item failure isolation"
```

Note on `autoPublish`: the env switch exists for decision 1, but publishing requires a `format`, which nothing guesses (D7). When marketing wants hands-off, the follow-up is a small rule such as "duration over 10 minutes means talk", agreed explicitly. Until then, the switch is accepted and documented but never bypasses the gate.

### Task 8: The scheduled task, credentials and env plumbing

**Files:**
- Create: `apps/cms/src/payload/lib/videos/run-sync.ts`, `apps/cms/src/payload/jobs/sync-youtube-videos.ts`
- Modify: `apps/cms/src/payload.config.ts`, `apps/cms/src/payload/lib/integrations/credentials.ts`, `apps/cms/.env.example`, `.github/workflows/deploy-cms.yml`, `CLAUDE.md` (jobs table)

- [ ] **Step 1: Credentials resolver** in `credentials.ts`, next to `resolveCruxCredentials`:

```ts
export interface YoutubeCredentials {
  readonly apiKey: string;
  readonly channelId: string;
}

export const resolveYoutubeCredentials = (): YoutubeCredentials | null => {
  const apiKey = readEnv('YOUTUBE_API_KEY');
  if (!apiKey) return null;
  return { apiKey, channelId: readEnv('YOUTUBE_CHANNEL_ID') ?? 'UC13c-XRmRlkWpp6WMG9SDjw' };
};
```

- [ ] **Step 2: Orchestrator** `run-sync.ts` loads existing videos and topics (paginated `find`, `overrideAccess: true`, `depth: 0`, `select` only the fields it needs), calls `client.listUploadIds` then `client.getVideos`, `planSync`, `applyPlan`, and returns the counts. Constructor-inject `client` and `payload` so it is testable with the fakes from Tasks 5 and 7. Add a test that runs it end to end with a fake client and fake payload and asserts the counts line up with the plan.

- [ ] **Step 3: Task** (mirror `refresh-crux.ts`, including the loud log when the key is missing):

```ts
import type { TaskConfig } from 'payload';

import { resolveYoutubeCredentials } from '../lib/integrations/credentials';
import { createYoutubeClient } from '../lib/videos/youtube-client';
import { runYoutubeSync } from '../lib/videos/run-sync';

/**
 * Hourly at minute 7 UTC: imports new public YouTube uploads as needs-review
 * drafts and refreshes the synced snapshot of existing ones. No-op without
 * YOUTUBE_API_KEY (logged, not silent). Gated by PAYLOAD_AUTO_RUN.
 */
export const syncYoutubeVideosTask: TaskConfig<'syncYoutubeVideos'> = {
  slug: 'syncYoutubeVideos',
  retries: 1,
  schedule: [{ cron: '7 * * * *', queue: 'youtubeVideosSync' }],
  handler: async ({ req }) => {
    const creds = resolveYoutubeCredentials();
    if (!creds) {
      req.payload.logger.warn('syncYoutubeVideos skipped: YOUTUBE_API_KEY is not set');
      return { output: { skipped: 'no-api-key' } };
    }
    const result = await runYoutubeSync({
      payload: req.payload as unknown as Parameters<typeof runYoutubeSync>[0]['payload'],
      client: createYoutubeClient({ apiKey: creds.apiKey }),
      channelId: creds.channelId,
      autoPublish: process.env.VIDEOS_AUTO_PUBLISH === 'true',
    });
    return { output: result };
  },
};
```

- [ ] **Step 4: Register** in `payload.config.ts`: import, add `syncYoutubeVideosTask` to `jobs.tasks`, and add to `autoRun`:

```ts
      {
        cron: '7 * * * *', // hourly at :07 UTC, YouTube channel sync (new uploads become needs-review drafts)
        queue: 'youtubeVideosSync',
      },
```

- [ ] **Step 5: Env plumbing.** Add `YOUTUBE_API_KEY=`, `YOUTUBE_CHANNEL_ID=`, `VIDEOS_AUTO_PUBLISH=` (with a comment) to `apps/cms/.env.example`. In `.github/workflows/deploy-cms.yml` add `YOUTUBE_API_KEY: ${{ secrets.YOUTUBE_API_KEY }}` beside `CRUX_API_KEY` (line ~167) and `echo "YOUTUBE_API_KEY=${YOUTUBE_API_KEY}"` beside line ~258. The deploy re-renders `/opt/cleanstart/.env` from these on every run, so editing the file on the droplet does not survive (see the Email section of `CLAUDE.md`, which documents the same re-render behaviour). Someone with repo admin adds the GitHub secret; this is decision 2.

- [ ] **Step 6: Regenerate types, update docs, gate**

```bash
pnpm --filter @cleanstart/cms generate:types
pnpm --filter @cleanstart/cms lint && pnpm --filter @cleanstart/cms typecheck && pnpm --filter @cleanstart/cms test
```
Add a row to the Background jobs table in `CLAUDE.md` (thirteen tasks, `syncYoutubeVideos`, hourly :07, `jobs/sync-youtube-videos.ts`).

- [ ] **Step 7: Commit**

```bash
git add apps/cms/src/payload/lib/videos apps/cms/src/payload/jobs/sync-youtube-videos.ts apps/cms/src/payload.config.ts apps/cms/src/payload/lib/integrations/credentials.ts apps/cms/.env.example .github/workflows/deploy-cms.yml CLAUDE.md apps/cms/src/payload-types.ts
git commit -m "feat(cms): hourly YouTube video sync task"
```

### Task 9: Publish gate for videos

**Files:**
- Modify: `apps/cms/src/payload/hooks/publish-gate.ts`, `apps/cms/src/payload/lib/wire-publish-gate.ts`, the publish-gate test (find it with `rg -l runPublishChecks apps/cms/src`)

- [ ] **Step 1: Failing test** asserting that `runPublishChecks({ title: 'X', summary: '' }, 'videos')` returns blockers `video-format`, `video-topics`, `video-summary`, and that a complete doc returns none of them failing.

- [ ] **Step 2: Add `'videos'` to `GATED_SLUGS`** in `wire-publish-gate.ts`.

- [ ] **Step 3: Add the checks** inside `runPublishChecks`, after the existing checks:

```ts
  if (collectionSlug === 'videos') {
    const topics = Array.isArray(data.topics) ? data.topics : [];
    const summary = resolveString(data.summary);
    checks.push(
      {
        id: 'video-format',
        label: 'Format chosen',
        severity: 'blocker',
        pass: resolveString(data.format) != null,
        message: resolveString(data.format) != null ? null : 'Choose Explainer, Product demo or Talk.',
      },
      {
        id: 'video-topics',
        label: 'At least one topic',
        severity: 'blocker',
        pass: topics.length > 0,
        message: topics.length > 0 ? null : 'Add at least one topic so the video shows up in the topic filter.',
      },
      {
        id: 'video-summary',
        label: 'Summary written',
        severity: 'blocker',
        pass: summary != null,
        message: summary != null ? null : 'Write the one or two sentence summary shown on cards and in search results.',
      },
    );
  }
```

- [ ] **Step 4: Run the gate tests, commit** (`feat(cms): publish checks for videos`).

### Task 10: Optional, a Teams notification for new imports

Small and independently shippable. Skip if Teams alerts are not wanted.

- [ ] Add `'videos.imported'` to `WebhookEventName` in `lib/webhooks/dispatch.ts`, add a card builder in `teams.ts` (title "N new videos need review", link to `/admin/collections/videos?where[syncState][equals]=needs-review`), and call `dispatchEvent` at the end of `runYoutubeSync` when `created > 0`. Wrap in try/catch so a Teams outage never fails the sync. Test the card builder in `teams.test.ts`.

### Task 11: Backfill script and seed data

**Files:**
- Create: `apps/cms/scripts/seed-videos-from-catalog.ts`, `apps/cms/scripts/data/videos-catalog.json`

The CMS app cannot import from `apps/web`, so the catalog is exported once to JSON (the one-time conversion is a throwaway `tsx` one-liner over `apps/web/src/lib/videos-catalog.ts`, committed as data, not as a dependency).

- [ ] **Step 1: Export the catalog to JSON** (`id`, `slug`, `title`, `format`, `topics`, `summary`) plus the 11 topics with `aliases` seeded from the real hashtags already used in the video descriptions (`sbom`, `vex`, `cves`, `containersecurity` maps to no topic on purpose).

- [ ] **Step 2: Script behaviour** (follow `backfill-resource-type.ts` conventions: dry run by default, `--apply` to write, idempotent, no `.env` read, runs with `/app/node_modules/.bin/tsx` in the container):
  1. Upsert `videoTopics` by slug (slug equals the old id so `?topic=` URLs keep working).
  2. For each catalog entry, find the `videos` doc by `externalId`. If the sync already created it (drafts exist after rollout step 2), update it with the catalog's `slug`, `title`, `format`, `topics`, `summary`, set `syncState: 'synced'`, and publish. If it does not exist, create it with `source` fetched live from the YouTube API so `contentHash` matches what the sync will compute (otherwise the next sync would see a spurious change).
  3. Print a table of created, updated, unchanged, and any slug conflict. A slug conflict (the doc already has a different slug) aborts the run; never silently renumber.
  4. After writing, call `revalidateWeb` itself and wait for it. A script that ends in `process.exit` kills the hook's deferred purge timer (memory `prod-script-skips-deferred-purge`), which is why prod once served stale pages after a backfill.

- [ ] **Step 3: Test the planning half** with a fixture (pure function that decides create versus update versus conflict), `seed-videos-from-catalog.test.ts`.

- [ ] **Step 4: Dry run locally against the scratch DB**, read the report, then `--apply`, then open the admin and spot check five videos.

- [ ] **Step 5: Commit** (`feat(cms): backfill script that moves the video catalog into the CMS`).

### Task 12: Web reads the CMS, behind a switch

**Files:**
- Create: `apps/web/src/lib/videos-cms.ts`, `videos-cms.test.ts`
- Modify: `apps/web/src/lib/videos.ts`, `videos-utils.ts`, `videos-catalog.ts`, `VideosBrowser.tsx`, `app/videos/page.tsx`, `app/videos/[slug]/page.tsx`

- [ ] **Step 1: Make topics data, not constants.** `videos-utils.ts` currently imports `VIDEO_TOPICS` as a constant. Change `Video.topics` to `readonly { slug: string; label: string }[]`, make `topicLabel` read from the video's own topic objects, and make `parseVideoFilters(read, knownTopicSlugs)` validate against the list passed in. Update `videos-utils.test.ts` first (the existing 26 tests are the safety net) so it fails, then fix the code. `VideosBrowser` receives `topics` (the taxonomy, with counts) as a prop from the server page.

- [ ] **Step 2: CMS reader with a mapping test.**

```ts
// apps/web/src/lib/videos-cms.ts
import { fetchCMS } from "./cms-fetch";
import type { Video } from "./videos-utils";

type CmsTopic = { slug: string; name: string };
type CmsVideo = {
  id: number | string;
  slug: string;
  title: string;
  externalId: string;
  format?: "explainer" | "demo" | "talk" | null;
  topics?: (CmsTopic | number | string)[] | null;
  summary?: string | null;
  source?: {
    description?: string | null;
    durationSeconds?: number | null;
    publishedAt?: string | null;
    hasMaxres?: boolean | null;
  } | null;
  publishedAt?: string | null;
};
type CmsList = { docs: CmsVideo[] };

export const mapCmsVideo = (doc: CmsVideo): Video => ({
  id: doc.externalId,
  slug: doc.slug,
  title: doc.title,
  format: doc.format ?? null,
  topics: (doc.topics ?? []).filter((t): t is CmsTopic => typeof t === "object").map((t) => ({ slug: t.slug, label: t.name })),
  publishedAt: doc.source?.publishedAt ?? doc.publishedAt ?? "",
  durationSeconds: doc.source?.durationSeconds ?? undefined,
  summary: doc.summary ?? "",
  description: doc.source?.description ?? doc.summary ?? "",
  thumb: doc.source?.hasMaxres === false ? "hq" : "maxres",
});

export async function getCmsVideos(): Promise<Video[]> {
  const params = new URLSearchParams({
    "where[_status][equals]": "published",
    sort: "-source.publishedAt",
    depth: "1",
    limit: "200",
  });
  // Throws on failure on purpose: during ISR revalidation Next then keeps serving the last good page
  // instead of caching an empty listing.
  const data = await fetchCMS<CmsList>(`/api/videos?${params.toString()}`, { tags: ["videos"] });
  return data.docs.filter((d) => d.slug && d.externalId).map(mapCmsVideo);
}
```
Tests: mapping with populated topics, with unpopulated ids (dropped), with `hasMaxres: false` giving `"hq"`, with a missing duration, and an assertion that a `fetchCMS` rejection propagates (not swallowed).

- [ ] **Step 3: The switch** in `lib/videos.ts`:

```ts
import { getCmsVideos } from "./videos-cms";

const usesCms = (): boolean => process.env.VIDEOS_SOURCE === "cms";

export async function getVideos(): Promise<Video[]> {
  if (usesCms()) return getCmsVideos();
  const feed = await getChannelVideos(FEED_LIMIT);
  return mergeVideos(VIDEO_CATALOG, feed);
}
```
Everything else (cards, filters, watch page, JSON-LD) keeps working because `Video` keeps its shape. That is the point of mapping at the edge.

- [ ] **Step 4: Run the whole web gate** with `VIDEOS_SOURCE` unset (catalog) and again with it set to `cms` against a local CMS containing the backfilled data. Both must pass the 26-check browser suite from this session (kept at `scratchpad/live/interact.cjs`; copy it into `apps/web/tests/e2e/videos.spec.ts` as part of this task so it lives in the repo).

- [ ] **Step 5: Commit** (`feat(web): read /videos from the CMS behind VIDEOS_SOURCE`).

### Task 13: Web wiring

**Files:** `apps/web/src/app/sitemap.ts`, `lib/detail-route-not-found-guard.ts`, `app/preview/[collection]/[slug]/page.tsx`, `components/search/search-ui.tsx`

- [ ] **Sitemap:** with the CMS as source, read published videos through the existing `fetchDocs('videos', BLOG_FILTER)` helper (like `advisories`) instead of `getVideos()`, so noindex flags and `contentUpdatedAt` lastmod apply. Extend `sitemap.test.ts`: indexable video listed with its real `lastmod`, a `seo.indexable = noindex` video dropped. Keep the catalog branch while the switch exists.
- [ ] **404 guard:** add the `/videos/` row to `DETAIL_ROUTES` (section 5). Add a test in the guard's test file for an unknown video slug.
- [ ] **Preview:** register a `renderVideoDetail` in the preview route map, exactly like `advisories: renderAdvisoryDetail`, so editors can preview a draft at `/preview/videos/<slug>`.
- [ ] **Search UI:** add an icon and accent for `videos` in `search-ui.tsx`.
- [ ] **Gate and commit.**

### Task 14: Cutover, verification and rollback drill

- [ ] Add a "Videos CMS cutover" entry to `docs/operations/PRODUCTION-ROLLOUT.md` containing the rollout order from section 7 verbatim, the backfill command with `--apply`, and the rollback line.
- [ ] Add the three env vars to `docs/operations/CMS-DEPLOYMENT.md`.
- [ ] **Parity check before the flip** (script committed under `apps/web/scripts/compare-videos-sources.mjs`): fetch the list from both sources and assert same count, same slugs, same titles, same topic slugs, same order. Any difference blocks the flip.
- [ ] **After the flip, verify on production:** `/videos` returns 200 with 15 cards in the static HTML (`curl | grep -c 'href="/videos/'`), every existing URL still returns 200, `sitemap.xml` lists all 15, one watch page has `VideoObject` JSON-LD, an unknown slug is a real 404.
- [ ] **Drill the rollback once:** set `VIDEOS_SOURCE=catalog`, redeploy, confirm the site is unchanged, flip back. Do this before declaring done, not during an incident.
- [ ] **Editor acceptance:** a marketing editor, with the checklist only, publishes one imported draft end to end (set format, confirm topics, write summary, publish) and sees it live within five minutes without a developer.

### Task 15 (PR 4, after one week): Remove the dual path

- [ ] Delete `videos-catalog.ts`, the `VIDEOS_SOURCE` switch, `mergeVideos` and its tests, the RSS dependency in `videos.ts` (keep `youtube-feed.ts` only if `/podcast` still uses it, which it does), and the catalog JSON seed after confirming prod is populated. Update `WEB-PAGES.md` and the project memory note.

---

## 9. Testing strategy

| Layer | What | How |
|---|---|---|
| Pure logic | duration parsing, topic suggestion, `planSync`, mapping | Vitest, no I/O. Every branch in section 3's D5 to D7 has a test. |
| Boundary | YouTube client | fake `fetch`, schema failure, error text never contains the key, batching, page cap |
| Shell | `applyPlan`, `runYoutubeSync` | fake payload, per-item failure isolation |
| Schema | collections | snapshot tests (`schema-surface`), migration applied to two clones and `pg_dump` diffed, run twice |
| Web | mapping, source switch, sitemap, guard | Vitest, plus a regression that a CMS failure throws |
| End to end | the 26 browser checks and axe | Playwright against a local CMS with the backfill applied, in both source modes |
| Real API | one live smoke | run the sync once with a real key against the real channel in a non-prod DB and eyeball the drafts |

The sync is never tested against production data until the dry-run output has been read by a human.

---

## 10. Risks and mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Hand-written migration drifts from what Payload expects (2026-06-24 incident class) | Medium | High (admin 500) | Task 4 method: push to clone A, transcribe, apply to clone B, `pg_dump` diff empty, second run no-op. Include `payload_locked_documents_rels`. |
| API key leaks into logs or errors | Low | High | Client never forwards underlying error text, test asserts it, key lives only in env and GitHub secrets, key restricted to the YouTube Data API. |
| Quota exhaustion | Very low | Medium | About 3 units per hourly run against 10,000 per day. First full backfill is under 10 units. |
| Sync overwrites editor work | Medium if designed carelessly | High | D6: sync writes only `source` and `syncState`. Tested by `applyPlan` "writes only the source group". |
| A video is deleted or made private on YouTube | Medium | Medium | Flagged `missing`, shown in the admin, not auto-unpublished (editor decides). Only flagged when the listing was complete. |
| Slug changes after publish | Medium | High (lost rankings) | Slug is not synced, backfill preserves all 15, `slugChangeRedirectHook` writes a redirect on edits. |
| CMS down during an ISR revalidation caches an empty page | Medium | High | Task 12: `getCmsVideos` throws; Next keeps the last good page. Tested. |
| Cutover regression visible to visitors | Medium | High | `VIDEOS_SOURCE` switch, parity script, rollback drill, one-week soak before deleting the old path. |
| Custom Studio admin (feat/studio-build) does not know the new collection | Medium | Medium | Before PR 1 merges, check `docs/studio/` for any per-collection registration the Studio build requires, and coordinate order with whoever owns that branch. |
| Sibling sessions edit the same registry files (this checkout is shared) | High | Low | Stage explicit paths only, commit with `-- <pathspec>`, never `git add -A` at the root (memory `concurrent-sessions-share-checkout`). |
| Production build flakiness from the live CMS (520s seen this session) | Medium | Low | Retry the build; do not treat a CMS timeout on unrelated routes as a failure of this change. |

---

## 11. Definition of done

- [ ] Marketing can add, edit, recategorise and unpublish a video and a topic in the admin, with no developer.
- [ ] A new YouTube upload appears as a `needs-review` draft within an hour, with duration, description, thumbnail frame, summary and suggested topics filled in.
- [ ] Publishing requires format, topic and summary; the checklist says what is missing.
- [ ] All 15 existing URLs return 200, with identical slugs, titles and topics.
- [ ] `/videos` and `/videos/[slug]` update within seconds of a publish (on-demand revalidation), not after a deploy.
- [ ] Sitemap, search index and IndexNow include videos; unpublished videos 404.
- [ ] `VIDEOS_SOURCE` rollback drilled once.
- [ ] Lint, typecheck, tests, build, `verify:copy`, `verify:page-registry` green; migration proven on two clones.
- [ ] `CLAUDE.md` jobs table, `WEB-PAGES.md`, rollout and deployment docs updated; memory note updated.

---

## 12. Plan 2 outline (separate document, not started)

| Item | Approach | Needs |
|---|---|---|
| Vimeo or uploaded video | `provider` already exists. Add a `getEmbed(video)` adapter used by `VideoPlayer`, `videoObjectSchema` and the CSP (`frame-src player.vimeo.com`, `img-src i.vimeocdn.com`). Import by pasting a URL (oEmbed, no token) first; API sync only if they upload at volume. For true uploads without Vimeo, Cloudflare Stream is the natural fit. | Decision 3, an account, a token stored via the existing Integrations secrets pattern (`lib/integrations/secrets.ts`) |
| Transcripts | Field exists. Render on the watch page, emit `VideoObject.transcript`. Source: pasted by editors, or generated from the audio later. YouTube's caption download needs the channel owner's OAuth, so it is not part of this. | Product decision |
| Chapters and key moments | Parse timestamp lines (the parser already groups them) into `hasPart` `Clip` entries for Google key moments. | none |
| Video sitemap | `/video-sitemap.xml` with `<video:video>` entries, added to `robots.txt`. | none |
| Like button | Not planned. YouTube offers no embed for it; a real in-page like needs a Google OAuth client and app verification. Decided against on 2026-10-23. | n/a |

---

## Self-review

**Spec coverage.** Editors change videos and categories without a deploy: Tasks 1 to 3, 9. Automatic import of new uploads with useful metadata: Tasks 5 to 8. "How does it work and is it automatic": section 2 and the Task 8 cadence. Existing URLs preserved: D11, Task 11, Task 14 parity. Vimeo and direct upload: designed for (D2), delivered in Plan 2 with the decision called out. Safety and rollback: D10, section 7, Task 14.

**Placeholder scan.** Tasks 3, 4 and 8 name the exact files and commands but do not reproduce the roughly 45 one-line registry edits or the roughly 400 lines of generated DDL. That is deliberate: the registry edits are found mechanically with the `rg` command in section 5 against the Advisories commit, and the DDL must be transcribed from a real Payload push (Task 4 Step 2), because inventing it here would be wrong in the way that took the admin down in June. Task 12 Step 1 describes the `videos-utils` refactor rather than printing the diff because the existing 26 tests define it; write them red first.

**Type consistency.** `SourceSnapshot`, `SyncPlan`, `ExistingVideo`, `TopicRef`, `YoutubeVideo` are defined in Tasks 5 and 6 and used unchanged in Tasks 7 and 8. The web `Video` shape is unchanged except `topics` becoming `{ slug, label }[]` (Task 12 Step 1), and `mapCmsVideo` returns exactly that. `syncState` values match between the collection (Task 2), the planner (Task 6) and the shell (Task 7). The task slug `syncYoutubeVideos` and queue `youtubeVideosSync` are used identically in Task 8's three places.

**Known limits stated, not hidden.** `autoPublish` cannot actually publish until a format rule is agreed (Task 7 note). Whether `schemaAddons` is required is verified rather than assumed (Task 2 Step 5). The Studio admin interaction is a flagged risk, not a solved one.
