import type { MigrateUpArgs, MigrateDownArgs } from '@payloadcms/db-postgres'
import { sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_blogs_toc_depth" AS ENUM('h2', 'h2_h3', 'h2_h3_h4');
  CREATE TYPE "public"."enum__blogs_v_version_toc_depth" AS ENUM('h2', 'h2_h3', 'h2_h3_h4');
  ALTER TABLE "blogs" ADD COLUMN "toc_depth" "enum_blogs_toc_depth" DEFAULT 'h2';
  ALTER TABLE "_blogs_v" ADD COLUMN "version_toc_depth" "enum__blogs_v_version_toc_depth" DEFAULT 'h2';`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "blogs" DROP COLUMN "toc_depth";
  ALTER TABLE "_blogs_v" DROP COLUMN "version_toc_depth";
  DROP TYPE "public"."enum_blogs_toc_depth";
  DROP TYPE "public"."enum__blogs_v_version_toc_depth";`)
}
