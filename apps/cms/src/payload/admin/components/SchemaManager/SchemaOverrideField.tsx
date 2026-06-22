'use client';

import { useField } from '@payloadcms/ui';
import type { ChangeEvent, ReactElement } from 'react';
import { useEffect, useId, useMemo, useState } from 'react';

import { parseUploadedSchema } from '../../../lib/jsonld/override-from-file';
import { validateOverrideForCollection } from '../../../lib/jsonld/override-validator';

interface SchemaOverrideFieldProps {
  /** Field path injected by Payload (e.g. "additionalSchema"). */
  path: string;
}

const stringify = (value: unknown): string =>
  value == null ? '' : JSON.stringify(value, null, 2);

const typesOf = (value: unknown): string[] => {
  const blobs = Array.isArray(value) ? value : value != null ? [value] : [];
  const out: string[] = [];
  for (const blob of blobs) {
    if (blob != null && typeof blob === 'object') {
      const t = (blob as { '@type'?: unknown })['@type'];
      if (typeof t === 'string') out.push(t);
      else if (Array.isArray(t)) for (const e of t) if (typeof e === 'string') out.push(e);
    }
  }
  return out;
};

/**
 * Schema (JSON-LD) override editor for a pageRegistry row: paste raw JSON-LD OR
 * upload a .txt/.json file (multiple <script> blocks supported), with live
 * validation against the allow-list/size/@id rules and an @type preview. Stores
 * the parsed value into the `additionalSchema` json field via useField (the
 * data-layer hook). Composed into the page's @graph at build time.
 */
export const SchemaOverrideField = ({ path }: SchemaOverrideFieldProps): ReactElement => {
  const inputId = useId();
  const fileId = useId();
  const { value, setValue } = useField<unknown>({ path });

  const [text, setText] = useState<string>(() => stringify(value));
  const [syntaxError, setSyntaxError] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);

  // Re-sync the editor when the stored value changes elsewhere (e.g. reset).
  useEffect(() => {
    setText(stringify(value));
  }, [value]);

  const validation = useMemo(() => {
    if (value == null) return { ok: true, message: '' as string };
    const r = validateOverrideForCollection(value, 'pageRegistry');
    return { ok: r.ok, message: r.ok ? '' : `${r.message}${r.issues[0] ? ` — ${r.issues[0].message}` : ''}` };
  }, [value]);

  const types = useMemo(() => typesOf(value), [value]);

  const onTextChange = (e: ChangeEvent<HTMLTextAreaElement>): void => {
    const next = e.target.value;
    setText(next);
    setWarnings([]);
    if (next.trim().length === 0) {
      setSyntaxError(null);
      setValue(null);
      return;
    }
    try {
      setValue(JSON.parse(next));
      setSyntaxError(null);
    } catch (err) {
      setSyntaxError(err instanceof Error ? err.message : 'Invalid JSON');
    }
  };

  const onFile = async (e: ChangeEvent<HTMLInputElement>): Promise<void> => {
    const file = e.target.files?.[0];
    if (!file) return;
    const raw = await file.text();
    const result = parseUploadedSchema(raw);
    setWarnings([...result.warnings]);
    if (result.error || result.value == null) {
      setSyntaxError(result.error ?? 'Could not parse file');
      return;
    }
    setSyntaxError(null);
    setValue(result.value);
    setText(stringify(result.value));
    e.target.value = '';
  };

  return (
    <div className="field-type" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      <label htmlFor={inputId} style={{ fontWeight: 600 }}>
        Schema (JSON-LD) override
      </label>

      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <label
          htmlFor={fileId}
          style={{ cursor: 'pointer', fontSize: '0.85em', color: '#0a7', fontWeight: 600 }}
        >
          ⬆ Upload .txt / .json
        </label>
        <input
          id={fileId}
          type="file"
          accept=".txt,.json,.html,application/json,text/plain"
          onChange={onFile}
          style={{ display: 'none' }}
        />
        {types.length > 0 ? (
          <span style={{ fontSize: '0.85em', color: '#555' }}>
            @type: {types.map((t) => (
              <code key={t} style={{ marginRight: 4 }}>{t}</code>
            ))}
          </span>
        ) : null}
      </div>

      <textarea
        id={inputId}
        value={text}
        onChange={onTextChange}
        rows={12}
        spellCheck={false}
        placeholder='Paste JSON-LD, e.g. {"@context":"https://schema.org","@type":"WebPage", ...}'
        style={{ fontFamily: 'monospace', fontSize: '0.85em', width: '100%', padding: '0.5rem' }}
      />

      {syntaxError ? (
        <p style={{ color: '#c00', fontSize: '0.85em', margin: 0 }}>JSON error: {syntaxError}</p>
      ) : !validation.ok ? (
        <p style={{ color: '#c00', fontSize: '0.85em', margin: 0 }}>Invalid: {validation.message}</p>
      ) : value != null ? (
        <p style={{ color: '#0a7', fontSize: '0.85em', margin: 0 }}>✓ Valid override</p>
      ) : null}

      {warnings.length > 0 ? (
        <ul style={{ color: '#a70', fontSize: '0.8em', margin: 0, paddingLeft: '1.2rem' }}>
          {warnings.map((w) => (
            <li key={w}>{w}</li>
          ))}
        </ul>
      ) : null}
    </div>
  );
};
