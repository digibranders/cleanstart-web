import type { Payload } from 'payload';
import type { ReactElement, ReactNode } from 'react';

import { TTL_MS, isStale, readCache, type CachedProvider } from '../../../lib/integrations/cache';

/**
 * Phase J2 L1 dashboard cards. Server-rendered alongside the existing
 * pulse + recent edits. Every card reads from `analyticsCache` — never
 * makes a live API call from the request path. On cache miss the card
 * renders an empty-state hint pointing the editor at the Integrations
 * collection.
 */

interface Ga4Cached {
  sessions?: number;
  totalUsers?: number;
  engagementRate?: number;
  conversions?: number;
}

interface GscCached {
  totals?: { clicks?: number; impressions?: number; ctr?: number };
}

interface ClarityCached {
  worstByDeadClicks?: Array<{ url: string; deadClicks?: number }>;
}

interface CfWaCached {
  pageviews?: number;
  visits?: number;
  topCountries?: Array<{ country: string; pageviews: number }>;
}

const fmt = (n: number | undefined): string =>
  (n ?? 0).toLocaleString();

const fmtPct = (n: number | undefined): string =>
  typeof n === 'number' ? `${Math.round(n * 100)}%` : '—';

interface CardProps {
  title: string;
  capturedAt?: string | undefined;
  stale?: boolean | undefined;
  emptyState: string;
  children: ReactNode;
  href?: string | undefined;
}

const Card = ({ title, capturedAt, stale, emptyState, children, href }: CardProps): ReactElement => {
  const inner = (
    <>
      <div className="cs-dashboard__analytics-head">
        <h3 className="cs-dashboard__analytics-title">{title}</h3>
        {capturedAt ? (
          <span
            className={`cs-dashboard__analytics-meta${stale ? ' cs-dashboard__analytics-meta--stale' : ''}`}
            title={new Date(capturedAt).toLocaleString()}
          >
            {stale ? '· stale ·' : 'fresh'}
          </span>
        ) : null}
      </div>
      <div className="cs-dashboard__analytics-body">
        {capturedAt ? children : (
          <p className="cs-dashboard__analytics-empty">{emptyState}</p>
        )}
      </div>
    </>
  );
  const className = 'cs-dashboard__analytics-card';
  return href ? <a className={className} href={href}>{inner}</a> : <div className={className}>{inner}</div>;
};

const renderGa4 = async (payload: Payload): Promise<ReactElement> => {
  const entry = await readCache<Ga4Cached>(
    payload as unknown as Parameters<typeof readCache>[0],
    'ga4DataApi' as CachedProvider,
    'global',
    'default',
  );
  const stale = entry ? isStale(entry, TTL_MS.ga4DataApi) : false;
  return (
    <Card
      title="GA4 · sessions (28d)"
      capturedAt={entry?.capturedAt}
      stale={stale}
      emptyState="Add a GA4 integration row to enable."
    >
      <dl className="cs-dashboard__analytics-grid">
        <div>
          <dt>Sessions</dt>
          <dd>{fmt(entry?.payload?.sessions)}</dd>
        </div>
        <div>
          <dt>Users</dt>
          <dd>{fmt(entry?.payload?.totalUsers)}</dd>
        </div>
        <div>
          <dt>Engagement</dt>
          <dd>{fmtPct(entry?.payload?.engagementRate)}</dd>
        </div>
        <div>
          <dt>Conversions</dt>
          <dd>{fmt(entry?.payload?.conversions)}</dd>
        </div>
      </dl>
    </Card>
  );
};

