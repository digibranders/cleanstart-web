import { humaniseFilename } from '../humanise-filename';

/**
 * Helpers for the Webflow media rename plan (document-derived naming).
 *
 * The Webflow import named every asset `<24-char-objectId>-<rawName>-<hash>`
 * (the id leaked into the auto-alt too, and `%20` spaces were mangled to
 * `-20`). Since content references media by id (not by URL), we rename
 * each file after the DOCUMENT it belongs to — `<doc-slug>[-<role>]-<hash>`
 * — and reset the leaked alts to the document's title. Orphaned media
 * (referenced by no document) fall back to the decoded original name
 * recovered from the Webflow source URL.
 */

/** Bare 24-char Webflow asset id at the start of the leaked alt text. */
const VENDOR_ID_ALT_PREFIX = /^[0-9a-f]{24}\b/i;
/** Leading Webflow asset id on a raw CDN basename (id then `-`/`_`). */
const VENDOR_ID_RAW_PREFIX = /^[0-9a-f]{24}[-_]/i;
/** Trailing content-hash suffix the import appends (`-<6+ hex>`). */
const CONTENT_HASH_SUFFIX = /-([0-9a-f]{6,})$/i;

/** Map an inventory image role to the suffix used in a multi-image stem. */
const ROLE_SUFFIX: Record<string, string> = {
  heroImage: 'hero',
  coverImage: 'cover',
  companyLogo: 'logo',
  asset: 'asset',
  photo: 'photo',
  icon: 'icon',
  image: 'image',
};

export const roleSuffix = (role: string): string => ROLE_SUFFIX[role] ?? 'image';

/**
 * Document-derived filename stem (pre-slugify). The role suffix is added
 * only when the document owns more than one image, so the common
 * single-image case (`<doc-slug>`) stays clean while a case study's three
 * assets stay distinct (`<doc-slug>-cover`, `-logo`, `-asset`).
 */
export const docDerivedStem = (
  docSlug: string,
  role: string,
  multiImage: boolean,
): string => {
  const base = docSlug.trim();
  return multiImage ? `${base}-${roleSuffix(role)}` : base;
};

/**
 * Human-readable alt from the document. Logos and icons get a role word
 * so the alt still reads correctly out of context; every other image
 * uses the document title verbatim (preserving its real casing).
 */
export const docDerivedAlt = (docTitle: string, role: string): string => {
  const title = docTitle.trim();
  if (role === 'companyLogo') return `${title} logo`;
  if (role === 'icon') return `${title} icon`;
  return title;
};

/** True when the alt text begins with a bare Webflow asset id (machine
 *  noise) — the only alts we overwrite; human-written alts are preserved. */
export const altLeaksVendorId = (alt: string | null | undefined): boolean =>
  typeof alt === 'string' && VENDOR_ID_ALT_PREFIX.test(alt.trim());

/** Extract the import's trailing content-hash from a filename stem. */
export const extractContentHash = (stem: string): string | null => {
  const m = CONTENT_HASH_SUFFIX.exec(stem);
  return m?.[1] ? m[1].toLowerCase() : null;
};

/**
 * Leading 24-char Webflow asset id from a filename/basename. This is the
 * stable join key between a prod media doc (re-encoded to webp with a
 * fresh hash) and the import journal / source URL — the id survives the
 * re-encode, the extension and content hash do not.
 */
export const extractLeadingVendorId = (basename: string): string | null => {
  const m = /^([0-9a-f]{24})[-_]/i.exec(basename);
  return m?.[1] ? m[1].toLowerCase() : null;
};

/**
 * Recover the human-readable name from the ORIGINAL Webflow CDN URL,
 * which still carries the real filename `%`-encoded — the source of truth
 * lost when the import slugified it (`%20` → bare `20`). Strips the
 * extension and any leading 24-char asset id(s), then `%`-decodes:
 *
 *   …/69b7d896…_WhatsApp%20Image%202026-03-16…PM.jpeg
 *   → "WhatsApp Image 2026-03-16…PM"
 *
 * Returns '' when the URL is unparseable, so the caller can fall back.
 */
export const webflowHumanName = (webflowUrl: string): string => {
  let pathname: string;
  try {
    pathname = new URL(webflowUrl).pathname;
  } catch {
    return '';
  }
  const rawBase = pathname.split('/').filter(Boolean).pop() ?? '';
  const noExt = rawBase.replace(/\.[^.]+$/, '');

  let withoutIds = noExt;
  while (VENDOR_ID_RAW_PREFIX.test(withoutIds)) {
    const next = withoutIds.replace(VENDOR_ID_RAW_PREFIX, '');
    if (next.length === 0) break;
    withoutIds = next;
  }

  try {
    return decodeURIComponent(withoutIds).trim();
  } catch {
    return withoutIds.trim();
  }
};

/** Humanise a fallback (orphan) source name into alt text. */
export const humaniseSourceName = (name: string): string => humaniseFilename(name);
