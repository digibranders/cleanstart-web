# CMS Audit — Prioritized Fix Plan

Derived from the full CMS audit (backend, ui, crosscut). Organized strictly by severity. Within each priority band, items are grouped by area. P0 is sequenced so the `@payloadcms/ui` hook-API / ColumnPicker provider fixes come first.

---

## P0 — Critical (runtime breakage / security)

### Custom list view / @payloadcms/ui hook wiring

- [ ] **ColumnPicker: setActiveColumns is not a function — TableColumnsProvider never mounted** (critical · small · ui-list-view / crosscut-config-wiring) — **Files:** `apps/cms/src/payload/admin/components/views/list/ColumnPicker.tsx:19`, `apps/cms/src/payload/admin/components/views/list/CmsListView.tsx`. **Root cause:** CmsListView replaces DefaultListView (which mounts TableColumnsProvider); the RSC list pipeline only wraps the custom component in ListQueryProvider, so `useTableColumns()` returns the empty `createContext({})` default and `setActiveColumns` is undefined. **Fix:** 1) In CmsListView, wrap the content (or drawer body) in `<TableColumnsProvider collectionSlug={collectionSlug} columnState={columnState}>`; it sits inside the existing ListQueryProvider so its `refineListData` dependency is satisfied. 2) In ColumnPicker switch from `setActiveColumns(next)` to `toggleColumn(col.accessor)` (setActiveColumns cannot deactivate columns). 3) Optionally read live `columns` from context for the checkbox `checked` state. 4) Update the @payloadcms/ui allow-list note to permit TableColumnsProvider as a data/context provider (mirrors SelectionProvider). **Verify:** Open the Columns drawer on any collection list view and toggle a checkbox — no TypeError, column visibility updates.

### Endpoints / rate limiting

- [ ] **checkAndRecord() always truthy — five endpoints permanently return 429** (critical · trivial · endpoints / collections-ops) — **Files:** `apps/cms/src/payload/endpoints/integrations-inbound.ts:103`, `integrations-inbound.ts:235`, `apps/cms/src/payload/endpoints/leads-dsar.ts:54`, `leads-dsar.ts:114`, `apps/cms/src/payload/endpoints/retry-lead-sync.ts:62`. **Root cause:** `checkAndRecord()` returns a `RateLimitResult` object (always truthy); `if (limited)` therefore always rejects with 429. Cal.com webhook, Brevo bounce webhook, DSAR find/delete, and retry-lead-sync are 100% non-functional. **Fix:** 1) Replace `if (limited)` with `if (!limited.ok)` at all five call sites. 2) Inside the narrowed block, optionally add `retryAfterSeconds: Math.ceil(limited.retryAfterMs / 1000)` to the 429 body (only valid where `limited` is narrowed to the `{ ok: false }` variant). **Verify:** Hit each endpoint within limits and confirm a 2xx/expected response; confirm 429 only fires after exceeding the configured budget.

### Background jobs / cron scheduling

- [ ] **Five cron tasks never auto-queue — schedule property missing from TaskConfig** (critical · trivial · jobs) — **Files:** `apps/cms/src/payload/jobs/drain-lead-queue.ts:33`, `apps/cms/src/payload/jobs/retry-webhook.ts`, `apps/cms/src/payload/jobs/analytics-cache-prune.ts:14`, `apps/cms/src/payload/jobs/dashboard-refresh-frequent.ts`, `apps/cms/src/payload/jobs/dashboard-refresh-daily.ts`. **Root cause:** Payload's `handleSchedules` only queues tasks whose `TaskConfig.schedule` is non-empty; these five tasks have autoRun entries in payload.config.ts but no `schedule`, so they are never enqueued and `jobs.run` finds an empty queue. The lead R2 fallback drain, webhook dead-letter retry, analytics prune, and both dashboard refreshes never fire. **Fix:** Add the `schedule` array to each TaskConfig, matching the autoRun cron cadence: drainLeadQueue `*/5 * * * *` (queue `leadQueueDrain`); retryWebhook `*/5 * * * *` (queue `webhookRetry`); analyticsCachePrune `0 7 * * *`; dashboardRefreshFrequent `*/15 * * * *`; dashboardRefreshDaily `0 6 * * *`. Mirror the working pattern in purgeSearchLog/checkBrokenLinks/reindexMeili. autoRun entries stay as-is. **Verify:** Boot with `PAYLOAD_AUTO_RUN=true`; confirm each queue enqueues a job on its tick (Payload jobs admin / logs) and the handlers run.

---

## P1 — High

### Collections / taxonomy-media

- [ ] **video/mp4 and zip uploads get .bin extension** (high · trivial · collections-taxonomy-media) — **Files:** `apps/cms/src/payload/lib/media-filename.ts:66-73`. **Root cause:** `PASSTHROUGH_MIME_TO_EXT` lacks video/zip MIME types; `canonicalExtensionForMime` falls through to `'bin'`, so MP4/ZIP files are stored unservable in R2 and DB. **Fix:** 1) Add `'video/mp4' → 'mp4'`, `'application/zip' → 'zip'`, `'application/x-zip-compressed' → 'zip'` to `PASSTHROUGH_MIME_TO_EXT`. 2) Add a test asserting every non-image entry in `ALLOWED_MIME_TYPES` (upload-limits.ts) has an explicit mapping so `canonicalExtensionForMime` never returns `'bin'` for an allow-listed type. **Verify:** Upload an MP4 and a ZIP; confirm stored filename/URL keeps `.mp4`/`.zip` and the file is downloadable.

### Endpoints / security

- [ ] **media-ingest-url SSRF bypass via redirect chain** (high · small · endpoints / lib-core) — **Files:** `apps/cms/src/payload/endpoints/media-ingest-url.ts:129`. **Root cause:** Guard checks only the initial hostname then fetches with `redirect: 'follow'`, so a public URL redirecting to `169.254.169.254`/internal hosts bypasses the check; the inline `isForbiddenHost` is also weaker than the shared guard (no IPv6 loopback/ULA/link-local, IPv4-mapped forms). **Fix:** 1) Replace inline `isForbiddenHost` with `isSafePublicHttpUrl` from `lib/url-safety/ssrf-guard.ts`. 2) Switch to `redirect: 'manual'` and re-check each hop's Location hostname, capping at MAX_REDIRECT_HOPS, mirroring `lib/canonical-check.ts`. 3) Extract the manual-redirect loop to a shared `lib/url-safety/follow-with-ssrf-guard.ts` so canonical-check can reuse it. **Verify:** Attempt ingest of a URL that 3xx-redirects to an internal/metadata IP — confirm rejection; legitimate public images still ingest.

### Endpoints / GDPR

- [ ] **DSAR find/delete full-table scan without pagination** (high · small · endpoints / ui-auth-misc / collections-ops) — **Files:** `apps/cms/src/payload/endpoints/leads-dsar.ts:64`, `leads-dsar.ts:131`. **Root cause:** Both endpoints fetch `limit: 1000` with no pagination, then filter email in memory; beyond 1000 leads, Art. 15 finds and Art. 17 erasures silently miss records. **Fix:** 1) Collect ALL matching rows first via a `hasNextPage` loop (or `pagination: false`) — do NOT delete inside the page loop (offset shift skips rows). 2) Keep the existing in-memory `matchesEmail` filter — the email field name varies per form (extractEmail walks field defs), so a `where: { 'fields.email' }` clause would regress correctness and is not queryable on the json column anyway. 3) Long-term: add an indexed normalized email column to Leads. **Verify:** Seed >1000 leads with a target email beyond row 1000; confirm find returns it and delete removes it.

### SEO / JSON-LD route prefixes

- [ ] **ROUTE_PREFIX blogs emits /blog but web serves /blogs** (high · trivial · lib-seo-jsonld) — **Files:** `apps/cms/src/payload/lib/route-prefixes.ts:18`. **Root cause:** `blogs: '/blog'` (singular) drives JSON-LD `@id`/`@url`, sitemap loc, and IndexNow pings, but the route is `/blogs/[slug]`, producing crawlable 404s. **Fix:** 1) Change to `blogs: '/blogs'`. 2) Align tests (sitemap.test.ts:56, indexnow-publish.test.ts:59, slug-change-redirect.test.ts, dispatch.test.ts:44). 3) Consider a one-shot migration to rewrite already-persisted `/blog/<slug>` redirect rows to `/blogs/`. **Verify:** Render a blog's JSON-LD and sitemap entry; confirm `/blogs/<slug>` matches the live page.

- [ ] **ROUTE_PREFIX resources emits /resource but web serves /resources** (high · trivial · lib-seo-jsonld) — **Files:** `apps/cms/src/payload/lib/route-prefixes.ts:20`. **Root cause:** `resources: '/resource'` (singular) drives DigitalDocument `@id` and sitemap loc; web route is `/resources/[slug]`. **Fix:** 1) Change to `resources: '/resources'`. 2) Reconcile the entire ROUTE_PREFIX map against real apps/web segments (and resources-insights.ts hrefs) while in the file. 3) Fix the stale header comment. **Verify:** Resource JSON-LD `@id` and sitemap loc resolve to live `/resources/<slug>`.

- [ ] **ROUTE_PREFIX events emits /events but web serves /event** (high · trivial · lib-seo-jsonld) — **Files:** `apps/cms/src/payload/lib/route-prefixes.ts:21`. **Root cause:** `events: '/events'` (plural) drives the Event `@id`; web detail route is `/event/[slug]` (singular), so rich-result links and sitemap entries 404. **Fix:** 1) Change to `events: '/event'`. 2) Confirm sitemap per-doc URL generation (collect.ts) consumes ROUTE_PREFIX for detail URLs. 3) Update dispatch.test.ts:348 (and grep for other `/events/` assertions). 4) Set the breadcrumb intermediate "Events" crumb (dispatch.ts:465) to `/events` (plural listing) while the leaf stays `/event/<slug>`. 5) Fix the stale comment at route-prefixes.ts:9. **Verify:** Event JSON-LD `@id` is `/event/<slug>`; breadcrumb listing crumb points at `/events`; editor preview resolves.

---

## P2 — Medium

### Collections — content

- [ ] **Guides PermalinkField hardcodes /guides vs /guide** (medium · trivial · collections-content) — **Files:** `apps/cms/src/payload/collections/Guides.ts:226`. **Root cause:** `clientProps: { pathPrefix: '/guides' }` (plural) while `ROUTE_PREFIX.guides = '/guide'` and the route is `/guide/[slug]`; the admin permalink chip shows a 404-able URL. **Fix:** Import ROUTE_PREFIX and set `clientProps: { pathPrefix: ROUTE_PREFIX.guides }`. **Verify:** A published guide's permalink chip shows `/guide/<slug>`.

- [ ] **Guides seoSidebarFields descriptionSource references nonexistent abstract field** (medium · small · collections-content) — **Files:** `apps/cms/src/payload/collections/Guides.ts:234`. **Root cause:** `descriptionSource: 'abstract'` but Guides has no `abstract` field, so SEO description auto-sync always reads undefined and the SEO health score flags every guide. **Fix:** 1) Add an `abstract` textarea after slugField (mirror Blogs.ts:50). 2) Run a Payload migration + `payload generate:types`. **Verify:** Set an abstract on a guide; confirm seo.description auto-populates and placeholder clears.

- [ ] **Pages seoSidebarFields references nonexistent abstract field** (medium · small · collections-content) — **Files:** `apps/cms/src/payload/collections/Pages.ts:187`. **Root cause:** `descriptionSource: 'abstract'` with no `abstract` field on Pages; auto-sync never engages. **Fix:** Add a summary/abstract textarea to Pages and point descriptionSource at it (do NOT fall back to `'title'`). Apply the same fix to Jobs.ts:239 in the same pass. **Verify:** Page abstract drives seo.description auto-sync.

- [ ] **Events missing searchSync/webhooksPublish/indexNow/afterDelete hooks** (medium · trivial · collections-content) — **Files:** `apps/cms/src/payload/collections/Events.ts:280`. **Root cause:** afterChange wires only slugChangeRedirect + schemaOverrideAudit; events are absent from site search, Teams, IndexNow, and never purged from Meili on delete. **Fix:** 1) Add `searchSyncAfterChangeHook('events')`, `webhooksPublishAfterChangeHook('events')`, `indexNowPublishAfterChangeHook('events')` to afterChange; add `afterDelete: [searchSyncAfterDeleteHook('events')]`; import the hooks. 2) Confirm buildSearchDocument supports the events schema (eventStatus lifecycle). **Verify:** Publish/delete an event; confirm it appears/disappears in search and Teams/IndexNow fire.

- [ ] **Webinars missing searchSync/webhooksPublish/indexNow/afterDelete hooks** (medium · trivial · collections-content) — **Files:** `apps/cms/src/payload/collections/Webinars.ts:237`. **Root cause:** Same gap as Events; real-time publish sync, Teams, IndexNow, and delete-purge are missing (daily reindex only upserts). **Fix:** Add the three afterChange hooks for `'webinars'` and `afterDelete: [searchSyncAfterDeleteHook('webinars')]`; add the missing imports (mirror Blogs.ts:19-25). **Verify:** Publish/delete a webinar; confirm search + notifications behave.

- [ ] **PodcastEpisodes missing redirect/search/webhook/indexNow/audit/afterDelete + all SEO fields** (medium · small · collections-content / fields-defs) — **Files:** `apps/cms/src/payload/collections/PodcastEpisodes.ts:175`. **Root cause:** Only stamp/firstPublish/displayPublishedAt hooks wired; no slug redirect, search, webhook, indexNow, schema audit, afterDelete, or seoSidebarFields. **Fix:** 1) Add slugChangeRedirect + schemaOverrideAudit + afterDelete. 2) Add `'podcastEpisodes'` to `SEARCH_INDEXED_COLLECTIONS` (index-schema.ts) and ensure buildSearchDocument can build a doc — otherwise searchSync is a no-op. 3) Podcast route is `/podcast/episode/[slug]` (PODCAST_PREFIX) — add a special case in `docCanonicalUrl`/`collectionUrlFromDoc`/indexNow resolver rather than a flat ROUTE_PREFIX entry. 4) Add seoSidebarFields + seoFieldsForSidebar (abstract already exists). **Verify:** Episode is searchable, canonical URL is `/podcast/episode/<slug>`, SEO sidebar present.

