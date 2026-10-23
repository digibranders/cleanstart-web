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

describe('runPublishChecks: videos', () => {
  const readyVideo = {
    ...validBase,
    format: 'explainer',
    topics: [4],
    summary: 'What the scanner reports and how to read it.',
    durationLabel: '4:12',
  };
  const find = (data: Record<string, unknown>, id: string) =>
    runPublishChecks(data, 'videos').find((c) => c.id === id);

  it('passes every video check for a complete video', () => {
    const failing = runPublishChecks(readyVideo, 'videos').filter(
      (c) => !c.pass && c.id.startsWith('video-'),
    );
    expect(failing).toEqual([]);
  });

  it.each([
    ['video-format', { format: undefined }],
    ['video-topics', { topics: [] }],
    ['video-summary', { summary: '   ' }],
  ])('blocks publishing without %s', (id, patch) => {
    const check = find({ ...readyVideo, ...patch }, id);
    expect(check?.severity).toBe('blocker');
    expect(check?.pass).toBe(false);
  });

  it('only warns when the duration is unknown', () => {
    const check = find({ ...readyVideo, durationLabel: undefined }, 'video-duration');
    expect(check?.severity).toBe('warn');
    expect(check?.pass).toBe(false);
  });

  it('accepts a duration that came from the source', () => {
    const check = find(
      { ...readyVideo, durationLabel: undefined, source: { durationSeconds: 252 } },
      'video-duration',
    );
    expect(check?.pass).toBe(true);
  });

  it('adds no video checks to other collections', () => {
    const ids = runPublishChecks(validBase, 'blogs').map((c) => c.id);
    expect(ids.some((id) => id.startsWith('video-'))).toBe(false);
  });

  it('rejects a publish that is missing a format', () => {
    expect(() =>
      runHook({ ...readyVideo, format: undefined, _status: 'published' }, 'videos'),
    ).toThrow(ValidationError);
  });
});
