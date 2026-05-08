'use client';

import { useDocumentInfo, useField } from '@payloadcms/ui';
import type { ReactElement } from 'react';
import { useCallback, useEffect, useId, useMemo, useState } from 'react';

import {
  type BadgeSeverity,
  type BlobAudit,
  auditBlobList,
} from '../../lib/jsonld/spec/required-fields';
import { ChevronDown } from './icons/Chevron';

type SchemaPreviewFieldProps = {
  /**
   * URL prefix passed by the seoSidebarFields helper, e.g. `/blog`.
   * Used to compose the public URL for the "Test in Rich Results"
   * deep-link. Empty string when sourceField already carries a full
   * path (Pages).
   */
  pathPrefix?: string;
  /**
   * Doc-level field that owns the URL part. Defaults to `slug`.
   */
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

const trimSlash = (s: string): string => s.replace(/^\/+|\/+$/g, '');

// Binary Valid / Invalid display for the Schema (JSON-LD) card.
// "Improvable" (required fields present but some recommended missing)
// is intentionally collapsed into Valid here — per SEO-team direction
// the badge is a pass/fail signal, not a tier. The recommended-missing
// list still shows below the badge so editors see the nudge to fill
// the optional fields; the badge just doesn't change tier for them.
//
// The underlying audit lib (lib/jsonld/spec/required-fields.ts)
// continues to compute the four-tier severity; other consumers
// (e.g. the SEO health score card) use the nuanced version.
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
    hint: 'Required fields present. Some recommended fields are missing — see the list below for opt-in improvements.',
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
  error?: string;
}

/**
 * Tier 1 of the Schema sidebar plan — a read-only preview card that
 * shows editors exactly what JSON-LD their page will emit, with a
 * spec-compliance badge and a one-click "Test in Rich Results"
 * deep-link.
 *
 * Data flows:
 *  - `useDocumentInfo()` gives us collection + numeric id.
 *  - We call the existing `/api/jsonld/:collection/:id` endpoint.
 *  - On the response, we run each blob through `auditBlob` to compute
 *    the badge severity.
 *  - The card refetches when the doc id changes or the editor saves
 *    (we listen for the form's `_status` field, which Payload bumps on
 *    every save).
 *
 * Tier 2 (add-ons) and Tier 3 (admin-only raw override) plug into
 * the same blob list later — the dispatcher will append them server-
 * side, and this preview will surface them with no UI changes here.
 */
export const SchemaPreviewField = (
  props: SchemaPreviewFieldProps,
): ReactElement => {
  const { pathPrefix = '', sourceField = 'slug' } = props;
  const headingId = useId();
  const { id: docId, collectionSlug } = useDocumentInfo();
  const { value: statusValue } = useField<string>({ path: '_status' });
  const { value: sourceValue } = useField<string>({ path: sourceField });

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
  });
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  // Refetch when the doc id changes or after a save (status flips).
  useEffect(() => {
    if (docId == null) {
      setFetchState({ status: 'idle', blobs: [] });
      return undefined;
    }
    if (!collectionSlug) {
      setFetchState({ status: 'idle', blobs: [] });
      return undefined;
    }
    if (!supported) {
      setFetchState({ status: 'unsupported', blobs: [] });
      return undefined;
    }
    if (statusValue !== 'published') {
      setFetchState({ status: 'unpublished', blobs: [] });
      return undefined;
    }

    let cancelled = false;
    setFetchState((s) => ({ status: 'loading', blobs: s.blobs }));

    fetch(
      `/api/jsonld/${encodeURIComponent(collectionSlug)}/${encodeURIComponent(String(docId))}`,
      { credentials: 'include' },
    )
      .then(async (res) => {
        if (!res.ok) {
          const body = (await res.json().catch(() => null)) as
            | { error?: string }
            | null;
          throw new Error(body?.error ?? `HTTP ${res.status}`);
        }
        return res.json() as Promise<{ blobs?: Record<string, unknown>[] }>;
      })
      .then((body) => {
        if (cancelled) return;
        const blobs = Array.isArray(body.blobs) ? body.blobs : [];
        setFetchState({ status: 'ok', blobs });
      })
      .catch((err: Error) => {
        if (cancelled) return;
        setFetchState({ status: 'error', blobs: [], error: err.message });
      });

    return () => {
      cancelled = true;
    };
  }, [docId, collectionSlug, statusValue, supported]);

  const audit = useMemo(
    () => auditBlobList(fetchState.blobs),
    [fetchState.blobs],
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
        <SeverityChip
          severity={
            fetchState.status === 'ok'
              ? audit.severity
              : fetchState.status === 'unsupported'
                ? 'grey'
                : fetchState.status === 'unpublished'
                  ? 'grey'
                  : fetchState.status === 'error'
                    ? 'red'
                    : 'grey'
          }
          label={
            fetchState.status === 'unsupported'
              ? 'No builder'
              : fetchState.status === 'unpublished'
                ? 'Draft'
                : fetchState.status === 'loading'
                  ? 'Checking…'
                  : fetchState.status === 'error'
                    ? 'Error'
                    : severityCopy[audit.severity].label
          }
        />
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
          />
        </div>
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
      <span
        aria-hidden="true"
        style={{
          width: 6,
          height: 6,
          borderRadius: '50%',
          background: 'currentColor',
          display: 'inline-block',
        }}
      />
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
}): ReactElement => {
  const { fetchState, audit, publicUrl, richResultsUrl, copied, onCopy } = props;

  if (fetchState.status === 'unsupported') {
    return (
      <p className="cs-schema-preview__hint">
        No JSON-LD builder is registered for this collection yet. Phase 2 of the
        SEO sidebar plan adds builders for events, webinars, jobs, pages, and
        resources.
      </p>
    );
  }

  if (fetchState.status === 'unpublished') {
    return (
      <p className="cs-schema-preview__hint">
        Schema is generated only for published documents. Save and publish to
        see the JSON-LD that will be emitted.
      </p>
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
      {audit.perBlob.map((blobAudit, idx) => {
        const blob = fetchState.blobs[idx];
        if (!blob) return null;
        const hasIssues =
          blobAudit.missingRequired.length > 0 ||
          blobAudit.missingRecommended.length > 0;
        return (
          <div
            key={`${blobAudit.blobType}-${idx}`}
            className="cs-schema-preview__blob"
          >
            <div className="cs-schema-preview__blob-header">
              <code>@type: {blobAudit.blobType}</code>
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
                {blobAudit.missingRecommended.map((key) => (
                  <li key={`rec-${key}`} data-severity="amber">
                    recommended · <code>{key}</code>
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
      </div>
    </>
  );
};
