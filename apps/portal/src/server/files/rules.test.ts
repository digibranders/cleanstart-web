import { describe, expect, it } from 'vitest';
import { ConflictError } from '@/server/errors';
import {
  ALLOWED_DOCUMENT_TYPES,
  assertUploadAllowed,
  audienceLabel,
  canPartnerOpen,
  cleanOriginalName,
  DOCUMENT_MAX_BYTES,
  documentKey,
  extensionOf,
  formatLabel,
  mimeForFileName,
  parseDocumentKey,
  sanitiseFileName,
} from './rules';

describe('canPartnerOpen', () => {
  const partner = { id: 'p1', category: 'channel' as const };
  it('lets everyone open an "all" document', () => {
    expect(canPartnerOpen({ kind: 'all', categories: [], partnerIds: [] }, partner)).toBe(true);
  });
  it('matches the partner category for a categories document', () => {
    expect(canPartnerOpen({ kind: 'categories', categories: ['distributor', 'channel'], partnerIds: [] }, partner)).toBe(true);
    expect(canPartnerOpen({ kind: 'categories', categories: ['distributor'], partnerIds: [] }, partner)).toBe(false);
    expect(canPartnerOpen({ kind: 'categories', categories: [], partnerIds: [] }, partner)).toBe(false);
  });
  it('matches the partner id for a named document', () => {
    expect(canPartnerOpen({ kind: 'named', categories: [], partnerIds: ['p1', 'p2'] }, partner)).toBe(true);
    expect(canPartnerOpen({ kind: 'named', categories: [], partnerIds: ['p2'] }, partner)).toBe(false);
    expect(canPartnerOpen({ kind: 'named', categories: ['channel'], partnerIds: [] }, partner)).toBe(false);
  });
});

describe('formatLabel', () => {
  const cases: Array<[Parameters<typeof formatLabel>[0], string]> = [
    [{ mime: 'application/pdf', fileSize: 1_153_434, durationMinutes: null }, 'PDF, 1.1 MB'],
    [{ mime: 'application/pdf', fileSize: 655_360, durationMinutes: null }, 'PDF, 640 KB'],
    [{ mime: 'application/pdf', fileSize: 100, durationMinutes: null }, 'PDF, 1 KB'],
    [{ mime: 'application/zip', fileSize: 18 * 1024 * 1024, durationMinutes: null }, 'ZIP, 18 MB'],
    [{ mime: 'video/mp4', fileSize: 80_000_000, durationMinutes: 14 }, 'MP4, 14 min'],
    [{ mime: 'video/mp4', fileSize: 14 * 1024 * 1024, durationMinutes: null }, 'MP4, 14 MB'],
  ];
  it.each(cases)('%j reads %s', (input, expected) => {
    expect(formatLabel(input)).toBe(expected);
  });
});

