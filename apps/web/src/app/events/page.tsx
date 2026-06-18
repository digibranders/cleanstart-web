import type { Metadata } from "next";
import { Suspense } from "react";
import { Header } from "@/components/nav/Header";
import { Footer } from "@/components/sections/Footer";
import { EventsBrowser } from "@/components/sections/events/EventsBrowser";
import {
  EventsContent,
  selectPastEvents,
} from "@/components/sections/events/EventsContent";
import { EventsCTA } from "@/components/sections/events/EventsCTA";
import {
  getUpcomingEvents,
  getPastEvents,
  type EventsListResponse,
} from "@/lib/events";
import { buildPageMetadata } from "@/lib/seo/canonical";
import { JsonLd, breadcrumbSchema } from "@/lib/seo/jsonld";

const TITLE = "Events";
const DESCRIPTION =
  "Explore CleanStart's past and upcoming events including DevOps, DevSecOps, and cybersecurity conferences, summits, and meetups across India and beyond.";

export function generateMetadata(): Metadata {
  return buildPageMetadata({
    title: TITLE,
    description: DESCRIPTION,
    path: "/events",
    eyebrow: "Events",
  });
}

const emptyList = (): EventsListResponse => ({
  docs: [],
  totalDocs: 0,
  hasNextPage: false,
  hasPrevPage: false,
  page: 1,
  totalPages: 1,
});

/**
 * Static listing. Upcoming events and the full past-events set are fetched once
 * (cacheable, no `searchParams` on the server) and the country/year/page filters
 * for past events run on the client (`EventsBrowser`), so the route is served as
 * static HTML instead of rendered per request. The Suspense fallback is the
 * server-rendered default (unfiltered, page 1) view — that's what lands in the
 * static HTML, so crawlers and no-JS clients still get the first page. See
 * /blogs for the pattern.
 */
export default async function EventsPage(): Promise<React.ReactElement> {
  let pastFailed = false;
  const [upcoming, past] = await Promise.all([
    getUpcomingEvents({ limit: 10 }).catch(emptyList),
    getPastEvents({ limit: 1000 }).catch(() => {
      pastFailed = true;
      return emptyList();
    }),
  ]);

  const upcomingEvents = upcoming.docs;
  const allPastEvents = past.docs;
  const initial = selectPastEvents(allPastEvents, { page: 1 });

  return (
    <>
      <JsonLd
        id="events-breadcrumbs"
        data={breadcrumbSchema([{ name: "Home", path: "/" }, { name: "Events" }])}
      />
      <Header />
      <Suspense
        fallback={
          <EventsContent
            upcomingEvents={upcomingEvents}
            pastEvents={initial.events}
            currentPage={1}
            totalPages={initial.totalPages}
            loadFailed={pastFailed}
          />
        }
      >
        <EventsBrowser
          upcomingEvents={upcomingEvents}
          allPastEvents={allPastEvents}
        />
      </Suspense>
      <Footer cta={<EventsCTA />} />
    </>
  );
}
