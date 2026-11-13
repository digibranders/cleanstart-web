import { describe, expect, it } from 'vitest';
import { fail, ok } from '@/server/actions/result';
import type { UploadTicketDto } from '@/lib/document-upload';
import { putFile, uploadFile } from './upload-client';

class FakeXhr {
  upload: { onprogress: ((event: { lengthComputable: boolean; loaded: number; total: number }) => void) | null } = { onprogress: null };
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  onabort: (() => void) | null = null;
  status = 200;
  method = '';
  url = '';
  headers: Record<string, string> = {};
  body: unknown = null;
  constructor(private readonly behaviour: 'ok' | 'http-error' | 'network-error' = 'ok') {}
  open(method: string, url: string): void {
    this.method = method;
    this.url = url;
  }
  setRequestHeader(name: string, value: string): void {
    this.headers[name] = value;
  }
  send(body: unknown): void {
    this.body = body;
    queueMicrotask(() => {
      if (this.behaviour === 'network-error') return this.onerror?.();
      this.upload.onprogress?.({ lengthComputable: true, loaded: 50, total: 100 });
      this.upload.onprogress?.({ lengthComputable: true, loaded: 100, total: 100 });
      if (this.behaviour === 'http-error') this.status = 403;
      this.onload?.();
    });
  }
}

const asXhr = (fake: FakeXhr) => (() => fake as unknown as XMLHttpRequest);
const ticket: UploadTicketDto = {
  key: 'documents/d/v1/u-a.pdf',
  url: 'https://r2.test/put',
  headers: { 'Content-Type': 'application/pdf' },
  expiresAt: '2026-11-06T14:12:00.000Z',
  originalName: 'a.pdf',
  size: 3,
};
const file = new File([new Uint8Array([1, 2, 3])], 'a.pdf', { type: 'application/pdf' });

describe('putFile', () => {
  it('PUTs the file with exactly the ticket headers and reports progress', async () => {
    const xhr = new FakeXhr();
    const seen: number[] = [];
    await putFile(ticket, file, (percent) => seen.push(percent), asXhr(xhr));
    expect(xhr).toMatchObject({ method: 'PUT', url: 'https://r2.test/put', headers: { 'Content-Type': 'application/pdf' }, body: file });
    expect(seen).toEqual([50, 100]);
  });
  it('rejects with a readable message on an HTTP error and on a network error', async () => {
    await expect(putFile(ticket, file, () => undefined, asXhr(new FakeXhr('http-error')))).rejects.toThrow('Upload failed (403).');
    await expect(putFile(ticket, file, () => undefined, asXhr(new FakeXhr('network-error')))).rejects.toThrow('The upload was interrupted');
  });
});

describe('uploadFile', () => {
  it('returns the key and file facts after a ticket and a PUT', async () => {
    const result = await uploadFile({ file, requestTicket: async () => ok(ticket), onProgress: () => undefined, makeXhr: asXhr(new FakeXhr()) });
    expect(result).toEqual(ok({ key: ticket.key, size: 3, originalName: 'a.pdf' }));
  });
  it('passes a ticket failure through without touching the network', async () => {
    const xhr = new FakeXhr();
    const failure = fail({ code: 'validation', message: 'Upload a PDF, PPTX, DOCX, XLSX, MP4 or ZIP file.' });
    const result = await uploadFile({ file, requestTicket: async () => failure, onProgress: () => undefined, makeXhr: asXhr(xhr) });
    expect(result).toEqual(failure);
    expect(xhr.method).toBe('');
  });
  it('turns a failed PUT into an integration failure', async () => {
    const result = await uploadFile({ file, requestTicket: async () => ok(ticket), onProgress: () => undefined, makeXhr: asXhr(new FakeXhr('http-error')) });
    expect(result).toEqual(fail({ code: 'integration', message: 'Upload failed (403).' }));
  });
});
