import type { Product } from '@/components/ui/badge';

export type PartnerCategory = 'Distributor' | 'Channel partner' | 'System integrator';
export type ReportRegion = 'India' | 'Middle East';

export interface PartnerReportRow {
  name: string;
  category: PartnerCategory;
  region: ReportRegion;
  registered: number;
  waiting: number;
  accepted: number;
  rejected: number;
  won: number;
  protectedNow: number;
}

export interface PartnerReportView extends PartnerReportRow {
  /** Accepted over decided (accepted plus rejected) as a whole percent, or null before any decision. */
  rate: number | null;
}

export interface ProductReportRow {
  product: Exclude<Product, 'All products'>;
  registered: number;
  accepted: number;
  won: number;
}

export interface FollowUp {
  name: string;
  why: string;
  status: 'Onboarding' | 'Inactive';
}

export const REGIONS = ['All regions', 'India', 'Middle East'] as const;
export const CATEGORIES = [
  'All partner categories',
  'Distributor',
  'Channel partner',
  'System integrator',
] as const;
export const SORTS = ['Most registered', 'Most won', 'Highest accept rate', 'Name'] as const;
export type ReportSort = (typeof SORTS)[number];

export const TOTAL_PARTNERS = 21;
export const TOTAL_REGISTERED = 46;

const row = (
  name: string,
  category: PartnerCategory,
  region: ReportRegion,
  registered: number,
  waiting: number,
  accepted: number,
  rejected: number,
  won: number,
  protectedNow: number,
): PartnerReportRow => ({
  name,
  category,
  region,
  registered,
  waiting,
  accepted,
  rejected,
  won,
  protectedNow,
});

export const PARTNER_ROWS: readonly PartnerReportRow[] = [
  row('Kestrel Systems', 'Channel partner', 'India', 7, 2, 4, 1, 2, 3),
  row('Saffron Secure', 'Distributor', 'India', 9, 1, 7, 1, 3, 6),
  row('Arbor Cyber', 'System integrator', 'Middle East', 5, 1, 3, 1, 1, 2),
  row('Dunes Networks', 'Channel partner', 'Middle East', 6, 0, 6, 0, 2, 4),
  row('Harbourline IT', 'Distributor', 'Middle East', 6, 0, 5, 1, 1, 5),
  row('Vyom Digital', 'System integrator', 'India', 4, 0, 4, 0, 1, 3),
  row('Coralbay Technologies', 'Channel partner', 'Middle East', 2, 0, 1, 1, 0, 1),
  row('Meghdoot Systems', 'Channel partner', 'India', 0, 0, 0, 0, 0, 0),
  row('Qamar Solutions', 'Channel partner', 'Middle East', 0, 0, 0, 0, 0, 0),
  row('Ironleaf Consulting', 'System integrator', 'India', 0, 0, 0, 0, 0, 0),
];

export const PRODUCT_ROWS: readonly ProductReportRow[] = [
  { product: 'CleanStart Images', registered: 18, accepted: 14, won: 4 },
  { product: 'Clean Libraries', registered: 15, accepted: 12, won: 4 },
  { product: 'CleanSight', registered: 13, accepted: 10, won: 3 },
];

export const FOLLOW_UPS: readonly FollowUp[] = [
  {
    name: 'Qamar Solutions',
    why: 'Invited 27 Oct, has not accepted the agreement',
    status: 'Onboarding',
  },
  {
    name: 'Meghdoot Systems',
    why: 'Agreement accepted 30 Oct, no deal registered yet',
    status: 'Onboarding',
  },
  { name: 'Ironleaf Consulting', why: 'No sign-in since 2 Aug', status: 'Inactive' },
];

export function filterPartnerRows(
  region: string,
  category: string,
  sort: ReportSort,
): PartnerReportView[] {
  const views = PARTNER_ROWS.filter(
    (p) =>
      (region === 'All regions' || p.region === region) &&
      (category === 'All partner categories' || p.category === category),
  ).map((p): PartnerReportView => {
    const decided = p.accepted + p.rejected;
    return { ...p, rate: decided ? Math.round((p.accepted / decided) * 100) : null };
  });
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
  const header = [
    'Partner',
    'Category',
    'Region',
    'Registered',
    'Accepted',
    'Accept rate',
    'Won',
    'Protected now',
  ];
  const lines = rows.map((p) =>
    [
      p.name,
      p.category,
      p.region,
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
