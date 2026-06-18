import type { Metadata } from "next";
import { Suspense } from "react";
import { Header } from "@/components/nav/Header";
import { Footer } from "@/components/sections/Footer";
import { WebinarsBrowser } from "@/components/sections/webinars/WebinarsBrowser";
import {
  WebinarsContent,
  selectWebinars,
} from "@/components/sections/webinars/WebinarsContent";
import { WebinarsCTA } from "@/components/sections/webinars/WebinarsCTA";
import { getWebinars } from "@/lib/webinars";
import { buildPageMetadata } from "@/lib/seo/canonical";
import { JsonLd, breadcrumbSchema } from "@/lib/seo/jsonld";

export const revalidate = 3600;

const TITLE = "CleanStart Webinar";
const DESCRIPTION =
  "Live and on-demand webinars on hardened container images, software supply-chain security, and CleanStart product deep-dives.";

export function generateMetadata(): Metadata {
  return buildPageMetadata({
    title: TITLE,
    description: DESCRIPTION,
    path: "/webinars",
    eyebrow: "Webinar",
  });
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
      <Header />
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
      <Footer cta={<WebinarsCTA />} />
    </>
  );
}
