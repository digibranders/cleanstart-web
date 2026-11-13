"use client";

import Link from "next/link";
import type { PartnerOverviewDto } from "@/lib/dto";
import { fmtLong } from "@/lib/dates";
import { ROUTES } from "@/lib/routes";
import { Icon } from "../icon";
import { CHIP_PRODUCT } from "../deals/derive";
import { ATTENTION_STYLE, buildOverviewKpis, docIcon, docMeta } from "../deals/overview";
import { CustomerMark, PLUS_PATH, ProtectionCell, StatusBadge } from "../deals/parts";
import { Badge, ProductChip } from "../ui/badge";

interface PartnerOverviewProps {
  overview: PartnerOverviewDto;
  today: string;
  /** When the page was rendered, an ISO timestamp. */
  asOf: string;
}

export function PartnerOverview({ overview, today, asOf }: PartnerOverviewProps): React.JSX.Element {
  const kpis = buildOverviewKpis(overview);
  const attention = overview.attention;
  const recent = overview.recent;
  const newDocuments = overview.newDocuments;

  return (
    <div className="wrap">
      <div className="head">
        <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
          <h1 className="h1">Overview</h1>
          <span className="h1-sub">Updated {fmtLong(today)}, {asOf.slice(11, 16)}</span>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <Link href={ROUTES.partner.newDeal} className="btn btn-p">
            <Icon d={PLUS_PATH} />
            Register deal
          </Link>
        </div>
      </div>

      <section aria-label="Key figures" className="card kpis">
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
                <span className="card-meta">{recent.length} shown</span>
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
                        <ProductChip product={CHIP_PRODUCT[d.product]} />
                      </td>
                      <td>
                        <StatusBadge status={d.status} />
                      </td>
                      <td className="t-sec">{d.stage}</td>
                      <ProtectionCell deal={d} mode="overview" today={today} />
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        <div style={{ flex: "0 1 320px", minWidth: 280, display: "flex", flexDirection: "column", gap: 12 }}>
          <section aria-labelledby="attention" className="card clip">
            <div className="card-h">
              <h2 id="attention" className="card-t">
                Needs attention
              </h2>
              <Badge tone="pending">{attention.length}</Badge>
            </div>
            {attention.map((a) => (
              <Link href={a.href} className="li" key={a.key}>
                <span className={`li-ic ${ATTENTION_STYLE[a.kind].tone}`}>
                  <Icon name={ATTENTION_STYLE[a.kind].icon} />
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
            {newDocuments.map((f) => (
              <Link href={ROUTES.partner.documents} className="li" key={f.id}>
                <span className="li-ic">
                  <Icon name={docIcon(f)} />
                </span>
                <span className="li-t">
                  <span className="li-n">{f.title}</span>
                  <span className="li-s">{docMeta(f)}</span>
                </span>
              </Link>
            ))}
          </section>
        </div>
      </div>
    </div>
  );
}
