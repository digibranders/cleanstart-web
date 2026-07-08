import { describe, expect, it, vi } from 'vitest';

const buildJsonLdBlobs = vi.fn();
const buildJsonLdContext = vi.fn();
vi.mock('../jsonld', () => ({
  buildJsonLdBlobs: (...args: unknown[]) => buildJsonLdBlobs(...args),
  buildJsonLdContext: (...args: unknown[]) => buildJsonLdContext(...args),
}));

import { buildExportEndpoint, EXPORT_HARD_CAP_PAGES, EXPORT_HARD_CAP_ROWS } from './build-export-endpoint';

const makeReq = (overrides: Partial<{
  url: string;
  user: { id: number; roles?: string[] } | null;
  docs: Record<string, unknown>[];
  find: ReturnType<typeof vi.fn>;
  findGlobal: ReturnType<typeof vi.fn>;
}>) => {
  const docs = overrides.docs ?? [];
  return {
    url: overrides.url ?? 'http://internal/api/blogs/export?fields=title,slug',
    user: overrides.user === undefined ? { id: 1, roles: ['admin'] } : overrides.user,
    payload: {
      find: overrides.find ?? vi.fn().mockResolvedValue({ docs, hasNextPage: false }),
      findGlobal:
        overrides.findGlobal ??
        vi
          .fn()
          .mockResolvedValueOnce({ siteName: 'CleanStart', baseUrl: 'https://cleanstart.com', defaultLocale: 'en-US' })
          .mockResolvedValueOnce({ organizationJsonLd: {}, newsMediaOrganization: {} }),
      logger: { error: vi.fn() },
      collections: {
        blogs: { config: { admin: { useAsTitle: 'title' } } },
        leads: { config: { admin: { useAsTitle: 'title' } } },
      },
    },
  } as unknown as Parameters<ReturnType<typeof buildExportEndpoint>['handler']>[0];
};

