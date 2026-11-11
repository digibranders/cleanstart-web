"use client";

import Link from "next/link";
import { useMemo } from "react";
import { type Deal, PRODUCTS, useDeals } from "@/data/deals";
import { ROUTES } from "@/lib/routes";
import { KESTREL } from "../shell/personas";
import { Icon } from "../icon";
import type { IconName } from "../icon-paths";
import { daysLeft, fmtShort, plural, TODAY } from "../deals/dates";
import { PRODUCT_SHORT, waitDays } from "../deals/derive";
import { CustomerMark, PLUS_PATH, ProtectionCell, StatusBadge } from "../deals/parts";
import { Badge, ProductChip } from "../ui/badge";

interface Kpi {
  label: string;
  value: string;
  foot: string;
  cls: string;
}

interface Attention {
  key: string;
  title: string;
  meta: string;
  icon: IconName;
  tone: string;
  href: string;
}

const NEW_DOCS: { title: string; meta: string; icon: IconName }[] = [
  { title: "CleanSight product walkthrough", meta: "Video, 14 min, 4 Nov", icon: "play" },
  { title: "Clean Libraries solution sheet", meta: "Solution sheet, 30 Oct", icon: "file" },
  { title: "Partner sales playbook 2026", meta: "Enablement guide, 27 Oct", icon: "file" },
];

function buildKpis(mine: Deal[]): Kpi[] {
  const waiting = mine.filter((d) => d.status === "Pending");
  const oldest = Math.max(0, ...waiting.map(waitDays));
  const protectedDeals = mine.filter((d) => d.status === "Accepted");
  const byProduct = PRODUCTS.map((p) => ({ p, n: protectedDeals.filter((d) => d.product === p).length }))
    .filter((x) => x.n > 0)
    .sort((a, b) => b.n - a.n)
    .map((x) => `${x.n} ${PRODUCT_SHORT[x.p]}`);
  const expiring = protectedDeals.filter((d) => d.protectionEnd && daysLeft(d.protectionEnd) <= 14);
  const year = TODAY.slice(0, 4);
  const won = mine
    .filter((d) => d.status === "Won" && d.closedOn?.startsWith(year))
    .sort((a, b) => (b.closedOn ?? "").localeCompare(a.closedOn ?? ""));
  return [
    {
      label: "Waiting",
      value: String(waiting.length),
      foot: waiting.length ? `Oldest ${plural(oldest, "day")}` : "Nothing waiting",
      cls: "",
    },
    {
      label: "Protected",
      value: String(protectedDeals.length),
      foot: byProduct.length ? byProduct.join(", ") : "None yet",
      cls: "",
    },
    {
      label: "Expiring in 14 days",
      value: String(expiring.length),
      foot: expiring.length ? expiring.map((d) => d.customer).join(", ") : "None",
      cls: expiring.length ? "t-amber" : "",
    },
    {
      label: "Won this year",
      value: String(won.length),
      foot: won.length ? won.map((d) => d.customer).join(", ") : "None yet",
      cls: "",
    },
  ];
}

function buildAttention(mine: Deal[]): Attention[] {
  const expiring = mine
    .filter((d) => d.status === "Accepted" && d.protectionEnd && daysLeft(d.protectionEnd) <= 14)
    .map<Attention>((d) => ({
      key: `exp-${d.id}`,
      title: `${d.customer} expires in ${plural(daysLeft(d.protectionEnd ?? TODAY), "day")}`,
      meta: `${PRODUCT_SHORT[d.product]}, protected until ${fmtShort(d.protectionEnd ?? TODAY)}`,
      icon: "hg",
      tone: "tone-amber",
      href: ROUTES.partner.deal(d.id),
    }));
  const late = mine
    .filter((d) => d.status === "Pending" && waitDays(d) > 2)
    .map<Attention>((d) => ({
      key: `late-${d.id}`,
      title: `${d.customer} waiting ${plural(waitDays(d), "day")}`,
      meta: `${d.product}, sent ${fmtShort(d.registered)}`,
      icon: "clk",
      tone: "",
      href: ROUTES.partner.deals,
    }));
  const declined = mine
    .filter((d) => d.status === "Rejected" && d.decidedLive)
    .map<Attention>((d) => ({
      key: `rej-${d.id}`,
      title: `${d.customer} was not accepted`,
      meta: `${d.product}, see the reason and resubmit`,
      icon: "warn",
      tone: "tone-red",
      href: ROUTES.partner.deals,
    }));
  return [
    {
      key: "team-login",
      title: "Rohit Desai asked for a login",
      meta: "Sales, asked today",
      icon: "team",
      tone: "tone-violet",
      href: ROUTES.partner.team,
    },
    ...expiring,
    ...late,
    ...declined,
    {
      key: "team-invite",
      title: "Vikram Sethi has not accepted invite",
      meta: "Sales, invited 5 Nov",
      icon: "team",
      tone: "",
      href: ROUTES.partner.team,
    },
  ];
}

