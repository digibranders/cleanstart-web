"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { DASHBOARD_PERIOD_LABEL, DASHBOARD_PERIODS, DEFAULT_DASHBOARD_PERIOD, type DashboardPeriod } from "@/lib/dashboard-dto";
import { PRODUCT_LABEL, PRODUCTS, type Product } from "@/lib/domain";

const SHORT_PERIOD: Record<DashboardPeriod, string> = { "30d": "30 days", "90d": "90 days", "12m": "12 months", ytd: "Year to date" };

/** The URL for a period and product. Defaults are left out so the plain Overview URL stays clean. */
export function overviewHref(pathname: string, period: DashboardPeriod, product: Product | undefined): string {
  const p = new URLSearchParams();
  if (period !== DEFAULT_DASHBOARD_PERIOD) p.set("period", period);
  if (product) p.set("product", product);
  const qs = p.toString();
  return qs ? `${pathname}?${qs}` : pathname;
}

/** Period (segmented control) and product filter. Both live in the URL, so a view can be shared and the back button works. */
export function OverviewFilters({ period, product }: { period: DashboardPeriod; product: Product | undefined }): React.JSX.Element {
  const pathname = usePathname();
  const router = useRouter();
  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
      <nav className="seg" aria-label="Period">
        {DASHBOARD_PERIODS.map((p) => (
          <Link
            key={p}
            href={overviewHref(pathname, p, product)}
            className={`seg-b${p === period ? " seg-on" : ""}`}
            aria-current={p === period ? "true" : undefined}
            title={DASHBOARD_PERIOD_LABEL[p]}
            style={{ display: "inline-flex", alignItems: "center" }}
          >
            {SHORT_PERIOD[p]}
          </Link>
        ))}
      </nav>
      <select
        className="fsel"
        aria-label="Product"
        value={product ?? ""}
        onChange={(e) => router.replace(overviewHref(pathname, period, (PRODUCTS as readonly string[]).includes(e.target.value) ? (e.target.value as Product) : undefined))}
      >
        <option value="">All products</option>
        {PRODUCTS.map((p) => (
          <option key={p} value={p}>
            {PRODUCT_LABEL[p]}
          </option>
        ))}
      </select>
    </div>
  );
}
