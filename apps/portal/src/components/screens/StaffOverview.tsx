import Link from "next/link";
import { BarList, CATEGORICAL, Columns, Donut, Funnel, Line, PRODUCT_COLOR, STATUS_COLOR, StatTile } from "@/components/charts";
import { ExportKpisButton } from "@/components/dashboard/ExportKpisButton";
import { OverviewFilters } from "@/components/dashboard/OverviewFilters";
import {
  buildStaffTiles,
  formatUsd,
  productBars,
  reasonBars,
  regionBars,
  TILES_CSV_HEADER,
  tilesCsv,
  weekLabel,
  workloadBars,
} from "@/components/dashboard/overview-model";
import { ScrollRegion } from "@/components/ui/scroll-region";
import type { DashboardFilters, DocumentUseRow, PartnerPerformanceRow, StaffDashboardDto } from "@/lib/dashboard-dto";
import { fmtLong, fmtShort, plural } from "@/lib/dates";
import { PRODUCT_LABEL } from "@/lib/domain";
import { ROUTES } from "@/lib/routes";
import { CHIP_PRODUCT } from "../deals/derive";
import { CustomerMark } from "../deals/parts";
import { ProductChip } from "../ui/badge";
import { CardHead, Cell, ChartEmpty, Empty, STATUS_NAME, STATUS_ORDER } from "./PartnerOverview";

export interface StaffOverviewFilterProps {
  /** Staff who cover more than one region can switch; a sales person fixed to one region cannot. */
  regionSwitch: boolean;
  partners: readonly { id: string; name: string }[];
}

/** Partner manager and staff sales get the deal dashboard; marketing has no deal access, so it gets document activity only. */
export type StaffOverviewData =
  | ({ kind: "deals"; dashboard: StaffDashboardDto; canApplications: boolean; crmCard: React.ReactNode } & StaffOverviewFilterProps)
  | { kind: "documents"; filters: DashboardFilters; mostOpened: DocumentUseRow[]; leastOpened: DocumentUseRow[]; newDocuments: { id: string; title: string; updatedAt: string }[] };

interface StaffOverviewProps {
  data: StaffOverviewData;
  today: string;
  /** When the page was rendered, an ISO timestamp. */
  asOf: string;
  /** One line saying which part of the business this person sees. */
  scope: string;
}


function DocList({ kind, rows, meta, span = 6 }: { kind: "most" | "least"; rows: DocumentUseRow[]; meta?: string; span?: 4 | 6 }): React.JSX.Element {
  const title = kind === "most" ? "Most opened documents" : "Least opened documents";
  return (
    <Cell span={span} label={title} className="card clip">
      <CardHead id={kind} title={title} meta={meta} href={ROUTES.admin.documents} hrefLabel="All" />
      {rows.length === 0 ? <Empty>{kind === "most" ? "No documents opened in this period." : "No documents yet."}</Empty> : null}
      {rows.map((d) => (
        <Link href={ROUTES.admin.documents} className="li" key={d.id}>
          <span className="li-t">
            <span className="li-n">{d.title}</span>
            <span className="li-s">{d.opens === 0 ? "Not opened" : `${plural(d.opens, "open")} by ${plural(d.partners, "partner")}`}</span>
          </span>
        </Link>
      ))}
    </Cell>
  );
}

function Header({ today, asOf, controls }: { today: string; asOf: string; controls?: React.ReactNode }): React.JSX.Element {
  return (
    <div className="head">
      <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
        <h1 className="h1">Overview</h1>
        <span className="h1-sub">
          Updated {fmtLong(today)}, {asOf.slice(11, 16)} UTC
        </span>
      </div>
      {controls}
    </div>
  );
}

/** Partners ranked by pipeline value, then won value; a partner on either list appears once. */
function topPartners(d: StaffDashboardDto): PartnerPerformanceRow[] {
  const byId = new Map<string, PartnerPerformanceRow>();
  for (const p of [...d.topByPipeline, ...d.topByWon]) byId.set(p.partnerId, p);
  return [...byId.values()].sort((a, b) => b.pipelineValue - a.pipelineValue || b.wonValue - a.wonValue || a.name.localeCompare(b.name));
}

