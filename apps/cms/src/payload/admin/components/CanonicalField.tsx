'use client';

import { useField } from '@payloadcms/ui';
import type { ChangeEvent, ReactElement } from 'react';
import { useEffect, useId, useMemo, useState } from 'react';

import { ChevronDown } from './icons/Chevron';
import { useDocPublicUrl } from './_redirects-shared';

type CanonicalFieldProps = {
  /** URL prefix for the collection's public route (e.g. `/blog`). */
  pathPrefix?: string;
  /** Doc-level field that owns the URL part. Defaults to `slug`. */
  sourceField?: string;
};

type CanonicalHealth =
  | { kind: 'idle' }
  | { kind: 'checking' }
  | { kind: 'healthy'; status: number; redirected: boolean; finalUrl: string }
  | { kind: 'broken'; status: number }
  | { kind: 'failed'; reason: string };

/**
 * Right-rail "Canonical URL" card.
 *
 * Self-canonical by default — every page emits its own URL as the
 * canonical signal. The card surfaces this so editors can see which
 * URL search engines will be told is the source-of-truth, and toggle
 * an off-domain override for republished content.
 *
 * The override is honoured live by `docCanonicalUrl()` in
 * lib/jsonld/url.ts, so the JSON-LD `url` / `mainEntityOfPage` /
 * `@id` fields immediately use the override when set + valid.
 *
 * Mounted via `seoCanonicalSidebarField()` in fields/seo.ts.
 */
