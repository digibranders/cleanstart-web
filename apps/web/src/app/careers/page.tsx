import { Suspense } from "react";
import type { Metadata } from "next";
import { Header } from "@/components/sections/Header";
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
  type JobStatusFilter,
} from "@/lib/jobs";
import { buildPageMetadata } from "@/lib/seo/canonical";
import { JsonLd, breadcrumbSchema } from "@/lib/seo/jsonld";

const TITLE = "Careers";
const DESCRIPTION =
  "Help us empower the world's largest enterprises to secure their applications. Browse open roles at CleanStart.";

interface CareersPageProps {
  searchParams: Promise<{
    department?: string;
    location?: string;
    q?: string;
    page?: string;
    status?: string;
  }>;
}

const JOBS_PER_PAGE = 10;

function normalizeStatus(raw: string | undefined): JobStatusFilter {
  if (raw === "closed" || raw === "all") return raw;
  return "open";
}

export async function generateMetadata({
  searchParams,
}: CareersPageProps): Promise<Metadata> {
  const params = await searchParams;
  const page = Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1);
  return buildPageMetadata({
    title: TITLE,
    description: DESCRIPTION,
    path: "/careers",
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
  const activeStatus = normalizeStatus(params.status);
  const currentPage = Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1);

  // Fetch the filtered listing AND a parallel unfiltered (open-only) listing —
  // the latter computes which departments / locations have at least one open
  // role (so the sidebar only offers filters that resolve to a non-empty
  // result set within the user's current status scope).
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
      status: activeStatus,
      ...(activeDepartment ? { department: activeDepartment } : {}),
      ...(activeLocation ? { location: activeLocation } : {}),
      ...(searchQuery ? { search: searchQuery } : {}),
    }).catch(() => emptyResponse),
    getJobs({ page: 1, limit: 200, status: activeStatus }).catch(
      () => emptyResponse,
    ),
    getJobLocations().catch((): JobLocation[] => []),
  ]);

  const availableDepartments = collectAvailableDepartments(allRes.docs);
  const availableLocations = collectAvailableLocations(allRes.docs, locationDocs);

  const hasActiveFilter = Boolean(
    activeDepartment || activeLocation || searchQuery || activeStatus !== "open",
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
            {/* Decorative top-left grid corner — column + row lines fading
                radially from the top-left of the body, matching Figma. */}
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
            {/* Decorative top-right grid corner — mirrored from the top-left. */}
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
            {/* Top-left violet radial glow — Figma Union, 1181x1181 at (-552,-413). */}
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
            {/* Top-right violet radial glow — Figma Union, 1181x1181 at (1470,-367). */}
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

            <div className="relative mx-auto max-w-[var(--container-default)] px-6">
              {/* Default `align-items: stretch` so the <nav> column matches the
                  job list's height — that's what gives the inner sticky white
                  card a tall enough parent to anchor against while scrolling
                  (same trick the blog detail TOC uses). */}
              <div className="flex flex-col lg:flex-row items-stretch gap-6 lg:gap-8">
                <CareersSidebar
                  activeDepartment={activeDepartment}
                  activeLocation={activeLocation}
                  activeStatus={activeStatus}
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
                  activeStatus={activeStatus}
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
