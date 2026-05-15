import { cache } from "react";

export type BlogCategory = {
  id: string;
  name: string;
  slug: string;
};

export type BlogAuthor = {
  id: string;
  name: string;
  photo?: BlogImage;
  bio?: string;
};

export type BlogImage = {
  id: string;
  url: string;
  alt?: string;
  width?: number;
  height?: number;
};

export type Blog = {
  id: string;
  title: string;
  slug: string;
  abstract?: string;
  heroImage?: BlogImage;
  categories?: BlogCategory | null;
  authors?: BlogAuthor[];
  publishedAt?: string;
  readingMinutes?: number;
  featured?: boolean;
};

// Lexical rich-text node types from Payload CMS
export type LexicalTextNode = {
  type: "text";
  text: string;
  /** Bitmask: 1=bold 2=italic 4=strikethrough 8=underline 16=code 32=subscript 64=superscript */
  format?: number;
  version: number;
};

export type LexicalLinkNode = {
  type: "link" | "autolink";
  url?: string;
  fields?: { url?: string; newTab?: boolean };
  children: LexicalNode[];
  version: number;
};

export type LexicalListItemNode = {
  type: "listitem";
  value: number;
  children: LexicalNode[];
  version: number;
};

export type LexicalListNode = {
  type: "list";
  listType: "bullet" | "number" | "check";
  children: LexicalListItemNode[];
  version: number;
};

export type LexicalHeadingNode = {
  type: "heading";
  tag: "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
  children: LexicalNode[];
  version: number;
};

export type LexicalQuoteNode = {
  type: "quote";
  children: LexicalNode[];
  version: number;
};

export type LexicalCodeNode = {
  type: "code";
  language?: string;
  children: LexicalNode[];
  version: number;
};

export type LexicalParagraphNode = {
  type: "paragraph";
  children: LexicalNode[];
  version: number;
  format?: string;
};

export type LexicalHorizontalRuleNode = {
  type: "horizontalrule";
  version: number;
};

export type LexicalUploadNode = {
  type: "upload";
  value?: { url?: string; alt?: string; width?: number; height?: number };
  version: number;
};

/**
 * headerState bitmask from Payload Lexical tables:
 *   0 = body cell, 1 = row header, 2 = column header, 3 = both
 */
export type LexicalTableCellNode = {
  type: "tablecell";
  headerState?: number;
  colSpan?: number;
  rowSpan?: number;
  children: LexicalNode[];
  version: number;
};

export type LexicalTableRowNode = {
  type: "tablerow";
  children: LexicalTableCellNode[];
  version: number;
};

export type LexicalTableNode = {
  type: "table";
  children: LexicalTableRowNode[];
  version: number;
};

export type LexicalNode =
  | LexicalTextNode
  | LexicalLinkNode
  | LexicalListNode
  | LexicalListItemNode
  | LexicalHeadingNode
  | LexicalQuoteNode
  | LexicalCodeNode
  | LexicalParagraphNode
  | LexicalHorizontalRuleNode
  | LexicalUploadNode
  | LexicalTableNode
  | LexicalTableRowNode
  | LexicalTableCellNode
  | { type: string; children?: LexicalNode[]; version: number; [key: string]: unknown };

export type LexicalRoot = {
  root: {
    type: string;
    children: LexicalNode[];
    direction: "ltr" | "rtl" | null;
    format: string;
    indent: number;
    version: number;
  };
};

export type TocEntry = {
  level?: number | null;
  text?: string | null;
  anchor?: string | null;
  id?: string | null;
};

export type BlogFaqItem = {
  id?: string;
  question: string;
  answer: string;
};

export type BlogDetail = Blog & {
  body?: LexicalRoot | null;
  tableOfContents?: TocEntry[] | null;
  relatedPosts?: Blog[] | null;
  faqs?: BlogFaqItem[] | null;
};

type PayloadListResponse<T> = {
  docs: T[];
  totalDocs: number;
  hasNextPage: boolean;
  nextPage?: number | null;
  page: number;
  totalPages: number;
};

const CMS_URL =
  process.env.NEXT_PUBLIC_CMS_URL ?? "http://localhost:3000";

// Payload returns relative URLs (e.g. /api/media/file/...) when serverURL isn't set.
// Prefix them so Next.js Image can resolve them against the CMS host, not the web app.
export function mediaUrl(url: string | undefined | null): string | undefined {
  if (!url) return undefined;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return `${CMS_URL}${url}`;
}