- [ ] **Guides and KnowledgeBase TOC permanently H2-only (no tocDepth selector)** (medium · small · collections-content) — **Files:** `apps/cms/src/payload/collections/Guides.ts:292`, `KnowledgeBase.ts`. **Root cause:** tableOfContents passed to bodyStatsHook without a tocDepth field or `tocLevelsField`, so the hook defaults to `[2]`. **Fix:** Copy the tocDepth select (Blogs.ts:217-229) into both collections and pass `tocLevelsField: 'tocDepth'` to bodyStatsHook. **Verify:** An H3-structured guide renders sub-headings in its TOC.

- [ ] **Events startsAt not required** (medium · trivial · collections-content) — **Files:** `apps/cms/src/payload/collections/Events.ts:43`. **Root cause:** No `required: true`; publishing without a start date breaks Schema.org Event, endsAt validation, post-event CTA, and the status-timestamps hook. **Fix:** Add `required: true` to startsAt; for Webinars add a validate requiring startsAt unless `webinarType === 'on-demand'`. **Verify:** Cannot publish an event without a start date.

- [ ] **Webinars endsAt missing start/end ordering validation** (medium · trivial · collections-content) — **Files:** `apps/cms/src/payload/collections/Webinars.ts:78`. **Root cause:** No validate on endsAt (Events has one); a webinar can save with end before start. **Fix:** Extract Events.ts:51-64 into a shared `validateEndsAfterStarts` helper and apply to Webinars endsAt. **Verify:** Saving endsAt before startsAt is rejected on both collections.

- [ ] **pagesPathBuilderHook throws bare Error (editor sees 500)** (medium · trivial · collections-content / access-hooks) — **Files:** `apps/cms/src/payload/hooks/pages-path-builder.ts:56`. **Root cause:** Cycle/depth guards throw `new Error(...)`, which Payload 3 surfaces as a generic 500 toast rather than a field validation message. **Fix:** Import `ValidationError` from `payload`; throw `new ValidationError({ errors: [{ message, path: 'parent' }] })` (mirror publish-gate.ts:171). Also fix the JSDoc at line 30. **Verify:** Creating a parent cycle shows an inline field error, not a 500.

- [ ] **Webinars registrationUrl validate blocks on-demand save** (medium · small · collections-content) — **Files:** `apps/cms/src/payload/collections/Webinars.ts:109`. **Root cause:** On-demand defaults to `registrationMode: 'external'`; the registrationUrl validate fires regardless of webinarType, blocking first save. **Fix:** Add `if (siblingData?.webinarType === 'on-demand') return true;` guard to both registrationUrl and registrationForm validates (or relax required for on-demand). **Verify:** An on-demand webinar saves without a registration URL.

- [ ] **schemaAddonsField hidden:true makes Layer 2 schema UI unreachable** (medium · medium · collections-content / fields-defs) — **Files:** `apps/cms/src/payload/fields/schema-addons.ts:302`. **Root cause:** Field is `admin: { hidden: true }` pending a per-block rendering fix; no editor can create HowTo/Video/Review/etc. add-ons. **Fix:** Track in BACKLOG.md; when SchemaPreviewField rendering is fixed, flip `hidden: false` simultaneously. **Verify:** After the rendering fix, editors can add/edit schema add-on blocks.

### Collections — taxonomy / media

- [ ] **Taxonomy cycle-guard throws bare Error** (medium · trivial · collections-taxonomy-media / access-hooks) — **Files:** `apps/cms/src/payload/hooks/taxonomy-parent-cycle-guard.ts:43-57`. **Root cause:** Bare `throw new Error` yields a 500 + generic toast instead of an inline field error. **Fix:** Throw `new ValidationError({ errors: [{ message, path: 'parent' }] })` at all three sites; update tests if needed. **Verify:** A taxonomy parent cycle shows an inline error.

- [ ] **Media.ts size-check throws bare Error** (medium · trivial · collections-taxonomy-media) — **Files:** `apps/cms/src/payload/collections/Media.ts:216`. **Root cause:** Size-limit rejection throws plain Error (500), unlike rejectFilenameRename which uses ValidationError. **Fix:** Throw `new ValidationError({ errors: [{ message: result.reason, path: 'filename' }] })`. **Verify:** Oversized upload shows a clear rejection message.

- [ ] **Jobs missing searchSync/indexNow/webhooks afterChange hooks** (medium · trivial · collections-taxonomy-media) — **Files:** `apps/cms/src/payload/collections/Jobs.ts:242-249`. **Root cause:** Jobs is versioned/publishable with a live `/job/[slug]` URL but lacks the four hooks every peer has. **Fix:** Add `searchSyncAfterChangeHook('jobs')`, `webhooksPublishAfterChangeHook('jobs')`, `indexNowPublishAfterChangeHook('jobs')` to afterChange and `searchSyncAfterDeleteHook('jobs')` to afterDelete. **Verify:** Publishing a job indexes it and fires notifications.

- [ ] **Jobs closedAt permanently null (no automation)** (medium · small · collections-taxonomy-media) — **Files:** `apps/cms/src/payload/collections/Jobs.ts:214-222`. **Root cause:** `access: { update: () => false }` and no hook ever writes closedAt on hiringStatus → closed. **Fix:** Add a beforeChange hook setting `data.closedAt = new Date().toISOString()` when hiringStatus transitions to `'closed'` (and originalDoc was not closed); relax field access so the hook can write. **Verify:** Closing a job stamps closedAt.

### Collections — ops

- [ ] **Brevo bounce handler misses leads beyond row 1000** (medium · medium · collections-ops / endpoints) — **Files:** `apps/cms/src/payload/endpoints/integrations-inbound.ts:273`. **Root cause:** Fetches `limit: 1000` with no email filter and filters in memory; leads past row 1000 never get emailHealth updated. **Fix:** Paginate via `hasNextPage` keeping the in-memory email match (json field path is not queryable). Long-term: add an indexed top-level `email` column on Leads (also fixes DSAR), with a hooks-bypassed backfill of existing rows. **Verify:** A bounce for a lead beyond row 1000 updates its emailHealth.

- [ ] **BrokenLinks read access locks out editors** (medium · trivial · collections-ops) — **Files:** `apps/cms/src/payload/collections/BrokenLinks.ts:25`. **Root cause:** `read: isAdmin` contradicts the docstring (editors should view the list). **Fix:** Change `read` to `isAdminOrEditor`; leave create/update `() => false` and `delete: isAdmin`. **Verify:** An editor can see the broken-links list.

- [ ] **Cal.com inbound hardcodes formSchemaVersion: 1** (medium · small · collections-ops) — **Files:** `apps/cms/src/payload/endpoints/integrations-inbound.ts:152`. **Root cause:** Leads from Cal.com carry a stale schema version. **Fix:** Fetch the fallback form via `findByID({ collection: 'forms', id: creds.fallbackFormId, overrideAccess: true })` and read its `schemaVersion`; fall back to 1. **Verify:** A Cal.com lead records the current form schemaVersion.

- [ ] **PreviewAudit audit-critical fields have no field-level write protection** (medium · small · collections-ops) — **Files:** `apps/cms/src/payload/collections/PreviewAudit.ts:26`. **Root cause:** `actor`/`collection`/`docId`/`ttlSeconds`/`expiresAt` lack `access.update: () => false`; an editor can rewrite who minted a link (`readOnly` only affects the UI). **Fix:** Add `access: { update: () => false }` to those five fields; keep `revokedAt`/`label` editable. **Verify:** PATCH to overwrite `actor` is rejected.

- [ ] **Forms read access exposes schema to unauthenticated callers** (medium · small · collections-ops) — **Files:** `apps/cms/src/payload/collections/Forms.ts:22`. **Root cause:** `read: () => true` exposes field names, validation regex, consentText, and select options publicly. **Fix:** Change to `read: isAdminOrEditor` unless the web app needs unauthenticated schema; if so, expose a scoped endpoint returning only label/type/required/placeholder. **Verify:** Anonymous `GET /api/forms` is denied (or returns the minimal scoped shape).

### Globals

- [ ] **MainNav/FooterNav/Announcements globals have no apps/web consumer** (medium · large · globals) — **Files:** `apps/cms/src/payload/globals/mainNav.ts:1`. **Root cause:** Globals are editable in admin but web nav uses hardcoded NAV_TREE and static Footer; Announcements has no consumer at all. **Fix:** Resolve the ambiguity before launch — either (a) wire web SSR to fetch MainNav/FooterNav (cms-fetch.ts + resolve-spotlights.ts is a ready template) and build an AnnouncementBanner, or (b) remove the globals and the B16 backlog reference. Document the decision in CLAUDE.md's apps/web section. **Verify:** Either editing the global changes the live nav/footer/banner, or the globals are removed and docs updated.

- [ ] **ctaHref fields lack URL validation (CompanySpotlight/ResourcesSpotlight/PodcastPage)** (medium · trivial · globals) — **Files:** `apps/cms/src/payload/globals/companySpotlight.ts:19`, `resourcesSpotlight.ts:19`, `podcastPage.ts:116`. **Root cause:** Plain required text consumed directly as a public mega-menu href; accepts malformed or `javascript:` URIs. **Fix:** Add `hooks: { beforeValidate: [normalizeOptionalUrlHook] }, validate: validateOptionalUrl` (from `../lib/url-shape`) to all three. **Verify:** Saving an invalid ctaHref is rejected.

- [ ] **seoDefaults organizationJsonLd.url and sameAs[].url lack URL validation** (medium · trivial · globals) — **Files:** `apps/cms/src/payload/globals/seoDefaults.ts:151`, `seoDefaults.ts:160`. **Root cause:** Free-text URLs flow into sitewide Organization JSON-LD. **Fix:** Apply normalizeOptionalUrlHook + validateOptionalUrl to `url`; use a stricter https-required validate for `sameAs[].url`. **Verify:** Malformed org/sameAs URLs are rejected.

- [ ] **Legal.policyVersion never snapshotted at lead-submit time** (medium · small · globals) — **Files:** `apps/cms/src/payload/globals/legal.ts:16`. **Root cause:** Web FormRenderer never sends policyVersion; db-primary stores `?? null`, so every lead has `privacyPolicyVersion=null`, breaking the GDPR audit chain. **Fix:** In the lead-submit endpoint, fetch the legal global and inject `submission.consent.policyVersion` server-side before calling handlers (cannot be spoofed). **Verify:** A new lead records the current Legal policyVersion.

- [ ] **CompanySpotlight/ResourcesSpotlight have no update access control** (medium · trivial · globals) — **Files:** `apps/cms/src/payload/globals/companySpotlight.ts:12`, `resourcesSpotlight.ts:12`. **Root cause:** Omitting `update` defaults to open; unauthenticated PATCH can overwrite the public mega-menu card. **Fix:** Add `update: isAdminOrEditor` to both (import from `../access`). **Verify:** Anonymous PATCH to either global is denied.

### Blocks

- [ ] **All 19 page-builder blocks have no apps/web renderer** (medium · large · blocks) — **Files:** `apps/cms/src/payload/blocks/index.ts:52`. **Root cause:** Pages collection layout has no web route/renderer; composing a Pages doc 404s and the preview resolver points at a non-existent route. **Fix (near-term):** Document in BACKLOG.md / WEB-PAGES.md that page-builder rendering is a deferred phase. **Fix (eventual):** Build a `[...slug]` catch-all that fetches by `doc.path` (path-based, matching paths.ts) and a PageBlockRenderer switching on blockType. **Verify:** Either the deferral is documented, or a Pages doc renders end-to-end.

- [ ] **Table value field claims required for text cells but is not enforced** (medium · trivial · blocks) — **Files:** `apps/cms/src/payload/blocks/Table.ts:76`. **Root cause:** Description says required-for-text but no validate; a text cell can save empty. **Fix:** Add `validate: (value, { siblingData }) => siblingData?.type !== 'text' || (typeof value === 'string' && value.trim().length > 0) ? true : 'Cell value is required for type=text cells.'` (not `required`). **Verify:** Empty text cell rejected; check/cross/partial cells unaffected.

- [ ] **Pricing billingToggle does not cross-validate both prices** (medium · small · blocks) — **Files:** `apps/cms/src/payload/blocks/Pricing.ts:13`. **Root cause:** Toggle implies both monthly+yearly required but neither is enforced. **Fix:** Add a validate on each price field (or a block-level beforeValidate) erroring when billingToggle is true and the field is blank. **Verify:** Enabling the toggle with one price missing is rejected.

### Fields / definitions

- [ ] **SchemaAddonsAdder/SchemaAddonsSection components are dead code** (medium · trivial · fields-defs / ui-seo-suite / crosscut-config-wiring) — **Files:** `apps/cms/src/payload/admin/components/SchemaAddonsAdder.tsx:273`, `SchemaAddonsAdder.tsx:131`. **Root cause:** Both exports are never imported; ~344 lines of DOM-driving code that drives a hidden field that never renders; legacy variant also calls setValue with the wrong shape for a blocks field. **Fix:** Delete SchemaAddonsAdder.tsx (both exports); if a functional UI is needed later, unhide the field and build a proper blocks component. **Verify:** Repo builds with the file removed; no remaining imports.

- [ ] **buildTaxonomyFields icon bypasses mediaUploadField()** (medium · trivial · fields-defs / collections-taxonomy-media) — **Files:** `apps/cms/src/payload/lib/build-taxonomy-fields.ts:29`. **Root cause:** Raw `{ name: 'icon', type: 'upload', relationTo: 'media' }` skips the custom MediaField/MediaCell UI used everywhere else. **Fix:** Replace with `mediaUploadField({ name: 'icon', folderHint: 'web/general' })`; schema column unchanged. **Verify:** Taxonomy icon picker uses the custom MediaField and list thumbnail.

- [ ] **schemaAddonsField permanently hidden with no re-surface path** (medium · medium · fields-defs) — **Files:** `apps/cms/src/payload/fields/schema-addons.ts:298`. **Root cause:** Half-state — schema defined, UI disabled, helper component dead. **Fix:** Either complete the re-wiring (import SchemaAddonsSection into SchemaPreviewField and flip `hidden: false`) or remove schemaAddonsField entirely if superseded by seo.additionalSchema. Coordinate with the schemaAddonsField P2 content item above. **Verify:** Either the editor UI works, or the field is removed cleanly.

### Access / hooks

