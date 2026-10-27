import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { breadcrumbTrail } from "@cleanstart/schema/builders";
import { getAdvisoryBySlug, getAdvisoryBySlugDraft, getAdvisorySlugs } from "@/lib/advisory";
import { advisoryHeading, cvssRating } from "@/lib/advisory-utils";
import { ADVISORIES_SECTION, mediaUrl } from "@/lib/blog-utils";
import type { LexicalRoot } from "@/lib/blog";
import { highlightLexical } from "@/lib/highlightLexical";
import { RenderLexical } from "@/lib/renderLexical";
import { Header } from "@/components/nav/Header";
import { DetailHero, DetailHeroMetaSeparator } from "@/components/sections/_shared/DetailHero";
import { BlogDetailCTA } from "@/components/sections/blog/BlogDetailCTA";
import { Footer } from "@/components/sections/Footer";
import { buildPageMetadata } from "@/lib/seo/canonical";
import { resolveCmsSeo } from "@/lib/seo/cms-seo";
import { effectiveModifiedAt, effectivePublishedAt } from "@/lib/published-date";
import { articleSchema, breadcrumbSchema } from "@/lib/seo/jsonld";
import { JsonLdGraph } from "@/components/JsonLdGraph";
import { buildPageGraph, seoOverride } from "@/lib/seo/compose-page";

interface AdvisoryDetailPageProps {
  params: Promise<{ slug: string }>;
}

const { basePath } = ADVISORIES_SECTION;

// Slugs not returned here still render on first request, then cache (ISR).
export const dynamicParams = true;

export async function generateStaticParams(): Promise<Array<{ slug: string }>> {
  try {
    const slugs = await getAdvisorySlugs();
    return slugs.map((slug) => ({ slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: AdvisoryDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const advisory = await getAdvisoryBySlug(slug);
  if (!advisory) {
    return buildPageMetadata({
      title: "Security advisory",
      description: "CleanStart security advisory.",
      path: `${basePath}/${slug}`,
      noindex: true,
    });
  }

  const seo = resolveCmsSeo(advisory.seo, { absolutize: mediaUrl });
  return buildPageMetadata({
    title: seo.title ?? advisoryHeading(advisory),
    description:
      seo.description ??
      advisory.abstract ??
      `${advisoryHeading(advisory)}. CVSS ${advisory.cvssScore} ${cvssRating(advisory.cvssScore)}: affected versions and how to fix it.`,
    path: `${basePath}/${advisory.slug}`,
    eyebrow: "Advisory",
    type: "article",
    publishedTime: effectivePublishedAt(advisory) ?? advisory.publishedAt,
    modifiedTime: effectiveModifiedAt(advisory),
    ...(seo.noindex ? { noindex: true, nofollow: seo.nofollow } : {}),
    ...(seo.canonicalUrl ? { canonicalUrl: seo.canonicalUrl } : {}),
    ...(seo.image ? { image: seo.image } : {}),
  });
}

function formatLongDate(iso: string | undefined): string {
  return iso
    ? new Date(iso).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
    : "";
}

function AdvisorySection({ heading, content }: { heading: string; content: LexicalRoot | null | undefined }): React.ReactElement | null {
  if (!content?.root?.children?.length) return null;
  return (
    <section className="article-body">
      <h2 className="article-h2">{heading}</h2>
      <RenderLexical content={content} />
    </section>
  );
}

export async function renderAdvisoryDetail({
  slug,
  draft = false,
}: {
  slug: string;
  draft?: boolean;
}): Promise<React.ReactElement> {
  const advisory = draft ? await getAdvisoryBySlugDraft(slug) : await getAdvisoryBySlug(slug);
  if (!advisory) notFound();

  const heading = advisoryHeading(advisory);
  const publishedAt = effectivePublishedAt(advisory);
  const [body, impact, resolution] = await Promise.all([
    highlightLexical(advisory.body),
    highlightLexical(advisory.impact),
    highlightLexical(advisory.resolution),
  ]);

  const metaLabel: React.CSSProperties = { color: "rgba(255,255,255,0.65)" };
  return (
    <>
      <JsonLdGraph
        id={`advisory-jsonld-${advisory.slug}`}
        graph={buildPageGraph({
          nodes: [
            breadcrumbSchema(breadcrumbTrail("advisory", { title: heading })),
            articleSchema({
              title: heading,
              description: advisory.abstract ?? undefined,
              path: `${basePath}/${advisory.slug}`,
              publishedAt,
              modifiedAt: effectiveModifiedAt(advisory),
              type: "Security advisory",
            }),
          ],
          override: seoOverride(advisory.seo),
        })}
      />
      <Header />
      <main id="main-content">
        <DetailHero
          breadcrumb={breadcrumbTrail("advisory", { title: heading }).slice(1)}
          title={heading}
          meta={
            <div
              className="flex flex-wrap items-center justify-center lg:justify-start gap-x-4 gap-y-2 font-sans text-white"
              style={{ fontSize: "var(--fs-body)" }}
            >
              <span>
                <span style={metaLabel}>CVSS: </span>
                <strong className="font-semibold">
                  {advisory.cvssScore.toFixed(1)} {cvssRating(advisory.cvssScore)}
                </strong>
              </span>
              <DetailHeroMetaSeparator />
              <span>
                <span style={metaLabel}>Published: </span>
                <time dateTime={publishedAt}>{formatLongDate(publishedAt)}</time>
              </span>
            </div>
          }
        />

        <div className="bg-white">
          <div className="relative mx-auto max-w-[1120px] px-6">
            <div
              className="mx-auto lg:mx-0 w-full max-w-[988px] flex flex-col pt-10 lg:pt-14"
              style={{ gap: "clamp(32px, 4vw, 48px)", paddingBottom: "var(--spacing-section-cta)" }}
            >
              <AdvisorySection heading="Vulnerability" content={body} />
              <AdvisorySection heading="Impacted packages and versions" content={impact} />
              <AdvisorySection heading="Resolution" content={resolution} />
            </div>
          </div>
        </div>
      </main>

      <Footer cta={<BlogDetailCTA />} />
    </>
  );
}

export default async function AdvisoryDetailPage({
  params,
}: AdvisoryDetailPageProps): Promise<React.ReactElement> {
  const { slug } = await params;
  return renderAdvisoryDetail({ slug });
}
