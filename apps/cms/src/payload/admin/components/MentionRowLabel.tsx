'use client';

import { useRowLabel } from '@payloadcms/ui';
import type { ReactElement } from 'react';

type MentionRowData = {
  displayName?: string | null;
  upn?: string | null;
};

/**
 * Row label for the Teams `mentions` array. Shows the person's display
 * name (and email, when set) on the collapsed row instead of the
 * default single-character label, so editors can scan who is tagged
 * without expanding each row. Falls back to a neutral placeholder
 * until a name is typed.
 *
 * useRowLabel().data is reconstructed from live form state, so the
 * header updates on every keystroke — no save or refresh needed.
 */
export const MentionRowLabel = (): ReactElement => {
  const { data, rowNumber } = useRowLabel<MentionRowData>();
  const number = (rowNumber ?? 0) + 1;
  const name = (data?.displayName ?? '').trim();
  const upn = (data?.upn ?? '').trim();
  const numLabel = String(number).padStart(2, '0');

  if (!name) {
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, opacity: 0.6 }}>{numLabel}</span>
        <span style={{ opacity: 0.6 }}>New mention</span>
      </span>
    );
  }

  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, opacity: 0.6 }}>{numLabel}</span>
      <span>{name}</span>
      {upn ? (
        <span style={{ fontSize: 12, opacity: 0.6 }}>· {upn}</span>
      ) : null}
    </span>
  );
};
