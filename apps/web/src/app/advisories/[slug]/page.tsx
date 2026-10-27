import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { breadcrumbTrail } from "@cleanstart/schema/builders";
import { getAdvisoryBySlug, getAdvisoryBySlugDraft, getAdvisorySlugs } from "@/lib/advisory";
import { advisoryHeading, advisoryStatusLabel, cvssRating, type CvssRating } from "@/lib/advisory-utils";
import { ADVISORIES_SECTION, mediaUrl } from "@/lib/blog-utils";
import type { LexicalRoot } from "@/lib/blog";
import { highlightLexical } from "@/lib/highlightLexical";
import { RenderLexical } from "@/lib/renderLexical";
import { Header } from "@/components/nav/Header";
import { DetailHero } from "@/components/sections/_shared/DetailHero";
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
    ogTitle: advisory.title,
    ogAdvisory: {
      cvssScore: advisory.cvssScore,
      status: advisory.fixStatus,
      technology: advisory.technology,
      cves: advisory.cves,
    },
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

/** Chip colours on the dark hero: translucent tint, light text, matching hairline. */
const SEVERITY_CHIP: Record<CvssRating, { color: string; background: string; border: string }> = {
  Critical: { color: "#FECACA", background: "rgba(239,68,68,0.20)", border: "rgba(248,113,113,0.45)" },
  High: { color: "#FED7AA", background: "rgba(249,115,22,0.20)", border: "rgba(251,146,60,0.45)" },
  Medium: { color: "#FDE68A", background: "rgba(245,158,11,0.18)", border: "rgba(251,191,36,0.40)" },
  Low: { color: "#BBF7D0", background: "rgba(34,197,94,0.18)", border: "rgba(74,222,128,0.40)" },
  None: { color: "#E5E7EB", background: "rgba(255,255,255,0.12)", border: "rgba(255,255,255,0.25)" },
};

const NEUTRAL_CHIP = { color: "#FFFFFF", background: "rgba(255,255,255,0.12)", border: "rgba(255,255,255,0.25)" };

function HeroChip({
  tone,
  children,
}: {
  tone: { color: string; background: string; border: string };
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <span
      className="inline-flex items-center gap-1.5 whitespace-nowrap font-sans font-medium"
      style={{
        padding: "6px 14px",
        borderRadius: "30px",
        fontSize: "var(--fs-body-sm)",
        color: tone.color,
        background: tone.background,
        border: `1px solid ${tone.border}`,
      }}
    >
      {children}
    </span>
  );
}

const hasContent = (content: LexicalRoot | null | undefined): content is LexicalRoot =>
  Boolean(content?.root?.children?.length);

/** A heading plus its rich text, for advisories that still keep the old three-box layout. */
function AdvisorySection({ heading, content }: { heading: string; content: LexicalRoot | null | undefined }): React.ReactElement | null {
  if (!hasContent(content)) return null;
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
  // Advisories written before the single content box keep their three sections.
  const legacy = hasContent(impact) || hasContent(resolution);

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
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2.5">
              <HeroChip tone={SEVERITY_CHIP[cvssRating(advisory.cvssScore)]}>
                CVSS {advisory.cvssScore.toFixed(1)}
                <span className="font-semibold">{cvssRating(advisory.cvssScore)}</span>
              </HeroChip>
              <HeroChip tone={NEUTRAL_CHIP}>{advisoryStatusLabel(advisory.fixStatus)}</HeroChip>
              <HeroChip tone={NEUTRAL_CHIP}>
                Published
                <time dateTime={publishedAt}>{formatLongDate(publishedAt)}</time>
              </HeroChip>
            </div>
          }
        />

        <div className="bg-white">
          <div className="relative mx-auto max-w-[1120px] px-6">
            <div
              className="mx-auto lg:mx-0 w-full max-w-[988px] flex flex-col pt-10 lg:pt-14"
              style={{ gap: "clamp(32px, 4vw, 48px)", paddingBottom: "var(--spacing-section-cta)" }}
            >
              {legacy ? (
                <AdvisorySection heading="Vulnerability" content={body} />
              ) : hasContent(body) ? (
                <section className="article-body">
                  <RenderLexical content={body} />
                </section>
              ) : null}
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
