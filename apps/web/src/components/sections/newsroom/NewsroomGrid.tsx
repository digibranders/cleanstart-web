import Link from "next/link";
import type { News } from "@/lib/news";
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
      style={{ background: "#f6f6f6", paddingTop: "80px", paddingBottom: "240px" }}
      data-section="NewsroomGrid"
    >
      {/* Radial gradient blobs — match blog listing visual language */}
      <div
        aria-hidden
        className="pointer-events-none select-none absolute"
        style={{
          left: "-616px",
          top: "600px",
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
          right: "-616px",
          top: "900px",
          width: "1181px",
          height: "1181px",
          background:
            "radial-gradient(ellipse 50% 50% at 50% 50%, #640dfb 0%, rgba(100,13,251,0) 100%)",
          opacity: 0.1,
        }}
      />

      <div className="relative mx-auto max-w-[1276px] px-6">
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
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
              style={{ gap: "24px" }}
            >
              {items.map((item) => (
                <NewsroomCard key={item.id} item={item} />
              ))}
            </div>

            {totalPages > 1 && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                activeCategory={activeCategory}
                searchQuery={searchQuery}
              />
            )}
          </>
        )}
      </div>
    </section>
  );
}

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  activeCategory: string;
  searchQuery: string;
}

function Pagination({
  currentPage,
  totalPages,
  activeCategory,
  searchQuery,
}: PaginationProps): React.ReactElement {
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <nav
      aria-label="Pagination"
      className="flex items-center justify-center mt-[64px]"
      style={{ gap: "12px" }}
    >
      {pages.map((p) => {
        const active = p === currentPage;
        const href = buildPageHref(p, activeCategory, searchQuery);
        return (
          <Link
            key={p}
            href={href}
            aria-current={active ? "page" : undefined}
            aria-label={`Go to page ${p}`}
            className="flex items-center justify-center text-sm font-medium leading-none transition-colors"
            style={{
              width: active ? "32px" : "12px",
              height: "12px",
              borderRadius: "999px",
              background: active ? "#4a3bf1" : "rgba(17,17,17,0.18)",
              color: active ? "#fff" : "transparent",
              fontSize: "0",
            }}
          >
            {p}
          </Link>
        );
      })}
    </nav>
  );
}
