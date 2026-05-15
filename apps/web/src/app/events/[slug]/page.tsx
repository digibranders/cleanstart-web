import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { Header } from "@/components/sections/Header";
import { Footer } from "@/components/sections/Footer";
import { getEventBySlug, formatEventDate } from "@/lib/events";
import { mediaUrl } from "@/lib/blog";
import { buildPageMetadata, absoluteUrl } from "@/lib/seo/canonical";
import { JsonLd, breadcrumbSchema } from "@/lib/seo/jsonld";

interface EventDetailPageProps {
  params: Promise<{ slug: string }>;
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
      path: `/events/${slug}`,
      noindex: true,
    });
  }

  const heroAbsolute = mediaUrl(event.heroImage?.url);

  return buildPageMetadata({
    title: event.title,
    description:
      event.abstract ??
      `Join CleanStart at ${event.title}${event.venue ? ` — ${event.venue}` : ""}.`,
    path: `/events/${event.slug}`,
    ...(heroAbsolute && event.heroImage
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

const SCHEMA_EVENT_STATUS: Record<string, string> = {
  scheduled: "https://schema.org/EventScheduled",
  postponed: "https://schema.org/EventPostponed",
  cancelled: "https://schema.org/EventCancelled",
};

function eventJsonLd(event: {
  title: string;
  slug: string;
  startsAt?: string | null;
  endsAt?: string | null;
  venue: string;
  abstract?: string | null;
  eventStatus: string;
  previousStartDate?: string | null;
  heroImage?: { url: string } | null;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Event",
    name: event.title,
    url: absoluteUrl(`/events/${event.slug}`),
    ...(event.startsAt ? { startDate: event.startsAt } : {}),
    ...(event.endsAt ? { endDate: event.endsAt } : {}),
    eventStatus:
      SCHEMA_EVENT_STATUS[event.eventStatus] ?? SCHEMA_EVENT_STATUS.scheduled,
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    location: {
      "@type": "Place",
      name: event.venue,
    },
    ...(event.abstract ? { description: event.abstract } : {}),
    ...(event.heroImage?.url
      ? { image: [mediaUrl(event.heroImage.url)] }
      : {}),
    ...(event.previousStartDate
      ? { previousStartDate: event.previousStartDate }
      : {}),
  };
}

export default async function EventDetailPage({
  params,
}: EventDetailPageProps): Promise<React.ReactElement> {
  const { slug } = await params;
  const event = await getEventBySlug(slug);
  if (!event) notFound();

  const heroImg = mediaUrl(event.heroImage?.url);
  const longDate = formatEventDate(
    event.startsAt,
    event.timezone,
    event.customDateLabel,
    "long",
  );
  const registerHref =
    event.registrationMode === "external" ? event.registrationUrl ?? null : null;

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
      <JsonLd id={`event-schema-${event.slug}`} data={eventJsonLd(event)} />
      <Header />
      <main style={{ background: "#f6f6f6" }}>
        <section
          className="relative overflow-hidden"
          style={{
            background:
              "linear-gradient(180deg, #151021 0%, #10123e 45%, #131e8f 75%, #471ec0 100%)",
          }}
        >
          <div
            className="relative mx-auto max-w-[1276px] px-6"
            style={{ paddingTop: "160px", paddingBottom: "80px" }}
          >
            <Link
              href="/events"
              className="inline-flex items-center text-white/80 hover:text-white"
              style={{ fontSize: "0.95rem", marginBottom: "24px", gap: "6px" }}
            >
              ← Events
            </Link>

            <h1
              className="font-display font-semibold text-white"
              style={{
                fontSize: "clamp(2rem,4vw,3.75rem)",
                lineHeight: "1.05",
                letterSpacing: "-0.04em",
                maxWidth: "900px",
              }}
            >
              {event.title}
            </h1>

            <div
              className="flex flex-wrap items-center text-white/85"
              style={{ marginTop: "24px", gap: "24px", fontSize: "1rem" }}
            >
              {longDate && <span>📅 {longDate}</span>}
              <span>📍 {event.venue}</span>
              {event.eventStatus !== "scheduled" && (
                <span
                  className="uppercase tracking-wider"
                  style={{
                    fontSize: "0.75rem",
                    padding: "4px 10px",
                    borderRadius: "999px",
                    background: "rgba(255,255,255,0.15)",
                  }}
                >
                  {event.eventStatus}
                </span>
              )}
            </div>

            {heroImg && (
              <div
                className="relative overflow-hidden"
                style={{
                  marginTop: "48px",
                  borderRadius: "20px",
                  aspectRatio: "16 / 7",
                  background: "rgba(255,255,255,0.05)",
                }}
              >
                <Image
                  src={heroImg}
                  alt={event.heroImage?.alt ?? event.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 1276px) 100vw, 1276px"
                  priority
                />
              </div>
            )}

            {registerHref && event.eventStatus === "scheduled" && (
              <div style={{ marginTop: "32px" }}>
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
                  Register
                </a>
              </div>
            )}
          </div>
        </section>

        <section
          className="relative mx-auto max-w-[820px] px-6"
          style={{ paddingTop: "80px", paddingBottom: "120px" }}
        >
          {event.abstract && (
            <p
              className="font-sans"
              style={{
                color: "#1f2937",
                fontSize: "clamp(1.0625rem,1.3vw,1.25rem)",
                lineHeight: 1.6,
                letterSpacing: "-0.01em",
              }}
            >
              {event.abstract}
            </p>
          )}
        </section>
      </main>
      <Footer topPadding={120} />
    </>
  );
}
