import { type MigrateDownArgs, type MigrateUpArgs, sql } from '@payloadcms/db-postgres'

/**
 * Case studies gain a detail page at `/case-studies/<slug>`, and with it the
 * fields that page renders and the SEO group every routed collection carries.
 *
 * Added: `body` (Lexical), `outcomes` and `glance` (arrays, so their own
 * tables), `quote`/`quoteAuthor`/`quoteRole`, `featured`, and the standard
 * `seo` group. `industry_ref_id` is here too — the `industryRef` relationship
 * reached the collection config during the taxonomy work but never got a
 * migration, so a database built from migrations alone is missing the column.
 *
 * Hand-written rather than generated. `payload migrate:create` diffs the config
 * against the newest `.json` schema snapshot, and the last one committed is
 * from 2026-06-11 — ten migrations back. Running it here produced 879 ALTER
 * TABLE statements covering three months of other people's schema. Every
 * statement below was lifted from that output and then guarded, which is the
 * pattern the rest of this directory follows.
 *
 * Idempotent throughout: local databases run `push: true` and will already
 * have most of this.
 */

const UP = [
  // ── Enums ───────────────────────────────────────────────────────────────
  sql`DO $$ BEGIN CREATE TYPE "public"."enum_case_studies_seo_indexable" AS ENUM('index', 'noindex', 'noindex,nofollow'); EXCEPTION WHEN duplicate_object THEN null; END $$;`,
  sql`DO $$ BEGIN CREATE TYPE "public"."enum_case_studies_seo_twitter_card" AS ENUM('summary', 'summary_large_image'); EXCEPTION WHEN duplicate_object THEN null; END $$;`,
  sql`DO $$ BEGIN CREATE TYPE "public"."enum__case_studies_v_version_seo_indexable" AS ENUM('index', 'noindex', 'noindex,nofollow'); EXCEPTION WHEN duplicate_object THEN null; END $$;`,
  sql`DO $$ BEGIN CREATE TYPE "public"."enum__case_studies_v_version_seo_twitter_card" AS ENUM('summary', 'summary_large_image'); EXCEPTION WHEN duplicate_object THEN null; END $$;`,

  // ── Array + speakable tables ────────────────────────────────────────────
  sql`CREATE TABLE IF NOT EXISTS "case_studies_outcomes" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "value" varchar,
    "label" varchar
  );`,
  sql`CREATE TABLE IF NOT EXISTS "case_studies_glance" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "label" varchar,
    "value" varchar
  );`,
  sql`CREATE TABLE IF NOT EXISTS "case_studies_seo_speakable_path" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "selector" varchar
  );`,
  sql`CREATE TABLE IF NOT EXISTS "_case_studies_v_version_outcomes" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "id" serial PRIMARY KEY NOT NULL,
    "value" varchar,
    "label" varchar,
    "_uuid" varchar
  );`,
  sql`CREATE TABLE IF NOT EXISTS "_case_studies_v_version_glance" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "id" serial PRIMARY KEY NOT NULL,
    "label" varchar,
    "value" varchar,
    "_uuid" varchar
  );`,
  sql`CREATE TABLE IF NOT EXISTS "_case_studies_v_version_seo_speakable_path" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "id" serial PRIMARY KEY NOT NULL,
    "selector" varchar,
    "_uuid" varchar
  );`,

  // ── Columns ─────────────────────────────────────────────────────────────
    sql`ALTER TABLE "case_studies" ADD COLUMN IF NOT EXISTS "industry_ref_id" integer;`,
    sql`ALTER TABLE "case_studies" ADD COLUMN IF NOT EXISTS "body" jsonb;`,
    sql`ALTER TABLE "case_studies" ADD COLUMN IF NOT EXISTS "quote" varchar;`,
    sql`ALTER TABLE "case_studies" ADD COLUMN IF NOT EXISTS "quote_author" varchar;`,
    sql`ALTER TABLE "case_studies" ADD COLUMN IF NOT EXISTS "quote_role" varchar;`,
    sql`ALTER TABLE "case_studies" ADD COLUMN IF NOT EXISTS "featured" boolean DEFAULT false;`,
    sql`ALTER TABLE "case_studies" ADD COLUMN IF NOT EXISTS "seo_title" varchar;`,
    sql`ALTER TABLE "case_studies" ADD COLUMN IF NOT EXISTS "seo_description" varchar;`,
    sql`ALTER TABLE "case_studies" ADD COLUMN IF NOT EXISTS "seo_indexable" "enum_case_studies_seo_indexable" DEFAULT 'index';`,
    sql`ALTER TABLE "case_studies" ADD COLUMN IF NOT EXISTS "seo_og_image_id" integer;`,
    sql`ALTER TABLE "case_studies" ADD COLUMN IF NOT EXISTS "seo_og_image_alt" varchar;`,
    sql`ALTER TABLE "case_studies" ADD COLUMN IF NOT EXISTS "seo_use_advanced_og" boolean DEFAULT false;`,
    sql`ALTER TABLE "case_studies" ADD COLUMN IF NOT EXISTS "seo_og_title" varchar;`,
    sql`ALTER TABLE "case_studies" ADD COLUMN IF NOT EXISTS "seo_og_description" varchar;`,
    sql`ALTER TABLE "case_studies" ADD COLUMN IF NOT EXISTS "seo_use_advanced_twitter" boolean DEFAULT false;`,
    sql`ALTER TABLE "case_studies" ADD COLUMN IF NOT EXISTS "seo_twitter_card" "enum_case_studies_seo_twitter_card" DEFAULT 'summary_large_image';`,
    sql`ALTER TABLE "case_studies" ADD COLUMN IF NOT EXISTS "seo_twitter_title" varchar;`,
    sql`ALTER TABLE "case_studies" ADD COLUMN IF NOT EXISTS "seo_twitter_description" varchar;`,
    sql`ALTER TABLE "case_studies" ADD COLUMN IF NOT EXISTS "seo_twitter_image_id" integer;`,
    sql`ALTER TABLE "case_studies" ADD COLUMN IF NOT EXISTS "seo_use_custom_canonical" boolean DEFAULT false;`,
    sql`ALTER TABLE "case_studies" ADD COLUMN IF NOT EXISTS "seo_canonical_override" varchar;`,
    sql`ALTER TABLE "case_studies" ADD COLUMN IF NOT EXISTS "seo_robots_advanced_noarchive" boolean DEFAULT false;`,
    sql`ALTER TABLE "case_studies" ADD COLUMN IF NOT EXISTS "seo_robots_advanced_nosnippet" boolean DEFAULT false;`,
    sql`ALTER TABLE "case_studies" ADD COLUMN IF NOT EXISTS "seo_robots_advanced_noimageindex" boolean DEFAULT false;`,
    sql`ALTER TABLE "case_studies" ADD COLUMN IF NOT EXISTS "seo_robots_advanced_notranslate" boolean DEFAULT false;`,
    sql`ALTER TABLE "case_studies" ADD COLUMN IF NOT EXISTS "seo_robots_advanced_max_snippet" numeric;`,
    sql`ALTER TABLE "case_studies" ADD COLUMN IF NOT EXISTS "seo_robots_advanced_max_image_preview" "enum_seo_max_image_preview";`,
    sql`ALTER TABLE "case_studies" ADD COLUMN IF NOT EXISTS "seo_robots_advanced_max_video_preview" numeric;`,
    sql`ALTER TABLE "case_studies" ADD COLUMN IF NOT EXISTS "seo_robots_advanced_unavailable_after" timestamp(3) with time zone;`,
    sql`ALTER TABLE "case_studies" ADD COLUMN IF NOT EXISTS "seo_alternates" jsonb;`,
    sql`ALTER TABLE "case_studies" ADD COLUMN IF NOT EXISTS "seo_custom_tags" jsonb;`,
    sql`ALTER TABLE "case_studies" ADD COLUMN IF NOT EXISTS "seo_keyword_target" varchar;`,
    sql`ALTER TABLE "case_studies" ADD COLUMN IF NOT EXISTS "seo_keywords" jsonb;`,
    sql`ALTER TABLE "case_studies" ADD COLUMN IF NOT EXISTS "seo_additional_schema" jsonb;`,
    sql`ALTER TABLE "case_studies" ADD COLUMN IF NOT EXISTS "seo_schema_history" jsonb;`,
    sql`ALTER TABLE "_case_studies_v" ADD COLUMN IF NOT EXISTS "version_industry_ref_id" integer;`,
    sql`ALTER TABLE "_case_studies_v" ADD COLUMN IF NOT EXISTS "version_body" jsonb;`,
    sql`ALTER TABLE "_case_studies_v" ADD COLUMN IF NOT EXISTS "version_quote" varchar;`,
    sql`ALTER TABLE "_case_studies_v" ADD COLUMN IF NOT EXISTS "version_quote_author" varchar;`,
    sql`ALTER TABLE "_case_studies_v" ADD COLUMN IF NOT EXISTS "version_quote_role" varchar;`,
    sql`ALTER TABLE "_case_studies_v" ADD COLUMN IF NOT EXISTS "version_featured" boolean DEFAULT false;`,
    sql`ALTER TABLE "_case_studies_v" ADD COLUMN IF NOT EXISTS "version_seo_title" varchar;`,
    sql`ALTER TABLE "_case_studies_v" ADD COLUMN IF NOT EXISTS "version_seo_description" varchar;`,
    sql`ALTER TABLE "_case_studies_v" ADD COLUMN IF NOT EXISTS "version_seo_indexable" "enum__case_studies_v_version_seo_indexable" DEFAULT 'index';`,
    sql`ALTER TABLE "_case_studies_v" ADD COLUMN IF NOT EXISTS "version_seo_og_image_id" integer;`,
    sql`ALTER TABLE "_case_studies_v" ADD COLUMN IF NOT EXISTS "version_seo_og_image_alt" varchar;`,
    sql`ALTER TABLE "_case_studies_v" ADD COLUMN IF NOT EXISTS "version_seo_use_advanced_og" boolean DEFAULT false;`,
    sql`ALTER TABLE "_case_studies_v" ADD COLUMN IF NOT EXISTS "version_seo_og_title" varchar;`,
    sql`ALTER TABLE "_case_studies_v" ADD COLUMN IF NOT EXISTS "version_seo_og_description" varchar;`,
    sql`ALTER TABLE "_case_studies_v" ADD COLUMN IF NOT EXISTS "version_seo_use_advanced_twitter" boolean DEFAULT false;`,
    sql`ALTER TABLE "_case_studies_v" ADD COLUMN IF NOT EXISTS "version_seo_twitter_card" "enum__case_studies_v_version_seo_twitter_card" DEFAULT 'summary_large_image';`,
    sql`ALTER TABLE "_case_studies_v" ADD COLUMN IF NOT EXISTS "version_seo_twitter_title" varchar;`,
    sql`ALTER TABLE "_case_studies_v" ADD COLUMN IF NOT EXISTS "version_seo_twitter_description" varchar;`,
    sql`ALTER TABLE "_case_studies_v" ADD COLUMN IF NOT EXISTS "version_seo_twitter_image_id" integer;`,
    sql`ALTER TABLE "_case_studies_v" ADD COLUMN IF NOT EXISTS "version_seo_use_custom_canonical" boolean DEFAULT false;`,
    sql`ALTER TABLE "_case_studies_v" ADD COLUMN IF NOT EXISTS "version_seo_canonical_override" varchar;`,
    sql`ALTER TABLE "_case_studies_v" ADD COLUMN IF NOT EXISTS "version_seo_robots_advanced_noarchive" boolean DEFAULT false;`,
    sql`ALTER TABLE "_case_studies_v" ADD COLUMN IF NOT EXISTS "version_seo_robots_advanced_nosnippet" boolean DEFAULT false;`,
    sql`ALTER TABLE "_case_studies_v" ADD COLUMN IF NOT EXISTS "version_seo_robots_advanced_noimageindex" boolean DEFAULT false;`,
    sql`ALTER TABLE "_case_studies_v" ADD COLUMN IF NOT EXISTS "version_seo_robots_advanced_notranslate" boolean DEFAULT false;`,
    sql`ALTER TABLE "_case_studies_v" ADD COLUMN IF NOT EXISTS "version_seo_robots_advanced_max_snippet" numeric;`,
    sql`ALTER TABLE "_case_studies_v" ADD COLUMN IF NOT EXISTS "version_seo_robots_advanced_max_image_preview" "enum_seo_max_image_preview";`,
    sql`ALTER TABLE "_case_studies_v" ADD COLUMN IF NOT EXISTS "version_seo_robots_advanced_max_video_preview" numeric;`,
    sql`ALTER TABLE "_case_studies_v" ADD COLUMN IF NOT EXISTS "version_seo_robots_advanced_unavailable_after" timestamp(3) with time zone;`,
    sql`ALTER TABLE "_case_studies_v" ADD COLUMN IF NOT EXISTS "version_seo_alternates" jsonb;`,
    sql`ALTER TABLE "_case_studies_v" ADD COLUMN IF NOT EXISTS "version_seo_custom_tags" jsonb;`,
    sql`ALTER TABLE "_case_studies_v" ADD COLUMN IF NOT EXISTS "version_seo_keyword_target" varchar;`,
    sql`ALTER TABLE "_case_studies_v" ADD COLUMN IF NOT EXISTS "version_seo_keywords" jsonb;`,
    sql`ALTER TABLE "_case_studies_v" ADD COLUMN IF NOT EXISTS "version_seo_additional_schema" jsonb;`,
    sql`ALTER TABLE "_case_studies_v" ADD COLUMN IF NOT EXISTS "version_seo_schema_history" jsonb;`,

  // ── Foreign keys. Payload names them, so a duplicate is caught by name. ──
  sql`DO $$ BEGIN ALTER TABLE "case_studies_outcomes" ADD CONSTRAINT "case_studies_outcomes_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."case_studies"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;`,
  sql`DO $$ BEGIN ALTER TABLE "case_studies_glance" ADD CONSTRAINT "case_studies_glance_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."case_studies"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;`,
  sql`DO $$ BEGIN ALTER TABLE "case_studies_seo_speakable_path" ADD CONSTRAINT "case_studies_seo_speakable_path_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."case_studies"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;`,
  sql`DO $$ BEGIN ALTER TABLE "_case_studies_v_version_outcomes" ADD CONSTRAINT "_case_studies_v_version_outcomes_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_case_studies_v"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;`,
  sql`DO $$ BEGIN ALTER TABLE "_case_studies_v_version_glance" ADD CONSTRAINT "_case_studies_v_version_glance_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_case_studies_v"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;`,
  sql`DO $$ BEGIN ALTER TABLE "_case_studies_v_version_seo_speakable_path" ADD CONSTRAINT "_case_studies_v_version_seo_speakable_path_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_case_studies_v"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;`,
  sql`DO $$ BEGIN ALTER TABLE "case_studies" ADD CONSTRAINT "case_studies_industry_ref_id_industries_id_fk" FOREIGN KEY ("industry_ref_id") REFERENCES "public"."industries"("id") ON DELETE set null ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;`,
  sql`DO $$ BEGIN ALTER TABLE "case_studies" ADD CONSTRAINT "case_studies_seo_og_image_id_media_id_fk" FOREIGN KEY ("seo_og_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;`,
  sql`DO $$ BEGIN ALTER TABLE "case_studies" ADD CONSTRAINT "case_studies_seo_twitter_image_id_media_id_fk" FOREIGN KEY ("seo_twitter_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;`,
  sql`DO $$ BEGIN ALTER TABLE "_case_studies_v" ADD CONSTRAINT "_case_studies_v_version_industry_ref_id_industries_id_fk" FOREIGN KEY ("version_industry_ref_id") REFERENCES "public"."industries"("id") ON DELETE set null ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;`,
  sql`DO $$ BEGIN ALTER TABLE "_case_studies_v" ADD CONSTRAINT "_case_studies_v_version_seo_og_image_id_media_id_fk" FOREIGN KEY ("version_seo_og_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;`,
  sql`DO $$ BEGIN ALTER TABLE "_case_studies_v" ADD CONSTRAINT "_case_studies_v_version_seo_twitter_image_id_media_id_fk" FOREIGN KEY ("version_seo_twitter_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;`,

  // ── Indexes ─────────────────────────────────────────────────────────────
  sql`CREATE INDEX IF NOT EXISTS "case_studies_outcomes_order_idx" ON "case_studies_outcomes" USING btree ("_order");`,
  sql`CREATE INDEX IF NOT EXISTS "case_studies_outcomes_parent_id_idx" ON "case_studies_outcomes" USING btree ("_parent_id");`,
  sql`CREATE INDEX IF NOT EXISTS "case_studies_glance_order_idx" ON "case_studies_glance" USING btree ("_order");`,
  sql`CREATE INDEX IF NOT EXISTS "case_studies_glance_parent_id_idx" ON "case_studies_glance" USING btree ("_parent_id");`,
  sql`CREATE INDEX IF NOT EXISTS "case_studies_seo_speakable_path_order_idx" ON "case_studies_seo_speakable_path" USING btree ("_order");`,
  sql`CREATE INDEX IF NOT EXISTS "case_studies_seo_speakable_path_parent_id_idx" ON "case_studies_seo_speakable_path" USING btree ("_parent_id");`,
  sql`CREATE INDEX IF NOT EXISTS "_case_studies_v_version_outcomes_order_idx" ON "_case_studies_v_version_outcomes" USING btree ("_order");`,
  sql`CREATE INDEX IF NOT EXISTS "_case_studies_v_version_outcomes_parent_id_idx" ON "_case_studies_v_version_outcomes" USING btree ("_parent_id");`,
  sql`CREATE INDEX IF NOT EXISTS "_case_studies_v_version_glance_order_idx" ON "_case_studies_v_version_glance" USING btree ("_order");`,
  sql`CREATE INDEX IF NOT EXISTS "_case_studies_v_version_glance_parent_id_idx" ON "_case_studies_v_version_glance" USING btree ("_parent_id");`,
  sql`CREATE INDEX IF NOT EXISTS "_case_studies_v_version_seo_speakable_path_order_idx" ON "_case_studies_v_version_seo_speakable_path" USING btree ("_order");`,
  sql`CREATE INDEX IF NOT EXISTS "_case_studies_v_version_seo_speakable_path_parent_id_idx" ON "_case_studies_v_version_seo_speakable_path" USING btree ("_parent_id");`,
  sql`CREATE INDEX IF NOT EXISTS "case_studies_industry_ref_idx" ON "case_studies" USING btree ("industry_ref_id");`,
  sql`CREATE INDEX IF NOT EXISTS "case_studies_seo_seo_og_image_idx" ON "case_studies" USING btree ("seo_og_image_id");`,
  sql`CREATE INDEX IF NOT EXISTS "case_studies_seo_seo_twitter_image_idx" ON "case_studies" USING btree ("seo_twitter_image_id");`,
  sql`CREATE INDEX IF NOT EXISTS "_case_studies_v_version_version_industry_ref_idx" ON "_case_studies_v" USING btree ("version_industry_ref_id");`,
  sql`CREATE INDEX IF NOT EXISTS "_case_studies_v_version_seo_version_seo_og_image_idx" ON "_case_studies_v" USING btree ("version_seo_og_image_id");`,
  sql`CREATE INDEX IF NOT EXISTS "_case_studies_v_version_seo_version_seo_twitter_image_idx" ON "_case_studies_v" USING btree ("version_seo_twitter_image_id");`,
]

