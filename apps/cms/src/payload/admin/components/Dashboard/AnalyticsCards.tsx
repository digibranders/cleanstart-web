import type { BasePayload } from 'payload';
import type { ReactElement, ReactNode } from 'react';

import { TTL_MS, isStale, readCache, type CachedProvider } from '../../../lib/integrations/cache';

/**
 * Phase J2 L1 dashboard cards. Server-rendered alongside the existing
 * pulse + recent edits. Every card reads from `analyticsCache` — never
 * makes a live API call from the request path. When a provider has no
 * cached entry it's treated as "not connected" and collapses into a
 * compact "Connect analytics" strip below the configured cards, so the
 * grid doesn't bloat with four empty placeholders.
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
  capturedAt: string;
  stale: boolean;
  children: ReactNode;
}

const Card = ({ title, capturedAt, stale, children }: CardProps): ReactElement => (
  <div className="cs-dashboard__analytics-bar">
    <div className="cs-dashboard__analytics-bar-head">
      <h3 className="cs-dashboard__analytics-title">{title}</h3>
      <span
        className={`cs-dashboard__analytics-meta${stale ? ' cs-dashboard__analytics-meta--stale' : ''}`}
        title={new Date(capturedAt).toLocaleString()}
      >
        {stale ? '· stale ·' : 'fresh'}
      </span>
    </div>
    <div className="cs-dashboard__analytics-bar-body">{children}</div>
  </div>
);

interface CardResult {
  kind: string;
  label: string;
  configured: boolean;
  element: ReactElement | null;
}

const renderGa4 = async (payload: BasePayload): Promise<CardResult> => {
  const entry = await readCache<Ga4Cached>(
    payload,
    'ga4DataApi' as CachedProvider,
    'global',
    'default',
  );
  if (!entry) return { kind: 'ga4DataApi', label: 'GA4', configured: false, element: null };
  return {
    kind: 'ga4DataApi',
    label: 'GA4',
    configured: true,
    element: (
      <Card title="GA4 · sessions (28d)" capturedAt={entry.capturedAt} stale={isStale(entry, TTL_MS.ga4DataApi)}>
        <dl className="cs-dashboard__analytics-grid">
          <div>
            <dt>Sessions</dt>
            <dd>{fmt(entry.payload?.sessions)}</dd>
          </div>
          <div>
            <dt>Users</dt>
            <dd>{fmt(entry.payload?.totalUsers)}</dd>
          </div>
          <div>
            <dt>Engagement</dt>
            <dd>{fmtPct(entry.payload?.engagementRate)}</dd>
          </div>
          <div>
            <dt>Conversions</dt>
            <dd>{fmt(entry.payload?.conversions)}</dd>
          </div>
        </dl>
      </Card>
    ),
  };
};

const renderGsc = async (payload: BasePayload): Promise<CardResult> => {
  const entry = await readCache<GscCached>(
    payload,
    'gscSearchAnalyticsApi' as CachedProvider,
    'global',
    'default',
  );
  if (!entry) return { kind: 'gscSearchAnalyticsApi', label: 'GSC', configured: false, element: null };
  return {
    kind: 'gscSearchAnalyticsApi',
    label: 'GSC',
    configured: true,
    element: (
      <Card title="GSC · clicks (28d)" capturedAt={entry.capturedAt} stale={isStale(entry, TTL_MS.gscSearchAnalyticsApi)}>
        <dl className="cs-dashboard__analytics-grid">
          <div>
            <dt>Clicks</dt>
            <dd>{fmt(entry.payload?.totals?.clicks)}</dd>
          </div>
          <div>
            <dt>Impressions</dt>
            <dd>{fmt(entry.payload?.totals?.impressions)}</dd>
          </div>
          <div>
            <dt>CTR</dt>
            <dd>{fmtPct(entry.payload?.totals?.ctr)}</dd>
          </div>
        </dl>
      </Card>
    ),
  };
};

const renderClarity = async (payload: BasePayload): Promise<CardResult> => {
  const entry = await readCache<ClarityCached>(
    payload,
    'msClarity' as CachedProvider,
    'global',
    'default',
  );
  if (!entry) return { kind: 'msClarity', label: 'Clarity', configured: false, element: null };
  const worst = entry.payload?.worstByDeadClicks?.[0];
  return {
    kind: 'msClarity',
    label: 'Clarity',
    configured: true,
    element: (
      <Card title="Clarity · worst pages (3d)" capturedAt={entry.capturedAt} stale={isStale(entry, TTL_MS.msClarity)}>
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
    ),
  };
};

const renderCfWa = async (payload: BasePayload): Promise<CardResult> => {
  const entry = await readCache<CfWaCached>(
    payload,
    'cloudflareWebAnalytics' as CachedProvider,
    'global',
    'default',
  );
  if (!entry) return { kind: 'cloudflareWebAnalytics', label: 'Cloudflare', configured: false, element: null };
  const top = entry.payload?.topCountries?.[0];
  return {
    kind: 'cloudflareWebAnalytics',
    label: 'Cloudflare',
    configured: true,
    element: (
      <Card title="Cloudflare · pageviews (7d)" capturedAt={entry.capturedAt} stale={isStale(entry, TTL_MS.cloudflareWebAnalytics)}>
        <dl className="cs-dashboard__analytics-grid">
          <div>
            <dt>Pageviews</dt>
            <dd>{fmt(entry.payload?.pageviews)}</dd>
          </div>
          <div>
            <dt>Visits</dt>
            <dd>{fmt(entry.payload?.visits)}</dd>
          </div>
          <div>
            <dt>Top country</dt>
            <dd>{top ? `${top.country} (${fmt(top.pageviews)})` : '—'}</dd>
          </div>
        </dl>
      </Card>
    ),
  };
};

export const AnalyticsCards = async ({
  payload,
}: {
  payload: BasePayload;
}): Promise<ReactElement> => {
  const results = await Promise.all([
    renderGa4(payload),
    renderGsc(payload),
    renderClarity(payload),
    renderCfWa(payload),
  ]);
  const configured = results.filter((r) => r.configured);
  const unconfigured = results.filter((r) => !r.configured);

  return (
    <section aria-label="Analytics snapshot" className="cs-dashboard__analytics">
      <div className="cs-dashboard__section-head">
        <h2 className="cs-dashboard__section-title">Analytics snapshot</h2>
        {configured.length > 0 ? (
          <a className="cs-dashboard__section-link" href="/admin/analytics">
            View full analytics →
          </a>
        ) : null}
      </div>
      {configured.length > 0 ? (
        <div className="cs-dashboard__analytics-bars">
          {configured.map((r) => (
            <span key={r.kind}>{r.element}</span>
          ))}
        </div>
      ) : null}
      {unconfigured.length > 0 ? (
        <a
          className="cs-dashboard__analytics-connect"
          href="/admin/collections/integrations"
          aria-label={`Connect analytics integrations: ${unconfigured.map((r) => r.label).join(', ')}`}
        >
          <span className="cs-dashboard__analytics-connect-label">
            {configured.length > 0 ? 'Connect more analytics' : 'Connect analytics'}
          </span>
          <span className="cs-dashboard__analytics-connect-chips">
            {unconfigured.map((r) => (
              <span key={r.kind} className="cs-dashboard__analytics-chip">
                {r.label}
              </span>
            ))}
          </span>
          <span className="cs-dashboard__analytics-connect-arrow" aria-hidden="true">
            →
          </span>
        </a>
      ) : null}
    </section>
  );
};

export default AnalyticsCards;
