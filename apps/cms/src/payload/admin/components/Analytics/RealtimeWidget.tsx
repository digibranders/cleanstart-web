'use client';

import { useEffect, useState } from 'react';
import type { ReactElement } from 'react';

import type { RealtimePayload } from '../../../lib/dashboards/overview-types';

const POLL_MS = 60_000;

export function RealtimeWidget(): ReactElement | null {
  const [data, setData] = useState<RealtimePayload | null>(null);
  const [configured, setConfigured] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = (): void => {
      fetch('/api/dashboards/ga4-realtime', { credentials: 'include' })
        .then((r) => r.json())
        .then((j) => {
          if (cancelled) return;
          if (j.ok && j.configured === false) {
            setConfigured(false);
            return;
          }
          if (j.ok && j.payload) setData(j.payload as RealtimePayload);
        })
        .catch(() => {
          /* transient — next poll retries */
        });
    };
    load();
    const id = setInterval(load, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  if (!configured) return null;

  return (
    <div className="cs-analytics__realtime">
      <span className="cs-analytics__realtime-dot" aria-hidden="true" />
      <span className="cs-analytics__realtime-count">{data ? data.activeUsers.toLocaleString() : '—'}</span>
      <span className="cs-analytics__realtime-label">active now</span>
      {data && data.byPage.length > 0 && (
        <span className="cs-analytics__realtime-top" title={data.byPage.map((p) => `${p.path}: ${p.users}`).join('\n')}>
          · top: {data.byPage[0]?.path} ({data.byPage[0]?.users})
        </span>
      )}
    </div>
  );
}

export default RealtimeWidget;