- [ ] **Cycle/depth/validation hooks throw bare Error — admin returns 500** (medium · small · access-hooks) — **Files:** `apps/cms/src/payload/hooks/redirect-cycle-guard.ts:134`, `pages-path-builder.ts:56,59`, `taxonomy-parent-cycle-guard.ts:43,50,55`, `forms-coerce.ts:51`. **Root cause:** Bare Error in beforeChange yields an opaque 500 instead of a field-level validation message. **Fix:** Import `ValidationError` from `payload` and throw structured errors with appropriate `path` (`to`, `parent`, `parent`, `fields.<i>.validation.pattern`); mirror publish-gate.ts:171. Note: several of these overlap with the per-area items above — fix together. **Verify:** Each guard surfaces an inline message on rejection.

- [ ] **display-published-at-backfill wasSet guard blocks re-stamp on clear** (medium · small · access-hooks) — **Files:** `apps/cms/src/payload/hooks/display-published-at-backfill.ts:44`. **Root cause:** `if (isSet || wasSet) return next` skips backfill even when the editor cleared the field; clearing then republishing leaves it empty, contradicting the field description and doc comment. **Fix:** Decide semantics: if clearing should reset to publish-time, change guard to `if (isSet) return next;`; if clearing is permanent, document it and update the admin description. **Verify:** Behavior matches the chosen, documented semantics.

### Lib — integrations

- [ ] **writeSyncedTo throwing after lead creation causes a ghost-lead duplicate** (medium · small · lib-integrations) — **Files:** `apps/cms/src/payload/lib/lead-handlers/registry.ts:114`. **Root cause:** Unguarded `await writeSyncedTo` after the primary handler created the lead; a throw propagates to parkSubmission, and the drain cron re-runs submitLead creating a second row with lost syncedTo metadata. **Fix:** Wrap writeSyncedTo in try/catch, log a warning, and return `ok: true` (the lead is captured). **Verify:** Simulate a writeSyncedTo failure — only one lead row exists and a warning is logged.

- [ ] **refreshClarity ignores _row — duplicate rows waste 10/day Clarity quota** (medium · trivial · lib-integrations) — **Files:** `apps/cms/src/payload/lib/integrations/kinds/ms-clarity.ts:106`. **Root cause:** refreshAllClarity calls refreshClarity per enabled row but Clarity is a singleton env-token provider, so N rows = N identical API calls. **Fix:** Short-circuit refreshAllClarity to call refreshClarity at most once; add a comment explaining the singleton pattern. **Verify:** With two msClarity rows, only one Clarity API call fires per cycle.

- [ ] **Unsafe `as string` casts for GSC service-account fields** (medium · trivial · lib-integrations) — **Files:** `apps/cms/src/payload/lib/integrations/kinds/gsc-url-inspection.ts:38`. **Root cause:** `client_email`/`private_key` cast `as string` from a `Record<string, unknown>`; missing keys become `undefined`, producing opaque 401s. **Fix:** Use the conditional-spread guard pattern from gsc-search-analytics.ts:37-39; return null from inspectUrl when either field is absent. **Verify:** A malformed service-account JSON yields a clear null/error path, not a 401.

- [ ] **Brevo API error body written to leads.syncedTo without redaction** (medium · trivial · lib-integrations) — **Files:** `apps/cms/src/payload/lib/lead-handlers/brevo.ts:120`. **Root cause:** Raw Brevo response body (template IDs, list names) is stored verbatim in an editor-readable field, unlike webhook errors which go through redactWebhookErrorBody. **Fix:** Apply `redactWebhookErrorBody` (or equivalent) to `text` before building the error string. **Verify:** A Brevo 4xx error stored on a lead is redacted.

### Lib — SEO / JSON-LD

- [ ] **Sitemap includes taxonomy collections with no web detail routes** (medium · trivial · lib-seo-jsonld) — **Files:** `apps/cms/src/payload/lib/sitemap/collect.ts:34-36`. **Root cause:** `categories`/`newsCategories`/`knowledgeCategories` emit per-doc sitemap URLs that 404 (no web routes). **Fix:** Remove the three taxonomy collections from `SITEMAP_COLLECTIONS`; update sitemap tests to assert they are not emitted. **Verify:** Sitemap contains no category detail URLs.

- [ ] **Sitemap listing paths for guides/resources/jobs point at nonexistent pages** (medium · small · lib-seo-jsonld) — **Files:** `apps/cms/src/payload/lib/sitemap/collect.ts:27-32`. **Root cause:** listingPath `/guide` (no listing page), `/resources` (actual `/resource-center`), `/jobs` (actual `/careers`) all 404. **Fix:** Set guides listingPath to `null`, resources to `/resource-center`, jobs to `/careers`. **Verify:** Sitemap listing URLs resolve (or are omitted for guides).

- [ ] **robots-meta unavailable_after comment says RFC 850 but emits ISO 8601** (medium · trivial · lib-seo-jsonld) — **Files:** `apps/cms/src/payload/lib/seo/robots-meta.ts:86-89`. **Root cause:** Comment claims RFC 850; code uses `toISOString()`. **Fix:** Either emit `d.toUTCString()` (RFC 7231, Google-accepted) or correct the comment to state ISO 8601 is intentional. **Verify:** Comment matches output format.

- [ ] **isValidOverride accepts http: but editor validator requires https:** (medium · trivial · lib-seo-jsonld) — **Files:** `apps/cms/src/payload/lib/jsonld/url.ts:56-57`. **Root cause:** Layer-1 override gate allows http:, so direct-DB/legacy http canonicals reach JSON-LD even though canonical.ts blocks them. **Fix:** Tighten to `if (u.protocol !== 'https:') return false;`. **Verify:** An http canonical override is not emitted in JSON-LD.

- [ ] **ROUTE_PREFIX webinars mismatch (no detail route exists)** (medium · small · lib-seo-jsonld) — **Files:** `apps/cms/src/payload/lib/route-prefixes.ts:22`. **Root cause:** `webinars: '/webinar'` generates detail sitemap/JSON-LD URLs but no `/webinar/[slug]` route exists. **Fix:** Until a detail route exists, skip webinar detail-doc sitemap generation (keep listing `/webinars`); when built, align ROUTE_PREFIX, dispatch breadcrumbs, and the web route consistently. **Verify:** No 404-able webinar detail URLs in sitemap/JSON-LD.

- [ ] **Events breadcrumb listing crumb uses /event instead of /events** (medium · trivial · lib-seo-jsonld) — **Files:** `apps/cms/src/payload/lib/jsonld/dispatch.ts:463-466`. **Root cause:** Listing crumb points at the detail prefix, not the `/events` listing page. **Fix:** Change the Events breadcrumb listing crumb to `{ name: 'Events', path: '/events' }` (pairs with the events ROUTE_PREFIX P1 fix). **Verify:** Breadcrumb listing crumb resolves to `/events`.

### Lib — core

- [ ] **RATE_LIMIT_BACKEND=redis|postgres silences multi-worker guard but never swaps backend** (medium · trivial · lib-core) — **Files:** `apps/cms/src/payload/lib/rate-limit.ts:26`. **Root cause:** Validator treats redis/postgres as a pass while the store is always the in-memory Map; an operator scaling workers gets silently sharded limits (perMinute × workerCount). **Fix:** Remove `'redis'|'postgres'` from accepted values (forces WEB_CONCURRENCY=1) OR throw `RateLimitMisconfigured` for those values; stop recommending them in the guard's error strings. **Verify:** Setting an unimplemented backend with multi-worker either throws or is rejected.

- [ ] **ssrf-guard has no DNS re-check (DNS-rebinding TOCTOU)** (medium · medium · lib-core) — **Files:** `apps/cms/src/payload/lib/url-safety/ssrf-guard.ts:14`. **Root cause:** Synchronous guard does not resolve DNS; a short-TTL domain can rebind to a private IP between check and fetch. **Fix:** For the higher-risk media-ingest endpoint, add async DNS resolution + re-check in the fetch wrapper; document the residual limitation for the low-privilege broken-links scanner. **Verify:** Media ingest re-validates the resolved IP before fetching.

### UI — field renderers

- [ ] **SelectField single-select read-only renders blank** (medium · trivial · ui-field-renderers) — **Files:** `apps/cms/src/payload/admin/components/fields/SelectField.tsx:149`. **Root cause:** No else-branch renders the selected value when readOnly + !hasMany; the value is invisible on read-only docs. **Fix:** Convert line 149 to a ternary with an else rendering a readonly `<span>` showing `labelFor(selected[0])` or `No selection` (mirror RelationshipField.tsx:670-673). **Verify:** A read-only single-select shows its value. (Separately: the component reads only `field.admin.readOnly`, ignoring access-control-driven `props.readOnly`.)

- [ ] **JsonField local text goes stale after external value reset** (medium · small · ui-field-renderers) — **Files:** `apps/cms/src/payload/admin/components/fields/JsonField.tsx:45`. **Root cause:** Lazy useState init with no resync; external value changes (version restore, autosave) never update the textarea. **Fix:** Add a focus-guarded resync: `useEffect(() => { if (!hasFocusRef.current) setText(stringify(value)); }, [value])` with onFocus/onBlur setting the ref. **Verify:** Restoring a version updates the JSON textarea without clobbering in-progress edits.

- [ ] **BlocksField entire row is draggable (Remove button triggers drag)** (medium · small · ui-field-renderers) — **Files:** `apps/cms/src/payload/admin/components/fields/BlocksField.tsx:116`. **Root cause:** `draggable` + drag handlers on the `<li>`; clicking Remove can start a drag (ArrayField already fixed this). **Fix:** Keep onDragOver/onDragLeave/onDrop on the `<li>`; move `draggable={!isDisabled}` + onDragStart/onDragEnd onto the existing `cs-blocks__row-handle` element, gated on `!isDisabled` with a title. **Verify:** Dragging only works from the handle; Remove clicks reliably.

- [ ] **NumberField step hardcoded to 1** (medium · trivial · ui-field-renderers) — **Files:** `apps/cms/src/payload/admin/components/fields/NumberField.tsx:31`. **Root cause:** Ignores `field.admin.step`; decimal fields step by 1. **Fix:** Read `field.admin?.step` with a numeric guard, default 1. **Verify:** A decimal-step field increments by its configured step.

- [ ] **NumberField hasMany not supported (silent overwrite)** (medium · medium · ui-field-renderers) — **Files:** `apps/cms/src/payload/admin/components/fields/NumberField.tsx:19`. **Root cause:** Always sets a scalar; a hasMany number array is overwritten on first edit. **Fix:** Detect `field.hasMany` and implement a multi-value input or render a visible fallback warning. **Verify:** A hasMany number field is not corrupted on edit.

- [ ] **All leaf fields ignore disabled from useField** (medium · small · ui-field-renderers) — **Files:** `apps/cms/src/payload/admin/components/fields/TextField.tsx:22` (and peers). **Root cause:** Leaf fields never destructure `disabled`, so form-condition/submission disabling is not reflected. **Fix:** Destructure `disabled` in each leaf field and merge `const isDisabled = disabled || field.admin?.readOnly === true;`. **Verify:** A conditionally-disabled field is non-interactive during submit.

- [ ] **ArrayField array-level validation errors never displayed** (medium · trivial · ui-field-renderers) — **Files:** `apps/cms/src/payload/admin/components/fields/ArrayField.tsx:47`. **Root cause:** The cast drops showError/errorMessage; server minRows/maxRows/custom validate errors are swallowed. **Fix:** Extend UseFieldWithRows with `showError?`/`errorMessage?` and render the error below the list. **Verify:** A server array validation error is shown.

- [ ] **TabsField permissions ignore tab name for named tabs** (medium · small · ui-field-renderers) — **Files:** `apps/cms/src/payload/admin/components/fields/TabsField.tsx:99`. **Root cause:** Uses flat `permissions.fields` for all tabs; named tabs resolve as `permissions[tabName].fields`. **Fix:** For named tabs, resolve `permissions[t.name]` then extract `.fields`. **Verify:** Field-level permissions inside a named tab are honored. (Low-priority companion: parentSchemaPath fix at TabsField.tsx:85.)

### UI — list view

- [ ] **BulkActionBar delete errors swallowed (page reloads on failure)** (medium · small · ui-list-view) — **Files:** `apps/cms/src/payload/admin/components/views/list/BulkActionBar.tsx:52-62`. **Root cause:** callBulkDelete never checks `res.ok`; failures reload silently with no feedback. **Fix:** Return parsed JSON + status; if `!res.ok` or `errors.length`, surface via the @cleanstart/ui toast bus and do NOT reload; guard the `.json()` in try/catch. **Verify:** A failed bulk delete shows an error toast and does not reload.

- [ ] **SavedViews: search never saved/restored; columns field is dead** (medium · small · ui-list-view) — **Files:** `apps/cms/src/payload/admin/components/views/list/SavedViews.tsx:96-115`. **Root cause:** onSave/onSelect handle only where/sort/limit; `query.search` is ignored and the `columns` type field is unused. **Fix:** Add `search?` to SavedView; capture/restore it; either implement or remove the `columns` field. **Verify:** Saving a view with an active search restores it.

- [ ] **CmsListView imports render components (Gutter/PageControls/SelectionProvider) from @payloadcms/ui** (medium · medium · ui-list-view / crosscut) — **Files:** `apps/cms/src/payload/admin/components/views/list/CmsListView.tsx:17-21`. **Root cause:** Render-side imports violate the data-layer-only rule; Wave 8 ESLint will fail the build (PageControls is @internal). **Fix:** Replace Gutter with a plain div, PageControls with a @cleanstart/ui Pagination consuming useListQuery, and move SelectionProvider to @cleanstart/ui (or annotate as an accepted provider exception). **Verify:** No render-side @payloadcms/ui imports remain; lint passes.

- [ ] **ListHeader/SavedViews menu triggers missing aria-expanded** (medium · trivial · ui-list-view) — **Files:** `apps/cms/src/payload/admin/components/views/list/ListHeader.tsx:74-87`, `SavedViews.tsx:120-130`. **Root cause:** Menu trigger buttons lack aria-expanded. **Fix:** Thread the open state and add `aria-expanded={open}` to both triggers. **Verify:** Screen reader announces menu open/closed state.

- [ ] **ListCellEnhancer bool-cell loop lacks the data-cs-enhanced guard** (medium · trivial · ui-list-view) — **Files:** `apps/cms/src/payload/admin/components/ListCellEnhancer.tsx:95-101`. **Root cause:** Unlike the other loops, the bool-cell pass re-runs on every DOM mutation (O(rows) per event). **Fix:** Add the same `cell.getAttribute(ATTR) === '1'` continue-guard and set the attr after processing. **Verify:** Bool cells are enhanced once; profiler shows no per-mutation rescans.

### UI — edit view

