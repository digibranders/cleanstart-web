import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const verifyTurnstileToken = vi.fn();
const createHubspotDeal = vi.fn();
vi.mock('../lib/turnstile', () => ({ verifyTurnstileToken: (...a: unknown[]) => verifyTurnstileToken(...a) }));
vi.mock('../lib/deal-registrations/hubspot-deal', () => ({
  createHubspotDeal: (...a: unknown[]) => createHubspotDeal(...a),
}));

import { dealRegistrationApplyEndpoint, dealRegistrationApplyOptionsEndpoint } from './deal-registration-apply';

const ALLOWED = 'https://www.cleanstart.com';
let ipSeq = 0;
const nextIp = () => `10.0.0.${++ipSeq}`;

const validBody = {
  partnerName: 'Acme',
  partnerRep: { firstName: 'Jane', lastName: 'Doe', email: 'jane@acme.com' },
  prospect: { firstName: 'Sam', lastName: 'Lee', email: 'sam@prospect.com' },
  dealDetails: 'K8s',
  consent: { snapshot: 'I agree', givenAt: '2026-06-23T00:00:00Z', categories: ['storage'] },
  turnstileToken: 'tok',
  hp: '',
};

const makeReq = ({ origin = ALLOWED, body = validBody, createThrows = false }: {
  origin?: string | null; body?: unknown; createThrows?: boolean;
} = {}) => {
  const h = new Headers({ 'cf-connecting-ip': nextIp() });
  if (origin != null) h.set('origin', origin);
  return {
    headers: h,
    json: async () => body,
    payload: {
      create: createThrows ? vi.fn().mockRejectedValue(new Error('db')) : vi.fn().mockResolvedValue({ id: 5 }),
      findGlobal: vi.fn().mockResolvedValue({ policyVersion: 'v3' }),
      logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
    },
  } as never;
};

const runPost = (req: unknown): Promise<Response> =>
  (dealRegistrationApplyEndpoint.handler as (r: unknown) => Promise<Response>)(req);

beforeEach(() => {
  verifyTurnstileToken.mockResolvedValue({ ok: true });
  createHubspotDeal.mockResolvedValue({ status: 'synced', dealId: '900' });
});
afterEach(() => { vi.clearAllMocks(); });

describe('dealRegistrationApplyEndpoint', () => {
  it('OPTIONS preflight returns 204 for an allowed origin', async () => {
    const res = await (dealRegistrationApplyOptionsEndpoint.handler as (r: unknown) => Promise<Response>)(makeReq());
    expect([200, 204]).toContain(res.status);
  });
  it('sets Access-Control-Allow-Credentials on the preflight and the POST (web fetch uses credentials:include)', async () => {
    const preflight = await (
      dealRegistrationApplyOptionsEndpoint.handler as (r: unknown) => Promise<Response>
    )(makeReq());
    expect(preflight.headers.get('access-control-allow-credentials')).toBe('true');
    expect(preflight.headers.get('access-control-allow-origin')).toBe(ALLOWED);

    const post = await runPost(makeReq());
    expect(post.headers.get('access-control-allow-credentials')).toBe('true');
    expect(post.headers.get('access-control-allow-origin')).toBe(ALLOWED);
  });
  it('rejects a disallowed origin with 403', async () => {
    const res = await runPost(makeReq({ origin: 'https://evil.example' }));
    expect(res.status).toBe(403);
  });
  it('rejects an invalid body with 400', async () => {
    const res = await runPost(makeReq({ body: { partnerName: '' } }));
    expect(res.status).toBe(400);
  });
  it('honeypot tripped → 200, no HubSpot call', async () => {
    const res = await runPost(makeReq({ body: { ...validBody, hp: 'bot' } }));
    expect(res.status).toBe(200);
    expect(createHubspotDeal).not.toHaveBeenCalled();
  });
  it('turnstile failure → 403', async () => {
    verifyTurnstileToken.mockResolvedValue({ ok: false, reason: 'invalid' });
    const res = await runPost(makeReq());
    expect(res.status).toBe(403);
  });
  it('happy path → 200, persists row with hubspotSync synced, calls HubSpot', async () => {
    const req = makeReq();
    const res = await runPost(req);
    expect(res.status).toBe(200);
    expect(createHubspotDeal).toHaveBeenCalledOnce();
    const created = (req as { payload: { create: ReturnType<typeof vi.fn> } }).payload.create;
    const arg = created.mock.calls[0]?.[0];
    expect(arg.collection).toBe('deal-registrations');
    expect(arg.data.hubspotSync.status).toBe('synced');
    expect(arg.data.hubspotSync.dealId).toBe('900');
    expect(arg.data.privacyPolicyVersion).toBe('v3');
  });
  it('still 200 when HubSpot fails (row captured, status failed)', async () => {
    createHubspotDeal.mockResolvedValue({ status: 'failed', error: 'boom' });
    const req = makeReq();
    const res = await runPost(req);
    expect(res.status).toBe(200);
    const arg = (req as { payload: { create: ReturnType<typeof vi.fn> } }).payload.create.mock.calls[0]?.[0];
    expect(arg.data.hubspotSync.status).toBe('failed');
  });
  it('returns 502 when the collection write fails', async () => {
    const res = await runPost(makeReq({ createThrows: true }));
    expect(res.status).toBe(502);
  });
});
