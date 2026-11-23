import Link from "next/link";
import { BarList, CATEGORICAL, Columns, Donut, Funnel, Heatmap, Line, PRODUCT_COLOR, STATUS_COLOR, StatTile } from "@/components/charts";
import { type DashboardCard, DashboardGrid } from "@/components/dashboard/DashboardGrid";
import { ExportKpisButton } from "@/components/dashboard/ExportKpisButton";
import { OverviewFilters } from "@/components/dashboard/OverviewFilters";
import {
  buildStaffTiles,
  formatUsd,
  heatIsEmpty,
  heatWeeks,
  kpiCsvRows,
  kpiFilename,
  productBars,
  reasonBars,
  regionBars,
  TILES_CSV_HEADER,
  weekLabel,
  workloadBars,
} from "@/components/dashboard/overview-model";
import { ScrollRegion } from "@/components/ui/scroll-region";
import type { SavedLayout } from "@/lib/dashboard-layout";
import type { DashboardFilters, DocumentUseRow, PartnerPerformanceRow, StaffDashboardDto } from "@/lib/dashboard-dto";
import { fmtLong, fmtShort, plural } from "@/lib/dates";
import { PRODUCT_LABEL } from "@/lib/domain";
import { ROUTES } from "@/lib/routes";
import { CHIP_PRODUCT } from "../deals/derive";
import { type RegionDto, regionName } from "@/lib/regions";
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
  | ({ kind: "deals"; dashboard: StaffDashboardDto; canApplications: boolean; crmCard: React.ReactNode; layout: SavedLayout | null } & StaffOverviewFilterProps)
  | { kind: "documents"; filters: DashboardFilters; mostOpened: DocumentUseRow[]; leastOpened: DocumentUseRow[]; newDocuments: { id: string; title: string; updatedAt: string }[] };

interface StaffOverviewProps {
  data: StaffOverviewData;
  today: string;
  /** When the page was rendered, an ISO timestamp. */
  asOf: string;
  /** One line saying which part of the business this person sees. */
  scope: string;
  /** The regions table, for chart and export labels (this screen renders on the server, so it cannot read the context). */
  regions?: readonly RegionDto[];
}


