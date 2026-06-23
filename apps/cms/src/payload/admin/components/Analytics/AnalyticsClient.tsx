'use client';

import { useEffect, useState } from 'react';
import type { ReactElement } from 'react';

import type { Ga4OverviewPayload, OverviewFilters } from '../../../lib/dashboards/overview-types';
import { CountryBars } from './CountryBars';
import { FilterBar } from './FilterBar';
import { KpiCards } from './KpiCards';
import { TopList } from './TopList';
import { TrendChart } from './TrendChart';

const pct = (n: number): string => `${Math.round(n * 100)}%`;
const fmt = (n: number): string => n.toLocaleString();

type LoadState = 'loading' | 'ready' | 'unconfigured' | 'error';

export function AnalyticsClient(): ReactElement {
  const [filters, setFilters] = useState<OverviewFilters>({ window: '28d', country: null, collection: null });
  const [data, setData] = useState<Ga4OverviewPayload | null>(null);
  const [state, setState] = useState<LoadState>('loading');

  useEffect(() => {
    let cancelled = false;
    setState('loading');
    const qs = new URLSearchParams({ window: filters.window });
    if (filters.country) qs.set('country', filters.country);
    if (filters.collection) qs.set('collection', filters.collection);
    fetch(`/api/dashboards/ga4-overview?${qs.toString()}`, { credentials: 'include' })
      .then((r) => r.json())
      .then((j) => {
        if (cancelled) return;
        if (!j.ok) {
          setState('error');
          return;
        }
        if (!j.configured) {
          setState('unconfigured');
          return;
        }
        setData(j.payload as Ga4OverviewPayload);
        setState('ready');
      })
      .catch(() => {
        if (!cancelled) setState('error');
      });
    return () => {
      cancelled = true;
    };
  }, [filters]);

  return (
    <div className="cs-analytics">
      <header className="cs-analytics__head">
        <h1>Analytics</h1>
      </header>
      <FilterBar
        filters={filters}
        countries={(data?.topCountries ?? []).map((c) => c.country)}
        onChange={setFilters}
      />
      {state === 'unconfigured' && (
        <div className="cs-analytics__empty">
          GA4 is not connected. Add a Google Analytics 4 integration row to see data here.
        </div>
      )}
      {state === 'error' && <div className="cs-analytics__empty">Couldn’t load analytics. Try again shortly.</div>}
      {state === 'loading' && <div className="cs-analytics__empty">Loading…</div>}
      {state === 'ready' && data && (
        <>
          <KpiCards
            items={[
              { label: 'Sessions', value: fmt(data.totals.sessions) },
              { label: 'Users', value: fmt(data.totals.totalUsers) },
              { label: 'Engagement', value: pct(data.totals.engagementRate) },
              {
                label: 'Key events',
                value: data.totals.conversions ? fmt(data.totals.conversions) : '—',
                muted: !data.totals.conversions,
              },
            ]}
          />
          <div className="cs-analytics__panel">
            <h3>Sessions · last {data.daily.length} days</h3>
            <TrendChart daily={data.daily} />
          </div>
          <div className="cs-analytics__cols">
            <TopList
              title="Top pages"
              columns={[
                { key: 'path', label: 'Page' },
                { key: 'sessions', label: 'Sess.', align: 'right' },
                { key: 'views', label: 'Views', align: 'right' },
              ]}
              rows={data.topPages.map((p) => ({ path: p.path, sessions: fmt(p.sessions), views: fmt(p.views) }))}
            />
            <div className="cs-analytics__panel">
              <h3>Top countries</h3>
              <CountryBars rows={data.topCountries} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default AnalyticsClient;
