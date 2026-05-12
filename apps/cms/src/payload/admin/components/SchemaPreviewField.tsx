'use client';

import { useAuth, useDocumentInfo, useField } from '@payloadcms/ui';
import type { ReactElement } from 'react';
import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import {
  AUTO_EMITTED_TYPES_BY_COLLECTION,
  buildIngestPlan,
  parseLenientMulti,
  type IngestPlan,
  type IngestPlanItem,
} from '../../lib/jsonld/override-validator';
import {
  type BadgeSeverity,
  type BlobAudit,
  auditBlobList,
} from '../../lib/jsonld/spec/required-fields';
import { ChevronDown } from './icons/Chevron';

const CopyIcon = (): ReactElement => (
  <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <rect x="5" y="5" width="9" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
    <path
      d="M11 5V3.5A1.5 1.5 0 0 0 9.5 2H3.5A1.5 1.5 0 0 0 2 3.5v6A1.5 1.5 0 0 0 3.5 11H5"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
);

const CheckIcon = (): ReactElement => (
  <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <polyline
      points="2,8 6,12 14,4"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

type SchemaPreviewFieldProps = {
  pathPrefix?: string;
  sourceField?: string;
};

const DEFAULT_SITE_URL =
  (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_SITE_URL) ||
  'https://cleanstart.com';

const SUPPORTED_COLLECTIONS = new Set([
  'blogs',
  'news',
  'guides',
  'knowledgeBase',
  'authors',
  'events',
  'webinars',
  'jobs',
  'pages',
  'resources',
]);

const MAX_UPLOAD_BYTES = 64 * 1024;

const trimSlash = (s: string): string => s.replace(/^\/+|\/+$/g, '');

const severityCopy: Record<
  BadgeSeverity,
  { label: string; tone: string; hint: string }
> = {
  green: {
    label: 'Valid',
    tone: 'var(--color-success-500, #00c46a)',
    hint: 'All required fields present. Search engines will accept this schema.',
  },
  amber: {
    label: 'Valid',
    tone: 'var(--color-success-500, #00c46a)',
    hint: 'Required fields present. Some recommended fields are missing.',
  },
  red: {
    label: 'Invalid',
    tone: 'var(--color-error-500, #ff5c5c)',
    hint: 'One or more required fields are missing. Search engines may ignore this schema.',
  },
  grey: {
    label: 'Unverified',
    tone: 'var(--theme-text-soft, #a4a7af)',
    hint: 'No spec rule registered for this @type. Treat the preview as informational only.',
  },
};

interface FetchState {
  status: 'idle' | 'loading' | 'ok' | 'error' | 'unsupported' | 'unpublished';
  blobs: readonly Record<string, unknown>[];
  fromPreview: boolean;
  autoTypes: ReadonlySet<string>;
  error?: string;
}

const blobTypeOf = (blob: Record<string, unknown>): string => {
  const raw = blob['@type'];
  if (typeof raw === 'string') return raw;
  if (Array.isArray(raw) && typeof raw[0] === 'string') return raw[0];
  return 'Unknown';
};

const stringifyValue = (value: unknown): string => {
  if (value == null) return '';
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return '';
  }
};

const overrideBlobsOf = (value: unknown): Record<string, unknown>[] => {
  if (value == null) return [];
  if (Array.isArray(value)) return value as Record<string, unknown>[];
  return [value as Record<string, unknown>];
};

