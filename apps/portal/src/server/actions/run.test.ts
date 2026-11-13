import * as Sentry from '@sentry/nextjs';
import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import type { Viewer } from '@/server/auth/types';
import { requireActionViewer } from '@/server/auth/viewer';
import { ConflictError, UnauthenticatedError } from '@/server/errors';
import { runPublicAction, runViewerAction } from './run';

vi.mock('@sentry/nextjs', () => ({ captureException: vi.fn() }));
vi.mock('@/server/log', () => ({ log: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() } }));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
vi.mock('next/headers', () => ({ headers: vi.fn() }));
vi.mock('@/server/auth/viewer', () => ({ requireActionViewer: vi.fn() }));

const staff: Viewer = {
  id: '00000000-0000-4000-8000-000000000001',
  kind: 'staff',
  role: 'partner_manager',
  partnerId: null,
  partnerName: null,
  region: 'all',
  email: 'farhan@cleanstart.com',
  name: 'Farhan Qureshi',
};

const schema = z.object({ id: z.string().uuid() });
const spec = { name: 'test.action', schema };
const goodInput = { id: '00000000-0000-4000-8000-0000000000aa' };

describe('runViewerAction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requireActionViewer).mockResolvedValue(staff);
  });

  it('returns validation issues and never calls the handler or loads the viewer for bad input', async () => {
    const handler = vi.fn();
    const result = await runViewerAction(spec, { id: 'nope' }, handler);
    expect(result).toMatchObject({ ok: false, error: { code: 'validation', issues: [{ path: 'id' }] } });
    expect(handler).not.toHaveBeenCalled();
    expect(requireActionViewer).not.toHaveBeenCalled();
  });

  it('maps a missing session to unauthenticated', async () => {
    vi.mocked(requireActionViewer).mockRejectedValue(new UnauthenticatedError());
    const result = await runViewerAction(spec, goodInput, vi.fn());
    expect(result).toEqual({ ok: false, error: { code: 'unauthenticated', message: 'Sign in to continue.' } });
  });

  it('passes the viewer, a clock and the parsed input to the handler and returns its data', async () => {
    const result = await runViewerAction(spec, goodInput, async (ctx, input) => ({ who: ctx.viewer.name, today: ctx.clock.today().length, id: input.id }));
    expect(result).toEqual({ ok: true, data: { who: 'Farhan Qureshi', today: 10, id: goodInput.id } });
  });

  it('runs after commit effects only once the handler has returned, in order', async () => {
    const order: string[] = [];
    await runViewerAction(spec, goodInput, async (ctx) => {
      ctx.afterCommit(async () => void order.push('email'));
      ctx.revalidate('/admin/approvals');
      order.push('handler done');
    });
    expect(order).toEqual(['handler done', 'email']);
    expect(revalidatePath).toHaveBeenCalledWith('/admin/approvals');
  });

  it('does not run effects when the handler throws', async () => {
    const effect = vi.fn();
    const result = await runViewerAction(spec, goodInput, async (ctx) => {
      ctx.afterCommit(effect);
      throw new ConflictError('already_decided', 'Already decided.');
    });
    expect(result).toEqual({ ok: false, error: { code: 'conflict', message: 'Already decided.' } });
    expect(effect).not.toHaveBeenCalled();
    expect(Sentry.captureException).not.toHaveBeenCalled();
  });

  it('logs a failing effect to Sentry and still returns success', async () => {
    const failure = new Error('smtp down');
    const result = await runViewerAction(spec, goodInput, async (ctx) => {
      ctx.afterCommit(async () => {
        throw failure;
      });
      return 'saved';
    });
    expect(result).toEqual({ ok: true, data: 'saved' });
    expect(Sentry.captureException).toHaveBeenCalledWith(failure, { tags: { action: 'test.action', phase: 'after_commit' } });
  });

  it('turns an unexpected error into a generic internal failure and reports it', async () => {
    const failure = new Error('relation "x" does not exist');
    const result = await runViewerAction(spec, goodInput, async () => {
      throw failure;
    });
    expect(result).toEqual({ ok: false, error: { code: 'internal', message: 'Something went wrong on our side. Try again.' } });
    expect(Sentry.captureException).toHaveBeenCalledWith(failure, { tags: { action: 'test.action' } });
  });
});

describe('runPublicAction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('reads the first address of x-forwarded-for', async () => {
    vi.mocked(headers).mockResolvedValue(new Headers({ 'x-forwarded-for': '203.0.113.9, 10.0.0.1' }) as never);
    const result = await runPublicAction(spec, goodInput, async (ctx) => ctx.ip);
    expect(result).toEqual({ ok: true, data: '203.0.113.9' });
  });

  it('gives a null ip when the header is absent and never loads a viewer', async () => {
    vi.mocked(headers).mockResolvedValue(new Headers() as never);
    const result = await runPublicAction(spec, goodInput, async (ctx) => ctx.ip);
    expect(result).toEqual({ ok: true, data: null });
    expect(requireActionViewer).not.toHaveBeenCalled();
  });

  it('returns validation issues for bad input', async () => {
    const result = await runPublicAction(spec, {}, vi.fn());
    expect(result).toMatchObject({ ok: false, error: { code: 'validation' } });
  });
});
