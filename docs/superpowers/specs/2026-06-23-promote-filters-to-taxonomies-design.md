# Promote inline filters to editor-managed taxonomies

**Date:** 2026-06-23
**Status:** Approved (brainstorming) — Phase 1 implementation in progress
**Scope:** `apps/cms` (schema + collections + migrations + seed/backfill scripts) and `apps/web` (filter rewiring)

## Goal

Convert hardcoded inline `select` enum filters on content collections into
editor-managed taxonomy collections, so that:

1. Editors add/edit option values without a code deploy.
2. Each value carries metadata (description, icon, SEO title/meta, SERP
   preview, hierarchical parent) — already provided by `buildTaxonomyFields`.
3. A single vocabulary can be shared across collections (e.g. `regions` for
   News + Webinars) instead of duplicated enums that drift.

## Decision: Approach A — one collection per filter

Each promoted filter becomes its own collection, identical to the four
existing taxonomies (`categories`, `newsCategories`, `knowledgeCategories`,
`jobLocations`), wrapping the shared `buildTaxonomyFields(slug)` builder.
`regions` is the one shared collection, referenced by both News and Webinars.

Rejected: a single generic `taxonomyTerms` collection with a `kind`
discriminator — breaks the established per-collection convention, weakens
referential integrity, loses per-taxonomy URL prefix.

## Fields in scope

Promote (open vocabularies, benefit from metadata/landing pages):

| New taxonomy   | Source field            | Referrer(s)        |
|----------------|-------------------------|--------------------|
| `industries`   | CaseStudies `industry`  | Case Studies       |
| `resourceTypes`| Resources `type`        | Resources          |
| `departments`  | Jobs `department`       | Jobs               |
| `regions`      | News/Webinars `region`  | News + Webinars    |
| `pressTypes`   | News `pressType`        | News               |
| `webinarTypes` | Webinars `webinarType`  | Webinars           |

Explicitly NOT promoted (code-locked semantic enums the app logic depends
on): `registrationMode`, `eventStatus`, `hiringStatus`, `accessLevel`,
`level`, `experienceLevel`, `employmentType`, Events `country` (geographic,
finer-grained than region — left as enum for now).

## The shared mechanism (per field — reversible, additive)

1. **Collection** — thin file over `buildTaxonomyFields(<slug>)`, `group:
   'Taxonomies'`, access/hooks/versions matching `NewsCategories`.
2. **Builder extension** — widen `buildTaxonomyFields` slug union and add a
   `PATH_PREFIX_BY_SLUG` entry for the new slug.
3. **Register** — add to `payload.config.ts` collections array.
4. **Migration** — Payload-generated table + relationship join column;
   regenerate `payload-types.ts` (CI fails on drift).
5. **Seed** — one-shot idempotent script creating one taxonomy doc per
   current enum option + any distinct value present in existing docs. No data
   loss. Slug = old enum value (preserves `?filter=<value>` URLs).
6. **Parallel field swap** — add a new `relationship` field ALONGSIDE the
   existing `select` enum (both live). Backfill script maps each doc's enum
   value → seeded taxonomy doc.
7. **Web rewiring** — listing filter reads the relationship (by slug) instead
   of the enum. URL shape unchanged.
8. **Retire enum** — after live verification, a follow-up migration removes
   the old `select` field.

CMS and web never need to deploy in the same instant; each step is
reversible. Seed + backfill run as one-shot prod checklist tasks (added to
CLAUDE.md), never against prod DB from a dev machine.

## Phase sequencing (low-risk/high-value first)

1. **`industries`** (Case Studies) — isolated single referrer → built first
   as the TEMPLATE.
2. **`resourceTypes`** (Resources).
3. **`departments`** (Jobs) — reuse existing `normalizeDepartment` map as
   seed source; coordinate with prod checklist task #3.
4. **`regions`** (shared News + Webinars) — created once, two referrers.
5. **`pressTypes`** + **`webinarTypes`** — last.

Each phase is its own PR + deploy + prod seed/backfill, following the
template established in Phase 1.

## Testing

- Collection schema-surface snapshot per new taxonomy.
- Seed + backfill unit tests (value → slug mapping, idempotency).
- Existing drift guards + `generate:types` in CI.

## Risks

- **Live shared prod DB** — every conversion is enum→relationship on prod.
  Mitigated by additive/parallel swap + idempotent seed/backfill + retaining
  the enum until web is verified.
- **Local DB is push-mode** — `payload migrate` hangs locally; develop against
  dev server, let CI run the migration on deploy.
- **Type drift** — regenerate `payload-types.ts` after each schema change.
