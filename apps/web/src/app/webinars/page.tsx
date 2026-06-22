import type { Metadata } from "next";
import { Suspense } from "react";
import { Header } from "@/components/nav/Header";
import { Footer } from "@/components/sections/Footer";
import { WebinarsBrowser } from "@/components/sections/webinars/WebinarsBrowser";
import {
  WebinarsContent,
  selectWebinars,
} from "@/components/sections/webinars/WebinarsContent";
import { WebinarsHero } from "@/components/sections/webinars/WebinarsHero";
import { WebinarsCTA } from "@/components/sections/webinars/WebinarsCTA";
import { getWebinars } from "@/lib/webinars";
import { buildListingMetadata } from "@/lib/seo/canonical";
import { JsonLd, breadcrumbSchema, webinarListSchema } from "@/lib/seo/jsonld";

export const revalidate = 3600;

const TITLE = "CleanStart Webinar";
const DESCRIPTION =
  "Live and on-demand webinars on hardened container images, software supply-chain security, and CleanStart product deep-dives.";

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}): Promise<Metadata> {
  const params = await searchParams;
  const page = Math.max(1, Number.parseInt(String(params.page ?? "1"), 10) || 1);
  return buildListingMetadata({ title: TITLE, description: DESCRIPTION, basePath: "/webinars", eyebrow: "Webinar" }, page);
}

/**
 * Static listing. Fetches the full card set once (cacheable, no `searchParams`
 * on the server) and renders statically; type/region filtering and pagination
 * run on the client (`WebinarsBrowser`). The Suspense fallback is the
 * server-rendered default (unfiltered, page 1) view, so the static HTML carries
 * the first page for crawlers. See /blogs for the pattern.
 */
export default async function WebinarsPage(): Promise<React.ReactElement> {
  let loadFailed = false;
  const data = await getWebinars({ limit: 1000 }).catch(() => {
    loadFailed = true;
    return {
      docs: [],
      hasNextPage: false,
      hasPrevPage: false,
      page: 1,
      totalDocs: 0,
      totalPages: 1,
    };
  });

  const allWebinars = data.docs;
  const initial = selectWebinars(allWebinars, {
    type: undefined,
    region: undefined,
    page: 1,
  });

  return (
    <>
      <JsonLd
        id="webinars-breadcrumbs"
        data={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Webinars" },
        ])}
      />
      {allWebinars.length > 0 && (
        <JsonLd
          id="webinars-list"
          data={webinarListSchema(
            allWebinars.map((w) => ({
              title: w.title,
              abstract: w.abstract,
              startsAt: w.startsAt,
              endsAt: w.endsAt,
              eventStatus: w.eventStatus,
              registrationUrl: w.registrationUrl,
            })),
          )}
        />
      )}
      <Header />
      <main id="main-content" style={{ background: "#F6F6F6" }}>
        <div className="relative overflow-hidden">
          <WebinarsHero />
        </div>
        <Suspense
          fallback={
            <WebinarsContent
              items={initial.items}
              currentPage={1}
              totalPages={initial.totalPages}
              activeType={undefined}
              activeRegion={undefined}
              loadFailed={loadFailed}
            />
          }
        >
          <WebinarsBrowser allWebinars={allWebinars} loadFailed={loadFailed} />
        </Suspense>
      </main>
      <Footer cta={<WebinarsCTA />} />
    </>
  );
}
