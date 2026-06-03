import { describe, expect, it } from 'vitest';

import { ALLOWED_MIME_TYPES, RESUME_MIME_TYPES, checkUploadSize, limitForMime } from './upload-limits';

const MB = 1024 * 1024;

describe('limitForMime', () => {
  it.each([
    ['image/jpeg', 25],
    ['image/png', 25],
    ['image/webp', 25],
    ['image/avif', 25],
    ['image/svg+xml', 25],
    ['application/pdf', 50],
    ['video/mp4', 200],
    ['application/zip', 100],
    ['application/x-zip-compressed', 100],
  ])('%s → %i MB', (mime, expectedMb) => {
    expect(limitForMime(mime)).toBe(expectedMb * MB);
  });

  it('falls back to image limit for unknown mimes', () => {
    expect(limitForMime('application/octet-stream')).toBe(25 * MB);
    expect(limitForMime(undefined)).toBe(25 * MB);
    expect(limitForMime(null)).toBe(25 * MB);
  });
});

describe('checkUploadSize', () => {
  it('passes when filesize is within the per-mime limit', () => {
    expect(checkUploadSize('image/jpeg', 24 * MB)).toEqual({ ok: true });
    expect(checkUploadSize('application/pdf', 49 * MB)).toEqual({ ok: true });
    expect(checkUploadSize('video/mp4', 199 * MB)).toEqual({ ok: true });
  });

  it('fails when filesize exceeds the per-mime limit', () => {
    const result = checkUploadSize('image/jpeg', 26 * MB);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toContain('25 MB');
    }
  });

  it('passes when filesize is unknown', () => {
    expect(checkUploadSize('image/jpeg', null)).toEqual({ ok: true });
    expect(checkUploadSize('image/jpeg', undefined)).toEqual({ ok: true });
  });
});

describe('resume upload limits', () => {
  const DOCX = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

  it('accepts pdf/doc/docx as resume mime types', () => {
    expect(RESUME_MIME_TYPES).toContain('application/pdf');
    expect(RESUME_MIME_TYPES).toContain('application/msword');
    expect(RESUME_MIME_TYPES).toContain(DOCX);
  });

  it('docx is in the global allow-list', () => {
    expect(ALLOWED_MIME_TYPES).toContain(DOCX);
  });

  it('caps doc/docx at 10 MB', () => {
    expect(limitForMime(DOCX)).toBe(10 * MB);
    expect(checkUploadSize(DOCX, 9 * MB)).toEqual({ ok: true });
    expect(checkUploadSize(DOCX, 11 * MB).ok).toBe(false);
  });
});
