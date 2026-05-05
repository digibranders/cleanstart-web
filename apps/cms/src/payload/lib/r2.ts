import { S3Client } from '@aws-sdk/client-s3';

/**
 * Lazy R2 client. Returns null when R2 isn't configured so callers can
 * branch (write to local fallback dir, log a warning, etc.) without
 * blowing up at boot.
 *
 * R2 is S3-compatible; the only deviation is the endpoint URL —
 * https://<account-id>.r2.cloudflarestorage.com — set via R2_ENDPOINT.
 */
let cached: { client: S3Client; bucket: string } | null = null;

export type R2Config = {
  client: S3Client;
  bucket: string;
};

export const getR2Client = (): R2Config | null => {
  if (cached) return cached;

  const endpoint = process.env.R2_ENDPOINT;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const bucket = process.env.R2_BUCKET;

  if (!endpoint || !accessKeyId || !secretAccessKey || !bucket) {
    return null;
  }

  const client = new S3Client({
    region: 'auto',
    endpoint,
    credentials: { accessKeyId, secretAccessKey },
    forcePathStyle: true,
  });

  cached = { client, bucket };
  return cached;
};

/** Test-only — clears the cached client between unit tests. */
export const __resetR2Client = (): void => {
  cached = null;
};
