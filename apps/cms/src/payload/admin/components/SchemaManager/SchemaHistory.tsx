'use client';

import { useField } from '@payloadcms/ui';
import type { ReactElement } from 'react';

import {
  type SchemaHistoryEntry,
  groupHistoryByType,
} from '../../../lib/jsonld/schema-history';

const fmt = (iso: string): string => {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
};

const ACTION_COLOR: Record<string, string> = {
  added: 'var(--theme-success-500, #0a7)',
  changed: 'var(--theme-warning-500, #a70)',
  removed: 'var(--theme-error-500, #c33)',
};

const summaryStyle = {
  cursor: 'pointer',
  fontSize: '0.78em',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  color: '#9ab',
  fontWeight: 600,
} as const;

/**
 * Right-rail per-@type override history (collapsed). Reads the row's
 * schemaHistory (maintained by recordSchemaHistoryHook) and groups it by
 * Schema.org @type → a timeline of added/changed/removed with timestamp,
 * editor, and the block JSON at that point. Read-only.
 */
export const SchemaHistory = (): ReactElement => {
  const { value } = useField<SchemaHistoryEntry[]>({ path: 'schemaHistory' });
  const history = Array.isArray(value) ? value : [];
  const groups = groupHistoryByType(history);

  return (
    <details className="field-type">
      <summary style={summaryStyle}>History ({history.length})</summary>
      {history.length === 0 ? (
        <p style={{ fontSize: '0.78em', color: '#888', margin: '0.4rem 0 0' }}>
          No override changes recorded yet. Each save logs per-@type edits here.
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginTop: '0.4rem' }}>
          {groups.map(({ type, entries }) => (
            <details key={type} style={{ border: '1px solid #2a2a2a', borderRadius: 6, padding: '0.3rem 0.5rem' }}>
              <summary style={{ cursor: 'pointer', fontSize: '0.82em' }}>
                <code style={{ fontWeight: 600 }}>{type}</code>{' '}
                <span style={{ color: '#888' }}>({entries.length})</span>
              </summary>
              <ul style={{ listStyle: 'none', margin: '0.4rem 0 0', padding: 0, display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                {entries.map((e, i) => (
                  <li
                    key={`${e.at}-${e.action}-${i}`}
                    style={{ fontSize: '0.78em', borderLeft: `2px solid ${ACTION_COLOR[e.action] ?? '#666'}`, paddingLeft: '0.5rem' }}
                  >
                    <span style={{ color: ACTION_COLOR[e.action] ?? '#888', fontWeight: 600 }}>{e.action}</span>{' '}
                    <span style={{ color: '#888' }}>· {fmt(e.at)}{e.by ? ` · ${e.by}` : ''}</span>
                    {e.json ? (
                      <details>
                        <summary style={{ cursor: 'pointer', color: '#0a7', fontSize: '0.95em' }}>view JSON</summary>
                        <pre style={{ fontFamily: 'monospace', fontSize: '0.92em', whiteSpace: 'pre-wrap', margin: '0.3rem 0 0' }}>
                          {e.json}
                        </pre>
                      </details>
                    ) : null}
                  </li>
                ))}
              </ul>
            </details>
          ))}
        </div>
      )}
    </details>
  );
};
