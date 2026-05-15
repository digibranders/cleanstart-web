import Link from "next/link";
import type { Blog } from "@/lib/blog";
import { BlogCard } from "./BlogCard";

interface LatestBlogsProps {
  posts: Blog[];
  hasMore: boolean;
  currentPage: number;
  activeCategory: string;
  searchQuery: string;
}

export function LatestBlogs({
  posts,
  hasMore,
  currentPage,
  activeCategory,
  searchQuery,
}: LatestBlogsProps): React.ReactElement {
  const nextPageParams = new URLSearchParams();
  if (activeCategory) nextPageParams.set("category", activeCategory);
  if (searchQuery) nextPageParams.set("q", searchQuery);
  nextPageParams.set("page", String(currentPage + 1));

  return (
    <section
      className="relative overflow-hidden"
      style={{ background: "#f6f6f6", paddingBottom: "180px" }}
      data-section="LatestBlogs"
    >
      {/* Radial gradient blobs — Figma 255:9352 left (-616,1407) 1181×1181, 255:9353 right (1238,1512) 1181×1181 */}
      <div
        aria-hidden
        className="pointer-events-none select-none absolute"
        style={{
          left: "-616px",
          top: "1407px",
          width: "1181px",
          height: "1181px",
          background:
            "radial-gradient(ellipse 50% 50% at 50% 50%, #640dfb 0%, rgba(100,13,251,0) 100%)",
          opacity: 0.1,
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none select-none absolute"
        style={{
          left: "1238px",
          top: "1512px",
          width: "1181px",
          height: "1181px",
          background:
            "radial-gradient(ellipse 50% 50% at 50% 50%, #640dfb 0%, rgba(100,13,251,0) 100%)",
          opacity: 0.1,
        }}
      />
      {/* Blur ellipses — Figma 255:9665 left (-70,1946) 258×258 #df9bff blur:243px op:80%, 255:9666 right (1671,1895) 315×315 #2cc1eb blur:203px op:20% */}
      <div
        aria-hidden
        className="pointer-events-none select-none absolute"
        style={{
          left: "-70px",
          top: "1946px",
          width: "258px",
          height: "258px",
          borderRadius: "50%",
          background: "#df9bff",
          filter: "blur(243px)",
          opacity: 0.8,
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none select-none absolute"
        style={{
          left: "1671px",
          top: "1895px",
          width: "315px",
          height: "315px",
          borderRadius: "50%",
          background: "#2cc1eb",
          filter: "blur(203px)",
          opacity: 0.2,
        }}
      />

      <div className="relative mx-auto max-w-[1276px] px-6">
        {/* Section heading */}
        <h2
          className="font-sans font-bold"
          style={{
            fontSize: "clamp(2rem,3.61vw,3.25rem)",
            lineHeight: "normal",
            color: "#111",
            paddingTop: "60px",
            paddingBottom: "86px",
          }}
        >
          Latest Blogs
        </h2>

        {posts.length === 0 ? (
          <p
            className="font-sans text-center py-20"
            style={{ color: "rgba(17,17,17,0.54)", fontSize: "1.125rem" }}
          >
            No posts found.
          </p>
        ) : (
          <>
            {/* 3-column grid of cards */}
            <div
              className="grid"
              style={{
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: "32px",
              }}
            >
              {posts.map((post) => (
                <BlogCard key={post.id} post={post} />
              ))}
            </div>

            {/* View More button */}
            {hasMore && (
              <div className="flex justify-center mt-[60px]">
                <Link
                  href={`/blogs?${nextPageParams.toString()}`}
                  className="cs-btn-blue gap-2"
                  style={{ width: "156px", height: "44px", fontSize: "1.125rem" }}
                >
                  View More
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/images/blogs/icon-arrow-right.svg"
                    alt=""
                    aria-hidden
                    width={25}
                    height={22}
                    className="pointer-events-none select-none"
                    loading="lazy"
                    decoding="async"
                  />
                </Link>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
