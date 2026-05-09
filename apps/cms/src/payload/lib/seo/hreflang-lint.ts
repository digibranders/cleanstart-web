/**
 * Lint a hreflang cluster (the editor-pasted rows on a single doc).
 * Returns soft warnings — never throws, never blocks save. The
 * "Head tags" sidebar card surfaces issues as a warning badge with
 * a hover tooltip listing each issue.
 *
 * Why soft: hreflang clusters often look broken mid-edit (one variant
 * in, two to go) — hard validation would block every intermediate
 * save. The audit at sitemap-build time is the strict pass.
 *
 * Checks:
 *   1. BCP-47 syntax: `language[-Script][-REGION]` or `x-default`.
 *   2. Duplicate `hreflang` codes (last one wins on Google's side —
 *      ambiguous; flag both).
 *   3. Self-reference: at least one row should point at the current
 *      page. Caller passes the page's canonical URL; absence flagged.
 *   4. `x-default`: recommended (not required) — flagged informational.
 *   5. Absolute URL: hrefs must be `https://…` for Google to honour.
 */

export type HreflangLintSeverity = 'warning' | 'info';

export interface HreflangLintIssue {
  readonly severity: HreflangLintSeverity;
  readonly code:
    | 'invalid-bcp47'
    | 'duplicate-code'
    | 'missing-self-ref'
    | 'missing-x-default'
    | 'non-absolute-href';
  readonly message: string;
  /** Row indices the issue applies to (0-based). */
  readonly rowIndices: readonly number[];
}

export interface HreflangLintInput {
  readonly rows: ReadonlyArray<{ readonly hreflang?: string | null; readonly href?: string | null }>;
  /**
   * The current doc's canonical URL — used to verify the cluster
   * contains a self-reference. Pass `null` to skip the self-ref check
   * (e.g. the doc has no slug yet on first save).
   */
  readonly selfHref?: string | null;
}

// BCP-47: language is 2–3 alpha; optional script (4 alpha); optional
// region (2 alpha or 3 digits). `x-default` is the standalone special
// value. We deliberately stay loose — full BCP-47 grammar allows
// extension subtags / private-use tags we never want to warn on.
const BCP47_RE = /^(?:x-default|[a-z]{2,3}(?:-[A-Z][a-z]{3})?(?:-(?:[A-Z]{2}|\d{3}))?)$/;

const isAbsoluteHref = (href: string): boolean => /^https?:\/\//i.test(href);

const normaliseHref = (href: string): string => href.replace(/\/+$/, '');

export const lintHreflang = (input: HreflangLintInput): HreflangLintIssue[] => {
  const issues: HreflangLintIssue[] = [];
  const rows = input.rows ?? [];
  if (rows.length === 0) return issues;

  // 1) BCP-47 validity — single issue per invalid row, batched.
  const invalidIndices: number[] = [];
  rows.forEach((row, i) => {
    const code = (row.hreflang ?? '').trim();
    if (!code) {
      invalidIndices.push(i);
      return;
    }
    if (!BCP47_RE.test(code)) {
      invalidIndices.push(i);
    }
  });
  if (invalidIndices.length > 0) {
    issues.push({
      severity: 'warning',
      code: 'invalid-bcp47',
      message: `${invalidIndices.length} row${invalidIndices.length === 1 ? '' : 's'} use a language code that doesn't look right. Use codes like en, en-US, ar-AE, or x-default.`,
      rowIndices: invalidIndices,
    });
  }

  // 2) Duplicate codes (case-insensitive).
  const codeBuckets = new Map<string, number[]>();
  rows.forEach((row, i) => {
    const code = (row.hreflang ?? '').trim().toLowerCase();
    if (!code) return;
    const arr = codeBuckets.get(code);
    if (arr) arr.push(i);
    else codeBuckets.set(code, [i]);
  });
  const duplicateIndices: number[] = [];
  for (const indices of codeBuckets.values()) {
    if (indices.length > 1) duplicateIndices.push(...indices);
  }
  if (duplicateIndices.length > 0) {
    issues.push({
      severity: 'warning',
      code: 'duplicate-code',
      message: "Same language code used more than once. Pick one and remove the others — search engines won't know which to use.",
      rowIndices: duplicateIndices,
    });
  }

  // 3) Self-reference. Skip when caller didn't provide a selfHref.
  if (input.selfHref) {
    const selfNorm = normaliseHref(input.selfHref);
    const hasSelfRef = rows.some((r) => normaliseHref((r.href ?? '').trim()) === selfNorm);
    if (!hasSelfRef) {
      issues.push({
        severity: 'warning',
        code: 'missing-self-ref',
        message: "This page isn't listed as one of its own versions. Add a row pointing at this page so Google sees it in the group.",
        rowIndices: [],
      });
    }
  }

  // 4) x-default — informational nudge.
  const hasXDefault = rows.some((r) => (r.hreflang ?? '').trim().toLowerCase() === 'x-default');
  if (!hasXDefault) {
    issues.push({
      severity: 'info',
      code: 'missing-x-default',
      message: "Tip: add an x-default row pointing at the version to show when no language matches the visitor's.",
      rowIndices: [],
    });
  }

  // 5) Absolute URL only.
  const nonAbsolute: number[] = [];
  rows.forEach((row, i) => {
    const href = (row.href ?? '').trim();
    if (href && !isAbsoluteHref(href)) {
      nonAbsolute.push(i);
    }
  });
  if (nonAbsolute.length > 0) {
    issues.push({
      severity: 'warning',
      code: 'non-absolute-href',
      message: `${nonAbsolute.length} row${nonAbsolute.length === 1 ? '' : 's'} need a full URL. Make sure each starts with https://`,
      rowIndices: nonAbsolute,
    });
  }

  return issues;
};

export const lintSummary = (issues: ReadonlyArray<HreflangLintIssue>): {
  warnings: number;
  infos: number;
} => {
  let warnings = 0;
  let infos = 0;
  for (const issue of issues) {
    if (issue.severity === 'warning') warnings += 1;
    else infos += 1;
  }
  return { warnings, infos };
};
