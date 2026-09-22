import { type MigrateDownArgs, type MigrateUpArgs, sql } from '@payloadcms/db-postgres'

/**
 * `sendDownloadEmail` on `forms`: whether the CMS emails the signed download
 * link after a gated submission.
 *
 * A gated asset can now carry its own HubSpot form so its leads land on their
 * own form and campaign, and that HubSpot form may send its own follow-up
 * email. Without a switch the visitor receives two thank-yous, one from Brevo
 * and one from HubSpot.
 *
 * Defaults to true so every existing gate keeps emailing, and the endpoint
 * reads a missing value as true for the same reason.
 *
 * Nullable with a default, no index: additive and safe on a populated table.
 * Guarded with IF NOT EXISTS because local databases run in push mode and may
 * already have the column.
 */

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(
    sql.raw(
      `ALTER TABLE "forms" ADD COLUMN IF NOT EXISTS "send_download_email" boolean DEFAULT true;`,
    ),
  )
  await db.execute(
    sql.raw(
      `ALTER TABLE "_forms_v" ADD COLUMN IF NOT EXISTS "version_send_download_email" boolean DEFAULT true;`,
    ),
  )
  await db.execute(
    sql.raw(`UPDATE "forms" SET "send_download_email" = true WHERE "send_download_email" IS NULL;`),
  )
  await db.execute(
    sql.raw(
      `UPDATE "_forms_v" SET "version_send_download_email" = true WHERE "version_send_download_email" IS NULL;`,
    ),
  )
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql.raw(`ALTER TABLE "forms" DROP COLUMN IF EXISTS "send_download_email";`))
  await db.execute(
    sql.raw(`ALTER TABLE "_forms_v" DROP COLUMN IF EXISTS "version_send_download_email";`),
  )
}
