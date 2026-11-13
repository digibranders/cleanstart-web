"use client";

import Link from "next/link";
import { useState } from "react";
import { PARTNER_REGION_LABEL, PRODUCT_LABEL, REGISTRATION_STATUS_LABEL } from "@/lib/domain";
import type { RegistrationListItem } from "@/lib/dto";
import { ROUTES } from "@/lib/routes";
import { downloadCsv } from "../deals/csv";
import { fmtShort } from "../deals/dates";
import { CHIP_PRODUCT, protectionView } from "../deals/derive";
import { ManagerMessageDrawer } from "../deals/ManagerMessageDrawer";
import { CustomerMark, PLUS_PATH, ProtectionCell, StatusBadge } from "../deals/parts";
import { RejectedDealDrawer } from "../deals/RejectedDealDrawer";
import type { ManagerContact } from "../deals/types";
import { Icon } from "../icon";
import { ProductChip } from "../ui/badge";
import { Dropdown } from "../ui/dropdown";
import { useToast } from "../ui/toast";

const TABS = ["All", "Pending", "Accepted", "Rejected", "Expired", "Won", "Lost"] as const;
type Tab = (typeof TABS)[number];

const ALL_PRODUCTS = "All products";
const ALL_REGIONS = "All regions";
const ANY_MANAGER = "Any account manager";
const PRODUCT_OPTIONS = [ALL_PRODUCTS, "CleanStart Images", "Clean Libraries", "CleanSight"];
const REGION_OPTIONS = [ALL_REGIONS, "India", "Middle East"];
function protectionText(deal: RegistrationListItem, today: string): string {
  const view = protectionView(deal, "deals", today);
  return `${view.until} ${view.left}`.trim();
}

interface DealsProps {
  deals: RegistrationListItem[];
  today: string;
  partnerManager: ManagerContact | null;
  senderEmail: string;
}

export function Deals({ deals, today, partnerManager, senderEmail }: DealsProps): React.JSX.Element {
  const toast = useToast();
  const managerOptions = [ANY_MANAGER, ...new Set(deals.flatMap((d) => (d.managerName ? [d.managerName] : [])))];

  const [tab, setTab] = useState<Tab>("All");
  const [q, setQ] = useState("");
  const [product, setProduct] = useState(ALL_PRODUCTS);
  const [region, setRegion] = useState(ALL_REGIONS);
  const [manager, setManager] = useState(ANY_MANAGER);
  const [rejectedId, setRejectedId] = useState<string | null>(null);
  const [messageSubject, setMessageSubject] = useState<string | null>(null);

  const needle = q.trim().toLowerCase();
  const rows = deals.filter(
    (d) =>
      (tab === "All" || REGISTRATION_STATUS_LABEL[d.status] === tab) &&
      (!needle || d.customer.toLowerCase().includes(needle)) &&
      (product === ALL_PRODUCTS || PRODUCT_LABEL[d.product] === product) &&
      (region === ALL_REGIONS || PARTNER_REGION_LABEL[d.region] === region) &&
      (manager === ANY_MANAGER || d.managerName === manager),
  );
  const filtered = tab !== "All" || Boolean(needle) || product !== ALL_PRODUCTS || region !== ALL_REGIONS || manager !== ANY_MANAGER;
  const countFor = (label: Tab): number =>
    label === "All" ? deals.length : deals.filter((d) => REGISTRATION_STATUS_LABEL[d.status] === label).length;
  const rejected = deals.find((d) => d.id === rejectedId && d.status === "rejected");

  const clear = (): void => {
    setTab("All");
    setQ("");
    setProduct(ALL_PRODUCTS);
    setRegion(ALL_REGIONS);
    setManager(ANY_MANAGER);
  };

  const exportCsv = (): void => {
    downloadCsv("deals.csv", [
      ["Customer", "Product", "Status", "Stage", "Account manager", "Registered by", "Registered", "Protection"],
      ...rows.map((d) => [
        d.customer,
        PRODUCT_LABEL[d.product],
        REGISTRATION_STATUS_LABEL[d.status],
        d.stage,
        d.managerName ?? "",
        d.registeredByName,
        fmtShort(d.registeredOn),
        protectionText(d, today),
      ]),
    ]);
    toast(`Exported ${rows.length} deals to CSV`);
  };

  return (
    <div className="wrap">
      <div className="head">
        <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
          <h1 className="h1">Deals</h1>
          <span className="h1-sub">Stages update from CleanStart's CRM.</span>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <button type="button" className="btn btn-s" onClick={exportCsv}>
            <Icon name="dl" />
            Export CSV
          </button>
          <Link href={ROUTES.partner.newDeal} className="btn btn-p">
            <Icon d={PLUS_PATH} />
            Register deal
          </Link>
        </div>
      </div>

      <section aria-label="Deals" className="card clip">
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
              ariaLabel="Account manager"
              value={manager}
              options={managerOptions}
              onChange={setManager}
            />
          </div>
          <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {filtered ? (
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
        <div style={{ overflowX: "auto" }}>
          <table className="tbl">
            <thead>
              <tr>
                <th scope="col">Customer</th>
                <th scope="col">Product</th>
                <th scope="col">Status</th>
                <th scope="col">Stage</th>
                <th scope="col">Account manager</th>
                <th scope="col">Registered by</th>
                <th scope="col" className="r">
                  Registered
                </th>
                <th scope="col" className="r">
                  Protection
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((d) => (
                <tr key={d.id}>
                  <td>
                    {d.status === "rejected" ? (
                      <button type="button" className="cust linkbtn" onClick={() => setRejectedId(d.id)}>
                        <CustomerMark name={d.customer} />
                        {d.customer}
                      </button>
                    ) : (
                      <Link href={ROUTES.partner.deal(d.id)} className="cust">
                        <CustomerMark name={d.customer} />
                        {d.customer}
                      </Link>
                    )}
                  </td>
                  <td>
                    <ProductChip product={CHIP_PRODUCT[d.product]} />
                  </td>
                  <td>
                    <StatusBadge status={d.status} />
                  </td>
                  <td className="t-sec">{d.stage}</td>
                  <td className="t-sec">{d.managerName}</td>
                  <td className="t-sec">{d.registeredByName}</td>
                  <td className="tnum r t-sec">{fmtShort(d.registeredOn)}</td>
                  <ProtectionCell deal={d} mode="deals" today={today} />
                </tr>
              ))}
            </tbody>
          </table>
          {rows.length === 0 ? <div className="empty">No deals match these filters.</div> : null}
        </div>
      </section>

      {rejected ? (
        <RejectedDealDrawer
          key={rejected.id}
          deal={rejected}
          onClose={() => setRejectedId(null)}
          onMessage={() => {
            setRejectedId(null);
            setMessageSubject(`${rejected.customer}, ${PRODUCT_LABEL[rejected.product]}`);
          }}
        />
      ) : null}
      {messageSubject !== null && partnerManager ? (
        <ManagerMessageDrawer
          key={messageSubject}
          manager={partnerManager}
          senderEmail={senderEmail}
          initialSubject={messageSubject}
          onClose={() => setMessageSubject(null)}
        />
      ) : null}
    </div>
  );
}
