import type { MigrateUpArgs, MigrateDownArgs } from '@payloadcms/db-postgres'
import { sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TYPE "public"."enum_resources_type" RENAME TO "enum_resources_type_old";
    CREATE TYPE "public"."enum_resources_type" AS ENUM('whitepaper', 'ebook', 'datasheet', 'architecture-insights', 'report');

    ALTER TABLE "resources"
      ALTER COLUMN "type" TYPE "public"."enum_resources_type"
      USING (
        CASE "type"::text
          WHEN 'whitepaper' THEN 'whitepaper'
          WHEN 'report'     THEN 'report'
          WHEN 'datasheet'  THEN 'datasheet'
          WHEN 'brief'      THEN 'ebook'
          WHEN 'case-study' THEN 'architecture-insights'
        END
      )::"public"."enum_resources_type";
    DROP TYPE "public"."enum_resources_type_old";

    ALTER TYPE "public"."enum__resources_v_version_type" RENAME TO "enum__resources_v_version_type_old";
    CREATE TYPE "public"."enum__resources_v_version_type" AS ENUM('whitepaper', 'ebook', 'datasheet', 'architecture-insights', 'report');

    ALTER TABLE "_resources_v"
      ALTER COLUMN "version_type" TYPE "public"."enum__resources_v_version_type"
      USING (
        CASE "version_type"::text
          WHEN 'whitepaper' THEN 'whitepaper'
          WHEN 'report'     THEN 'report'
          WHEN 'datasheet'  THEN 'datasheet'
          WHEN 'brief'      THEN 'ebook'
          WHEN 'case-study' THEN 'architecture-insights'
        END
      )::"public"."enum__resources_v_version_type";
    DROP TYPE "public"."enum__resources_v_version_type_old";
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TYPE "public"."enum_resources_type" RENAME TO "enum_resources_type_new";
    CREATE TYPE "public"."enum_resources_type" AS ENUM('whitepaper', 'report', 'brief', 'datasheet', 'case-study');

    ALTER TABLE "resources"
      ALTER COLUMN "type" TYPE "public"."enum_resources_type"
      USING (
        CASE "type"::text
          WHEN 'whitepaper'            THEN 'whitepaper'
          WHEN 'report'                THEN 'report'
          WHEN 'datasheet'             THEN 'datasheet'
          WHEN 'ebook'                 THEN 'brief'
          WHEN 'architecture-insights' THEN 'case-study'
        END
      )::"public"."enum_resources_type";
    DROP TYPE "public"."enum_resources_type_new";

    ALTER TYPE "public"."enum__resources_v_version_type" RENAME TO "enum__resources_v_version_type_new";
    CREATE TYPE "public"."enum__resources_v_version_type" AS ENUM('whitepaper', 'report', 'brief', 'datasheet', 'case-study');

    ALTER TABLE "_resources_v"
      ALTER COLUMN "version_type" TYPE "public"."enum__resources_v_version_type"
      USING (
        CASE "version_type"::text
          WHEN 'whitepaper'            THEN 'whitepaper'
          WHEN 'report'                THEN 'report'
          WHEN 'datasheet'             THEN 'datasheet'
          WHEN 'ebook'                 THEN 'brief'
          WHEN 'architecture-insights' THEN 'case-study'
        END
      )::"public"."enum__resources_v_version_type";
    DROP TYPE "public"."enum__resources_v_version_type_new";
  `)
}
