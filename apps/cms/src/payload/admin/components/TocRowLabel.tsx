'use client';

import { useRowLabel } from '@payloadcms/ui';
import type { ReactElement } from 'react';

type TocRowData = {
  level?: number | string | null;
  text?: string | null;
};

const truncate = (input: string, max: number): string =>
  input.length > max ? `${input.slice(0, max - 1).trimEnd()}…` : input;

const formatLevel = (raw: TocRowData['level']): string => {
  if (typeof raw === 'number' && Number.isFinite(raw)) return `H${raw}`;
  if (typeof raw === 'string' && /^[1-6]$/.test(raw.trim())) return `H${raw.trim()}`;
  return 'H?';
};

/**
 * Row label for the auto-built `tableOfContents` array. Shows the
 * heading level + heading text on the collapsed row (e.g. "H2 ·
 * What Is the SEBI CSCRF Audit") instead of the default
 * `Heading 01`/`Heading 02`, so editors can verify TOC structure
 * at a glance.
 */
export const TocRowLabel = (): ReactElement => {
  const { data } = useRowLabel<TocRowData>();
  const level = formatLevel(data?.level);
  const text = (data?.text ?? '').trim();
  return (
    <span>
      <span
        style={{
          display: 'inline-block',
          minWidth: '2.25rem',
          padding: '0.05rem 0.4rem',
          marginRight: '0.5rem',
          borderRadius: '3px',
          background: 'var(--theme-elevation-150, #e2e8f0)',
          color: 'var(--theme-text, #101828)',
          fontSize: '0.7rem',
          fontWeight: 600,
          textAlign: 'center',
        }}
      >
        {level}
      </span>
      {text ? truncate(text, 110) : <em style={{ opacity: 0.6 }}>(no heading text)</em>}
    </span>
  );
};
