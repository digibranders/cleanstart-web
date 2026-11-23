import { describe, expect, it } from 'vitest';
import { ConflictError, ValidationError } from '@/server/errors';
import { FakeFileStorage, fakeRangeFetch } from './fake';
import { assertMediaAllowed, CAPTIONS_MAX_BYTES, matchesMediaMagic, mediaKey, mediaMimeFor, parseMediaKey, POSTER_MAX_BYTES, verifyMedia } from './media';

const DOC = '11111111-1111-4111-8111-111111111111';
const PNG = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
const text = (s: string): number[] => Array.from(new TextEncoder().encode(s));

describe('media types and sizes', () => {
  it('decides the content type from the extension and kind', () => {
    expect(mediaMimeFor('poster', 'a.PNG')).toBe('image/png');
    expect(mediaMimeFor('poster', 'a.jpeg')).toBe('image/jpeg');
    expect(mediaMimeFor('poster', 'a.svg')).toBeNull();
    expect(mediaMimeFor('poster', 'a.vtt')).toBeNull();
    expect(mediaMimeFor('captions', 'a.vtt')).toBe('text/vtt');
    expect(mediaMimeFor('captions', 'a.srt')).toBeNull();
  });
  it('accepts a poster up to 2 MB and captions up to 500 KB, and refuses one byte more or an empty file', () => {
    expect(assertMediaAllowed({ kind: 'poster', size: POSTER_MAX_BYTES, originalName: 'p.png' })).toBe('image/png');
    expect(() => assertMediaAllowed({ kind: 'poster', size: POSTER_MAX_BYTES + 1, originalName: 'p.png' })).toThrow(ConflictError);
    expect(assertMediaAllowed({ kind: 'captions', size: CAPTIONS_MAX_BYTES, originalName: 'c.vtt' })).toBe('text/vtt');
    expect(() => assertMediaAllowed({ kind: 'captions', size: CAPTIONS_MAX_BYTES + 1, originalName: 'c.vtt' })).toThrow(ConflictError);
    expect(() => assertMediaAllowed({ kind: 'captions', size: 0, originalName: 'c.vtt' })).toThrow(ConflictError);
    expect(() => assertMediaAllowed({ kind: 'captions', size: 10, originalName: 'c.txt' })).toThrow(ConflictError);
  });
});

describe('matchesMediaMagic', () => {
  it('checks PNG and JPEG signatures', () => {
    expect(matchesMediaMagic('poster', PNG)).toBe(true);
    expect(matchesMediaMagic('poster', [0xff, 0xd8, 0xff, 0xe0])).toBe(true);
    expect(matchesMediaMagic('poster', text('<svg xmlns'))).toBe(false);
  });
  it('requires WEBVTT first, with or without a byte order mark, followed by a break', () => {
    expect(matchesMediaMagic('captions', text('WEBVTT\n\n00:00.000 --> 00:01.000'))).toBe(true);
    expect(matchesMediaMagic('captions', text('WEBVTT'))).toBe(true);
    expect(matchesMediaMagic('captions', text('WEBVTT - title'))).toBe(true);
    expect(matchesMediaMagic('captions', [0xef, 0xbb, 0xbf, ...text('WEBVTT\n')])).toBe(true);
    expect(matchesMediaMagic('captions', text('\nWEBVTT'))).toBe(false);
    expect(matchesMediaMagic('captions', text('WEBVTTX'))).toBe(false);
    expect(matchesMediaMagic('captions', text('webvtt'))).toBe(false);
    expect(matchesMediaMagic('captions', text('1\n00:00:01,000 --> 00:00:02,000'))).toBe(false);
  });
});

describe('media keys', () => {
  it('round trips the document id and kind and refuses any other key', () => {
    const key = mediaKey({ documentId: DOC, kind: 'captions', originalName: 'My Captions.VTT' });
    expect(parseMediaKey(key)).toEqual({ documentId: DOC, kind: 'captions' });
    expect(parseMediaKey(mediaKey({ documentId: DOC, kind: 'poster', originalName: 'x.jpeg' }))).toEqual({ documentId: DOC, kind: 'poster' });
    expect(parseMediaKey(`documents/${DOC}/v1/22222222-2222-4222-8222-222222222222-x.pdf`)).toBeNull();
    expect(parseMediaKey('partner-logos/x.png')).toBeNull();
  });
});

describe('verifyMedia', () => {
  const verify = (storage: FakeFileStorage, input: Parameters<typeof verifyMedia>[1]) => verifyMedia(storage, input, fakeRangeFetch(storage));
  const upload = (storage: FakeFileStorage, key: string, size: number, contentType: string, head: number[]): void => storage.simulateUpload(key, size, contentType, head);

  it('accepts a stored poster and a stored captions file', async () => {
    const storage = new FakeFileStorage();
    const poster = mediaKey({ documentId: DOC, kind: 'poster', originalName: 'p.png' });
    upload(storage, poster, 1000, 'image/png', PNG);
    await expect(verify(storage, { documentId: DOC, kind: 'poster', key: poster, size: 1000, originalName: 'p.png' })).resolves.toBe(poster);
    const vtt = mediaKey({ documentId: DOC, kind: 'captions', originalName: 'c.vtt' });
    upload(storage, vtt, 200, 'text/vtt', text('WEBVTT\n'));
    await expect(verify(storage, { documentId: DOC, kind: 'captions', key: vtt, size: 200, originalName: 'c.vtt' })).resolves.toBe(vtt);
  });
  it('refuses captions that do not start with WEBVTT, a wrong size or type, and a key for another document or kind', async () => {
    const storage = new FakeFileStorage();
    const vtt = mediaKey({ documentId: DOC, kind: 'captions', originalName: 'c.vtt' });
    upload(storage, vtt, 200, 'text/vtt', text('1\n00:00:01,000'));
    await expect(verify(storage, { documentId: DOC, kind: 'captions', key: vtt, size: 200, originalName: 'c.vtt' })).rejects.toThrow('WEBVTT');
    upload(storage, vtt, 200, 'text/vtt', text('WEBVTT\n'));
    await expect(verify(storage, { documentId: DOC, kind: 'captions', key: vtt, size: 199, originalName: 'c.vtt' })).rejects.toThrow(ConflictError);
    upload(storage, vtt, 200, 'text/html', text('WEBVTT\n'));
    await expect(verify(storage, { documentId: DOC, kind: 'captions', key: vtt, size: 200, originalName: 'c.vtt' })).rejects.toThrow(ConflictError);
    await expect(verify(storage, { documentId: '22222222-2222-4222-8222-222222222222', kind: 'captions', key: vtt, size: 200, originalName: 'c.vtt' })).rejects.toBeInstanceOf(ValidationError);
    await expect(verify(storage, { documentId: DOC, kind: 'poster', key: vtt, size: 200, originalName: 'c.png' })).rejects.toBeInstanceOf(ValidationError);
  });
  it('refuses a missing object', async () => {
    const storage = new FakeFileStorage();
    const key = mediaKey({ documentId: DOC, kind: 'poster', originalName: 'p.png' });
    await expect(verify(storage, { documentId: DOC, kind: 'poster', key, size: 10, originalName: 'p.png' })).rejects.toThrow(ConflictError);
  });
});
