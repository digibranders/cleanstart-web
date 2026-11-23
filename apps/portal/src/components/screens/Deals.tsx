"use client";

import Link from "next/link";
import { useState } from "react";
import { PARTNER_REGION_LABEL, PRODUCT_LABEL, REGISTRATION_STATUS_LABEL } from "@/lib/domain";
import type { RegistrationListItem } from "@/lib/dto";
import { ROUTES } from "@/lib/routes";
import { downloadCsv } from "../deals/csv";
import { fmtLong, fmtShort } from "../deals/dates";
import { CHIP_PRODUCT, protectionView } from "../deals/derive";
import { CustomerMark, PLUS_PATH, ProtectionCell, StatusBadge } from "../deals/parts";
import { type DealSortKey, type SortDir, closeDate, sortDeals } from "../deals/sort";
import { Icon } from "../icon";
import { ProductChip } from "../ui/badge";
import { Dropdown } from "../ui/dropdown";
import { useToast } from "../ui/toast";
import { ScrollRegion } from "@/components/ui/scroll-region";

const TABS = ["All", "Pending", "Accepted", "Rejected", "Expired", "Won", "Lost"] as const;
type Tab = (typeof TABS)[number];

const ALL_PRODUCTS = "All products";
const ALL_REGIONS = "All regions";
const ANY_MANAGER = "Any partner manager";
const PRODUCT_OPTIONS = [ALL_PRODUCTS, "CleanStart Images", "Clean Libraries", "CleanSight"];
const REGION_OPTIONS = [ALL_REGIONS, "India", "Middle East"];
function protectionText(deal: RegistrationListItem, today: string): string {
  const view = protectionView(deal, "deals", today);
  return `${view.until} ${view.left}`.trim();
}

interface DealsProps {
  deals: RegistrationListItem[];
  today: string;
  /** Partner sales see only the deals they registered. */
  ownDealsOnly: boolean;
}

const closeText = (deal: RegistrationListItem): string =>
  closeDate(deal) ? fmtLong(deal.expectedClose ?? "") : (deal.expectedClose ?? "");

interface SortHeadProps {
  label: string;
  field: DealSortKey;
  sort: { key: DealSortKey; dir: SortDir };
  onSort: (key: DealSortKey) => void;
  className?: string;
}

function SortHead({ label, field, sort, onSort, className }: SortHeadProps): React.JSX.Element {
  const on = sort.key === field;
  return (
    <th scope="col" className={className} aria-sort={on ? (sort.dir === "asc" ? "ascending" : "descending") : "none"}>
      <button type="button" className="linkbtn" onClick={() => onSort(field)} style={{ font: "inherit", color: "inherit" }}>
        {label}
        {on ? (sort.dir === "asc" ? " \u2191" : " \u2193") : ""}
      </button>
    </th>
  );
}

