import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const verifyTurnstileToken = vi.fn();
const sendBrevoEmail = vi.fn();

vi.mock('../lib/turnstile', () => ({
  verifyTurnstileToken: (...a: unknown[]) => verifyTurnstileToken(...a),
}));
vi.mock('../lib/email/brevo', () => ({
  sendBrevoEmail: (...a: unknown[]) => sendBrevoEmail(...a),
}));

import {
  PARTNER_SUBMIT_MAX_BYTES,
  partnerApplyEndpoint,
  partnerApplyOptionsEndpoint,
} from './partner-apply';

const ALLOWED = 'https://cleanstart.com';

let ipCounter = 0;
const nextIp = (): string => `192.0.2.${++ipCounter}`;

const validBody = {
  firstName: 'Dana',
  lastName: 'Lee',
  email: 'dana@example.com',
  company: 'Acme',
  partnerReason: 'integration',
  turnstileToken: 'tok',
};

const makeReq = ({
  origin = ALLOWED,
  headers = {},
  body = validBody,
  jsonThrows = false,
  createThrows = false,
}: {
  origin?: string | null;
  headers?: Record<string, string>;
  body?: unknown;
  jsonThrows?: boolean;
  createThrows?: boolean;
}) => {
  const h = new Headers({ 'cf-connecting-ip': nextIp(), ...headers });
  if (origin != null) h.set('origin', origin);
  return {
    headers: h,
    json: jsonThrows ? async () => { throw new Error('bad'); } : async () => body,
    payload: {
      create: createThrows
        ? vi.fn().mockRejectedValue(new Error('db'))
        : vi.fn().mockResolvedValue({ id: 'pa-1' }),
      findGlobal: vi.fn().mockResolvedValue({ policyVersion: 'v3' }),
      logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
    },
  };
};

const runPost = (req: unknown): Promise<Response> =>
  (partnerApplyEndpoint.handler as (r: unknown) => Promise<Response>)(req);
const runOptions = (req: unknown): Promise<Response> =>
  (partnerApplyOptionsEndpoint.handler as (r: unknown) => Promise<Response>)(req);

beforeEach(() => {
  verifyTurnstileToken.mockResolvedValue({ ok: true });
  sendBrevoEmail.mockResolvedValue({ status: 'sent', messageId: 'm-1' });
});

afterEach(() => {
  vi.clearAllMocks();
});

describe('partnerApplyOptionsEndpoint (CORS preflight)', () => {
  it('204s for an allowed origin', async () => {
    const res = await runOptions(makeReq({}));
    expect(res.status).toBe(204);
    expect(res.headers.get('access-control-allow-origin')).toBe(ALLOWED);
  });

  it('403s for a disallowed origin', async () => {
    const res = await runOptions(makeReq({ origin: 'https://evil.example' }));
    expect(res.status).toBe(403);
  });
});

describe('partnerApplyEndpoint', () => {
  it('rejects a disallowed origin with 403', async () => {
    const res = await runPost(makeReq({ origin: 'https://evil.example' }));
    expect(res.status).toBe(403);
  });

  it('rejects an over-limit content-length with 413', async () => {
    const res = await runPost(
      makeReq({ headers: { 'content-length': String(PARTNER_SUBMIT_MAX_BYTES + 1) } }),
    );
    expect(res.status).toBe(413);
  });

  it('rejects invalid JSON with 400', async () => {
    const res = await runPost(makeReq({ jsonThrows: true }));
    expect(res.status).toBe(400);
  });

  it('rejects a schema-invalid body with 400', async () => {
    const res = await runPost(makeReq({ body: { firstName: 'x' } }));
    expect(res.status).toBe(400);
    expect(await res.json()).toMatchObject({ error: 'invalid_body' });
  });

  it('honeypot: silent 200, persists a flagged row, sends no email', async () => {
    const req = makeReq({ body: { ...validBody, hp: 'i-am-a-bot' } });
    const res = await runPost(req);
    expect(res.status).toBe(200);
    expect(sendBrevoEmail).not.toHaveBeenCalled();
    expect(req.payload.create).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'partner-applications',
        data: expect.objectContaining({ turnstilePassed: false, honeypot: 'i-am-a-bot' }),
      }),
    );
  });

  it('rejects a failed Turnstile challenge with 403', async () => {
    verifyTurnstileToken.mockResolvedValue({ ok: false, reason: 'invalid-input' });
    const res = await runPost(makeReq({}));
    expect(res.status).toBe(403);
    expect(await res.json()).toMatchObject({ error: 'turnstile_failed' });
  });

  it('happy path: sends applicant + admin emails and persists the row', async () => {
    process.env.PARTNERS_NOTIFY_EMAIL = 'partners@cleanstart.com';
    const req = makeReq({});
    const res = await runPost(req);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
    expect(sendBrevoEmail).toHaveBeenCalledTimes(2); // admin + applicant
    expect(req.payload.create).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'partner-applications',
        data: expect.objectContaining({ turnstilePassed: true, email: 'dana@example.com' }),
      }),
    );
    process.env.PARTNERS_NOTIFY_EMAIL = '';
  });

  it('returns 502 when the application row cannot be persisted', async () => {
    const res = await runPost(makeReq({ createThrows: true }));
    expect(res.status).toBe(502);
    expect(await res.json()).toMatchObject({ error: 'capture_failed' });
  });
});
