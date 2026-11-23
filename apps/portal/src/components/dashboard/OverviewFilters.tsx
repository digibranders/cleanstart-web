"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { DASHBOARD_PERIOD_LABEL, DASHBOARD_PERIODS, DEFAULT_DASHBOARD_PERIOD, type DashboardPeriod } from "@/lib/dashboard-dto";
import { type DealRegion, PARTNER_CATEGORIES, PARTNER_CATEGORY_LABEL, type PartnerCategory, PRODUCT_LABEL, PRODUCTS, type Product } from "@/lib/domain";
import { useRegions } from "@/components/regions-context";

const SHORT_PERIOD: Record<Exclude<DashboardPeriod, "custom">, string> = { "30d": "30 days", "90d": "90 days", "12m": "12 months", ytd: "Year to date" };

export interface OverviewFilterState {
  period: DashboardPeriod;
  /** Only with `period: "custom"`. */
  from?: string | undefined;
  to?: string | undefined;
  product?: Product | undefined;
  region?: DealRegion | undefined;
  category?: PartnerCategory | undefined;
  partnerId?: string | undefined;
}

/** The URL for a filter state. Defaults are left out so the plain Overview URL stays clean. */
export function overviewHref(pathname: string, state: OverviewFilterState): string {
  const p = new URLSearchParams();
  if (state.period === "custom" && state.from && state.to) {
    p.set("period", "custom");
    p.set("from", state.from);
    p.set("to", state.to);
  } else if (state.period !== DEFAULT_DASHBOARD_PERIOD && state.period !== "custom") p.set("period", state.period);
  if (state.category) p.set("category", state.category);
  if (state.region) p.set("region", state.region);
  if (state.product) p.set("product", state.product);
  if (state.partnerId) p.set("partnerId", state.partnerId);
  const qs = p.toString();
  return qs ? `${pathname}?${qs}` : pathname;
}

interface OverviewFiltersProps extends OverviewFilterState {
  /** Staff who see more than one region get a region switch; everyone else leaves it out. */
  regionSwitch?: boolean;
  /** Staff only: adds the partner category switch. */
  categorySwitch?: boolean;
  /** Staff only: the partners to pick from. Omit for a partner viewer. */
  partners?: readonly { id: string; name: string }[];
}

/** Period (segmented control), region, product and partner filters. All live in the URL, so a view can be shared and the back button works. */
export function OverviewFilters({ regionSwitch = false, categorySwitch = false, partners, ...state }: OverviewFiltersProps): React.JSX.Element {
  const pathname = usePathname();
  const router = useRouter();
  const { offer } = useRegions();
  const regions = offer(state.region);
  const go = (next: Partial<OverviewFilterState>): void => router.replace(overviewHref(pathname, { ...state, ...next }));
  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
      <nav className="seg" aria-label="Period">
        {DASHBOARD_PERIODS.map((p) => (
          <Link
            key={p}
            href={overviewHref(pathname, { ...state, period: p })}
            className={`seg-b${p === state.period ? " seg-on" : ""}`}
            aria-current={p === state.period ? "true" : undefined}
            title={DASHBOARD_PERIOD_LABEL[p]}
            style={{ display: "inline-flex", alignItems: "center" }}
          >
            {SHORT_PERIOD[p]}
          </Link>
        ))}
      </nav>
      <span style={{ display: "inline-flex", gap: 4, alignItems: "center" }}>
        <input
          key={`from-${state.from ?? ""}`}
          type="date"
          className="fsel"
          aria-label="From date"
          defaultValue={state.from ?? ""}
          onChange={(e) => e.target.value && go({ period: "custom", from: e.target.value, to: state.to && state.to >= e.target.value ? state.to : e.target.value })}
        />
        <span aria-hidden="true">to</span>
        <input
          key={`to-${state.to ?? ""}`}
          type="date"
          className="fsel"
          aria-label="To date"
          defaultValue={state.to ?? ""}
          onChange={(e) => e.target.value && go({ period: "custom", from: state.from && state.from <= e.target.value ? state.from : e.target.value, to: e.target.value })}
        />
      </span>
      {categorySwitch ? (
        <select
          className="fsel"
          aria-label="Partner category"
          value={state.category ?? ""}
          onChange={(e) => go({ category: (PARTNER_CATEGORIES as readonly string[]).includes(e.target.value) ? (e.target.value as PartnerCategory) : undefined })}
        >
          <option value="">All categories</option>
          {PARTNER_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {PARTNER_CATEGORY_LABEL[c]}
            </option>
          ))}
        </select>
      ) : null}
      {regionSwitch ? (
        <select
          className="fsel"
          aria-label="Region"
          value={state.region ?? ""}
          onChange={(e) => go({ region: regions.some((r) => r.key === e.target.value) ? (e.target.value as DealRegion) : undefined })}
        >
          <option value="">All regions</option>
          {regions.map((r) => (
            <option key={r.key} value={r.key}>
              {r.name}
            </option>
          ))}
        </select>
      ) : null}
      <select
        className="fsel"
        aria-label="Product"
        value={state.product ?? ""}
        onChange={(e) => go({ product: (PRODUCTS as readonly string[]).includes(e.target.value) ? (e.target.value as Product) : undefined })}
      >
        <option value="">All products</option>
        {PRODUCTS.map((p) => (
          <option key={p} value={p}>
            {PRODUCT_LABEL[p]}
          </option>
        ))}
      </select>
      {partners ? (
        <select className="fsel" aria-label="Partner" value={state.partnerId ?? ""} onChange={(e) => go({ partnerId: e.target.value || undefined })}>
          <option value="">All partners</option>
          {partners.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      ) : null}
      {state.period !== DEFAULT_DASHBOARD_PERIOD || state.region || state.product || state.category || state.partnerId ? (
        <Link href={pathname} className="btn btn-s" replace>
          Reset filters
        </Link>
      ) : null}
    </div>
  );
}
