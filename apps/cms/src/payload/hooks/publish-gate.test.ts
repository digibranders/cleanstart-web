import { ValidationError } from 'payload';
import { describe, expect, it } from 'vitest';

import { publishGateHook, runPublishChecks } from './publish-gate';

const validBase = {
  slug: 'a-valid-slug',
  seo: {
    title: 'A reasonable SEO title that is in the recommended range',
    description:
      'A reasonable meta description that lands in the 120 to 160 character range so the publish gate is satisfied for the test.',
  },
};

const runHook = (data: Record<string, unknown>, slug = 'blogs') => {
  const hook = publishGateHook(slug);
  return hook({
    data,
    originalDoc: {},
    req: {} as never,
    operation: 'update' as const,
    collection: { slug } as never,
    context: {} as never,
  } as never);
};

describe('runPublishChecks — SEO char-length warnings', () => {
  it('marks a short SEO title as warn, not blocker', () => {
    const checks = runPublishChecks(
      { ...validBase, seo: { ...validBase.seo, title: 'short' } },
      'blogs',
    );
    const title = checks.find((c) => c.id === 'seo-title');
    expect(title?.severity).toBe('warn');
    expect(title?.pass).toBe(false);
  });

  it('marks a long meta description as warn, not blocker', () => {
    const longDesc = 'x'.repeat(300);
    const checks = runPublishChecks(
      { ...validBase, seo: { ...validBase.seo, description: longDesc } },
      'blogs',
    );
    const desc = checks.find((c) => c.id === 'meta-description');
    expect(desc?.severity).toBe('warn');
    expect(desc?.pass).toBe(false);
  });

  it('keeps slug as a blocker', () => {
    const checks = runPublishChecks({ ...validBase, slug: 'has spaces' }, 'blogs');
    const slug = checks.find((c) => c.id === 'slug');
    expect(slug?.severity).toBe('blocker');
    expect(slug?.pass).toBe(false);
  });
});

describe('publishGateHook — allows SEO char-length issues through', () => {
  it('does not throw when SEO title is short', () => {
    const data = {
      ...validBase,
      _status: 'published',
      seo: { ...validBase.seo, title: 'short' },
    };
    expect(() => runHook(data)).not.toThrow();
  });

  it('does not throw when meta description is too long', () => {
    const data = {
      ...validBase,
      _status: 'published',
      seo: { ...validBase.seo, description: 'x'.repeat(300) },
    };
    expect(() => runHook(data)).not.toThrow();
  });

  it('still throws when slug contains spaces', () => {
    const data = { ...validBase, _status: 'published', slug: 'has spaces' };
    expect(() => runHook(data)).toThrow(ValidationError);
  });

  it('passes cleanly when everything is in range', () => {
    const data = { ...validBase, _status: 'published' };
    expect(() => runHook(data)).not.toThrow();
  });

  it('skips checks entirely for draft saves', () => {
    const data = { ...validBase, _status: 'draft', slug: 'has spaces' };
    expect(() => runHook(data)).not.toThrow();
  });
});
