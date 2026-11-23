import type { Bar, FunnelStage, HeatWeek, ProtectionBar } from "@/components/charts";
import { PRODUCT_COLOR } from "@/components/charts";
import { type BreakdownRow, type DashboardFilters, type DealKpis, type ExpiringRow, type HeatWeekPoint, type ManagerWorkloadRow, type PartnerDashboardDto, type ReasonRow, type StaffDashboardDto, DASHBOARD_PERIOD_LABEL } from "@/lib/dashboard-dto";
import { plural } from "@/lib/dates";
import { PROTECTION_DAYS } from "@/lib/deal-rules";
import { PARTNER_CATEGORY_LABEL, PRODUCT_LABEL, type Product } from "@/lib/domain";
import { regionName } from "@/lib/regions";
import { ROUTES } from "@/lib/routes";
import { STAGE_LABELS } from "@/server/hubspot/types";

const DAY_MS = 86_400_000;
const NOT_GIVEN = "Not given";

/** "$1.2M", "$48K", "$950". Whole dollars; the unit is always USD (the reporting currency). */
export function formatUsd(value: number): string {
  const abs = Math.abs(value);
  const trim = (n: number): string => String(Math.round(n * 10) / 10);
  if (abs >= 1_000_000) return `$${trim(value / 1_000_000)}M`;
  if (abs >= 1_000) return `$${trim(value / 1_000)}K`;
  return `$${Math.round(value)}`;
}

export interface OverviewTile {
  key: string;
  label: string;
  value: string;
  foot: string;
  /** The Deals tab the tile opens. */
  status: string;
  trend?: readonly number[];
}

/** The six KPI tiles. Only the pipeline tile has a trend: the monthly series is registered value, which says nothing about the others. */
export function buildDashboardTiles(d: PartnerDashboardDto): OverviewTile[] {
  const k: DealKpis = d.kpis;
  const other = k.otherCurrencyDeals;
  return [
    {
      key: "pipeline",
      label: "Open pipeline",
      value: formatUsd(k.pipeline.value),
      foot: `${plural(k.pipeline.count, "open deal")}${other > 0 ? `, ${plural(other, "deal")} in other currencies not counted` : ""}`,
      status: "all",
      trend: d.series.monthly.map((m) => m.value),
    },
    {
      key: "protected",
      label: "Protected deals",
      value: String(d.protectedNow),
      foot: d.protectedNow ? `${PROTECTION_DAYS} day protection` : "None yet",
      status: "accepted",
    },
    {
      key: "expiring",
      label: "Expiring in 14 days",
      value: String(d.expiring14.length),
      foot: d.expiring14.length ? d.expiring14.map((e) => e.customer).slice(0, 2).join(", ") : "None",
      status: "accepted",
    },
    {
      key: "won",
      label: "Won this period",
      value: String(k.won.count),
      foot: k.won.count ? `${formatUsd(k.won.value)} won` : "None yet",
      status: "won",
    },
    {
      key: "winrate",
      label: "Win rate",
      value: k.winRate === null ? "None yet" : `${Math.round(k.winRate * 100)}%`,
      foot: k.winRate === null ? "No won or lost deals" : "Won of won and lost",
      status: "all",
    },
    {
      key: "decision",
      label: "Time to decision",
      value: k.avgDecisionDays === null ? "None yet" : `${k.avgDecisionDays} days`,
      foot: k.avgDecisionDays === null ? "No decided deals" : "Business days, on average",
      status: "all",
    },
  ];
}

const toBars = (rows: readonly BreakdownRow[], label: (key: string) => string, color?: (key: string) => string | undefined): Bar[] =>
  rows
    .filter((r) => r.value > 0)
    .map((r) => {
      const c = color?.(r.key);
      return { key: r.key, label: label(r.key), value: r.value, ...(c ? { color: c } : {}) };
    });

