'use client';

import type { ReactElement } from 'react';
import { useFormFields } from '@payloadcms/ui';

const HTTP_LABELS: Record<number, string> = {
  0: 'No response',
  400: 'Bad Request',
  401: 'Unauthorized',
  403: 'Forbidden',
  404: 'Not Found',
  410: 'Gone',
  429: 'Too Many Requests',
  500: 'Internal Server Error',
  502: 'Bad Gateway',
  503: 'Service Unavailable',
  504: 'Gateway Timeout',
};

const ageFrom = (iso: string | undefined): string | null => {
  if (!iso) return null;
  const ms = Date.now() - new Date(iso).getTime();
  if (Number.isNaN(ms) || ms < 0) return null;
  const days = Math.floor(ms / 86_400_000);
  if (days >= 1) return `broken ${days} day${days === 1 ? '' : 's'}`;
  const hours = Math.floor(ms / 3_600_000);
  return `broken ${hours} hour${hours === 1 ? '' : 's'}`;
};

/**
 * Sidebar UI field — humanises the HTTP status ("404 · Not Found") and
 * shows how long the link has been broken (derived from firstSeenAt).
 */
export const BrokenLinkStatusField = (): ReactElement => {
  const httpStatus = useFormFields(([f]) => f.httpStatus?.value as number | undefined);
  const firstSeenAt = useFormFields(([f]) => f.firstSeenAt?.value as string | undefined);
  const label = httpStatus != null ? HTTP_LABELS[httpStatus] : undefined;
  const age = ageFrom(firstSeenAt);
  return (
    <div className="field-type cs-broken-status-field">
      <div className="field-label">Diagnosis</div>
      <div>{httpStatus != null ? `HTTP ${httpStatus}${label ? ` · ${label}` : ''}` : '—'}</div>
      {age ? <div className="cs-broken-status-field__age">{age}</div> : null}
    </div>
  );
};

export default BrokenLinkStatusField;
