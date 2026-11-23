import { describe, expect, it } from 'vitest';
import { LOGO_MAX_BYTES } from '@/lib/company-profile';
import { ConflictError, ValidationError } from '@/server/errors';
import { FakeFileStorage, fakeRangeFetch } from './fake';
import { assertLogoAllowed, createLogoTicket, logoKey, matchesLogoMagic, parseLogoKey, verifyLogo } from './logo';

const PARTNER = '11111111-1111-4111-8111-111111111111';
const OTHER = '22222222-2222-4222-8222-222222222222';
const PNG = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0];
const JPG = [0xff, 0xd8, 0xff, 0xe0];

describe('logo keys', () => {
  it('carries the partner id and only an allowed extension', () => {
    const key = logoKey({ partnerId: PARTNER, originalName: 'My Logo.PNG' });
    expect(key).toMatch(/^partner-logos\/[0-9a-f-]{36}\/[0-9a-f-]{36}\.png$/);
    expect(parseLogoKey(key)).toEqual({ partnerId: PARTNER });
    expect(parseLogoKey('documents/x/v1/a.pdf')).toBeNull();
    expect(parseLogoKey(`partner-logos/${PARTNER}/abc.svg`)).toBeNull();
  });
});

describe('assertLogoAllowed', () => {
  it('accepts png and jpg and refuses svg, gif, pdf, empty and over 1 MB files', () => {
    expect(assertLogoAllowed({ originalName: 'a.png', size: 10 })).toBe('image/png');
    expect(assertLogoAllowed({ originalName: 'a.JPG', size: 10 })).toBe('image/jpeg');
    expect(assertLogoAllowed({ originalName: 'a.jpeg', size: LOGO_MAX_BYTES })).toBe('image/jpeg');
    for (const name of ['a.svg', 'a.gif', 'a.pdf', 'a']) {
      expect(() => assertLogoAllowed({ originalName: name, size: 10 })).toThrow(expect.objectContaining({ reason: 'file_type_not_allowed' }));
    }
    expect(() => assertLogoAllowed({ originalName: 'a.png', size: 0 })).toThrow(ConflictError);
    expect(() => assertLogoAllowed({ originalName: 'a.png', size: LOGO_MAX_BYTES + 1 })).toThrow(expect.objectContaining({ reason: 'file_too_large' }));
  });
});

describe('matchesLogoMagic', () => {
  it('checks the real signature, not the name', () => {
    expect(matchesLogoMagic('image/png', PNG)).toBe(true);
    expect(matchesLogoMagic('image/png', JPG)).toBe(false);
    expect(matchesLogoMagic('image/jpeg', JPG)).toBe(true);
    expect(matchesLogoMagic('image/jpeg', [0x3c, 0x73, 0x76, 0x67])).toBe(false);
  });
});

describe('createLogoTicket and verifyLogo', () => {
  const upload = async (head: number[], name = 'a.png', size = 100, contentType = 'image/png') => {
    const storage = new FakeFileStorage();
    const { key, put } = await createLogoTicket(storage, { partnerId: PARTNER, originalName: name, size });
    expect(put.headers['Content-Type']).toBe(contentType);
    storage.simulateUpload(key, size, contentType, head);
    return { storage, key, fetchImpl: fakeRangeFetch(storage) };
  };

  it('accepts a finished png upload', async () => {
    const { storage, key, fetchImpl } = await upload(PNG);
    await expect(verifyLogo(storage, { partnerId: PARTNER, key, size: 100, originalName: 'a.png' }, fetchImpl)).resolves.toBe(key);
  });

  it('refuses a key made for another company', async () => {
    const { storage, key, fetchImpl } = await upload(PNG);
    await expect(verifyLogo(storage, { partnerId: OTHER, key, size: 100, originalName: 'a.png' }, fetchImpl)).rejects.toBeInstanceOf(ValidationError);
  });

  it('refuses a file whose bytes are not the claimed image, a missing object and a size mismatch', async () => {
    const wrong = await upload([0x3c, 0x73, 0x76, 0x67]);
    await expect(verifyLogo(wrong.storage, { partnerId: PARTNER, key: wrong.key, size: 100, originalName: 'a.png' }, wrong.fetchImpl)).rejects.toMatchObject({ reason: 'file_type_not_allowed' });
    const ok = await upload(PNG);
    await expect(verifyLogo(ok.storage, { partnerId: PARTNER, key: ok.key, size: 99, originalName: 'a.png' }, ok.fetchImpl)).rejects.toMatchObject({ reason: 'file_missing' });
    ok.storage.objects.delete(ok.key);
    await expect(verifyLogo(ok.storage, { partnerId: PARTNER, key: ok.key, size: 100, originalName: 'a.png' }, ok.fetchImpl)).rejects.toMatchObject({ reason: 'file_missing' });
  });

  it('refuses a stored content type that differs from the extension', async () => {
    const { storage, key, fetchImpl } = await upload(PNG);
    storage.simulateUpload(key, 100, 'image/svg+xml', PNG);
    await expect(verifyLogo(storage, { partnerId: PARTNER, key, size: 100, originalName: 'a.png' }, fetchImpl)).rejects.toMatchObject({ reason: 'file_type_not_allowed' });
  });
});
