import { formatUsd } from '@/components/dashboard/overview-model';
import { fmtLong, plural } from './dates';
import { REVIEW_SLA_BUSINESS_DAYS } from './deal-rules';
import { PARTNER_CATEGORY_LABEL, PRODUCT_LABEL, STAFF_ROLE_LABEL, type StaffRole } from './domain';
import type { AdminReportsDto } from './dto';
import type { ReportInsightsDto } from './report-insights';
import { type RangedReportDto, type ReportRange, reportRangeQuery } from './report-metrics';
import { acceptRate } from './report-view';

/* The Partner Program Review: every figure, sentence and bar width the six A4 pages show, worked out once here so the
   page components only draw. The Shareable edition is made here, before render, so partner names, managers, follow-ups
   and free-text rejection reasons never reach the HTML. */

export const REPORT_EDITIONS = ['internal', 'shareable'] as const;
export type ReportEdition = (typeof REPORT_EDITIONS)[number];
export const EDITION_LABEL: Record<ReportEdition, string> = { internal: 'Internal', shareable: 'Shareable edition' };

/** `?edition=`: anything but `shareable` is the Internal edition. */
export function parseEdition(value: string | string[] | undefined): ReportEdition {
  return (Array.isArray(value) ? value[0] : value) === 'shareable' ? 'shareable' : 'internal';
}

/** The URL query for a range and an edition. The default range and the Internal edition are left out. */
export function programReviewQuery(range: ReportRange, edition: ReportEdition, extra: Record<string, string> = {}): string {
  const params = new URLSearchParams(reportRangeQuery(range).slice(1));
  if (edition !== 'internal') params.set('edition', edition);
  for (const [key, value] of Object.entries(extra)) params.set(key, value);
  const query = params.toString();
  return query ? `?${query}` : '';
}

/** A, B ... Z, AA, AB ... for the Nth partner. */
export function partnerLetters(index: number): string {
  let out = '';
  let n = index;
  do {
    out = String.fromCharCode(65 + (n % 26)) + out;
    n = Math.floor(n / 26) - 1;
  } while (n >= 0);
  return out;
}

export const PAGE_COUNT = 6;
/** Where the web view and the print view of the review live. Under /admin so the sign in redirect covers it. */
export const PROGRAM_REVIEW_PATH = '/admin/reports/program-review';
const LEADERBOARD_ROWS = 6;
const MANAGER_ROWS = 4;
const ALL_TIME_ROWS = 7;
const REASON_ROWS = 5;
const FOLLOW_UP_ROWS = 4;

/** Status colour keys; the page stylesheet maps each to a custom property. */
export type Tone = 'won' | 'lost' | 'accepted' | 'expired' | 'rejected' | 'pending';

export interface KpiView {
  label: string;
  value: string;
  delta: string;
  /** Bar widths, percent of the larger of the two periods. */
  priorWidth: number;
  currentWidth: number;
}
export interface ChangeView {
  label: string;
  lead: string;
  detail: string;
}
export interface AttentionView {
  lead: string;
  detail: string;
}
export interface SegmentView {
  tone: Tone;
  label: string;
  count: number;
  width: number;
}
export interface CoverBar {
  value: number;
  label: string;
  width: number;
  color: string;
}
export interface FunnelView {
  label: string;
  sub: string;
  value: number;
  width: number;
  priorWidth: number;
  color: string;
}
export interface ProductView {
  product: string;
  deals: number;
  approved: number;
  approvedShare: string;
  won: number;
  wonValue: string;
  totalValue: string;
  /** Width of the whole bar, percent of the largest product. */
  barWidth: number;
  /** Percent of the deals in this product that are won, approved but not won, and not approved. */
  wonSeg: number;
  openSeg: number;
  restSeg: number;
  valueWidth: number;
  wonFill: number;
  swatch: string;
}
export interface LeaderView {
  name: string;
  deals: number;
  won: number;
  wonValue: string;
  width: number;
}
export interface ManagerView {
  name: string;
  detail: string;
  deals: number;
  wonValue: string;
  winRate: string;
}
export interface AllTimeView {
  name: string;
  category: string;
  registered: number;
  accepted: number;
  rate: string;
  won: number;
  protectedNow: number;
}
export interface DecisionBar {
  label: string;
  sub: string;
  current: number | null;
  prior: number | null;
  currentWidth: number;
  priorWidth: number;
}
export interface ReasonView {
  label: string;
  count: number;
  width: number;
}
export interface FollowUpView {
  name: string;
  why: string;
  status: string;
}

