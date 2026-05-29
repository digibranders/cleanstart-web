import Image from "next/image";
import Link from "next/link";
import { type Event, formatEventDate } from "@/lib/events";
import { mediaUrl } from "@/lib/blog";

interface EventCardProps {
  event: Event;
}

export function EventCard({ event }: EventCardProps): React.ReactElement {
  const shortDate = formatEventDate(
    event.startsAt,
    event.timezone,
    event.customDateLabel,
    "short",
  );
  const heroImg = mediaUrl(event.heroImage?.url);

  return (
    <article
      className="relative bg-white overflow-hidden flex flex-col"
      style={{
        width: "100%",
        maxWidth: "404px",
        minHeight: "clamp(420px, 36vw, 496px)",
        borderRadius: "32px",
        boxShadow:
          "0px 3px 7px 0px rgba(0,0,0,0.02), 0px 13px 13px 0px rgba(0,0,0,0.01), 0px 29px 17px 0px rgba(0,0,0,0.01), 0px 52px 21px 0px rgba(0,0,0,0), 0px 81px 23px 0px rgba(0,0,0,0)",
      }}
    >
      {/* Image */}
      <div
        className="relative overflow-hidden shrink-0"
        style={{
          margin: "12px",
          aspectRatio: "380 / 200",
          borderRadius: "24px",
          background: "#e8e8f0",
        }}
      >
        {heroImg ? (
          <Image
            src={heroImg}
            alt={event.heroImage?.alt ?? event.title}
            fill
            className="object-cover"
            sizes="(min-width: 1280px) 380px, (min-width: 768px) 45vw, 90vw"
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

      {/* Content */}
      <div
        className="flex flex-col flex-1"
        style={{ padding: "32px", gap: "12px" }}
      >
        {/* Date row */}
        {shortDate && (
          <div className="flex items-center" style={{ gap: "4px" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/blogs/icon-calendar-grey.svg"
              alt=""
              aria-hidden
              width={18}
              height={18}
              className="pointer-events-none select-none"
              style={{
                filter:
                  "invert(28%) sepia(94%) saturate(4900%) hue-rotate(238deg) brightness(96%) contrast(94%)",
              }}
              loading="lazy"
              decoding="async"
            />
            <span
              className="text-body-sm font-medium leading-none"
              style={{ color: "#4a3bf1" }}
            >
              {shortDate}
            </span>
          </div>
        )}

        {/* Title */}
        <h3
          className="font-display text-card-title-md font-medium overflow-hidden"
          style={{
            color: "#111",
            lineHeight: "1.3",
            letterSpacing: "-0.02em",
            display: "-webkit-box",
            WebkitLineClamp: 3,
            WebkitBoxOrient: "vertical",
          }}
        >
          {event.title}
        </h3>

        {/* Spacer pushes venue + button to bottom */}
        <div className="flex-1" />

        {/* Venue row */}
        <div className="flex items-center" style={{ gap: "8px" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/events/icon-location.svg"
            alt=""
            aria-hidden
            width={18}
            height={20}
            className="pointer-events-none select-none"
            loading="lazy"
            decoding="async"
          />
          <span
            className="text-body-md font-medium leading-none truncate"
            style={{
              color: "#111",
              letterSpacing: "-0.05em",
            }}
          >
            {event.venue}
          </span>
        </div>

        {/* Read more button — full-width */}
        <Link
          href={`/event/${event.slug}`}
          className="cs-btn-blue gap-2 w-full"
          style={{ marginTop: "8px" }}
          aria-label={`Read more about ${event.title}`}
        >
          Read more
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/blogs/icon-arrow-right.svg"
            alt=""
            aria-hidden
            width={22}
            height={20}
            className="pointer-events-none select-none"
            loading="lazy"
            decoding="async"
          />
        </Link>
      </div>
    </article>
  );
}
