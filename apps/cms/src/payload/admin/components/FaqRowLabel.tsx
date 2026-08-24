'use client';

import { useRowLabel } from '@payloadcms/ui';
import type { ReactElement } from 'react';

import { lexicalToPlainText } from '../../lib/lexical/to-plain-text';

type FaqRowData = {
  question?: string | null;
  answer?: unknown;
};

const truncate = (input: string, max: number): string =>
  input.length > max ? `${input.slice(0, max - 1).trimEnd()}…` : input;

// This row label mounts on both a richText `answer` (Blogs/Guides/
// KnowledgeBase's `faqs`) and a plain-string `answer` (the FAQ
// page-builder block's `textarea` field) — `lexicalToPlainText` only
// recognizes the former, so a plain string must be checked directly.
const answerText = (answer: unknown): string =>
  typeof answer === 'string' ? answer.trim() : lexicalToPlainText(answer);

export const FaqRowLabel = (): ReactElement => {
  const { data, rowNumber } = useRowLabel<FaqRowData>();
  const number = (rowNumber ?? 0) + 1;
  const question = (data?.question ?? '').trim();
  const answered = answerText(data?.answer).length > 0;
  const numLabel = String(number).padStart(2, '0');

  if (!question) {
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, opacity: 0.6 }}>{numLabel}</span>
        <span style={{ opacity: 0.6 }}>Empty FAQ</span>
      </span>
    );
  }

  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, opacity: 0.6 }}>{numLabel}</span>
      <span>{truncate(question, 100)}</span>
      <span
        aria-label={answered ? 'Answer filled' : 'Answer empty'}
        title={answered ? 'Answer filled' : 'Answer empty'}
        style={{
          fontSize: 10,
          fontWeight: 600,
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
          padding: '2px 6px',
          borderRadius: 999,
          color: answered ? 'var(--cs-cyan-500, #06c7f2)' : 'var(--theme-text-disabled)',
          background: answered
            ? 'var(--cs-tint-brand-soft, rgba(6,199,242,0.08))'
            : 'var(--theme-elevation-150, rgba(0,0,0,0.04))',
        }}
      >
        {answered ? '· answered' : '· empty'}
      </span>
    </span>
  );
};
