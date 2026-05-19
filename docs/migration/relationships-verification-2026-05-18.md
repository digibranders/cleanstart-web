# Cross-Collection Relationship Verification — 2026-05-18

Audits every cross-collection relationship field (authors, reviewedBy,
categories, related-X, speakers, locations) by per-row matching the
Webflow source against the Payload DB.

## Summary

**Every Webflow-populated relationship is mapped 100% correctly in Payload.**

| Field | Source populated | DB matched correctly |
|---|---:|---:|
| blogs.authors[] | 50/50 | **50/50** ✅ |
| blogs.reviewedBy | 50/50 | **50/50** ✅ |
| blogs.categories | 22/50 | **22/22** ✅ |
| news.newsCategories[] | 33/33 | **33/33** ✅ |
| guides.authors[] | 52/52 | **52/52** ✅ |
| guides.reviewedBy | 52/52 | **52/52** ✅ |
| jobs.locations[] | 58/60 | **58/58** ✅ |

## Per-collection findings

### Blogs

- **authors[]** — Webflow `author` is a single ref. Payload `authors` is `hasMany: true`. The migration wraps the single Webflow author into a 1-element array. All 50 blogs land on the right author. Distribution matches Webflow exactly: Dhanush 21, Biplab 15, Biswajit 13, Sanket 1, Mayank 1.
- **reviewedBy** — Webflow `review-by-2` (single ref) → Payload `reviewed_by_id`. 50/50 correct. Distribution: Dhanush 28, Biplab 10, Biswajit 6, Mayank 4, Sanket 2, Nilesh 1.
- **categories** — Webflow `categories` is a MultiReference array. Payload `categories` is single-ref (`hasMany: false`). The migration's array→single resolver picks the first element. 22 Webflow blogs with a category all resolve correctly to the right Payload category (Application Security, Network Security, Data Protection, Cyber Security, Product Security). The 28 Webflow blogs without a category keep whatever was previously in dev DB (5 dev blogs had categories set pre-migration → preserved by partial update). This is correct behavior for an idempotent upsert.
- **relatedPosts** — No Webflow source field for related posts (Payload-only feature). 10 rels in DB are all from pre-existing dev blogs. No migration data.

### News

- **newsCategories[]** — Webflow `categories-2` (array) → Payload `newsCategories[]` (`hasMany: true`). 33/33 correct. All news rows in the live Webflow site are tagged "Press Release".
- **authors** — Webflow news rows have NO author / authors / author-2 field populated. Confirmed by scanning all 33 raw rows. No migration data; 0 rels expected.
- **externalUrl** — Webflow `news-link-2` → Payload `external_url`. 29/33 correct (the 4 unpopulated in Webflow are correctly empty in DB).
- **relatedNews** — No Webflow source field. 1 rel in DB is pre-existing dev.

### Guides

- **authors[]** — Webflow `author` (single) → Payload `authors[]`. 52/52 correct.
- **reviewedBy** — Webflow `review-by` (single) → Payload `reviewed_by_id`. 52/52 correct.
- **relatedGuides** — No Webflow source. 0 rels (Webflow had no related-guide refs).

### Resources

- **No cross-collection relationships migrated.** Resources reference `gate_form_id` (Forms collection — empty pre-migration) and `asset_id` (Media — covered in earlier asset report).

### Events

- **speakers** — Webflow events have NO `speakers` field. The 1 rel in DB is from a pre-existing dev event. No migration data.
- **registrationForm** — Webflow events use external `custom-link` URL, never an in-house form. All events default to `registrationMode: 'external'` with either the real URL (12) or a placeholder (6).

### Webinars

- **speakers** — Webflow webinars have no speakers field. 0 rels (correct — nothing to migrate).
- **registrationForm** — Same as events; all webinars use external mode.

### Jobs

- **locations[]** — Webflow `job-location` (sometimes a single ID, sometimes an array of 2 IDs) → Payload `locations[]` (`hasMany: true`).
- Webflow source distribution: **8 jobs with 2 locations + 50 with 1 + 2 with 0 = 60 total**
- DB distribution: **8 jobs with 2 locations + 50 with 1 + 2 with 0 = 60 total** — exact match
- Total junction-table rels: **66 = 8×2 + 50×1**
- All target jobLocations resolve correctly (Australia, Singapore, Mumbai, Bengaluru, Ahmedabad, South East Asia).

## End-to-end spot check

```sql
-- Pick a blog, follow every relationship:
SELECT b.slug, b.title,
       a_author.name,
       a_reviewer.name,
       c.name AS category,
       m.filename AS hero_image
FROM blogs b
LEFT JOIN blogs_rels br ON br.parent_id=b.id AND br.path='authors'
LEFT JOIN authors a_author ON a_author.id=br.authors_id
LEFT JOIN authors a_reviewer ON a_reviewer.id=b.reviewed_by_id
LEFT JOIN categories c ON c.id=b.categories_id
LEFT JOIN media m ON m.id=b.hero_image_id
WHERE b.slug='openclaw-vulnerabilities-reveal-about-execution-chain-trust';
```

Returns:
- author: **Dhanush VM**
- reviewed_by: **Biplab Paul**
- category: (none — Webflow had no category on this blog)
- hero_image: **530078ba16ed-6a0adeedb8bf694922d8f8cb_chart-(48).webp** (R2-hosted)

Same pattern for guides:
- A guide's `author` + `reviewed_by` resolve to real authors
- FAQ slots 1–5, keyword slots 1–10, citation slots 1–10 all unpacked into proper Payload arrays (4 FAQs / 10 keywords / 10 citations for "Attack Surface Reduction vs. Vulnerability Management")

## What's NOT a relationship migration

These cross-collection links exist in Payload but had no Webflow source data,
so nothing needs to be migrated:

- blogs.relatedPosts[] — Payload-only feature
- news.authors[] — Webflow news had no authors
- news.relatedNews[] — Payload-only feature
- guides.relatedGuides[] — Payload-only feature
- events.speakers[] — Webflow events had no speakers
- webinars.speakers[] — Webflow webinars had no speakers
- resources.gateForm — Forms collection is empty pre-migration

Editors fill these in post-migration through the admin UI.

## Verification command

```bash
python3 /tmp/verify-rels.py
```

(Reads Webflow source JSONL + queries Payload DB, reports per-row match counts.)
