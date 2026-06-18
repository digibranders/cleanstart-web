import Image from "next/image";
import Link from "next/link";
import type { Event } from "@/lib/events";
import { formatEventDate } from "@/lib/events-utils";
import { mediaUrl } from "@/lib/blog-utils";
import { CategoryBadge } from "@/components/ui/CategoryBadge";

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
      className="block group relative"
      style={{
        width: "100%",
        maxWidth: "295px",
        minHeight: "360px",
        borderRadius: "16px",
        background: "#FFFFFF",
        border: "1px solid #F1F5F9",
        boxShadow: "0 4px 24px rgba(15,23,42,0.06)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div
        className="relative overflow-hidden shrink-0"
        style={{
          margin: "15px 15px 0",
          height: "138px",
          borderRadius: "8px",
          background: "#0F172A",
        }}
      >
        {heroImg ? (
          <Image
            src={heroImg}
            alt={event.heroImage?.alt ?? event.title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 295px"
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

      {shortDate && (
        <div className="absolute" style={{ top: "140px", left: "24px", zIndex: 1 }}>
          <CategoryBadge label={shortDate} />
        </div>
      )}

      <div
        className="flex flex-col flex-1"
        style={{ padding: "28px 32px 24px", gap: "12px" }}
      >
        <h3
          className="font-display text-card-title-sm font-medium line-clamp-3"
          style={{
            lineHeight: "1.3",
            color: "#0F172A",
            letterSpacing: "-0.01em",
          }}
        >
          {event.title}
        </h3>

        <div
          className="flex items-center gap-2"
          style={{ marginTop: "auto" }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/events/icon-location.svg"
            alt=""
            aria-hidden
            width={16}
            height={18}
            className="pointer-events-none select-none shrink-0"
            loading="lazy"
            decoding="async"
          />
          <span
            className="font-sans text-body-sm truncate"
            style={{ color: "#475569", fontWeight: 500 }}
          >
            {event.venue}
          </span>
        </div>

        <Link
          href={`/event/${event.slug}`}
          aria-label={`Read more about ${event.title}`}
          className="inline-flex items-center justify-center gap-2 font-sans font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5B33F3] focus-visible:ring-offset-2 transition-[background,opacity] hover:opacity-90"
          style={{
            height: "45px",
            borderRadius: "12px",
            background: "#1F50FF",
            color: "#FFFFFF",
            fontSize: "var(--fs-body-sm)",
          }}
        >
          Read more
          <ArrowRightIcon />
        </Link>
      </div>
    </article>
  );
}

function ArrowRightIcon(): React.ReactElement {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
      <path
        d="M3 9h12M10 4l5 5-5 5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
