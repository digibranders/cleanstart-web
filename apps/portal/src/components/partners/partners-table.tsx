"use client";

import { useState } from "react";
import { Avatar } from "@/components/ui/badge";
import { Dropdown } from "@/components/ui/dropdown";
import { PARTNER_REGION_LABEL, type PartnerCategory } from "@/lib/domain";
import type { PartnerListRow } from "@/lib/dto";
import { initialsOf, lastSeenLabel } from "@/lib/people";
import { PartnerCategoryBadge, PartnerStatusBadge } from "./badges";
import { Seg } from "./seg";
import { ScrollRegion } from "@/components/ui/scroll-region";

const PAGE_SIZE = 50;

export const CATEGORY_FILTERS = ["All", "Distributors", "Channel"] as const;
export type CategoryFilter = (typeof CATEGORY_FILTERS)[number];
export const REGION_FILTERS = ["All regions", "India", "Middle East"] as const;
export const STATUS_FILTERS = ["Any status", "Active", "Onboarding", "Inactive", "Suspended"] as const;

export const SORT_OPTIONS = [
  { value: "name", label: "Sort: Name" },
  { value: "active", label: "Sort: Last active" },
  { value: "pending", label: "Sort: Pending" },
  { value: "won", label: "Sort: Won YTD" },
] as const;
export type PartnerSort = (typeof SORT_OPTIONS)[number]["value"];

export const CATEGORY_FOR_FILTER: Record<CategoryFilter, PartnerCategory | null> = {
  All: null,
  Distributors: "distributor",
  Channel: "channel",
};

interface PartnersTableProps {
  partners: readonly PartnerListRow[];
  total: number;
  selectedId: string;
  today: string;
  category: CategoryFilter;
  region: string;
  status: string;
  query: string;
  sort: PartnerSort;
  onQuery: (value: string) => void;
  onSort: (value: PartnerSort) => void;
  onCategory: (value: CategoryFilter) => void;
  onRegion: (value: string) => void;
  onStatus: (value: string) => void;
  onSelect: (id: string) => void;
}

export function PartnersTable({
  partners,
  total,
  selectedId,
  today,
  category,
  region,
  status,
  query,
  sort,
  onQuery,
  onSort,
  onCategory,
  onRegion,
  onStatus,
  onSelect,
}: PartnersTableProps): React.JSX.Element {
  const [limit, setLimit] = useState(PAGE_SIZE);
  const visible = partners.slice(0, limit);
  return (
    <>
      <div className="toolbar">
        <div className="filters">
          <label className="sr" htmlFor="partner-q">
            Search partners
          </label>
          <input
            id="partner-q"
            className="finput"
            type="search"
            placeholder="Search name or domain"
            value={query}
            onChange={(e) => onQuery(e.target.value)}
          />
          <Seg options={CATEGORY_FILTERS} value={category} onChange={onCategory} ariaLabel="Category" compact />
          <Dropdown value={region} options={REGION_FILTERS} onChange={onRegion} ariaLabel="Region" />
          <Dropdown value={status} options={STATUS_FILTERS} onChange={onStatus} ariaLabel="Status" />
          <Dropdown
            value={sort}
            options={SORT_OPTIONS}
            onChange={(v) => {
              const next = SORT_OPTIONS.find((o) => o.value === v);
              if (next) onSort(next.value);
            }}
            ariaLabel="Sort"
          />
        </div>
        <span className="card-meta tnum">
          Showing {visible.length} of {total}
        </span>
      </div>
      <ScrollRegion label="Partners">
        <table className="tbl">
          <thead>
            <tr>
              <th scope="col">Partner</th>
              <th scope="col" className="hide-sm">
                Category
              </th>
              <th scope="col" className="hide-sm">
                Region
              </th>
              <th scope="col">Status</th>
              <th scope="col" className="r hide-sm">
                Pending
              </th>
              <th scope="col" className="r hide-sm">
                Protected
              </th>
              <th scope="col" className="r hide-sm">
                Won YTD
              </th>
              <th scope="col" className="r hide-sm">
                Last active
              </th>
            </tr>
          </thead>
          <tbody>
            {visible.map((p) => (
              <tr key={p.id} style={p.id === selectedId ? { background: "#F7F5FE" } : undefined}>
                <td>
                  <button
                    type="button"
                    className="cust"
                    onClick={() => onSelect(p.id)}
                    aria-pressed={p.id === selectedId}
                    style={{ background: "none", border: 0, padding: 0, font: "inherit", cursor: "pointer" }}
                  >
                    <Avatar initials={initialsOf(p.name)} />
                    <span className="li-t" style={{ textAlign: "left" }}>
                      <span className="li-n" style={{ fontSize: 13 }}>
                        {p.name}
                      </span>
                      <span className="li-s">{p.domain}</span>
                    </span>
                  </button>
                </td>
                <td className="hide-sm">
                  <PartnerCategoryBadge category={p.category} />
                </td>
                <td className="t-sec hide-sm">{PARTNER_REGION_LABEL[p.region]}</td>
                <td>
                  <PartnerStatusBadge status={p.status} />
                </td>
                <td className="tnum r hide-sm">{p.pending}</td>
                <td className="tnum r hide-sm">{p.protectedCount}</td>
                <td className="tnum r hide-sm">{p.won}</td>
                <td className="tnum r t-sec hide-sm">{lastSeenLabel(p.lastActiveAt, today)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {partners.length === 0 ? <div className="empty">No partners match these filters.</div> : null}
      </ScrollRegion>
      {partners.length > visible.length ? (
        <div className="toolbar" style={{ justifyContent: "center" }}>
          <button type="button" className="btn btn-s" onClick={() => setLimit(limit + PAGE_SIZE)}>
            Show {Math.min(PAGE_SIZE, partners.length - visible.length)} more
          </button>
        </div>
      ) : null}
    </>
  );
}