/** Pipeline value per product, in the product colour. */
export const productBars = (rows: readonly BreakdownRow[]): Bar[] =>
  toBars(
    rows,
    (key) => PRODUCT_LABEL[key as Product] ?? key,
    (key) => PRODUCT_COLOR[PRODUCT_LABEL[key as Product] as keyof typeof PRODUCT_COLOR],
  );

/** Pipeline value per country or industry. The "Not given" bucket is not a place, so it is left out. */
export const valueBars = (rows: readonly BreakdownRow[]): Bar[] => toBars(rows.filter((r) => r.key !== NOT_GIVEN), (key) => key);

/** Stages run in this order; "Awaiting review" and any stage the portal does not know (rank -1) come before "Accepted". */
const stageRank = (label: string): number => (STAGE_LABELS as readonly string[]).indexOf(label);

/**
 * Open deals that reached each stage, in the order the stages run. A deal at a later stage also passed the earlier ones, so each
 * row counts its own deals plus every later stage's, and the bars only ever shrink, as a funnel must.
 */
export function stageFunnel(rows: readonly BreakdownRow[]): FunnelStage[] {
  const ordered = rows.filter((r) => r.count > 0).sort((a, b) => stageRank(a.key) - stageRank(b.key) || a.key.localeCompare(b.key));
  let reached = ordered.reduce((n, r) => n + r.count, 0);
  return ordered.map((r) => {
    const stage = { label: r.key, value: reached };
    reached -= r.count;
    return stage;
  });
}

export const dayMs = (iso: string): number => Date.parse(`${iso}T00:00:00Z`);

/** The next `limit` protection windows to end. The start is the end minus the standard window, as the DTO carries no start date. */
export function protectionBars(rows: readonly ExpiringRow[], limit = 10): ProtectionBar[] {
  return rows.slice(0, limit).map((r) => ({
    key: r.id,
    label: r.customer,
    start: dayMs(r.protectionEnd) - PROTECTION_DAYS * DAY_MS,
    end: dayMs(r.protectionEnd),
    state: "expiring",
  }));
}

export interface StaffTile {
  key: string;
  label: string;
  value: string;
  foot: string;
  /** Where the tile goes: the Deals screen on a status tab, or Partners. */
  href: string;
  trend?: readonly number[];
}

const dealsHref = (status: string): string => `${ROUTES.admin.approvals}?status=${status}`;

/**
 * The eight staff KPI tiles. `canApplications` is false for roles that cannot read applications (staff sales), whose
 * "open applications" tile then opens Partners without the applications filter.
 */
export function buildStaffTiles(d: StaffDashboardDto, canApplications: boolean): StaffTile[] {
  const k = d.kpis;
  const other = k.otherCurrencyDeals;
  return [
    {
      key: "waiting",
      label: "Waiting for approval",
      value: String(d.waiting.count),
      foot: d.waiting.overdue ? `${d.waiting.overdue} past the 2 day target` : "None past the 2 day target",
      href: dealsHref("waiting"),
    },
    {
      key: "target",
      label: "Decided within 2 days",
      value: k.decidedWithinTarget === null ? "None yet" : `${Math.round(k.decidedWithinTarget * 100)}%`,
      foot: k.decidedWithinTarget === null ? "No decided deals" : "Business days, of decided deals",
      href: dealsHref("all"),
    },
    {
      key: "decision",
      label: "Average time to decision",
      value: k.avgDecisionDays === null ? "None yet" : `${k.avgDecisionDays} days`,
      foot: k.avgDecisionDays === null ? "No decided deals" : "Business days, on average",
      href: dealsHref("all"),
    },
    {
      key: "partners",
      label: "Active partners",
      value: String(d.activePartners),
      foot: `${d.partnerHealth.onboarding} onboarding`,
      href: ROUTES.admin.partners,
    },
    {
      key: "applications",
      label: "Open applications",
      value: String(d.openApplications),
      foot: d.openApplications ? "Waiting for a decision" : "None waiting",
      href: canApplications ? `${ROUTES.admin.partners}?astatus=new` : ROUTES.admin.partners,
    },
    {
      key: "pipeline",
      label: "Open pipeline",
      value: formatUsd(k.pipeline.value),
      foot: `${plural(k.pipeline.count, "open deal")}${other > 0 ? `, ${plural(other, "deal")} in other currencies not counted` : ""}`,
      href: dealsHref("all"),
      trend: d.series.monthly.map((m) => m.value),
    },
    {
      key: "won",
      label: "Won this period",
      value: String(k.won.count),
      foot: k.won.count ? `${formatUsd(k.won.value)} won` : "None yet",
      href: dealsHref("won"),
    },
    {
      key: "protected",
      label: "Protected deals",
      value: String(d.protectedNow),
      foot: d.protectedNow ? `${d.expiring14.length} expiring in 14 days` : "None yet",
      href: dealsHref("accepted"),
    },
  ];
}

