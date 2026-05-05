'use client';

import type { ReactElement } from 'react';
import { useEffect, useState } from 'react';

import { CSV_EXPORT_HARD_CAP_ROWS } from '../../endpoints/export-leads-csv';

/**
 * Banner rendered above the leads list view. Dormant until a CSV export
 * response carries the `X-Leads-Truncated: true` header — at which point
 * it surfaces a session-scoped dismissable warning so editors don't ship
 * an incomplete CSV thinking it represents the full result set.
 *
 * Implementation note: Payload's admin shell triggers the export via a
 * regular browser request (anchor download or fetch). We can't read
 * response headers from a download-attribute click, so the banner
 * instead intercepts `fetch` on mount and inspects every response that
 * targets the export endpoint. If the admin shell ever switches the
 * export to a non-fetch transport this listener becomes a no-op — safe
 * to leave in place; the response header still ships either way.
 */
export const LeadsCsvTruncationBanner = (): ReactElement | null => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const sessionFlag = window.sessionStorage.getItem('leads-csv-truncated');
    if (sessionFlag === '1') setVisible(true);

    const original = window.fetch;
    const wrapped: typeof window.fetch = async (input, init) => {
      const response = await original(input, init);
      try {
        const url =
          typeof input === 'string'
            ? input
            : input instanceof URL
              ? input.toString()
              : input instanceof Request
                ? input.url
                : '';
        if (url.includes('/api/leads/export-csv')) {
          if (response.headers.get('x-leads-truncated') === 'true') {
            window.sessionStorage.setItem('leads-csv-truncated', '1');
            setVisible(true);
          }
        }
      } catch {
        // Header inspection is best-effort. A throw here must not break
        // the underlying request.
      }
      return response;
    };
    window.fetch = wrapped;
    return () => {
      window.fetch = original;
    };
  }, []);

  if (!visible) return null;

  const dismiss = (): void => {
    if (typeof window !== 'undefined') {
      window.sessionStorage.removeItem('leads-csv-truncated');
    }
    setVisible(false);
  };

  return (
    <div
      role="alert"
      style={{
        margin: '1rem 0',
        padding: '0.75rem 1rem',
        border: '1px solid #d97706',
        borderLeftWidth: '4px',
        background: '#fffbeb',
        color: '#7c2d12',
        borderRadius: '4px',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '0.75rem',
        fontSize: '0.875rem',
      }}
    >
      <div style={{ flex: 1 }}>
        <strong>CSV export was truncated.</strong> The most recent export hit
        the {CSV_EXPORT_HARD_CAP_ROWS.toLocaleString()}-row cap. Use scheduled
        jobs or a date-range filter for larger exports.
      </div>
      <button
        type="button"
        onClick={dismiss}
        style={{
          background: 'transparent',
          border: '1px solid #d97706',
          color: '#7c2d12',
          padding: '0.25rem 0.625rem',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '0.75rem',
        }}
      >
        Dismiss
      </button>
    </div>
  );
};
