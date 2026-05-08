'use client';

import { useField } from '@payloadcms/ui';
import type { ReactElement } from 'react';
import { useMemo, useState } from 'react';

import { ChevronDown } from './icons/Chevron';

interface LegacyBioPayload {
  /** Original Webflow rich-text "Education Qualification" content. */
  readonly education?: string | null;
  /** Original Webflow rich-text "Experience" content. */
  readonly experience?: string | null;
  /** Original Webflow rich-text "Core Skills & Expertise" content. */
  readonly skills?: string | null;
  /** Original Webflow rich-text "Awards & Recognition" content. */
  readonly awards?: string | null;
}

const SECTIONS: ReadonlyArray<{ key: keyof LegacyBioPayload; label: string }> = [
  { key: 'education', label: 'Education (legacy)' },
  { key: 'experience', label: 'Experience (legacy)' },
  { key: 'skills', label: 'Core Skills & Expertise (legacy)' },
  { key: 'awards', label: 'Awards & Recognition (legacy)' },
];

const isNonEmpty = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0;

/**
 * Read-only sidebar panel that surfaces the editor's original Webflow
 * rich-text bio fragments alongside the structured arrays they need
 * to fill in. Auto-hides for authors created after the Webflow
 * import (where `legacyBio` is null).
 *
 * Strict-render: the legacy values are HTML strings from Webflow, so
 * we DON'T render them as HTML — we render the raw text in a
 * `<pre>`-style block. The editor copies the prose into the
 * structured rows manually. This prevents any chance of injecting
 * stray script/style from the legacy payload.
 */
export const LegacyBioViewer = (): ReactElement | null => {
  const { value } = useField<LegacyBioPayload | null>({ path: 'legacyBio' });
  const [collapsed, setCollapsed] = useState(false);

  const sections = useMemo(() => {
    const payload = value ?? null;
    if (!payload) return [];
    return SECTIONS.filter((s) => isNonEmpty(payload[s.key])).map((s) => ({
      key: s.key,
      label: s.label,
      content: String(payload[s.key]),
    }));
  }, [value]);

  if (sections.length === 0) return null;

  return (
    <div
      className="field-type legacy-bio-viewer"
      style={{ marginBottom: 'var(--cs-space-3, 12px)' }}
    >
      <button
        type="button"
        onClick={() => setCollapsed((v) => !v)}
        aria-expanded={!collapsed}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '8px 10px',
          background: 'var(--theme-elevation-50, #1c1d21)',
          border: '1px solid var(--theme-elevation-150, #2a2c33)',
          borderRadius: 6,
          color: 'var(--theme-text, #e8e9eb)',
          fontSize: 12,
          fontWeight: 500,
          cursor: 'pointer',
          textAlign: 'left',
        }}
      >
        <span aria-hidden style={{ fontSize: 12 }}>📄</span>
        <span style={{ flex: 1 }}>
          Legacy Webflow bio · {sections.length} section{sections.length === 1 ? '' : 's'} · click to {collapsed ? 'show' : 'hide'}
        </span>
        <span
          aria-hidden
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: 0.85,
            transform: collapsed ? 'rotate(-90deg)' : 'rotate(0deg)',
            transition: 'transform var(--cs-motion-micro)',
          }}
        >
          <ChevronDown />
        </span>
      </button>
      {!collapsed ? (
        <div
          style={{
            marginTop: 6,
            padding: 10,
            background: 'var(--theme-elevation-50, #1c1d21)',
            border: '1px solid var(--theme-elevation-150, #2a2c33)',
            borderRadius: 6,
            fontSize: 12,
            lineHeight: 1.5,
          }}
        >
          <p
            style={{
              margin: '0 0 8px 0',
              padding: '6px 8px',
              background: '#3a2f0f',
              border: '1px solid #c79a2e',
              color: '#f0c45a',
              borderRadius: 4,
              fontSize: 11,
            }}
          >
            Read-only reference. Copy the relevant prose into the structured arrays above (Education, Experience, Skills, Awards) and remove this field once you're satisfied.
          </p>
          {sections.map((section) => (
            <div key={section.key} style={{ marginBottom: 12 }}>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                  color: 'var(--theme-text-soft, #a4a7af)',
                  marginBottom: 4,
                }}
              >
                {section.label}
              </div>
              <pre
                style={{
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  margin: 0,
                  padding: 0,
                  fontFamily: 'inherit',
                  fontSize: 12,
                  color: 'var(--theme-text, #e8e9eb)',
                }}
              >
                {section.content}
              </pre>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
};

export default LegacyBioViewer;
