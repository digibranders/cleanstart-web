import { describe, expect, it } from 'vitest';

import { extractEmail, extractName } from './extract-fields';
import type { FormFieldDef } from './validate-fields';

const defs: FormFieldDef[] = [
  { name: 'fullName', type: 'text', required: true },
  { name: 'workEmail', type: 'email', required: true },
  { name: 'message', type: 'textarea' },
];

describe('extractEmail', () => {
  it('prefers the typed email field over a free-text @-containing value', () => {
    expect(
      extractEmail(defs, {
        fullName: 'Jane',
        workEmail: 'Jane@CleanStart.com',
        message: 'reach me at sneaky@evil.com',
      }),
    ).toBe('jane@cleanstart.com');
  });

  it('lowercases the email for consistent comparison', () => {
    expect(
      extractEmail(defs, { workEmail: 'MIXED.Case@Example.COM', fullName: 'X' }),
    ).toBe('mixed.case@example.com');
  });

  it('falls back to @-heuristic when no typed email field exists', () => {
    const noEmailDefs: FormFieldDef[] = [
      { name: 'name', type: 'text', required: true },
      { name: 'note', type: 'textarea' },
    ];
    expect(
      extractEmail(noEmailDefs, { name: 'Jane', note: 'reach me at jane@x.com please' }),
    ).toBe('reach me at jane@x.com please');
    // Realistic shape — sole field that contains @.
    expect(
      extractEmail(noEmailDefs, { name: 'Jane', note: 'jane@x.com' }),
    ).toBe('jane@x.com');
  });

  it('returns null when nothing matches', () => {
    expect(extractEmail(defs, {})).toBeNull();
    expect(extractEmail(defs, { workEmail: '' })).toBeNull();
    expect(extractEmail(null, {})).toBeNull();
  });
});

describe('extractName', () => {
  it('finds the first text field whose name matches /name/i', () => {
    expect(extractName(defs, { fullName: 'Jane Smith', workEmail: 'j@x.com' })).toBe(
      'Jane Smith',
    );
  });

  it('walks values when defs are absent', () => {
    expect(extractName(null, { firstName: 'Jane', other: 'x' })).toBe('Jane');
  });

  it('returns null when nothing matches', () => {
    expect(extractName(defs, { workEmail: 'j@x.com' })).toBeNull();
    expect(extractName(null, {})).toBeNull();
  });
});
