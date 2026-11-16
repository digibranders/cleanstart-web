import * as Sentry from '@sentry/nextjs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { FakeEmailTransport } from './fake';
import { sendEmail } from './send';

vi.mock('@sentry/nextjs', () => ({ captureException: vi.fn() }));

const message = { to: [{ email: 'person@example.com' }], subject: 'Hello', htmlContent: '<p>private body</p>' };

beforeEach(() => {
  vi.clearAllMocks();
  // If a shell ever exports Brevo keys, the process wide transport must still never reach the network.
  vi.stubGlobal('fetch', () => {
    throw new Error('no network in tests');
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('sendEmail', () => {
  it('sends through the transport it is given and reports nothing on success', async () => {
    const transport = new FakeEmailTransport();
    expect(await sendEmail(message, transport)).toEqual({ status: 'sent', messageId: 'fake-1' });
    expect(transport.sent).toEqual([message]);
    expect(Sentry.captureException).not.toHaveBeenCalled();
  });

  it('returns a failure, reports the subject to Sentry and never the body, and does not throw', async () => {
    const transport = new FakeEmailTransport();
    transport.failNext = 'Brevo 401: unauthorized: Key not found';
    const result = await sendEmail(message, transport);
    expect(result).toEqual({ status: 'failed', error: 'Brevo 401: unauthorized: Key not found' });
    expect(Sentry.captureException).toHaveBeenCalledTimes(1);
    const [error, context] = vi.mocked(Sentry.captureException).mock.calls[0] ?? [];
    expect((error as Error).message).toBe('email failed: Brevo 401: unauthorized: Key not found');
    expect(context).toEqual({ tags: { area: 'email' }, extra: { subject: 'Hello' } });
    expect(JSON.stringify(vi.mocked(Sentry.captureException).mock.calls)).not.toContain('private body');
  });

  it('sends a subject on one line with no control characters, cut to 200 characters', async () => {
    const transport = new FakeEmailTransport();
    await sendEmail({ ...message, subject: `Hi\u0000\r\nBcc: x ${'long '.repeat(100)}` }, transport);
    const sent = transport.sent[0]?.subject ?? '';
    expect(sent).not.toMatch(/\p{Cc}/u);
    expect(sent.startsWith('Hi Bcc: x long')).toBe(true);
    expect(sent.length).toBeLessThanOrEqual(200);
  });

  it('does not cut an emoji in half at the subject cap', async () => {
    const transport = new FakeEmailTransport();
    await sendEmail({ ...message, subject: `${'a'.repeat(196)}\u{1F600}${'b'.repeat(20)}` }, transport);
    // encodeURIComponent throws URIError on a lone surrogate.
    expect(() => encodeURIComponent(transport.sent[0]?.subject ?? '')).not.toThrow();
  });

  it('uses the process wide transport when none is given, which skips when Brevo is not configured', async () => {
    expect((await sendEmail(message)).status).toBe('skipped');
  });
});
