import Link from "next/link";
import { BarList, Columns, Donut, Funnel, Heatmap, PRODUCT_COLOR, STATUS_COLOR, StatTile, Timeline } from "@/components/charts";
import { ExportKpisButton } from "@/components/dashboard/ExportKpisButton";
import { OverviewFilters } from "@/components/dashboard/OverviewFilters";
import {
  buildDashboardTiles,
  dayMs,
  formatUsd,
  heatIsEmpty,
  heatWeeks,
  kpiCsvRows,
  kpiFilename,
  productBars,
  protectionBars,
  stageFunnel,
  TILES_CSV_HEADER,
  valueBars,
} from "@/components/dashboard/overview-model";
import { ScrollRegion } from "@/components/ui/scroll-region";
import type { DashboardFilters, DocumentUseRow, PartnerDashboardDto } from "@/lib/dashboard-dto";
import { fmtLong, fmtShort, plural } from "@/lib/dates";
import { PRODUCT_LABEL, type RegistrationStatus } from "@/lib/domain";
import type { DocumentListItemDto } from "@/lib/dto";
import { ROUTES } from "@/lib/routes";
import { PROTECTION_DAYS } from "../deals/dates";
import { CHIP_PRODUCT } from "../deals/derive";
import { ATTENTION_STYLE, docIcon, docMeta } from "../deals/overview";
import { CustomerMark, PLUS_PATH } from "../deals/parts";
import { Icon } from "../icon";
import { ProductChip } from "../ui/badge";

/** Partner admin and sales get the deal dashboard; technical has no deals, so they get documents. */
export type PartnerOverviewData =
  | { kind: "deals"; dashboard: PartnerDashboardDto }
  | { kind: "documents"; filters: DashboardFilters; newDocuments: DocumentListItemDto[]; mostOpened: DocumentUseRow[] };

interface PartnerOverviewProps {
  data: PartnerOverviewData;
  today: string;
  /** When the page was rendered, an ISO timestamp. */
  asOf: string;
}

const MONTH = new Intl.DateTimeFormat("en-GB", { month: "short", timeZone: "UTC" });
const monthLabel = (ym: string): string => MONTH.format(new Date(`${ym}-01T00:00:00Z`));

export const STATUS_ORDER: readonly RegistrationStatus[] = ["pending", "accepted", "won", "lost", "rejected", "expired"];
export const STATUS_NAME: Record<RegistrationStatus, string> = {
  pending: "Pending",
  accepted: "Accepted",
  won: "Won",
  lost: "Lost",
  rejected: "Rejected",
  expired: "Expired",
};

/** A chart or table card in the dashboard grid. `span` is the desktop column span out of 12. */
export function Cell({ span, wide, children, label, className = "" }: { span: 4 | 6 | 8 | 12; wide?: boolean; children: React.ReactNode; label?: string; className?: string }): React.JSX.Element {
  // A chart draws its own card (.ch), so a chart cell is bare; tables and lists pass "card clip".
  return (
    <section className={`dash-c${span}${wide ? " dash-wide" : ""} ${className}`} aria-label={label}>
      {children}
    </section>
  );
}

export function Empty({ children }: { children: React.ReactNode }): React.JSX.Element {
  return (
    <div className="empty" style={{ padding: "20px 12px" }}>
      <p style={{ margin: 0 }}>{children}</p>
    </div>
  );
}

/** The empty state of a chart: its own card, with the chart title so the grid does not lose a slot. */
export function ChartEmpty({ title, children, action }: { title: string; children: React.ReactNode; action?: { href: string; label: string } }): React.JSX.Element {
  return (
    <div className="card" style={{ minHeight: 120 }}>
      <div className="card-h">
        <h2 className="card-t">{title}</h2>
      </div>
      <Empty>
        {children}
        {action ? (
          <>
            {" "}
            <Link href={action.href} className="link-sm">
              {action.label}
            </Link>
          </>
        ) : null}
      </Empty>
    </div>
  );
}

