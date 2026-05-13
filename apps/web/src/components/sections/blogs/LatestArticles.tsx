import Link from "next/link";
import type { Blog } from "@/lib/blog";
import { BlogCard } from "./BlogCard";

interface LatestArticlesProps {
  posts: Blog[];
  hasMore: boolean;
  currentPage: number;
  activeCategory: string;
  searchQuery: string;
}

export function LatestArticles({
  posts,
  hasMore,
  currentPage,
  activeCategory,
  searchQuery,
}: LatestArticlesProps): React.ReactElement {
  const nextPageParams = new URLSearchParams();
  if (activeCategory) nextPageParams.set("category", activeCategory);
  if (searchQuery) nextPageParams.set("q", searchQuery);
  nextPageParams.set("page", String(currentPage + 1));

  return (
    <section
      className="relative overflow-hidden"
      style={{ background: "#f6f6f6", paddingBottom: "120px" }}
      data-section="LatestArticles"
    >
      {/* Decorative blobs — left and right edges */}
      <div
        aria-hidden
        className="pointer-events-none select-none absolute hidden xl:block"
        style={{
          left: "-70px",
          top: "1946px",
          width: "258px",
          height: "258px",
          borderRadius: "50%",
          background:
            "radial-gradient(closest-side, rgba(122,89,255,0.35) 0%, rgba(122,89,255,0) 100%)",
          filter: "blur(40px)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none select-none absolute hidden xl:block"
        style={{
          left: "1671px",
          top: "1895px",
          width: "315px",
          height: "315px",
          borderRadius: "50%",
          background:
            "radial-gradient(closest-side, rgba(122,89,255,0.3) 0%, rgba(122,89,255,0) 100%)",
          filter: "blur(50px)",
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
          Latest Articles
        </h2>

        {posts.length === 0 ? (
          <p
            className="font-sans text-center py-20"
            style={{ color: "rgba(17,17,17,0.54)", fontSize: "18px" }}
          >
            No posts found.
          </p>
        ) : (
          <>
            {/* 3-column grid of cards */}
            <div
              className="grid"
              style={{
                gridTemplateColumns: "repeat(3, 404px)",
                gap: "32px",
                justifyContent: "center",
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
                  className="relative flex items-center justify-center overflow-hidden"
                  style={{
                    width: "156px",
                    height: "44px",
                    borderRadius: "8px",
                    background: "#3960f9",
                    boxShadow:
                      "0 0 0 1.002px #3960f9, 0 1.002px 2.005px -1.002px rgba(9,6,63,0.4), inset 0 1.002px 0 0 rgba(255,255,255,0.16)",
                  }}
                >
                  <span
                    className="font-sans font-medium text-white relative z-10"
                    style={{
                      fontSize: "18px",
                      lineHeight: "24px",
                      letterSpacing: "-0.01em",
                    }}
                  >
                    View More
                  </span>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/images/blogs/icon-arrow-right.svg"
                    alt=""
                    aria-hidden
                    width={25}
                    height={22}
                    className="relative z-10 ml-2 pointer-events-none select-none"
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
