import { createServer, type Server, type ServerResponse } from 'node:http';
import type { AddressInfo } from 'node:net';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { IntegrationError } from '@/server/errors';
import { listPublicDatasheets, PUBLIC_RESOURCES_REVALIDATE_SECONDS, PUBLIC_SITE_URL } from './public-resources';

let server: Server;
let baseUrl = '';
let requests: string[] = [];
let respond: (res: ServerResponse) => void = (res) => res.end('{}');

beforeAll(async () => {
  server = createServer((req, res) => {
    requests.push(req.url ?? '');
    respond(res);
  });
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});

afterAll(async () => {
  server.closeAllConnections();
  await new Promise<void>((resolve) => server.close(() => resolve()));
});

beforeEach(() => {
  requests = [];
});

const json =
  (body: unknown, status = 200) =>
  (res: ServerResponse): void => {
    res.statusCode = status;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify(body));
  };

describe('listPublicDatasheets', () => {
  it('asks the CMS for published datasheets with the website field list, and never for asset or body', async () => {
    respond = json({ docs: [] });
    await listPublicDatasheets({ baseUrl });
    const url = new URL(requests[0] ?? '', baseUrl);
    expect(url.pathname).toBe('/api/resources');
    const params = url.searchParams;
    expect(params.get('where[_status][equals]')).toBe('published');
    expect(params.get('where[publishedAt][exists]')).toBe('true');
    expect(params.get('where[or][0][typeRef.slug][equals]')).toBe('datasheet');
    expect(params.get('where[or][1][type][equals]')).toBe('datasheet');
    expect(params.get('depth')).toBe('0');
    expect(params.get('limit')).toBe('100');
    expect(params.get('sort')).toBe('-publishedAt');
    expect([...params.keys()].filter((key) => key.startsWith('select['))).toEqual([
      'select[title]',
      'select[slug]',
      'select[summary]',
      'select[publishedAt]',
      'select[updatedAt]',
      'select[gated]',
    ]);
  });

  it('maps rows to public page links and drops gated, malformed and untitled rows', async () => {
    respond = json({
      docs: [
        { id: 7, title: 'CleanStart Images datasheet', slug: 'cleanstart-images-datasheet', summary: 'Catalogue', updatedAt: '2026-10-14T00:00:00.000Z', gated: false },
        { id: 'abc', title: 'No summary', slug: 'no summary', gated: null },
        { id: 9, title: 'Gated sheet', slug: 'gated-sheet', gated: true },
        { id: 10, title: '', slug: 'empty-title' },
        { id: 11, slug: 'missing-title' },
        'garbage',
      ],
    });
    expect(await listPublicDatasheets({ baseUrl })).toEqual([
      {
        id: '7',
        title: 'CleanStart Images datasheet',
        summary: 'Catalogue',
        url: `${PUBLIC_SITE_URL}/resources/cleanstart-images-datasheet`,
        updatedAt: '2026-10-14T00:00:00.000Z',
      },
      { id: 'abc', title: 'No summary', summary: null, url: `${PUBLIC_SITE_URL}/resources/no%20summary`, updatedAt: null },
    ]);
  });

  it('returns an empty list when the CMS has none, and accepts a trailing slash on the base URL', async () => {
    respond = json({ docs: [] });
    expect(await listPublicDatasheets({ baseUrl: `${baseUrl}/` })).toEqual([]);
    expect(requests[0]?.startsWith('/api/resources?')).toBe(true);
  });

  it('throws IntegrationError carrying the upstream status on a non 2xx answer', async () => {
    respond = json({ errors: [] }, 503);
    await expect(listPublicDatasheets({ baseUrl })).rejects.toMatchObject({ service: 'cms', upstreamStatus: 503 });
  });

  it('throws IntegrationError for a body that is not the expected JSON', async () => {
    respond = (res) => res.end('<html>maintenance</html>');
    await expect(listPublicDatasheets({ baseUrl })).rejects.toBeInstanceOf(IntegrationError);
    respond = json({ docs: 'nope' });
    await expect(listPublicDatasheets({ baseUrl })).rejects.toBeInstanceOf(IntegrationError);
  });

  it('throws IntegrationError when the CMS cannot be reached', async () => {
    await expect(listPublicDatasheets({ baseUrl: 'http://127.0.0.1:1' })).rejects.toBeInstanceOf(IntegrationError);
  });

  it('asks Next to cache the answer for 10 minutes and sends no credential', async () => {
    const spy = vi.fn(async () => new Response(JSON.stringify({ docs: [] }), { status: 200 }));
    await listPublicDatasheets({ baseUrl: 'http://cms.test', fetchImpl: spy as unknown as typeof fetch });
    const [url, init] = spy.mock.calls[0] as unknown as [string, RequestInit & { next?: { revalidate: number } }];
    expect(url.startsWith('http://cms.test/api/resources?')).toBe(true);
    expect(init.next).toEqual({ revalidate: PUBLIC_RESOURCES_REVALIDATE_SECONDS });
    expect(PUBLIC_RESOURCES_REVALIDATE_SECONDS).toBe(600);
    expect(init.headers).toEqual({ accept: 'application/json' });
    expect(init.signal).toBeInstanceOf(AbortSignal);
  });
});


describe('listPublicDatasheets in demo mode', () => {
  it('lists none and makes no request, so the demo never calls a CMS', async () => {
    vi.stubEnv('PORTAL_DEMO_MODE', '1');
    const fetchImpl = vi.fn();
    try {
      expect(await listPublicDatasheets({ baseUrl, fetchImpl })).toEqual([]);
      expect(fetchImpl).not.toHaveBeenCalled();
    } finally {
      vi.unstubAllEnvs();
    }
  });
});
