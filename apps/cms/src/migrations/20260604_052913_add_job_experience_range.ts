import { type MigrateUpArgs, type MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "jobs" ADD COLUMN "experience_range" varchar;
  ALTER TABLE "_jobs_v" ADD COLUMN "version_experience_range" varchar;`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "jobs" DROP COLUMN "experience_range";
  ALTER TABLE "_jobs_v" DROP COLUMN "version_experience_range";`)
}
