# Promote inline filters to editor-managed taxonomies

**Date:** 2026-06-23
**Status:** All 6 taxonomies code-complete (Phases 1–5) + Phase 1 web dual-read.
Migrations NOT yet generated (blocked — interactive `migrate:create`; see
"Migration generation" below). Nothing deployable until migrations land.
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

## Implementation log (commits on `development`, not pushed)

| Phase | Taxonomy | Source enum | Ref field(s) | Commit |
|-------|----------|-------------|--------------|--------|
| relabel | `categories` → "Blog categories" | — | — | `f4e23fc9` |
| 1 | `industries` | CaseStudies.industry | `industryRef` | `f4e23fc9` |
| 2 | `resourceTypes` | Resources.type | `typeRef` | `7d9893ea` |
| 3 | `departments` | Jobs.department | `departmentRef` | `fb586cff` |
| 4 | `regions` (shared) | News.region + Webinars.region | `regionRef` (both) | `2821d366` |
| 5 | `pressTypes` | News.pressType | `pressTypeRef` | `2821d366` |
| 5 | `webinarTypes` | Webinars.webinarType | `webinarTypeRef` | `2821d366` |
| web 1 | industries dual-read | — | — | `15002e93` |

Each content collection KEEPS its legacy enum (reversible). Web reads the
relationship with enum fallback (`resolveIndustryLabel` pattern).

## Migration generation (the blocker)

`payload migrate:create` is **interactive** — it asks "Is `enum_<x>` created
or renamed?" for every new enum and reads the answer from a `prompts` select
that requires a real TTY. It cannot be driven from a non-interactive/CI shell
(piped stdin and PTY-via-`script` both fail). So the migration must be created
in a **real terminal**. The reliable recipe (validated up to the prompt):

```bash
# From apps/cms, against a CLEAN sibling DB so the diff is isolated from local
# push-drift. Replace <conn> with DATABASE_URI's user/host.
psql "$DATABASE_URI" -c "DROP DATABASE IF EXISTS cleanstart_miggen;"
psql "$DATABASE_URI" -c "CREATE DATABASE cleanstart_miggen;"
MIG="${DATABASE_URI/\/cleanstart/\/cleanstart_miggen}"

# 1. Apply all committed migrations → exact pre-change baseline:
DATABASE_URI="$MIG" PAYLOAD_DB_PUSH=false pnpm exec payload migrate

# 2. Generate the diff (INTERACTIVE — answer "create" to every enum prompt;
#    the delta is purely additive so "create" is always correct):
DATABASE_URI="$MIG" PAYLOAD_DB_PUSH=false pnpm exec payload migrate:create add_filter_taxonomies

# 3. Inspect the generated src/migrations/<ts>_add_filter_taxonomies.ts —
#    confirm it ONLY creates tables/columns/enums (no DROP/RENAME of existing
#    objects). Then drop the throwaway DB:
psql "$DATABASE_URI" -c "DROP DATABASE IF EXISTS cleanstart_miggen;"
```

CAVEAT: because the concurrent `deal-registrations` collection has no
migration either, this single diff will also include `deal_registrations`.
Either keep it as one catch-up migration, or land the `deal-registrations`
migration first so this diff is taxonomy-only.

After generating: regenerate types if needed, run `pnpm --filter
@cleanstart/cms test/lint/typecheck`, commit the migration. CI applies it on
deploy.

## Per-phase production rollout runbook

Per taxonomy, AFTER the migration deploys (one-shot, in a quiet window):

1. **Seed** the vocabulary: `pnpm exec tsx --env-file=.env scripts/seed-<x>.ts`
   (`--dry-run` first). Idempotent.
2. **Backfill** the relationship: `pnpm exec tsx --env-file=.env
   scripts/backfill-<x>.ts` (`--dry-run` first). Idempotent.
3. **Verify** the listing on the live site shows the term (web dual-read
   already prefers the relationship).
4. **Web filter switch** (later): point the listing filter at the relationship
   slug instead of the enum.
5. **Enum removal** (last): once web is verified, a follow-up migration drops
   the legacy `select` column.

Scripts by taxonomy: industries → `seed-industries` / `backfill-case-study-industry`;
resourceTypes → `seed-resource-types` / `backfill-resource-type`; departments →
`seed-departments` / `backfill-job-department-ref` (run after the existing
`backfill-job-department` enum restore); regions → `seed-regions` /
`backfill-region-ref` (both News+Webinars); pressTypes → `seed-press-types` /
`backfill-news-press-type`; webinarTypes → `seed-webinar-types` /
`backfill-webinar-type`.
