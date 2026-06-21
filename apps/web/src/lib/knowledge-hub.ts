import type { LexicalRoot, TocEntry } from '@/lib/blog';
import { fetchCMS } from '@/lib/cms-fetch';
import type { CmsSeo } from '@/lib/seo/cms-seo';
import { academyOrderOf } from './kb-academy-order';
import type { KhArticleLink, KhGroup, KhSubcategory } from './knowledge-hub-shared';

/**
 * Knowledge Hub data layer — fetches the CMS `knowledgeBase` /
 * `knowledgeCategories` collections and assembles the sidebar tree.
 *
 * Sidebar shape mirrors the Academy: 4 legacy groups pinned on top, then the 8
 * sections, each with its subcategories, each holding its articles. Ordering is
 * driven by the category `displayOrder` field; a slug-based fallback keeps the
 * order correct even if the CMS instance predates that field.
 */

const PUBLISHED = 'where[_status][equals]=published';

interface CmsList<T> {
  docs: T[];
}

interface CmsCategory {
  id: number;
  name: string;
  slug: string;
  displayOrder?: number | null;
  parent?: number | null;
}

interface CmsArticleMeta {
  id: number;
  title: string;
  slug: string;
  category: number | null;
}

/** Fallback ordering when `displayOrder` is absent (legacy groups first). */
const FALLBACK_ORDER: Record<string, number> = {
  'emerging-standards': 0,
  'security-features': 1,
  'compliance-and-certification': 2,
  'devops-kyverno': 3,
  understand: 10,
  explore: 20,
  learn: 30,
  build: 40,
  deploy: 50,
  operate: 60,
  secure: 70,
  reference: 80,
};

const orderOf = (c: CmsCategory): number =>
  typeof c.displayOrder === 'number' ? c.displayOrder : (FALLBACK_ORDER[c.slug] ?? 999);

// Client-safe types + helpers live in ./knowledge-hub-shared (no server deps).
// Re-export the types so existing server-side consumers keep importing them
// from this module.
export type { KhArticleLink, KhGroup, KhSubcategory } from './knowledge-hub-shared';

// Category ordering: `displayOrder` is primary; `id` ascending is the
// tiebreaker. (Top-level groups: legacy groups 0–3 stay pinned above the 8
// Academy sections 10–80.)
const byOrder = (a: CmsCategory, b: CmsCategory): number => orderOf(a) - orderOf(b) || a.id - b.id;

// Article ordering within a category follows the live Academy sidebar
// (kb-academy-order). Unmapped articles (legacy / post-snapshot) keep their
// incoming id order. The `oa === ob` guard avoids `Infinity - Infinity = NaN`
// for two unmapped articles.
const byAcademyOrder = (a: KhArticleLink, b: KhArticleLink): number => {
  const oa = academyOrderOf(a.slug);
  const ob = academyOrderOf(b.slug);
  return oa === ob ? 0 : oa - ob;
};

