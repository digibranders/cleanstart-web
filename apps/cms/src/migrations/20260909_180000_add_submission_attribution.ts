import { type MigrateDownArgs, type MigrateUpArgs, sql } from '@payloadcms/db-postgres'

/**
 * Marketing attribution on the three submission collections that were missing
 * it: partner applications, deal registrations and career applications.
 *
 * `leads` has carried these columns since 20260715_120000; the field group is
 * now shared (payload/fields/attribution.ts) so all four collections describe
 * the same shape. Leads itself is untouched here: that refactor produced an
 * identical schema, verified by regenerating types and getting an empty diff.
 *
 * Every column is nullable with no default, so this is additive and safe on a
 * populated table. Existing rows simply have no attribution, which is accurate:
 * it was never captured for them.
 *
 * `attribution_channel` is derived server-side rather than accepted from the
 * client, so a submitter cannot label their own traffic as paid search.
 */

const TABLES = ['partner_applications', 'deal_registrations', 'career_applications'] as const

const CHANNEL_VALUES = `'paid_search', 'paid_social', 'organic_search', 'social', 'email', 'referral', 'direct', 'other'`
const DEVICE_VALUES = `'desktop', 'mobile', 'tablet'`

const TEXT_COLUMNS = [
  'utm_campaign',
  'utm_source',
  'utm_medium',
  'utm_term',
  'utm_content',
  'attribution_gclid',
  'attribution_fbclid',
  'attribution_li_fat_id',
  'attribution_first_touch_source',
  'attribution_first_touch_medium',
  'attribution_first_touch_campaign',
  'attribution_first_touch_term',
  'attribution_first_touch_content',
  'attribution_first_touch_landing_page',
  'attribution_first_touch_referrer',
] as const

export async function up({ db }: MigrateUpArgs): Promise<void> {
  for (const table of TABLES) {
    await db.execute(
      sql.raw(`DO $$ BEGIN
        CREATE TYPE "public"."enum_${table}_attribution_channel" AS ENUM(${CHANNEL_VALUES});
      EXCEPTION WHEN duplicate_object THEN null; END $$;`),
    )
    await db.execute(
      sql.raw(`DO $$ BEGIN
        CREATE TYPE "public"."enum_${table}_attribution_device" AS ENUM(${DEVICE_VALUES});
      EXCEPTION WHEN duplicate_object THEN null; END $$;`),
    )

    for (const column of TEXT_COLUMNS) {
      await db.execute(
        sql.raw(`ALTER TABLE "${table}" ADD COLUMN IF NOT EXISTS "${column}" varchar;`),
      )
    }
    await db.execute(
      sql.raw(
        `ALTER TABLE "${table}" ADD COLUMN IF NOT EXISTS "attribution_channel" "public"."enum_${table}_attribution_channel";`,
      ),
    )
    await db.execute(
      sql.raw(
        `ALTER TABLE "${table}" ADD COLUMN IF NOT EXISTS "attribution_device" "public"."enum_${table}_attribution_device";`,
      ),
    )
    await db.execute(
      sql.raw(
        `ALTER TABLE "${table}" ADD COLUMN IF NOT EXISTS "attribution_first_touch_at" timestamp(3) with time zone;`,
      ),
    )
  }
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  for (const table of TABLES) {
    for (const column of [
      ...TEXT_COLUMNS,
      'attribution_channel',
      'attribution_device',
      'attribution_first_touch_at',
    ]) {
      await db.execute(sql.raw(`ALTER TABLE "${table}" DROP COLUMN IF EXISTS "${column}";`))
    }
    await db.execute(sql.raw(`DROP TYPE IF EXISTS "public"."enum_${table}_attribution_channel";`))
    await db.execute(sql.raw(`DROP TYPE IF EXISTS "public"."enum_${table}_attribution_device";`))
  }
}
