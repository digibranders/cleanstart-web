import { type MigrateUpArgs, type MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "broken_links" ADD COLUMN "anchor_text" varchar;
  ALTER TABLE "broken_links" ADD COLUMN "source_doc_title" varchar;
  ALTER TABLE "broken_links" ADD COLUMN "final_url" varchar;
  ALTER TABLE "broken_links" ADD COLUMN "location" varchar;`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "broken_links" DROP COLUMN "anchor_text";
  ALTER TABLE "broken_links" DROP COLUMN "source_doc_title";
  ALTER TABLE "broken_links" DROP COLUMN "final_url";
  ALTER TABLE "broken_links" DROP COLUMN "location";`)
}
