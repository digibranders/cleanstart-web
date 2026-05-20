import Image from "next/image";
import Link from "next/link";
import { type Blog, formatBlogDate, mediaUrl } from "@/lib/blog";
import { effectivePublishedAt } from "@/lib/published-date";
import { CategoryBadge } from "@/components/ui/CategoryBadge";

interface BlogCardProps {
  post: Blog;
}

export function BlogCard({ post }: BlogCardProps): React.ReactElement {
  const date = formatBlogDate(effectivePublishedAt(post));
  const readTime = post.readingMinutes ? `${post.readingMinutes} min read` : null;
  const primaryCategory = post.categories ?? undefined;

  return (
    <article
      className="relative flex w-full max-w-[404px] flex-col bg-white overflow-hidden"
      style={{
        minHeight: "clamp(440px, 38vw, 528px)",
        borderRadius: "32px",
        boxShadow:
          "0px 3px 7px 0px rgba(0,0,0,0.02), 0px 13px 13px 0px rgba(0,0,0,0.01), 0px 29px 17px 0px rgba(0,0,0,0.01), 0px 52px 21px 0px rgba(0,0,0,0), 0px 81px 23px 0px rgba(0,0,0,0)",
      }}
    >
      {/* Card image */}
      <div
        className="relative shrink-0 overflow-hidden m-3"
        style={{
          aspectRatio: "380 / 200",
          borderRadius: "20px",
          background: "#e8e8f0",
        }}
      >
        {post.heroImage?.url ? (
          <Image
            src={mediaUrl(post.heroImage.url)!}
            alt={post.heroImage.alt ?? post.title}
            fill
            className="object-cover"
            sizes="(min-width: 1280px) 380px, (min-width: 768px) 45vw, 90vw"
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

        {/* Category badge — overlaps image bottom */}
        {primaryCategory && (
          <div className="absolute" style={{ left: "20px", bottom: "-12px", zIndex: 1 }}>
            <CategoryBadge label={primaryCategory.name} />
          </div>
        )}
      </div>

      {/* Card content — fills remaining height, Read more pinned to bottom */}
      <div
        className="relative flex flex-1 flex-col justify-between pt-9 pb-8 px-8"
      >
        {/* Top: meta + title + excerpt */}
        <div className="flex flex-col" style={{ gap: "12px" }}>
          {/* Meta row: date + read time */}
          <div className="flex items-center" style={{ gap: "16px" }}>
            {date && (
              <div className="flex items-center" style={{ gap: "4px" }}>
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
                  className="text-sm font-medium leading-normal"
                  style={{ color: "#666" }}
                >
                  {date}
                </span>
              </div>
            )}
            {readTime && (
              <div className="flex items-center" style={{ gap: "4px" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/images/blogs/icon-clock-grey.svg"
                  alt=""
                  aria-hidden
                  width={18}
                  height={18}
                  className="pointer-events-none select-none"
                  loading="lazy"
                  decoding="async"
                />
                <span
                  className="text-sm font-medium leading-normal"
                  style={{ color: "#666" }}
                >
                  {readTime}
                </span>
              </div>
            )}
          </div>

          {/* Title + excerpt */}
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
              {post.title}
            </h3>
            {post.abstract && (
              <p
                className="text-body-md font-normal leading-[1.3] overflow-hidden"
                style={{
                  color: "rgba(17,17,17,0.54)",
                  display: "-webkit-box",
                  WebkitLineClamp: 4,
                  WebkitBoxOrient: "vertical",
                  overflowWrap: "anywhere",
                  wordBreak: "break-word",
                }}
              >
                {post.abstract}
              </p>
            )}
          </div>
        </div>

        {/* Read more — always at the bottom */}
        <Link
          href={`/blog/${post.slug}`}
          className="flex items-center"
          style={{ gap: "8px" }}
          aria-label={`Read more about ${post.title}`}
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
            className="pointer-events-none select-none"
            loading="lazy"
            decoding="async"
          />
        </Link>
      </div>
    </article>
  );
}