export function CardHead({ id, title, meta, href, hrefLabel }: { id: string; title: string; meta?: string | undefined; href?: string; hrefLabel?: string }): React.JSX.Element {
  return (
    <div className="card-h">
      <h2 id={id} className="card-t">
        {title}
      </h2>
      <span style={{ display: "flex", gap: 12, alignItems: "center" }}>
        {meta ? <span className="card-meta">{meta}</span> : null}
        {href ? (
          <Link href={href} className="link-sm">
            {hrefLabel ?? "View all"}
          </Link>
        ) : null}
      </span>
    </div>
  );
}

function DocumentLists({ newDocuments, mostOpened }: { newDocuments: DocumentListItemDto[]; mostOpened: DocumentUseRow[] }): React.JSX.Element {
  return (
    <>
      <Cell span={4} label="New documents" className="card clip">
        <CardHead id="newdocs" title="New documents" href={ROUTES.partner.documents} hrefLabel="All" />
        {newDocuments.length === 0 ? <Empty>No new documents in the last 30 days.</Empty> : null}
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
      </Cell>
      <Cell span={4} label="Most opened documents" className="card clip">
        <CardHead id="opened" title="Most opened documents" href={ROUTES.partner.documents} hrefLabel="All" />
        {mostOpened.length === 0 ? <Empty>No documents opened yet. Open one from the Documents page.</Empty> : null}
        {mostOpened.map((d) => (
          <Link href={ROUTES.partner.documents} className="li" key={d.id}>
            <span className="li-ic">
              <Icon name="file" />
            </span>
            <span className="li-t">
              <span className="li-n">{d.title}</span>
              <span className="li-s">{plural(d.opens, "open")}</span>
            </span>
          </Link>
        ))}
      </Cell>
    </>
  );
}

function Header({ filters, today, asOf, deals, exportKpis }: { filters: DashboardFilters; today: string; asOf: string; deals: boolean; exportKpis?: React.ReactNode }): React.JSX.Element {
  return (
    <div className="head">
      <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
        <h1 className="h1">Overview</h1>
        <span className="h1-sub">
          Updated {fmtLong(today)}, {asOf.slice(11, 16)} UTC
        </span>
      </div>
      {deals ? (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          <OverviewFilters period={filters.period} from={filters.from} to={filters.to} product={filters.product} />
          {exportKpis}
          <Link href={ROUTES.partner.newDeal} className="btn btn-p">
            <Icon d={PLUS_PATH} />
            Register deal
          </Link>
        </div>
      ) : null}
    </div>
  );
}