- [ ] **DocKebabExtras imports PopupList (render component) from @payloadcms/ui** (medium · small · ui-edit-view) — **Files:** `apps/cms/src/payload/admin/components/DocKebabExtras.tsx:6`. **Root cause:** PopupList is render-side, forbidden by the data-layer-only rule; Wave 8 will fail. **Fix:** Replace PopupList.Button usages with @cleanstart/ui primitives or a styled button (narrow active/disabled/href/onClick API). **Verify:** No PopupList import; kebab menu items render and work.

- [ ] **Duplicate SchedulePublishDialog (global action + controlled in CmsPublishButton)** (medium · small · ui-edit-view) — **Files:** `apps/cms/src/payload.config.ts:223`, `apps/cms/src/payload/admin/components/CmsPublishButton.tsx:168-172`. **Root cause:** Uncontrolled global instance + controlled per-button instance both mount; Cmd+Shift+S can open a second dialog over the first with no easy teardown. **Fix:** Remove SchedulePublishDialog from admin.components.actions; wire Cmd+Shift+S inside CmsPublishButton's controlled dialog (guard `if (!open)`). **Verify:** Only one schedule dialog can be open; the shortcut opens it once.

- [ ] **schedulePublish double-cast bypasses TypeScript** (medium · small · ui-edit-view / crosscut) — **Files:** `apps/cms/src/payload/admin/components/SchedulePublishDialog.tsx:222`. **Root cause:** `as unknown as (...) => Promise<...>` forces a Record arg and asserts the return shape, silently swallowing server errors. **Fix:** Call schedulePublish with a typed `Omit<SchedulePublishHandlerArgs, 'clientConfig'|'req'>` and narrow the return via a type guard. **Verify:** Type-checks without the escape hatch; server errors surface.

### UI — primitives / pickers

- [ ] **MediaField inline browse-dialog duplicates MediaBrowseDialog** (medium · small · ui-primitives-pickers) — **Files:** `apps/cms/src/payload/admin/components/MediaField/MediaField.tsx:199`. **Root cause:** The shared MediaBrowseDialog was extracted but MediaField's inline copy (~15 state vars, 3 effects, 100+ JSX lines) was never removed; the two have already diverged (missing dimensions row). **Fix:** Replace the inline dialog with `<MediaBrowseDialog open onClose onSelect />` and delete the duplicated state/effects/JSX. **Verify:** MediaField uses the shared dialog; tile parity restored.

- [ ] **MediaPicker double-fetch race when search changes while page > 1** (medium · small · ui-primitives-pickers) — **Files:** `apps/cms/src/payload/admin/components/pickers/MediaPicker.tsx:58`. **Root cause:** onSearchChange fires fetchMedia(1,next) AND resets page, triggering the useEffect to fetch with stale search; last-to-resolve wins. **Fix:** Add an AbortController to the effect, OR move all fetch logic into a debounced effect with `search` in deps and remove the parallel fetch. **Verify:** Rapid search changes show results for the latest query.

- [ ] **InlineImageEditDialog filename rename uses bare PATCH instead of /rename** (medium · small · ui-primitives-pickers) — **Files:** `apps/cms/src/payload/admin/components/InlineImage/InlineImageEditDialog.tsx:221`. **Root cause:** Bare PATCH updates the DB column but doesn't move the R2 object, diverging media.url from storage (MediaSelfChrome documents why). **Fix:** POST to `/api/media/:id/rename` with the stem; handle the `{ ok, filename, error }` response. **Verify:** Renaming via inline edit keeps media.url consistent with R2.

- [ ] **MediaField inline filename rename uses bare PATCH instead of /rename** (medium · small · ui-primitives-pickers) — **Files:** `apps/cms/src/payload/admin/components/MediaField/MediaField.tsx:501`. **Root cause:** Same as above. **Fix:** POST to `/api/media/:id/rename`; verify CORS/admin auth is forwarded. **Verify:** MediaField rename keeps the URL aligned with R2.

### UI — SEO suite

- [ ] **OutboundRedirectField Enter key calls stale handleSave** (medium · trivial · ui-seo-suite) — **Files:** `apps/cms/src/payload/admin/components/OutboundRedirectField.tsx:152`. **Root cause:** handleKeyDown deps `[form.saving]` capture an outdated handleSave (deps include form.to); Enter reads stale form.to. **Fix:** Move handleSave above handleKeyDown, set deps `[form.saving, handleSave]`, drop the eslint-disable (or use a handleSaveRef). **Verify:** Pressing Enter in the redirect input saves the current value.

- [ ] **SeoTitleField/SeoDescriptionField manualMode lost when stored value equals source** (medium · small · ui-seo-suite) — **Files:** `apps/cms/src/payload/admin/components/SeoTitleField.tsx:67`, `SeoDescriptionField.tsx:62`. **Root cause:** manualMode inferred from value equality; if a manual SEO title equals the doc title, auto-sync re-engages and overwrites it on the next title change. **Fix:** Add `seo._titleOverridden`/`seo._descriptionOverridden` booleans to record intent and initialize manualMode from them; until the schema lands, document the limitation. **Verify:** A manual SEO title that matches the doc title is not overwritten after editing the title.

### UI — Lexical editor

- [ ] **LinkPopover self-queries document for anchor — wrong editor on multi-editor pages** (medium · small · ui-lexical-editor) — **Files:** `apps/cms/src/payload/admin/components/LinkPopover.tsx:117`. **Root cause:** `document.querySelector('[data-lexical-editor]')` picks the first editor; position offset is wrong for the second editor (e.g. Guides body + FAQ body). **Fix:** Pass `anchorElem` from LinkPopoverPlugin (it already has it) into LinkPopover; remove the internal querySelector. **Verify:** Editing a link in a second editor positions the popover correctly.

- [ ] **EmbedDialog/InlineImageInsertDialog tab widgets missing tabpanel/aria-controls/tabIndex** (medium · small · ui-lexical-editor / ui-primitives-pickers) — **Files:** `apps/cms/src/payload/admin/components/Embed/EmbedDialog.tsx:235`, `InlineImageInsertDialog.tsx:151`. **Root cause:** role=tab without role=tablist/tabpanel, aria-controls, or tabIndex management (InlineImage uses `<nav>` not a tablist). **Fix:** Add ids + aria-controls on tabs, role=tabpanel + aria-labelledby on panels, tabIndex 0/-1; change InlineImage `<nav>` to `<div role="tablist">`. **Verify:** Axe/Pa11y reports no tab-widget violations.

- [ ] **InlineImagePlugin capture listener on both click and mousedown — duplicate dispatch** (medium · small · ui-lexical-editor) — **Files:** `apps/cms/src/payload/admin/components/InlineImage/InlineImagePlugin.tsx:411`. **Root cause:** Same handler on both events fires commands twice (open/close/reopen). **Fix:** Register for `mousedown` only; remove the `click` listener and its cleanup; add stopPropagation to the filename-toggler case. **Verify:** Clicking Upload/Edit/Swap dispatches its command exactly once.

### UI — integrations

- [ ] **useDocUrl builds wrong URL (CMS host, not web frontend)** (medium · small · ui-integrations) — **Files:** `apps/cms/src/payload/admin/components/integrations/AnalyticsTab.tsx:86`. **Root cause:** `window.location.origin` is the CMS host; the `.replace(/\/admin.*/,'')` is a no-op on an origin, so GSC queries hit `https://cms.../<slug>` and return empty. **Fix:** Fetch baseUrl from `/api/globals/siteSettings?depth=0` once on mount, strip trailing slash, compose `${base}/${slug}`; remove the origin branch and the dead replace. **Verify:** GSC panels populate for a document.

- [ ] **TestButton/HealthBadge/AuditTrail call res.json() without checking res.ok** (medium · trivial · ui-integrations) — **Files:** `apps/cms/src/payload/admin/components/integrations/TestButton.tsx:43`, `HealthBadge.tsx:50`, `AuditTrail.tsx:61`. **Root cause:** On a 500 HTML page, res.json() throws SyntaxError surfaced raw to the editor. **Fix:** Add `if (!res.ok) throw new Error('HTTP ' + res.status)` before each json(), or a shared safeJson helper. **Verify:** A 500 shows a clean error, not a JS SyntaxError.

- [ ] **FormSlugsMultiSelect swallows network errors (misleading empty state)** (medium · trivial · ui-integrations) — **Files:** `apps/cms/src/payload/admin/components/integrations/FormSlugsMultiSelect.tsx:45`. **Root cause:** No `.catch()` and no cancelled flag; a fetch rejection leaves options empty and shows "No forms found". **Fix:** Add `.catch(() => setOptions([]))` with a separate error state showing "Could not load forms"; add the cancelled token (mirror AuditTrail). **Verify:** A network failure shows an explicit error, not the empty-forms message.

- [ ] **wire-analytics-tab idempotency guard misses fields nested inside tabs** (medium · small · ui-integrations / crosscut-config-wiring) — **Files:** `apps/cms/src/payload/lib/wire-analytics-tab.ts:40`. **Root cause:** Guard scans only top-level fields and skips tabs-type fields; a nested analyticsTab causes a duplicate to be appended (generate:types failure / double widget). **Fix:** Recurse into tabs when searching, OR track wired slugs in a module-level Set. **Verify:** Re-wiring a tabbed collection does not append a duplicate analyticsTab.

### UI — auth / misc

- [ ] **CmsAccountForm allows password/email change without current-password verification** (medium · small · ui-auth-misc) — **Files:** `apps/cms/src/payload/admin/components/CmsAccountForm.tsx:51`. **Root cause:** PATCH /api/users/:id with only the session cookie; a hijacked session can change credentials silently. **Fix:** Add a "Current password" input and include `currentPassword` in the PATCH when changing password; require re-entry for email change. **Verify:** Changing password without the current password is rejected.

- [ ] **FaqBulkPaste imports useForm from @payloadcms/ui (not in allowlist)** (medium · trivial · ui-auth-misc / crosscut) — **Files:** `apps/cms/src/payload/admin/components/FaqBulkPaste.tsx:3`. **Root cause:** useForm is not in CLAUDE.md's documented allowlist (it is in the enforcement script). **Fix:** Add useForm to CLAUDE.md's allowed list (it is a data-layer context hook) to match the script, OR refactor to useFormFields. **Verify:** Allowlist check passes and the doc matches the script.

### UI — dashboard / nav

- [ ] **CommandPalette uses window.location.href (full reload)** (medium · trivial · ui-dashboard-nav) — **Files:** `apps/cms/src/payload/admin/components/CommandPalette.tsx:252`. **Root cause:** Hard navigation defeats the palette's instant-nav UX. **Fix:** Use `useRouter().push(action.href)` from next/navigation. **Verify:** Palette navigation is a client-side transition.

- [ ] **Dashboard imports Gutter (render component) from @payloadcms/ui** (medium · trivial · ui-dashboard-nav / crosscut) — **Files:** `apps/cms/src/payload/admin/components/Dashboard/Dashboard.tsx:1`. **Root cause:** Render-side import violates the data-layer-only rule. **Fix:** Replace `<Gutter className="cs-dashboard">` with a plain `<div>`. **Verify:** No Gutter import; dashboard layout intact.

- [ ] **NavGroupPersistence MutationObserver never disconnected** (medium · trivial · ui-dashboard-nav) — **Files:** `apps/cms/src/payload/admin/components/NavGroupPersistence.tsx:82`. **Root cause:** After one-shot apply, the body-wide observer keeps firing a no-op on every DOM change. **Fix:** Call `observer.disconnect()` inside the callback right after apply() once `appliedOnce` is set. **Verify:** Observer stops after initial application.

### Crosscut — config wiring

- [ ] **Eight field-type overrides missing from importMap.js (silent stock fallback)** (medium · small · crosscut-config-wiring) — **Files:** `apps/cms/src/payload/lib/wire-custom-fields.ts` (PointField, RadioField, DateField, CollapsibleField, TabsField, RowField, JoinField, CodeField). **Root cause:** Overrides registered in wire-custom-fields but absent from importMap, so Payload silently uses stock renderers. **Fix:** Run `generate:importmap` after confirming the component paths; commit the regenerated importMap. **Verify:** Each custom field type renders its custom chrome.

- [ ] **BodyAuditField/KeywordTargetField built but wired nowhere** (medium · small · crosscut-config-wiring) — **Files:** `apps/cms/src/payload/admin/components/BodyAuditField.tsx:49`, `KeywordTargetField.tsx`. **Root cause:** Fully implemented sidebar widgets with no ui-field path and no importMap entry. **Fix:** Add ui-type fields (KeywordTargetField in seoSidebarFields with clientProps; BodyAuditField on body collections), run generate:importmap; or add explicit BACKLOG entries if deferred. **Verify:** The widgets appear and read live form state.

- [ ] **SchemaAddonsAdder superseded but exported with incorrect setValue logic** (medium · trivial · crosscut-config-wiring / fields-defs) — **Files:** `apps/cms/src/payload/admin/components/SchemaAddonsAdder.tsx:273`. **Root cause:** Legacy export manipulates a blocks field via setValue with an array (wrong shape); neither export is imported/in importMap. **Fix:** Remove SchemaAddonsAdder (dedupe with the fields-defs dead-code item); wire SchemaAddonsSection properly only if still needed. **Verify:** Build passes with the export removed.

### Crosscut — responsive

