import type { CollectionBeforeChangeHook } from 'payload';

const MAX_DEPTH = 16;

type PageRow = {
  id?: string | number;
  slug?: string | null;
  title?: string | null;
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
 * root-ward, plus the breadcrumb trail (`[{path, label}]`) of every
 * ancestor + self for the public site to render and the JSON-LD
 * dispatcher to emit as `BreadcrumbList`. Idempotent — safe to run on
 * every save.
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

  // segments is built root-first by unshifting; ancestorTrail is the
  // matching `[{path, label}]` chain (also root-first) used for
  // breadcrumb emission.
  const segments: string[] = [slug];
  const ancestorTrail: { slug: string; label: string }[] = [];
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
      ancestorTrail.unshift({
        slug: ancestorSlug,
        label:
          typeof ancestor?.title === 'string' && ancestor.title.length > 0
            ? ancestor.title
            : ancestorSlug,
      });
    }
    cursor = idOfParent(ancestor?.parent ?? null);
  }

  const path = `/${segments.join('/')}`;

  // Build breadcrumb trail with cumulative paths. Each ancestor's path
  // is the slash-join of every segment up to and including it, so the
  // chain reads `/a`, `/a/b`, `/a/b/self` as it walks down.
  const breadcrumb: { path: string; label: string }[] = [];
  const accumulator: string[] = [];
  for (const crumb of ancestorTrail) {
    accumulator.push(crumb.slug);
    breadcrumb.push({ path: `/${accumulator.join('/')}`, label: crumb.label });
  }
  const selfLabel =
    typeof next.title === 'string' && next.title.length > 0 ? next.title : slug;
  breadcrumb.push({ path, label: selfLabel });

  return { ...data, path, breadcrumb };
};
