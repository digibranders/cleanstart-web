'use client';

import { useEffect, useState } from 'react';
import type { ReactElement } from 'react';

import type {
  Ga4OverviewPayload,
  GscOverviewPayload,
  OverviewFilters,
} from '../../../lib/dashboards/overview-types';
import { CountryBars } from './CountryBars';
import { CtrScatter } from './CtrScatter';
import { FilterBar } from './FilterBar';
import { KpiCards } from './KpiCards';
import { PositionHistogram } from './PositionHistogram';
import { Sparkline } from './Sparkline';
import { Split } from './Split';
import { TopList } from './TopList';
import { TrendChart } from './TrendChart';

const pct = (n: number): string => `${Math.round(n * 100)}%`;
const fmt = (n: number): string => Math.round(n).toLocaleString();

type LoadState = 'loading' | 'ready' | 'unconfigured' | 'error';

export function AnalyticsClient(): ReactElement {
  const [filters, setFilters] = useState<OverviewFilters>({ window: '28d', country: null, collection: null });
  const [data, setData] = useState<Ga4OverviewPayload | null>(null);
  const [state, setState] = useState<LoadState>('loading');
  const [gsc, setGsc] = useState<GscOverviewPayload | null>(null);
  const [gscState, setGscState] = useState<LoadState>('loading');

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

  useEffect(() => {
    let cancelled = false;
    setGscState('loading');
    fetch(`/api/dashboards/gsc-overview?window=${filters.window}`, { credentials: 'include' })
      .then((r) => r.json())
      .then((j) => {
        if (cancelled) return;
        if (!j.ok) {
          setGscState('error');
          return;
        }
        if (!j.configured) {
          setGscState('unconfigured');
          return;
        }
        setGsc(j.payload as GscOverviewPayload);
        setGscState('ready');
      })
      .catch(() => {
        if (!cancelled) setGscState('error');
      });
    return () => {
      cancelled = true;
    };
  }, [filters.window]);

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
      {state === 'error' && <div className="cs-analytics__empty">Couldn’t load GA4 analytics. Try again shortly.</div>}
      {state === 'loading' && <div className="cs-analytics__empty">Loading…</div>}
      {state === 'ready' && data && (
        <>
          <KpiCards
            items={[
              { label: 'Sessions', value: fmt(data.totals.sessions), deltaPct: data.deltas?.sessions.deltaPct ?? null },
              { label: 'Users', value: fmt(data.totals.totalUsers), deltaPct: data.deltas?.totalUsers.deltaPct ?? null },
              {
                label: 'Engagement',
                value: pct(data.totals.engagementRate),
                deltaPct: data.deltas?.engagementRate.deltaPct ?? null,
              },
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
                { key: 'trend', label: 'Trend', width: '96px' },
                { key: 'sessions', label: 'Sess.', align: 'right' },
                { key: 'views', label: 'Views', align: 'right' },
              ]}
              rows={data.topPages.map((p) => ({
                path: p.path,
                trend: <Sparkline daily={p.daily} />,
                sessions: fmt(p.sessions),
                views: fmt(p.views),
              }))}
            />
            <div className="cs-analytics__panel">
              <h3>Top countries</h3>
              <CountryBars rows={data.topCountries} />
            </div>
          </div>
          {(data.channels?.length || data.devices?.length || data.sources?.length) && (
            <div className="cs-analytics__cols">
              <Split title="Channels" rows={data.channels ?? []} />
              <Split title="Devices" rows={data.devices ?? []} />
              <Split title="Sources" rows={data.sources ?? []} />
            </div>
          )}
        </>
      )}

      <header className="cs-analytics__head">
        <h2>Search · Google Search Console</h2>
      </header>
      {gscState === 'unconfigured' && (
        <a className="cs-analytics__empty" href="/admin/collections/integrations">
          Connect Search Console — add a GSC integration row to see clicks, impressions, and top queries here. →
        </a>
      )}
      {gscState === 'error' && <div className="cs-analytics__empty">Couldn’t load Search Console data.</div>}
      {gscState === 'ready' && gsc && (
        <>
          <KpiCards
            items={[
              { label: 'Clicks', value: fmt(gsc.totals.clicks), deltaPct: gsc.deltas?.clicks.deltaPct ?? null },
              { label: 'Impressions', value: fmt(gsc.totals.impressions), deltaPct: gsc.deltas?.impressions.deltaPct ?? null },
              { label: 'CTR', value: pct(gsc.totals.ctr), deltaPct: gsc.deltas?.ctr.deltaPct ?? null },
              { label: 'Avg position', value: gsc.totals.position.toFixed(1) },
            ]}
          />
          <div className="cs-analytics__cols">
            <div className="cs-analytics__panel">
              <h3>Query position distribution</h3>
              <PositionHistogram buckets={gsc.positionBuckets ?? []} />
            </div>
            <div className="cs-analytics__panel">
              <h3>CTR vs position</h3>
              <CtrScatter points={gsc.scatter ?? []} />
            </div>
          </div>
          <TopList
            title="Top search queries"
            columns={[
              { key: 'query', label: 'Query' },
              { key: 'clicks', label: 'Clicks', align: 'right' },
              { key: 'ctr', label: 'CTR', align: 'right' },
              { key: 'position', label: 'Pos.', align: 'right' },
            ]}
            rows={gsc.topQueries.map((q) => ({
              query: q.query,
              clicks: fmt(q.clicks),
              ctr: pct(q.ctr),
              position: q.position.toFixed(1),
            }))}
          />
        </>
      )}
    </div>
  );
}

export default AnalyticsClient;
