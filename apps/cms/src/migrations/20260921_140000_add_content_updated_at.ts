import { type MigrateDownArgs, type MigrateUpArgs, sql } from '@payloadcms/db-postgres'

/**
 * `contentUpdatedAt` on the six article collections: the date the site may
 * publish as sitemap `lastmod`, JSON-LD `dateModified` and the "Updated" byline.
 *
 * Payload's `updatedAt` cannot serve that purpose because every write moves it.
 * Two scripted passes (2026-06-09 04:06 to 04:09 UTC and 2026-08-12 12:04 to
 * 12:07 UTC) re-dated 368 published documents, and the site reported all of
 * them as freshly modified (technical SEO audit 2026-09-21, F-06).
 *
 * Backfill rule: copy `updated_at` only where it is plausibly an editorial
 * save, meaning fewer than three rows of the same table were written within
 * five minutes of it. Anything inside a burst stays NULL, and the site then
 * falls back to the publish date. Unknown is reported as unknown, not guessed.
 *
 * The latest version row mirrors its parent. The admin edits from the latest
 * version, and `contentUpdatedAtHook` writes the stored value back on an
 * unchanged save, so a NULL there would erase the parent's value on the next
 * publish.
 *
 * Nullable, no default, no index: additive and safe on a populated table.
 * Guarded with IF NOT EXISTS because local databases run in push mode and may
 * already have the columns.
 */

const TABLES = [
  'blogs',
  'guides',
  'news',
  'knowledge_base',
  'resources',
  'legal_documents',
] as const

const BURST_WINDOW_SECONDS = 300
const BURST_MIN_ROWS = 3

export async function up({ db }: MigrateUpArgs): Promise<void> {
  for (const table of TABLES) {
    await db.execute(
      sql.raw(
        `ALTER TABLE "${table}" ADD COLUMN IF NOT EXISTS "content_updated_at" timestamp(3) with time zone;`,
      ),
    )
    await db.execute(
      sql.raw(
        `ALTER TABLE "_${table}_v" ADD COLUMN IF NOT EXISTS "version_content_updated_at" timestamp(3) with time zone;`,
      ),
    )

    await db.execute(
      sql.raw(`UPDATE "${table}" AS t
        SET "content_updated_at" = t."updated_at"
        WHERE t."content_updated_at" IS NULL
          AND (
            SELECT count(*) FROM "${table}" AS o
            WHERE abs(extract(epoch FROM (o."updated_at" - t."updated_at"))) <= ${BURST_WINDOW_SECONDS}
          ) < ${BURST_MIN_ROWS};`),
    )

    await db.execute(
      sql.raw(`UPDATE "_${table}_v" AS v
        SET "version_content_updated_at" = t."content_updated_at"
        FROM "${table}" AS t
        WHERE v."parent_id" = t."id"
          AND v."latest" = true
          AND v."version_content_updated_at" IS NULL
          AND t."content_updated_at" IS NOT NULL;`),
    )
  }
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  for (const table of TABLES) {
    await db.execute(sql.raw(`ALTER TABLE "${table}" DROP COLUMN IF EXISTS "content_updated_at";`))
    await db.execute(
      sql.raw(`ALTER TABLE "_${table}_v" DROP COLUMN IF EXISTS "version_content_updated_at";`),
    )
  }
}
