import Image from "next/image";
import Link from "next/link";
import { mediaUrl } from "@/lib/blog";
import { type News, formatNewsDate, pressTypeLabel } from "@/lib/news";
import { CategoryBadge } from "@/components/ui/CategoryBadge";

interface NewsroomCardProps {
  item: News;
}

export function NewsroomCard({ item }: NewsroomCardProps): React.ReactElement {
  const date = formatNewsDate(item.publicationDate);
  const readTime = item.readingMinutes ? `${item.readingMinutes} min read` : null;
  const pillLabel = pressTypeLabel(item.pressType);
  const heroUrl = mediaUrl(item.heroImage?.url);
  const logoUrl = mediaUrl(item.publisherLogo?.url);

  return (
    <article
      className="relative flex w-full max-w-[404px] flex-col bg-white overflow-hidden"
      style={{
        minHeight: "clamp(360px, 38vw, 521px)",
        borderRadius: "32px",
        boxShadow:
          "0px 3px 7px 0px rgba(0,0,0,0.02), 0px 13px 13px 0px rgba(0,0,0,0.01), 0px 29px 17px 0px rgba(0,0,0,0.01), 0px 52px 21px 0px rgba(0,0,0,0), 0px 81px 23px 0px rgba(0,0,0,0)",
      }}
    >
      {/* The outer wrapper must not clip overflow so the category badge
          (positioned bottom: -12px) can straddle the image's bottom edge —
          upper half over the gradient panel, lower half in the card body
          (mirrors BlogCard). The inner div clips the art to rounded corners. */}
      <div className="relative shrink-0 m-3" style={{ aspectRatio: "380 / 200" }}>
        <div
          className="absolute inset-0 overflow-hidden flex items-center justify-center"
          style={{
            borderRadius: "20px",
            background:
              "linear-gradient(180deg, #10123e 0%, #131e8f 38%, #421ebc 100%)",
          }}
        >
          {logoUrl ? (
            <div className="relative h-24 w-[78%]">
              <Image
                src={logoUrl}
                alt={item.publisher ?? item.title}
                fill
                className="object-contain pointer-events-none select-none"
                sizes="(min-width: 1280px) 300px, (min-width: 768px) 35vw, 70vw"
              />
            </div>
          ) : heroUrl ? (
            // `object-contain`, not `object-cover`: newsroom heroes are a mix of
            // pre-composed gradient banners (OSV, CleanSight — aspect already
            // matches the plate, so contain renders identically) and raw
            // publisher logos (AP, Cyber Defense Magazine — wider/taller than
            // the plate). `cover` cropped the raw logos; `contain` shows every
            // mark whole, letterboxed onto the brand gradient.
            <Image
              src={heroUrl}
              alt={item.heroImage?.alt ?? item.title}
              fill
              className="object-contain"
              sizes="(min-width: 1280px) 380px, (min-width: 768px) 45vw, 90vw"
            />
          ) : (
            <span
              className="font-display font-bold text-center text-white"
              style={{
                fontSize: "var(--fs-h3)",
                letterSpacing: "-0.03em",
                padding: "0 24px",
              }}
            >
              {item.publisher ?? "CleanStart"}
            </span>
          )}
        </div>

        <div
          className="absolute"
          style={{ left: "20px", bottom: "-12px", zIndex: 1 }}
        >
          <CategoryBadge label={pillLabel} />
        </div>
      </div>

      <div
        className="relative flex flex-1 flex-col justify-between pt-8 pb-5 px-5 md:pt-9 md:pb-8 md:px-8"
      >
        <div className="flex flex-col gap-2.5 md:gap-3">
          <div className="flex items-center gap-3 md:gap-4">
            {date && (
              <div className="flex items-center gap-1">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/images/blogs/icon-calendar-grey.svg"
                  alt=""
                  aria-hidden
                  width={18}
                  height={18}
                  className="pointer-events-none select-none shrink-0 w-3.5 h-3.5 md:w-[18px] md:h-[18px]"
                  loading="lazy"
                  decoding="async"
                />
                <span
                  className="font-medium leading-normal whitespace-nowrap"
                  style={{ fontSize: "var(--fs-caption)", color: "#666" }}
                >
                  {date}
                </span>
              </div>
            )}
            {readTime && (
              <div className="flex items-center gap-1">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/images/blogs/icon-clock-grey.svg"
                  alt=""
                  aria-hidden
                  width={18}
                  height={18}
                  className="pointer-events-none select-none shrink-0 w-3.5 h-3.5 md:w-[18px] md:h-[18px]"
                  loading="lazy"
                  decoding="async"
                />
                <span
                  className="font-medium leading-normal whitespace-nowrap"
                  style={{ fontSize: "var(--fs-caption)", color: "#666" }}
                >
                  {readTime}
                </span>
              </div>
            )}
          </div>

          <div className="flex flex-col" style={{ gap: "8px" }}>
            <h3
              className="font-display text-card-title-md font-medium leading-[1.3] tracking-[-0.05em] overflow-hidden"
              style={{
                color: "#111",
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflowWrap: "anywhere",
                wordBreak: "break-word",
              }}
            >
              {item.title}
            </h3>
            {item.abstract && (
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
                {item.abstract}
              </p>
            )}
          </div>
        </div>

        <Link
          href={`/news/${item.slug}`}
          className="flex items-center group"
          style={{ gap: "8px" }}
          aria-label={`Read more about ${item.title}`}
        >
          <span
            className="text-body-lg font-medium leading-[1.5] text-center whitespace-nowrap"
            style={{ color: "#4a3bf1" }}
          >
            Read more
          </span>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/blogs/icon-arrow-read-more.svg"
            alt=""
            aria-hidden
            width={24}
            height={24}
            className="pointer-events-none select-none group-hover:translate-x-1 transition-transform duration-200"
            loading="lazy"
            decoding="async"
          />
        </Link>
      </div>
    </article>
  );
}
