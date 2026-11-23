import { PARTNER_CATEGORIES, PARTNER_CATEGORY_LABEL } from './domain';
import type { PartnerReportRow } from './dto';
import { type RegionDto, regionName } from './regions';

export const SORTS = ['Most registered', 'Most won', 'Highest accept rate', 'Name'] as const;
export type ReportSort = (typeof SORTS)[number];

/** The region filter: every region in the list (inactive ones too, their partners still exist). */
export const regionOptions = (regions: readonly RegionDto[]): { value: string; label: string }[] => [
  { value: 'all', label: 'All regions' },
  ...regions.map((r) => ({ value: r.key, label: r.name })),
];
export const CATEGORY_OPTIONS = [
  { value: 'all', label: 'All partner categories' },
  ...PARTNER_CATEGORIES.map((c) => ({ value: c, label: PARTNER_CATEGORY_LABEL[c] })),
];

export interface PartnerReportView extends PartnerReportRow {
  /** Accepted over decided (accepted plus rejected) as a whole percent, or null before any decision. */
  rate: number | null;
}

export const acceptRate = (accepted: number, rejected: number): number | null => {
  const decided = accepted + rejected;
  return decided ? Math.round((accepted / decided) * 100) : null;
};

export function filterPartnerRows(
  rows: readonly PartnerReportRow[],
  region: string,
  category: string,
  sort: ReportSort,
): PartnerReportView[] {
  const views = rows
    .filter((p) => (region === 'all' || p.region === region) && (category === 'all' || p.category === category))
    .map((p): PartnerReportView => ({ ...p, rate: acceptRate(p.accepted, p.rejected) }));
  const rateKey = (p: PartnerReportView): number => p.rate ?? -1;
  const compare: Record<ReportSort, (a: PartnerReportView, b: PartnerReportView) => number> = {
    'Most registered': (a, b) => b.registered - a.registered || b.won - a.won,
    'Most won': (a, b) => b.won - a.won || b.registered - a.registered,
    'Highest accept rate': (a, b) => rateKey(b) - rateKey(a) || b.registered - a.registered,
    Name: (a, b) => a.name.localeCompare(b.name),
  };
  return views.sort(compare[sort]);
}

/** A cell that starts with = + - @ tab or CR is read as a formula by Excel and Sheets, so it gets a leading apostrophe. */
const FORMULA_START = /^[=+\-@\t\r]/;

const csvCell = (value: string | number): string => {
  const raw = String(value);
  const text = FORMULA_START.test(raw) ? `'${raw}` : raw;
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

export function partnersToCsv(rows: readonly PartnerReportView[], regions?: readonly RegionDto[]): string {
  const header = ['Partner', 'Category', 'Region', 'Registered', 'Accepted', 'Accept rate', 'Won', 'Protected now'];
  const lines = rows.map((p) =>
    [
      p.name,
      PARTNER_CATEGORY_LABEL[p.category],
      regionName(p.region, regions),
      p.registered,
      p.accepted,
      p.rate === null ? 'None yet' : `${p.rate}%`,
      p.won,
      p.protectedNow,
    ]
      .map(csvCell)
      .join(','),
  );
  return [header.join(','), ...lines].join('\n');
}
