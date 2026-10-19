import type { Field } from 'payload';
import { describe, expect, it } from 'vitest';

import { Forms } from './Forms';

type FieldAccessFn = (a: { req: { user: unknown } }) => boolean;

const fieldAccess = (name: string): { create?: FieldAccessFn; update?: FieldAccessFn } => {
  const field = (Forms.fields ?? []).find((f: Field) => 'name' in f && f.name === name);
  return (
    (field as { access?: { create?: FieldAccessFn; update?: FieldAccessFn } } | undefined)
      ?.access ?? {}
  );
};

const as = (role: string) => ({ req: { user: { id: 1, roles: [role] } } });

describe('Forms access', () => {
  const run = (fn: unknown, role: string): unknown =>
    (fn as (a: ReturnType<typeof as>) => unknown)(as(role));

  it('lets events read and create but never delete', () => {
    expect(run(Forms.access?.read, 'events')).toBe(true);
    expect(run(Forms.access?.create, 'events')).toBe(true);
    expect(run(Forms.access?.delete, 'events')).toBe(false);
  });

  it('keeps CRM routing and post-submit behaviour out of events reach', () => {
    for (const name of [
      'crmHandlers',
      'notifyTo',
      'hubspotFormGuid',
      'hubspotSubscriptionTypeId',
      'postSubmit',
    ]) {
      const { create, update } = fieldAccess(name);
      expect(create?.(as('events'))).toBe(false);
      expect(update?.(as('events'))).toBe(false);
      expect(create?.(as('editor'))).toBe(true);
      expect(update?.(as('admin'))).toBe(true);
    }
  });
});
