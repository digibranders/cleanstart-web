# CleanStart CMS Audit — Backend (collections, globals, blocks, fields, hooks, endpoints, jobs, libs)

Scope: Payload schema, access control, hooks, REST endpoints, cron jobs, and server libraries under `apps/cms/src/payload`.

## Summary table

| Area | Critical | High | Medium | Low | Info |
|---|---|---|---|---|---|
| collections-content | 0 | 0 | 11 | 3 | 0 |
| collections-taxonomy-media | 0 | 1 | 5 | 7 | 1 |
| collections-ops | 1 | 0 | 6 | 4 | 0 |
| globals | 0 | 0 | 6 | 6 | 1 |
| blocks | 0 | 0 | 3 | 6 | 0 |
| fields-defs | 0 | 0 | 3 | 5 | 0 |
| access-hooks | 0 | 0 | 3 | 5 | 1 |
| endpoints | 1 | 2 | 6 | 4 | 0 |
| jobs | 1 | 1 | 4 | 1 | 1 |
| lib-integrations | 0 | 0 | 4 | 3 | 0 |
| lib-seo-jsonld | 0 | 4 | 5 | 5 | 0 |
| lib-core | 0 | 0 | 2 | 6 | 3 |

---

## collections-content

> The nine content collections are generally well-structured with solid access control, versioned drafts, conditional validation, and hook wiring for the SEO/webhook/search pipeline. The registration-mode discriminator and resource gateForm gating are implemented correctly. Issues cluster around three themes: (1) a hardcoded wrong URL prefix in Guides.ts's PermalinkField and a missing abstract field in Guides and Pages that silently breaks SEO description auto-sync; (2) Events, Webinars, and PodcastEpisodes all omit search-sync, indexNow, and webhook hooks that every peer collection carries, leaving those content types out of site search and Teams notifications; (3) Guides and KnowledgeBase carry a tableOfContents field but no tocDepth selector, permanently locking TOC depth to H2-only with no editor control. Convention violations are present but isolated: bare throw new Error in pagesPathBuilderHook instead of Payload's ValidationError.

Counts: 0 critical · 0 high · 11 medium · 3 low · 0 info

### [MEDIUM] Guides PermalinkField hardcodes wrong URL prefix (/guides vs /guide)  (confidence: high · effort: trivial · status: verified)

- **File:** `apps/cms/src/payload/collections/Guides.ts:226`  **Category:** logic-bug
- **Problem:** The Guides PermalinkField clientProps hardcodes pathPrefix: '/guides' (plural), but ROUTE_PREFIX.guides is '/guide' (singular) and the deployed apps/web route is /guide/[slug]. Every published guide's permalink in the admin sidebar shows the wrong URL. Any link copied from that chip will 404 in production.
- **Evidence:**
```
clientProps: { pathPrefix: '/guides' }  <- line 226
ROUTE_PREFIX.guides = '/guide'  <- route-prefixes.ts:19
seoSidebarFields({ pathPrefix: '/guide', ... })  <- Guides.ts:234
```
- **Fix:** Import ROUTE_PREFIX and change line 226 to clientProps: { pathPrefix: ROUTE_PREFIX.guides } to keep the PermalinkField consistent with the SEO sidebar and slug-change redirect hook. [verifier note: The recommended fix is correct and is the right pattern: import ROUTE_PREFIX from the existing single-source-of-truth module and use `clientProps: { pathPrefix: ROUTE_PREFIX.guides }` so the PermalinkField stays in lockstep with the SEO sidebar and the slug-change redirect hook. One caveat the recommendation should note: `clientProps` is serialized and passed to a client component, so the imported value must be a plain string literal at build time — `ROUTE_PREFIX.guides` is a const string ('/guide'), which serializes fine, so this is safe. Severity correction: I downgraded from "high" to "medium". The bug is real and editor-facing, but the blast radius is limited to a cosmetic/UX defect in the admin permalink chip (wrong copied URL); it does not corrupt data, break publishing, affect the actual rendered public URLs, or break the slug-change redirect hook (which correctly uses ROUTE_PREFIX). The other 6 collections appear to derive their permalink prefix consistently, so this is an isolated one-line inconsistency in a single collection. Worth fixing, but not high-severity.]

### [MEDIUM] Guides seoSidebarFields descriptionSource references non-existent abstract field  (confidence: high · effort: small · status: verified)

- **File:** `apps/cms/src/payload/collections/Guides.ts:234`  **Category:** logic-bug
- **Problem:** seoSidebarFields is called with descriptionSource: 'abstract' but Guides defines no abstract field. SeoDescriptionField.tsx reads useField({ path: 'abstract' }) which always returns undefined. The auto-sync pushes empty string into seo.description, the placeholder reads 'Set the abstract above first' permanently, and the SEO health score always flags a missing description for every guide.
- **Evidence:**
```
seoSidebarFields({ pathPrefix: '/guide', descriptionSource: 'abstract' })  <- Guides.ts:234
grep -c "name: 'abstract'" Guides.ts -> 0
Blogs, News, KnowledgeBase all have { name: 'abstract', type: 'textarea' }
```
- **Fix:** Add an abstract textarea field to Guides.ts after slugField, matching the pattern in Blogs.ts:50-55. Then the descriptionSource binding will work without any further change. [verifier note: Downgraded high→medium: no crash/data loss; editors can still set a meta description manually, so it is a poor default + confusing placeholder rather than a permanent failure. The recommended fix is correct: add { name: 'abstract', type: 'textarea' } after slugField in Guides.ts, matching Blogs.ts:50. This is the genuine fix (not a workaround) because Guides has no existing plain-text lead/summary field to repoint descriptionSource at (it has body richText and articleSections, neither suitable). Note the new abstract field will alter the generated Postgres schema, so a Payload migration + payload generate:types run is required, not just the field addition.]

### [MEDIUM] Pages seoSidebarFields references abstract field that does not exist on Pages  (confidence: high · effort: small · status: verified)

- **File:** `apps/cms/src/payload/collections/Pages.ts:187`  **Category:** logic-bug
- **Problem:** seoSidebarFields({ pathPrefix: '', descriptionSource: 'abstract', urlSource: 'path' }) is called but Pages has no abstract field. SeoDescriptionField will perpetually read an empty source value, always pushing '' into seo.description and showing 'Set the abstract above first' placeholder. Editors must manually type SEO descriptions for every page; the auto-sync never engages.
- **Evidence:**
```
seoSidebarFields({ pathPrefix: '', descriptionSource: 'abstract', urlSource: 'path' })  <- Pages.ts:187
No name: 'abstract' field anywhere in Pages.ts fields array (verified by grep).
```
- **Fix:** Add a summary or abstract textarea field to Pages.ts for page-level meta copy, then change descriptionSource to match its name. If a short-description field is not appropriate for pages, change descriptionSource to 'title' as a fallback, though explicit abstract copy is strongly preferred for SEO. [verifier note: Severity reduced from high to medium. This is degraded UX / a non-functioning convenience plus a misleading placeholder, not a correctness failure that loses data or breaks publishing — editors can still type SEO descriptions manually, and the empty-description fallback behaves the same as any page that simply has no description. No crash, no security/data impact. Fix correction: the recommendation's primary fix (add an `abstract`/summary textarea to Pages and point descriptionSource at it) is the right one and matches the convention used by every other content collection. The proposed fallback `descriptionSource: 'title'` should be avoided — an SEO meta description that merely echoes the title is poor for SERP/snippets and would defeat the field's purpose. Also worth fixing in the same pass: Jobs.ts:239 and Guides.ts:234 have the identical mismatch and would benefit from the same `abstract` field (or a corrected descriptionSource).]

### [MEDIUM] Events missing searchSync, webhooksPublish, indexNow, and afterDelete hooks  (confidence: high · effort: trivial · status: verified)

- **File:** `apps/cms/src/payload/collections/Events.ts:280`  **Category:** under-implemented
- **Problem:** Events.ts afterChange only wires slugChangeRedirectHook and schemaOverrideAuditHook. Missing: searchSyncAfterChangeHook (events never appear in site search), webhooksPublishAfterChangeHook (Teams never notified on event publish), indexNowPublishAfterChangeHook (Bing/Yandex never pinged), and there is no afterDelete block at all (deleted events linger in the Meilisearch index). All peer content collections have all four.
- **Evidence:**
```
afterChange: [
  slugChangeRedirectHook('events'),
  schemaOverrideAuditHook('events'),
],
// no afterDelete  <- Events.ts:280-284
```
- **Fix:** Add searchSyncAfterChangeHook('events'), webhooksPublishAfterChangeHook('events'), indexNowPublishAfterChangeHook('events') to afterChange. Add afterDelete: [searchSyncAfterDeleteHook('events')]. Import the three missing hooks. [verifier note: Two corrections to the finding: (1) The recommended fix is correct (add searchSyncAfterChangeHook('events'), webhooksPublishAfterChangeHook('events'), indexNowPublishAfterChangeHook('events') to afterChange; add afterDelete: [searchSyncAfterDeleteHook('events')]; import the missing hooks). But the same fix should also be applied to Webinars.ts, which has the identical gap (same priority 70, same membership in SEARCH_INDEXED_COLLECTIONS) — the finding wrongly implies Events is the only collection missing these. PodcastEpisodes also lacks them but is not in SEARCH_INDEXED_COLLECTIONS so its situation differs. (2) Severity reduced from high to medium: events still get indexed by the daily drift-reindex job for ADDS when drift crosses the threshold, providing partial mitigation for the search-visibility gap. However the delete-lingering issue has no mitigation at all (reindex job only upserts, never prunes), and the missing Teams/IndexNow notifications are genuine functional losses. Note: confirm searchSyncAfterChangeHook/buildSearchDocument actually support the 'events' collection schema before wiring, since events carry an eventStatus lifecycle that other content types lack.]

### [MEDIUM] Webinars missing searchSync, webhooksPublish, indexNow hooks and afterDelete  (confidence: high · effort: trivial · status: verified)

- **File:** `apps/cms/src/payload/collections/Webinars.ts:237`  **Category:** under-implemented
- **Problem:** Webinars.ts afterChange registers only slugChangeRedirectHook, schemaOverrideAuditHook, and displayPublishedAtAuditHook. Missing: searchSyncAfterChangeHook (webinars never in site search), webhooksPublishAfterChangeHook (Teams never notified), indexNowPublishAfterChangeHook (Bing/Yandex never pinged), and no afterDelete block (deleted webinars remain in search index).
- **Evidence:**
```
afterChange: [
  slugChangeRedirectHook('webinars'),
  schemaOverrideAuditHook('webinars'),
  displayPublishedAtAuditHook('webinars'),
]  <- Webinars.ts:239-243
// no afterDelete
```
- **Fix:** Mirror the Blogs/Guides hook pattern: add searchSyncAfterChangeHook('webinars'), webhooksPublishAfterChangeHook('webinars'), indexNowPublishAfterChangeHook('webinars') to afterChange, and add afterDelete: [searchSyncAfterDeleteHook('webinars')]. [verifier note: The recommended fix is correct and directly applicable: add searchSyncAfterChangeHook('webinars'), webhooksPublishAfterChangeHook('webinars'), indexNowPublishAfterChangeHook('webinars') to afterChange, and add afterDelete: [searchSyncAfterDeleteHook('webinars')]. The required imports must also be added to Webinars.ts (currently absent) — mirror Blogs.ts lines 19-25. Severity adjusted high -> medium: real-time publish sync, Teams notifications, and IndexNow pings are genuinely missing for webinars, but the daily reindex job (reindex-meili.ts) does include webinars in SEARCH_INDEXED_COLLECTIONS and provides a self-healing path via drift detection, so the impact is delayed/degraded indexing rather than total absence. The afterDelete gap is the most durable defect: the reindex job only upserts, never removes, so deleted webinars persist in search until a full index rebuild. Scope note: Events.ts has the identical gap. If this finding is actioned, fix Events at the same time — same four hooks, slug 'events'. Note events can be physical so confirm indexNow/search treatment is desired there, but the search/webhook/afterDelete omission is the same bug.]

### [MEDIUM] PodcastEpisodes missing slugChangeRedirect, searchSync, webhooksPublish, indexNow, schemaOverrideAudit, afterDelete, and all SEO fields  (confidence: high · effort: small · status: verified)

