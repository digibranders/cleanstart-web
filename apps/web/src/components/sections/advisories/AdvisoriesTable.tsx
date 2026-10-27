import Link from "next/link";
import { EmptyState } from "@/components/feedback";
import { Container, Section } from "@/components/layout";
import {
  ADVISORY_STATUSES,
  advisoryStatusLabel,
  type AdvisoryFixStatus,
  type AdvisoryRow,
} from "@/lib/advisory-utils";
import { formatBlogDate } from "@/lib/blog-utils";
import { effectivePublishedAt } from "@/lib/published-date";

const BASE_PATH = "/advisories";

export interface AdvisoryFilters {
  technology: string;
  status: string;
  q: string;
}

/** Status colour pairs (text on tint). Semantic, so each status keeps its own hue. */
const STATUS_TONE: Record<AdvisoryFixStatus, { color: string; background: string }> = {
  identified: { color: "#92400E", background: "#FEF3C7" },
  in_progress: { color: "#1E40AF", background: "#DBEAFE" },
  fixed: { color: "#065F46", background: "#D1FAE5" },
  not_affected: { color: "#374151", background: "#EEF0F3" },
};

function buildHref(filters: AdvisoryFilters): string {
  const params = new URLSearchParams();
  if (filters.technology) params.set("technology", filters.technology);
  if (filters.status) params.set("status", filters.status);
  if (filters.q) params.set("q", filters.q);
  const qs = params.toString();
  return qs ? `${BASE_PATH}?${qs}` : BASE_PATH;
}

function FilterPill({ label, href, active }: { label: string; href: string; active: boolean }): React.ReactElement {
  return (
    <Link
      href={href}
      scroll={false}
      aria-current={active ? "true" : undefined}
      className="inline-flex items-center shrink-0 font-sans font-medium transition-colors duration-150"
      style={{
        height: "34px",
        padding: "0 14px",
        borderRadius: "30px",
        fontSize: "var(--fs-body-sm)",
        border: active ? "1px solid #4a3bf1" : "1px solid rgba(17,17,17,0.14)",
        background: active ? "#4a3bf1" : "#fff",
        color: active ? "#fff" : "#2b2b2b",
      }}
    >
      {label}
    </Link>
  );
}

function FilterRow({
  label,
  param,
  options,
  filters,
}: {
  label: string;
  param: "technology" | "status";
  options: ReadonlyArray<{ value: string; label: string }>;
  filters: AdvisoryFilters;
}): React.ReactElement {
  return (
    <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-4">
      <span
        className="font-sans font-medium shrink-0 md:w-[110px]"
        style={{ fontSize: "var(--fs-body-sm)", color: "rgba(17,17,17,0.6)" }}
      >
        {label}
      </span>
      <nav
        aria-label={`Filter by ${label.toLowerCase()}`}
        className="-mx-6 px-6 md:mx-0 md:px-0 flex items-center gap-2 overflow-x-auto md:flex-wrap [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        <FilterPill label="All" href={buildHref({ ...filters, [param]: "" })} active={filters[param] === ""} />
        {options.map((o) => (
          <FilterPill
            key={o.value}
            label={o.label}
            href={buildHref({ ...filters, [param]: o.value })}
            active={filters[param] === o.value}
          />
        ))}
      </nav>
    </div>
  );
}

function StatusBadge({ status }: { status: AdvisoryFixStatus }): React.ReactElement {
  const tone = STATUS_TONE[status];
  return (
    <span
      className="inline-flex items-center whitespace-nowrap font-sans font-medium"
      style={{ padding: "3px 10px", borderRadius: "30px", fontSize: "var(--fs-caption)", ...tone }}
    >
      {advisoryStatusLabel(status)}
    </span>
  );
}

const TH_STYLE: React.CSSProperties = {
  fontSize: "var(--fs-caption)",
  fontWeight: 500,
  color: "rgba(17,17,17,0.55)",
  padding: "0 16px 12px 0",
};

/**
 * Advisory listing: technology and status filters over an outline-free table.
 * Presentational; `AdvisoriesBrowser` feeds it the URL-filtered rows, and the
 * page renders it unfiltered as the static Suspense fallback.
 */
export function AdvisoriesTable({
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
        <div className="flex flex-col gap-3 md:gap-4">
          {technologies.length > 0 && (
            <FilterRow label="Technology" param="technology" options={technologies} filters={filters} />
          )}
          <FilterRow label="Status" param="status" options={ADVISORY_STATUSES} filters={filters} />
        </div>

        <div style={{ marginTop: "clamp(28px, 3.5vw, 48px)" }}>
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
            <table className="w-full text-left" style={{ borderCollapse: "collapse" }}>
              <caption className="sr-only">Security advisories</caption>
              <thead className="hidden md:table-header-group">
                <tr>
                  <th scope="col" style={TH_STYLE}>Technology</th>
                  <th scope="col" style={TH_STYLE}>Vulnerability</th>
                  <th scope="col" style={TH_STYLE}>CVE ID</th>
                  <th scope="col" style={TH_STYLE}>Published</th>
                  <th scope="col" style={{ ...TH_STYLE, paddingRight: 0 }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((a) => (
                  <tr
                    key={a.id}
                    className="flex flex-wrap items-center gap-x-3 gap-y-1.5 py-4 md:table-row md:py-0 transition-colors duration-150 md:hover:bg-white"
                    style={{ borderTop: "1px solid rgba(17,17,17,0.08)" }}
                  >
                    <td
                      className="w-full md:w-auto md:py-4 md:pr-4 md:align-top"
                      style={{ fontSize: "var(--fs-body-sm)", color: "rgba(17,17,17,0.6)" }}
                    >
                      {a.technology}
                    </td>
                    <td className="w-full md:w-auto md:py-4 md:pr-4 md:align-top">
                      <Link
                        href={`${BASE_PATH}/${a.slug}`}
                        className="font-display font-semibold text-[#111] hover:text-[#4a3bf1] transition-colors duration-150"
                        style={{ fontSize: "var(--fs-body)", lineHeight: 1.35 }}
                      >
                        {a.title}
                      </Link>
                    </td>
                    <td className="w-full md:w-auto md:py-4 md:pr-4 md:align-top">
                      <span className="flex flex-col" style={{ fontFamily: "var(--font-mono)", fontSize: "var(--fs-body-sm)", color: "#2b2b2b" }}>
                        {a.cves.map((cve) => (
                          <span key={cve} className="whitespace-nowrap">{cve}</span>
                        ))}
                      </span>
                    </td>
                    <td
                      className="md:py-4 md:pr-4 md:align-top whitespace-nowrap"
                      style={{ fontSize: "var(--fs-body-sm)", color: "rgba(17,17,17,0.6)" }}
                    >
                      {formatBlogDate(effectivePublishedAt(a))}
                    </td>
                    <td className="md:py-4 md:align-top">
                      <StatusBadge status={a.fixStatus} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Container>
    </Section>
  );
}
