import { type MigrateDownArgs, type MigrateUpArgs, sql } from '@payloadcms/db-postgres'

// Advisories get an editor-set `coverTitle` for the listing-card cover, as
// guides have, so the cover text can differ from the vulnerability name.
// Added on both the live and version tables.
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
  ALTER TABLE "advisories" ADD COLUMN IF NOT EXISTS "cover_title" varchar;
  ALTER TABLE "_advisories_v" ADD COLUMN IF NOT EXISTS "version_cover_title" varchar;`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
  ALTER TABLE "advisories" DROP COLUMN IF EXISTS "cover_title";
  ALTER TABLE "_advisories_v" DROP COLUMN IF EXISTS "version_cover_title";`)
}
