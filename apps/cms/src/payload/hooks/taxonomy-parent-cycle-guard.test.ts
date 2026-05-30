import { ValidationError } from 'payload';
import { describe, expect, it, vi } from 'vitest';

import { taxonomyParentCycleGuardHook } from './taxonomy-parent-cycle-guard';

type Row = { id: number; parent?: number | null };

const expectValidationError = async (
  promise: Promise<unknown>,
  matcher: RegExp,
  expectedPath = 'parent',
): Promise<void> => {
  await expect(promise).rejects.toBeInstanceOf(ValidationError);
  const error = await promise.then(
    () => null,
    (caught: unknown) => caught,
  );
  const errors = (error as ValidationError).data?.errors ?? [];
  expect(errors.some((e) => e.path === expectedPath && matcher.test(e.message))).toBe(true);
};

const run = (
  collection: 'categories' | 'newsCategories' | 'knowledgeCategories',
  data: Record<string, unknown>,
  originalDoc: Record<string, unknown>,
  rows: Row[],
) => {
  const byId = new Map(rows.map((r) => [r.id, r]));
  const findByID = vi.fn(async ({ id }: { id: number }) => byId.get(id) ?? null);
  const hook = taxonomyParentCycleGuardHook(collection);
  return hook({
    data,
    originalDoc,
    req: { payload: { findByID } },
    operation: 'update',
  } as unknown as Parameters<ReturnType<typeof taxonomyParentCycleGuardHook>>[0]);
};

describe('taxonomyParentCycleGuardHook', () => {
  it('returns data unchanged when parent is unset', async () => {
    const out = await run('categories', { parent: null }, { id: 1 }, []);
    expect(out).toEqual({ parent: null });
  });

  it('returns data unchanged when there is no originalDoc id (create with no parent)', async () => {
    const out = await run('categories', { parent: null }, {}, []);
    expect(out).toEqual({ parent: null });
  });

  it('rejects a row picking itself as parent', async () => {
    await expectValidationError(
      run('categories', { parent: 1 }, { id: 1 }, []),
      /cannot be its own parent/,
    );
  });

  it('rejects an indirect 3-step cycle', async () => {
    await expectValidationError(
      run('newsCategories', { parent: 2 }, { id: 1 }, [
        { id: 2, parent: 3 },
        { id: 3, parent: 1 },
      ]),
      /cycle/,
    );
  });

  it('allows a valid 3-deep nesting', async () => {
    const out = await run('knowledgeCategories', { parent: 2 }, { id: 1 }, [
      { id: 2, parent: 3 },
      { id: 3, parent: null },
    ]);
    expect(out).toEqual({ parent: 2 });
  });

  it('rejects runaway chains exceeding MAX_DEPTH', async () => {
    const rows: Row[] = [];
    for (let i = 2; i <= 25; i++) {
      rows.push({ id: i, parent: i === 25 ? null : i + 1 });
    }
    await expectValidationError(
      run('categories', { parent: 2 }, { id: 1 }, rows),
      /exceeds maximum depth/,
    );
  });

  it('surfaces the rejection as a field-level ValidationError on `parent`', async () => {
    await expectValidationError(
      run('newsCategories', { parent: 1 }, { id: 1 }, []),
      /cannot be its own parent/,
      'parent',
    );
  });
});
