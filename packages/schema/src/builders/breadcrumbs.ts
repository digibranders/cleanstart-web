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
  | "legal";

export interface DetailTrailInput {
  /** The current page's display name (the last, unlinked crumb). */
  title: string;
  /** Knowledge Hub only: category name, rendered as an UNLINKED crumb (no route). */
  category?: string | null | undefined;
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
};

/**
 * The canonical breadcrumb trail for a detail page: `Home › <Listing> › <Title>`
 * (Knowledge Hub inserts an unlinked category before the title). The last crumb
 * has NO `path` — it is the current page, not a link (Google + UX best practice).
 *
 * This is the ONLY place trail shapes are defined. Both apps/web (visible hero +
 * JSON-LD) and apps/cms (/api/jsonld preview) call it, so the visible breadcrumb
 * and the structured data are identical by construction.
 */
export function breadcrumbTrail(kind: DetailKind, input: DetailTrailInput): BreadcrumbCrumb[] {
  const listing = LISTING[kind];
  const middle: BreadcrumbCrumb[] = [];
  if (listing) middle.push(listing);
  if (kind === "knowledgeBase" && input.category) {
    middle.push({ name: input.category });
  }
  return [HOME, ...middle, { name: input.title }];
}
