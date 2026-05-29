'use client';

import { useDocumentInfo, useConfig } from '@payloadcms/ui';
import type { ReactElement } from 'react';
import { useEffect, useState } from 'react';

interface HealthResponse {
  ok: boolean;
  badge?: 'green' | 'yellow' | 'red';
  count?: number;
  error?: string;
}

interface FetchState {
  status: 'idle' | 'loading' | 'ok' | 'error';
  badge?: 'green' | 'yellow' | 'red';
  count?: number;
  error?: string;
}

const LABEL: Record<'green' | 'yellow' | 'red', string> = {
  green: 'Healthy',
  yellow: 'Warnings',
  red: 'Failing',
};

/**
 * Per-row health badge. On mount, calls /api/integrations/:id/health
 * which reads `webhooks_dead_letter` and returns a traffic-light
 * classification for the last 24h.
 *
 * Thresholds (server-side): 0 dead-letters = green, 1–2 = yellow,
 * ≥3 = red. Pure read endpoint; safe to call on every drawer open.
 */
export const HealthBadge = (): ReactElement | null => {
  const { id } = useDocumentInfo();
  const { config } = useConfig();
  const serverURL = config?.serverURL ?? '';
  const [state, setState] = useState<FetchState>({ status: 'idle' });

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setState({ status: 'loading' });
    (async () => {
      try {
        const res = await fetch(`${serverURL}/api/integrations/${id}/health`, {
          credentials: 'include',
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const body = (await res.json()) as HealthResponse;
        if (cancelled) return;
        if (body.ok && body.badge) {
          setState({ status: 'ok', badge: body.badge, count: body.count ?? 0 });
        } else {
          setState({ status: 'error', error: body.error ?? 'Unknown error' });
        }
      } catch (err) {
        if (cancelled) return;
        setState({
          status: 'error',
          error: err instanceof Error ? err.message : 'Network error',
        });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id, serverURL]);

  if (!id) return null;

  if (state.status === 'loading' || state.status === 'idle') {
    return <span className="cs-integrations-health cs-integrations-health--loading">Checking…</span>;
  }

  if (state.status === 'error') {
    return (
      <span className="cs-integrations-health cs-integrations-health--error">
        Health unknown · {state.error}
      </span>
    );
  }

  const badge = state.badge ?? 'green';
  return (
    <span className={`cs-integrations-health cs-integrations-health--${badge}`}>
      <span aria-hidden="true" className="cs-integrations-health__dot" />
      {LABEL[badge]} · {state.count ?? 0} dead-letter{(state.count ?? 0) === 1 ? '' : 's'} (24h)
    </span>
  );
};

export default HealthBadge;
