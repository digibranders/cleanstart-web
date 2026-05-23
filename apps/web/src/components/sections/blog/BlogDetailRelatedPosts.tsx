import Link from "next/link";
import Image from "next/image";
import { formatBlogDate, mediaUrl } from "@/lib/blog";
import type { Blog } from "@/lib/blog";
import { effectivePublishedAt } from "@/lib/published-date";
import { CategoryBadge } from "@/components/ui/CategoryBadge";

interface BlogDetailRelatedPostsProps {
  posts: Blog[];
}

export function BlogDetailRelatedPosts({ posts }: BlogDetailRelatedPostsProps): React.ReactElement | null {
  if (!posts.length) return null;

  return (
    <section
      className="relative w-full overflow-hidden"
      data-section="BlogDetailRelatedPosts"
      style={{ minHeight: "580px" }}
    >
      <div className="relative mx-auto max-w-[var(--container-default)] px-6 sm:px-10">
        {/* Header row */}
        <div className="flex items-center justify-between pt-[60px]">
          <h2 className="font-display text-display-md font-bold leading-[1.05] tracking-[-0.05em]">
            <span className="text-white">Related </span>
            <span
              style={{
                backgroundImage: "linear-gradient(-44deg, #2CC1EB 0%, #9A51FF 65%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Blogs
            </span>
          </h2>

          <Link
            href="/blogs"
            className="flex items-center gap-2 group"
            aria-label="See all blog posts"
          >
            <span
              className="font-display text-[clamp(1.25rem,2.2vw,2rem)] font-bold leading-none tracking-[-0.05em] text-white group-hover:text-[#2CC1EB] transition-colors duration-200"
            >
              See All
            </span>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/blog-detail/icon-see-all-arrow.svg"
              alt=""
              aria-hidden
              width={40}
              height={40}
              className="w-10 h-10 group-hover:translate-x-1 transition-transform duration-200"
              loading="lazy"
              decoding="async"
            />
          </Link>
        </div>

        {/* Cards grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 mt-[60px]">
          {posts.map((post) => (
            <RelatedPostCard key={post.id} post={post} />
          ))}
        </div>
      </div>
    </section>
  );
}

function RelatedPostCard({ post }: { post: Blog }): React.ReactElement {
  const primaryCategory = post.categories ?? undefined;

  return (
    <article
      className="relative overflow-hidden flex flex-col h-full"
      style={{
        background: "#fff",
        borderRadius: "32px",
        boxShadow: "0px 3px 7px 0px rgba(0,0,0,0.02), 0px 13px 13px 0px rgba(0,0,0,0.01), 0px 29px 17px 0px rgba(0,0,0,0.01), 0px 52px 21px 0px rgba(0,0,0,0), 0px 81px 23px 0px rgba(0,0,0,0)",
      }}
    >
      {/* Hero image */}
      <div className="relative shrink-0 mx-3 mt-3 rounded-[24px] overflow-hidden" style={{ height: "200px" }}>
          {post.heroImage ? (
            <Image
              src={mediaUrl(post.heroImage.url)!}
              alt={post.heroImage.alt ?? post.title}
              fill
              sizes="(min-width: 1280px) 380px, (min-width: 768px) 50vw, 100vw"
              className="object-cover"
            />
          ) : (
            <div
              className="w-full h-full"
              style={{ background: "linear-gradient(135deg, #131e8f 0%, #471ec0 100%)" }}
            />
          )}
        </div>

        {/* Category badge — Figma 330:526, y=190 (22px above image bottom at y=212) */}
        {primaryCategory && (
          <div className="relative z-10 mx-[32px] mt-[-22px] self-start">
            <CategoryBadge label={primaryCategory.name} />
          </div>
        )}

        {/* Card content */}
        <div className="flex flex-col gap-[12px] p-[32px] flex-1">
          {/* Meta: date + read time */}
          <div className="flex items-center gap-4">
            {(() => {
              const displayDate = effectivePublishedAt(post);
              if (!displayDate) return null;
              return (
                <div className="flex items-center gap-1">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/images/blogs/icon-calendar-grey.svg" alt="" aria-hidden width={18} height={18} className="shrink-0" />
                  <span className="text-sm font-medium leading-normal" style={{ color: "#666" }}>
                    {formatBlogDate(displayDate)}
                  </span>
                </div>
              );
            })()}
            {post.readingMinutes != null && (
              <div className="flex items-center gap-1">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/images/blogs/icon-clock-grey.svg" alt="" aria-hidden width={18} height={18} className="shrink-0" />
                <span className="text-sm font-medium leading-normal" style={{ color: "#666" }}>
                  {post.readingMinutes} min read
                </span>
              </div>
            )}
          </div>

          {/* Title */}
          <h3
            className="line-clamp-3 flex-1 font-display text-card-title-md font-medium leading-[1.3]"
            style={{ color: "#111" }}
          >
            {post.title}
          </h3>

          {/* Abstract */}
          {post.abstract && (
            <p
              className="line-clamp-3 text-body-md font-normal leading-[1.3]"
              style={{ color: "rgba(17,17,17,0.54)" }}
            >
              {post.abstract}
            </p>
          )}

          {/* Read more */}
          <Link
            href={`/blog/${post.slug}`}
            aria-label={`Read ${post.title}`}
            className="group inline-flex items-center gap-2 mt-auto pt-2 self-start"
          >
            <span
              className="text-body-lg font-medium leading-[1.5] group-hover:text-[#3928e0] transition-colors duration-200"
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
              className="w-6 h-6 group-hover:translate-x-1 transition-transform duration-200"
              loading="lazy"
              decoding="async"
            />
          </Link>
        </div>
      </article>
  );
}
