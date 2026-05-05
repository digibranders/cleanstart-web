import type { Field } from 'payload';

import { slugify } from '../lib/slugify';

type SlugFieldOptions = {
  /** Sibling field whose value is used as the slug source. Defaults to `name`. */
  source?: string;
  /**
   * When true, drop the column-level `unique` constraint and rely on a
   * collection-level composite index instead. Used for Pages, where two
   * pages with `slug: 'pricing'` under different parents must coexist
   * (their public URLs differ via the parent path).
   */
  composite?: boolean;
};

/**
 * Reusable slug field. Auto-fills from a sibling field on save when blank.
 * Edits are allowed but should be intentional — slug changes propagate to the
 * redirects collection via the slug-change beforeChange hook (Phase D).
 */
export const slugField = ({ source = 'name', composite = false }: SlugFieldOptions = {}): Field => ({
  name: 'slug',
  type: 'text',
  required: true,
  unique: !composite,
  index: true,
  admin: {
    description: `URL-safe slug. Auto-generated from "${source}" on first save; safe to edit later (a redirect row is created automatically when you do).`,
    position: 'sidebar',
  },
  hooks: {
    beforeValidate: [
      ({ data, value }) => {
        if (typeof value === 'string' && value.trim().length > 0) {
          return slugify(value);
        }
        const fallback = (data as Record<string, unknown> | undefined)?.[source];
        if (typeof fallback === 'string') {
          return slugify(fallback);
        }
        return value;
      },
    ],
  },
});
