'use client';

import { useField } from '@payloadcms/ui';
import type { ReactElement } from 'react';
import { useCallback, useEffect, useState } from 'react';

interface LiveBlock {
  type: string;
  json: string;
  provenance: 'auto' | 'override';
}

interface LiveSchemaResponse {
  ok: boolean;
  blocks?: LiveBlock[];
  overrideUpdatedAt?: string | null;
  source?: string;
  fetchedAt?: string;
  error?: string;
}

const fmt = (iso: string | null | undefined): string => {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
};

/**
 * Read-only viewer of a page's CURRENT live JSON-LD, block-wise. Fetches the
 * rendered page's @graph via /api/pageRegistry/live-schema and shows each node
 * as a collapsible read-only block tagged auto (derived in apps/web) or
 * override (from the editor below), with timestamps. View-only — editing is
 * done in the "Schema (JSON-LD) override" box below. Not rendered on the site.
 */
export const CurrentSchemaView = (): ReactElement => {
  const { value: path } = useField<string>({ path: 'path' });
  const [state, setState] = useState<{ status: 'idle' | 'loading' | 'done'; data: LiveSchemaResponse | null }>({
    status: 'idle',
    data: null,
  });
  const [copied, setCopied] = useState<number | null>(null);

  const copyBlock = useCallback(async (index: number, jsonText: string): Promise<void> => {
    try {
      await navigator.clipboard.writeText(jsonText);
      setCopied(index);
      setTimeout(() => setCopied((c) => (c === index ? null : c)), 1500);
    } catch {
      // clipboard unavailable (insecure context) — no-op
    }
  }, []);

  const load = useCallback(async (): Promise<void> => {
    if (!path) return;
    setState({ status: 'loading', data: null });
    try {
      const res = await fetch(
        `/api/pageRegistry/live-schema?path=${encodeURIComponent(path)}`,
        { credentials: 'include' },
      );
      const data = (await res.json()) as LiveSchemaResponse;
      setState({ status: 'done', data });
    } catch (err) {
      setState({
        status: 'done',
        data: { ok: false, error: err instanceof Error ? err.message : 'Request failed' },
      });
    }
  }, [path]);

  useEffect(() => {
    void load();
  }, [load]);

  const data = state.data;
  const blocks = data?.blocks ?? [];

  return (
    <div className="field-type" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem', flexWrap: 'wrap' }}>
        <span style={{ fontWeight: 600, fontSize: '0.9em' }}>
          Current schema on the live page{blocks.length ? ` (${blocks.length})` : ''}
        </span>
        <button
          type="button"
          onClick={() => void load()}
          style={{ fontSize: '0.8em', color: '#0a7', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
        >
          ↻ Refresh
        </button>
        {data?.fetchedAt ? (
          <span style={{ fontSize: '0.78em', color: '#888' }}>as of {fmt(data.fetchedAt)}</span>
        ) : null}
      </div>

      {state.status === 'loading' ? (
        <p style={{ color: '#888', fontSize: '0.85em', margin: 0 }}>Loading live schema…</p>
      ) : data && !data.ok ? (
        <p style={{ color: '#a70', fontSize: '0.85em', margin: 0 }}>
          {data.error ?? 'Could not load the live schema.'} (Is the web app running / deployed?)
        </p>
      ) : blocks.length === 0 ? (
        <p style={{ color: '#888', fontSize: '0.85em', margin: 0 }}>
          No JSON-LD found on the live page.
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          {blocks.map((b, i) => (
            <details
              key={`${b.type}-${i}`}
              style={{ border: '1px solid #2a2a2a', borderRadius: 6, padding: '0.4rem 0.6rem' }}
            >
              <summary style={{ cursor: 'pointer', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <code style={{ fontWeight: 600 }}>{b.type}</code>
                {b.provenance === 'override' ? (
                  <span style={{ fontSize: '0.72em', color: '#0a7' }}>
                    ✎ override · edited {fmt(data?.overrideUpdatedAt)}
                  </span>
                ) : (
                  <span style={{ fontSize: '0.72em', color: '#888' }}>auto · derived from page</span>
                )}
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    void copyBlock(i, b.json);
                  }}
                  title="Copy this block's JSON to paste into the override editor below"
                  style={{ marginLeft: 'auto', fontSize: '0.72em', color: '#0a7', background: 'none', border: 'none', cursor: 'pointer' }}
                >
                  {copied === i ? '✓ copied' : '⧉ copy'}
                </button>
              </summary>
              <pre style={{ fontFamily: 'monospace', fontSize: '0.78em', whiteSpace: 'pre-wrap', margin: '0.4rem 0 0' }}>
                {b.json}
              </pre>
            </details>
          ))}
        </div>
      )}
      <p style={{ fontSize: '0.74em', color: '#777', margin: '0.5rem 0 0' }}>
        Read-only view of what this page actually emits. “auto” blocks are derived in the site code;
        to change a page’s schema, add or edit an override (composed per-@type at build time).
      </p>
    </div>
  );
};
