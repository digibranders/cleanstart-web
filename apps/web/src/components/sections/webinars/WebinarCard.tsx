import Image from "next/image";
import {
  formatWebinarDate,
  regionLabel,
  type Webinar,
} from "@/lib/webinars";

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

  const cardBody = (
    <>
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
        {date && (
          <span
            className="absolute inline-flex flex-col"
            style={{
              top: "12px",
              left: "12px",
              padding: "6px 12px 4px",
              borderRadius: "999px",
              background: "#EDE9FE",
              color: "#5B33F3",
              fontSize: "13px",
              fontWeight: 600,
              lineHeight: 1.2,
              gap: "2px",
            }}
          >
            {date}
            <span
              aria-hidden
              style={{
                width: "32px",
                height: "3px",
                borderRadius: "2px",
                background: "rgba(91,51,243,0.25)",
              }}
            />
          </span>
        )}
      </div>

      <div
        className="flex flex-col"
        style={{ padding: "20px 20px 20px", gap: "12px", flex: 1 }}
      >
        <h3
          className="font-display line-clamp-3"
          style={{
            fontSize: "18px",
            lineHeight: "24px",
            color: "#0F172A",
            fontWeight: 600,
            letterSpacing: "-0.01em",
          }}
        >
          {item.title}
        </h3>

        <div className="flex items-center gap-2" style={{ marginTop: "auto" }}>
          <GlobeIcon />
          <span
            className="font-sans"
            style={{ fontSize: "14px", color: "#475569", fontWeight: 500 }}
          >
            {region}
          </span>
        </div>

        <span
          className="inline-flex items-center justify-center gap-2 font-sans font-medium"
          style={{
            height: "45px",
            borderRadius: "12px",
            background: hasLink ? "#1F50FF" : "#94A3B8",
            color: "#FFFFFF",
            fontSize: "15px",
            transition: "background 120ms",
            opacity: hasLink ? 1 : 0.6,
          }}
        >
          Register
          <ArrowRightIcon />
        </span>
      </div>
    </>
  );

  const wrapperStyle: React.CSSProperties = {
    width: "100%",
    maxWidth: "295px",
    minHeight: "420px",
    borderRadius: "16px",
    background: "#FFFFFF",
    border: "1px solid #F1F5F9",
    boxShadow: "0 4px 24px rgba(15,23,42,0.06)",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  };

  if (!hasLink) {
    return (
      <article
        aria-disabled="true"
        className="block group webinar-card webinar-card--disabled"
        style={wrapperStyle}
      >
        {cardBody}
      </article>
    );
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Register for ${item.title}`}
      className="block group webinar-card transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5B33F3] focus-visible:ring-offset-2"
      style={wrapperStyle}
    >
      {cardBody}
    </a>
  );
}

function GlobeIcon(): React.ReactElement {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden
      style={{ color: "#475569", flexShrink: 0 }}
    >
      <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.3" />
      <path
        d="M8 2c1.6 2 1.6 10 0 12M8 2c-1.6 2-1.6 10 0 12M2 8h12"
        stroke="currentColor"
        strokeWidth="1.3"
      />
    </svg>
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
