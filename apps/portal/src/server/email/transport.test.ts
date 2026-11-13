import { afterEach, describe, expect, it, vi } from 'vitest';

const logged = vi.hoisted(() => ({ calls: [] as Array<[Record<string, unknown>, string]> }));
vi.mock('@/server/log', () => ({
  log: {
    debug: () => undefined,
    warn: () => undefined,
    error: () => undefined,
    info: (fields: Record<string, unknown>, message: string) => {
      logged.calls.push([fields, message]);
    },
  },
}));

import { createEmailTransport, PORTAL_SENDER_NAME } from './transport';

const message = {
  to: [{ email: 'person@example.com' }],
  subject: 'Set your password',
  htmlContent: '<p>secret body text</p><a href="https://partners.example.com/accept-invite?token=abc&amp;x=1">Accept</a>',
};

afterEach(() => {
  logged.calls.length = 0;
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe('PORTAL_SENDER_NAME', () => {
  it('is fixed', () => {
    expect(PORTAL_SENDER_NAME).toBe('CleanStart Partners');
  });
});

describe('createEmailTransport', () => {
  it('skips, and logs the subject and the links but never the body, when Brevo is not configured in development', async () => {
    vi.stubEnv('NODE_ENV', 'development');
    const result = await createEmailTransport({ apiKey: undefined, senderEmail: undefined }).send(message);
    expect(result).toEqual({ status: 'skipped', reason: 'brevo-not-configured' });
    expect(logged.calls).toHaveLength(1);
    const [fields] = logged.calls[0] ?? [{}];
    expect(fields).toEqual({ subject: 'Set your password', recipients: 1, links: ['https://partners.example.com/accept-invite?token=abc&x=1'] });
    expect(JSON.stringify(logged.calls)).not.toContain('secret body text');
  });

  it.each(['production', 'test', 'staging'])('does not log links when NODE_ENV is %s', async (env) => {
    vi.stubEnv('NODE_ENV', env);
    await createEmailTransport({ apiKey: undefined, senderEmail: undefined }).send(message);
    expect(logged.calls[0]?.[0]).toEqual({ subject: 'Set your password', recipients: 1 });
  });

  it('needs both the key and the sender address to use Brevo', async () => {
    const onlyKey = await createEmailTransport({ apiKey: 'key', senderEmail: undefined }).send(message);
    expect(onlyKey.status).toBe('skipped');
  });

  it('sends through Brevo as CleanStart Partners when both are set', async () => {
    const fetchMock = vi.fn<typeof fetch>(async () => new Response(JSON.stringify({ messageId: 'm1' }), { status: 201 }));
    vi.stubGlobal('fetch', fetchMock);
    const result = await createEmailTransport({ apiKey: 'key', senderEmail: 'partners@cleanstart.example' }).send(message);
    expect(result).toEqual({ status: 'sent', messageId: 'm1' });
    const body = JSON.parse((fetchMock.mock.calls[0]?.[1] as RequestInit).body as string);
    expect(body.sender).toEqual({ email: 'partners@cleanstart.example', name: 'CleanStart Partners' });
  });
});
