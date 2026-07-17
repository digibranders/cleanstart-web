import type { BreadcrumbCrumb } from "./jsonld";

/**
 * Content kinds that get a detail-page breadcrumb. Keyed to render the SAME
 * trail in the visible web hero, the web JSON-LD, and the CMS /api/jsonld
 * preview — one definition, so the three can never disagree.
 */
export type DetailKind =
  | "blog"
  | "guide"
  | "news"
  | "event"
  | "job"
  | "resource"
  | "knowledgeBase"
  | "author"
  | "legal"
  | "webinar";

export interface DetailTrailInput {
  /** The current page's display name (the last, unlinked crumb). */
  title: string;
}

const HOME: BreadcrumbCrumb = { name: "Home", path: "/" };

/** Listing crumb per kind. `null` = kind has no listing parent (author). */
const LISTING: Record<DetailKind, BreadcrumbCrumb | null> = {
  blog: { name: "Blogs", path: "/blogs" },
  guide: { name: "Guides", path: "/guide" },
  news: { name: "Newsroom", path: "/news" },
  event: { name: "Events", path: "/events" },
  job: { name: "Careers", path: "/careers" },
  resource: { name: "Resource Center", path: "/resource-center" },
  knowledgeBase: { name: "Knowledge Hub", path: "/knowledge-hub" },
  legal: { name: "Legal", path: "/legal" },
  author: null,
  webinar: { name: "Webinars", path: "/webinars" },
};

/**
 * The canonical breadcrumb trail for a detail page: `Home › <Listing> › <Title>`.
 * Only the last crumb (the current page) has NO `path` — Google explicitly permits
 * omitting `item` on the final breadcrumb, and it is not a link. EVERY other crumb
 * carries a `path`, so `breadcrumbSchema` never emits a mid-trail `ListItem` with a
 * missing `item` (which Google Search Console flags as an invalid BreadcrumbList).
 *
 * NB: Knowledge Hub categories are deliberately NOT a crumb here — they have no
 * landing page, so a category `ListItem` would have no valid `item` URL. The
 * category still appears in the visible KB breadcrumb (KnowledgeHubArticle.tsx),
 * which is UX chrome, not structured data.
 *
 * This is the ONLY place trail shapes are defined. Both apps/web (visible hero +
 * JSON-LD) and apps/cms (/api/jsonld preview) call it, so the visible breadcrumb
 * and the structured data are identical by construction.
 */
export function breadcrumbTrail(kind: DetailKind, input: DetailTrailInput): BreadcrumbCrumb[] {
  const listing = LISTING[kind];
  const middle: BreadcrumbCrumb[] = [];
  if (listing) middle.push(listing);
  return [HOME, ...middle, { name: input.title }];
}
