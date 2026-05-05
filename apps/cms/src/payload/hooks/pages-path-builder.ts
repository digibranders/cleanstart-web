import type { CollectionBeforeChangeHook } from 'payload';

const MAX_DEPTH = 16;

type PageRow = {
  id?: string | number;
  slug?: string | null;
  parent?: string | number | { id?: string | number } | null;
  path?: string | null;
};

const idOfParent = (parent: PageRow['parent']): string | number | null => {
  if (parent == null) return null;
  if (typeof parent === 'string' || typeof parent === 'number') return parent;
  return parent.id ?? null;
};

/**
 * Computes the full URL path for a Page by walking the parent chain
 * root-ward. Idempotent — safe to run on every save.
 *
 * - Root pages get `/<slug>`.
 * - Nested pages get `/<grandparent-slug>/<parent-slug>/<self-slug>`.
 * - Cycles in the parent chain are detected (more thoroughly than the
 *   field-level validate, which only catches loops involving the
 *   currently-saving doc) and result in a thrown ValidationError to
 *   prevent silent infinite recursion.
 */
export const pagesPathBuilderHook: CollectionBeforeChangeHook = async ({
  data,
  req,
  originalDoc,
}) => {
  if (!data) return data;
  const next = data as PageRow;
  const slug = next.slug;
  if (typeof slug !== 'string' || slug.length === 0) return data;

  const seen = new Set<string | number>();
  const id = (originalDoc as PageRow | undefined)?.id;
  if (id != null) seen.add(id);

  const segments: string[] = [slug];
  let cursor = idOfParent(next.parent ?? null);
  let depth = 0;
  while (cursor != null) {
    if (seen.has(cursor)) {
      throw new Error('Pages: parent chain creates a cycle; cannot compute path.');
    }
    if (depth >= MAX_DEPTH) {
      throw new Error(`Pages: parent chain exceeds maximum depth of ${MAX_DEPTH}.`);
    }
    seen.add(cursor);
    depth += 1;
    const ancestor = (await req.payload.findByID({
      collection: 'pages',
      id: cursor,
      depth: 0,
      overrideAccess: true,
    })) as PageRow | null;
    const ancestorSlug = ancestor?.slug;
    if (typeof ancestorSlug === 'string' && ancestorSlug.length > 0) {
      segments.unshift(ancestorSlug);
    }
    cursor = idOfParent(ancestor?.parent ?? null);
  }

  const path = `/${segments.join('/')}`;
  return { ...data, path };
};
