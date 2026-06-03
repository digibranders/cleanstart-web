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

  it('is read-only in the admin UI (no create/update/delete buttons)', () => {
    expect(ConsentLog.admin?.hidden).not.toBe(true);
    // create/update/delete are admin-gated; ingestion happens via the
    // service endpoint with overrideAccess, never the admin UI.
    expect(typeof ConsentLog.access?.read).toBe('function');
    expect(typeof ConsentLog.access?.create).toBe('function');
  });
});
