import Image from "next/image";
import Link from "next/link";
import type { Guide } from "@/lib/guides";
import { formatGuideDate, guideMediaUrl } from "@/lib/guides-utils";
import { effectivePublishedAt } from "@/lib/published-date";
import { deriveCoverKeyword } from "@/lib/guide-cover";
import { GeneratedGuideCover } from "@/components/sections/_shared/GeneratedGuideCover";

interface GuideCardProps {
  guide: Guide;
  /** Preload the image (set true for cards in the first two rows). */
  priority?: boolean;
}

export function GuideCard({ guide, priority = false }: GuideCardProps): React.ReactElement {
  const authorName = guide.authors?.[0]?.name ?? null;
  const updatedDate = formatGuideDate(
    guide.updatedAt ?? effectivePublishedAt(guide),
  );
  const imageUrl = guideMediaUrl(guide.heroImage?.url);
  const coverKeyword = deriveCoverKeyword(guide.title);
  // The Webflow import left `abstract` empty on guides; fall back to the SEO
  // description (the same lede text) so the card still shows a summary.
  const lede = guide.abstract ?? guide.seo?.description ?? null;

  return (
    <article
      className="relative flex h-full w-full max-w-[320px] flex-col bg-white overflow-hidden"
      style={{
        borderRadius: "16px",
        boxShadow:
          "0px 3px 7px 0px rgba(0,0,0,0.02), 0px 13px 13px 0px rgba(0,0,0,0.01), 0px 29px 17px 0px rgba(0,0,0,0.01), 0px 52px 21px 0px rgba(0,0,0,0), 0px 81px 23px 0px rgba(0,0,0,0)",
      }}
    >
      <div
        className="relative shrink-0 mx-[14px] mt-[14px] overflow-hidden"
        style={{ aspectRatio: "267 / 140", borderRadius: "8px", background: "#e8e8f0" }}
      >
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={guide.heroImage?.alt ?? guide.title}
            fill
            className="object-cover"
            sizes="(min-width: 1280px) 300px, (min-width: 1024px) 30vw, (min-width: 640px) 45vw, 90vw"
            priority={priority}
          />
        ) : (
          <GeneratedGuideCover keyword={coverKeyword} />
        )}
      </div>

      <div className="flex flex-1 flex-col px-[14px] pb-[14px] pt-4">
        {/* Meta: Author ┃ Updated on, with a full-width rule beneath. */}
        <div className="flex flex-col" style={{ gap: "6px" }}>
          <div className="flex items-end justify-between w-full">
            {authorName ? (
              <div
                className="flex flex-col min-w-0"
                style={{ gap: "3px", color: "#666" }}
              >
                <span className="text-xs font-normal leading-normal">Author:</span>
                <span className="text-sm font-medium leading-normal truncate">
                  {authorName}
                </span>
              </div>
            ) : null}

            {authorName && updatedDate ? (
              <span
                aria-hidden
                className="shrink-0"
                style={{ width: "1px", height: "34px", background: "#e5e5e5" }}
              />
            ) : null}

            {updatedDate ? (
              <div
                className="flex flex-col"
                style={{ gap: "4px", color: "#666" }}
              >
                <span className="text-xs font-normal leading-normal">
                  Updated on:
                </span>
                <span className="text-sm font-medium leading-normal">
                  {updatedDate}
                </span>
              </div>
            ) : null}
          </div>
          <span
            aria-hidden
            className="block w-full"
            style={{ height: "1px", background: "#e5e5e5" }}
          />
        </div>

        {/* Title + abstract + read more. */}
        <div className="flex flex-1 flex-col" style={{ gap: "12px", marginTop: "16px" }}>
          <div className="flex flex-col" style={{ gap: "8px" }}>
            <h3
              className="font-display text-card-title-md font-medium leading-[1.3] tracking-[-0.04em] overflow-hidden"
              style={{
                color: "#111",
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflowWrap: "anywhere",
                wordBreak: "break-word",
              }}
            >
              {guide.title}
            </h3>
            {lede ? (
              <p
                className="text-body-md font-normal leading-[1.3] overflow-hidden"
                style={{
                  color: "rgba(17,17,17,0.54)",
                  display: "-webkit-box",
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: "vertical",
                  overflowWrap: "anywhere",
                  wordBreak: "break-word",
                }}
              >
                {lede}
              </p>
            ) : null}
          </div>

          <Link
            href={`/guide/${guide.slug}`}
            className="mt-auto flex items-center"
            style={{ gap: "6px" }}
            aria-label={`Read more about ${guide.title}`}
          >
            <span
              className="text-body-sm font-medium leading-[1.5] text-center whitespace-nowrap"
              style={{ color: "#4a3bf1" }}
            >
              Read more
            </span>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/shared/icon-arrow-read-more.svg"
              alt=""
              aria-hidden
              width={18}
              height={18}
              className="pointer-events-none select-none"
              loading="lazy"
              decoding="async"
            />
          </Link>
        </div>
      </div>
    </article>
  );
}
