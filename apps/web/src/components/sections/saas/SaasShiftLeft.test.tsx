import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { SaasShiftLeft } from './SaasShiftLeft';

/*
 * These assertions are about what the section SAYS and the order it says it in.
 *
 * The previous suite read SaasVerifiedCore.module.css and asserted on rule
 * contents — exact hex values, z-index numbers, gradient strings, whether a
 * selector appeared inside a particular media query. That pinned the diagram's
 * visual implementation in place: every one of those assertions failed on a
 * redesign that changed nothing a user could describe, while none of them would
 * have caught the diagram rendering the wrong stages in the wrong order.
 */

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

  it('exposes the pipeline to assistive tech as an ordered list', () => {
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
    ]);
  });

  it('runs verified components into the pipeline, in order', () => {
    const html = renderSection();

    expect(html).toContain('data-verified-source="verified-components"');
    expect(html).toContain('data-trust-ribbon="continuous"');
    expect(html).toContain('data-security-review="open"');
    expect(html).toContain('data-release-exit="approved"');

    // The source attaches before the first stage, and Security Review closes it.
    expect(html).toMatch(
      /data-verified-source[\s\S]*data-trust-ribbon[\s\S]*data-core-stage="code"[\s\S]*data-core-stage="build"[\s\S]*data-core-stage="test"[\s\S]*data-core-stage="deploy"[\s\S]*data-security-review[\s\S]*data-release-exit/,
    );
  });

  it('renders each stage icon exactly once', () => {
    const html = renderSection();

    // The diagram used to be emitted twice, once for desktop and once for
    // mobile, so every icon existed twice in the DOM. Orientation is now a CSS
    // concern and the tree is rendered once.
    for (const stage of ['code', 'build', 'test', 'deploy', 'review']) {
      expect(html.match(new RegExp(`data-stage-icon="${stage}"`, 'g'))).toHaveLength(1);
    }
  });

  it('keeps the diagram out of the accessibility tree', () => {
    const html = renderSection();
    const diagram = html.slice(html.indexOf('data-verified-source'));

    // The ordered list above is the accessible reading of the pipeline; the
    // tiles are decoration and must not be announced alongside it.
    expect(html).toMatch(/aria-hidden="true"[\s\S]*data-verified-source/);
    expect(diagram).not.toContain('<h3');
  });

  it('drops the retired container shells and legacy nodes', () => {
    const html = renderSection();

    expect(html).not.toContain('data-cleanroom-reactor=');
    expect(html).not.toContain('data-reactor-chamber=');
    expect(html).not.toContain('Unverified Components');
    expect(html).not.toContain('data-verified-core="desktop"');
    expect(html).not.toContain('data-verified-core="mobile"');
    expect(html).not.toContain('data-late-review-path="return"');
    expect(html).not.toContain('data-security-review="closed"');
  });
});
