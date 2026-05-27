import Image from "next/image";
import {
  formatWebinarDate,
  regionLabel,
  type Webinar,
} from "@/lib/webinars";
import { CategoryBadge } from "@/components/ui/CategoryBadge";

interface WebinarCardProps {
  item: Webinar;
}

const FALLBACK_IMAGE = "/images/blogs/hero-orb-top.png";

export function WebinarCard({ item }: WebinarCardProps): React.ReactElement {
  const href = item.registrationUrl ?? "";
  const hasLink = href.length > 0;
  const date = formatWebinarDate(item.startsAt ?? item.publishedAt, item.timezone);
  const region = regionLabel(item.region);
  const imageUrl = item.heroImage?.url ?? FALLBACK_IMAGE;
  const imageAlt = item.heroImage?.alt ?? item.title;

  return (
    <article
      className="block group webinar-card relative"
      style={{
        width: "100%",
        maxWidth: "295px",
        minHeight: "420px",
        borderRadius: "16px",
        background: "#FFFFFF",
        border: "1px solid #F1F5F9",
        boxShadow: "0 4px 24px rgba(15,23,42,0.06)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div
        className="relative overflow-hidden"
        style={{
          margin: "15px 15px 0",
          height: "138px",
          borderRadius: "8px",
          background: "#0F172A",
        }}
      >
        <Image
          src={imageUrl}
          alt={imageAlt}
          fill
          sizes="(max-width: 768px) 100vw, 295px"
          className="object-cover"
        />
      </div>

      {/* Date badge — overlaps the bottom of the cover image, mirrors blog card pattern */}
      {date && (
        <div
          className="absolute"
          style={{ top: "140px", left: "24px", zIndex: 1 }}
        >
          <CategoryBadge label={date} />
        </div>
      )}

      <div
        className="flex flex-col"
        style={{ padding: "32px", gap: "12px", flex: 1 }}
      >
        <h3
          className="font-display text-card-title-sm font-medium line-clamp-3"
          style={{
            lineHeight: "1.3",
            color: "#0F172A",
            letterSpacing: "-0.01em",
          }}
        >
          {item.title}
        </h3>

        <div className="flex items-center gap-2" style={{ marginTop: "auto" }}>
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
            className="font-sans text-body-sm"
            style={{ color: "#475569", fontWeight: 500 }}
          >
            {region}
          </span>
        </div>

        {hasLink ? (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Register for ${item.title}`}
            className="inline-flex items-center justify-center gap-2 font-sans font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5B33F3] focus-visible:ring-offset-2 transition-[background,opacity] hover:opacity-90"
            style={{
              height: "45px",
              borderRadius: "12px",
              background: "#1F50FF",
              color: "#FFFFFF",
              fontSize: "var(--fs-body-sm)",
            }}
          >
            Register
            <ArrowRightIcon />
          </a>
        ) : (
          <span
            aria-disabled="true"
            className="inline-flex items-center justify-center gap-2 font-sans font-medium select-none"
            style={{
              height: "45px",
              borderRadius: "12px",
              background: "#94A3B8",
              color: "#FFFFFF",
              fontSize: "var(--fs-body-sm)",
              opacity: 0.6,
              cursor: "not-allowed",
            }}
          >
            Register
            <ArrowRightIcon />
          </span>
        )}
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
