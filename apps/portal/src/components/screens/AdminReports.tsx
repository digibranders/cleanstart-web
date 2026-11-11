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
import { ROUTES } from '@/lib/routes';
import {
  CATEGORIES,
  filterPartnerRows,
  partnersToCsv,
  REGIONS,
  SORTS,
  TOTAL_PARTNERS,
  type ReportSort,
} from '@/data/reports';

export function AdminReports(): React.JSX.Element {
  const toast = useToast();
  const [region, setRegion] = useState<string>('All regions');
  const [category, setCategory] = useState<string>('All partner categories');
  const [sort, setSort] = useState<ReportSort>('Most registered');

  const rows = useMemo(() => filterPartnerRows(region, category, sort), [region, category, sort]);

  const exportCsv = (): void => {
    downloadCsv('partner-report-q4-2026.csv', partnersToCsv(rows));
    toast(`Exported ${rows.length} partners to CSV`);
  };

  return (
    <div className="wrap">
      <div className="head">
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
          <h1 className="h1">Reports</h1>
          <span className="h1-sub">Q4 2026 so far, 1 Oct to 6 Nov.</span>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button type="button" className="btn btn-s" onClick={exportCsv}>
            <Icon name="dl" />
            Export CSV
          </button>
        </div>
      </div>

      <section aria-label="Quarter summary" className="card kpis" data-tour="reports-kpis">
        <div className="kpi">
          <span className="kpi-l">Registered</span>
          <span className="kpi-v">46</span>
          <span className="kpi-f">From 15 partners</span>
        </div>
        <div className="kpi">
          <span className="kpi-l">Accepted</span>
          <span className="kpi-v">36</span>
          <span className="kpi-f">86% accept rate, 6 rejected</span>
        </div>
        <div className="kpi">
          <span className="kpi-l">Won</span>
          <span className="kpi-v">11</span>
          <span className="kpi-f">Closed won in HubSpot</span>
        </div>
        <div className="kpi">
          <span className="kpi-l">Protected now</span>
          <span className="kpi-v">38</span>
          <span className="kpi-f">5 end in the next 14 days</span>
        </div>
      </section>

      <section aria-labelledby="pbp" className="card clip" data-tour="reports-partners">
        <div className="card-h">
          <h2 id="pbp" className="card-t">
            Pipeline by partner
          </h2>
          <span className="card-meta tnum">
            Showing {rows.length} of {TOTAL_PARTNERS} partners
          </span>
        </div>
        <div className="toolbar">
          <div className="filters">
            <label className="sr" htmlFor="rr">
              Region
            </label>
            <Dropdown id="rr" value={region} options={REGIONS} onChange={setRegion} />
            <label className="sr" htmlFor="rc">
              Partner category
            </label>
            <Dropdown id="rc" value={category} options={CATEGORIES} onChange={setCategory} />
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
                <tr key={p.name}>
                  <td>
                    <Link href={ROUTES.admin.partners} className="cust">
                      <span className={`av ${avatarClass(i)}`}>{initialsOf(p.name)}</span>
                      {p.name}
                    </Link>
                  </td>
                  <td>
                    <span className={`badge ${CATEGORY_BADGE[p.category]}`}>{p.category}</span>
                  </td>
                  <td className="t-sec">{p.region}</td>
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
                  setRegion('All regions');
                  setCategory('All partner categories');
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
        <ProductBreakdown />
        <FollowUpList />
      </div>
    </div>
  );
}
