import { randomBytes, scryptSync } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { hashPassword, verifyPassword } from './passwords';

const PASSWORD = 'Portal-dev-2026!';

const makeHash = (n: number, r: number, p: number, saltBytes = 16, keyBytes = 64): string => {
  const salt = randomBytes(saltBytes);
  const key = scryptSync(PASSWORD.normalize('NFKC'), salt, keyBytes, { N: n, r, p, maxmem: 256 * 1024 * 1024 });
  return `scrypt$${n}$${r}$${p}$${salt.toString('base64')}$${key.toString('base64')}`;
};

describe('verifyPassword', () => {
  it('accepts the right password and refuses a wrong one for a hash made by hashPassword', async () => {
    const hash = await hashPassword(PASSWORD);
    expect(await verifyPassword({ hash, password: PASSWORD })).toBe(true);
    expect(await verifyPassword({ hash, password: 'Portal-dev-2026?' })).toBe(false);
  });

  it('accepts a hash made with the current parameters and one with lower ones the caps still allow', async () => {
    expect(await verifyPassword({ hash: makeHash(16384, 16, 1), password: PASSWORD })).toBe(true);
    expect(await verifyPassword({ hash: makeHash(16384, 8, 1), password: PASSWORD })).toBe(true);
  });

  it('refuses a hash whose key decodes to zero bytes for any password', async () => {
    expect(await verifyPassword({ hash: 'scrypt$16384$16$1$AAAAAAAAAAAAAAAAAAAAAA==$=', password: 'anything' })).toBe(false);
    expect(await verifyPassword({ hash: 'scrypt$16384$16$1$AAAA$=', password: 'anything' })).toBe(false);
  });

  it('refuses a key that is not 64 bytes', async () => {
    expect(await verifyPassword({ hash: makeHash(16384, 16, 1, 16, 32), password: PASSWORD })).toBe(false);
    expect(await verifyPassword({ hash: makeHash(16384, 16, 1, 16, 128), password: PASSWORD })).toBe(false);
  });

  it('refuses a salt shorter than 16 bytes', async () => {
    expect(await verifyPassword({ hash: makeHash(16384, 16, 1, 8), password: PASSWORD })).toBe(false);
    expect(await verifyPassword({ hash: makeHash(16384, 16, 1, 0), password: PASSWORD })).toBe(false);
  });

  it('refuses parameters above the caps without deriving a key', async () => {
    const [, , , , salt, key] = makeHash(16384, 16, 1).split('$');
    for (const params of ['262144$16$1', '16384$32$1', '16384$16$64', '16384$16$5']) {
      const started = Date.now();
      expect(await verifyPassword({ hash: `scrypt$${params}$${salt}$${key}`, password: PASSWORD })).toBe(false);
      expect(Date.now() - started).toBeLessThan(1000);
    }
  });

  it('refuses malformed hashes', async () => {
    for (const hash of ['', 'scrypt$1$2$3', 'bcrypt$16384$16$1$AAAA$AAAA', 'scrypt$x$16$1$AAAA$AAAA', 'scrypt$16383$16$1$AAAA$AAAA']) {
      expect(await verifyPassword({ hash, password: PASSWORD })).toBe(false);
    }
  });
});
