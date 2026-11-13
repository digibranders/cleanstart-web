import { randomBytes, scryptSync } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { ValidationError } from '@/server/errors';
import { assertPasswordOk, checkPassword, hashPassword, verifyPassword } from './passwords';

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

const LABELS = ['At least 8 characters', 'A letter', 'A number', 'A special character'];

/** [password, length, letter, number, special] */
const CASES: Array<[string, boolean, boolean, boolean, boolean]> = [
  ['', false, false, false, false],
  ['abcdefgh', true, true, false, false],
  ['abcdefg1', true, true, true, false],
  ['abcdef1!', true, true, true, true],
  ['Ab1!', false, true, true, true],
  ['12345678!', true, false, true, true],
  ['Abcdefgh!', true, true, false, true],
  ['Correct horse 9', true, true, true, true],
];

describe('checkPassword', () => {
  it.each(CASES)('%j', (password, length, letter, number, special) => {
    const result = checkPassword(password);
    expect(result.rules.map((rule) => rule.label)).toEqual(LABELS);
    expect(result.rules.map((rule) => rule.met)).toEqual([length, letter, number, special]);
    expect(result.ok).toBe(length && letter && number && special);
  });

  it('gives the password field these same rules, so the client and the server cannot disagree', () => {
    const field = readFileSync(join(process.cwd(), 'src/components/ui/password-field.tsx'), 'utf8');
    expect(field).toContain('checkPassword(value).rules');
    expect(field).not.toMatch(/value\.length >=|\/\[A-Za-z\]\//);
  });
});

describe('assertPasswordOk', () => {
  it('accepts a password that meets the rule', () => {
    expect(() => assertPasswordOk('abcdef1!')).not.toThrow();
  });

  it('throws a ValidationError on the password path with the rule message', () => {
    try {
      assertPasswordOk('abcdefgh');
      expect.unreachable();
    } catch (error) {
      expect(error).toBeInstanceOf(ValidationError);
      expect((error as ValidationError).issues).toEqual([{ path: 'password', message: 'Meet all four password rules.' }]);
    }
  });
});

describe('hashPassword', () => {
  it('has the stored format and salts every hash', async () => {
    const hash = await hashPassword('Sample#Pass1');
    expect(hash).toMatch(/^scrypt\$16384\$16\$1\$[A-Za-z0-9+/=]+\$[A-Za-z0-9+/=]+$/);
    expect(await hashPassword('Sample#Pass1')).not.toBe(hash);
  });
});
