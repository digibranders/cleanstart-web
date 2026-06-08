import type { Metadata } from "next";
import { Header } from "@/components/nav/Header";
import { Footer } from "@/components/sections/Footer";
import { UpcomingEventHero } from "@/components/sections/events/UpcomingEventHero";
import { PastEventsGrid } from "@/components/sections/events/PastEventsGrid";
import { EventsCTA } from "@/components/sections/events/EventsCTA";
import { FadeUp } from "@/components/ui/FadeUp";
import {
  getUpcomingEvents,
  getPastEvents,
  parseCountryParam,
  parseYearParam,
  type EventsListResponse,
} from "@/lib/events";
import { buildPageMetadata } from "@/lib/seo/canonical";
import { JsonLd, breadcrumbSchema } from "@/lib/seo/jsonld";

const TITLE = "Events";
const DESCRIPTION =
  "Explore CleanStart's past and upcoming events including DevOps, DevSecOps, and cybersecurity conferences, summits, and meetups across India and beyond.";

interface EventsPageProps {
  searchParams: Promise<{ page?: string; country?: string; year?: string }>;
}

export async function generateMetadata({
  searchParams,
}: EventsPageProps): Promise<Metadata> {
  const params = await searchParams;
  const page = Math.max(1, Number.parseInt(params.page ?? "1", 10));
  return buildPageMetadata({
    title: TITLE,
    description: DESCRIPTION,
    path: "/events",
    eyebrow: "Events",
    noindex: page >= 6,
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

export default async function EventsPage({
  searchParams,
}: EventsPageProps): Promise<React.ReactElement> {
  const params = await searchParams;
  const page = Math.max(1, Number.parseInt(params.page ?? "1", 10));
  const activeCountry = parseCountryParam(params.country);
  const activeYear = parseYearParam(params.year);

  let pastFailed = false;
  const [upcoming, past] = await Promise.all([
    getUpcomingEvents({ limit: 10 }).catch(emptyList),
    getPastEvents({
      page,
      limit: 9,
      ...(activeCountry ? { country: activeCountry } : {}),
      ...(activeYear ? { year: activeYear } : {}),
    }).catch(() => {
      pastFailed = true;
      return emptyList();
    }),
  ]);

  const upcomingEvents = upcoming.docs;

  return (
    <>
      <JsonLd
        id="events-breadcrumbs"
        data={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Events" },
        ])}
      />
      <Header />
      <main style={{ background: "#f6f6f6" }}>
        <UpcomingEventHero events={upcomingEvents} />
        <FadeUp>
          <PastEventsGrid
            events={past.docs}
            currentPage={past.page}
            totalPages={past.totalPages}
            activeCountry={activeCountry}
            activeYear={activeYear}
            loadFailed={pastFailed}
          />
        </FadeUp>
      </main>
      <Footer cta={<EventsCTA />} />
    </>
  );
}
