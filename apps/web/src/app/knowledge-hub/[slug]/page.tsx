import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { KnowledgeHubArticle } from "@/components/sections/knowledge-hub/KnowledgeHubArticle";
import { ARTICLE_SLUGS, getArticle } from "@/components/sections/knowledge-hub/articles";
import { buildPageMetadata } from "@/lib/seo/canonical";

export function generateStaticParams(): Array<{ slug: string }> {
  return ARTICLE_SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = getArticle(slug);
  if (!article) {
    return buildPageMetadata({
      title: "Knowledge Hub",
      description: "CleanStart Knowledge Hub.",
      path: "/knowledge-hub",
    });
  }
  return buildPageMetadata({
    title: article.title,
    description: article.lead,
    path: `/knowledge-hub/${article.slug}`,
    type: "article",
  });
}

export default async function KnowledgeHubArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<React.ReactElement> {
  const { slug } = await params;
  const article = getArticle(slug);
  if (!article) {
    notFound();
  }

  return <KnowledgeHubArticle article={article} />;
}
