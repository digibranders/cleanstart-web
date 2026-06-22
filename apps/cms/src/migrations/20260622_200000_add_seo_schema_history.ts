import { type MigrateDownArgs, type MigrateUpArgs, sql } from '@payloadcms/db-postgres'

// Per-@type schema override history (`seo.schemaHistory`) for every collection
// that carries the shared `seo` group — main tables + their draft/version
// tables. Maintained by schemaHistoryFieldHook on each save.
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
  ALTER TABLE "_authors_v" ADD COLUMN "version_seo_schema_history" jsonb;
  ALTER TABLE "_blogs_v" ADD COLUMN "version_seo_schema_history" jsonb;
  ALTER TABLE "_categories_v" ADD COLUMN "version_seo_schema_history" jsonb;
  ALTER TABLE "_events_v" ADD COLUMN "version_seo_schema_history" jsonb;
  ALTER TABLE "_guides_v" ADD COLUMN "version_seo_schema_history" jsonb;
  ALTER TABLE "_jobs_v" ADD COLUMN "version_seo_schema_history" jsonb;
  ALTER TABLE "_knowledge_base_v" ADD COLUMN "version_seo_schema_history" jsonb;
  ALTER TABLE "_knowledge_categories_v" ADD COLUMN "version_seo_schema_history" jsonb;
  ALTER TABLE "_news_categories_v" ADD COLUMN "version_seo_schema_history" jsonb;
  ALTER TABLE "_news_v" ADD COLUMN "version_seo_schema_history" jsonb;
  ALTER TABLE "_pages_v" ADD COLUMN "version_seo_schema_history" jsonb;
  ALTER TABLE "_podcast_episodes_v" ADD COLUMN "version_seo_schema_history" jsonb;
  ALTER TABLE "_resources_v" ADD COLUMN "version_seo_schema_history" jsonb;
  ALTER TABLE "_webinars_v" ADD COLUMN "version_seo_schema_history" jsonb;
  ALTER TABLE "authors" ADD COLUMN "seo_schema_history" jsonb;
  ALTER TABLE "blogs" ADD COLUMN "seo_schema_history" jsonb;
  ALTER TABLE "categories" ADD COLUMN "seo_schema_history" jsonb;
  ALTER TABLE "events" ADD COLUMN "seo_schema_history" jsonb;
  ALTER TABLE "guides" ADD COLUMN "seo_schema_history" jsonb;
  ALTER TABLE "jobs" ADD COLUMN "seo_schema_history" jsonb;
  ALTER TABLE "knowledge_base" ADD COLUMN "seo_schema_history" jsonb;
  ALTER TABLE "knowledge_categories" ADD COLUMN "seo_schema_history" jsonb;
  ALTER TABLE "news" ADD COLUMN "seo_schema_history" jsonb;
  ALTER TABLE "news_categories" ADD COLUMN "seo_schema_history" jsonb;
  ALTER TABLE "pages" ADD COLUMN "seo_schema_history" jsonb;
  ALTER TABLE "podcast_episodes" ADD COLUMN "seo_schema_history" jsonb;
  ALTER TABLE "resources" ADD COLUMN "seo_schema_history" jsonb;
  ALTER TABLE "webinars" ADD COLUMN "seo_schema_history" jsonb;`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
  ALTER TABLE "_authors_v" DROP COLUMN "version_seo_schema_history";
  ALTER TABLE "_blogs_v" DROP COLUMN "version_seo_schema_history";
  ALTER TABLE "_categories_v" DROP COLUMN "version_seo_schema_history";
  ALTER TABLE "_events_v" DROP COLUMN "version_seo_schema_history";
  ALTER TABLE "_guides_v" DROP COLUMN "version_seo_schema_history";
  ALTER TABLE "_jobs_v" DROP COLUMN "version_seo_schema_history";
  ALTER TABLE "_knowledge_base_v" DROP COLUMN "version_seo_schema_history";
  ALTER TABLE "_knowledge_categories_v" DROP COLUMN "version_seo_schema_history";
  ALTER TABLE "_news_categories_v" DROP COLUMN "version_seo_schema_history";
  ALTER TABLE "_news_v" DROP COLUMN "version_seo_schema_history";
  ALTER TABLE "_pages_v" DROP COLUMN "version_seo_schema_history";
  ALTER TABLE "_podcast_episodes_v" DROP COLUMN "version_seo_schema_history";
  ALTER TABLE "_resources_v" DROP COLUMN "version_seo_schema_history";
  ALTER TABLE "_webinars_v" DROP COLUMN "version_seo_schema_history";
  ALTER TABLE "authors" DROP COLUMN "seo_schema_history";
  ALTER TABLE "blogs" DROP COLUMN "seo_schema_history";
  ALTER TABLE "categories" DROP COLUMN "seo_schema_history";
  ALTER TABLE "events" DROP COLUMN "seo_schema_history";
  ALTER TABLE "guides" DROP COLUMN "seo_schema_history";
  ALTER TABLE "jobs" DROP COLUMN "seo_schema_history";
  ALTER TABLE "knowledge_base" DROP COLUMN "seo_schema_history";
  ALTER TABLE "knowledge_categories" DROP COLUMN "seo_schema_history";
  ALTER TABLE "news" DROP COLUMN "seo_schema_history";
  ALTER TABLE "news_categories" DROP COLUMN "seo_schema_history";
  ALTER TABLE "pages" DROP COLUMN "seo_schema_history";
  ALTER TABLE "podcast_episodes" DROP COLUMN "seo_schema_history";
  ALTER TABLE "resources" DROP COLUMN "seo_schema_history";
  ALTER TABLE "webinars" DROP COLUMN "seo_schema_history";`)
}