export function StaffOverview({ data, today, asOf, scope }: StaffOverviewProps): React.JSX.Element {
  if (data.kind === "documents") {
    return (
      <div className="wrap">
        <Header today={today} asOf={asOf} />
        <p className="card-meta" style={{ margin: 0 }}>
          {scope}
        </p>
        <div className="dash">
          <Cell span={4} label="New documents" className="card clip">
            <CardHead id="newdocs" title="New documents" href={ROUTES.admin.documents} hrefLabel="All" />
            {data.newDocuments.length === 0 ? <Empty>No new documents in the last 30 days.</Empty> : null}
            {data.newDocuments.map((f) => (
              <Link href={ROUTES.admin.documents} className="li" key={f.id}>
                <span className="li-t">
                  <span className="li-n">{f.title}</span>
                  <span className="li-s">Updated {fmtShort(f.updatedAt.slice(0, 10), today)}</span>
                </span>
              </Link>
            ))}
          </Cell>
          <DocList kind="most" rows={data.mostOpened} meta="All time" span={4} />
          <DocList kind="least" rows={data.leastOpened} meta="All time" span={4} />
        </div>
      </div>
    );
  }

  const d = data.dashboard;
  const tiles = buildStaffTiles(d, data.canApplications);
  const { series, kpis } = d;
  const statusSlices = STATUS_ORDER.map((s) => ({ key: s, label: STATUS_NAME[s], value: kpis.statusCounts[s], color: STATUS_COLOR[s] }));
  const noDeals = Object.values(kpis.statusCounts).every((n) => n === 0);
  const regionRows = regionBars(series.byRegion);
  const productRows = productBars(series.byProduct);
  const productSlices = productRows.map((p) => ({ key: p.key, label: p.label, value: p.value, ...(p.color ? { color: p.color } : {}) }));
  const reasons = reasonBars(series.rejectionReasons);
  const workload = workloadBars(d.managerWorkload);
  const funnel = [
    { label: "Applied", value: d.funnel.applied },
    { label: "Approved", value: d.funnel.approved },
    { label: "Invited", value: d.funnel.invited },
    { label: "Active", value: d.funnel.active },
  ];
  const health = [
    { key: "active", label: "Active", value: d.partnerHealth.active, color: STATUS_COLOR.accepted },
    { key: "onboarding", label: "Onboarding", value: d.partnerHealth.onboarding, color: STATUS_COLOR.pending },
    { key: "inactive", label: "Inactive", value: d.partnerHealth.inactive, color: STATUS_COLOR.expired },
  ];
  const decided = series.approvalTime.reduce((n, b) => n + b.count, 0);
  const partnersTable = topPartners(d);
  const f = d.filters;

  return (
    <div className="wrap">
      <Header
        today={today}
        asOf={asOf}
        controls={
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
            <OverviewFilters
              period={f.period}
              product={f.product}
              region={f.region}
              partnerId={f.partnerId}
              regionSwitch={data.regionSwitch}
              partners={data.partners}
            />
            <ExportKpisButton filename="overview-kpis.csv" header={TILES_CSV_HEADER} rows={tilesCsv(tiles)} />
          </div>
        }
      />
      <p className="card-meta" style={{ margin: 0 }}>
        {scope}
      </p>

      <section aria-label="Key figures" className="card kpis dash-kpis dash-kpis-8">
        {tiles.map((t) => (
          <Link className="kt" key={t.key} href={t.href}>
            <StatTile label={t.label} value={t.value} {...(t.trend ? { trend: t.trend } : {})} />
            <span className="kpi-f kt-f">{t.foot}</span>
          </Link>
        ))}
      </section>

      {noDeals ? (
        <section className="card">
          <Empty>No deals in this view yet. Choose a longer period or clear a filter.</Empty>
        </section>
      ) : null}

      <div className="dash">
        <Cell span={4} className="">
          {statusSlices.some((s) => s.value > 0) ? (
            <Donut title="Registrations by status" description="Deals registered in the period by status." totalLabel="deals" data={statusSlices} />
          ) : (
            <ChartEmpty title="Registrations by status">No deals registered in this period.</ChartEmpty>
          )}
        </Cell>
        <Cell span={8} wide className="">
          {series.weekly.some((w) => w.submitted > 0 || w.decided > 0) ? (
            <Line
              title="Submitted and decided per week"
              description="Deals sent for approval and deals decided in each week of the period."
              labels={series.weekly.map((w) => weekLabel(w.weekStart))}
              series={[
                { key: "submitted", label: "Submitted", color: CATEGORICAL[0], values: series.weekly.map((w) => w.submitted) },
                { key: "decided", label: "Decided", color: CATEGORICAL[1], values: series.weekly.map((w) => w.decided) },
              ]}
              format={(n) => String(Math.round(n))}
            />
          ) : (
            <ChartEmpty title="Submitted and decided per week">No deals were submitted or decided in this period.</ChartEmpty>
          )}
        </Cell>

        <Cell span={4} className="">
          {regionRows.length > 0 ? (
            <BarList title="Pipeline value by region" description="Open deals (pending and accepted), USD." data={regionRows} format={formatUsd} />
          ) : (
            <ChartEmpty title="Pipeline value by region">No open pipeline value for this period.</ChartEmpty>
          )}
        </Cell>
        <Cell span={4} className="">
          {productSlices.length > 0 ? (
            <Donut title="Pipeline value by product" description="Open deals (pending and accepted), USD." totalLabel="pipeline" data={productSlices} format={formatUsd} />
          ) : (
            <ChartEmpty title="Pipeline value by product">No open pipeline value for this period.</ChartEmpty>
          )}
        </Cell>
        <Cell span={4} className="">
          {d.funnel.applied > 0 ? (
            <Funnel title="Application funnel" description="Applications received in the period and how far they got." stages={funnel} />
          ) : (
            <ChartEmpty title="Application funnel">No partner applications in this period.</ChartEmpty>
          )}
        </Cell>

        <Cell span={4} className="">
          {health.some((h) => h.value > 0) ? (
            <Donut title="Partner health" description="Partners by status." totalLabel="partners" data={health} />
          ) : (
            <ChartEmpty title="Partner health">No partners in this view.</ChartEmpty>
          )}
        </Cell>
        <Cell span={4} className="">
          {decided > 0 ? (
            <Columns
              title="Time to decision"
              description="Decided deals by business days from sent to decision."
              series={[{ key: "n", label: "Deals", color: PRODUCT_COLOR["Clean Libraries"] }]}
              rows={series.approvalTime.map((b) => ({ label: b.label, values: [b.count] }))}
            />
          ) : (
            <ChartEmpty title="Time to decision">No deals were decided in this period.</ChartEmpty>
          )}
        </Cell>
        <Cell span={4} className="">
          {reasons.length > 0 ? (
            <BarList title="Rejection reasons" description="Why deals were rejected in the period." data={reasons} format={(n) => String(n)} />
          ) : (
            <ChartEmpty title="Rejection reasons">No deals were rejected in this period.</ChartEmpty>
          )}
        </Cell>

        <Cell span={4} className="">
          {workload.length > 0 ? (
            <BarList title="Manager workload" description="Deals waiting for approval, per manager." data={workload} format={(n) => String(n)} />
          ) : (
            <ChartEmpty title="Manager workload">Nothing is waiting for approval.</ChartEmpty>
          )}
        </Cell>

        <Cell span={8} wide label="Top partners" className="card clip">
          <CardHead id="toppartners" title="Top partners" meta="By open pipeline" href={ROUTES.admin.partners} />
          {partnersTable.length === 0 ? (
            <Empty>No partner has pipeline or won deals in this period.</Empty>
          ) : (
            <ScrollRegion label="Top partners">
              <table className="tbl">
                <thead>
                  <tr>
                    <th scope="col">Partner</th>
                    <th scope="col" className="r">
                      Pipeline
                    </th>
                    <th scope="col" className="r hide-sm">
                      Won
                    </th>
                    <th scope="col" className="r hide-sm">
                      Deals
                    </th>
                    <th scope="col" className="r hide-sm">
                      Last active
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {partnersTable.map((p) => (
                    <tr key={p.partnerId}>
                      <td style={{ whiteSpace: "normal" }}>
                        <Link href={`${ROUTES.admin.partners}?selected=${p.partnerId}`} className="cust">
                          <CustomerMark name={p.name} />
                          {p.name}
                        </Link>
                      </td>
                      <td className="tnum r">{formatUsd(p.pipelineValue)}</td>
                      <td className="tnum r hide-sm">{p.wonCount ? `${formatUsd(p.wonValue)} (${p.wonCount})` : "None"}</td>
                      <td className="tnum r hide-sm">{p.deals}</td>
                      <td className="tnum r hide-sm">{p.lastActiveAt ? fmtShort(p.lastActiveAt.slice(0, 10), today) : "Never"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </ScrollRegion>
          )}
        </Cell>
        <Cell span={4} label="No activity in 30 days" className="card clip">
          <CardHead id="dormant" title="No activity in 30 days" meta={d.dormantPartners.length ? String(d.dormantPartners.length) : undefined} href={ROUTES.admin.partners} />
          {d.dormantPartners.length === 0 ? <Empty>Every active partner was active in the last 30 days.</Empty> : null}
          {d.dormantPartners.map((p) => (
            <Link href={`${ROUTES.admin.partners}?selected=${p.partnerId}`} className="li" key={p.partnerId}>
              <span className="li-t">
                <span className="li-n">{p.name}</span>
                <span className="li-s">{p.daysQuiet === null ? "No activity on record" : `${plural(p.daysQuiet, "day")} quiet`}</span>
              </span>
            </Link>
          ))}
        </Cell>

        <Cell span={8} wide label="Top deals by value" className="card clip">
          <CardHead id="topdeals" title="Top deals by value" href={ROUTES.admin.approvals} />
          {series.topDeals.length === 0 ? (
            <Empty>No deals with a value in USD in this period.</Empty>
          ) : (
            <ScrollRegion label="Top deals by value">
              <table className="tbl">
                <thead>
                  <tr>
                    <th scope="col">Customer</th>
                    <th scope="col" className="hide-sm">
                      Partner
                    </th>
                    <th scope="col" className="hide-sm">
                      Product
                    </th>
                    <th scope="col" className="r">
                      Value
                    </th>
                    <th scope="col" className="hide-sm">
                      Stage
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {series.topDeals.map((t) => (
                    <tr key={t.id}>
                      <td style={{ whiteSpace: "normal" }}>
                        <Link href={`${ROUTES.admin.approvals}/${t.id}`} className="cust">
                          <CustomerMark name={t.customer} />
                          {t.customer}
                        </Link>
                      </td>
                      <td className="t-sec hide-sm">{t.partnerName}</td>
                      <td className="hide-sm">
                        <ProductChip product={CHIP_PRODUCT[t.product]} />
                      </td>
                      <td className="tnum r" title={PRODUCT_LABEL[t.product]}>
                        {formatUsd(t.value)}
                      </td>
                      <td className="t-sec hide-sm">{t.stage}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </ScrollRegion>
          )}
        </Cell>
        <DocList kind="most" rows={d.mostOpenedDocuments} />
        <DocList kind="least" rows={d.leastOpenedDocuments} />
        {data.crmCard ? (
          <Cell span={12} label="CRM sync" className="">
            {data.crmCard}
          </Cell>
        ) : null}
      </div>
    </div>
  );
}
