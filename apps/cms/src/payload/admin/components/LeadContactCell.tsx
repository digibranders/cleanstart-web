'use client';

import type { ReactElement } from 'react';

/**
 * List-view cell that surfaces the submitter's email + name from the lead's
 * `fields` JSON blob (submissions are dynamic, so there is no top-level email
 * column). Mounted as the Cell for the `contact` UI field on the Leads
 * collection.
 *
 * PII-safe by construction: the 365-day purge (`jobs/purge-leads-pii.ts`)
 * nulls the email/phone keys inside `fields`, so a redacted lead renders the
 * em-dash placeholder here rather than leaking an address that was meant to
 * be erased.
 */

type LeadFields = Record<string, unknown> | null | undefined;

type LeadContactCellProps = {
  rowData?: { fields?: LeadFields };
};

const asString = (value: unknown): string | null => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const resolveEmail = (fields: Record<string, unknown>): string | null => {
  const direct = asString(fields.email);
  if (direct) return direct;
  for (const [key, value] of Object.entries(fields)) {
    if (key.toLowerCase().includes('email')) {
      const candidate = asString(value);
      if (candidate) return candidate;
    }
  }
  return null;
};

const resolveName = (fields: Record<string, unknown>): string | null => {
  const first = asString(fields.firstname) ?? asString(fields.firstName);
  const last = asString(fields.lastname) ?? asString(fields.lastName);
  const full = [first, last].filter(Boolean).join(' ');
  if (full) return full;
  return asString(fields.name) ?? asString(fields.fullname) ?? asString(fields.fullName);
};

export const LeadContactCell = ({ rowData }: LeadContactCellProps): ReactElement => {
  const fields = rowData?.fields;
  if (!fields || typeof fields !== 'object') {
    return <span style={{ opacity: 0.5 }}>—</span>;
  }

  const email = resolveEmail(fields as Record<string, unknown>);
  const name = resolveName(fields as Record<string, unknown>);

  if (!email && !name) {
    return <span style={{ opacity: 0.5 }}>—</span>;
  }

  return (
    <span style={{ display: 'inline-flex', flexDirection: 'column', lineHeight: 1.3 }}>
      <span>{email ?? <span style={{ opacity: 0.5 }}>—</span>}</span>
      {name ? <span style={{ fontSize: '0.75em', opacity: 0.65 }}>{name}</span> : null}
    </span>
  );
};

export default LeadContactCell;
