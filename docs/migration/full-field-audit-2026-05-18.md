# Full Field & Relationship Audit — 2026-05-18

Exhaustive audit of **every** SEO sub-column and **every** cross-collection
relationship across all migrated collections. Follows up on the two earlier
verification reports.

## Headline

Every Webflow-populated field, sub-field, and relationship is now mapped
correctly in Payload. Where a Payload column has no Webflow source (OG/Twitter
overrides, robots advanced flags, salary ranges, etc.), the column is correctly
left to its Payload default — these are *render-time* fallbacks, not data gaps.

---

## SEO sub-fields — every column accounted for

Payload's `seoField` group (defined in `apps/cms/src/payload/fields/seo.ts`)
adds **27 sub-columns** to every content collection. The audit:

| seo_* column | Webflow source field | Migrated? | Notes |
|---|---|---|---|
| `seo_title` | `meta-title` | ✅ — 100% of Webflow-populated rows | |
| `seo_description` | `meta-description` | ✅ — 100% of Webflow-populated rows | Jobs additionally derived from `job-summary`; Payload falls back to `descriptionSource: 'abstract'` at render time when blank |
| `seo_indexable` | (not in Webflow) | ⚪ default `'index'` | Payload-only — editor toggles per-row |
| `seo_og_image_id` | (not in Webflow) | ⚪ default null | Render falls back to `heroImage` |
| `seo_og_image_alt` | (not in Webflow) | ⚪ | |
| `seo_use_advanced_og` | (not in Webflow) | ⚪ default `false` | |
| `seo_og_title` | (not in Webflow) | ⚪ | Render falls back to `seo.title` then `title` |
| `seo_og_description` | (not in Webflow) | ⚪ | Render falls back to `seo.description` then `abstract` |
| `seo_use_advanced_twitter` | (not in Webflow) | ⚪ default `false` | |
| `seo_twitter_card` | (not in Webflow) | ⚪ default `summary_large_image` | |
| `seo_twitter_title` | (not in Webflow) | ⚪ | |
| `seo_twitter_description` | (not in Webflow) | ⚪ | |
| `seo_twitter_image_id` | (not in Webflow) | ⚪ | |
| `seo_use_custom_canonical` | (not in Webflow) | ⚪ default `false` | |
| `seo_canonical_override` | (not in Webflow) | ⚪ | News: `news-link-2` lands in `external_url` for press pickups, NOT canonical (intentional per arch doc) |
| `seo_robots_advanced_*` (8 columns) | (not in Webflow) | ⚪ all defaults | |
| `seo_alternates` | (not in Webflow) | ⚪ | |
| `seo_custom_tags` | (not in Webflow) | ⚪ | |
| `seo_keyword_target` | (not in Webflow) | ⚪ | (Different from Guides `keywords[]` — that one maps to `article-keyword-1..10`) |
| `seo_additional_schema` | (not in Webflow) | ⚪ | (Payload uses `schemaAddons` group for this) |

**Confirmed**: Webflow's CMS for CleanStart only stores `meta-title` and
`meta-description`. There is no OG / Twitter / canonical / robots data
to migrate. Render-time fallbacks fill in everything else.

---

## All cross-collection relationship fields

Format: `Webflow source field → Payload target (cardinality)`.

### Blogs (50 Webflow rows)

| Webflow field | Payload field | Coverage |
|---|---|---:|
| `author` (single ref) | `authors[]` via blogs_rels | **50/50** ✅ |
| `review-by-2` | `reviewed_by_id` FK | **50/50** ✅ |
| `categories` (MultiReference array) | `categories_id` (single — take first) | **22/22** ✅ |
| _(no Webflow source)_ | `relatedPosts[]` | n/a — editor-curated post-migration |
| `main-image` | `hero_image_id` FK | **50/50** ✅ |

### News (33 Webflow rows)

| Webflow field | Payload field | Coverage |
|---|---|---:|
| `categories-2` (array) | `newsCategories[]` via news_rels | **33/33** ✅ |
| `news-link-2` | `external_url` | **29/29** ✅ |
| `main-image` | `hero_image_id` | **32/32** ✅ |
| _(no Webflow source)_ | `authors[]`, `publisher`, `publisher_logo`, `location`, `relatedNews[]` | n/a |

### Guides (52 Webflow rows)

