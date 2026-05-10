import { describe, expect, it } from 'vitest';

import { piiKeysForForm, redactPiiFromFields } from './redact-fields';

describe('piiKeysForForm', () => {
  it('returns email-typed field names', () => {
    const keys = piiKeysForForm([
      { name: 'fullName', type: 'text' },
      { name: 'workEmail', type: 'email' },
      { name: 'message', type: 'textarea' },
    ]);
    expect([...keys].sort()).toEqual(['workEmail']);
  });

  it('matches phone-bearing names regardless of declared type', () => {
    const keys = piiKeysForForm([
      { name: 'phoneNumber', type: 'text' },
      { name: 'mobilePhone', type: 'text' },
      { name: 'telephone', type: 'text' },
      { name: 'note', type: 'text' },
    ]);
    expect([...keys].sort()).toEqual(['mobilePhone', 'phoneNumber', 'telephone']);
  });

  it('matches email-bearing names even when typed as text', () => {
    const keys = piiKeysForForm([
      { name: 'contact_email', type: 'text' },
      { name: 'fullName', type: 'text' },
    ]);
    expect([...keys].sort()).toEqual(['contact_email']);
  });

  it('handles null / empty input', () => {
    expect(piiKeysForForm(null).size).toBe(0);
    expect(piiKeysForForm(undefined).size).toBe(0);
    expect(piiKeysForForm([]).size).toBe(0);
  });

  it('skips entries with missing names', () => {
    const keys = piiKeysForForm([{ type: 'email' }, { name: '', type: 'email' }]);
    expect(keys.size).toBe(0);
  });
});

describe('redactPiiFromFields', () => {
  it('returns null when input is null/undefined', () => {
    expect(redactPiiFromFields(null, new Set())).toEqual({ redacted: null, changed: false });
    expect(redactPiiFromFields(undefined, new Set())).toEqual({
      redacted: null,
      changed: false,
    });
  });

  it('nulls PII keys from the supplied set', () => {
    const result = redactPiiFromFields(
      { workEmail: 'a@b.com', fullName: 'Alice' },
      new Set(['workEmail']),
    );
    expect(result).toEqual({
      redacted: { workEmail: null, fullName: 'Alice' },
      changed: true,
    });
  });

  it('also nulls heuristic-matched keys not in the explicit set', () => {
    const result = redactPiiFromFields(
      { phoneNumber: '+1-555-1234', message: 'hi', email: 'a@b.com' },
      new Set(),
    );
    expect(result.redacted).toEqual({
      phoneNumber: null,
      message: 'hi',
      email: null,
    });
    expect(result.changed).toBe(true);
  });

  it('reports changed=false when no PII keys carry a value', () => {
    const result = redactPiiFromFields(
      { workEmail: null, fullName: 'Alice' },
      new Set(['workEmail']),
    );
    expect(result.redacted).toEqual({ workEmail: null, fullName: 'Alice' });
    expect(result.changed).toBe(false);
  });

  it('does not mutate the input object', () => {
    const fields = { workEmail: 'a@b.com', name: 'Alice' };
    redactPiiFromFields(fields, new Set(['workEmail']));
    expect(fields).toEqual({ workEmail: 'a@b.com', name: 'Alice' });
  });
});
