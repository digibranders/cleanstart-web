/**
 * ConsentLog retention — GDPR Art. 5(1)(e) storage limitation.
 *
 * Cookie-consent proof-of-consent records are kept for 24 months
 * (the 12-month consent cookie lifetime plus a re-consent cycle and
 * an evidentiary buffer), then purged. After this window the cookie
 * itself has long expired and the visitor has been re-prompted, so
 * the old record no longer evidences a live consent.
 *
 * The job is idempotent — running it twice in a row is a no-op on the
 * second run.
 */

const RETENTION_DAYS_DEFAULT = 730; // 24 months
const PAGE_SIZE = 200;
const MAX_PAGES = 250; // hard cap: 50k rows per run

export interface PurgePayload {
  logger?: { info?: (meta: Record<string, unknown>, msg: string) => void };
  find: (args: {
    collection: 'consentLog';
    where?: unknown;
    limit?: number;
    page?: number;
    depth?: number;
    overrideAccess?: boolean;
  }) => Promise<{ docs: { id: number | string }[]; hasNextPage?: boolean }>;
  delete: (args: {
    collection: 'consentLog';
    id: number | string;
    overrideAccess?: boolean;
  }) => Promise<unknown>;
}

export interface PurgeOptions {
  /** Override the 730-day (24-month) default (used in tests). */
  retentionDays?: number;
  /** Override `Date.now()` (used in tests). */
  now?: Date;
}

export interface PurgeResult {
  scanned: number;
  deleted: number;
  errors: number;
}

/**
 * Delete every consentLog row whose `createdAt` is older than the
 * cutoff. Returns counts so the surrounding job can log them.
 */
export const purgeConsentLog = async (
  payload: PurgePayload,
  options: PurgeOptions = {},
): Promise<PurgeResult> => {
  const retentionDays = options.retentionDays ?? RETENTION_DAYS_DEFAULT;
  const now = options.now ?? new Date();
  const cutoff = new Date(now.getTime() - retentionDays * 24 * 60 * 60 * 1000).toISOString();

  let scanned = 0;
  let deleted = 0;
  let errors = 0;
  // We intentionally don't advance `page` between iterations: each
  // iteration deletes the rows it found, so re-querying at page=1
  // surfaces the next slice. The MAX_PAGES guard is a hard cap on
  // total iterations (not page index).
  const page = 1;

  for (let iteration = 0; iteration < MAX_PAGES; iteration += 1) {
    const result = await payload.find({
      collection: 'consentLog',
      where: { createdAt: { less_than: cutoff } },
      limit: PAGE_SIZE,
      page,
      depth: 0,
      overrideAccess: true,
    });
    if (result.docs.length === 0) break;
    scanned += result.docs.length;
    for (const row of result.docs) {
      try {
        await payload.delete({
          collection: 'consentLog',
          id: row.id,
          overrideAccess: true,
        });
        deleted += 1;
      } catch {
        errors += 1;
      }
    }
    if (!result.hasNextPage) break;
    // Don't advance the page — re-querying at page 1 picks up the
    // remaining old rows (the ones we just deleted are gone).
  }

  payload.logger?.info?.(
    { scanned, deleted, errors, retentionDays, cutoff },
    'consentLog retention purge complete',
  );
  return { scanned, deleted, errors };
};