/** Pipeline value per deal region, largest first. */
export const regionBars = (rows: readonly BreakdownRow[], label: (key: string) => string = regionName): Bar[] => toBars(rows, label);

/** Rejection reasons as a ranked list. */
export const reasonBars = (rows: readonly ReasonRow[]): Bar[] => rows.map((r) => ({ key: r.reason, label: r.reason, value: r.count }));

/** Deals waiting per manager, busiest first; managers with nothing waiting are left out. */
export const workloadBars = (rows: readonly ManagerWorkloadRow[]): Bar[] =>
  rows
    .filter((r) => r.waiting > 0)
    .map((r) => ({ key: r.managerId ?? "none", label: r.name, value: r.waiting }))
    .sort((a, b) => b.value - a.value || a.label.localeCompare(b.label));

/** "Mon 3 Nov" style label for a week that starts on the given Monday. */
export const weekLabel = (weekStart: string): string => new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", timeZone: "UTC" }).format(new Date(`${weekStart}T00:00:00Z`));

export const TILES_CSV_HEADER = ["Measure", "Value", "Note"] as const;

/** The KPI table as CSV rows, one per tile. */
export const tilesCsv = (tiles: readonly StaffTile[]): string[][] => tiles.map((t) => [t.label, t.value, t.foot]);

/** The heat map weeks, labelled with the Monday of each week. Days after today stay null so they draw nothing. */
export const heatWeeks = (points: readonly HeatWeekPoint[]): HeatWeek[] => points.map((w) => ({ label: weekLabel(w.weekStart), days: w.days }));

/** True when the heat map has no registration in any of its weeks. */
export const heatIsEmpty = (points: readonly HeatWeekPoint[]): boolean => points.every((w) => w.days.every((d) => !d));

/** The file name for the KPI download: it carries the exact days covered, so two exports never share a name. */
export const kpiFilename = (range: { from: string; to: string }): string => `overview-kpis-${range.from}-to-${range.to}.csv`;

/**
 * The KPI download: the filters that produced the figures first, so a saved file says what it covers, then one row per tile.
 * `names` turns a partner id into a name (staff only).
 */
export function kpiCsvRows(filters: DashboardFilters, range: { from: string; to: string }, tiles: readonly { label: string; value: string; foot: string }[], names: ReadonlyMap<string, string> = new Map(), regionLabel: (key: string) => string = regionName): string[][] {
  const applied: string[][] = [["Period", filters.period === "custom" ? "Custom dates" : DASHBOARD_PERIOD_LABEL[filters.period], `${range.from} to ${range.to}`]];
  if (filters.region) applied.push(["Region", regionLabel(filters.region), ""]);
  if (filters.product) applied.push(["Product", PRODUCT_LABEL[filters.product], ""]);
  if (filters.category) applied.push(["Partner category", PARTNER_CATEGORY_LABEL[filters.category], ""]);
  if (filters.partnerId) applied.push(["Partner", names.get(filters.partnerId) ?? filters.partnerId, ""]);
  return [...applied, ...tiles.map((t) => [t.label, t.value, t.foot])];
}
