import type { CollectionBeforeChangeHook } from 'payload';

import { extractFromLexical } from '../lib/lexical-extract';

/** Maps the `tocDepth` select value to concrete heading levels. */
export const TOC_DEPTH_LEVELS: Readonly<Record<string, number[]>> = {
  h2: [2],
  h2_h3: [2, 3],
  h2_h3_h4: [2, 3, 4],
};

type BodyStatsOptions = {
  /** Source field name (defaults to `body`). */
  source?: string;
  /** Which derived fields to write. Omitted fields are left untouched. */
  fields?: {
    wordCount?: string;
    readingMinutes?: string;
    tableOfContents?: string;
  };
  /**
   * Name of a `select` field in the document whose value maps to heading
   * levels via `TOC_DEPTH_LEVELS`. Takes precedence over `tocLevels`.
   * Falls back to `tocLevels` (or [2]) when the field is absent or
   * unrecognised.
   */
  tocLevelsField?: string;
  /**
   * Static fallback heading levels when `tocLevelsField` is not set or its
   * value is unrecognised. Defaults to [2] (H2-only).
   */
  tocLevels?: number[];
};

const resolveTocLevels = (
  data: Record<string, unknown>,
  options: BodyStatsOptions,
): Set<number> => {
  if (options.tocLevelsField) {
    const val = data[options.tocLevelsField];
    if (typeof val === 'string' && val in TOC_DEPTH_LEVELS) {
      return new Set(TOC_DEPTH_LEVELS[val]);
    }
  }
  return new Set(options.tocLevels ?? [2]);
};

/**
 * beforeChange hook factory. Reads the Lexical body field from `data` and
 * writes the requested derived fields (word count, reading minutes, table
 * of contents). Idempotent — safe to run on every save.
 */
export const bodyStatsHook = (options: BodyStatsOptions = {}): CollectionBeforeChangeHook => {
  const source = options.source ?? 'body';
  const fields = options.fields ?? {
    wordCount: 'wordCount',
    readingMinutes: 'readingMinutes',
    tableOfContents: 'tableOfContents',
  };

  return ({ data }) => {
    if (!data) return data;
    const row = data as Record<string, unknown>;
    const body = row[source];
    const summary = extractFromLexical(body);
    const tocLevels = resolveTocLevels(row, options);

    const next = { ...row };
    if (fields.wordCount) {
      next[fields.wordCount] = summary.wordCount;
    }
    if (fields.readingMinutes) {
      next[fields.readingMinutes] = summary.readingMinutes;
    }
    if (fields.tableOfContents) {
      let picked = summary.headings.filter((h) => tocLevels.has(h.level));
      // Fallback: when the configured depth excludes every heading in the body
      // (e.g. editor picked H2-only but the article uses H3s), surface the
      // shallowest level present so the TOC is never silently empty.
      if (picked.length === 0 && summary.headings.length > 0) {
        const shallowest = Math.min(...summary.headings.map((h) => h.level));
        picked = summary.headings.filter((h) => h.level === shallowest);
      }
      next[fields.tableOfContents] = picked.map((heading) => ({
        level: heading.level,
        text: heading.text,
        anchor: heading.anchor,
      }));
    }
    return next;
  };
};
