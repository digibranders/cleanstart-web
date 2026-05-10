'use client';

import type { ReactElement } from 'react';

type Props = {
  readonly size?: 'sm' | 'md' | 'lg';
  readonly label?: string;
};

/** ARIA-status spinner. `label` is read by screen readers. */
export const Spinner = (props: Props): ReactElement => {
  const { size = 'md', label = 'Loading' } = props;
  return (
    <output className={`cs-spinner cs-spinner--${size}`} aria-live="polite">
      <span className="cs-spinner__ring" aria-hidden="true" />
      <span className="cs-spinner__sr">{label}</span>
    </output>
  );
};