export function PartnerOverview(): React.JSX.Element {
  const deals = useDeals();
  const mine = useMemo(() => deals.filter((d) => d.partner === KESTREL.org), [deals]);
  const kpis = useMemo(() => buildKpis(mine), [mine]);
  const attention = useMemo(() => buildAttention(mine), [mine]);
  const recent = useMemo(
    () =>
      mine
        .filter((d) => d.status === "Pending" || d.status === "Accepted" || d.status === "Won")
        .sort((a, b) => b.registered.localeCompare(a.registered))
        .slice(0, 7),
    [mine],
  );

  return (
    <div className="wrap">
      <div className="head">
        <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
          <h1 className="h1">Overview</h1>
          <span className="h1-sub">Updated 6 Nov 2026, 14:20</span>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <Link href={ROUTES.partner.newDeal} className="btn btn-p">
            <Icon d={PLUS_PATH} />
            Register deal
          </Link>
        </div>
      </div>

      <section aria-label="Key figures" className="card kpis" data-tour="overview-kpis">
        {kpis.map((k) => (
          <div className="kpi" key={k.label}>
            <span className="kpi-l">{k.label}</span>
            <span className={`kpi-v ${k.cls}`}>{k.value}</span>
            <span className="kpi-f">{k.foot}</span>
          </div>
        ))}
      </section>

      <div className="row">
        <div style={{ flex: "1 1 620px", minWidth: 0, display: "flex", flexDirection: "column", gap: 12 }}>
          <section aria-labelledby="recent" className="card clip">
            <div className="card-h">
              <h2 id="recent" className="card-t">
                Recent deals
              </h2>
              <span style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <span className="card-meta">{mine.length} total</span>
                <Link href={ROUTES.partner.deals} className="link-sm">
                  View all
                </Link>
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
                    <th scope="col" className="r">
                      Protection
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {recent.map((d) => (
                    <tr key={d.id}>
                      <td>
                        <Link href={ROUTES.partner.deal(d.id)} className="cust">
                          <CustomerMark name={d.customer} />
                          {d.customer}
                        </Link>
                      </td>
                      <td>
                        <ProductChip product={d.product} />
                      </td>
                      <td>
                        <StatusBadge status={d.status} />
                      </td>
                      <td className="t-sec">{d.stage}</td>
                      <ProtectionCell deal={d} mode="overview" />
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        <div style={{ flex: "0 1 320px", minWidth: 280, display: "flex", flexDirection: "column", gap: 12 }}>
          <section aria-labelledby="attention" className="card clip" data-tour="overview-attention">
            <div className="card-h">
              <h2 id="attention" className="card-t">
                Needs attention
              </h2>
              <Badge tone="pending">{attention.length}</Badge>
            </div>
            {attention.map((a) => (
              <Link href={a.href} className="li" key={a.key}>
                <span className={`li-ic ${a.tone}`}>
                  <Icon name={a.icon} />
                </span>
                <span className="li-t">
                  <span className="li-n">{a.title}</span>
                  <span className="li-s">{a.meta}</span>
                </span>
              </Link>
            ))}
          </section>
          <section aria-labelledby="newdocs" className="card clip">
            <div className="card-h">
              <h2 id="newdocs" className="card-t">
                New documents
              </h2>
              <Link href={ROUTES.partner.documents} className="link-sm">
                All
              </Link>
            </div>
            {NEW_DOCS.map((f) => (
              <Link href={ROUTES.partner.documents} className="li" key={f.title}>
                <span className="li-ic">
                  <Icon name={f.icon} />
                </span>
                <span className="li-t">
                  <span className="li-n">{f.title}</span>
                  <span className="li-s">{f.meta}</span>
                </span>
              </Link>
            ))}
          </section>
        </div>
      </div>
    </div>
  );
}
