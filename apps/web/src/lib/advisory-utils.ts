// Client-safe advisory helpers (no `cms-fetch` import), shared by the static
// listing's client browser and the server-rendered detail page.

export type AdvisoryFixStatus = "identified" | "in_progress" | "fixed" | "not_affected";

/** Display order and labels; values mirror the CMS `fixStatus` select. */
export const ADVISORY_STATUSES: ReadonlyArray<{ value: AdvisoryFixStatus; label: string }> = [
  { value: "identified", label: "Identified" },
  { value: "in_progress", label: "In progress" },
  { value: "fixed", label: "Fixed" },
  { value: "not_affected", label: "Not affected" },
];

export const advisoryStatusLabel = (status: AdvisoryFixStatus): string =>
  ADVISORY_STATUSES.find((s) => s.value === status)?.label ?? status;

/** The fields the listing table, its filters and search read. */
export interface AdvisoryRow {
  id: string;
  title: string;
  slug: string;
  technology: string;
  cves: string[];
  cvssScore: number;
  fixStatus: AdvisoryFixStatus;
  abstract?: string | null;
  coverTitle?: string | null;
  publishedAt?: string;
  displayPublishedAt?: string | null;
}

export type CvssRating = "Critical" | "High" | "Medium" | "Low" | "None";

/** CVSS v3/v4 qualitative severity bands. */
export function cvssRating(score: number): CvssRating {
  if (score >= 9) return "Critical";
  if (score >= 7) return "High";
  if (score >= 4) return "Medium";
  if (score > 0) return "Low";
  return "None";
}

/** "CVE-A, CVE-B: Name", the advisory's H1 and page title. */
export function advisoryHeading(a: Pick<AdvisoryRow, "cves" | "title">): string {
  return a.cves.length > 0 ? `${a.cves.join(", ")}: ${a.title}` : a.title;
}

const technologyKey = (technology: string): string => technology.trim().toLowerCase();

/** Technology filter options from the values editors typed, merged by case and spacing. */
export function technologyOptions(all: AdvisoryRow[]): Array<{ value: string; label: string }> {
  const seen = new Map<string, string>();
  for (const a of all) {
    const key = technologyKey(a.technology);
    if (key && !seen.has(key)) seen.set(key, a.technology.trim());
  }
  return [...seen].map(([value, label]) => ({ value, label })).sort((x, y) => x.label.localeCompare(y.label));
}

/** In-memory filter for the static listing: technology, status, and CVE-or-name search. */
export function selectAdvisories(
  all: AdvisoryRow[],
  { technology, status, q }: { technology: string; status: string; q: string },
): AdvisoryRow[] {
  const needle = q.trim().toLowerCase();
  return all.filter((a) => {
    if (technology && technologyKey(a.technology) !== technology) return false;
    if (status && a.fixStatus !== status) return false;
    if (!needle) return true;
    return a.cves.some((cve) => cve.toLowerCase().includes(needle)) || a.title.toLowerCase().includes(needle);
  });
}
