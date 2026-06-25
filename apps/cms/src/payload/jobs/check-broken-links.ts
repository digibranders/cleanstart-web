import type { TaskConfig } from 'payload';

import { type ScannerPayload, scanForBrokenLinks } from '../lib/broken-links/scan';

interface ExistingRow {
  id: string | number;
  url: string;
  sourceDocId: string;
  firstSeenAt?: string | null;
}

/**
 * Nightly broken-link scan. Walks every published doc across the
 * routable collections, HEAD-checks each external URL, and upserts
 * results into the `brokenLinks` collection.
 *
 * Idempotent — re-runs collapse onto the same rows. Rows for URLs
 * that no longer appear in any doc body are deleted (the editor
 * fixed the link or removed it).
 *
 * Storage: only `broken` / `network` / `redirect` rows persist. `ok`
 * results don't write — keeps the table small + means the list view
 * is the actionable subset by definition.
 */
export const checkBrokenLinksTask: TaskConfig<'checkBrokenLinks'> = {
  slug: 'checkBrokenLinks',
  retries: 0,
  schedule: [{ cron: '30 4 * * *', queue: 'brokenLinksScan' }],
  handler: async ({ req }) => {
    const records = await scanForBrokenLinks({
      payload: req.payload as unknown as ScannerPayload,
    });

    // Snapshot existing rows so we can detect which to delete. We
    // paginate because hard-capping at 5000 means anything past page 1
    // would never be revisited — once the table grows past that it
    // would stop self-cleaning and editors see "broken" badges for
    // links that have been fixed.
    const SNAPSHOT_PAGE_SIZE = 1000;
    const existingByKey = new Map<string, ExistingRow>();
    let snapshotPage = 1;
    while (true) {
      const result = (await req.payload.find({
        collection: 'brokenLinks',
        limit: SNAPSHOT_PAGE_SIZE,
        page: snapshotPage,
        depth: 0,
        overrideAccess: true,
      })) as { docs: ExistingRow[]; hasNextPage?: boolean };
      for (const row of result.docs) {
        existingByKey.set(`${row.url}|${row.sourceDocId}`, row);
      }
      if (!result.hasNextPage) break;
      snapshotPage += 1;
    }

    const seen = new Set<string>();
    let upserts = 0;

    const now = new Date().toISOString();

    for (const record of records) {
      // We persist only actionable rows.
      if (record.status === 'ok') continue;
      const key = `${record.url}|${record.sourceDocId}`;
      seen.add(key);
      const match = existingByKey.get(key);
      if (match) {
        await req.payload.update({
          collection: 'brokenLinks',
          id: match.id,
          data: {
            status: record.status,
            httpStatus: record.httpStatus,
            sourceDocSlug: record.sourceDocSlug,
            sourceDocTitle: record.sourceDocTitle,
            anchorText: record.anchorText,
            location: record.location,
            finalUrl: record.finalUrl,
            lastChecked: now,
          },
          overrideAccess: true,
        });
      } else {
        await req.payload.create({
          collection: 'brokenLinks',
          data: {
            url: record.url,
            status: record.status,
            httpStatus: record.httpStatus,
            finalUrl: record.finalUrl,
            sourceCollection: record.sourceCollection,
            sourceDocId: record.sourceDocId,
            sourceDocSlug: record.sourceDocSlug,
            sourceDocTitle: record.sourceDocTitle,
            anchorText: record.anchorText,
            location: record.location,
            firstSeenAt: now,
            lastChecked: now,
          },
          overrideAccess: true,
        });
      }
      upserts += 1;
    }

    // Drop rows that no longer appear in any doc — editor fixed them.
    let removed = 0;
    for (const [key, row] of existingByKey.entries()) {
      if (!seen.has(key)) {
        await req.payload.delete({
          collection: 'brokenLinks',
          id: row.id,
          overrideAccess: true,
        });
        removed += 1;
      }
    }

    return {
      output: {
        scanned: records.length,
        actionableRows: upserts,
        cleared: removed,
      },
    };
  },
};
