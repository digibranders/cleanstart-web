const SEPARATORS = /[-_]+/g;
const EXTENSION = /\.[^./]+$/;
const HASH_SUFFIX = /[-_][0-9a-f]{6,}$/i;
const WHITESPACE = /\s+/g;

/**
 * Convert a filename like `sbom-101-overview-a1b2c3d4.jpg` → `Sbom 101 overview`.
 * Strips extension + trailing hash suffix, replaces separators with spaces,
 * collapses whitespace, capitalises the first character.
 */
export const humaniseFilename = (filename: string): string => {
  const withoutExt = filename.replace(EXTENSION, '');
  const withoutHash = withoutExt.replace(HASH_SUFFIX, '');
  const spaced = withoutHash.replace(SEPARATORS, ' ').replace(WHITESPACE, ' ').trim();
  if (spaced.length === 0) return '';
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
};
