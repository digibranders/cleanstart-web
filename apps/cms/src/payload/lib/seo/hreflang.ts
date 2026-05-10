/**
 * Compose the final hreflang cluster a page (or sitemap entry) should
 * emit, given the editor-pasted rows.
 *
 * Rules:
 *  - Self-reference is auto-injected when missing. The page's own
 *    canonical URL must always appear in its own cluster — Google's
 *    cluster validator rejects pages that don't link to themselves.
 *  - `x-default` is auto-injected from a configured fallback (usually
 *    the EN/global variant) when missing AND `autoXDefaultFallback`
 *    is provided.
 *  - Order is preserved; injected rows are appended.
 *  - Duplicate `(hreflang, href)` pairs are collapsed.
 *
 * Pure: no env, no fetch. Used by both the `<head>` renderer (apps/web)
 * and the sitemap `<xhtml:link>` cluster builder so per-page tags and
 * sitemap stay in lock-step (the editor's pasted list is the single
 * source of truth — see plan: "Mirror per-page tags exactly").
 */

import type { HreflangRow } from './hreflang-parse';

export interface ComposeHreflangInput {
  /** Editor-pasted alternates from `seo.alternates`. */
  readonly rows: ReadonlyArray<HreflangRow> | null | undefined;
  /**
   * The page's own canonical URL (absolute https). Required for the
   * auto-self-ref behaviour. When omitted (or empty), self-ref isn't
   * injected — caller is responsible for ensuring the cluster is
   * complete.
   */
  readonly selfHref?: string | null;
  /**
   * BCP-47 code for THIS page (e.g. `en-AE`). When auto-injecting the
   * self-ref row, this is the `hreflang` we tag it with. If omitted,
   * the auto-self-ref step is skipped.
   */
  readonly selfHreflang?: string | null;
  /**
   * URL to use for `x-default` when no `x-default` row was pasted.
   * Convention: pass the global / EN-US canonical. When omitted,
   * `x-default` is not auto-injected.
   */
  readonly autoXDefaultFallback?: string | null;
}

const normaliseHref = (href: string): string => href.replace(/\/+$/, '');

const dedupe = (rows: ReadonlyArray<HreflangRow>): HreflangRow[] => {
  const seen = new Set<string>();
  const out: HreflangRow[] = [];
  for (const row of rows) {
    const key = `${row.hreflang.trim().toLowerCase()}|${normaliseHref(row.href.trim())}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ hreflang: row.hreflang.trim(), href: row.href.trim() });
  }
  return out;
};

export const composeHreflangCluster = (input: ComposeHreflangInput): HreflangRow[] => {
  const pasted = Array.isArray(input.rows) ? input.rows : [];
  const cleaned = dedupe(
    pasted.filter((r) => typeof r.hreflang === 'string' && typeof r.href === 'string'),
  );

  const out: HreflangRow[] = [...cleaned];

  // Auto self-ref.
  const selfHref = input.selfHref;
  const selfHreflang = input.selfHreflang;
  if (selfHref && selfHreflang) {
    const selfNorm = normaliseHref(selfHref);
    const selfHreflangLc = selfHreflang.toLowerCase();
    const hasSelf = out.some(
      (r) =>
        r.hreflang.toLowerCase() === selfHreflangLc && normaliseHref(r.href) === selfNorm,
    );
    if (!hasSelf) {
      out.push({ hreflang: selfHreflang, href: selfHref });
    }
  }

  // Auto x-default.
  if (input.autoXDefaultFallback) {
    const hasXDefault = out.some((r) => r.hreflang.toLowerCase() === 'x-default');
    if (!hasXDefault) {
      out.push({ hreflang: 'x-default', href: input.autoXDefaultFallback });
    }
  }

  return out;
};
