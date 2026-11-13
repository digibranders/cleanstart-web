import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { env } from '@/env';
import { type Clock, systemClock } from '@/lib/clock';
import { IntegrationError } from '@/server/errors';
import type { FileStorage } from './storage';

export const PUT_EXPIRES_SECONDS = 600;
export const GET_EXPIRES_SECONDS = 60;
const MAX_EXPIRES_SECONDS = 3600;

export interface R2ClientConfig {
  endpoint: string;
  accessKeyId: string;
  secretAccessKey: string;
}

export interface R2StorageDeps {
  client: S3Client;
  bucket: string;
  clock?: Clock;
}

/**
 * R2 needs region 'auto' and path style. WHEN_REQUIRED stops SDK v3 adding a CRC32 checksum (of an empty body) to a
 * presigned PUT, which makes a real upload fail. Verified offline against @aws-sdk/client-s3 3.1042.0.
 */
export function buildR2Client(config: R2ClientConfig): S3Client {
  return new S3Client({
    region: 'auto',
    endpoint: config.endpoint,
    credentials: { accessKeyId: config.accessKeyId, secretAccessKey: config.secretAccessKey },
    forcePathStyle: true,
    requestChecksumCalculation: 'WHEN_REQUIRED',
    responseChecksumValidation: 'WHEN_REQUIRED',
  });
}

const printable = (value: string): string =>
  Array.from(value)
    .filter((char) => {
      const code = char.codePointAt(0) ?? 0;
      return code >= 0x20 && code !== 0x7f && char !== '"' && char !== '\\';
    })
    .join('');

const asciiOnly = (value: string): string =>
  Array.from(value)
    .map((char) => ((char.codePointAt(0) ?? 0) > 0x7e ? '_' : char))
    .join('');

/** Content-Disposition that forces a download: an ASCII fallback plus the RFC 5987 encoded name. */
export function contentDisposition(filename: string): string {
  const cleaned = printable(filename).trim() || 'download';
  const encoded = encodeURIComponent(cleaned).replace(
    /['()*]/g,
    (char) => `%${char.charCodeAt(0).toString(16).toUpperCase()}`,
  );
  return `attachment; filename="${asciiOnly(cleaned)}"; filename*=UTF-8''${encoded}`;
}

const clampExpiry = (seconds: number): number => Math.min(Math.max(Math.floor(seconds), 1), MAX_EXPIRES_SECONDS);

const isNotFound = (error: unknown): boolean => {
  if (typeof error !== 'object' || error === null) return false;
  const candidate = error as { name?: string; $metadata?: { httpStatusCode?: number } };
  return candidate.name === 'NotFound' || candidate.name === 'NoSuchKey' || candidate.$metadata?.httpStatusCode === 404;
};

export function createR2Storage(deps: R2StorageDeps): FileStorage {
  const clock = deps.clock ?? systemClock;
  const expiresAt = (seconds: number): Date => new Date(clock.now().getTime() + seconds * 1000);

  return {
    async presignPut({ key, contentType, contentLength, expiresInSeconds = PUT_EXPIRES_SECONDS }) {
      const seconds = clampExpiry(expiresInSeconds);
      try {
        const url = await getSignedUrl(
          deps.client,
          new PutObjectCommand({ Bucket: deps.bucket, Key: key, ContentType: contentType, ContentLength: contentLength }),
          { expiresIn: seconds, signableHeaders: new Set(['content-type']) },
        );
        return { url, headers: { 'Content-Type': contentType }, expiresAt: expiresAt(seconds) };
      } catch (cause) {
        throw new IntegrationError('r2', 'could not sign an upload URL', { cause });
      }
    },

    async presignGet({ key, filename, expiresInSeconds = GET_EXPIRES_SECONDS }) {
      const seconds = clampExpiry(expiresInSeconds);
      try {
        const url = await getSignedUrl(
          deps.client,
          new GetObjectCommand({
            Bucket: deps.bucket,
            Key: key,
            ResponseContentDisposition: contentDisposition(filename),
          }),
          { expiresIn: seconds },
        );
        return { url, expiresAt: expiresAt(seconds) };
      } catch (cause) {
        throw new IntegrationError('r2', 'could not sign a download URL', { cause });
      }
    },

    async head(key) {
      try {
        const out = await deps.client.send(new HeadObjectCommand({ Bucket: deps.bucket, Key: key }));
        return { size: out.ContentLength ?? 0, contentType: out.ContentType ?? 'application/octet-stream' };
      } catch (error) {
        if (isNotFound(error)) return null;
        throw new IntegrationError('r2', 'head request failed', { cause: error });
      }
    },

    async delete(key) {
      try {
        await deps.client.send(new DeleteObjectCommand({ Bucket: deps.bucket, Key: key }));
      } catch (error) {
        throw new IntegrationError('r2', 'delete request failed', { cause: error });
      }
    },
  };
}

/** The private documents bucket. Throws IntegrationError('r2') when any R2_* variable is unset (development without R2). */
export function createFileStorage(): FileStorage {
  const { R2_ENDPOINT, R2_BUCKET, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY } = env;
  if (!R2_ENDPOINT || !R2_BUCKET || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY) {
    throw new IntegrationError('r2', 'R2_ENDPOINT, R2_BUCKET, R2_ACCESS_KEY_ID and R2_SECRET_ACCESS_KEY must all be set');
  }
  const client = buildR2Client({ endpoint: R2_ENDPOINT, accessKeyId: R2_ACCESS_KEY_ID, secretAccessKey: R2_SECRET_ACCESS_KEY });
  return createR2Storage({ client, bucket: R2_BUCKET });
}
