import { describe, expect, it, vi } from 'vitest';

import {
  CSV_EXPORT_HARD_CAP_PAGES,
  CSV_EXPORT_HARD_CAP_ROWS,
  CSV_EXPORT_PAGE_SIZE,
  exportLeadsCsvEndpoint,
} from './export-leads-csv';

const adminUser = { roles: ['admin'], collection: 'users', id: 1 };

const handler = exportLeadsCsvEndpoint.handler;
if (!handler) throw new Error('export endpoint handler undefined');

const buildPayload = (totalPages: number) => ({
  find: vi.fn().mockImplementation(({ page }: { page: number }) => {
    const docs = Array.from({ length: CSV_EXPORT_PAGE_SIZE }, (_, i) => ({
      id: (page - 1) * CSV_EXPORT_PAGE_SIZE + i + 1,
      createdAt: '2026-01-01T00:00:00.000Z',
      fields: { email: `${page}-${i}@example.com` },
      form: 1,
    }));
    return Promise.resolve({
      docs,
      hasNextPage: page < totalPages,
      page,
      totalPages,
    });
  }),
  create: vi.fn().mockResolvedValue({ id: 1 }),
  logger: { error: vi.fn() },
});

const callEndpoint = async (totalPages: number): Promise<Response> => {
  const payload = buildPayload(totalPages);
  const req = {
    headers: { get: () => null },
    user: adminUser,
    url: 'http://internal/api/leads/export-csv',
    payload,
  } as unknown as Parameters<typeof handler>[0];
  return (await handler(req)) as Response;
};

describe('GET /export-csv truncation signaling (W-D-14)', () => {
  it('omits truncation headers when result fits within the cap', async () => {
    const res = await callEndpoint(2);
    expect(res.status).toBe(200);
    expect(res.headers.get('x-leads-truncated')).toBeNull();
    expect(res.headers.get('x-leads-truncated-at')).toBeNull();
  });

  it('emits X-Leads-Truncated and X-Leads-Truncated-At when the cap is hit', async () => {
    const res = await callEndpoint(CSV_EXPORT_HARD_CAP_PAGES + 5);
    expect(res.status).toBe(200);
    expect(res.headers.get('x-leads-truncated')).toBe('true');
    expect(res.headers.get('x-leads-truncated-at')).toBe(String(CSV_EXPORT_HARD_CAP_ROWS));
  });

  it('rejects non-admin/editor with 403', async () => {
    const payload = buildPayload(1);
    const req = {
      headers: { get: () => null },
      user: { roles: ['author'], collection: 'users', id: 2 },
      url: 'http://internal/api/leads/export-csv',
      payload,
    } as unknown as Parameters<typeof handler>[0];
    const res = (await handler(req)) as Response;
    expect(res.status).toBe(403);
  });

  it('writes an audit-log entry on a successful export', async () => {
    const payload = buildPayload(1);
    const req = {
      headers: { get: () => null },
      user: adminUser,
      url: 'http://internal/api/leads/export-csv?formId=42',
      payload,
    } as unknown as Parameters<typeof handler>[0];
    await handler(req);
    expect(payload.create).toHaveBeenCalledTimes(1);
    const args = payload.create.mock.calls[0]?.[0] as {
      collection: string;
      data: { action: string; targetCollection: string; metadata: Record<string, unknown> };
    };
    expect(args.collection).toBe('audit-log');
    expect(args.data.action).toBe('lead_exported');
    expect(args.data.targetCollection).toBe('leads');
    expect(args.data.metadata.rowCount).toBe(CSV_EXPORT_PAGE_SIZE);
    expect(args.data.metadata.filter).toEqual({ formId: '42' });
  });

  it('emits the X-Leads-Date-Tz=UTC header so the admin UI can warn editors in non-UTC zones', async () => {
    const res = await callEndpoint(1);
    expect(res.headers.get('x-leads-date-tz')).toBe('UTC');
  });
});