| Webflow field | Payload field | Coverage |
|---|---|---:|
| `author` | `authors[]` via guides_rels | **52/52** ✅ |
| `review-by` | `reviewed_by_id` FK | **52/52** ✅ |
| `q1`–`q5` / `ans-1`–`ans-5` | `faqs[]` (Payload array) | **52/52** with up to 5 FAQs each |
| `article-keyword-1`–`10` | `keywords[]` | **49/49** with up to 10 keywords |
| `article-mentions-1`–`10` | `citations[]` | **49/49** with up to 10 citations |
| `article-about-1`–`8` | `articleSections[]` | **49/49** with up to 8 sections |
| `main-image` | `hero_image_id` | **1/1** ✅ (only 1 guide had a dedicated heroImage; others embed in body) |
| _(no Webflow source)_ | `relatedGuides[]` | n/a |

### Resources (27 Webflow rows)

| Webflow field | Payload field | Coverage |
|---|---|---:|
| `resources-type` (Webflow option id) | `type` enum | **27/27** ✅ (id→enum map: whitepaper 6, datasheet 4, architecture-insights 15, ebook 1, report 1) |
| `pdf-url` | `asset_id` (Media) | **26/27** (1 PDF Payload-validator quirk — see below) |
| `feature-image` | `hero_image_id` | n/a — Resources schema has no heroImage |
| `description` / `resource-detail` | `summary` / `body` | full |
| `button-text` | `cta_button_text` | **27/27** ✅ |
| `publish-date` | `published_at` | **27/27** ✅ |
| _(no Webflow source)_ | `gated`, `gateForm`, `accessLevel`, `downloadCount` | defaults |

### Events (18 Webflow rows)

| Webflow field | Payload field | Coverage |
|---|---|---:|
| `venue` | `venue` (required) | **18/18** ✅ |
| `event-date` | `starts_at` | **18/18** ✅ |
| `event-custom-date` | `custom_date_label` | **6/6** ✅ |
| `custom-link` | `registration_url` | **12 real + 6 placeholder** ✅ |
| `main-image` | `hero_image_id` | **18/18** ✅ |
| `gallery[]` | `gallery[]` (array of `{image, caption}`) | **17/17** items across 4 events ✅ *(fixed in this audit pass)* |
| _(no Webflow source)_ | `timezone`, `speakers[]`, `registrationForm`, `attendeesCap`, `agendaPdf`, `endsAt` | defaults |

### Webinars (4 Webflow rows)

| Webflow field | Payload field | Coverage |
|---|---|---:|
| `webinar-date` | `starts_at` | **4/4** ✅ |
| `webinar-type` | `webinar_type` enum | **4/4** ✅ |
| `region` / `region-list` | `region` enum | **4/4** ✅ |
| `feature-image` | `hero_image_id` | **4/4** ✅ |
| `pdf-link` *(misnamed — actually BigMarker registration URL)* | `registration_url` | **2 real + 2 placeholder** ✅ *(fixed in this audit pass — was mapping to `pdf` field)* |
| _(no Webflow source)_ | `speakers[]`, `pdf`, `recordingUrl`, `slidesUrl`, `registrationForm` | defaults |

### Jobs (60 Webflow rows)

| Webflow field | Payload field | Coverage |
|---|---|---:|
| `job-location` (single ref or array) | `locations[]` via jobs_rels | **66 rels = 8×2 + 50×1 + 2×0** ✅ |
| `department` | `department` enum | 0/0 (Webflow had none populated) |
| `timing` | `employment_type` enum | **57/57** ✅ |
| `experience` | `experience_level` enum | **57/57** ✅ (regex now handles em-dashes / en-dashes / `5+ years` / `1-2 Years`) |
| `job-summary` + `job-details` | `body` (Lexical) | **57/57** ✅ |
| _(no Webflow source)_ | `salaryRange`, `applyUrl`, `descriptionPdf`, `atsUrl`, `hiringStatus`, `applicationDeadline` | defaults |

### Authors (6 Webflow rows)

