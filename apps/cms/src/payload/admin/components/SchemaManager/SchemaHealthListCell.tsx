'use client';

import { lintGraph, type GraphNode } from '@cleanstart/schema';
import { useDocumentInfo } from '@payloadcms/ui';
import type { ReactElement } from 'react';
import { useEffect, useState } from 'react';

interface JsonLdResponse {
  blobs?: Record<string, unknown>[];
}

interface CellProps {
  rowData?: { id?: string | number; _status?: string };
  /** Collection slug, injected via clientProps. */
  collectionSlug?: string;
}

type Status =
  | { kind: 'idle' | 'loading' }
  | { kind: 'na'; reason: string }
  | { kind: 'lint'; errors: number; warnings: number };

const safeNode = (blob: Record<string, unknown>): GraphNode => blob as GraphNode;

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
 * List-view rich-result health badge for content collections. Fetches the
 * doc's SERVER-composed JSON-LD (/api/jsonld/<collection>/<id>) and lints it
 * with the shared rich-result linter. Per-row, client-side, so the list render
 * never blocks. Drafts (no published graph) show "—".
 */
export const SchemaHealthListCell = ({ rowData, collectionSlug }: CellProps): ReactElement => {
  const info = useDocumentInfo();
  const slug = collectionSlug ?? info?.collectionSlug ?? '';
  const id = rowData?.id;
  const [status, setStatus] = useState<Status>({ kind: 'idle' });

  useEffect(() => {
    if (id == null || !slug) {
      setStatus({ kind: 'na', reason: 'no id' });
      return;
    }
    let cancelled = false;
    setStatus({ kind: 'loading' });
    void (async () => {
      try {
        const res = await fetch(
          `/api/jsonld/${encodeURIComponent(slug)}/${encodeURIComponent(String(id))}`,
          { credentials: 'include' },
        );
        if (cancelled) return;
        if (!res.ok) {
          setStatus({ kind: 'na', reason: `HTTP ${res.status}` });
          return;
        }
        const data = (await res.json()) as JsonLdResponse;
        const blobs = Array.isArray(data.blobs) ? data.blobs : [];
        if (blobs.length === 0) {
          setStatus({ kind: 'na', reason: 'no graph' });
          return;
        }
        const result = lintGraph(blobs.map(safeNode));
        setStatus({ kind: 'lint', errors: result.errorCount, warnings: result.warningCount });
      } catch {
        if (!cancelled) setStatus({ kind: 'na', reason: 'request failed' });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id, slug]);

  switch (status.kind) {
    case 'idle':
    case 'loading':
      return <span style={{ fontSize: '0.72em', color: '#888' }}>…</span>;
    case 'na':
      return <span style={{ fontSize: '0.72em', color: '#666' }} title={status.reason}>—</span>;
    case 'lint':
      if (status.errors > 0) {
        return (
          <Badge
            color="var(--theme-error-500, #c33)"
            label={`✕ ${status.errors}`}
            title={`${status.errors} rich-result error(s), ${status.warnings} warning(s)`}
          />
        );
      }
      if (status.warnings > 0) {
        return (
          <Badge
            color="var(--theme-warning-500, #a70)"
            label={`⚠ ${status.warnings}`}
            title={`${status.warnings} recommended field(s) missing`}
          />
        );
      }
      return <Badge color="var(--theme-success-500, #0a7)" label="✓" title="No rich-result issues" />;
  }
};
