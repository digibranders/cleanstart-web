'use client';

import { useRowLabel } from '@payloadcms/ui';
import type { ReactElement } from 'react';

type FaqRowData = {
  question?: string | null;
};

const truncate = (input: string, max: number): string =>
  input.length > max ? `${input.slice(0, max - 1).trimEnd()}…` : input;

/**
 * Row label for FAQ array fields. Shows the question text on the
 * collapsed row instead of the default `FAQ 01`/`FAQ 02` so editors
 * can scan the list without opening every row. Falls back to the
 * numeric label when a row hasn't had its question filled in yet.
 */
export const FaqRowLabel = (): ReactElement => {
  const { data, rowNumber } = useRowLabel<FaqRowData>();
  const number = (rowNumber ?? 0) + 1;
  const question = (data?.question ?? '').trim();
  if (!question) return <span>{`FAQ ${String(number).padStart(2, '0')}`}</span>;
  return (
    <span>
      <span style={{ opacity: 0.5, marginRight: '0.5rem' }}>
        {String(number).padStart(2, '0')}.
      </span>
      {truncate(question, 110)}
    </span>
  );
};