describe('file names and keys', () => {
  it.each([
    ['Q3 plan (final).PDF', 'Q3-plan-final.pdf'],
    ['../../etc/passwd.pdf', 'passwd.pdf'],
    ['C:\\fakepath\\x.pdf', 'x.pdf'],
    ['résumé.pdf', 'resume.pdf'],
    ['....pdf', 'file.pdf'],
    ['a.b.c.zip', 'a-b-c.zip'],
    ['noext', 'noext'],
  ])('sanitises %s to %s', (input, expected) => {
    expect(sanitiseFileName(input)).toBe(expected);
  });

  it('cuts a very long stem and keeps the extension', () => {
    const name = sanitiseFileName(`${'a'.repeat(300)}.pdf`);
    expect(name).toBe(`${'a'.repeat(60)}.pdf`);
  });

  it('builds a key from the document id, the version and a random id, never from the raw name', () => {
    const documentId = '11111111-1111-4111-8111-111111111111';
    const key = documentKey({ documentId, version: 3, originalName: '../Secret plan.pdf' });
    expect(key).toMatch(/^documents\/11111111-1111-4111-8111-111111111111\/v3\/[0-9a-f-]{36}-Secret-plan\.pdf$/);
    expect(parseDocumentKey(key)).toEqual({ documentId, version: 3 });
    expect(documentKey({ documentId, version: 3, originalName: 'x.pdf' })).not.toBe(documentKey({ documentId, version: 3, originalName: 'x.pdf' }));
  });

  it.each([
    'documents/x/v1/y',
    'documents/11111111-1111-4111-8111-111111111111/v0/22222222-2222-4222-8222-222222222222-a.pdf',
    'documents/11111111-1111-4111-8111-111111111111/v01/22222222-2222-4222-8222-222222222222-a.pdf',
    'documents/11111111-1111-4111-8111-111111111111/v1/22222222-2222-4222-8222-222222222222-a/b.pdf',
    'seed/slug.pdf',
    'purged/11111111-1111-4111-8111-111111111111',
    '',
  ])('refuses the key %s', (key) => {
    expect(parseDocumentKey(key)).toBeNull();
  });

  it('reads the extension case insensitively and maps it to a content type', () => {
    expect(extensionOf('A.PDF')).toBe('pdf');
    expect(extensionOf('noext')).toBe('');
    expect(mimeForFileName('deck.PPTX')).toBe(ALLOWED_DOCUMENT_TYPES.find((t) => t.ext === 'pptx')?.mime);
    expect(mimeForFileName('virus.exe')).toBeNull();
  });

  it('cleans a display name: no path, no control characters, at most 200 characters, extension kept', () => {
    expect(cleanOriginalName('C:\\x\\Report\u0007 Q3.pdf')).toBe('Report Q3.pdf');
    const long = cleanOriginalName(`${'b'.repeat(400)}.pdf`);
    expect(long).toHaveLength(200);
    expect(long.endsWith('.pdf')).toBe(true);
    expect(cleanOriginalName('   ')).toBe('file');
  });
});

describe('assertUploadAllowed', () => {
  const pdf = { size: 1000, mime: 'application/pdf', originalName: 'a.pdf' };
  const reasonOf = (input: Parameters<typeof assertUploadAllowed>[0]): string | undefined => {
    try {
      assertUploadAllowed(input);
    } catch (error) {
      expect(error).toBeInstanceOf(ConflictError);
      return (error as ConflictError).reason;
    }
    return undefined;
  };
  it('accepts every allow listed type with its own content type', () => {
    for (const type of ALLOWED_DOCUMENT_TYPES) {
      expect(reasonOf({ size: 1, mime: type.mime, originalName: `file.${type.ext}` })).toBeUndefined();
    }
  });
  it('accepts exactly 100 MB and refuses one byte more with file_too_large', () => {
    expect(reasonOf({ ...pdf, size: DOCUMENT_MAX_BYTES })).toBeUndefined();
    expect(reasonOf({ ...pdf, size: DOCUMENT_MAX_BYTES + 1 })).toBe('file_too_large');
  });
  it('refuses an empty file, an unknown extension and a content type that does not match the extension', () => {
    expect(reasonOf({ ...pdf, size: 0 })).toBe('file_missing');
    expect(reasonOf({ ...pdf, originalName: 'a.exe', mime: 'application/x-msdownload' })).toBe('file_type_not_allowed');
    expect(reasonOf({ ...pdf, mime: 'video/mp4' })).toBe('file_type_not_allowed');
    expect(reasonOf({ ...pdf, originalName: 'a.pdf.exe' })).toBe('file_type_not_allowed');
  });
});

describe('audienceLabel', () => {
  const cases: Array<[Parameters<typeof audienceLabel>[0], string]> = [
    [{ kind: 'all', categories: [], partners: [] }, 'All partners'],
    [{ kind: 'categories', categories: ['distributor', 'channel'], partners: [] }, 'Distributors, channel'],
    [{ kind: 'categories', categories: ['channel'], partners: [] }, 'Channel'],
    [{ kind: 'categories', categories: [], partners: [] }, 'No one yet'],
    [{ kind: 'named', categories: [], partners: [{}] }, '1 partner'],
    [{ kind: 'named', categories: [], partners: [{}, {}, {}, {}, {}] }, '5 partners'],
  ];
  it.each(cases)('%j reads %s', (audience, expected) => {
    expect(audienceLabel(audience)).toBe(expected);
  });
});
