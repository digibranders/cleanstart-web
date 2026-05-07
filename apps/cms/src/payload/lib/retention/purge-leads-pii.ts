/**
 * Leads PII redaction — per arch doc §retention and §privacy-gdpr.
 *
 * GDPR data-minimisation: ip + userAgent are kept for 365 days
 * (the abuse / anti-spam window) then nullified. The lead record
 * itself stays — formId, anonymised answers, consent metadata are
 * still useful for audit and CRM sync. We never delete the row.
 *
 * The job is idempotent: rows that already have null ip + null
 * userAgent are skipped. Runs daily.
 */

const RETENTION_DAYS_DEFAULT = 365;
const PAGE_SIZE = 200;
const MAX_PAGES = 500; // hard cap: 100k rows per run

export interface PurgePayload {
  logger?: { info?: (meta: Record<string, unknown>, msg: string) => void };
  find: (args: {
    collection: 'leads';
    where?: unknown;
    limit?: number;
    page?: number;
    depth?: number;
    overrideAccess?: boolean;
  }) => Promise<{ docs: { id: number | string }[]; hasNextPage?: boolean }>;
  update: (args: {
    collection: 'leads';
    id: number | string;
    data: Record<string, unknown>;
    overrideAccess?: boolean;
  }) => Promise<unknown>;
}

export interface PurgeOptions {
  retentionDays?: number;
  now?: Date;
}

export interface PurgeResult {
  scanned: number;
  redacted: number;
  errors: number;
}

/**
 * Find leads older than the cutoff that still carry ip OR
 * userAgent, then null them out. Skips leads that have already
 * been redacted.
 */
export const purgeLeadsPii = async (
  payload: PurgePayload,
  options: PurgeOptions = {},
): Promise<PurgeResult> => {
  const retentionDays = options.retentionDays ?? RETENTION_DAYS_DEFAULT;
  const now = options.now ?? new Date();
  const cutoff = new Date(now.getTime() - retentionDays * 24 * 60 * 60 * 1000).toISOString();

  let scanned = 0;
  let redacted = 0;
  let errors = 0;
  // Same not-advancing-page rationale as purgeSearchLog: each
  // iteration's update narrows the next where-clause match.
  const page = 1;

  for (let iteration = 0; iteration < MAX_PAGES; iteration += 1) {
    const result = await payload.find({
      collection: 'leads',
      where: {
        and: [
          { createdAt: { less_than: cutoff } },
          {
            or: [
              { ip: { not_equals: null } },
              { userAgent: { not_equals: null } },
            ],
          },
        ],
      },
      limit: PAGE_SIZE,
      page,
      depth: 0,
      overrideAccess: true,
    });
    if (result.docs.length === 0) break;
    scanned += result.docs.length;
    for (const row of result.docs) {
      try {
        await payload.update({
          collection: 'leads',
          id: row.id,
          data: { ip: null, userAgent: null },
          overrideAccess: true,
        });
        redacted += 1;
      } catch {
        errors += 1;
      }
    }
    if (!result.hasNextPage) break;
    // We don't advance pages — the next iteration's where-clause
    // skips the rows we just redacted (their ip + userAgent are
    // now null), so page=1 surfaces the next slice cleanly.
  }

  payload.logger?.info?.(
    { scanned, redacted, errors, retentionDays, cutoff },
    'leads PII redaction complete',
  );
  return { scanned, redacted, errors };
};
