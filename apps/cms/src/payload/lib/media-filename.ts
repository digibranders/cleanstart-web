import crypto from 'node:crypto';

import { slugify } from './slugify';

const DEFAULT_MAX_SLUG_LEN = 64;
const FALLBACK_SLUG = 'asset';
const SHORT_HASH_LEN = 8;

const RASTER_MIME_TO_EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/avif': 'avif',
  'image/tiff': 'tiff',
  'image/bmp': 'bmp',
};

const PASSTHROUGH_MIME_TO_EXT: Record<string, string> = {
  'image/svg+xml': 'svg',
  'application/pdf': 'pdf',
};

/**
 * The Media collection converts every raster image to WebP via Payload's
 * `formatOptions`. The on-disk extension after conversion is `.webp`
 * regardless of the source MIME, so the canonical filename written to
 * R2 must use `.webp` too. SVG and PDF are passed through unchanged.
 */
export const canonicalExtensionForMime = (mimeType: string | undefined | null): string => {
  if (!mimeType) return 'bin';
  const lower = mimeType.toLowerCase();
  if (PASSTHROUGH_MIME_TO_EXT[lower]) return PASSTHROUGH_MIME_TO_EXT[lower];
  if (RASTER_MIME_TO_EXT[lower]) return 'webp';
  if (lower.startsWith('image/')) return 'webp';
  return 'bin';
};

const truncateSlug = (slug: string, max: number): string => {
  if (slug.length <= max) return slug;
  const cut = slug.slice(0, max);
  // Avoid leaving a dangling separator at the cut boundary.
  return cut.replace(/-+$/, '');
};

export const shortHash = (bytes: Buffer | Uint8Array): string =>
  crypto.createHash('sha256').update(bytes).digest('hex').slice(0, SHORT_HASH_LEN);

export interface BuildMediaFilenameOptions {
  /** Strongest human signal — alt, doc title, or humanised original. */
  slugSource: string;
  /** File bytes for the short-hash suffix. Provide post-conversion bytes if known. */
  bytes: Buffer | Uint8Array;
  /** Canonical extension without leading dot (e.g. `webp`, `svg`, `pdf`). */
  ext: string;
  /** Optional cap on slug length. Defaults to 64. */
  maxSlugLen?: number;
  /** Optional precomputed short hash — overrides the bytes-derived hash when set. */
  hashOverride?: string;
}

/**
 * Build the canonical Media filename: `{slug}-{shortHash}.{ext}`.
 *
 * Same bytes + same slug source → same filename, which preserves the
 * content-dedup guarantee the Webflow migration relies on. The short
 * hash suffix also makes accidental collisions effectively impossible
 * even when two different assets share a slug source.
 */
export const buildMediaFilename = ({
  slugSource,
  bytes,
  ext,
  maxSlugLen = DEFAULT_MAX_SLUG_LEN,
  hashOverride,
}: BuildMediaFilenameOptions): string => {
  const rawSlug = slugify(slugSource);
  const slug = truncateSlug(rawSlug, maxSlugLen) || FALLBACK_SLUG;
  const hash = hashOverride ?? shortHash(bytes);
  const cleanExt = ext.replace(/^\.+/, '').toLowerCase() || 'bin';
  return `${slug}-${hash}.${cleanExt}`;
};
