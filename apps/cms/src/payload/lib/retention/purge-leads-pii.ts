/**
 * Leads PII redaction — per arch doc §retention and §privacy-gdpr.
 *
 * GDPR data-minimisation: ip + userAgent are kept for 365 days
 * (the abuse / anti-spam window) then nullified. Email + phone keys
 * inside the `fields` JSON are nulled at the same cutoff because the
 * Leads docstring promises that surface; the row itself stays so
 * formId, source, consent metadata remain useful for audit + CRM
 * sync.
 *
 * The job is idempotent via the `piiRedactedAt` marker on each lead:
 * once we set the timestamp the row falls out of the next find().
 * Runs daily.
 */

import {
  type FormFieldDefForRedaction,
  piiKeysForForm,
  redactPiiFromFields,
} from './redact-fields';

const RETENTION_DAYS_DEFAULT = 365;
const PAGE_SIZE = 200;
const MAX_PAGES = 500; // hard cap: 100k rows per run

interface FormRecord {
  id: number | string;
  fields?: FormFieldDefForRedaction[] | null;
}

interface LeadRecord {
  id: number | string;
  form?: FormRecord | number | string | null;
  fields?: Record<string, unknown> | null;
}

export interface PurgePayload {
  logger?: { info?: (meta: Record<string, unknown>, msg: string) => void };
  find: (args: {
    collection: 'leads' | 'forms';
    where?: unknown;
    limit?: number;
    page?: number;
    depth?: number;
    overrideAccess?: boolean;
  }) => Promise<{ docs: LeadRecord[] | FormRecord[]; hasNextPage?: boolean }>;
  update: (args: {
    collection: 'leads';
    id: number | string;
    data: Record<string, unknown>;
    overrideAccess?: boolean;
  }) => Promise<unknown>;
}

export interface PurgeOptions {
  retentionDays?: number;
  now?: Date;
}

export interface PurgeResult {
  scanned: number;
  redacted: number;
  errors: number;
}

const loadFormPiiMap = async (
  payload: PurgePayload,
): Promise<Map<string, ReadonlySet<string>>> => {
  const map = new Map<string, ReadonlySet<string>>();
  let page = 1;
  while (true) {
    const result = (await payload.find({
      collection: 'forms',
      limit: 200,
      page,
      depth: 0,
      overrideAccess: true,
    })) as { docs: FormRecord[]; hasNextPage?: boolean };
    for (const form of result.docs) {
      map.set(String(form.id), piiKeysForForm(form.fields));
    }
    if (!result.hasNextPage) break;
    page += 1;
  }
  return map;
};

const formIdOf = (lead: LeadRecord): string | null => {
  const raw = lead.form;
  if (raw == null) return null;
  if (typeof raw === 'number' || typeof raw === 'string') return String(raw);
  if (typeof raw === 'object' && 'id' in raw && raw.id != null) return String(raw.id);
  return null;
};

/**
 * Find leads older than the cutoff that have not yet been redacted,
 * then null `ip`, `userAgent`, and any PII keys inside `fields`.
 * Stamps `piiRedactedAt` so the row is skipped on subsequent runs.
 */
export const purgeLeadsPii = async (
  payload: PurgePayload,
  options: PurgeOptions = {},
): Promise<PurgeResult> => {
  const retentionDays = options.retentionDays ?? RETENTION_DAYS_DEFAULT;
  const now = options.now ?? new Date();
  const cutoff = new Date(now.getTime() - retentionDays * 24 * 60 * 60 * 1000).toISOString();
  const redactedAt = now.toISOString();

  const formPiiMap = await loadFormPiiMap(payload);

  let scanned = 0;
  let redacted = 0;
  let errors = 0;
  // Same not-advancing-page rationale as purgeSearchLog: each iteration's
  // update sets `piiRedactedAt` which removes the row from the next match.
  const page = 1;

  for (let iteration = 0; iteration < MAX_PAGES; iteration += 1) {
    const result = (await payload.find({
      collection: 'leads',
      where: {
        and: [
          { createdAt: { less_than: cutoff } },
          { piiRedactedAt: { equals: null } },
        ],
      },
      limit: PAGE_SIZE,
      page,
      depth: 1,
      overrideAccess: true,
    })) as { docs: LeadRecord[]; hasNextPage?: boolean };
    if (result.docs.length === 0) break;
    scanned += result.docs.length;
    for (const row of result.docs) {
      const formId = formIdOf(row);
      const piiKeys = formId ? formPiiMap.get(formId) ?? new Set<string>() : new Set<string>();
      const { redacted: nextFields } = redactPiiFromFields(row.fields ?? null, piiKeys);
      try {
        await payload.update({
          collection: 'leads',
          id: row.id,
          data: {
            ip: null,
            userAgent: null,
            ...(nextFields != null ? { fields: nextFields } : {}),
            piiRedactedAt: redactedAt,
          },
          overrideAccess: true,
        });
        redacted += 1;
      } catch {
        errors += 1;
      }
    }
    if (!result.hasNextPage) break;
    // Page stays at 1 — the next iteration's where-clause skips rows
    // whose piiRedactedAt is now set, surfacing the next slice cleanly.
  }

  payload.logger?.info?.(
    { scanned, redacted, errors, retentionDays, cutoff },
    'leads PII redaction complete',
  );
  return { scanned, redacted, errors };
};
