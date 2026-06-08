import { type MigrateUpArgs, type MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "news" ADD COLUMN "featured" boolean DEFAULT false;
  ALTER TABLE "_news_v" ADD COLUMN "version_featured" boolean DEFAULT false;`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "news" DROP COLUMN "featured";
  ALTER TABLE "_news_v" DROP COLUMN "version_featured";`)
}
