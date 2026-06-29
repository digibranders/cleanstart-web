import { type MigrateDownArgs, type MigrateUpArgs, sql } from '@payloadcms/db-postgres'

// Drop three dead Guides surfaces that were Webflow-import artifacts:
//
//   - `articleSections[]` — a heading+body array that only ever fed the
//     guide-level HowTo JSON-LD. apps/web never rendered it. 0 guides had
//     HowTo enabled, so it produced nothing.
//   - `howTo` group (enabled / totalTime / prepTime / performTime /
//     estimatedCost) — its only step source was `articleSections`, so it is
//     inert once that is gone. (The independent Layer-2 schema-add-on HowTo
//     block, `guides_blocks_how_to`, is untouched.)
//   - legacy `keywords[]` — superseded by `seo.keywords`. The values were
//     consolidated into `seo.keywords` by
//     `scripts/backfill-seo-keywords-from-guides.ts` before this migration.
//
// Array fields live in their own join tables (DROP TABLE); the `howTo`
// group is flattened to columns on `guides` / `_guides_v` (DROP COLUMN).
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
  DROP TABLE IF EXISTS "guides_article_sections" CASCADE;
  DROP TABLE IF EXISTS "_guides_v_version_article_sections" CASCADE;
  DROP TABLE IF EXISTS "guides_keywords" CASCADE;
  DROP TABLE IF EXISTS "_guides_v_version_keywords" CASCADE;

  ALTER TABLE "guides"
    DROP COLUMN IF EXISTS "how_to_enabled",
    DROP COLUMN IF EXISTS "how_to_total_time",
    DROP COLUMN IF EXISTS "how_to_prep_time",
    DROP COLUMN IF EXISTS "how_to_perform_time",
    DROP COLUMN IF EXISTS "how_to_estimated_cost";

  ALTER TABLE "_guides_v"
    DROP COLUMN IF EXISTS "version_how_to_enabled",
    DROP COLUMN IF EXISTS "version_how_to_total_time",
    DROP COLUMN IF EXISTS "version_how_to_prep_time",
    DROP COLUMN IF EXISTS "version_how_to_perform_time",
    DROP COLUMN IF EXISTS "version_how_to_estimated_cost";`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
  CREATE TABLE IF NOT EXISTS "guides_article_sections" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "heading" varchar,
    "body" jsonb
  );
  CREATE TABLE IF NOT EXISTS "guides_keywords" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "keyword" varchar
  );
  CREATE TABLE IF NOT EXISTS "_guides_v_version_article_sections" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "id" serial PRIMARY KEY NOT NULL,
    "heading" varchar,
    "body" jsonb,
    "_uuid" varchar
  );
  CREATE TABLE IF NOT EXISTS "_guides_v_version_keywords" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "id" serial PRIMARY KEY NOT NULL,
    "keyword" varchar,
    "_uuid" varchar
  );

  CREATE INDEX IF NOT EXISTS "guides_article_sections_order_idx" ON "guides_article_sections" ("_order");
  CREATE INDEX IF NOT EXISTS "guides_article_sections_parent_id_idx" ON "guides_article_sections" ("_parent_id");
  CREATE INDEX IF NOT EXISTS "guides_keywords_order_idx" ON "guides_keywords" ("_order");
  CREATE INDEX IF NOT EXISTS "guides_keywords_parent_id_idx" ON "guides_keywords" ("_parent_id");
  CREATE INDEX IF NOT EXISTS "_guides_v_version_article_sections_order_idx" ON "_guides_v_version_article_sections" ("_order");
  CREATE INDEX IF NOT EXISTS "_guides_v_version_article_sections_parent_id_idx" ON "_guides_v_version_article_sections" ("_parent_id");
  CREATE INDEX IF NOT EXISTS "_guides_v_version_keywords_order_idx" ON "_guides_v_version_keywords" ("_order");
  CREATE INDEX IF NOT EXISTS "_guides_v_version_keywords_parent_id_idx" ON "_guides_v_version_keywords" ("_parent_id");

  ALTER TABLE "guides_article_sections"
    ADD CONSTRAINT "guides_article_sections_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "guides"("id") ON DELETE CASCADE;
  ALTER TABLE "guides_keywords"
    ADD CONSTRAINT "guides_keywords_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "guides"("id") ON DELETE CASCADE;
  ALTER TABLE "_guides_v_version_article_sections"
    ADD CONSTRAINT "_guides_v_version_article_sections_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "_guides_v"("id") ON DELETE CASCADE;
  ALTER TABLE "_guides_v_version_keywords"
    ADD CONSTRAINT "_guides_v_version_keywords_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "_guides_v"("id") ON DELETE CASCADE;

  ALTER TABLE "guides"
    ADD COLUMN IF NOT EXISTS "how_to_enabled" boolean DEFAULT false,
    ADD COLUMN IF NOT EXISTS "how_to_total_time" varchar,
    ADD COLUMN IF NOT EXISTS "how_to_prep_time" varchar,
    ADD COLUMN IF NOT EXISTS "how_to_perform_time" varchar,
    ADD COLUMN IF NOT EXISTS "how_to_estimated_cost" varchar;

  ALTER TABLE "_guides_v"
    ADD COLUMN IF NOT EXISTS "version_how_to_enabled" boolean DEFAULT false,
    ADD COLUMN IF NOT EXISTS "version_how_to_total_time" varchar,
    ADD COLUMN IF NOT EXISTS "version_how_to_prep_time" varchar,
    ADD COLUMN IF NOT EXISTS "version_how_to_perform_time" varchar,
    ADD COLUMN IF NOT EXISTS "version_how_to_estimated_cost" varchar;`)
}
