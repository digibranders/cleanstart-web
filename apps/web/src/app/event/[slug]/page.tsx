import { notFound } from "next/navigation";
import Image from "next/image";
import type { Metadata } from "next";
import { Header } from "@/components/nav/Header";
import { Footer } from "@/components/sections/Footer";
import { EventDetailHero } from "@/components/sections/events/EventDetailHero";
import { EventDetailMobileCard } from "@/components/sections/events/EventDetailMobileCard";
import {
  formatEventDate,
  getEventBySlug,
  getEventBySlugDraft,
  getEventSlugs,
  type EventCountry,
} from "@/lib/events";
import { mediaUrl } from "@/lib/blog";
import { RenderLexical } from "@/lib/renderLexical";
import { buildPageMetadata } from "@/lib/seo/canonical";
import { resolveCmsSeo } from "@/lib/seo/cms-seo";
import { JsonLd, breadcrumbSchema, eventSchema } from "@/lib/seo/jsonld";

interface EventDetailPageProps {
  params: Promise<{ slug: string }>;
}

// Slugs not returned here still render on first request, then cache (ISR).
export const dynamicParams = true;

/** Pre-render every published event; degrade to on-demand if CMS is down at build. */
export async function generateStaticParams(): Promise<Array<{ slug: string }>> {
  try {
    return (await getEventSlugs()).map((slug) => ({ slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({
  params,
}: EventDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const event = await getEventBySlug(slug).catch(() => null);
  if (!event) {
    return buildPageMetadata({
      title: "Event",
      description: "CleanStart event.",
      path: `/event/${slug}`,
      noindex: true,
    });
  }

  const heroAbsolute = mediaUrl(event.heroImage?.url);
  const seo = resolveCmsSeo(event.seo, { absolutize: mediaUrl });

  return buildPageMetadata({
    title: seo.title ?? event.title,
    description:
      seo.description ??
      event.abstract ??
      `Join CleanStart at ${event.title}${event.venue ? `, ${event.venue}` : ""}.`,
    path: `/event/${event.slug}`,
    eyebrow: "Event",
    ...(seo.noindex ? { noindex: true, nofollow: seo.nofollow } : {}),
    ...(seo.canonicalUrl ? { canonicalUrl: seo.canonicalUrl } : {}),
    ...(seo.image
      ? { image: seo.image }
      : heroAbsolute && event.heroImage
        ? {
            image: {
              url: heroAbsolute,
              width: event.heroImage.width,
              height: event.heroImage.height,
              alt: event.heroImage.alt ?? event.title,
            },
          }
        : {}),
  });
}

// Event country enum → ISO 3166-1 alpha-2 for the schema PostalAddress.
const COUNTRY_ISO: Record<EventCountry, string> = {
  india: "IN",
  "united-states": "US",
  uae: "AE",
  thailand: "TH",
};

export async function renderEventDetail({
  slug,
  draft = false,
}: {
  slug: string;
  draft?: boolean;
}): Promise<React.ReactElement> {
  const event = draft ? await getEventBySlugDraft(slug) : await getEventBySlug(slug);
  if (!event) notFound();

  const heroImg = mediaUrl(event.heroImage?.url);
  const longDate = formatEventDate(
    event.startsAt,
    event.timezone,
    event.customDateLabel,
    "long",
  );
  const isPast =
    !!event.startsAt && new Date(event.startsAt).getTime() < Date.now();
  const isCancelled = event.eventStatus === "cancelled";
  const registerHref =
    event.registrationMode === "external" ? event.registrationUrl ?? null : null;
  const showRegisterCta =
    !isPast && !isCancelled && event.eventStatus === "scheduled" && !!registerHref;
  const registerLabel =
    event.ctaLabel && event.ctaLabel.trim().length > 0
      ? event.ctaLabel.trim()
      : "Register";
  const postCtaEnabled = event.postEventCta?.enabled === true;
  const postCtaLabel = event.postEventCta?.label?.trim() ?? "";
  const postCtaUrl = event.postEventCta?.url?.trim() ?? "";
  const showPostEventCta =
    isPast &&
    !isCancelled &&
    postCtaEnabled &&
    postCtaLabel.length > 0 &&
    postCtaUrl.length > 0;

  return (
    <>
      <JsonLd
        id={`event-breadcrumbs-${event.slug}`}
        data={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Events", path: "/events" },
          { name: event.title },
        ])}
      />
      <JsonLd
        id={`event-schema-${event.slug}`}
        data={eventSchema({
          title: event.title,
          path: `/event/${event.slug}`,
          startDate: event.startsAt,
          endDate: event.endsAt,
          venue: event.venue,
          addressCountry: event.country ? COUNTRY_ISO[event.country] : undefined,
          description: event.abstract,
          eventStatus: event.eventStatus,
          previousStartDate: event.previousStartDate,
          imageUrl: event.heroImage?.url ? mediaUrl(event.heroImage.url) : undefined,
        })}
      />
      <Header />
      <main id="main-content" style={{ background: "#f6f6f6" }}>
        {/* Mobile: compact card-style layout. */}
        <EventDetailMobileCard
          title={event.title}
          slug={event.slug}
          venue={event.venue}
          longDate={longDate}
          shortDate={formatEventDate(
            event.startsAt,
            event.timezone,
            event.customDateLabel,
            "short",
          )}
          abstract={event.abstract ?? null}
          heroImageUrl={heroImg ?? null}
          heroImageAlt={event.heroImage?.alt ?? null}
          heroImageWidth={event.heroImage?.width ?? null}
          heroImageHeight={event.heroImage?.height ?? null}
          isPast={isPast}
          eventStatus={event.eventStatus}
        />

        {/* Desktop: hero + image + body layout. */}
        <div className="hidden lg:block">
          <EventDetailHero
            title={event.title}
            venue={event.venue}
            longDate={longDate}
            eventStatus={event.eventStatus}
            isPast={isPast}
          />
        </div>

        {(heroImg || showRegisterCta || showPostEventCta) && (
          <section className="relative mx-auto max-w-[820px] px-6 hidden lg:block" style={{ paddingTop: "64px" }}>
            {heroImg && event.heroImage?.width && event.heroImage?.height && (
              <div
                className="relative overflow-hidden mx-auto"
                style={{
                  borderRadius: "16px",
                  background: "rgba(0,0,0,0.05)",
                }}
              >
                <Image
                  src={heroImg}
                  alt={event.heroImage?.alt ?? event.title}
                  width={event.heroImage.width}
                  height={event.heroImage.height}
                  className="w-full h-auto block"
                  sizes="(max-width: 820px) 100vw, 820px"
                  priority
                />
              </div>
            )}

            {showRegisterCta && registerHref && (
              <div className="flex justify-center" style={{ marginTop: "32px" }}>
                <a
                  href={registerHref}
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
                  {registerLabel}
                </a>
              </div>
            )}

            {showPostEventCta && (
              <div className="flex justify-center" style={{ marginTop: "32px" }}>
                <a
                  href={postCtaUrl}
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
                  {postCtaLabel}
                </a>
              </div>
            )}
          </section>
        )}

        <section
          className="relative mx-auto max-w-[820px] px-6"
          style={{ paddingTop: "80px", paddingBottom: "120px" }}
        >
          {event.body && (
            <div className="article-body">
              <RenderLexical content={event.body} />
            </div>
          )}
        </section>
      </main>
      <Footer />
    </>
  );
}

export default async function EventDetailPage({
  params,
}: EventDetailPageProps): Promise<React.ReactElement> {
  const { slug } = await params;
  return renderEventDetail({ slug });
}
