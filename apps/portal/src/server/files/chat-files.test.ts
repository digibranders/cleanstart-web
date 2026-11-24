import { describe, expect, it } from 'vitest';
import { ConflictError, ValidationError } from '@/server/errors';
import { FakeFileStorage, fakeRangeFetch } from './fake';
import { assertChatFileAllowed, chatFileKey, chatMagicOk, parseChatKey, verifyChatUpload } from './chat-files';

const CONVERSATION = '3f1c3f0e-6b5a-4b2e-9c52-0a9f2c8e1d11';

describe('chat file keys', () => {
  it('lives under chat/<conversation>/ and keeps only a sanitised name', () => {
    const key = chatFileKey({ conversationId: CONVERSATION, name: '../../Q4 Report (final).PDF' });
    expect(key.startsWith(`chat/${CONVERSATION}/`)).toBe(true);
    expect(key).not.toContain('..');
    expect(key.endsWith('.pdf')).toBe(true);
    expect(parseChatKey(key)).toEqual({ conversationId: CONVERSATION });
  });
  it('refuses any other key shape', () => {
    expect(parseChatKey('documents/abc/v1/x.pdf')).toBeNull();
    expect(parseChatKey(`chat/${CONVERSATION}/x.pdf`)).toBeNull();
  });
});

describe('assertChatFileAllowed', () => {
  it('returns the content type the server chose', () => expect(assertChatFileAllowed({ name: 'a.PNG', size: 5 })).toBe('image/png'));
  it('refuses scripts, svg, empty and oversize files', () => {
    for (const name of ['a.exe', 'a.sh', 'a.svg', 'a.html', 'noext']) expect(() => assertChatFileAllowed({ name, size: 5 }), name).toThrow(ValidationError);
    expect(() => assertChatFileAllowed({ name: 'a.pdf', size: 0 })).toThrow(ValidationError);
    expect(() => assertChatFileAllowed({ name: 'a.pdf', size: 26 * 1024 * 1024 })).toThrow(ValidationError);
  });
});

describe('chatMagicOk', () => {
  it('checks the signature of the types that have one', () => {
    expect(chatMagicOk('png', [0x89, 0x50, 0x4e, 0x47])).toBe(true);
    expect(chatMagicOk('png', [0x25, 0x50, 0x44, 0x46, 0x2d])).toBe(false);
    expect(chatMagicOk('pdf', [0x25, 0x50, 0x44, 0x46, 0x2d])).toBe(true);
    expect(chatMagicOk('docx', [0x50, 0x4b, 0x03, 0x04])).toBe(true);
    expect(chatMagicOk('webp', [0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50])).toBe(true);
    expect(chatMagicOk('mp4', [0, 0, 0, 0x20, 0x66, 0x74, 0x79, 0x70])).toBe(true);
  });
  it('accepts plain text types by extension and refuses an unknown extension', () => {
    expect(chatMagicOk('txt', [0x68, 0x69])).toBe(true);
    expect(chatMagicOk('exe', [0x4d, 0x5a])).toBe(false);
  });
});

describe('verifyChatUpload', () => {
  const key = chatFileKey({ conversationId: CONVERSATION, name: 'a.pdf' });
  const pdf = [0x25, 0x50, 0x44, 0x46, 0x2d, 0x31];
  const verify = (storage: FakeFileStorage, size: number): Promise<void> =>
    verifyChatUpload(storage, { key, size, mime: 'application/pdf', name: 'a.pdf' }, fakeRangeFetch(storage));

  it('passes a stored file whose size, type and first bytes match', async () => {
    const storage = new FakeFileStorage();
    storage.simulateUpload(key, pdf.length, 'application/pdf', pdf);
    await expect(verify(storage, pdf.length)).resolves.toBeUndefined();
  });

  it('refuses a missing object, a wrong size, a wrong type and a disguised file', async () => {
    const storage = new FakeFileStorage();
    await expect(verify(storage, 6)).rejects.toBeInstanceOf(ConflictError);
    storage.simulateUpload(key, pdf.length, 'application/pdf', pdf);
    await expect(verify(storage, 99)).rejects.toBeInstanceOf(ConflictError);
    storage.simulateUpload(key, pdf.length, 'text/html', pdf);
    await expect(verify(storage, pdf.length)).rejects.toBeInstanceOf(ConflictError);
    storage.simulateUpload(key, 6, 'application/pdf', [0x4d, 0x5a, 0x90, 0, 0, 0]);
    await expect(verify(storage, 6)).rejects.toBeInstanceOf(ConflictError);
  });
});