function DocList({ kind, rows, meta }: { kind: "most" | "least"; rows: DocumentUseRow[]; meta?: string }): React.JSX.Element {
  const title = kind === "most" ? "Most opened documents" : "Least opened documents";
  return (
    <section className="card clip" aria-label={title}>
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
    </section>
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

export function StaffOverview({ data, today, asOf, scope, regions }: StaffOverviewProps): React.JSX.Element {
  const regionLabel = (key: string): string => regionName(key, regions);
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
          <Cell span={4} label="Most opened documents" className=""><DocList kind="most" rows={data.mostOpened} meta="All time" /></Cell>
          <Cell span={4} label="Least opened documents" className=""><DocList kind="least" rows={data.leastOpened} meta="All time" /></Cell>
        </div>
      </div>
    );
  }

  const d = data.dashboard;
  const tiles = buildStaffTiles(d, data.canApplications);
  const { series, kpis } = d;
  const statusSlices = STATUS_ORDER.map((s) => ({ key: s, label: STATUS_NAME[s], value: kpis.statusCounts[s], color: STATUS_COLOR[s] }));
  const noDeals = Object.values(kpis.statusCounts).every((n) => n === 0);
  const regionRows = regionBars(series.byRegion, regionLabel);
  const productRows = productBars(series.byProduct);
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
  const dealsWaiting = `${ROUTES.admin.approvals}?status=waiting`;
  const partnersTable = topPartners(d);
  const f = d.filters;

  const cards: DashboardCard[] = [
    {
      def: { id: "status", title: "Registrations by status", description: "Deals registered in the period, split by status.", span: 4, min: 4, max: 8 },
      node: (
<>
      {statusSlices.some((s) => s.value > 0) ? (
        <Donut title="Registrations by status" description="Deals registered in the period by status." totalLabel="deals" data={statusSlices} />
      ) : (
        <ChartEmpty title="Registrations by status" action={{ href: ROUTES.admin.approvals, label: "Open the deals queue" }}>No deals registered in this period.</ChartEmpty>
      )}
</>
      ),
    },
    {
      def: { id: "weekly", title: "Submitted and decided per week", description: "Deals sent for approval against deals decided, week by week.", span: 8, min: 6, max: 12 },
      node: (
<>
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
        <ChartEmpty title="Submitted and decided per week" action={{ href: `${ROUTES.admin.approvals}?status=all`, label: "See all deals" }}>No deals were submitted or decided in this period.</ChartEmpty>
      )}
</>
      ),
    },
    {
      def: { id: "region", title: "Pipeline value by region", description: "Open pipeline in USD for each region.", span: 4, min: 4, max: 12 },
      node: (
<>
      {regionRows.length > 0 ? (
        <BarList title="Pipeline value by region" description="Open deals (pending and accepted), USD." data={regionRows} format={formatUsd} />
      ) : (
        <ChartEmpty title="Pipeline value by region" action={{ href: `${ROUTES.admin.approvals}?status=all`, label: "See all deals" }}>No open pipeline value for this period.</ChartEmpty>
      )}
</>
      ),
    },
    {
      def: { id: "product", title: "Pipeline value by product", description: "Open pipeline in USD for each product.", span: 4, min: 4, max: 12 },
      node: (
<>
      {productRows.length > 0 ? (
        <BarList title="Pipeline value by product" description="Open deals (pending and accepted), USD." data={productRows} format={formatUsd} />
      ) : (
        <ChartEmpty title="Pipeline value by product" action={{ href: `${ROUTES.admin.approvals}?status=all`, label: "See all deals" }}>No open pipeline value for this period.</ChartEmpty>
      )}
</>
      ),
    },
    {
      def: { id: "funnel", title: "Application funnel", description: "How far partner applications got in the period.", span: 4, min: 4, max: 12 },
      node: (
<>
      {d.funnel.applied > 0 ? (
        <Funnel title="Application funnel" description="Applications received in the period and how far they got." stages={funnel} />
      ) : (
        <ChartEmpty title="Application funnel" action={{ href: ROUTES.admin.partners, label: "Open partners" }}>No partner applications in this period.</ChartEmpty>
      )}
</>
      ),
    },
    {
      def: { id: "rejections", title: "Rejection reasons", description: "Why deals were rejected in the period.", span: 4, min: 4, max: 12 },
      node: (
<>
      {reasons.length > 0 ? (
        <BarList title="Rejection reasons" description="Why deals were rejected in the period." data={reasons} format={(n) => String(n)} />
      ) : (
        <ChartEmpty title="Rejection reasons" action={{ href: `${ROUTES.admin.approvals}?status=rejected`, label: "See rejected deals" }}>No deals were rejected in this period.</ChartEmpty>
      )}
</>
      ),
    },
    {
      def: { id: "workload", title: "Manager workload", description: "Deals waiting for approval, per manager.", span: 4, min: 4, max: 12 },
      node: (
<>
      {workload.length > 0 ? (
        <BarList title="Manager workload" description="Deals waiting for approval, per manager." data={workload} format={(n) => String(n)} />
      ) : (
        <ChartEmpty title="Manager workload" action={{ href: `${ROUTES.admin.approvals}?status=all`, label: "See all deals" }}>Nothing is waiting for approval.</ChartEmpty>
      )}
</>
      ),
    },
    {
      def: { id: "dormant", title: "No activity in 30 days", description: "Active partners that have gone quiet.", span: 4, min: 4, max: 8 },
      node: (
<section className="card clip" aria-label="No activity in 30 days">
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
</section>
      ),
    },
    {
      def: { id: "toppartners", title: "Top partners", description: "Partners ranked by open pipeline and won value.", span: 8, min: 6, max: 12 },
      node: (
<section className="card clip" aria-label="Top partners">
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
</section>
      ),
    },
    {
      def: { id: "mostopened", title: "Most opened documents", description: "The documents partners open most.", span: 4, min: 4, max: 8 },
      node: (
<DocList kind="most" rows={d.mostOpenedDocuments} />
      ),
    },
    {
      def: { id: "topdeals", title: "Top deals by value", description: "The largest deals in the period.", span: 8, min: 6, max: 12 },
      node: (
<section className="card clip" aria-label="Top deals by value">
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
                  <td className="tnum r" data-hint={PRODUCT_LABEL[t.product]}>
                    {formatUsd(t.value)}
                  </td>
                  <td className="t-sec hide-sm">{t.stage}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </ScrollRegion>
      )}
