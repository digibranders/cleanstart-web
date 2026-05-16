import Link from "next/link";
import type { Resource } from "@/lib/resources";
import { ResourceCard } from "./ResourceCard";

interface ResourceGridProps {
  resources: Resource[];
  hasMore: boolean;
  currentPage: number;
  activeType: string;
  searchQuery: string;
}

export function ResourceGrid({
  resources,
  hasMore,
  currentPage,
  activeType,
  searchQuery,
}: ResourceGridProps): React.ReactElement {
  function nextPageHref(): string {
    const params = new URLSearchParams();
    params.set("page", String(currentPage + 1));
    if (activeType) params.set("type", activeType);
    if (searchQuery) params.set("q", searchQuery);
    return `/resource-center?${params.toString()}`;
  }

  if (resources.length === 0) {
    return (
      <div
        className="flex-1 flex items-center justify-center"
        style={{ minHeight: "400px" }}
      >
        <p
          className="text-xl font-normal leading-[1.4] tracking-[-0.04em] text-center"
          style={{ color: "rgba(17,17,17,0.54)" }}
        >
          No resources found.{" "}
          {activeType || searchQuery ? (
            <Link href="/resource-center" className="text-[#4a3bf1] underline">
              Clear filters
            </Link>
          ) : null}
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      {/* Grid — single column on mobile, 2-col on tablet, 3-col on desktop */}
      <div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 justify-items-center lg:justify-items-start"
      >
        {resources.map((resource) => (
          <ResourceCard key={resource.id} resource={resource} />
        ))}
      </div>

      {/* View More / Load More button */}
      {hasMore && (
        <div className="flex justify-center mt-10">
          <Link
            href={nextPageHref()}
            className="cs-btn-blue relative overflow-hidden gap-2"
            style={{ height: "44px", padding: "0 20px", fontSize: "1.125rem" }}
          >
            {/* Bottom-center glow — matches Figma Ellipse3938 layer-blur */}
            <span
              aria-hidden
              className="absolute pointer-events-none select-none"
              style={{
                width: "100px",
                height: "30px",
                bottom: "-8px",
                left: "50%",
                transform: "translateX(-50%)",
                borderRadius: "50%",
                background: "rgba(255,255,255,0.6)",
                filter: "blur(10px)",
              }}
            />
            View More
            <svg
              width="22"
              height="20"
              viewBox="0 0 22 20"
              fill="none"
              aria-hidden
            >
              <path
                d="M4 10h14M12 4l6 6-6 6"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Link>
        </div>
      )}
    </div>
  );
}
