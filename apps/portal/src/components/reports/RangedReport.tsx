'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { Funnel } from '@/components/charts';
import { formatUsd } from '@/components/dashboard/overview-model';
import { CHIP_PRODUCT } from '@/components/deals/derive';
import { downloadCsv } from '@/components/partners/csv';
import { ProductChip } from '@/components/ui/badge';
import { DatePicker } from '@/components/ui/date-picker';
import { ScrollRegion } from '@/components/ui/scroll-region';
import { useToast } from '@/components/ui/toast';
import { fmtLong, plural } from '@/lib/dates';
import {
  type RangedReportDto,
  REPORT_PRESET_LABEL,
  REPORT_PRESETS,
  type ReportPreset,
  reportRangeQuery,
  resolveReportRange,
} from '@/lib/report-metrics';
import { ROUTES } from '@/lib/routes';

const SHORT: Record<ReportPreset, string> = { '30d': '30d', '90d': '90d', '365d': '365d', quarter: 'Quarter', custom: 'Custom' };
const pct = (fraction: number | null): string => (fraction === null ? 'None yet' : `${Math.round(fraction * 100)}%`);
const usd = (n: number | null): string => (n === null ? 'None yet' : formatUsd(n));

interface RangedReportProps {
  report: RangedReportDto;
  today: string;
}