</section>
      ),
    },
    {
      def: { id: "leastopened", title: "Least opened documents", description: "Documents few partners open.", span: 4, min: 4, max: 8 },
      node: (
<DocList kind="least" rows={d.leastOpenedDocuments} />
      ),
    },
    {
      def: { id: "health", title: "Partner health", description: "Active, onboarding and inactive partners.", span: 4, min: 4, max: 8, defaultHidden: true },
      node: (
<>
      {health.some((h) => h.value > 0) ? (
        <Donut title="Partner health" description="Partners by status." totalLabel="partners" data={health} />
      ) : (
        <ChartEmpty title="Partner health" action={{ href: ROUTES.admin.partners, label: "Open partners" }}>No partners in this view.</ChartEmpty>
      )}
</>
      ),
    },
    {
      def: { id: "decision", title: "Time to decision", description: "How long decided deals took, in business days.", span: 4, min: 4, max: 12, defaultHidden: true },
      node: (
<>
      {decided > 0 ? (
        <Columns
          title="Time to decision"
          description="Decided deals by business days from sent to decision."
          series={[{ key: "n", label: "Deals", color: PRODUCT_COLOR["Clean Libraries"] }]}
          rows={series.approvalTime.map((b) => ({ label: b.label, values: [b.count] }))}
        />
      ) : (
        <ChartEmpty title="Time to decision" action={{ href: dealsWaiting, label: "Review waiting deals" }}>No deals were decided in this period.</ChartEmpty>
      )}
</>
      ),
    },
    {
      def: { id: "heat", title: "Registration activity", description: "Deals registered each day over the last 12 weeks.", span: 8, min: 6, max: 12, defaultHidden: true },
      node: (
<>
      {heatIsEmpty(series.heat) ? (
        <ChartEmpty title="Registration activity" action={{ href: ROUTES.admin.approvals, label: "Open the deals queue" }}>
          No deals were registered in the last 12 weeks.
        </ChartEmpty>
      ) : (
        <Heatmap title="Registration activity" description="Deals registered each day over the last 12 weeks." weeks={heatWeeks(series.heat)} unit="deals" />
      )}
</>
      ),
    },
    ...(data.crmCard
      ? [{ def: { id: "crm", title: "CRM sync", description: "The state of the connection to your CRM.", span: 12, min: 6, max: 12 }, node: <>{data.crmCard}</> }]
      : []),
  ];

  return (
    <div className="wrap">
      <Header
        today={today}
        asOf={asOf}
        controls={
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
            <OverviewFilters
              period={f.period}
              from={f.from}
              to={f.to}
              category={f.category}
              categorySwitch
              product={f.product}
              region={f.region}
              partnerId={f.partnerId}
              regionSwitch={data.regionSwitch}
              partners={data.partners}
            />
            <ExportKpisButton filename={kpiFilename(d.range)} header={TILES_CSV_HEADER} rows={kpiCsvRows(f, d.range, tiles, new Map(data.partners.map((p) => [p.id, p.name])), regionLabel)} />
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
          <Empty>
            No deals in this view yet. Choose a longer period or clear a filter.{" "}
            <Link href={ROUTES.admin.overview} className="link-sm">
              Reset filters
            </Link>
          </Empty>
        </section>
      ) : null}

      <DashboardGrid dashboard="staff-overview" cards={cards} saved={data.layout} />
    </div>
  );
}