describe('buildExportEndpoint', () => {
  it('registers at the single-segment /export path', () => {
    const endpoint = buildExportEndpoint('blogs', { dateField: 'publishedAt' });
    expect(endpoint.path).toBe('/export');
    expect(endpoint.method).toBe('get');
  });

  it('returns 403 when the requester has no admin/editor role', async () => {
    const endpoint = buildExportEndpoint('blogs', { dateField: 'publishedAt' });
    const res = await endpoint.handler(makeReq({ user: { id: 2, roles: ['viewer'] } }));
    expect(res.status).toBe(403);
  });

  it('returns 400 when fields is missing', async () => {
    const endpoint = buildExportEndpoint('blogs', { dateField: 'publishedAt' });
    const res = await endpoint.handler(
      makeReq({ url: 'http://internal/api/blogs/export' }),
    );
    expect(res.status).toBe(400);
  });

  it('returns 400 when from is after to', async () => {
    const endpoint = buildExportEndpoint('blogs', { dateField: 'publishedAt' });
    const res = await endpoint.handler(
      makeReq({
        url: 'http://internal/api/blogs/export?fields=title&from=2026-07-05&to=2026-07-01',
      }),
    );
    expect(res.status).toBe(400);
  });

  it('drops a denylisted field even when explicitly requested', async () => {
    const endpoint = buildExportEndpoint('leads', { dateField: 'createdAt' });
    const req = makeReq({
      url: 'http://internal/api/leads/export?fields=title,ip,userAgent',
      docs: [{ id: 1, title: 'x' }],
    });
    const res = await endpoint.handler(req);
    const text = await res.text();
    expect(text).toContain('title');
    expect(text).not.toContain('ip');
    expect(text).not.toContain('userAgent');
  });

  it('merges the date range into the where clause passed to payload.find', async () => {
    const endpoint = buildExportEndpoint('blogs', { dateField: 'publishedAt' });
    const req = makeReq({
      url: 'http://internal/api/blogs/export?fields=title&from=2026-07-01&to=2026-07-05',
    });
    await endpoint.handler(req);
    const findCall = (req.payload.find as ReturnType<typeof vi.fn>).mock.calls[0]?.[0];
    expect(findCall.where).toEqual({
      and: [
        {},
        {
          and: [
            { publishedAt: { greater_than_equal: '2026-07-01' } },
            { publishedAt: { less_than: '2026-07-06T00:00:00.000Z' } },
          ],
        },
      ],
    });
  });

  it('passes a time-aware ISO "to" value through unchanged (no next-day boundary shift)', async () => {
    const endpoint = buildExportEndpoint('blogs', { dateField: 'publishedAt' });
    const req = makeReq({
      url: 'http://internal/api/blogs/export?fields=title&from=2026-07-01&to=2026-07-05T18:30:00.000Z',
    });
    await endpoint.handler(req);
    const findCall = (req.payload.find as ReturnType<typeof vi.fn>).mock.calls[0]?.[0];
    expect(findCall.where).toEqual({
      and: [
        {},
        {
          and: [
            { publishedAt: { greater_than_equal: '2026-07-01' } },
            { publishedAt: { less_than_equal: '2026-07-05T18:30:00.000Z' } },
          ],
        },
      ],
    });
  });

  it('serializes rows as CSV by default', async () => {
    const endpoint = buildExportEndpoint('blogs', { dateField: 'publishedAt' });
    const req = makeReq({
      url: 'http://internal/api/blogs/export?fields=title',
      docs: [{ id: 1, title: 'Hello' }],
    });
    const res = await endpoint.handler(req);
    expect(res.headers.get('content-type')).toContain('text/csv');
    const text = await res.text();
    expect(text).toContain('title');
    expect(text).toContain('Hello');
  });

  it('merges the search term into an or/like where clause passed to payload.find', async () => {
    const endpoint = buildExportEndpoint('blogs', { dateField: 'publishedAt' });
    const req = makeReq({
      url: 'http://internal/api/blogs/export?fields=title&search=kubernetes',
    });
    await endpoint.handler(req);
    const findCall = (req.payload.find as ReturnType<typeof vi.fn>).mock.calls[0]?.[0];
    expect(findCall.where).toEqual({
      or: [{ title: { like: 'kubernetes' } }],
    });
  });

  it('serializes rows as XLSX when format=xlsx', async () => {
    const endpoint = buildExportEndpoint('blogs', { dateField: 'publishedAt' });
    const req = makeReq({
      url: 'http://internal/api/blogs/export?fields=title&format=xlsx',
      docs: [{ id: 1, title: 'Hello' }],
    });
    const res = await endpoint.handler(req);
    expect(res.headers.get('content-type')).toContain('spreadsheetml');
  });

  it('stops paginating at the hard cap and appends a truncation row when hasNextPage never turns false', async () => {
    const endpoint = buildExportEndpoint('blogs', { dateField: 'publishedAt' });
    const find = vi.fn().mockResolvedValue({ docs: [{ id: 1, title: 'Hello' }], hasNextPage: true });
    const req = makeReq({
      url: 'http://internal/api/blogs/export?fields=title',
      find,
    });
    const res = await endpoint.handler(req);
    expect(find).toHaveBeenCalledTimes(EXPORT_HARD_CAP_PAGES);
    const text = await res.text();
    expect(text).toContain(`truncated at ${EXPORT_HARD_CAP_ROWS} rows`);
  });

  it('reads a requested seoTitle from doc.seo.title, not the (nonexistent) flat doc.seoTitle', async () => {
    const endpoint = buildExportEndpoint('blogs', { dateField: 'publishedAt' });
    const req = makeReq({
      url: 'http://internal/api/blogs/export?fields=seoTitle',
      docs: [{ id: 1, seoTitle: 'WRONG-FLAT-VALUE', seo: { title: 'Real SEO Title' } }],
    });
    const res = await endpoint.handler(req);
    const text = await res.text();
    expect(text).toContain('Real SEO Title');
    expect(text).not.toContain('WRONG-FLAT-VALUE');
  });

  it('uses depth: 1 when __schemaTypes is not requested', async () => {
    const endpoint = buildExportEndpoint('blogs', { dateField: 'publishedAt' });
    const req = makeReq({ url: 'http://internal/api/blogs/export?fields=title' });
    await endpoint.handler(req);
    const findCall = (req.payload.find as ReturnType<typeof vi.fn>).mock.calls[0]?.[0];
    expect(findCall.depth).toBe(1);
  });

  it('uses depth: 2 and computes the Schema Types cell when __schemaTypes is requested', async () => {
    buildJsonLdContext.mockReturnValue({ site: {}, organization: {}, newsOrganization: {}, organizationId: 'x' });
    buildJsonLdBlobs.mockReturnValue([
      { '@context': 'https://schema.org', '@type': 'Article' },
      { '@context': 'https://schema.org', '@type': 'BreadcrumbList' },
    ]);
    const endpoint = buildExportEndpoint('blogs', { dateField: 'publishedAt' });
    const req = makeReq({
      url: 'http://internal/api/blogs/export?fields=title,__schemaTypes',
      docs: [{ id: 1, title: 'Hello' }],
    });
    const res = await endpoint.handler(req);
    const findCall = (req.payload.find as ReturnType<typeof vi.fn>).mock.calls[0]?.[0];
    expect(findCall.depth).toBe(2);
    const text = await res.text();
    expect(text).toContain('Article, BreadcrumbList');
  });

  it('leaves the Schema Types cell blank for a non-emittable collection', async () => {
    buildJsonLdContext.mockReturnValue({ site: {}, organization: {}, newsOrganization: {}, organizationId: 'x' });
    buildJsonLdBlobs.mockReturnValue([]);
    const endpoint = buildExportEndpoint('legalDocuments', { dateField: 'createdAt' });
    const req = makeReq({
      url: 'http://internal/api/legalDocuments/export?fields=title,__schemaTypes',
      docs: [{ id: 1, title: 'Terms' }],
    });
    const res = await endpoint.handler(req);
    expect(res.status).toBe(200);
    const text = await res.text();
    expect(text).toContain('Terms');
  });
});
