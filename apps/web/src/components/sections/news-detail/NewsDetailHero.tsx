"use client";

import Link from "next/link";
import { useCallback } from "react";
import {
  type PressType,
  formatNewsDate,
  pressTypeLabel,
} from "@/lib/news";

interface NewsDetailHeroProps {
  title: string;
  pressType?: PressType | null | undefined;
  publicationDate?: string | null | undefined;
  shareUrl: string;
  shareTitle: string;
}

/**
 * Newsroom detail hero. Matches Figma node 402:5717 — dark purple
 * gradient occupies the entire hero band including the meta row
 * (press-type pill, share strip, date), with a thin divider line
 * separating the title and the meta row.
 */
export function NewsDetailHero({
  title,
  pressType,
  publicationDate,
  shareUrl,
  shareTitle,
}: NewsDetailHeroProps): React.ReactElement {
  const encodedUrl = encodeURIComponent(shareUrl);
  const encodedTitle = encodeURIComponent(shareTitle);

  const handleInstagramClick = useCallback(async (event: React.MouseEvent) => {
    // Instagram has no public share-intent URL. Mirror Figma by
    // exposing the icon; clicking copies the post URL to the
    // clipboard so the editor can paste it into the IG composer
    // manually. Falls through to the default href if the clipboard
    // API is unavailable.
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      event.preventDefault();
      try {
        await navigator.clipboard.writeText(shareUrl);
      } catch {
        // Clipboard blocked; let the default href open Instagram.
      }
    }
  }, [shareUrl]);

  return (
    <section
      className="relative w-full overflow-hidden"
      style={{
        background:
          "linear-gradient(180deg, #151021 0%, #10123E 38%, #131E8F 67%, #471EC0 86%, #471FC3 100%)",
      }}
    >
      {/* Decorative orb top-right — matches Figma image 583151 */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        aria-hidden
        src="/images/blogs/hero-orb-top.png"
        alt=""
        className="pointer-events-none select-none absolute top-20 right-0 hidden xl:block"
        style={{ width: "265px", height: "265px", mixBlendMode: "lighten", opacity: 0.4 }}
        loading="lazy"
        decoding="async"
      />

      <div className="relative mx-auto max-w-[1278px] px-6">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-0 pt-[58px]">
          <Link
            href="/"
            className="flex items-center justify-center w-8 h-8 rounded-full"
            aria-label="Home"
          >
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
          </Link>
          <BreadcrumbChevron />
          <Link
            href="/news"
            className="flex items-center h-8 px-2 rounded-full text-xs leading-[1.4]"
            style={{ color: "#98ACC3" }}
          >
            Resources
          </Link>
          <BreadcrumbChevron />
          <Link
            href="/news"
            className="flex items-center h-8 px-2 rounded-full text-xs leading-[1.4]"
            style={{ color: "#98ACC3" }}
          >
            Newsroom
          </Link>
          <BreadcrumbChevron />
          <span
            className="flex items-center h-8 px-2 max-w-[280px] truncate text-xs leading-[1.4]"
            style={{ color: "#BFCCDA" }}
          >
            {title}
          </span>
        </nav>

        {/* Title */}
        <div className="flex justify-center mt-[34px]">
          <h1
            className="font-display text-[clamp(2rem,3.6vw,3.5rem)] font-semibold leading-[1.15] tracking-[-0.03em] text-white text-center"
            style={{ maxWidth: "860px" }}
          >
            {title}
          </h1>
        </div>

        {/* Horizontal divider — same asset as the blog detail hero
            for visual parity across the resource detail pages. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/blogs/hero-divider-line.svg"
          alt=""
          aria-hidden
          className="w-full mt-[40px]"
          style={{ height: "1px", display: "block" }}
          loading="lazy"
          decoding="async"
        />

        {/* Meta row — Press Release / Share / Date, all on purple.
            Spacing mirrors the blog detail hero (`pt-[22px] pb-[40px]`)
            so both detail pages share an identical hero rhythm. */}
        <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-3 pt-[22px] pb-[40px] sm:justify-between">
          {/* Press type */}
          <div className="flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/news-detail/icon-press-release.svg"
              alt=""
              aria-hidden
              width={40}
              height={40}
              className="pointer-events-none select-none"
              loading="lazy"
              decoding="async"
            />
            <span
              className="font-medium leading-[1.3] text-white whitespace-nowrap"
              style={{ fontSize: "20px", letterSpacing: "-0.01em" }}
            >
              {pressTypeLabel(pressType)}
            </span>
          </div>

          <MetaSeparator />

          {/* Share */}
          <div className="flex items-center gap-2">
            <span
              className="font-medium leading-[1.3] text-white whitespace-nowrap"
              style={{ fontSize: "20px", letterSpacing: "-0.01em" }}
            >
              Share
            </span>
            <div className="flex items-center gap-2">
              <ShareIcon
                href={`https://wa.me/?text=${encodedTitle}%20${encodedUrl}`}
                label="Share on WhatsApp"
                src="/images/news-detail/icon-share-whatsapp.svg"
              />
              <ShareIcon
                href={`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`}
                label="Share on Facebook"
                src="/images/news-detail/icon-share-facebook.svg"
              />
              <ShareIcon
                href={`https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`}
                label="Share on X"
                src="/images/news-detail/icon-share-x.svg"
              />
              <ShareIcon
                href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`}
                label="Share on LinkedIn"
                src="/images/news-detail/icon-share-linkedin.svg"
              />
              <ShareIcon
                href="https://www.instagram.com/"
                label="Open Instagram (post URL copied to clipboard)"
                src="/images/news-detail/icon-share-instagram.svg"
                onClick={handleInstagramClick}
              />
            </div>
          </div>

          <MetaSeparator />

          {/* Date */}
          {publicationDate && (
            <div className="flex items-center gap-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/news-detail/icon-calendar-hero.svg"
                alt=""
                aria-hidden
                width={40}
                height={40}
                className="pointer-events-none select-none"
                loading="lazy"
                decoding="async"
              />
              <time
                dateTime={publicationDate}
                className="font-medium leading-none text-white whitespace-nowrap"
                style={{ fontSize: "20px", letterSpacing: "-1px" }}
              >
                {formatNewsDate(publicationDate)}
              </time>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

interface ShareIconProps {
  href: string;
  label: string;
  src: string;
  onClick?: (event: React.MouseEvent) => void;
}

function ShareIcon({ href, label, src, onClick }: ShareIconProps): React.ReactElement {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      onClick={onClick}
      className="inline-flex items-center justify-center shrink-0 transition-opacity hover:opacity-80"
      style={{ width: "32px", height: "32px" }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt=""
        aria-hidden
        width={32}
        height={32}
        className="pointer-events-none select-none"
        loading="lazy"
        decoding="async"
      />
    </a>
  );
}

function BreadcrumbChevron(): React.ReactElement {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden className="shrink-0">
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

/**
 * Same SVG asset and treatment as the blog detail hero's meta
 * separator so the two detail pages stay visually identical.
 */
function MetaSeparator(): React.ReactElement {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/images/blogs/hero-meta-separator.svg"
      alt=""
      aria-hidden
      width={1}
      height={46}
      className="mx-4 shrink-0 hidden lg:block"
      loading="lazy"
      decoding="async"
    />
  );
}
