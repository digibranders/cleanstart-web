import type { ErrorEvent } from '@sentry/nextjs';
import { describe, expect, it } from 'vitest';
import { redact } from './log';
import { redactForSentry, safeBreadcrumbData, safeScrubEvent, scrubEvent } from './sentry-scrub';

describe('logger redaction covers key, signature, dsn and cookie family names', () => {
  it.each(['apiKey', 'api_key', 'x-api-key', 'X-Api-Key', 'accessKeyId', 'secretAccessKey', 'privateKey', 'sessionKey', 'x-hubspot-signature-v3', 'Signature', 'sentryDsn', 'DSN', 'Set-Cookie', 'cookies'])(
    'redacts %s',
    (key) => {
      expect(redact({ [key]: 'value' })).toEqual({ [key]: '[redacted]' });
    },
  );

  it.each(['key', 'objectKey', 'keyword', 'action', 'partnerId', 'subject'])('leaves %s readable, because the logs need it', (key) => {
    expect(redact({ [key]: 'value' })).toEqual({ [key]: 'value' });
  });
});

describe('redactForSentry', () => {
  it('matches key names case-insensitively, whatever the spelling', () => {
    expect(redactForSentry({ Email: 'a@b.c', EMAIL: 'a@b.c', Authorization: 'x', TokenHash: 'h', IP: '1.1.1.1', UserAgent: 'ua', ok: 1 })).toEqual({
      Email: '[redacted]',
      EMAIL: '[redacted]',
      Authorization: '[redacted]',
      TokenHash: '[redacted]',
      IP: '[redacted]',
      UserAgent: '[redacted]',
      ok: 1,
    });
  });

  it('applies the logger patterns too and walks arrays', () => {
    expect(redactForSentry({ list: [{ apiKey: 'k', fine: 2 }], signature: 's' })).toEqual({ list: [{ apiKey: '[redacted]', fine: 2 }], signature: '[redacted]' });
  });
});

describe('scrubEvent', () => {
  const event = (): ErrorEvent => ({
    type: undefined,
    request: {
      url: 'https://partners.example.com/accept-invite?token=SECRET',
      method: 'GET',
      headers: { Cookie: 'sid=SECRET', 'X-API-KEY': 'SECRET', authorization: 'Bearer SECRET', 'user-agent': 'ua', accept: 'text/html' },
      cookies: { sid: 'SECRET' },
      query_string: 'token=SECRET&next=%2Fpartner',
      data: { Password: 'SECRET', note: 'fine' },
    },
    extra: { Token: 'SECRET', subject: 'Hello' },
  });

  it('redacts request headers, cookies, query string, the query in the URL, body and extra', () => {
    const scrubbed = scrubEvent(event());
    expect(JSON.stringify(scrubbed)).not.toContain('SECRET');
    expect(scrubbed.request?.url).toBe('https://partners.example.com/accept-invite');
    expect(scrubbed.request?.headers).toMatchObject({ accept: 'text/html' });
    expect(scrubbed.request?.method).toBe('GET');
    expect(scrubbed.extra).toEqual({ Token: '[redacted]', subject: 'Hello' });
  });

  it('copes with an event that has no request', () => {
    expect(scrubEvent({ type: undefined, extra: { a: 1 } })).toEqual({ type: undefined, extra: { a: 1 } });
  });
});

describe('cyclic and very deep input', () => {
  const cyclic = (): Record<string, unknown> => {
    const a: Record<string, unknown> = { note: 'fine', password: 'SECRET' };
    a.self = a;
    a.list = [a, { again: a }];
    return a;
  };

  it('redactForSentry terminates on a cycle and still redacts', () => {
    const out = redactForSentry(cyclic());
    expect(JSON.stringify(out)).not.toContain('SECRET');
    expect(out.note).toBe('fine');
    expect(out.self).toBe('[circular]');
  });

  it('caps depth', () => {
    const nest = (levels: number): Record<string, unknown> => (levels === 0 ? { leaf: 1 } : { next: nest(levels - 1) });
    expect(JSON.stringify(redactForSentry(nest(50)))).toContain('[truncated]');
  });

  it('keeps a value that appears twice without being a cycle', () => {
    const shared = { a: 1 };
    expect(redactForSentry({ x: shared, y: shared })).toEqual({ x: { a: 1 }, y: { a: 1 } });
  });

  it('safeBreadcrumbData returns the redacted data, or a placeholder instead of throwing', () => {
    expect(JSON.stringify(safeBreadcrumbData(cyclic()))).not.toContain('SECRET');
    const hostile = new Proxy({}, { ownKeys: () => { throw new Error('boom'); } });
    expect(safeBreadcrumbData(hostile)).toEqual({ redacted: 'unreadable breadcrumb data' });
  });

  it('safeScrubEvent never throws: a hostile event becomes a redacted placeholder event', () => {
    const hostile = { type: undefined, extra: new Proxy({}, { ownKeys: () => { throw new Error('boom'); } }) } as unknown as ErrorEvent;
    const out = safeScrubEvent(hostile);
    expect(out).not.toBeNull();
    expect(out?.extra).toEqual({ redacted: 'event data could not be scrubbed' });
  });

  it('scrubs a cyclic request body', () => {
    const event: ErrorEvent = { type: undefined, request: { data: cyclic() } };
    expect(JSON.stringify(scrubEvent(event))).not.toContain('SECRET');
  });
});

describe('forwarding headers', () => {
  it('redacts the client address headers in a request', () => {
    const scrubbed = scrubEvent({
      type: undefined,
      request: { headers: { 'X-Forwarded-For': '203.0.113.9', 'x-portal-client-ip': '203.0.113.9', accept: 'text/html' } },
    });
    expect(scrubbed.request?.headers).toEqual({ 'X-Forwarded-For': '[redacted]', 'x-portal-client-ip': '[redacted]', accept: 'text/html' });
  });
});