async function fetchCMS<T>(path: string): Promise<T> {
  const res = await fetch(`${CMS_URL}${path}`, {
    next: { revalidate: 60 },
  });
  if (!res.ok) {
    throw new Error(`CMS fetch failed: ${res.status} ${path}`);
  }
  return res.json() as Promise<T>;
}

const PUBLISHED_FILTER =
  "where[_status][equals]=published&where[publishedAt][exists]=true";

export async function getFeaturedBlog(): Promise<Blog | null> {
  const featured = await fetchCMS<PayloadListResponse<Blog>>(
    `/api/blogs?${PUBLISHED_FILTER}&where[featured][equals]=true&depth=2&limit=1&sort=-publishedAt`,
  );
  if (featured.docs[0]) return featured.docs[0];

  const latest = await fetchCMS<PayloadListResponse<Blog>>(
    `/api/blogs?${PUBLISHED_FILTER}&depth=2&limit=1&sort=-publishedAt`,
  );
  return latest.docs[0] ?? null;
}

export async function getBlogs({
  page = 1,
  limit = 9,
  category,
  search,
}: {
  page?: number;
  limit?: number;
  category?: string;
  search?: string;
} = {}): Promise<PayloadListResponse<Blog>> {
  const params = new URLSearchParams({
    "where[_status][equals]": "published",
    "where[publishedAt][exists]": "true",
    depth: "2",
    limit: String(limit),
    page: String(page),
    sort: "-publishedAt",
  });
  if (category) {
    params.set("where[categories.slug][in][0]", category);
  }
  if (search) {
    params.set("where[title][contains]", search);
  }
  return fetchCMS<PayloadListResponse<Blog>>(`/api/blogs?${params.toString()}`);
}

export async function getBlogCategories(): Promise<BlogCategory[]> {
  const data = await fetchCMS<PayloadListResponse<BlogCategory>>(
    "/api/categories?limit=100&sort=name",
  );
  return data.docs;
}

export const getBlogBySlug = cache(
  async (slug: string): Promise<BlogDetail | null> => {
    const data = await fetchCMS<PayloadListResponse<BlogDetail>>(
      `/api/blogs?where[slug][equals]=${encodeURIComponent(slug)}&${PUBLISHED_FILTER}&depth=3&limit=1`,
    );
    const post = data.docs[0] ?? null;
    if (!post) return null;

    // Payload's R2/S3 storage adapter does not populate `url` for upload fields
    // nested beyond depth=1 (blog → author → photo). Re-fetch authors directly
    // at depth=1 so their photo.url is properly resolved.
    if (post.authors && post.authors.length > 0) {
      const idParams = post.authors
        .map((a, i) => `where[id][in][${i}]=${encodeURIComponent(a.id)}`)
        .join("&");
      try {
        const authorsData = await fetchCMS<PayloadListResponse<BlogAuthor>>(
          `/api/authors?${idParams}&depth=1&limit=10`,
        );
        const authorMap = new Map(authorsData.docs.map((a) => [a.id, a]));
        post.authors = post.authors.map((a) => authorMap.get(a.id) ?? a);
      } catch {
        // Non-fatal: fall back to the authors already embedded in the post
      }
    }

    return post;
  },
);

export async function getRelatedBlogs(blogId: string, categoryIds: string[]): Promise<Blog[]> {
  if (categoryIds.length === 0) {
    const data = await fetchCMS<PayloadListResponse<Blog>>(
      `/api/blogs?${PUBLISHED_FILTER}&where[id][not_equals]=${blogId}&depth=2&limit=3&sort=-publishedAt`,
    );
    return data.docs;
  }
  const catParam = categoryIds
    .map((id, i) => `where[categories][in][${i}]=${encodeURIComponent(id)}`)
    .join("&");
  const data = await fetchCMS<PayloadListResponse<Blog>>(
    `/api/blogs?${PUBLISHED_FILTER}&where[id][not_equals]=${blogId}&${catParam}&depth=2&limit=3&sort=-publishedAt`,
  );
  if (data.docs.length < 3) {
    const fallback = await fetchCMS<PayloadListResponse<Blog>>(
      `/api/blogs?${PUBLISHED_FILTER}&where[id][not_equals]=${blogId}&depth=2&limit=3&sort=-publishedAt`,
    );
    return fallback.docs;
  }
  return data.docs;
}

export function formatBlogDate(iso?: string): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}
