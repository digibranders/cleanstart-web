import { type MigrateDownArgs, type MigrateUpArgs, sql } from '@payloadcms/db-postgres'

/**
 * Blogs gain two optional editor picks for the sidebar CTAs on the article
 * page: `cta_resource_id` (the resource offered in the Learn step) and
 * `cta_image` (the catalog image offered in the Explore step). Both are
 * overrides; the web app falls back to matching from the post when unset.
 *
 * Mirrored on `_blogs_v` because blogs are versioned with drafts.
 *
 * Hand-written rather than generated, for the reason spelled out in
 * `20260921_100000_add_case_study_detail_fields.ts`: the newest `.json` schema
 * snapshot is from June, so `payload migrate:create` would emit every schema
 * change made since. Names follow what Payload itself generated for the
 * neighbouring `previous_post_id` relationship.
 *
 * Idempotent throughout: local databases run `push: true` and already have
 * these columns.
 */

const UP = [
  sql`ALTER TABLE "blogs" ADD COLUMN IF NOT EXISTS "cta_resource_id" integer;`,
  sql`ALTER TABLE "blogs" ADD COLUMN IF NOT EXISTS "cta_image" varchar;`,
  sql`ALTER TABLE "_blogs_v" ADD COLUMN IF NOT EXISTS "version_cta_resource_id" integer;`,
  sql`ALTER TABLE "_blogs_v" ADD COLUMN IF NOT EXISTS "version_cta_image" varchar;`,

  sql`DO $$ BEGIN ALTER TABLE "blogs" ADD CONSTRAINT "blogs_cta_resource_id_resources_id_fk" FOREIGN KEY ("cta_resource_id") REFERENCES "public"."resources"("id") ON DELETE set null ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;`,
  sql`DO $$ BEGIN ALTER TABLE "_blogs_v" ADD CONSTRAINT "_blogs_v_version_cta_resource_id_resources_id_fk" FOREIGN KEY ("version_cta_resource_id") REFERENCES "public"."resources"("id") ON DELETE set null ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;`,

  sql`CREATE INDEX IF NOT EXISTS "blogs_cta_resource_idx" ON "blogs" USING btree ("cta_resource_id");`,
  sql`CREATE INDEX IF NOT EXISTS "_blogs_v_version_version_cta_resource_idx" ON "_blogs_v" USING btree ("version_cta_resource_id");`,
]

export async function up({ db }: MigrateUpArgs): Promise<void> {
  for (const statement of UP) {
    await db.execute(statement)
  }
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`ALTER TABLE "blogs" DROP COLUMN IF EXISTS "cta_resource_id";`)
  await db.execute(sql`ALTER TABLE "blogs" DROP COLUMN IF EXISTS "cta_image";`)
  await db.execute(sql`ALTER TABLE "_blogs_v" DROP COLUMN IF EXISTS "version_cta_resource_id";`)
  await db.execute(sql`ALTER TABLE "_blogs_v" DROP COLUMN IF EXISTS "version_cta_image";`)
}
