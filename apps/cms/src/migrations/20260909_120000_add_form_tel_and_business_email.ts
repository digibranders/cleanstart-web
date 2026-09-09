import { type MigrateDownArgs, type MigrateUpArgs, sql } from '@payloadcms/db-postgres'

/**
 * Schema support for the forms overhaul:
 *   - a `tel` field type, so a form can declare a phone field that the web app
 *     renders with a country-code selector and validates as E.164;
 *   - `require_business_email`, which gates an email field against consumer
 *     webmail and disposable mailboxes.
 *
 * Both the live table and the versions table are altered — `forms` is a
 * versioned collection with drafts.
 *
 * Which forms actually turn these on is content, not schema. That is applied
 * through the Payload local API by
 * `apps/cms/src/scripts/apply-form-field-changes.ts`, so the change flows
 * through the collection's hooks and bumps `schemaVersion` the same way an
 * editor's save would.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`ALTER TYPE "public"."enum_forms_fields_type" ADD VALUE IF NOT EXISTS 'tel';`)
  await db.execute(
    sql`ALTER TYPE "public"."enum__forms_v_version_fields_type" ADD VALUE IF NOT EXISTS 'tel';`,
  )
  await db.execute(
    sql`ALTER TABLE "forms_fields" ADD COLUMN IF NOT EXISTS "require_business_email" boolean DEFAULT false;`,
  )
  await db.execute(
    sql`ALTER TABLE "_forms_v_version_fields" ADD COLUMN IF NOT EXISTS "require_business_email" boolean DEFAULT false;`,
  )
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`ALTER TABLE "forms_fields" DROP COLUMN IF EXISTS "require_business_email";`)
  await db.execute(
    sql`ALTER TABLE "_forms_v_version_fields" DROP COLUMN IF EXISTS "require_business_email";`,
  )
  // Postgres cannot remove a value from an enum type. 'tel' is left in place,
  // which is harmless once no row uses it.
}
