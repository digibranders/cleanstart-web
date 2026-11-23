"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ScrollRegion } from "@/components/ui/scroll-region";
import { fmtLong } from "@/lib/dates";
import { PRODUCT_LABEL, PRODUCTS } from "@/lib/domain";
import { RegionName, useRegions } from "@/components/regions-context";
import type { ManagerOptionDto } from "@/lib/dto";
import { ROUTES } from "@/lib/routes";
import {
  STAFF_DEAL_FACETS,
  type StaffDealFacet,
  type StaffDealFilters,
  type StaffDealSortKey,
  type StaffDealsPageDto,
  staffDealHref,
} from "@/lib/staff-deals-dto";
import { StatusBadge } from "../deals/parts";
import { Dropdown } from "../ui/dropdown";

const ANY = "any";
const FACET_LABEL: Record<StaffDealFacet, string> = {
  all: "All",
  waiting: "Waiting",
  accepted: "Accepted",
  rejected: "Rejected",
  expired: "Expired",
  won: "Won",
  lost: "Lost",
};

/** The URL for a facet plus filters. Defaults are left out so the address stays short. */
export function staffDealsUrl(facet: StaffDealFacet, f: Partial<StaffDealFilters>): string {
  const p = new URLSearchParams();
  if (facet !== "waiting") p.set("status", facet);
  if (f.partnerId) p.set("partner", f.partnerId);
  if (f.managerId) p.set("manager", f.managerId);
  if (f.product) p.set("product", f.product);
  if (f.region) p.set("region", f.region);
  if (f.overdue) p.set("overdue", "1");
  if (f.conflict) p.set("conflict", "1");
  if (f.q) p.set("q", f.q);
  if (f.sort && !(f.sort === "registered" && f.dir === "desc")) {
    p.set("sort", f.sort);
    p.set("dir", f.dir ?? "desc");
  }
  if (f.page && f.page > 1) p.set("page", String(f.page));
  const qs = p.toString();
  return qs ? `${ROUTES.admin.approvals}?${qs}` : ROUTES.admin.approvals;
}

interface FacetBarProps {
  facet: StaffDealFacet;
  counts: StaffDealsPageDto["counts"];
  filters: StaffDealFilters;
}

export function StaffDealFacetBar({ facet, counts, filters }: FacetBarProps): React.JSX.Element {
  const count = (f: StaffDealFacet): number => (f === "all" ? counts.all : counts[f === "waiting" ? "pending" : f]);
  // Switching tab keeps the filters but starts again at page 1.
  const keep = { ...filters, page: 1 };
  return (
    <nav aria-label="Deal status" className="seg" style={{ alignSelf: "flex-start", flexWrap: "wrap" }}>
      {STAFF_DEAL_FACETS.map((f) => (
        <Link
          key={f}
          href={staffDealsUrl(f, f === "waiting" ? {} : keep)}
          className={`seg-b${facet === f ? " seg-on" : ""}`}
          aria-current={facet === f ? "page" : undefined}
          style={{ height: 28, padding: "0 12px", display: "inline-flex", alignItems: "center", gap: 6 }}
        >
          {FACET_LABEL[f]} <span className="cnt">{count(f)}</span>
        </Link>
      ))}
    </nav>
  );
}

interface SortHeadProps {
  label: string;
  field: StaffDealSortKey;
  filters: StaffDealFilters;
  onSort: (key: StaffDealSortKey) => void;
  className?: string;
}

function SortHead({ label, field, filters, onSort, className }: SortHeadProps): React.JSX.Element {
  const on = filters.sort === field;
  return (
    <th scope="col" className={className} aria-sort={on ? (filters.dir === "asc" ? "ascending" : "descending") : "none"}>
      <button type="button" className="linkbtn" onClick={() => onSort(field)} style={{ font: "inherit", color: "inherit" }}>
        {label}
        {on ? (filters.dir === "asc" ? " ↑" : " ↓") : ""}
      </button>
    </th>
  );
}

interface TableProps {
  facet: StaffDealFacet;
  deals: StaffDealsPageDto;
  filters: StaffDealFilters;
  partners: { id: string; name: string }[];
  managers: ManagerOptionDto[];
}

