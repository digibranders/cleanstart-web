import type { CollectionBeforeChangeHook } from 'payload';
import { ValidationError } from 'payload';

const MAX_DEPTH = 16;

interface TaxonomyRow {
  id?: string | number;
  parent?: string | number | { id?: string | number } | null;
}

const idOfParent = (parent: TaxonomyRow['parent']): string | number | null => {
  if (parent == null) return null;
  if (typeof parent === 'string' || typeof parent === 'number') return parent;
  return parent.id ?? null;
};

/**
 * Hierarchical taxonomies (categories / newsCategories /
 * knowledgeCategories) all expose a self-referencing `parent` field.
 * Without a guard, an editor can pick the current row's own ancestor
 * as parent and spin the public renderer into an infinite loop when
 * it walks the chain to build breadcrumbs.
 *
 * This hook walks the proposed parent chain root-ward, refuses to
 * save when:
 *   - the chain re-encounters the row being saved (cycle)
 *   - the chain exceeds MAX_DEPTH (runaway)
 *
 * Same shape as `pagesPathBuilderHook`'s cycle detection — same
 * iteration budget, same error semantics, just no path computation.
 */
export const taxonomyParentCycleGuardHook = (
  collection: 'categories' | 'newsCategories' | 'knowledgeCategories',
): CollectionBeforeChangeHook =>
  async ({ data, req, originalDoc }) => {
    if (!data) return data;
    const next = data as TaxonomyRow;
    const id = (originalDoc as TaxonomyRow | undefined)?.id;
    if (id == null) return data;

    let cursor = idOfParent(next.parent ?? null);
    if (cursor == null) return data;
    if (cursor === id) {
      throw new ValidationError({
        errors: [{ message: 'A row cannot be its own parent.', path: 'parent' }],
      });
    }

    const seen = new Set<string | number>([id]);
    let depth = 0;
    while (cursor != null) {
      if (seen.has(cursor)) {
        throw new ValidationError({
          errors: [
            {
              message: `Parent chain creates a cycle via "${String(cursor)}".`,
              path: 'parent',
            },
          ],
        });
      }
      if (depth >= MAX_DEPTH) {
        throw new ValidationError({
          errors: [
            {
              message: `Parent chain exceeds maximum depth of ${MAX_DEPTH}.`,
              path: 'parent',
            },
          ],
        });
      }
      seen.add(cursor);
      depth += 1;
      const ancestor = (await req.payload.findByID({
        collection,
        id: cursor,
        depth: 0,
        overrideAccess: true,
      })) as TaxonomyRow | null;
      cursor = idOfParent(ancestor?.parent ?? null);
    }
    return data;
  };
