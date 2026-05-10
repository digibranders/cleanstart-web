import { describe, expect, it, vi } from 'vitest';

import { schemaOverrideAuditHook } from './schema-override-audit';

const run = (
  collection: string,
  doc: Record<string, unknown>,
  previousDoc: Record<string, unknown> | undefined,
  create: ReturnType<typeof vi.fn>,
  user: { id?: number | string } | null = { id: 5 },
) => {
  const hook = schemaOverrideAuditHook(collection);
  return hook({
    doc,
    previousDoc,
    req: {
      payload: { create },
      user,
      headers: new Headers({ 'user-agent': 'test', 'accept-language': 'en' }),
    },
    operation: 'update',
  } as unknown as Parameters<ReturnType<typeof schemaOverrideAuditHook>>[0]);
};

describe('schemaOverrideAuditHook', () => {
  it('does nothing when seo.additionalSchema is unchanged', async () => {
    const create = vi.fn();
    await run(
      'blogs',
      { id: 1, seo: { additionalSchema: { a: 1 } } },
      { id: 1, seo: { additionalSchema: { a: 1 } } },
      create,
    );
    expect(create).not.toHaveBeenCalled();
  });

  it('records "created" when previous was null', async () => {
    const create = vi.fn().mockResolvedValue({});
    await run(
      'blogs',
      { id: 1, seo: { additionalSchema: { a: 1 } } },
      { id: 1, seo: { additionalSchema: null } },
      create,
    );
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'audit-log',
        overrideAccess: true,
        data: expect.objectContaining({
          action: 'schema_override_changed',
          targetCollection: 'blogs',
          targetId: '1',
          metadata: expect.objectContaining({
            operation: 'created',
            after: { a: 1 },
            before: null,
          }),
        }),
      }),
    );
  });

  it('records "cleared" when next is null', async () => {
    const create = vi.fn().mockResolvedValue({});
    await run(
      'blogs',
      { id: 1, seo: { additionalSchema: null } },
      { id: 1, seo: { additionalSchema: { a: 1 } } },
      create,
    );
    expect(
      (create.mock.calls[0]?.[0] as { data: { metadata: { operation: string } } }).data.metadata.operation,
    ).toBe('cleared');
  });

  it('records "updated" when both sides exist and differ', async () => {
    const create = vi.fn().mockResolvedValue({});
    await run(
      'blogs',
      { id: 1, seo: { additionalSchema: { a: 2 } } },
      { id: 1, seo: { additionalSchema: { a: 1 } } },
      create,
    );
    expect(
      (create.mock.calls[0]?.[0] as { data: { metadata: { operation: string } } }).data.metadata.operation,
    ).toBe('updated');
  });

  it('coerces a string user id to a number', async () => {
    const create = vi.fn().mockResolvedValue({});
    await run(
      'blogs',
      { id: 1, seo: { additionalSchema: { a: 1 } } },
      { id: 1, seo: { additionalSchema: null } },
      create,
      { id: '7' },
    );
    expect((create.mock.calls[0]?.[0] as { data: { actorUserId: unknown } }).data.actorUserId).toBe(7);
  });

  it('sets actorUserId to null when no user (system-driven save)', async () => {
    const create = vi.fn().mockResolvedValue({});
    await run(
      'blogs',
      { id: 1, seo: { additionalSchema: { a: 1 } } },
      { id: 1, seo: { additionalSchema: null } },
      create,
      null,
    );
    expect((create.mock.calls[0]?.[0] as { data: { actorUserId: unknown } }).data.actorUserId).toBeNull();
  });

  it('swallows audit-log write failures (never breaks parent save)', async () => {
    const create = vi.fn().mockRejectedValueOnce(new Error('audit table down'));
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const out = await run(
      'blogs',
      { id: 1, seo: { additionalSchema: { a: 1 } } },
      { id: 1, seo: { additionalSchema: null } },
      create,
    );
    expect(out).toMatchObject({ id: 1 });
    consoleSpy.mockRestore();
  });
});
