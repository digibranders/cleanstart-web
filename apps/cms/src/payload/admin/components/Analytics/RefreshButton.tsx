'use client';

import type { ReactElement } from 'react';

const relativeTime = (iso: string | null): string => {
  if (!iso) return '';
  const ms = Date.now() - new Date(iso).getTime();
  if (!Number.isFinite(ms) || ms < 0) return '';
  const min = Math.round(ms / 60000);
  if (min < 1) return 'just now';
  if (min < 60) return `${min}m ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr}h ago`;
  return new Date(iso).toLocaleDateString();
};

export function RefreshButton({
  onClick,
  busy,
  updatedAt,
}: {
  onClick: () => void;
  busy: boolean;
  updatedAt?: string | null;
}): ReactElement {
  return (
    <div className="cs-analytics__refresh">
      {updatedAt ? <span className="cs-analytics__refresh-time">Updated {relativeTime(updatedAt)}</span> : null}
      <button
        type="button"
        className="cs-analytics__refresh-btn"
        onClick={onClick}
        disabled={busy}
        aria-label="Refresh analytics data"
      >
        <svg
          className={`cs-analytics__refresh-icon${busy ? ' is-spinning' : ''}`}
          width="14"
          height="14"
          viewBox="0 0 16 16"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M13.5 8a5.5 5.5 0 1 1-1.6-3.9M13.5 2v3h-3"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        {busy ? 'Refreshing…' : 'Refresh'}
      </button>
    </div>
  );
}

export default RefreshButton;
