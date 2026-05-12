import { createCipheriv, createDecipheriv, hkdfSync, randomBytes } from 'node:crypto';

/**
 * App-layer secret encryption for the `integrations` collection's
 * `config` blob. Wraps Node's AES-256-GCM with a single key derived
 * from `PAYLOAD_SECRET` via HKDF.
 *
 * Wire format: `v1:<base64(iv || authTag || ciphertext)>`.
 *   - iv:        12 bytes (GCM recommended length)
 *   - authTag:   16 bytes (GCM standard)
 *   - ciphertext: remainder
 *
 * The `v1` prefix is the only version field we expose; if the cipher
 * or key derivation ever changes, bump to `v2:` and keep `v1:` decode
 * support for one release before deleting it.
 *
 * Rotation: change PAYLOAD_SECRET → re-encrypt every stored config
 * blob from a one-shot script. We never query inside ciphertext, so
 * Postgres treats it as opaque bytes.
 */

const VERSION_PREFIX = 'v1:';
const IV_BYTES = 12;
const AUTH_TAG_BYTES = 16;
const KEY_BYTES = 32;
const HKDF_INFO = 'cleanstart:integrations:v1';
const HKDF_SALT = 'cleanstart:integrations';

const getMasterSecret = (): string => {
  const secret = process.env.PAYLOAD_SECRET;
  if (!secret || secret.length === 0) {
    throw new Error('PAYLOAD_SECRET is required to encrypt integration config');
  }
  return secret;
};

const deriveKey = (): Buffer => {
  const derived = hkdfSync('sha256', getMasterSecret(), HKDF_SALT, HKDF_INFO, KEY_BYTES);
  return Buffer.from(derived);
};

/**
 * Encrypt a UTF-8 string. Returns a `v1:<base64>` blob safe to store
 * in a Postgres text column.
 */
export const encrypt = (plain: string): string => {
  const key = deriveKey();
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const ciphertext = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  const blob = Buffer.concat([iv, authTag, ciphertext]);
  return `${VERSION_PREFIX}${blob.toString('base64')}`;
};

/**
 * Decrypt a `v1:<base64>` blob produced by `encrypt`. Throws if the
 * format is unrecognised, the auth tag fails, or the master secret
 * has rotated past what the blob was encrypted with.
 */
export const decrypt = (cipher: string): string => {
  if (!cipher.startsWith(VERSION_PREFIX)) {
    throw new Error('Unrecognised cipher format — expected v1: prefix');
  }
  const blob = Buffer.from(cipher.slice(VERSION_PREFIX.length), 'base64');
  if (blob.length < IV_BYTES + AUTH_TAG_BYTES + 1) {
    throw new Error('Cipher blob too short');
  }
  const iv = blob.subarray(0, IV_BYTES);
  const authTag = blob.subarray(IV_BYTES, IV_BYTES + AUTH_TAG_BYTES);
  const ciphertext = blob.subarray(IV_BYTES + AUTH_TAG_BYTES);
  const key = deriveKey();
  const decipher = createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(authTag);
  const plain = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  return plain.toString('utf8');
};

/**
 * `true` when the input has the v1 envelope shape. Lets call sites
 * tell "ciphertext" from "plain admin-form input that hasn't been
 * encrypted yet" without trying to decrypt and catching.
 */
export const isEncrypted = (value: unknown): value is string =>
  typeof value === 'string' && value.startsWith(VERSION_PREFIX);

/**
 * Encrypt the JSON-serialised form of any value. Convenience for the
 * `config` field where the shape varies per integration kind.
 */
export const encryptJson = (value: unknown): string => encrypt(JSON.stringify(value));

/**
 * Decrypt and `JSON.parse` the result. Throws on either step.
 */
export const decryptJson = <T = unknown>(cipher: string): T =>
  JSON.parse(decrypt(cipher)) as T;