/** Range control, value and win-rate figures, funnel, partner leaderboard and product breakdown for one date range. The range lives in the URL. */
export function RangedReport({ report, today }: RangedReportProps): React.JSX.Element {
  const { range, summary, funnel, leaderboard, products } = report;
  const pathname = usePathname();
  const router = useRouter();
  const toast = useToast();
  const [from, setFrom] = useState(range.from);
  const [to, setTo] = useState(range.to);
  const customOpen = range.preset === 'custom';
  const [showCustom, setShowCustom] = useState(customOpen);
  const customValid = from !== '' && to !== '' && from <= to;
  const href = (preset: ReportPreset): string => `${pathname}${reportRangeQuery(resolveReportRange(preset, today))}`;

  const exportLeaderboard = (): void => {
    downloadCsv(
      `partner-leaderboard-${range.from}-to-${range.to}.csv`,
      ['Rank', 'Partner', 'Deals', 'Won', 'Won value (USD)'],
      leaderboard.map((r, i) => [i + 1, r.name, r.deals, r.won, r.wonValue]),
    );
    toast(`Exported ${plural(leaderboard.length, 'partner')} to CSV`);
  };
  const exportProducts = (): void => {
    downloadCsv(
      `product-breakdown-${range.from}-to-${range.to}.csv`,
      ['Product', 'Deals', 'Approved', 'Won', 'Total value (USD)', 'Won value (USD)'],
      products.map((p) => [p.product, p.deals, p.approved, p.won, p.totalValue, p.wonValue]),
    );
    toast('Exported the product breakdown to CSV');
  };
  const exportFunnel = (): void => {
    downloadCsv(
      `pipeline-funnel-${range.from}-to-${range.to}.csv`,
      ['Step', 'Deals', 'Share of', 'Conversion'],
      funnel.map((s) => [s.label, s.count, s.from, s.conversion === null ? '' : `${Math.round(s.conversion * 100)}%`]),
    );
    toast('Exported the funnel to CSV');
  };

  return (
    <>
      <div className="dash-c12" style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <nav className="seg" aria-label="Date range">
          {REPORT_PRESETS.filter((p) => p !== 'custom').map((p) => (
            <Link
              key={p}
              href={href(p)}
              className={`seg-b${p === range.preset ? ' seg-on' : ''}`}
              aria-current={p === range.preset ? 'true' : undefined}
              data-hint={REPORT_PRESET_LABEL[p]}
              style={{ display: 'inline-flex', alignItems: 'center' }}
            >
              {SHORT[p]}
            </Link>
          ))}
          <button
            type="button"
            className={`seg-b${customOpen ? ' seg-on' : ''}`}
            aria-expanded={showCustom}
            aria-current={customOpen ? 'true' : undefined}
            onClick={() => setShowCustom((v) => !v)}
          >
            Custom
          </button>
        </nav>
        {showCustom ? (
          <form noValidate
            style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}
            onSubmit={(e) => {
              e.preventDefault();
              if (customValid) router.replace(`${pathname}${reportRangeQuery({ preset: 'custom', from, to })}`);
            }}
          >
            <label className="sr" htmlFor="rg-from">From</label>
            <DatePicker id="rg-from" variant="fsel" placeholder="From" value={from} max={to || undefined} onChange={setFrom} />
            <span className="t-sec">to</span>
            <label className="sr" htmlFor="rg-to">To</label>
            <DatePicker id="rg-to" variant="fsel" placeholder="To" value={to} min={from || undefined} onChange={setTo} />
            <button type="submit" className="btn btn-s" disabled={!customValid}>
              Apply
            </button>
          </form>
        ) : null}
        <span className="t-sec tnum" style={{ fontSize: 12 }}>
          Deals registered {fmtLong(range.from)} to {fmtLong(range.to)}
        </span>
      </div>

      <section aria-label="Value and win rate" className="card kpis dash-c12">
        <div className="kpi">
          <span className="kpi-l">Total deal value</span>
          <span className="kpi-v tnum">{formatUsd(summary.totalValue)}</span>
          <span className="kpi-f">
            {plural(summary.deals, 'deal')}
            {summary.unvalued > 0 ? `, ${summary.unvalued} without a USD value` : ''}
          </span>
        </div>
        <div className="kpi">
          <span className="kpi-l">Average deal value</span>
          <span className="kpi-v tnum">{usd(summary.averageValue)}</span>
          <span className="kpi-f">Deals with a USD value</span>
        </div>
        <div className="kpi">
          <span className="kpi-l">Won value</span>
          <span className="kpi-v tnum">{formatUsd(summary.wonValue)}</span>
          <span className="kpi-f">{plural(summary.won, 'won deal')}</span>
        </div>
        <div className="kpi">
          <span className="kpi-l">Win rate</span>
          <span className="kpi-v tnum">{pct(summary.winRate)}</span>
          <span className="kpi-f">{summary.won + summary.lost === 0 ? 'Nothing closed yet' : `${summary.won} won, ${summary.lost} lost`}</span>
        </div>
      </section>

      <section aria-labelledby="rf" className="card clip dash-c6">
        <div className="card-h">
          <h2 id="rf" className="card-t">
            Pipeline funnel
          </h2>
          <button type="button" className="btn btn-s" onClick={exportFunnel}>
            Export CSV
          </button>
        </div>
        {summary.deals === 0 ? (
          <div className="empty">No deals were registered in this range.</div>
        ) : (
          <>
            <div>
              <Funnel
                title="Funnel"
                description="Deals registered in the range, how many were approved and how many were won."
                stages={funnel.filter((s) => s.key !== 'lost').map((s) => ({ label: s.label, value: s.count }))}
                format={(n) => String(Math.round(n))}
              />
            </div>
          </>
        )}
      </section>

      <section aria-labelledby="rp" className="card clip dash-c6">
        <div className="card-h">
          <h2 id="rp" className="card-t">
            By product
          </h2>
          <button type="button" className="btn btn-s" onClick={exportProducts}>
            Export CSV
          </button>
        </div>
        <ScrollRegion label="Product breakdown">
          <table className="tbl">
            <thead>
              <tr>
                <th scope="col">Product</th>
                <th scope="col" className="r">
                  Deals
                </th>
                <th scope="col" className="r hide-sm">
                  Approved
                </th>
                <th scope="col" className="r">
                  Won
                </th>
                <th scope="col" className="r hide-sm">
                  Total value
                </th>
                <th scope="col" className="r">
                  Won value
                </th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.product}>
                  <td>
                    <ProductChip product={CHIP_PRODUCT[p.product]} />
                  </td>
                  <td className="tnum r">{p.deals}</td>
                  <td className="tnum r hide-sm">{p.approved}</td>
                  <td className="tnum r">{p.won}</td>
                  <td className="tnum r hide-sm">{formatUsd(p.totalValue)}</td>
                  <td className="tnum r">{formatUsd(p.wonValue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </ScrollRegion>
      </section>

      <section aria-labelledby="rl" className="card clip dash-c12">
        <div className="card-h">
          <h2 id="rl" className="card-t">
            Partner leaderboard
          </h2>
          <button type="button" className="btn btn-s" onClick={exportLeaderboard} disabled={leaderboard.length === 0}>
            Export CSV
          </button>
        </div>
        <ScrollRegion label="Partner leaderboard">
          <table className="tbl">
            <thead>
              <tr>
                <th scope="col">Partner</th>
                <th scope="col" className="r">
                  Deals
                </th>
                <th scope="col" className="r">
                  Won
                </th>
                <th scope="col" className="r">
                  Won value
                </th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.map((r) => (
                <tr key={r.partnerId}>
                  <td>
                    <Link href={`${ROUTES.admin.partners}?selected=${r.partnerId}`} className="cust">
                      {r.name}
                    </Link>
                  </td>
                  <td className="tnum r">{r.deals}</td>
                  <td className="tnum r">{r.won}</td>
                  <td className="tnum r">{formatUsd(r.wonValue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {leaderboard.length === 0 ? <div className="empty">No deals were registered in this range.</div> : null}
        </ScrollRegion>
      </section>
    </>
  );
}
