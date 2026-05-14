import Link from "next/link";
import { formatBlogDate, mediaUrl } from "@/lib/blog";
import type { BlogCategory, BlogAuthor, BlogImage } from "@/lib/blog";

interface BlogDetailHeroProps {
  title: string;
  categories?: BlogCategory | null | undefined;
  authors?: BlogAuthor[] | undefined;
  publishedAt?: string | undefined;
  readingMinutes?: number | undefined;
  heroImage?: BlogImage | undefined;
}

export function BlogDetailHero({
  title,
  categories: _categories,
  authors,
  publishedAt,
  readingMinutes,
}: BlogDetailHeroProps): React.ReactElement {
  const primaryAuthor = authors?.[0];

  return (
    <section
      className="relative w-full overflow-hidden"
      style={{
        minHeight: "479px",
        background:
          "linear-gradient(180deg, #151021 0%, #10123E 38%, #131E8F 67%, #471EC0 80%, #471FC3 100%)",
      }}
    >
      {/* Decorative bg grid — same mask-group pattern used across dark hero sections */}
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

      <div className="relative mx-auto max-w-[1276px] px-6">
        {/* Breadcrumb — sits below fixed header (72px) */}
        <nav
          aria-label="Breadcrumb"
          className="flex items-center gap-0 pt-[58px]"
        >
          <Link
            href="/"
            className="flex items-center justify-center w-8 h-8 rounded-full"
            aria-label="Home"
          >
            {/* Home icon */}
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
            href="/blogs"
            className="flex items-center h-8 px-2 rounded-full"
            style={{ color: "#98ACC3", fontSize: "12px", fontFamily: "Figtree, sans-serif", lineHeight: 1.4 }}
          >
            Resources
          </Link>

          <BreadcrumbChevron />

          <Link
            href="/blogs"
            className="flex items-center h-8 px-2 rounded-full"
            style={{ color: "#98ACC3", fontSize: "12px", fontFamily: "Figtree, sans-serif", lineHeight: 1.4 }}
          >
            Blogs
          </Link>

          <BreadcrumbChevron />

          <span
            className="flex items-center h-8 px-2 max-w-[220px] truncate"
            style={{ color: "#BFCCDA", fontSize: "12px", fontFamily: "Figtree, sans-serif", lineHeight: 1.4 }}
          >
            {title}
          </span>
        </nav>

        {/* Title */}
        <div className="flex justify-center mt-10">
          <h1
            className="text-white text-center"
            style={{
              fontFamily: "Figtree, sans-serif",
              fontWeight: 600,
              fontSize: "clamp(26px, 2.4vw, 40px)",
              lineHeight: 1.25,
              letterSpacing: "-0.03em",
              maxWidth: "860px",
            }}
          >
            {title}
          </h1>
        </div>

        {/* Horizontal separator */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/blogs/hero-divider-line.svg"
          alt=""
          aria-hidden
          className="w-full mt-[133px]"
          style={{ height: "1px", display: "block" }}
          loading="lazy"
          decoding="async"
        />

        {/* Meta row — reading time | author | date */}
        <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-3 pt-[22px] pb-[40px] sm:justify-between">
          {/* Reading time */}
          {readingMinutes != null && (
            <div className="flex items-center gap-[4px] shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/blogs/icon-clock.svg"
                alt=""
                aria-hidden
                width={32}
                height={32}
                className="shrink-0"
              />
              <span
                className="text-white whitespace-nowrap"
                style={{ fontFamily: "Figtree, sans-serif", fontWeight: 500, fontSize: "clamp(14px, 1.4vw, 20px)", lineHeight: 1.3 }}
              >
                {readingMinutes} min read
              </span>
            </div>
          )}

          {readingMinutes != null && (primaryAuthor ?? publishedAt) && (
            <MetaSeparator />
          )}

          {/* Author */}
          {primaryAuthor && (
            <div className="flex items-center gap-[7px] shrink-0">
              {primaryAuthor.photo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={mediaUrl(primaryAuthor.photo.url)}
                  alt={primaryAuthor.name}
                  className="rounded-full object-cover shrink-0"
                  style={{ width: "32px", height: "32px", display: "block" }}
                />
              ) : (
                <div
                  className="rounded-full bg-gradient-to-br from-[#9A51FF] to-[#2CC1EB] shrink-0"
                  style={{ width: "32px", height: "32px" }}
                  aria-hidden
                />
              )}
              <span
                className="text-white whitespace-nowrap"
                style={{ fontFamily: "Figtree, sans-serif", fontWeight: 500, fontSize: "clamp(14px, 1.4vw, 20px)", lineHeight: 1.3 }}
              >
                By {primaryAuthor.name}
              </span>
            </div>
          )}

          {primaryAuthor && publishedAt && <MetaSeparator />}

          {/* Date */}
          {publishedAt && (
            <div className="flex items-center gap-[8px] shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/blogs/icon-calendar.svg"
                alt=""
                aria-hidden
                width={40}
                height={40}
                className="shrink-0"
                style={{ width: "40px", height: "40px" }}
              />
              <span
                className="text-white whitespace-nowrap"
                style={{
                  fontFamily: "Figtree, sans-serif",
                  fontWeight: 500,
                  fontSize: "clamp(14px, 1.4vw, 20px)",
                  lineHeight: 1,
                  letterSpacing: "-0.05em",
                }}
              >
                {formatBlogDate(publishedAt)}
              </span>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function BreadcrumbChevron(): React.ReactElement {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden className="shrink-0">
      <path d="M9 18l6-6-6-6" stroke="rgba(152,172,195,0.6)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

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
