/**
 * Client-safe Knowledge Hub types + pure helpers.
 *
 * These are imported by client components (the sidebar, the mobile nav). They
 * live here — NOT in `knowledge-hub.ts` — because that module imports the CMS
 * fetcher, which pulls in `next/headers` (a server-only API). A *value* import
 * from there into a client component would drag server code into the client
 * bundle and fail the build, so anything a client needs lives in this
 * dependency-free module.
 */

export interface KhArticleLink {
  slug: string;
  title: string;
}

export interface KhSubcategory {
  slug: string;
  name: string;
  articles: KhArticleLink[];
}

/** A top-level sidebar group: a legacy group (articles) or a section (subcategories). */
export interface KhGroup {
  slug: string;
  name: string;
  subcategories: KhSubcategory[];
  articles: KhArticleLink[];
}

/**
 * Locate which group / subcategory the active article belongs to. Shared by the
 * desktop sidebar (active-state expansion) and the mobile nav (breadcrumb bar)
 * so they can't drift apart.
 */
export function findActiveLocation(
  groups: KhGroup[],
  slug: string,
): { group?: KhGroup; sub?: KhSubcategory } {
  for (const group of groups) {
    if (group.articles.some((a) => a.slug === slug)) return { group };
    const sub = group.subcategories.find((s) => s.articles.some((a) => a.slug === slug));
    if (sub) return { group, sub };
  }
  return {};
}
