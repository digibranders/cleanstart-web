'use client';

import { useDocumentInfo } from '@payloadcms/ui';
import type { ReactElement } from 'react';
import { useEffect, useState } from 'react';

import {
  ALLOWED_OVERRIDE_TYPES,
  AUTO_EMITTED_TYPES_BY_COLLECTION,
} from '../../../lib/jsonld/override-validator';

const BLOCKED = Array.from(AUTO_EMITTED_TYPES_BY_COLLECTION.pageRegistry ?? []);

const fmt = (iso: string | null | undefined): string => {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
};

const sectionStyle = { borderTop: '1px solid #222', paddingTop: '0.6rem' } as const;
const summaryStyle = {
  cursor: 'pointer',
  fontSize: '0.78em',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  color: '#9ab',
  fontWeight: 600,
} as const;

interface RowMeta {
  createdAt?: string | null;
  updatedAt?: string | null;
  additionalSchema?: unknown;
}

/**
 * Right-rail reference panel for a pageRegistry row: the allow-list, the
 * site-wide blocklist (types emitted globally that can't be overridden), and
 * override dates — each a collapsed section. Read-only; complements the live
 * "Current schema" viewer below it.
 */
export const SchemaSidebarInfo = (): ReactElement => {
  const { id } = useDocumentInfo();
  const [meta, setMeta] = useState<RowMeta | null>(null);

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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      <details style={sectionStyle}>
        <summary style={summaryStyle}>Allowed @types ({ALLOWED_OVERRIDE_TYPES.length})</summary>
        <ul style={{ margin: '0.4rem 0 0', paddingLeft: '1rem', fontSize: '0.8em', color: '#bbb' }}>
          {ALLOWED_OVERRIDE_TYPES.map((t) => (
            <li key={t}>
              <code>{t}</code>
            </li>
          ))}
        </ul>
      </details>

      <details style={sectionStyle}>
        <summary style={summaryStyle}>Blocked — site-wide ({BLOCKED.length})</summary>
        <ul style={{ margin: '0.4rem 0 0', paddingLeft: '1rem', fontSize: '0.8em', color: '#bbb' }}>
          {BLOCKED.map((t) => (
            <li key={t}>
              <code>{t}</code>
            </li>
          ))}
        </ul>
        <p style={{ fontSize: '0.75em', color: '#888', margin: '0.3rem 0 0' }}>
          Emitted on every page by the global layer — can’t be overridden per page. Edit them in
          SEO Defaults.
        </p>
      </details>

      <details style={sectionStyle} open>
        <summary style={summaryStyle}>Override dates</summary>
        <dl style={{ margin: '0.4rem 0 0', fontSize: '0.8em', color: '#bbb' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem' }}>
            <dt style={{ color: '#888' }}>Override</dt>
            <dd style={{ margin: 0, color: hasOverride ? '#0a7' : '#888' }}>
              {hasOverride ? 'set' : 'none (auto only)'}
            </dd>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem' }}>
            <dt style={{ color: '#888' }}>Last changed</dt>
            <dd style={{ margin: 0 }}>{fmt(meta?.updatedAt)}</dd>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem' }}>
            <dt style={{ color: '#888' }}>Created</dt>
            <dd style={{ margin: 0 }}>{fmt(meta?.createdAt)}</dd>
          </div>
        </dl>
        <p style={{ fontSize: '0.72em', color: '#777', margin: '0.3rem 0 0' }}>
          Per-@type edit history needs the audit log (planned).
        </p>
      </details>
    </div>
  );
};
