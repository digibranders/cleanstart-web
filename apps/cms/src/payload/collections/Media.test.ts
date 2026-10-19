import { ValidationError } from 'payload';
import { describe, expect, it } from 'vitest';

import { Media, rejectFilenameRename } from './Media';

const callHook = (args: Parameters<typeof rejectFilenameRename>[0]) =>
  (rejectFilenameRename as (a: typeof args) => unknown)(args);

const baseArgs = {
  collection: { slug: 'media' } as never,
  context: {} as never,
  global: null,
} as const;

describe('rejectFilenameRename', () => {
  it('passes through on create', () => {
    expect(() =>
      callHook({
        ...baseArgs,
        operation: 'create',
        data: { filename: 'new.webp' },
        req: { file: { data: Buffer.alloc(0), mimetype: 'image/webp', size: 0, name: 'new.webp' } } as never,
        originalDoc: undefined,
      } as never),
    ).not.toThrow();
  });

  it('passes through on update when a new file is attached (true re-upload)', () => {
    expect(() =>
      callHook({
        ...baseArgs,
        operation: 'update',
        data: { filename: 'renamed.webp' },
        req: { file: { data: Buffer.alloc(0), mimetype: 'image/webp', size: 0, name: 'renamed.webp' } } as never,
        originalDoc: { filename: 'original.webp' },
      } as never),
    ).not.toThrow();
  });

  it('passes through when filename is unchanged on metadata-only update', () => {
    expect(() =>
      callHook({
        ...baseArgs,
        operation: 'update',
        data: { filename: 'same.webp', alt: 'updated alt' },
        req: {} as never,
        originalDoc: { filename: 'same.webp' },
      } as never),
    ).not.toThrow();
  });

  it('throws ValidationError on filename path when filename is changed without a new file (the drift case)', () => {
    let caught: unknown;
    try {
      callHook({
        ...baseArgs,
        operation: 'update',
        data: { filename: 'gaurav-jadhav.webp' },
        req: {} as never,
        originalDoc: { filename: 'gaurav-jadhav-profile (1).webp' },
      } as never);
    } catch (err) {
      caught = err;
    }
    expect(caught).toBeInstanceOf(ValidationError);
    const errors = (caught as { data?: { errors?: { path?: string; message?: string }[] } }).data?.errors;
    expect(errors?.[0]?.path).toBe('filename');
    expect(errors?.[0]?.message).toMatch(/rename is not supported/i);
  });
});

describe('Media access', () => {
  const run = (fn: unknown, roles: string[]): unknown =>
    (fn as (a: { req: { user: unknown } }) => unknown)({ req: { user: { id: 1, roles } } });

  it('lets events upload and edit its own folders but never delete', () => {
    expect(run(Media.access?.create, ['events'])).toBe(true);
    expect(run(Media.access?.update, ['events'])).toEqual({
      folder: { in: ['web/event', 'web/webinar'] },
    });
    expect(run(Media.access?.delete, ['events'])).toBe(false);
  });

  it('still denies upload to other departmental roles', () => {
    expect(run(Media.access?.create, ['hr'])).toBe(false);
    expect(run(Media.access?.create, ['legal'])).toBe(false);
  });
});