/** Fetch categories + article metadata and assemble the ordered sidebar tree. */
export async function getKnowledgeTree(): Promise<KhGroup[]> {
  const [cats, arts] = await Promise.all([
    fetchCMS<CmsList<CmsCategory>>(
      `/api/knowledgeCategories?${PUBLISHED}&depth=0&limit=200&sort=id&select[name]=true&select[slug]=true&select[displayOrder]=true&select[parent]=true`,
    ),
    fetchCMS<CmsList<CmsArticleMeta>>(
      `/api/knowledgeBase?${PUBLISHED}&depth=0&limit=1000&sort=id&select[title]=true&select[slug]=true&select[category]=true`,
    ),
  ]);

  // Bucket articles by their (leaf) category id, then order each bucket by the
  // live Academy sidebar sequence (kb-academy-order).
  const articlesByCat = new Map<number, KhArticleLink[]>();
  for (const a of arts.docs) {
    if (a.category == null) continue;
    const list = articlesByCat.get(a.category) ?? [];
    list.push({ slug: a.slug, title: a.title });
    articlesByCat.set(a.category, list);
  }
  for (const list of articlesByCat.values()) list.sort(byAcademyOrder);

  // A subcategory's position is the Academy position of its first article, so
  // subcategories line up with the Academy too (falls back to `displayOrder`
  // for legacy/empty categories where no article is mapped).
  const academyMinOf = (catId: number): number => {
    let min = Number.POSITIVE_INFINITY;
    for (const a of articlesByCat.get(catId) ?? []) {
      const o = academyOrderOf(a.slug);
      if (o < min) min = o;
    }
    return min;
  };
  const bySubcategoryOrder = (a: CmsCategory, b: CmsCategory): number => {
    const ma = academyMinOf(a.id);
    const mb = academyMinOf(b.id);
    return ma === mb ? byOrder(a, b) : ma - mb;
  };

  const topLevel = cats.docs.filter((c) => c.parent == null).sort(byOrder);

  return topLevel.map((group) => {
    const children = cats.docs.filter((c) => c.parent === group.id).sort(bySubcategoryOrder);

    const subcategories: KhSubcategory[] = children.map((sub) => ({
      slug: sub.slug,
      name: sub.name,
      articles: articlesByCat.get(sub.id) ?? [],
    }));

    return {
      slug: group.slug,
      name: group.name,
      subcategories,
      // Legacy groups attach articles directly; sections have none of their own.
      articles: articlesByCat.get(group.id) ?? [],
    };
  });
}

export interface KhLandingGroup {
  slug: string;
  name: string;
  blurb: string;
  count: number;
  /** Slug of the first article in the group, used as the card link target. */
  href: string | null;
}

/** Landing-page cards: one per top-level group, with article counts + a blurb. */
export async function getKnowledgeLanding(): Promise<KhLandingGroup[]> {
  const tree = await getKnowledgeTree();
  return tree.map((g) => {
    const subCount = g.subcategories.reduce((n, s) => n + s.articles.length, 0);
    const count = g.articles.length + subCount;
    const blurb =
      g.subcategories.length > 0
        ? g.subcategories.map((s) => s.name).join(', ')
        : g.articles
            .slice(0, 3)
            .map((a) => a.title)
            .join(' · ');
    const firstArticle =
      g.articles[0] ?? g.subcategories.find((s) => s.articles.length > 0)?.articles[0];
    return { slug: g.slug, name: g.name, blurb, count, href: firstArticle?.slug ?? null };
  });
}

export interface KhArticle {
  slug: string;
  title: string;
  abstract?: string | null;
  videoUrl?: string | null;
  category?: { name: string } | null;
  body?: LexicalRoot | null;
  tableOfContents?: TocEntry[] | null;
  seo?: CmsSeo | null;
  publishedAt?: string | null;
  updatedAt?: string | null;
}

/** Fetch a single published article by slug (depth 1 for the category name and seo.ogImage). */
export async function getKnowledgeArticle(slug: string): Promise<KhArticle | null> {
  const res = await fetchCMS<CmsList<KhArticle & { category?: { name: string } | number | null }>>(
    `/api/knowledgeBase?${PUBLISHED}&depth=1&limit=1&where[slug][equals]=${encodeURIComponent(slug)}&select[title]=true&select[slug]=true&select[abstract]=true&select[videoUrl]=true&select[body]=true&select[tableOfContents]=true&select[category]=true&select[seo]=true&select[publishedAt]=true&select[updatedAt]=true`,
  );
  const doc = res.docs[0];
  if (!doc) return null;
  const category =
    doc.category && typeof doc.category === 'object' ? { name: doc.category.name } : null;
  return { ...doc, category };
}

/** All published article slugs, for generateStaticParams. */
export async function getKnowledgeArticleSlugs(): Promise<string[]> {
  const res = await fetchCMS<CmsList<{ slug: string }>>(
    `/api/knowledgeBase?${PUBLISHED}&depth=0&limit=1000&select[slug]=true`,
  );
  return res.docs.map((d) => d.slug);
}
