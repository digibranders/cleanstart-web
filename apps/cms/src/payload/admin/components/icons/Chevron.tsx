import type { ReactElement } from 'react';

type ChevronProps = {
  size?: number;
  className?: string;
};

const path = (
  <path
    d="M4 6l4 4 4-4"
    stroke="currentColor"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
  />
);

export const ChevronDown = ({ size = 12, className }: ChevronProps): ReactElement => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 16 16"
    fill="none"
    aria-hidden="true"
    focusable="false"
    className={className}
  >
    {path}
  </svg>
);

export const ChevronRight = ({ size = 12, className }: ChevronProps): ReactElement => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 16 16"
    fill="none"
    aria-hidden="true"
    focusable="false"
    className={className}
    style={{ transform: 'rotate(-90deg)' }}
  >
    {path}
  </svg>
);
