import Link from "next/link";
import type { Blog } from "@/lib/blog";
import { EmptyState } from "@/components/feedback";
import { Pagination } from "@/components/ui/Pagination";
import { Reveal, RevealStagger, RevealItem } from "@/components/ui/Reveal";
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
      style={{ background: "#f6f6f6", paddingBottom: "var(--spacing-section-cta)" }}
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
        <Reveal header>
          <h2
            className="font-display font-bold"
            style={{
              fontSize: "var(--fs-h1)",
              letterSpacing: "var(--text-t-display-2-ls)",
              lineHeight: "var(--text-t-display-2-lh)",
              color: "#111",
              paddingTop: "var(--spacing-section-sm)",
              paddingBottom: "clamp(28px, 3.5vw, 56px)",
            }}
          >
            Latest Blogs
          </h2>
        </Reveal>

        {posts.length === 0 ? (
          activeCategory || searchQuery ? (
            <EmptyState
              variant="no-results"
              actions={
                <Link
                  href="/blogs"
                  className="font-medium text-[#4a3bf1] underline underline-offset-4"
                  style={{ fontSize: "var(--fs-body)" }}
                >
                  Clear filters
                </Link>
              }
            />
          ) : (
            <EmptyState
              variant="empty"
              title="No posts yet"
              description="Check back soon — new articles are on the way."
            />
          )
        ) : (
          <>
            {/* 3-column grid of cards */}
            <RevealStagger
              className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3"
              style={{ gap: "32px", justifyItems: "center" }}
            >
              {posts.map((post) => (
                <RevealItem key={post.id}>
                  <BlogCard post={post} />
                </RevealItem>
              ))}
            </RevealStagger>

            {/* DESKTOP — full numbered pagination. */}
            <div className="hidden lg:block">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                buildHref={(p) => buildPageHref(p, activeCategory, searchQuery)}
              />
            </div>

            {/* MOBILE — compact "< num >" pagination per Figma 817:3915 spec. */}
            {totalPages > 1 && (
              <CompactMobilePagination
                currentPage={currentPage}
                totalPages={totalPages}
                buildHref={(p) =>
                  buildPageHref(p, activeCategory, searchQuery)
                }
              />
            )}
          </>
        )}
      </div>
    </section>
  );
}

interface CompactMobilePaginationProps {
  currentPage: number;
  totalPages: number;
  buildHref: (page: number) => string;
}

function CompactMobilePagination({
  currentPage,
  totalPages,
  buildHref,
}: CompactMobilePaginationProps): React.ReactElement {
  const prevDisabled = currentPage <= 1;
  const nextDisabled = currentPage >= totalPages;
  return (
    <nav
      aria-label="Pagination"
      className="lg:hidden flex items-center justify-center"
      style={{ gap: "16px", marginTop: "40px" }}
    >
      {prevDisabled ? (
        <span
          aria-disabled
          aria-label="Previous page"
          className="inline-flex items-center justify-center select-none"
          style={{ width: "24px", height: "24px", opacity: 0.32 }}
        >
          <ChevronArrow direction="left" />
        </span>
      ) : (
        <Link
          href={buildHref(currentPage - 1)}
          aria-label="Previous page"
          rel="prev"
          className="inline-flex items-center justify-center"
          style={{ width: "24px", height: "24px" }}
        >
          <ChevronArrow direction="left" />
        </Link>
      )}
      <span
        aria-current="page"
        className="font-sans"
        style={{
          fontSize: "var(--fs-body)",
          fontWeight: 600,
          color: "#4a3bf1",
          minWidth: "24px",
          textAlign: "center",
        }}
      >
        {currentPage}
      </span>
      {nextDisabled ? (
        <span
          aria-disabled
          aria-label="Next page"
          className="inline-flex items-center justify-center select-none"
          style={{ width: "24px", height: "24px", opacity: 0.32 }}
        >
          <ChevronArrow direction="right" />
        </span>
      ) : (
        <Link
          href={buildHref(currentPage + 1)}
          aria-label="Next page"
          rel="next"
          className="inline-flex items-center justify-center"
          style={{ width: "24px", height: "24px" }}
        >
          <ChevronArrow direction="right" />
        </Link>
      )}
    </nav>
  );
}

function ChevronArrow({
  direction,
}: {
  direction: "left" | "right";
}): React.ReactElement {
  const path =
    direction === "right" ? "M9 6l6 6-6 6" : "M15 18l-6-6 6-6";
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d={path}
        stroke="#4a3bf1"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
