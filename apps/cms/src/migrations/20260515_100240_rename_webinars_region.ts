import type { MigrateUpArgs, MigrateDownArgs } from '@payloadcms/db-postgres'
import { sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TYPE "public"."enum_webinars_region" RENAME TO "enum_webinars_region_old";
    CREATE TYPE "public"."enum_webinars_region" AS ENUM('north-america', 'asia-mea', 'emea', 'global');

    ALTER TABLE "webinars" ALTER COLUMN "region" DROP DEFAULT;
    ALTER TABLE "webinars"
      ALTER COLUMN "region" TYPE "public"."enum_webinars_region"
      USING (
        CASE "region"::text
          WHEN 'Americas' THEN 'north-america'
          WHEN 'APAC'     THEN 'asia-mea'
          WHEN 'EMEA'     THEN 'emea'
          WHEN 'Global'   THEN 'global'
        END
      )::"public"."enum_webinars_region";
    ALTER TABLE "webinars" ALTER COLUMN "region" SET DEFAULT 'global';
    DROP TYPE "public"."enum_webinars_region_old";

    ALTER TYPE "public"."enum__webinars_v_version_region" RENAME TO "enum__webinars_v_version_region_old";
    CREATE TYPE "public"."enum__webinars_v_version_region" AS ENUM('north-america', 'asia-mea', 'emea', 'global');

    ALTER TABLE "_webinars_v" ALTER COLUMN "version_region" DROP DEFAULT;
    ALTER TABLE "_webinars_v"
      ALTER COLUMN "version_region" TYPE "public"."enum__webinars_v_version_region"
      USING (
        CASE "version_region"::text
          WHEN 'Americas' THEN 'north-america'
          WHEN 'APAC'     THEN 'asia-mea'
          WHEN 'EMEA'     THEN 'emea'
          WHEN 'Global'   THEN 'global'
        END
      )::"public"."enum__webinars_v_version_region";
    ALTER TABLE "_webinars_v" ALTER COLUMN "version_region" SET DEFAULT 'global';
    DROP TYPE "public"."enum__webinars_v_version_region_old";
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TYPE "public"."enum_webinars_region" RENAME TO "enum_webinars_region_new";
    CREATE TYPE "public"."enum_webinars_region" AS ENUM('Americas', 'EMEA', 'APAC', 'Global');

    ALTER TABLE "webinars" ALTER COLUMN "region" DROP DEFAULT;
    ALTER TABLE "webinars"
      ALTER COLUMN "region" TYPE "public"."enum_webinars_region"
      USING (
        CASE "region"::text
          WHEN 'north-america' THEN 'Americas'
          WHEN 'asia-mea'      THEN 'APAC'
          WHEN 'emea'          THEN 'EMEA'
          WHEN 'global'        THEN 'Global'
        END
      )::"public"."enum_webinars_region";
    ALTER TABLE "webinars" ALTER COLUMN "region" SET DEFAULT 'Global';
    DROP TYPE "public"."enum_webinars_region_new";

    ALTER TYPE "public"."enum__webinars_v_version_region" RENAME TO "enum__webinars_v_version_region_new";
    CREATE TYPE "public"."enum__webinars_v_version_region" AS ENUM('Americas', 'EMEA', 'APAC', 'Global');

    ALTER TABLE "_webinars_v" ALTER COLUMN "version_region" DROP DEFAULT;
    ALTER TABLE "_webinars_v"
      ALTER COLUMN "version_region" TYPE "public"."enum__webinars_v_version_region"
      USING (
        CASE "version_region"::text
          WHEN 'north-america' THEN 'Americas'
          WHEN 'asia-mea'      THEN 'APAC'
          WHEN 'emea'          THEN 'EMEA'
          WHEN 'global'        THEN 'Global'
        END
      )::"public"."enum__webinars_v_version_region";
    ALTER TABLE "_webinars_v" ALTER COLUMN "version_region" SET DEFAULT 'Global';
    DROP TYPE "public"."enum__webinars_v_version_region_new";
  `)
}
