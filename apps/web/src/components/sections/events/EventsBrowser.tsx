"use client";

import { useSearchParams } from "next/navigation";
import {
  EventsContent,
  selectPastEvents,
} from "@/components/sections/events/EventsContent";
import type { Event } from "@/lib/events";
import { parseCountryParam, parseYearParam } from "@/lib/events-utils";

interface EventsBrowserProps {
  upcomingEvents: Event[];
  allPastEvents: Event[];
}

/**
 * Client driver for the /events listing. Reads the country / year / page filters
 * from the URL (`useSearchParams`) and filters the full past-events set in
 * memory, so the route stays statically rendered — the filter sidebar and
 * pagination become instant client-side URL updates against the static page.
 * The upcoming-events section is passed straight through, unfiltered.
 *
 * Must be wrapped in a `<Suspense>` boundary by the page so `useSearchParams`
 * doesn't opt the whole route into client rendering. See `BlogsBrowser.tsx`.
 */
export function EventsBrowser({
  upcomingEvents,
  allPastEvents,
}: EventsBrowserProps): React.ReactElement {
  const params = useSearchParams();
  const activeCountry = parseCountryParam(params.get("country") ?? undefined);
  const activeYear = parseYearParam(params.get("year") ?? undefined);
  const page = Math.max(1, Number.parseInt(params.get("page") ?? "1", 10) || 1);

  const { events, totalPages } = selectPastEvents(allPastEvents, {
    country: activeCountry,
    year: activeYear,
    page,
  });

  return (
    <EventsContent
      upcomingEvents={upcomingEvents}
      pastEvents={events}
      currentPage={Math.min(page, totalPages)}
      totalPages={totalPages}
      activeCountry={activeCountry}
      activeYear={activeYear}
    />
  );
}
