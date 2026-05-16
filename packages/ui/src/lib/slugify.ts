// U+0300–U+036F = combining diacritical marks block. Stripping it after NFKD
// normalisation is the standard way to convert "café" → "cafe".
// biome-ignore lint/suspicious/noMisleadingCharacterClass: see comment above
const COMBINING_MARKS = /[̀-ͯ]/g;
const NON_ALNUM = /[^a-z0-9]+/g;
const COLLAPSE_DASHES = /-{2,}/g;
const TRIM_DASHES = /^-+|-+$/g;

/**
 * Slugify a human-readable name to a URL-safe path segment.
 * Lowercase, ASCII-only, hyphen-separated, no leading/trailing/duplicate hyphens.
 */
export const slugify = (input: string | null | undefined): string => {
  if (!input) return '';
  return input
    .normalize('NFKD')
    .replace(COMBINING_MARKS, '')
    .toLowerCase()
    .replace(NON_ALNUM, '-')
    .replace(COLLAPSE_DASHES, '-')
    .replace(TRIM_DASHES, '');
};
