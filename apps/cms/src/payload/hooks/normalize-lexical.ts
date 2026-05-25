import type { CollectionBeforeChangeHook } from 'payload';

import { normalizeLexicalValue } from '../lib/lexical-normalize';

type Options = {
  /** Richtext field name(s) to normalize. Defaults to `['body']`. */
  fields?: string[];
};

/**
 * beforeChange hook factory that merges adjacent same-shape `list` nodes
 * inside one or more Lexical richText fields. Idempotent: re-saving a
 * normalized doc is a no-op.
 */
export const normalizeLexicalHook = (options: Options = {}): CollectionBeforeChangeHook => {
  const fields = options.fields ?? ['body'];
  return ({ data }) => {
    if (!data) return data;
    const row = data as Record<string, unknown>;
    let next: Record<string, unknown> | null = null;
    for (const field of fields) {
      const value = row[field];
      const normalized = normalizeLexicalValue(value);
      if (normalized !== value) {
        if (!next) next = { ...row };
        next[field] = normalized;
      }
    }
    return next ?? row;
  };
};
