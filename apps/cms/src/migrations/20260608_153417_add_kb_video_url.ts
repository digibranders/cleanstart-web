import { type MigrateDownArgs, type MigrateUpArgs, sql } from '@payloadcms/db-postgres';

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "knowledge_base" ADD COLUMN "video_url" varchar;
  ALTER TABLE "_knowledge_base_v" ADD COLUMN "version_video_url" varchar;`);
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "knowledge_base" DROP COLUMN "video_url";
  ALTER TABLE "_knowledge_base_v" DROP COLUMN "version_video_url";`);
}
