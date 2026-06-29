import { type MigrateDownArgs, type MigrateUpArgs, sql } from '@payloadcms/db-postgres'

// Guides no longer use an uploaded hero image — the cover is an auto-generated
// brand card whose title is now editor-set via `coverTitle`. Drop the
// `hero_image_id` upload relation (its FK + single-column index drop with the
// column) and add the `cover_title` text column, on both the live and version
// tables.
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
  ALTER TABLE "guides" DROP COLUMN IF EXISTS "hero_image_id";
  ALTER TABLE "_guides_v" DROP COLUMN IF EXISTS "version_hero_image_id";
  ALTER TABLE "guides" ADD COLUMN IF NOT EXISTS "cover_title" varchar;
  ALTER TABLE "_guides_v" ADD COLUMN IF NOT EXISTS "version_cover_title" varchar;`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
  ALTER TABLE "guides" DROP COLUMN IF EXISTS "cover_title";
  ALTER TABLE "_guides_v" DROP COLUMN IF EXISTS "version_cover_title";
  ALTER TABLE "guides" ADD COLUMN IF NOT EXISTS "hero_image_id" integer;
  ALTER TABLE "_guides_v" ADD COLUMN IF NOT EXISTS "version_hero_image_id" integer;
  ALTER TABLE "guides"
    ADD CONSTRAINT "guides_hero_image_id_media_id_fk" FOREIGN KEY ("hero_image_id") REFERENCES "media"("id");
  ALTER TABLE "_guides_v"
    ADD CONSTRAINT "_guides_v_version_hero_image_id_media_id_fk" FOREIGN KEY ("version_hero_image_id") REFERENCES "media"("id");
  CREATE INDEX IF NOT EXISTS "guides_hero_image_idx" ON "guides" ("hero_image_id");`)
}
