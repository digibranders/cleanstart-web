import { type MigrateUpArgs, type MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "career_applications" ADD COLUMN "location" varchar;
  ALTER TABLE "career_applications" ADD COLUMN "how_did_you_hear" varchar;
  ALTER TABLE "career_applications" ADD COLUMN "cover_letter_file_id" integer;
  ALTER TABLE "career_applications" ADD CONSTRAINT "career_applications_cover_letter_file_id_resumes_id_fk" FOREIGN KEY ("cover_letter_file_id") REFERENCES "public"."resumes"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "career_applications_cover_letter_file_idx" ON "career_applications" USING btree ("cover_letter_file_id");`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "career_applications" DROP CONSTRAINT "career_applications_cover_letter_file_id_resumes_id_fk";
  
  DROP INDEX "career_applications_cover_letter_file_idx";
  ALTER TABLE "career_applications" DROP COLUMN "location";
  ALTER TABLE "career_applications" DROP COLUMN "how_did_you_hear";
  ALTER TABLE "career_applications" DROP COLUMN "cover_letter_file_id";`)
}
