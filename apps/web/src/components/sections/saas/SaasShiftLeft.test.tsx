import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { SaasShiftLeft } from './SaasShiftLeft';

function toText(markup: string): string {
  return markup
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function renderSection(): string {
  return renderToStaticMarkup(<SaasShiftLeft />);
}

describe('SaasShiftLeft', () => {
  it('keeps the supplied heading and supporting paragraph exact', () => {
    const html = renderSection();
    const heading = html.match(/<h2[^>]*>([\s\S]*?)<\/h2>/)?.[1] ?? '';
    const paragraph = html.match(/<p[^>]*>([\s\S]*?)<\/p>/)?.[1] ?? '';

    expect(toText(heading)).toBe('Move Beyond Shift Left');
    expect(toText(paragraph)).toBe(
      'Modern applications require security to be built into the software components developers use, not added after applications are created.',
    );
  });

  it('exposes the pipeline to assistive tech as an ordered list, source first', () => {
    const html = renderSection();
    const list = html.match(/<ol[^>]*class="sr-only"[^>]*>([\s\S]*?)<\/ol>/)?.[1] ?? '';
    const items = [...list.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/g)].map((m) => toText(m[1] ?? ''));

    expect(items).toEqual([
      'Verified Components',
      'Code',
      'Build',
      'Test',
      'Deploy',
      'Security Review',
      'Trusted Release',
    ]);
  });

  it('renders one decorative scene per orientation, in pipeline order', () => {
    const html = renderSection();
    const openTags = [...html.matchAll(/<svg[^>]*data-scene="(horizontal|vertical)"[^>]*>/g)];
    expect(openTags.map((m) => m[1])).toEqual(['horizontal', 'vertical']);
    for (const tag of openTags) {
      expect(tag[0]).toContain('aria-hidden="true"');
    }

    for (const scene of html.split('data-scene=').slice(1)) {
      const order = [...scene.matchAll(/data-stage="([a-z]+)"/g)].map((m) => m[1]);
      expect(order).toEqual(['code', 'build', 'test', 'deploy', 'review', 'release']);
    }
  });

  it('server-renders the settled state so the diagram reads without JS', () => {
    const html = renderSection();
    const phases = [...html.matchAll(/data-phase="([a-z]+)"/g)].map((m) => m[1]);
    expect(phases).toEqual(['settled', 'settled']);
    expect(html.match(/data-fill="true"/g)).toHaveLength(2);
  });
});
