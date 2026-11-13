'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { Icon } from '@/components/icon';
import { FollowUpList } from '@/components/reports/FollowUpList';
import { ProductBreakdown } from '@/components/reports/ProductBreakdown';
import { downloadCsv } from '@/components/reports/download-csv';
import { avatarClass, CATEGORY_BADGE, initialsOf } from '@/components/reports/partner-ui';
import { Dropdown } from '@/components/ui/dropdown';
import { useToast } from '@/components/ui/toast';
import { fmtLong } from '@/lib/dates';
import { PARTNER_CATEGORY_LABEL, PARTNER_REGION_LABEL } from '@/lib/domain';
import type { AdminReportsDto } from '@/lib/dto';
import {
  acceptRate,
  CATEGORY_OPTIONS,
  filterPartnerRows,
  partnersToCsv,
  REGION_OPTIONS,
  SORTS,
  type ReportSort,
} from '@/lib/report-view';
import { ROUTES } from '@/lib/routes';

interface AdminReportsProps {
  report: AdminReportsDto;
  today: string;
}

export function AdminReports({ report, today }: AdminReportsProps): React.JSX.Element {
  const toast = useToast();
  const [region, setRegion] = useState<string>('all');
  const [category, setCategory] = useState<string>('all');
  const [sort, setSort] = useState<ReportSort>('Most registered');

  const rows = useMemo(
    () => filterPartnerRows(report.partners, region, category, sort),
    [report.partners, region, category, sort],
  );
  const sum = (pick: (p: AdminReportsDto['partners'][number]) => number): number =>
    report.partners.reduce((n, p) => n + pick(p), 0);
  const accepted = sum((p) => p.accepted);
  const rejected = sum((p) => p.rejected);
  const rate = acceptRate(accepted, rejected);

  const exportCsv = (): void => {
    downloadCsv(`partner-report-${today}.csv`, partnersToCsv(rows));
    toast(`Exported ${rows.length} partners to CSV`);
  };

  return (
    <div className="wrap">
      <div className="head">
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
          <h1 className="h1">Reports</h1>
          <span className="h1-sub">All time, up to {fmtLong(today)}.</span>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button type="button" className="btn btn-s" onClick={exportCsv}>
            <Icon name="dl" />
            Export CSV
          </button>
        </div>
      </div>

      <section aria-label="Quarter summary" className="card kpis">
        <div className="kpi">
          <span className="kpi-l">Registered</span>
          <span className="kpi-v">{report.totalRegistered}</span>
          <span className="kpi-f">From {report.partners.filter((p) => p.registered > 0).length} partners</span>
        </div>
        <div className="kpi">
          <span className="kpi-l">Accepted</span>
          <span className="kpi-v">{accepted}</span>
          <span className="kpi-f">{rate === null ? 'No decisions yet' : `${rate}% accept rate, ${rejected} rejected`}</span>
        </div>
        <div className="kpi">
          <span className="kpi-l">Won</span>
          <span className="kpi-v">{sum((p) => p.won)}</span>
          <span className="kpi-f">Closed won in HubSpot</span>
        </div>
        <div className="kpi">
          <span className="kpi-l">Protected now</span>
          <span className="kpi-v">{sum((p) => p.protectedNow)}</span>
          <span className="kpi-f">{report.expiringIn14Days} end in the next 14 days</span>
        </div>
      </section>

      <section aria-labelledby="pbp" className="card clip">
        <div className="card-h">
          <h2 id="pbp" className="card-t">
            Pipeline by partner
          </h2>
          <span className="card-meta tnum">
            Showing {rows.length} of {report.totalPartners} partners
          </span>
        </div>
        <div className="toolbar">
          <div className="filters">
            <label className="sr" htmlFor="rr">
              Region
            </label>
            <Dropdown id="rr" value={region} options={REGION_OPTIONS} onChange={setRegion} />
            <label className="sr" htmlFor="rc">
              Partner category
            </label>
            <Dropdown id="rc" value={category} options={CATEGORY_OPTIONS} onChange={setCategory} />
            <label className="sr" htmlFor="rs">
              Sort
            </label>
            <Dropdown
              id="rs"
              value={sort}
              options={SORTS}
              onChange={(v) => setSort(v as ReportSort)}
            />
          </div>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className="tbl">
            <thead>
              <tr>
                <th scope="col">Partner</th>
                <th scope="col">Category</th>
                <th scope="col">Region</th>
                <th scope="col" className="r">
                  Registered
                </th>
                <th scope="col" className="r">
                  Accepted
                </th>
                <th scope="col" className="r">
                  Accept rate
                </th>
                <th scope="col" className="r">
                  Won
                </th>
                <th scope="col" className="r">
                  Protected now
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((p, i) => (
                <tr key={p.partnerId}>
                  <td>
                    <Link href={ROUTES.admin.partners} className="cust">
                      <span className={`av ${avatarClass(i)}`}>{initialsOf(p.name)}</span>
                      {p.name}
                    </Link>
                  </td>
                  <td>
                    <span className={`badge ${CATEGORY_BADGE[p.category]}`}>{PARTNER_CATEGORY_LABEL[p.category]}</span>
                  </td>
                  <td className="t-sec">{PARTNER_REGION_LABEL[p.region]}</td>
                  <td className="tnum r">{p.registered}</td>
                  <td className="tnum r">{p.accepted}</td>
                  <td
                    className={`tnum r ${p.rate === null ? 't-muted' : p.rate < 60 ? 't-amber' : ''}`}
                  >
                    {p.rate === null ? 'None yet' : `${p.rate}%`}
                  </td>
                  <td className="tnum r">{p.won}</td>
                  <td className="tnum r">{p.protectedNow}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {rows.length === 0 ? (
            <div className="empty">
              No partners match these filters.{' '}
              <button
                type="button"
                className="btn btn-g"
                onClick={() => {
                  setRegion('all');
                  setCategory('all');
                }}
                style={{ height: 24, padding: '0 6px', fontSize: 12 }}
              >
                Clear filters
              </button>
            </div>
          ) : null}
        </div>
      </section>

      <div className="row">
        <ProductBreakdown rows={report.products} total={report.totalRegistered} />
        <FollowUpList items={report.followUps} />
      </div>
    </div>
  );
}