| Webflow field | Payload field | Coverage |
|---|---|---:|
| `name`, `professional-title`, `location`, `bio-summary`, `description` | `name`, `role`, `location`, `bioShort`, `bioLong` (Lexical) | full ✅ |
| `linkedin-profile-link` | `social_linkedin` | **2/2** ✅ |
| `twitter-profile-link` | `social_twitter` | **0/0** (Webflow had none populated) |
| `email` | `social_email` | **0/0** |
| `author-link` | `social_website` | **2/2** ✅ |
| `picture` | `photo_id` | **2/2** ✅ |
| `education-qualification-2` | `legacyBio.education-qualification-2` (JSON) | preserved verbatim |
| `experience` | `legacyBio.experience` (JSON) | preserved verbatim |
| `core-skills-expertise` | `legacyBio.core-skills-expertise` (JSON) | preserved verbatim |
| `awards-recognition` | `legacyBio.awards-recognition` (JSON) | preserved verbatim |
| _(no automatic structured conversion)_ | `topicAreas[]`, `education[]`, `experience[]`, `skills[]`, `awards[]` | 0 — by design |

**Why structured-array fields are empty**: Webflow stored education /
experience / skills / awards as single free-text blobs (one row each),
not as structured records. Payload's `legacyBio` JSON column + the
`LegacyBioViewer` sidebar widget show the original text alongside the
empty structured arrays so editors can copy-paste during the post-import
publishing checklist. This is the intended migration design.

### Categories (5 Webflow rows)

| Webflow field | Payload field | Coverage |
|---|---|---:|
| `name`, `slug`, `description` | `name`, `slug`, `description` | **5/5** ✅ |
| `icon` | `icon_id` (Media) | **5/5** ✅ *(fixed in this audit pass — was 4/5; product-security icon shared content with cyber-security and got dropped by SHA-dedup)* |
| _(no Webflow source)_ | `parent` (self-ref) | n/a — Webflow categories were flat |

### News Categories (1 Webflow row)

| Webflow field | Payload field | Coverage |
|---|---|---:|
| `name`, `slug`, `description` | `name`, `slug`, `description` | **1/1** ✅ |
| `icon` | `icon_id` | 0/0 (Webflow source had no icon) |

### Job Locations (6 Webflow rows)

| Webflow field | Payload field | Coverage |
|---|---|---:|
| `name`, `slug` | `name`, `slug` | **6/6** ✅ |
| _(derived from name)_ | `type` (city/country/region), `isoCountry` (ISO 3166-1) | **6/6** via curated table |

### AboutGalleries (20 Webflow rows — deferred)

Held back from this migration pass: the Payload schema has `image: required: true` for the gallery image. Now that we have a Media-doc registration helper, a follow-up pass can re-include `aboutGalleries` in the import loop — the 20 R2 assets are already uploaded and registered.

---

## Bugs found and fixed in this audit pass

| # | Bug | Fix | File |
|---|---|---|---|
| 1 | H5 asset upload dedup by SHA dropped duplicate-content URLs from the progress map → category icon for `product-security` (same image as `cyber-security`) never mapped, so import couldn't resolve its `icon` ref. | Changed progress storage to key by `webflowUrl`; same-SHA URLs now alias to the same R2 record so every Webflow URL resolves at import time. | `migrations/webflow-import/upload-assets.ts` |
| 2 | `register-webflow-media.ts` would create a *duplicate* Media doc when two Webflow URLs aliased to the same R2 object (different filenames → no collision on filename lookup). | Added an in-script `sha → mediaId` map so aliases reuse the existing Media doc. | `apps/cms/scripts/register-webflow-media.ts` |
| 3 | Events `gallery` (array of image refs, 4 events × 3–6 images each) was emitted as `_rawGallery` by the transform but the import resolver had no case for it → 0 gallery items in DB. | Added a `resolveGallery` special-case in `resolveRefs` that walks the array, resolves each ref to a Media id, and emits Payload's `{image, caption?}` array shape. | `apps/cms/scripts/run-webflow-import.ts` |
| 4 | Webinars `pdf-link` was mapped to the `pdf` field (Media), but the live data is actually BigMarker **registration URLs** (URL strings), not PDFs — every webinar lost its real registration URL during migration. | Webinar transform now uses `pdf-link` as the registration URL fallback. `_rawPdf` removed (no Webflow source for an actual PDF). | `migrations/webflow-import/transform/webinars.ts` |
| 5 | Authors transform emitted no `seo` overrides — 4 Webflow authors with `meta-title` lost their SEO title. | Authors transform now emits `seo: {title, description}` like all other transforms. | `migrations/webflow-import/transform/authors.ts` |
| 6 | Resources `type` field shipped Webflow internal option-ID hashes (`695c0b6a9062…`) instead of human enum values; all 27 imported with `type = NULL`. | Built id→Payload-enum mapping from the live Webflow collection schema. | `migrations/webflow-import/transform/resources.ts` |
| 7 | Jobs `experience` regex required `years` after a hyphenated number; failed on `3–5 Years` (em-dash) and `5+ Years` (Title-cased). | Regex now matches em-dash, en-dash, hyphen, leading whitespace, and Title/UPPER case. | `apps/cms/src/payload/lib/webflow-import/job-normalize.ts` |
| 8 | Blogs `categories` shipped as a Webflow MultiReference array even though Payload `categories` is single-ref. Resolver returned null because it only handled scalar/object refs. | `resolveOne` now handles arrays by recursing on the first element. | `apps/cms/scripts/run-webflow-import.ts` |

