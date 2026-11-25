'use client';

import { useConfig, useDocumentInfo } from '@payloadcms/ui';
import type { ReactElement } from 'react';
import { useCallback, useEffect, useState } from 'react';

type Column = { name: string; label: string };
type Entry = { id: number; createdAt: string; fields: Record<string, unknown> };
type Loaded = {
  columns: Column[];
  entries: Entry[];
  total: number;
  page: number;
  hasNextPage: boolean;
};

const cell = (value: unknown): string => {
  if (value === undefined || value === null || value === '') return '';
  return typeof value === 'object' ? JSON.stringify(value) : String(value);
};

const submitted = (iso: string): string =>
  new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });

/**
 * The entries for one event, inside its edit page. Loaded from the event's own
 * endpoint, which also lets the departmental `events` role read them (the
 * Leads collection itself is admin and editor only).
 */
export const EventRegistrationsPanel = (): ReactElement | null => {
  const { id } = useDocumentInfo();
  const { config } = useConfig();
  const serverURL = config?.serverURL ?? '';
  const [page, setPage] = useState(1);
  const [data, setData] = useState<Loaded | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setError(null);
    fetch(`${serverURL}/api/eventPages/${id}/registrations?page=${page}`, { credentials: 'include' })
      .then(async (res) => {
        const body = (await res.json()) as Loaded & { ok?: boolean; error?: string };
        if (cancelled) return;
        if (!res.ok || body.ok === false) setError(body.error ?? 'Could not load registrations.');
        else setData(body);
      })
      .catch(() => {
        if (!cancelled) setError('Could not load registrations.');
      });
    return () => {
      cancelled = true;
    };
  }, [id, page, serverURL]);

  const exportCsv = useCallback(async () => {
    setBusy(true);
    try {
      const res = await fetch(`${serverURL}/api/eventPages/${id}/registrations-csv`, { credentials: 'include' });
      if (!res.ok) {
        setError('Export failed. Please try again.');
        return;
      }
      const url = URL.createObjectURL(await res.blob());
      const a = document.createElement('a');
      a.href = url;
      a.download = res.headers.get('content-disposition')?.match(/filename="([^"]+)"/u)?.[1] ?? 'registrations.csv';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } finally {
      setBusy(false);
    }
  }, [id, serverURL]);

  if (!id) {
    return <p style={{ color: 'var(--theme-elevation-500)' }}>Save the event to start receiving registrations.</p>;
  }

  return (
    <section aria-label="Registrations" style={{ marginTop: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <h3 style={{ margin: 0 }}>Registrations{data ? ` (${data.total})` : ''}</h3>
        <button type="button" className="cs-btn cs-btn--subtle" onClick={() => void exportCsv()} disabled={busy || !data?.total}>
          {busy ? 'Exporting…' : 'Export CSV'}
        </button>
      </div>

      {error ? (
        <p role="alert" style={{ color: 'var(--theme-error-500)' }}>
          {error}
        </p>
      ) : null}
      {!data && !error ? <p style={{ color: 'var(--theme-elevation-500)' }}>Loading…</p> : null}
      {data && data.entries.length === 0 ? (
        <p style={{ color: 'var(--theme-elevation-500)' }}>No registrations yet.</p>
      ) : null}

      {data && data.entries.length > 0 ? (
        <div style={{ overflowX: 'auto', marginTop: 12 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', padding: '8px 12px', whiteSpace: 'nowrap' }}>Submitted</th>
                {data.columns.map((c) => (
                  <th key={c.name} style={{ textAlign: 'left', padding: '8px 12px', whiteSpace: 'nowrap' }}>
                    {c.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.entries.map((entry) => (
                <tr key={entry.id} style={{ borderTop: '1px solid var(--theme-elevation-100)' }}>
                  <td style={{ padding: '8px 12px', whiteSpace: 'nowrap' }}>{submitted(entry.createdAt)}</td>
                  {data.columns.map((c) => (
                    <td key={c.name} style={{ padding: '8px 12px' }}>
                      {cell(entry.fields[c.name])}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {data && (data.page > 1 || data.hasNextPage) ? (
        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
          <button type="button" className="cs-btn cs-btn--subtle" disabled={page <= 1} onClick={() => setPage(page - 1)}>
            Previous
          </button>
          <button type="button" className="cs-btn cs-btn--subtle" disabled={!data.hasNextPage} onClick={() => setPage(page + 1)}>
            Next
          </button>
        </div>
      ) : null}
    </section>
  );
};

export default EventRegistrationsPanel;
