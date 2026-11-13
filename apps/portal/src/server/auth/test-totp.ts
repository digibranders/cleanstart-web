import { createHmac } from 'node:crypto';

const BASE32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

/** The key bytes behind the base32 `secret` parameter of an otpauth:// URI. */
export const base32Decode = (encoded: string): Buffer => {
  let bits = '';
  for (const char of encoded.replace(/=+$/, '').toUpperCase()) {
    const value = BASE32.indexOf(char);
    if (value < 0) throw new Error(`not base32: ${char}`);
    bits += value.toString(2).padStart(5, '0');
  }
  const bytes: number[] = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) bytes.push(Number.parseInt(bits.slice(i, i + 8), 2));
  return Buffer.from(bytes);
};

/** RFC 6238 code (HMAC-SHA1, 30 second step, 6 digits) for an otpauth:// URI. Tests only. */
export const totpCode = (totpUri: string, at: Date = new Date()): string => {
  const secret = new URL(totpUri).searchParams.get('secret');
  if (!secret) throw new Error('the otpauth URI has no secret');
  const counter = Buffer.alloc(8);
  counter.writeBigUInt64BE(BigInt(Math.floor(at.getTime() / 1000 / 30)));
  const digest = createHmac('sha1', base32Decode(secret)).update(counter).digest();
  const offset = (digest[digest.length - 1] ?? 0) & 0xf;
  const binary =
    (((digest[offset] ?? 0) & 0x7f) << 24) |
    (((digest[offset + 1] ?? 0) & 0xff) << 16) |
    (((digest[offset + 2] ?? 0) & 0xff) << 8) |
    ((digest[offset + 3] ?? 0) & 0xff);
  return String(binary % 1_000_000).padStart(6, '0');
};
