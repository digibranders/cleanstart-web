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
  type EventsListResponse,
} from "@/lib/events";
import { buildPageMetadata } from "@/lib/seo/canonical";
import { JsonLd, breadcrumbSchema } from "@/lib/seo/jsonld";

const TITLE = "Events";
const DESCRIPTION =
  "Meet the CleanStart team in person at upcoming conferences and explore highlights from past events.";

interface EventsPageProps {
  searchParams: Promise<{ page?: string }>;
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

  let pastFailed = false;
  const [upcoming, past] = await Promise.all([
    getUpcomingEvents({ limit: 1 }).catch(emptyList),
    getPastEvents({ page, limit: 9 }).catch(() => {
      pastFailed = true;
      return emptyList();
    }),
  ]);

  const upcomingEvent = upcoming.docs[0] ?? null;

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
        <UpcomingEventHero event={upcomingEvent} />
        <FadeUp>
          <PastEventsGrid
            events={past.docs}
            currentPage={past.page}
            totalPages={past.totalPages}
            loadFailed={pastFailed}
          />
        </FadeUp>
      </main>
      <Footer cta={<EventsCTA />} />
    </>
  );
}
