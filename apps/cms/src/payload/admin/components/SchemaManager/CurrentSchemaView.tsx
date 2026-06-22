'use client';

import { useField } from '@payloadcms/ui';
import type { ReactElement } from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { composeGraph, type GraphNode, primaryType } from '../../../lib/jsonld/compose';

interface LiveBlock {
  type: string;
  json: string;
  provenance: 'auto' | 'override';
}

const safeParse = (json: string): Record<string, unknown> | null => {
  try {
    const v = JSON.parse(json);
    return v != null && typeof v === 'object' ? (v as Record<string, unknown>) : null;
  } catch {
    return null;
  }
};

const overrideTypeSet = (override: unknown): Set<string> => {
  const blobs = Array.isArray(override) ? override : override != null ? [override] : [];
  const out = new Set<string>();
  for (const b of blobs) {
    if (b != null && typeof b === 'object') {
      const t = (b as { '@type'?: unknown })['@type'];
      if (typeof t === 'string') out.add(t);
      else if (Array.isArray(t)) for (const e of t) if (typeof e === 'string') out.add(e);
    }
  }
  return out;
};

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
  const { value: override } = useField<unknown>({ path: 'additionalSchema' });
  const [state, setState] = useState<{ status: 'idle' | 'loading' | 'done'; data: LiveSchemaResponse | null }>({
    status: 'idle',
    data: null,
  });
  const [copied, setCopied] = useState<number | null>(null);
  const [mode, setMode] = useState<'live' | 'preview'>('live');
  const [exportOpen, setExportOpen] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);

  // Close the export dropdown on any click outside it.
  useEffect(() => {
    if (!exportOpen) return;
    const onDown = (e: MouseEvent): void => {
      if (exportRef.current && !exportRef.current.contains(e.target as Node)) {
        setExportOpen(false);
      }
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [exportOpen]);

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
  const liveBlocks = data?.blocks ?? [];

  // Merged preview: auto-only live nodes + the UNSAVED override from the form,
  // composed exactly as the build would (composeGraph). Updates live as you type.
  const previewBlocks = useMemo((): LiveBlock[] => {
    const autoNodes = liveBlocks
      .filter((b) => b.provenance === 'auto')
      .map((b) => safeParse(b.json))
      .filter((n): n is Record<string, unknown> => n != null);
    const graph = composeGraph({ auto: autoNodes as GraphNode[], override: override ?? undefined });
    const oTypes = overrideTypeSet(override);
    return graph['@graph'].map((node) => ({
      type: primaryType(node),
      json: JSON.stringify(node, null, 2),
      provenance: oTypes.has(primaryType(node)) ? 'override' : 'auto',
    }));
  }, [liveBlocks, override]);

  const blocks = mode === 'preview' ? previewBlocks : liveBlocks;

  const downloadGraph = (format: 'json' | 'txt'): void => {
    const nodes = blocks
      .map((b) => safeParse(b.json))
      .filter((n): n is Record<string, unknown> => n != null);
    const graph = { '@context': 'https://schema.org', '@graph': nodes };
    const content = JSON.stringify(graph, null, 2);
    const slug = (path || '/').replace(/\//g, '-').replace(/(^-|-$)/g, '') || 'home';
    const blob = new Blob([content], {
      type: format === 'json' ? 'application/ld+json' : 'text/plain',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `schema-${slug}.${format}`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    setExportOpen(false);
  };

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
        <button
          type="button"
          onClick={() => setMode((m) => (m === 'live' ? 'preview' : 'live'))}
          title="Preview the merged @graph with your unsaved override, exactly as the build composes it"
          style={{
            marginLeft: 'auto',
            fontSize: '0.75em',
            fontWeight: 600,
            color: mode === 'preview' ? '#0a7' : '#9ab',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: 0,
          }}
        >
          {mode === 'live' ? '▶ Preview merged' : '◀ Back to live'}
        </button>
        <div ref={exportRef} style={{ position: 'relative' }}>
          <button
            type="button"
            onClick={() => setExportOpen((o) => !o)}
            disabled={blocks.length === 0}
            title="Export this page's composed @graph"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              fontSize: '0.82em',
              fontWeight: 600,
              color: blocks.length === 0 ? 'var(--theme-elevation-400, #666)' : 'var(--theme-success-500, #0a7)',
              background: 'var(--theme-elevation-50, transparent)',
              border: `1px solid ${blocks.length === 0 ? 'var(--theme-elevation-150, #333)' : 'var(--theme-success-500, #0a7)'}`,
              borderRadius: 6,
              cursor: blocks.length === 0 ? 'not-allowed' : 'pointer',
              padding: '0.35rem 0.7rem',
            }}
          >
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden="true" style={{ flexShrink: 0 }}>
              <path d="M8 2.5v8M4.5 7L8 10.5 11.5 7M3 13.5h10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span>Export</span>
            <svg
              width="10"
              height="10"
              viewBox="0 0 12 12"
              fill="none"
              aria-hidden="true"
              style={{ flexShrink: 0, transition: 'transform 0.15s', transform: exportOpen ? 'rotate(180deg)' : 'none' }}
            >
              <path d="M2.5 4.5L6 8l3.5-3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          {exportOpen ? (
            <div
              style={{
                position: 'absolute',
                right: 0,
                top: '1.4em',
                zIndex: 10,
                background: 'var(--theme-elevation-50, #1b1b1b)',
                border: '1px solid var(--theme-elevation-150, #333)',
                borderRadius: 6,
                minWidth: 130,
                boxShadow: '0 4px 14px rgba(0,0,0,0.4)',
              }}
            >
              <button
                type="button"
                onClick={() => downloadGraph('json')}
                style={{ display: 'block', width: '100%', textAlign: 'left', fontSize: '0.8em', padding: '0.4rem 0.6rem', background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }}
              >
                JSON-LD (.json)
              </button>
              <button
                type="button"
                onClick={() => downloadGraph('txt')}
                style={{ display: 'block', width: '100%', textAlign: 'left', fontSize: '0.8em', padding: '0.4rem 0.6rem', background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }}
              >
                Text (.txt)
              </button>
            </div>
          ) : null}
        </div>
      </div>
      {mode === 'preview' ? (
        <p style={{ fontSize: '0.74em', color: '#0a7', margin: 0 }}>
          Merged result with your unsaved override (what will deploy on save).
        </p>
      ) : null}

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
                    ✎ override · {mode === 'preview' ? 'pending (unsaved)' : `edited ${fmt(data?.overrideUpdatedAt)}`}
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
