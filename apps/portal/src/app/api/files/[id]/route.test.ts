import { describe, expect, it, vi } from 'vitest';

const state = vi.hoisted(() => ({ viewer: null as unknown, handled: [] as string[] }));
vi.mock('@/server/auth/viewer', () => ({ getViewer: vi.fn(async () => state.viewer) }));
vi.mock('@/server/files/instance', () => ({ getFileStorage: vi.fn(() => ({})) }));
vi.mock('@/server/files/open-route', async (importOriginal) => {
  const original = await importOriginal<typeof import('@/server/files/open-route')>();
  return {
    ...original,
    handleFileOpen: vi.fn(async (id: string) => {
      state.handled.push(id);
      return new Response(null, { status: 302, headers: { Location: 'https://fake-r2.test/get/x' } });
    }),
  };
});

import { GET, HEAD } from './route';

const call = (id: string) => GET(new Request(`http://localhost:3004/api/files/${id}`), { params: Promise.resolve({ id }) });

describe('GET /api/files/[id]', () => {
  it('sends a signed out visitor to sign in and returns to the file afterwards', async () => {
    state.viewer = null;
    const res = await call('abc');
    expect(res.status).toBe(302);
    expect(res.headers.get('Location')).toBe('/sign-in?next=%2Fapi%2Ffiles%2Fabc');
    expect(state.handled).toHaveLength(0);
  });

  it('hands a signed in viewer to the open handler', async () => {
    state.viewer = { id: 'user-1', kind: 'partner', role: 'sales', partnerId: 'p1', partnerName: 'P', email: 'a@b.co', name: 'A' };
    const res = await call('doc-1');
    expect(res.status).toBe(302);
    expect(state.handled).toEqual(['doc-1']);
  });

  it('answers 429 with Retry-After after 60 opens in a minute', async () => {
    state.viewer = { id: 'user-rate', kind: 'partner', role: 'sales', partnerId: 'p1', partnerName: 'P', email: 'a@b.co', name: 'A' };
    for (let n = 0; n < 60; n += 1) expect((await call('doc-1')).status).toBe(302);
    const res = await call('doc-1');
    expect(res.status).toBe(429);
    expect(Number(res.headers.get('Retry-After'))).toBeGreaterThan(0);
  });
  it('answers HEAD with 405 and never reaches the open handler, so a link preview counts nothing', async () => {
    state.viewer = { id: 'user-head', kind: 'partner', role: 'sales', partnerId: 'p1', partnerName: 'P', email: 'a@b.co', name: 'A' };
    state.handled.length = 0;
    const res = await HEAD();
    expect(res.status).toBe(405);
    expect(res.headers.get('Allow')).toBe('GET');
    expect(state.handled).toHaveLength(0);
  });
});