export interface ProgramReviewDto {
  edition: ReportEdition;
  period: string;
  priorPeriod: string;
  scope: string;
  scopeLine: string;
  preparedBy: string;
  preparerRole: string;
  generated: string;
  deals: number;
  cover: CoverBar[];
  summary: { headline: string; kpis: KpiView[]; valueNote: string | null; changes: ChangeView[]; attention: AttentionView[] };
  pipeline: {
    lede: string;
    funnel: FunnelView[];
    priorLegend: string;
    stack: SegmentView[];
    products: ProductView[];
    totals: { deals: number; approved: number; won: number; wonValue: string; totalValue: string };
    note: string | null;
  };
  partners: {
    lede: string;
    stat: { big: string; before: string; name: string; after: string } | null;
    leaderboard: LeaderView[];
    leaderboardMore: number;
    managers: ManagerView[] | null;
    allTime: AllTimeView[];
    allTimeMore: number;
    allTimeTotals: { registered: number; accepted: number; rate: string; won: number; protectedNow: number };
  };
  decisions: {
    lede: string;
    bars: DecisionBar[];
    decided: number;
    targetLeft: number;
    priorLegend: string;
    rejected: { summary: string; reasons: ReasonView[] | null };
    engagement: { summary: string; documents: ReasonView[] };
    followUps: FollowUpView[] | null;
  };
  method: {
    definitions: Array<{ term: string; text: string }>;
    about: Array<{ label: string; value: string }>;
    reading: string;
  };
}

export interface ProgramReviewInput {
  edition: ReportEdition;
  current: RangedReportDto;
  previous: RangedReportDto;
  insights: ReportInsightsDto;
  previousInsights: ReportInsightsDto;
  allTime: AdminReportsDto;
  /** Which regions the viewer covers: 'all' or the display names. */
  scope: 'all' | readonly string[];
  preparer: { name: string; role: StaffRole };
  /** ISO timestamp the report was generated. */
  generatedAt: string;
}

const pct = (fraction: number | null): string => (fraction === null ? 'None yet' : `${Math.round(fraction * 100)}%`);
const share = (part: number, whole: number): number => (whole === 0 ? 0 : (part / whole) * 100);
const days = (n: number): string => `${n} ${n === 1 ? 'day' : 'days'}`;

/** Signed whole percent change, or null when there is no base to measure from. */
const change = (now: number, before: number): number | null => (before === 0 ? null : (now - before) / before);
const signedPct = (fraction: number): string => `${fraction > 0 ? '+' : fraction < 0 ? '-' : ''}${Math.abs(Math.round(fraction * 100))}%`;

function deltaText(now: number, before: number, fmt: (n: number) => string): string {
  if (now === 0 && before === 0) return 'None in either period';
  const fraction = change(now, before);
  if (fraction === null) return 'None last period';
  if (now === before) return `Same as last period (${fmt(before)})`;
  return `${signedPct(fraction)} from ${fmt(before)}`;
}

/** Up, down or flat against the previous figure, with a 10 percent band counted as flat. */
type Trend = 'new' | 'up' | 'down' | 'flat';
function trend(now: number, before: number): Trend {
  if (before === 0) return 'new';
  if (now > before * 1.1) return 'up';
  if (now < before * 0.9) return 'down';
  return 'flat';
}

const pairWidths = (now: number, before: number): [number, number] => {
  const top = Math.max(now, before);
  return [share(before, top), share(now, top)];
};

function kpi(label: string, value: string, delta: string, now: number, before: number): KpiView {
  const [priorWidth, currentWidth] = pairWidths(now, before);
  return { label, value, delta, priorWidth, currentWidth };
}

