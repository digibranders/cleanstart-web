import { type MigrateDownArgs, type MigrateUpArgs, sql } from '@payloadcms/db-postgres'

/**
 * Departments become an editable list: the Job editor's Department field is
 * now the `department_ref_id` relationship, and `jobs.department` (the old
 * enum) is frozen as a fallback that apps/web reads only while the
 * relationship is empty.
 *
 * Data only, no schema change. Ensures a department row exists for every old
 * enum value plus IT, then fills `department_ref_id` from the enum on jobs and
 * on their version rows (the editor loads the latest version) so no live job
 * loses its department when the site starts reading the relationship.
 *
 * The columns of the removed taxonomy fields (seo, parent, icon, description,
 * `_departments_v`) are left in place on purpose: nothing reads them and a
 * DROP is not reversible.
 *
 * Hand-written, not generated, for the reason spelled out in
 * `20260921_100000_add_case_study_detail_fields.ts`. Idempotent: the INSERT is
 * guarded by slug and each UPDATE only touches rows whose relationship is
 * still null.
 */

const DEPARTMENTS: ReadonlyArray<readonly [string, string]> = [
  ['Engineering', 'engineering'],
  ['Sales', 'sales'],
  ['Marketing', 'marketing'],
  ['Customer Success', 'customer-success'],
  ['Operations', 'operations'],
  ['Finance', 'finance'],
  ['Legal', 'legal'],
  ['People', 'people'],
  ['IT', 'it'],
]

export async function up({ db }: MigrateUpArgs): Promise<void> {
  for (const [name, slug] of DEPARTMENTS) {
    await db.execute(sql`
      INSERT INTO "departments" ("name", "slug", "_status")
      SELECT ${name}, ${slug}, 'published'
      WHERE NOT EXISTS (SELECT 1 FROM "departments" WHERE "slug" = ${slug});
    `)
  }

  await db.execute(sql`
    UPDATE "jobs" j SET "department_ref_id" = d."id"
    FROM "departments" d
    WHERE j."department_ref_id" IS NULL
      AND j."department" IS NOT NULL
      AND d."slug" = j."department"::text;
  `)
  await db.execute(sql`
    UPDATE "_jobs_v" v SET "version_department_ref_id" = d."id"
    FROM "departments" d
    WHERE v."version_department_ref_id" IS NULL
      AND v."version_department" IS NOT NULL
      AND d."slug" = v."version_department"::text;
  `)
}

export async function down(_args: MigrateDownArgs): Promise<void> {
  // Data backfill only; the filled relationships are valid data either way.
}
