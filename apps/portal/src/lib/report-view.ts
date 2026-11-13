import {
  PARTNER_CATEGORIES,
  PARTNER_CATEGORY_LABEL,
  PARTNER_REGION_LABEL,
  PARTNER_REGIONS,
} from './domain';
import type { PartnerReportRow } from './dto';

export const SORTS = ['Most registered', 'Most won', 'Highest accept rate', 'Name'] as const;
export type ReportSort = (typeof SORTS)[number];

export const REGION_OPTIONS = [
  { value: 'all', label: 'All regions' },
  ...PARTNER_REGIONS.map((r) => ({ value: r, label: PARTNER_REGION_LABEL[r] })),
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

const csvCell = (value: string | number): string => {
  const text = String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

export function partnersToCsv(rows: readonly PartnerReportView[]): string {
  const header = ['Partner', 'Category', 'Region', 'Registered', 'Accepted', 'Accept rate', 'Won', 'Protected now'];
  const lines = rows.map((p) =>
    [
      p.name,
      PARTNER_CATEGORY_LABEL[p.category],
      PARTNER_REGION_LABEL[p.region],
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
