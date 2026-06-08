import { KnowledgeHubArticle } from '@/components/sections/knowledge-hub/KnowledgeHubArticle';
import { getKnowledgeArticle, getKnowledgeArticleSlugs } from '@/lib/knowledge-hub';
import { buildPageMetadata } from '@/lib/seo/canonical';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

export async function generateStaticParams(): Promise<Array<{ slug: string }>> {
  const slugs = await getKnowledgeArticleSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = await getKnowledgeArticle(slug);
  if (!article) {
    return buildPageMetadata({
      title: 'Knowledge Hub',
      description: 'CleanStart Knowledge Hub.',
      path: '/knowledge-hub',
    });
  }
  return buildPageMetadata({
    title: article.title,
    description: article.abstract ?? `${article.title} — CleanStart Knowledge Hub.`,
    path: `/knowledge-hub/${slug}`,
    eyebrow: 'Guide',
    type: 'article',
  });
}

export default async function KnowledgeHubArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<React.ReactElement> {
  const { slug } = await params;
  const article = await getKnowledgeArticle(slug);
  if (!article) {
    notFound();
  }

  return <KnowledgeHubArticle article={article} />;
}
