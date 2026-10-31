'use client';

import { useField, useFormFields } from '@payloadcms/ui';
import type { ReactElement } from 'react';

import { firstParagraph } from '../../lib/videos/description-text';

/** Under the Summary field: fills it from the first real paragraph of the YouTube description. */
export const UseDescriptionSummary = (): ReactElement | null => {
  const { value, setValue } = useField<string>({ path: 'summary' });
  const description = useFormFields(([fields]) => {
    const raw = fields['source.description']?.value;
    return typeof raw === 'string' ? raw : '';
  });
  const suggestion = firstParagraph(description);
  if (!suggestion || suggestion === value) return null;
  return (
    <div style={{ margin: '-8px 0 20px' }}>
      <button
        type="button"
        onClick={() => setValue(suggestion)}
        style={{ border: 0, background: 'none', padding: 0, cursor: 'pointer', fontSize: 13, color: 'var(--theme-success-700)', textDecoration: 'underline' }}
      >
        Use the first paragraph of the YouTube description
      </button>
    </div>
  );
};

export default UseDescriptionSummary;
