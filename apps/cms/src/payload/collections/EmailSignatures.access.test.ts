import type { Access } from 'payload';
import { describe, expect, it } from 'vitest';

import { EmailAssets } from './EmailAssets';
import { EmailSignatures } from './EmailSignatures';
import { SignatureTemplates } from './SignatureTemplates';

const allows = (fn: Access | undefined, roles: string[]): boolean =>
  (fn as (args: { req: { user: unknown } }) => boolean)({ req: { user: { id: 1, roles } } });

describe('email-signature collection access', () => {
  it('lets hr create, update and delete signatures alongside admin and editor', () => {
    for (const roles of [['admin'], ['editor'], ['hr']]) {
      expect(allows(EmailSignatures.access?.create, roles)).toBe(true);
      expect(allows(EmailSignatures.access?.update, roles)).toBe(true);
      expect(allows(EmailSignatures.access?.delete, roles)).toBe(true);
    }
  });

  it('keeps signature writes away from other departmental and content roles', () => {
    for (const roles of [['events'], ['author'], ['seo']]) {
      expect(allows(EmailSignatures.access?.create, roles)).toBe(false);
      expect(allows(EmailSignatures.access?.update, roles)).toBe(false);
      expect(allows(EmailSignatures.access?.delete, roles)).toBe(false);
    }
  });

  it('leaves the directory publicly readable', () => {
    expect(EmailSignatures.access?.read?.({ req: { user: null } } as never)).toBe(true);
  });

  it('does not widen the shared markup or asset collections to hr', () => {
    // Templates are raw HTML (privileged paste) and emailAssets is a binary
    // bucket — granting hr the per-person data must not leak into either.
    for (const fn of [SignatureTemplates.access?.update, EmailAssets.access?.update]) {
      expect(allows(fn, ['hr'])).toBe(false);
      expect(allows(fn, ['editor'])).toBe(false);
      expect(allows(fn, ['admin'])).toBe(true);
    }
  });
});
