import { afterEach, describe, expect, it, vi } from 'vitest';
import { createBrevoTransport } from './brevo';
import { PORTAL_SENDER_NAME } from './transport';

const message = {
  to: [{ email: 'person@example.com', name: 'Person' }],
  subject: 'Hello',
  htmlContent: '<p>Hi</p>',
};

const transportWith = (fetchMock: typeof fetch) =>
  createBrevoTransport({ apiKey: 'key-1', senderEmail: 'partners@cleanstart.example', senderName: PORTAL_SENDER_NAME, fetch: fetchMock });

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('createBrevoTransport', () => {
  it('posts subject and htmlContent to the Brevo endpoint and returns the message id', async () => {
    const fetchMock = vi.fn<typeof fetch>(async () => new Response(JSON.stringify({ messageId: '<abc@brevo>' }), { status: 201 }));
    const result = await transportWith(fetchMock).send({ ...message, replyTo: { email: 'aditi@kestrel.example', name: 'Aditi' } });
    expect(result).toEqual({ status: 'sent', messageId: '<abc@brevo>' });

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://api.brevo.com/v3/smtp/email');
    expect(init.method).toBe('POST');
    expect(init.headers).toMatchObject({ 'api-key': 'key-1', 'content-type': 'application/json' });
    expect(JSON.parse(init.body as string)).toEqual({
      sender: { email: 'partners@cleanstart.example', name: 'CleanStart Partners' },
      to: [{ email: 'person@example.com', name: 'Person' }],
      replyTo: { email: 'aditi@kestrel.example', name: 'Aditi' },
      subject: 'Hello',
      htmlContent: '<p>Hi</p>',
    });
  });

  it('pins the sender name in code, whatever the environment says', async () => {
    vi.stubEnv('BREVO_SENDER_NAME', 'CleanStart Careers');
    const fetchMock = vi.fn<typeof fetch>(async () => new Response('{}', { status: 201 }));
    await transportWith(fetchMock).send(message);
    const body = JSON.parse((fetchMock.mock.calls[0]?.[1] as RequestInit).body as string);
    expect(body.sender.name).toBe('CleanStart Partners');
  });

  it('lets one message set its own sender name', async () => {
    const fetchMock = vi.fn<typeof fetch>(async () => new Response('{}', { status: 201 }));
    await transportWith(fetchMock).send({ ...message, senderName: 'CleanStart Partnerships' });
    const body = JSON.parse((fetchMock.mock.calls[0]?.[1] as RequestInit).body as string);
    expect(body.sender.name).toBe('CleanStart Partnerships');
  });

  it('has a null message id when Brevo sends none', async () => {
    const result = await transportWith(vi.fn<typeof fetch>(async () => new Response('{}', { status: 201 }))).send(message);
    expect(result).toEqual({ status: 'sent', messageId: null });
  });

  it('returns Brevo error code and message on a 4xx, without throwing', async () => {
    const fetchMock = vi.fn<typeof fetch>(
      async () => new Response(JSON.stringify({ code: 'unauthorized', message: 'Key not found' }), { status: 401 }),
    );
    expect(await transportWith(fetchMock).send(message)).toEqual({ status: 'failed', error: 'Brevo 401: unauthorized: Key not found' });
  });

  it('flattens and shortens a body that is not JSON', async () => {
    const fetchMock = vi.fn<typeof fetch>(async () => new Response(`<html>\n${'x'.repeat(500)}\n</html>`, { status: 502 }));
    const result = await transportWith(fetchMock).send(message);
    expect(result.status).toBe('failed');
    if (result.status === 'failed') {
      expect(result.error.startsWith('Brevo 502: <html> xxx')).toBe(true);
      expect(result.error.length).toBeLessThanOrEqual(200);
      expect(result.error).not.toContain('\n');
    }
  });

  it('returns a failure for a network error and for a timeout', async () => {
    const network = vi.fn<typeof fetch>(async () => {
      throw new Error('connect ECONNREFUSED');
    });
    expect(await transportWith(network).send(message)).toEqual({ status: 'failed', error: 'network: connect ECONNREFUSED' });
    const timeout = vi.fn<typeof fetch>(async () => {
      throw new DOMException('The operation was aborted due to timeout', 'TimeoutError');
    });
    expect(await transportWith(timeout).send(message)).toEqual({ status: 'failed', error: 'timeout' });
  });
});
