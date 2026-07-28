'use client';

import { useField } from '@payloadcms/ui';
import type { ReactElement } from 'react';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';

import {
  buildTokenValues,
  renderSignature,
  SIGNATURE_TOKENS,
  unknownTokens,
} from '../../lib/email-signature/render';

/**
 * Live preview of the signature template, beside the code editor.
 *
 * Renders through the *same* `renderSignature` the API uses, so what the editor
 * sees is what the endpoint will emit — a second preview renderer would drift
 * from the real one and quietly lie.
 *
 * The markup is shown inside a `sandbox=""` iframe: the template is raw HTML
 * with its own inline styles and a `width: 500px` table, so injecting it into
 * the admin DOM would leak styles both ways. An empty sandbox also means no
 * script in a pasted template can run inside the CMS.
 */

/** Stand-in values, chosen to exercise escaping (`&` in the job title). */
const SAMPLE = {
  name: 'Nilesh Jain',
  jobTitle: 'Co-founder & CEO',
  email: 'nilesh.jain@cleanstart.com',
  phoneE164: '+6585117124',
  phoneDisplay: '+65-85117124',
};

/** Intrinsic size of the signature table, used to scale it into the sidebar. */
const SIGNATURE_WIDTH = 500;
const SIGNATURE_HEIGHT = 200;

const FONT_LINKS =
  '<link rel="preconnect" href="https://fonts.googleapis.com" />' +
  '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />' +
  '<link href="https://fonts.googleapis.com/css2?family=Sora:wght@100..800&display=swap" rel="stylesheet" />';

const wrap = (body: string): string =>
  `<!doctype html><html><head><meta charset="utf-8" />${FONT_LINKS}<style>html,body{margin:0;padding:0;background:#fff;}</style></head><body>${body}</body></html>`;

const panelStyle: React.CSSProperties = {
  position: 'sticky',
  top: 12,
  marginTop: 24,
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  marginBottom: 8,
  fontSize: 13,
  fontWeight: 600,
};

const frameShellStyle: React.CSSProperties = {
  overflow: 'hidden',
  borderRadius: 4,
  border: '1px solid var(--theme-elevation-150)',
  background: '#fff',
};

const errorStyle: React.CSSProperties = {
  padding: '10px 12px',
  borderRadius: 4,
  border: '1px solid #f08f8f',
  background: 'rgba(240,143,143,0.08)',
  color: '#f08f8f',
  fontSize: 12,
  lineHeight: 1.5,
};

const hintStyle: React.CSSProperties = {
  marginTop: 8,
  fontSize: 11,
  lineHeight: 1.5,
  color: 'var(--theme-elevation-500)',
};

export function SignatureTemplatePreview(): ReactElement {
  const { value } = useField<string>({ path: 'html' });

  // Debounced so a fast typist does not re-render the iframe on every keypress.
  const [debounced, setDebounced] = useState<string>(value ?? '');
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value ?? ''), 250);
    return () => clearTimeout(id);
  }, [value]);

  // The signature is a fixed 500px table and the sidebar is narrower, so scale
  // it down to fit rather than clipping it or forcing a horizontal scrollbar.
  const shellRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  useLayoutEffect(() => {
    const el = shellRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(([entry]) => {
      const width = entry?.contentRect.width ?? SIGNATURE_WIDTH;
      setScale(Math.min(1, width / SIGNATURE_WIDTH));
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  let body: string | null = null;
  let error: string | null = null;

  if (debounced.trim().length === 0) {
    error = 'Add template HTML to see a preview.';
  } else {
    const unknown = unknownTokens(debounced);
    if (unknown.length > 0) {
      error = `Unknown placeholder${unknown.length > 1 ? 's' : ''}: ${unknown
        .map((token) => `{{${token}}}`)
        .join(', ')}`;
    } else {
      try {
        body = renderSignature({ templateHtml: debounced, values: buildTokenValues(SAMPLE) });
      } catch (err) {
        error = err instanceof Error ? err.message : 'Could not render this template.';
      }
    }
  }

  return (
    <div style={panelStyle}>
      <span style={labelStyle}>Live preview</span>

      {error ? (
        <div style={errorStyle}>{error}</div>
      ) : (
        <div ref={shellRef} style={{ ...frameShellStyle, height: SIGNATURE_HEIGHT * scale }}>
          <iframe
            title="Signature preview"
            // Empty sandbox: no scripts, no same-origin, no forms.
            sandbox=""
            srcDoc={wrap(body ?? '')}
            style={{
              width: SIGNATURE_WIDTH,
              height: SIGNATURE_HEIGHT,
              border: 0,
              display: 'block',
              transform: `scale(${scale})`,
              transformOrigin: 'top left',
            }}
          />
        </div>
      )}

      <p style={hintStyle}>
        Sample data — {SAMPLE.name}. Placeholders:{' '}
        {SIGNATURE_TOKENS.map((token) => `{{${token}}}`).join(', ')}.
      </p>
    </div>
  );
}
