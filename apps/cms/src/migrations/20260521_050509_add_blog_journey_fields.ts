import { type MigrateUpArgs, type MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "blogs" ADD COLUMN "previous_post_id" integer;
  ALTER TABLE "blogs" ADD COLUMN "next_post_id" integer;
  ALTER TABLE "_blogs_v" ADD COLUMN "version_previous_post_id" integer;
  ALTER TABLE "_blogs_v" ADD COLUMN "version_next_post_id" integer;
  ALTER TABLE "blogs" ADD CONSTRAINT "blogs_previous_post_id_blogs_id_fk" FOREIGN KEY ("previous_post_id") REFERENCES "public"."blogs"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "blogs" ADD CONSTRAINT "blogs_next_post_id_blogs_id_fk" FOREIGN KEY ("next_post_id") REFERENCES "public"."blogs"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_blogs_v" ADD CONSTRAINT "_blogs_v_version_previous_post_id_blogs_id_fk" FOREIGN KEY ("version_previous_post_id") REFERENCES "public"."blogs"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_blogs_v" ADD CONSTRAINT "_blogs_v_version_next_post_id_blogs_id_fk" FOREIGN KEY ("version_next_post_id") REFERENCES "public"."blogs"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "blogs_previous_post_idx" ON "blogs" USING btree ("previous_post_id");
  CREATE INDEX "blogs_next_post_idx" ON "blogs" USING btree ("next_post_id");
  CREATE INDEX "_blogs_v_version_version_previous_post_idx" ON "_blogs_v" USING btree ("version_previous_post_id");
  CREATE INDEX "_blogs_v_version_version_next_post_idx" ON "_blogs_v" USING btree ("version_next_post_id");`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "blogs" DROP CONSTRAINT "blogs_previous_post_id_blogs_id_fk";
  
  ALTER TABLE "blogs" DROP CONSTRAINT "blogs_next_post_id_blogs_id_fk";
  
  ALTER TABLE "_blogs_v" DROP CONSTRAINT "_blogs_v_version_previous_post_id_blogs_id_fk";
  
  ALTER TABLE "_blogs_v" DROP CONSTRAINT "_blogs_v_version_next_post_id_blogs_id_fk";
  
  DROP INDEX "blogs_previous_post_idx";
  DROP INDEX "blogs_next_post_idx";
  DROP INDEX "_blogs_v_version_version_previous_post_idx";
  DROP INDEX "_blogs_v_version_version_next_post_idx";
  ALTER TABLE "blogs" DROP COLUMN "previous_post_id";
  ALTER TABLE "blogs" DROP COLUMN "next_post_id";
  ALTER TABLE "_blogs_v" DROP COLUMN "version_previous_post_id";
  ALTER TABLE "_blogs_v" DROP COLUMN "version_next_post_id";`)
}
