import { PARTNER_CATEGORY_LABEL, PRODUCT_LABEL } from './domain';
import type { AdminReportsDto } from './dto';
import type { ReportInsightsDto, RollupRow } from './report-insights';
import type { RangedReportDto } from './report-metrics';
import { filterPartnerRows } from './report-view';

export interface CsvExport {
  key: string;
  label: string;
  detail: string;
  filename: string;
  header: string[];
  rows: Array<Array<string | number>>;
}

const pct = (fraction: number | null): string => (fraction === null ? '' : `${Math.round(fraction * 100)}%`);

const rollupRows = (rows: readonly RollupRow[]): Array<Array<string | number>> =>
  rows.map((r) => [r.label, r.deals, r.won, r.wonValue, pct(r.winRate)]);

/** Every CSV the Reports page offers, built from the figures already loaded: nothing is queried again. */
export function buildExports(input: {
  ranged: RangedReportDto;
  insights: ReportInsightsDto;
  allTime: AdminReportsDto;
  regionName: (key: string) => string;
}): CsvExport[] {
  const { ranged, insights, allTime, regionName } = input;
  const span = `${ranged.range.from}-to-${ranged.range.to}`;
  const partnerRows = filterPartnerRows(allTime.partners, 'all', 'all', 'Most registered');
  return [
    {
      key: 'partners',
      label: 'All partners, all time',
      detail: 'Registered, accepted, won and protected deals per partner.',
      filename: `partner-report-${ranged.range.to}.csv`,
      header: ['Partner', 'Category', 'Region', 'Registered', 'Accepted', 'Accept rate', 'Won', 'Protected now'],
      rows: partnerRows.map((p) => [p.name, PARTNER_CATEGORY_LABEL[p.category], regionName(p.region), p.registered, p.accepted, p.rate === null ? 'None yet' : `${p.rate}%`, p.won, p.protectedNow]),
    },
    {
      key: 'leaderboard',
      label: 'Partner leaderboard',
      detail: 'Deals, wins and won value per partner in the period.',
      filename: `partner-leaderboard-${span}.csv`,
      header: ['Rank', 'Partner', 'Deals', 'Won', 'Won value (USD)'],
      rows: ranged.leaderboard.map((r, i) => [i + 1, r.name, r.deals, r.won, r.wonValue]),
    },
    {
      key: 'products',
      label: 'Product breakdown',
      detail: 'Deals, approvals, wins and value per product.',
      filename: `product-breakdown-${span}.csv`,
      header: ['Product', 'Deals', 'Approved', 'Won', 'Total value (USD)', 'Won value (USD)'],
      rows: ranged.products.map((p) => [PRODUCT_LABEL[p.product], p.deals, p.approved, p.won, p.totalValue, p.wonValue]),
    },
    {
      key: 'funnel',
      label: 'Pipeline funnel',
      detail: 'Registered, approved, won and lost, with conversion.',
      filename: `pipeline-funnel-${span}.csv`,
      header: ['Step', 'Deals', 'Share of', 'Conversion'],
      rows: ranged.funnel.map((s) => [s.label, s.count, s.from, pct(s.conversion)]),
    },
    {
      key: 'decision',
      label: 'Time to decision',
      detail: 'Median and 90th percentile days, by month registered.',
      filename: `time-to-decision-${span}.csv`,
      header: ['Month registered', 'Decided', 'Median days', '90th percentile days'],
      rows: insights.decision.byMonth.map((m) => [m.month, m.decided, m.median ?? '', m.p90 ?? '']),
    },
    {
      key: 'reasons',
      label: 'Rejection reasons',
      detail: 'Reasons as the approver wrote them. Can name customers.',
      filename: `rejection-reasons-${span}.csv`,
      header: ['Reason', 'Deals', 'Share'],
      rows: insights.reasons.map((r) => [r.reason, r.count, pct(r.share)]),
    },
    {
      key: 'engagement',
      label: 'Document engagement',
      detail: 'The most opened documents in the period.',
      filename: `document-engagement-${span}.csv`,
      header: ['Document', 'Opens', 'Partners'],
      rows: insights.engagement.top.map((d) => [d.title, d.opens, d.partners]),
    },
    {
      key: 'regions',
      label: 'By region',
      detail: 'Deals, won value and win rate per region.',
      filename: `region-rollup-${span}.csv`,
      header: ['Region', 'Deals', 'Won', 'Won value (USD)', 'Win rate'],
      rows: rollupRows(insights.regions),
    },
    {
      key: 'managers',
      label: 'By partner manager',
      detail: 'Deals, won value and win rate per manager.',
      filename: `manager-rollup-${span}.csv`,
      header: ['Manager', 'Deals', 'Won', 'Won value (USD)', 'Win rate'],
      rows: rollupRows(insights.managers),
    },
  ];
}
