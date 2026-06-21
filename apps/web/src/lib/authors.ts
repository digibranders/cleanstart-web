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

const PUBLISHED_FILTER =
  "where[_status][equals]=published&where[publishedAt][exists]=true";

export const getAuthorBySlug = cache(
  async (slug: string): Promise<AuthorDetail | null> => {
    const data = await fetchCMS<PayloadListResponse<AuthorDetail>>(
      `/api/authors?where[slug][equals]=${encodeURIComponent(slug)}&depth=2&limit=1`,
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

export async function getPostsByAuthor(
  authorId: string,
  { limit = 6 }: { limit?: number } = {},
): Promise<Blog[]> {
  const data = await fetchCMS<PayloadListResponse<Blog>>(
    `/api/blogs?${PUBLISHED_FILTER}&where[authors][in][0]=${encodeURIComponent(authorId)}&depth=2&limit=${limit}&sort=-publishedAt`,
  );
  return data.docs;
}
