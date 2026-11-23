"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { DASHBOARD_PERIOD_LABEL, DASHBOARD_PERIODS, DEFAULT_DASHBOARD_PERIOD, type DashboardPeriod } from "@/lib/dashboard-dto";
import { DEAL_REGIONS, type DealRegion, PARTNER_REGION_LABEL, PRODUCT_LABEL, PRODUCTS, type Product } from "@/lib/domain";

const SHORT_PERIOD: Record<DashboardPeriod, string> = { "30d": "30 days", "90d": "90 days", "12m": "12 months", ytd: "Year to date" };

export interface OverviewFilterState {
  period: DashboardPeriod;
  product?: Product | undefined;
  region?: DealRegion | undefined;
  partnerId?: string | undefined;
}

/** The URL for a filter state. Defaults are left out so the plain Overview URL stays clean. */
export function overviewHref(pathname: string, state: OverviewFilterState): string {
  const p = new URLSearchParams();
  if (state.period !== DEFAULT_DASHBOARD_PERIOD) p.set("period", state.period);
  if (state.region) p.set("region", state.region);
  if (state.product) p.set("product", state.product);
  if (state.partnerId) p.set("partnerId", state.partnerId);
  const qs = p.toString();
  return qs ? `${pathname}?${qs}` : pathname;
}

interface OverviewFiltersProps extends OverviewFilterState {
  /** Staff who see more than one region get a region switch; everyone else leaves it out. */
  regionSwitch?: boolean;
  /** Staff only: the partners to pick from. Omit for a partner viewer. */
  partners?: readonly { id: string; name: string }[];
}

/** Period (segmented control), region, product and partner filters. All live in the URL, so a view can be shared and the back button works. */
export function OverviewFilters({ regionSwitch = false, partners, ...state }: OverviewFiltersProps): React.JSX.Element {
  const pathname = usePathname();
  const router = useRouter();
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
      {regionSwitch ? (
        <select
          className="fsel"
          aria-label="Region"
          value={state.region ?? ""}
          onChange={(e) => go({ region: (DEAL_REGIONS as readonly string[]).includes(e.target.value) ? (e.target.value as DealRegion) : undefined })}
        >
          <option value="">All regions</option>
          {DEAL_REGIONS.map((r) => (
            <option key={r} value={r}>
              {PARTNER_REGION_LABEL[r]}
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
    </div>
  );
}
