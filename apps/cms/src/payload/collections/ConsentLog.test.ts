import { describe, expect, it } from 'vitest';

import { ConsentLog } from './ConsentLog';

describe('ConsentLog collection', () => {
  it('is an append-only audit collection with the expected slug', () => {
    expect(ConsentLog.slug).toBe('consentLog');
    expect(ConsentLog.timestamps).toBe(true);
  });

  it('exposes the audit fields and no raw PII fields', () => {
    const names = (ConsentLog.fields as { name?: string }[])
      .map((f) => f.name)
      .filter(Boolean);
    expect(names).toEqual(
      expect.arrayContaining([
        'anonymousId',
        'decision',
        'categories',
        'consentVersion',
        'gpc',
        'country',
        'ipHash',
        'userAgentHash',
      ]),
    );
    expect(names).not.toContain('ip');
    expect(names).not.toContain('userAgent');
  });

  it('is append-only: create and update are denied in the admin UI', () => {
    expect(ConsentLog.admin?.hidden).not.toBe(true);
    // Ingestion happens via the `/ingest` service endpoint with
    // overrideAccess, which bypasses these rules — so create/update can be
    // hard-denied here to keep the audit log immutable in the admin.
    expect(ConsentLog.access?.create?.({} as never)).toBe(false);
    expect(ConsentLog.access?.update?.({} as never)).toBe(false);
    // read + delete stay admin-gated (delete for one-off erasure requests).
    expect(typeof ConsentLog.access?.read).toBe('function');
    expect(typeof ConsentLog.access?.delete).toBe('function');
  });

  it('renders every field read-only in the admin form', () => {
    // Collection-level `update: () => false` blocks the save but does NOT
    // disable the form inputs — a human can still type into them. Each field
    // must therefore be explicitly `admin.readOnly` so the audit record is
    // visibly immutable in the editor.
    const fields = ConsentLog.fields as { name?: string; admin?: { readOnly?: boolean } }[];
    for (const field of fields) {
      if (!field.name) continue;
      expect(field.admin?.readOnly, `${field.name} must be readOnly`).toBe(true);
    }
  });
});
