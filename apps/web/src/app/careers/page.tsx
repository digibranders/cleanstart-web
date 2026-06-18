import type { Metadata } from "next";
import { Suspense } from "react";
import { Header } from "@/components/nav/Header";
import { Footer } from "@/components/sections/Footer";
import { CareersBrowser } from "@/components/sections/careers/CareersBrowser";
import {
  CareersContent,
  selectJobs,
} from "@/components/sections/careers/CareersContent";
import { getJobLocations, getJobs, type JobLocation } from "@/lib/jobs";
import { buildPageMetadata } from "@/lib/seo/canonical";
import { JsonLd, breadcrumbSchema } from "@/lib/seo/jsonld";

const TITLE = "Careers";
const DESCRIPTION =
  "Join CleanStart and help build the next generation of secure software supply chains. Explore open roles in security, engineering, and compliance at a fast growing cybersecurity company.";

export function generateMetadata(): Metadata {
  return buildPageMetadata({
    title: TITLE,
    description: DESCRIPTION,
    path: "/careers",
    eyebrow: "Careers",
  });
}

/**
 * Static listing. The full job set is fetched once (cacheable, no
 * `searchParams` on the server) and filtering/search/pagination run on the
 * client (`CareersBrowser`), so the route is served as static HTML instead of
 * rendered per request. The Suspense fallback is the server-rendered default
 * (unfiltered, page 1) view — that's what lands in the static HTML, so
 * crawlers and no-JS clients still get the full first page of open roles. See
 * /blogs for the pattern.
 */
export default async function CareersPage(): Promise<React.ReactElement> {
  const emptyResponse = {
    docs: [],
    hasNextPage: false,
    page: 1,
    totalDocs: 0,
    totalPages: 1,
  };
  const [jobsRes, locations] = await Promise.all([
    getJobs({ limit: 1000 }).catch(() => emptyResponse),
    getJobLocations().catch((): JobLocation[] => []),
  ]);

  const allJobs = jobsRes.docs;
  const initial = selectJobs(
    allJobs,
    { department: "", location: "", search: "", status: "open", page: 1 },
    locations,
  );

  return (
    <>
      <JsonLd
        id="careers-breadcrumbs"
        data={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Careers" },
        ])}
      />
      <Header />
      <Suspense
        fallback={
          <CareersContent
            jobs={initial.jobs}
            availableDepartments={initial.availableDepartments}
            availableLocations={initial.availableLocations}
            hasActiveFilter={false}
            activeDepartment=""
            activeLocation=""
            searchQuery=""
            currentPage={initial.currentPage}
            totalPages={initial.totalPages}
          />
        }
      >
        <CareersBrowser allJobs={allJobs} locations={locations} />
      </Suspense>
      <Footer />
    </>
  );
}
