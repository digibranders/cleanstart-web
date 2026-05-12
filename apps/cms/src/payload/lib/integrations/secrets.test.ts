import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { decrypt, decryptJson, encrypt, encryptJson, isEncrypted } from './secrets';

describe('integrations/secrets', () => {
  const originalSecret = process.env.PAYLOAD_SECRET;

  beforeEach(() => {
    process.env.PAYLOAD_SECRET = 'test-payload-secret-deterministic-key-material';
  });

  afterEach(() => {
    // Restore (or remove) the test secret without using `delete` so
    // biome's noDelete rule stays satisfied. Empty string is treated
    // by `secrets.ts` the same way as a missing var.
    process.env.PAYLOAD_SECRET = originalSecret ?? '';
  });

  it('round-trips a string through encrypt/decrypt', () => {
    const plain = 'hunter2 with unicode: 🛡️ — and newlines\nand quotes "yes"';
    const cipher = encrypt(plain);
    expect(cipher.startsWith('v1:')).toBe(true);
    expect(decrypt(cipher)).toBe(plain);
  });

  it('produces a different ciphertext for the same plaintext (random IV)', () => {
    const a = encrypt('same input');
    const b = encrypt('same input');
    expect(a).not.toBe(b);
    expect(decrypt(a)).toBe(decrypt(b));
  });

  it('fails to decrypt when the master secret has changed', () => {
    const cipher = encrypt('payload');
    process.env.PAYLOAD_SECRET = 'a-completely-different-secret-now';
    expect(() => decrypt(cipher)).toThrow();
  });

  it('rejects malformed ciphers', () => {
    expect(() => decrypt('not-versioned')).toThrow(/v1:/);
    expect(() => decrypt('v1:short')).toThrow();
  });

  it('round-trips JSON via encryptJson/decryptJson', () => {
    const value = { token: 'abc', urls: ['x', 'y'], n: 7, nested: { ok: true } };
    const cipher = encryptJson(value);
    expect(decryptJson(cipher)).toEqual(value);
  });

  it('isEncrypted distinguishes ciphertext from plaintext', () => {
    expect(isEncrypted(encrypt('x'))).toBe(true);
    expect(isEncrypted('plain string')).toBe(false);
    expect(isEncrypted(null)).toBe(false);
    expect(isEncrypted(42)).toBe(false);
  });

  it('throws when PAYLOAD_SECRET is empty', () => {
    process.env.PAYLOAD_SECRET = '';
    expect(() => encrypt('x')).toThrow(/PAYLOAD_SECRET/);
  });
});
