import { describe, expect, it } from 'vitest';

import { schemaHistoryFieldHook } from './record-schema-history';

const ctx = 'https://schema.org';
const article = (h: string) => ({ '@context': ctx, '@type': 'Article', headline: h });

// Minimal Payload FieldHook arg shim — only the fields the hook reads.
const run = (args: {
  siblingData?: Record<string, unknown>;
  previousSiblingDoc?: Record<string, unknown>;
  email?: string | null;
}) =>
  (schemaHistoryFieldHook as unknown as (a: unknown) => unknown)({
    siblingData: args.siblingData ?? {},
    previousSiblingDoc: args.previousSiblingDoc,
    req: { user: args.email === undefined ? null : { email: args.email } },
  }) as Array<{ type: string; action: string; by: string | null }>;

describe('schemaHistoryFieldHook', () => {
  it('records an added @type with the editor email', () => {
    const out = run({
      siblingData: { additionalSchema: article('a') },
      previousSiblingDoc: { additionalSchema: null, schemaHistory: [] },
      email: 'me@x.com',
    });
    expect(out).toHaveLength(1);
    expect(out[0]).toMatchObject({ type: 'Article', action: 'added', by: 'me@x.com' });
  });

  it('records a changed @type and prepends to existing history', () => {
    const existing = [{ at: 't0', by: null, type: 'Article', action: 'added', json: 'x' }];
    const out = run({
      siblingData: { additionalSchema: article('b') },
      previousSiblingDoc: { additionalSchema: article('a'), schemaHistory: existing },
    });
    expect(out[0]).toMatchObject({ type: 'Article', action: 'changed' });
    expect(out[out.length - 1]).toMatchObject({ at: 't0' }); // existing kept, newest-first
  });

  it('returns existing history unchanged when the override did not change', () => {
    const existing = [{ at: 't0', by: null, type: 'Article', action: 'added', json: 'x' }];
    const out = run({
      siblingData: { additionalSchema: article('a') },
      previousSiblingDoc: { additionalSchema: article('a'), schemaHistory: existing },
    });
    expect(out).toEqual(existing);
  });

  it('rebuilds from previousSiblingDoc.schemaHistory, ignoring any tampered incoming value', () => {
    const out = run({
      siblingData: { additionalSchema: article('a'), schemaHistory: [{ at: 'FAKE' }] },
      previousSiblingDoc: { additionalSchema: null, schemaHistory: [] },
    });
    // Only the legitimately-diffed "added" entry — the injected FAKE is dropped.
    expect(out).toHaveLength(1);
    expect(out[0]?.type).toBe('Article');
  });
});
