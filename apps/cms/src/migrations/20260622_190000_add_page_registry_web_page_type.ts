import { type MigrateDownArgs, type MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    CREATE TYPE "public"."enum_page_registry_web_page_type" AS ENUM('none', 'WebPage', 'AboutPage', 'ContactPage', 'CollectionPage', 'ProfilePage');
    ALTER TABLE "page_registry" ADD COLUMN "web_page_type" "enum_page_registry_web_page_type" DEFAULT 'none';`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "page_registry" DROP COLUMN "web_page_type";
    DROP TYPE "public"."enum_page_registry_web_page_type";`)
}
