"use client";

import Link from "next/link";
import Image from "next/image";
import { useCallback, useState } from "react";
import { copyText } from "@/lib/clipboard";

interface EventDetailMobileCardProps {
  title: string;
  slug: string;
  venue: string;
  longDate?: string | null;
  shortDate?: string | null;
  abstract?: string | null;
  /** Resolved absolute hero-image URL — pass null when missing. */
  heroImageUrl?: string | null;
  heroImageAlt?: string | null;
  heroImageWidth?: number | null;
  heroImageHeight?: number | null;
  isPast?: boolean;
  eventStatus: string;
}

/**
 * Card-style mobile layout for the event detail page.
 *
 * Replaces the desktop hero+image+body stack on smaller viewports. Renders a
 * compact card on the dark gradient with the date pill, event image, title,
 * date row, location row, and a native share button, with the abstract text
 * flowing below the card on the same gradient.
 */
export function EventDetailMobileCard({
  title,
  slug,
  venue,
  longDate,
  shortDate,
  abstract,
  heroImageUrl,
  heroImageAlt,
  heroImageWidth,
  heroImageHeight,
  isPast = false,
  eventStatus,
}: EventDetailMobileCardProps): React.ReactElement {
  const heroUrl = heroImageUrl ?? null;
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.cleanstart.com";
  const shareUrl = `${siteUrl}/event/${slug}`;
  const isCancelled = eventStatus === "cancelled";

  const [shareState, setShareState] = useState<"idle" | "copied" | "failed">(
    "idle",
  );

  const handleShare = useCallback(async (): Promise<void> => {
    if (typeof navigator === "undefined") return;
    if (navigator.share) {
      try {
        await navigator.share({ title, url: shareUrl });
        return;
      } catch {
        // Share sheet dismissed; fall through to clipboard copy.
      }
    }
    const ok = await copyText(shareUrl);
    setShareState(ok ? "copied" : "failed");
    window.setTimeout(() => setShareState("idle"), 2000);
  }, [title, shareUrl]);

  return (
    <section
      className="lg:hidden relative overflow-hidden"
      style={{
        background:
          "linear-gradient(180deg, #151021 0%, #10123E 38%, #131E8F 67%, #471EC0 92%)",
      }}
      aria-labelledby={`ev-detail-mobile-${slug}`}
    >
      <div className="relative mx-auto px-6" style={{ maxWidth: "420px" }}>
        <nav
          aria-label="Breadcrumb"
          className="flex flex-wrap items-center gap-1 pt-6"
        >
          <Link
            href="/"
            aria-label="Home"
            className="flex items-center justify-center w-9 h-9 rounded-full"
          >
            <HomeIcon />
          </Link>
          <Chevron />
          <Link
            href="/events"
            className="px-2 py-1 text-xs"
            style={{ color: "#98ACC3" }}
          >
            Events
          </Link>
          <Chevron />
          <span
            className="px-2 py-1 text-xs max-w-[180px] truncate"
            style={{ color: "#BFCCDA" }}
            aria-current="page"
          >
            {title}
          </span>
        </nav>

        <div
          className="mt-6"
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.10)",
            borderRadius: "20px",
            padding: "16px",
            backdropFilter: "blur(6px)",
            WebkitBackdropFilter: "blur(6px)",
          }}
        >
          {(shortDate ?? longDate) && (
            <div className="flex">
              <span
                className="inline-flex items-center gap-1.5 font-sans"
                style={{
                  background: "rgba(196,70,239,0.18)",
                  color: "#E5C7FB",
                  fontSize: "var(--fs-badge)",
                  fontWeight: 600,
                  padding: "5px 10px",
                  borderRadius: "999px",
                  letterSpacing: "0.01em",
                }}
              >
                <CalendarIcon size={14} />
                {shortDate ?? longDate}
              </span>
            </div>
          )}

          {heroUrl && heroImageWidth && heroImageHeight && (
            <div
              className="relative w-full overflow-hidden mt-4"
              style={{
                aspectRatio: `${heroImageWidth} / ${heroImageHeight}`,
                borderRadius: "12px",
                background: "rgba(0,0,0,0.25)",
              }}
            >
              <Image
                src={heroUrl}
                alt={heroImageAlt ?? title}
                fill
                sizes="(max-width: 1024px) 100vw, 420px"
                className="object-cover"
                priority
              />
            </div>
          )}

          <h1
            id={`ev-detail-mobile-${slug}`}
            className="font-display text-white mt-5"
            style={{
              fontSize: "var(--fs-h3)",
              lineHeight: 1.15,
              letterSpacing: "-0.02em",
              fontWeight: 600,
            }}
          >
            {title}
          </h1>

          {longDate && (
            <div className="flex items-center gap-2 mt-4 text-white">
              <CalendarIcon size={18} />
              <span
                className="font-sans"
                style={{
                  fontSize: "var(--fs-body-sm)",
                  fontWeight: 500,
                  letterSpacing: "-0.005em",
                }}
              >
                {longDate}
              </span>
            </div>
          )}

          {venue && (
            <div className="flex items-center gap-2 mt-2 text-white">
              <PinIcon />
              <span
                className="font-sans"
                style={{
                  fontSize: "var(--fs-body-sm)",
                  fontWeight: 500,
                  letterSpacing: "-0.005em",
                }}
              >
                {venue}
              </span>
            </div>
          )}

          {(isPast || isCancelled || eventStatus !== "scheduled") && (
            <div className="mt-4">
              <span
                className="inline-block uppercase tracking-wider text-white font-sans"
                style={{
                  fontSize: "11px",
                  fontWeight: 600,
                  padding: "4px 10px",
                  borderRadius: "999px",
                  background: isCancelled
                    ? "rgba(239,68,68,0.18)"
                    : "rgba(255,255,255,0.10)",
                }}
              >
                {isCancelled
                  ? "Cancelled"
                  : isPast
                    ? "Past event"
                    : eventStatus}
              </span>
            </div>
          )}

          <button
            type="button"
            onClick={handleShare}
            aria-live="polite"
            className="font-sans inline-flex items-center justify-center gap-2 mt-5 w-full"
            style={{
              height: "40px",
              padding: "0 16px",
              borderRadius: "10px",
              background: "#4a3bf1",
              color: "white",
              fontSize: "var(--fs-body-sm)",
              fontWeight: 500,
              border: "1px solid rgba(255,255,255,0.10)",
              cursor: "pointer",
            }}
          >
            {shareState === "copied"
              ? "Link copied"
              : shareState === "failed"
                ? "Copy failed"
                : "Share"}
            {shareState === "copied" ? <CheckIcon /> : <ShareIcon />}
          </button>
        </div>

        {abstract && (
          <p
            className="font-sans text-white mt-6"
            style={{
              fontSize: "var(--fs-body-sm)",
              lineHeight: 1.55,
              letterSpacing: "-0.005em",
              opacity: 0.85,
            }}
          >
            {abstract}
          </p>
        )}

        <div aria-hidden style={{ height: "48px" }} />
      </div>
    </section>
  );
}

function HomeIcon(): React.ReactElement {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V9.5Z"
        stroke="rgba(152,172,195,0.8)"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M9 21V12h6v9"
        stroke="rgba(152,172,195,0.8)"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function Chevron(): React.ReactElement {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      className="shrink-0"
    >
      <path
        d="M9 18l6-6-6-6"
        stroke="rgba(152,172,195,0.6)"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CalendarIcon({ size = 18 }: { size?: number }): React.ReactElement {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
    >
      <rect
        x="3"
        y="5"
        width="18"
        height="16"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <path
        d="M3 9h18M8 3v4M16 3v4"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

function PinIcon(): React.ReactElement {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 21s-7-6.2-7-11a7 7 0 1 1 14 0c0 4.8-7 11-7 11Z"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <circle
        cx="12"
        cy="10"
        r="2.5"
        stroke="currentColor"
        strokeWidth="1.6"
      />
    </svg>
  );
}

function ShareIcon(): React.ReactElement {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 12v6a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-6M16 6l-4-4-4 4M12 2v13"
        stroke="white"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CheckIcon(): React.ReactElement {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M5 12.5l4.5 4.5L19 7"
        stroke="white"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
