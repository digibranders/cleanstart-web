import { Suspense } from "react";
import type { Metadata } from "next";
import { Header } from "@/components/nav/Header";
import { Footer } from "@/components/sections/Footer";
import { FadeUp } from "@/components/ui/FadeUp";
import { CareersHero } from "@/components/sections/careers/CareersHero";
import { CareersSidebar } from "@/components/sections/careers/CareersSidebar";
import { JobsList } from "@/components/sections/careers/JobsList";
import {
  DEPARTMENT_LABEL,
  getJobLocations,
  getJobs,
  resolvedLocations,
  type JobDepartment,
  type JobLocation,
} from "@/lib/jobs";
import { buildPageMetadata } from "@/lib/seo/canonical";
import { JsonLd, breadcrumbSchema } from "@/lib/seo/jsonld";

const TITLE = "Careers";
const DESCRIPTION =
  "Join CleanStart and help build the next generation of secure software supply chains. Explore open roles in security, engineering, and compliance at a fast growing cybersecurity company.";

interface CareersPageProps {
  searchParams: Promise<{
    department?: string;
    location?: string;
    q?: string;
    page?: string;
  }>;
}

const JOBS_PER_PAGE = 10;

export async function generateMetadata({
  searchParams,
}: CareersPageProps): Promise<Metadata> {
  const params = await searchParams;
  const page = Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1);
  return buildPageMetadata({
    title: TITLE,
    description: DESCRIPTION,
    path: "/careers",
    eyebrow: "Careers",
    noindex: page >= 6,
  });
}

export default async function CareersPage({
  searchParams,
}: CareersPageProps): Promise<React.ReactElement> {
  const params = await searchParams;
  const activeDepartment = params.department ?? "";
  const activeLocation = params.location ?? "";
  const searchQuery = params.q ?? "";
  const currentPage = Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1);

  // Fetch the filtered listing AND a parallel unfiltered (open-only) listing —
  // the latter computes which departments / locations have at least one open
  // role (so the sidebar only offers filters that resolve to a non-empty
  // result set). Only open roles are surfaced; closed roles are unpublished
  // in the CMS, so `getJobs` defaults to its open-only filter.
  const emptyResponse = {
    docs: [],
    hasNextPage: false,
    page: 1,
    totalDocs: 0,
    totalPages: 1,
  };
  const [filteredRes, allRes, locationDocs] = await Promise.all([
    getJobs({
      page: currentPage,
      limit: JOBS_PER_PAGE,
      ...(activeDepartment ? { department: activeDepartment } : {}),
      ...(activeLocation ? { location: activeLocation } : {}),
      ...(searchQuery ? { search: searchQuery } : {}),
    }).catch(() => emptyResponse),
    getJobs({ page: 1, limit: 200 }).catch(() => emptyResponse),
    getJobLocations().catch((): JobLocation[] => []),
  ]);

  const availableDepartments = collectAvailableDepartments(allRes.docs);
  const availableLocations = collectAvailableLocations(allRes.docs, locationDocs);

  const hasActiveFilter = Boolean(
    activeDepartment || activeLocation || searchQuery,
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
      <main style={{ background: "#f6f6f6" }}>
        <div className="relative overflow-hidden">
          <Suspense>
            <CareersHero initialQuery={searchQuery} />
          </Suspense>
        </div>

        <FadeUp>
          <section
            className="relative overflow-x-clip"
            style={{
              background: "#f6f6f6",
              paddingTop: "52px",
              paddingBottom: "120px",
            }}
            aria-label="Open roles"
          >
            <div
              aria-hidden
              className="pointer-events-none absolute hidden md:block"
              style={{
                left: 0,
                top: 0,
                width: "560px",
                height: "420px",
                backgroundImage:
                  "linear-gradient(to right, rgba(17,17,17,0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(17,17,17,0.07) 1px, transparent 1px)",
                backgroundSize: "71px 71px",
                maskImage:
                  "radial-gradient(ellipse at top left, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.45) 55%, rgba(0,0,0,0) 80%)",
                WebkitMaskImage:
                  "radial-gradient(ellipse at top left, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.45) 55%, rgba(0,0,0,0) 80%)",
              }}
            />
            <div
              aria-hidden
              className="pointer-events-none absolute hidden md:block"
              style={{
                right: 0,
                top: 0,
                width: "560px",
                height: "420px",
                backgroundImage:
                  "linear-gradient(to right, rgba(17,17,17,0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(17,17,17,0.07) 1px, transparent 1px)",
                backgroundSize: "71px 71px",
                maskImage:
                  "radial-gradient(ellipse at top right, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.45) 55%, rgba(0,0,0,0) 80%)",
                WebkitMaskImage:
                  "radial-gradient(ellipse at top right, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.45) 55%, rgba(0,0,0,0) 80%)",
              }}
            />
            <div
              aria-hidden
              className="pointer-events-none absolute"
              style={{
                width: "1181px",
                height: "1181px",
                left: "-552px",
                top: "-413px",
                background:
                  "radial-gradient(50% 50% at 50% 50%, #640DFB 0%, rgba(100,13,251,0) 100%)",
                opacity: 0.1,
              }}
            />
            <div
              aria-hidden
              className="pointer-events-none absolute"
              style={{
                width: "1181px",
                height: "1181px",
                left: "calc(100% - 450px)",
                top: "-367px",
                background:
                  "radial-gradient(50% 50% at 50% 50%, #640DFB 0%, rgba(100,13,251,0) 100%)",
                opacity: 0.1,
              }}
            />

            <div className="relative mx-auto max-w-[var(--container-default)] px-6 sm:px-10">
              {/* `align-items: stretch` makes the nav column match the job
                  list's height, giving the inner sticky card a tall enough
                  parent to anchor against while scrolling. */}
              <div className="flex flex-col lg:flex-row items-stretch gap-6 lg:gap-8">
                <CareersSidebar
                  activeDepartment={activeDepartment}
                  activeLocation={activeLocation}
                  searchQuery={searchQuery}
                  availableDepartments={availableDepartments}
                  availableLocations={availableLocations}
                />

                <JobsList
                  jobs={filteredRes.docs}
                  hasActiveFilter={hasActiveFilter}
                  currentPage={filteredRes.page}
                  totalPages={filteredRes.totalPages}
                  activeDepartment={activeDepartment}
                  activeLocation={activeLocation}
                  searchQuery={searchQuery}
                />
              </div>
            </div>
          </section>
        </FadeUp>
      </main>
      <Footer />
    </>
  );
}

const DEPARTMENT_ORDER = Object.keys(DEPARTMENT_LABEL) as JobDepartment[];

function collectAvailableDepartments(
  jobs: { department?: JobDepartment | null }[],
): JobDepartment[] {
  const seen = new Set<JobDepartment>();
  for (const job of jobs) {
    if (job.department) seen.add(job.department);
  }
  return DEPARTMENT_ORDER.filter((d) => seen.has(d));
}

function collectAvailableLocations(
  jobs: Parameters<typeof resolvedLocations>[0][],
  allLocations: JobLocation[],
): JobLocation[] {
  const seenSlugs = new Set<string>();
  for (const job of jobs) {
    for (const loc of resolvedLocations(job)) {
      seenSlugs.add(loc.slug);
    }
  }
  return allLocations
    .filter((l) => seenSlugs.has(l.slug))
    .sort((a, b) => a.name.localeCompare(b.name));
}
