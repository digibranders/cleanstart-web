import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';

const N = 16384;
const R = 16;
const P = 1;
const KEY_LENGTH = 64;
const SALT_BYTES = 16;
const MAX_MEMORY = 64 * 1024 * 1024;
// Upper bounds for a stored hash, so a planted hash cannot cost unbounded work.
const MAX_N = 2 ** 17;
const MAX_R = 16;
const MAX_P = 4;

const derive = (password: string, salt: Buffer, n: number, r: number, p: number, length: number): Promise<Buffer> =>
  new Promise((resolve, reject) => {
    scrypt(password.normalize('NFKC'), salt, length, { N: n, r, p, maxmem: MAX_MEMORY }, (error, key) => {
      if (error) reject(error);
      else resolve(key);
    });
  });

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(SALT_BYTES);
  const key = await derive(password, salt, N, R, P, KEY_LENGTH);
  return `scrypt$${N}$${R}$${P}$${salt.toString('base64')}$${key.toString('base64')}`;
}

export async function verifyPassword(input: { hash: string; password: string }): Promise<boolean> {
  const parts = input.hash.split('$');
  if (parts.length !== 6 || parts[0] !== 'scrypt') return false;
  const [, nRaw, rRaw, pRaw, saltB64, keyB64] = parts;
  const n = Number(nRaw);
  const r = Number(rRaw);
  const p = Number(pRaw);
  if (![n, r, p].every((v) => Number.isInteger(v) && v > 0) || !saltB64 || !keyB64) return false;
  if (n > MAX_N || r > MAX_R || p > MAX_P) return false;
  const salt = Buffer.from(saltB64, 'base64');
  const expected = Buffer.from(keyB64, 'base64');
  if (salt.length < SALT_BYTES || expected.length !== KEY_LENGTH) return false;
  try {
    const actual = await derive(input.password, salt, n, r, p, KEY_LENGTH);
    return timingSafeEqual(actual, expected);
  } catch {
    // scrypt rejects parameters that are not valid (N must be a power of two): a broken hash never verifies.
    return false;
  }
}
