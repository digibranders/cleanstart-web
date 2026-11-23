import { addDays } from './dates';
import { DEAL_REGIONS, type DealRegion, isOneOf, PRODUCTS, type Product, type RegistrationStatus } from './domain';
import type { AttentionItemDto, DocumentListItemDto, IntegrationHealthDto, IsoTimestamp } from './dto';

/* ---------------------------------------------------------------- filters (URL state) */

export const DASHBOARD_PERIODS = ['30d', '90d', '12m', 'ytd'] as const;
export type DashboardPeriod = (typeof DASHBOARD_PERIODS)[number];
export const DEFAULT_DASHBOARD_PERIOD: DashboardPeriod = '90d';
export const DASHBOARD_PERIOD_LABEL: Record<DashboardPeriod, string> = {
  '30d': 'Last 30 days',
  '90d': 'Last 90 days',
  '12m': 'Last 12 months',
  ytd: 'Year to date',
};

export interface DashboardFilters {
  period: DashboardPeriod;
  region?: DealRegion;
  product?: Product;
  /** Staff only. A partner viewer's own company is the only scope, whatever this holds. */
  partnerId?: string;
}

type Params = URLSearchParams | Record<string, string | string[] | undefined>;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const pick = (params: Params, key: string): string | undefined => {
  const raw = params instanceof URLSearchParams ? params.get(key) : params[key];
  const value = Array.isArray(raw) ? raw[0] : raw;
  return value === null || value === undefined ? undefined : value.trim();
};

/** Parses `?period=&region=&product=&partnerId=`. Any bad or missing value falls back to the default (no filter). */
export function parseDashboardFilters(params: Params, opts: { staff: boolean }): DashboardFilters {
  const period = pick(params, 'period');
  const region = pick(params, 'region');
  const product = pick(params, 'product');
  const partnerId = pick(params, 'partnerId');
  return {
    period: isOneOf(DASHBOARD_PERIODS, period) ? period : DEFAULT_DASHBOARD_PERIOD,
    ...(isOneOf(DEAL_REGIONS, region) ? { region } : {}),
    ...(isOneOf(PRODUCTS, product) ? { product } : {}),
    ...(opts.staff && partnerId !== undefined && UUID.test(partnerId) ? { partnerId } : {}),
  };
}

/** The first day of the period, inclusive. `today` is a YYYY-MM-DD date. */
export function periodStart(period: DashboardPeriod, today: string): string {
  switch (period) {
    case '30d':
      return addDays(today, -29);
    case '90d':
      return addDays(today, -89);
    case '12m':
      return `${Number(today.slice(0, 4)) - 1}-${today.slice(5, 7)}-01`;
    case 'ytd':
      return `${today.slice(0, 4)}-01-01`;
  }
}

/* ---------------------------------------------------------------- shared building blocks */

/** Deal values are summed in this currency only; a deal in another currency is counted but adds no value. */
export const REPORTING_CURRENCY = 'USD';

export interface CountValue {
  count: number;
  value: number;
}

export interface BreakdownRow extends CountValue {
  key: string;
}

export interface MonthPoint extends CountValue {
  /** YYYY-MM. */
  month: string;
}

export interface WeekPoint {
  /** The Monday of the week, YYYY-MM-DD. */
  weekStart: string;
  submitted: number;
  decided: number;
}

export interface BucketPoint {
  label: string;
  count: number;
}

export interface ReasonRow {
  reason: string;
  count: number;
}

export interface TopDealRow {
  id: string;
  partnerId: string;
  partnerName: string;
  customer: string;
  product: Product;
  region: DealRegion;
  status: RegistrationStatus;
  stage: string;
  protectionEnd: string | null;
  value: number;
}

export interface ExpiringRow {
  id: string;
  partnerId: string;
  customer: string;
  partnerName: string;
  protectionEnd: string;
  daysLeft: number;
}

export type StatusCounts = Record<RegistrationStatus, number>;

export interface DealKpis {
  statusCounts: StatusCounts;
  /** Pending plus accepted. */
  pipeline: CountValue;
  won: CountValue;
  /** Won over won plus lost; null when nothing is decided either way. */
  winRate: number | null;
  /** Business days from sent to decision. Null when no deal in range was decided. */
  avgDecisionDays: number | null;
  medianDecisionDays: number | null;
  /** Share (0 to 1) decided within the 2 business day target; null when none decided. */
  decidedWithinTarget: number | null;
  /** Deals value summed per reporting currency only; this counts the ones left out. */
  otherCurrencyDeals: number;
}

export interface DealSeries {
  byProduct: BreakdownRow[];
  byRegion: BreakdownRow[];
  byCountry: BreakdownRow[];
  byIndustry: BreakdownRow[];
  byStage: BreakdownRow[];
  monthly: MonthPoint[];
  weekly: WeekPoint[];
  approvalTime: BucketPoint[];
  rejectionReasons: ReasonRow[];
  topDeals: TopDealRow[];
}

/* ---------------------------------------------------------------- the two dashboards */

export interface DocumentUseRow {
  id: string;
  title: string;
  opens: number;
  partners: number;
}

export interface TeamMemberCount {
  userId: string;
  name: string;
  deals: number;
  won: number;
  pipelineValue: number;
}

export interface PartnerDashboardDto {
  filters: DashboardFilters;
  /** From the first day of the period to today, YYYY-MM-DD. */
  range: { from: string; to: string };
  /** Salespeople see only the deals they registered. */
  ownDealsOnly: boolean;
  waiting: { count: number; oldestDays: number };
  protectedNow: number;
  expiring14: ExpiringRow[];
  kpis: DealKpis;
  series: DealSeries;
  /** Partner admin only; empty for sales. */
  team: TeamMemberCount[];
  /** This company's opens, most opened first. */
  mostOpenedDocuments: DocumentUseRow[];
  newDocuments: DocumentListItemDto[];
  attention: AttentionItemDto[];
}

export interface FunnelDto {
  applied: number;
  approved: number;
  invited: number;
  active: number;
}

export interface PartnerHealthDto {
  active: number;
  onboarding: number;
  /** Inactive and suspended. */
  inactive: number;
}

export interface PartnerPerformanceRow {
  partnerId: string;
  name: string;
  deals: number;
  pipelineValue: number;
  wonCount: number;
  wonValue: number;
  lastActiveAt: IsoTimestamp | null;
}

export interface DormantPartnerRow {
  partnerId: string;
  name: string;
  lastActiveAt: IsoTimestamp | null;
  /** Whole days since the last activity; null when there is none on record. */
  daysQuiet: number | null;
}

export interface ManagerWorkloadRow {
  /** Null for deals with no manager yet. */
  managerId: string | null;
  name: string;
  waiting: number;
  overdue: number;
  decided: number;
}

export interface StaffDashboardDto {
  filters: DashboardFilters;
  range: { from: string; to: string };
  waiting: { count: number; overdue: number };
  kpis: DealKpis;
  series: DealSeries;
  activePartners: number;
  openApplications: number;
  funnel: FunnelDto;
  partnerHealth: PartnerHealthDto;
  topByPipeline: PartnerPerformanceRow[];
  topByWon: PartnerPerformanceRow[];
  dormantPartners: DormantPartnerRow[];
  managerWorkload: ManagerWorkloadRow[];
  expiring14: ExpiringRow[];
  mostOpenedDocuments: DocumentUseRow[];
  leastOpenedDocuments: DocumentUseRow[];
  integrations: Pick<IntegrationHealthDto, 'pending' | 'failed'> & { lastPollAt: IsoTimestamp | null };
}
