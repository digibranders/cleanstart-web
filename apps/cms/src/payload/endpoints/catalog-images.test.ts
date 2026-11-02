import { describe, expect, it, vi } from 'vitest';

import { resolveCatalogImages } from './catalog-images';

const editor = { roles: ['editor'] };
const deps = (names: string[] | null = ['node', 'redis']) => ({ loadNames: vi.fn(async () => names) });

describe('resolveCatalogImages', () => {
  it('rejects anonymous users and users without an editing role', async () => {
    expect((await resolveCatalogImages(null, deps())).status).toBe(401);
    expect((await resolveCatalogImages({ roles: ['hr'] }, deps())).status).toBe(403);
  });

  it('gives an editor the image names', async () => {
    expect(await resolveCatalogImages(editor, deps())).toEqual({
      status: 200,
      body: { ok: true, available: true, names: ['node', 'redis'] },
    });
  });

  it('says "not available" rather than failing when the catalog cannot be read', async () => {
    expect(await resolveCatalogImages(editor, deps(null))).toEqual({
      status: 200,
      body: { ok: true, available: false, names: [] },
    });
  });
});
