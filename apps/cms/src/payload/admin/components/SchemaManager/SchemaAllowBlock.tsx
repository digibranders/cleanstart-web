'use client';

import type { ReactElement } from 'react';

import {
  ALLOWED_OVERRIDE_TYPES,
  AUTO_EMITTED_TYPES_BY_COLLECTION,
} from '../../../lib/jsonld/override-validator';

const BLOCKED = Array.from(AUTO_EMITTED_TYPES_BY_COLLECTION.pageRegistry ?? []);

const summaryStyle = {
  cursor: 'pointer',
  fontSize: '0.78em',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  color: '#9ab',
  fontWeight: 600,
} as const;

const listStyle = { margin: '0.4rem 0 0', paddingLeft: '1rem', fontSize: '0.8em', color: '#bbb' } as const;

/**
 * Bottom of the right rail: the override allow-list and the site-wide
 * blocklist, both collapsed by default. Reference only.
 */
export const SchemaAllowBlock = (): ReactElement => (
  <div className="field-type" style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
    <details>
      <summary style={summaryStyle}>Allowed @types ({ALLOWED_OVERRIDE_TYPES.length})</summary>
      <ul style={listStyle}>
        {ALLOWED_OVERRIDE_TYPES.map((t) => (
          <li key={t}>
            <code>{t}</code>
          </li>
        ))}
      </ul>
    </details>

    <details>
      <summary style={summaryStyle}>Blocked — site-wide ({BLOCKED.length})</summary>
      <ul style={listStyle}>
        {BLOCKED.map((t) => (
          <li key={t}>
            <code>{t}</code>
          </li>
        ))}
      </ul>
      <p style={{ fontSize: '0.75em', color: '#888', margin: '0.3rem 0 0' }}>
        Emitted on every page by the global layer — can’t be overridden per page. Edit them in SEO
        Defaults.
      </p>
    </details>
  </div>
);
