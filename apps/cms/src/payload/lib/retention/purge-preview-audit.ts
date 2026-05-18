/**
 * PreviewAudit retention — deletes rows whose `expiresAt` is older
 * than 90 days. Active and recently-expired rows are kept so the
 * admin "Active preview links" view can still show recently-
 * revoked links for context.
 *
 * Idempotent; safe to run on any cadence.
 */

const RETENTION_DAYS_DEFAULT = 90;
const PAGE_SIZE = 200;
const MAX_PAGES = 250;

export interface PurgePreviewAuditPayload {
  logger?: { info?: (meta: Record<string, unknown>, msg: string) => void };
  find: (args: {
    collection: 'previewAudit';
    where?: unknown;
    limit?: number;
    page?: number;
    depth?: number;
    overrideAccess?: boolean;
  }) => Promise<{ docs: { id: number | string }[]; hasNextPage?: boolean }>;
  delete: (args: {
    collection: 'previewAudit';
    id: number | string;
    overrideAccess?: boolean;
  }) => Promise<unknown>;
}

export interface PurgePreviewAuditOptions {
  retentionDays?: number;
  now?: Date;
}

export interface PurgePreviewAuditResult {
  scanned: number;
  deleted: number;
  errors: number;
}

export const purgePreviewAudit = async (
  payload: PurgePreviewAuditPayload,
  options: PurgePreviewAuditOptions = {},
): Promise<PurgePreviewAuditResult> => {
  const retentionDays = options.retentionDays ?? RETENTION_DAYS_DEFAULT;
  const now = options.now ?? new Date();
  const cutoff = new Date(now.getTime() - retentionDays * 24 * 60 * 60 * 1000).toISOString();

  let scanned = 0;
  let deleted = 0;
  let errors = 0;
  const page = 1;

  for (let iteration = 0; iteration < MAX_PAGES; iteration += 1) {
    const result = await payload.find({
      collection: 'previewAudit',
      where: { expiresAt: { less_than: cutoff } },
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
          collection: 'previewAudit',
          id: row.id,
          overrideAccess: true,
        });
        deleted += 1;
      } catch {
        errors += 1;
      }
    }
    if (!result.hasNextPage) break;
  }

  payload.logger?.info?.(
    { scanned, deleted, errors, retentionDays, cutoff },
    'previewAudit retention purge complete',
  );
  return { scanned, deleted, errors };
};
