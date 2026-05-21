import type { News } from "@/lib/news";
import { Pagination } from "@/components/ui/Pagination";
import { NewsroomCard } from "./NewsroomCard";

interface NewsroomGridProps {
  items: News[];
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
  return qs ? `/news?${qs}` : "/news";
}

export function NewsroomGrid({
  items,
  currentPage,
  totalPages,
  activeCategory,
  searchQuery,
}: NewsroomGridProps): React.ReactElement {
  return (
    <section
      className="relative overflow-hidden"
      style={{ background: "#f6f6f6", paddingTop: "clamp(48px, 6vw, 80px)", paddingBottom: "var(--spacing-section-cta)" }}
      data-section="NewsroomGrid"
    >
      {/* Radial gradient unions — Figma node 402:5013, four 1181×1181 #640DFB blobs at 10% opacity.
          Top pair anchored to section top; bottom pair anchored to section bottom so the lower
          unions track the listing's actual height regardless of page count. */}
      <div
        aria-hidden
        className="pointer-events-none select-none absolute"
        style={{
          left: "-641px",
          top: "-591px",
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
          left: "1283px",
          top: "-560px",
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
          left: "-532px",
          bottom: "-411px",
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
          bottom: "-262px",
          width: "1181px",
          height: "1181px",
          background:
            "radial-gradient(ellipse 50% 50% at 50% 50%, #640dfb 0%, rgba(100,13,251,0) 100%)",
          opacity: 0.1,
        }}
      />

      {/* Gridlines — reuses LatestBlogs SVG (same visual treatment in Figma 402:5013).
          1920×719 SVG with baked-in radial-gradient fade pinned to section bottom. */}
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

      {/* Blur ellipses — Figma Ellipse 46683 (pink, left, 258×258, blur 121.5px, op 80%)
          and Ellipse 46692 (cyan, right, 315×315, blur 101.5px, op 20%). Anchored to
          section bottom so they sit just above the CTA/footer. */}
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

      <div className="relative mx-auto max-w-[var(--container-default)] px-6">
        {items.length === 0 ? (
          <p
            className="font-sans text-center py-20"
            style={{ color: "rgba(17,17,17,0.54)", fontSize: "1.125rem" }}
          >
            No news yet — check back soon.
          </p>
        ) : (
          <>
            <div
              className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3"
              style={{ gap: "32px", justifyItems: "center" }}
            >
              {items.map((item) => (
                <NewsroomCard key={item.id} item={item} />
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
