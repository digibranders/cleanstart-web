import type { Pool, PoolClient } from 'pg';
import { describe, expect, it, vi } from 'vitest';
import { testPool } from '@/db/test-helpers';
import { runLocked } from './lock';

const pool = testPool();

describe('runLocked', () => {
  it('runs the job and reports true', async () => {
    const fn = vi.fn().mockResolvedValue(undefined);
    expect(await runLocked(pool, 'demo', fn)).toBe(true);
    expect(fn).toHaveBeenCalledOnce();
  });

  it('skips the job while another connection holds the lock', async () => {
    const holder = await pool.connect();
    await holder.query("select pg_advisory_lock(hashtext('portal:demo'))");
    const fn = vi.fn();
    expect(await runLocked(pool, 'demo', fn)).toBe(false);
    expect(fn).not.toHaveBeenCalled();
    await holder.query("select pg_advisory_unlock(hashtext('portal:demo'))");
    holder.release();
    expect(await runLocked(pool, 'demo', vi.fn().mockResolvedValue(undefined))).toBe(true);
  });

  it('releases the lock when the job throws', async () => {
    await expect(runLocked(pool, 'demo', () => Promise.reject(new Error('boom')))).rejects.toThrow('boom');
    expect(await runLocked(pool, 'demo', vi.fn().mockResolvedValue(undefined))).toBe(true);
  });

  it('lets two different jobs run at the same time', async () => {
    let inner = false;
    const outer = await runLocked(pool, 'outer', async () => {
      inner = await runLocked(pool, 'inner', async () => undefined);
    });
    expect(outer).toBe(true);
    expect(inner).toBe(true);
  });

  it('destroys the connection when the unlock query fails', async () => {
    const failure = new Error('connection lost');
    const query = vi.fn().mockResolvedValueOnce({ rows: [{ ok: true }] }).mockRejectedValueOnce(failure);
    const release = vi.fn();
    const fake = { connect: vi.fn().mockResolvedValue({ query, release } as unknown as PoolClient) } as unknown as Pool;
    await expect(runLocked(fake, 'demo', vi.fn().mockResolvedValue(undefined))).rejects.toThrow('connection lost');
    expect(release).toHaveBeenCalledWith(failure);
  });

  it('returns the connection normally after a clean run', async () => {
    const query = vi.fn().mockResolvedValue({ rows: [{ ok: true }] });
    const release = vi.fn();
    const fake = { connect: vi.fn().mockResolvedValue({ query, release } as unknown as PoolClient) } as unknown as Pool;
    await runLocked(fake, 'demo', vi.fn().mockResolvedValue(undefined));
    expect(release).toHaveBeenCalledWith(undefined);
  });
});