export function StaffDealsTable({ facet, deals, filters, partners, managers }: TableProps): React.JSX.Element {
  const router = useRouter();
  const { offer } = useRegions();
  const [q, setQ] = useState(filters.q ?? "");
  const go = (change: Partial<StaffDealFilters>): void =>
    router.push(staffDealsUrl(facet, { ...filters, page: 1, ...change }));
  const onSort = (key: StaffDealSortKey): void =>
    go({ sort: key, dir: filters.sort === key && filters.dir === "asc" ? "desc" : "asc" });
  const pages = Math.max(1, Math.ceil(deals.total / deals.pageSize));
  const open = (change: Partial<StaffDealFilters>): void => go(change);

  return (
    <section aria-label="Deals" className="card clip">
      <div className="toolbar">
        <div className="filters">
          <form
            role="search"
            onSubmit={(e) => {
              e.preventDefault();
              open({ q: q.trim() || undefined });
            }}
          >
            <label className="sr" htmlFor="sdq">
              Search partner or customer
            </label>
            <input id="sdq" className="finput" type="search" placeholder="Partner or customer" value={q} onChange={(e) => setQ(e.target.value)} />
          </form>
          <Dropdown
            id="sdp"
            ariaLabel="Partner"
            value={filters.partnerId ?? ANY}
            options={[{ value: ANY, label: "All partners" }, ...partners.map((p) => ({ value: p.id, label: p.name }))]}
            onChange={(v) => open({ partnerId: v === ANY ? undefined : v })}
          />
          <Dropdown
            id="sdm"
            ariaLabel="Partner manager"
            value={filters.managerId ?? ANY}
            options={[{ value: ANY, label: "All managers" }, ...managers.map((m) => ({ value: m.id, label: m.name }))]}
            onChange={(v) => open({ managerId: v === ANY ? undefined : v })}
          />
          <Dropdown
            id="sdr"
            ariaLabel="Product"
            value={filters.product ?? ANY}
            options={[{ value: ANY, label: "All products" }, ...PRODUCTS.map((p) => ({ value: p, label: PRODUCT_LABEL[p] }))]}
            onChange={(v) => open({ product: v === ANY ? undefined : (v as (typeof PRODUCTS)[number]) })}
          />
          <Dropdown
            id="sdg"
            ariaLabel="Region"
            value={filters.region ?? ANY}
            options={[{ value: ANY, label: "All regions" }, ...offer(filters.region).map((r) => ({ value: r.key, label: r.name }))]}
            onChange={(v) => open({ region: v === ANY ? undefined : (v) })}
          />
          <div className="seg" role="group" aria-label="Flags">
            <button type="button" className={`seg-b${filters.overdue ? " seg-on" : ""}`} aria-pressed={filters.overdue} onClick={() => open({ overdue: !filters.overdue })} style={{ height: 24, padding: "0 10px" }}>
              Overdue
            </button>
            <button type="button" className={`seg-b${filters.conflict ? " seg-on" : ""}`} aria-pressed={filters.conflict} onClick={() => open({ conflict: !filters.conflict })} style={{ height: 24, padding: "0 10px" }}>
              Conflict
            </button>
          </div>
        </div>
        <span className="card-meta tnum">
          {deals.total} {deals.total === 1 ? "deal" : "deals"}
        </span>
      </div>
      <ScrollRegion label="Deals">
        <table className="tbl">
          <thead>
            <tr>
              <SortHead label="Customer" field="customer" filters={filters} onSort={onSort} />
              <SortHead label="Partner" field="partner" filters={filters} onSort={onSort} className="hide-sm" />
              <SortHead label="Product" field="product" filters={filters} onSort={onSort} className="hide-sm" />
              <SortHead label="Region" field="region" filters={filters} onSort={onSort} className="hide-sm" />
              <SortHead label="Manager" field="manager" filters={filters} onSort={onSort} className="hide-sm" />
              <SortHead label="Status" field="status" filters={filters} onSort={onSort} />
              <SortHead label="Registered" field="registered" filters={filters} onSort={onSort} className="hide-sm" />
              <SortHead label="Protection ends" field="protection" filters={filters} onSort={onSort} className="hide-sm" />
            </tr>
          </thead>
          <tbody>
            {deals.rows.map((d) => (
              <tr key={d.id}>
                <td>
                  <Link href={staffDealHref(d.id)} className="linkbtn">
                    {d.customer}
                  </Link>
                </td>
                <td className="hide-sm">{d.partnerName}</td>
                <td className="t-sec hide-sm">{PRODUCT_LABEL[d.product]}</td>
                <td className="t-sec hide-sm"><RegionName k={d.region} /></td>
                <td className="t-sec hide-sm">{d.managerName ?? "Not assigned"}</td>
                <td>
                  <StatusBadge status={d.status} />
                  {d.overdue ? <span className="why why-amber">Over 2-day target</span> : null}
                  {d.conflict ? <span className="why why-amber">Conflict</span> : null}
                </td>
                <td className="tnum t-sec hide-sm">{fmtLong(d.registeredOn)}</td>
                <td className="tnum t-sec hide-sm">{d.protectionEnd ? fmtLong(d.protectionEnd) : "Not started"}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {deals.rows.length === 0 ? <div className="empty">No deals match these filters.</div> : null}
      </ScrollRegion>
      {pages > 1 ? (
        <div className="toolbar">
          <span className="card-meta tnum">
            Page {deals.page} of {pages}
          </span>
          <span style={{ display: "inline-flex", gap: 6 }}>
            <button type="button" className="btn btn-s" disabled={deals.page <= 1} onClick={() => go({ page: deals.page - 1 })}>
              Previous
            </button>
            <button type="button" className="btn btn-s" disabled={deals.page >= pages} onClick={() => go({ page: deals.page + 1 })}>
              Next
            </button>
          </span>
        </div>
      ) : null}
    </section>
  );
}