const renderGsc = async (payload: Payload): Promise<ReactElement> => {
  const entry = await readCache<GscCached>(
    payload as unknown as Parameters<typeof readCache>[0],
    'gscSearchAnalyticsApi' as CachedProvider,
    'global',
    'default',
  );
  const stale = entry ? isStale(entry, TTL_MS.gscSearchAnalyticsApi) : false;
  return (
    <Card
      title="GSC · clicks (28d)"
      capturedAt={entry?.capturedAt}
      stale={stale}
      emptyState="Add a GSC Search Analytics integration row to enable."
    >
      <dl className="cs-dashboard__analytics-grid">
        <div>
          <dt>Clicks</dt>
          <dd>{fmt(entry?.payload?.totals?.clicks)}</dd>
        </div>
        <div>
          <dt>Impressions</dt>
          <dd>{fmt(entry?.payload?.totals?.impressions)}</dd>
        </div>
        <div>
          <dt>CTR</dt>
          <dd>{fmtPct(entry?.payload?.totals?.ctr)}</dd>
        </div>
      </dl>
    </Card>
  );
};

const renderClarity = async (payload: Payload): Promise<ReactElement> => {
  const entry = await readCache<ClarityCached>(
    payload as unknown as Parameters<typeof readCache>[0],
    'msClarity' as CachedProvider,
    'global',
    'default',
  );
  const stale = entry ? isStale(entry, TTL_MS.msClarity) : false;
  const worst = entry?.payload?.worstByDeadClicks?.[0];
  return (
    <Card
      title="Clarity · worst pages (3d)"
      capturedAt={entry?.capturedAt}
      stale={stale}
      emptyState="Add an MS Clarity integration row to enable."
    >
      {worst ? (
        <dl className="cs-dashboard__analytics-grid">
          <div>
            <dt>Top page</dt>
            <dd className="cs-dashboard__analytics-url">{worst.url}</dd>
          </div>
          <div>
            <dt>Dead clicks</dt>
            <dd>{fmt(worst.deadClicks)}</dd>
          </div>
        </dl>
      ) : (
        <p className="cs-dashboard__analytics-empty">No dead-click activity in the last 3 days.</p>
      )}
    </Card>
  );
};

const renderCfWa = async (payload: Payload): Promise<ReactElement> => {
  const entry = await readCache<CfWaCached>(
    payload as unknown as Parameters<typeof readCache>[0],
    'cloudflareWebAnalytics' as CachedProvider,
    'global',
    'default',
  );
  const stale = entry ? isStale(entry, TTL_MS.cloudflareWebAnalytics) : false;
  const top = entry?.payload?.topCountries?.[0];
  return (
    <Card
      title="Cloudflare · pageviews (7d)"
      capturedAt={entry?.capturedAt}
      stale={stale}
      emptyState="Add a Cloudflare Web Analytics integration row to enable."
    >
      <dl className="cs-dashboard__analytics-grid">
        <div>
          <dt>Pageviews</dt>
          <dd>{fmt(entry?.payload?.pageviews)}</dd>
        </div>
        <div>
          <dt>Visits</dt>
          <dd>{fmt(entry?.payload?.visits)}</dd>
        </div>
        <div>
          <dt>Top country</dt>
          <dd>{top ? `${top.country} (${fmt(top.pageviews)})` : '—'}</dd>
        </div>
      </dl>
    </Card>
  );
};

export const AnalyticsCards = async ({
  payload,
}: {
  payload: Payload;
}): Promise<ReactElement> => {
  const [ga4, gsc, clarity, cfwa] = await Promise.all([
    renderGa4(payload),
    renderGsc(payload),
    renderClarity(payload),
    renderCfWa(payload),
  ]);
  return (
    <section aria-label="Analytics snapshot" className="cs-dashboard__analytics">
      <div className="cs-dashboard__section-head">
        <h2 className="cs-dashboard__section-title">Analytics snapshot</h2>
        <a className="cs-dashboard__section-link" href="/admin/collections/integrations">
          Manage integrations →
        </a>
      </div>
      <div className="cs-dashboard__analytics-grid-cards">
        {ga4}
        {gsc}
        {clarity}
        {cfwa}
      </div>
    </section>
  );
};

export default AnalyticsCards;