export function PartnerOverview({ data, today, asOf }: PartnerOverviewProps): React.JSX.Element {
  if (data.kind === "documents") {
    return (
      <div className="wrap">
        <Header filters={data.filters} today={today} asOf={asOf} deals={false} />
        <p className="card-meta" style={{ margin: 0 }}>
          Your role does not register deals. New and most opened documents are here;{" "}
          <Link href={ROUTES.partner.program}>the Program page</Link> explains how protection and registration work.
        </p>
        <div className="dash">
          <DocumentLists newDocuments={data.newDocuments} mostOpened={data.mostOpened} />
        </div>
      </div>
    );
  }

  const d = data.dashboard;
  const tiles = buildDashboardTiles(d);
  const { series, kpis } = d;
  const statusSlices = STATUS_ORDER.map((s) => ({ key: s, label: STATUS_NAME[s], value: kpis.statusCounts[s], color: STATUS_COLOR[s] }));
  const stageRows = stageFunnel(series.byStage);
  const countryBars = valueBars(series.byCountry);
  const industryBars = valueBars(series.byIndustry);
  const windows = protectionBars(d.expiring14);
  const productRows = productBars(series.byProduct);
  const noDeals = Object.values(kpis.statusCounts).every((n) => n === 0);
  // A late or expiring deal that is already a row on the page is not listed a second time (its key ends in the deal id).
  const shownIds = new Set([...d.expiring14.map((e) => e.id), ...series.topDeals.map((t) => t.id)]);
  const attention = d.attention.filter((a) => !((a.kind === "expiring" || a.kind === "late") && shownIds.has(a.key.slice(a.key.indexOf("-") + 1))));

  return (
    <div className="wrap">
      <Header
        filters={d.filters}
        today={today}
        asOf={asOf}
        deals
        exportKpis={<ExportKpisButton filename={kpiFilename(d.range)} header={TILES_CSV_HEADER} rows={kpiCsvRows(d.filters, d.range, tiles)} />}
      />
      {d.ownDealsOnly ? (
        <p className="card-meta" style={{ margin: 0 }}>
          You see only the deals you registered.
        </p>
      ) : null}

      <section aria-label="Key figures" className="card kpis dash-kpis">
        {tiles.map((t) => (
          <Link className="kt" key={t.key} href={`${ROUTES.partner.deals}?status=${t.status}`}>
            <StatTile label={t.label} value={t.value} {...(t.trend ? { trend: t.trend } : {})} />
            <span className="kpi-f kt-f">{t.foot}</span>
          </Link>
        ))}
      </section>

      {noDeals ? (
        <section className="card">
          <Empty>
            No deals in this view yet. Register a deal to start {PROTECTION_DAYS} days of protection.{" "}
            <Link href={ROUTES.partner.newDeal} className="link-sm">
              Register deal
            </Link>
          </Empty>
        </section>
      ) : null}

      <div className="dash">
        <Cell span={4} className="">
          {statusSlices.some((s) => s.value > 0) ? (
            <Donut title="Deals by status" description="Registered deals in the period by status." totalLabel="deals" data={statusSlices} />
          ) : (
            <ChartEmpty title="Deals by status" action={{ href: ROUTES.partner.newDeal, label: "Register a deal" }}>No deals registered in this period. Choose a longer period or register a deal.</ChartEmpty>
          )}
        </Cell>
        <Cell span={4} className="">
          {productRows.length > 0 ? (
            <BarList title="Pipeline value by product" description="Open deals (pending and accepted), USD." data={productRows} format={formatUsd} />
          ) : (
            <ChartEmpty title="Pipeline value by product" action={{ href: ROUTES.partner.newDeal, label: "Register a deal" }}>No open pipeline value for this period. Add a deal value when you register a deal.</ChartEmpty>
          )}
        </Cell>
        <Cell span={4} className="">
          {stageRows.length > 0 ? (
            <Funnel title="Pipeline by sales stage" description="Open deals that reached each stage, with the share of the stage before." stages={stageRows} />
          ) : (
            <ChartEmpty title="Pipeline by sales stage" action={{ href: ROUTES.partner.newDeal, label: "Register a deal" }}>No open deals at any stage yet.</ChartEmpty>
          )}
        </Cell>
        <Cell span={8} wide className="">
          {series.monthly.some((m) => m.count > 0) ? (
            <Columns
              title="Registrations per month"
              description="Deals registered in each of the last 12 months."
              series={[{ key: "n", label: "Deals", color: PRODUCT_COLOR["CleanStart Images"] }]}
              rows={series.monthly.map((m) => ({ label: monthLabel(m.month), values: [m.count] }))}
            />
          ) : (
            <ChartEmpty title="Registrations per month" action={{ href: ROUTES.partner.newDeal, label: "Register a deal" }}>No registrations in the last 12 months. Register a deal to see the trend.</ChartEmpty>
          )}
        </Cell>
        <Cell span={4} className="">
          {windows.length > 0 ? (
            <Timeline title="Protection windows" description="The next deals to lose protection; the line marks today." bars={windows} today={dayMs(today)} />
          ) : (
            <ChartEmpty title="Protection windows" action={{ href: `${ROUTES.partner.deals}?status=accepted`, label: "View protected deals" }}>No protection ends in the next 14 days.</ChartEmpty>
          )}
        </Cell>
        {countryBars.length > 0 ? (
          <Cell span={4} className="">
            <BarList title="Value by customer country" description="Open pipeline, USD." data={countryBars} format={formatUsd} />
          </Cell>
        ) : null}
        {industryBars.length > 0 ? (
          <Cell span={4} className="">
            <BarList title="Value by industry" description="Open pipeline, USD." data={industryBars} format={formatUsd} />
          </Cell>
        ) : null}
        {d.team.length > 0 ? (
          <Cell span={4} className="">
            <BarList
              title="Registrations per team member"
              description="Deals registered in the period."
              data={d.team.filter((m) => m.deals > 0).map((m) => ({ key: m.userId, label: m.name, value: m.deals }))}
              format={(n) => String(n)}
            />
          </Cell>
        ) : null}

        <Cell span={8} wide className="">
          {heatIsEmpty(series.heat) ? (
            <ChartEmpty title="Registration activity" action={{ href: ROUTES.partner.newDeal, label: "Register a deal" }}>
              No deals registered in the last 12 weeks.
            </ChartEmpty>
          ) : (
            <Heatmap title="Registration activity" description="Deals registered each day over the last 12 weeks." weeks={heatWeeks(series.heat)} unit="deals" />
          )}
        </Cell>

        <Cell span={8} wide label="Top deals by value" className="card clip">
          <CardHead id="top" title="Top deals by value" href={ROUTES.partner.deals} />
          {series.topDeals.length === 0 ? (
            <Empty>No deals with a value in USD yet. Add a deal value when you register a deal.</Empty>
          ) : (
            <ScrollRegion label="Top deals by value">
              <table className="tbl">
                <thead>
                  <tr>
                    <th scope="col">Customer</th>
                    <th scope="col" className="hide-sm">
                      Product
                    </th>
                    <th scope="col" className="r">
                      Value
                    </th>
                    <th scope="col" className="hide-sm">
                      Stage
                    </th>
                    <th scope="col" className="r hide-sm">
                      Protection ends
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {series.topDeals.map((t) => (
                    <tr key={t.id}>
                      <td style={{ whiteSpace: "normal" }}>
                        <Link href={ROUTES.partner.deal(t.id)} className="cust">
                          <CustomerMark name={t.customer} />
                          {t.customer}
                        </Link>
                      </td>
                      <td className="hide-sm">
                        <ProductChip product={CHIP_PRODUCT[t.product]} />
                      </td>
                      <td className="tnum r" title={PRODUCT_LABEL[t.product]}>
                        {formatUsd(t.value)}
                      </td>
                      <td className="t-sec hide-sm">{t.stage}</td>
                      <td className="tnum r hide-sm">{t.protectionEnd ? fmtShort(t.protectionEnd, today) : "Not set"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </ScrollRegion>
          )}
        </Cell>

        <Cell span={4} label="Expiring soon" className="card clip">
          <CardHead id="expiring" title="Expiring soon" meta={d.expiring14.length ? `${d.expiring14.length}` : undefined} />
          {d.expiring14.length === 0 ? <Empty>Nothing expires in the next 14 days.</Empty> : null}
          {d.expiring14.slice(0, 6).map((e) => (
            <Link href={ROUTES.partner.deal(e.id)} className="li" key={e.id}>
              <span className="li-ic tone-amber">
                <Icon name="hg" />
              </span>
              <span className="li-t">
                <span className="li-n">{e.customer}</span>
                <span className="li-s">
                  {e.daysLeft === 0 ? "Ends today" : `${plural(e.daysLeft, "day")} left`}, {fmtShort(e.protectionEnd, today)}
                </span>
              </span>
            </Link>
          ))}
        </Cell>

        <Cell span={4} label="Needs attention" className="card clip">
          <CardHead id="attention" title="Needs attention" meta={attention.length ? String(attention.length) : undefined} />
          {attention.length === 0 ? <Empty>Nothing needs your attention.</Empty> : null}
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
        </Cell>
        <DocumentLists newDocuments={d.newDocuments} mostOpened={d.mostOpenedDocuments} />
      </div>
    </div>
  );
}
