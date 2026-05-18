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
      style={{ background: "#f6f6f6", paddingTop: "80px", paddingBottom: "250px" }}
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
