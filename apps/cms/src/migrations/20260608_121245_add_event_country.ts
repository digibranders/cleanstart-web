import { type MigrateUpArgs, type MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_events_country" AS ENUM('india', 'united-states', 'uae', 'thailand');
  CREATE TYPE "public"."enum__events_v_version_country" AS ENUM('india', 'united-states', 'uae', 'thailand');
  ALTER TABLE "events" ADD COLUMN "country" "enum_events_country";
  ALTER TABLE "_events_v" ADD COLUMN "version_country" "enum__events_v_version_country";`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "events" DROP COLUMN "country";
  ALTER TABLE "_events_v" DROP COLUMN "version_country";
  DROP TYPE "public"."enum_events_country";
  DROP TYPE "public"."enum__events_v_version_country";`)
}
