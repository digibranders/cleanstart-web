import { describe, expect, it } from 'vitest';
import { alertAddresses, iso, likePattern } from './people';

describe('server people helpers', () => {
  it('escapes LIKE wildcards in a search term', () => {
    expect(likePattern(' 100%_sure ')).toBe('%100\\%\\_sure%');
  });

  it('merges manager addresses with the fallback and removes duplicates', () => {
    const managers = [
      { userId: 'u1', email: 'a@cleanstart.com', name: 'A' },
      { userId: 'u2', email: 'b@cleanstart.com', name: 'B' },
    ];
    expect(alertAddresses(managers, 'partners@cleanstart.com').map((a) => a.email)).toEqual([
      'a@cleanstart.com',
      'b@cleanstart.com',
      'partners@cleanstart.com',
    ]);
    expect(alertAddresses(managers, 'A@cleanstart.com').map((a) => a.email)).toEqual(['a@cleanstart.com', 'b@cleanstart.com']);
    expect(alertAddresses([], undefined)).toEqual([]);
  });

  it('formats dates as ISO strings and keeps null', () => {
    expect(iso(new Date('2026-11-06T14:02:00Z'))).toBe('2026-11-06T14:02:00.000Z');
    expect(iso(null)).toBeNull();
  });
});
