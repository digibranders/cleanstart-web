import { KnowledgeHubArticle } from '@/components/sections/knowledge-hub/KnowledgeHubArticle';
import { mediaUrl } from '@/lib/blog';
import { getKnowledgeArticle, getKnowledgeArticleSlugs } from '@/lib/knowledge-hub';
import { buildPageMetadata } from '@/lib/seo/canonical';
import { resolveCmsSeo } from '@/lib/seo/cms-seo';
import {
  JsonLd,
  articleSchema,
  breadcrumbSchema,
  videoObjectSchema,
} from '@/lib/seo/jsonld';
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
      path: `/knowledge-hub/${slug}`,
      noindex: true,
    });
  }

  const seo = resolveCmsSeo(article.seo, { absolutize: mediaUrl });

  return buildPageMetadata({
    title: seo.title ?? article.title,
    description:
      seo.description ??
      article.abstract ??
      `${article.title} — CleanStart Knowledge Hub.`,
    path: `/knowledge-hub/${slug}`,
    eyebrow: article.category?.name ?? 'Knowledge Hub',
    type: 'article',
    publishedTime: article.publishedAt ?? undefined,
    modifiedTime: article.updatedAt ?? undefined,
    ...(seo.noindex ? { noindex: true } : {}),
    ...(seo.canonicalUrl ? { canonicalUrl: seo.canonicalUrl } : {}),
    ...(seo.image ? { image: seo.image } : {}),
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

  const crumbs = [
    { name: 'Home', path: '/' },
    { name: 'Knowledge Hub', path: '/knowledge-hub' },
    ...(article.category?.name
      ? [{ name: article.category.name }]
      : []),
    { name: article.title },
  ];

  return (
    <>
      <JsonLd
        id={`kb-breadcrumbs-${article.slug}`}
        data={breadcrumbSchema(crumbs)}
      />
      <JsonLd
        id={`kb-article-${article.slug}`}
        data={articleSchema({
          title: article.title,
          description: article.abstract ?? undefined,
          path: `/knowledge-hub/${article.slug}`,
          publishedAt: article.publishedAt ?? undefined,
          modifiedAt: article.updatedAt ?? undefined,
          type: article.category?.name,
        })}
      />
      {article.videoUrl && (
        <JsonLd
          id={`kb-video-${article.slug}`}
          data={videoObjectSchema({
            name: article.title,
            description: article.abstract ?? undefined,
            contentUrl: article.videoUrl,
            uploadDate: article.publishedAt ?? undefined,
            embedPath: `/knowledge-hub/${article.slug}`,
          })}
        />
      )}
      <KnowledgeHubArticle article={article} />
    </>
  );
}
