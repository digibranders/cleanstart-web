import Link from "next/link";
import type { Event } from "@/lib/events";
import { Pagination } from "@/components/ui/Pagination";
import { EventCard } from "./EventCard";

interface PastEventsGridProps {
  events: Event[];
  currentPage: number;
  totalPages: number;
}

function buildPageHref(page: number): string {
  return page > 1 ? `/events?page=${page}` : "/events";
}

export function PastEventsGrid({
  events,
  currentPage,
  totalPages,
}: PastEventsGridProps): React.ReactElement {
  return (
    <section
      className="relative overflow-hidden"
      style={{ background: "#f6f6f6", paddingBottom: "var(--spacing-section-cta)" }}
      data-section="PastEvents"
    >
      {/* Radial gradient blobs — mirrors LatestBlogs (blogs page) */}
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
      {/* Gridlines SVG — fades inside the SVG via radial gradients */}
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
      {/* Blur ellipses anchored to bottom — mirrors LatestBlogs */}
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
        <h2
          className="font-display font-bold"
          style={{
            fontSize: "var(--fs-h1)",
            lineHeight: "1.1",
            letterSpacing: "-0.04em",
            color: "#111",
            paddingTop: "60px",
            paddingBottom: "32px",
          }}
        >
          Past Events
        </h2>

        {events.length === 0 ? (
          <p
            className="font-sans text-center py-20"
            style={{ color: "rgba(17,17,17,0.54)", fontSize: "var(--fs-lead)" }}
          >
            No past events to show yet.
          </p>
        ) : (
          <>
            <div
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 justify-items-center"
              style={{ gap: "32px" }}
            >
              {events.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>

            {/* MOBILE — single "View More →" button per Figma 817:6541. */}
            {totalPages > 1 && currentPage < totalPages && (
              <div className="flex lg:hidden justify-center" style={{ marginTop: "40px" }}>
                <Link
                  href={buildPageHref(currentPage + 1)}
                  rel="next"
                  className="font-sans inline-flex items-center gap-2"
                  style={{
                    height: "44px",
                    padding: "0 20px",
                    borderRadius: "10px",
                    background: "white",
                    color: "#4a3bf1",
                    fontSize: "var(--fs-body-sm)",
                    fontWeight: 500,
                    border: "1px solid rgba(74,59,241,0.25)",
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
                buildHref={buildPageHref}
              />
            </div>
          </>
        )}
      </div>
    </section>
  );
}
