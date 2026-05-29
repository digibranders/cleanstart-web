import crypto from 'node:crypto';

import { slugify } from './slugify';

const DEFAULT_MAX_SLUG_LEN = 64;
const FALLBACK_SLUG = 'asset';
const SHORT_HASH_LEN = 8;

/**
 * Patterns that signal a slug source carries no meaningful semantics —
 * Word's clipboard sends `image001.png` / `clip_image002.png`, the
 * ingest endpoint falls back to `ingested-{Date.now()}`, the paste
 * helper renames empty `image.png` to `pasted-{Date.now()}`, etc.
 * When the primary source matches one of these, the caller's context
 * hint (host doc slug) is preferred so the R2 key actually carries
 * page provenance instead of `image001-a1b2c3d4.webp` × N.
 */
const JUNK_SLUG_PATTERNS: readonly RegExp[] = [
  /^image[-_]?\d+$/i,
  /^img[-_]?\d+$/i,
  /^clip[-_]?image\d+$/i,
  /^picture\s*\d*$/i,
  /^pasted[-_]\d+$/i,
  /^ingested[-_]\d+$/i,
  /^untitled[-_]?\d*$/i,
  /^screenshot[-_]?.*$/i,
  /^[a-f0-9]{6,}$/i, // bare hex (Webflow CDN basenames)
  /^\d+$/, // pure numeric
];

/**
 * True when the candidate slug source is one of the well-known
 * useless names that the clipboard / paste / ingest pipelines emit.
 * Editors never typed these — they're machine-generated noise.
 */
export const looksLikeJunkSlug = (raw: string | null | undefined): boolean => {
  if (!raw) return true;
  const trimmed = raw.trim();
  if (trimmed.length === 0) return true;
  if (trimmed.length < 3) return true;
  return JUNK_SLUG_PATTERNS.some((re) => re.test(trimmed));
};

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
  'video/mp4': 'mp4',
  'application/zip': 'zip',
  'application/x-zip-compressed': 'zip',
};

/**
 * The Media collection converts every raster image to WebP via Payload's
 * `formatOptions`. The on-disk extension after conversion is `.webp`
 * regardless of the source MIME, so the canonical filename written to
 * R2 must use `.webp` too. SVG, PDF, MP4, and ZIP are passed through
 * unchanged — every non-image entry in `ALLOWED_MIME_TYPES` must have an
 * explicit mapping here so the filename keeps a servable extension.
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

export interface SlugSourceInputs {
  /** Alt text supplied with the upload, if any. Editor's words win. */
  alt?: string | null | undefined;
  /** Humanised original filename (after `humaniseFilename`). */
  filename?: string | null | undefined;
  /** Host-document context (e.g. `blog-getting-started-with-sbom-inline`). */
  contextHint?: string | null | undefined;
}

/**
 * Choose the strongest meaningful slug source. Priority:
 *   1. Alt text — if not junk.
 *   2. Humanised filename — if not junk.
 *   3. Context hint (host doc) — always wins over junk.
 *   4. Alt or filename even if junky — last-ditch.
 *   5. Empty string — caller falls back to `'asset'`.
 *
 * The function only RANKS sources; `buildMediaFilename` does the
 * slugify + hash + truncate.
 */
export const pickSlugSource = (inputs: SlugSourceInputs): string => {
  const alt = inputs.alt?.trim() ?? '';
  const filename = inputs.filename?.trim() ?? '';
  const hint = inputs.contextHint?.trim() ?? '';

  if (alt.length > 0 && !looksLikeJunkSlug(alt)) return alt;
  if (filename.length > 0 && !looksLikeJunkSlug(filename)) return filename;
  if (hint.length > 0) return hint;
  if (alt.length > 0) return alt;
  if (filename.length > 0) return filename;
  return '';
};

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
