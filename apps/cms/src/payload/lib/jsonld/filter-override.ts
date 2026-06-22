import { buildIngestPlan } from './override-validator';

/**
 * Per-block override handling for the pageRegistry (keep-valid / drop-invalid).
 *
 * `buildIngestPlan` classifies each pasted blob as merge (will apply) or skip
 * (off-allowlist, conflicts with the site-wide schema, off-domain @id, nested
 * @id, oversize, malformed). On save we keep only the merge-able blobs and drop
 * the rest, so a paste mixing a valid Article with a conflicting WebSite stores
 * just the Article. The editor's Validate report shows what would be dropped +
 * how to fix it before saving.
 *
 * Scoped to pageRegistry — content-doc overrides keep their strict all-or-
 * nothing validator.
 */

const SITE_ORIGIN = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.cleanstart.com';

export interface FilterResult {
  /** The blobs that will apply: null, a single blob, or an array. */
  kept: unknown;
  /** Dropped blobs with the reason (for logging / messaging). */
  dropped: { type: string; reason: string }[];
}

const toBlobs = (override: unknown): unknown[] =>
  Array.isArray(override) ? override : override != null ? [override] : [];

/** Keep only the merge-able blobs from an override value. */
export const filterToMergeable = (override: unknown): FilterResult => {
  const blobs = toBlobs(override);
  if (blobs.length === 0) return { kept: null, dropped: [] };
  const plan = buildIngestPlan(blobs, { collectionSlug: 'pageRegistry', siteOrigin: SITE_ORIGIN });
  const kept = plan.items.filter((i) => i.action === 'merge').map((i) => i.blob);
  const dropped = plan.items
    .filter((i) => i.action === 'skip')
    .map((i) => ({ type: i.blobType, reason: i.message }));
  const value = kept.length === 0 ? null : kept.length === 1 ? kept[0] : kept;
  return { kept: value, dropped };
};

/**
 * Field-level validate for pageRegistry.additionalSchema. Allows a partially
 * valid paste (the beforeChange hook drops the invalid blocks), and rejects
 * only when NOTHING would apply — listing why so the editor can fix it.
 */
export const validatePartialOverride = (value: unknown): true | string => {
  if (value == null) return true;
  const blobs = toBlobs(value);
  if (blobs.length === 0) return true;
  const plan = buildIngestPlan(blobs, { collectionSlug: 'pageRegistry', siteOrigin: SITE_ORIGIN });
  if (plan.items.some((i) => i.action === 'merge')) return true;
  const reasons = plan.items.map((i) => `${i.blobType}: ${i.message}`).join(' · ');
  return `No block would apply. ${reasons}`;
};
