'use client';

import { useDocumentInfo, useField } from '@payloadcms/ui';
import type { ReactElement } from 'react';
import { useEffect, useState } from 'react';

import { DEFAULT_SITE_URL } from '../_site-url';

const fmt = (iso: string | null | undefined): string => {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
};

interface RowMeta {
  createdAt?: string | null;
  updatedAt?: string | null;
  additionalSchema?: unknown;
}

const rowStyle = { display: 'flex', justifyContent: 'space-between', gap: '0.5rem' } as const;

/**
 * Top of the right rail: override dates for this pageRegistry row (expanded).
 * Shows whether an override is set, when it last changed, and when the row was
 * created. Read-only.
 */
export const SchemaSidebarInfo = (): ReactElement => {
  const { id } = useDocumentInfo();
  const { value: path } = useField<string>({ path: 'path' });
  const [meta, setMeta] = useState<RowMeta | null>(null);

  const pageUrl = path ? `${DEFAULT_SITE_URL.replace(/\/$/, '')}${path}` : null;
  const richResultsUrl = pageUrl
    ? `https://search.google.com/test/rich-results?url=${encodeURIComponent(pageUrl)}`
    : null;

  useEffect(() => {
    if (id == null) return;
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch(`/api/pageRegistry/${id}?depth=0`, { credentials: 'include' });
        const json = (await res.json()) as RowMeta;
        if (!cancelled) setMeta(json);
      } catch {
        if (!cancelled) setMeta(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const hasOverride = meta?.additionalSchema != null;

  return (
    <div className="field-type">
      <span style={{ fontSize: '0.78em', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#9ab', fontWeight: 600 }}>
        Override dates
      </span>
      <dl style={{ margin: '0.4rem 0 0', fontSize: '0.8em', color: '#bbb' }}>
        <div style={rowStyle}>
          <dt style={{ color: '#888' }}>Override</dt>
          <dd style={{ margin: 0, color: hasOverride ? '#0a7' : '#888' }}>
            {hasOverride ? 'set' : 'none (auto only)'}
          </dd>
        </div>
        <div style={rowStyle}>
          <dt style={{ color: '#888' }}>Last changed</dt>
          <dd style={{ margin: 0 }}>{fmt(meta?.updatedAt)}</dd>
        </div>
        <div style={rowStyle}>
          <dt style={{ color: '#888' }}>Created</dt>
          <dd style={{ margin: 0 }}>{fmt(meta?.createdAt)}</dd>
        </div>
      </dl>
      <p style={{ fontSize: '0.72em', color: '#777', margin: '0.3rem 0 0' }}>
        Per-@type edit history is in the “History” panel below.
      </p>
      {richResultsUrl ? (
        <a
          href={richResultsUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{ display: 'inline-block', marginTop: '0.5rem', fontSize: '0.78em', color: '#0a7', fontWeight: 600 }}
        >
          ↗ Test in Google Rich Results
        </a>
      ) : null}
    </div>
  );
};