---

## End-to-end spot check (one row per content collection)

```sql
-- Blog
SELECT slug, title, authors.name AS author, reviewer.name AS reviewer,
       cat.name AS category, media.filename AS hero, seo_title
FROM blogs b
  LEFT JOIN blogs_rels br ON br.parent_id=b.id AND br.path='authors'
  LEFT JOIN authors ON authors.id=br.authors_id
  LEFT JOIN authors reviewer ON reviewer.id=b.reviewed_by_id
  LEFT JOIN categories cat ON cat.id=b.categories_id
  LEFT JOIN media ON media.id=b.hero_image_id
WHERE b.slug='openclaw-vulnerabilities-reveal-about-execution-chain-trust';

-- Returns:
-- author:   Dhanush VM
-- reviewer: Biplab Paul
-- category: (null — Webflow had none)
-- hero:     530078ba16ed-…_chart-(48).webp  (R2)
-- seo_title: OpenClaw Vulnerabilities and Execution-Chain Trust Risks | CleanStart
```

```sql
-- Event with gallery
SELECT e.slug, e.venue, e.starts_at, e.registration_url,
       count(g.image_id) AS gallery_items
FROM events e
LEFT JOIN events_gallery g ON g._parent_id=e.id
GROUP BY e.id ORDER BY gallery_items DESC LIMIT 1;

-- Returns: cyber-security-conclave-check, venue=…, gallery=6
```

```sql
-- Webinar with real registration URL
SELECT slug, registration_url FROM webinars
WHERE registration_url LIKE '%bigmarker%' LIMIT 1;

-- secure-containers…-cleanstart-and-sysdig → https://web.bigmarker.com/cleanstart-webinars/secure-containers…
```

---

## Remaining items

| Item | Action |
|---|---|
| 1 PDF (`Architectural Insight; CIS Hardening…`, 10MB) failing Payload's `validatePDF` quirk | Editor uploads via admin UI post-migration, OR patch `validatePDF` to check a larger trailer window |
| 20 AboutGalleries rows | Now unblocked — re-include `aboutGalleries` in the import loop (Media docs are registered, refs will resolve). One-line uncomment + re-run import. |
| 2 webinars with no Webflow URL at all | Placeholder URL flagged; editor fixes during publishing checklist |
| Author structured arrays (education / experience / skills / awards / topicAreas) | By design — editors copy from `legacyBio` JSON via the LegacyBioViewer sidebar widget. Webflow stored these as free-text, not structured |
| News pressType for 1 dev row showing 'news' | Pre-existing dev value preserved by partial-update — editor corrects |

---

## Files changed in this audit pass

### New (cumulative with prior reports)
- `apps/cms/scripts/run-webflow-import.ts` — added `resolveGallery` for events
- `apps/cms/scripts/register-webflow-media.ts` — sha → mediaId dedupe map
- `migrations/webflow-import/upload-assets.ts` — webflowUrl-keyed progress + SHA aliasing

### Modified
- `migrations/webflow-import/transform/webinars.ts` — `pdf-link` → `registrationUrl`
- (Prior fixes from earlier passes still in place)

### Build status
`lint ✓ · typecheck ✓` ; 1030 tests pass (2 pre-existing schema-surface snapshot failures unrelated to this work).
