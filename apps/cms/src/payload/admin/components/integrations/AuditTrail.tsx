'use client';

import { useDocumentInfo, useConfig } from '@payloadcms/ui';
import type { ReactElement } from 'react';
import { useEffect, useState } from 'react';

interface AuditRow {
  id: number | string;
  webhookId: string;
  event: 'document.published' | 'lead.submitted';
  attemptCount: number;
  lastError: string | null;
  nextRetryAt: string | null;
  resolvedAt: string | null;
  createdAt: string;
}

interface AuditResponse {
  ok: boolean;
  rows?: AuditRow[];
  error?: string;
}

interface FetchState {
  status: 'idle' | 'loading' | 'ok' | 'error';
  rows: readonly AuditRow[];
  error?: string;
}

const formatDate = (iso: string): string => {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
};

/**
 * Per-row audit trail panel. Reads up to 50 most-recent
 * webhooks_dead_letter rows for this integration via
 * /api/integrations/:id/audit and renders them in a compact list.
 * Event payloads are intentionally not surfaced here to avoid
 * leaking PII into the admin UI — click through to the
 * webhooks_dead_letter row for the full record.
 */
export const AuditTrail = (): ReactElement | null => {
  const { id } = useDocumentInfo();
  const { config } = useConfig();
  const serverURL = config?.serverURL ?? '';
  const [state, setState] = useState<FetchState>({ status: 'idle', rows: [] });

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setState({ status: 'loading', rows: [] });
    (async () => {
      try {
        const res = await fetch(`${serverURL}/api/integrations/${id}/audit`, {
          credentials: 'include',
        });
        const body = (await res.json()) as AuditResponse;
        if (cancelled) return;
        if (body.ok) {
          setState({ status: 'ok', rows: body.rows ?? [] });
        } else {
          setState({ status: 'error', rows: [], error: body.error ?? 'Unknown error' });
        }
      } catch (err) {
        if (cancelled) return;
        setState({
          status: 'error',
          rows: [],
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
    return <div className="cs-integrations-audit">Loading delivery history…</div>;
  }

  if (state.status === 'error') {
    return (
      <div className="cs-integrations-audit cs-integrations-audit--error">
        Could not load history: {state.error}
      </div>
    );
  }

  if (state.rows.length === 0) {
    return (
      <div className="cs-integrations-audit cs-integrations-audit--empty">
        No failed deliveries in the audit log. (Successful deliveries are not stored.)
      </div>
    );
  }

  return (
    <div className="cs-integrations-audit">
      <table className="cs-integrations-audit__table">
        <thead>
          <tr>
            <th>When</th>
            <th>Event</th>
            <th>Attempts</th>
            <th>Status</th>
            <th>Last error</th>
          </tr>
        </thead>
        <tbody>
          {state.rows.map((r) => (
            <tr key={String(r.id)}>
              <td>{formatDate(r.createdAt)}</td>
              <td>{r.event}</td>
              <td>{r.attemptCount}</td>
              <td>
                {r.resolvedAt
                  ? 'Resolved'
                  : r.nextRetryAt
                    ? `Retry ${formatDate(r.nextRetryAt)}`
                    : 'Exhausted'}
              </td>
              <td className="cs-integrations-audit__error">{r.lastError ?? '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AuditTrail;
