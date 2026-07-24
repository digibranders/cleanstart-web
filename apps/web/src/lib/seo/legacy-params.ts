/**
 * Legacy Webflow collection-list pagination params (e.g. `?22c0b585_page=3`)
 * linger in Google's index from the pre-migration site — some with Google
 * overriding our clean `<link rel=canonical>` and indexing the param URL as its
 * own canonical (confirmed via GSC URL Inspection). The Next.js listings ignore
 * these params entirely — every `?<hash>_page=N` variant renders page 1 — so a
 * `308` to the clean URL is a stronger consolidation signal than the canonical
 * Google is currently disregarding.
 *
 * The `<6-10 hex>_` prefix is unique to Webflow's artifact, so a plain `?page=`,
 * or any `?utm_*` / `?q=` / OAuth-callback param, is never matched. Only the
 * offending keys are stripped; any co-occurring params survive.
 */
const LEGACY_PAGINATION_PARAM = /^[0-9a-f]{6,10}_page$/i;

/**
 * Given a request search string (with or without the leading `?`), returns the
 * cleaned search string when at least one legacy pagination param was present,
 * or `null` when there is nothing to redirect.
 *
 * The cleaned value is `""` when the legacy params were the only ones present
 * (redirect target is the bare path) — distinct from `null`, so callers must
 * branch on `!== null`, not truthiness.
 */
export function stripLegacyPaginationParams(search: string): string | null {
  if (!search || search === "?") return null;
  const params = new URLSearchParams(search);
  let stripped = false;
  // Snapshot keys before mutating — deleting during iteration is unsafe.
  for (const key of [...params.keys()]) {
    if (LEGACY_PAGINATION_PARAM.test(key)) {
      params.delete(key);
      stripped = true;
    }
  }
  if (!stripped) return null;
  const rest = params.toString();
  return rest ? `?${rest}` : "";
}
