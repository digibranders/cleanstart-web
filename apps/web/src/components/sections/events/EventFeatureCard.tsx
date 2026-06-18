import Image from "next/image";
import Link from "next/link";
import type { Event } from "@/lib/events";
import { formatEventDate } from "@/lib/events-utils";
import { mediaUrl } from "@/lib/blog-utils";

const DATE_CHIP_GRADIENT =
  "linear-gradient(93.21deg, #9A51FF 18.08%, #2CC1EB 286.32%)";

/**
 * The large glass "featured event" card shown in the Events hero. Pure
 * presentational — used both standalone (single upcoming event) and inside
 * `UpcomingEventCarousel` (multiple upcoming events).
 *
 * `priority` controls eager loading of the hero image: true for the card that
 * is visible on first paint (the carousel's initial slide), false otherwise.
 */
export function FeaturedEventCard({
  event,
  priority = true,
}: {
  event: Event;
  priority?: boolean;
}): React.ReactElement {
  const longDate = formatEventDate(
    event.startsAt,
    event.timezone,
    event.customDateLabel,
    "long",
  );
  const heroImg = mediaUrl(event.heroImage?.url);

  return (
    <div
      className="relative w-full mx-auto overflow-visible"
      style={{
        maxWidth: "1276px",
        minHeight: "clamp(300px, 30vw, 368px)",
        borderRadius: "20px",
        background: "rgba(165, 103, 255, 0.4)",
        backdropFilter: "blur(4px)",
        WebkitBackdropFilter: "blur(4px)",
        boxShadow:
          "0 30px 60px rgba(20,12,60,0.45), 0 0 0 1px rgba(255,255,255,0.12) inset",
      }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          borderRadius: "20px",
          backgroundImage:
            "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='2' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.55 0'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>\")",
          backgroundSize: "120px 120px",
          opacity: 0.55,
        }}
      />
      {longDate && (
        <div className="absolute z-10" style={{ top: "-8px", left: "-9.92px" }}>
          <div
            aria-hidden
            className="absolute"
            style={{
              top: 0,
              right: "-7.84px",
              width: "9.92px",
              height: "8px",
              background: "#9F9F9F",
              clipPath: "polygon(0 0, 100% 0, 100% 100%, 94.11% 100%)",
              transform: "rotate(180deg)",
            }}
          />
          <div
            aria-hidden
            className="absolute"
            style={{
              left: 0,
              bottom: "-9px",
              width: "9.92px",
              height: "9px",
              background: "#9C9B9B",
              clipPath: "polygon(100% 0, 100% 100%, 0 0)",
            }}
          />
          <div
            className="relative flex items-center"
            style={{
              height: "36px",
              padding: "0 16px",
              gap: "4px",
              borderRadius: "16px 0 16px 0",
              background: DATE_CHIP_GRADIENT,
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/events/icon-calendar-badge.svg"
              alt=""
              aria-hidden
              width={15}
              height={17}
              className="pointer-events-none select-none"
              loading="lazy"
              decoding="async"
            />
            <span
              className="font-display text-body-md font-semibold text-white leading-none whitespace-nowrap"
              style={{ letterSpacing: "-0.05em" }}
            >
              {longDate}
            </span>
          </div>
        </div>
      )}

      <div
        className="relative flex h-full flex-col lg:flex-row items-stretch"
        style={{ padding: "32px", gap: "44px" }}
      >
        <div
          className="relative w-full lg:max-w-[585px] shrink-0 overflow-hidden"
          style={{
            aspectRatio: "585 / 304",
            borderRadius: "12px",
            background: "#251a55",
          }}
        >
          {heroImg ? (
            <Image
              src={heroImg}
              alt={event.heroImage?.alt ?? event.title}
              fill
              className="object-cover"
              sizes="585px"
              priority={priority}
            />
          ) : (
            <div
              className="w-full h-full"
              style={{
                background:
                  "linear-gradient(135deg, #1a1a4e 0%, #2d1b9e 50%, #471ec0 100%)",
              }}
            />
          )}
        </div>

        <div
          className="flex flex-col justify-between"
          style={{
            paddingTop: "12px",
            paddingBottom: "12px",
            flex: 1,
            minWidth: 0,
          }}
        >
          <div className="flex flex-col" style={{ gap: "16px" }}>
            <h2
              className="font-display font-semibold text-white overflow-hidden"
              style={{
                fontSize: "var(--fs-h2)",
                lineHeight: "1.1",
                letterSpacing: "-0.05em",
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
              }}
            >
              {event.title}
            </h2>

            {longDate && (
              <MetaRow icon="/images/blogs/icon-calendar.svg" label={longDate} />
            )}
            <MetaRow
              icon="/images/events/icon-location-pin.svg"
              label={event.venue}
            />
          </div>

          <Link
            href={`/event/${event.slug}`}
            className="cs-btn-glass"
            style={{
              alignSelf: "flex-start",
              marginTop: "24px",
              ["--cs-btn-px" as string]: "18px",
              ["--cs-btn-fs" as string]: "18px",
            }}
            aria-label={`Read more about ${event.title}`}
          >
            Read more
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/blogs/icon-arrow-right.svg"
              alt=""
              aria-hidden
              width={20}
              height={18}
              className="cs-cta-arrow pointer-events-none select-none"
              style={{ filter: "brightness(0)" }}
              loading="lazy"
              decoding="async"
            />
          </Link>
        </div>
      </div>
    </div>
  );
}

function MetaRow({
  icon,
  label,
}: {
  icon: string;
  label: string;
}): React.ReactElement {
  return (
    <div className="flex items-center" style={{ gap: "8px" }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={icon}
        alt=""
        aria-hidden
        width={24}
        height={24}
        className="pointer-events-none select-none shrink-0"
        style={{ filter: "brightness(0) invert(1)" }}
        loading="lazy"
        decoding="async"
      />
      <span
        className="text-body-lg text-white font-medium leading-none"
        style={{ letterSpacing: "-0.05em" }}
      >
        {label}
      </span>
    </div>
  );
}
