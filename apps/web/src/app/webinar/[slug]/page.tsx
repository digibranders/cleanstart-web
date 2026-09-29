import { notFound } from "next/navigation";
import Image from "next/image";
import type { Metadata } from "next";
import { Header } from "@/components/nav/Header";
import { Footer } from "@/components/sections/Footer";
import { WebinarDetailHero } from "@/components/sections/webinars/WebinarDetailHero";
import {
  getWebinarBySlug,
  getWebinarSlugs,
  type WebinarDetail,
} from "@/lib/webinars";
import { formatWebinarDate, isWebinarPast } from "@/lib/webinars-utils";
import { isLexicalBodyEmpty, mediaUrl } from "@/lib/blog";
import { RenderLexical } from "@/lib/renderLexical";
import { buildPageMetadata } from "@/lib/seo/canonical";
import { resolveCmsSeo } from "@/lib/seo/cms-seo";
import { breadcrumbSchema, breadcrumbTrail, webinarSchema } from "@/lib/seo/jsonld";
import { JsonLdGraph } from "@/components/JsonLdGraph";
import { buildPageGraph, seoOverride } from "@/lib/seo/compose-page";

interface WebinarDetailPageProps {
  params: Promise<{ slug: string }>;
}

// Slugs not returned here still render on first request, then cache (ISR).
export const dynamicParams = true;

/** Pre-render every published webinar; degrade to on-demand if CMS is down at build. */
export async function generateStaticParams(): Promise<Array<{ slug: string }>> {
  try {
    return (await getWebinarSlugs()).map((slug) => ({ slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({
  params,
}: WebinarDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const webinar = await getWebinarBySlug(slug).catch(() => null);
  if (!webinar) {
    return buildPageMetadata({
      title: "Webinar",
      description: "CleanStart webinar.",
      path: `/webinar/${slug}`,
      noindex: true,
    });
  }

  const heroAbsolute = mediaUrl(webinar.heroImage?.url);
  const seo = resolveCmsSeo(webinar.seo, { absolutize: mediaUrl });

  return buildPageMetadata({
    title: seo.title ?? webinar.title,
    description:
      seo.description ?? webinar.abstract ?? `Watch the CleanStart webinar: ${webinar.title}.`,
    path: `/webinar/${webinar.slug}`,
    eyebrow: "Webinar",
    ...(seo.noindex ? { noindex: true, nofollow: seo.nofollow } : {}),
    ...(seo.canonicalUrl ? { canonicalUrl: seo.canonicalUrl } : {}),
    ...(seo.image
      ? { image: seo.image }
      : heroAbsolute && webinar.heroImage
        ? {
            image: {
              url: heroAbsolute,
              width: webinar.heroImage.width,
              height: webinar.heroImage.height,
              alt: webinar.heroImage.alt ?? webinar.title,
            },
          }
        : {}),
  });
}

/**
 * The one action worth offering, and its label.
 *
 * Registration only applies while a scheduled webinar is still ahead of us.
 * Once it has run, the recording is the thing a visitor wants, so a live
 * session with a recording flips to watching it, and an on-demand webinar is
 * never "upcoming" in the first place.
 *
 * `registrationMode: 'internal'` (a CMS-hosted form) has no inline form yet, so
 * it deliberately yields no CTA rather than a button that goes nowhere. No
 * published webinar uses it today; all three register through an external host.
 */
function primaryAction(
  webinar: WebinarDetail,
  isPast: boolean,
): { href: string; label: string } | null {
  const recording = webinar.recordingUrl?.trim();
  if (recording) return { href: recording, label: "Watch the recording" };

  if (isPast || webinar.eventStatus !== "scheduled") return null;

  const registration =
    webinar.registrationMode === "external" ? webinar.registrationUrl?.trim() : undefined;
  return registration ? { href: registration, label: "Register" } : null;
}

export async function renderWebinarDetail({
  slug,
}: {
  slug: string;
}): Promise<React.ReactElement> {
  const webinar = await getWebinarBySlug(slug);
  if (!webinar) notFound();

  const heroImg = mediaUrl(webinar.heroImage?.url);
  const longDate = formatWebinarDate(webinar.startsAt, webinar.timezone);
  const isPast = isWebinarPast(webinar, Date.now());
  const action = primaryAction(webinar, isPast);
  const slides = webinar.slidesUrl?.trim();

  return (
    <>
      <JsonLdGraph
        id={`webinar-jsonld-${webinar.slug}`}
        graph={buildPageGraph({
          nodes: [
            breadcrumbSchema(breadcrumbTrail("webinar", { title: webinar.title })),
            webinarSchema({
              title: webinar.title,
              path: `/webinar/${webinar.slug}`,
              startDate: webinar.startsAt,
              endDate: webinar.endsAt,
              description: webinar.abstract,
              eventStatus: webinar.eventStatus,
              registrationUrl: webinar.registrationUrl,
              ...(heroImg ? { imageUrl: heroImg } : {}),
            }),
          ],
          override: seoOverride(webinar.seo),
        })}
      />
      <Header />
      <main id="main-content" style={{ background: "#f6f6f6" }}>
        <WebinarDetailHero
          title={webinar.title}
          webinarType={webinar.webinarType}
          region={webinar.region}
          longDate={longDate}
          eventStatus={webinar.eventStatus}
          isPast={isPast}
        />

        {(heroImg || action) && (
          <section
            className="relative mx-auto max-w-[820px] px-6"
            style={{ paddingTop: "64px" }}
          >
            {heroImg && webinar.heroImage?.width && webinar.heroImage?.height && (
              <div
                className="relative overflow-hidden mx-auto"
                style={{ borderRadius: "16px", background: "rgba(0,0,0,0.05)" }}
              >
                <Image
                  src={heroImg}
                  alt={webinar.heroImage?.alt ?? webinar.title}
                  width={webinar.heroImage.width}
                  height={webinar.heroImage.height}
                  className="w-full h-auto block"
                  sizes="(max-width: 820px) 100vw, 820px"
                  priority
                />
              </div>
            )}

            {action && (
              <div className="flex justify-center" style={{ marginTop: "32px" }}>
                <a
                  href={action.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="cs-btn-blue gap-2"
                  style={{
                    minWidth: "180px",
                    height: "48px",
                    padding: "0 24px",
                    fontSize: "1rem",
                  }}
                >
                  {action.label}
                </a>
              </div>
            )}
          </section>
        )}

        <section
          className="relative mx-auto max-w-[820px] px-6"
          style={{ paddingTop: "80px", paddingBottom: "120px" }}
        >
          {isLexicalBodyEmpty(webinar.body) ? (
            webinar.abstract && (
              <div className="article-body">
                <p className="article-paragraph">{webinar.abstract}</p>
              </div>
            )
          ) : (
            <div className="article-body">
              <RenderLexical content={webinar.body} />
            </div>
          )}

          {slides && (
            <div className="article-body" style={{ marginTop: "32px" }}>
              <p className="article-paragraph">
                <a
                  href={slides}
                  target="_blank"
                  rel="noopener noreferrer"
                  // Matches the anchor styling RenderLexical applies inside
                  // .article-body, which is inline rather than a class.
                  style={{
                    color: "#4a3bf1",
                    textDecoration: "underline",
                    textUnderlineOffset: "3px",
                  }}
                >
                  Download the slides
                </a>
              </p>
            </div>
          )}
        </section>
      </main>
      <Footer />
    </>
  );
}

export default async function WebinarDetailPage({
  params,
}: WebinarDetailPageProps): Promise<React.ReactElement> {
  const { slug } = await params;
  return renderWebinarDetail({ slug });
}
