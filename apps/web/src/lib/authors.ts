import { cache } from "react";

import type { Blog, BlogImage, LexicalRoot } from "./blog";
import { fetchCMS } from "./cms-fetch";

export type AuthorSocial = {
  twitter?: string;
  linkedin?: string;
  github?: string;
  website?: string;
  email?: string;
};

export type AuthorExperience = {
  id?: string;
  company: string;
  role?: string;
  fromYear?: number;
  toYear?: number;
};

export type AuthorEducation = {
  id?: string;
  institution: string;
  degree?: string;
  year?: number;
};

export type AuthorAward = {
  id?: string;
  title: string;
  issuer?: string;
  year?: number;
};

export type AuthorDetail = {
  id: string;
  name: string;
  slug: string;
  role?: string;
  location?: string;
  bioShort?: string;
  bioLong?: LexicalRoot | null;
  photo?: BlogImage;
  social?: AuthorSocial;
  topicAreas?: { topic: string }[];
  education?: AuthorEducation[];
  experience?: AuthorExperience[];
  skills?: { skill: string }[];
  awards?: AuthorAward[];
};

type PayloadListResponse<T> = {
  docs: T[];
  totalDocs: number;
  page: number;
  totalPages: number;
};

export const getAuthorBySlug = cache(
  async (slug: string): Promise<AuthorDetail | null> => {
    // depth=1 fully resolves the author: `photo` is a direct upload (url +
    // sizes populate at depth=1) and every other field is a group or array of
    // primitives, so depth=2 fetched nothing extra.
    const data = await fetchCMS<PayloadListResponse<AuthorDetail>>(
      `/api/authors?where[slug][equals]=${encodeURIComponent(slug)}&depth=1&limit=1`,
    );
    return data.docs[0] ?? null;
  },
);

/**
 * All published author slugs, for generateStaticParams (prerender at build).
 * Authors have no `publishedAt` — status-only filter, matching the sitemap.
 */
export async function getAuthorSlugs(): Promise<string[]> {
  const res = await fetchCMS<PayloadListResponse<{ slug: string }>>(
    "/api/authors?where[_status][equals]=published&depth=0&limit=1000&select[slug]=true",
  );
  return res.docs.map((d) => d.slug).filter((s): s is string => Boolean(s));
}

/**
 * Published posts by an author, for the "More from <author>" card grid.
 * Returns partial `Blog` docs projected to the card field surface — see the
 * select whitelist below.
 */
export async function getPostsByAuthor(
  authorId: string,
  { limit = 6 }: { limit?: number } = {},
): Promise<Blog[]> {
  const params = new URLSearchParams({
    "where[_status][equals]": "published",
    "where[publishedAt][exists]": "true",
    "where[authors][in][0]": authorId,
    // depth=1 hydrates heroImage (+ its `sizes`) and the post's category — all
    // the AuthorPosts card reads. depth=2 with no projection pulled every
    // post's full Lexical `body` + nested relations, ballooning this 6-item
    // response past Next's 2 MB data-cache ceiling (logged ~4.8 MB), so it
    // could never be cached and re-hit the CMS origin on every render.
    depth: "1",
    limit: String(limit),
    sort: "-publishedAt",
  });
  // Whitelist only the fields AuthorPosts.PostCard renders; excludes `body`
  // and every other detail-only field. Keep in sync with that component.
  for (const field of [
    "title",
    "slug",
    "heroImage",
    "categories",
    "publishedAt",
    "displayPublishedAt",
    "readingMinutes",
  ]) {
    params.set(`select[${field}]`, "true");
  }
  const data = await fetchCMS<PayloadListResponse<Blog>>(
    `/api/blogs?${params.toString()}`,
  );
  return data.docs;
}
