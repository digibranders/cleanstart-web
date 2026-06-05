import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type React from "react";

import { Header } from "@/components/nav/Header";
import { Footer } from "@/components/sections/Footer";
import { AuthorHero } from "@/components/sections/author/AuthorHero";
import { AuthorBio } from "@/components/sections/author/AuthorBio";
import { BlogDetailCTA } from "@/components/sections/blog/BlogDetailCTA";
import { getAuthorBySlug } from "@/lib/authors";
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
    title: `${author.name}${author.role ? `, ${author.role}` : ""}`,
    description,
    path: `/author/${author.slug}`,
    eyebrow: author.role ?? "Team",
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

  return (
    <>
      <Header />
      <main>
        <AuthorHero author={author} />
        <AuthorBio author={author} />
      </main>
      <Footer cta={<BlogDetailCTA />} />
    </>
  );
}
