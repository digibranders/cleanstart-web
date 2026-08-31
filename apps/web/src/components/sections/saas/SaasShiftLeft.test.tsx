import { existsSync, readFileSync } from 'node:fs';
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
    const headingMarkup = html.match(/<h2[^>]*>([\s\S]*?)<\/h2>/)?.[1] ?? '';
    const paragraphMarkup = html.match(/<p[^>]*>([\s\S]*?)<\/p>/)?.[1] ?? '';

    expect(toText(headingMarkup)).toBe('Move Beyond Shift Left');
    expect(toText(paragraphMarkup)).toBe(
      'Modern applications require security to be built into the software components developers use, not added after applications are created.',
    );
  });

  it('replaces the two-lane release gate with desktop and mobile cleanroom reactors', () => {
    const html = renderSection();

    expect(html).toContain('data-cleanroom-reactor="desktop"');
    expect(html).toContain('data-cleanroom-reactor="mobile"');
    expect(html).not.toContain('data-release-gate=');
    expect(html).not.toContain('data-release-path=');
  });

  it('places every application stage inside one reactor chamber', () => {
    const html = renderSection();

    expect(html).toContain('data-reactor-chamber="application"');
    expect(html).toMatch(
      /data-reactor-layer="code"[\s\S]*data-reactor-layer="build"[\s\S]*data-reactor-layer="test"[\s\S]*data-reactor-layer="deploy"/,
    );
  });

  it('makes verified components the source, security review the perimeter, and late review external', () => {
    const html = renderSection();

    expect(html).toContain('data-reactor-source="verified-components"');
    expect(html).toContain('data-security-review="perimeter"');
    expect(html).toContain('data-late-artifact="rejected"');
    // The refused artifact is named, not just drawn — without a label it read
    // as a stray fragment. Both breakpoints must carry it.
    expect(html.match(/Unverified Components/g)?.length).toBe(2);
  });

  it('delivers mobile as cards rather than a scaled copy of the desktop scene', () => {
    const html = renderSection();
    const mobile = html.slice(html.indexOf('data-cleanroom-reactor="mobile"'));

    // Mobile used to be the desktop reactor in a 360x880 viewBox, which renders
    // taller than a phone viewport. It must not go back to being a scaled scene.
    expect(mobile).not.toContain('viewBox="0 0 360');

    // Two runs, each ending at its own gate.
    expect(mobile.match(/Security Review/g)?.length).toBe(2);

    // Identical middles: both runs carry the same four stages, so the only
    // difference the reader sees is the head and the verdict.
    for (const stage of ['Code', 'Build', 'Test', 'Deploy']) {
      expect(mobile.match(new RegExp(`>${stage}<`, 'g'))?.length).toBe(2);
    }
  });

  it('keeps both visuals decorative and exposes one accessible process description', () => {
    const html = renderSection();

    expect(html).toMatch(/data-cleanroom-reactor="desktop"[^>]*aria-hidden="true"/);
    expect(html).toMatch(/data-cleanroom-reactor="mobile"[^>]*aria-hidden="true"/);
    expect(
      html.match(/aria-label="Verified Components, Code, Build, Test, Deploy, Security Review"/g),
    ).toHaveLength(1);
    expect(html).toContain('preserveAspectRatio="xMidYMid meet"');
    expect(html).not.toMatch(/preserveAspectRatio=.none./);
  });

  it('provides a complete reduced-motion state for the reactor', () => {
    const stylesheetPath = new URL('./SaasCleanroomReactor.module.css', import.meta.url);
    const stylesheet = existsSync(stylesheetPath) ? readFileSync(stylesheetPath, 'utf8') : '';

    expect(stylesheet).toContain('@media (prefers-reduced-motion: reduce)');
    expect(stylesheet).toMatch(/\.sourcePulse[\s\S]*animation: none !important/);
    expect(stylesheet).toMatch(/\.layerPlate[\s\S]*opacity: 1 !important/);
    expect(stylesheet).toMatch(/\.scanBeam[\s\S]*opacity: 0 !important/);
  });
});
