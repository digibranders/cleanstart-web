import type { MigrateUpArgs, MigrateDownArgs } from '@payloadcms/db-postgres';
import { sql } from '@payloadcms/db-postgres';

/**
 * Realign legacy `redirects.from` / `redirects.to` values to the actual
 * `apps/web` route prefixes.
 *
 * Background: the CMS `ROUTE_PREFIX` map was originally seeded against the
 * legacy Webflow URLs (`/blogs`, `/event`, `/resources`). The new
 * `apps/web` was built with redesigned routes (`/blog/[slug]`,
 * `/events/[slug]`, `/resource/[slug]`). The slug-change hook reads
 * `ROUTE_PREFIX` and wrote redirect rows under the legacy shape until the
 * map was corrected — so any existing rows point at URLs nobody requests.
 *
 * This migration rewrites both endpoints for the three mismatched
 * collections. It is idempotent — running it twice updates 0 rows on the
 * second pass because the legacy prefix no longer appears as a row
 * boundary.
 *
 * `news`, `webinars`, and everything else either already match or have
 * no public detail route yet — no rewrite needed.
 */

const UP_RENAMES = [
  { old: '/blogs/', new: '/blog/' },
  { old: '/event/', new: '/events/' },
  { old: '/resources/', new: '/resource/' },
] as const;

const DOWN_RENAMES = UP_RENAMES.map((r) => ({ old: r.new, new: r.old }));

const rewrite = async (
  db: MigrateUpArgs['db'],
  payload: MigrateUpArgs['payload'] | undefined,
  rename: { old: string; new: string },
): Promise<void> => {
  const likePattern = `${rename.old}%`;
  const fromRes = await db.execute(sql`
    UPDATE "redirects"
    SET "from" = ${rename.new} || substring("from" from ${rename.old.length + 1})
    WHERE "from" LIKE ${likePattern}
  `);
  const toRes = await db.execute(sql`
    UPDATE "redirects"
    SET "to" = ${rename.new} || substring("to" from ${rename.old.length + 1})
    WHERE "to" LIKE ${likePattern}
  `);

  payload?.logger?.info?.(
    {
      from: rename.old,
      to: rename.new,
      fromUpdated: (fromRes as { rowCount?: number } | undefined)?.rowCount ?? 0,
      toUpdated: (toRes as { rowCount?: number } | undefined)?.rowCount ?? 0,
    },
    'redirect-prefix-realignment',
  );
};

export async function up({ db, payload }: MigrateUpArgs): Promise<void> {
  for (const rename of UP_RENAMES) await rewrite(db, payload, rename);
}

export async function down({ db, payload }: MigrateDownArgs): Promise<void> {
  for (const rename of DOWN_RENAMES) await rewrite(db, payload, rename);
}