export async function up({ db }: MigrateUpArgs): Promise<void> {
  for (const statement of UP) {
    await db.execute(statement)
  }
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`DROP TABLE IF EXISTS "case_studies_outcomes" CASCADE;`)
  await db.execute(sql`DROP TABLE IF EXISTS "case_studies_glance" CASCADE;`)
  await db.execute(sql`DROP TABLE IF EXISTS "case_studies_seo_speakable_path" CASCADE;`)
  await db.execute(sql`DROP TABLE IF EXISTS "_case_studies_v_version_outcomes" CASCADE;`)
  await db.execute(sql`DROP TABLE IF EXISTS "_case_studies_v_version_glance" CASCADE;`)
  await db.execute(sql`DROP TABLE IF EXISTS "_case_studies_v_version_seo_speakable_path" CASCADE;`)

  // `industry_ref_id` is deliberately NOT dropped: it predates this migration
  // in the collection config and other work depends on it.
  for (const column of ['body', 'quote', 'quote_author', 'quote_role', 'featured']) {
    await db.execute(sql`ALTER TABLE "case_studies" DROP COLUMN IF EXISTS ${sql.raw(`"${column}"`)};`)
    await db.execute(
      sql`ALTER TABLE "_case_studies_v" DROP COLUMN IF EXISTS ${sql.raw(`"version_${column}"`)};`,
    )
  }
  await db.execute(sql`ALTER TABLE "case_studies" DROP COLUMN IF EXISTS "seo_title";`)
  await db.execute(sql`ALTER TABLE "_case_studies_v" DROP COLUMN IF EXISTS "version_seo_title";`)
  // The remaining seo_* columns are left in place. Dropping thirty nullable
  // columns to undo one feature risks more than it reverts, and re-running the
  // up is a no-op over them.
}
