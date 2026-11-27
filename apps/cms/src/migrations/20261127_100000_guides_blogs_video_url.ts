import { type MigrateDownArgs, type MigrateUpArgs, sql } from '@payloadcms/db-postgres'

// Optional lesson video on guides and blogs: a direct MP4 URL, same shape as
// `knowledge_base.video_url`. Adds the column to the live and version tables.
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
  ALTER TABLE "guides" ADD COLUMN IF NOT EXISTS "video_url" varchar;
  ALTER TABLE "_guides_v" ADD COLUMN IF NOT EXISTS "version_video_url" varchar;
  ALTER TABLE "blogs" ADD COLUMN IF NOT EXISTS "video_url" varchar;
  ALTER TABLE "_blogs_v" ADD COLUMN IF NOT EXISTS "version_video_url" varchar;`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
  ALTER TABLE "guides" DROP COLUMN IF EXISTS "video_url";
  ALTER TABLE "_guides_v" DROP COLUMN IF EXISTS "version_video_url";
  ALTER TABLE "blogs" DROP COLUMN IF EXISTS "video_url";
  ALTER TABLE "_blogs_v" DROP COLUMN IF EXISTS "version_video_url";`)
}
