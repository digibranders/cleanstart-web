import type { Bar, FunnelStage, ProtectionBar } from "@/components/charts";
import { PRODUCT_COLOR } from "@/components/charts";
import type { BreakdownRow, DealKpis, ExpiringRow, PartnerDashboardDto } from "@/lib/dashboard-dto";
import { plural } from "@/lib/dates";
import { PROTECTION_DAYS } from "@/lib/deal-rules";
import { PRODUCT_LABEL, type Product } from "@/lib/domain";
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
