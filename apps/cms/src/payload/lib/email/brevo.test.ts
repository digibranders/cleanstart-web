import { afterEach, describe, expect, it, vi } from 'vitest';

import { sendBrevoEmail } from './brevo';

const ORIGINAL = { ...process.env };
afterEach(() => {
  process.env = { ...ORIGINAL };
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('sendBrevoEmail', () => {
  it('skips when BREVO_API_KEY is unset', async () => {
    process.env.BREVO_API_KEY = undefined;
    const result = await sendBrevoEmail({
      to: [{ email: 'hr@cleanstart.com' }],
      subject: 'x',
      htmlContent: '<p>x</p>',
    });
    expect(result).toEqual({ status: 'skipped', reason: 'env-not-configured' });
  });

  it('posts to the Brevo endpoint and returns the messageId on 2xx', async () => {
    process.env.BREVO_API_KEY = 'key';
    process.env.BREVO_SENDER_EMAIL = 'no-reply@cleanstart.com';
    process.env.BREVO_SENDER_NAME = 'CleanStart';
    const fetchMock = vi.fn<typeof fetch>(
      async () => new Response(JSON.stringify({ messageId: 'mid-1' }), { status: 201 }),
    );
    vi.stubGlobal('fetch', fetchMock);

    const result = await sendBrevoEmail({
      to: [{ email: 'hr@cleanstart.com' }],
      replyTo: { email: 'a@b.com' },
      subject: 'New application',
      htmlContent: '<p>hi</p>',
      attachments: [{ name: 'cv.pdf', content: 'BASE64' }],
    });

    expect(result).toEqual({ status: 'synced', messageId: 'mid-1' });
    const call = fetchMock.mock.calls[0];
    expect(call).toBeDefined();
    const [url, init] = call as [RequestInfo | URL, RequestInit];
    expect(url).toBe('https://api.brevo.com/v3/smtp/email');
    const body = JSON.parse(init.body as string);
    expect(body.sender).toEqual({ email: 'no-reply@cleanstart.com', name: 'CleanStart' });
    expect(body.attachment).toEqual([{ name: 'cv.pdf', content: 'BASE64' }]);
    expect(init.headers).toMatchObject({ 'api-key': 'key' });
  });

  it('returns failed with redacted error on non-2xx', async () => {
    process.env.BREVO_API_KEY = 'key';
    process.env.BREVO_SENDER_EMAIL = 'no-reply@cleanstart.com';
    vi.stubGlobal('fetch', vi.fn(async () => new Response('boom', { status: 400 })));
    const result = await sendBrevoEmail({ to: [{ email: 'hr@cleanstart.com' }], subject: 's', htmlContent: '<p>x</p>' });
    expect(result.status).toBe('failed');
  });
});
