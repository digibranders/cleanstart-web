import { describe, expect, it, vi } from 'vitest';

import { formSchemaVersionHook } from './form-schema-version';

const makeReq = (totalDocs: number) =>
  ({
    payload: {
      count: vi.fn().mockResolvedValue({ totalDocs }),
    },
  }) as unknown as Parameters<typeof formSchemaVersionHook>[0]['req'];

const callHook = async (
  data: Record<string, unknown>,
  originalDoc: Record<string, unknown> | undefined,
  totalDocs: number,
) =>
  formSchemaVersionHook({
    data,
    originalDoc,
    req: makeReq(totalDocs),
    operation: 'update',
    collection: { slug: 'forms' } as never,
    context: {} as never,
  } as never);

describe('formSchemaVersionHook', () => {
  it('is a no-op on the first save (no originalDoc)', async () => {
    const result = await callHook({ fields: [{ name: 'a', type: 'text' }] }, undefined, 0);
    expect(result).toEqual({ fields: [{ name: 'a', type: 'text' }] });
  });

  it('does not bump when fields[] is structurally unchanged', async () => {
    const fields = [{ name: 'a', type: 'text' }];
    const result = (await callHook(
      { fields, schemaVersion: 1 },
      { id: 1, fields, schemaVersion: 1 },
      10,
    )) as { schemaVersion: number };
    expect(result.schemaVersion).toBe(1);
  });

  it('does not bump when fields changed but the form has zero submissions', async () => {
    const result = (await callHook(
      { fields: [{ name: 'a', type: 'text' }, { name: 'b', type: 'email' }], schemaVersion: 1 },
      { id: 1, fields: [{ name: 'a', type: 'text' }], schemaVersion: 1 },
      0,
    )) as { schemaVersion: number };
    expect(result.schemaVersion).toBe(1);
  });

  it('bumps when fields shape changed AND there is at least one submission', async () => {
    const result = (await callHook(
      { fields: [{ name: 'a', type: 'text' }, { name: 'b', type: 'email' }], schemaVersion: 1 },
      { id: 1, fields: [{ name: 'a', type: 'text' }], schemaVersion: 1 },
      5,
    )) as { schemaVersion: number };
    expect(result.schemaVersion).toBe(2);
  });

  it('treats field rename as a shape change', async () => {
    const result = (await callHook(
      { fields: [{ name: 'renamed', type: 'text' }], schemaVersion: 1 },
      { id: 1, fields: [{ name: 'a', type: 'text' }], schemaVersion: 1 },
      1,
    )) as { schemaVersion: number };
    expect(result.schemaVersion).toBe(2);
  });

  it('treats field type change as a shape change', async () => {
    const result = (await callHook(
      { fields: [{ name: 'a', type: 'email' }], schemaVersion: 1 },
      { id: 1, fields: [{ name: 'a', type: 'text' }], schemaVersion: 1 },
      1,
    )) as { schemaVersion: number };
    expect(result.schemaVersion).toBe(2);
  });

  it('does NOT treat validation-rule change as a shape change (lead keys still mean the same thing)', async () => {
    const result = (await callHook(
      {
        fields: [
          { name: 'a', type: 'text', validation: { minLength: 5 } },
        ],
        schemaVersion: 3,
      },
      {
        id: 1,
        fields: [{ name: 'a', type: 'text' }],
        schemaVersion: 3,
      },
      1,
    )) as { schemaVersion: number };
    expect(result.schemaVersion).toBe(3);
  });
});
