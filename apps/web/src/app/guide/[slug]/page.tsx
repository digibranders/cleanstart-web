import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Header } from "@/components/nav/Header";
import { Footer } from "@/components/sections/Footer";
import { FadeUp } from "@/components/ui/FadeUp";
import { Section, Container } from "@/components/layout";
import { DetailHero } from "@/components/sections/_shared/DetailHero";
import { RenderLexical } from "@/lib/renderLexical";
import { highlightLexical } from "@/lib/highlightLexical";
import { mediaUrl } from "@/lib/blog";
import { getGuideBySlug, getGuideBySlugDraft } from "@/lib/guides";
import { buildPageMetadata } from "@/lib/seo/canonical";
import { resolveCmsSeo } from "@/lib/seo/cms-seo";
import {
  JsonLd,
  articleSchema,
  breadcrumbSchema,
  faqPageSchema,
} from "@/lib/seo/jsonld";

interface GuideDetailPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: GuideDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const guide = await getGuideBySlug(slug).catch(() => null);
  if (!guide) {
    return buildPageMetadata({
      title: "Guide",
      description: "CleanStart guide.",
      path: `/guide/${slug}`,
      noindex: true,
    });
  }

  const heroAbsolute = mediaUrl(guide.heroImage?.url);
  const seo = resolveCmsSeo(guide.seo, { absolutize: mediaUrl });

  return buildPageMetadata({
    title: seo.title ?? guide.title,
    eyebrow: "Guide",
    description:
      seo.description ??
      guide.abstract ??
      "In-depth guides on container security, compliance, and software supply-chain integrity from CleanStart.",
    path: `/guide/${guide.slug}`,
    type: "article",
    publishedTime: guide.publishedAt ?? undefined,
    modifiedTime: guide.updatedAt ?? undefined,
    authors: guide.authors?.map((a) => a.name),
    ...(seo.noindex ? { noindex: true } : {}),
    ...(seo.canonicalUrl ? { canonicalUrl: seo.canonicalUrl } : {}),
    ...(seo.image
      ? { image: seo.image }
      : heroAbsolute && guide.heroImage
        ? {
            image: {
              url: heroAbsolute,
              width: guide.heroImage.width,
              height: guide.heroImage.height,
              alt: guide.heroImage.alt ?? guide.title,
            },
          }
        : {}),
  });
}

export async function renderGuideDetail({
  slug,
  draft = false,
}: {
  slug: string;
  draft?: boolean;
}): Promise<React.ReactElement> {
  const guide = draft
    ? await getGuideBySlugDraft(slug).catch(() => null)
    : await getGuideBySlug(slug).catch(() => null);
  if (!guide) notFound();

  const highlightedBody = await highlightLexical(guide.body ?? null);
  const heroAbsolute = mediaUrl(guide.heroImage?.url);
  const faqs = (guide.faqs ?? []).filter((f) => f.question && f.answer);

  return (
    <>
      <JsonLd
        id={`guide-breadcrumbs-${guide.slug}`}
        data={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Knowledge Hub", path: "/knowledge-hub" },
          { name: guide.title },
        ])}
      />
      <JsonLd
        id={`guide-article-${guide.slug}`}
        data={articleSchema({
          title: guide.title,
          description: guide.abstract ?? undefined,
          path: `/guide/${guide.slug}`,
          publishedAt: guide.publishedAt ?? undefined,
          modifiedAt: guide.updatedAt ?? undefined,
          imageUrl: heroAbsolute,
        })}
      />
      {faqs.length > 0 ? (
        <JsonLd
          id={`guide-faq-${guide.slug}`}
          data={faqPageSchema(
            faqs.map((f) => ({ question: f.question, answer: f.answer })),
          )}
        />
      ) : null}
      <Header />
      <main>
        <DetailHero
          breadcrumb={[
            { label: "Home", href: "/" },
            { label: "Knowledge Hub", href: "/knowledge-hub" },
            { label: guide.title },
          ]}
          title={guide.title}
        />

        <FadeUp>
          <Section padding="lg">
            <Container variant="prose">
              <div className="article-body">
                <RenderLexical content={highlightedBody} />
              </div>

              {faqs.length > 0 ? (
                <section className="mt-16">
                  <h2
                    className="mb-6 font-semibold text-cs-text-dark"
                    style={{ fontSize: "var(--fs-h2)" }}
                  >
                    Frequently asked questions
                  </h2>
                  <dl>
                    {faqs.map((f, i) => (
                      <div key={f.id ?? `${guide.slug}-faq-${i}`} className="mb-8">
                        <dt
                          className="mb-2 font-semibold text-cs-text-dark"
                          style={{ fontSize: "var(--fs-h4)" }}
                        >
                          {f.question}
                        </dt>
                        <dd
                          className="text-black/70"
                          style={{ fontSize: "var(--fs-body)" }}
                        >
                          {f.answer}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </section>
              ) : null}
            </Container>
          </Section>
        </FadeUp>
      </main>
      <Footer />
    </>
  );
}

export default async function GuideDetailPage({
  params,
}: GuideDetailPageProps): Promise<React.ReactElement> {
  const { slug } = await params;
  return renderGuideDetail({ slug });
}
