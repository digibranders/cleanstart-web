"use client";

import { Avatar } from "@/components/ui/badge";
import { Dropdown } from "@/components/ui/dropdown";
import type { Partner } from "@/data/partners";
import { initialsOf } from "@/data/partners";
import { CategoryBadge, StatusBadge } from "./badges";
import { Seg } from "./seg";

export const CATEGORY_FILTERS = ["All", "Distributors", "Channel", "SIs"] as const;
export type CategoryFilter = (typeof CATEGORY_FILTERS)[number];
export const REGION_FILTERS = ["All regions", "India", "Middle East"] as const;
export const STATUS_FILTERS = ["Any status", "Active", "Onboarding", "Inactive", "Suspended"] as const;

export const CATEGORY_FOR_FILTER: Record<CategoryFilter, Partner["category"] | null> = {
  All: null,
  Distributors: "Distributor",
  Channel: "Channel partner",
  SIs: "System integrator",
};

interface PartnersTableProps {
  partners: readonly Partner[];
  total: number;
  selectedId: string;
  category: CategoryFilter;
  region: string;
  status: string;
  onCategory: (value: CategoryFilter) => void;
  onRegion: (value: string) => void;
  onStatus: (value: string) => void;
  onSelect: (id: string) => void;
}

export function PartnersTable({
  partners,
  total,
  selectedId,
  category,
  region,
  status,
  onCategory,
  onRegion,
  onStatus,
  onSelect,
}: PartnersTableProps): React.JSX.Element {
  return (
    <>
      <div className="toolbar">
        <div className="filters">
          <Seg options={CATEGORY_FILTERS} value={category} onChange={onCategory} ariaLabel="Category" compact />
          <Dropdown value={region} options={REGION_FILTERS} onChange={onRegion} ariaLabel="Region" />
          <Dropdown value={status} options={STATUS_FILTERS} onChange={onStatus} ariaLabel="Status" />
        </div>
        <span className="card-meta tnum">
          Showing {partners.length} of {total}
        </span>
      </div>
      <div style={{ overflowX: "auto" }} data-tour="partners-table">
        <table className="tbl">
          <thead>
            <tr>
              <th scope="col">Partner</th>
              <th scope="col">Category</th>
              <th scope="col">Region</th>
              <th scope="col">Status</th>
              <th scope="col" className="r">
                Pending
              </th>
              <th scope="col" className="r">
                Protected
              </th>
              <th scope="col" className="r">
                Won YTD
              </th>
              <th scope="col" className="r">
                Last active
              </th>
            </tr>
          </thead>
          <tbody>
            {partners.map((p) => (
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
                <td>
                  <CategoryBadge category={p.category} />
                </td>
                <td className="t-sec">{p.region}</td>
                <td>
                  <StatusBadge status={p.status} />
                </td>
                <td className="tnum r">{p.pending}</td>
                <td className="tnum r">{p.protected}</td>
                <td className="tnum r">{p.won}</td>
                <td className="tnum r t-sec">{p.last}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {partners.length === 0 ? <div className="empty">No partners match these filters.</div> : null}
      </div>
    </>
  );
}
