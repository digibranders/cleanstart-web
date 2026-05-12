import type { Field, Payload, Where } from 'payload';

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

// Editorial guidance follows the same advice every SEO blog repeats:
// keep slugs scannable. Above ~80 chars URLs start wrapping and look
// spammy in SERPs; we hard-block at 120 because Postgres path indexes
// degrade and some CDN caches truncate.
const SLUG_LIMIT = 120;
const SLUG_HINT = 80;

const SLUG_COLLISION_MESSAGE = 'This slug is already in use — pick a different one.';

const validateSlugLength = (
  value: string | string[] | null | undefined,
): true | string => {
  if (typeof value !== 'string' || value.length === 0) return true;
  if (value.length > SLUG_LIMIT) {
    return `Slug is ${value.length} characters — keep it under ${SLUG_LIMIT}. Aim for ≤ ${SLUG_HINT}.`;
  }
  return true;
};

type SlugValidateOptions = {
  id?: string | number | undefined;
  data?: Record<string, unknown> | undefined;
  siblingData?: Record<string, unknown> | undefined;
  req?: { payload?: Payload };
  collectionSlug?: string;
};

const buildCollisionWhere = ({
  value,
  id,
  parent,
  composite,
}: {
  value: string;
  id: string | number | undefined;
  parent: unknown;
  composite: boolean;
}): Where => {
  const where: Where = { slug: { equals: value } };
  if (id != null) {
    where.id = { not_equals: id };
  }
  if (composite) {
    where.parent = parent == null ? { exists: false } : { equals: parent };
  }
  return where;
};

/**
 * Reusable slug field. Auto-fills from a sibling field on save when blank.
 *
 * Two layers of auto-fill:
 *
 *  1. **Client-side** via the custom `SlugField` admin component — as
 *     the editor types in the source field (default `title`) the slug
 *     is mirrored live, slugified. This keeps Payload's `required: true`
 *     client-side validator happy, so Save Draft never fails with an
 *     empty-slug toast on a fresh document.
 *  2. **Server-side** via the `beforeValidate` field hook — defence in
 *     depth for API-driven creates that bypass the admin UI.
 *
 * Edits are allowed but should be intentional — slug changes propagate
 * to the redirects collection via the slug-change beforeChange hook
 * (Phase D).
 */
export const slugField = ({ source = 'name', composite = false }: SlugFieldOptions = {}): Field => ({
  name: 'slug',
  type: 'text',
  required: true,
  unique: !composite,
  index: true,
  admin: {
    description: `URL-safe slug. Auto-generated from "${source}" on first save; safe to edit later (a redirect row is created automatically when you do). Cap ${SLUG_LIMIT} characters.`,
    position: 'sidebar',
    components: {
      Field: {
        path: '@/payload/admin/components/SlugField.tsx#SlugField',
        clientProps: { source },
      },
    },
  },
  validate: async (
    value: string | string[] | null | undefined,
    options: SlugValidateOptions,
  ): Promise<true | string> => {
    const lengthResult = validateSlugLength(value);
    if (lengthResult !== true) return lengthResult;

    if (typeof value !== 'string' || value.trim().length === 0) return true;

    const payload = options.req?.payload;
    const collectionSlug = options.collectionSlug;
    if (!payload || !collectionSlug) return true;

    const parent = composite
      ? (options.siblingData?.parent ?? options.data?.parent ?? null)
      : null;

    const where = buildCollisionWhere({
      value,
      id: options.id,
      parent,
      composite,
    });

    const result = await payload.find({
      collection: collectionSlug as never,
      where,
      limit: 1,
      depth: 0,
      pagination: false,
      overrideAccess: true,
    });

    if (result.docs.length > 0) {
      return SLUG_COLLISION_MESSAGE;
    }
    return true;
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
