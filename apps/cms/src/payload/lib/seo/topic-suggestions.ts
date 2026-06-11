/**
 * Transform a Meilisearch facet distribution (`{ term: count }`) for the
 * `keywords` attribute into ranked autosuggest options for the SEO
 * "Keywords" card. Substring match (case-insensitive) on the typed
 * prefix; ranked by popularity (count) then alphabetically.
 */
export interface TopicSuggestion {
  readonly value: string;
  readonly count: number;
}

export const facetToSuggestions = (
  distribution: Record<string, number> | undefined,
  prefix: string,
  limit: number,
): TopicSuggestion[] => {
  if (!distribution) return [];
  const needle = prefix.trim().toLocaleLowerCase();
  return Object.entries(distribution)
    .filter(([term]) => needle.length === 0 || term.toLocaleLowerCase().includes(needle))
    .map(([value, count]) => ({ value, count }))
    .sort((a, b) => b.count - a.count || a.value.localeCompare(b.value))
    .slice(0, Math.max(0, limit));
};
