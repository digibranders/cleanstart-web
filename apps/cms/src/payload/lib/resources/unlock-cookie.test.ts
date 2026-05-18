import { describe, expect, it } from 'vitest';

import {
  UNLOCK_COOKIE_NAME,
  __maxIds,
  buildUnlockCookieHeader,
  readUnlockedIds,
} from './unlock-cookie';

const SECRET = 'test-secret-unlock-cookie';

const cookieFromSetHeader = (setCookie: string): string => setCookie.split(';')[0] ?? '';

describe('unlock-cookie', () => {
  it('appends a new id and round-trips', () => {
    const setCookie = buildUnlockCookieHeader({
      resourceId: 'res-1',
      cookieHeader: null,
      secret: SECRET,
    });
    const ids = readUnlockedIds(cookieFromSetHeader(setCookie), SECRET);
    expect(ids).toEqual(['res-1']);
  });

  it('returns empty list for missing cookie header', () => {
    expect(readUnlockedIds(undefined, SECRET)).toEqual([]);
    expect(readUnlockedIds(null, SECRET)).toEqual([]);
    expect(readUnlockedIds('', SECRET)).toEqual([]);
  });

  it('is idempotent — appending the same id moves it to the end without duplication', () => {
    const first = cookieFromSetHeader(
      buildUnlockCookieHeader({ resourceId: 'res-1', cookieHeader: null, secret: SECRET }),
    );
    const second = cookieFromSetHeader(
      buildUnlockCookieHeader({ resourceId: 'res-2', cookieHeader: first, secret: SECRET }),
    );
    const third = cookieFromSetHeader(
      buildUnlockCookieHeader({ resourceId: 'res-1', cookieHeader: second, secret: SECRET }),
    );
    expect(readUnlockedIds(third, SECRET)).toEqual(['res-2', 'res-1']);
  });

  it('rejects a tampered signature and returns empty list', () => {
    const setCookie = buildUnlockCookieHeader({
      resourceId: 'res-1',
      cookieHeader: null,
      secret: SECRET,
    });
    const value = cookieFromSetHeader(setCookie);
    // Flip the last char of the signature
    const tampered = value.replace(/.$/u, (c) => (c === 'A' ? 'B' : 'A'));
    expect(readUnlockedIds(tampered, SECRET)).toEqual([]);
  });

  it('rejects a cookie signed with a different secret', () => {
    const setCookie = buildUnlockCookieHeader({
      resourceId: 'res-1',
      cookieHeader: null,
      secret: SECRET,
    });
    expect(readUnlockedIds(cookieFromSetHeader(setCookie), 'other-secret')).toEqual([]);
  });

  it('caps at MAX_IDS — drops oldest', () => {
    let cookie: string | null = null;
    for (let i = 0; i < __maxIds + 5; i += 1) {
      cookie = cookieFromSetHeader(
        buildUnlockCookieHeader({
          resourceId: `res-${i}`,
          cookieHeader: cookie,
          secret: SECRET,
        }),
      );
    }
    const ids = readUnlockedIds(cookie, SECRET);
    expect(ids.length).toBe(__maxIds);
    expect(ids[ids.length - 1]).toBe(`res-${__maxIds + 5 - 1}`);
    expect(ids).not.toContain('res-0');
  });

  it('sets HttpOnly, Path=/, SameSite=Lax, Secure attributes', () => {
    const setCookie = buildUnlockCookieHeader({
      resourceId: 'res-1',
      cookieHeader: null,
      secret: SECRET,
    });
    expect(setCookie).toMatch(new RegExp(`^${UNLOCK_COOKIE_NAME}=`));
    expect(setCookie).toMatch(/HttpOnly/);
    expect(setCookie).toMatch(/Path=\//);
    expect(setCookie).toMatch(/SameSite=Lax/);
    expect(setCookie).toMatch(/Max-Age=\d+/);
    expect(setCookie).toMatch(/Secure/);
  });

  it('omits Secure attribute when secure: false (local dev over http)', () => {
    const setCookie = buildUnlockCookieHeader({
      resourceId: 'res-1',
      cookieHeader: null,
      secret: SECRET,
      secure: false,
    });
    expect(setCookie).not.toMatch(/Secure/);
  });
});
