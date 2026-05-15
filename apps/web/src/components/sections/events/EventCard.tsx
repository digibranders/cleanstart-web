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
        height: "496px",
        borderRadius: "24px",
        boxShadow:
          "0px 3px 7px 0px rgba(0,0,0,0.02), 0px 13px 13px 0px rgba(0,0,0,0.01), 0px 29px 17px 0px rgba(0,0,0,0.01), 0px 52px 21px 0px rgba(0,0,0,0), 0px 81px 23px 0px rgba(0,0,0,0)",
      }}
    >
      {/* Image */}
      <div
        className="relative overflow-hidden shrink-0"
        style={{
          margin: "12px",
          height: "200px",
          borderRadius: "16px",
          background: "#e8e8f0",
        }}
      >
        {heroImg ? (
          <Image
            src={heroImg}
            alt={event.heroImage?.alt ?? event.title}
            fill
            className="object-cover"
            sizes="380px"
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
        style={{ padding: "20px 32px 32px", gap: "12px" }}
      >
        {/* Date row */}
        {shortDate && (
          <div className="flex items-center" style={{ gap: "6px" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/blogs/icon-calendar-grey.svg"
              alt=""
              aria-hidden
              width={18}
              height={18}
              className="pointer-events-none select-none"
              loading="lazy"
              decoding="async"
            />
            <span
              className="text-sm font-medium leading-none"
              style={{ color: "#6b7280" }}
            >
              {shortDate}
            </span>
          </div>
        )}

        {/* Title */}
        <h3
          className="font-display font-semibold overflow-hidden"
          style={{
            color: "#0f1729",
            fontSize: "clamp(1.125rem,1.39vw,1.375rem)",
            lineHeight: "1.3",
            letterSpacing: "-0.03em",
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
            height={18}
            className="pointer-events-none select-none"
            style={{ color: "#6b7280" }}
            loading="lazy"
            decoding="async"
          />
          <span
            className="text-sm leading-none truncate"
            style={{ color: "#6b7280" }}
          >
            {event.venue}
          </span>
        </div>

        {/* Read more button — full-width */}
        <Link
          href={`/events/${event.slug}`}
          className="cs-btn-blue gap-2 w-full"
          style={{ height: "45px", fontSize: "0.9375rem", marginTop: "8px" }}
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
            className="pointer-events-none select-none"
            loading="lazy"
            decoding="async"
          />
        </Link>
      </div>
    </article>
  );
}
