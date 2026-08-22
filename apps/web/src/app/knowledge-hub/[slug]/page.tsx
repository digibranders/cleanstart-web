import { KnowledgeHubArticle } from '@/components/sections/knowledge-hub/KnowledgeHubArticle';
import { mediaUrl } from '@/lib/blog';
import { getKnowledgeArticle, getKnowledgeArticleSlugs } from '@/lib/knowledge-hub';
import { buildPageMetadata } from '@/lib/seo/canonical';
import { resolveCmsSeo } from '@/lib/seo/cms-seo';
import { ogImageUrl } from '@/lib/seo/og';
import {
  articleSchema,
  breadcrumbSchema,
  breadcrumbTrail,
  faqPageSchema,
  videoObjectSchema,
} from '@/lib/seo/jsonld';
import { lexicalToPlainText } from '@/lib/renderLexical';
import { JsonLdGraph } from '@/components/JsonLdGraph';
import { buildPageGraph, seoOverride } from '@/lib/seo/compose-page';
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
    ...(seo.noindex ? { noindex: true, nofollow: seo.nofollow } : {}),
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

  // Article structured data requires an image. KB articles have no cover-image
  // field, so use the editor's OG image when set, else the generated 1200x630
  // OG card — guaranteeing every article carries a valid representative image.
  const seo = resolveCmsSeo(article.seo, { absolutize: mediaUrl });
  const articleImage =
    seo.image?.url ??
    ogImageUrl({
      title: article.title,
      eyebrow: article.category?.name ?? 'Knowledge Hub',
      sub: article.abstract ?? undefined,
    });

  const crumbs = breadcrumbTrail("knowledgeBase", { title: article.title });

  return (
    <>
      <JsonLdGraph
        id={`kb-jsonld-${article.slug}`}
        graph={buildPageGraph({
          nodes: [
            breadcrumbSchema(crumbs),
            articleSchema({
              title: article.title,
              description: article.abstract ?? undefined,
              path: `/knowledge-hub/${article.slug}`,
              publishedAt: article.publishedAt ?? undefined,
              modifiedAt: article.updatedAt ?? undefined,
              imageUrl: articleImage,
              type: article.category?.name,
            }),
            ...(article.videoUrl
              ? [
                  videoObjectSchema({
                    name: article.title,
                    description: article.abstract ?? undefined,
                    contentUrl: article.videoUrl,
                    uploadDate: article.publishedAt ?? undefined,
                    thumbnailUrl: articleImage,
                    embedPath: `/knowledge-hub/${article.slug}`,
                  }),
                ]
              : []),
            ...(() => {
              const validFaqs = (article.faqs ?? [])
                .map((f) => ({ question: f.question?.trim() ?? '', answer: lexicalToPlainText(f.answer) }))
                .filter((f) => f.question.length > 0 && f.answer.length > 0);
              return validFaqs.length > 0 ? [faqPageSchema(validFaqs)] : [];
            })(),
          ],
          override: seoOverride(article.seo),
        })}
      />
      <KnowledgeHubArticle article={article} />
    </>
  );
}
