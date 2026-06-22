'use client';

import {
  ALLOWED_OVERRIDE_TYPES,
  RICH_RESULT_RULES,
  templateForType,
} from '@cleanstart/schema';
import { useField } from '@payloadcms/ui';
import type { ReactElement } from 'react';
import { useMemo, useState } from 'react';

import { DEFAULT_SITE_URL } from '../_site-url';

const summaryStyle = {
  cursor: 'pointer',
  fontSize: '0.78em',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  color: '#9ab',
  fontWeight: 600,
} as const;

const toArray = (value: unknown): Record<string, unknown>[] => {
  if (Array.isArray(value)) return value.filter((v) => v != null && typeof v === 'object');
  if (value != null && typeof value === 'object') return [value as Record<string, unknown>];
  return [];
};

const typeOf = (blob: Record<string, unknown>): string => {
  const t = blob['@type'];
  if (typeof t === 'string') return t;
  if (Array.isArray(t) && typeof t[0] === 'string') return t[0];
  return '';
};

// Sorted, de-duped allow-list for the picker.
const TYPE_OPTIONS = [...ALLOWED_OVERRIDE_TYPES].sort();

/**
 * Guided block-builder (right rail). Pick an allow-listed Schema.org @type and
 * insert a pre-filled, structurally-valid starter block into the override —
 * no hand-written JSON-LD. Shows the type's required/recommended fields (from
 * the shared rich-result rules) so the editor knows what to fill, and warns
 * when the override already carries that type (insert would add a duplicate).
 */
export const SchemaBlockBuilder = (): ReactElement => {
  const { value: path } = useField<string>({ path: 'path' });
  const { value: title } = useField<string>({ path: 'title' });
  const { value: override, setValue } = useField<unknown>({ path: 'additionalSchema' });
  const [type, setType] = useState<string>('');
  const [justInserted, setJustInserted] = useState(false);

  const existingTypes = useMemo(() => new Set(toArray(override).map(typeOf)), [override]);
  const rule = type ? RICH_RESULT_RULES[type] : undefined;
  const alreadyPresent = type ? existingTypes.has(type) : false;

  const insert = (): void => {
    if (!type) return;
    const block = templateForType(type, {
      ...(path ? { url: `${DEFAULT_SITE_URL.replace(/\/$/, '')}${path}` } : {}),
      ...(title ? { name: title } : {}),
    });
    setValue([...toArray(override), block]);
    setJustInserted(true);
    setTimeout(() => setJustInserted(false), 1800);
  };

  return (
    <details className="field-type">
      <summary style={summaryStyle}>Block builder</summary>
      <p style={{ fontSize: '0.78em', color: '#888', margin: '0.4rem 0' }}>
        Insert a pre-filled starter block, then fill its values in the override editor.
      </p>
      <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          style={{
            flex: '1 1 auto',
            fontSize: '0.82em',
            padding: '0.3rem 0.4rem',
            background: 'var(--theme-elevation-50, #1b1b1b)',
            color: 'inherit',
            border: '1px solid var(--theme-elevation-150, #333)',
            borderRadius: 6,
          }}
        >
          <option value="">Choose a @type…</option>
          {TYPE_OPTIONS.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={insert}
          disabled={!type}
          style={{
            fontSize: '0.82em',
            fontWeight: 600,
            color: type ? 'var(--theme-success-500, #0a7)' : 'var(--theme-elevation-400, #666)',
            background: 'none',
            border: `1px solid ${type ? 'var(--theme-success-500, #0a7)' : 'var(--theme-elevation-150, #333)'}`,
            borderRadius: 6,
            cursor: type ? 'pointer' : 'not-allowed',
            padding: '0.3rem 0.7rem',
          }}
        >
          {justInserted ? '✓ inserted' : '+ Insert'}
        </button>
      </div>

      {alreadyPresent ? (
        <p style={{ fontSize: '0.74em', color: '#a70', margin: '0.4rem 0 0' }}>
          The override already has a <code>{type}</code> block — inserting adds a second one.
        </p>
      ) : null}

      {rule ? (
        <div style={{ fontSize: '0.76em', color: '#bbb', marginTop: '0.5rem' }}>
          {rule.required.length > 0 ? (
            <p style={{ margin: '0 0 0.2rem' }}>
              <strong style={{ color: '#c66' }}>Required:</strong> {rule.required.join(', ')}
            </p>
          ) : null}
          {rule.recommended.length > 0 ? (
            <p style={{ margin: 0 }}>
              <strong style={{ color: '#9ab' }}>Recommended:</strong> {rule.recommended.join(', ')}
            </p>
          ) : null}
        </div>
      ) : null}
    </details>
  );
};
