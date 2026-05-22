import type { Blog } from "@/lib/blog";
import { Pagination } from "@/components/ui/Pagination";
import { BlogCard } from "./BlogCard";

interface LatestBlogsProps {
  posts: Blog[];
  currentPage: number;
  totalPages: number;
  activeCategory: string;
  searchQuery: string;
}

function buildPageHref(
  page: number,
  activeCategory: string,
  searchQuery: string,
): string {
  const params = new URLSearchParams();
  if (activeCategory) params.set("category", activeCategory);
  if (searchQuery) params.set("q", searchQuery);
  if (page > 1) params.set("page", String(page));
  const qs = params.toString();
  return qs ? `/blogs?${qs}` : "/blogs";
}

export function LatestBlogs({
  posts,
  currentPage,
  totalPages,
  activeCategory,
  searchQuery,
}: LatestBlogsProps): React.ReactElement {
  return (
    <section
      className="relative overflow-hidden"
      style={{ background: "#f6f6f6", paddingBottom: "250px" }}
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
      {/* Gridlines — Figma node 371:2016. 1920×719 SVG whose paths are filled
          by two radial gradients (#640DFB) centred at (-25.5, 590.5) and
          (1828.5, 695.5), so the grid cells naturally fade from purple-tinted
          near the lower corners to invisible toward the centre. The fade
          effect lives inside the SVG — no extra mask or opacity wrapper. */}
      <div
        aria-hidden
        className="pointer-events-none select-none absolute left-0 right-0 bottom-0 overflow-hidden"
        style={{ height: "719px" }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/blogs/latest-blogs-gridlines.svg"
          alt=""
          aria-hidden
          className="absolute top-0 left-1/2 -translate-x-1/2 pointer-events-none select-none"
          style={{ width: "1920px", height: "719px", maxWidth: "none" }}
          loading="lazy"
          decoding="async"
        />
      </div>

      {/* Blur ellipses — Figma Ellipse 46683 left 258×258 #DF9BFF blur:121.5px op:80%, Ellipse 46692 right 315×315 #2CC1EB blur:101.5px op:20%. Anchored to section bottom so they sit just above the CTA/footer regardless of card-grid height. */}
      <div
        aria-hidden
        className="pointer-events-none select-none absolute"
        style={{
          left: "-70px",
          bottom: "0px",
          width: "258px",
          height: "258px",
          borderRadius: "50%",
          background: "#df9bff",
          filter: "blur(121.5px)",
          opacity: 0.8,
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none select-none absolute"
        style={{
          right: "-66px",
          bottom: "0px",
          width: "315px",
          height: "315px",
          borderRadius: "50%",
          background: "#2cc1eb",
          filter: "blur(101.5px)",
          opacity: 0.2,
        }}
      />

      <div className="relative mx-auto max-w-[var(--container-default)] px-6 sm:px-10">
        {/* Section heading */}
        <h2
          className="font-display font-bold"
          style={{
            fontSize: "var(--text-t-display-2)",
            letterSpacing: "var(--text-t-display-2-ls)",
            lineHeight: "var(--text-t-display-2-lh)",
            color: "#111",
            paddingTop: "var(--spacing-section-sm)",
            paddingBottom: "clamp(28px, 3.5vw, 56px)",
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
              className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3"
              style={{ gap: "32px", justifyItems: "center" }}
            >
              {posts.map((post) => (
                <BlogCard key={post.id} post={post} />
              ))}
            </div>

            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              buildHref={(p) => buildPageHref(p, activeCategory, searchQuery)}
            />
          </>
        )}
      </div>
    </section>
  );
}
