import Link from "next/link";
import type { Resource } from "@/lib/resources";
import { Pagination } from "@/components/ui/Pagination";
import { ResourceCard } from "./ResourceCard";

interface ResourceGridProps {
  resources: Resource[];
  currentPage: number;
  totalPages: number;
  activeType: string;
  searchQuery: string;
}

function buildPageHref(
  page: number,
  activeType: string,
  searchQuery: string,
): string {
  const params = new URLSearchParams();
  if (activeType) params.set("type", activeType);
  if (searchQuery) params.set("q", searchQuery);
  if (page > 1) params.set("page", String(page));
  const qs = params.toString();
  return qs ? `/resource-center?${qs}` : "/resource-center";
}

export function ResourceGrid({
  resources,
  currentPage,
  totalPages,
  activeType,
  searchQuery,
}: ResourceGridProps): React.ReactElement {
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

      {/* MOBILE — single "View More →" button per Figma mobile spec (444:401). */}
      {totalPages > 1 && currentPage < totalPages && (
        <div className="flex lg:hidden justify-center" style={{ marginTop: "40px" }}>
          <Link
            href={buildPageHref(currentPage + 1, activeType, searchQuery)}
            rel="next"
            className="font-sans inline-flex items-center gap-2"
            style={{
              height: "44px",
              padding: "0 20px",
              borderRadius: "10px",
              background: "white",
              color: "#4a3bf1",
              fontSize: "15px",
              fontWeight: 500,
              border: "1px solid rgba(74,59,241,0.25)",
              boxShadow:
                "0px 3px 7px 0px rgba(0,0,0,0.02), 0px 13px 13px 0px rgba(0,0,0,0.01)",
            }}
          >
            View More
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
              <path
                d="M3.5 8h9M8.5 4l4 4-4 4"
                stroke="#4a3bf1"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Link>
        </div>
      )}

      {/* DESKTOP — full numbered pagination. */}
      <div className="hidden lg:block">
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          buildHref={(p) => buildPageHref(p, activeType, searchQuery)}
        />
      </div>
    </div>
  );
}
