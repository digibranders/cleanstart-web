import { type MigrateUpArgs, type MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_news_region" AS ENUM('asia-pacific', 'europe-middle-east', 'usa-north-america');
  CREATE TYPE "public"."enum__news_v_version_region" AS ENUM('asia-pacific', 'europe-middle-east', 'usa-north-america');
  ALTER TABLE "news" ADD COLUMN "region" "enum_news_region";
  ALTER TABLE "_news_v" ADD COLUMN "version_region" "enum__news_v_version_region";`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "news" DROP COLUMN "region";
  ALTER TABLE "_news_v" DROP COLUMN "version_region";
  DROP TYPE "public"."enum_news_region";
  DROP TYPE "public"."enum__news_v_version_region";`)
}