export const SchemaPreviewField = (
  props: SchemaPreviewFieldProps,
): ReactElement => {
  const { pathPrefix = '', sourceField = 'slug' } = props;
  const headingId = useId();
  const { user } = useAuth();
  const { id: docId, collectionSlug } = useDocumentInfo();
  const { value: statusValue } = useField<string>({ path: '_status' });
  const { value: sourceValue } = useField<string>({ path: sourceField });
  const { value: overrideValue, setValue: setOverrideValue } = useField<unknown>({
    path: 'seo.additionalSchema',
  });

  const isAdmin = useMemo(() => {
    const roles = (user as { roles?: readonly string[] } | null | undefined)?.roles;
    return Array.isArray(roles) && roles.includes('admin');
  }, [user]);

  const supported = useMemo(
    () => (collectionSlug ? SUPPORTED_COLLECTIONS.has(collectionSlug) : false),
    [collectionSlug],
  );

  const publicUrl = useMemo(() => {
    if (!sourceValue) return '';
    const root = DEFAULT_SITE_URL.replace(/\/+$/, '');
    const prefix = pathPrefix ? `/${trimSlash(pathPrefix)}` : '';
    return `${root}${prefix}/${trimSlash(sourceValue)}`;
  }, [sourceValue, pathPrefix]);

  const [fetchState, setFetchState] = useState<FetchState>({
    status: 'idle',
    blobs: [],
    fromPreview: false,
    autoTypes: new Set(),
  });
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  const persistedTextRef = useRef<string>(stringifyValue(overrideValue));
  useEffect(() => {
    persistedTextRef.current = stringifyValue(overrideValue);
  }, [overrideValue]);

  useEffect(() => {
    if (docId == null || !collectionSlug) {
      setFetchState({ status: 'idle', blobs: [], fromPreview: false, autoTypes: new Set() });
      return undefined;
    }
    if (!supported) {
      setFetchState({ status: 'unsupported', blobs: [], fromPreview: false, autoTypes: new Set() });
      return undefined;
    }

    const canPreview = isAdmin && (overrideValue != null || statusValue !== 'published');

    if (!canPreview && statusValue !== 'published') {
      setFetchState({ status: 'unpublished', blobs: [], fromPreview: false, autoTypes: new Set() });
      return undefined;
    }

    let cancelled = false;
    setFetchState((s) => ({ ...s, status: 'loading' }));

    const url = `/api/jsonld/${encodeURIComponent(collectionSlug)}/${encodeURIComponent(String(docId))}`;

    const request: Promise<Response> = canPreview
      ? fetch(url, {
          method: 'POST',
          credentials: 'include',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ additionalSchema: overrideValue ?? null }),
        })
      : fetch(url, { credentials: 'include' });

    request
      .then(async (res) => {
        if (!res.ok) {
          const body = (await res.json().catch(() => null)) as
            | { error?: string; message?: string }
            | null;
          throw new Error(body?.message ?? body?.error ?? `HTTP ${res.status}`);
        }
        return res.json() as Promise<{ blobs?: Record<string, unknown>[] }>;
      })
      .then((body) => {
        if (cancelled) return;
        const blobs = Array.isArray(body.blobs) ? body.blobs : [];
        const overrideBlobsList = canPreview ? overrideBlobsOf(overrideValue) : [];
        const overrideTypes = new Set(overrideBlobsList.map(blobTypeOf));
        const autoTypes = new Set<string>();
        for (const b of blobs) {
          const t = blobTypeOf(b);
          if (!overrideTypes.has(t)) autoTypes.add(t);
        }
        setFetchState({ status: 'ok', blobs, fromPreview: canPreview, autoTypes });
      })
      .catch((err: Error) => {
        if (cancelled) return;
        setFetchState({
          status: 'error',
          blobs: [],
          fromPreview: false,
          autoTypes: new Set(),
          error: err.message,
        });
      });

    return () => {
      cancelled = true;
    };
  }, [docId, collectionSlug, statusValue, supported, overrideValue, isAdmin]);

  const audit = useMemo(
    () => auditBlobList(fetchState.blobs),
    [fetchState.blobs],
  );

  const overrideBlobs = useMemo(() => overrideBlobsOf(overrideValue), [overrideValue]);
  const overrideTypeSet = useMemo(
    () => new Set(overrideBlobs.map(blobTypeOf)),
    [overrideBlobs],
  );

  const handleCopy = useCallback(() => {
    if (fetchState.blobs.length === 0) return;
    if (typeof navigator === 'undefined' || !navigator.clipboard) return;
    void navigator.clipboard.writeText(
      JSON.stringify(fetchState.blobs, null, 2),
    );
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  }, [fetchState.blobs]);

  const richResultsUrl = useMemo(
    () =>
      publicUrl
        ? `https://search.google.com/test/rich-results?url=${encodeURIComponent(publicUrl)}`
        : null,
    [publicUrl],
  );

  const overallSeverity: BadgeSeverity = (() => {
    if (fetchState.status === 'ok') return audit.severity;
    if (
      fetchState.status === 'unsupported' ||
      fetchState.status === 'unpublished' ||
      fetchState.status === 'idle' ||
      fetchState.status === 'loading'
    ) {
      return 'grey';
    }
    return 'red';
  })();

  const overallLabel: string =
    fetchState.status === 'unsupported'
      ? 'No builder'
      : fetchState.status === 'unpublished'
        ? 'Draft'
        : fetchState.status === 'loading'
          ? 'Checking…'
          : fetchState.status === 'error'
            ? 'Error'
            : severityCopy[audit.severity].label;

  const handleModalApply = useCallback(
    (next: readonly Record<string, unknown>[]) => {
      if (next.length === 0) {
        setOverrideValue(null);
      } else if (next.length === 1) {
        setOverrideValue(next[0]);
      } else {
        setOverrideValue(next);
      }
      setModalOpen(false);
    },
    [setOverrideValue],
  );

  return (
    <div className="cs-schema-preview" data-expanded={expanded ? 'true' : 'false'}>
      <button
        type="button"
        className="cs-schema-preview__header"
        aria-expanded={expanded}
        aria-controls={headingId}
        onClick={() => setExpanded((v) => !v)}
      >
        <span className="cs-schema-preview__title">Schema (JSON-LD)</span>
        <SeverityChip severity={overallSeverity} label={overallLabel} />
        <span className="cs-schema-preview__chevron" aria-hidden="true">
          <ChevronDown />
        </span>
      </button>

      {expanded && (
        <div id={headingId} className="cs-schema-preview__body">
          <SchemaBodyContent
            fetchState={fetchState}
            audit={audit}
            publicUrl={publicUrl}
            richResultsUrl={richResultsUrl}
            copied={copied}
            onCopy={handleCopy}
            overrideTypes={overrideTypeSet}
            isAdmin={isAdmin}
            supported={supported}
            overrideCount={overrideBlobs.length}
            onOpenEditor={() => setModalOpen(true)}
          />

          {!isAdmin && overrideBlobs.length > 0 && (
            <p className="cs-schema-preview__hint">
              Custom additions: {overrideBlobs.length} blob
              {overrideBlobs.length === 1 ? '' : 's'} (
              {Array.from(overrideTypeSet).join(', ')}). Admin role required to edit.
            </p>
          )}
        </div>
      )}

      {modalOpen && (
        <SchemaOverrideModal
          collectionSlug={collectionSlug ?? null}
          siteOrigin={DEFAULT_SITE_URL}
          currentOverrides={overrideBlobs}
          onApply={handleModalApply}
          onCancel={() => setModalOpen(false)}
        />
      )}
    </div>
  );
};

