"use client";

import Link from "next/link";
import { useState } from "react";
import { Avatar } from "@/components/ui/badge";
import { initialsOf, type Partner } from "@/data/partners";
import { ROUTES } from "@/lib/routes";
import { DealStatusBadge, ProductMark, StatusBadge } from "./badges";

interface PartnerDetailProps {
  partner: Partner;
  onChangeManager: () => void;
  onChangeCategory: () => void;
  onResendInvites: () => void;
  onSuspend: () => void;
  onRestore: () => void;
}

const SMALL_BTN: React.CSSProperties = { height: 26, padding: "0 8px", fontSize: 12 };

export function PartnerDetail({
  partner: p,
  onChangeManager,
  onChangeCategory,
  onResendInvites,
  onSuspend,
  onRestore,
}: PartnerDetailProps): React.JSX.Element {
  const [confirming, setConfirming] = useState(false);
  const suspended = p.status === "Suspended";

  return (
    <aside
      aria-label="Selected partner"
      style={{
        flex: "1 1 100%",
        minWidth: 0,
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
        gap: 12,
        alignItems: "start",
      }}
    >
      <section className="card clip">
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: 12 }}>
          <span className="av av-1" style={{ width: 36, height: 36, borderRadius: 9, fontSize: 13 }}>
            {initialsOf(p.name)}
          </span>
          <span className="li-t">
            <span style={{ fontSize: 14, fontWeight: 700 }}>{p.name}</span>
            <span className="li-s">{p.domain}</span>
          </span>
          <StatusBadge status={p.status} />
        </div>
        <hr className="hr" />
        <dl className="dl card-b" style={{ gridTemplateColumns: "110px minmax(0, 1fr)" }}>
          <dt>Category</dt>
          <dd>{p.category}</dd>
          <dt>Region</dt>
          <dd>{p.region}</dd>
          <dt>Partner since</dt>
          <dd>{p.since}</dd>
          <dt>Agreement</dt>
          <dd>{p.agreement}</dd>
          <dt>Partner manager</dt>
          <dd style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {p.manager}
            <button type="button" className="btn btn-t" onClick={onChangeManager} style={{ height: 22, padding: "0 6px" }}>
              Change
            </button>
          </dd>
          <dt>Partner admin</dt>
          <dd>{p.admin}</dd>
          <dt>HubSpot company</dt>
          <dd className="tnum">{p.hs}</dd>
        </dl>
        <div className="kpis" style={{ borderTop: "1px solid #F0EFF4", gridTemplateColumns: "repeat(4, minmax(0, 1fr))" }}>
          {(
            [
              ["Users", p.users],
              ["Pending", p.pending],
              ["Protected", p.protected],
              ["Won", p.won],
            ] as const
          ).map(([label, value]) => (
            <div key={label} className="kpi" style={{ padding: "8px 10px" }}>
              <span className="kpi-l">{label}</span>
              <span className="kpi-v" style={{ fontSize: 16 }}>
                {value}
              </span>
            </div>
          ))}
        </div>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 6,
            padding: "10px 12px",
            borderTop: "1px solid #F0EFF4",
            background: "#FCFCFD",
          }}
        >
          <button type="button" className="btn btn-s" style={SMALL_BTN} onClick={onChangeCategory}>
            Change category
          </button>
          <button type="button" className="btn btn-s" style={SMALL_BTN} onClick={onResendInvites}>
            Resend invites
          </button>
          {!suspended && !confirming ? (
            <button
              type="button"
              className="btn btn-d"
              style={{ ...SMALL_BTN, marginLeft: "auto" }}
              onClick={() => setConfirming(true)}
            >
              Suspend
            </button>
          ) : null}
          {!suspended && confirming ? (
            <div style={{ flexBasis: "100%", display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", paddingTop: 4 }}>
              <span className="confirm" style={{ flex: "1 1 100%" }}>
                Suspend {p.name}? Its {p.users} {p.users === 1 ? "user loses" : "users lose"} access at once. Deals
                stay in HubSpot.
              </span>
              <button
                type="button"
                className="btn btn-dd"
                style={SMALL_BTN}
                onClick={() => {
                  setConfirming(false);
                  onSuspend();
                }}
              >
                Suspend access
              </button>
              <button type="button" className="btn btn-g" style={{ ...SMALL_BTN, padding: "0 6px" }} onClick={() => setConfirming(false)}>
                Cancel
              </button>
            </div>
          ) : null}
          {suspended ? (
            <button type="button" className="btn btn-s" style={{ ...SMALL_BTN, marginLeft: "auto" }} onClick={onRestore}>
              Restore access
            </button>
          ) : null}
        </div>
      </section>

      <section aria-labelledby="sel-people" className="card clip">
        <div className="card-h">
          <h2 id="sel-people" className="card-t">
            People
          </h2>
          <span className="card-meta tnum">{p.users}</span>
        </div>
        {p.people.map((u) => (
          <div key={u.name} className="li">
            <Avatar initials={initialsOf(u.name)} round />
            <span className="li-t">
              <span className="li-n">{u.name}</span>
              <span className="li-s">{u.role}</span>
            </span>
            <span className="li-s">{u.last}</span>
          </div>
        ))}
      </section>

      <section aria-labelledby="sel-deals" className="card clip">
        <div className="card-h">
          <h2 id="sel-deals" className="card-t">
            Recent deals
          </h2>
          <Link href={ROUTES.admin.approvals} className="link-sm">
            Queue
          </Link>
        </div>
        {p.deals.map((d) => (
          <div key={`${d.customer}-${d.product}-${d.when}`} className="li">
            <ProductMark product={d.product} />
            <span className="li-t">
              <span className="li-n">{d.customer}</span>
              <span className="li-s">
                {d.product}, {d.when}
              </span>
            </span>
            <DealStatusBadge status={d.status} />
          </div>
        ))}
        {p.deals.length === 0 ? (
          <p style={{ margin: 0, padding: 12, fontSize: 12.5, color: "#6B687D" }}>No deals registered yet.</p>
        ) : null}
      </section>
    </aside>
  );
}
