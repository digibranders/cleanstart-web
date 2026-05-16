"use client";

import { useCallback } from "react";
import {
  type PressType,
  formatNewsDate,
  pressTypeLabel,
} from "@/lib/news";
import { DetailHero, DetailHeroMetaSeparator } from "@/components/sections/_shared/DetailHero";

interface NewsDetailHeroProps {
  title: string;
  pressType?: PressType | null | undefined;
  publicationDate?: string | null | undefined;
  shareUrl: string;
  shareTitle: string;
}

export function NewsDetailHero({
  title,
  pressType,
  publicationDate,
  shareUrl,
  shareTitle,
}: NewsDetailHeroProps): React.ReactElement {
  const encodedUrl = encodeURIComponent(shareUrl);
  const encodedTitle = encodeURIComponent(shareTitle);

  const handleInstagramClick = useCallback(
    async (event: React.MouseEvent) => {
      // Instagram has no public share-intent URL; copy the post URL so the
      // editor can paste it into the IG composer manually. Falls through
      // to the default href if the clipboard API is unavailable.
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        event.preventDefault();
        try {
          await navigator.clipboard.writeText(shareUrl);
        } catch {
          // Clipboard blocked; let the default href open Instagram.
        }
      }
    },
    [shareUrl],
  );

  return (
    <DetailHero
      title={title}
      breadcrumb={[
        { label: "Resources", href: "/news" },
        { label: "Newsroom", href: "/news" },
        { label: title },
      ]}
      meta={
        <>
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

          <DetailHeroMetaSeparator />

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

          <DetailHeroMetaSeparator />

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
        </>
      }
    />
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
