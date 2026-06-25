import { Header } from "@/components/nav/Header";
import {
  ListingHeroSkeleton,
  JobCardSkeleton,
} from "@/components/sections/_shared/ListingSkeleton";

const FILTER_ROWS = ["dept", "location", "type", "experience", "tag", "more"];
const JOB_ROWS = ["r1", "r2", "r3", "r4", "r5", "r6"];

export default function Loading(): React.ReactElement {
  return (
    <>
      <Header />
      <main id="main-content" style={{ background: "#f6f6f6" }}>
        <ListingHeroSkeleton variant="careers" />
        <output
          aria-live="polite"
          aria-label="Loading open roles"
          className="block w-full animate-pulse"
          style={{ background: "#f6f6f6" }}
        >
          <span className="sr-only">Loading…</span>
          <div className="relative mx-auto max-w-[var(--container-default)] px-6 sm:px-10">
            <div
              className="flex flex-col gap-6 lg:flex-row lg:gap-8"
              style={{ paddingTop: "52px", paddingBottom: "120px" }}
            >
              {/* Filter sidebar */}
              <div
                className="w-full shrink-0 rounded-2xl bg-white lg:w-[300px]"
                style={{ minHeight: "360px", padding: "24px", boxShadow: "0px 3px 7px 0px rgba(0,0,0,0.02), 0px 13px 13px 0px rgba(0,0,0,0.01)" }}
              >
                <div className="h-5 w-32 rounded bg-black/[0.06]" />
                <div className="mt-6 flex flex-col gap-3">
                  {FILTER_ROWS.map((k) => (
                    <div key={k} className="h-4 w-full rounded bg-black/[0.06]" />
                  ))}
                </div>
              </div>
              {/* Job rows */}
              <div className="flex flex-1 flex-col gap-4">
                {JOB_ROWS.map((k) => (
                  <JobCardSkeleton key={k} />
                ))}
              </div>
            </div>
          </div>
        </output>
      </main>
    </>
  );
}
