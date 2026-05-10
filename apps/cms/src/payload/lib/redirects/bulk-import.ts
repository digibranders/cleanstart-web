import { isValidExternalLink } from '../url-shape';

/** Statuses accepted for bulk import. Matches the Redirects collection enum. */
const VALID_STATUSES = new Set(['301', '302', '307', '308', '410']);

const SYSTEM_MANAGED_SOURCE = 'slug-change';
/** Provenance label for every row created by a bulk import. */
const IMPORT_SOURCE = 'migration-seed';

export interface BulkRedirectInputRow {
  readonly from: unknown;
  readonly to?: unknown;
  readonly status?: unknown;
  readonly notes?: unknown;
}

export interface BulkRedirectRow {
  readonly from: string;
  readonly to: string;
  readonly status: string;
  readonly notes?: string;
  /** Position in the original input array. Surfaced on runtime errors. */
  readonly sourceIndex: number;
}

export interface BulkRedirectError {
  readonly index: number;
  readonly message: string;
}

export interface BulkRedirectPlan {
  readonly create: readonly BulkRedirectRow[];
  readonly update: readonly { id: string | number; row: BulkRedirectRow }[];
  readonly skipped: readonly { index: number; reason: string }[];
  readonly errors: readonly BulkRedirectError[];
}

/** Loose Payload subset used by the planner. Mocked in tests. */
export interface RedirectsPayload {
  find: (args: {
    collection: 'redirects';
    where: { from: { equals: string } };
    limit: number;
    depth: 0;
    overrideAccess?: boolean;
  }) => Promise<{
    docs: { id: string | number; from?: string; source?: string }[];
  }>;
}

const validateRow = (
  raw: BulkRedirectInputRow,
  index: number,
): { ok: true; row: BulkRedirectRow } | { ok: false; error: BulkRedirectError } => {
  if (typeof raw.from !== 'string' || raw.from.trim().length === 0) {
    return { ok: false, error: { index, message: '`from` is required.' } };
  }
  if (!isValidExternalLink(raw.from)) {
    return {
      ok: false,
      error: { index, message: '`from` must be a path or URL.' },
    };
  }

  const status =
    typeof raw.status === 'string' && raw.status.length > 0 ? raw.status : '301';
  if (!VALID_STATUSES.has(status)) {
    return {
      ok: false,
      error: {
        index,
        message: `\`status\` must be one of ${[...VALID_STATUSES].join(', ')}.`,
      },
    };
  }

  // 410 rows have no destination by definition.
  if (status === '410') {
    return {
      ok: true,
      row: {
        from: raw.from,
        to: '',
        status,
        sourceIndex: index,
        ...(typeof raw.notes === 'string' && raw.notes.length > 0
          ? { notes: raw.notes }
          : {}),
      },
    };
  }

  if (typeof raw.to !== 'string' || raw.to.trim().length === 0) {
    return {
      ok: false,
      error: { index, message: '`to` is required for non-410 rows.' },
    };
  }
  if (!isValidExternalLink(raw.to)) {
    return {
      ok: false,
      error: { index, message: '`to` must be a path or URL.' },
    };
  }
  if (raw.from === raw.to) {
    return {
      ok: false,
      error: { index, message: '`to` cannot equal `from`.' },
    };
  }

  return {
    ok: true,
    row: {
      from: raw.from,
      to: raw.to,
      status,
      sourceIndex: index,
      ...(typeof raw.notes === 'string' && raw.notes.length > 0
        ? { notes: raw.notes }
        : {}),
    },
  };
};

/**
 * Pure planner. Takes the raw input rows, validates each one, and
 * looks up existing redirects so the caller can decide whether to
 * create / update / skip. System-managed rules (source=slug-change)
 * are never overwritten — they're skipped with a reason.
 *
 * Pre-pass: when the same `from` value appears more than once in the
 * input, only the LAST occurrence is acted on. The earlier duplicates
 * are reported as skipped so the importing editor can see the
 * collision in the response. Otherwise the loop would fire the same
 * upsert N times, with the last-write-wins outcome already, but the
 * response would lie ("created 1, updated 1" instead of "deduplicated
 * 1, created 1").
 */
export const planBulkRedirectImport = async (args: {
  rows: readonly BulkRedirectInputRow[];
  payload: RedirectsPayload;
}): Promise<BulkRedirectPlan> => {
  const create: BulkRedirectRow[] = [];
  const update: { id: string | number; row: BulkRedirectRow }[] = [];
  const skipped: { index: number; reason: string }[] = [];
  const errors: BulkRedirectError[] = [];

  // Build a map of `from` → last index. Anything that lost the race is
  // reported as a duplicate skip up-front.
  const lastIndexByFrom = new Map<string, number>();
  for (let index = 0; index < args.rows.length; index += 1) {
    const raw = args.rows[index];
    if (raw && typeof raw.from === 'string') {
      const existingIndex = lastIndexByFrom.get(raw.from);
      if (existingIndex != null) {
        skipped.push({
          index: existingIndex,
          reason: `Duplicate \`from\` "${raw.from}" — superseded by row ${index + 1}.`,
        });
      }
      lastIndexByFrom.set(raw.from, index);
    }
  }

  for (let index = 0; index < args.rows.length; index += 1) {
    const raw = args.rows[index];
    if (!raw) continue;
    if (typeof raw.from === 'string' && lastIndexByFrom.get(raw.from) !== index) {
      // Earlier duplicate already reported via skipped[]; the last
      // occurrence is the only one we act on.
      continue;
    }
    const validation = validateRow(raw, index);
    if (!validation.ok) {
      errors.push(validation.error);
      continue;
    }
    const row = validation.row;

    const existing = await args.payload.find({
      collection: 'redirects',
      where: { from: { equals: row.from } },
      limit: 1,
      depth: 0,
      overrideAccess: true,
    });
    const match = existing.docs[0];
    if (!match) {
      create.push(row);
      continue;
    }
    if (match.source === SYSTEM_MANAGED_SOURCE) {
      skipped.push({
        index,
        reason: 'Existing row is system-managed (slug-change); not overwritten.',
      });
      continue;
    }
    update.push({ id: match.id, row });
  }

  return { create, update, skipped, errors };
};

export const IMPORT_SOURCE_LABEL = IMPORT_SOURCE;
