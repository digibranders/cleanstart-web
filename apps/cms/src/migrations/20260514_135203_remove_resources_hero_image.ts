import type { MigrateUpArgs, MigrateDownArgs } from '@payloadcms/db-postgres'
import { sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "resources" DROP CONSTRAINT "resources_hero_image_id_media_id_fk";
  
  ALTER TABLE "_resources_v" DROP CONSTRAINT "_resources_v_version_hero_image_id_media_id_fk";
  
  DROP INDEX "resources_hero_image_idx";
  DROP INDEX "_resources_v_version_version_hero_image_idx";
  ALTER TABLE "resources" DROP COLUMN "hero_image_id";
  ALTER TABLE "_resources_v" DROP COLUMN "version_hero_image_id";`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "resources" ADD COLUMN "hero_image_id" integer;
  ALTER TABLE "_resources_v" ADD COLUMN "version_hero_image_id" integer;
  ALTER TABLE "resources" ADD CONSTRAINT "resources_hero_image_id_media_id_fk" FOREIGN KEY ("hero_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_resources_v" ADD CONSTRAINT "_resources_v_version_hero_image_id_media_id_fk" FOREIGN KEY ("version_hero_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "resources_hero_image_idx" ON "resources" USING btree ("hero_image_id");
  CREATE INDEX "_resources_v_version_version_hero_image_idx" ON "_resources_v" USING btree ("version_hero_image_id");`)
}
