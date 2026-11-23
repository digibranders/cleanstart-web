'use client';

import { Line } from '@/components/charts';
import { formatUsd } from '@/components/dashboard/overview-model';
import { downloadCsv } from '@/components/partners/csv';
import { ScrollRegion } from '@/components/ui/scroll-region';
import { useToast } from '@/components/ui/toast';
import { plural } from '@/lib/dates';
import type { ReportInsightsDto, RollupRow } from '@/lib/report-insights';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const monthLabel = (ym: string): string => `${MONTHS[Number(ym.slice(5, 7)) - 1] ?? ym} ${ym.slice(0, 4)}`;
const pct = (fraction: number | null): string => (fraction === null ? 'None yet' : `${Math.round(fraction * 100)}%`);
const days = (n: number | null): string => (n === null ? 'None yet' : `${n} ${n === 1 ? 'day' : 'days'}`);

function Rollup({ id, title, firstHead, rows, empty, onExport }: { id: string; title: string; firstHead: string; rows: RollupRow[]; empty: string; onExport: () => void }): React.JSX.Element {
  return (
    <section aria-labelledby={id} className="card clip">
      <div className="card-h">
        <h2 id={id} className="card-t">
          {title}
        </h2>
        <button type="button" className="btn btn-s" onClick={onExport} disabled={rows.length === 0}>
          Export CSV
        </button>
      </div>
      {rows.length === 0 ? (
        <div className="empty">{empty}</div>
      ) : (
        <ScrollRegion label={title}>
          <table className="tbl">
            <thead>
              <tr>
                <th scope="col">{firstHead}</th>
                <th scope="col" className="r">
                  Deals
                </th>
                <th scope="col" className="r">
                  Won value
                </th>
                <th scope="col" className="r">
                  Win rate
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.key}>
                  <td>
                    {r.label}
                    {r.detail ? <span className="t-sec" style={{ display: 'block', fontSize: 12 }}>{r.detail}</span> : null}
                  </td>
                  <td className="tnum r">{r.deals}</td>
                  <td className="tnum r">{formatUsd(r.wonValue)}</td>
                  <td className="tnum r">{pct(r.winRate)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </ScrollRegion>
      )}
    </section>
  );
}

