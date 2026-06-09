import { type MigrateUpArgs, type MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "guides" ADD COLUMN "previous_guide_id" integer;
  ALTER TABLE "guides" ADD COLUMN "next_guide_id" integer;
  ALTER TABLE "_guides_v" ADD COLUMN "version_previous_guide_id" integer;
  ALTER TABLE "_guides_v" ADD COLUMN "version_next_guide_id" integer;
  ALTER TABLE "guides" ADD CONSTRAINT "guides_previous_guide_id_guides_id_fk" FOREIGN KEY ("previous_guide_id") REFERENCES "public"."guides"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "guides" ADD CONSTRAINT "guides_next_guide_id_guides_id_fk" FOREIGN KEY ("next_guide_id") REFERENCES "public"."guides"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_guides_v" ADD CONSTRAINT "_guides_v_version_previous_guide_id_guides_id_fk" FOREIGN KEY ("version_previous_guide_id") REFERENCES "public"."guides"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_guides_v" ADD CONSTRAINT "_guides_v_version_next_guide_id_guides_id_fk" FOREIGN KEY ("version_next_guide_id") REFERENCES "public"."guides"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "guides_previous_guide_idx" ON "guides" USING btree ("previous_guide_id");
  CREATE INDEX "guides_next_guide_idx" ON "guides" USING btree ("next_guide_id");
  CREATE INDEX "_guides_v_version_version_previous_guide_idx" ON "_guides_v" USING btree ("version_previous_guide_id");
  CREATE INDEX "_guides_v_version_version_next_guide_idx" ON "_guides_v" USING btree ("version_next_guide_id");`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "guides" DROP CONSTRAINT "guides_previous_guide_id_guides_id_fk";
  
  ALTER TABLE "guides" DROP CONSTRAINT "guides_next_guide_id_guides_id_fk";
  
  ALTER TABLE "_guides_v" DROP CONSTRAINT "_guides_v_version_previous_guide_id_guides_id_fk";
  
  ALTER TABLE "_guides_v" DROP CONSTRAINT "_guides_v_version_next_guide_id_guides_id_fk";
  
  DROP INDEX "guides_previous_guide_idx";
  DROP INDEX "guides_next_guide_idx";
  DROP INDEX "_guides_v_version_version_previous_guide_idx";
  DROP INDEX "_guides_v_version_version_next_guide_idx";
  ALTER TABLE "guides" DROP COLUMN "previous_guide_id";
  ALTER TABLE "guides" DROP COLUMN "next_guide_id";
  ALTER TABLE "_guides_v" DROP COLUMN "version_previous_guide_id";
  ALTER TABLE "_guides_v" DROP COLUMN "version_next_guide_id";`)
}
