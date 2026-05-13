import Link from "next/link";
import Image from "next/image";
import { formatBlogDate } from "@/lib/blog";
import type { Blog } from "@/lib/blog";

interface BlogDetailRelatedPostsProps {
  posts: Blog[];
}

export function BlogDetailRelatedPosts({ posts }: BlogDetailRelatedPostsProps): React.ReactElement | null {
  if (!posts.length) return null;

  return (
    <section
      className="relative w-full overflow-hidden"
      data-section="BlogDetailRelatedPosts"
      style={{
        // Figma 330:522 — dark gradient matching the hero
        background: "linear-gradient(180deg, #151021 0%, #131e8f 62.497%, #471ec0 100%)",
        minHeight: "928px",
      }}
    >
      <div className="relative mx-auto max-w-[1276px] px-6">
        {/* Header row */}
        <div className="flex items-center justify-between pt-[80px]">
          <h2
            className="leading-none"
            style={{
              fontFamily: "Figtree, sans-serif",
              fontWeight: 700,
              fontSize: "clamp(36px, 4.3vw, 62px)",
              letterSpacing: "-0.05em",
              lineHeight: 1,
            }}
          >
            <span className="text-white">Related </span>
            <span
              style={{
                backgroundImage: "linear-gradient(101.688deg, #9A51FF 1.758%, #2CC1EB 98.781%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Posts
            </span>
          </h2>

          <Link
            href="/blogs"
            className="flex items-center gap-2 group"
            aria-label="See all blog posts"
          >
            <span
              className="text-white group-hover:text-[#2CC1EB] transition-colors duration-200"
              style={{ fontFamily: "Figtree, sans-serif", fontWeight: 700, fontSize: "clamp(20px, 2.2vw, 32px)", letterSpacing: "-0.05em", lineHeight: 1 }}
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
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 mt-[114px] pb-[80px]">
          {posts.map((post) => (
            <RelatedPostCard key={post.id} post={post} />
          ))}
        </div>
      </div>
    </section>
  );
}

function RelatedPostCard({ post }: { post: Blog }): React.ReactElement {
  const primaryCategory = post.categories?.[0];

  return (
    <Link
      href={`/blog/${post.slug}`}
      className="block group"
      aria-label={post.title}
    >
      <article
        className="relative overflow-hidden flex flex-col h-full"
        style={{
          background: "#fff",
          borderRadius: "32px",
          boxShadow: "0px 3px 7px 0px rgba(0,0,0,0.02), 0px 13px 13px 0px rgba(0,0,0,0.01), 0px 29px 17px 0px rgba(0,0,0,0.01), 0px 52px 21px 0px rgba(0,0,0,0), 0px 81px 23px 0px rgba(0,0,0,0)",
        }}
      >
        {/* Hero image */}
        <div className="relative shrink-0 mx-3 mt-3 rounded-[20px] overflow-hidden" style={{ height: "200px" }}>
          {post.heroImage ? (
            <Image
              src={post.heroImage.url}
              alt={post.heroImage.alt ?? post.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div
              className="w-full h-full"
              style={{ background: "linear-gradient(135deg, #131e8f 0%, #471ec0 100%)" }}
            />
          )}
        </div>

        {/* Category badge */}
        {primaryCategory && (
          <div className="relative mx-[32px] mt-[-14px] mb-0 self-start">
            <div className="relative inline-flex items-center gap-[10px] px-[12px] py-[6px] rounded-[8px] overflow-hidden">
              <Image
                src="/images/blog-detail/related-card-category-bg.png"
                alt=""
                aria-hidden
                fill
                className="object-cover pointer-events-none select-none"
              />
              <span
                className="relative z-10 whitespace-nowrap"
                style={{ fontFamily: "Figtree, sans-serif", fontWeight: 500, fontSize: "16px", lineHeight: 1.3, color: "#4a3bf1" }}
              >
                {primaryCategory.name}
              </span>
            </div>
          </div>
        )}

        {/* Card content */}
        <div className="flex flex-col gap-[12px] px-[32px] pt-[24px] pb-[32px] flex-1">
          {/* Meta: date + read time */}
          <div className="flex items-center gap-4">
            {post.publishedAt && (
              <div className="flex items-center gap-1">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/images/blogs/icon-calendar.svg" alt="" aria-hidden width={18} height={18} className="shrink-0" />
                <span style={{ fontFamily: "Figtree, sans-serif", fontWeight: 500, fontSize: "14px", color: "#666", lineHeight: "normal" }}>
                  {formatBlogDate(post.publishedAt)}
                </span>
              </div>
            )}
            {post.readingMinutes != null && (
              <div className="flex items-center gap-1">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/images/blogs/icon-clock.svg" alt="" aria-hidden width={18} height={18} className="shrink-0" />
                <span style={{ fontFamily: "Figtree, sans-serif", fontWeight: 500, fontSize: "14px", color: "#666", lineHeight: "normal" }}>
                  {post.readingMinutes} min read
                </span>
              </div>
            )}
          </div>

          {/* Title */}
          <h3
            className="line-clamp-3 flex-1"
            style={{ fontFamily: "Figtree, sans-serif", fontWeight: 500, fontSize: "24px", lineHeight: 1.3, color: "#111" }}
          >
            {post.title}
          </h3>

          {/* Abstract */}
          {post.abstract && (
            <p
              className="line-clamp-3"
              style={{ fontFamily: "Figtree, sans-serif", fontWeight: 400, fontSize: "16px", lineHeight: 1.3, color: "rgba(17,17,17,0.54)" }}
            >
              {post.abstract}
            </p>
          )}

          {/* Read more */}
          <div className="flex items-center gap-2 mt-auto pt-2">
            <span
              className="group-hover:text-[#3928e0] transition-colors duration-200"
              style={{ fontFamily: "Figtree, sans-serif", fontWeight: 500, fontSize: "20px", lineHeight: 1.5, color: "#4a3bf1" }}
            >
              Read more
            </span>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/blog-detail/icon-read-more-arrow.svg"
              alt=""
              aria-hidden
              width={24}
              height={24}
              className="w-6 h-6 group-hover:translate-x-1 transition-transform duration-200"
              loading="lazy"
              decoding="async"
            />
          </div>
        </div>
      </article>
    </Link>
  );
}