- **File:** `apps/cms/src/payload/collections/PodcastEpisodes.ts:175`  **Category:** under-implemented
- **Problem:** PodcastEpisodes has only stampYoutubeVideoIdHook, firstPublishHook, and displayPublishedAtBackfillHook in beforeChange, and only displayPublishedAtAuditHook in afterChange. Missing entirely: slugChangeRedirectHook (slug renames create 404s with no auto-redirect), searchSyncAfterChangeHook and searchSyncAfterDeleteHook (episodes never searchable; deletes never purge the index), webhooksPublishAfterChangeHook (Teams not notified), indexNowPublishAfterChangeHook (Bing/Yandex not pinged), schemaOverrideAuditHook (no audit trail for seo.additionalSchema changes), and there are no SEO fields — seoSidebarFields/seoFieldsForSidebar are absent, so podcast episodes have no per-episode meta title, description, OG image, or canonical control.
- **Evidence:**
```
hooks: {
  beforeChange: [stampYoutubeVideoIdHook, firstPublishHook(), displayPublishedAtBackfillHook],
  afterChange: [displayPublishedAtAuditHook('podcastEpisodes')],
}  <- PodcastEpisodes.ts:175-177
No afterDelete. No seoSidebarFields. No slugChangeRedirectHook.
```
- **Fix:** Add all missing hooks to match Blogs as a baseline. Add seoSidebarFields and seoFieldsForSidebar calls with an appropriate pathPrefix (e.g. ROUTE_PREFIX.podcastEpisodes once added to route-prefixes.ts). The abstract field already exists on PodcastEpisodes so descriptionSource: 'abstract' will work. [verifier note: The fix recommendation is incomplete/partly wrong and would not work as written. Three corrections: (1) Adding ROUTE_PREFIX.podcastEpisodes as a flat 'prefix/slug' value is incorrect — podcast's actual web route is /podcast/episode/[slug] (PODCAST_PREFIX in lib/preview/paths.ts), which does not fit the flat prefix/slug shape ROUTE_PREFIX/collectionUrlFromSlug assumes. indexNowPublishAfterChangeHook and the canonical resolver both go through docCanonicalUrl -> collectionUrlFromDoc -> ROUTE_PREFIX, so podcast needs a special case in those resolvers (like the existing pages branch), not just a flat map entry. (2) Adding searchSyncAfterChangeHook('podcastEpisodes') alone is a no-op: syncDocument short-circuits with 'collection-not-indexed' because podcastEpisodes is absent from SEARCH_INDEXED_COLLECTIONS in lib/search/index-schema.ts. To actually make episodes searchable you must also add 'podcastEpisodes' to SEARCH_INDEXED_COLLECTIONS and ensure buildSearchDocument can build a doc for it (and produce a valid URL). (3) The 'deletes never purge the index' sub-claim is technically vacuous since nothing was ever indexed. Net: the under-implementation is real and worth fixing, but the proposed one-line-prefix + copy-Blogs-hooks plan understates the work — route resolution and the search allow-list are the load-bearing pieces.]

### [MEDIUM] Guides and KnowledgeBase have tableOfContents but no tocDepth selector — TOC permanently H2-only  (confidence: high · effort: small · status: unverified)

- **File:** `apps/cms/src/payload/collections/Guides.ts:292`  **Category:** under-implemented
- **Problem:** Both Guides.ts and KnowledgeBase.ts include a tableOfContents array field and pass it to bodyStatsHook, but neither defines a tocDepth select field nor passes tocLevelsField to bodyStatsHook. Without tocLevelsField the hook falls back to tocLevels ?? [2] — fixed H2-only. Guides and KB articles frequently use H3/H4 section structure; the TOC silently omits all sub-headings. Blogs.ts correctly has both the tocDepth field (line 217) and tocLevelsField: 'tocDepth' passed to bodyStatsHook (line 298).
- **Evidence:**
```
bodyStatsHook({
  fields: { readingMinutes, wordCount, tableOfContents }
  // no tocLevelsField
})  <- Guides.ts:292-298

// Blogs has:
bodyStatsHook({ ..., tocLevelsField: 'tocDepth' })  <- Blogs.ts:298
```
- **Fix:** Copy the tocDepth select field definition from Blogs.ts lines 217-229 into both Guides.ts and KnowledgeBase.ts, then pass tocLevelsField: 'tocDepth' to their bodyStatsHook calls.

### [MEDIUM] Events startsAt is not required — event can be published without a start date  (confidence: high · effort: trivial · status: unverified)

- **File:** `apps/cms/src/payload/collections/Events.ts:43`  **Category:** logic-bug
- **Problem:** The startsAt field has no required: true. An editor can publish an event with no start date. This breaks Schema.org Event rich results (startDate is required by Google), the endsAt validation (which checks end >= start but passes when startsAt is null), the post-event CTA logic (which compares startsAt to now), and the eventStatusTimestampsHook (which reads prev.startsAt). The venue field at line 38 correctly has required: true; startsAt was likely missed.
- **Evidence:**
```
{ name: 'startsAt', type: 'date', admin: { date: { pickerAppearance: 'dayAndTime' } } }  <- Events.ts:43-46
No required: true. Compare: { name: 'venue', type: 'text', required: true }  <- line 38
```
- **Fix:** Add required: true to the startsAt field in Events.ts. For Webinars, add a validate function on startsAt that returns an error when webinarType !== 'on-demand' and the value is empty, mirroring the registrationUrl/registrationForm conditional-required pattern already in use.

### [MEDIUM] Webinars endsAt missing start/end ordering validation that Events has  (confidence: high · effort: trivial · status: unverified)

- **File:** `apps/cms/src/payload/collections/Webinars.ts:78`  **Category:** logic-bug
- **Problem:** Events.ts has a validate function on endsAt that returns 'End time cannot be before start time.' when end < start (Events.ts:51-64). Webinars.ts has identical startsAt/endsAt fields but no validate on endsAt. An editor can save a webinar with endsAt before startsAt with no warning. Schema.org Event requires endDate >= startDate.
- **Evidence:**
```
// Webinars.ts endsAt:
{ name: 'endsAt', type: 'date', admin: { condition: ... } }  <- lines 78-84, no validate

// Events.ts endsAt has validate:
if (end < start) return 'End time cannot be before start time.';  <- Events.ts:62
```
- **Fix:** Extract the endsAt validate function from Events.ts into a shared validateEndsAfterStarts helper, then apply it to Webinars.ts endsAt as well.

### [MEDIUM] pagesPathBuilderHook throws bare Error instead of Payload ValidationError — editor sees generic 500  (confidence: high · effort: trivial · status: unverified)

- **File:** `apps/cms/src/payload/hooks/pages-path-builder.ts:56`  **Category:** error-handling
- **Problem:** When the parent chain creates a cycle or exceeds MAX_DEPTH the hook throws new Error(...). In Payload 3, a bare Error thrown from a beforeChange hook produces a 500 with a generic toast, not a field-level validation message. Editors see 'Something went wrong' instead of 'Parent chain creates a cycle.' Other parts of the codebase correctly import and throw Payload's ValidationError (publish-gate.ts:171, Media.ts:55, Users.ts:51). The comment in the hook (line 30) itself says 'result in a thrown ValidationError' — mismatching the actual code.
- **Evidence:**
```
throw new Error('Pages: parent chain creates a cycle; cannot compute path.');  <- line 56
throw new Error(`Pages: parent chain exceeds maximum depth of ${MAX_DEPTH}.`);  <- line 59

Correct pattern from publish-gate.ts:171:
throw new ValidationError({ errors: [{ message: '...', field: 'parent' }] });
```
- **Fix:** Import ValidationError from 'payload' and replace both throws with: throw new ValidationError({ errors: [{ message: 'Parent chain creates a cycle.', field: 'parent' }] }) so Payload surfaces the error as a form-level field validation message.

### [MEDIUM] Webinars registrationUrl validate blocks save for on-demand webinars that have no registration flow  (confidence: high · effort: small · status: unverified)

- **File:** `apps/cms/src/payload/collections/Webinars.ts:109`  **Category:** logic-bug
- **Problem:** An on-demand webinar defaults to registrationMode: 'external'. The registrationUrl validate fires regardless of webinarType and requires a non-empty URL when mode is external. An editor creating an on-demand webinar (which typically links to a recording, not a registration page) will be blocked on first save. The admin.condition hides the registrationUrl input for on-demand types, but server-side validation still runs.
- **Evidence:**
```
// registrationUrl validate:
if (siblingData?.registrationMode !== 'external') return true;
if (typeof value !== 'string' || value.trim().length === 0) {
  return 'Registration URL is required...';
}  <- Webinars.ts:113-116

// registrationMode still shown and required for on-demand:
required: true, defaultValue: 'external'  <- Webinars.ts:95-96
```
- **Fix:** Add a webinarType guard to both registrationUrl and registrationForm validate functions: if (siblingData?.webinarType === 'on-demand') return true before the existing checks. Alternatively, set registrationMode.admin.condition to hide it entirely for on-demand and change its required to false when webinarType is on-demand via a validate.

### [LOW] eventStatusTimestampsHook does not clear previousStartDate when returning from postponed to scheduled  (confidence: medium · effort: trivial · status: unverified)

- **File:** `apps/cms/src/payload/hooks/event-status-timestamps.ts:39`  **Category:** logic-bug
- **Problem:** The hook clears cancelledAt when transitioning away from cancelled. It does not clear previousStartDate when transitioning away from postponed. An event/webinar that was rescheduled (postponed + new startsAt) and later moved back to scheduled retains a stale previousStartDate, which continues to be emitted in Schema.org JSON-LD as Event.previousStartDate — falsely signalling to Google that a rescheduled event is still rescheduled. This affects both Events and Webinars since they share the hook.
- **Evidence:**
```
// cancelledAt is cleared:
} else if (next.eventStatus !== 'cancelled' && prev.eventStatus === 'cancelled') {
  result.cancelledAt = null;
}
// No equivalent for previousStartDate when leaving postponed.  <- event-status-timestamps.ts:39-41
```
- **Fix:** Add a parallel block: if (next.eventStatus !== 'postponed' && prev.eventStatus === 'postponed') { result.previousStartDate = null; } mirroring the cancelledAt clearing pattern.

### [LOW] Resources downloadCount description says 'Always 0 today' but the endpoint already increments it  (confidence: high · effort: trivial · status: unverified)

- **File:** `apps/cms/src/payload/collections/Resources.ts:153`  **Category:** dead-code
- **Problem:** The downloadCount field description reads 'Incremented by the resource-download endpoint when added (Phase F). Always 0 today.' The resource-download endpoint was shipped and does increment downloadCount using overrideAccess: true (resources-download.ts:123-128). The stale description will mislead editors and future engineers into thinking the counter is non-functional.
- **Evidence:**
```
description: 'Incremented by the resource-download endpoint when added (Phase F). Always 0 today.'  <- Resources.ts:153
await req.payload.update({ ..., data: { downloadCount: (resource.downloadCount ?? 0) + 1 }, overrideAccess: true })  <- resources-download.ts:123-128
```
- **Fix:** Update the field description to: 'Automatically incremented each time a visitor downloads this resource.' Remove the Phase F reference and 'Always 0 today' claim.

### [MEDIUM] schemaAddonsField hidden: true makes the entire Layer 2 schema block UI unreachable for editors  (confidence: high · effort: medium · status: unverified)

- **File:** `apps/cms/src/payload/fields/schema-addons.ts:302`  **Category:** under-implemented
- **Problem:** schemaAddonsField is set to admin: { hidden: true }. The comment explains that Payload's blocks renderer mounts wrapper divs but never renders per-block fields when the parent is hidden, so the UI was intentionally disabled pending a rendering fix tracked in SchemaPreviewField.tsx. The feature appears complete at the data layer (six block types defined, JSON-LD dispatcher reads them) but is entirely unreachable from the admin UI. No editor can create or edit HowTo, Video, Review, SoftwareApplication, FAQ, or Breadcrumb schema add-ons.
- **Evidence:**
```
admin: {
  hidden: true,  <- schema-addons.ts:302
  // comment: 'To re-surface the editor UI, set hidden: false here AND fix the per-block field rendering'
}
```
- **Fix:** Track this in BACKLOG.md if not already present. When the SchemaPreviewField rendering fix is complete, flip hidden: false simultaneously with the SchemaPreviewField change so both sides go live together.

---

## collections-taxonomy-media

> The scope is generally well-structured with good test coverage for the cycle guard and media rename logic. The taxonomy cycle detection is solid and the SVG sanitization is layered correctly. However six concrete bugs were found: (1) the AuthorCredibilityField widget queries the knowledgeBase collection with a where[authors][in] filter but that collection has no 'authors' field — only 'reviewedBy' — so KB articles are permanently invisible to the count, silently understating every author's output; (2) video/mp4 and zip file uploads have their filename extension rewritten to '.bin' because those MIME types are absent from canonicalExtensionForMime's mapping; (3) the taxonomy cycle-guard throws a bare new Error() instead of a Payload ValidationError, which produces a 500 HTTP response in the admin rather than an inline form error; (4) Media's beforeValidate size-check also throws a bare Error for the same reason; (5) the collision-check loop in Media.ts exits after 50 iterations with the last candidate unverified (off-by-one); and (6) Jobs.ts is missing searchSync, webhooksPublish, and indexNow afterChange hooks that every other publishable content collection carries. There are also two under-implemented stubs: the Jobs closedAt field is set read-only with no automation that ever writes it, and the expiresAt auto-close cron ("Phase G") is referenced in a field description but not built.

Counts: 0 critical · 1 high · 5 medium · 7 low · 1 info

### [HIGH] video/mp4 and zip uploads get .bin extension from canonicalExtensionForMime  (confidence: high · effort: trivial · status: verified)

- **File:** `apps/cms/src/payload/lib/media-filename.ts:66-73`  **Category:** runtime-bug
- **Problem:** canonicalExtensionForMime maps PASSTHROUGH_MIME_TO_EXT (svg, pdf) and converts all raster images to 'webp'. video/mp4 and application/zip fall through to the final return 'bin'. Because Media.ts's beforeValidate hook calls this to build the canonical filename and then assigns file.name = candidate, MP4 and ZIP uploads are stored with a .bin extension in both R2 and the DB. The files become effectively unservable as their declared MIME and the extension disagree.
- **Evidence:**
```
PASSTHROUGH_MIME_TO_EXT = { 'image/svg+xml': 'svg', 'application/pdf': 'pdf' } — video/mp4 and application/zip are absent. Runtime verification: canonicalExtensionForMime('video/mp4') returns 'bin'.
```
- **Fix:** Add the missing MIME types to PASSTHROUGH_MIME_TO_EXT: 'video/mp4' → 'mp4', 'application/zip' → 'zip', 'application/x-zip-compressed' → 'zip'. Extend the test suite to cover these types. [verifier note: Severity high is appropriate: video/zip are explicitly allow-listed with bespoke size limits, so this fires on routine editor uploads, not edge inputs, and silently corrupts the stored extension/URL. The recommended fix (add 'video/mp4'->'mp4', 'application/zip'->'zip', 'application/x-zip-compressed'->'zip' to PASSTHROUGH_MIME_TO_EXT) is correct and complete for the current allow-list. Refinement: the real coupling is between ALLOWED_MIME_TYPES (upload-limits.ts) and PASSTHROUGH_MIME_TO_EXT (media-filename.ts) — they can drift again. Consider deriving the passthrough map from, or adding a test that asserts every non-image entry in ALLOWED_MIME_TYPES has an explicit extension mapping (i.e. canonicalExtensionForMime never returns 'bin' for an allow-listed type), so a future allow-list addition can't silently regress to .bin. Also worth confirming Payload does not run sharp/formatOptions conversion on non-image MIMEs (it does not for video/zip), so 'mp4'/'zip' passthrough is the correct on-disk extension.]

### [MEDIUM] Taxonomy cycle-guard throws bare Error instead of Payload ValidationError  (confidence: high · effort: trivial · status: unverified)

- **File:** `apps/cms/src/payload/hooks/taxonomy-parent-cycle-guard.ts:43-57`  **Category:** error-handling
- **Problem:** When a cycle or runaway parent chain is detected, the hook throws new Error(...). In Payload 3.x a plain Error thrown from a beforeChange hook becomes an unhandled 500 response at the API layer and renders as a generic 'Something went wrong' toast in the admin, with no indication of what field caused the problem. The rejectFilenameRename hook in Media.ts correctly uses throw new ValidationError({ errors: [{ path, message }] }) from 'payload', which produces a 400 with an inline field-level error. The cycle guard should follow the same pattern.
- **Evidence:**
```
Lines 43, 50, 55: throw new Error('${collection}: ...'); vs Media.ts line 55: throw new ValidationError({ errors: [{ message, path: 'filename' }] }).
```
- **Fix:** Import ValidationError from 'payload' and replace all three throw new Error(...) calls with throw new ValidationError({ errors: [{ message: '...', path: 'parent' }] }). Update the test assertions accordingly (the test currently asserts rejects.toThrow(/msg/) which works for both Error and ValidationError).

### [MEDIUM] Media.ts size-check beforeValidate throws bare Error instead of ValidationError  (confidence: high · effort: trivial · status: unverified)

- **File:** `apps/cms/src/payload/collections/Media.ts:216`  **Category:** error-handling
- **Problem:** The size-limit check in beforeValidate throws new Error(result.reason) when a file exceeds the per-MIME limit. Payload 3.x treats a plain Error in beforeValidate as a 500 Internal Server Error, giving the editor a confusing 'Something went wrong' message instead of a clear upload-rejection message. The same file uses Payload's own ValidationError for rejectFilenameRename (line 55).
- **Evidence:**
```
if (!result.ok) { throw new Error(result.reason); } at line 214-216. rejectFilenameRename correctly uses throw new ValidationError(...) at line 55.
```
- **Fix:** Replace throw new Error(result.reason) with throw new ValidationError({ errors: [{ message: result.reason, path: 'filename' }] }) — keeping consistency with the rename-rejection pattern in the same file.

### [MEDIUM] Jobs collection missing searchSync, indexNow, and webhooks afterChange hooks  (confidence: high · effort: trivial · status: unverified)

- **File:** `apps/cms/src/payload/collections/Jobs.ts:242-249`  **Category:** under-implemented
- **Problem:** Jobs is a versioned, publishable collection with SEO fields and a live /job/[slug] URL prefix. Every comparable content collection (Blogs, News, Guides, Authors, Resources, KnowledgeBase) wires searchSyncAfterChangeHook, webhooksPublishAfterChangeHook, indexNowPublishAfterChangeHook, and a searchSyncAfterDeleteHook in afterChange/afterDelete. Jobs has none of these. Published jobs are not indexed in Meilisearch, do not ping Bing/Yandex via IndexNow, and do not fire outbound webhooks on publish.
- **Evidence:**
```
Jobs.ts hooks.afterChange: [slugChangeRedirectHook, schemaOverrideAuditHook, displayPublishedAtAuditHook] — no searchSync, indexNow, or webhooksPublish. Blogs.ts afterChange includes all four extras.
```
- **Fix:** Add searchSyncAfterChangeHook('jobs'), webhooksPublishAfterChangeHook('jobs'), indexNowPublishAfterChangeHook('jobs') to hooks.afterChange, and searchSyncAfterDeleteHook('jobs') to hooks.afterDelete, matching the Blogs/News pattern.

### [MEDIUM] Jobs closedAt field is permanently null — no automation sets it  (confidence: high · effort: small · status: unverified)

- **File:** `apps/cms/src/payload/collections/Jobs.ts:214-222`  **Category:** under-implemented
- **Problem:** closedAt is declared with access: { update: () => false }, meaning it is read-only after creation. No hook, cron job, or other mechanism ever sets this field when hiringStatus transitions to 'closed'. Editors changing a job from 'open' to 'closed' via the update path cannot write closedAt (blocked by access control), and no server-side code writes it either. The field will always be null, making it misleading in the UI.
- **Evidence:**
```
closedAt has access: { update: () => false } at line 216. Jobs hooks (lines 242-249) have no hook that sets closedAt on hiringStatus change. No cron or endpoint reads or sets closedAt in the entire payload/ directory.
```
- **Fix:** Add a beforeChange hook that sets data.closedAt = new Date().toISOString() when data.hiringStatus transitions to 'closed' and the previous value was not 'closed' (check originalDoc.hiringStatus). Remove the blanket update: () => false restriction or relax it to allow the hook to write the field (hooks run with overrideAccess by default in Payload, but field-level access applies to API clients).

### [LOW] AuthorCredibilityField always returns 0 for KnowledgeBase articles  (confidence: high · effort: small · status: verified)

- **File:** `apps/cms/src/payload/admin/components/AuthorCredibilityField.tsx:65-68`  **Category:** logic-bug
- **Problem:** The widget queries all four ATTRIBUTED_COLLECTIONS using where[authors][in]=<id>. The knowledgeBase collection has no 'authors' relationship field — it has only 'reviewedBy' (a singular relationship to authors). The API returns 0 docs for every author, permanently understating the published-item count for any author who has written KB articles.
- **Evidence:**
```
{ slug: 'knowledgeBase', label: 'KB article' } in ATTRIBUTED_COLLECTIONS at line 16; KnowledgeBase.ts has no 'authors' field, only name: 'reviewedBy' (type: 'relationship', relationTo: 'authors').
```
- **Fix:** Either add 'authors' (hasMany) to KnowledgeBase.ts to match the other collections, or change the knowledgeBase entry in ATTRIBUTED_COLLECTIONS to use where[reviewedBy][equals] (singular) and adjust the label to 'KB article (reviewed)'. [verifier note: Severity should be LOW, not high. This is a read-only, advisory sidebar widget on the Author edit view ('credibility snapshot'). It does not gate publishing, affect persisted data, alter the public site, or change any business logic — it only displays a count that an editor sees. The only consequence is a cosmetically understated number. Additionally, the recommendation's framing is the correct one: KnowledgeBase intentionally uses 'reviewedBy' (review attribution), NOT authorship — so KB articles are semantically not bylines by the author. The cleanest fix is to special-case the knowledgeBase entry to query where[reviewedBy][equals]=<id> (singular 'equals', not 'in', since reviewedBy is a singular relationship) and relabel it 'KB article (reviewed)', rather than adding an 'authors' hasMany field to KB (which would conflict with the locked schema decision that KB uses reviewedBy for E-E-A-T). Note that 'equals' on a singular relationship is correct; 'in' would also work but 'equals' matches the field cardinality.]

### [LOW] Media filename collision-check loop exits leaving final candidate unchecked  (confidence: high · effort: trivial · status: unverified)

- **File:** `apps/cms/src/payload/collections/Media.ts:301-311`  **Category:** logic-bug
- **Problem:** The loop iterates suffix from 2 to 50 inclusive. At each iteration it checks the previous candidate; if taken it sets candidate = stem-{suffix}.ext. When suffix reaches 50 and the previous candidate is still taken, candidate is set to stem-50.ext and the loop terminates (suffix becomes 51, failing the condition). stem-50.ext is never verified. If it is also taken Payload will throw a unique-constraint violation from Postgres. In practice the 8-char hash in the stem makes collisions vanishingly rare, but the logic is incorrect.
- **Evidence:**
```
for (let suffix = 2; suffix <= 50; suffix += 1) { ... if (existing.docs.length === 0) break; candidate = `${stem}-${suffix}${extWithDot}`; } — at suffix=50, candidate is assigned stem-50.ext after checking stem-49.ext, but the loop then exits before checking stem-50.ext.
```
- **Fix:** Change the loop to check candidate before assignment: initialise with baseFilename and break when free; or extend the loop to suffix <= 51 and verify the last assignment inside the loop. Alternatively extract to a dedicated helper that is easier to test in isolation.

### [LOW] Jobs expiresAt auto-close cron is referenced but not implemented  (confidence: high · effort: medium · status: unverified)

- **File:** `apps/cms/src/payload/collections/Jobs.ts:208-211`  **Category:** under-implemented
- **Problem:** The expiresAt field description reads 'When the listing should auto-close. The auto-close cron (Phase G) uses this.' No such cron exists in apps/cms/src/payload/jobs/. The field stores data that is never acted on.
- **Evidence:**
```
Field description at line 209; no file matching auto-close, expire, or jobs in apps/cms/src/payload/jobs/.
```
- **Fix:** Either add a cron job that queries jobs where expiresAt <= now() and hiringStatus = 'open', then sets hiringStatus = 'closed' and closedAt = now(), or remove the expiresAt field and description until Phase G is built to avoid misleading editors.

### [LOW] Taxonomy icon field bypasses mediaUploadField convention  (confidence: high · effort: trivial · status: unverified)

- **File:** `apps/cms/src/payload/lib/build-taxonomy-fields.ts:29`  **Category:** convention-violation
- **Problem:** The icon field uses { name: 'icon', type: 'upload', relationTo: 'media' } directly instead of the mediaUploadField() helper. This means the taxonomy icon picker uses Payload's default upload/relationship UI instead of the custom MediaField component (with inline upload, drag-drop, alt edit, browse-existing, and MediaCell list thumbnail). All other media upload fields across the CMS (heroImage, photo, descriptionPdf, ogImage, twitterImage, etc.) use mediaUploadField().
- **Evidence:**
```
build-taxonomy-fields.ts line 29: { name: 'icon', type: 'upload', relationTo: 'media' } — no admin.components wiring for MediaField/MediaCell. Compare mediaUploadField() which always sets admin.components.Field and admin.components.Cell.
```
- **Fix:** Replace the inline object with mediaUploadField({ name: 'icon', folderHint: 'web/general' }) to get the custom MediaField UI and MediaCell thumbnail in the taxonomy list view.

### [LOW] Jobs SEO sidebar wired to nonexistent 'abstract' source field  (confidence: high · effort: trivial · status: unverified)

- **File:** `apps/cms/src/payload/collections/Jobs.ts:239`  **Category:** logic-bug
- **Problem:** seoSidebarFields is called with descriptionSource: 'abstract'. This value is passed as a clientProp to SeoDescriptionField, SerpPreviewField, SeoHealthScoreField, and SchemaPreviewField, which use it to read the corresponding sibling field value and auto-populate or preview the SEO description. The Jobs collection has no 'abstract' field — no field with that name appears anywhere in its field list. The auto-sync and SERP preview will always read undefined/null for the description hint.
- **Evidence:**
```
Jobs.ts line 239: ...seoSidebarFields({ pathPrefix: '/jobs', descriptionSource: 'abstract' }). No field named 'abstract' exists in Jobs.ts (only title, body, department, employmentType, etc.).
```
- **Fix:** Change descriptionSource to a field that actually exists and provides a useful snippet, such as the body richText field (read its first paragraph) or remove descriptionSource to fall back to the sidebar default. If a short job summary field is needed for SEO, add an 'abstract' textarea field to Jobs.

### [LOW] MediaSelfChrome replace file input leaks from document.body on unmount  (confidence: high · effort: trivial · status: unverified)

- **File:** `apps/cms/src/payload/admin/components/MediaSelfChrome.tsx:221-272`  **Category:** logic-bug
- **Problem:** On first click of the Replace button, a hidden <input type='file'> is created and appended to document.body. The element is stored in replaceInputRef to be reused, but it is never removed when the component unmounts (there is no useEffect cleanup that calls document.body.removeChild). If an editor visits multiple media edit pages in a single session, a new orphaned input is left in the DOM each time. Additionally the replace input's accept='image/*,application/pdf' does not include video/mp4 or zip types, so replacing a video or zip file is impossible via this UI.
- **Evidence:**
```
Line 271: document.body.appendChild(input). No useEffect return function calls removeChild. Line 224: input.accept = 'image/*,application/pdf' — excludes video/* and application/zip.
```
- **Fix:** Add a useEffect cleanup: useEffect(() => () => { if (replaceInputRef.current) document.body.removeChild(replaceInputRef.current); }, []). Expand accept to match ALLOWED_MIME_TYPES: 'image/*,application/pdf,video/mp4,application/zip,application/x-zip-compressed'.

### [LOW] AuthorCredibilityField 'Most recent' label reads updatedAt, not publishedAt  (confidence: high · effort: trivial · status: unverified)

- **File:** `apps/cms/src/payload/admin/components/AuthorCredibilityField.tsx:71-85`  **Category:** logic-bug
- **Problem:** The query sorts by -publishedAt to get the most recently published doc first, but the 'most recent' timestamp displayed is taken from docs[0].updatedAt. updatedAt is updated on every save (including draft saves and metadata edits), not just on publish. An article published two years ago but edited yesterday would show 'yesterday' as the most recent activity, which contradicts the 'Most recent:' label's implicit meaning of 'last published'.
- **Evidence:**
```
Line 71: url.searchParams.set('sort', '-publishedAt') — correct for finding the most recently published doc. Line 82: const candidate = r.docs?.[0]?.updatedAt — reads updatedAt instead of publishedAt.
```
- **Fix:** Change the query to include publishedAt in the response fields (depth:0 already returns top-level fields) and read docs[0]?.publishedAt instead of docs[0]?.updatedAt. Also add 'publishedAt' to the CountQueryResult interface.

### [INFO] AboutGalleries displayOrder 'Drag to reorder' description is misleading — no drag UI exists  (confidence: high · effort: trivial · status: unverified)

- **File:** `apps/cms/src/payload/collections/AboutGalleries.ts:65`  **Category:** under-implemented
- **Problem:** The displayOrder field description reads 'Drag to reorder in the list view (Phase D admin UX).' No drag-to-reorder list-view implementation exists for this collection. Editors must manually type numeric values to change order. The description sets a wrong expectation.
- **Evidence:**
```
Line 65: description: 'Drag to reorder in the list view (Phase D admin UX).' — there is no sortable list-view component registered for aboutGalleries.
```
- **Fix:** Update the description to 'Enter a number to control display order (lower = first).' until a drag-to-reorder list view is implemented.

---

## collections-ops

> The core collection schema, access-control model, and encryption path are solid. The append-only Leads contract is correctly enforced, the AES-256-GCM integration-config encryption is well-implemented with HKDF key derivation, and the Users auth hardening (account-disable hook, role-based access) is correct. However, there are four confirmed runtime bugs: rate-limit checking is broken in three endpoints (always returns 429 to every caller because checkAndRecord returns an object, not null), deduplication is silently disabled for all public form submissions (missing overrideAccess on the dedup query), and the Brevo bounce handler will miss updating emailHealth on any leads beyond the first 1000 rows (no DB-level email filter). Several medium-severity issues around access-control consistency, audit-log integrity, and under-implemented stubs round out the picture.

Counts: 1 critical · 0 high · 6 medium · 4 low · 0 info

### [CRITICAL] Rate limiting always fires 429 on Cal.com, Brevo, and DSAR endpoints  (confidence: high · effort: trivial · status: verified)

- **File:** `apps/cms/src/payload/endpoints/integrations-inbound.ts:103`  **Category:** runtime-bug
- **Problem:** `checkAndRecord` returns a `RateLimitResult` object (`{ ok: true|false, ... }`), never `null` or `false`. The check `if (limited)` is therefore always truthy, so every request to all four endpoints is immediately rejected with 429 — the Cal.com booking webhook, the Brevo bounce webhook, the DSAR find endpoint, and the DSAR delete endpoint are all permanently broken in production.
- **Evidence:**
```
const limited = checkAndRecord(`calcom-inbound:${ip}`, RATE_LIMITS);
if (limited) return json({ ok: false, error: 'rate_limited' }, { status: 429 });
// Same pattern at integrations-inbound.ts:235, leads-dsar.ts:54, leads-dsar.ts:114
// Correct usage is in submit-lead.ts:121: if (!limit.ok) { ... }
```
- **Fix:** Replace `if (limited)` with `if (!limited.ok)` in all four call sites: integrations-inbound.ts:103, integrations-inbound.ts:235, leads-dsar.ts:54, leads-dsar.ts:114. [verifier note: Fix is exactly as recommended: change `if (limited)` to `if (!limited.ok)` at integrations-inbound.ts:103, integrations-inbound.ts:235, leads-dsar.ts:54, and leads-dsar.ts:114. Severity critical is warranted: the Cal.com booking webhook and Brevo bounce webhook are 100% broken (every inbound event 429s, so no leads captured from bookings and no email-health updates), and the GDPR Art. 15/17 DSAR find+delete admin endpoints are fully unusable — a compliance-relevant breakage. The bug fires on the first request, not just under load, so it is not load-dependent. Minor optional improvement: mirror submit-lead.ts and include `retryAfterSeconds` derived from `limited.retryAfterMs` in the 429 body, but this is not needed to resolve the reported defect.]

### [MEDIUM] Brevo bounce handler skips updating emailHealth for leads beyond position 1000  (confidence: high · effort: medium · status: verified)

- **File:** `apps/cms/src/payload/endpoints/integrations-inbound.ts:273`  **Category:** logic-bug
- **Problem:** The Brevo bounce/complaint callback handler fetches the first 1000 leads with no database-level email filter (`where` clause is absent), then filters in application code. Any lead created after the first 1000 rows will never have its `emailHealth` field updated on a bounce event. As the leads table grows, the coverage window shrinks. This is a compliance risk — hard-bounced or complaint addresses continue receiving transactional emails.
- **Evidence:**
```
const matches = await req.payload.find({
  collection: 'leads',
  limit: 1000,
  depth: 0,
  overrideAccess: true,
  // No `where` clause — full table scan capped at 1000 rows
});
for (const lead of matches.docs as unknown as LeadWithEmailHealth[]) {
  const fieldEmail = lead.fields?.email;
  if (typeof fieldEmail !== 'string' || fieldEmail.toLowerCase() !== email) continue;
```
- **Fix:** There is no indexed path directly on `leads.fields.email` (it is a JSON blob). The correct fix is either: (1) add a dedicated top-level `email` text field to the Leads collection populated at submit time from the `fields` JSON and indexed, then filter by it in the query; or (2) paginate through all leads using `hasNextPage`. Option 1 is architecturally cleaner and matches the same pattern needed for DSAR. The same `limit: 1000` no-pagination problem exists in `leads-dsar.ts` for DSAR find and delete. [verifier note: Fix recommendation is sound. Option 1 (add an indexed top-level `email` text field on Leads, populated at submit time from the fields JSON, then filter the query by it) is the cleaner fix and also repairs the DSAR find/delete paths — strongly preferred over pagination, since paginating a full-table scan per webhook is both slow and still O(N). Note for whoever implements: existing rows need a one-shot backfill of the new email column (see the production rollout checklist pattern in CLAUDE.md), and the backfill should run with hooks bypassed to avoid CRM/Teams/IndexNow side effects on the leads collection's afterChange hooks. Severity corrected high -> medium: the defect is real, silent, and grows with data, but (a) it only manifests once the leads table exceeds 1000 rows, and (b) Brevo maintains its own server-side suppression list, so hard-bounced/complaint addresses are typically still blocked at the ESP regardless of the local emailHealth flag — the local flag is a secondary signal. The DSAR-delete miss (silent incomplete erasure) is arguably the more serious facet and on its own could justify high; consider tracking that as its own finding.]

### [MEDIUM] BrokenLinks collection: read access locks out editors despite description claiming editor access  (confidence: high · effort: trivial · status: verified)

- **File:** `apps/cms/src/payload/collections/BrokenLinks.ts:25`  **Category:** logic-bug
- **Problem:** The collection docstring says 'Read by editors via the admin list view' but `access.read: isAdmin` allows only admins. Editors cannot see the broken-links list in the admin UI and cannot use it to fix content. The intent and the implementation are contradictory.
- **Evidence:**
```
access: {
  read: isAdmin,      // ← blocks editors
  create: () => false,
  update: () => false,
  delete: isAdmin,
},
// Docstring: 'Read by editors via the admin list view (filter by status=broken for the actionable subset)'
```
- **Fix:** Change `read: isAdmin` to `read: isAdminOrEditor` so editors can view broken-link reports and act on them. [verifier note: The bug is genuine but the claimed "high" severity is overstated. This is a usability/visibility gap, not a security or data-integrity defect: nothing breaks, admins can still use the feature fully, there is no data loss, no privilege escalation, and write paths (create/update set to false, delete admin-only) are unaffected. The impact is limited to editors being unable to see a read-only diagnostic list they were documented to use. Medium fits better. The recommended fix is correct as written — change only `read` to `isAdminOrEditor`; leave `delete: isAdmin` and create/update:()=>false untouched (the cron self-clears rows with overrideAccess, so editors do not need write/delete). No code-level correction to the proposed patch is needed.]

### [MEDIUM] Cal.com inbound hardcodes `formSchemaVersion: 1`, ignoring actual form schema version  (confidence: high · effort: small · status: unverified)

- **File:** `apps/cms/src/payload/endpoints/integrations-inbound.ts:152`  **Category:** logic-bug
- **Problem:** When a Cal.com booking is converted to a lead, `formSchemaVersion` is hardcoded to `1`. If the fallback form has been updated (fields renamed/added) the schema version will have incremented via `formSchemaVersionHook`. Leads created by Cal.com bookings will carry a stale schema version, breaking the field-key audit trail the version is designed to preserve.
- **Evidence:**
```
const submission: LeadSubmission = {
  formId: creds.fallbackFormId,
  formSchemaVersion: 1,   // ← always 1, never fetched from the form doc
  fields: { email, name, bookingTitle, bookingStart },
  ...
};
```
- **Fix:** Fetch the fallback form doc with `payload.findByID({ collection: 'forms', id: creds.fallbackFormId, depth: 0, overrideAccess: true })` and read its `schemaVersion` field. Fall back to `1` if the lookup fails.

### [MEDIUM] PreviewAudit: audit-critical fields have no field-level write protection  (confidence: high · effort: small · status: unverified)

- **File:** `apps/cms/src/payload/collections/PreviewAudit.ts:26`  **Category:** security
- **Problem:** `access.update: isAdminOrEditor` is correct for allowing revocation (setting `revokedAt`). However, the `actor`, `collection`, `docId` fields carry no field-level `access.update: () => false`. An editor can overwrite the `actor` relationship to impersonate another user as the link minter, undermining the audit trail. `ttlSeconds` and `expiresAt` do have `admin: { readOnly: true }` but that only affects the UI; the REST API still accepts writes.
- **Evidence:**
```
{
  name: 'actor',
  type: 'relationship',
  relationTo: 'users',
  required: true,
  // No access.update restriction — any editor can rewrite who minted the link
  admin: { description: 'Editor who minted the link.' },
},
```
- **Fix:** Add `access: { update: () => false }` to the `actor`, `collection`, `docId`, `ttlSeconds`, and `expiresAt` fields. Only `revokedAt` and `label` should be updatable by editors.

### [MEDIUM] Forms `access.read: () => true` exposes form schema to unauthenticated callers  (confidence: medium · effort: small · status: unverified)

- **File:** `apps/cms/src/payload/collections/Forms.ts:22`  **Category:** security
- **Problem:** The REST endpoint `GET /api/forms` and `GET /api/forms/:id` are world-readable. The `fields[]` array contains field names (which double as lead JSON keys), validation regex patterns, `consentText`, and `options` for select fields. An attacker can enumerate all form shapes, understand the exact JSON structure expected by `/api/leads/submit`, and craft targeted payloads. The comment does not justify this as intentional.
- **Evidence:**
```
access: {
  read: () => true,   // ← publicly readable
  create: isAdminOrEditor,
  update: isAdminOrEditor,
  delete: isAdminOrEditor,
},
```
- **Fix:** Change `read: () => true` to `read: isAdminOrEditor` unless there is an explicit frontend need for unauthenticated form schema access (e.g. a Next.js page that fetches the form definition to render). If the web app needs it, scope the read access to a specific authenticated endpoint that returns only the minimum fields needed (label, type, required, placeholder) rather than exposing validation internals.

### [MEDIUM] DSAR find and delete endpoints scan only the first 1000 leads  (confidence: high · effort: small · status: unverified)

- **File:** `apps/cms/src/payload/endpoints/leads-dsar.ts:66`  **Category:** logic-bug
- **Problem:** Both `dsarFindEndpoint` and `dsarDeleteEndpoint` query all leads with `limit: 1000` and no pagination loop. Any subject data beyond the 1000-row window is silently omitted. An Art. 17 erasure request will not delete (or even find) leads created after the 1000th row. This directly undermines GDPR compliance.
- **Evidence:**
```
const result = await req.payload.find({
  collection: 'leads',
  limit: 1000,        // ← hard cap, no hasNextPage loop
  depth: 0,
  overrideAccess: true,
});
// Same pattern at leads-dsar.ts:133 for delete
```
- **Fix:** Replace the single query with a paginated loop (same pattern as `export-leads-csv.ts` or `check-broken-links.ts`). Additionally, see the note on adding a top-level indexed `email` field to Leads to make this query performant at scale.

### [LOW] Convention violation: multiple bare `throw new Error` in collections and hooks instead of AppError subclasses  (confidence: high · effort: medium · status: unverified)

- **File:** `apps/cms/src/payload/collections/Integrations.ts:104`  **Category:** convention-violation
- **Problem:** CLAUDE.md mandates typed `AppError` subclasses (`ValidationError`, `NotFoundError`, `IntegrationError`, `RateLimitError`) and explicitly forbids bare `throw new Error('...')` outside of truly unexpected paths. Multiple files in the ops collections violate this: Integrations.ts (kind immutability / reserved-kind guards), forms-coerce.ts (unsafe pattern), redirect-cycle-guard.ts (cycle detected), registry.ts (handler kind check). The `AppError` taxonomy module does not appear to exist in the codebase — these throws are therefore both convention-violating and missing a structured error type.
- **Evidence:**
```
// Integrations.ts:104
throw new Error(`integrations.kind is immutable after creation (was ...`);
// forms-coerce.ts:51
throw new Error(`Cannot save form: ${label} validation pattern rejected — ${reason}.`);
// redirect-cycle-guard.ts:134
throw new Error(`Redirect cycle detected via "${result.via}"...`);
```
- **Fix:** Create the `AppError` taxonomy (at minimum `ValidationError` wrapping Payload's own `ValidationError` for user-facing save errors, and `IntegrationError` for the secrets/credentials layer). Replace the bare throws in hooks with appropriately typed errors. The Integrations kind-lock and Forms pattern-reject are user-facing validation errors and should surface as Payload `ValidationError` instances so the admin UI shows them in the field's error slot rather than as unhandled exceptions.

### [LOW] AnalyticsCache compound index does not enforce uniqueness — unbounded row growth between prune runs  (confidence: medium · effort: trivial · status: unverified)

- **File:** `apps/cms/src/payload/collections/AnalyticsCache.ts:106`  **Category:** performance
- **Problem:** The `indexes` entry on `(env, provider, scope, key)` is defined without `unique: true`. The design intention is always-insert (never upsert) so freshness is derived from `ORDER BY capturedAt DESC LIMIT 1`. This is architecturally sound but means the table can accumulate many rows per key between 90-day prune cycles. A 15-minute cron writing 5 providers × 10 per-doc keys = 50 inserts/cycle × 96 cycles/day = 4800 rows/day × 90 days = 432 000 rows before the first prune. Not immediately dangerous but worth noting for capacity planning. A separate concern: the comment in `TTL_MS` has a mismatch — `ga4DataApi` is labeled '15-min cron + slack' but the TTL is 20 minutes (`20 * 60 * 1000`) — the mismatch causes stale badges to appear sooner than intended.
- **Evidence:**
```
// AnalyticsCache.ts:106
indexes: [
  {
    fields: ['env', 'provider', 'scope', 'key'],
    // No `unique: true` — intentional but worth monitoring
  },
],
// cache.ts:136-137
ga4DataApi: 20 * 60 * 1000,   // comment says '15-min cron'
cloudflareWebAnalytics: 20 * 60 * 1000, // comment says '15-min cron'
```
- **Fix:** Fix the TTL comment to say '20-min cron' or reduce TTL to 15 minutes to match the cron schedule. For the row-growth concern, consider reducing the prune retention from 90 days to 7 days for analyticsCache specifically (the dashboard never needs 90-day-old cached analytics payloads) by passing a shorter `RETENTION_DAYS` to `analyticsCachePruneTask`.

### [LOW] Forms `crmHandlers` field (HubSpot, Salesforce) is a UI stub with no wired implementation  (confidence: high · effort: trivial · status: unverified)

- **File:** `apps/cms/src/payload/collections/Forms.ts:220`  **Category:** under-implemented
- **Problem:** The `crmHandlers` select field presents HubSpot and Salesforce as selectable options on every form. The admin description says 'Adapter implementations land in Phase E.' No code reads this field — searching the codebase finds no reference outside the collection definition and snapshot test. Editors selecting these values get silent no-ops with no feedback.
- **Evidence:**
```
{
  name: 'crmHandlers',
  type: 'select',
  hasMany: true,
  defaultValue: [],
  options: [
    { label: 'HubSpot', value: 'hubspot' },
    { label: 'Salesforce', value: 'salesforce' },
  ],
  admin: {
    description: 'CRM handlers fan out in parallel ... Adapter implementations land in Phase E.',
  },
},
```
- **Fix:** Either remove the field until Phase E is ready (to avoid misleading editors), or add `admin: { hidden: true }` and a TODO comment. If the HubSpot handler is being built in Phase J, verify this field integrates with the new `Integrations` collection routing rather than duplicating configuration.

### [LOW] WebhookDeadLetter event options don't cover all dispatched events in the system  (confidence: medium · effort: trivial · status: unverified)

- **File:** `apps/cms/src/payload/collections/WebhookDeadLetter.ts:47`  **Category:** under-implemented
- **Problem:** The `event` select field only allows `document.published` and `lead.submitted`. These are the only two defined `WebhookEventName` values in the current `dispatch.ts` type, so this is technically consistent now. However, the `destinationKind` field only allows 'teams' and 'generic', which means if a HubSpot or future CRM kind is wired into the dead-letter queue, the `create` call will fail validation. This is a forward-compatibility risk given Phase J2 plans.
- **Evidence:**
```
{
  name: 'destinationKind',
  type: 'select',
  required: true,
  options: [
    { label: 'Teams', value: 'teams' },
    { label: 'Generic (Standard Webhooks)', value: 'generic' },
    // Missing: hubspotCrm and other Phase J2 kinds
  ],
},
```
- **Fix:** Add a fallback `other` option to `destinationKind`, or make it a `text` field if the set of destination kinds is expected to grow. At minimum, align the options with `ACTIVE_KIND_OPTIONS` from `Integrations.ts` so there is a single source of truth.

---

## globals

> The globals layer is structurally sound — access control, version history, and field composition are clean throughout. The critical finding is that three globals (MainNav, FooterNav, Announcements) are fully implemented in the CMS but have zero consumers in apps/web, meaning the entire CMS-driven nav and banner infrastructure is dead-weight today and editors cannot affect the live site through it. This is not a code defect per se, but the web app currently uses a hardcoded NAV_TREE in nav-config.ts and a static Footer.tsx rather than fetching from the CMS globals. Several smaller issues exist: ctaHref fields in CompanySpotlight, ResourcesSpotlight, and PodcastPage lack URL validation (an editor can save a malformed href that becomes a broken link on production); the seoDefaults organizationJsonLd.url and sameAs[].url fields also lack URL validation, risking broken structured data emitted sitewide; the Legal global's policyVersion is never auto-snapshotted from the CMS at lead-submit time — the web client must supply it manually, and currently does not; and the footerNav has copyright and legalLinks fields that are also not consumed by the web layer.

Counts: 0 critical · 0 high · 6 medium · 6 low · 1 info

### [MEDIUM] MainNav, FooterNav, and Announcements globals have no consumers in apps/web  (confidence: high · effort: large · status: verified)

- **File:** `apps/cms/src/payload/globals/mainNav.ts:1`  **Category:** under-implemented
- **Problem:** The MainNav, FooterNav, and Announcements globals are fully defined, registered in payload.config.ts, and editable in the admin UI, but apps/web never fetches them. Navigation in apps/web is driven entirely by the hardcoded NAV_TREE in apps/web/src/lib/nav-config.ts and a static Footer.tsx. Announcements has no consumer at all — there is no AnnouncementBanner component and no fetch of /api/globals/announcements anywhere in the web app. Editors who update these globals see no effect on the live site.
- **Evidence:**
```
grep -rn 'globals/mainNav|globals/footerNav|globals/announcements' apps/web → zero results. apps/web/src/components/nav/DesktopNav.tsx imports NAV_TREE from '@/lib/nav-config', a hardcoded static file. apps/web/src/components/sections/Footer.tsx uses static COL_CONTACT/COL_SOLUTIONS/etc. arrays and has no fetchCMS call.
```
- **Fix:** Either (a) wire the web app to fetch MainNav and FooterNav from the CMS globals at SSR time replacing nav-config.ts and the static Footer arrays, or (b) remove these globals from the CMS if the web app will continue to manage nav in code and document this clearly in CLAUDE.md. For Announcements, implement the AnnouncementBanner component in apps/web or remove the global. [verifier note: Severity downgraded from high to medium. The factual disconnect is real and confirmed, but the 'significant editor-trust issue' framing is partly speculative for the current project state: CLAUDE.md explicitly states apps/web is early-stage with NO production deployment yet, and the project's own docs treat the web nav as code-managed — nav-config.ts self-describes as the single source of truth, docs/WEB-PAGES.md documents the code-driven nav-update workflow, and the globals appear as CMS-phase backlog item B16 (singletons) in docs/BACKLOG.md. So no live editor is currently being silently ignored. It is a genuine under-implementation / architectural ambiguity that must be resolved before launch, hence medium rather than low. Option (a) wiring web SSR to fetch MainNav/FooterNav is sound and the plumbing already exists (cms-fetch.ts + the resolve-spotlights.ts pattern is a ready template). Option (b) is also legitimate. For Announcements specifically, confirm whether the CMS arch doc intends a sitewide banner before building AnnouncementBanner. Either path should be documented in CLAUDE.md's apps/web section.]

### [MEDIUM] ctaHref fields in CompanySpotlight, ResourcesSpotlight, and PodcastPage lack URL validation  (confidence: high · effort: trivial · status: unverified)

- **File:** `apps/cms/src/payload/globals/companySpotlight.ts:19`  **Category:** logic-bug
- **Problem:** CompanySpotlight.ctaHref (line 19), ResourcesSpotlight.ctaHref (line 19), and PodcastPage.ctaCards[].ctaHref (line 116) are plain required text fields with no URL validation and no normalizeOptionalUrlHook. An editor can save any arbitrary string — including a path without a leading slash, a typo like 'httpss://...', or a javascript: URI. These values are consumed directly by apps/web in resolve-spotlights.ts where resolveGlobal passes ctaHref directly into SpotlightCard without sanitisation and the value is rendered as a link href in the public mega-menu.
- **Evidence:**
```
companySpotlight.ts:19 `{ name: 'ctaHref', type: 'text', required: true }` — no validate, no hooks. resourcesSpotlight.ts:19 same. Consumed at apps/web/src/components/nav/data/resolve-spotlights.ts:121-131 where resolveGlobal passes ctaHref directly into SpotlightCard.
```
- **Fix:** Add `hooks: { beforeValidate: [normalizeOptionalUrlHook] }, validate: validateOptionalUrl` to all three ctaHref fields, importing from '../lib/url-shape'. This pattern is already established on the announcements global (line 63) and all newsMediaOrganization fields in seoDefaults.

### [MEDIUM] seoDefaults organizationJsonLd.url and sameAs[].url have no URL validation  (confidence: high · effort: trivial · status: unverified)

- **File:** `apps/cms/src/payload/globals/seoDefaults.ts:151`  **Category:** logic-bug
- **Problem:** seoDefaults.organizationJsonLd.url (line 151) and seoDefaults.organizationJsonLd.sameAs[].url (line 160) are free-text fields with no URL validation. These values flow directly into the Schema.org Organization blob built by apps/cms/src/payload/lib/jsonld/context.ts, which is included on every page via /api/jsonld. A malformed org URL produces invalid structured data that can hurt Google Knowledge Graph entity clarity and NewsMediaOrganization eligibility. The sameAs[].url has required: true yet no format enforcement.
- **Evidence:**
```
seoDefaults.ts:151 `{ name: 'url', type: 'text', defaultValue: 'https://cleanstart.com' }` — no validate, no hook. seoDefaults.ts:160 `{ name: 'url', type: 'text', required: true }` — no validate. Contrast with newsMediaOrganization fields starting at line 201 which all have normalizeOptionalUrlHook and validateOptionalUrl.
```
- **Fix:** Apply `hooks: { beforeValidate: [normalizeOptionalUrlHook] }, validate: validateOptionalUrl` to organizationJsonLd.url. For sameAs[].url (which must be a full absolute URL), use a stricter validate that requires the https? scheme. The needed imports are already present at the top of the file.

### [MEDIUM] Legal.policyVersion is never auto-snapshotted from CMS at lead-submit time  (confidence: high · effort: small · status: unverified)

- **File:** `apps/cms/src/payload/globals/legal.ts:16`  **Category:** logic-bug
- **Problem:** The policyVersion field description says 'Snapshotted onto every lead at submit time for GDPR audit defensibility', and the Leads collection mirrors this claim. However the web form submission (FormRenderer.tsx buildConsentPayload at line 147) never fetches the legal global — it builds a consent payload without policyVersion. The db-primary handler stores submission.consent?.policyVersion ?? null but policyVersion is never sent by the client. The Zod schema marks it optional so this silently stores null. Every lead row has privacyPolicyVersion=null regardless of what version is set in the Legal global, breaking the GDPR audit chain.
- **Evidence:**
```
apps/web/src/components/forms/FormRenderer.tsx:147-157 buildConsentPayload() returns `{ snapshot, givenAt }` — no policyVersion. apps/cms/src/payload/lib/lead-handlers/db-primary.ts:62 stores `submission.consent?.policyVersion ?? null`. No code fetches /api/globals/legal before or during form submission.
```
- **Fix:** The lead-submit API endpoint should fetch the legal global at request time and inject policyVersion into the consent object before calling the db-primary handler. This is more reliable than client-supplied version since it cannot be spoofed. Add a findGlobal('legal') call in the submit endpoint and populate submission.consent.policyVersion before handing off to handlers.

### [MEDIUM] CompanySpotlight and ResourcesSpotlight have no update access control  (confidence: high · effort: trivial · status: unverified)

- **File:** `apps/cms/src/payload/globals/companySpotlight.ts:12`  **Category:** security
- **Problem:** CompanySpotlight and ResourcesSpotlight define `access: { read: () => true }` but omit the `update` key entirely. In Payload 3, when update access is not specified on a global, it defaults to open (no auth required) for REST API calls. Any unauthenticated request to PATCH /api/globals/companySpotlight can overwrite the spotlight card including the ctaHref, which is rendered in the public mega-menu on every page visit.
- **Evidence:**
```
companySpotlight.ts:12-13 `access: { read: () => true }` — no update key. resourcesSpotlight.ts:12-13 same. Compare with announcements.ts:13-16 which has both `read: isAuthenticated` and `update: isAdminOrEditor`, and podcastPage.ts:19-22 which has `update: isAdminOrEditor`.
```
- **Fix:** Add `update: isAdminOrEditor` to both CompanySpotlight and ResourcesSpotlight access configs. Import `isAdminOrEditor` from '../access' (already imported in other globals in the same directory).

### [MEDIUM] mainNav.featuredCard missing validate for target/href when kind is set  (confidence: high · effort: small · status: unverified)

- **File:** `apps/cms/src/payload/globals/mainNav.ts:74`  **Category:** logic-bug
- **Problem:** The megaMenu.featuredCard group has a kind select (internal-doc | external-url) but no cross-field validation. If an editor picks kind='internal-doc' but leaves target empty, or kind='external-url' but leaves href empty, the mega-menu card renders with a null link. This is the same misconfiguration that navItemFields.ts explicitly guards against for regular nav items (lines 39-55 of _navItem.ts).
- **Evidence:**
```
mainNav.ts:74-102 — featuredCard group has kind, target (condition: kind='internal-doc'), href (condition: kind='external-url') but no validate functions on either field. Contrast with _navItem.ts:38-55 which validates that internal-doc requires target and external-url requires href.
```
- **Fix:** Add validate functions to featuredCard.target and featuredCard.href mirroring the pattern in _navItem.ts. The target validate should return an error when siblingData.kind === 'internal-doc' && value == null. The href validate should return an error when siblingData.kind === 'external-url' and value is empty or fails isValidExternalLink.

### [LOW] footerNav copyright {year} placeholder substitution is not implemented anywhere  (confidence: high · effort: trivial · status: unverified)

- **File:** `apps/cms/src/payload/globals/footerNav.ts:73`  **Category:** under-implemented
- **Problem:** footerNav has a copyright field with defaultValue '© {year} CleanStart, Inc. All rights reserved.' and a description saying '{year} is replaced at render time'. No {year} substitution logic exists anywhere in the codebase. The static Footer.tsx has a hardcoded '©2026 CleanStart. All rights reserved.' string and never fetches footerNav. The copyright will go stale on Jan 1 since neither the CMS global nor the static component handles it dynamically.
- **Evidence:**
```
apps/web/src/components/sections/Footer.tsx:250 has hardcoded '©2026 CleanStart. All rights reserved.' — no dynamic year. grep across all .ts/.tsx files for '{year}' replacement yields zero results. footerNav.ts:74 admin.description claims the substitution happens.
```
- **Fix:** In Footer.tsx, replace the hardcoded year with `©{new Date().getFullYear()} CleanStart. All rights reserved.` This avoids the field going stale on Jan 1 without requiring CMS fetching. If footerNav is ever wired to the web, add the {year} → new Date().getFullYear() substitution in the footer renderer.

### [LOW] announcements.message is unconditionally required — blocks saving a fresh global without content  (confidence: high · effort: trivial · status: unverified)

- **File:** `apps/cms/src/payload/globals/announcements.ts:28`  **Category:** ux-question
- **Problem:** The message field has required: true with no condition on active. This means an editor cannot save the Announcements global without entering a message, even if active=false and they simply want to configure variant or dates ahead of time. Payload evaluates required=true unconditionally regardless of other field values. Other fields (startsAt, endsAt, cta) are optional, but message blocks the entire save.
- **Evidence:**
```
announcements.ts:26-29: `{ name: 'message', type: 'text', required: true }` — no condition guard. Payload's required check runs on every save operation regardless of sibling fields.
```
- **Fix:** Remove required: true and instead add a cross-field validate function that returns an error only when siblingData.active === true and value is blank. This allows drafting the announcement before activating it.

### [LOW] siteSettings.baseUrl lacks URL format validation  (confidence: high · effort: small · status: unverified)

- **File:** `apps/cms/src/payload/globals/siteSettings.ts:17`  **Category:** logic-bug
- **Problem:** siteSettings.baseUrl is used to build canonical URLs in sitemaps, robots.txt, and JSON-LD. It has required: true but no URL format validator. An editor can save 'cleanstart.com' (no scheme) and the sitemap/robots endpoints would generate broken absolute URLs like 'cleanstart.com/blogs/slug'. Similarly, organizationTimezone is free text with no IANA validation — an invalid value would cause silent failures in event/webinar date display.
- **Evidence:**
```
siteSettings.ts:17-22 `{ name: 'baseUrl', type: 'text', required: true }` — no validate. robots.ts:22 reads baseUrl via `(settings.baseUrl ?? 'https://cleanstart.com').replace(/\/+$/, '')` then uses it directly in rendered sitemap URLs without further validation.
```
- **Fix:** Add `hooks: { beforeValidate: [normalizeOptionalUrlHook] }, validate: validateOptionalUrl` to baseUrl using the imports from '../lib/url-shape'. For organizationTimezone add a validate that checks against a known IANA timezone list or at minimum rejects values containing spaces or forbidden characters.

### [LOW] seoDefaults.brandIcons and .verification groups have no web consumer  (confidence: high · effort: medium · status: unverified)

- **File:** `apps/cms/src/payload/globals/seoDefaults.ts:52`  **Category:** under-implemented
- **Problem:** The seoDefaults.brandIcons group (favicon32, icon192, icon512, appleTouchIcon, safariPinnedTabSvg, themeColor) and seoDefaults.verification group (google, bing, pinterest, yandex, facebookDomain tokens) are defined and editable in the admin but apps/web does not fetch seoDefaults at all. The web app's root layout.tsx hardcodes themeColor: '#151021' and has no search engine verification meta tags. Editors filling these fields have no effect on the live site.
- **Evidence:**
```
apps/web/src/app/layout.tsx:100 `themeColor: '#151021'` is hardcoded. grep for 'seoDefaults' in apps/web → zero results. The CMS-side jsonld endpoint fetches seoDefaults but only for the Organization JSON-LD context, not for brandIcons or verification tokens.
```
- **Fix:** Document these fields as 'web production phase — not yet wired to the live site' in their admin.description properties. Long term, implement a /api/site-meta endpoint or SSR fetch in apps/web layout.tsx that reads from seoDefaults to populate verification meta tags and manifest.json.

### [LOW] footerNav social profile URLs have no URL format validation  (confidence: high · effort: trivial · status: unverified)

- **File:** `apps/cms/src/payload/globals/footerNav.ts:54`  **Category:** logic-bug
- **Problem:** footerNav.social[].url is a required text field with no URL validation. An editor can save an invalid URL that would produce a broken social link once footerNav is consumed by apps/web.
- **Evidence:**
```
footerNav.ts:54 `{ name: 'url', type: 'text', required: true }` — no validate, no hooks.
```
- **Fix:** Add `hooks: { beforeValidate: [normalizeOptionalUrlHook] }, validate: validateOptionalUrl` to footerNav.social[].url. Import both from '../lib/url-shape'.

### [INFO] seoDefaults organizationJsonLd data is duplicated between CMS global and static web schema  (confidence: high · effort: medium · status: unverified)

- **File:** `apps/cms/src/payload/globals/seoDefaults.ts:143`  **Category:** over-engineered
- **Problem:** The Organization JSON-LD is maintained in two places: seoDefaults.organizationJsonLd (CMS global) and apps/web/src/lib/seo/jsonld.tsx organizationSchema() (static). The web app renders the static version; the CMS version is only used by the /api/jsonld endpoint for per-document structured data. Until the web app fetches from the CMS, any update to seoDefaults.organizationJsonLd must also be manually reflected in apps/web/src/lib/seo/jsonld.tsx or the live site will be out of sync.
- **Evidence:**
```
apps/web/src/lib/seo/jsonld.tsx:32-48 organizationSchema() hardcodes name, url, logo, and sameAs. apps/web/src/app/layout.tsx:120 renders this on every page. apps/cms/src/payload/globals/seoDefaults.ts:143-163 is the CMS-editable equivalent with the same field set.
```
- **Fix:** Once the web production phase connects seoDefaults to the web app, replace the static organizationSchema() with a CMS fetch. Until then, add an admin.description note warning that updates here do not affect the live site's Organization schema.

---

## blocks

> The block layer is structurally solid: imports are clean, hooks used in admin components (useField, useForm, useRowLabel) are all confirmed as data-layer exports in @payloadcms/ui 3.84 — no render-side convention violations in the two block-adjacent components. The FaqBulkPaste mechanism is sophisticated but correct. Seven concrete issues were found: one logic bug (Table value field claims required for text type but does not enforce it), one under-implemented validation (Pricing billingToggle does not cross-validate that both price fields are populated), one UX/accessibility gap (newTab is hidden for doc and media link kinds), one design footgun (Hero in nestableBlocks permits hero-inside-section), two minor inconsistencies (Gallery/LogoCloud/IntegrationLogos URL fields use raw text without validation unlike the linkField helper), and one broad under-implementation finding (all 19 page-builder blocks have no web renderer — the Pages collection is CMS-only with zero consumer in apps/web). The MutationObserver in FaqBulkPaste is deliberately scoped wide (document.body) which is a performance concern in long forms but is not a memory leak (observer is disconnected in cleanup).

Counts: 0 critical · 0 high · 3 medium · 6 low · 0 info

### [MEDIUM] All 19 page-builder blocks are under-implemented: no renderer exists in apps/web for the Pages collection  (confidence: high · effort: large · status: verified)

- **File:** `apps/cms/src/payload/blocks/index.ts:52`  **Category:** under-implemented
- **Problem:** The pageBuilderBlocks export wires 19 blocks into the Pages collection layout field, but apps/web has no dynamic page route, no page fetcher, and no block renderer for any of these blocks. A search across all 35+ web app page.tsx files and lib/ utilities confirms zero references to the Pages collection, page builder block slugs, or any layout switching logic. All 19 blocks (Section, Hero, CTA, RichText, FormBlock, FeatureGrid, LogoCloud, IntegrationLogos, Testimonial, Stats, MetricsBar, FAQ, Gallery, Embed, CodeBlock, Pricing, JobsList, Table, and the cta-button sub-field) exist only as CMS field schemas with no corresponding rendering surface.
- **Evidence:**
```
grep -rn 'blockType.*hero|blockType.*cta|blockType.*section|pageBuilderBlocks' apps/web/src returns zero results for any page builder block type rendering
```
- **Fix:** Either (a) create apps/web/src/app/[...slug]/page.tsx as a catch-all route that fetches the Pages collection by path and renders a PageBlockRenderer component that switches on blockType, or (b) document explicitly in BACKLOG.md that the page builder rendering phase is deferred so the schema investment is understood as intentional pre-work rather than dead code. [verifier note: Downgrading from high to medium. Context from CLAUDE.md: apps/web "has no production deployment yet" and is explicitly early-stage phased work; the active scope is Phase J (CMS integrations), and WEB-PAGES.md tracks a page-by-page build-out. The 19 blocks are not unreachable "dead code" — they are functional CMS field schemas that simply lack a frontend consumer yet, which reads as deferred work rather than a production defect. It is a genuine gap (an editor composing a Pages doc today would get a 404, and the preview resolver already points at a non-existent route), so it is not info/low — medium is right. Recommendation (b) is the better fix for now. Recommendation (a) — a `[...slug]` catch-all + PageBlockRenderer — is the correct eventual implementation but is a full feature, not a bug fix; if pursued it must also handle the path-based routing the Pages collection uses (doc.path, not slug) to match paths.ts, and avoid colliding with the existing static routes.]

### [MEDIUM] Table: value field described as required for text cells but has no required/validate enforcement  (confidence: high · effort: trivial · status: unverified)

- **File:** `apps/cms/src/payload/blocks/Table.ts:76`  **Category:** logic-bug
- **Problem:** The admin description says 'Required for type=text; optional override caption for check/cross/partial cells.' However the field has neither `required: true` nor a `validate` function. An editor can save a Table block with a type='text' cell that has an empty value, producing a cell the renderer will likely render as blank/undefined with no warning.
- **Evidence:**
```
{ name: 'value', type: 'text', admin: { description: 'Text contents. Required for type=text; ...', condition: (_data, sibling) => sibling?.type === 'text' || typeof sibling?.value === 'string' } } — no `required` or `validate` key present
```
- **Fix:** Add a `validate` function: `(value, { siblingData }) => siblingData?.type !== 'text' || (typeof value === 'string' && value.trim().length > 0) ? true : 'Cell value is required for type=text cells.'`. Do not use `required: true` because that would also fire on check/cross/partial cells.

### [MEDIUM] Pricing: billingToggle=true implies both monthly and yearly price fields must be populated, but there is no cross-field validation  (confidence: high · effort: small · status: unverified)

- **File:** `apps/cms/src/payload/blocks/Pricing.ts:13`  **Category:** logic-bug
- **Problem:** The billingToggle admin description states 'When enabled, each tier needs both monthly and yearly prices.' However, neither the monthly nor yearly text fields have `required` set, nor does any validate function check that both are non-empty when billingToggle is true. An editor can enable the toggle and save with one price missing, producing a broken toggle UI on the front end.
- **Evidence:**
```
billingToggle: { type: 'checkbox', defaultValue: false } ... price.monthly: { type: 'text' } price.yearly: { type: 'text' } — neither has conditional required or validate
```
- **Fix:** Add a validate function on each of `price.monthly` and `price.yearly` that checks the sibling `billingToggle` on the parent block (accessible via `data` argument) and returns an error if billingToggle is true and the field is blank. Alternatively use a `beforeValidate` hook on the block at the collection level.

### [LOW] Section block includes Hero in nestableBlocks, permitting Hero-inside-Section  (confidence: high · effort: trivial · status: unverified)

- **File:** `apps/cms/src/payload/blocks/index.ts:28`  **Category:** ux-question
- **Problem:** Hero is included in the nestableBlocks array, so an editor can place a Hero block as a child of a Section block. A Hero-in-Section is almost always wrong: a hero is a full-viewport-width, above-the-fold, page-opening element. Nesting it inside a layout container (potentially beside a second block in two-column mode) produces broken UI. The intent is clearly to prevent Section-in-Section but the Hero footgun was not guarded.
- **Evidence:**
```
const nestableBlocks: Block[] = [ Hero, CTA, RichText, FormBlock, ... ] — Hero is at position 0 of nestableBlocks passed to Section(nestableBlocks)
```
- **Fix:** Remove Hero from nestableBlocks. Keep it only in the top-level pageBuilderBlocks array alongside Section. If there is a genuine need for a 'contained hero' inside a Section, create a separate HeroCard or PageHeader block with more constrained field options.

### [LOW] link.ts: newTab field is hidden for kind='doc' and kind='media' links  (confidence: high · effort: trivial · status: unverified)

- **File:** `apps/cms/src/payload/fields/link.ts:117`  **Category:** ux-question
- **Problem:** The newTab checkbox has `condition: (_data, sibling) => sibling?.kind === 'url'`. This means editors cannot configure internal doc links or media file links to open in a new tab. Opening media files (PDFs, ZIPs) in a new tab is the most common use case; blocking that option forces editors to use an external URL kind as a workaround, losing the benefit of relationship-based URL resolution for media.
- **Evidence:**
```
{ name: 'newTab', type: 'checkbox', defaultValue: false, admin: { condition: (_data, sibling) => sibling?.kind === 'url' } }
```
- **Fix:** Remove the condition entirely (show newTab for all link kinds) or change it to `sibling?.kind !== undefined` so it always shows. The description already correctly says 'Auto-applies rel="noopener noreferrer"' — that applies to any outbound link, not just external URLs.

### [LOW] Gallery, LogoCloud, IntegrationLogos: URL fields use raw text with no validation  (confidence: high · effort: small · status: unverified)

- **File:** `apps/cms/src/payload/blocks/Gallery.ts:29`  **Category:** convention-violation
- **Problem:** Gallery.link, LogoCloud.url, and IntegrationLogos.url are all plain `{ type: 'text' }` fields with no URL validation. The rest of the codebase uses the `linkField` helper (which calls `isValidExternalLink` from `lib/url-shape.ts`) for any field that holds a URL. An editor can save `javascript:alert(1)` or a protocol-relative URL and it will pass silently. The three affected files are Gallery.ts:29, LogoCloud.ts:19, IntegrationLogos.ts:33.
- **Evidence:**
```
{ name: 'link', type: 'text' } (Gallery line 29), { name: 'url', type: 'text' } (LogoCloud line 19, IntegrationLogos line 33) — no validate function present
```
- **Fix:** Add a validate function to each URL field that calls `isValidExternalLink` from `../lib/url-shape` (already imported via linkField elsewhere), returning an error for invalid schemes. Alternatively replace plain text with `linkField({ name: 'url', withText: false })` for full typed-link support, though that adds group nesting to the data shape and may require a migration.

### [LOW] Section: two-column variant has no minimum-children=2 constraint  (confidence: high · effort: small · status: unverified)

- **File:** `apps/cms/src/payload/blocks/Section.ts:21`  **Category:** logic-bug
- **Problem:** An editor can select variant='two-column' and add only a single child block. The Section's children array has `minRows: 1` regardless of variant. A two-column layout with one child either renders a single-column anyway (defeating the purpose) or leaves an empty second column. No validate function checks the variant-vs-child-count relationship.
- **Evidence:**
```
{ name: 'children', type: 'blocks', blocks: nestableBlocks, required: true, minRows: 1 } — minRows is 1 regardless of `variant` value ('stack' vs 'two-column')
```
- **Fix:** Add a `validate` function on the children array field that returns an error when `data.variant === 'two-column' && (Array.isArray(value) && value.length < 2)`. Alternatively add a `maxRows: 2` for two-column to prevent accidental 3-column configurations.

### [LOW] FaqBulkPaste: document.body MutationObserver in auto-focus effect is extremely broad  (confidence: high · effort: small · status: unverified)

- **File:** `apps/cms/src/payload/admin/components/FaqBulkPaste.tsx:162`  **Category:** performance
- **Problem:** The auto-focus useEffect attaches a MutationObserver to `document.body` with `{ childList: true, subtree: true }`. This fires the `handle()` callback on every single DOM mutation in the entire admin page. In a complex Payload admin view with live-preview, nested rich-text editors, and multiple array fields open simultaneously, this can generate hundreds of synchronous callbacks per keystroke. The observer is correctly disconnected on cleanup, so it is not a memory leak, but it is unnecessarily broad.
- **Evidence:**
```
const observer = new MutationObserver(handle); observer.observe(document.body, { childList: true, subtree: true }); — observe scope is entire document body, not scoped to the FAQ field container
```
- **Fix:** Scope the MutationObserver to the FAQ array field's own container element. The `findField()` helper already locates it by `field-${arrayLeaf}` id. Store it in a ref and pass it to `observer.observe(arrayFieldEl, ...)` instead of `document.body`. This reduces callback frequency by orders of magnitude.

---

## fields-defs

> The eight field builders and the taxonomy helper are well-structured, correctly typed, and properly wired into every collection that needs them. All referenced admin component paths resolve to real files. Validators are sound. The main concerns are: (1) a dead-code component file (SchemaAddonsAdder/SchemaAddonsSection) that is exported but never imported anywhere, (2) a convention violation in build-taxonomy-fields.ts where the taxonomy icon field bypasses mediaUploadField(), (3) the schemaAddonsField is permanently hidden with its per-block fields unrendered — functional data storage works but the Layer 2 editor UI is permanently disabled, (4) seoField and seoFieldHidden are exported but only seoFieldHidden is used (internally), and (5) PodcastEpisodes has no SEO group at all despite having displayPublishedAt and publishedAt fields that feed into JSON-LD dispatch. Overall the codebase is mature and consistent; the issues are small surface-area gaps rather than systemic problems.

Counts: 0 critical · 0 high · 3 medium · 5 low · 0 info

### [MEDIUM] SchemaAddonsAdder and SchemaAddonsSection components are dead code — exported but never imported anywhere  (confidence: high · effort: trivial · status: unverified)

- **File:** `apps/cms/src/payload/admin/components/SchemaAddonsAdder.tsx:273`  **Category:** dead-code
- **Problem:** Both SchemaAddonsAdder (line 273) and SchemaAddonsSection (line 131) are named exports. A grep of the entire apps/cms/src tree finds zero imports of either symbol outside the file itself. SchemaAddonsAdder.tsx is ~344 lines of complex DOM-driving imperative code (polling loops, querySelector-based drawer manipulation) that is completely dead. The file also re-exports a default, but nothing imports it.
- **Evidence:**
```
grep -rn 'SchemaAddonsSection|SchemaAddonsAdder' apps/cms/src/ --include='*.ts' --include='*.tsx' returns only the file itself. No collection config, no sidebar field, no path string references it.
```
- **Fix:** Delete SchemaAddonsAdder.tsx in its entirety, or if there is a future plan to re-wire it, add a comment explaining the intent and what is blocking it. Do not leave unreachable code at this scale in a production codebase.

### [MEDIUM] buildTaxonomyFields icon field bypasses mediaUploadField() — convention violation and missing custom admin UI  (confidence: high · effort: trivial · status: unverified)

- **File:** `apps/cms/src/payload/lib/build-taxonomy-fields.ts:29`  **Category:** convention-violation
- **Problem:** The icon field is declared as a raw `{ name: 'icon', type: 'upload', relationTo: 'media' }` field. Every other relationTo: 'media' upload across the CMS goes through mediaUploadField(), which wires the custom MediaField.tsx (direct upload, drag-drop, inline alt edit, browse-existing) and MediaCell.tsx (24x24 thumbnail). The icon field bypasses both, so category editors see Payload's generic upload picker instead of the project's custom one. The CLAUDE.md explicitly states mediaUploadField() should be used for all media uploads.
- **Evidence:**
```
build-taxonomy-fields.ts:29: { name: 'icon', type: 'upload', relationTo: 'media' } — no mediaUploadField() call. All other upload fields in blocks and collections use mediaUploadField({ name: ..., folderHint: ... }).
```
- **Fix:** Replace line 29 with `mediaUploadField({ name: 'icon', folderHint: 'web/general', description: 'Optional icon shown on category chips and navigation.' })` and add the import. The schema column does not change, only the admin UI.

### [MEDIUM] schemaAddonsField is permanently hidden with no re-surface path — Layer 2 editor UI is disabled  (confidence: high · effort: medium · status: unverified)

- **File:** `apps/cms/src/payload/fields/schema-addons.ts:298`  **Category:** under-implemented
- **Problem:** The schemaAddonsField has `admin.hidden: true` with an inline comment explaining that Payload's blocks-renderer mounts the wrapper but never the per-block fields when the parent is hidden, making the editor UI half-broken. The comment says 'To re-surface the editor UI, set hidden: false here AND fix the per-block field rendering (tracked in SchemaPreviewField.tsx comment).' There is no corresponding issue/TODO in SchemaPreviewField.tsx, and SchemaAddonsAdder.tsx (which was supposed to be the re-wired entry point via the JSON-LD sidebar) is confirmed dead code. The data column persists and the JSON-LD dispatcher reads existing values, but no editor can add new Layer 2 add-ons through the UI.
- **Evidence:**
```
schema-addons.ts:298-314: `admin: { hidden: true, ... }` with blocking comment. SchemaAddonsAdder.tsx is confirmed unimported. SchemaPreviewField.tsx has no SchemaAddons import. JSON-LD addons/dispatch.ts reads `doc.schemaAddons` but editors cannot write it via the admin UI.
```
- **Fix:** Either: (a) complete the re-wiring by importing SchemaAddonsSection into SchemaPreviewField.tsx and setting `schemaAddonsField.admin.hidden = false`, or (b) remove schemaAddonsField from all collections and from schema-addons.ts if Layer 2 is being superseded by the seo.additionalSchema JSON override. The current half-state (schema defined, UI disabled, helper component dead) is confusing and blocks a documented feature.

### [LOW] seoField exported but never consumed externally — dead export  (confidence: high · effort: trivial · status: unverified)

- **File:** `apps/cms/src/payload/fields/seo.ts:440`  **Category:** dead-code
- **Problem:** seoField (the non-hidden variant) is a named export at line 440 but no file outside seo.ts ever imports it. seoFieldHidden (line 478) is used internally by seoFieldsForSidebar(). The seoField export is vestigial from before the sidebar-only pattern was adopted. It is also no longer documented as the consumer-facing API (the JSDoc on seoFieldsForSidebar says 'replace seoField with ...seoFieldsForSidebar(slug)').
- **Evidence:**
```
grep -rn 'import.*seoField\b' apps/cms/src/ returns no results. seoField is only referenced inside seo.ts itself (to construct seoFieldHidden).
```
- **Fix:** Remove the `export` keyword from the seoField declaration, or inline it into seoFieldHidden's definition to make the internal-only use explicit.

### [LOW] linkField newTab checkbox hidden for kind=doc and kind=media  (confidence: high · effort: trivial · status: unverified)

- **File:** `apps/cms/src/payload/fields/link.ts:116`  **Category:** logic-bug
- **Problem:** The newTab checkbox has `admin.condition: (_data, sibling) => sibling?.kind === 'url'`, so it is only visible (and storable) when the link kind is 'External URL'. When kind is 'doc' or 'media', there is no way for an editor to set newTab. The LinkNode for inline rich-text links (LinkPopover.tsx line 263) does expose newTab for all link types, making the behavior inconsistent between inline links and the linkField group field used in blocks (Hero, CTA, FeatureGrid). An editor building a CTA button that links to a PDF (kind=media) cannot set target=_blank via the admin.
- **Evidence:**
```
link.ts:112-119: `newTab` field has `condition: (_data, sibling) => sibling?.kind === 'url'`. LinkPopover.tsx:263 shows `checked={newTab}` rendered for all link kinds without a condition.
```
- **Fix:** Remove the condition from the newTab field so it is visible for all three kinds, or add separate but equivalent conditions for kind=doc and kind=media. The defaultValue of false means this is non-breaking — existing doc/media links have no stored newTab value, which is falsy.

### [LOW] PodcastEpisodes collection has no SEO group despite publishedAt/displayPublishedAt fields  (confidence: medium · effort: small · status: unverified)

- **File:** `apps/cms/src/payload/collections/PodcastEpisodes.ts:94`  **Category:** under-implemented
- **Problem:** PodcastEpisodes is the only versioned content collection with publishedAt and displayPublishedAtField that has no seoSidebarFields() call and no seoFieldHidden data group. The JSON-LD dispatcher reads displayPublishedAt (confirmed in dispatch.ts) but has no seo.title, seo.description, seo.indexable, seo.ogImage, seo.canonicalOverride, or seo.additionalSchema to work with. If podcast episode pages are ever indexed, they will get no SEO metadata from the CMS. The SchemaPreviewField's SUPPORTED_COLLECTIONS set (SchemaPreviewField.tsx:55) does not include 'podcastEpisodes', so admins also cannot preview or add custom JSON-LD for episodes.
- **Evidence:**
```
PodcastEpisodes.ts: no import from '../fields/seo', no seoSidebarFields() call, no seoFieldHidden in fields[]. SchemaPreviewField.tsx:55-66: SUPPORTED_COLLECTIONS does not include 'podcastEpisodes'.
```
- **Fix:** If podcast episode pages will be publicly indexed, add `...seoSidebarFields({ pathPrefix: '/podcast', descriptionSource: 'abstract' })` and `...seoFieldsForSidebar('podcastEpisodes')` to the fields array, and add 'podcastEpisodes' to SUPPORTED_COLLECTIONS in SchemaPreviewField.tsx. If episodes intentionally have no standalone indexed URLs (e.g., embedded-only), add a code comment explaining the omission to prevent future developers from adding SEO fields by accident.

### [LOW] slug.ts validate uses `collection: collectionSlug as never` — unsafe type cast suppresses payload.find generics  (confidence: high · effort: trivial · status: unverified)

- **File:** `apps/cms/src/payload/fields/slug.ts:123`  **Category:** type-safety
- **Problem:** The async collision-check validator calls `payload.find({ collection: collectionSlug as never, ... })`. The `as never` cast is needed because Payload's generated types expect a literal CollectionSlug union, but here the value is a runtime string. The cast works at runtime but disables type-checking on the entire `payload.find` call — if the collection slug changes or is misspelled, TypeScript will not catch it. The proper pattern is `collection: collectionSlug as CollectionSlug` (or a `satisfies` guard). Additionally, the `SlugValidateOptions` type defines its own `req` shape as `{ payload?: Payload }` instead of using Payload's built-in `ValidateOptions` type, which also carries the collection slug through the official `req.payload` path.
- **Evidence:**
```
slug.ts:123: `collection: collectionSlug as never`. The custom SlugValidateOptions at lines 36-42 duplicates Payload's validate callback signature with a weaker type.
```
- **Fix:** Import `CollectionSlug` from 'payload' and use `collection: collectionSlug as CollectionSlug` instead of `as never`. Consider aligning SlugValidateOptions with Payload's built-in `ValidateOptions` type to get all context properties for free.

### [LOW] SchemaOverrideModal handleApply has redundant conditions  (confidence: high · effort: trivial · status: unverified)

- **File:** `apps/cms/src/payload/admin/components/SchemaPreviewField.tsx:725`  **Category:** logic-bug
- **Problem:** The handleApply callback pushes a blob to `merged` if `(checked && row.item.overridable) || (checked && row.item.action === 'merge')`. When `overridable` is true and action is 'merge', the blob is pushed by both branches independently (in a forEach so it only fires once per row — no duplicate push). But the intent for overridable+skip items (e.g. duplicates-auto-emit that the admin force-checked) is push via the first branch; for non-overridable default-merge items (action='merge', overridable=false) it is push via the second. However, the summary mergeCount calculation at line 739 uses `rows.indexOf(r)` inside a `filter` callback — O(n²) and fragile if `rows` is memoized with object identity but `indexOf` uses reference equality.
- **Evidence:**
```
SchemaPreviewField.tsx:727-733: two `if/else if` branches both push `row.item.blob` for the same condition permutations. Line 739: `rows.filter((r) => (decisions[rows.indexOf(r)] ?? r.item.action === 'merge'))` — indexOf inside filter.
```
- **Fix:** Simplify handleApply to a single condition: `if (checked && (row.item.overridable || row.item.action === 'merge'))`. Replace the indexOf-inside-filter with a forEach with explicit index: `rows.forEach((r, idx) => { const checked = decisions[idx] ?? r.item.action === 'merge'; if (checked) mergeCount++; })`.

---

## access-hooks

> The access layer is architecturally sound: `typed-user.ts` provides a clean, null-safe role resolver, and all access functions delegate through it consistently. The hooks are well-tested, fail-soft on side-effect paths (audit-log writes, IndexNow, search, webhooks), and overall follow good Payload patterns. The most significant systemic issue is that four hooks that enforce hard invariants — redirect cycle detection, pages path-cycle guard, taxonomy parent-cycle guard, and form pattern validation — throw bare `new Error()` instead of Payload's `ValidationError`. In production, this surfaces as HTTP 500 responses in the admin UI rather than user-readable 400/422 validation messages, which is both a broken UX and a convention violation. Beyond that, there are several low-to-medium code hygiene issues: two unsafe type casts, a comment/code mismatch, a minor `wasSet` logic ambiguity in the backfill hook, and a misleading error reason in `safe-regex`. No security vulnerabilities, no missing awaits, no access bypass, and no dead code.

Counts: 0 critical · 0 high · 3 medium · 5 low · 1 info

### [MEDIUM] Cycle/depth/validation hooks throw bare Error — admin UI returns 500 instead of user-readable validation message  (confidence: high · effort: small · status: verified)

- **File:** `apps/cms/src/payload/hooks/redirect-cycle-guard.ts:134`  **Category:** runtime-bug
- **Problem:** Four hooks that enforce hard user-facing invariants throw `new Error(message)` instead of Payload's `ValidationError`. In Payload 3.x, only `ValidationError` (from 'payload') is caught by the framework and returned as a structured 400/422 with field-level messages in the admin UI. A bare `throw new Error(...)` in a `beforeChange` hook propagates as an unhandled error and yields HTTP 500 with a generic 'Something went wrong' in production — hiding the actionable message from the editor. Affected: `redirect-cycle-guard.ts:134` (redirect cycle), `pages-path-builder.ts:56,59` (path cycle / max depth), `taxonomy-parent-cycle-guard.ts:43,50,55` (taxonomy cycle / max depth), `forms-coerce.ts:51` (unsafe regex pattern). `publish-gate.ts` correctly uses `ValidationError` and should be the template.
- **Evidence:**
```
redirect-cycle-guard.ts:134: `throw new Error('Redirect cycle detected via ...')` — no ValidationError import; pages-path-builder.ts:56: `throw new Error('Pages: parent chain creates a cycle ...')` — same; taxonomy-parent-cycle-guard.ts:43: `throw new Error('${collection}: a row cannot be its own parent.')` — same; forms-coerce.ts:51: `throw new Error('Cannot save form: ...')` — same.
```
- **Fix:** Import `ValidationError` from 'payload' in all four files and replace `throw new Error(msg)` with `throw new ValidationError({ errors: [{ message: msg, path: '<relevant_field>' }] })`. Follow the pattern already established in `publish-gate.ts:171`. For `forms-coerce.ts`, use `path: 'fields'` or the specific field's name; for `pages-path-builder.ts`, use `path: 'parent'`; for `taxonomy-parent-cycle-guard.ts`, use `path: 'parent'`; for `redirect-cycle-guard.ts`, use `path: 'to'`. [verifier note: Fix is correct. Two refinements: (1) ValidationError constructor in 3.84.1 is `(results, t?)` where results = { errors: [{ message, path, label? }], req? }; the recommended `new ValidationError({ errors: [{ message, path }] })` shape is valid (matches publish-gate). (2) For forms-coerce.ts the pattern lives in an array, so an indexed path like `fields.${i}.validation.pattern` gives the editor precise field highlighting; a flat `fields` path still surfaces the message but won't pinpoint the row. Severity adjusted high->medium: the invariants are still correctly enforced (the save IS rejected; no data corruption or crash) — the defect is purely degraded UX/observability (opaque 500 + 'Something went wrong' instead of the actionable reason) on hard-invariant editor paths. Real and worth fixing, but not data-integrity/security impact.]

### [MEDIUM] display-published-at-backfill: wasSet guard prevents re-stamping when editor explicitly clears the field on republish  (confidence: high · effort: small · status: unverified)

- **File:** `apps/cms/src/payload/hooks/display-published-at-backfill.ts:44`  **Category:** logic-bug
- **Problem:** The guard `if (isSet || wasSet) return next` (line 44) short-circuits the backfill if the field was previously populated — even if the incoming `next` data has no value (the editor cleared it). This means: after an editor clears `displayPublishedAt` and republishes, the field stays empty. The JSON-LD precedence chain (`publicationDate > displayPublishedAt > publishedAt > createdAt`) handles this gracefully by falling back to `publishedAt`, so it is not data-loss in the SEO sense. However, the field description says 'Defaults to publish time' and the effect of clearing it is invisible (no re-stamp on next save), which is confusing for editors. The field doc comment also says 'only fires when the field is still null' which is inconsistent with the wasSet guard.
- **Evidence:**
```
display-published-at-backfill.ts:41-44: `const wasSet = typeof previous.displayPublishedAt === 'string' && (previous.displayPublishedAt as string).length > 0; if (isSet || wasSet) return next;` — a cleared field (isSet=false) with a previously-set originalDoc (wasSet=true) skips backfill.
```
- **Fix:** The fix depends on desired semantics. If clearing the field should reset it to the publish-time default on the next publish save, change the guard to `if (isSet) return next;` (drop the `wasSet` branch). If clearing should be permanent (editor chose to remove the override), document this explicitly and add a code comment explaining that clearing `displayPublishedAt` permanently opts the doc out of the backfill. The field description in the admin UI should also be updated to match.

### [MEDIUM] formSchemaVersionHook: non-atomic read-then-increment allows concurrent saves to both write the same version  (confidence: medium · effort: medium · status: unverified)

- **File:** `apps/cms/src/payload/hooks/form-schema-version.ts:70`  **Category:** logic-bug
- **Problem:** The hook performs `await req.payload.count({ collection: 'leads', ... })` and then reads `original.schemaVersion` to compute `currentVersion + 1`. If two editors save the same form in rapid succession when both saves see a non-zero lead count and the same `original.schemaVersion`, both will compute the same next version and write it — resulting in a version that is bumped by 1 instead of 2. Since forms are rarely edited concurrently, and the consequence is only that version tracking is off-by-one in a race scenario, this is low priority. There is no database-level uniqueness constraint on `schemaVersion`.
- **Evidence:**
```
form-schema-version.ts:70-82: count query → version read → version write, no transaction or optimistic-lock guard.
```
- **Fix:** For production correctness, use a Postgres advisory lock or an atomic `UPDATE forms SET schemaVersion = schemaVersion + 1 WHERE id = ? AND schemaVersion = ?` pattern. As a pragmatic intermediate, document the race in a code comment and accept the low-probability drift. This is a very low-frequency scenario for a CMS admin tool.

### [LOW] JSDoc comment in pages-path-builder.ts claims ValidationError is thrown — code throws bare Error  (confidence: high · effort: trivial · status: unverified)

- **File:** `apps/cms/src/payload/hooks/pages-path-builder.ts:30`  **Category:** convention-violation
- **Problem:** The JSDoc on `pagesPathBuilderHook` (line 30) states 'result in a thrown ValidationError to prevent silent infinite recursion', but the implementation at lines 56 and 59 throws `new Error(...)` — no ValidationError import exists in this file. This creates a documented contract that the code does not fulfill, misleading future developers about error handling behavior.
- **Evidence:**
```
Line 30: '...result in a thrown ValidationError to prevent silent infinite recursion.' Line 56: `throw new Error('Pages: parent chain creates a cycle...')` Line 59: `throw new Error('Pages: parent chain exceeds maximum depth...')`
```
- **Fix:** After fixing the Error→ValidationError issue (see finding above), the comment will match reality. As a standalone fix, correct the comment to read 'throws a bare Error (currently; tracked for upgrade to ValidationError)'.

### [LOW] Unsafe double-cast `req.payload as unknown as RedirectsPayload` violates no-unsafe-cast convention  (confidence: high · effort: small · status: unverified)

- **File:** `apps/cms/src/payload/hooks/redirect-cycle-guard.ts:130`  **Category:** type-safety
- **Problem:** The hook casts `req.payload as unknown as RedirectsPayload` to narrow the full `Payload` type to a minimal test-friendly interface. While functionally safe at runtime (the narrowed shape is a strict subset of what `Payload` provides), `as unknown as T` double-cast violates the project convention of 'No unsafe casts'. This pattern also silently breaks if `Payload.find()` ever changes its where-clause generic shape.
- **Evidence:**
```
`lookup: lookupFromPayload(req.payload as unknown as RedirectsPayload)` at line 130.
```
- **Fix:** Remove the `RedirectsPayload` local interface and change `lookupFromPayload` to accept `Pick<Payload, 'find'>` or simply `{ find: Payload['find'] }`, allowing a direct pass of `req.payload` without any cast. This also makes the dependency explicit in the type signature.

### [LOW] isAdminOrSelf uses unsafe cast (user as { id: string | number }) instead of typed-user helper  (confidence: high · effort: small · status: unverified)

- **File:** `apps/cms/src/payload/access/index.ts:20`  **Category:** type-safety
- **Problem:** The `isAdminOrSelf` function casts `user` to `{ id: string | number }` after checking `!user`. The `string` branch is unreachable because `User.id` is `number` (Postgres serial), and the rest of the access layer uses the `typed-user.ts` helpers (`userRoles`, `hasRole`) as the single source of truth for user shape. This cast is inconsistent with the established pattern and could silently break if the user ID type ever changes.
- **Evidence:**
```
access/index.ts:20: `return { id: { equals: (user as { id: string | number }).id } };` — `typed-user.ts` provides `isUserShape` guard and `userRoles` but no `userId` extractor.
```
- **Fix:** Add a `userId(user: unknown): number | null` helper to `typed-user.ts` alongside `userRoles`, reusing `isUserShape`. Replace the cast in `isAdminOrSelf` with `const id = userId(user); if (id == null) return false; return { id: { equals: id } };`. This keeps all user-shape logic in one place and removes the cast.

### [LOW] safe-regex.ts miscategorizes over-length patterns as catastrophic-backtracking instead of a distinct reason  (confidence: high · effort: trivial · status: unverified)

- **File:** `apps/cms/src/payload/lib/safe-regex.ts:30`  **Category:** logic-bug
- **Problem:** When a regex pattern exceeds `MAX_PATTERN_LENGTH` (256 chars), `checkPattern` returns `{ ok: false, reason: 'catastrophic-backtracking' }`. In `formsCoerceHook`, this causes the admin UI to show 'pattern looks unsafe (catastrophic backtracking risk)' to the editor, which is factually wrong — the actual problem is that the pattern is too long. The `RegexCheck` type only supports two reasons; there is no `'too-long'` variant.
- **Evidence:**
```
safe-regex.ts:29-31: `if (pattern.length > MAX_PATTERN_LENGTH) { return { ok: false, reason: 'catastrophic-backtracking' }; }` — forms-coerce.ts:48: `check.reason === 'catastrophic-backtracking' ? 'pattern looks unsafe (catastrophic backtracking risk)' : ...`
```
- **Fix:** Add `'too-long'` to the `RegexCheck` reason union type, return it when `pattern.length > MAX_PATTERN_LENGTH`, and add a corresponding branch in `formsCoerceHook` that emits 'pattern exceeds maximum length of 256 characters'.

### [INFO] parseInt(actorRaw, 10) || null coerces user ID 0 to null in audit hooks (theoretical)  (confidence: high · effort: trivial · status: unverified)

- **File:** `apps/cms/src/payload/hooks/schema-override-audit.ts:39`  **Category:** logic-bug
- **Problem:** Both `schema-override-audit.ts` and `display-published-at-audit.ts` use `Number.parseInt(actorRaw, 10) || null` to parse a string user ID. The `||` operator coerces the value `0` (falsy) to `null`. If a user's ID were `0`, their audit entry would show no actor. In practice, Postgres serial/bigserial IDs start at 1, so this is unreachable in the current data model. Flagged for correctness.
- **Evidence:**
```
schema-override-audit.ts:39: `? Number.parseInt(actorRaw, 10) || null` — display-published-at-audit.ts:62: same pattern.
```
- **Fix:** Replace `Number.parseInt(actorRaw, 10) || null` with `(v => Number.isFinite(v) ? v : null)(Number.parseInt(actorRaw, 10))` to handle both NaN and the theoretical 0 case correctly.

---
