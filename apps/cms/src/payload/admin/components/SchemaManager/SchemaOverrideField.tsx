'use client';

import { useField } from '@payloadcms/ui';
import type { ChangeEvent, ReactElement } from 'react';
import { useCallback, useId, useMemo, useState } from 'react';

import { parseUploadedSchema } from '../../../lib/jsonld/override-from-file';
import { buildIngestPlan, type IngestPlanItem } from '../../../lib/jsonld/override-validator';
import { auditBlob } from '../../../lib/jsonld/spec/required-fields';
import { DEFAULT_SITE_URL } from '../_site-url';

interface SchemaOverrideFieldProps {
  /** Field path injected by Payload (e.g. "additionalSchema"). */
  path: string;
}

interface BlockReport {
  item: IngestPlanItem;
  missingRequired: readonly string[];
}

const stringify = (value: unknown): string =>
  value == null ? '' : JSON.stringify(value, null, 2);

const toBlobs = (value: unknown): unknown[] =>
  Array.isArray(value) ? value : value != null ? [value] : [];

const typesOf = (value: unknown): string[] =>
  toBlobs(value)
    .map((b) => {
      if (b != null && typeof b === 'object') {
        const t = (b as { '@type'?: unknown })['@type'];
        if (typeof t === 'string') return t;
        if (Array.isArray(t) && typeof t[0] === 'string') return t[0];
      }
      return null;
    })
    .filter((t): t is string => Boolean(t));

/**
 * Schema (JSON-LD) override editor for a pageRegistry row: paste raw JSON-LD OR
 * upload a .txt/.json file (multiple <script> blocks supported). Auto-detects
 * the @type of every pasted block, shows the allow-list, and a Validate button
 * runs the full check — allow-list, conflicts with the site-wide schema
 * (Organization/WebSite/BreadcrumbList), off-domain @id, and Google
 * required-field gaps — reporting per block. Each block overrides only its own
 * @type; other nodes are untouched. Stored via useField; composed at build.
 */
export const SchemaOverrideField = ({ path }: SchemaOverrideFieldProps): ReactElement => {
  const inputId = useId();
  const fileId = useId();
  const { value, setValue } = useField<unknown>({ path });

  const [text, setText] = useState<string>(() => stringify(value));
  const [syntaxError, setSyntaxError] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [report, setReport] = useState<BlockReport[] | null>(null);

  const liveTypes = useMemo(() => typesOf(value), [value]);

  const commit = useCallback(
    (next: unknown, asText: string): void => {
      setValue(next);
      setText(asText);
      setReport(null);
    },
    [setValue],
  );

  const onTextChange = (e: ChangeEvent<HTMLTextAreaElement>): void => {
    const next = e.target.value;
    setText(next);
    setWarnings([]);
    setReport(null);
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
    const result = parseUploadedSchema(await file.text());
    setWarnings([...result.warnings]);
    if (result.error || result.value == null) {
      setSyntaxError(result.error ?? 'Could not parse file');
    } else {
      setSyntaxError(null);
      commit(result.value, stringify(result.value));
    }
    e.target.value = '';
  };

  const onValidate = (): void => {
    if (value == null) {
      setReport([]);
      return;
    }
    const plan = buildIngestPlan(toBlobs(value), {
      collectionSlug: 'pageRegistry',
      siteOrigin: DEFAULT_SITE_URL,
    });
    setReport(
      plan.items.map((item) => ({
        item,
        missingRequired:
          item.action === 'merge'
            ? auditBlob(item.blob as Record<string, unknown>).missingRequired
            : [],
      })),
    );
  };

  return (
    <div className="field-type" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      <label htmlFor={inputId} style={{ fontWeight: 600 }}>
        Schema (JSON-LD) override
      </label>

      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <label htmlFor={fileId} style={{ cursor: 'pointer', fontSize: '0.85em', color: '#0a7', fontWeight: 600 }}>
          ⬆ Upload .txt / .json
        </label>
        <input
          id={fileId}
          type="file"
          accept=".txt,.json,.html,application/json,text/plain"
          onChange={onFile}
          style={{ display: 'none' }}
        />
        {liveTypes.length > 0 ? (
          <span style={{ fontSize: '0.85em', color: '#555' }}>
            detected: {liveTypes.map((t) => (
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
        placeholder='Paste JSON-LD, e.g. {"@context":"https://schema.org","@type":"SoftwareApplication", ...}'
        style={{ fontFamily: 'monospace', fontSize: '0.85em', width: '100%', padding: '0.5rem' }}
      />

      <div>
        <button
          type="button"
          onClick={onValidate}
          disabled={value == null || syntaxError != null}
          style={{
            fontSize: '0.85em',
            fontWeight: 600,
            padding: '0.3rem 0.8rem',
            borderRadius: 6,
            border: '1px solid #0a7',
            color: '#0a7',
            background: 'none',
            cursor: value == null || syntaxError != null ? 'not-allowed' : 'pointer',
            opacity: value == null || syntaxError != null ? 0.5 : 1,
          }}
        >
          ✓ Validate schema
        </button>
      </div>

      {syntaxError ? (
        <p style={{ color: '#c00', fontSize: '0.85em', margin: 0 }}>JSON error: {syntaxError}</p>
      ) : null}

      {warnings.length > 0 ? (
        <ul style={{ color: '#a70', fontSize: '0.8em', margin: 0, paddingLeft: '1.2rem' }}>
          {warnings.map((w) => (
            <li key={w}>{w}</li>
          ))}
        </ul>
      ) : null}

      {report != null ? (
        report.length === 0 ? (
          <p style={{ color: '#888', fontSize: '0.85em', margin: 0 }}>Nothing to validate.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            {report.map(({ item, missingRequired }, i) => {
              const ok = item.action === 'merge';
              return (
                <div
                  key={`${item.blobType}-${i}`}
                  style={{ fontSize: '0.82em', borderLeft: `3px solid ${ok ? '#0a7' : '#c70'}`, padding: '0.2rem 0.6rem' }}
                >
                  <strong>
                    {ok ? '✓' : '⚠'} <code>{item.blobType}</code>
                  </strong>{' '}
                  — {ok ? 'will override this @type' : item.message}
                  {ok && missingRequired.length > 0 ? (
                    <div style={{ color: '#a70' }}>
                      missing required for rich results: {missingRequired.join(', ')}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        )
      ) : null}
    </div>
  );
};