export function Deals({ deals, today, ownDealsOnly }: DealsProps): React.JSX.Element {
  const toast = useToast();
  const managerOptions = [ANY_MANAGER, ...new Set(deals.flatMap((d) => (d.managerName ? [d.managerName] : [])))];

  const [tab, setTab] = useState<Tab>("All");
  const [q, setQ] = useState("");
  const [product, setProduct] = useState(ALL_PRODUCTS);
  const [region, setRegion] = useState(ALL_REGIONS);
  const [manager, setManager] = useState(ANY_MANAGER);
  const [sort, setSort] = useState<{ key: DealSortKey; dir: SortDir }>({ key: "registered", dir: "desc" });
  const onSort = (key: DealSortKey): void =>
    setSort((prev) => ({ key, dir: prev.key === key && prev.dir === "asc" ? "desc" : "asc" }));

  const needle = q.trim().toLowerCase();
  const matching = deals.filter(
    (d) =>
      (tab === "All" || REGISTRATION_STATUS_LABEL[d.status] === tab) &&
      (!needle || d.customer.toLowerCase().includes(needle)) &&
      (product === ALL_PRODUCTS || PRODUCT_LABEL[d.product] === product) &&
      (region === ALL_REGIONS || PARTNER_REGION_LABEL[d.region] === region) &&
      (manager === ANY_MANAGER || d.managerName === manager),
  );
  const rows = sortDeals(matching, sort.key, sort.dir);
  const filtered = tab !== "All" || Boolean(needle) || product !== ALL_PRODUCTS || region !== ALL_REGIONS || manager !== ANY_MANAGER;
  const countFor = (label: Tab): number =>
    label === "All" ? deals.length : deals.filter((d) => REGISTRATION_STATUS_LABEL[d.status] === label).length;

  const clear = (): void => {
    setTab("All");
    setQ("");
    setProduct(ALL_PRODUCTS);
    setRegion(ALL_REGIONS);
    setManager(ANY_MANAGER);
  };

  const exportCsv = (): void => {
    downloadCsv("deals.csv", [
      [
        "Customer",
        "Website",
        "Product",
        "Region",
        "Status",
        "Stage",
        "Partner manager",
        "Registered by",
        "Registered",
        "Expected close",
        "Protection",
        "CRM reference",
        "Rejection reason",
      ],
      ...rows.map((d) => [
        d.customer,
        d.website ?? "",
        PRODUCT_LABEL[d.product],
        PARTNER_REGION_LABEL[d.region],
        REGISTRATION_STATUS_LABEL[d.status],
        d.stage,
        d.managerName ?? "",
        d.registeredByName,
        d.registeredOn,
        closeText(d),
        protectionText(d, today),
        d.crmRef ?? "",
        d.rejectionReason ?? "",
      ]),
    ]);
    toast(`Exported ${rows.length} deals to CSV`);
  };

  return (
    <div className="wrap">
      <div className="head">
        <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
          <h1 className="h1">Deals</h1>
          <span className="h1-sub">
            Stages update from CleanStart's CRM.
            {ownDealsOnly ? " You see the deals you registered; your partner admin sees all of them." : ""}
          </span>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {deals.length > 0 ? (
            <button type="button" className="btn btn-s" onClick={exportCsv}>
              <Icon name="dl" />
              Export CSV
            </button>
          ) : null}
          <Link href={ROUTES.partner.newDeal} className="btn btn-p">
            <Icon d={PLUS_PATH} />
            Register deal
          </Link>
        </div>
      </div>

      <section aria-label="Deals" className="card clip">
        {deals.length === 0 ? (
          <div className="empty">
            <p style={{ margin: 0 }}>You have not registered a deal yet.</p>
            <div style={{ marginTop: 12 }}>
              <Link href={ROUTES.partner.newDeal} className="btn btn-p">
                <Icon d={PLUS_PATH} />
                Register deal
              </Link>
            </div>
          </div>
        ) : (
          <>
            <div className="tabs" role="group" aria-label="Filter by status" style={{ padding: "0 8px" }}>
              {TABS.map((label) => (
                <button
                  type="button"
                  key={label}
                  className={`tab${tab === label ? " tab-on" : ""}`}
                  aria-pressed={tab === label}
                  onClick={() => setTab(label)}
                >
                  {label}
                  <span className="cnt">{countFor(label)}</span>
                </button>
              ))}
            </div>
            <div className="toolbar">
              <div className="filters">
                <label className="sr" htmlFor="q">
                  Search customers
                </label>
                <input
                  id="q"
                  className="finput"
                  type="search"
                  placeholder="Filter by customer"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                />
                <Dropdown id="fp" ariaLabel="Product" value={product} options={PRODUCT_OPTIONS} onChange={setProduct} />
                <Dropdown id="fr" ariaLabel="Region" value={region} options={REGION_OPTIONS} onChange={setRegion} />
                <Dropdown
                  id="fm"
                  ariaLabel="Partner manager"
                  value={manager}
                  options={managerOptions}
                  onChange={setManager}
                />
              </div>
              <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
                {filtered && rows.length > 0 ? (
                  <button
                    type="button"
                    className="btn btn-g"
                    onClick={clear}
                    style={{ height: 24, padding: "0 6px", fontSize: 12 }}
                  >
                    Clear filters
                  </button>
                ) : null}
                <span className="card-meta tnum">
                  {rows.length} of {deals.length}
                </span>
              </span>
            </div>
            <ScrollRegion label="Registrations">
              <table className="tbl">
                <thead>
                  <tr>
                    <SortHead label="Customer" field="customer" sort={sort} onSort={onSort} />
                    <th scope="col" className="hide-sm">
                      Product
                    </th>
                    <SortHead label="Region" field="region" sort={sort} onSort={onSort} className="hide-sm" />
                    <SortHead label="Status" field="status" sort={sort} onSort={onSort} />
                    <th scope="col" className="hide-sm">
                      Stage
                    </th>
                    <th scope="col" className="hide-sm">
                      Partner manager
                    </th>
                    <th scope="col" className="hide-sm">
                      Registered by
                    </th>
                    <SortHead label="Registered" field="registered" sort={sort} onSort={onSort} className="r hide-sm" />
                    <SortHead label="Expected close" field="close" sort={sort} onSort={onSort} className="r hide-sm" />
                    <SortHead label="Protection" field="protection" sort={sort} onSort={onSort} className="r" />
                  </tr>
                </thead>
                <tbody>
                  {rows.map((d) => (
                    <tr key={d.id}>
                      <td style={{ whiteSpace: "normal" }}>
                        <Link href={ROUTES.partner.deal(d.id)} className="cust">
                          <CustomerMark name={d.customer} />
                          {d.customer}
                        </Link>
                      </td>
                      <td className="hide-sm">
                        <ProductChip product={CHIP_PRODUCT[d.product]} />
                      </td>
                      <td className="t-sec hide-sm">{PARTNER_REGION_LABEL[d.region]}</td>
                      <td>
                        <StatusBadge status={d.status} />
                      </td>
                      <td className="t-sec hide-sm">{d.stage}</td>
                      <td className="t-sec hide-sm">{d.managerName}</td>
                      <td className="t-sec hide-sm">{d.registeredByName}</td>
                      <td className="tnum r t-sec hide-sm">{fmtShort(d.registeredOn)}</td>
                      <td className="tnum r t-sec hide-sm">{closeText(d) || "None"}</td>
                      <ProtectionCell deal={d} mode="deals" today={today} />
                    </tr>
                  ))}
                </tbody>
              </table>
              {rows.length === 0 ? (
                <div className="empty">
                  No deals match these filters.{" "}
                  <button type="button" className="btn btn-g" onClick={clear} style={{ height: 24, padding: "0 6px", fontSize: 12 }}>
                    Clear filters
                  </button>
                </div>
              ) : null}
            </ScrollRegion>
          </>
        )}
      </section>

    </div>
  );
}
