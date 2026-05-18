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
      style={{ background: "#f6f6f6", paddingBottom: "120px" }}
      data-section="PastEvents"
    >
      {/* Decorative radial gradient blobs — Figma Union vectors */}
      <div
        aria-hidden
        className="pointer-events-none select-none absolute"
        style={{
          left: "-531px",
          top: "-508px",
          width: "1181px",
          height: "1181px",
          background:
            "radial-gradient(ellipse 50% 50% at 50% 50%, #640dfb 0%, rgba(100,13,251,0) 100%)",
          opacity: 0.08,
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none select-none absolute"
        style={{
          right: "-531px",
          top: "-432px",
          width: "1181px",
          height: "1181px",
          background:
            "radial-gradient(ellipse 50% 50% at 50% 50%, #df9bff 0%, rgba(223,155,255,0) 100%)",
          opacity: 0.1,
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none select-none absolute"
        style={{
          left: "-435px",
          bottom: "-508px",
          width: "1181px",
          height: "1181px",
          background:
            "radial-gradient(ellipse 50% 50% at 50% 50%, #2cc1eb 0%, rgba(44,193,235,0) 100%)",
          opacity: 0.1,
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none select-none absolute"
        style={{
          right: "-435px",
          bottom: "-508px",
          width: "1181px",
          height: "1181px",
          background:
            "radial-gradient(ellipse 50% 50% at 50% 50%, #640dfb 0%, rgba(100,13,251,0) 100%)",
          opacity: 0.08,
        }}
      />

      <div className="relative mx-auto max-w-[1276px] px-6">
        <h2
          className="font-display font-bold"
          style={{
            fontSize: "clamp(2.25rem,4.3vw,3.25rem)",
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
            style={{ color: "rgba(17,17,17,0.54)", fontSize: "1.125rem" }}
          >
            No past events to show yet.
          </p>
        ) : (
          <>
            <div
              className="grid justify-items-center"
              style={{
                gridTemplateColumns: "repeat(auto-fit, minmax(320px, 404px))",
                gap: "32px",
                justifyContent: "center",
              }}
            >
              {events.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>

            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              buildHref={buildPageHref}
            />
          </>
        )}
      </div>
    </section>
  );
}
