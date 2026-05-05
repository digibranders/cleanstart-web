import type { CollectionBeforeChangeHook } from 'payload';

import { extractFromLexical } from '../lib/lexical-extract';

type BodyStatsOptions = {
  /** Source field name (defaults to `body`). */
  source?: string;
  /** Which derived fields to write. Omitted fields are left untouched. */
  fields?: {
    wordCount?: string;
    readingMinutes?: string;
    tableOfContents?: string;
  };
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
    const body = (data as Record<string, unknown>)[source];
    const summary = extractFromLexical(body);

    const next = { ...data } as Record<string, unknown>;
    if (fields.wordCount) {
      next[fields.wordCount] = summary.wordCount;
    }
    if (fields.readingMinutes) {
      next[fields.readingMinutes] = summary.readingMinutes;
    }
    if (fields.tableOfContents) {
      next[fields.tableOfContents] = summary.headings.map((heading) => ({
        level: heading.level,
        text: heading.text,
        anchor: heading.anchor,
      }));
    }
    return next;
  };
};
