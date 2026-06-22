'use client';

import { lintGraph, type GraphNode } from '@cleanstart/schema';
import type { ReactElement } from 'react';
import { useEffect, useState } from 'react';

interface LiveBlock {
  type: string;
  json: string;
}
interface LiveSchemaResponse {
  ok: boolean;
  blocks?: LiveBlock[];
  error?: string;
}

interface CellProps {
  rowData?: { path?: string; kind?: string };
}

type Status =
  | { kind: 'idle' }
  | { kind: 'loading' }
  | { kind: 'na'; reason: string }
  | { kind: 'error'; reason: string }
  | { kind: 'lint'; errors: number; warnings: number };

const safeParse = (json: string): GraphNode | null => {
  try {
    const v = JSON.parse(json);
    return v != null && typeof v === 'object' ? (v as GraphNode) : null;
  } catch {
    return null;
  }
};

const Badge = ({ color, label, title }: { color: string; label: string; title: string }): ReactElement => (
  <span
    title={title}
    style={{
      display: 'inline-block',
      fontSize: '0.72em',
      fontWeight: 600,
      color,
      border: `1px solid ${color}`,
      borderRadius: 10,
      padding: '0.05rem 0.5rem',
      whiteSpace: 'nowrap',
    }}
  >
    {label}
  </span>
);

/**
 * List-view rich-result health badge. Lazily fetches the row's LIVE composed
 * @graph (via /api/pageRegistry/live-schema) and lints every node with the
 * shared rich-result linter, surfacing ✓ / warnings / errors per page. The
 * fetch is client-side per row, so the list server render never blocks on it
 * and the admin stays usable when the web app is down (→ "n/a").
 *
 * cms-template rows have no single live page ([slug] routes), so they show "—".
 */
export const SchemaHealthCell = ({ rowData }: CellProps): ReactElement => {
  const path = rowData?.path;
  const kind = rowData?.kind;
  const [status, setStatus] = useState<Status>({ kind: 'idle' });

  useEffect(() => {
    if (!path || kind === 'cms-template') {
      setStatus({ kind: 'na', reason: 'template' });
      return;
    }
    let cancelled = false;
    setStatus({ kind: 'loading' });
    void (async () => {
      try {
        const res = await fetch(
          `/api/pageRegistry/live-schema?path=${encodeURIComponent(path)}`,
          { credentials: 'include' },
        );
        const data = (await res.json()) as LiveSchemaResponse;
        if (cancelled) return;
        if (!data.ok || !data.blocks) {
          setStatus({ kind: 'error', reason: data.error ?? 'unreachable' });
          return;
        }
        const nodes = data.blocks
          .map((b) => safeParse(b.json))
          .filter((n): n is GraphNode => n != null);
        const result = lintGraph(nodes);
        setStatus({ kind: 'lint', errors: result.errorCount, warnings: result.warningCount });
      } catch {
        if (!cancelled) setStatus({ kind: 'error', reason: 'request failed' });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [path, kind]);

  switch (status.kind) {
    case 'idle':
    case 'loading':
      return <span style={{ fontSize: '0.72em', color: '#888' }}>…</span>;
    case 'na':
      return <span style={{ fontSize: '0.72em', color: '#666' }} title="Per-document schema">—</span>;
    case 'error':
      return <Badge color="#888" label="n/a" title={`Could not lint: ${status.reason}`} />;
    case 'lint':
      if (status.errors > 0) {
        return (
          <Badge
            color="var(--theme-error-500, #c33)"
            label={`✕ ${status.errors} err`}
            title={`${status.errors} rich-result error(s), ${status.warnings} warning(s)`}
          />
        );
      }
      if (status.warnings > 0) {
        return (
          <Badge
            color="var(--theme-warning-500, #a70)"
            label={`⚠ ${status.warnings} warn`}
            title={`${status.warnings} recommended field(s) missing`}
          />
        );
      }
      return <Badge color="var(--theme-success-500, #0a7)" label="✓ healthy" title="No rich-result issues" />;
  }
};
