import type { Metadata } from "next";
import { Suspense } from "react";
import { Header } from "@/components/nav/Header";
import { Footer } from "@/components/sections/Footer";
import { EventsBrowser } from "@/components/sections/events/EventsBrowser";
import { UpcomingEventHero } from "@/components/sections/events/UpcomingEventHero";
import {
  EventsContent,
  selectPastEvents,
  PAST_EVENTS_PAGE_SIZE,
} from "@/components/sections/events/EventsContent";
import { EventsCTA } from "@/components/sections/events/EventsCTA";
import { CrawlableLinkIndex } from "@/components/ui/CrawlableLinkIndex";
import {
  getUpcomingEvents,
  getPastEvents,
  type EventsListResponse,
} from "@/lib/events";
import { buildListingMetadata } from "@/lib/seo/canonical";
import { JsonLd, breadcrumbSchema, itemListSchema } from "@/lib/seo/jsonld";

// Re-render hourly so the upcoming/past split and country data stay fresh
// without requiring a new deploy. On-demand revalidation (CMS afterChange hook
// on the Events collection) handles instant updates when an event is published.
export const revalidate = 3600;

const TITLE = "Events";
const DESCRIPTION =
  "Explore CleanStart's past and upcoming events including DevOps, DevSecOps, and cybersecurity conferences, summits, and meetups across India and beyond.";

export function generateMetadata(): Metadata {
  return buildListingMetadata({ title: TITLE, description: DESCRIPTION, basePath: "/events", eyebrow: "Events" });
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
      {(upcomingEvents.length > 0 || allPastEvents.length > 0) && (
        <JsonLd
          id="events-list"
          data={itemListSchema(
            "CleanStart Events",
            "/events",
            [...upcomingEvents, ...allPastEvents].map((e) => ({
              name: e.title,
              path: `/event/${e.slug}`,
            })),
          )}
        />
      )}
      <Header />
      <main id="main-content" style={{ background: "#f6f6f6" }}>
        <UpcomingEventHero events={upcomingEvents} />
        <Suspense
          fallback={
            <EventsContent
              pastEvents={initial.events}
              currentPage={1}
              totalPages={initial.totalPages}
              loadFailed={pastFailed}
            />
          }
        >
          <EventsBrowser allPastEvents={allPastEvents} />
        </Suspense>
        {/*
          Only the first upcoming event is guaranteed a real anchor in the
          served HTML: with a single upcoming event `FeaturedEventCard` renders
          directly, and with several the carousel still server-renders just
          its initial slide (the rest live in the client-side hydration
          payload). Past events beyond `PAST_EVENTS_PAGE_SIZE` are likewise
          client-pagination-only. Cover both gaps here.
        */}
        <CrawlableLinkIndex
          label="All events"
          items={[
            ...upcomingEvents.slice(1),
            ...allPastEvents.slice(PAST_EVENTS_PAGE_SIZE),
          ].map((e) => ({
            href: `/event/${e.slug}`,
            title: e.title,
          }))}
        />
      </main>
      <Footer cta={<EventsCTA />} />
    </>
  );
}
