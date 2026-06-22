import { type MigrateDownArgs, type MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_page_registry_schema_type" AS ENUM('WebPage', 'AboutPage', 'ContactPage', 'CollectionPage', 'SoftwareApplication', 'Article', 'BlogPosting', 'NewsArticle', 'Event', 'JobPosting', 'ProfilePage');
  ALTER TABLE "page_registry" ADD COLUMN "schema_type" "enum_page_registry_schema_type";`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "page_registry" DROP COLUMN "schema_type";
  DROP TYPE "public"."enum_page_registry_schema_type";`)
}
