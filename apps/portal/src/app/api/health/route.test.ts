import { afterEach, describe, expect, it, vi } from 'vitest';
import { db } from '@/db/client';
import { GET } from './route';

vi.mock('@/server/log', () => ({ log: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() } }));

afterEach(() => vi.restoreAllMocks());

describe('GET /api/health', () => {
  it('answers 200 with status ok when the database responds, and is never cached', async () => {
    const response = await GET();
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ status: 'ok' });
    expect(response.headers.get('cache-control')).toBe('no-store');
  });

  it('answers 503 when the database does not respond, without leaking the error', async () => {
    vi.spyOn(db, 'execute').mockRejectedValueOnce(new Error('connect ECONNREFUSED 10.0.0.5:5432'));
    const response = await GET();
    expect(response.status).toBe(503);
    const body = await response.text();
    expect(body).toBe('{"status":"database_unreachable"}');
    expect(body).not.toContain('10.0.0.5');
  });
});
