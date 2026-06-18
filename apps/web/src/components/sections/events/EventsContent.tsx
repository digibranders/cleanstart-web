import { UpcomingEventHero } from "@/components/sections/events/UpcomingEventHero";
import { PastEventsGrid } from "@/components/sections/events/PastEventsGrid";
import { FadeUp } from "@/components/ui/FadeUp";
import type { Event, EventCountry } from "@/lib/events";

export interface EventsContentProps {
  upcomingEvents: Event[];
  pastEvents: Event[];
  currentPage: number;
  totalPages: number;
  activeCountry?: EventCountry | undefined;
  activeYear?: number | undefined;
  loadFailed?: boolean;
}

/**
 * Presentational body of the /events listing — the upcoming-events hero plus the
 * filtered/paginated past-events grid. Pure props, no data fetching, so it
 * renders identically on the server (static fallback) and the client
 * (`EventsBrowser`, which drives the past-events filters from the URL). The
 * upcoming section is always the full server-fetched set. See
 * `BlogsContent.tsx` for the pattern.
 */
export function EventsContent({
  upcomingEvents,
  pastEvents,
  currentPage,
  totalPages,
  activeCountry,
  activeYear,
  loadFailed = false,
}: EventsContentProps): React.ReactElement {
  return (
    <main id="main-content" style={{ background: "#f6f6f6" }}>
      <UpcomingEventHero events={upcomingEvents} />
      <FadeUp>
        <PastEventsGrid
          events={pastEvents}
          currentPage={currentPage}
          totalPages={totalPages}
          activeCountry={activeCountry}
          activeYear={activeYear}
          loadFailed={loadFailed}
        />
      </FadeUp>
    </main>
  );
}

/** Page size for the past-events grid (matches the prior server getPastEvents default). */
export const PAST_EVENTS_PAGE_SIZE = 9;

/**
 * Client-safe filter + paginate over the full past-events set — mirrors the
 * `getPastEvents` server where-clauses (`country` equals; `startsAt` within
 * `[year-01-01, (year+1)-01-01)`), now in memory so the route stays static. The
 * "past" constraint (`startsAt <= now`) is already satisfied because only past
 * events are passed in.
 */
export function selectPastEvents(
  all: Event[],
  {
    country,
    year,
    page,
  }: { country?: EventCountry | undefined; year?: number | undefined; page: number },
): { events: Event[]; totalPages: number } {
  const yearStart = year ? Date.UTC(year, 0, 1) : null;
  const yearEnd = year ? Date.UTC(year + 1, 0, 1) : null;

  const filtered = all.filter((event) => {
    if (country && event.country !== country) return false;
    if (yearStart !== null && yearEnd !== null) {
      if (!event.startsAt) return false;
      const ts = new Date(event.startsAt).getTime();
      if (Number.isNaN(ts) || ts < yearStart || ts >= yearEnd) return false;
    }
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAST_EVENTS_PAGE_SIZE));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * PAST_EVENTS_PAGE_SIZE;
  return {
    events: filtered.slice(start, start + PAST_EVENTS_PAGE_SIZE),
    totalPages,
  };
}
