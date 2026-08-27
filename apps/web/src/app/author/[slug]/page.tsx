import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type React from "react";

import { Header } from "@/components/nav/Header";
import { Footer } from "@/components/sections/Footer";
import { AuthorHero } from "@/components/sections/author/AuthorHero";
import { AuthorBio } from "@/components/sections/author/AuthorBio";
import { AuthorDetails } from "@/components/sections/author/AuthorDetails";
import { AuthorPosts } from "@/components/sections/author/AuthorPosts";
import { BlogDetailCTA } from "@/components/sections/blog/BlogDetailCTA";
import { getAuthorBySlug, getAuthorSlugs, getPostsByAuthor } from "@/lib/authors";
import { mediaUrl } from "@/lib/blog";
import { buildPageMetadata } from "@/lib/seo/canonical";
import { resolveCmsSeo } from "@/lib/seo/cms-seo";
import { breadcrumbSchema, breadcrumbTrail, profilePageSchema } from "@/lib/seo/jsonld";
import { JsonLdGraph } from "@/components/JsonLdGraph";
import { buildPageGraph, seoOverride } from "@/lib/seo/compose-page";

interface AuthorPageProps {
  params: Promise<{ slug: string }>;
}

// Slugs not returned here still render on first request, then cache (ISR).
export const dynamicParams = true;

/** Pre-render every published author; degrade to on-demand if CMS is down at build. */
export async function generateStaticParams(): Promise<Array<{ slug: string }>> {
  try {
    return (await getAuthorSlugs()).map((slug) => ({ slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({
  params,
}: AuthorPageProps): Promise<Metadata> {
  const { slug } = await params;
  const author = await getAuthorBySlug(slug).catch(() => null);

  if (!author) {
    return buildPageMetadata({
      title: "Author",
      description: "CleanStart contributor profile.",
      path: `/author/${slug}`,
      noindex: true,
    });
  }

  const photoAbsolute = mediaUrl(author.photo?.url);
  // Authors carry the same `seo` group as every other content collection, but
  // this route was the only one that never read it, so a full bio shipped as
  // the meta description (457 chars on one profile). Title stays generated:
  // the editor-entered `seo.title` values are sentence-shaped ("The author, X,
  // serves as Y at CleanStart") and longer than the "Name, Role" form.
  const seo = resolveCmsSeo(author.seo, { absolutize: mediaUrl });
  const description =
    seo.description ??
    author.bioShort ??
    `${author.name}${author.role ? `, ${author.role}` : ""} at CleanStart.`;

  return buildPageMetadata({
    title: `${author.name}${author.role ? `, ${author.role}` : ""}`,
    description,
    path: `/author/${author.slug}`,
    eyebrow: author.role ?? "Team",
    ...(seo.noindex ? { noindex: true, nofollow: seo.nofollow } : {}),
    ...(seo.canonicalUrl ? { canonicalUrl: seo.canonicalUrl } : {}),
    ...(seo.image
      ? { image: seo.image }
      : photoAbsolute && author.photo
        ? {
            image: {
              url: photoAbsolute,
              width: author.photo.width,
              height: author.photo.height,
              alt: author.photo.alt ?? author.name,
            },
          }
        : {}),
  });
}

export default async function AuthorPage({
  params,
}: AuthorPageProps): Promise<React.ReactElement> {
  const { slug } = await params;
  const author = await getAuthorBySlug(slug);
  if (!author) notFound();

  const posts = await getPostsByAuthor(String(author.id), { limit: 6 });

  const photoAbsolute = mediaUrl(author.photo?.url);

  const sameAs = [
    author.social?.linkedin,
    author.social?.twitter,
    author.social?.github,
    author.social?.website,
  ].filter((u): u is string => Boolean(u));

  return (
    <>
      <JsonLdGraph
        id={`author-jsonld-${author.slug}`}
        graph={buildPageGraph({
          nodes: [
            breadcrumbSchema(breadcrumbTrail("author", { title: author.name })),
            profilePageSchema({
              name: author.name,
              slug: author.slug,
              jobTitle: author.role ?? undefined,
              imageUrl: photoAbsolute,
              description: author.bioShort ?? undefined,
              sameAs: sameAs.length > 0 ? sameAs : undefined,
            }),
          ],
          override: seoOverride(author.seo),
        })}
      />
      <Header />
      <main id="main-content">
        <AuthorHero author={author} />
        <AuthorBio author={author} />
        <AuthorDetails author={author} />
        {posts.length > 0 ? (
          <AuthorPosts posts={posts} authorName={author.name} />
        ) : (
          <div aria-hidden className="bg-white" style={{ height: "186px" }} />
        )}
      </main>
      <Footer cta={<BlogDetailCTA />} />
    </>
  );
}
