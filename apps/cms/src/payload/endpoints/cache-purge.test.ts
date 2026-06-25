import { describe, expect, it } from 'vitest';

import { resolvePurge } from './cache-purge';

const editor = { roles: ['editor'] };
const admin = { roles: ['admin'] };

describe('resolvePurge', () => {
  it('rejects anonymous users', () => {
    expect(resolvePurge(null, { scope: 'page', collection: 'news', id: '1' }).status).toBe(401);
  });

  it('page: editor allowed, resolves listing + detail (with slug marker)', () => {
    const r = resolvePurge(editor, { scope: 'page', collection: 'news', id: '1' });
    expect(r.status).toBe(200);
    expect(r.request).toEqual({ paths: ['/news', '/news/$SLUG$'] });
    expect(r.needsDoc).toEqual({ collection: 'news', id: '1' });
  });

  it('page: unknown collection → 400', () => {
    expect(resolvePurge(editor, { scope: 'page', collection: 'media', id: '1' }).status).toBe(400);
  });

  it('all: editor forbidden, admin allowed', () => {
    expect(resolvePurge(editor, { scope: 'all' }).status).toBe(403);
    const r = resolvePurge(admin, { scope: 'all' });
    expect(r.status).toBe(200);
    expect(r.request).toEqual({ layoutPaths: ['/'] });
  });

  it('custom: admin only, validates paths', () => {
    expect(resolvePurge(editor, { scope: 'custom', paths: ['/news'] }).status).toBe(403);
    expect(resolvePurge(admin, { scope: 'custom', paths: ['bad'] }).status).toBe(400);
    expect(resolvePurge(admin, { scope: 'custom' }).status).toBe(400); // nothing to purge
    const r = resolvePurge(admin, { scope: 'custom', paths: ['/news'], tags: ['nav'] });
    expect(r.status).toBe(200);
    expect(r.request).toEqual({ paths: ['/news'], tags: ['nav'] });
  });
});
