import { describe, expect, it, vi } from 'vitest';

import { Videos, singleFeaturedHook } from './Videos';

type HookArgs = Parameters<typeof singleFeaturedHook>[0];

const run = async (doc: Record<string, unknown>, others: { id: number }[], context: Record<string, unknown> = {}) => {
  const find = vi.fn().mockResolvedValue({ docs: others });
  const update = vi.fn().mockResolvedValue({});
  const req = { payload: { find, update } };
  await singleFeaturedHook({ doc, req, context } as unknown as HookArgs);
  return { find, update };
};

describe('singleFeaturedHook', () => {
  it('clears the flag on the previous hero when a featured video is published', async () => {
    const { find, update } = await run({ id: 5, featured: true, _status: 'published' }, [{ id: 2 }, { id: 3 }]);
    expect(find).toHaveBeenCalledOnce();
    expect(update.mock.calls.map(([args]) => [args.id, args.data])).toEqual([
      [2, { featured: false }],
      [3, { featured: false }],
    ]);
  });

  it('leaves the live hero alone while the featured video is still a draft', async () => {
    const { find, update } = await run({ id: 5, featured: true, _status: 'draft' }, [{ id: 2 }]);
    expect(find).not.toHaveBeenCalled();
    expect(update).not.toHaveBeenCalled();
  });

  it('does nothing for a video that is not featured', async () => {
    const { find } = await run({ id: 5, featured: false, _status: 'published' }, [{ id: 2 }]);
    expect(find).not.toHaveBeenCalled();
  });

  it('does not loop on the updates it makes itself', async () => {
    const { find } = await run({ id: 5, featured: true, _status: 'published' }, [{ id: 2 }], { singleFeatured: true });
    expect(find).not.toHaveBeenCalled();
  });
});

describe('Videos collection shape', () => {
  const names = Videos.fields.map((f) => ('name' in f ? f.name : undefined));

  it('has no per-video page parts: no SEO block, no permalink', () => {
    expect(names).not.toContain('seo');
    expect(names).not.toContain('permalink');
  });

  it('keeps the slug but hides it from editors', () => {
    const slug = Videos.fields.find((f) => 'name' in f && f.name === 'slug');
    const admin = (slug && 'admin' in slug ? slug.admin : undefined) as { hidden?: boolean } | undefined;
    expect(admin?.hidden).toBe(true);
  });

  it('offers exactly two categories', () => {
    const format = Videos.fields.find((f) => 'name' in f && f.name === 'format');
    const values = format && 'options' in format ? format.options.map((o) => (typeof o === 'string' ? o : o.value)) : [];
    expect(values).toEqual(['explainer', 'demo']);
  });
});
