import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const deleteCareerApplicationsByEmail = vi.fn();
const deletePartnerApplicationsByEmail = vi.fn();
const hubspotGdprDeleteByEmail = vi.fn();

vi.mock('../lib/careers/dsar', () => ({
  deleteCareerApplicationsByEmail: (...a: unknown[]) => deleteCareerApplicationsByEmail(...a),
}));
vi.mock('../lib/partners/dsar', () => ({
  deletePartnerApplicationsByEmail: (...a: unknown[]) => deletePartnerApplicationsByEmail(...a),
}));
vi.mock('../lib/lead-handlers/hubspot', () => ({
  hubspotGdprDeleteByEmail: (...a: unknown[]) => hubspotGdprDeleteByEmail(...a),
}));

import { dsarDeleteEndpoint, dsarFindEndpoint } from './leads-dsar';

const admin = { id: 1, roles: ['admin'] };
const editor = { id: 2, roles: ['editor'] };

let ipCounter = 0;
const nextIp = (): string => `198.51.100.${++ipCounter}`;

const leadDoc = (id: number, email: string) => ({
  id,
  createdAt: '2026-06-01T00:00:00Z',
  form: 9,
  fields: { email },
});

const makeReq = ({
  user = admin,
  leads = [],
  url,
  body,
  jsonThrows = false,
}: {
  user?: unknown;
  leads?: unknown[];
  url?: string;
  body?: unknown;
  jsonThrows?: boolean;
}) => ({
  user,
  url: url ?? 'http://localhost/api/leads/dsar',
  headers: new Headers({ 'cf-connecting-ip': nextIp() }),
  json: jsonThrows ? async () => { throw new Error('bad'); } : async () => body,
  payload: {
    find: vi.fn().mockResolvedValue({ docs: leads, hasNextPage: false }),
    create: vi.fn().mockResolvedValue({ id: 'audit-1' }),
    delete: vi.fn().mockResolvedValue({ id: 1 }),
    logger: { warn: vi.fn() },
  },
});

const runFind = (req: unknown): Promise<Response> =>
  (dsarFindEndpoint.handler as (r: unknown) => Promise<Response>)(req);
const runDelete = (req: unknown): Promise<Response> =>
  (dsarDeleteEndpoint.handler as (r: unknown) => Promise<Response>)(req);

beforeEach(() => {
  deleteCareerApplicationsByEmail.mockResolvedValue({ deleted: 0 });
  deletePartnerApplicationsByEmail.mockResolvedValue({ deleted: 0 });
  hubspotGdprDeleteByEmail.mockResolvedValue(true);
});

afterEach(() => {
  vi.clearAllMocks();
});

describe('dsarFindEndpoint', () => {
  it('forbids non-admins', async () => {
    const res = await runFind(makeReq({ user: editor }));
    expect(res.status).toBe(403);
  });

  it('rejects a missing/invalid email param with 400', async () => {
    const res = await runFind(makeReq({ url: 'http://localhost/api/leads/dsar/find' }));
    expect(res.status).toBe(400);
  });

  it('returns matching leads and writes a dsar_export audit row', async () => {
    const req = makeReq({
      url: 'http://localhost/api/leads/dsar/find?email=Dana@Example.com',
      leads: [leadDoc(11, 'dana@example.com'), leadDoc(12, 'someone@else.com')],
    });
    const res = await runFind(req);
    expect(res.status).toBe(200);
    const out = await res.json();
    expect(out).toMatchObject({ ok: true, count: 1 });
    expect(out.matches[0]).toMatchObject({ id: 11, formId: 9 });
    expect(req.payload.create).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'audit-log',
        data: expect.objectContaining({ action: 'dsar_export' }),
      }),
    );
  });
});

describe('dsarDeleteEndpoint', () => {
  it('forbids non-admins', async () => {
    const res = await runDelete(makeReq({ user: editor, body: { email: 'x@y.com' } }));
    expect(res.status).toBe(403);
  });

  it('rejects invalid JSON and invalid bodies with 400', async () => {
    expect((await runDelete(makeReq({ jsonThrows: true }))).status).toBe(400);
    expect((await runDelete(makeReq({ body: { email: 'not-an-email' } }))).status).toBe(400);
  });

  it('deletes matching leads, cascades, and reports counts', async () => {
    deleteCareerApplicationsByEmail.mockResolvedValue({ deleted: 2 });
    deletePartnerApplicationsByEmail.mockResolvedValue({ deleted: 1 });
    const req = makeReq({
      body: { email: 'dana@example.com' },
      leads: [leadDoc(11, 'dana@example.com'), leadDoc(12, 'dana@example.com')],
    });
    const res = await runDelete(req);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      ok: true,
      deleted: 2,
      hubspotDeleted: true,
      careerApplicationsDeleted: 2,
      partnerApplicationsDeleted: 1,
    });
    expect(req.payload.delete).toHaveBeenCalledTimes(2);
    expect(hubspotGdprDeleteByEmail).toHaveBeenCalledWith(req.payload, 'dana@example.com');
  });

  it('fail-soft: completes local deletion even when HubSpot erasure throws', async () => {
    hubspotGdprDeleteByEmail.mockRejectedValue(new Error('hubspot down'));
    const req = makeReq({
      body: { email: 'dana@example.com' },
      leads: [leadDoc(11, 'dana@example.com')],
    });
    const res = await runDelete(req);
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ ok: true, deleted: 1, hubspotDeleted: false });
    expect(req.payload.delete).toHaveBeenCalledTimes(1);
    expect(req.payload.logger.warn).toHaveBeenCalled();
  });
});
