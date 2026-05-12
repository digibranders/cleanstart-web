import type { BasePayload } from 'payload';

import { decryptJson, isEncrypted } from '../secrets';

/**
 * Shape of one row read from the `integrations` collection. All
 * J2/J3 handlers share this view — `config` is decrypted by
 * `loadConfig` below.
 */
export interface IntegrationRow {
  id: string | number;
  kind: string;
  label: string;
  enabled: boolean;
  source: 'db' | 'env' | null;
  config: unknown;
}

/**
 * Decrypt the row's `config` blob and parse it as the expected shape.
 * Returns `null` when:
 *   - `config` is missing
 *   - it's a string but not a `v1:` envelope (legacy plaintext is rejected
 *     to keep one canonical encryption path)
 *   - decryption throws (rotated PAYLOAD_SECRET, corrupted blob)
 *
 * Handlers treat `null` as "skip this row" rather than erroring — the
 * cron retries on the next tick.
 */
export const loadConfig = <T>(row: IntegrationRow): T | null => {
  if (row.config == null) return null;
  if (typeof row.config === 'string') {
    if (!isEncrypted(row.config)) return null;
    try {
      return decryptJson<T>(row.config);
    } catch {
      return null;
    }
  }
  if (typeof row.config === 'object') return row.config as T;
  return null;
};

/**
 * Common return shape for `refresh()` so the cron can tally outcomes.
 */
export interface RefreshResult {
  readonly ok: boolean;
  readonly cached: number;
  readonly error?: string;
}

export type Refresher = (payload: BasePayload, row: IntegrationRow) => Promise<RefreshResult>;

/**
 * Find all enabled DB-backed rows of a given kind. Used by every
 * analytics refresher + the HubSpot lead-handler bootstrap.
 */
export const findRowsOfKind = async (
  payload: BasePayload,
  kind: string,
): Promise<IntegrationRow[]> => {
  try {
    const result = await payload.find({
      collection: 'integrations',
      where: {
        and: [
          { enabled: { equals: true } },
          { source: { equals: 'db' } },
          { kind: { equals: kind } },
        ],
      },
      limit: 200,
      depth: 0,
      overrideAccess: true,
    });
    return (result.docs as unknown as IntegrationRow[]) ?? [];
  } catch {
    return [];
  }
};
