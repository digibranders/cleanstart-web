'use client';

import { type GraphNode, lintGraph, validateOverride } from '@cleanstart/schema';
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
interface ValidationResult {
  ok: boolean;
  messages: string[];
  warnings: number;
  blocks: number;
}

const safeParse = (json: string): GraphNode | null => {
  try {
    const v = JSON.parse(json);
    return v != null && typeof v === 'object' ? (v as GraphNode) : null;
  } catch {
    return null;
  }
};

export const SchemaSidebarInfo = (): ReactElement => {
  const { id } = useDocumentInfo();
  const { value: path } = useField<string>({ path: 'path' });
  const { value: override } = useField<unknown>({ path: 'additionalSchema' });
  const [meta, setMeta] = useState<RowMeta | null>(null);
  const [validating, setValidating] = useState(false);
  const [validation, setValidation] = useState<ValidationResult | null>(null);

  const pageUrl = path ? `${DEFAULT_SITE_URL.replace(/\/$/, '')}${path}` : null;
  const richResultsUrl = pageUrl
    ? `https://search.google.com/test/rich-results?url=${encodeURIComponent(pageUrl)}`
    : null;

  // In-app validation — structural check of the unsaved override
  // (validateOverride) + rich-result lint of the live composed graph. Runs in
  // place; no external tool (validator.schema.org can't be auto-filled).
  const runValidation = async (): Promise<void> => {
    if (!path) return;
    setValidating(true);
    const messages: string[] = [];
    if (override != null) {
      const r = validateOverride(override);
      if (!r.ok) {
        if (r.issues.length > 0) {
          for (const i of r.issues) messages.push(`${i.path ? `${i.path}: ` : ''}${i.message}`);
        } else if (r.message) {
          messages.push(r.message);
        }
      }
    }
    try {
      const res = await fetch(`/api/pageRegistry/live-schema?path=${encodeURIComponent(path)}`, {
        credentials: 'include',
      });
      const data = (await res.json()) as {
        ok: boolean;
        blocks?: { type: string; json: string }[];
        error?: string;
      };
      if (data.ok && data.blocks) {
        const nodes = data.blocks
          .map((b) => safeParse(b.json))
          .filter((n): n is GraphNode => n != null);
        const lint = lintGraph(nodes);
        for (const n of lint.nodes) {
          for (const e of n.errors) messages.push(`${n.type}: missing required “${e.field}”`);
        }
        setValidation({ ok: messages.length === 0, messages, warnings: lint.warningCount, blocks: nodes.length });
      } else {
        setValidation({ ok: false, messages: [data.error ?? 'Could not load the live schema.'], warnings: 0, blocks: 0 });
      }
    } catch {
      setValidation({ ok: false, messages: ['Could not reach the live page.'], warnings: 0, blocks: 0 });
    } finally {
      setValidating(false);
    }
  };

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
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.9rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
        {richResultsUrl ? (
          <a
            href={richResultsUrl}
            target="_blank"
            rel="noopener noreferrer"
            title="Tests the live published URL with Google (deployed page only)."
            style={{ fontSize: '0.78em', color: '#0a7', fontWeight: 600 }}
          >
            ↗ Test in Google Rich Results
          </a>
        ) : null}
        <button
          type="button"
          onClick={() => void runValidation()}
          disabled={validating || !path}
          title="Validate this page's composed JSON-LD in place — structural rules + rich-result required fields. Runs instantly, no external tool."
          style={{
            fontSize: '0.78em',
            fontWeight: 600,
            color: 'var(--theme-success-500, #0a7)',
            background: 'none',
            border: 'none',
            cursor: validating || !path ? 'default' : 'pointer',
            padding: 0,
          }}
        >
          {validating ? '… validating' : '✔ Validate code'}
        </button>
      </div>
      {validation ? (
        <div
          style={{
            marginTop: '0.5rem',
            border: `1px solid ${validation.ok ? 'var(--theme-success-500, #0a7)' : 'var(--theme-error-500, #c33)'}`,
            borderRadius: 6,
            padding: '0.5rem 0.7rem',
            fontSize: '0.78em',
          }}
        >
          {validation.ok ? (
            <span style={{ color: 'var(--theme-success-500, #0a7)', fontWeight: 600 }}>
              ✓ Valid — {validation.blocks} block(s), no errors
              {validation.warnings > 0 ? `, ${validation.warnings} recommended-field warning(s)` : ''}.
            </span>
          ) : (
            <>
              <span style={{ color: 'var(--theme-error-500, #c33)', fontWeight: 600 }}>
                ✕ {validation.messages.length} issue(s):
              </span>
              <ul style={{ margin: '0.3rem 0 0', paddingLeft: '1.1rem' }}>
                {validation.messages.map((m) => (
                  <li key={m} style={{ color: 'var(--theme-error-500, #c33)' }}>
                    {m}
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      ) : null}
    </div>
  );
};
