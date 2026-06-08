import { type MigrateDownArgs, type MigrateUpArgs, sql } from '@payloadcms/db-postgres';

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "knowledge_categories" ADD COLUMN "display_order" numeric DEFAULT 100;
  ALTER TABLE "_knowledge_categories_v" ADD COLUMN "version_display_order" numeric DEFAULT 100;`);
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "knowledge_categories" DROP COLUMN "display_order";
  ALTER TABLE "_knowledge_categories_v" DROP COLUMN "version_display_order";`);
}
