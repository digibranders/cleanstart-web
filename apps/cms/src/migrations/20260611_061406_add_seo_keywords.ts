import { type MigrateDownArgs, type MigrateUpArgs, sql } from '@payloadcms/db-postgres';

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "blogs" ADD COLUMN "seo_keywords" jsonb;
  ALTER TABLE "_blogs_v" ADD COLUMN "version_seo_keywords" jsonb;
  ALTER TABLE "news" ADD COLUMN "seo_keywords" jsonb;
  ALTER TABLE "_news_v" ADD COLUMN "version_seo_keywords" jsonb;
  ALTER TABLE "guides" ADD COLUMN "seo_keywords" jsonb;
  ALTER TABLE "_guides_v" ADD COLUMN "version_seo_keywords" jsonb;
  ALTER TABLE "knowledge_base" ADD COLUMN "seo_keywords" jsonb;
  ALTER TABLE "_knowledge_base_v" ADD COLUMN "version_seo_keywords" jsonb;
  ALTER TABLE "resources" ADD COLUMN "seo_keywords" jsonb;
  ALTER TABLE "_resources_v" ADD COLUMN "version_seo_keywords" jsonb;
  ALTER TABLE "events" ADD COLUMN "seo_keywords" jsonb;
  ALTER TABLE "_events_v" ADD COLUMN "version_seo_keywords" jsonb;
  ALTER TABLE "webinars" ADD COLUMN "seo_keywords" jsonb;
  ALTER TABLE "_webinars_v" ADD COLUMN "version_seo_keywords" jsonb;
  ALTER TABLE "podcast_episodes" ADD COLUMN "seo_keywords" jsonb;
  ALTER TABLE "_podcast_episodes_v" ADD COLUMN "version_seo_keywords" jsonb;
  ALTER TABLE "jobs" ADD COLUMN "seo_keywords" jsonb;
  ALTER TABLE "_jobs_v" ADD COLUMN "version_seo_keywords" jsonb;
  ALTER TABLE "pages" ADD COLUMN "seo_keywords" jsonb;
  ALTER TABLE "_pages_v" ADD COLUMN "version_seo_keywords" jsonb;
  ALTER TABLE "authors" ADD COLUMN "seo_keywords" jsonb;
  ALTER TABLE "_authors_v" ADD COLUMN "version_seo_keywords" jsonb;
  ALTER TABLE "categories" ADD COLUMN "seo_keywords" jsonb;
  ALTER TABLE "_categories_v" ADD COLUMN "version_seo_keywords" jsonb;
  ALTER TABLE "news_categories" ADD COLUMN "seo_keywords" jsonb;
  ALTER TABLE "_news_categories_v" ADD COLUMN "version_seo_keywords" jsonb;
  ALTER TABLE "knowledge_categories" ADD COLUMN "seo_keywords" jsonb;
  ALTER TABLE "_knowledge_categories_v" ADD COLUMN "version_seo_keywords" jsonb;`);
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "blogs" DROP COLUMN "seo_keywords";
  ALTER TABLE "_blogs_v" DROP COLUMN "version_seo_keywords";
  ALTER TABLE "news" DROP COLUMN "seo_keywords";
  ALTER TABLE "_news_v" DROP COLUMN "version_seo_keywords";
  ALTER TABLE "guides" DROP COLUMN "seo_keywords";
  ALTER TABLE "_guides_v" DROP COLUMN "version_seo_keywords";
  ALTER TABLE "knowledge_base" DROP COLUMN "seo_keywords";
  ALTER TABLE "_knowledge_base_v" DROP COLUMN "version_seo_keywords";
  ALTER TABLE "resources" DROP COLUMN "seo_keywords";
  ALTER TABLE "_resources_v" DROP COLUMN "version_seo_keywords";
  ALTER TABLE "events" DROP COLUMN "seo_keywords";
  ALTER TABLE "_events_v" DROP COLUMN "version_seo_keywords";
  ALTER TABLE "webinars" DROP COLUMN "seo_keywords";
  ALTER TABLE "_webinars_v" DROP COLUMN "version_seo_keywords";
  ALTER TABLE "podcast_episodes" DROP COLUMN "seo_keywords";
  ALTER TABLE "_podcast_episodes_v" DROP COLUMN "version_seo_keywords";
  ALTER TABLE "jobs" DROP COLUMN "seo_keywords";
  ALTER TABLE "_jobs_v" DROP COLUMN "version_seo_keywords";
  ALTER TABLE "pages" DROP COLUMN "seo_keywords";
  ALTER TABLE "_pages_v" DROP COLUMN "version_seo_keywords";
  ALTER TABLE "authors" DROP COLUMN "seo_keywords";
  ALTER TABLE "_authors_v" DROP COLUMN "version_seo_keywords";
  ALTER TABLE "categories" DROP COLUMN "seo_keywords";
  ALTER TABLE "_categories_v" DROP COLUMN "version_seo_keywords";
  ALTER TABLE "news_categories" DROP COLUMN "seo_keywords";
  ALTER TABLE "_news_categories_v" DROP COLUMN "version_seo_keywords";
  ALTER TABLE "knowledge_categories" DROP COLUMN "seo_keywords";
  ALTER TABLE "_knowledge_categories_v" DROP COLUMN "version_seo_keywords";`);
}
