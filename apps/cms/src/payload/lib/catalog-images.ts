const IMAGE_PAGE = /\/images\/([a-z0-9][a-z0-9.-]*)\/details</g;

/**
 * Image names in the public catalog, read from its sitemap. A `-fips` variant
 * is folded into its base image, which is the name an editor picks and the web
 * app matches on. Sorted, without repeats.
 */
export const parseCatalogNames = (sitemapXml: string): string[] =>
  [
    ...new Set(
      [...sitemapXml.matchAll(IMAGE_PAGE)].map((match) => (match[1] as string).replace(/-fips$/, '')),
    ),
  ].sort();

/** Names that start with the query first, then those that merely contain it. */
export const filterCatalogNames = (names: readonly string[], query: string): string[] => {
  const q = query.trim().toLowerCase();
  if (!q) return [...names];
  const starts = names.filter((n) => n.startsWith(q));
  const contains = names.filter((n) => !n.startsWith(q) && n.includes(q));
  return [...starts, ...contains];
};
