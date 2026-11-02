import { type MigrateDownArgs, type MigrateUpArgs, sql } from '@payloadcms/db-postgres'

/**
 * Advisories gain the two optional editor picks blogs already have, for the
 * sidebar CTAs on the advisory page: `cta_resource_id` (the resource offered
 * in the Learn step) and `cta_image` (the catalog image offered in the Explore
 * step). Both are overrides; the web app falls back to matching from the
 * advisory when unset.
 *
 * Mirrored on `_advisories_v` because advisories are versioned with drafts.
 * Names follow `20261005_090000_add_blog_cta_picks.ts`, which follows what
 * Payload itself generated for the same shape on blogs.
 *
 * Hand-written rather than generated, for the reason spelled out in
 * `20260921_100000_add_case_study_detail_fields.ts`: the newest `.json` schema
 * snapshot is from June, so `payload migrate:create` would emit every schema
 * change made since.
 *
 * Idempotent throughout: local databases run `push: true` and already have
 * these columns.
 */

const UP = [
  sql`ALTER TABLE "advisories" ADD COLUMN IF NOT EXISTS "cta_resource_id" integer;`,
  sql`ALTER TABLE "advisories" ADD COLUMN IF NOT EXISTS "cta_image" varchar;`,
  sql`ALTER TABLE "_advisories_v" ADD COLUMN IF NOT EXISTS "version_cta_resource_id" integer;`,
  sql`ALTER TABLE "_advisories_v" ADD COLUMN IF NOT EXISTS "version_cta_image" varchar;`,

  sql`DO $$ BEGIN ALTER TABLE "advisories" ADD CONSTRAINT "advisories_cta_resource_id_resources_id_fk" FOREIGN KEY ("cta_resource_id") REFERENCES "public"."resources"("id") ON DELETE set null ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;`,
  sql`DO $$ BEGIN ALTER TABLE "_advisories_v" ADD CONSTRAINT "_advisories_v_version_cta_resource_id_resources_id_fk" FOREIGN KEY ("version_cta_resource_id") REFERENCES "public"."resources"("id") ON DELETE set null ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;`,

  sql`CREATE INDEX IF NOT EXISTS "advisories_cta_resource_idx" ON "advisories" USING btree ("cta_resource_id");`,
  sql`CREATE INDEX IF NOT EXISTS "_advisories_v_version_version_cta_resource_idx" ON "_advisories_v" USING btree ("version_cta_resource_id");`,
]

export async function up({ db }: MigrateUpArgs): Promise<void> {
  for (const statement of UP) {
    await db.execute(statement)
  }
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`ALTER TABLE "advisories" DROP COLUMN IF EXISTS "cta_resource_id";`)
  await db.execute(sql`ALTER TABLE "advisories" DROP COLUMN IF EXISTS "cta_image";`)
  await db.execute(sql`ALTER TABLE "_advisories_v" DROP COLUMN IF EXISTS "version_cta_resource_id";`)
  await db.execute(sql`ALTER TABLE "_advisories_v" DROP COLUMN IF EXISTS "version_cta_image";`)
}
