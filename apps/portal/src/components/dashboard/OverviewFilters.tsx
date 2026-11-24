"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { DASHBOARD_PERIOD_LABEL, DASHBOARD_PERIODS, DEFAULT_DASHBOARD_PERIOD, type DashboardPeriod } from "@/lib/dashboard-dto";
import { type DealRegion, PARTNER_CATEGORIES, PARTNER_CATEGORY_LABEL, type PartnerCategory, PRODUCT_LABEL, PRODUCTS, type Product } from "@/lib/domain";
import { useRegions } from "@/components/regions-context";
import { DatePicker } from "@/components/ui/date-picker";
import { Dropdown } from "@/components/ui/dropdown";

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
    <div className="flt" style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
      <nav className="seg" aria-label="Period">
        {DASHBOARD_PERIODS.map((p) => (
          <Link
            key={p}
            href={overviewHref(pathname, { ...state, period: p })}
            className={`seg-b${p === state.period ? " seg-on" : ""}`}
            aria-current={p === state.period ? "true" : undefined}
            data-hint={DASHBOARD_PERIOD_LABEL[p]}
            style={{ display: "inline-flex", alignItems: "center" }}
          >
            {SHORT_PERIOD[p]}
          </Link>
        ))}
      </nav>
      <span className="flt-dates" style={{ display: "inline-flex", gap: 4, alignItems: "center" }}>
        <DatePicker
          variant="fsel"
          ariaLabel="From date"
          placeholder="From"
          value={state.from ?? ""}
          max={state.to}
          onChange={(v) => v && go({ period: "custom", from: v, to: state.to && state.to >= v ? state.to : v })}
        />
        <span aria-hidden="true">to</span>
        <DatePicker
          variant="fsel"
          ariaLabel="To date"
          placeholder="To"
          value={state.to ?? ""}
          min={state.from}
          onChange={(v) => v && go({ period: "custom", from: state.from && state.from <= v ? state.from : v, to: v })}
        />
      </span>
      {categorySwitch ? (
        <Dropdown
          ariaLabel="Partner category"
          value={state.category ?? ""}
          options={[{ value: "", label: "All categories" }, ...PARTNER_CATEGORIES.map((c) => ({ value: c, label: PARTNER_CATEGORY_LABEL[c] }))]}
          onChange={(v) => go({ category: (PARTNER_CATEGORIES as readonly string[]).includes(v) ? (v as PartnerCategory) : undefined })}
        />
      ) : null}
      {regionSwitch ? (
        <Dropdown
          ariaLabel="Region"
          value={state.region ?? ""}
          options={[{ value: "", label: "All regions" }, ...regions.map((r) => ({ value: r.key, label: r.name }))]}
          onChange={(v) => go({ region: regions.some((r) => r.key === v) ? (v as DealRegion) : undefined })}
        />
      ) : null}
      <Dropdown
        ariaLabel="Product"
        value={state.product ?? ""}
        options={[{ value: "", label: "All products" }, ...PRODUCTS.map((p) => ({ value: p, label: PRODUCT_LABEL[p] }))]}
        onChange={(v) => go({ product: (PRODUCTS as readonly string[]).includes(v) ? (v as Product) : undefined })}
      />
      {partners ? (
        <Dropdown
          ariaLabel="Partner"
          value={state.partnerId ?? ""}
          options={[{ value: "", label: "All partners" }, ...partners.map((p) => ({ value: p.id, label: p.name }))]}
          onChange={(v) => go({ partnerId: v || undefined })}
        />
      ) : null}
      {state.period !== DEFAULT_DASHBOARD_PERIOD || state.region || state.product || state.category || state.partnerId ? (
        <Link href={pathname} className="btn btn-s" replace>
          Reset filters
        </Link>
      ) : null}
    </div>
  );
}