const SeverityChip = (props: {
  severity: BadgeSeverity;
  label: string;
}): ReactElement => {
  const { severity, label } = props;
  const tone = severityCopy[severity].tone;
  return (
    <span
      className="cs-schema-preview__chip"
      data-severity={severity}
      style={{ color: tone }}
      title={severityCopy[severity].hint}
    >
      {label}
    </span>
  );
};

const SchemaBodyContent = (props: {
  fetchState: FetchState;
  audit: { severity: BadgeSeverity; perBlob: readonly BlobAudit[] };
  publicUrl: string;
  richResultsUrl: string | null;
  copied: boolean;
  onCopy: () => void;
  overrideTypes: ReadonlySet<string>;
  isAdmin: boolean;
  supported: boolean;
  overrideCount: number;
  onOpenEditor: () => void;
}): ReactElement => {
  const {
    fetchState,
    audit,
    publicUrl,
    richResultsUrl,
    copied,
    onCopy,
    overrideTypes,
    isAdmin,
    supported,
    overrideCount,
    onOpenEditor,
  } = props;

  const [blobCopied, setBlobCopied] = useState<number | null>(null);

  const handleBlobCopy = useCallback((blob: Record<string, unknown>, idx: number) => {
    if (typeof navigator === 'undefined' || !navigator.clipboard) return;
    void navigator.clipboard.writeText(JSON.stringify(blob, null, 2));
    setBlobCopied(idx);
    window.setTimeout(() => setBlobCopied((prev) => (prev === idx ? null : prev)), 1500);
  }, []);

  if (fetchState.status === 'unsupported') {
    return (
      <p className="cs-schema-preview__hint">
        No JSON-LD builder is registered for this collection yet.
      </p>
    );
  }

  if (fetchState.status === 'unpublished') {
    return (
      <>
        <p className="cs-schema-preview__hint">
          Schema is generated only for published documents. Save and publish to
          see the JSON-LD that will be emitted.
        </p>
        {isAdmin && (
          <EditOverridesButton overrideCount={overrideCount} onClick={onOpenEditor} />
        )}
      </>
    );
  }

  if (fetchState.status === 'loading') {
    return (
      <p className="cs-schema-preview__hint" aria-live="polite">
        Loading JSON-LD…
      </p>
    );
  }

  if (fetchState.status === 'error') {
    return (
      <p
        className="cs-schema-preview__hint"
        style={{ color: 'var(--color-error-500, #ff5c5c)' }}
      >
        Couldn’t load preview: {fetchState.error ?? 'unknown error'}
      </p>
    );
  }

  if (fetchState.blobs.length === 0) {
    return (
      <p className="cs-schema-preview__hint">No JSON-LD blobs returned.</p>
    );
  }

  return (
    <>
      {fetchState.fromPreview && (
        <p
          className="cs-schema-preview__hint"
          style={{
            background: 'var(--theme-elevation-50, rgba(255,255,255,0.04))',
            padding: '0.5rem 0.65rem',
            borderRadius: 4,
            margin: '0 0 0.75rem',
          }}
        >
          Preview only — custom additions apply on publish.
        </p>
      )}

      {audit.perBlob.map((blobAudit, idx) => {
        const blob = fetchState.blobs[idx];
        if (!blob) return null;
        const hasIssues = blobAudit.missingRequired.length > 0;
        const isCustom = overrideTypes.has(blobAudit.blobType);
        return (
          <div
            key={`${blobAudit.blobType}-${idx}`}
            className="cs-schema-preview__blob"
          >
            <div className="cs-schema-preview__blob-header">
              <button
                type="button"
                className="cs-schema-preview__blob-copy"
                aria-label={`Copy ${blobAudit.blobType} JSON-LD`}
                title={blobCopied === idx ? 'Copied!' : `Copy ${blobAudit.blobType} JSON`}
                onClick={() => handleBlobCopy(blob, idx)}
              >
                {blobCopied === idx ? <CheckIcon /> : <CopyIcon />}
              </button>
              <code>@type: {blobAudit.blobType}</code>
              {isCustom && (
                <span
                  className="cs-schema-preview__chip"
                  data-severity="grey"
                  style={{
                    marginLeft: '0.4rem',
                    color: 'var(--theme-text-soft, #a4a7af)',
                  }}
                  title="From custom additions (seo.additionalSchema)"
                >
                  Custom
                </span>
              )}
              <SeverityChip
                severity={blobAudit.severity}
                label={severityCopy[blobAudit.severity].label}
              />
            </div>
            {hasIssues && (
              <ul className="cs-schema-preview__issues">
                {blobAudit.missingRequired.map((key) => (
                  <li key={`req-${key}`} data-severity="red">
                    <strong>required</strong> · <code>{key}</code>
                  </li>
                ))}
              </ul>
            )}
          </div>
        );
      })}

      <details className="cs-schema-preview__raw">
        <summary>Show raw JSON-LD</summary>
        <pre>
          <code>{JSON.stringify(fetchState.blobs, null, 2)}</code>
        </pre>
      </details>

      <div className="cs-schema-preview__actions">
        <button
          type="button"
          onClick={onCopy}
          className="cs-schema-preview__btn"
          data-tone={copied ? 'success' : 'neutral'}
        >
          {copied ? 'Copied!' : 'Copy JSON-LD'}
        </button>
        {richResultsUrl && publicUrl && (
          <a
            href={richResultsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="cs-schema-preview__btn"
          >
            Test in Rich Results ↗
          </a>
        )}
        {isAdmin && supported && (
          <EditOverridesButton overrideCount={overrideCount} onClick={onOpenEditor} />
        )}
      </div>
    </>
  );
};

const EditOverridesButton = (props: {
  overrideCount: number;
  onClick: () => void;
}): ReactElement => (
  <button
    type="button"
    className="cs-schema-preview__btn"
    onClick={props.onClick}
    title="Paste raw JSON-LD or upload a file. Each block is reviewed before saving."
  >
    {props.overrideCount > 0
      ? `Edit custom overrides (${props.overrideCount})`
      : 'Add custom overrides'}
  </button>
);

interface SchemaOverrideModalProps {
  collectionSlug: string | null;
  siteOrigin: string;
  currentOverrides: readonly Record<string, unknown>[];
  onApply: (next: readonly Record<string, unknown>[]) => void;
  onCancel: () => void;
}

interface PickerRow {
  readonly item: IngestPlanItem;
  /** `null` when the row is not overridable; otherwise the user's choice. */
  readonly checked: boolean;
}

const reasonLabel: Record<IngestPlanItem['reason'], string> = {
  allowed: 'Merge',
  'duplicates-auto-emit': 'Auto-emitted',
  'off-allowlist': 'Not allowed',
  'collection-restricted': 'Wrong collection',
  'off-domain-id': 'Off-domain @id',
  'nested-id': 'Nested @id',
  'invalid-shape': 'Invalid',
  oversize: 'Too large',
};

const reasonTone: Record<IngestPlanItem['reason'], string> = {
  allowed: 'var(--color-success-500, #00c46a)',
  'duplicates-auto-emit': 'var(--theme-text-soft, #a4a7af)',
  'off-allowlist': 'var(--color-error-500, #ff5c5c)',
  'collection-restricted': 'var(--color-error-500, #ff5c5c)',
  'off-domain-id': 'var(--theme-warning-500, #d29922)',
  'nested-id': 'var(--color-error-500, #ff5c5c)',
  'invalid-shape': 'var(--color-error-500, #ff5c5c)',
  oversize: 'var(--color-error-500, #ff5c5c)',
};

const SchemaOverrideModal = (props: SchemaOverrideModalProps): ReactElement | null => {
  const { collectionSlug, siteOrigin, currentOverrides, onApply, onCancel } = props;
  const [text, setText] = useState<string>(() => {
    if (currentOverrides.length === 0) return '';
    if (currentOverrides.length === 1) return JSON.stringify(currentOverrides[0], null, 2);
    return JSON.stringify(currentOverrides, null, 2);
  });
  const [uploadError, setUploadError] = useState<string>('');
  const [fileWarnings, setFileWarnings] = useState<readonly string[]>([]);
  const [parseErrors, setParseErrors] = useState<readonly { line?: number; message: string }[]>([]);
  const [plan, setPlan] = useState<IngestPlan | null>(null);
  const [decisions, setDecisions] = useState<Record<number, boolean>>({});

  const recompute = useCallback(
    (input: string) => {
      if (input.trim().length === 0) {
        setPlan(null);
        setDecisions({});
        setParseErrors([]);
        setFileWarnings([]);
        return;
      }
      const parsed = parseLenientMulti(input);
      const blobs: unknown[] = [];
      const errs: { line?: number; message: string }[] = [];
      for (const block of parsed.blocks) {
        if (block.ok) blobs.push(block.data);
        else errs.push({ message: block.message, ...(block.line ? { line: block.line } : {}) });
      }
      const allWarnings = [
        ...parsed.warnings,
        ...parsed.blocks.flatMap((b) => (b.ok ? b.warnings : [])),
      ];
      setFileWarnings(allWarnings);
      setParseErrors(errs);
      // Flatten: if a parsed block is itself an array of blobs (the
      // legitimate single-blob-array shape), expand it so the picker
      // operates on individual `@type`s.
      const flat: unknown[] = [];
      for (const b of blobs) {
        if (Array.isArray(b)) flat.push(...b);
        else flat.push(b);
      }
      const nextPlan = buildIngestPlan(flat, { collectionSlug, siteOrigin });
      setPlan(nextPlan);
      const initial: Record<number, boolean> = {};
      nextPlan.items.forEach((item, idx) => {
        initial[idx] = item.action === 'merge';
      });
      setDecisions(initial);
    },
    [collectionSlug, siteOrigin],
  );

  useEffect(() => {
    recompute(text);
  }, [text, recompute]);

  const handleFile = useCallback(
    (file: File | null | undefined) => {
      if (!file) return;
      if (file.size > MAX_UPLOAD_BYTES) {
        setUploadError(`File is ${file.size} bytes; max is ${MAX_UPLOAD_BYTES}.`);
        return;
      }
      setUploadError('');
      void file.text().then((content) => {
        setText(content);
      });
    },
    [],
  );

  const handleFormat = useCallback(() => {
    const parsed = parseLenientMulti(text);
    const allBlobs: unknown[] = [];
    for (const block of parsed.blocks) {
      if (block.ok) allBlobs.push(block.data);
    }
    if (allBlobs.length === 0) {
      setUploadError('No parseable JSON-LD blocks found to format.');
      return;
    }
    setUploadError('');
    setText(
      allBlobs.length === 1
        ? JSON.stringify(allBlobs[0], null, 2)
        : JSON.stringify(allBlobs, null, 2),
    );
  }, [text]);

  const rows: readonly PickerRow[] = useMemo(() => {
    if (!plan) return [];
    return plan.items.map((item, idx) => ({
      item,
      checked: decisions[idx] ?? item.action === 'merge',
    }));
  }, [plan, decisions]);

  const toggleRow = useCallback((idx: number) => {
    setDecisions((prev) => {
      const cur = prev[idx] ?? rows[idx]?.checked ?? false;
      return { ...prev, [idx]: !cur };
    });
  }, [rows]);

  const handleApply = useCallback(() => {
    const merged: Record<string, unknown>[] = [];
    rows.forEach((row, idx) => {
      const checked = decisions[idx] ?? row.item.action === 'merge';
      if (checked && row.item.overridable) {
        merged.push(row.item.blob);
      } else if (checked && row.item.action === 'merge') {
        merged.push(row.item.blob);
      }
    });
    onApply(merged);
  }, [rows, decisions, onApply]);

  const summary = useMemo(() => {
    const mergeCount = rows.filter((r) => (decisions[rows.indexOf(r)] ?? r.item.action === 'merge')).length;
    return { mergeCount, total: rows.length };
  }, [rows, decisions]);

  // Portal to document.body so the modal escapes any ancestor stacking
  // context — without this, components like the Lexical body toolbar
  // (which sit higher in the document's stacking order with `z-index: 25`
  // inside their own context) end up rendered above the modal even
  // though the modal's local z-index is much larger.
  if (typeof document === 'undefined') return null;

  return createPortal(
    <div
      aria-label="Custom JSON-LD additions modal backdrop"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.55)',
        zIndex: 10000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <dialog
        open
        aria-modal="true"
        aria-label="Custom JSON-LD additions"
        onKeyDown={(e) => {
          if (e.key === 'Escape') onCancel();
        }}
        style={{
          background: 'var(--theme-elevation-100, #1c1f24)',
          color: 'var(--theme-text, #e6e6e6)',
          width: 'min(880px, 94vw)',
          maxHeight: '92vh',
          borderRadius: 8,
          padding: '1rem 1.25rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem',
          overflow: 'auto',
          border: 'none',
          position: 'static',
        }}
      >
        <h2 style={{ margin: 0, fontSize: '1rem' }}>Custom JSON-LD additions</h2>
        <p style={{ fontSize: '0.8rem', margin: 0, color: 'var(--theme-text-soft, #a4a7af)' }}>
          Paste raw JSON-LD, a full <code>&lt;script type="application/ld+json"&gt;</code> file,
          or upload a <code>.json</code>/<code>.jsonld</code>/<code>.txt</code> file (≤{' '}
          {MAX_UPLOAD_BYTES} bytes). Each block is reviewed against the page&rsquo;s
          auto-generated graph before saving — duplicates and off-domain @ids default to skip.
        </p>

        <label style={{ display: 'inline-flex', gap: '0.5rem', alignItems: 'center' }}>
          <input
            type="file"
            accept=".json,.jsonld,.txt,application/json,application/ld+json"
            onChange={(e) => handleFile(e.target.files?.[0])}
          />
        </label>

        {fileWarnings.length > 0 && (
          <ul
            style={{
              color: 'var(--theme-warning-500, #d29922)',
              fontSize: '0.8rem',
              margin: 0,
              paddingLeft: '1rem',
            }}
          >
            {fileWarnings.map((w) => (
              <li key={`fw-${w}`}>{w}</li>
            ))}
          </ul>
        )}
        {uploadError && (
          <p style={{ color: 'var(--color-error-500, #ff5c5c)', fontSize: '0.85rem', margin: 0 }}>
            {uploadError}
          </p>
        )}
        {parseErrors.length > 0 && (
          <ul
            style={{
              color: 'var(--color-error-500, #ff5c5c)',
              fontSize: '0.8rem',
              margin: 0,
              paddingLeft: '1rem',
            }}
          >
            {parseErrors.map((e) => (
              <li key={`pe-${e.message}-${e.line ?? 0}`}>
                {e.line ? `Line ${e.line}: ` : ''}
                {e.message}
              </li>
            ))}
          </ul>
        )}

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          spellCheck={false}
          rows={10}
          placeholder='{ "@context": "https://schema.org", "@type": "FAQPage", ... }'
          style={{
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
            fontSize: '0.82rem',
            background: 'var(--theme-elevation-50, #14171c)',
            color: 'inherit',
            border: '1px solid var(--theme-elevation-200, #2a2f36)',
            borderRadius: 4,
            padding: '0.5rem',
            width: '100%',
            resize: 'vertical',
            minHeight: 180,
          }}
        />

        {rows.length > 0 && (
          <div>
            <p style={{ margin: '0 0 0.4rem', fontSize: '0.85rem', fontWeight: 600 }}>
              Ingest plan ({summary.mergeCount} of {summary.total} will be merged)
            </p>
            <ul
              style={{
                listStyle: 'none',
                margin: 0,
                padding: 0,
                display: 'flex',
                flexDirection: 'column',
                gap: '0.4rem',
              }}
            >
              {rows.map((row, idx) => {
                const checked = decisions[idx] ?? row.item.action === 'merge';
                const tone = reasonTone[row.item.reason];
                const isAutoEmitted =
                  collectionSlug != null &&
                  AUTO_EMITTED_TYPES_BY_COLLECTION[collectionSlug]?.has(row.item.blobType);
                return (
                  <li
                    key={`row-${idx}-${row.item.blobType}`}
                    style={{
                      border: `1px solid ${tone}`,
                      borderRadius: 4,
                      padding: '0.5rem 0.65rem',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '0.6rem',
                      background: 'var(--theme-elevation-50, rgba(255,255,255,0.02))',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      disabled={!row.item.overridable && row.item.action === 'skip'}
                      onChange={() => toggleRow(idx)}
                      aria-label={`Include ${row.item.blobType}`}
                      style={{ marginTop: '0.2rem' }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                        <code style={{ fontSize: '0.85rem' }}>@type: {row.item.blobType}</code>
                        <span
                          style={{
                            fontSize: '0.7rem',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                            color: tone,
                            fontWeight: 600,
                          }}
                        >
                          {reasonLabel[row.item.reason]}
                        </span>
                        {isAutoEmitted && (
                          <span
                            style={{
                              fontSize: '0.7rem',
                              color: 'var(--theme-text-soft, #a4a7af)',
                            }}
                          >
                            (auto-emitted for {collectionSlug})
                          </span>
                        )}
                      </div>
                      <p
                        style={{
                          margin: '0.2rem 0 0',
                          fontSize: '0.78rem',
                          color: 'var(--theme-text-soft, #a4a7af)',
                        }}
                      >
                        {row.item.message}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
          <button type="button" className="cs-schema-preview__btn" onClick={handleFormat}>
            Format / lint
          </button>
          {currentOverrides.length > 0 && (
            <button
              type="button"
              className="cs-schema-preview__btn"
              onClick={() => onApply([])}
              title="Clear all custom overrides for this document"
            >
              Clear all
            </button>
          )}
          <button type="button" className="cs-schema-preview__btn" onClick={onCancel}>
            Cancel
          </button>
          <button
            type="button"
            className="cs-schema-preview__btn"
            data-tone="success"
            onClick={handleApply}
            disabled={rows.length === 0 && currentOverrides.length === 0}
          >
            Apply {summary.mergeCount > 0 ? `(${summary.mergeCount})` : ''}
          </button>
        </div>
      </dialog>
    </div>,
    document.body,
  );
};