export const CanonicalField = (props: CanonicalFieldProps): ReactElement => {
  const inputId = useId();
  const headingId = useId();
  const [expanded, setExpanded] = useState(false);

  const { value: useCustomCanonical, setValue: setUseCustomCanonical } = useField<boolean>({
    path: 'seo.useCustomCanonical',
  });
  const { value: canonicalOverride, setValue: setCanonicalOverride } = useField<string | null>({
    path: 'seo.canonicalOverride',
  });

  // exactOptionalPropertyTypes is on; only forward defined props.
  const docUrlArgs: { pathPrefix?: string; sourceField?: string } = {};
  if (props.pathPrefix !== undefined) docUrlArgs.pathPrefix = props.pathPrefix;
  if (props.sourceField !== undefined) docUrlArgs.sourceField = props.sourceField;
  const { publicUrl } = useDocPublicUrl(docUrlArgs);

  const [health, setHealth] = useState<CanonicalHealth>({ kind: 'idle' });

  // Debounced HEAD-check on the override URL so editors notice broken
  // canonicals before publish. Only fires when the override is enabled
  // and the URL has an http(s) scheme.
  useEffect(() => {
    const value = (canonicalOverride ?? '').trim();
    if (!useCustomCanonical || value.length === 0 || !/^https?:\/\//i.test(value)) {
      setHealth({ kind: 'idle' });
      return undefined;
    }
    let cancelled = false;
    const timer = window.setTimeout(async () => {
      if (cancelled) return;
      setHealth({ kind: 'checking' });
      try {
        const url = new URL('/api/canonical/health-check', window.location.origin);
        url.searchParams.set('url', value);
        const res = await fetch(url.toString(), { credentials: 'include' });
        if (!res.ok) {
          if (!cancelled) setHealth({ kind: 'failed', reason: `HTTP ${res.status}` });
          return;
        }
        const json = (await res.json()) as
          | { ok: true; status: number; healthy: boolean; redirected: boolean; finalUrl: string }
          | { ok: false; kind: string; message?: string };
        if (cancelled) return;
        if (!json.ok) {
          setHealth({
            kind: 'failed',
            reason: 'message' in json ? json.message ?? json.kind : json.kind,
          });
          return;
        }
        if (json.healthy) {
          setHealth({
            kind: 'healthy',
            status: json.status,
            redirected: json.redirected,
            finalUrl: json.finalUrl,
          });
        } else {
          setHealth({ kind: 'broken', status: json.status });
        }
      } catch (err) {
        if (cancelled) return;
        setHealth({
          kind: 'failed',
          reason: err instanceof Error ? err.message : String(err),
        });
      }
    }, 600);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [useCustomCanonical, canonicalOverride]);

  const trimmedOverride = (canonicalOverride ?? '').trim();
  const overrideActive = useCustomCanonical === true && trimmedOverride.length > 0;
  const effectiveUrl = overrideActive ? trimmedOverride : publicUrl;

  const summary = useMemo(() => {
    if (overrideActive) return 'Custom override';
    if (publicUrl) return 'Self';
    return 'No URL yet';
  }, [overrideActive, publicUrl]);

  return (
    <div
      className="cs-canonical"
      data-active={overrideActive ? 'true' : 'false'}
      data-tone={overrideActive ? 'warn' : 'muted'}
      data-expanded={expanded ? 'true' : 'false'}
    >
      <button
        type="button"
        className="cs-canonical__header"
        aria-expanded={expanded}
        aria-controls={headingId}
        onClick={() => setExpanded((v) => !v)}
      >
        <span className="cs-canonical__title">Canonical URL</span>
        <span className="cs-canonical__chevron" aria-hidden="true">
          <ChevronDown />
        </span>
        <span className="cs-canonical__summary">{summary}</span>
      </button>

      {expanded && (
      <div id={headingId} className="cs-canonical__body">
        <div className="cs-canonical__readout" aria-live="polite">
          {effectiveUrl || <span className="cs-canonical__placeholder">— set the slug to compute —</span>}
        </div>

        <label className="cs-canonical__toggle">
          <input
            type="checkbox"
            checked={Boolean(useCustomCanonical)}
            onChange={(e: ChangeEvent<HTMLInputElement>) => {
              setUseCustomCanonical(e.target.checked);
              if (!e.target.checked) {
                // Clear the URL when turning off so the record returns
                // to a clean self-canonical state.
                setCanonicalOverride(null);
                setHealth({ kind: 'idle' });
              }
            }}
          />
          <span>Use a custom canonical URL</span>
        </label>

        {useCustomCanonical && (
          <div className="cs-canonical__nested">
            <input
              id={inputId}
              aria-label="Canonical URL"
              type="url"
              value={canonicalOverride ?? ''}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                setCanonicalOverride(e.target.value === '' ? null : e.target.value)
              }
              placeholder="https://cleanstart.com/blog/source-article"
              className="cs-canonical__input"
            />
            <details className="cs-canonical__explainer">
              <summary>
                <span className="cs-canonical__explainer-chevron" aria-hidden="true">
                  <ChevronDown size={14} />
                </span>
                When to use this
              </summary>
              <p>
                Points search engines to the source-of-truth URL — useful for facet /
                parameter URLs, migrated URLs, A/B variants, or content republished
                off-domain. The variant URL keeps serving content; only the search-engine
                signal consolidates.
              </p>
              <p>
                <strong>Not a redirect.</strong> Use a Redirect (below) if you want users
                actually sent to the other URL.
              </p>
            </details>

            {health.kind === 'checking' && (
              <p className="cs-canonical__health cs-canonical__health--checking">
                Checking the URL…
              </p>
            )}
            {health.kind === 'healthy' && (
              <p className="cs-canonical__health cs-canonical__health--ok">
                ✓ Resolves with HTTP {health.status}
                {health.redirected ? ` — note: redirects to ${health.finalUrl}` : ''}
              </p>
            )}
            {health.kind === 'broken' && (
              <p className="cs-canonical__health cs-canonical__health--bad">
                ✗ HTTP {health.status} — search engines will drop the rich result. Fix the URL or
                turn the override off.
              </p>
            )}
            {health.kind === 'failed' && (
              <p className="cs-canonical__health cs-canonical__health--warn">
                Couldn’t check the URL: {health.reason}
              </p>
            )}
          </div>
        )}
      </div>
      )}
    </div>
  );
};

export default CanonicalField;