- [ ] **Dual-pane scroll layout locks body overflow on all viewports** (medium · medium · crosscut-responsive) — **Files:** `apps/cms/src/app/(payload)/styles/_chrome.scss:237`. **Root cause:** Unguarded `html,body { overflow: hidden }` + clipped ancestor chain trap the stacked sidebar pane below the fold under 1024px (Payload's mid-break). **Fix:** Wrap the dual-pane overflow rules in `@media (min-width: 1025px)`; below that let body scroll and use auto heights so the stacked sidebar is reachable; fix the dead `> .document-fields__sidebar` selectors (the child is `__sidebar-wrap`). **Verify:** At ≤1024px the SEO sidebar is scrollable and reachable.

- [ ] **Lexical toolbar icon buttons 28px (below 44px touch floor)** (medium · small · crosscut-responsive) — **Files:** `apps/cms/src/app/(payload)/styles/_lexical-toolbar.scss:213`. **Root cause:** 28×28 hit areas. **Fix:** Under `@media (pointer: coarse)` expand the tappable area to ≥40px (transparent padding or ::before). **Verify:** Touch hit area ≥40px while glyph stays 28px.

- [ ] **Nav links 30px default; 44px only below 768px** (medium · trivial · crosscut-responsive) — **Files:** `apps/cms/src/app/(payload)/styles/_nav.scss:118`. **Root cause:** 1024px tablets (sidebar open) get 30px targets. **Fix:** Base min-height 36px; apply the 44px floor under `@media (pointer: coarse)` instead of a width breakpoint. **Verify:** Touch nav targets are ≥44px regardless of width.

- [ ] **Array row remove button 24px (below touch floor)** (medium · trivial · crosscut-responsive) — **Files:** `apps/cms/src/app/(payload)/styles/_forms.scss:629`. **Root cause:** 24×24 with no padding. **Fix:** Inflate tap area to 44px via `padding: 10px; box-sizing: content-box` (or min-width/height 44px with centered icon). **Verify:** Remove button tap area ≥44px.

- [ ] **Schema-addons / relationship chip remove buttons 18px** (medium · small · crosscut-responsive) — **Files:** `apps/cms/src/app/(payload)/styles/_ui-primitives.scss:1663`. **Root cause:** 18×18 remove buttons below WCAG 2.5.8. **Fix:** Inflate tap area to 44px (`padding: 13px; box-sizing: content-box`), keep the SVG at 18px. **Verify:** Chip remove tap area ≥44px.

- [ ] **Lexical fixed-toolbar padding-right: 124px wastes narrow-screen space** (medium · trivial · crosscut-responsive) — **Files:** `apps/cms/src/app/(payload)/styles/_lexical-toolbar.scss:194`. **Root cause:** Always reserves 124px for the fullscreen pill, forcing wrap on narrow editors. **Fix:** Gate the reservation in `@media (min-width: 1024px)`; use a smaller value below. **Verify:** No premature toolbar wrap at ≤768px.

- [ ] **Table layout fixed-column with no horizontal-scroll wrapper** (medium · small · crosscut-responsive) — **Files:** `apps/cms/src/app/(payload)/styles/_tables.scss:198`. **Root cause:** Fixed columns sum > viewport at 768-1024px and `.cs-list__table { overflow: hidden }` clips. **Fix:** Change to `overflow-x: auto` and add `min-width: 600px` on the inner table. **Verify:** Tables scroll horizontally on narrow viewports instead of clipping.

- [ ] **LinkPopover 360px fixed width overflows narrow viewports** (medium · trivial · crosscut-responsive) — **Files:** `apps/cms/src/payload/admin/components/LinkPopover.scss:17`. **Root cause:** Fixed `width: 360px` with no clamp. **Fix:** `width: min(360px, calc(100vw - 16px))`; confirm JS positioning clamps within viewport. **Verify:** Popover fits on a 360px viewport.

- [ ] **No viewport meta tag enforcement verified in admin layout** (medium · trivial · crosscut-responsive) — **Files:** `apps/cms/src/app/(payload)/styles/_tokens.scss:1` (verify in layout). **Root cause:** Cannot confirm the viewport meta is preserved by the custom layout; if missing, breakpoints are unreachable. **Fix:** Grep for `viewport` in `apps/cms/src/app/(payload)/layout.tsx` and ensure Payload's `<meta name="viewport">` is preserved. **Verify:** The admin page emits `width=device-width, initial-scale=1`.

---

## P3 — Low / polish

### Collections — content

- [ ] **eventStatusTimestampsHook doesn't clear previousStartDate when leaving postponed** (low · trivial · collections-content) — **Files:** `apps/cms/src/payload/hooks/event-status-timestamps.ts:39`. **Root cause:** No parallel block to the cancelledAt clear; a rescheduled-then-rescheduled-back event keeps a stale previousStartDate in JSON-LD. **Fix:** Add `if (next.eventStatus !== 'postponed' && prev.eventStatus === 'postponed') { result.previousStartDate = null; }`. **Verify:** Returning to scheduled clears previousStartDate.

- [ ] **Resources downloadCount description is stale ("Always 0 today")** (low · trivial · collections-content) — **Files:** `apps/cms/src/payload/collections/Resources.ts:153`. **Root cause:** Endpoint already increments it. **Fix:** Update description to "Automatically incremented each time a visitor downloads this resource." **Verify:** Description matches behavior.

### Collections — taxonomy / media

- [ ] **AuthorCredibilityField always returns 0 for KnowledgeBase** (low · small · collections-taxonomy-media) — **Files:** `apps/cms/src/payload/admin/components/AuthorCredibilityField.tsx:65-68`. **Root cause:** Queries `where[authors][in]` but KB has only `reviewedBy`. **Fix:** Special-case the knowledgeBase entry to `where[reviewedBy][equals]=<id>` and relabel "KB article (reviewed)". **Verify:** KB-reviewed counts appear for an author.

- [ ] **AuthorCredibilityField "Most recent" reads updatedAt not publishedAt** (low · trivial · collections-taxonomy-media / ui-auth-misc) — **Files:** `apps/cms/src/payload/admin/components/AuthorCredibilityField.tsx:71-85`. **Root cause:** Sorts by -publishedAt but displays docs[0].updatedAt. **Fix:** Add publishedAt to the query/select and read docs[0].publishedAt. **Verify:** The label reflects last published date.

- [ ] **Media filename collision loop leaves final candidate unchecked** (low · trivial · collections-taxonomy-media) — **Files:** `apps/cms/src/payload/collections/Media.ts:301-311`. **Root cause:** Off-by-one — `stem-50.ext` is assigned but never verified before loop exit. **Fix:** Check candidate before assignment or extend to `<= 51`; consider extracting to a testable helper. **Verify:** A unit test covers the 50th-candidate boundary.

- [ ] **Jobs expiresAt auto-close cron referenced but not implemented** (low · medium · collections-taxonomy-media) — **Files:** `apps/cms/src/payload/collections/Jobs.ts:208-211`. **Root cause:** "Phase G" cron does not exist; expiresAt is never acted on. **Fix:** Either build the auto-close cron (query expiresAt <= now and open → set closed + closedAt) or remove the field/description until built. **Verify:** Either expired jobs auto-close or the misleading description is gone.

- [ ] **Taxonomy icon field bypasses mediaUploadField (list-view variant)** (low · trivial · collections-taxonomy-media) — **Files:** `apps/cms/src/payload/lib/build-taxonomy-fields.ts:29`. **Root cause:** Duplicate of the P2 fields-defs item from the taxonomy angle. **Fix:** Use `mediaUploadField(...)`; dedupe with the P2 entry. **Verify:** Custom MediaCell thumbnail shows in the taxonomy list.

- [ ] **Jobs SEO sidebar wired to nonexistent abstract source** (low · trivial · collections-taxonomy-media) — **Files:** `apps/cms/src/payload/collections/Jobs.ts:239`. **Root cause:** `descriptionSource: 'abstract'` with no abstract field. **Fix:** Add an abstract field (preferred, batch with Pages/Guides) or repoint descriptionSource at an existing snippet source. **Verify:** SEO description auto-sync reads a real field.

- [ ] **MediaSelfChrome replace input leaks from document.body; accept misses video/zip** (low · trivial · collections-taxonomy-media) — **Files:** `apps/cms/src/payload/admin/components/MediaSelfChrome.tsx:221-272`. **Root cause:** No unmount cleanup of the appended input; `accept` excludes video/zip. **Fix:** Add a useEffect cleanup removing the input; expand `accept` to `image/*,application/pdf,video/mp4,application/zip,application/x-zip-compressed`. **Verify:** No orphaned inputs across edit pages; video/zip can be replaced.

- [ ] **AboutGalleries displayOrder "Drag to reorder" description is misleading** (info · trivial · collections-taxonomy-media) — **Files:** `apps/cms/src/payload/collections/AboutGalleries.ts:65`. **Root cause:** No drag UI exists. **Fix:** Change description to "Enter a number to control display order (lower = first)." **Verify:** Description matches behavior.

### Collections — ops

- [ ] **Bare throw new Error in ops collections/hooks (no AppError taxonomy)** (low · medium · collections-ops) — **Files:** `apps/cms/src/payload/collections/Integrations.ts:104`, `forms-coerce.ts:51`, `redirect-cycle-guard.ts:134`, `registry.ts`. **Root cause:** Violates the AppError convention; user-facing validation should be Payload ValidationError. **Fix:** Create the AppError taxonomy (at minimum a ValidationError wrapper + IntegrationError); convert user-facing throws to ValidationError. Coordinate with the access-hooks ValidationError P2 item. **Verify:** Validation errors surface inline in the admin.

- [ ] **AnalyticsCache index not unique + TTL comment mismatch** (low · trivial · collections-ops) — **Files:** `apps/cms/src/payload/collections/AnalyticsCache.ts:106`, `cache.ts:136-137`. **Root cause:** Always-insert design accumulates rows; TTL comment says "15-min cron" but TTL is 20 min. **Fix:** Fix the TTL comment to "20-min TTL (15-min cron + 5 min slack)"; consider a 7-day prune retention for analyticsCache. **Verify:** Comment is accurate; prune retention is appropriate.

### Globals

- [ ] **footerNav copyright {year} substitution not implemented** (low · trivial · globals) — **Files:** `apps/cms/src/payload/globals/footerNav.ts:73`. **Root cause:** No {year} replacement; static Footer hardcodes ©2026. **Fix:** In Footer.tsx use `©{new Date().getFullYear()}`; add substitution if footerNav is ever wired. **Verify:** Footer year is current.

- [ ] **siteSettings.baseUrl lacks URL validation** (low · small · globals) — **Files:** `apps/cms/src/payload/globals/siteSettings.ts:17`. **Root cause:** Required text with no validator feeds sitemaps/robots/JSON-LD; a scheme-less value breaks absolute URLs; organizationTimezone is unvalidated. **Fix:** Apply normalizeOptionalUrlHook + validateOptionalUrl to baseUrl; add an IANA check (or reject spaces/forbidden chars) to organizationTimezone. **Verify:** Invalid baseUrl/timezone rejected.

- [ ] **mainNav.featuredCard missing target/href cross-validation** (low · small · globals) — **Files:** `apps/cms/src/payload/globals/mainNav.ts:74`. **Root cause:** No validate connecting kind→target/href; a card can render a null link. **Fix:** Add validates mirroring _navItem.ts (internal-doc requires target; external-url requires valid href). **Verify:** Misconfigured featuredCard is rejected.

- [ ] **footerNav social profile URLs lack validation** (low · trivial · globals) — **Files:** `apps/cms/src/payload/globals/footerNav.ts:54`. **Root cause:** Required text, no URL validation. **Fix:** Add normalizeOptionalUrlHook + validateOptionalUrl to social[].url. **Verify:** Invalid social URL rejected.

- [ ] **seoDefaults brandIcons/verification have no web consumer** (low · medium · globals) — **Files:** `apps/cms/src/payload/globals/seoDefaults.ts:52`. **Root cause:** Editable but unused by apps/web (themeColor hardcoded, no verification meta). **Fix:** Add admin.description notes ("web production phase — not yet wired"); long-term add a site-meta SSR fetch. **Verify:** Fields document their non-wired status.

### Blocks

- [ ] **Section block includes Hero in nestableBlocks (hero-inside-section footgun)** (low · trivial · blocks) — **Files:** `apps/cms/src/payload/blocks/index.ts:28`. **Root cause:** Hero is full-width/above-fold; nesting in a layout container breaks UI. **Fix:** Remove Hero from nestableBlocks; add a constrained HeroCard/PageHeader block if needed. **Verify:** Hero cannot be added inside a Section.

- [ ] **link.ts newTab hidden for doc/media kinds** (low · trivial · blocks / fields-defs) — **Files:** `apps/cms/src/payload/fields/link.ts:117`, `link.ts:116`. **Root cause:** newTab condition limited to `kind === 'url'`; can't open internal doc/media (PDF/ZIP) links in a new tab. **Fix:** Remove the condition (show newTab for all kinds). **Verify:** Doc/media links can set new-tab.

- [ ] **Gallery/LogoCloud/IntegrationLogos URL fields lack validation** (low · small · blocks) — **Files:** `apps/cms/src/payload/blocks/Gallery.ts:29`, `LogoCloud.ts:19`, `IntegrationLogos.ts:33`. **Root cause:** Plain text accepts `javascript:`/protocol-relative URLs. **Fix:** Add a validate calling `isValidExternalLink` from `../lib/url-shape` (or use linkField). **Verify:** Invalid URLs rejected.

- [ ] **Section two-column variant has no minimum-children=2 constraint** (low · small · blocks) — **Files:** `apps/cms/src/payload/blocks/Section.ts:21`. **Root cause:** minRows is 1 regardless of variant. **Fix:** Add a validate erroring when `variant === 'two-column'` and children.length < 2 (optionally maxRows 2). **Verify:** A one-child two-column section is rejected.

- [ ] **FaqBulkPaste MutationObserver scoped to document.body** (low · small · blocks / ui-auth-misc) — **Files:** `apps/cms/src/payload/admin/components/FaqBulkPaste.tsx:162`. **Root cause:** Auto-focus observer fires on every DOM mutation. **Fix:** Scope the observer to the FAQ array field container (findField by id), stored in a ref. **Verify:** Callback frequency drops sharply in profiling.

### Fields / definitions

- [ ] **seoField exported but never consumed** (low · trivial · fields-defs) — **Files:** `apps/cms/src/payload/fields/seo.ts:440`. **Root cause:** Vestigial export; only seoFieldHidden is used. **Fix:** Remove the `export` keyword (or inline into seoFieldHidden). **Verify:** No external imports break.

- [ ] **PodcastEpisodes has no SEO group / not in SchemaPreviewField SUPPORTED_COLLECTIONS** (low · small · fields-defs) — **Files:** `apps/cms/src/payload/collections/PodcastEpisodes.ts:94`, `SchemaPreviewField.tsx:55`. **Root cause:** No seo.* path despite publishedAt/displayPublishedAt feeding JSON-LD. **Fix:** If episodes are indexed, add seoSidebarFields/seoFieldsForSidebar and add 'podcastEpisodes' to SUPPORTED_COLLECTIONS; otherwise add a comment explaining the omission. Coordinate with the P2 PodcastEpisodes content item. **Verify:** Episodes have SEO fields or a documented omission.

- [ ] **slug.ts validate uses `collection: collectionSlug as never`** (low · trivial · fields-defs) — **Files:** `apps/cms/src/payload/fields/slug.ts:123`. **Root cause:** `as never` disables type-checking on payload.find. **Fix:** Import `CollectionSlug` and use `as CollectionSlug`; align SlugValidateOptions with Payload's ValidateOptions. **Verify:** Type-checks without `as never`.

- [ ] **SchemaPreviewField handleApply redundant branches + indexOf-in-filter** (low · trivial · fields-defs / ui-seo-suite) — **Files:** `apps/cms/src/payload/admin/components/SchemaPreviewField.tsx:725`, `:739`. **Root cause:** Duplicated overridable/merge branches; O(n²) indexOf inside filter. **Fix:** Collapse to `if (checked && (overridable || action === 'merge'))`; replace indexOf-in-filter with a forEach + explicit index. **Verify:** Same merge result; no quadratic lookup.

### Access / hooks

- [ ] **pages-path-builder JSDoc claims ValidationError but throws bare Error** (low · trivial · access-hooks) — **Files:** `apps/cms/src/payload/hooks/pages-path-builder.ts:30`. **Root cause:** Doc/code mismatch. **Fix:** Resolved once the P2 ValidationError fix lands; otherwise correct the comment. **Verify:** Comment matches code.

- [ ] **redirect-cycle-guard unsafe double-cast req.payload as RedirectsPayload** (low · small · access-hooks) — **Files:** `apps/cms/src/payload/hooks/redirect-cycle-guard.ts:130`. **Root cause:** `as unknown as` violates no-unsafe-cast. **Fix:** Type lookupFromPayload to accept `Pick<Payload, 'find'>` and pass req.payload directly. **Verify:** No double-cast; type-checks.

- [ ] **isAdminOrSelf uses unsafe cast instead of typed-user helper** (low · small · access-hooks) — **Files:** `apps/cms/src/payload/access/index.ts:20`. **Root cause:** Inconsistent with typed-user.ts; unreachable string branch. **Fix:** Add a `userId(user): number | null` helper to typed-user.ts and use it in isAdminOrSelf. **Verify:** No cast; access logic unchanged.

- [ ] **safe-regex miscategorizes over-length patterns as catastrophic-backtracking** (low · trivial · access-hooks) — **Files:** `apps/cms/src/payload/lib/safe-regex.ts:30`. **Root cause:** Over-length returns the wrong reason; editor sees a misleading message. **Fix:** Add a `'too-long'` reason and a matching message branch in formsCoerceHook. **Verify:** Over-length pattern shows the length message.

- [ ] **formSchemaVersionHook non-atomic read-then-increment** (low · medium · access-hooks) — **Files:** `apps/cms/src/payload/hooks/form-schema-version.ts:70`. **Root cause:** Concurrent saves can write the same version. **Fix:** Use an advisory lock or atomic conditional UPDATE; or document the low-probability drift in a comment. **Verify:** Concurrent saves bump correctly (or the limitation is documented).

- [ ] **parseInt(actorRaw,10) || null coerces user ID 0 to null** (info · trivial · access-hooks) — **Files:** `apps/cms/src/payload/hooks/schema-override-audit.ts:39`, `display-published-at-audit.ts:62`. **Root cause:** `|| null` coerces 0 (theoretical; serial IDs start at 1). **Fix:** Use a `Number.isFinite` guard instead of `|| null`. **Verify:** A 0 ID would be preserved.

### Endpoints

- [ ] **user-offboard reassign-content truncates at 1000 docs/collection** (medium · small · endpoints) — **Files:** `apps/cms/src/payload/endpoints/user-offboard.ts:83`. **Root cause:** No pagination loop; >1000 authored docs leave stale references. **Fix:** Add a `hasNextPage` loop (mirror export-leads-csv). **Verify:** All authored docs are reassigned for a prolific author.

- [ ] **publish-checklist endpoint accepts any collection slug** (medium · trivial · endpoints) — **Files:** `apps/cms/src/payload/endpoints/publish-checklist.ts:37`. **Root cause:** Route collection param cast to CollectionSlug with no allow-list; lateral findByID against arbitrary collections. **Fix:** Add a `PUBLISHABLE` Set and return 400 for slugs not in it before findByID. **Verify:** A non-publishable collection returns 400.

- [ ] **media-rename CopySource encodes the bucket/key separator slash** (medium · trivial · endpoints) — **Files:** `apps/cms/src/payload/endpoints/media-rename.ts:240`. **Root cause:** `encodeURIComponent` on the full `bucket/key` turns `/` into `%2F`, failing R2 CopyObject. **Fix:** Use `${r2.bucket}/${op.oldKey}` unencoded, or encode only key segments and rejoin with `/`. **Verify:** A media rename succeeds against R2.

- [ ] **export-leads-csv has no rate limiting (PII bulk export)** (medium · trivial · endpoints) — **Files:** `apps/cms/src/payload/endpoints/export-leads-csv.ts:133`. **Root cause:** Unthrottled bulk PII export; a compromised editor account can exfiltrate repeatedly. **Fix:** Add `checkAndRecord('export-csv:'+userId, { perMinute: 2, perDay: 20 })` before the build loop; add Retry-After. **Verify:** Rapid repeated exports are throttled.

- [ ] **preview token mint/redirect endpoints have no rate limiting** (low · trivial · endpoints) — **Files:** `apps/cms/src/payload/endpoints/preview.ts:56`. **Root cause:** Unbounded previewAudit writes per request. **Fix:** Add `checkAndRecord('preview-mint:'+userId, { perMinute: 10, perDay: 200 })` to both handlers. **Verify:** Preview-mint flooding is throttled.

- [ ] **Retry-After header absent from all 429 responses** (low · trivial · endpoints) — **Files:** `apps/cms/src/payload/endpoints/submit-lead.ts:122` (and peers). **Root cause:** Body has retryAfterSeconds but no Retry-After header. **Fix:** Add `'retry-after': String(...)` to all 429 headers. **Verify:** 429 responses include the header.

- [ ] **integrations-actions fixtureEvent sends non-standard fields for lead.submitted** (low · trivial · endpoints) — **Files:** `apps/cms/src/payload/endpoints/integrations-actions.ts:43`. **Root cause:** Adds email/title not in the real event shape; misleads schema-validating receivers. **Fix:** Align fixture to `{ formSlug, duplicate, source }` per the real dispatch call. **Verify:** Test event matches production shape.

- [ ] **sitemap/robots endpoints have no rate limiting** (low · trivial · endpoints) — **Files:** `apps/cms/src/payload/endpoints/sitemap.ts:56`. **Root cause:** Cache-bypassing direct hits trigger repeated full-collection scans. **Fix:** Add an in-memory per-IP limit (e.g. 5/min, 100/day). **Verify:** Direct-to-origin abuse is throttled; crawlers via cache unaffected.

### Jobs

- [ ] **shouldAutoRun permanently stops all crons on first false** (medium · small · jobs) — **Files:** `apps/cms/src/payload.config.ts:401`. **Root cause:** A false return calls `jobAutorunCron.stop()` permanently; a missing env at boot kills all crons until restart. **Fix:** Assert PAYLOAD_AUTO_RUN at init (onInit) with a clear warning; document in the deploy checklist that it must be set before the first tick. **Verify:** A misconfigured boot logs a clear warning rather than silently disabling crons.

- [ ] **retry-webhook silently resolves dead-letter rows when routing no longer matches** (medium · trivial · jobs) — **Files:** `apps/cms/src/payload/jobs/retry-webhook.ts:89`. **Root cause:** `results[0]` undefined is treated as success and resolved with no log. **Fix:** Add an explicit `if (!result)` branch resolving with `lastError: 'routing no longer matches destination config'` and a warn log. **Verify:** A routing-mismatch row resolves with an audit message.

- [ ] **analytics-cache-prune swallows failures and reports success** (medium · trivial · jobs) — **Files:** `apps/cms/src/payload/jobs/analytics-cache-prune.ts:28`. **Root cause:** catch returns output rather than throwing; failed prunes look green. **Fix:** Re-throw after logging (with retries:0 it fails visibly) or set retries:2 with backoff. **Verify:** A prune failure marks the job failed.

- [ ] **purge-leads-pii silently succeeds even when all redactions fail** (low · small · jobs) — **Files:** `apps/cms/src/payload/lib/retention/purge-leads-pii.ts:139`. **Root cause:** Always returns output; a 100% failure looks green, GDPR obligation unmet. **Fix:** In the task handler, log on errors and throw when `errors === scanned`. **Verify:** A total redaction failure fails the job.

- [ ] **reindex-meili uses logger.warn for normal completion** (low · trivial · jobs) — **Files:** `apps/cms/src/payload/jobs/reindex-meili.ts:89`. **Root cause:** Routine stats/completion logged at WARN, polluting aggregators. **Fix:** Add `info?` to the ReindexPayload interface and use logger.info for stats/completion; keep warn for upsert failures. **Verify:** Routine telemetry logs at info.

### Lib — integrations

- [ ] **TTL_MS comment for ga4DataApi says "15-min cron"** (low · trivial · lib-integrations) — **Files:** `apps/cms/src/payload/lib/integrations/cache.ts:136`. **Root cause:** Misleading comment vs 20-min TTL. **Fix:** Comment: "20-min TTL (15-min cron + 5 min slack)." **Verify:** Comment accurate.

- [ ] **refreshAllClarity returns ok:true when rows empty (misleading health)** (low · small · lib-integrations) — **Files:** `apps/cms/src/payload/lib/integrations/kinds/ms-clarity.ts:125`. **Root cause:** Empty-rows result is indistinguishable from a successful refresh. **Fix:** Add a `skipped`/`reason: 'no-rows-configured'` field to RefreshResult. **Verify:** Health dashboards can distinguish "nothing configured".

- [ ] **loadConfig allows plain-object config to bypass encryption** (low · small · lib-integrations) — **Files:** `apps/cms/src/payload/lib/integrations/kinds/types.ts:40`. **Root cause:** Returns object config unencrypted with no enforcement. **Fix:** Either require the `v1:` envelope, or add an audit-log warning when a plain-object config is loaded (with a migration to verify no plaintext rows). **Verify:** Plain-object configs are rejected or flagged.

### Lib — SEO / JSON-LD

- [ ] **Health score double-counts URL signal (slug-length + url-set)** (low · trivial · lib-seo-jsonld) — **Files:** `apps/cms/src/payload/lib/seo/health-score.ts:100-114`. **Root cause:** Both checks read the same field; url-set is a subset. **Fix:** Remove url-set or merge into one weight-2 check. **Verify:** Score calibration unchanged total weight.

- [ ] **Guide HowTo Layer-1 builder allows 1-step HowTo** (low · trivial · lib-seo-jsonld) — **Files:** `apps/cms/src/payload/lib/jsonld/addons/builders.ts:53` / how-to.ts:58-59. **Root cause:** Layer-1 guards `=== 0` while addons guards `< 2` (Google requires ≥2). **Fix:** Change how-to.ts to `if (source.steps.length < 2) return null;`. **Verify:** A 1-step guide HowTo is not emitted.

- [ ] **Image sitemap lacks explicit published status filter** (low · trivial · lib-seo-jsonld) — **Files:** `apps/cms/src/payload/lib/sitemap/image.ts:88-97`. **Root cause:** Uses draft:false but not the belt-and-suspenders `where: { _status: published }`; null-status docs slip through. **Fix:** Add the where clause matching the main sitemap. **Verify:** Only published docs contribute image entries.

- [ ] **parse-head-tags mutates a readonly field via `as any`** (low · trivial · lib-seo-jsonld) — **Files:** `apps/cms/src/payload/lib/seo/parse-head-tags.ts:72`. **Root cause:** Violates no-any; commentCount computed after construction. **Fix:** Compute commentCount before the object literal; remove the cast. **Verify:** No `as any`; same output.

- [ ] **JobPosting description walks Lexical body twice** (low · trivial · lib-seo-jsonld) — **Files:** `apps/cms/src/payload/lib/jsonld/dispatch.ts:495-503`. **Root cause:** extractFromLexical then collectLexicalText both traverse. **Fix:** Use a single `collectLexicalText`; drop the redundant wordCount check. **Verify:** Same description; one traversal.

### Lib — core

- [ ] **wireCustomEditView is a no-op called on every collection** (low · trivial · lib-core / crosscut-config-wiring) — **Files:** `apps/cms/src/payload/lib/wire-custom-edit-view.ts:20`. **Root cause:** Returns entity unchanged; the two `.map` passes add indirection with no effect. **Fix:** Remove the import and the two `.map(wireCustomEditView)` calls; re-introduce if the deferred edit-view wave lands. Coordinate with the dead edit-view files (P3 ui-edit-view). **Verify:** Config builds; no behavior change.

- [ ] **SVG href sanitization regex garbles mixed-quote hrefs** (low · small · lib-core) — **Files:** `apps/cms/src/payload/lib/sanitize-svg.ts:42`. **Root cause:** `[^"']` stops at the first quote regardless of opener; DOMPurify already neutralizes, so risk is low. **Fix:** Use two delimiter-specific passes, or walk the DOM after DOMPurify. **Verify:** A mixed-quote javascript: href is cleanly neutralized.

- [ ] **preview/jwt early-return leaks expected signature length** (low · small · lib-core) — **Files:** `apps/cms/src/payload/lib/preview/jwt.ts:122`. **Root cause:** Length short-circuit before timingSafeEqual (length is a public constant; theoretical only). **Fix:** Acceptable as-is; for strict constant-time pad providedBuf before comparing. **Verify:** N/A — documented as accepted, or padded comparison.

- [ ] **web-revalidate logger.info uses optional chaining inconsistently** (low · trivial · lib-core) — **Files:** `apps/cms/src/payload/lib/web-revalidate.ts:36`. **Root cause:** `info?.()` implies info may be undefined while warn does not. **Fix:** Remove `?.` from logger.info. **Verify:** Consistent logger calls.

- [ ] **normalizeAllSpans may re-visit re-parented child spans (double-wrap)** (low · small · lib-core) — **Files:** `apps/cms/src/payload/lib/normalize-rich-html.ts:189`. **Root cause:** Array.from snapshot processes parent before child; nested bold spans can double-wrap. **Fix:** Process spans in reverse document order (innermost first), or track processed nodes in a WeakSet. **Verify:** Nested bold spans produce a single `<strong>`.

- [ ] **download-token wire format not versioned** (info · small · lib-core) — **Files:** `apps/cms/src/payload/lib/resources/download-token.ts:6`. **Root cause:** No version prefix; algorithm migration would reject old tokens as malformed (short TTL limits blast radius). **Fix:** Prefix tokens with `v1.`. **Verify:** Tokens carry a version segment.

- [ ] **wire-analytics-tab guard skips tabs-nested fields (theoretical)** (info · trivial · lib-core) — **Files:** `apps/cms/src/payload/lib/wire-analytics-tab.ts:40`. **Root cause:** Top-level-only scan; no collection nests analyticsTab today. **Fix:** Add a comment, or recurse (covered by the P2 ui-integrations item). **Verify:** Documented or recursive.

### UI — field renderers / edit / list / nav / misc (polish)

- [ ] **CodeField label htmlFor targets a div (click-to-focus broken)** (medium · trivial · ui-field-renderers) — **Files:** `apps/cms/src/payload/admin/components/fields/CodeField.tsx:125`. **Root cause:** A div is not labelable. **Fix:** Remove htmlFor; use aria-labelledby on the host div (or a visually-hidden focus delegate). **Verify:** Clicking the label focuses the editor; AT associates the label.

- [ ] **RelationshipField function-valued filterOptions produces garbage params** (low · trivial · ui-field-renderers) — **Files:** `apps/cms/src/payload/admin/components/fields/RelationshipField.tsx:286`. **Root cause:** No function type guard before Object.entries. **Fix:** Guard `typeof filterOptions === 'object' && !== null` before use. **Verify:** Function filterOptions does not corrupt the query.

- [ ] **CheckboxField uses HTML disabled instead of readOnly semantics** (low · trivial · ui-field-renderers) — **Files:** `apps/cms/src/payload/admin/components/fields/CheckboxField.tsx:49`. **Root cause:** disabled announces "unavailable" vs read-only. **Fix:** Use `aria-readonly` + an onClick preventDefault guard + a CSS modifier. **Verify:** Read-only checkbox announced correctly.

- [ ] **TabsField parentSchemaPath missing tab name for named tabs** (low · trivial · ui-field-renderers) — **Files:** `apps/cms/src/payload/admin/components/fields/TabsField.tsx:85`. **Root cause:** schemaPath not updated for named tabs (no named tab fields exist today). **Fix:** Compute childSchemaPath with the tab name and pass it to RenderFields (mirror getFieldPaths). **Verify:** Named-tab fields carry the correct schemaPath.

- [ ] **CmsEditView/EditChrome/PublishMenu/CmsVersionsView are dead code** (low · small · ui-edit-view / crosscut-config-wiring) — **Files:** `apps/cms/src/payload/lib/wire-custom-edit-view.ts:20` (+ the four view files). **Root cause:** wireCustomEditView no-op orphans the edit-view shell; stale doc-status-bar-mount.ts:41 comment misleads. **Fix:** Delete the four files (or implement the deferred wave); update the stale comment and _editor.scss references. Coordinate with the lib-core no-op item. **Verify:** No orphaned edit-view components; comment corrected.

- [ ] **PublishChecklistBanner fetches once per mount (stale for existing docs)** (low · small · ui-edit-view) — **Files:** `apps/cms/src/payload/admin/components/PublishChecklistBanner.tsx:67`. **Root cause:** id doesn't change on save for existing docs, so the checklist never re-fetches after fixes. **Fix:** Listen for a save-success CustomEvent (or debounced useFormModified) to re-fetch; fix the JSDoc. **Verify:** Fixing a blocker and saving updates the banner.

- [ ] **SaveShortcut fallback selectors reference nonexistent class** (low · trivial · ui-edit-view) — **Files:** `apps/cms/src/payload/admin/components/SaveShortcut.tsx:38`. **Root cause:** `.doc-controls__publish` doesn't exist in Payload 3.84. **Fix:** Simplify to `getElementById('action-save'); if (!button) return;`. **Verify:** Save shortcut still works; no dead selectors.

- [ ] **EditorFullscreenToggle/SavedStateIndicator/SlashMenu/StockToolbarSuppressor body-wide observers and intervals** (low · small · ui-edit-view / ui-lexical-editor) — **Files:** `EditorFullscreenToggle.tsx:57`, `SavedStateIndicator.tsx:115`, `StockToolbarSuppressorPlugin.tsx:50`, `SlashMenuPlugin.tsx:342`. **Root cause:** Per-instance body-wide MutationObservers and a 500ms global interval add overhead. **Fix:** Scope observers to the form/toolbar container (or use a singleton/mount-count), debounce, and replace polling with usePathname/router events; for SlashMenu replace aria-pressed with focus management. **Verify:** Profiler shows reduced per-mutation work; menu a11y correct.

- [ ] **SavedViews preferences PATCH + dead columns field + persistence pattern** (low · medium · ui-list-view) — **Files:** `apps/cms/src/payload/admin/lib/saved-views.ts:53-78`, `:16`. **Root cause:** Patches a custom Users.preferences JSON through the full update pipeline (no cross-tab refresh) instead of usePreferences; columns field is dead. **Fix:** Migrate to `usePreferences().setPreference/getPreference`; remove or implement the columns field; drop the unsafe casts. **Verify:** Saved views persist via the preferences API and sync across tabs.

- [ ] **BulkActionBar Edit-Many URL hardcodes /admin** (low · trivial · ui-list-view) — **Files:** `apps/cms/src/payload/admin/components/views/list/BulkActionBar.tsx:85`. **Root cause:** Ignores configured routes.admin (a 404 only if the admin route is reconfigured). **Fix:** Read `config.routes?.admin ?? '/admin'` (useConfig already in the component) and build the URL from it. **Verify:** Edit-Many navigates correctly under a custom admin route.

- [ ] **ListHeader debounce timeout not cleared on unmount** (low · trivial · ui-list-view) — **Files:** `apps/cms/src/payload/admin/components/views/list/ListHeader.tsx:46-53`. **Root cause:** No cleanup; a pending timer can call refineListData after unmount. **Fix:** Add a useEffect cleanup clearing debounceRef. **Verify:** Navigating away mid-type fires no post-unmount update.

- [ ] **RelationshipCell module-level cache unbounded + collision risk** (low · small · ui-list-view) — **Files:** `apps/cms/src/payload/admin/components/RelationshipCell.tsx:23`. **Root cause:** Session-long cache shows stale titles; key can collide on fallback collectionSlug. **Fix:** Use a size-capped LRU; always include a consistent collection in the key. **Verify:** Renamed relationships refresh; no key collisions.

- [ ] **CommandPalette O(N) indexOf per row + missing combobox a11y** (low · small · ui-dashboard-nav) — **Files:** `apps/cms/src/payload/admin/components/CommandPalette.tsx:516`, `:604`. **Root cause:** O(n²) indexOf in render; role=menu used for a search palette. **Fix:** Build an id→index Map; refactor to combobox/listbox/option ARIA with aria-activedescendant. **Verify:** No quadratic lookup; AT announces option semantics.

- [ ] **NavBadges 25 requests/minute per tab** (low · medium · ui-dashboard-nav) — **Files:** `apps/cms/src/payload/admin/components/NavBadges.tsx:220`. **Root cause:** 25 separate count calls per 60s poll. **Fix:** Add a single `/api/admin-counts` endpoint returning all counts in one round-trip; poll that. **Verify:** One request per poll cycle.

- [ ] **ShortcutHelpDialog documents wrong meaning for Cmd+/** (low · small · ui-dashboard-nav) — **Files:** `apps/cms/src/payload/admin/components/ShortcutHelpDialog.tsx:29`. **Root cause:** Table says "Toggle focus mode" but Cmd+/ opens/closes the help dialog. **Fix:** Relabel the entry to "Open keyboard shortcut reference" (or wire Cmd+/ to fullscreen by removing the dialog's duplicate handler). **Verify:** The shortcut sheet matches actual behavior.

- [ ] **ToastBus auto-dismiss timeouts not cleared on unmount** (low · small · ui-dashboard-nav) — **Files:** `apps/cms/src/payload/admin/components/ToastBus.tsx:98`. **Root cause:** Timer handles discarded; post-unmount setState (harmless in React 18 but a leak). **Fix:** Track handles in a ref Map and clear on unmount. **Verify:** No dangling timers.

- [ ] **AnalyticsCards/Dashboard misc type-safety and timezone polish** (low · small · ui-dashboard-nav) — **Files:** `AnalyticsCards.tsx:73`, `Dashboard.tsx:431`, `UserMenu.tsx:18`. **Root cause:** Redundant `as unknown as` casts (Payload === BasePayload); server-time greeting; initialsFor returns empty for whitespace names. **Fix:** Accept BasePayload directly; move greeting to a client component; guard initialsFor with `|| '?'`. **Verify:** No-op casts removed; greeting reflects client time; whitespace name shows '?'.

### UI — SEO suite / integrations / auth (polish)

- [ ] **InboundRedirectsField is dead code (removed from seoSidebarFields)** (low · trivial · ui-seo-suite / crosscut-config-wiring) — **Files:** `apps/cms/src/payload/admin/components/InboundRedirectsField.tsx:1`. **Root cause:** 620-line component no longer wired; superseded by OutboundRedirectField/Redirects list. **Fix:** Delete the file. **Verify:** No imports break.

- [ ] **CanonicalField shows "Checking…" on every keystroke** (low · trivial · ui-seo-suite) — **Files:** `apps/cms/src/payload/admin/components/CanonicalField.tsx:67`. **Root cause:** Sets checking state before the 600ms debounce. **Fix:** Move `setHealth({ kind: 'checking' })` inside the setTimeout. **Verify:** Indicator shows checking only after the debounce fires.

- [ ] **SocialCardField XHR upload not aborted on unmount** (low · small · ui-seo-suite) — **Files:** `apps/cms/src/payload/admin/components/SocialCardField.tsx:249`. **Root cause:** No abort exposed; in-flight upload continues after unmount. **Fix:** Return an abort fn (or use fetch + AbortController) and abort in cleanup. **Verify:** Unmounting cancels the upload.

- [ ] **SeoAdvancedPanel uses speakableSelectors.length as a useMemo dep** (low · trivial · ui-seo-suite) — **Files:** `apps/cms/src/payload/admin/components/SeoAdvancedPanel.tsx:120`. **Root cause:** Editing an existing selector (same length) won't invalidate (benign). **Fix:** Use the array reference as the dep. **Verify:** Selector edits invalidate the memo.

- [ ] **DEFAULT_SITE_URL duplicated across four SEO files** (info · trivial · ui-seo-suite) — **Files:** `SerpPreviewField.tsx:39` (+ SchemaPreviewField, PermalinkField, _redirects-shared.ts). **Root cause:** Repeated env read with slight fallback differences. **Fix:** Extract a single shared constant and import it. **Verify:** One source of truth.

- [ ] **AuditTrail has no pagination (hard 50-row cap)** (low · small · ui-integrations) — **Files:** `apps/cms/src/payload/admin/components/integrations/AuditTrail.tsx:104`. **Root cause:** Fixed limit 50, no count disclosure. **Fix:** Return totalDocs; add a page param and prev/next + "Showing N of M". **Verify:** History beyond 50 is reachable.

- [ ] **AnalyticsTab shows no loading indicator during initial fetch** (low · trivial · ui-integrations) — **Files:** `apps/cms/src/payload/admin/components/integrations/AnalyticsTab.tsx:217`. **Root cause:** Returns null until both fetches resolve. **Fix:** Track a loading boolean and render an indicator while loading. **Verify:** Tab shows activity before data arrives.

- [ ] **Collections/Events MultiSelect control div has handlers but no role/tabIndex** (low · trivial · ui-integrations) — **Files:** `CollectionsMultiSelect.tsx:92`, `EventsMultiSelect.tsx:93`. **Root cause:** Interactive div without role/tabIndex; inner input already handles keyboard. **Fix:** Remove the redundant div onKeyDown (keep onClick); optionally add role=group + aria-labelledby. **Verify:** Axe reports no interactive-div violations.

- [ ] **DisableUserAction renders before document data loads** (low · trivial · ui-auth-misc) — **Files:** `apps/cms/src/payload/admin/components/DisableUserAction.tsx:26`. **Root cause:** alreadyDisabled false while data undefined → button flashes for disabled users. **Fix:** `const alreadyDisabled = !data || data.enabled === false;`. **Verify:** No flash on already-disabled accounts.

- [ ] **ShareLinkDialog retains stale label after failed mint** (low · trivial · ui-auth-misc) — **Files:** `apps/cms/src/payload/admin/components/CopyPreviewLink.tsx:80`. **Root cause:** setLabel('') only on success. **Fix:** Reset label on close via `useEffect(() => { if (!open) setLabel(''); }, [open])`. **Verify:** Reopening after a failed mint shows an empty label.

- [ ] **LeadsCsvTruncationBanner monkey-patches window.fetch (fragile)** (low · small · ui-auth-misc) — **Files:** `apps/cms/src/payload/admin/components/LeadsCsvTruncationBanner.tsx:31`. **Root cause:** Double-mount would leave fetch permanently patched. **Fix:** Add a `_cs_truncation_wrapped` marker guard or a module-level singleton. **Verify:** Patch applied once and restored cleanly.

- [ ] **JourneyMirrorWarning .then() calls have no .catch()** (low · trivial · ui-auth-misc) — **Files:** `apps/cms/src/payload/admin/components/JourneyMirrorWarning.tsx:44`. **Root cause:** Potential unhandled rejection (fetchTarget already catches internally). **Fix:** Add a no-op .catch or use an async IIFE with the cancelled guard. **Verify:** No floating-promise lint warning.

- [ ] **LockedReason uses both title and aria-label (double announcement)** (low · small · ui-auth-misc) — **Files:** `apps/cms/src/payload/admin/components/LockedReason.tsx:28`. **Root cause:** role=img with aria-label + title may read twice. **Fix:** Keep title for hover; rely on aria-label for AT (accept minor duplication or use a visually-hidden span). **Verify:** Screen reader reads the reason once.

- [ ] **FaqBulkPaste uses window.confirm; DsarActionsPanel/FlaggedLeadsTab use alert()** (low · small · ui-auth-misc) — **Files:** `FaqBulkPaste.tsx:291`, `DsarActionsPanel.tsx:49,72`, `FlaggedLeadsTab.tsx:121`. **Root cause:** Native confirm/alert is inconsistent with @cleanstart/ui ConfirmDialog/ToastBus. **Fix:** Replace confirm with ConfirmDialog and alert with showToast({ type: 'error' }). **Verify:** Branded, non-blocking dialogs/toasts.

### Crosscut — config wiring / responsive (polish)

- [ ] **MediaPicker/RelationshipPicker/SavedStateIndicator/BytesCell/DateCell are unwired dead code** (low · trivial · crosscut-config-wiring) — **Files:** `pickers/MediaPicker.tsx:1`, `pickers/RelationshipPicker.tsx`, `SavedStateIndicator.tsx:65`, `BytesCell.tsx:24`, `DateCell.tsx`. **Root cause:** Built but never imported/in importMap. **Fix:** Delete unused pickers and SavedStateIndicator (remove the cs-cms:saving dispatch); wire BytesCell to Media.filesize and DateCell to date columns then generate:importmap, or delete if deferred. **Verify:** No orphaned modules; wired cells render.

- [ ] **cleanstartBlockHandleFeature (drag-reorder) defined but not in editor config** (low · trivial · crosscut-config-wiring / ui-lexical-editor) — **Files:** `apps/cms/src/payload/lib/lexical/block-handle-feature.ts:11`. **Root cause:** Feature + plugin + client built but never added to features() and absent from importMap. **Fix:** Add to the features array (after QA) or delete the three files. **Verify:** Drag handle works, or files removed.

- [ ] **add-menu-feature ClientFeature path missing .ts extension** (low · trivial · ui-lexical-editor) — **Files:** `apps/cms/src/payload/lib/lexical/add-menu-feature.ts:6`. **Root cause:** Inconsistent with every other feature path; risks resolution failure on upgrade. **Fix:** Append `.ts` to the CleanstartAddMenuFeatureClient path. **Verify:** Path matches the other features.

- [ ] **EmbedPlugin insert-fallback branch is meaningless dead code** (low · trivial · ui-lexical-editor) — **Files:** `apps/cms/src/payload/admin/components/Embed/EmbedPlugin.tsx:107`. **Root cause:** getRootElement DOM guard is not a real fallback; $insertNodes already handles null selection. **Fix:** Replace with `$getRoot().selectEnd(); $insertNodes([embedNode]);`. **Verify:** Embed inserts at root when no selection.

- [ ] **Internal anchor/query links round-trip with path shape change** (low · small · ui-lexical-editor) — **Files:** `apps/cms/src/payload/admin/components/internal-routes.ts:63`. **Root cause:** toStoredUrl inserts an extra `/` before `#`/`?`, so `#anchor` displays as `/#anchor` after reload. **Fix:** Append hash/query directly to SITE_ORIGIN without the extra slash. **Verify:** `#anchor` round-trips losslessly.

- [ ] **LinkPopoverPlugin re-registers all three commands on every state change** (low · small · ui-lexical-editor) — **Files:** `apps/cms/src/payload/admin/components/LinkPopoverPlugin.tsx:243`. **Root cause:** state in deps churns stable command registrations. **Fix:** Split into separate effects: CREATE/EDIT `[editor, openForCurrentSelection]` and SELECTION_CHANGE `[editor, state]`. **Verify:** Stable commands no longer re-register on popover state changes.

- [ ] **normalizeRichHtml namespaced-tag sweep comment is misleading** (low · trivial · lib-core / ui-lexical-editor) — **Files:** `apps/cms/src/payload/lib/normalize-rich-html.ts:117`. **Root cause:** Parent removal implicitly removes descendants; comment implies independent removal. **Fix:** Add a clarifying comment (no functional change). **Verify:** Comment accurate.

- [ ] **wirePreviewControls stamps preview on taxonomy/form collections with no public route** (low · trivial · crosscut-config-wiring) — **Files:** `apps/cms/src/payload/lib/preview/paths.ts:13`. **Root cause:** PREVIEWABLE_COLLECTIONS includes authors/categories/forms; Preview 404s. **Fix:** Narrow PREVIEWABLE_COLLECTIONS to content-page collections only. **Verify:** Preview controls don't appear on taxonomy/form collections.

- [ ] **purgePreviewAuditTask absent from CLAUDE.md job table** (info · trivial · jobs / crosscut-config-wiring) — **Files:** `CLAUDE.md:303`, `apps/cms/src/payload.config.ts:342`. **Root cause:** Table lists 6 jobs; 10 are registered. **Fix:** Add previewAuditPurge (03:30), analyticsCachePrune (07:00), dashboardRefreshDaily (06:00), dashboardRefreshFrequent (15min), and the default-queue runner. **Verify:** Table matches payload.config.ts.

- [ ] **Input font sizes 13-14px trigger iOS Safari auto-zoom** (low · small · crosscut-responsive) — **Files:** `apps/cms/src/app/(payload)/styles/_forms.scss:178` (+ list-controls, ui-primitives). **Root cause:** Inputs < 16px zoom on focus in iOS Safari. **Fix:** Add a phone-scoped override `@media (pointer: coarse) and (hover: none) { input,textarea,select { font-size: 16px } }` (do not touch desktop density). **Verify:** No zoom on input focus on iOS.

- [ ] **Drawer close button 36px; modal close 28px (below touch floor)** (low · trivial · crosscut-responsive) — **Files:** `_overlays.scss:93`, `_overlays.scss:411`. **Root cause:** Below 44px. **Fix:** Expand effective tap area to 44px via padding/negative margin (content-box). **Verify:** Close targets ≥44px.

- [ ] **TableGridPicker cells 18px; LinkPopover/CommandPalette/ShortcutHelp narrow-viewport polish** (low · small · crosscut-responsive) — **Files:** `TableGridPicker.scss:39`, `_command-palette.scss:11`, `_chrome-extras.scss:24`. **Root cause:** Tiny touch cells; non-wrapping footer; non-fluid help panel. **Fix:** Scale grid cells under `pointer: coarse`; add flex-wrap to the cmdk footer; clamp the help panel `max-width: min(520px, calc(100vw - 32px))`. **Verify:** Usable on narrow viewports.

- [ ] **Aside nav min-height: 100vh + UserMenu popover clip on short viewports** (low · small · crosscut-responsive) — **Files:** `_user-menu.scss:69`. **Root cause:** Forces viewport-height floor and the popover can clip above the fold. **Fix:** Use `min-height: 100%`; add `max-height: calc(100vh - 80px); overflow-y: auto` to the popover. **Verify:** No double scrollbar; popover never clips.

- [ ] **Non-dashboard grids lack phone-width breakpoints** (info · small · crosscut-responsive) — **Files:** `_dashboard.scss:41` (reference). **Root cause:** Only the dashboard grid reflows; cs-blocks__picker, cs-schema-addons__grid, SEO og-preview grid do not. **Fix:** Add 1-column fallbacks at a 600px breakpoint (low priority, desktop-primary). **Verify:** Those grids stack on phones.

---

## Quick wins

High-leverage trivial/small fixes at high/critical severity — pull these into a first sprint.

- [ ] **checkAndRecord() always truthy — five endpoints return 429** (critical · trivial) — `apps/cms/src/payload/endpoints/integrations-inbound.ts:103` (+4). Change `if (limited)` → `if (!limited.ok)`.
- [ ] **Five cron tasks never auto-queue** (critical · trivial) — `apps/cms/src/payload/jobs/drain-lead-queue.ts:33` (+4). Add `schedule` arrays to each TaskConfig.
- [ ] **ColumnPicker setActiveColumns crash** (critical · small) — `apps/cms/src/payload/admin/components/views/list/ColumnPicker.tsx:19`. Mount TableColumnsProvider + use toggleColumn.
- [ ] **video/mp4 and zip uploads get .bin extension** (high · trivial) — `apps/cms/src/payload/lib/media-filename.ts:66-73`. Add MIME→ext mappings + drift test.
- [ ] **media-ingest-url SSRF bypass via redirects** (high · small) — `apps/cms/src/payload/endpoints/media-ingest-url.ts:129`. Use isSafePublicHttpUrl + redirect: 'manual' per-hop.
- [ ] **DSAR find/delete pagination** (high · small) — `apps/cms/src/payload/endpoints/leads-dsar.ts:64`. Collect all pages before deleting; keep in-memory email match.
- [ ] **ROUTE_PREFIX blogs /blog→/blogs** (high · trivial) — `apps/cms/src/payload/lib/route-prefixes.ts:18`. Fix + align tests + redirect-row migration.
- [ ] **ROUTE_PREFIX resources /resource→/resources** (high · trivial) — `apps/cms/src/payload/lib/route-prefixes.ts:20`. Fix + reconcile the whole map.
- [ ] **ROUTE_PREFIX events /events→/event** (high · trivial) — `apps/cms/src/payload/lib/route-prefixes.ts:21`. Fix + breadcrumb + tests.

---

## Decisions needed

Each phrased as a question for the product/eng owner.

- [ ] **MainNav/FooterNav/Announcements globals (under-implemented)** — `apps/cms/src/payload/globals/mainNav.ts:1`. These globals are editable in admin but have zero apps/web consumers (web uses hardcoded NAV_TREE / static Footer; Announcements has no consumer at all). Wire web SSR to fetch them (and build AnnouncementBanner), or remove the globals (and the B16 backlog reference) and keep nav code-managed? Document the decision in CLAUDE.md.

- [ ] **announcements.message unconditionally required (ux-question)** — `apps/cms/src/payload/globals/announcements.ts:28`. message is `required: true` with no condition, blocking saving the global while drafting (variant/dates) with active=false. Make message conditionally required only when active=true, or keep it always-required?

- [ ] **seoDefaults organizationJsonLd duplicated in CMS + static web schema (over-engineered)** — `apps/cms/src/payload/globals/seoDefaults.ts:143`. Organization JSON-LD is maintained both in the CMS global and in the static apps/web jsonld.tsx (the web app renders the static one). Replace the static schema with a CMS fetch in the web production phase, or accept the duplication and just add an admin warning note?

- [ ] **Section block includes Hero in nestableBlocks (ux-question)** — `apps/cms/src/payload/blocks/index.ts:28`. Hero-inside-Section is almost always wrong. Remove Hero from nestableBlocks (and add a constrained HeroCard if a contained hero is genuinely needed), or intentionally keep it allowed?

- [ ] **link.ts newTab hidden for doc/media kinds (ux-question)** — `apps/cms/src/payload/fields/link.ts:117` and `link.ts:116`. newTab is only shown for `kind === 'url'`, so internal doc/media links (e.g. PDFs) can't open in a new tab. Show newTab for all link kinds, or keep it external-only by design?

- [ ] **InlineImageInsertDialog Browse tab empty-body behavior (ux-question)** — `apps/cms/src/payload/admin/components/InlineImage/InlineImageInsertDialog.tsx:166`. The inner dialog stays open with an empty body while MediaBrowseDialog opens on top. Add a placeholder/hide the inner panel during browse, or accept the empty-flash on close?

- [ ] **toAbsoluteUrl duplicated in three files (over-engineered)** — `apps/cms/src/payload/admin/components/MediaField/MediaField.tsx:1108` (+ MediaBrowseDialog, MediaSelfChrome). Three copies (one with try/catch, two without). Extract to a shared `lib/url.ts` using the safe variant, or leave inline?

- [ ] **CmsEditView/EditChrome/PublishMenu/CmsVersionsView dead code (dead-code)** — `apps/cms/src/payload/lib/wire-custom-edit-view.ts:20`. The custom edit-view shell is fully built but wireCustomEditView is a permanent no-op so it never mounts. Proceed with the deferred wave that activates it, or delete the four files (and the no-op + stale comments)?

- [ ] **SchemaAddonsAdder/SchemaAddonsSection dead code (dead-code)** — `apps/cms/src/payload/admin/components/SchemaAddonsAdder.tsx:273` and `:131`. Both exports are unimported; they drive a permanently-hidden field. Delete them, or revive the Layer 2 schema-addons editor UI (unhide the field + proper blocks component)?

- [ ] **InboundRedirectsField dead code (dead-code)** — `apps/cms/src/payload/admin/components/InboundRedirectsField.tsx:1`. 620-line component removed from seoSidebarFields and superseded by OutboundRedirectField/Redirects list. Delete it, or restore the inline inbound-redirect CRUD card?

- [ ] **seoField dead export (dead-code)** — `apps/cms/src/payload/fields/seo.ts:440`. Exported but never consumed externally (only seoFieldHidden is used). Remove the export/inline it, or keep it as a public API?

- [ ] **MediaPicker / RelationshipPicker dead code (dead-code)** — `apps/cms/src/payload/admin/components/pickers/MediaPicker.tsx:1` and RelationshipPicker.tsx. Built but unreferenced (superseded by MediaBrowseDialog / stock drawer). Delete both, or wire them to a planned consumer?

- [ ] **SavedStateIndicator dead code (dead-code)** — `apps/cms/src/payload/admin/components/SavedStateIndicator.tsx:65`. Removed from admin.components.actions but the 205-line file + its cs-cms:saving event dispatcher remain. Delete it (and the dispatch), or re-introduce the "Saved X ago" pill?

- [ ] **BytesCell / DateCell dead code (dead-code)** — `apps/cms/src/payload/admin/components/BytesCell.tsx:24` and DateCell.tsx. Built but never wired as list-view cells. Wire BytesCell to Media.filesize and DateCell to date columns (then generate:importmap), or delete them?

- [ ] **cleanstartBlockHandleFeature dead code (dead-code)** — `apps/cms/src/payload/lib/lexical/block-handle-feature.ts:1`. Drag-reorder feature chain fully implemented but never added to editor-config.ts. Activate it (after QA of the experimental DraggableBlockPlugin) or delete the three files?

- [ ] **wireCustomEditView no-op overhead (dead-code)** — `apps/cms/src/payload/lib/wire-custom-edit-view.ts:20`. The function returns its arg unchanged but is `.map`-ed over every collection and global. Remove the import + the two map passes now, or keep them pending the deferred edit-view wave?

- [ ] **wirePreviewControls on non-content collections (ux-question)** — `apps/cms/src/payload/lib/preview/paths.ts:13`. PREVIEWABLE_COLLECTIONS includes authors/categories/newsCategories/knowledgeCategories/forms, which have no public preview route, so Preview 404s. Narrow the list to content-page collections only, or intentionally keep preview controls on taxonomy/forms?

- [ ] **CLAUDE.md @payloadcms/ui allowlist vs enforcement script (convention drift)** — `apps/cms/scripts/check-payload-ui-allowlist.ts:20`. The documented hook list is shorter than the enforced script list (useForm, useAllFormFields, useRowLabel, useNav, useStepNav, useServerFunctions, etc.). Update CLAUDE.md to match the script (treating these as data-layer hooks), and is each of those acceptable as data-layer-only?

- [ ] **PublishChecklistBanner stale-after-fix (ux-question)** — `apps/cms/src/payload/admin/components/PublishChecklistBanner.tsx:67`. Should the banner re-fetch the checklist after a save (via a save-success event/debounced useFormModified), or is fetch-once-per-mount acceptable for the current workflow?
