import dynamic from "next/dynamic";
import Link from "next/link";
import type { Event, EventCountry } from "@/lib/events";
import { EmptyState } from "@/components/feedback";
import { Pagination } from "@/components/ui/Pagination";
import { Reveal, RevealStagger, RevealItem } from "@/components/ui/Reveal";
import { EventCard } from "./EventCard";
// Code-split the interactive client sidebar out of the initial /events bundle.
const EventFilters = dynamic(() =>
  import("./EventFilters").then((m) => ({ default: m.EventFilters })),
);

interface PastEventsGridProps {
  events: Event[];
  currentPage: number;
  totalPages: number;
  activeCountry?: EventCountry | undefined;
  activeYear?: number | undefined;
  /** True when the CMS fetch failed (vs. a genuinely empty result). */
  loadFailed?: boolean;
}

function buildPageHref(
  page: number,
  country: EventCountry | undefined,
  year: number | undefined,
): string {
  const params = new URLSearchParams();
  if (country) params.set("country", country);
  if (year) params.set("year", String(year));
  if (page > 1) params.set("page", String(page));
  const qs = params.toString();
  return qs ? `/events?${qs}` : "/events";
}

export function PastEventsGrid({
  events,
  currentPage,
  totalPages,
  activeCountry,
  activeYear,
  loadFailed = false,
}: PastEventsGridProps): React.ReactElement {
  const hasFilters = Boolean(activeCountry || activeYear);
  return (
    <section
      className="relative"
      style={{
        background: "#f6f6f6",
        paddingBottom: "var(--spacing-section-cta)",
        // `overflow: clip` clips the decorative layers on both axes like
        // `hidden`, but (unlike `hidden`) it does NOT establish a scroll
        // container, so the sticky filter sidebar tracks the window scroll.
        overflow: "clip",
      }}
      data-section="PastEvents"
    >
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
      <div
        aria-hidden
        className="pointer-events-none select-none absolute left-0 right-0 bottom-0 overflow-hidden"
        style={{ height: "719px" }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/shared/listing-gridlines.svg"
          alt=""
          aria-hidden
          className="absolute top-0 left-1/2 -translate-x-1/2 pointer-events-none select-none"
          style={{ width: "1920px", height: "719px", maxWidth: "none" }}
          loading="lazy"
          decoding="async"
        />
      </div>
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
        <Reveal header>
          <h2
            className="font-display font-bold"
            style={{
              fontSize: "var(--fs-h2)",
              lineHeight: "1.1",
              letterSpacing: "-0.04em",
              color: "#111",
              paddingTop: "60px",
              paddingBottom: "32px",
            }}
          >
            Past Events
          </h2>
        </Reveal>

        <div className="flex flex-col lg:flex-row lg:items-start lg:gap-8">
          <aside
            className="shrink-0 lg:sticky lg:max-h-[calc(100vh-112px)] lg:overflow-y-auto"
            style={{ top: "96px", alignSelf: "flex-start" }}
          >
            <EventFilters activeCountry={activeCountry} activeYear={activeYear} />
          </aside>

          <div className="flex-1 min-w-0">
            {events.length === 0 ? (
              loadFailed ? (
                <EmptyState variant="load-failed" />
              ) : hasFilters ? (
                <EmptyState
                  variant="no-results"
                  title="No events match these filters"
                  actions={
                    <Link
                      href="/events"
                      className="font-sans font-medium text-[#4a3bf1] underline underline-offset-4"
                      style={{ fontSize: "var(--fs-body)" }}
                    >
                      Clear filters
                    </Link>
                  }
                />
              ) : (
                <EmptyState
                  variant="empty"
                  title="No past events yet"
                  description="Check back after our next event wraps up."
                />
              )
            ) : (
              <>
                <RevealStagger
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 justify-items-center lg:justify-items-stretch"
                  style={{ gap: "32px" }}
                >
                  {events.map((event) => (
                    <RevealItem key={event.id} className="w-full flex justify-center">
                      <EventCard event={event} />
                    </RevealItem>
                  ))}
                </RevealStagger>

                {totalPages > 1 && currentPage < totalPages && (
                  <div className="flex lg:hidden justify-center" style={{ marginTop: "40px" }}>
                    <Link
                      href={buildPageHref(currentPage + 1, activeCountry, activeYear)}
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

                <div className="hidden lg:block">
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    buildHref={(p) => buildPageHref(p, activeCountry, activeYear)}
                  />
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