/** Time to decision, rejection reasons, document engagement and region and manager rollups for the report range. */
export function ReportInsights({ insights }: { insights: ReportInsightsDto }): React.JSX.Element {
  const toast = useToast();
  const { range, decision, reasons, engagement, regions, managers } = insights;
  const span = `${range.from}-to-${range.to}`;
  const exported = (what: string): void => toast(`Exported ${what} to CSV`);

  const exportDecision = (): void => {
    downloadCsv(
      `time-to-decision-${span}.csv`,
      ['Month registered', 'Decided', 'Median days', '90th percentile days'],
      decision.byMonth.map((m) => [m.month, m.decided, m.median ?? '', m.p90 ?? '']),
    );
    exported('time to decision');
  };
  const exportReasons = (): void => {
    downloadCsv(`rejection-reasons-${span}.csv`, ['Reason', 'Deals', 'Share'], reasons.map((r) => [r.reason, r.count, `${Math.round(r.share * 100)}%`]));
    exported('rejection reasons');
  };
  const exportEngagement = (): void => {
    downloadCsv(`document-engagement-${span}.csv`, ['Document', 'Opens', 'Partners'], engagement.top.map((d) => [d.title, d.opens, d.partners]));
    exported('document engagement');
  };
  const exportRollup = (name: string, header: string, rows: RollupRow[]) => (): void => {
    downloadCsv(`${name}-${span}.csv`, [header, 'Deals', 'Won', 'Won value (USD)', 'Win rate'], rows.map((r) => [r.label, r.deals, r.won, r.wonValue, r.winRate === null ? '' : `${Math.round(r.winRate * 100)}%`]));
    exported(name.replace('-', ' '));
  };

  return (
    <>
      <section aria-labelledby="ri-ttd" className="card clip">
        <div className="card-h">
          <h2 id="ri-ttd" className="card-t">
            Time to decision
          </h2>
          <button type="button" className="btn btn-s" onClick={exportDecision} disabled={decision.decided === 0}>
            Export CSV
          </button>
        </div>
        {decision.decided === 0 ? (
          <div className="empty">
            {decision.waiting > 0 ? `${plural(decision.waiting, 'deal')} in this range ${decision.waiting === 1 ? 'is' : 'are'} still waiting for a first decision.` : 'No deals were registered in this range.'}
          </div>
        ) : (
          <>
            <div className="kpis" style={{ borderTop: 0 }}>
              <div className="kpi">
                <span className="kpi-l">Median</span>
                <span className="kpi-v tnum">{days(decision.median)}</span>
                <span className="kpi-f">{plural(decision.decided, 'decided deal')}</span>
              </div>
              <div className="kpi">
                <span className="kpi-l">90th percentile</span>
                <span className="kpi-v tnum">{days(decision.p90)}</span>
                <span className="kpi-f">{decision.waiting > 0 ? `${decision.waiting} still waiting` : 'Nothing waiting'}</span>
              </div>
            </div>
            <div style={{ padding: '4px 16px 12px', maxWidth: 560 }}>
              <Line
                title="Days to first decision"
                description="Median and 90th percentile days from registration to the first accept or reject, by month registered."
                labels={decision.byMonth.map((m) => monthLabel(m.month))}
                series={[
                  { key: 'median', label: 'Median', values: decision.byMonth.map((m) => m.median ?? 0) },
                  { key: 'p90', label: '90th percentile', values: decision.byMonth.map((m) => m.p90 ?? 0) },
                ]}
                format={(n) => `${n}d`}
              />
            </div>
          </>
        )}
      </section>

      <section aria-labelledby="ri-rej" className="card clip">
        <div className="card-h">
          <h2 id="ri-rej" className="card-t">
            Rejection reasons
          </h2>
          <button type="button" className="btn btn-s" onClick={exportReasons} disabled={reasons.length === 0}>
            Export CSV
          </button>
        </div>
        {reasons.length === 0 ? (
          <div className="empty">No deals were rejected in this range.</div>
        ) : (
          <ScrollRegion label="Rejection reasons">
            <table className="tbl">
              <thead>
                <tr>
                  <th scope="col">Reason</th>
                  <th scope="col" className="r">
                    Deals
                  </th>
                  <th scope="col" className="r">
                    Share
                  </th>
                </tr>
              </thead>
              <tbody>
                {reasons.map((r) => (
                  <tr key={r.reason}>
                    <td>
                      <span style={{ display: 'block', overflowWrap: 'anywhere' }}>{r.reason}</span>
                      <span aria-hidden="true" style={{ display: 'block', height: 4, marginTop: 4, borderRadius: 2, width: `${Math.max(2, Math.round(r.share * 100))}%`, background: '#4B23C8' }} />
                    </td>
                    <td className="tnum r">{r.count}</td>
                    <td className="tnum r">{pct(r.share)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </ScrollRegion>
        )}
      </section>

      <section aria-labelledby="ri-doc" className="card clip">
        <div className="card-h">
          <h2 id="ri-doc" className="card-t">
            Document engagement
          </h2>
          <button type="button" className="btn btn-s" onClick={exportEngagement} disabled={engagement.top.length === 0}>
            Export CSV
          </button>
        </div>
        {engagement.partners === 0 ? (
          <div className="empty">No active partners in your regions.</div>
        ) : (
          <>
            <div className="kpis" style={{ borderTop: 0 }}>
              <div className="kpi">
                <span className="kpi-l">Partners who opened a document</span>
                <span className="kpi-v tnum">{pct(engagement.share)}</span>
                <span className="kpi-f">
                  {engagement.openedAny} of {plural(engagement.partners, 'partner')}
                </span>
              </div>
            </div>
            {engagement.top.length === 0 ? (
              <div className="empty">No documents were opened in this range.</div>
            ) : (
              <ScrollRegion label="Most opened documents">
                <table className="tbl">
                  <thead>
                    <tr>
                      <th scope="col">Most opened</th>
                      <th scope="col" className="r">
                        Opens
                      </th>
                      <th scope="col" className="r">
                        Partners
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {engagement.top.map((d) => (
                      <tr key={d.documentId}>
                        <td style={{ overflowWrap: 'anywhere' }}>{d.title}</td>
                        <td className="tnum r">{d.opens}</td>
                        <td className="tnum r">{d.partners}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </ScrollRegion>
            )}
          </>
        )}
      </section>

      <Rollup id="ri-reg" title="By region" firstHead="Region" rows={regions} empty="No deals were registered in this range." onExport={exportRollup('region-rollup', 'Region', regions)} />
      <Rollup id="ri-mgr" title="By partner manager" firstHead="Manager" rows={managers} empty="No deals were registered in this range." onExport={exportRollup('manager-rollup', 'Manager', managers)} />
    </>
  );
}