export function buildProgramReview(input: ProgramReviewInput): ProgramReviewDto {
  const { edition, current, previous, insights, previousInsights, allTime } = input;
  const shareable = edition === 'shareable';
  const cs = current.summary;
  const ps = previous.summary;
  const period = `${fmtLong(current.range.from)} to ${fmtLong(current.range.to)}`;
  const priorPeriod = `${fmtLong(previous.range.from)} to ${fmtLong(previous.range.to)}`;
  const scope = input.scope === 'all' ? 'All regions' : input.scope.length > 0 ? input.scope.join(', ') : 'Your regions';

  // One label per partner across every table: the same letter always means the same partner.
  const order = [...allTime.partners].sort((a, b) => b.registered - a.registered || a.name.localeCompare(b.name)).map((p) => p.partnerId);
  for (const row of current.leaderboard) if (!order.includes(row.partnerId)) order.push(row.partnerId);
  const letters = new Map(order.map((id, i) => [id, `Partner ${partnerLetters(i)}`]));
  const nameOf = (id: string, name: string): string => (shareable ? (letters.get(id) ?? 'Partner') : name);

  const approved = current.funnel.find((s) => s.key === 'approved');
  const approvedNow = approved?.count ?? 0;
  const priorApproved = previous.funnel.find((s) => s.key === 'approved')?.count ?? 0;
  const closed = cs.won + cs.lost;
  const openApproved = current.statuses.accepted;
  const rejected = current.statuses.rejected;
  const top = current.leaderboard[0];
  const topName = top ? nameOf(top.partnerId, top.name) : '';
  const topWonShare = top && cs.wonValue > 0 ? top.wonValue / cs.wonValue : 0;
  const dec = insights.decision;
  const priorDec = previousInsights.decision;

  /* summary */
  const dealsTrend = trend(cs.deals, ps.deals);
  const dealsPhrase =
    dealsTrend === 'new'
      ? `${cs.deals} ${cs.deals === 1 ? 'deal was' : 'deals were'} registered`
      : cs.deals >= ps.deals * 2
        ? `Deal registrations more than doubled to ${cs.deals}`
        : `Deal registrations ${dealsTrend === 'up' ? 'rose to' : dealsTrend === 'down' ? 'fell to' : 'held at'} ${cs.deals}`;
  const wonTrend = trend(cs.wonValue, ps.wonValue);
  const wonVerb = wonTrend === 'new' ? 'was' : wonTrend === 'up' ? 'rose to' : wonTrend === 'down' ? 'fell to' : 'held at';
  const wonPhrase =
    cs.wonValue === 0
      ? ps.wonValue === 0
        ? ''
        : ' Nothing has been won this period.'
      : ` Won value ${wonVerb} ${formatUsd(cs.wonValue)}${topWonShare >= 0.5 ? `, and ${shareable ? 'one partner' : topName} carried most of it` : ''}.`;
  const headline = cs.deals === 0 ? 'No deals were registered in this period.' : `${dealsPhrase}.${wonPhrase}`;

  const medianNow = dec.median;
  const medianBefore = priorDec.median;
  const medianKpi =
    medianNow === null
      ? kpi('Median days to decision', 'None yet', 'No deal decided in this period', 0, medianBefore ?? 0)
      : kpi(
          'Median days to decision',
          String(medianNow),
          medianBefore === null
            ? 'No decisions last period'
            : medianNow === medianBefore
              ? `Same as last period (${days(medianBefore)})`
              : `${medianNow > medianBefore ? '+' : '-'}${days(Math.round(Math.abs(medianNow - medianBefore) * 10) / 10)} from ${days(medianBefore)}`,
          medianNow,
          medianBefore ?? 0,
        );
  const kpis: KpiView[] = [
    kpi('Deals registered', String(cs.deals), deltaText(cs.deals, ps.deals, String), cs.deals, ps.deals),
    kpi('Registered value', formatUsd(cs.totalValue), deltaText(cs.totalValue, ps.totalValue, formatUsd), cs.totalValue, ps.totalValue),
    kpi('Won value', formatUsd(cs.wonValue), deltaText(cs.wonValue, ps.wonValue, formatUsd), cs.wonValue, ps.wonValue),
    medianKpi,
  ];

  const valueChange = change(cs.totalValue, ps.totalValue);
  const valueMove = valueChange === null || valueChange === 0 ? '' : `, ${valueChange > 0 ? 'up' : 'down'} ${Math.abs(Math.round(valueChange * 100))}%`;
  const priorRate = acceptShare(priorApproved, ps.deals);
  const nowRate = acceptShare(approvedNow, cs.deals);
  const changes: ChangeView[] = [
    {
      label: 'Volume',
      lead:
        ps.deals === 0
          ? `${plural(cs.deals, 'deal')} registered, none last period.`
          : `${plural(cs.deals, 'deal')} registered, ${cs.deals === ps.deals ? 'the same as' : cs.deals > ps.deals ? 'up from' : 'down from'} ${ps.deals}.`,
      detail:
        cs.deals === 0
          ? 'Nothing to compare.'
          : `${approvedNow} of ${cs.deals} (${nowRate}) were approved${ps.deals > 0 ? `, against ${priorApproved} of ${ps.deals} (${priorRate}) last period` : ''}${current.statuses.pending > 0 ? `, and ${current.statuses.pending} still wait for a first decision` : ''}.`,
    },
    {
      label: 'Value',
      lead: `Registered value was ${formatUsd(cs.totalValue)}${valueMove}.`,
      detail: `Won value was ${formatUsd(cs.wonValue)} from ${plural(cs.won, 'deal')}${ps.won > 0 || ps.wonValue > 0 ? `, against ${formatUsd(ps.wonValue)} from ${plural(ps.won, 'deal')} last period` : ''}.`,
    },
    {
      label: 'Conversion',
      lead: closed === 0 ? 'Nothing has closed yet.' : `The ${pct(cs.winRate)} win rate rests on ${plural(closed, 'closed deal')}.`,
      detail:
        openApproved === 0
          ? 'No approved deal is still open.'
          : `${openApproved} approved ${openApproved === 1 ? 'deal is' : 'deals are'} still open${openApproved >= closed ? ', so treat the rate as early' : ''}.`,
    },
    top
      ? {
          label: 'Concentration',
          lead: `${topName} registered ${top.deals} of ${cs.deals} deals (${pct(top.deals / cs.deals)}).`,
          detail: cs.wonValue > 0 ? `It holds ${formatUsd(top.wonValue)} of the ${formatUsd(cs.wonValue)} won (${pct(topWonShare)}).` : 'No deal has been won yet.',
        }
      : { label: 'Concentration', lead: 'No partner registered a deal.', detail: '' },
    {
      label: 'Speed',
      lead:
        dec.median === null
          ? 'No deal has had a first decision yet.'
          : `Median time to a first decision ${priorDec.median === null ? `was ${days(dec.median)}` : dec.median === priorDec.median ? `held at ${days(dec.median)}` : `${dec.median > priorDec.median ? 'rose' : 'fell'} from ${priorDec.median} to ${days(dec.median)}`}.`,
      detail:
        dec.p90 === null
          ? ''
          : `The slowest tenth took ${days(dec.p90)}${priorDec.p90 === null ? '' : `, against ${days(priorDec.p90)} last period`}.`,
    },
  ];

  const followUps = allTime.followUps;
  const weakest = current.products
    .filter((p) => p.deals >= 3 && p.approved / p.deals < 0.5)
    .sort((a, b) => a.approved / a.deals - b.approved / b.deals || b.deals - a.deals)[0];
  const attention: AttentionView[] = [];
  if (current.statuses.pending > 0) {
    attention.push({ lead: `Decide the ${plural(current.statuses.pending, 'deal')} still waiting.`, detail: `The review target is ${plural(REVIEW_SLA_BUSINESS_DAYS, 'business day')}.` });
  }
  if (weakest) {
    attention.push({ lead: `Review ${PRODUCT_LABEL[weakest.product]}.`, detail: `${weakest.approved} of ${weakest.deals} deals were approved and ${weakest.won} won.` });
  }
  if (top && topWonShare >= 0.75) {
    attention.push({ lead: `Reduce reliance on ${shareable ? 'one partner' : topName}.`, detail: `It holds ${pct(topWonShare)} of won value.` });
  }
  if (!shareable && followUps.length > 0) {
    const names = followUps.slice(0, 3).map((f) => f.name);
    attention.push({
      lead: `Follow up with ${plural(followUps.length, 'partner')}.`,
      detail: `${names.join(', ')}${followUps.length > names.length ? ` and ${followUps.length - names.length} more` : ''}.`,
    });
  }
  if (attention.length === 0) attention.push({ lead: 'Nothing needs attention this period.', detail: '' });

  /* pipeline */
  const submitted = current.funnel.find((s) => s.key === 'submitted')?.count ?? 0;
  const funnelScale = Math.max(submitted, previous.funnel.find((s) => s.key === 'submitted')?.count ?? 0);
  const funnelRows = (['submitted', 'approved', 'won'] as const).map((key, i): FunnelView => {
    const step = current.funnel.find((s) => s.key === key);
    const before = previous.funnel.find((s) => s.key === key)?.count ?? 0;
    const value = step?.count ?? 0;
    return {
      label: ['Registered', 'Approved', 'Won'][i] ?? key,
      sub: i === 0 ? 'All deals' : step === undefined || step.conversion === null ? 'None yet' : `${pct(step.conversion)} of ${step.from === 'submitted' ? 'registered' : step.from}`,
      value,
      width: share(value, funnelScale),
      priorWidth: share(before, funnelScale),
      color: ['#6A3FE0', '#4B23C8', '#2F1590'][i] ?? '#4B23C8',
    };
  });
  const priorSubmitted = previous.funnel.find((s) => s.key === 'submitted')?.count ?? 0;
  const priorWon = previous.funnel.find((s) => s.key === 'won')?.count ?? 0;
  const stack: SegmentView[] = (
    [
      ['won', 'Won', current.statuses.won],
      ['lost', 'Lost', current.statuses.lost],
      ['accepted', 'Approved, still open', current.statuses.accepted],
      ['expired', 'Protection ended', current.statuses.expired],
      ['pending', 'Waiting for a decision', current.statuses.pending],
      ['rejected', 'Rejected', current.statuses.rejected],
    ] as const
  )
    .filter(([, , count]) => count > 0)
    .map(([tone, label, count]) => ({ tone, label, count, width: share(count, cs.deals) }));

  const maxDeals = Math.max(1, ...current.products.map((p) => p.deals));
  const maxValue = Math.max(1, ...current.products.map((p) => p.totalValue));
  const swatches = { images: '#5B2FE2', libraries: '#1F5BD6', cleansight: '#0E8FB3' } as const;
  const products = current.products.map(
    (p): ProductView => ({
      product: PRODUCT_LABEL[p.product],
      deals: p.deals,
      approved: p.approved,
      approvedShare: p.deals === 0 ? '' : pct(p.approved / p.deals),
      won: p.won,
      wonValue: formatUsd(p.wonValue),
      totalValue: formatUsd(p.totalValue),
      barWidth: share(p.deals, maxDeals),
      wonSeg: share(p.won, p.deals),
      openSeg: share(p.approved - p.won, p.deals),
      restSeg: share(p.deals - p.approved, p.deals),
      valueWidth: share(p.totalValue, maxValue),
      wonFill: share(p.wonValue, p.totalValue),
      swatch: swatches[p.product],
    }),
  );
  const [bestProduct] = [...current.products].filter((p) => p.deals >= 3).sort((a, b) => b.approved / b.deals - a.approved / a.deals || b.deals - a.deals);
  const mostDeals = [...current.products].sort((a, b) => b.deals - a.deals)[0];

  /* partners */
  const maxLeaderDeals = Math.max(1, ...current.leaderboard.map((r) => r.deals));
  const leaderboard = current.leaderboard.slice(0, LEADERBOARD_ROWS).map(
    (r): LeaderView => ({ name: nameOf(r.partnerId, r.name), deals: r.deals, won: r.won, wonValue: formatUsd(r.wonValue), width: share(r.deals, maxLeaderDeals) }),
  );
  const managers = shareable
    ? null
    : insights.managers
        .filter((m) => m.deals > 0)
        .slice(0, MANAGER_ROWS)
        .map((m): ManagerView => ({ name: m.label, detail: m.detail, deals: m.deals, wonValue: formatUsd(m.wonValue), winRate: pct(m.winRate) }));
  const allRows = [...allTime.partners].sort((a, b) => b.registered - a.registered || b.won - a.won || a.name.localeCompare(b.name));
  const sum = (pick: (p: AdminReportsDto['partners'][number]) => number): number => allRows.reduce((n, p) => n + pick(p), 0);
  const acceptedAll = sum((p) => p.accepted);
  const rejectedAll = sum((p) => p.rejected);
  const rateText = (accepted: number, rej: number): string => {
    const rate = acceptRate(accepted, rej);
    return rate === null ? 'None yet' : `${rate}%`;
  };
  const allTimeRows = allRows.slice(0, ALL_TIME_ROWS).map(
    (p): AllTimeView => ({
      name: nameOf(p.partnerId, p.name),
      category: PARTNER_CATEGORY_LABEL[p.category],
      registered: p.registered,
      accepted: p.accepted,
      rate: rateText(p.accepted, p.rejected),
      won: p.won,
      protectedNow: p.protectedNow,
    }),
  );
  const stat =
    top === undefined
      ? null
      : cs.wonValue > 0
        ? {
            big: pct(topWonShare),
            before: 'of won value came from ',
            name: shareable ? 'one partner' : topName,
            after: `: ${formatUsd(top.wonValue)} of ${formatUsd(cs.wonValue)}, from ${top.deals} of the ${cs.deals} deals registered.`,
          }
        : {
            big: pct(top.deals / cs.deals),
            before: 'of registered deals came from ',
            name: shareable ? 'one partner' : topName,
            after: `: ${top.deals} of ${cs.deals}. Nothing has been won yet.`,
          };

  /* decisions */
  const targetDays = REVIEW_SLA_BUSINESS_DAYS;
  const values = [dec.median, dec.p90, priorDec.median, priorDec.p90].filter((v): v is number => v !== null);
  const scale = Math.max(targetDays, ...values) * 1.15;
  const bar = (label: string, sub: string, now: number | null, before: number | null): DecisionBar => ({
    label,
    sub,
    current: now,
    prior: before,
    currentWidth: now === null ? 0 : share(now, scale),
    priorWidth: before === null ? 0 : share(before, scale),
  });
  const reasonMax = Math.max(1, ...insights.reasons.map((r) => r.count));
  const docMax = Math.max(1, ...insights.engagement.top.map((d) => d.opens));
  const eng = insights.engagement;

  /* method */
  const comparisonDays = Math.round((Date.parse(`${previous.range.to}T00:00:00Z`) - Date.parse(`${previous.range.from}T00:00:00Z`)) / 86_400_000) + 1;
  const generatedDate = input.generatedAt.slice(0, 10);
  const generated = `${fmtLong(generatedDate)}, ${input.generatedAt.slice(11, 16)} UTC`;
  const scopeLine = `${scope}, ${plural(allTime.totalPartners, 'partner')}, compared with ${priorPeriod}`;

  return {
    edition,
    period,
    priorPeriod,
    scope,
    scopeLine,
    preparedBy: input.preparer.name,
    preparerRole: STAFF_ROLE_LABEL[input.preparer.role],
    generated,
    deals: cs.deals,
    cover: [
      { value: submitted, label: 'registered', width: share(submitted, submitted) * 0.62, color: '#8A66EA' },
      { value: approvedNow, label: 'approved', width: share(approvedNow, submitted) * 0.62, color: '#5B2FE2' },
      { value: cs.won, label: 'won', width: share(cs.won, submitted) * 0.62, color: '#D9CFF7' },
    ],
    summary: {
      headline,
      kpis,
      valueNote: cs.unvalued > 0 ? `Value figures count deals with a USD value. ${cs.unvalued} of ${cs.deals} deals this period have none, so values are a floor.` : null,
      changes,
      attention,
    },
    pipeline: {
      lede:
        cs.deals === 0
          ? 'No deals were registered in this period.'
          : `Of ${cs.deals} deals registered, ${approvedNow} were approved and ${cs.won} ${cs.won === 1 ? 'is' : 'are'} won.${bestProduct && mostDeals && bestProduct.product !== mostDeals.product ? ` ${PRODUCT_LABEL[bestProduct.product]} converts best. ${PRODUCT_LABEL[mostDeals.product]} has the most deals.` : ''}`,
      funnel: funnelRows,
      priorLegend: `Last period: ${priorSubmitted} registered, ${priorApproved} approved, ${priorWon} won`,
      stack,
      products,
      totals: {
        deals: cs.deals,
        approved: approvedNow,
        won: cs.won,
        wonValue: formatUsd(cs.wonValue),
        totalValue: formatUsd(cs.totalValue),
      },
      note: cs.unvalued > 0 ? `The darker part of each bar is the value already won. ${plural(cs.unvalued, 'deal')} ${cs.unvalued === 1 ? 'has' : 'have'} no USD value and ${cs.unvalued === 1 ? 'is' : 'are'} not in these totals.` : 'The darker part of each bar is the value already won.',
    },
    partners: {
      lede: `${current.leaderboard.length} of ${plural(allTime.totalPartners, 'partner')} registered deals this period.`,
      stat,
      leaderboard,
      leaderboardMore: Math.max(0, current.leaderboard.length - LEADERBOARD_ROWS),
      managers,
      allTime: allTimeRows,
      allTimeMore: Math.max(0, allRows.length - ALL_TIME_ROWS),
      allTimeTotals: { registered: allTime.totalRegistered, accepted: acceptedAll, rate: rateText(acceptedAll, rejectedAll), won: sum((p) => p.won), protectedNow: sum((p) => p.protectedNow) },
    },
    decisions: {
      lede:
        dec.median === null
          ? 'No deal registered in this period has had a first decision.'
          : `The median first decision took ${days(dec.median)}${priorDec.median === null ? '' : `, against ${days(priorDec.median)} last period`}. ${dec.waiting > 0 ? `${plural(dec.waiting, 'deal')} still ${dec.waiting === 1 ? 'waits' : 'wait'}.` : 'No deal is waiting.'}`,
      bars: [
        bar('Median', `${dec.decided} decided, ${dec.waiting} waiting`, dec.median, priorDec.median),
        bar('90th percentile', `last period ${priorDec.decided} decided`, dec.p90, priorDec.p90),
      ],
      decided: dec.decided,
      targetLeft: share(targetDays, scale),
      priorLegend: priorDec.decided === 0 ? 'Last period: no decisions' : 'Last period',
      rejected: {
        summary:
          rejected === 0
            ? 'No deals were rejected in this period.'
            : `${rejected} of ${cs.deals} deals (${pct(rejected / cs.deals)}). ${shareable ? 'Reasons stay in the portal.' : 'Reasons are as the approver wrote them.'}`,
        reasons: shareable || rejected === 0 ? null : insights.reasons.slice(0, REASON_ROWS).map((r) => ({ label: r.reason, count: r.count, width: share(r.count, reasonMax) })),
      },
      engagement: {
        summary: eng.partners === 0 ? 'No active partners in scope.' : `${eng.openedAny} of ${eng.partners} active ${eng.partners === 1 ? 'partner' : 'partners'} opened at least one document.`,
        documents: eng.top.map((d) => ({ label: d.title, count: d.opens, width: share(d.opens, docMax) })),
      },
      followUps: shareable || followUps.length === 0 ? null : followUps.slice(0, FOLLOW_UP_ROWS).map((f) => ({ name: f.name, why: f.why, status: f.status === 'onboarding' ? 'Onboarding' : 'Inactive' })),
    },
    method: {
      definitions: [
        { term: 'Registered deal', text: 'A deal a partner submitted in the period, counted on the day it was submitted.' },
        { term: 'Approved', text: 'A registered deal accepted by CleanStart. Won and lost deals are also approved.' },
        { term: 'Won', text: 'A deal marked closed won in HubSpot.' },
        { term: 'Win rate', text: 'Won deals divided by won plus lost deals. Open deals are left out, so the rate moves as they close.' },
        { term: 'Registered value', text: 'The sum of USD values on registered deals. Deals with no USD value, or a value in another currency, are counted as deals but add nothing to value.' },
        { term: 'Time to decision', text: `Calendar days from registration to the first accept or reject. After a rejection and resubmission the clock restarts at the resubmission. The review target is ${plural(REVIEW_SLA_BUSINESS_DAYS, 'business day')}, and the portal Overview shows an average in business days, so its figure differs from the median here.` },
        { term: 'Protected now', text: 'Deals currently inside their protection window.' },
        { term: 'Comparison', text: `The prior period has the same length and ends the day before this one starts: ${priorPeriod}, ${plural(comparisonDays, 'day')}.` },
      ],
      about: [
        { label: 'Scope', value: `${scope}, the regions the preparer covers` },
        { label: 'Edition', value: EDITION_LABEL[edition] },
        { label: 'Prepared by', value: `${input.preparer.name}, ${STAFF_ROLE_LABEL[input.preparer.role]}` },
        { label: 'Generated', value: generated },
        { label: 'Sources', value: 'CleanStart Partner Portal, HubSpot closed won status' },
        { label: 'Comparison', value: priorPeriod },
      ],
      reading: shareable
        ? 'Partner names are replaced by letters, and the manager table, partner follow-ups and rejection reasons are left out.'
        : 'Partners with no registrations in the period are listed in the all time table so its totals match the portal. Rejection reasons are free text written by approvers and can name customers, so keep this edition inside CleanStart.',
    },
  };
}

function acceptShare(approved: number, deals: number): string {
  return deals === 0 ? 'none' : pct(approved / deals);
}
