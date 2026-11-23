"use client";

import Link from "next/link";
import type { PartnerOverviewDto } from "@/lib/dto";
import { fmtLong } from "@/lib/dates";
import { ROUTES } from "@/lib/routes";
import { Icon } from "../icon";
import { PROTECTION_DAYS } from "../deals/dates";
import { CHIP_PRODUCT } from "../deals/derive";
import { ATTENTION_STYLE, buildOverviewKpis, docIcon, docMeta } from "../deals/overview";
import { CustomerMark, PLUS_PATH, ProtectionCell, StatusBadge } from "../deals/parts";
import { Badge, ProductChip } from "../ui/badge";
import { ScrollRegion } from "@/components/ui/scroll-region";

interface PartnerOverviewProps {
  overview: PartnerOverviewDto;
  today: string;
  /** When the page was rendered, an ISO timestamp. */
  asOf: string;
}

export function PartnerOverview({ overview, today, asOf }: PartnerOverviewProps): React.JSX.Element {
  const kpis = buildOverviewKpis(overview);
  const recent = overview.recent;
  const newDocuments = overview.newDocuments;
  // A late or expiring deal that is already a row in the table is not listed a second time (its key ends in the deal id).
  const shownIds = new Set(recent.map((d) => d.id));
  const attention = overview.attention.filter(
    (a) => !((a.kind === "expiring" || a.kind === "late") && shownIds.has(a.key.slice(a.key.indexOf("-") + 1))),
  );

  return (
    <div className="wrap">
      <div className="head">
        <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
          <h1 className="h1">Overview</h1>
          <span className="h1-sub">Updated {fmtLong(today)}, {asOf.slice(11, 16)} UTC</span>
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
              {recent.length > 0 ? (
                <span style={{ display: "flex", gap: 12, alignItems: "center" }}>
                  <span className="card-meta">{recent.length} shown</span>
                  <Link href={ROUTES.partner.deals} className="link-sm">
                    View all
                  </Link>
                </span>
              ) : null}
            </div>
            {recent.length === 0 ? (
              <div className="empty">
                <p style={{ margin: 0 }}>
                  No deals yet. Register your first deal to start {PROTECTION_DAYS} days of protection.
                </p>
                <div
                  style={{ marginTop: 12, display: "flex", gap: 14, alignItems: "center", justifyContent: "center", flexWrap: "wrap" }}
                >
                  <Link href={ROUTES.partner.newDeal} className="btn btn-p">
                    <Icon d={PLUS_PATH} />
                    Register deal
                  </Link>
                  {/* Salespeople cannot open the checklist. */}
                  {overview.ownDealsOnly ? null : (
                    <Link href={ROUTES.partner.welcome} className="link-sm">
                      Finish setting up
                    </Link>
                  )}
                </div>
              </div>
            ) : (
              <ScrollRegion label="Recent registrations">
                <table className="tbl">
                  <thead>
                    <tr>
                      <th scope="col">Customer</th>
                      <th scope="col" className="hide-sm">
                        Product
                      </th>
                      <th scope="col">Status</th>
                      <th scope="col" className="hide-sm">
                        Stage
                      </th>
                      <th scope="col" className="r">
                        Protection
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {recent.map((d) => (
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
                        <td>
                          <StatusBadge status={d.status} />
                        </td>
                        <td className="t-sec hide-sm">{d.stage}</td>
                        <ProtectionCell deal={d} mode="overview" today={today} />
                      </tr>
                    ))}
                  </tbody>
                </table>
              </ScrollRegion>
            )}
          </section>
        </div>

        <div style={{ flex: "0 1 320px", minWidth: 280, display: "flex", flexDirection: "column", gap: 12 }}>
          {attention.length > 0 ? (
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
          ) : null}
          <section aria-labelledby="newdocs" className="card clip">
            <div className="card-h">
              <h2 id="newdocs" className="card-t">
                New documents
              </h2>
              <Link href={ROUTES.partner.documents} className="link-sm">
                All
              </Link>
            </div>
            {newDocuments.length === 0 ? (
              <div className="empty">
                <p style={{ margin: 0 }}>No new documents yet.</p>
              </div>
            ) : null}
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
