import Link from "next/link";
import { Rss } from "lucide-react";
import { EmptyState } from "@/components/feedback";
import { FilterGroup, FilterSidebarCard, MobileTabStrip } from "@/components/sections/_shared/SidebarFilters";
import { Container, Section } from "@/components/layout";
import { ADVISORY_STATUSES, type AdvisoryRow } from "@/lib/advisory-utils";
import { ADVISORY_FEED_PATH } from "@/lib/advisory-feed";
import { AdvisoryCard } from "./AdvisoryCard";

const BASE_PATH = "/advisories";

export interface AdvisoryFilters {
  technology: string;
  status: string;
  q: string;
}

function buildHref(filters: AdvisoryFilters): string {
  const params = new URLSearchParams();
  if (filters.technology) params.set("technology", filters.technology);
  if (filters.status) params.set("status", filters.status);
  if (filters.q) params.set("q", filters.q);
  const qs = params.toString();
  return qs ? `${BASE_PATH}?${qs}` : BASE_PATH;
}

function RssLink(): React.ReactElement {
  return (
    <a
      href={ADVISORY_FEED_PATH}
      className="inline-flex items-center gap-1.5 font-sans font-medium text-[#4a3bf1] hover:text-[#3928e0] transition-colors duration-150"
      style={{ fontSize: "var(--fs-body-sm)" }}
    >
      <Rss aria-hidden size={16} strokeWidth={2} />
      Subscribe via RSS
    </a>
  );
}

function AdvisorySidebar({
  technologies,
  filters,
}: {
  technologies: ReadonlyArray<{ value: string; label: string }>;
  filters: AdvisoryFilters;
}): React.ReactElement {
  const technologyItems = [
    { value: "", label: "All technologies", active: !filters.technology },
    ...technologies.map((t) => ({ value: t.value, label: t.label, active: filters.technology === t.value })),
  ];
  const statusItems = [
    { value: "", label: "All statuses", active: !filters.status },
    ...ADVISORY_STATUSES.map((s) => ({ value: s.value, label: s.label, active: filters.status === s.value })),
  ];
  const hrefFor = (patch: Partial<AdvisoryFilters>): string => buildHref({ ...filters, ...patch });

  return (
    <nav aria-label="Filter advisories" className="shrink-0 w-full lg:w-[260px]">
      <div className="lg:hidden flex flex-col gap-4">
        {technologies.length > 0 && (
          <MobileTabStrip
            label="Technology"
            items={technologyItems}
            buildHref={(technology) => hrefFor({ technology })}
          />
        )}
        <MobileTabStrip label="Status" items={statusItems} buildHref={(status) => hrefFor({ status })} />
        <RssLink />
      </div>

      <FilterSidebarCard>
        {technologies.length > 0 && (
          <>
            <FilterGroup
              heading="TECHNOLOGY"
              items={technologyItems.map((i) => ({
                key: i.value || "all-technologies",
                label: i.label,
                href: hrefFor({ technology: i.value }),
                active: i.active,
              }))}
            />
            <div style={{ height: "1px", background: "rgba(17,17,17,0.12)", margin: "14px 0" }} />
          </>
        )}
        <FilterGroup
          heading="STATUS"
          items={statusItems.map((i) => ({
            key: i.value || "all-statuses",
            label: i.label,
            href: hrefFor({ status: i.value }),
            active: i.active,
          }))}
        />
        <div style={{ height: "1px", background: "rgba(17,17,17,0.12)", margin: "14px 0" }} />
        <RssLink />
      </FilterSidebarCard>
    </nav>
  );
}

/**
 * Advisory listing: technology and status filters in the house sidebar
 * (shared with /careers) beside a grid of cards, as on the Resource Center.
 * Presentational; `AdvisoriesBrowser` feeds it the URL-filtered rows, and the
 * page renders it unfiltered as the static Suspense fallback.
 */
export function AdvisoriesGrid({
  rows,
  technologies,
  filters,
}: {
  rows: AdvisoryRow[];
  technologies: ReadonlyArray<{ value: string; label: string }>;
  filters: AdvisoryFilters;
}): React.ReactElement {
  const filtered = Boolean(filters.technology || filters.status || filters.q);
  return (
    <Section padding="none" style={{ paddingTop: "var(--spacing-section-sm)", paddingBottom: "var(--spacing-section-cta)" }}>
      <Container>
        <div className="flex flex-col lg:flex-row items-stretch gap-6 lg:gap-8">
          <AdvisorySidebar technologies={technologies} filters={filters} />

          <div className="flex-1 min-w-0">
            {rows.length === 0 ? (
              filtered ? (
                <EmptyState
                  variant="no-results"
                  actions={
                    <Link
                      href={BASE_PATH}
                      className="font-medium text-[#4a3bf1] underline underline-offset-4"
                      style={{ fontSize: "var(--fs-body)" }}
                    >
                      Clear filters
                    </Link>
                  }
                />
              ) : (
                <EmptyState
                  variant="empty"
                  title="No advisories yet"
                  description="Security advisories will be listed here as they are published."
                />
              )
            ) : (
              <ul className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 lg:gap-8 justify-items-center lg:justify-items-start">
                {rows.map((a) => (
                  <li key={a.id} className="flex">
                    <AdvisoryCard advisory={a} />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </Container>
    </Section>
  );
}
