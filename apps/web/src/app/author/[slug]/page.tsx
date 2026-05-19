import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type React from "react";

import { Header } from "@/components/sections/Header";
import { Footer } from "@/components/sections/Footer";
import { AuthorHero } from "@/components/sections/author/AuthorHero";
import { AuthorBio } from "@/components/sections/author/AuthorBio";
import { AuthorDetails } from "@/components/sections/author/AuthorDetails";
import { AuthorPosts } from "@/components/sections/author/AuthorPosts";
import { BlogDetailCTA } from "@/components/sections/blog/BlogDetailCTA";
import { getAuthorBySlug, getPostsByAuthor } from "@/lib/authors";
import { mediaUrl } from "@/lib/blog";
import { buildPageMetadata } from "@/lib/seo/canonical";

interface AuthorPageProps {
  params: Promise<{ slug: string }>;
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
  const description =
    author.bioShort ??
    `${author.name}${author.role ? `, ${author.role}` : ""} at CleanStart.`;

  return buildPageMetadata({
    title: `${author.name}${author.role ? ` — ${author.role}` : ""}`,
    description,
    path: `/author/${author.slug}`,
    ...(photoAbsolute && author.photo
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

  const posts = await getPostsByAuthor(author.id, { limit: 6 });

  return (
    <>
      <Header />
      <main>
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
