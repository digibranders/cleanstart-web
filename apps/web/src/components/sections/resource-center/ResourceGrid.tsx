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
          className="font-sans font-normal text-center"
          style={{
            fontSize: "20px",
            lineHeight: 1.4,
            color: "rgba(17,17,17,0.54)",
            letterSpacing: "-0.04em",
          }}
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
      {/* 3-column grid — 295px cards, 32px gaps */}
      <div
        className="grid"
        style={{
          gridTemplateColumns: "repeat(3, 295px)",
          gap: "32px",
        }}
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
            className="relative overflow-hidden inline-flex items-center gap-2 font-sans font-medium text-white"
            style={{
              height: "44px",
              padding: "0 20px",
              borderRadius: "8px",
              background: "#3960f9",
              boxShadow:
                "0px 1px 2px -1px rgba(9,6,63,0.4), 0px 0px 0px 1px #3960f9, inset 0px 1px 0px 0px rgba(255,255,255,0.16)",
              fontSize: "18px",
              letterSpacing: "-0.01em",
              textDecoration: "none",
            }}
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
