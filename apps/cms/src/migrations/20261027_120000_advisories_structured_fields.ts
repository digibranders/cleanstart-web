import { type MigrateDownArgs, type MigrateUpArgs, sql } from '@payloadcms/db-postgres'

/**
 * Structured advisories (client brief, 2026-10-26): CVE IDs, technology, CVSS
 * score, CleanStart fix status, and the Impacted packages and Resolution
 * sections. Mirrored on `_advisories_v` because advisories are versioned.
 *
 * `cves` is a hasMany text field, stored in `advisories_texts`. The status
 * field is `fixStatus` because a field named `status` would generate
 * `enum_advisories_status`, which is already the drafts `_status` enum.
 *
 * Additive only. The columns of the fields now hidden in the admin (hero
 * image, authors, FAQs, table of contents) are deliberately left in place.
 *
 * DDL transcribed from the schema Payload pushed onto a scratch clone of a dev
 * database, then checked by applying this file twice to a second clone and
 * diffing both ways against the push: no difference.
 */

const UP = [
  sql`DO $$ BEGIN CREATE TYPE "public"."enum__advisories_v_version_fix_status" AS ENUM('identified', 'in_progress', 'fixed', 'not_affected'); EXCEPTION WHEN duplicate_object THEN null; END $$;`,
  sql`DO $$ BEGIN CREATE TYPE "public"."enum_advisories_fix_status" AS ENUM('identified', 'in_progress', 'fixed', 'not_affected'); EXCEPTION WHEN duplicate_object THEN null; END $$;`,
  sql`CREATE TABLE IF NOT EXISTS "_advisories_v_texts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"text" varchar
  );`,
  sql`CREATE TABLE IF NOT EXISTS "advisories_texts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"text" varchar
  );`,
  sql`ALTER TABLE "_advisories_v" ADD COLUMN IF NOT EXISTS "version_technology" varchar;`,
  sql`ALTER TABLE "_advisories_v" ADD COLUMN IF NOT EXISTS "version_cvss_score" numeric;`,
  sql`ALTER TABLE "_advisories_v" ADD COLUMN IF NOT EXISTS "version_fix_status" "public"."enum__advisories_v_version_fix_status" DEFAULT 'identified';`,
  sql`ALTER TABLE "_advisories_v" ADD COLUMN IF NOT EXISTS "version_impact" jsonb;`,
  sql`ALTER TABLE "_advisories_v" ADD COLUMN IF NOT EXISTS "version_resolution" jsonb;`,
  sql`ALTER TABLE "advisories" ADD COLUMN IF NOT EXISTS "technology" varchar;`,
  sql`ALTER TABLE "advisories" ADD COLUMN IF NOT EXISTS "cvss_score" numeric;`,
  sql`ALTER TABLE "advisories" ADD COLUMN IF NOT EXISTS "fix_status" "public"."enum_advisories_fix_status" DEFAULT 'identified';`,
  sql`ALTER TABLE "advisories" ADD COLUMN IF NOT EXISTS "impact" jsonb;`,
  sql`ALTER TABLE "advisories" ADD COLUMN IF NOT EXISTS "resolution" jsonb;`,
  sql`DO $$ BEGIN ALTER TABLE "_advisories_v_texts" ADD CONSTRAINT "_advisories_v_texts_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_advisories_v"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;`,
  sql`DO $$ BEGIN ALTER TABLE "advisories_texts" ADD CONSTRAINT "advisories_texts_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."advisories"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;`,
  sql`CREATE INDEX IF NOT EXISTS "_advisories_v_texts_order_parent" ON "_advisories_v_texts" USING btree ("order", "parent_id");`,
  sql`CREATE INDEX IF NOT EXISTS "advisories_texts_order_parent" ON "advisories_texts" USING btree ("order", "parent_id");`,
] as const

export async function up({ db }: MigrateUpArgs): Promise<void> {
  for (const statement of UP) {
    await db.execute(statement)
  }
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`ALTER TABLE "_advisories_v" DROP COLUMN IF EXISTS "version_technology";`)
  await db.execute(sql`ALTER TABLE "_advisories_v" DROP COLUMN IF EXISTS "version_cvss_score";`)
  await db.execute(sql`ALTER TABLE "_advisories_v" DROP COLUMN IF EXISTS "version_fix_status";`)
  await db.execute(sql`ALTER TABLE "_advisories_v" DROP COLUMN IF EXISTS "version_impact";`)
  await db.execute(sql`ALTER TABLE "_advisories_v" DROP COLUMN IF EXISTS "version_resolution";`)
  await db.execute(sql`ALTER TABLE "advisories" DROP COLUMN IF EXISTS "technology";`)
  await db.execute(sql`ALTER TABLE "advisories" DROP COLUMN IF EXISTS "cvss_score";`)
  await db.execute(sql`ALTER TABLE "advisories" DROP COLUMN IF EXISTS "fix_status";`)
  await db.execute(sql`ALTER TABLE "advisories" DROP COLUMN IF EXISTS "impact";`)
  await db.execute(sql`ALTER TABLE "advisories" DROP COLUMN IF EXISTS "resolution";`)
  await db.execute(sql`DROP TABLE IF EXISTS "_advisories_v_texts" CASCADE;`)
  await db.execute(sql`DROP TABLE IF EXISTS "advisories_texts" CASCADE;`)
  await db.execute(sql`DROP TYPE IF EXISTS "public"."enum__advisories_v_version_fix_status";`)
  await db.execute(sql`DROP TYPE IF EXISTS "public"."enum_advisories_fix_status";`)
}
